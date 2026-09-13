import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// เข้ารหัสรหัสผ่าน scmis ด้วย AES-256-GCM (stdlib — ไม่เพิ่ม dependency)
// คีย์ = hex 64 ตัว (32 ไบต์) ใน env PSU_ENC_KEY (เก็บบน Railway, ไม่อยู่ใน repo)
// สร้างครั้งเดียว: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

export interface Sealed {
  cipher: string // base64
  iv: string // base64
  tag: string // base64
}

function envKey(): Buffer {
  const hex = process.env.PSU_ENC_KEY
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('PSU_ENC_KEY ต้องเป็น hex 64 ตัว (32 ไบต์)')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string, key: Buffer = envKey()): Sealed {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key, iv)
  const cipher = Buffer.concat([c.update(plaintext, 'utf8'), c.final()])
  return {
    cipher: cipher.toString('base64'),
    iv: iv.toString('base64'),
    tag: c.getAuthTag().toString('base64'),
  }
}

export function decrypt(s: Sealed, key: Buffer = envKey()): string {
  const d = createDecipheriv('aes-256-gcm', key, Buffer.from(s.iv, 'base64'))
  d.setAuthTag(Buffer.from(s.tag, 'base64'))
  return Buffer.concat([d.update(Buffer.from(s.cipher, 'base64')), d.final()]).toString('utf8')
}
