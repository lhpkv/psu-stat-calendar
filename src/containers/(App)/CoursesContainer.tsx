'use client'

import { useAppData } from '@/hooks/use-app-data'
import { CourseFormDialog } from '@/components/(App)/course-form-dialog'
import { PasteDialog } from '@/components/(App)/paste-dialog'
import { PdfImportButton } from '@/components/(App)/pdf-import-button'
import { GradeBadge } from '@/components/common/status'
import {
  addTaken, updateTaken, deleteTaken, bulkAddTaken,
} from '@/lib/data/repository'
import { termKey } from '@/lib/engine/grades'
import { runMutation } from '@/lib/ui/errors'
import type { TakenCourse } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function CoursesPage() {
  const { taken, refresh } = useAppData()

  const terms = [...new Set(taken.map((t) => t.term))].sort((a, b) => termKey(b) - termKey(a))

  async function handleAdd(c: TakenCourse): Promise<boolean> {
    const ok = await runMutation(async () => {
      await addTaken(c)
      await refresh()
    }, toast.error)
    if (ok) toast.success('เพิ่มรายวิชาแล้ว')
    return ok
  }
  async function handleEdit(c: TakenCourse): Promise<boolean> {
    if (!c.id) return false
    const ok = await runMutation(async () => {
      await updateTaken(c.id!, c)
      await refresh()
    }, toast.error)
    if (ok) toast.success('แก้ไขแล้ว')
    return ok
  }
  async function handleDelete(id?: string): Promise<boolean> {
    if (!id) return false
    const ok = await runMutation(async () => {
      await deleteTaken(id)
      await refresh()
    }, toast.error)
    if (ok) toast.success('ลบแล้ว')
    return ok
  }
  async function handleImport(rows: TakenCourse[]): Promise<boolean> {
    const ok = await runMutation(async () => {
      await bulkAddTaken(rows)
      await refresh()
    }, toast.error)
    if (ok) toast.success(`นำเข้า ${rows.length} วิชาแล้ว`)
    return ok
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">รายวิชาที่เรียนแล้ว ({taken.length})</h1>
        <CourseFormDialog title="เพิ่มรายวิชา" trigger={<Button><Plus className="size-4" /> เพิ่มรายวิชา</Button>} onSubmit={handleAdd} />
        <PdfImportButton onImport={handleImport} />
        <PasteDialog onImport={handleImport} />
      </div>

      {taken.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            ยังไม่มีข้อมูล — กด &quot;นำเข้า PDF&quot; (อัปโหลดไฟล์จาก SIS) หรือ &quot;วางข้อความ&quot;
          </CardContent>
        </Card>
      ) : (
        terms.map((term) => (
          <Card key={term}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">ภาคการศึกษา {term}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {taken.filter((t) => t.term === term).map((t) => (
                  <li key={t.id ?? `${t.code}-${t.term}`} className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
                    <span className="w-18 shrink-0 font-mono text-xs text-primary sm:w-24">{t.code}</span>
                    <span className="min-w-0 flex-1 truncate text-sm" title={t.name}>{t.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{t.credits} นก</span>
                    <GradeBadge grade={t.grade} />
                    <div className="flex shrink-0 items-center">
                      <CourseFormDialog title="แก้ไขรายวิชา" initial={t} onSubmit={handleEdit}
                        trigger={<Button variant="ghost" size="icon-sm" aria-label="แก้ไข"><Pencil className="size-4" /></Button>} />
                      <Button variant="ghost" size="icon-sm" aria-label="ลบ" className="text-rose-600 hover:text-rose-700" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
