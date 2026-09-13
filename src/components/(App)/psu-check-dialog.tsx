'use client'

import { useState } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { bulkAddTaken } from '@/lib/data/repository'
import type { PsuStructure } from '@/lib/psu/parse-structure'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ShieldCheck, CircleCheck, CircleAlert, Loader2, ChevronDown, Lock, Download,
} from 'lucide-react'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <div className="text-[0.7rem] text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  )
}

/** ส่วนแสดงผลตรวจหลักสูตรจาก scmis (สรุป + วิชาที่ยังไม่ครบต่อหมวด) */
function VerdictBody({ structure }: { structure: PsuStructure }) {
  const { summary, courses, categories } = structure
  const rows = categories
    .map((cat) => ({
      title: cat.title,
      requiredCredits: cat.requiredCredits,
      missing: courses.filter((c) => c.category === cat.title && !c.taken),
      total: courses.filter((c) => c.category === cat.title).length,
    }))
    .filter((r) => r.total > 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="GPA สะสม" value={summary.gpa.toFixed(2)} />
        <Stat label="หน่วยกิตสะสม" value={summary.creditsEarned} />
        <Stat label="สถานภาพ" value={summary.status || '—'} />
      </div>
      {summary.degree && <p className="text-xs leading-relaxed text-muted-foreground">{summary.degree}</p>}

      <div className="space-y-1.5">
        {rows.map((r) =>
          r.missing.length === 0 ? (
            <div
              key={r.title}
              className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm dark:bg-emerald-950/30"
            >
              <span className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
                <CircleCheck className="size-4" /> {r.title}
              </span>
              <span className="shrink-0 text-xs text-emerald-700/80 dark:text-emerald-400/70">
                ครบ · {r.requiredCredits} นก
              </span>
            </div>
          ) : (
            <details key={r.title} className="group rounded-xl border border-border/70 bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <CircleAlert className="size-4 text-amber-500" /> {r.title}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  ยังไม่ครบ {r.missing.length} วิชา
                  <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                </span>
              </summary>
              <ul className="space-y-1 border-t border-border/60 px-3.5 py-2.5 text-sm">
                {r.missing.map((m) => (
                  <li key={m.code} className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-primary">{m.code}</span>
                    <span className="flex-1 text-muted-foreground">{m.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground/70">{m.credits} นก</span>
                  </li>
                ))}
              </ul>
            </details>
          ),
        )}
      </div>
    </div>
  )
}

/**
 * ตรวจกับ scmis แบบ manual — ล็อกอินด้วยอีเมล Supabase ตามปกติ
 * พออยากดูผลตรวจของมหาลัย ให้กรอกรหัส scmis ครั้งเดียวตรงนี้ (ไม่เก็บรหัสไว้ในระบบ)
 * เลือกนำเข้าวิชาที่เรียนแล้วเข้ารายการของตัวเองได้ (รหัสวิชาทางการจาก scmis)
 */
export function PsuCheck() {
  const { refresh } = useAppData()
  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [checking, setChecking] = useState(false)
  const [importing, setImporting] = useState(false)
  const [structure, setStructure] = useState<PsuStructure | null>(null)

  const takenCount = structure?.courses.filter((c) => c.taken).length ?? 0

  function reset() {
    setPassword('')
    setStructure(null)
    setChecking(false)
    setImporting(false)
  }

  async function onCheck(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    try {
      const res = await fetch('/api/psu/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'ตรวจไม่สำเร็จ')
      setStructure(data.structure)
      setPassword('') // ไม่เก็บรหัส — เคลียร์ทันทีที่ใช้เสร็จ
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ตรวจไม่สำเร็จ')
    } finally {
      setChecking(false)
    }
  }

  async function onImport() {
    if (!structure) return
    setImporting(true)
    try {
      // หน้า std_chkstruc ไม่ให้เทอมต่อวิชา → term ว่าง (แก้ได้ทีหลังในหน้ารายวิชา)
      const taken = structure.courses
        .filter((c) => c.taken)
        .map((c) => ({ code: c.code, name: c.name, credits: c.credits, grade: c.grade, term: '' }))
      await bulkAddTaken(taken)
      await refresh()
      toast.success(`นำเข้า ${taken.length} วิชาจาก scmis แล้ว`)
      setOpen(false)
      reset()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'นำเข้าไม่สำเร็จ')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardContent className="flex items-center justify-between gap-3 p-5 md:p-6">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="size-4 text-emerald-600" /> ผลตรวจสอบหลักสูตร · ระบบ scmis
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ตรวจสอบตรงจากระบบมหาวิทยาลัย — ใช้รหัสเดียวกับ scmis คณะวิทยาศาสตร์
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            className="shrink-0 gap-1.5 rounded-lg"
          >
            ตรวจกับ scmis
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) reset()
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {structure ? (
            <>
              <DialogHeader>
                <DialogTitle>ผลตรวจสอบหลักสูตรจาก scmis</DialogTitle>
                <DialogDescription>
                  อ้างอิงจากระบบตรวจสอบการสำเร็จการศึกษาของมหาลัย
                </DialogDescription>
              </DialogHeader>
              <VerdictBody structure={structure} />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setStructure(null)} disabled={importing}>
                  ตรวจอีกครั้ง
                </Button>
                <Button onClick={onImport} disabled={importing || takenCount === 0} className="gap-1.5">
                  {importing ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  นำเข้า {takenCount} วิชาที่เรียนแล้ว
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>ตรวจกับ scmis</DialogTitle>
                <DialogDescription>
                  ใส่รหัสนักศึกษาและรหัสผ่าน scmis เพื่อดึงผลตรวจหลักสูตรล่าสุด —
                  ระบบไม่เก็บรหัสผ่านของคุณไว้
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onCheck} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="psu-student-id">รหัสนักศึกษา</Label>
                  <Input
                    id="psu-student-id"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    placeholder="เช่น 6710210764"
                    value={studentId}
                    required
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="psu-password">รหัสผ่าน scmis</Label>
                  <Input
                    id="psu-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="รหัสผ่านระบบ scmis"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={checking} className="h-11 w-full gap-2 rounded-xl">
                  {checking ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      กำลังตรวจกับมหาลัย…
                    </>
                  ) : (
                    'ตรวจผลลัพธ์'
                  )}
                </Button>
              </form>
              <div className="flex items-start gap-2 rounded-xl bg-muted/60 px-3.5 py-3 text-[0.7rem] leading-relaxed text-muted-foreground">
                <Lock className="mt-px size-3.5 shrink-0 text-emerald-600" />
                <span>
                  รหัสผ่านถูกใช้ตรวจกับ scmis ครั้งเดียวแล้วลบทิ้ง — ไม่ถูกเก็บในระบบของเรา
                  (สลับปุ่ม "ตรวจอีกครั้ง" เพื่อพิมพ์รหัสใหม่ทุกครั้งที่ตรวจ)
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
