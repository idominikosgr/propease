/**
 * Server-only Supabase configuration
 * Only for use in API routes and server components
 */

import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Server-side Supabase client for API routes and server components
 * Handles cookie-based sessions properly
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // Handle cookie setting errors in middleware/edge runtime
        }
      },
    },
  })
}

/**
 * Authenticated server client that combines Clerk auth with Supabase
 * Use this when you need both Clerk user context and Supabase data
 */
export async function createAuthenticatedSupabaseClient() {
  const { userId, getToken } = await auth()

  if (!userId) {
    throw new Error('User not authenticated')
  }

  // Get Clerk token for Supabase
  const token = await getToken({ template: 'supabase' })

  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // Handle cookie setting errors
        }
      },
    },
  })
}

/**
 * Server-side Supabase client with service role key
 * Use this for admin operations, iList sync, and bypassing RLS
 * NOTE: This should only be used in API routes or server components
 */
export async function createSupabaseServiceClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // Handle cookie setting errors in middleware/edge runtime
        }
      },
    },
  })
}
