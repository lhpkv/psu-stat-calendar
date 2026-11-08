import { describe, it, expect } from 'vitest'
import { dedupeTaken } from './dedupe'
import type { TakenCourse } from '@/lib/types'

const tc = (code: string, term: string, grade = 'A'): TakenCourse => ({
  code,
  name: code,
  credits: 3,
  grade,
  term,
})

describe('dedupeTaken', () => {
  it('รวมแถวคีย์ซ้ำ (code + term) โดยเก็บแถวหลังสุด', () => {
    const out = dedupeTaken([tc('346-335', '1/2569', 'F'), tc('346-335', '1/2569', 'A')])
    expect(out).toHaveLength(1)
    expect(out[0].grade).toBe('A')
  })

  it('คนละเทอมต้องไม่ยุบรวมกัน', () => {
    const out = dedupeTaken([tc('346-335', '1/2569'), tc('346-335', '2/2569')])
    expect(out).toHaveLength(2)
  })

  it('รหัสต่างตัวพิมพ์/มีช่องว่างถือเป็นวิชาเดียวกัน', () => {
    const out = dedupeTaken([tc(' 346-335 ', '1/2569'), tc('346-335', '1/2569')])
    expect(out).toHaveLength(1)
  })
})