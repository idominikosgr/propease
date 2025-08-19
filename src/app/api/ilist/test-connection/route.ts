/**
 * iList Test Connection API Route
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createIListClient } from '@/lib/ilist-api'
import { createSupabaseService } from '@/lib/supabase-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { authToken } = body

    if (!authToken) {
      return NextResponse.json({ error: 'Authentication token is required' }, { status: 400 })
    }

    // Test connection
    const ilistClient = createIListClient(authToken)
    const isConnected = await ilistClient.testConnection()

    if (isConnected) {
      // Save/update configuration if connection is successful
      const supabaseService = createSupabaseService(supabaseUrl, supabaseServiceKey)

      await supabaseService.updateIListConfig({
        auth_token: authToken,
        is_active: true,
        api_base_url: 'https://ilist.e-agents.gr',
        rate_limit_per_minute: 10,
      })

      return NextResponse.json({
        success: true,
        connected: true,
        message: 'Successfully connected to iList API',
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: 'Failed to connect to iList API. Please check your token.',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Connection test error:', error)

    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
