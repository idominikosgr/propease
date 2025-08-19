/**
 * iList Webhook Configuration API
 * Configure webhook endpoints for real-time sync
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createSupabaseService } from '@/lib/supabase-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      authToken,
      webhookUrl,
      events = [
        'property.created',
        'property.updated',
        'property.deleted',
        'property.status_changed',
      ],
      secret,
    } = body

    if (!(authToken && webhookUrl)) {
      return NextResponse.json(
        { error: 'Auth token and webhook URL are required' },
        { status: 400 }
      )
    }

    // TODO: Register webhook with iList API (if they support webhook registration)
    // This would typically be a POST to something like:
    // POST https://ilist.e-agents.gr/api/webhooks
    // {
    //   "url": webhookUrl,
    //   "events": events,
    //   "secret": secret
    // }

    // For now, we'll just save the configuration
    const supabaseService = createSupabaseService(supabaseUrl, supabaseServiceKey)

    // Save webhook configuration (extend ilist_config table or create new webhook_config table)
    await supabaseService.updateIListConfig({
      auth_token: authToken,
      // Add webhook-specific fields if needed
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook configuration saved',
      webhookUrl,
      events,
      note: 'Manual webhook registration with iList may be required',
    })
  } catch (error) {
    console.error('Webhook configuration error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to configure webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
    const webhookUrl = `${baseUrl}/api/webhooks/ilist`

    return NextResponse.json({
      success: true,
      webhookUrl,
      supportedEvents: [
        'property.created',
        'property.updated',
        'property.deleted',
        'property.status_changed',
      ],
      instructions: {
        endpoint: webhookUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': 'your-webhook-secret',
        },
        note: 'Configure this webhook URL in your iList CRM settings for real-time sync',
      },
    })
  } catch (error) {
    console.error('Error getting webhook config:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get webhook configuration',
      },
      { status: 500 }
    )
  }
}
