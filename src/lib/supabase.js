import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gyglsbmpxopaoeljoofp.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_placeholder'

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)
