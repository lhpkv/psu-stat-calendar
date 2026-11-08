import { describe, it, expect } from 'vitest'
import { describeAuthError } from './messages'

describe('describeAuthError', () => {
  it('รหัสผ่านผิด', () => {
    expect(describeAuthError(new Error('Invalid login credentials'))).toBe(
      'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    )
  })

  it('ยังไม่ยืนยันอีเมล', () => {
    expect(describeAuthError(new Error('Email not confirmed'))).toContain('ยังไม่ได้ยืนยันอีเมล')
  })

  it('อีเมลซ้ำ', () => {
    expect(describeAuthError({ message: 'User already registered' })).toContain('มีบัญชีอยู่แล้ว')
  })

  it('ยิงถี่เกินไป', () => {
    expect(describeAuthError(new Error('For security purposes, you can only request this after 42 seconds'))).toContain(
      'บ่อยเกินไป',
    )
  })

  it('ข้อความที่ไม่รู้จัก → คงข้อความเดิม', () => {
    expect(describeAuthError(new Error('Something odd'))).toBe('Something odd')
  })

  it('ไม่มีข้อความ → ข้อความกลาง ๆ', () => {
    expect(describeAuthError(null)).toBe('เกิดข้อผิดพลาด ลองใหม่อีกครั้ง')
  })
})