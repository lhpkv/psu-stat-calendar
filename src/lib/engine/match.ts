import type { Program } from '@/lib/curriculum/types'
import type { TakenCourse, Override } from '@/lib/types'
import { isPass, bestAttempt } from './grades'
import { normalizeCode } from './normalize'
import { MAJOR_G1_CODES, MAJOR_G2_CODES } from '@/lib/curriculum/program-2564'
import { GE_BY_CODE } from '@/lib/curriculum/ge-catalog'
import type { BucketKind } from '@/lib/curriculum/types'

export interface MatchResult {
  /** requirementId → รายวิชาที่ถูกนับให้ */
  byRequirement: Map<string, TakenCourse[]>
  /** key 'CODE|term' ที่ถูกใช้ไปแล้ว */
  used: Set<string>
  /** วิชาที่ผ่านแต่ไม่เข้าเงื่อนไขใด */
  extra: TakenCourse[]
}

const keyOf = (t: TakenCourse) => `${normalizeCode(t.code)}|${t.term}`

function eligibleForBucket(elig: BucketKind, code: string): boolean {
  const c = normalizeCode(code)
  if (elig === 'major_elec_g1') return MAJOR_G1_CODES.has(c)
  if (elig === 'major_elec_g2') return MAJOR_G2_CODES.has(c)
  if (elig === 'ge8') return GE_BY_CODE[c]?.group === 'GE8'
  if (elig === 'free') return true
  return false
}

/** จับคู่รายวิชาที่ผ่าน → requirements โดยวิชา 1 ตัวนับได้ครั้งเดียว */
export function assign(program: Program, taken: TakenCourse[], overrides: Override[]): MatchResult {
  // 1) เหลือเฉพาะ bestAttempt ที่ "ผ่าน" ต่อรหัส
  const passedByCode = new Map<string, TakenCourse>()
  for (const t of taken) {
    const best = bestAttempt(t.code, taken)
    if (best && isPass(best.grade)) passedByCode.set(normalizeCode(best.code), best)
  }
  const pool = [...passedByCode.values()]

  const used = new Set<string>()
  const byRequirement = new Map<string, TakenCourse[]>()
  const put = (id: string, t: TakenCourse) => {
    byRequirement.set(id, [...(byRequirement.get(id) ?? []), t])
    used.add(keyOf(t))
  }
  const take = (pred: (t: TakenCourse) => boolean) =>
    pool.find((t) => !used.has(keyOf(t)) && pred(t))
  const creditsIn = (id: string) =>
    (byRequirement.get(id) ?? []).reduce((s, t) => s + t.credits, 0)

  // 2) overrides (ผู้ใช้ปักหมุดเอง) มาก่อน
  for (const ov of overrides) {
    const t = pool.find(
      (t) =>
        normalizeCode(t.code) === normalizeCode(ov.takenCode) &&
        t.term === ov.term &&
        !used.has(keyOf(t)),
    )
    if (t) put(ov.requirementId, t)
  }

  // 3) fixed (วิชาบังคับเจาะจง)
  for (const req of program.requirements) {
    if (req.kind !== 'fixed' || byRequirement.has(req.id)) continue
    const codes = req.courseCodes.map(normalizeCode)
    const t = take((t) => codes.includes(normalizeCode(t.code)))
    if (t) put(req.id, t)
  }

  // 4) choose (เลือกให้ครบ needCredits จากลิสต์)
  for (const req of program.requirements) {
    if (req.kind !== 'choose') continue
    const optionCodes = new Set(req.options.map((o) => normalizeCode(o.code)))
    while (creditsIn(req.id) < req.needCredits) {
      const t = take((t) => optionCodes.has(normalizeCode(t.code)))
      if (!t) break
      put(req.id, t)
    }
  }

  // 5) bucket ตามลำดับความจำกัด: g1 → g2 → ge8 → free
  const order: BucketKind[] = ['major_elec_g1', 'major_elec_g2', 'ge8', 'free']
  for (const elig of order) {
    for (const req of program.requirements) {
      if (req.kind !== 'bucket' || req.eligible !== elig) continue
      while (creditsIn(req.id) < req.needCredits) {
        const t = take((t) => eligibleForBucket(elig, t.code))
        if (!t) break
        put(req.id, t)
      }
    }
  }

  const extra = pool.filter((t) => !used.has(keyOf(t)))
  return { byRequirement, used, extra }
}
