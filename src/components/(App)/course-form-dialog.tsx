'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { lookupCourse, allKnownCodes } from '@/lib/curriculum/lookup'
import { describeDbError } from '@/lib/ui/errors'
import { toast } from 'sonner'
import type { TakenCourse } from '@/lib/types'
import {
  formValuesFrom, applyCourseLookup, isValidCredits, toCoursePayload,
  type CourseFormValues, type AutoFilled,
} from './course-form-state'

const GRADES = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E', 'F', 'W', 'U', 'P', 'S', 'I']

interface Props {
  trigger: React.ReactElement
  initial?: TakenCourse
  title: string
  onSubmit: (c: TakenCourse) => Promise<boolean>
}

export function CourseFormDialog({ trigger, initial, title, onSubmit }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CourseFormValues>(() => formValuesFrom(initial))
  const [busy, setBusy] = useState(false)
  // ค่าที่ระบบเติมให้เอง — ใช้แยกจากค่าที่ผู้ใช้พิมพ์ เพื่อไม่ทับกัน
  const autoFilled = useRef<AutoFilled | null>(null)

  // auto-fill name/credits เมื่อพิมพ์รหัสที่รู้จัก (เฉพาะฟอร์มเพิ่มวิชา)
  useEffect(() => {
    if (initial) return
    const found = lookupCourse(form.code)
    const lastAuto = autoFilled.current
    setForm((prev) => applyCourseLookup(prev, found, lastAuto))
    autoFilled.current = found ? { name: found.name, credits: String(found.credits) } : null
  }, [form.code, initial])

  function handleOpenChange(next: boolean) {
    if (next) {
      // เปิดใหม่ทุกครั้ง = เริ่มจากค่าของ initial (หรือว่างถ้าเป็นการเพิ่ม)
      setForm(formValuesFrom(initial))
      autoFilled.current = null
    }
    setOpen(next)
  }

  const set = (patch: Partial<CourseFormValues>) => setForm((prev) => ({ ...prev, ...patch }))

  async function submit() {
    setBusy(true)
    try {
      const ok = await onSubmit(toCoursePayload(form, initial))
      // ปิดเฉพาะเมื่อบันทึกสำเร็จ — ถ้าล้มเหลวต้องคงค่าที่ผู้ใช้กรอกไว้ให้แก้ต่อ
      if (ok) setOpen(false)
    } catch (e) {
      toast.error(describeDbError(e))
    } finally {
      setBusy(false)
    }
  }

  const known = allKnownCodes()
  const canSave = !!form.code && !!form.term && isValidCredits(form.credits)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>กรอกข้อมูลรายวิชา (พิมพ์รหัสที่รู้จักจะเติมชื่อ/หน่วยกิตให้)</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">รหัสวิชา</Label>
              <Input id="code" list="known-codes" value={form.code} onChange={(e) => set({ code: e.target.value })} placeholder="346-321" />
              <datalist id="known-codes">
                {known.map((k) => <option key={k.code} value={k.code}>{k.name}</option>)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="credits">หน่วยกิต</Label>
              <Input
                id="credits"
                type="number"
                min={0}
                step="0.5"
                value={form.credits}
                onChange={(e) => set({ credits: e.target.value })}
                aria-invalid={form.credits !== '' && !isValidCredits(form.credits)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">ชื่อวิชา</Label>
            <Input id="name" value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="term">เทอม</Label>
              <Input id="term" value={form.term} onChange={(e) => set({ term: e.target.value })} placeholder="1/2569" />
            </div>
            <div className="space-y-1.5">
              <Label>เกรด</Label>
              <Select value={form.grade} onValueChange={(v) => set({ grade: v ?? 'A' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="section">ตอน</Label>
              <Input id="section" value={form.section} onChange={(e) => set({ section: e.target.value })} placeholder="01" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy || !canSave}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}