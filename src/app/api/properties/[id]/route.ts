/**
 * Single Property API Route
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseService } from '@/lib/supabase-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 })
    }

    // Initialize Supabase service with anon key for public access
    const supabaseService = createSupabaseService(supabaseUrl, supabaseAnonKey)

    // Get property by ID
    const property = await supabaseService.getPropertyById(id)

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Extract Greek title and description from characteristics
    const title =
      property.characteristics?.find((c) => c.title === 'Τίτλος' && c.language_id === 4)?.value ||
      ''

    const description =
      property.characteristics?.find(
        (c) => c.title === 'Επιπλέον κείμενο (ΧΕ)' && c.language_id === 4
      )?.value || ''

    const adText =
      property.characteristics?.find((c) => c.title === 'Αγγελία' && c.language_id === 4)?.value ||
      ''

    // Add computed fields
    const propertyWithComputed = {
      ...property,
      title,
      description,
      adText,
      primaryImage:
        property.images?.find((img) => img.order_num === 1)?.url ||
        property.images?.[0]?.url ||
        null,
      imageCount: property.images?.length || 0,
      partnerName: property.partner
        ? `${property.partner.firstname || ''} ${property.partner.lastname || ''}`.trim()
        : '',
    }

    return NextResponse.json({
      success: true,
      data: propertyWithComputed,
    })
  } catch (error) {
    console.error('Property fetch error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch property',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
