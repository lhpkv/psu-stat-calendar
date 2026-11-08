import { describe, it, expect } from 'vitest'
import { buildProgram } from '@/lib/curriculum/program-2564'
import { SEED_6710210764 } from '@/lib/curriculum/seed-6710210764'
import { computeProgress } from './progress'
import { buildStudyPlan } from './study-plan'

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