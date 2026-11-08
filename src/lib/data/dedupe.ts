import type { TakenCourse } from '@/lib/types'

/**
 * รวมแถววิชาที่คีย์ซ้ำ (code + term) ก่อน upsert
 * กัน Postgres 21000 ("ON CONFLICT DO UPDATE command cannot affect row a second time")
 * เมื่อ import จาก PDF/ข้อความที่มีวิชาลงซ้ำในเทอมเดียวกันหรือ term ว่างเหมือนกัน
 */
export function dedupeTaken(rows: TakenCourse[]): TakenCourse[] {
  const byKey = new Map<string, TakenCourse>()
  for (const row of rows) {
    const key = `${row.code.trim().toUpperCase()}|${row.term.trim()}`
    byKey.set(key, row)
  }
  return [...byKey.values()]
}