import { getDocumentProxy } from 'unpdf'
import { reconstructLines } from '@/lib/engine/pdf-extract'

// แกะข้อความ PDF ฝั่ง server — ไม่มี pdf.js/worker ฝั่ง browser → ทำงานได้ทุกอุปกรณ์ (iOS/Android/desktop)
export const runtime = 'nodejs'
// ให้เวลาแกะข้อความทีละหน้าจนจบ (Vercel default สั้นกว่านี้ — PDF ทรานสคริปต์หน้าเยอะอาจไม่ทัน)
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const data = new Uint8Array(await req.arrayBuffer())
    if (data.byteLength === 0) {
      return Response.json({ error: 'ไม่พบไฟล์ PDF' }, { status: 400 })
    }
    const pdf = await getDocumentProxy(data)
    const pages: string[] = []
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()
      pages.push(reconstructLines(content.items).join('\n'))
    }
    return Response.json({ text: pages.join('\n') })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'อ่าน PDF ไม่สำเร็จ' },
      { status: 422 },
    )
  }
}
