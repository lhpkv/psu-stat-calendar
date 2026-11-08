'use client'

import { useAppData } from '@/hooks/use-app-data'
import { suggestNextTerm } from '@/lib/engine/progress'
import { buildStudyPlan, splitStudyPlan, inferCurrentYear } from '@/lib/engine/study-plan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CircleCheck, CircleAlert } from 'lucide-react'
import { describeDbError } from '@/lib/ui/errors'
import { toast } from 'sonner'

export default function PlanPage() {
  const { profile, program, taken, overrides, saveProfile, progress } = useAppData()
  // ใช้ปีที่ผู้ใช้ตั้งไว้; ถ้ายังไม่เคยตั้ง ให้เดาจากเทอมแรกที่ลงทะเบียน (รองรับปี 2/3/4)
  const year = profile.currentYear ?? inferCurrentYear(taken) ?? 3
  const term = profile.currentTerm ?? 1

  const next = suggestNextTerm(program, taken, overrides, { year, term })
  // รวมทั้งหลักสูตรเพื่อแยกวิชาคงค้างของปีก่อนออกจากแผนข้างหน้า — รองรับปี 2, 3 และ 4
  const fullPlan = buildStudyPlan(progress, { fromYear: 1, toYear: 4 })
  const { overdue, upcoming } = splitStudyPlan(fullPlan, { year, term })
  const overdueItems = overdue.flatMap((t) => t.items.map((item) => ({ ...item, year: t.year, term: t.term })))
  const planYears = year < 4 ? `ปี ${year}–4` : 'ปี 4'

  const save = (patch: Parameters<typeof saveProfile>[0]) => {
    void saveProfile(patch).catch((e) => toast.error(describeDbError(e)))
  }
  const totalCredits = next.recommended.reduce((s, x) => s + x.credits, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold">แผนการลงทะเบียน</h1>
        <div className="ml-auto flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">เทอมที่จะลง:</Label>
          <Select value={String(year)} items={{ '1': 'ปี 1', '2': 'ปี 2', '3': 'ปี 3', '4': 'ปี 4' }}
            onValueChange={(v) => v && save({ currentYear: Number(v) })}>
            <SelectTrigger size="sm" className="w-[90px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((y) => <SelectItem key={y} value={String(y)}>ปี {y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(term)} items={{ '1': 'เทอม 1', '2': 'เทอม 2', '3': 'เทอม 3' }}
            onValueChange={(v) => v && save({ currentTerm: Number(v) })}>
            <SelectTrigger size="sm" className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3].map((t) => <SelectItem key={t} value={String(t)}>เทอม {t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <span>วิชาที่แนะนำให้ลง</span>
            <Badge variant="secondary">{totalCredits} นก</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {next.recommended.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CircleCheck className="size-4 text-emerald-500" /> ไม่มีวิชาบังคับค้างสำหรับเทอมนี้
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {next.recommended.map((x) => (
                <li key={x.code} className="flex items-center gap-3 border-b pb-2 last:border-0">
                  <span className="font-mono text-xs">{x.code}</span>
                  <span className="flex-1">{x.name}</span>
                  <span className="text-muted-foreground tabular-nums">{x.credits} นก</span>
                  <Badge variant={x.reason.includes('คงค้าง') ? 'destructive' : 'outline'} className="text-xs">
                    {x.reason}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {next.carryOver.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">ต้องจัดการ / ลงให้ครบ</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {next.carryOver.map((x, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <span><span className="font-medium">{x.name}</span> — <span className="text-muted-foreground">{x.reason}</span></span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {overdueItems.length + upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>แผนที่เหลือถึงจบ</span>
              <span className="text-xs font-normal text-muted-foreground">{planYears}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {overdueItems.length > 0 && (
              <div className="border-b border-border/60 px-5 py-3 md:px-6">
                <p className="text-xs font-medium text-amber-700">คงค้างจากปีก่อน</p>
                <ul className="mt-1.5 space-y-1">
                  {overdueItems.map((item) => (
                    <li key={`${item.id}-${item.year}-${item.term}`} className="flex items-baseline gap-2 text-sm">
                      {item.code && (
                        <span className="shrink-0 font-mono text-xs text-foreground/80">{item.code}</span>
                      )}
                      <span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        ปี {item.year} เทอม {item.term}
                      </span>
                      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {item.credits} นก.
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {upcoming.length > 0 && (
              <div className="divide-y divide-border/60">
                {upcoming.map((t) => (
                  <div key={`${t.year}-${t.term}`} className="flex gap-4 px-5 py-3 md:px-6">
                    <div className="w-20 shrink-0">
                      <p className="text-sm font-medium text-foreground">ปี {t.year}</p>
                      <p className="text-xs text-muted-foreground">เทอม {t.term}</p>
                    </div>
                    <ul className="min-w-0 flex-1 space-y-1">
                      {t.items.map((item) => (
                        <li key={item.id} className="flex items-baseline gap-2 text-sm">
                          {item.code && (
                            <span className="shrink-0 font-mono text-xs text-foreground/80">{item.code}</span>
                          )}
                          <span className="min-w-0 flex-1 truncate" title={item.name}>{item.name}</span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {item.credits} นก.
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="hidden w-14 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
                      {t.credits} นก.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        * คำแนะนำอิงแผนการเรียนมาตรฐานและวิชาที่ยังไม่ผ่าน — วิชาเลือกสาขา/เลือกเสรีเลือกตามสนใจได้
        และควรตรวจเงื่อนไขวิชาก่อนเรียน (prerequisite) กับภาควิชาอีกครั้ง
      </p>
    </div>
  )
}
