'use client'

import Link from 'next/link'
import { useAppData } from '@/hooks/use-app-data'
import { buildVerdict } from '@/lib/engine/verdict'
import { describeDbError } from '@/lib/ui/errors'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowRight, Check, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ผลตรวจสอบหลักสูตร — คำนวณจากรายวิชาที่ผู้ใช้นำเข้าเทียบกับโครงสร้างหลักสูตรในเครื่อง
 * ไม่เรียก API ของมหาวิทยาลัย; จับคู่วิชาด้วยรหัสหรือชื่อ (รองรับกรณีมหาวิทยาลัยเปลี่ยนรหัส)
 */
export function PsuVerdict() {
  const { progress, profile, saveProfile } = useAppData()
  const v = buildVerdict(progress)
  const pct = v.totalNeed ? Math.round((v.totalDone / v.totalNeed) * 100) : 0
  const remaining = Math.max(0, v.totalNeed - v.totalDone)

  function switchPlan(plan: 'regular' | 'coop') {
    if (plan === profile.plan) return
    void saveProfile({ plan }).catch((e) => toast.error(describeDbError(e)))
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
      <div className="grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <div className="border-b border-border/60 p-5 md:border-r md:border-b-0 md:p-6">
          <h2 className="text-base font-semibold text-foreground">ผลตรวจสอบหลักสูตร</h2>
          <p className="mt-1 text-xs text-muted-foreground">วิชาที่นำเข้าเทียบกับโครงสร้างหลักสูตร</p>

          <p className="mt-6 flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tracking-tight tabular-nums text-foreground">
              {v.totalDone}
            </span>
            <span className="text-sm text-muted-foreground">จาก {v.totalNeed} นก.</span>
          </p>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-500"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <p className="mt-2 text-xs tabular-nums text-muted-foreground">
            {remaining > 0 ? `เหลืออีก ${remaining} นก.` : 'ครบตามโครงสร้างหลักสูตร'}
          </p>

          <div className="mt-6">
            <p className="text-xs text-muted-foreground">แผนการเรียน</p>
            <div className="mt-1.5 flex rounded-xl bg-muted p-1" role="group" aria-label="แผนการเรียน">
              {(['regular', 'coop'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => switchPlan(p)}
                  aria-pressed={profile.plan === p}
                  className={cn(
                    'h-8 flex-1 rounded-lg px-3 text-xs font-medium transition-colors',
                    profile.plan === p
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {p === 'regular' ? 'แผนปกติ' : 'แผนสหกิจ'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {v.categories.map((c) => {
            const done = c.doneCredits >= c.needCredits
            return (
              <section key={c.category} className="px-5 py-4 md:px-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {done ? (
                      <Check className="size-4 shrink-0 text-emerald-600" aria-label="ครบแล้ว" />
                    ) : (
                      <TriangleAlert className="size-4 shrink-0 text-amber-500" aria-label="ยังไม่ครบ" />
                    )}
                    {c.label}
                  </h3>
                  <span
                    className={cn(
                      'shrink-0 text-xs tabular-nums',
                      done ? 'text-emerald-600' : 'text-muted-foreground',
                    )}
                  >
                    {c.doneCredits}/{c.needCredits} นก.
                  </span>
                </div>

                {c.remaining.length > 0 ? (
                  <ul className="mt-2 space-y-1 border-l border-border/70 pl-3 text-xs leading-relaxed text-muted-foreground">
                    {c.remaining.slice(0, 4).map((r, i) => (
                      <li key={`${r.code ?? r.label}-${i}`}>
                        {r.code && <span className="font-mono text-foreground/80">{r.code} </span>}
                        {r.label}
                        {r.missingCredits ? ` (ขาดอีก ${r.missingCredits} นก.)` : ''}
                      </li>
                    ))}
                    {c.remaining.length > 4 && (
                      <li className="text-muted-foreground/70">อีก {c.remaining.length - 4} รายการ</li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-xs text-emerald-600">ครบแล้ว</p>
                )}

                <Link
                  href={`/requirements/${c.category}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  ดูรายละเอียด <ArrowRight className="size-3" aria-hidden />
                </Link>
              </section>
            )
          })}
        </div>
      </div>
    </Card>
  )
}