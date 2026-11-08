import { ALL_COURSES } from './catalog'
import { GE_BY_CODE } from './ge-catalog'
import { normalizeCode } from '@/lib/engine/normalize'

/** ชื่อวิชาเทียบกันได้แม้พิมพ์ต่าง case/ช่องว่าง/เครื่องหมาย */
export function normalizeCourseName(name: string): string {
  return (name || '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[^0-9A-Z฀-๿ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

let nameIndex: Map<string, string> | null = null

function nameIndexMap(): Map<string, string> {
  if (nameIndex) return nameIndex

  const map = new Map<string, string>()
  const add = (code: string, ...names: (string | undefined)[]) => {
    for (const name of names) {
      if (!name) continue
      const key = normalizeCourseName(name)
      // เก็บตัวแรกไว้ — กันชื่อซ้ำ (เช่น GE บางกลุ่มใช้ชื่อเดียวกันหลายรหัส) ทับกัน
      if (key && !map.has(key)) map.set(key, normalizeCode(code))
    }
  }

  for (const c of Object.values(ALL_COURSES)) add(c.code, c.nameEn, c.name)
  for (const c of Object.values(GE_BY_CODE)) add(c.code, c.nameEn, c.name)

  nameIndex = map
  return map
}

/**
 * คืนรหัสที่ระบบรู้จักสำหรับรายวิชาที่นำเข้า
 * - รหัสตรงแคตตาล็อก → ใช้รหัสนั้น
 * - รหัสไม่รู้จัก (มหาวิทยาลัยเปลี่ยนรหัส) → เทียบชื่อกับแคตตาล็อก
 * - ไม่เจอทั้งคู่ → คงรหัสเดิมไว้
 */
export function canonicalCourseCode(code: string, name?: string): string {
  const normalized = normalizeCode(code)
  if (ALL_COURSES[normalized] || GE_BY_CODE[normalized]) return normalized
  if (!name) return normalized
  return nameIndexMap().get(normalizeCourseName(name)) ?? normalized
}