import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_KEY || ''
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !serviceKey) {
  console.warn('⚠️ Supabase credentials (SUPABASE_URL / SUPABASE_SERVICE_KEY) not found in .env')
}

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
}

// 1. Service Role client: Dedicated for administrative DB queries & supabase.auth.admin operations
export const supabaseAdmin = createClient(supabaseUrl, serviceKey || anonKey, clientOptions)

// 2. Auth / Anon client: Dedicated for isolated user auth operations (signUp, signInWithPassword, resend)
export const supabaseAuth = createClient(supabaseUrl, anonKey || serviceKey, clientOptions)

// Backwards-compatible export for existing routes
export const supabase = supabaseAdmin

