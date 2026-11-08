// อ่าน request body แบบ streaming พร้อมเพดานขนาด — หยุดทันทีที่เกิน เพื่อไม่ buffer ไฟล์ยักษ์
// (Content-Length อาจหายไปได้ เช่น Transfer-Encoding: chunked จึงเชื่อ header อย่างเดียวไม่ได้)
export async function readBodyCapped(
  req: Request,
  maxBytes: number,
): Promise<Uint8Array | null> {
  if (!req.body) return new Uint8Array(0)

  const reader = req.body.getReader()
  const parts: Uint8Array[] = []
  let total = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maxBytes) {
        try {
          await reader.cancel()
        } catch {
          // stream ถูกปิดไปแล้ว — ไม่เป็นไร
        }
        return null
      }
      parts.push(value)
    }
  } finally {
    try {
      reader.releaseLock()
    } catch {
      // ไม่มี lock ค้าง — ปลอดภัยที่จะข้าม
    }
  }

  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.byteLength
  }
  return out
}