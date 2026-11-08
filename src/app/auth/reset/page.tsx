'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { describeAuthError } from '@/lib/auth/messages'
import { AuthShell } from '@/components/(Auth)/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { KeyRound, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('รหัสผ่านอย่างน้อย 6 ตัวอักษร')
      return
    }
    if (password !== confirm) {
      toast.error('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    setBusy(true)
    try {
      const { error } = await createClient().auth.updateUser({ password })
      if (error) throw error
      toast.success('ตั้งรหัสผ่านใหม่แล้ว')
      router.replace('/dashboard')
    } catch (err) {
      toast.error(describeAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-inset ring-white/10">
          <KeyRound className="size-7" strokeWidth={1.75} />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">ตั้งรหัสผ่านใหม่</h1>
        <p className="mt-1 text-sm text-muted-foreground">กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        <Button type="submit" disabled={busy} className="h-11 w-full gap-2 rounded-xl text-[0.9rem] font-semibold">
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              กำลังบันทึก…
            </>
          ) : (
            'บันทึกรหัสผ่านใหม่'
          )}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        <Link href="/login" className="underline underline-offset-4">กลับไปหน้าเข้าสู่ระบบ</Link>
      </p>
    </AuthShell>
  )
}