import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase client — null when env vars are not configured.
 * All callers must check `if (!supabase)` before using.
 */
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,       // Keep session in localStorage across page reloads
        autoRefreshToken: true,
        detectSessionInUrl: true,   // Handles OAuth redirect tokens in URL
      },
    })
  : null

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)
