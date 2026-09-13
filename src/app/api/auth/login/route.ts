import { createHmac } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchStructureHtml, PsuAuthError } from '@/lib/psu/client'
import { parseStructure, detectMajor } from '@/lib/psu/parse-structure'
import { persistSync } from '@/lib/psu/sync'

// login ด้วยรหัส scmis: validate กับเว็บมหาลัย → ผูกบัญชี Supabase อัตโนมัติ → ซิงค์เกรดทันที
export const runtime = 'nodejs'

const syntheticEmail = (studentId: string) => `${studentId}@scmis.local`

// รหัส Supabase สังเคราะห์จากรหัสนักศึกษา (ลับฝั่ง server) — ทางเข้าจริงคือ validate scmis
function derivedPassword(studentId: string): string {
  const secret = process.env.PSU_ENC_KEY
  if (!secret) throw new Error('PSU_ENC_KEY ไม่ได้ตั้งค่า')
  return createHmac('sha256', secret).update(studentId).digest('base64')
}

// หา user id จากอีเมล (สำหรับเคสบัญชีมีอยู่แล้ว) — แอปนี้ผู้ใช้ไม่เยอะ paging แค่นี้พอ
async function findUserIdByEmail(admin: SupabaseClient, email: string): Promise<string | null> {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error || !data.users.length) return null
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found.id
    if (data.users.length < 200) return null
  }
  return null
}

export async function POST(req: Request) {
  let studentId = ''
  let password = ''
  try {
    const body = await req.json()
    studentId = String(body.studentId ?? '').trim()
    password = String(body.password ?? '')
  } catch {
    /* body ไม่ใช่ JSON */
  }
  if (!studentId || !password) {
    return Response.json({ error: 'กรอกรหัสนักศึกษาและรหัสผ่าน' }, { status: 400 })
  }

  // 1) validate กับ scmis (ดึงหน้าโครงสร้างมาเลย ใช้ทั้ง validate + sync)
  let html: string
  try {
    html = await fetchStructureHtml(studentId, password)
  } catch (e) {
    if (e instanceof PsuAuthError) return Response.json({ error: 'รหัส scmis ไม่ถูกต้อง' }, { status: 401 })
    return Response.json({ error: 'เชื่อมต่อ scmis ไม่ได้ ลองใหม่อีกครั้ง' }, { status: 502 })
  }

  const major = detectMajor(parseStructure(html))
  const email = syntheticEmail(studentId)
  const pass = derivedPassword(studentId)
  const admin = createAdminClient()
  const supabase = await createServerSupabase()

  // 2) sign in (รหัสสังเคราะห์ deterministic) — ถ้ายังไม่มีบัญชี ค่อยสร้างแล้ว sign in ใหม่
  //    signInWithPassword ผ่าน server client = เขียน session cookie ลง response
  let signIn = await supabase.auth.signInWithPassword({ email, password: pass })
  if (signIn.error) {
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password: pass,
      email_confirm: true,
      user_metadata: { student_id: studentId, major },
    })
    if (createErr) {
      // มีบัญชีอยู่แล้วแต่รหัสสังเคราะห์ไม่ตรง (เช่น PSU_ENC_KEY เปลี่ยน) → อัปเดตรหัสแล้วลองใหม่
      const id = await findUserIdByEmail(admin, email)
      if (!id) {
        console.error('[auth/login] createUser failed:', createErr.message)
        return Response.json({ error: 'สร้างบัญชีไม่สำเร็จ', detail: createErr.message }, { status: 500 })
      }
      const { error: updErr } = await admin.auth.admin.updateUserById(id, { password: pass })
      if (updErr) {
        console.error('[auth/login] updateUser failed:', updErr.message)
        return Response.json({ error: 'อัปเดตบัญชีไม่สำเร็จ', detail: updErr.message }, { status: 500 })
      }
    }
    signIn = await supabase.auth.signInWithPassword({ email, password: pass })
  }
  if (signIn.error || !signIn.data.user) {
    console.error('[auth/login] signIn failed:', signIn.error?.message)
    return Response.json({ error: 'เข้าสู่ระบบไม่สำเร็จ', detail: signIn.error?.message }, { status: 500 })
  }

  // 3) ซิงค์เกรด + structure ทันที (ใช้ html ที่ดึงมาแล้ว ไม่ login ซ้ำ)
  //    sync ล้มเหลวไม่ควรกันเข้าระบบ — ผู้ใช้กดซิงค์ใหม่ได้
  try {
    await persistSync(admin, signIn.data.user.id, studentId, password, html)
  } catch {
    /* เข้าระบบแล้ว, ซิงค์ภายหลังได้ */
  }

  return Response.json({ ok: true })
}
