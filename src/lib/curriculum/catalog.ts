import { COURSES } from './courses'
import type { CourseInfo } from './types'

/**
 * แคตตาล็อกวิชาเฉพาะหลักสูตรสถิติ 2564
 * สำหรับ lookup ชื่อ/หน่วยกิตโดยไม่ผูกกับสาขา
 */
export const ALL_COURSES: Record<string, CourseInfo> = { ...COURSES }
