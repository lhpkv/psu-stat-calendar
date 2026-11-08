import { describe, it, expect } from 'vitest'
import { isPass, bestAttempt, termKey } from './grades'
import type { TakenCourse } from '@/lib/types'

const tc = (code: string, grade: string, term: string): TakenCourse => ({
  code, name: code, credits: 3, grade, term,
})

describe('isPass', () => {
  it('ผ่านสำหรับ D ขึ้นไป และ P/S/G (วิชาวัดผ่าน/ไม่ผ่าน)', () => {
    for (const g of ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'P', 'S', 'G']) expect(isPass(g)).toBe(true)
  })
  it('G = Good = ผ่าน (เช่น 388-100 HEALTH FOR ALL เกรด G)', () => {
    expect(isPass('G')).toBe(true)
    expect(isPass('g')).toBe(true)
  })
  it('ไม่ผ่านสำหรับ E,F,W,U,I และค่าว่าง', () => {
    for (const g of ['E', 'F', 'W', 'U', 'I', '']) expect(isPass(g)).toBe(false)
  })
  it('เกรดโอน Y/Q ถือว่าผ่าน (เทียบโอนรายวิชา)', () => {
    expect(isPass('Y')).toBe(true)
    expect(isPass('Q')).toBe(true)
    expect(isPass('y')).toBe(true)
  })
})

describe('termKey', () => {
  it('3/2567 มาก่อน 1/2568', () => {
    expect(termKey('3/2567')).toBeLessThan(termKey('1/2568'))
  })
})

describe('bestAttempt', () => {
  it('เลือกครั้งที่ผ่าน (322-102 W แล้ว D)', () => {
    const taken = [tc('322-102', 'W', '2/2567'), tc('322-102', 'D', '3/2567')]
    expect(bestAttempt('322-102', taken)?.grade).toBe('D')
  })
  it('เลือกครั้งที่ผ่านล่าสุด (890-102G1 E แล้ว C)', () => {
    const taken = [tc('890-102G1', 'E', '2/2567'), tc('890-102G1', 'C', '2/2568')]
    expect(bestAttempt('890-102G1', taken)?.grade).toBe('C')
  })
  it('คืนผลที่ไม่ผ่านเมื่อไม่เคยผ่าน (473-001G2A E)', () => {
    const best = bestAttempt('473-001G2A', [tc('473-001G2A', 'E', '2/2568')])
    expect(best?.grade).toBe('E')
    expect(isPass(best!.grade)).toBe(false)
  })
})
