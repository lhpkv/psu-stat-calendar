import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/auth/next-path'

/**
 * รับลิงก์จากอีเมลของ Supabase (ยืนยันอีเมล / รีเซ็ตรหัสผ่าน)
 * - PKCE: ?code=... → exchangeCodeForSession
 * - OTP:  ?token_hash=...&type=... → verifyOtp
 * แล้วพาไปหน้าปลายทาง (จำกัดเฉพาะ path ภายในระบบ)
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null

  const fallback = type === 'recovery' ? '/auth/reset' : '/dashboard'
  const next = safeNextPath(url.searchParams.get('next') ?? fallback)

  const supabase = await createClient()
  let ok = false

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    ok = !error
  }

  const target = ok ? next : '/login?error=auth'
  return NextResponse.redirect(new URL(target, url.origin))
}