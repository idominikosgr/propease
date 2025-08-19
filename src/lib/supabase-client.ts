/**
 * Supabase Client Configuration
 * Integrates with Clerk for authentication
 */

import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
  );
}

// Create Supabase client for public access (property listings)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

// Create authenticated Supabase client with Clerk token
export function createAuthenticatedSupabaseClient() {
  const { getToken } = useAuth();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await getToken({ template: "supabase" });

        const headers = new Headers(options?.headers);
        if (clerkToken) {
          headers.set("Authorization", `Bearer ${clerkToken}`);
        }

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}

// Hook for authenticated Supabase client
export function useSupabase() {
  return createAuthenticatedSupabaseClient();
}
