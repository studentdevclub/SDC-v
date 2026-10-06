import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uoypfbjxwnxdmkdrscjv.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_3llpU-r09D9sVEZR2zHkmw_PEccKaZy'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
