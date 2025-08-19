/**
 * Legacy Supabase Client Configuration
 * @deprecated Use supabase-client.ts for client-side code and supabase-server.ts for server-side code
 * This file is kept for backward compatibility only
 */

export {
  supabasePublic as supabase,
  createAuthenticatedSupabaseClient,
  useSupabase,
} from './supabase-client'

// Legacy exports for backward compatibility
export function createSupabaseClient() {
  const { supabasePublic } = require('./supabase-client')
  return supabasePublic
}

export function useSupabaseClient() {
  const { useSupabase } = require('./supabase-client')
  return useSupabase()
}
