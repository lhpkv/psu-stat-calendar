'use client'

import { useState } from 'react'
import { useAppData } from '@/hooks/use-app-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw, ShieldCheck, CircleCheck, CircleAlert, Loader2, ChevronDown } from 'lucide-react'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2">
      <div className="text-[0.7rem] text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  )
}

/** การ์ดมิเรอร์ผลตรวจสอบหลักสูตรจาก scmis (สรุป + วิชาที่ยังไม่ครบต่อหมวด) */
export function PsuVerdict() {
  const { psuStructure, syncPsu } = useAppData()
  const [syncing, setSyncing] = useState(false)

  if (!psuStructure) return null
  const { summary, courses, categories } = psuStructure

  async function onSync() {
    setSyncing(true)
    try {
      const n = await syncPsu()
      toast.success(`ซิงค์จาก scmis แล้ว — ${n} วิชา`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'ซิงค์ไม่สำเร็จ')
    } finally {
      setSyncing(false)
    }
  }

  // เฉพาะหมวด/กลุ่มที่มีวิชาผูกอยู่ พร้อมรายการที่ยังไม่ครบ
  const rows = categories
    .map((cat) => ({
      title: cat.title,
      requiredCredits: cat.requiredCredits,
      missing: courses.filter((c) => c.category === cat.title && !c.taken),
      total: courses.filter((c) => c.category === cat.title).length,
    }))
    .filter((r) => r.total > 0)

  const synced = fmtDate(psuStructure.syncedAt)

  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="space-y-4 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="size-4 text-emerald-600" /> ผลตรวจสอบหลักสูตร · ระบบ scmis
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              ดึงตรงจากมหาวิทยาลัย{synced ? ` · ซิงค์ล่าสุด ${synced}` : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onSync}
            disabled={syncing}
            className="shrink-0 gap-1.5 rounded-lg"
          >
            {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            ซิงค์ใหม่
          </Button>
        </div>

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
      </CardContent>
    </Card>
  )
}
