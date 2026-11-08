import { describe, it, expect } from 'vitest'
import { buildProgram } from '@/lib/curriculum/program-2564'
import { SEED_6710210764 } from '@/lib/curriculum/seed-6710210764'
import { computeProgress } from './progress'
import { buildStudyPlan, splitStudyPlan, inferCurrentYear } from './study-plan'

const program = buildProgram('regular', 'ge2565')
const emptyPlan = buildStudyPlan(computeProgress(program, [], []), { fromYear: 2, toYear: 4 })
const termOf = (y: number, t: number) => emptyPlan.find((x) => x.year === y && x.term === t)
const allItems = emptyPlan.flatMap((t) => t.items)

describe('buildStudyPlan — แผนครอบคลุมปี 2–4', () => {
  it('มีเฉพาะปี 2–4 และเรียงตามปี/เทอม', () => {
    expect(emptyPlan.every((t) => t.year >= 2 && t.year <= 4)).toBe(true)
    const keys = emptyPlan.map((t) => t.year * 10 + t.term)
    expect(keys).toEqual([...keys].sort((a, b) => a - b))
  })

  it('วิชาบังคับอยู่ปี/เทอมตามแผนการเรียน', () => {
    expect(termOf(2, 1)!.items.some((i) => i.code === '346-221')).toBe(true)
    expect(termOf(4, 2)!.items.some((i) => i.code === '346-492')).toBe(true)
  })

  it('วิชาเลือกสาขา/เลือกเสรีปรากฏพร้อมหน่วยกิตที่ยังขาด', () => {
    const major = allItems.find((i) => i.id === 'major_elec_g1')!
    const free = allItems.find((i) => i.id === 'free')!
    expect(major.credits).toBe(12)
    expect(free.credits).toBe(6)
  })

  it('วิชาที่ผ่านแล้วต้องไม่ถูกใส่ในแผน', () => {
    const p = computeProgress(program, SEED_6710210764, [])
    const plan = buildStudyPlan(p, { fromYear: 2, toYear: 4 })
    const codes = plan.flatMap((t) => t.items.map((i) => i.code))
    expect(codes).not.toContain('346-221') // ผ่านแล้วใน seed
    expect(codes).toContain('346-361') // ยังไม่ผ่าน (ปี 3 เทอม 1)
  })

  it('ผลรวมหน่วยกิตของแต่ละเทอมตรงกับรายการ', () => {
    for (const t of emptyPlan) {
      expect(t.credits).toBe(t.items.reduce((s, i) => s + i.credits, 0))
    }
  })
})
describe('splitStudyPlan — แยกคงค้างตามชั้นปีปัจจุบัน', () => {
  const all = buildStudyPlan(computeProgress(buildProgram('regular', 'ge2565'), [], []), {
    fromYear: 1,
    toYear: 4,
  })

  it('ปี 2: วิชาปี 1 เป็นคงค้าง ที่เหลือเป็นแผนข้างหน้า', () => {
    const { overdue, upcoming } = splitStudyPlan(all, { year: 2, term: 1 })
    expect(overdue.every((t) => t.year < 2)).toBe(true)
    expect(overdue.length).toBeGreaterThan(0)
    expect(upcoming.every((t) => t.year > 2 || (t.year === 2 && t.term >= 1))).toBe(true)
  })

  it('ปี 3: วิชาปี 1–2 คงค้าง, ปี 3–4 อยู่ในแผนข้างหน้า', () => {
    const { overdue, upcoming } = splitStudyPlan(all, { year: 3, term: 1 })
    expect(overdue.every((t) => t.year < 3)).toBe(true)
    expect(upcoming.some((t) => t.year === 3)).toBe(true)
    expect(upcoming.some((t) => t.year === 4)).toBe(true)
  })

  it('ปี 4: ทุกอย่างก่อนปี 4 เป็นคงค้าง', () => {
    const { overdue, upcoming } = splitStudyPlan(all, { year: 4, term: 1 })
    expect(overdue.every((t) => t.year < 4)).toBe(true)
    expect(upcoming.every((t) => t.year === 4)).toBe(true)
  })

  it('แยกได้ครบ ไม่มีเทอมหาย', () => {
    const { overdue, upcoming } = splitStudyPlan(all, { year: 3, term: 1 })
    expect(overdue.length + upcoming.length).toBe(all.length)
  })
})

describe('inferCurrentYear — เดาชั้นปีจากเทอมแรกที่ลงทะเบียน', () => {
  const t = (term: string) => ({ term })

  it('รับ 2567 และปัจจุบัน 2569 → ปี 3', () => {
    expect(inferCurrentYear([t('1/2567'), t('2/2568')], 2569)).toBe(3)
  })

  it('รับ 2567 และปัจจุบัน 2568 → ปี 2', () => {
    expect(inferCurrentYear([t('1/2567')], 2568)).toBe(2)
  })

  it('ไม่เกินปี 4', () => {
    expect(inferCurrentYear([t('1/2560')], 2569)).toBe(4)
  })

  it('ไม่มีข้อมูลเทอม → null', () => {
    expect(inferCurrentYear([], 2569)).toBeNull()
  })
})
