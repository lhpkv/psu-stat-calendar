import { describe, it, expect, vi } from 'vitest'
import { readBodyCapped } from './read-body'

const post = (body: BodyInit) =>
  new Request('http://localhost/upload', {
    method: 'POST',
    body,
    // stream body ต้องระบุ duplex ใน Node
    duplex: 'half',
  } as RequestInit)

const chunks = (...parts: Uint8Array[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      for (const p of parts) controller.enqueue(p)
      controller.close()
    },
  })

describe('readBodyCapped', () => {
  it('อ่านจนจบและประกอบเป็น byte array เดียวเมื่อไม่เกินกำหนด', async () => {
    const req = post(chunks(new Uint8Array([1, 2]), new Uint8Array([3, 4, 5])))

    const out = await readBodyCapped(req, 10)

    expect(out).not.toBeNull()
    expect([...out!]).toEqual([1, 2, 3, 4, 5])
  })

  it('หยุดทันทีและยกเลิก stream เมื่อเกินกำหนด (ไม่ buffer ทั้งก้อน)', async () => {
    const cancel = vi.fn()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2, 3]))
        controller.enqueue(new Uint8Array([4, 5, 6]))
        controller.enqueue(new Uint8Array(1024))
      },
      cancel,
    })
    const req = post(stream)

    const out = await readBodyCapped(req, 4)

    expect(out).toBeNull()
    expect(cancel).toHaveBeenCalled()
  })

  it('body ว่างคืน byte array ว่าง', async () => {
    const req = post(new Uint8Array(0))
    const out = await readBodyCapped(req, 10)
    expect(out?.byteLength).toBe(0)
  })
})