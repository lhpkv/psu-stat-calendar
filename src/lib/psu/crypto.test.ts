import { describe, it, expect } from 'vitest'
import { randomBytes } from 'node:crypto'
import { encrypt, decrypt } from './crypto'

const key = randomBytes(32)

describe('psu crypto', () => {
  it('round-trips utf-8 (incl. ภาษาไทย)', () => {
    const s = encrypt('p@ssw0rd รหัสผ่าน', key)
    expect(decrypt(s, key)).toBe('p@ssw0rd รหัสผ่าน')
  })

  it('rejects a tampered auth tag', () => {
    const s = encrypt('secret', key)
    const bad = { ...s, tag: randomBytes(16).toString('base64') }
    expect(() => decrypt(bad, key)).toThrow()
  })
})
