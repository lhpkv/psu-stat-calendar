import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchStructureHtml } from './client'
import { parseStructure, type PsuStructure, type StoredStructure } from './parse-structure'
import { encrypt } from './crypto'

// logic ซิงค์ที่ใช้ร่วมกัน: login route (sync ตอนเข้าระบบ) + ปุ่มซิงค์ใหม่
// เขียนผ่าน admin client (service role) เพราะเรียกจาก server หลังยืนยันตัวตน user แล้ว

export interface SyncResult {
  structure: StoredStructure
  importedCount: number
}

// ดึง + persist (login route ดึง html มาแล้วใช้ persistSync ตรง ๆ ได้ ไม่ต้อง login ซ้ำ)
export async function syncForUser(
  admin: SupabaseClient,
  userId: string,
  username: string,
  password: string,
): Promise<SyncResult> {
  return persistSync(admin, userId, username, password, await fetchStructureHtml(username, password))
}

export async function persistSync(
  admin: SupabaseClient,
  userId: string,
  username: string,
  password: string,
  html: string,
): Promise<SyncResult> {
  return persistParsed(admin, userId, username, password, parseStructure(html))
}

export async function persistParsed(
  admin: SupabaseClient,
  userId: string,
  username: string,
  password: string,
  parsed: PsuStructure,
): Promise<SyncResult> {
  const structure: StoredStructure = { ...parsed, syncedAt: new Date().toISOString() }
  const structure: StoredStructure = { ...parsed, syncedAt: new Date().toISOString() }

  // วิชาที่ลงแล้ว (มีเกรด) → taken_courses; term ว่าง (หน้านี้ไม่ให้เทอมต่อวิชา)
  const taken = parsed.courses.filter((c) => c.taken)
  if (taken.length) {
    const rows = taken.map((c) => ({
      user_id: userId,
      code: c.code,
      name: c.name,
      credits: c.credits,
      grade: c.grade,
      term: '',
      section: null,
    }))
    const { error } = await admin.from('taken_courses').upsert(rows, { onConflict: 'user_id,code,term' })
    if (error) throw error
  }

  // เก็บรหัส scmis (เข้ารหัส) + snapshot คำตัดสินของเว็บ
  const sealed = encrypt(password)
  const { error } = await admin.from('psu_credentials').upsert(
    {
      user_id: userId,
      username,
      pass_cipher: sealed.cipher,
      iv: sealed.iv,
      tag: sealed.tag,
      structure,
      last_synced_at: structure.syncedAt,
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error

  return { structure, importedCount: taken.length }
}
