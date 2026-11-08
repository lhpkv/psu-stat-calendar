import type { Category } from '@/lib/curriculum/types'
import { CATEGORY_LABEL, type ProgressResult, type ReqResult } from './progress'

export interface VerdictRemaining {
  /** รหัสวิชา (เฉพาะ requirement แบบ fixed) */
  code?: string
  label: string
  /** หน่วยกิตที่ยังขาด (เฉพาะ choose/bucket) */
  missingCredits?: number
}

export interface VerdictCategory {
  category: Category
  label: string
  doneCredits: number
  needCredits: number
  remaining: VerdictRemaining[]
}

export interface CurriculumVerdict {
  totalDone: number
  totalNeed: number
  categories: VerdictCategory[]
}

function remainingOf(req: ReqResult): VerdictRemaining {
  if (req.kind === 'fixed') {
    const m = req.missing[0]
    return { code: m?.code, label: m?.name ?? req.label }
  }
  return { label: req.label, missingCredits: Math.max(0, req.needCredits - req.doneCredits) }
}

/**
 * สรุป "ผลตรวจสอบหลักสูตร" จากข้อมูลที่ผู้ใช้มีอยู่แล้ว (taken_courses + หลักสูตร)
 * โดยไม่เรียก API ของมหาวิทยาลัย — รายการคงค้างมาจาก computeProgress ชุดเดียวกับที่แอปแสดง
 */
export function buildVerdict(progress: ProgressResult): CurriculumVerdict {
  const categories = progress.categories
    .filter((c) => c.needCredits > 0)
    .map((c) => ({
      category: c.category,
      label: CATEGORY_LABEL[c.category],
      doneCredits: c.doneCredits,
      needCredits: c.needCredits,
      remaining: c.requirements.filter((r) => r.status !== 'done').map(remainingOf),
    }))

  return {
    totalDone: progress.totalDone,
    totalNeed: progress.totalNeed,
    categories,
  }
}