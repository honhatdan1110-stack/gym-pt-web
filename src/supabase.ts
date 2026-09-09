import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

// Keep the module importable in local development, while preventing requests
// from being made until the project credentials are configured.
export const supabase = createClient(
  supabaseUrl || 'https://missing-project.supabase.co',
  supabasePublishableKey || 'missing-publishable-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
)
