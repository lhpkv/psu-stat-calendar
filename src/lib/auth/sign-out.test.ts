import { describe, it, expect } from 'vitest'
import { signOutOrThrow } from './sign-out'

describe('signOutOrThrow', () => {
  it('สำเร็จเมื่อ signOut ไม่มี error', async () => {
    await expect(
      signOutOrThrow({ signOut: async () => ({ error: null }) }),
    ).resolves.toBeUndefined()
  })

  it('โยน error เมื่อ signOut ล้มเหลว (ห้าม navigate ออกทั้งที่ session ยังอยู่)', async () => {
    await expect(
      signOutOrThrow({ signOut: async () => ({ error: new Error('server down') }) }),
    ).rejects.toThrow('server down')
  })
})