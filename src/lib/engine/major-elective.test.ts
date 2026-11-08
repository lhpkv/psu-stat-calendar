import { describe, it, expect } from 'vitest'
import { buildProgram } from '@/lib/curriculum/program-2564'
import { COURSES } from '@/lib/curriculum/courses'
import { computeProgress } from './progress'
import type { TakenCourse } from '@/lib/types'

const course = (code: string, term = '1/2568'): TakenCourse => ({
  code,
  name: code,
  credits: COURSES[code]?.credits ?? 3,
  grade: 'A',
  term,
})

const majorAndFree = (taken: TakenCourse[], plan: 'regular' | 'coop' = 'regular') => {
  const r = computeProgress(buildProgram(plan, 'ge2565'), taken, [])
  return {
    major: r.categories.find((c) => c.category === 'major_elective')!,
    free: r.categories.find((c) => c.category === 'free_elective')!,
  }
}

// หลักสูตร: วิชาเลือกสาขา 21 นก. (สหกิจ 17) = กลุ่ม 1 อย่างน้อย 12 นก.
// + กลุ่ม 2 "ไม่เกิน" 9 นก. (สหกิจ 5) — กลุ่ม 2 ไม่ใช่บังคับ 9 นก.
// ถ้านักศึกษาเก็บกลุ่ม 1 เกิน 12 นก. ส่วนที่เกินต้องนับรวมใน 21 นก. ไม่ใช่ผลักไปวิชาเลือกเสรี
describe('วิชาเลือกสาขา: 21 นก. รวม โดยกลุ่ม 1 ≥ 12 และกลุ่ม 2 ≤ 9', () => {
  it('7 วิชากลุ่ม 1 (21 นก.) ต้องครบ major_elective และ free elective ต้องเป็น 0', () => {
    const taken = [
      '346-335', '346-336', '346-341', '346-342', '346-343', '346-431', '346-432',
    ].map((c) => course(c))

    const { major, free } = majorAndFree(taken)

    expect(major.needCredits).toBe(21)
    expect(major.doneCredits).toBe(21)
    expect(free.doneCredits).toBe(0)
  })

  it('กลุ่ม 1 15 นก. + กลุ่ม 2 6 นก. = 21 นก. ต้องครบและไม่ล้นไป free elective', () => {
    const taken = [
      '346-335', '346-336', '346-341', '346-342', '346-343',
      '876-102', '308-231',
    ].map((c) => course(c))

    const { major, free } = majorAndFree(taken)

    expect(major.doneCredits).toBe(21)
    expect(free.doneCredits).toBe(0)
  })

  it('แผนสหกิจ: กลุ่ม 1 15 นก. + กลุ่ม 2 3 นก. ต้องนับครบ 17 นก.', () => {
    const taken = [
      '346-335', '346-336', '346-341', '346-342', '346-343', '876-102',
    ].map((c) => course(c))

    const { major, free } = majorAndFree(taken, 'coop')

    expect(major.needCredits).toBe(17)
    expect(major.doneCredits).toBe(17)
    expect(free.doneCredits).toBe(0)
  })

  it('กลุ่ม 1 ไม่ถึง 12 นก. ยังต้องไม่ครบ แม้กลุ่ม 2 จะเต็ม', () => {
    const taken = [
      '346-335', '346-336',
      '876-102', '308-231', '225-355',
    ].map((c) => course(c))

    const r = computeProgress(buildProgram('regular', 'ge2565'), taken, [])
    const g1 = r.requirements.find((x) => x.id === 'major_elec_g1')!
    const majorCat = r.categories.find((c) => c.category === 'major_elective')!

    expect(g1.doneCredits).toBe(6)
    expect(g1.status).toBe('partial')
    expect(majorCat.doneCredits).toBe(15)
  })
})
// วิชาในกลุ่ม 1 มีหน่วยกิตไม่เท่ากัน (เช่น 322-252 = 5 นก.) ทำให้ bucket g1 เก็บเกิน 12 นก.
// เศษที่เกินต้องถูกหักออกจาก bucket ที่เหลือ ไม่ใช่ทำให้ bucket นั้นขึ้น "บางส่วน" ทั้งที่ครบ 21 นก. แล้ว
describe('วิชาเลือกสาขา: bucket ที่เหลือต้องปรับตามหน่วยกิตที่กลุ่ม 1 เก็บได้จริง', () => {
  const overshoot = [
    '322-252', '346-335', '346-336', '346-341', // 5+3+3+3 = 14
    '875-309', '876-102', // 4+3 = 7
  ].map((c) => course(c))

  it('regular: กลุ่ม 1 14 นก. + กลุ่ม 2 7 นก. = 21 ต้องไม่ขึ้น partial', () => {
    const r = computeProgress(buildProgram('regular', 'ge2565'), overshoot, [])
    const g1 = r.requirements.find((x) => x.id === 'major_elec_g1')!
    const g2 = r.requirements.find((x) => x.id === 'major_elec_g2')!
    const cat = r.categories.find((c) => c.category === 'major_elective')!

    expect(g1.doneCredits).toBe(14)
    expect(g2.needCredits).toBe(7)
    expect(g2.doneCredits).toBe(7)
    expect(g2.status).toBe('done')
    expect(cat.needCredits).toBe(21)
    expect(cat.doneCredits).toBe(21)
  })

  it('coop: กลุ่ม 1 14 นก. + กลุ่ม 2 3 นก. = 17 ต้องไม่ขึ้น partial', () => {
    const taken = ['322-252', '346-335', '346-336', '346-341', '876-102'].map((c) => course(c))
    const r = computeProgress(buildProgram('coop', 'ge2565'), taken, [])
    const g2 = r.requirements.find((x) => x.id === 'major_elec_g2')!
    const cat = r.categories.find((c) => c.category === 'major_elective')!

    expect(g2.needCredits).toBe(3)
    expect(g2.status).toBe('done')
    expect(cat.needCredits).toBe(17)
    expect(cat.doneCredits).toBe(17)
  })
})
