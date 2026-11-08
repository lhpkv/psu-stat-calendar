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

export interface StudyPlanOptions {
  fromYear?: number
  toYear?: number
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