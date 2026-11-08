import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseStructure } from './parse-structure'

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

describe('parseStructure — รูปแบบหน้าจริงที่ parser เดิมตกหล่น', () => {
  it('เกรด+เทอมอยู่ในบรรทัดเดียวกับชื่อวิชา (วิชาเลือกเสรี) ต้องถูกอ่าน', () => {
    const html = `<tr><td></td><td></td><td align=right>1.</td><td colspan=2>
145-101  COMPANION ANIMALS (3) A(1/2567)
    </td><td>
        <span></span>
    </td></tr>`

    expect(parseStructure(html).courses).toContainEqual(
      expect.objectContaining({ code: '145-101', name: 'COMPANION ANIMALS', credits: 3, grade: 'A', taken: true }),
    )
  })

  it('หลายครั้งที่ลง (E แล้วสอบซ้ำได้ C) ต้องเลือกเกรดที่ผ่าน', () => {
    const html = `<tr><td></td><td></td><td align=right>2.</td><td colspan=2>
890-102G1  EVERYDAY ENGLISH (2) E(2/2567),C(2/2568)
    </td><td>
        <span></span>
    </td></tr>`

    expect(parseStructure(html).courses.find((c) => c.code === '890-102G1')).toMatchObject({
      credits: 2,
      grade: 'C',
      taken: true,
    })
  })

  it('เกรด+เทอมที่อยู่ในช่องสถานะ (ไม่ใช่ช่องชื่อ) ต้องถูกอ่าน', () => {
    const html = `<tr><td></td><td></td><td align=right>1.</td><td colspan=2>145-101  COMPANION ANIMALS (3)</td><td>A(1/2567)</td></tr>`

    expect(parseStructure(html).courses.find((c) => c.code === '145-101')).toMatchObject({
      grade: 'A',
      taken: true,
    })
  })

  it('เกรดโอน Y/Q (เทียบโอนรายวิชา) ต้องถือว่านับแล้ว', () => {
    const html = `
<tr><td></td><td></td><td align=right>1.</td><td colspan=2>145-101  COMPANION ANIMALS (3)</td><td>Y</td></tr>
<tr><td></td><td></td><td align=right>2.</td><td colspan=2>890-102G1  EVERYDAY ENGLISH (2)</td><td>Q</td></tr>`

    const s = parseStructure(html)
    expect(s.courses.find((c) => c.code === '145-101')).toMatchObject({ grade: 'Y', taken: true })
    expect(s.courses.find((c) => c.code === '890-102G1')).toMatchObject({ grade: 'Q', taken: true })
  })

  it('แถวที่ลงทะเบียนแล้วแต่ยังไม่มีเกรด (มีเทอมอย่างเดียว + [Reg]) ต้องไม่หายไป', () => {
    const html = `<tr><td></td><td></td><td align=right>7.</td><td colspan=2>
346-435  INTRO TO STATISTICAL MODELS (3) (1/2569)
    </td><td>
        <!-- <span style="background-color:red;"></span> -->
        <span>[Reg]</span>
    </td></tr>`

    expect(parseStructure(html).courses.find((c) => c.code === '346-435')).toMatchObject({
      credits: 3,
      grade: '',
      taken: false,
    })
  })
})
