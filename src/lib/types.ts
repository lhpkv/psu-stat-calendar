export interface TakenCourse {
  id?: string
  code: string
  name: string
  credits: number
  grade: string // 'A','B+','B','C+','C','D+','D','E','F','W','U','P','S','I',''
  term: string // e.g. '1/2567'
  section?: string
}

/** สาขา — แอปรองรับเฉพาะสถิติ */
export type Major = 'statistics'

export const MAJOR_LABEL: Record<Major, string> = {
  statistics: 'สถิติ',
}

export interface Profile {
  major: Major
  plan: 'regular' | 'coop'
  geFramework: 'ge2565' | 'core2564'
  passThreshold: string // 'D'
  displayName?: string
  currentYear?: number
  currentTerm?: number
}

export interface Override {
  takenCode: string
  term: string
  requirementId: string
}
