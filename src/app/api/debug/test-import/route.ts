/**
 * Debug Test Import API Route
 * Test import functionality with sample data
 */

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { importPropertiesFromCSV } from '@/lib/property-import-service'
import type { PropertyImportMapping } from '@/lib/property-import-types'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and permissions
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has admin role
    const client = await (await import('@clerk/nextjs/server')).clerkClient()
    const user = await client.users.getUser(userId)
    const userRole = user.publicMetadata?.role as string

    if (userRole !== 'admin' && userRole !== 'agent') {
      return NextResponse.json({ error: 'Admin or agent access required' }, { status: 403 })
    }

    // Sample test data
    const testData = [
      {
        Title: 'Beautiful Apartment',
        Price: '250000',
        Size: '85',
        Rooms: '2',
        Bathrooms: '1',
        'Area ID': '2011',
      },
      {
        Title: 'Luxury Villa',
        Price: '590000',
        Size: '290',
        Rooms: '4',
        Bathrooms: '3',
        'Area ID': '2208',
      },
    ]

    // Sample mapping
    const testMapping: PropertyImportMapping = {
      title: 'Title',
      price: 'Price',
      sqr_meters: 'Size',
      rooms: 'Rooms',
      bathrooms: 'Bathrooms',
      area_id: 'Area ID',
    }

    console.log('Testing import with sample data:', testData)
    console.log('Using mapping:', testMapping)

    // Import properties
    const result = await importPropertiesFromCSV(testData, testMapping)

    return NextResponse.json({
      ...result,
      success: true,
      message: `Test import completed: ${result.success} successful, ${result.failed} failed`,
      testData,
      testMapping,
    })
  } catch (error) {
    console.error('Test import error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Test import failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
