import { describe, it, expect, vi } from 'vitest'
import { describeDbError, runMutation } from './errors'

describe('describeDbError', () => {
  it('แปลง Postgres 23505 เป็นข้อความที่ผู้ใช้เข้าใจ', () => {
    expect(describeDbError({ code: '23505', message: 'duplicate key value' })).toBe(
      'มีรายวิชานี้ในเทอมนี้อยู่แล้ว',
    )
  })

  it('ใช้ข้อความจาก Error ปกติ', () => {
    expect(describeDbError(new Error('network down'))).toBe('network down')
  })

  it('ใช้ message จาก object แบบ PostgREST (ไม่ใช่ instanceof Error)', () => {
    expect(describeDbError({ message: 'permission denied for table taken_courses' })).toBe(
      'permission denied for table taken_courses',
    )
  })

  it('ค่าว่าง/ไม่รู้จักได้ข้อความกลาง ๆ', () => {
    expect(describeDbError(null)).toBe('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง')
    expect(describeDbError({})).toBe('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง')
  })
})

describe('runMutation', () => {
  it('คืน true และไม่เรียก onError เมื่อสำเร็จ', async () => {
    const onError = vi.fn()
    const ok = await runMutation(async () => {}, onError)
    expect(ok).toBe(true)
    expect(onError).not.toHaveBeenCalled()
  })

  it('คืน false และส่งข้อความให้ onError เมื่อล้มเหลว', async () => {
    const onError = vi.fn()
    const ok = await runMutation(async () => {
      throw { code: '23505' }
    }, onError)
    expect(ok).toBe(false)
    expect(onError).toHaveBeenCalledWith('มีรายวิชานี้ในเทอมนี้อยู่แล้ว')
  })
})