export type Campus = 'hatyai'
export type Plan = 'regular' | 'coop'
export type GeFramework = 'ge2565' | 'core2564'
export type Category = 'foundation' | 'core' | 'major_elective' | 'ge' | 'free_elective'

export interface CourseInfo {
  code: string
  name: string
  nameEn?: string
  credits: number
}

export type BucketKind = 'major_elec_g1' | 'major_elec_g2' | 'major_elec_any' | 'ge8' | 'free'

interface ReqBase {
  id: string
  category: Category
  label: string
  recYear?: number
  recTerm?: number
  verifyNote?: string
}

export type Requirement =
  | (ReqBase & { kind: 'fixed'; courseCodes: string[]; credits: number; prereq?: string[] })
  | (ReqBase & { kind: 'choose'; options: { code: string; credits: number }[]; needCredits: number })
  | (ReqBase & {
      kind: 'bucket'
      needCredits: number
      eligible: BucketKind
      /** bucket นี้คือ "ส่วนที่เหลือ" ของบล็อกใหญ่: need = total − หน่วยกิตที่ dependsOn เก็บได้ */
      remainderOf?: { total: number; dependsOn: string }
    })

export interface Program {
  id: string
  plan: Plan
  geFramework: GeFramework
  totalCredits: number
  requirements: Requirement[]
}
