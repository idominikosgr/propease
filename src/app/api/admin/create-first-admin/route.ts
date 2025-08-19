/**
 * Create First Admin User
 * One-time setup API to assign admin role
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createFirstAdmin } from '@/lib/clerk-roles'

// Security: Only allow this in development or with special secret
const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || 'your-super-secret-setup-key'

export async function POST(request: NextRequest) {
  try {
    // Check if this is development or has setup secret
    const isDevelopment = process.env.NODE_ENV === 'development'
    const providedSecret = request.headers.get('x-setup-secret')

    if (!isDevelopment && providedSecret !== SETUP_SECRET) {
      return NextResponse.json(
        {
          error: 'Unauthorized. This endpoint is only available during setup.',
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Create first admin
    await createFirstAdmin(email)

    return NextResponse.json({
      success: true,
      message: `Admin role assigned to ${email}`,
      note: 'This endpoint will be disabled after first use for security',
    })
  } catch (error) {
    console.error('Admin creation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
