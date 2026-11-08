'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseSisTranscript } from '@/lib/engine/parse-transcript'
import { describeDbError } from '@/lib/ui/errors'
import type { TakenCourse } from '@/lib/types'
import { ImportPreview } from '@/components/(App)/import-preview'
import { ClipboardPaste } from 'lucide-react'
import { toast } from 'sonner'

export function PasteDialog({ onImport }: { onImport: (rows: TakenCourse[]) => Promise<boolean> }) {
  const [open, setOpen] = useState(false)
  const [fallbackTerm, setFallbackTerm] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const parsed = parseSisTranscript(text, fallbackTerm.trim())

  async function confirm() {
    setBusy(true)
    try {
      const ok = await onImport(parsed)
      // ล้างข้อความเฉพาะเมื่อนำเข้าสำเร็จ — กัน transcript ที่วางไว้หายเมื่อ write ล้มเหลว
      if (ok) {
        setOpen(false)
        setText('')
        setFallbackTerm('')
      }
    } catch (e) {
      toast.error(describeDbError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline"><ClipboardPaste className="size-4" /> วางข้อความ</Button>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>วางข้อความผลการเรียนจาก SIS</DialogTitle>
          <DialogDescription>
            วางข้อความ (รองรับหลายเทอม ระบบตรวจหัว &quot;ภาคการศึกษา&quot; ให้อัตโนมัติ) — หรือใช้ปุ่ม &quot;นำเข้า PDF&quot; ก็ได้
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ptext">ข้อความ</Label>
            <textarea id="ptext" value={text} onChange={(e) => setText(e.target.value)} rows={7}
              className="w-full rounded-md border bg-transparent px-3 py-2 font-mono text-xs"
              placeholder={'ภาคการศึกษา 1/2569\n346-321 MATHEMATICAL STATISTICS II 01 3 B'} />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="fterm" className="text-xs text-muted-foreground">เทอม (เฉพาะกรณีไม่มีหัว &quot;ภาคการศึกษา&quot;)</Label>
            <Input id="fterm" className="w-32" value={fallbackTerm}
              onChange={(e) => setFallbackTerm(e.target.value)} placeholder="1/2569" />
          </div>
          <ImportPreview rows={parsed} />
          {text.trim() && parsed.length === 0 && (
            <p className="text-sm text-rose-600">ยังแยกวิชาไม่ได้ — ต้องมีหัว &quot;ภาคการศึกษา&quot; หรือใส่เทอมด้านบน และรูปแบบ &quot;รหัส ชื่อ ตอน หน่วยกิต เกรด&quot;</p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={confirm} disabled={busy || parsed.length === 0}>
            {busy ? 'กำลังนำเข้า…' : `นำเข้า ${parsed.length} วิชา`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
