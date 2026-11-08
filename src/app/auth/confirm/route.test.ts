import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  codeError: null as null | { message: string },
  otpError: null as null | { message: string },
  exchanged: '',
  verified: null as null | Record<string, unknown>,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: async (code: string) => {
        state.exchanged = code
        return { error: state.codeError }
      },
      verifyOtp: async (args: Record<string, unknown>) => {
        state.verified = args
        return { error: state.otpError }
      },
    },
  }),
}))

import { GET } from './route'

const req = (qs: string) => new Request(`http://localhost/auth/confirm${qs}`)

beforeEach(() => {
  state.codeError = null
  state.otpError = null
  state.exchanged = ''
  state.verified = null
})

describe('GET /auth/confirm', () => {
  it('code ถูกต้อง → ไป /dashboard', async () => {
    const res = await GET(req('?code=abc'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/dashboard')
    expect(state.exchanged).toBe('abc')
  })

  it('code ถูกต้อง + next=/auth/reset → ไปหน้ารีเซ็ตรหัส', async () => {
    const res = await GET(req('?code=abc&next=/auth/reset'))
    expect(res.headers.get('location')).toBe('http://localhost/auth/reset')
  })

  it('code ไม่ถูกต้อง → /login?error=auth', async () => {
    state.codeError = { message: 'invalid' }
    const res = await GET(req('?code=bad'))
    expect(res.headers.get('location')).toBe('http://localhost/login?error=auth')
  })

  it('ไม่มี code/token → /login?error=auth', async () => {
    const res = await GET(req(''))
    expect(res.headers.get('location')).toBe('http://localhost/login?error=auth')
  })

  it('token_hash + type=recovery → ไป /auth/reset', async () => {
    const res = await GET(req('?token_hash=th&type=recovery'))
    expect(res.headers.get('location')).toBe('http://localhost/auth/reset')
    expect(state.verified).toEqual({ type: 'recovery', token_hash: 'th' })
  })

  it('กัน open redirect: next เป็นโดเมนนอก → /dashboard', async () => {
    const res = await GET(req('?code=abc&next=https://evil.example'))
    expect(res.headers.get('location')).toBe('http://localhost/dashboard')
  })
})