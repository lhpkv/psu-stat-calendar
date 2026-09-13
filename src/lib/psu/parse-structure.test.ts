import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseStructure, detectMajor } from './parse-structure'

const html = readFileSync('src/lib/psu/__fixtures__/structure.html', 'utf8')

describe('parseStructure', () => {
  const s = parseStructure(html)

  it('ดึง summary: หน่วยกิตสะสม / GPA / สถานภาพ / วุฒิ', () => {
    expect(s.summary.creditsEarned).toBe(82)
    expect(s.summary.gpa).toBeCloseTo(2.13)
    expect(s.summary.status).toBe('กำลังศึกษา ตามโครงสร้างหลักสูตร')
    expect(s.summary.degree).toContain('สาขาวิชาสถิติ')
  })

  it('แยกวิชาที่ผ่านแล้ว + เกรดจริง (เกรดอยู่หลังคอมเมนต์)', () => {
    const calc = s.courses.find((c) => c.code === '322-101')
    expect(calc).toMatchObject({ name: 'CALCULUS I', credits: 3, grade: 'D', taken: true })
    expect(s.courses.find((c) => c.code === '315-201G7')).toMatchObject({ grade: 'D+', taken: true })
    expect(s.courses.find((c) => c.code === '388-100')).toMatchObject({ grade: 'P', taken: true })
  })

  it('วิชาถอน (WC) ยังถือว่าลงแล้วแต่เก็บเกรด WC ตามจริง', () => {
    expect(s.courses.find((c) => c.code === '460-001')).toMatchObject({ grade: 'WC', taken: true })
  })

  it('วิชาที่ยังไม่ครบ (สีแดง) = taken:false ไม่มีเกรด', () => {
    expect(s.courses.find((c) => c.code === '001-101')).toMatchObject({ taken: false, grade: '' })
    expect(s.courses.find((c) => c.code === '345-201')).toMatchObject({ taken: false, grade: '' })
  })

  it('ผูกวิชาเข้าหมวดตามหัวข้อที่อยู่ก่อนหน้า', () => {
    expect(s.courses.find((c) => c.code === '322-101')?.category).toBe('หมวดวิชาศึกษาทั่วไป')
    expect(s.courses.find((c) => c.code === '460-001')?.category).toBe('หมวดวิชาเฉพาะ')
  })

  it('ดึงหมวด + หน่วยกิตที่ต้องการ', () => {
    expect(s.categories).toEqual([
      { title: 'หมวดวิชาศึกษาทั่วไป', requiredCredits: 30 },
      { title: 'หมวดวิชาเฉพาะ', requiredCredits: 97 },
    ])
  })

  it('นับจำนวนวิชาทั้งหมดถูก (ไม่หลุด ไม่ซ้ำ)', () => {
    expect(s.courses).toHaveLength(6)
  })
})

describe('detectMajor', () => {
  it('คืนค่า statistics (แอปรองรับเฉพาะสถิติ)', () => {
    expect(detectMajor(parseStructure(html))).toBe('statistics')
  })
})
