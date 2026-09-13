import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// service-role client — server-only (ข้าม RLS) สำหรับ provision บัญชี + เขียนข้อมูลตอน sync
// ห้าม import ฝั่ง client: SUPABASE_SERVICE_ROLE_KEY เป็นความลับ
let client: SupabaseClient | undefined

export function createAdminClient(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('ต้องตั้ง NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY')
    client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  }
  return client
}
