'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/client'
import {
  getProfile, listTaken, listOverrides, upsertProfile, setMajor as setMajorRepo,
  getPsuStructure, syncPsu as syncPsuRepo,
} from '@/lib/data/repository'
import type { TakenCourse, Profile, Override, Major } from '@/lib/types'
import type { StoredStructure } from '@/lib/psu/parse-structure'
import { buildProgram } from '@/lib/curriculum/program-2564'
import type { Program } from '@/lib/curriculum/types'
import { computeProgress, type ProgressResult } from '@/lib/engine/progress'

interface AppDataValue {
  envOk: boolean
  loading: boolean
  email: string | null
  profile: Profile
  taken: TakenCourse[]
  overrides: Override[]
  program: Program
  progress: ProgressResult
  psuStructure: StoredStructure | null
  refresh: () => Promise<void>
  syncPsu: () => Promise<number>
  saveProfile: (patch: Partial<Profile>) => Promise<void>
  setMajor: (major: Major) => Promise<void>
}

const DEFAULT_PROFILE: Profile = { major: 'statistics', plan: 'regular', geFramework: 'ge2565', passThreshold: 'D' }

const Ctx = createContext<AppDataValue | null>(null)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const envOk = hasSupabaseEnv()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [taken, setTaken] = useState<TakenCourse[]>([])
  const [overrides, setOverrides] = useState<Override[]>([])
  const [psuStructure, setPsuStructure] = useState<StoredStructure | null>(null)

  const loadAll = useCallback(async () => {
    const [p, t, o, s] = await Promise.all([getProfile(), listTaken(), listOverrides(), getPsuStructure()])
    setProfile(p)
    setTaken(t)
    setOverrides(o)
    setPsuStructure(s)
  }, [])

  useEffect(() => {
    if (!envOk) {
      setLoading(false)
      return
    }
    let active = true
    let loadedFor: string | null = null
    const supabase = createClient()

    // โหลดข้อมูลเมื่อมี session (กันโหลดซ้ำด้วย loadedFor)
    async function onSession(userId: string | undefined, email: string | null) {
      if (!active || !userId || loadedFor === userId) {
        if (active) setLoading(false)
        return
      }
      loadedFor = userId
      setEmail(email)
      await loadAll()
      if (active) setLoading(false)
    }

    // เช็คครั้งแรก — ไม่ redirect เอง (proxy เป็นตัวกั้น auth อยู่แล้ว)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) onSession(data.session.user.id, data.session.user.email ?? null)
      else if (active) setLoading(false)
    })

    // ฟังการเปลี่ยนสถานะ — รองรับกรณี session มาช้าหลังโหลดหน้า
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) onSession(session.user.id, session.user.email ?? null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [envOk, loadAll])

  const refresh = useCallback(async () => {
    await loadAll()
  }, [loadAll])

  // ซิงค์ใหม่จาก scmis — ใช้ structure จาก response ตรง ๆ + รีโหลดเฉพาะเกรด (โดยอื่นไม่เปลี่ยน)
  const syncPsu = useCallback(async () => {
    const { importedCount, structure } = await syncPsuRepo()
    setPsuStructure(structure)
    setTaken(await listTaken())
    return importedCount
  }, [])

  const saveProfile = useCallback(async (patch: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...patch }))
    await upsertProfile(patch)
  }, [])

  // major เก็บใน auth metadata (คนละที่กับ profiles) → ใช้ setMajor แยกต่างหาก
  const setMajor = useCallback(async (major: Major) => {
    setProfile((prev) => ({ ...prev, major }))
    await setMajorRepo(major)
  }, [])

  const program = useMemo(
    () => buildProgram(profile.plan, profile.geFramework),
    [profile.plan, profile.geFramework],
  )

  const progress = useMemo(
    () => computeProgress(program, taken, overrides),
    [program, taken, overrides],
  )

  const value: AppDataValue = {
    envOk, loading, email, profile, taken, overrides, program, progress, psuStructure,
    refresh, syncPsu, saveProfile, setMajor,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppData(): AppDataValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAppData ต้องใช้ภายใน AppDataProvider')
  return v
}
