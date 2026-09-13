'use client'

import { useState } from 'react'
import { hasSupabaseEnv } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { GraduationCap, User, Lock, Eye, EyeOff, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react'
import { AuthShell } from '@/components/(Auth)/AuthShell'

export default function LoginPage() {
  const envOk = hasSupabaseEnv()
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!envOk) {
    return (
      <AuthShell>
        <div className="flex items-center gap-3.5">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-500/12 text-amber-600 ring-1 ring-amber-500/25">
            <ShieldAlert className="size-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-base font-semibold tracking-tight">ยังไม่ได้ตั้งค่า Supabase</h1>
            <p className="text-sm text-muted-foreground">เว็บนี้ต้องเชื่อม Supabase ก่อนใช้งาน</p>
          </div>
        </div>
        <div className="mt-6 space-y-3 text-sm">
          <p>
            ทำตามขั้นตอนในไฟล์{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">SETUP.md</code> แล้วใส่ค่า
            URL / anon key ใน <code className="font-mono text-xs">.env.local</code>
          </p>
        </div>
      </AuthShell>
    )
  }

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error([data.error, data.detail].filter(Boolean).join(' — ') || 'เข้าสู่ระบบไม่สำเร็จ')
      // โหลดเต็มหน้าเพื่อให้ client อ่าน session cookie ที่ server เพิ่งตั้ง
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-inset ring-white/10">
          <GraduationCap className="size-7" strokeWidth={1.75} />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">PSU Credit Checker</h1>
        <p className="mt-1 text-sm text-muted-foreground">เข้าสู่ระบบด้วยรหัส scmis คณะวิทยาศาสตร์</p>
      </div>

      <form onSubmit={login} className="mt-7 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="studentId">รหัสนักศึกษา</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="studentId"
              name="username"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              placeholder="เช่น 6710210764"
              value={studentId}
              required
              onChange={(e) => setStudentId(e.target.value)}
              className="h-11 rounded-xl pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">รหัสผ่าน scmis</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="รหัสผ่านระบบ scmis"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl pr-10 pl-9"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              className="absolute top-1/2 right-2.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="h-11 w-full gap-2 rounded-xl text-[0.9rem] font-semibold">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              กำลังเข้าสู่ระบบ &amp; ดึงข้อมูล…
            </>
          ) : (
            'เข้าสู่ระบบ'
          )}
        </Button>
      </form>

      <div className="mt-5 flex items-start gap-2 rounded-xl bg-muted/60 px-3.5 py-3 text-[0.7rem] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-emerald-600" />
        <span>
          ใช้รหัสเดียวกับระบบ scmis ของมหาวิทยาลัย — ระบบจะดึงเกรดและผลตรวจสอบหลักสูตรจริงมาให้
          รหัสผ่านถูกเข้ารหัสเก็บไว้ฝั่งเซิร์ฟเวอร์เท่านั้น
        </span>
      </div>
    </AuthShell>
  )
}
