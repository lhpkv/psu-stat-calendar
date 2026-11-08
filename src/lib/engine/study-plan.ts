import type { Requirement } from '@/lib/curriculum/types'
import type { ProgressResult, ReqResult } from './progress'

export interface StudyPlanItem {
  id: string
  kind: Requirement['kind']
  /** รหัสวิชา (เฉพาะวิชาบังคับ) */
  code?: string
  name: string
  /** หน่วยกิตที่ต้องเก็บในเทอมนี้ (bucket/choose = ที่ยังขาด) */
  credits: number
}

export interface StudyPlanTerm {
  year: number
  term: number
  items: StudyPlanItem[]
  credits: number
}

export interface StudyPlanSplit {
  /** วิชาที่ควรลงก่อนปี/เทอมปัจจุบันแต่ยังไม่ผ่าน */
  overdue: StudyPlanTerm[]
  /** วิชาที่เหลือตั้งแต่ปี/เทอมปัจจุบันเป็นต้นไป */
  upcoming: StudyPlanTerm[]
}

/** แยกแผนตามชั้นปี/เทอมปัจจุบัน — รองรับนักศึกษาที่อยู่คนละปี (2, 3, 4) */
export function splitStudyPlan(
  plan: StudyPlanTerm[],
  at: { year: number; term: number },
): StudyPlanSplit {
  const overdue: StudyPlanTerm[] = []
  const upcoming: StudyPlanTerm[] = []

  for (const item of plan) {
    if (item.year < at.year || (item.year === at.year && item.term < at.term)) {
      overdue.push(item)
    } else {
      upcoming.push(item)
    }
  }

  return { overdue, upcoming }
}

export interface StudyPlanOptions {
  fromYear?: number
  toYear?: number
}

/**
 * เดาชั้นปีปัจจุบันจากเทอมแรกที่นักศึกษาลงทะเบียน (ปีที่รับเข้า)
 * เช่น รับเข้า 2567 และปัจจุบัน 2569 → ปี 3 (ไม่เกิน 4)
 */
export function inferCurrentYear(
  taken: { term: string }[],
  nowAcademicYear = new Date().getFullYear() + 543,
): number | null {
  const years = taken
    .map((t) => Number((t.term || '').split('/')[1]))
    .filter((y) => Number.isInteger(y) && y >= 2500)

  if (years.length === 0) return null

  const admissionYear = Math.min(...years)
  return Math.min(4, Math.max(1, nowAcademicYear - admissionYear + 1))
}

function toItem(req: Requirement, res: ReqResult): StudyPlanItem | null {
  if (req.kind === 'fixed') {
    return {
      id: req.id,
      kind: req.kind,
      code: req.courseCodes[0],
      name: req.label,
      credits: res.needCredits,
    }
  }

  const remaining = Math.max(0, res.needCredits - res.doneCredits)
  if (remaining === 0) return null
  return { id: req.id, kind: req.kind, name: req.label, credits: remaining }
}

/**
 * แผนการลงทะเบียนที่เหลือถึงจบ สำหรับช่วงชั้นปีที่กำหนด (ค่าเริ่มต้น ปี 2–4)
 * อิง recYear/recTerm ของแต่ละ requirement และตัดวิชาที่ผ่านแล้วออก
 */
export function buildStudyPlan(
  progress: ProgressResult,
  opts: StudyPlanOptions = {},
): StudyPlanTerm[] {
  const fromYear = opts.fromYear ?? 2
  const toYear = opts.toYear ?? 4
  const resultById = new Map(progress.requirements.map((r) => [r.id, r]))
  const byTerm = new Map<string, StudyPlanTerm>()

  for (const req of progress.program.requirements) {
    const res = resultById.get(req.id)
    if (!res || res.status === 'done') continue

    const year = req.recYear
    const term = req.recTerm ?? 1
    if (year == null || year < fromYear || year > toYear) continue

    const item = toItem(req, res)
    if (!item) continue

    const key = `${year}-${term}`
    const bucket = byTerm.get(key) ?? { year, term, items: [], credits: 0 }
    bucket.items.push(item)
    bucket.credits += item.credits
    byTerm.set(key, bucket)
  }

  return [...byTerm.values()].sort((a, b) => a.year - b.year || a.term - b.term)
}