import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  user: null as { id: string } | null,
  numPages: 1,
}))

vi.mock('@/lib/supabase/server', () => ({
  hasSupabaseEnv: () => true,
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
  }),
}))

vi.mock('unpdf', () => ({
  getDocumentProxy: async () => ({
    numPages: state.numPages,
    getPage: async () => ({
      getTextContent: async () => ({ items: [] }),
    }),
  }),
}))

import { POST, MAX_PDF_BYTES, MAX_PDF_PAGES } from './route'

const request = (body: Uint8Array) =>
  new Request('http://localhost/api/parse-pdf', {
    method: 'POST',
    body: body as unknown as BodyInit,
  })

beforeEach(() => {
  state.user = { id: 'user-1' }
  state.numPages = 1
})

describe('POST /api/parse-pdf', () => {
  it('ปฏิเสธผู้ที่ยังไม่ล็อกอิน (401)', async () => {
    state.user = null
    const res = await POST(request(new Uint8Array([1, 2, 3])))
    expect(res.status).toBe(401)
  })

  it('ปฏิเสธไฟล์ใหญ่เกินกำหนด (413)', async () => {
    const res = await POST(request(new Uint8Array(MAX_PDF_BYTES + 1)))
    expect(res.status).toBe(413)
  })

  it('ปฏิเสธ PDF ที่มีจำนวนหน้าเกินกำหนด (413)', async () => {
    state.numPages = MAX_PDF_PAGES + 1
    const res = await POST(request(new Uint8Array([1, 2, 3])))
    expect(res.status).toBe(413)
  })

  it('ไฟล์ว่างยังคงตอบ 400', async () => {
    const res = await POST(request(new Uint8Array(0)))
    expect(res.status).toBe(400)
  })

  it('ผู้ที่ล็อกอินและไฟล์ปกติได้ข้อความกลับมา', async () => {
    const res = await POST(request(new Uint8Array([1, 2, 3])))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ text: '' })
  })
})