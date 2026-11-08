import { describe, it, expect } from 'vitest'
import { buildProgram } from '@/lib/curriculum/program-2564'
import { computeProgress } from './progress'
import type { TakenCourse } from '@/lib/types'

const take = (code: string, name: string): TakenCourse => ({
  code,
  name,
  credits: 3,
  grade: 'D',
  term: '1/2567',
})

// มหาวิทยาลัยเปลี่ยนรหัสวิชาบางวิชา — ต้องเทียบด้วยชื่อได้ด้วย ไม่ใช่รหัสอย่างเดียว
describe('จับคู่รายวิชาด้วยรหัสหรือชื่อ', () => {
  it('รหัสไม่รู้จักแต่ชื่อตรงกับวิชาบังคับ → นับว่าผ่าน', () => {
    const r = computeProgress(
      buildProgram('regular', 'ge2565'),
      [take('999-999', 'CALCULUS I')],
      [],
    )
    const req = r.requirements.find((x) => x.id === 'fixed:322-101')!
    expect(req.status).toBe('done')
    expect(req.matched[0].code).toBe('999-999')
  })

  it('รหัสไม่รู้จักและชื่อไม่ตรง → ยังไม่ผ่าน', () => {
    const r = computeProgress(
      buildProgram('regular', 'ge2565'),
      [take('999-999', 'UNRELATED COURSE')],
      [],
    )
    expect(r.requirements.find((x) => x.id === 'fixed:322-101')!.status).toBe('none')
  })
})