import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

const repo = vi.hoisted(() => ({
  getProfile: vi.fn(),
  listTaken: vi.fn(),
  listOverrides: vi.fn(),
  upsertProfile: vi.fn(),
  setMajor: vi.fn(),
}))

const auth = vi.hoisted(() => ({
  session: null as null | { user: { id: string; email: string } },
  cb: null as null | ((event: string, session: unknown) => void),
}))

vi.mock('@/lib/data/repository', () => repo)
vi.mock('@/lib/supabase/client', () => ({
  hasSupabaseEnv: () => true,
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: auth.session } }),
      onAuthStateChange: (cb: typeof auth.cb) => {
        auth.cb = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
    },
  }),
}))

import { AppDataProvider, useAppData } from './app-data'

const wrapper = ({ children }: { children: ReactNode }) => <AppDataProvider>{children}</AppDataProvider>

const profile = { major: 'statistics', plan: 'regular', geFramework: 'ge2565', passThreshold: 'D' }

beforeEach(() => {
  vi.clearAllMocks()
  auth.session = { user: { id: 'u1', email: 'a@psu.ac.th' } }
  auth.cb = null
  repo.getProfile.mockResolvedValue(profile)
  repo.listTaken.mockResolvedValue([])
  repo.listOverrides.mockResolvedValue([])
  repo.upsertProfile.mockResolvedValue(undefined)
  repo.setMajor.mockResolvedValue(undefined)
})

describe('AppDataProvider', () => {
  it('โหลดข้อมูลไม่สำเร็จ → ต้องหยุด loading และรายงาน error (ไม่ค้าง skeleton ตลอดไป)', async () => {
    repo.listTaken.mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useAppData(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 2000 })
    expect(result.current.error).toContain('network down')
  })

  it('session ถูกเรียกซ้ำระหว่างโหลด ต้องไม่เคลียร์ loading ก่อนข้อมูลมาถึง', async () => {
    let resolveTaken: (v: never[]) => void = () => {}
    repo.listTaken.mockReturnValue(
      new Promise((resolve) => {
        resolveTaken = resolve as (v: never[]) => void
      }),
    )

    const { result } = renderHook(() => useAppData(), { wrapper })

    // จำลอง INITIAL_SESSION ที่ supabase ยิงซ้ำหลัง getSession() ทำงานไปแล้ว
    await act(async () => {
      auth.cb?.('INITIAL_SESSION', auth.session)
    })
    await waitFor(() => expect(repo.getProfile).toHaveBeenCalled())

    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolveTaken([])
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('บันทึก profile ไม่สำเร็จ → ต้องคงค่าเดิม ไม่โชว์ค่ายังไม่ถูกบันทึก', async () => {
    repo.upsertProfile.mockRejectedValue(new Error('save failed'))

    const { result } = renderHook(() => useAppData(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(result.current.saveProfile({ plan: 'coop' })).rejects.toThrow('save failed')
    })

    expect(result.current.profile.plan).toBe('regular')
  })

  it('เปลี่ยนสาขาไม่สำเร็จ → ต้องคงค่าเดิม', async () => {
    repo.setMajor.mockRejectedValue(new Error('save failed'))

    const { result } = renderHook(() => useAppData(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await expect(result.current.setMajor('computer-science' as never)).rejects.toThrow('save failed')
    })

    expect(result.current.profile.major).toBe('statistics')
  })
})