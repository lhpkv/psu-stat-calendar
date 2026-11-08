'use client'

import Link from 'next/link'
import { useAppData } from '@/hooks/use-app-data'
import { CATEGORY_LABEL, suggestNextTerm } from '@/lib/engine/progress'
import type { Category } from '@/lib/curriculum/types'
import { MAJOR_LABEL } from '@/lib/types'
import { StatusBadge, statusBarClass } from '@/components/common/status'
import { PsuVerdict } from '@/components/(App)/psu-verdict'
import { Card, CardContent } from '@/components/ui/card'
import {
  FlaskConical, BookOpenCheck, Sigma, Languages, Sparkles, AlertTriangle, ArrowRight,
  Hand, BookMarked, Target, Pin, CircleCheck,
} from 'lucide-react'

const CAT_ICON: Record<Category, typeof FlaskConical> = {
  foundation: FlaskConical,
  core: BookOpenCheck,
  major_elective: Sigma,
  ge: Languages,
  free_elective: Sparkles,
}

export default function DashboardPage() {
  const { progress, program, profile, taken, email, overrides } = useAppData()
  const pct = progress.totalNeed ? Math.round((progress.totalDone / progress.totalNeed) * 100) : 0
  const remaining = Math.max(progress.totalNeed - progress.totalDone, 0)
  const verifyFlags = progress.requirements.filter((r) => r.verifyNote && r.status !== 'done')
  const at = { year: profile.currentYear ?? 3, term: profile.currentTerm ?? 1 }
  const next = suggestNextTerm(program, taken, overrides, at)
  const name = email ? email.split('@')[0] : 'นักศึกษา'

  const R = 52
  const C = 2 * Math.PI * R

  return (
    <div className="space-y-6">
      {/* ── hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-7 text-primary-foreground shadow-xl shadow-primary/25 md:px-9 md:py-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-24 size-56 rounded-full bg-chart-3/20 blur-3xl" />
        <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/65">
              {`${profile.plan === 'coop' ? 'แผนสหกิจ' : 'แผนปกติ'} · ${profile.geFramework === 'core2564' ? 'สาระ 2564' : 'GE 2565'} · วท.บ. ${MAJOR_LABEL.statistics}`}
            </p>
            <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight md:text-[1.7rem]">
              สวัสดี, {name} <Hand className="size-6 text-white/80" />
            </h2>
            <p className="max-w-md text-sm text-white/75">
              เรียนผ่านแล้ว <span className="font-semibold text-white">{progress.totalDone}</span> จาก {progress.totalNeed} หน่วยกิต — เหลืออีกประมาณ <span className="font-semibold text-white">{remaining}</span> หน่วยกิตจบ
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/90">
                <BookMarked className="size-3.5" /> {taken.length} วิชาที่บันทึก
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/90">
                <Target className="size-3.5" /> เหลืออีก ~{remaining} นก
              </span>
            </div>
          </div>

          {/* progress ring */}
          <div className="relative grid shrink-0 place-items-center">
            <svg viewBox="0 0 120 120" className="size-32 -rotate-90 md:size-36">
              <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeWidth="11" className="text-white/15" />
              <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} className="text-white transition-[stroke-dashoffset] duration-700" />
            </svg>
            <div className="absolute text-center">
              <div className="text-3xl font-semibold leading-none">{pct}%</div>
              <div className="mt-1 text-xs text-white/65">{progress.totalDone}/{progress.totalNeed} นก</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── verify flags ── */}
      {verifyFlags.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4" /> จุดที่ควรยืนยันกับอาจารย์ที่ปรึกษา/SIS
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-7 text-sm text-amber-800/90 dark:text-amber-200/80">
            {verifyFlags.map((r) => (
              <li key={r.id}><span className="font-medium">{r.label}</span> — {r.verifyNote}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── ผลตรวจสอบหลักสูตร (คำนวณจากข้อมูลที่นำเข้า — ไม่เรียก API มหาวิทยาลัย) ── */}
      <PsuVerdict />

      {/* ── category cards ── */}
      <div>
        <h3 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">ความคืบหน้าตามหมวด</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {progress.categories.map((c) => {
            const cpct = c.needCredits ? Math.round((c.doneCredits / c.needCredits) * 100) : 0
            const status = c.doneCredits >= c.needCredits ? 'done' : c.doneCredits > 0 ? 'partial' : 'none'
            const Icon = CAT_ICON[c.category]
            return (
              <Link key={c.category} href={`/requirements/${c.category}`} className="group">
                <Card className="h-full rounded-2xl border-border/70 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-md">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between">
                      <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
                        <Icon className="size-5" strokeWidth={2.1} />
                      </span>
                      <StatusBadge status={status} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{CATEGORY_LABEL[c.category]}</div>
                      <div className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
                        {c.doneCredits}<span className="text-base font-normal text-muted-foreground"> / {c.needCredits}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${statusBarClass(status)} transition-all`} style={{ width: `${cpct}%` }} />
                    </div>
                    {c.missing.length > 0 && (
                      <div className="truncate text-xs text-muted-foreground">
                        ขาด: {c.missing.slice(0, 3).map((m) => m.code).join(', ')}{c.missing.length > 3 ? ` +${c.missing.length - 3}` : ''}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── next term ── */}
      <Card className="rounded-2xl border-border/70 shadow-sm">
        <CardContent className="space-y-4 p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Pin className="size-4 text-primary" /> แนะนำลงเทอมหน้า · ปี {at.year} เทอม {at.term}
            </h3>
            <Link href="/plan" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              ดูแผนเต็ม <ArrowRight className="size-4" />
            </Link>
          </div>
          {next.recommended.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CircleCheck className="size-4 text-emerald-500" /> ไม่มีวิชาบังคับค้าง — เลือกวิชาเลือก/เลือกเสรีตามสนใจได้
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {next.recommended.map((x) => (
                <div key={x.code} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3.5 py-2.5">
                  <span className="font-mono text-xs text-primary">{x.code}</span>
                  <span className="flex-1 truncate text-sm">{x.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{x.credits} นก</span>
                </div>
              ))}
            </div>
          )}
          {next.carryOver.length > 0 && (
            <div className="rounded-xl bg-muted/60 p-3 text-sm">
              <div className="mb-1 font-medium text-foreground">ต้องจัดการ/ลงให้ครบ</div>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {next.carryOver.map((x, i) => (
                  <li key={i}><span className="font-medium text-foreground">{x.name}</span> — {x.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
