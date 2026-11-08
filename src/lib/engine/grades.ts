import type { TakenCourse } from '@/lib/types'

// วิชาแบบวัดผ่าน/ไม่ผ่าน: G=Good, S=Satisfactory, P=Pass = "ผ่าน" (U=Unsatisfactory ไม่ผ่าน)
// Y/Q = เทียบโอนรายวิชา (ย้ายคณะ / สอบคัดเลือกใหม่) — นับเป็นหน่วยกิตที่ผ่านแล้ว
const PASSING = new Set(['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'P', 'S', 'G', 'Y', 'Q'])
const POINTS: Record<string, number> = {
  A: 4, 'B+': 3.5, B: 3, 'C+': 2.5, C: 2, 'D+': 1.5, D: 1,
}

export function isPass(grade: string): boolean {
  return PASSING.has((grade || '').trim().toUpperCase())
}

export function gradePoint(grade: string): number | null {
  const g = (grade || '').trim().toUpperCase()
  return g in POINTS ? POINTS[g] : null
}

/** ลำดับเทอม: ปีก่อน แล้วเทอม เช่น 3/2567 < 1/2568 */
export function termKey(term: string): number {
  const [s, y] = (term || '').split('/')
  return Number(y || 0) * 10 + Number(s || 0)
}

/** เลือก attempt ที่ "ผ่านล่าสุด"; ถ้าไม่เคยผ่านคืน attempt ล่าสุด; ไม่มีเลยคืน undefined */
export function bestAttempt(code: string, taken: TakenCourse[]): TakenCourse | undefined {
  const rows = taken.filter((t) => t.code === code)
  if (!rows.length) return undefined
  const byTerm = (a: TakenCourse, b: TakenCourse) => termKey(a.term) - termKey(b.term)
  const passed = rows.filter((r) => isPass(r.grade)).sort(byTerm)
  if (passed.length) return passed[passed.length - 1]
  return [...rows].sort(byTerm)[rows.length - 1]
}
