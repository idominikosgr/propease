/**
 * iList Webhook Handler
 * Handles real-time updates from iList CRM
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseService } from '@/lib/supabase-service'
import { createIListClient, type IListProperty } from '@/lib/ilist-api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const webhookSecret = process.env.ILIST_WEBHOOK_SECRET || 'your-webhook-secret'

interface IListWebhookPayload {
  event: 'property.created' | 'property.updated' | 'property.deleted' | 'property.status_changed'
  property_id: number
  timestamp: string
  data?: IListProperty
  changes?: {
    old_status?: number
    new_status?: number
    fields_changed?: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (if iList provides one)
    const signature = request.headers.get('x-ilist-signature')
    const timestamp = request.headers.get('x-ilist-timestamp')

    // TODO: Implement signature verification when iList provides webhook signing
    // For now, we'll use a simple secret header
    const providedSecret = request.headers.get('x-webhook-secret')
    if (providedSecret !== webhookSecret) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
    }

    const payload: IListWebhookPayload = await request.json()

    if (!(payload.event && payload.property_id)) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }

    // Initialize services
    const supabaseService = createSupabaseService(supabaseUrl, supabaseServiceKey)

    // Get iList config for API client
    const ilistConfig = await supabaseService.getIListConfig()
    if (!ilistConfig) {
      return NextResponse.json({ error: 'iList API not configured' }, { status: 500 })
    }

    const ilistClient = createIListClient(ilistConfig.auth_token)

    let result: any = {}

    switch (payload.event) {
      case 'property.created':
      case 'property.updated': {
        // Fetch the latest property data from iList
        let propertyData = payload.data

        if (!propertyData) {
          // Fetch from API if not provided in webhook
          const fetchedData = await ilistClient.fetchPropertyById(payload.property_id)
          if (!fetchedData) {
            throw new Error(`Property ${payload.property_id} not found in iList`)
          }
          propertyData = fetchedData
        }

        // Upsert property in our database
        const propertyId = await supabaseService.upsertPropertyFromIList(propertyData)

        result = {
          action: payload.event,
          property_id: propertyId,
          ilist_id: payload.property_id,
        }

        // Log the sync
        await supabaseService.createSyncSession({
          sync_type: 'webhook',
          status: 'completed',
          total_properties: 1,
          new_properties: payload.event === 'property.created' ? 1 : 0,
          updated_properties: payload.event === 'property.updated' ? 1 : 0,
          api_responses: [{ webhook_payload: payload, property_data: propertyData }],
        })

        break
      }

      case 'property.deleted': {
        // Mark property as deleted (status_id = 2)
        const existingProperty = await supabaseService.getPropertyByIListId(payload.property_id)

        if (existingProperty) {
          // Update the raw data to reflect deletion
          const deletedPropertyData = {
            ...existingProperty.ilist_raw_data,
            StatusID: 2,
            UpdateDate: payload.timestamp,
          }

          await supabaseService.upsertPropertyFromIList(deletedPropertyData)

          result = {
            action: 'property.deleted',
            property_id: existingProperty.id,
            ilist_id: payload.property_id,
          }

          // Log the sync
          await supabaseService.createSyncSession({
            sync_type: 'webhook',
            status: 'completed',
            total_properties: 1,
            deleted_properties: 1,
            api_responses: [{ webhook_payload: payload }],
          })
        }

        break
      }

      case 'property.status_changed': {
        // Handle status changes (active/inactive)
        const existingProperty = await supabaseService.getPropertyByIListId(payload.property_id)

        if (existingProperty && payload.changes) {
          // Update status in the raw data
          const updatedPropertyData = {
            ...existingProperty.ilist_raw_data,
            StatusID: payload.changes.new_status,
            UpdateDate: payload.timestamp,
          }

          await supabaseService.upsertPropertyFromIList(updatedPropertyData)

          result = {
            action: 'property.status_changed',
            property_id: existingProperty.id,
            ilist_id: payload.property_id,
            old_status: payload.changes.old_status,
            new_status: payload.changes.new_status,
          }

          // Log the sync
          await supabaseService.createSyncSession({
            sync_type: 'webhook',
            status: 'completed',
            total_properties: 1,
            updated_properties: 1,
            api_responses: [{ webhook_payload: payload }],
          })
        }

        break
      }

      default:
        return NextResponse.json({ error: `Unknown event type: ${payload.event}` }, { status: 400 })
    }

    // Refresh materialized view for updated search results
    await supabaseService.refreshPropertySearchView()

    return NextResponse.json({
      success: true,
      event: payload.event,
      timestamp: new Date().toISOString(),
      result,
    })
  } catch (error) {
    console.error('Webhook processing error:', error)

    // Log failed webhook attempt
    try {
      const supabaseService = createSupabaseService(supabaseUrl, supabaseServiceKey)
      await supabaseService.createSyncSession({
        sync_type: 'webhook',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown webhook error',
        error_details: { error: error instanceof Error ? error.stack : error },
      })
    } catch (logError) {
      console.error('Failed to log webhook error:', logError)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Handle GET request for webhook verification (if needed by iList)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')

  if (challenge) {
    // Echo back the challenge for webhook verification
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({
    status: 'iList webhook endpoint active',
    timestamp: new Date().toISOString(),
  })
}
