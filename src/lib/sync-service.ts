/**
 * Automated Sync Service for iList Integration
 * Handles scheduled and manual synchronization
 */

import { createIListClient, IListProperty } from './ilist-api'
import { createSupabaseService } from './supabase-service'

export interface SyncOptions {
  authToken: string
  syncType: 'full' | 'incremental'
  includeDeleted?: boolean
  lastSyncDate?: Date
  batchSize?: number
}

export interface SyncResult {
  success: boolean
  sessionId: string
  stats: {
    total: number
    new: number
    updated: number
    deleted: number
    failed: number
  }
  duration: number
  errors?: string[]
}

export class SyncService {
  private supabaseService: ReturnType<typeof createSupabaseService>
  private ilistClient: ReturnType<typeof createIListClient> | null = null

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabaseService = createSupabaseService(supabaseUrl, supabaseServiceKey)
  }

  /**
   * Initialize iList client with auth token
   */
  private initializeIListClient(authToken: string) {
    this.ilistClient = createIListClient(authToken)
  }

  /**
   * Perform full synchronization with iList
   */
  async performSync(options: SyncOptions): Promise<SyncResult> {
    if (!this.ilistClient) {
      this.initializeIListClient(options.authToken)
    }

    if (!this.ilistClient) {
      throw new Error('Failed to initialize iList client')
    }

    const startTime = Date.now()

    // Create sync session
    const sessionId = await this.supabaseService.createSyncSession({
      sync_type: options.syncType,
      status: 'syncing',
      status_id: 1,
      include_deleted_from_crm: options.includeDeleted,
      update_date_from_utc: options.lastSyncDate?.toISOString(),
    })

    const stats = {
      total: 0,
      new: 0,
      updated: 0,
      deleted: 0,
      failed: 0,
    }

    const errors: string[] = []

    try {
      // Test connection first
      const isConnected = await this.ilistClient.testConnection()
      if (!isConnected) {
        throw new Error('Failed to connect to iList API')
      }

      // Sync active properties
      let propertiesResponse

      if (options.syncType === 'full') {
        propertiesResponse = await this.ilistClient.fullSync()
      } else if (options.syncType === 'incremental' && options.lastSyncDate) {
        propertiesResponse = await this.ilistClient.incrementalSync(options.lastSyncDate)
      } else {
        // Default to full sync if no last sync date
        propertiesResponse = await this.ilistClient.fullSync()
      }

      if (propertiesResponse.success && propertiesResponse.data) {
        stats.total = propertiesResponse.data.length

        // Process properties in batches
        const batchSize = options.batchSize || 10
        const properties = propertiesResponse.data

        for (let i = 0; i < properties.length; i += batchSize) {
          const batch = properties.slice(i, i + batchSize)

          await Promise.all(
            batch.map(async (ilistProperty) => {
              try {
                // Check if property exists
                const existingProperty = await this.supabaseService.getPropertyByIListId(
                  ilistProperty.Id
                )

                if (existingProperty) {
                  // Check if property actually changed
                  const lastUpdate = new Date(existingProperty.update_date || 0)
                  const ilistUpdate = new Date(ilistProperty.UpdateDate || 0)

                  if (ilistUpdate > lastUpdate) {
                    await this.supabaseService.upsertPropertyFromIList(ilistProperty)
                    stats.updated++
                  }
                } else {
                  // Create new property
                  await this.supabaseService.upsertPropertyFromIList(ilistProperty)
                  stats.new++
                }
              } catch (error) {
                console.error(`Failed to sync property ${ilistProperty.Id}:`, error)
                stats.failed++
                errors.push(
                  `Property ${ilistProperty.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
              }
            })
          )

          // Small delay between batches to be respectful to the database
          if (i + batchSize < properties.length) {
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }
      }

      // Sync deleted properties if requested
      if (options.includeDeleted) {
        try {
          const deletedPropertiesResponse = await this.ilistClient.syncDeletedProperties(
            options.lastSyncDate
          )

          if (deletedPropertiesResponse.success && deletedPropertiesResponse.data) {
            for (const deletedProperty of deletedPropertiesResponse.data) {
              try {
                await this.supabaseService.upsertPropertyFromIList(deletedProperty)
                stats.deleted++
              } catch (error) {
                console.error(`Failed to sync deleted property ${deletedProperty.Id}:`, error)
                stats.failed++
                errors.push(
                  `Deleted property ${deletedProperty.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
              }
            }
          }
        } catch (error) {
          console.error('Failed to sync deleted properties:', error)
          errors.push(
            `Deleted properties sync: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      const endTime = Date.now()
      const duration = Math.round((endTime - startTime) / 1000)

      // Update sync session with results
      await this.supabaseService.updateSyncSession(sessionId, {
        status:
          errors.length > 0 && stats.new === 0 && stats.updated === 0 ? 'failed' : 'completed',
        total_properties: stats.total,
        new_properties: stats.new,
        updated_properties: stats.updated,
        deleted_properties: stats.deleted,
        failed_properties: stats.failed,
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
        error_message: errors.length > 0 ? errors.join('; ') : undefined,
        error_details: errors.length > 0 ? ({ errors } as any) : undefined,
        api_responses: [propertiesResponse],
      })

      // Refresh materialized view
      await this.supabaseService.refreshPropertySearchView()

      return {
        success: true,
        sessionId,
        stats,
        duration,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error) {
      const endTime = Date.now()
      const duration = Math.round((endTime - startTime) / 1000)

      // Update sync session with error
      await this.supabaseService.updateSyncSession(sessionId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown sync error',
        error_details: { error: error instanceof Error ? error.stack : error },
        completed_at: new Date().toISOString(),
        duration_seconds: duration,
      })

      throw error
    }
  }

  /**
   * Sync a single property by iList ID
   */
  async syncSingleProperty(authToken: string, ilistId: number): Promise<void> {
    if (!this.ilistClient) {
      this.initializeIListClient(authToken)
    }

    if (!this.ilistClient) {
      throw new Error('Failed to initialize iList client')
    }

    const propertyData = await this.ilistClient.fetchPropertyById(ilistId)
    if (!propertyData) {
      throw new Error(`Property ${ilistId} not found in iList`)
    }

    await this.supabaseService.upsertPropertyFromIList(propertyData)
  }

  /**
   * Sync all lookup data from iList
   */
  async syncLookupData(authToken: string, languageId = 4): Promise<void> {
    if (!this.ilistClient) {
      this.initializeIListClient(authToken)
    }

    if (!this.ilistClient) {
      throw new Error('Failed to initialize iList client')
    }

    const lookups = await this.ilistClient.fetchAllLookups(languageId)

    // Save lookups to database
    for (const [lookupType, lookupData] of Object.entries(lookups)) {
      for (const lookup of lookupData) {
        try {
          // Upsert lookup data
          const { error } = await this.supabaseService['supabase'].from('ilist_lookups').upsert({
            lookup_type: lookupType,
            lookup_id: lookup.Id,
            language_id: languageId,
            value: lookup.Value,
            raw_data: lookup,
            last_updated: new Date().toISOString(),
          })

          if (error) {
            console.error(`Failed to save lookup ${lookupType}:`, error)
          }
        } catch (error) {
          console.error(`Error saving lookup ${lookupType}:`, error)
        }
      }
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<any> {
    const latestSession = await this.supabaseService.getLatestSyncSession()

    // Get total active properties count
    const { count } = await this.supabaseService['supabase']
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('status_id', 1)

    return {
      latestSession,
      totalActiveProperties: count || 0,
      isHealthy: latestSession?.status === 'completed',
    }
  }
}

/**
 * Create sync service instance
 */
export function createSyncService(supabaseUrl: string, supabaseServiceKey: string): SyncService {
  return new SyncService(supabaseUrl, supabaseServiceKey)
}
