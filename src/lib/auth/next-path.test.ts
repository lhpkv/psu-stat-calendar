import { describe, it, expect } from 'vitest'
import { safeNextPath } from './next-path'

describe('safeNextPath', () => {
  it('รับ path ภายในระบบ', () => {
    expect(safeNextPath('/auth/reset')).toBe('/auth/reset')
    expect(safeNextPath('/requirements/ge')).toBe('/requirements/ge')
  })

  it('กัน open redirect ไปโดเมนนอก', () => {
    expect(safeNextPath('https://evil.example')).toBe('/dashboard')
    expect(safeNextPath('//evil.example')).toBe('/dashboard')
    expect(safeNextPath('/\\evil.example')).toBe('/dashboard')
    expect(safeNextPath(null)).toBe('/dashboard')
  })
})