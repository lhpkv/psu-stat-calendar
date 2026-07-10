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

export type BucketKind = 'major_elec_g1' | 'major_elec_g2' | 'ge8' | 'free'

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
  | (ReqBase & { kind: 'bucket'; needCredits: number; eligible: BucketKind })

export interface Program {
  id: string
  plan: Plan
  geFramework: GeFramework
  totalCredits: number
  requirements: Requirement[]
}
