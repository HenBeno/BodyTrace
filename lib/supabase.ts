import "react-native-url-polyfill/auto"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/env"

let client: SupabaseClient | null = null

/**
 * Shared Supabase browser client for React Native.
 * Call only when `isSupabaseConfigured` is true.
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
    )
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  }
  return client
}
