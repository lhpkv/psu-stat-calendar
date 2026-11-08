import type { Program, Requirement, Category } from '@/lib/curriculum/types'
import type { TakenCourse, Override } from '@/lib/types'
import { ALL_COURSES } from '@/lib/curriculum/catalog'
import { assign } from './match'

export interface MissingItem {
  code: string
  name: string
  credits: number
}

export interface ReqResult {
  id: string
  label: string
  category: Category
  kind: Requirement['kind']
  needCredits: number
  doneCredits: number
  status: 'done' | 'partial' | 'none'
  matched: TakenCourse[]
  missing: MissingItem[]
  verifyNote?: string
}

export interface CategoryResult {
  category: Category
  needCredits: number
  doneCredits: number
  requirements: ReqResult[]
  missing: MissingItem[]
}

export interface ProgressResult {
  program: Program
  requirements: ReqResult[]
  categories: CategoryResult[]
  totalNeed: number
  totalDone: number
  extra: TakenCourse[]
}

const CATEGORY_ORDER: Category[] = ['foundation', 'core', 'major_elective', 'ge', 'free_elective']

export const CATEGORY_LABEL: Record<Category, string> = {
  foundation: 'วิชาวิทยาศาสตร์พื้นฐาน',
  core: 'วิชาบังคับ',
  major_elective: 'วิชาเลือกสาขา',
  ge: 'ศึกษาทั่วไป (GE)',
  free_elective: 'วิชาเลือกเสรี',
}

function reqNeed(r: Requirement): number {
  return r.kind === 'fixed' ? r.credits : r.needCredits
}

export function computeProgress(
  program: Program,
  taken: TakenCourse[],
  overrides: Override[],
): ProgressResult {
  const m = assign(program, taken, overrides)

  const credited = (id: string) =>
    (m.byRequirement.get(id) ?? []).reduce((s, t) => s + t.credits, 0)

  const requirements: ReqResult[] = program.requirements.map((r) => {
    const matched = m.byRequirement.get(r.id) ?? []
    const doneCredits = matched.reduce((s, t) => s + t.credits, 0)
    // bucket "ส่วนที่เหลือ": ต้องใช้ยอดจริงของบล็อกรวม ไม่ใช่ตัวเลขคงที่
    // เช่น กลุ่ม 1 เก็บได้ 14 นก. (วิชา 5 นก.) → bucket ที่เหลือต้องการแค่ 7 นก.
    const need =
      r.kind === 'bucket' && r.remainderOf
        ? Math.min(
            r.needCredits,
            Math.max(0, r.remainderOf.total - credited(r.remainderOf.dependsOn)),
          )
        : reqNeed(r)
    const status: ReqResult['status'] =
      doneCredits >= need ? 'done' : doneCredits > 0 ? 'partial' : 'none'
    const missing: MissingItem[] =
      r.kind === 'fixed' && status !== 'done'
        ? [{ code: r.courseCodes[0], name: ALL_COURSES[r.courseCodes[0]]?.name ?? r.courseCodes[0], credits: r.credits }]
        : []
    return {
      id: r.id,
      label: r.label,
      category: r.category,
      kind: r.kind,
      needCredits: need,
      doneCredits,
      status,
      matched,
      missing,
      verifyNote: r.verifyNote,
    }
  })

  const categories: CategoryResult[] = CATEGORY_ORDER.map((category) => {
    const rs = requirements.filter((r) => r.category === category)
    // ยอดที่ต้องได้ของหมวดใช้ค่าคงที่ของหลักสูตร (21/17 นก.) ไม่ใช่ need แบบไดนามิกของ bucket
    const needCredits = program.requirements
      .filter((r) => r.category === category)
      .reduce((s, r) => s + reqNeed(r), 0)
    const doneCredits = Math.min(rs.reduce((s, r) => s + r.doneCredits, 0), needCredits)
    const missing = rs.flatMap((r) => r.missing)
    return { category, needCredits, doneCredits, requirements: rs, missing }
  })

  const totalDone = Math.min(
    categories.reduce((s, c) => s + c.doneCredits, 0),
    program.totalCredits,
  )

  return {
    program,
    requirements,
    categories,
    totalNeed: program.totalCredits,
    totalDone,
    extra: m.extra,
  }
}

export interface NextTermItem {
  code: string
  name: string
  credits: number
  reason: string
}
export interface NextTermResult {
  recommended: NextTermItem[]
  carryOver: { code: string; name: string; reason: string }[]
}

/** แนะนำวิชาที่ควรลงเทอมถัดไป อิงแผนปี/เทอม + วิชาที่ยังไม่ผ่าน */
export function suggestNextTerm(
  program: Program,
  taken: TakenCourse[],
  overrides: Override[],
  at: { year: number; term: number },
): NextTermResult {
  const r = computeProgress(program, taken, overrides)
  const byId = new Map(r.requirements.map((x) => [x.id, x]))
  const recommended: NextTermItem[] = []

  for (const req of program.requirements) {
    if (req.kind !== 'fixed') continue
    const res = byId.get(req.id)
    if (res?.status === 'done') continue
    const ry = req.recYear
    const rt = req.recTerm ?? 1
    // ควรลงถ้าแผนกำหนดให้เรียนภายในเทอมนี้หรือก่อนหน้า (คงค้าง)
    const dueNow = ry == null || ry < at.year || (ry === at.year && rt <= at.term)
    if (!dueNow) continue
    const carry = ry != null && (ry < at.year || (ry === at.year && rt < at.term))
    recommended.push({
      code: req.courseCodes[0],
      name: ALL_COURSES[req.courseCodes[0]]?.name ?? req.courseCodes[0],
      credits: req.credits,
      reason: carry ? 'คงค้างจากเทอมก่อน' : 'ตามแผนเทอมนี้',
    })
  }

  const carryOver: NextTermResult['carryOver'] = []
  const me = r.categories.find((c) => c.category === 'major_elective')
  if (me && me.doneCredits < me.needCredits) {
    carryOver.push({
      code: '(วิชาเลือกสาขา)',
      name: `ยังต้องอีก ${me.needCredits - me.doneCredits} นก`,
      reason: 'ควรเริ่มทยอยลงวิชาเลือกสาขา',
    })
  }
  // เตือน choose-requirement ที่ยังไม่ครบและถึงกำหนดแล้ว (เช่น GE2A ที่สอบตก)
  for (const req of program.requirements) {
    if (req.kind !== 'choose') continue
    const res = byId.get(req.id)
    if (res?.status === 'done') continue
    const ry = req.recYear
    const rt = req.recTerm ?? 1
    const dueNow = ry == null || ry < at.year || (ry === at.year && rt <= at.term)
    if (dueNow) carryOver.push({ code: req.id.replace('ge:', ''), name: req.label, reason: 'ยังไม่ครบ ควรลงให้ครบ' })
  }

  return { recommended, carryOver }
}
