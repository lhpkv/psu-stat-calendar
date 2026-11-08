import { getDocumentProxy } from 'unpdf'
import { reconstructLines } from '@/lib/engine/pdf-extract'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'
import { readBodyCapped } from '@/lib/api/read-body'

// แกะข้อความ PDF ฝั่ง server — ไม่มี pdf.js/worker ฝั่ง browser → ทำงานได้ทุกอุปกรณ์ (iOS/Android/desktop)
export const runtime = 'nodejs'
// ให้เวลาแกะข้อความทีละหน้าจนจบ (Vercel default สั้นกว่านี้ — PDF ทรานสคริปต์หน้าเยอะอาจไม่ทัน)
export const maxDuration = 60

// จำกัดขนาด/จำนวนหน้า — endpoint นี้กิน CPU/หน่วยความจำ จึงต้องกันทั้งไฟล์ยักษ์และ PDF ที่มีหลายร้อยหน้า
export const MAX_PDF_BYTES = 10 * 1024 * 1024
export const MAX_PDF_PAGES = 120

export async function POST(req: Request) {
  if (!hasSupabaseEnv()) {
    return Response.json({ error: 'ยังไม่ได้ตั้งค่า Supabase' }, { status: 503 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 })
  }

  // ตรวจ Content-Length ก่อนอ่าน body เพื่อไม่ต้อง buffer ไฟล์ใหญ่เข้าหน่วยความจำ
  const declared = Number(req.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > MAX_PDF_BYTES) {
    return Response.json({ error: 'ไฟล์ PDF ใหญ่เกิน 10 MB' }, { status: 413 })
  }

  try {
    // อ่านแบบ streaming + เพดานขนาด เพื่อกัน chunked request ที่ไม่มี Content-Length
    const data = await readBodyCapped(req, MAX_PDF_BYTES)
    if (!data) {
      return Response.json({ error: 'ไฟล์ PDF ใหญ่เกิน 10 MB' }, { status: 413 })
    }
    if (data.byteLength === 0) {
      return Response.json({ error: 'ไม่พบไฟล์ PDF' }, { status: 400 })
    }

    const pdf = await getDocumentProxy(data)
    if (pdf.numPages > MAX_PDF_PAGES) {
      return Response.json(
        { error: `PDF มีจำนวนหน้าเกิน ${MAX_PDF_PAGES} หน้า` },
        { status: 413 },
      )
    }

    const pages: string[] = []
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()
      pages.push(reconstructLines(content.items).join('\n'))
    }
    return Response.json({ text: pages.join('\n') })
  } catch (e) {
    console.error('[parse-pdf]', e)
    return Response.json({ error: 'อ่าน PDF ไม่สำเร็จ' }, { status: 422 })
  }
}