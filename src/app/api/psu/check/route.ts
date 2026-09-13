import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { fetchStructureHtml, PsuAuthError } from '@/lib/psu/client'
import { parseStructure } from '@/lib/psu/parse-structure'

// ตรวจกับ scmis แบบ manual: รับรหัสนักศึกษา + รหัสผ่าน scmis จากผู้ใช้ที่ล็อกอินแล้ว
// ดึงผลตรวจหลักสูตรมาแสดง — ไม่เก็บรหัสผ่านหรือผลลัพธ์ไว้ในระบบเราเลย
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 })

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

  try {
    const structure = parseStructure(await fetchStructureHtml(studentId, password))
    return Response.json({ ok: true, structure })
  } catch (e) {
    if (e instanceof PsuAuthError) return Response.json({ error: 'รหัส scmis ไม่ถูกต้อง' }, { status: 401 })
    return Response.json({ error: 'เชื่อมต่อ scmis ไม่ได้ ลองใหม่อีกครั้ง' }, { status: 502 })
  }
}
