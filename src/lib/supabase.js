import { createClient } from '@supabase/supabase-js'

export const envConfig = {
  url: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '',
}

export function hasValidConfig(config) {
  if (!config?.url || !config?.anonKey) return false

  try {
    const url = new URL(config.url)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function createSupabaseClient(config) {
  if (!hasValidConfig(config)) {
    throw new Error('Enter a valid Supabase project URL and anon key.')
  }

  return createClient(config.url, config.anonKey, {
    auth: {
      // Folester never writes auth or configuration data to localStorage.
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
