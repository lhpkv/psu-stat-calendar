import { describe, it, expect } from 'vitest'
import { canonicalCourseCode, normalizeCourseName } from './resolve'

describe('normalizeCourseName', () => {
  it('ปรับตัวพิมพ์/ช่องว่างให้เทียบกันได้', () => {
    expect(normalizeCourseName('  Calculus   I ')).toBe('CALCULUS I')
  })
})

describe('canonicalCourseCode (เทียบทั้งรหัสและชื่อ)', () => {
  it('รหัสที่รู้จักอยู่แล้วคืนค่าเดิม', () => {
    expect(canonicalCourseCode('322-101', 'whatever')).toBe('322-101')
  })

  it('รหัสใหม่/เก่าที่ไม่รู้จัก แต่ชื่อตรงกับแคตตาล็อก → คืนรหัสที่ระบบรู้จัก', () => {
    expect(canonicalCourseCode('999-999', 'CALCULUS I')).toBe('322-101')
    expect(canonicalCourseCode('888-888', 'calculus   i')).toBe('322-101')
  })

  it('เทียบชื่อวิชา GE ได้', () => {
    expect(canonicalCourseCode('777-777', 'Everyday English')).toBe('890-102G1')
  })

  it('ชื่อไม่ตรงกับใคร → คงรหัสเดิม', () => {
    expect(canonicalCourseCode('999-999', 'SOMETHING UNKNOWN')).toBe('999-999')
  })
})