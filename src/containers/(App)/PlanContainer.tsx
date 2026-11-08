'use client'

import { useAppData } from '@/hooks/use-app-data'
import { suggestNextTerm } from '@/lib/engine/progress'
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
  const { profile, program, taken, overrides, saveProfile } = useAppData()
  const year = profile.currentYear ?? 3
  const term = profile.currentTerm ?? 1

  const next = suggestNextTerm(program, taken, overrides, { year, term })

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

      <p className="text-xs text-muted-foreground">
        * คำแนะนำอิงแผนการเรียนมาตรฐานและวิชาที่ยังไม่ผ่าน — วิชาเลือกสาขา/เลือกเสรีเลือกตามสนใจได้
        และควรตรวจเงื่อนไขวิชาก่อนเรียน (prerequisite) กับภาควิชาอีกครั้ง
      </p>
    </div>
  )
}
