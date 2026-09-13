import { createClient } from '@/lib/supabase/client'
import type { TakenCourse, Profile, Override, Major } from '@/lib/types'

const DEFAULT_PROFILE: Profile = {
  major: 'statistics',
  plan: 'regular',
  geFramework: 'ge2565',
  passThreshold: 'D',
}

async function uid(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.user?.id ?? null
}

export async function getProfile(): Promise<Profile> {
  const supabase = createClient()
  // major เก็บใน auth user_metadata (ไม่ต้องแก้ schema profiles) — เลือกตอนสมัคร
  const [{ data }, { data: userData }] = await Promise.all([
    supabase.from('profiles').select('*').maybeSingle(),
    supabase.auth.getUser(),
  ])
  const major = (userData.user?.user_metadata?.major as Major) ?? 'statistics'
  if (!data) return { ...DEFAULT_PROFILE, major }
  return {
    major,
    plan: data.plan ?? 'regular',
    geFramework: data.ge_framework ?? 'ge2565',
    passThreshold: data.pass_threshold ?? 'D',
    displayName: data.display_name ?? undefined,
    currentYear: data.current_year ?? undefined,
    currentTerm: data.current_term ?? undefined,
  }
}

/** เปลี่ยนสาขา — บันทึกใน auth user_metadata (ไม่ผูกตาราง profiles) */
export async function setMajor(major: Major): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ data: { major } })
  if (error) throw error
}

export async function upsertProfile(patch: Partial<Profile>): Promise<void> {
  const id = await uid()
  if (!id) throw new Error('ยังไม่ได้เข้าสู่ระบบ')
  const supabase = createClient()
  const row: Record<string, unknown> = { id }
  if (patch.plan !== undefined) row.plan = patch.plan
  if (patch.geFramework !== undefined) row.ge_framework = patch.geFramework
  if (patch.passThreshold !== undefined) row.pass_threshold = patch.passThreshold
  if (patch.displayName !== undefined) row.display_name = patch.displayName
  if (patch.currentYear !== undefined) row.current_year = patch.currentYear
  if (patch.currentTerm !== undefined) row.current_term = patch.currentTerm
  row.updated_at = new Date().toISOString()
  const { error } = await supabase.from('profiles').upsert(row)
  if (error) throw error
}

function rowToTaken(r: Record<string, unknown>): TakenCourse {
  return {
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    credits: Number(r.credits),
    grade: (r.grade as string) ?? '',
    term: (r.term as string) ?? '',
    section: (r.section as string) ?? undefined,
  }
}

export async function listTaken(): Promise<TakenCourse[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('taken_courses').select('*')
  if (error) throw error
  return (data ?? []).map(rowToTaken)
}

export async function addTaken(c: TakenCourse): Promise<void> {
  const id = await uid()
  if (!id) throw new Error('ยังไม่ได้เข้าสู่ระบบ')
  const supabase = createClient()
  const { error } = await supabase.from('taken_courses').upsert(
    {
      user_id: id,
      code: c.code,
      name: c.name,
      credits: c.credits,
      grade: c.grade,
      term: c.term,
      section: c.section ?? null,
    },
    { onConflict: 'user_id,code,term' },
  )
  if (error) throw error
}

export async function bulkAddTaken(courses: TakenCourse[]): Promise<void> {
  const id = await uid()
  if (!id) throw new Error('ยังไม่ได้เข้าสู่ระบบ')
  const supabase = createClient()
  const rows = courses.map((c) => ({
    user_id: id,
    code: c.code,
    name: c.name,
    credits: c.credits,
    grade: c.grade,
    term: c.term,
    section: c.section ?? null,
  }))
  const { error } = await supabase
    .from('taken_courses')
    .upsert(rows, { onConflict: 'user_id,code,term' })
  if (error) throw error
}

export async function updateTaken(id: string, patch: Partial<TakenCourse>): Promise<void> {
  const supabase = createClient()
  const row: Record<string, unknown> = {}
  if (patch.code !== undefined) row.code = patch.code
  if (patch.name !== undefined) row.name = patch.name
  if (patch.credits !== undefined) row.credits = patch.credits
  if (patch.grade !== undefined) row.grade = patch.grade
  if (patch.term !== undefined) row.term = patch.term
  if (patch.section !== undefined) row.section = patch.section
  const { error } = await supabase.from('taken_courses').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteTaken(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('taken_courses').delete().eq('id', id)
  if (error) throw error
}

export async function listOverrides(): Promise<Override[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('requirement_overrides').select('*')
  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => ({
    requirementId: r.requirement_id as string,
    takenCode: r.taken_code as string,
    term: r.term as string,
  }))
}

export async function setOverride(o: Override): Promise<void> {
  const id = await uid()
  if (!id) throw new Error('ยังไม่ได้เข้าสู่ระบบ')
  const supabase = createClient()
  const { error } = await supabase.from('requirement_overrides').upsert(
    {
      user_id: id,
      requirement_id: o.requirementId,
      taken_code: o.takenCode,
      term: o.term,
    },
    { onConflict: 'user_id,requirement_id' },
  )
  if (error) throw error
}

export async function clearOverride(requirementId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('requirement_overrides')
    .delete()
    .eq('requirement_id', requirementId)
  if (error) throw error
}
