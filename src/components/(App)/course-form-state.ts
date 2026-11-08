import type { TakenCourse } from '@/lib/types'

export interface CourseFormValues {
  code: string
  name: string
  credits: string
  grade: string
  term: string
  section: string
}

export const EMPTY_FORM: CourseFormValues = {
  code: '',
  name: '',
  credits: '',
  grade: 'A',
  term: '',
  section: '',
}

/** ค่าเริ่มต้นของฟอร์ม — ต้องเรียกใหม่ทุกครั้งที่เปิด dialog เพื่อไม่ให้ค่าเดิมค้าง */
export function formValuesFrom(initial?: TakenCourse): CourseFormValues {
  if (!initial) return { ...EMPTY_FORM }
  return {
    code: initial.code,
    name: initial.name,
    credits: String(initial.credits),
    grade: initial.grade ?? 'A',
    term: initial.term,
    section: initial.section ?? '',
  }
}

export interface AutoFilled {
  name: string
  credits: string
}

/**
 * เติมชื่อ/หน่วยกิตจากรหัสที่รู้จัก โดยไม่ทับค่าที่ผู้ใช้พิมพ์เอง:
 * ทับได้เฉพาะช่องที่ว่าง หรือค่าที่มาจากการเติมอัตโนมัติครั้งก่อน
 * (ถ้ารหัสใหม่ไม่รู้จัก ให้ล้างค่าที่เคยเติมให้ เพื่อไม่ให้ชื่อวิชาเก่าค้าง)
 */
export function applyCourseLookup(
  values: CourseFormValues,
  found: { name: string; credits: number } | null | undefined,
  lastAuto: AutoFilled | null,
): CourseFormValues {
  if (!found) {
    if (!lastAuto) return values
    return {
      ...values,
      name: values.name === lastAuto.name ? '' : values.name,
      credits: values.credits === lastAuto.credits ? '' : values.credits,
    }
  }
  return {
    ...values,
    name: !values.name || values.name === lastAuto?.name ? found.name : values.name,
    credits:
      !values.credits || values.credits === lastAuto?.credits
        ? String(found.credits)
        : values.credits,
  }
}

/** หน่วยกิตต้องเป็นตัวเลขจำกัดและไม่ติดลบ (ค่าว่างใช้ไม่ได้) */
export function isValidCredits(value: string): boolean {
  if (!value.trim()) return false
  const n = Number(value)
  return Number.isFinite(n) && n >= 0
}

/**
 * แปลงค่าฟอร์มเป็น TakenCourse สำหรับบันทึก
 * - section ใช้ '' (ไม่ใช่ undefined) เพื่อให้ updateTaken ล้างค่าเดิมได้จริง
 * - คง id เดิมเมื่อเป็นการแก้ไข
 */
export function toCoursePayload(form: CourseFormValues, initial?: TakenCourse): TakenCourse {
  return {
    id: initial?.id,
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    credits: Number(form.credits),
    grade: form.grade,
    term: form.term.trim(),
    section: form.section.trim(),
  }
}