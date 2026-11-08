'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/client'
import {
  getProfile, listTaken, listOverrides, upsertProfile, setMajor as setMajorRepo,
} from '@/lib/data/repository'
import type { TakenCourse, Profile, Override, Major } from '@/lib/types'
import { buildProgram } from '@/lib/curriculum/program-2564'
import type { Program } from '@/lib/curriculum/types'
import { computeProgress, type ProgressResult } from '@/lib/engine/progress'

interface AppDataValue {
  envOk: boolean
  loading: boolean
  error: string | null
  email: string | null
  profile: Profile
  taken: TakenCourse[]
  overrides: Override[]
  program: Program
  progress: ProgressResult
  refresh: () => Promise<void>
  saveProfile: (patch: Partial<Profile>) => Promise<void>
  setMajor: (major: Major) => Promise<void>
}

const DEFAULT_PROFILE: Profile = { major: 'statistics', plan: 'regular', geFramework: 'ge2565', passThreshold: 'D' }

const Ctx = createContext<AppDataValue | null>(null)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const envOk = hasSupabaseEnv()
  // ถ้าไม่มี env ก็ไม่มีอะไรให้โหลด — เริ่มต้นเป็น false เลย ไม่ต้อง setState ใน effect
  const [loading, setLoading] = useState(envOk)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [taken, setTaken] = useState<TakenCourse[]>([])
  const [overrides, setOverrides] = useState<Override[]>([])

  const loadAll = useCallback(async () => {
    const [p, t, o] = await Promise.all([getProfile(), listTaken(), listOverrides()])
    setProfile(p)
    setTaken(t)
    setOverrides(o)
  }, [])

  useEffect(() => {
    if (!envOk) return
    let active = true
    let loadedFor: string | null = null
    let inFlightFor: string | null = null
    const supabase = createClient()

    // โหลดข้อมูลเมื่อมี session (กันโหลดซ้ำด้วย loadedFor/inFlightFor)
    // หมายเหตุ: supabase ยิง INITIAL_SESSION ให้ subscriber พร้อมกับ getSession() ที่ resolve
    // → onSession อาจถูกเรียก 2 ครั้ง; ครั้งที่สองต้องไม่เคลียร์ loading ก่อน loadAll รอบแรกจบ
    async function onSession(userId: string | undefined, email: string | null) {
      if (!active || !userId) {
        if (active) setLoading(false)
        return
      }
      if (loadedFor === userId || inFlightFor === userId) return
      inFlightFor = userId
      setEmail(email)
      try {
        await loadAll()
        loadedFor = userId
        if (active) setError(null)
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
      } finally {
        inFlightFor = null
        if (active) setLoading(false)
      }
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
    try {
      await loadAll()
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
      throw e
    }
  }, [loadAll])

  // เขียนฐานข้อมูลแบบ optimistic แต่ถ้าล้มเหลวต้อง rollback กลับค่าเดิม (ไม่ปล่อยให้ UI โชว์ค่าที่ไม่ได้บันทึก)
  // หมายเหตุ: Select ใน top-bar/plan เป็น controlled — ถ้าไม่ setState ทันที ค่าจะไม่ขยับระหว่างรอ network
  const profileRef = useRef(profile)
  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  const saveProfile = useCallback(async (patch: Partial<Profile>) => {
    const prev = profileRef.current
    setProfile((p) => ({ ...p, ...patch }))
    try {
      await upsertProfile(patch)
    } catch (e) {
      setProfile(prev)
      throw e
    }
  }, [])

  // major เก็บใน auth metadata (คนละที่กับ profiles) → ใช้ setMajor แยกต่างหาก
  const setMajor = useCallback(async (major: Major) => {
    const prev = profileRef.current
    setProfile((p) => ({ ...p, major }))
    try {
      await setMajorRepo(major)
    } catch (e) {
      setProfile(prev)
      throw e
    }
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
    envOk, loading, error, email, profile, taken, overrides, program, progress, refresh, saveProfile, setMajor,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAppData(): AppDataValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAppData ต้องใช้ภายใน AppDataProvider')
  return v
}
