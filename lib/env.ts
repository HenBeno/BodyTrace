/** Public env vars embedded at build time (Expo). */
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ""

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
