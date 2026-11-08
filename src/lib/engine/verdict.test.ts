import { describe, it, expect } from 'vitest'
import { buildProgram } from '@/lib/curriculum/program-2564'
import { SEED_6710210764 } from '@/lib/curriculum/seed-6710210764'
import { computeProgress } from './progress'
import { buildVerdict } from './verdict'

const progress = computeProgress(buildProgram('regular', 'ge2565'), SEED_6710210764, [])

describe('buildVerdict (คำนวณผลตรวจจากข้อมูลในเครื่อง ไม่เรียก scmis)', () => {
  it('สรุปหน่วยกิตตรงกับ computeProgress', () => {
    const v = buildVerdict(progress)
    expect(v.totalNeed).toBe(progress.totalNeed)
    expect(v.totalDone).toBe(progress.totalDone)
  })

  it('มีครบทุกหมวดที่มีหน่วยกิตต้องได้', () => {
    const v = buildVerdict(progress)
    const cats = v.categories.map((c) => c.category)
    expect(cats).toEqual(['foundation', 'core', 'major_elective', 'ge', 'free_elective'])
  })

  it('วิชาบังคับที่ยังไม่ผ่านต้องอยู่ในรายการคงค้าง พร้อมรหัสวิชา', () => {
    const v = buildVerdict(progress)
    const found = v.categories.find((c) => c.category === 'foundation')!
    expect(found.remaining.some((r) => r.code === '346-361')).toBe(true)
  })

  it('รายการที่ครบแล้วต้องไม่ถูกใส่ใน remaining', () => {
    const v = buildVerdict(progress)
    const foundation = v.categories.find((c) => c.category === 'foundation')!
    const done = progress.requirements.filter((r) => r.category === 'foundation' && r.status === 'done')
    expect(done.length).toBeGreaterThan(0)
    for (const r of done) {
      expect(foundation.remaining.some((x) => x.code === `fixed:${x.code}`)).toBe(false)
      expect(foundation.remaining.some((x) => x.label === r.label)).toBe(false)
    }
  })

  it('bucket/choose ที่ยังไม่ครบต้องบอกจำนวนนก.ที่ขาด', () => {
    const v = buildVerdict(progress)
    const major = v.categories.find((c) => c.category === 'major_elective')!
    const bucket = major.remaining.find((r) => (r.missingCredits ?? 0) > 0)
    expect(bucket).toBeTruthy()
  })
})