/**
 * Property Status Management API
 * Handle property activation/deactivation sync with iList
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseService } from '@/lib/supabase-service'
import { createIListClient } from '@/lib/ilist-api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status_id, authToken } = body

    if (!id || status_id === undefined) {
      return NextResponse.json({ error: 'Property ID and status are required' }, { status: 400 })
    }

    // Validate status (1 = active, 2 = deleted/inactive)
    if (![1, 2].includes(status_id)) {
      return NextResponse.json(
        { error: 'Invalid status. Use 1 for active, 2 for inactive' },
        { status: 400 }
      )
    }

    const supabaseService = createSupabaseService(supabaseUrl, supabaseServiceKey)

    // Get property
    const property = await supabaseService.getPropertyById(id)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Update property status in our database
    const updatedRawData = {
      ...property.ilist_raw_data,
      StatusID: status_id,
      UpdateDate: new Date().toISOString(),
    }

    await supabaseService.upsertPropertyFromIList(updatedRawData)

    // TODO: If iList provides an API to update property status, call it here
    // This would require an UPDATE endpoint in iList API
    if (authToken) {
      try {
        const ilistClient = createIListClient(authToken)
        // await ilistClient.updatePropertyStatus(property.ilist_id, status_id);
        console.log(`Would update iList property ${property.ilist_id} status to ${status_id}`)
      } catch (error) {
        console.error('Failed to update status in iList:', error)
        // Continue anyway - local status is updated
      }
    }

    // Log the status change
    await supabaseService.createSyncSession({
      sync_type: 'status_update',
      status: 'completed',
      total_properties: 1,
      updated_properties: 1,
      api_responses: [
        {
          action: 'status_update',
          property_id: id,
          ilist_id: property.ilist_id,
          old_status: property.status_id,
          new_status: status_id,
        },
      ],
    })

    return NextResponse.json({
      success: true,
      property_id: id,
      ilist_id: property.ilist_id,
      old_status: property.status_id,
      new_status: status_id,
      message: `Property ${status_id === 1 ? 'activated' : 'deactivated'} successfully`,
    })
  } catch (error) {
    console.error('Property status update error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update property status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabaseService = createSupabaseService(supabaseUrl, supabaseServiceKey)
    const property = await supabaseService.getPropertyById(id)

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      property_id: id,
      ilist_id: property.ilist_id,
      status_id: property.status_id,
      status_label: property.status_id === 1 ? 'Active' : 'Inactive',
      last_updated: property.update_date,
      last_synced: property.last_ilist_sync,
    })
  } catch (error) {
    console.error('Error getting property status:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get property status',
      },
      { status: 500 }
    )
  }
}
