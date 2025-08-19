/**
 * Clerk Role Management for Property Platform
 */

import { auth, clerkClient } from '@clerk/nextjs/server'

export type UserRole = 'admin' | 'agent' | 'user'

export interface UserWithRole {
  userId: string
  email?: string
  firstName?: string
  lastName?: string
  role: UserRole
  createdAt: Date
}

/**
 * Check if current user has specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const userRole = user.publicMetadata?.role as UserRole

  return userRole === role
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}

/**
 * Check if current user is agent or admin
 */
export async function isAgentOrAdmin(): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const userRole = user.publicMetadata?.role as UserRole

  return userRole === 'agent' || userRole === 'admin'
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const { userId } = await auth()
  if (!userId) return null

  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const userRole = user.publicMetadata?.role as UserRole

  return userRole || 'user'
}

/**
 * Assign role to user (admin only)
 */
export async function assignRole(userId: string, role: UserRole): Promise<void> {
  const isCurrentUserAdmin = await isAdmin()

  if (!isCurrentUserAdmin) {
    throw new Error('Only admins can assign roles')
  }

  const client = await clerkClient()

  // Remove existing roles
  await client.users.updateUser(userId, {
    publicMetadata: {
      ...((await client.users.getUser(userId)).publicMetadata || {}),
      role,
    },
  })
}

/**
 * Get all users with their roles (admin only)
 */
export async function getAllUsersWithRoles(): Promise<UserWithRole[]> {
  const isCurrentUserAdmin = await isAdmin()

  if (!isCurrentUserAdmin) {
    throw new Error('Only admins can view all users')
  }

  const client = await clerkClient()
  const users = await client.users.getUserList({
    limit: 100,
    orderBy: '-created_at',
  })

  return users.data.map((user) => ({
    userId: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    role: (user.publicMetadata?.role as UserRole) || 'user',
    createdAt: new Date(user.createdAt),
  }))
}

/**
 * Create first admin user (run this manually)
 */
export async function createFirstAdmin(userEmail: string): Promise<void> {
  const client = await clerkClient()

  // Find user by email
  const users = await client.users.getUserList({
    emailAddress: [userEmail],
  })

  if (users.data.length === 0) {
    throw new Error(`User with email ${userEmail} not found`)
  }

  const user = users.data[0]

  // Assign admin role
  await client.users.updateUser(user.id, {
    publicMetadata: {
      role: 'admin',
    },
  })

  console.log(`✅ Admin role assigned to ${userEmail} (${user.id})`)
}
