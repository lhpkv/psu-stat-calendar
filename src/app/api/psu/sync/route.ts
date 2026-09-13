import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncForUser } from '@/lib/psu/sync'
import { decrypt } from '@/lib/psu/crypto'
import { PsuAuthError } from '@/lib/psu/client'

// ซิงค์ใหม่ด้วยรหัสที่บันทึกไว้ (ไม่ต้องพิมพ์รหัสซ้ำ)
export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 })

  const admin = createAdminClient()
  const { data: cred } = await admin
    .from('psu_credentials')
    .select('username,pass_cipher,iv,tag')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!cred) {
    return Response.json({ error: 'ยังไม่มีรหัส scmis ที่บันทึกไว้ กรุณาเข้าสู่ระบบใหม่' }, { status: 400 })
  }

  let password: string
  try {
    password = decrypt({ cipher: cred.pass_cipher, iv: cred.iv, tag: cred.tag })
  } catch {
    return Response.json({ error: 'ถอดรหัสไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่' }, { status: 400 })
  }

  try {
    const result = await syncForUser(admin, user.id, cred.username, password)
    return Response.json({ ok: true, importedCount: result.importedCount, structure: result.structure })
  } catch (e) {
    if (e instanceof PsuAuthError) {
      return Response.json({ error: 'รหัส scmis เปลี่ยนไป กรุณาเข้าสู่ระบบใหม่' }, { status: 401 })
    }
    return Response.json({ error: 'ซิงค์ไม่สำเร็จ ลองใหม่อีกครั้ง' }, { status: 502 })
  }
}
