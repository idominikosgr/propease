/**
 * iList Sync API Route
 * Handles synchronization with iList CRM
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createIListClient } from '@/lib/ilist-api'
import { createSupabaseService } from '@/lib/supabase-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { authToken, syncType = 'incremental', includeDeleted = false, lastSyncDate } = body

    if (!authToken) {
      return NextResponse.json({ error: 'Authentication token is required' }, { status: 400 })
    }

    // Initialize services
    const ilistClient = createIListClient(authToken)
    const supabaseService = createSupabaseService(supabaseUrl, supabaseServiceKey)

    // Test connection first
    const isConnected = await ilistClient.testConnection()
    if (!isConnected) {
      return NextResponse.json({ error: 'Failed to connect to iList API' }, { status: 400 })
    }

    // Create sync session
    const syncSessionId = await supabaseService.createSyncSession({
      sync_type: syncType,
      status: 'syncing',
      status_id: 1, // Active properties
      include_deleted_from_crm: includeDeleted,
      update_date_from_utc: lastSyncDate,
    })

    const startTime = Date.now()
    let syncStats = {
      total: 0,
      new: 0,
      updated: 0,
      deleted: 0,
      failed: 0,
    }

    try {
      // Sync active properties
      let propertiesResponse

      if (syncType === 'full') {
        propertiesResponse = await ilistClient.fullSync()
      } else if (syncType === 'incremental' && lastSyncDate) {
        propertiesResponse = await ilistClient.incrementalSync(new Date(lastSyncDate))
      } else {
        propertiesResponse = await ilistClient.fullSync()
      }

      if (propertiesResponse.success && propertiesResponse.data) {
        syncStats.total = propertiesResponse.data.length

        // Process each property
        for (const ilistProperty of propertiesResponse.data) {
          try {
            // Check if property exists
            const existingProperty = await supabaseService.getPropertyByIListId(ilistProperty.Id)

            if (existingProperty) {
              // Update existing property
              await supabaseService.upsertPropertyFromIList(ilistProperty)
              syncStats.updated++
            } else {
              // Create new property
              await supabaseService.upsertPropertyFromIList(ilistProperty)
              syncStats.new++
            }
          } catch (error) {
            console.error(`Failed to sync property ${ilistProperty.Id}:`, error)
            syncStats.failed++
          }
        }
      }

      // Sync deleted properties if requested
      if (includeDeleted) {
        try {
          const deletedPropertiesResponse = await ilistClient.syncDeletedProperties(
            lastSyncDate ? new Date(lastSyncDate) : undefined
          )

          if (deletedPropertiesResponse.success && deletedPropertiesResponse.data) {
            for (const deletedProperty of deletedPropertiesResponse.data) {
              try {
                // Update property status to deleted (status_id = 2)
                await supabaseService.upsertPropertyFromIList(deletedProperty)
                syncStats.deleted++
              } catch (error) {
                console.error(`Failed to sync deleted property ${deletedProperty.Id}:`, error)
                syncStats.failed++
              }
            }
          }
        } catch (error) {
          console.error('Failed to sync deleted properties:', error)
        }
      }

      // Update sync session with success
      const endTime = Date.now()
      await supabaseService.updateSyncSession(syncSessionId, {
        status: 'completed',
        total_properties: syncStats.total,
        new_properties: syncStats.new,
        updated_properties: syncStats.updated,
        deleted_properties: syncStats.deleted,
        failed_properties: syncStats.failed,
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round((endTime - startTime) / 1000),
        api_responses: [propertiesResponse],
      })

      // Refresh materialized view for better search performance
      await supabaseService.refreshPropertySearchView()

      return NextResponse.json({
        success: true,
        syncSessionId,
        stats: syncStats,
        duration: Math.round((endTime - startTime) / 1000),
      })
    } catch (syncError) {
      // Update sync session with error
      await supabaseService.updateSyncSession(syncSessionId, {
        status: 'failed',
        error_message: syncError instanceof Error ? syncError.message : 'Unknown sync error',
        error_details: { error: syncError },
        completed_at: new Date().toISOString(),
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
      })

      throw syncError
    }
  } catch (error) {
    console.error('Sync error:', error)

    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseService = createSupabaseService(supabaseUrl, supabaseServiceKey)

    // Get latest sync session
    const latestSync = await supabaseService.getLatestSyncSession()

    return NextResponse.json({
      success: true,
      latestSync,
    })
  } catch (error) {
    console.error('Error getting sync status:', error)

    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
