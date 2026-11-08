import { describe, it, expect } from 'vitest'
import { termYear, admissionYearOf, studyYearOfTerm } from './term-year'

const t = (term: string) => ({ term })

describe('termYear', () => {
  it('อ่านปี พ.ศ. จากเทอม', () => {
    expect(termYear('1/2567')).toBe(2567)
    expect(termYear('3/2568')).toBe(2568)
  })

  it('เทอมผิดรูปแบบ → null', () => {
    expect(termYear('')).toBeNull()
    expect(termYear('เทอม 1')).toBeNull()
  })
})

describe('admissionYearOf', () => {
  it('ใช้ปีของเทอมแรกสุดที่ลงทะเบียน', () => {
    expect(admissionYearOf([t('2/2568'), t('1/2567'), t('1/2568')])).toBe(2567)
  })

  it('ไม่มีข้อมูล → null', () => {
    expect(admissionYearOf([])).toBeNull()
  })
})

describe('studyYearOfTerm', () => {
  it('รับเข้า 2567: เทอมในปี 2567 = ชั้นปี 1, ปี 2568 = ชั้นปี 2', () => {
    expect(studyYearOfTerm('1/2567', 2567)).toBe(1)
    expect(studyYearOfTerm('3/2567', 2567)).toBe(1)
    expect(studyYearOfTerm('2/2568', 2567)).toBe(2)
    expect(studyYearOfTerm('1/2569', 2567)).toBe(3)
  })

  it('ไม่มีปีรับเข้า/เทอมผิด → null', () => {
    expect(studyYearOfTerm('1/2567', null)).toBeNull()
    expect(studyYearOfTerm('bad', 2567)).toBeNull()
  })
})