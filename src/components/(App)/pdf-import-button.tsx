'use client'

import { useRef, useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { parseSisTranscript } from '@/lib/engine/parse-transcript'
import { describeDbError } from '@/lib/ui/errors'
import type { TakenCourse } from '@/lib/types'
import { ImportPreview } from '@/components/(App)/import-preview'
import { toast } from 'sonner'
import { FileUp, Loader2, Copy } from 'lucide-react'

export function PdfImportButton({ onImport }: { onImport: (rows: TakenCourse[]) => Promise<boolean> }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<TakenCourse[]>([])
  const [rawText, setRawText] = useState('') // ข้อความที่อ่านได้ตอนแยกวิชาไม่สำเร็จ (diagnostic)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [extracting, setExtracting] = useState(false)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // เลือกไฟล์เดิมซ้ำได้
    if (!file) return
    setExtracting(true)
    try {
      // แกะ PDF ฝั่ง server (ทำงานได้ทุกอุปกรณ์/เบราว์เซอร์ — ไม่มี pdf.js/worker ฝั่ง browser)
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: file })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
      const text: string = data.text ?? ''
      const parsed = parseSisTranscript(text)
      if (parsed.length === 0) {
        // แยกวิชาไม่ได้ — โชว์ข้อความที่อ่านได้ เพื่อให้คัดลอกส่งให้ผู้พัฒนาปรับให้รองรับ
        setRows([])
        setRawText(text)
        setOpen(true)
        return
      }
      setRawText('')
      setRows(parsed)
      setOpen(true)
    } catch (err) {
      toast.error('อ่าน PDF ไม่สำเร็จ: ' + (err instanceof Error ? err.message : 'unknown'))
    } finally {
      setExtracting(false)
    }
  }

  async function confirm() {
    setBusy(true)
    try {
      const ok = await onImport(rows)
      // คง dialog ไว้เมื่อบันทึกไม่สำเร็จ เพื่อให้ผู้ใช้ลองใหม่ได้
      if (ok) setOpen(false)
    } catch (e) {
      toast.error(describeDbError(e))
    } finally {
      setBusy(false)
    }
  }

  async function copyRaw() {
    try {
      await navigator.clipboard.writeText(rawText)
      toast.success('คัดลอกข้อความแล้ว')
    } catch {
      toast.error('คัดลอกไม่สำเร็จ — เลือกข้อความแล้วคัดลอกเอง')
    }
  }

  const failed = rows.length === 0 && rawText.length > 0

  return (
    <>
      {/* hidden input — สั่งเปิดด้วย ref จากปุ่ม (เชื่อถือได้กว่า label) */}
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="hidden"
        aria-hidden="true" tabIndex={-1} onChange={onPick} />
      <Button variant="outline" disabled={extracting} onClick={() => inputRef.current?.click()}>
        {extracting ? (
          <><Loader2 className="size-4 animate-spin" /> กำลังอ่าน PDF…</>
        ) : (
          <><FileUp className="size-4" /> นำเข้า PDF</>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          {failed ? (
            <>
              <DialogHeader>
                <DialogTitle>อ่าน PDF ได้ แต่แยกวิชาอัตโนมัติไม่ได้</DialogTitle>
                <DialogDescription>
                  รูปแบบ transcript นี้อาจต่างจากที่รองรับ — นี่คือข้อความที่อ่านได้จากไฟล์
                  กด &quot;คัดลอกข้อความ&quot; แล้วส่งให้ผู้พัฒนาเพื่อปรับให้รองรับรูปแบบนี้
                </DialogDescription>
              </DialogHeader>
              <textarea
                readOnly
                value={rawText}
                onFocus={(e) => e.currentTarget.select()}
                className="h-64 w-full resize-none rounded-lg border border-input bg-muted/30 p-3 font-mono text-xs leading-relaxed"
              />
              <DialogFooter>
                <Button variant="outline" onClick={copyRaw}>
                  <Copy className="size-4" /> คัดลอกข้อความ
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>ตรวจสอบก่อนนำเข้า (จาก PDF)</DialogTitle>
                <DialogDescription>พบ {rows.length} วิชาจากไฟล์ PDF — ตรวจความถูกต้องแล้วกดนำเข้า</DialogDescription>
              </DialogHeader>
              <ImportPreview rows={rows} />
              <DialogFooter>
                <Button onClick={confirm} disabled={busy || rows.length === 0}>
                  {busy ? 'กำลังนำเข้า…' : `นำเข้า ${rows.length} วิชา`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
