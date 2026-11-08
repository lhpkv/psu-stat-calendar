import { describe, it, expect } from 'vitest'
import {
  formValuesFrom,
  applyCourseLookup,
  isValidCredits,
  toCoursePayload,
  type CourseFormValues,
} from './course-form-state'

const filled = (patch: Partial<CourseFormValues> = {}): CourseFormValues => ({
  code: '',
  name: '',
  credits: '',
  grade: 'A',
  term: '',
  section: '',
  ...patch,
})

describe('formValuesFrom', () => {
  it('แมปค่าจากรายวิชาที่แก้ไข พร้อมค่าเริ่มต้น', () => {
    expect(
      formValuesFrom({ id: 'x', code: '346-335', name: 'EDA', credits: 3, grade: 'B+', term: '1/2568', section: '01' }),
    ).toEqual({ code: '346-335', name: 'EDA', credits: '3', grade: 'B+', term: '1/2568', section: '01' })
  })

  it('ฟอร์มเพิ่มวิชาใหม่เริ่มว่างเสมอ (เปิดใหม่หลังบันทึกต้องไม่ค้างค่าเดิม)', () => {
    expect(formValuesFrom()).toEqual({ code: '', name: '', credits: '', grade: 'A', term: '', section: '' })
  })

  it('แก้ไขวิชาที่ยังไม่มีเกรดต้องคงเกรดว่างไว้ ไม่แปลงเป็น A', () => {
    const out = formValuesFrom({
      id: 'x', code: '346-435', name: 'INTRO TO STATISTICAL MODELS', credits: 3, grade: '', term: '1/2569',
    })
    expect(out.grade).toBe('')
  })
})

describe('applyCourseLookup', () => {
  const foundA = { name: 'LONGITUDINAL DATA ANALYSIS', credits: 3 }
  const foundB = { name: 'CATEGORICAL DATA ANALYSIS', credits: 4 }

  it('เติมชื่อ/หน่วยกิตเมื่อช่องว่าง', () => {
    const out = applyCourseLookup(filled({ code: '346-335' }), foundA, null)
    expect(out).toMatchObject({ name: 'LONGITUDINAL DATA ANALYSIS', credits: '3' })
  })

  it('เปลี่ยนรหัสเป็นวิชาอื่นแล้วต้องทับค่า autofill เดิม (บั๊กชื่อ/หน่วยกิตค้าง)', () => {
    const lastAuto = { name: foundA.name, credits: '3' }
    const afterA = applyCourseLookup(filled({ code: '346-335' }), foundA, null)

    const afterB = applyCourseLookup({ ...afterA, code: '346-336' }, foundB, lastAuto)

    expect(afterB).toMatchObject({ name: 'CATEGORICAL DATA ANALYSIS', credits: '4' })
  })

  it('ไม่ทับชื่อที่ผู้ใช้พิมพ์เอง', () => {
    const lastAuto = { name: foundA.name, credits: '3' }
    const edited = filled({ code: '346-336', name: 'ชื่อที่ฉันแก้เอง', credits: '3' })

    const out = applyCourseLookup(edited, foundB, lastAuto)

    expect(out.name).toBe('ชื่อที่ฉันแก้เอง')
    expect(out.credits).toBe('4')
  })

  it('พิมพ์รหัสที่ไม่รู้จักแล้วล้างค่า autofill เดิม', () => {
    const lastAuto = { name: foundA.name, credits: '3' }
    const out = applyCourseLookup(filled({ code: '999-999', name: foundA.name, credits: '3' }), undefined, lastAuto)

    expect(out).toMatchObject({ name: '', credits: '' })
  })
})

describe('isValidCredits', () => {
  it('รับค่าจำนวนเต็ม/ทศนิยมที่ไม่ติดลบ', () => {
    expect(isValidCredits('3')).toBe(true)
    expect(isValidCredits('0')).toBe(true)
    expect(isValidCredits('2.5')).toBe(true)
  })

  it('ปฏิเสธค่าว่าง ค่าติดลบ และข้อความ', () => {
    expect(isValidCredits('')).toBe(false)
    expect(isValidCredits('  ')).toBe(false)
    expect(isValidCredits('-3')).toBe(false)
    expect(isValidCredits('abc')).toBe(false)
    expect(isValidCredits('Infinity')).toBe(false)
  })
})
describe('toCoursePayload', () => {
  it('ล้างตอนแล้วส่งเป็นค่าว่าง ไม่ใช่ undefined (repository ต้องอัปเดตค่าทิ้งได้)', () => {
    const payload = toCoursePayload(filled({ code: ' 346-335 ', name: ' EDA ', credits: '3', term: '1/2569', section: '' }))
    expect(payload.section).toBe('')
    expect(payload.code).toBe('346-335')
    expect(payload.name).toBe('EDA')
    expect(payload.credits).toBe(3)
  })

  it('คง id เดิมไว้เมื่อเป็นการแก้ไข', () => {
    const payload = toCoursePayload(
      filled({ code: '346-335', credits: '3', term: '1/2569' }),
      { id: 'row-1', code: '346-335', name: 'x', credits: 3, grade: 'A', term: '1/2569' },
    )
    expect(payload.id).toBe('row-1')
  })
})
