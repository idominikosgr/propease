/**
 * User Management API (Admin Only)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getAllUsersWithRoles, assignRole, isAdmin } from '@/lib/clerk-roles'

export async function GET() {
  try {
    const users = await getAllUsersWithRoles()

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Access denied',
      },
      { status: 403 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, role } = body

    if (!(userId && role)) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
    }

    if (!['admin', 'agent', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, agent, or user' },
        { status: 400 }
      )
    }

    await assignRole(userId, role)

    return NextResponse.json({
      success: true,
      message: `Role updated to ${role}`,
      userId,
      role,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Access denied',
      },
      { status: 403 }
    )
  }
}
