import { describe, it, expect } from 'vitest'
import { buildProgram } from '@/lib/curriculum/program-2564'
import { SEED_6710210764 } from '@/lib/curriculum/seed-6710210764'
import { computeProgress, suggestNextTerm } from './progress'
import { GE_CATALOG } from '@/lib/curriculum/ge-catalog'
import type { TakenCourse } from '@/lib/types'

// BUG repro: options ของ GE choose ต้องครอบคลุม "ทุก" วิชาในแคตตาล็อกของกลุ่มนั้น
// ไม่งั้นนักศึกษาที่ลงวิชา GE ที่อยู่ในแคตตาล็อกแต่ไม่อยู่ใน subset จะถูกบอกว่า "ยังไม่ครบ"
describe('GE choose options ครอบคลุมทุกวิชาในแคตตาล็อก (regression "ลงแล้วแต่ไม่ครบ")', () => {
  const prog = buildProgram('regular', 'ge2565')
  const groups = ['GE1', 'GE2A', 'GE2B', 'GE3', 'GE4', 'GE5', 'GE6', 'GE7'] as const
  for (const g of groups) {
    it(`${g}: ทุกวิชาในแคตตาล็อกต้องอยู่ใน options`, () => {
      const reqDef = prog.requirements.find((r) => r.id === `ge:${g}`)!
      const optionCodes =
        reqDef.kind === 'choose' ? new Set(reqDef.options.map((o) => o.code)) : new Set<string>()
      const missing = GE_CATALOG.filter((c) => c.group === g && !optionCodes.has(c.code)).map(
        (c) => c.code,
      )
      expect(missing).toEqual([])
    })
  }
  it('ลง 142-026G3 (GE3 ในแคตตาล็อก เดิมหายจาก options) ต้องถูกนับว่า GE3 ครบ', () => {
    const taken: TakenCourse[] = [
      { code: '142-026G3', name: 'การเป็นผู้ประกอบการ', credits: 2, grade: 'A', term: '2/2568' },
    ]
    const r = computeProgress(prog, taken, [])
    expect(r.requirements.find((x) => x.id === 'ge:GE3')!.status).toBe('done')
  })
})

describe('computeProgress (เคสจริง 6710210764, regular + ge2565)', () => {
  const prog = buildProgram('regular', 'ge2565')
  const r = computeProgress(prog, SEED_6710210764, [])
  const cat = (c: string) => r.categories.find((x) => x.category === c)!
  const req = (id: string) => r.requirements.find((x) => x.id === id)!

  it('วิทย์พื้นฐาน 21/24 และขาด 346-361', () => {
    expect(cat('foundation').doneCredits).toBe(21)
    expect(cat('foundation').needCredits).toBe(24)
    expect(cat('foundation').missing.map((m) => m.code)).toContain('346-361')
  })

  it('วิชาบังคับ 26/57', () => {
    expect(cat('core').doneCredits).toBe(26)
    expect(cat('core').needCredits).toBe(57)
  })

  it('วิชาเลือกสาขา 0/21 (346-343 ติด W ไม่นับ)', () => {
    expect(cat('major_elective').doneCredits).toBe(0)
    expect(cat('major_elective').needCredits).toBe(21)
  })

  it('GE: GE1/GE2B/GE4/GE6/GE7 ผ่าน, GE2A ยังไม่ผ่าน (473-001G2A=E)', () => {
    expect(req('ge:GE1').status).toBe('done')
    expect(req('ge:GE2B').status).toBe('done')
    expect(req('ge:GE4').status).toBe('done')
    expect(req('ge:GE6').status).toBe('done')
    expect(req('ge:GE7').status).toBe('done')
    expect(req('ge:GE2A').status).not.toBe('done')
  })

  it('GE3/GE5 มี verifyNote (ลงรหัสเก่า 1 นก)', () => {
    expect(req('ge:GE3').verifyNote).toBeTruthy()
    expect(req('ge:GE5').verifyNote).toBeTruthy()
  })

  it('ไม่นับวิชาซ้ำซ้อน และ totalDone อยู่ในช่วงที่สมเหตุผล', () => {
    expect(r.totalDone).toBeGreaterThan(0)
    expect(r.totalDone).toBeLessThanOrEqual(r.program.totalCredits)
  })
})

describe('computeProgress (coop)', () => {
  it('แผนสหกิจ: เลือกสาขา need = 17, รวม 132', () => {
    const prog = buildProgram('coop', 'ge2565')
    const r = computeProgress(prog, SEED_6710210764, [])
    expect(r.categories.find((c) => c.category === 'major_elective')!.needCredits).toBe(17)
    expect(r.program.totalCredits).toBe(132)
  })
})

describe('computeProgress (preset สาระ 2564, 138 นก)', () => {
  const prog = buildProgram('regular', 'core2564')
  const r = computeProgress(prog, SEED_6710210764, [])
  const req = (id: string) => r.requirements.find((x) => x.id === id)!

  it('รวมหลักสูตร 138 และมีสาระ 1–7', () => {
    expect(prog.totalCredits).toBe(138)
    expect(req('sara:1')).toBeTruthy()
    expect(req('sara:7')).toBeTruthy()
  })
  it('สาระ 6 (ภาษา) ครบ, สาระ 5 ยังไม่ครบ (ขาดส่วนตัวเลข)', () => {
    expect(req('sara:6').status).toBe('done')
    expect(req('sara:5').status).not.toBe('done')
  })
  it('สาระ 1 ครบ (388-100 + 003-001 = 4)', () => {
    expect(req('sara:1').status).toBe('done')
  })
})

describe('suggestNextTerm', () => {
  it('แนะนำวิชาปี3เทอม1 ที่ยังไม่ผ่าน (รวม 346-321/346-322/346-331/346-361)', () => {
    const prog = buildProgram('regular', 'ge2565')
    const s = suggestNextTerm(prog, SEED_6710210764, [], { year: 3, term: 1 })
    const codes = s.recommended.map((x) => x.code)
    for (const c of ['346-321', '346-322', '346-331', '346-361']) expect(codes).toContain(c)
  })
})

// regression: ตรงข้อมูลทางการ sccheckgraduate — วิชาเลือกสาขา g1 ต้องมี 322-211
describe('regression sccheckgraduate: 322-211 นับเป็นวิชาเลือกสาขา g1', () => {
  const prog = buildProgram('regular', 'ge2565')
  it('322-211 อยู่ในเซต g1 และถูกนับเมื่อผ่าน', () => {
    const taken: TakenCourse[] = [
      { code: '322-211', name: 'หลักการคณิตศาสตร์', credits: 3, grade: 'B', term: '1/2568' },
    ]
    const r = computeProgress(prog, taken, [])
    expect(cat(r, 'major_elective').doneCredits).toBe(3)
  })
  function cat(r: ReturnType<typeof computeProgress>, c: string) {
    return r.categories.find((x) => x.category === c)!
  }
})

// regression: สาระ 7 (core2564) options ต้องครบตามทางการ — เคยมีแค่ 9 จาก 33 รหัส
describe('regression sccheckgraduate: สาระ 7 options ครบ (core2564)', () => {
  const prog = buildProgram('regular', 'core2564')
  const req = prog.requirements.find((r) => r.id === 'sara:7')!
  const opts = req.kind === 'choose' ? new Set(req.options.map((o) => o.code)) : new Set<string>()
  // ตัวอย่างรหัสที่เคยหายไป
  for (const code of ['895-022', '895-025', '895-038', '142-135', '472-116', '315-102']) {
    it(`${code} อยู่ใน sara:7 options`, () => {
      expect(opts.has(code)).toBe(true)
    })
  }
})
