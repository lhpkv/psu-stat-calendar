import { describe, it, expect } from 'vitest'
import { parseTranscript, parseSisTranscript } from './parse-transcript'

const sample = `รหัสวิชา ชื่อวิชา ตอน หน่วยกิต ผลการเรียน
145-101 COMPANION ANIMALS 01 3 A
322-101 CALCULUS I 03 3 D
890-101G1 ESSENTIAL ENGLISH 16 2 U
สรุประดับภาคการศึกษา (Semester)`

describe('parseTranscript', () => {
  it('แยกรหัส/ชื่อ/ตอน/หน่วยกิต/เกรด และข้ามหัว/ท้ายตาราง', () => {
    const rows = parseTranscript(sample, '1/2567')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({
      code: '145-101', name: 'COMPANION ANIMALS', section: '01', credits: 3, grade: 'A', term: '1/2567',
    })
    expect(rows[2]).toMatchObject({ code: '890-101G1', credits: 2, grade: 'U' })
  })
})

const multiTerm = `ผลการเรียน
นายลฏุฟี บินมะสาและ รหัสนักศึกษา 6710210764
ภาคการศึกษา 1/2567
รหัสวิชา ชื่อวิชา ตอน หน่วยกิต ผลการเรียน
145-101 COMPANION ANIMALS 01 3 A
322-101 CALCULUS I 03 3 D
สรุประดับภาคการศึกษา (Semester)
หน่วยกิตที่ลงทะเบียน 21
ภาคการศึกษา 2/2567
193-031G8 NATURAL THERAPY 04 2 B+
322-102 CALCULUS II 01 3 W
890-102G1 EVERYDAY ENGLISH 13 2 E
ภาคการศึกษา 3/2567
322-102 CALCULUS II 02 3 D`

describe('parseSisTranscript (หลายเทอมอัตโนมัติ)', () => {
  it('ผูกรายวิชาเข้าเทอมที่ถูกต้องตามหัว "ภาคการศึกษา"', () => {
    const rows = parseSisTranscript(multiTerm)
    expect(rows).toHaveLength(6)
    const byCodeTerm = (code: string) => rows.find((r) => r.code === code)!
    expect(byCodeTerm('145-101').term).toBe('1/2567')
    expect(byCodeTerm('193-031G8').term).toBe('2/2567')
    // 322-102 มี 2 ครั้ง (2/2567 W และ 3/2567 D)
    const calc2 = rows.filter((r) => r.code === '322-102')
    expect(calc2.map((r) => r.term).sort()).toEqual(['2/2567', '3/2567'])
    expect(calc2.find((r) => r.term === '3/2567')!.grade).toBe('D')
  })
  it('ข้ามบรรทัดก่อนเจอหัวเทอมแรก และข้ามบรรทัดสรุป', () => {
    const rows = parseSisTranscript(multiTerm)
    expect(rows.every((r) => r.term)).toBe(true)
  })
})

describe('parseSisTranscript — รองรับรูปแบบที่หลากหลายขึ้น (regression "แยกวิชาไม่ได้")', () => {
  it('หัวเทอม "ภาคการศึกษาที่ 1/2567" (มีคำว่า "ที่")', () => {
    const r = parseSisTranscript('ภาคการศึกษาที่ 1/2567\n346-111 PRINCIPLES OF STATISTICS 01 3 A')
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ code: '346-111', term: '1/2567', grade: 'A' })
  })
  it('หัวเทอม "ภาคเรียนที่ 2/2567"', () => {
    const r = parseSisTranscript('ภาคเรียนที่ 2/2567\n322-102 CALCULUS II 01 3 B')
    expect(r[0]).toMatchObject({ term: '2/2567', grade: 'B' })
  })
  it('หน่วยกิตแบบ 3(3-0-6) + คอลัมน์แต้มเฉลี่ยต่อท้าย', () => {
    const r = parseSisTranscript('ภาคการศึกษาที่ 2/2567\n322-102 CALCULUS II 01 3(3-0-6) B+ 3.50')
    expect(r[0]).toMatchObject({ code: '322-102', credits: 3, grade: 'B+', section: '01' })
  })
  it('ไม่มีคอลัมน์ตอน', () => {
    const r = parseTranscript('145-101 COMPANION ANIMALS 3 A', '1/2567')
    expect(r[0]).toMatchObject({ code: '145-101', name: 'COMPANION ANIMALS', credits: 3, grade: 'A', section: '' })
  })
  it('ภาคฤดูร้อน = เทอม 3', () => {
    const r = parseSisTranscript('ภาคฤดูร้อน/2567\n322-102 CALCULUS II 02 3 D')
    expect(r[0]).toMatchObject({ code: '322-102', term: '3/2567', grade: 'D' })
  })
  it('ชื่อวิชาภาษาไทยที่มีตัวเลขนำ', () => {
    const r = parseTranscript('950-103G5 24 บอดี&มายด์ 01 2 B', '1/2567')
    expect(r[0]).toMatchObject({ code: '950-103G5', name: '24 บอดี&มายด์', credits: 2, grade: 'B' })
  })
  it('ดึงวิชาได้แม้ไม่เจอหัวเทอม (term ว่าง — ดีกว่าได้ 0)', () => {
    const r = parseSisTranscript('346-111 PRINCIPLES OF STATISTICS 01 3 A')
    expect(r).toHaveLength(1)
    expect(r[0].code).toBe('346-111')
  })
})

// transcript จริงจาก SIS ฉบับ "Study Result" ภาษาอังกฤษ (หัวเทอม "Semester X/YYYY") — ปิดชื่อ/รหัส นศ.
const realEnglish = `Study Result
Miss STUDENT NAME Student Id 0000000000
Prince of Songkla University Hat Yai Campus Faculty of Science Division of Computational Science Statistics
Semester 1/2024
Subject Code Subject Name Section Credit Grade
145-101 COMPANION ANIMALS 01 3 A
322-101 CALCULUS I 03 3 E
324-101 GENERAL CHEMISTRY I 02 3 C
325-101 GENERAL CHEMISTRY LAB I 07 1 B
330-101 PRINCIPLES OF BIOLOGY I 02 3 D+
331-101 PRINCIPLES OF BIOLOGY LAB I 04 1 C
332-101 FUNDAMENTAL PHYSICS 02 3 D
333-101 FUNDAMENTAL PHYSICS LABORATORY 11 1 B
388-100 HEALTH FOR ALL 05 1 G
890-101G1 ESSENTIAL ENGLISH 17 2 S
950-102 HAPPY AND PEACEFUL LIFE 10 3 A
Semester Summary
Semester Credits 21
Semester Grade Point Average Credits 45.50
Semester Grade Point Average 2.16
Cumulative Summary
Cumulative Credits 21
Semester 2/2024
Subject Code Subject Name Section Credit Grade
315-104G4 DIGITAL TECHNOLOGY LITERACY 03 2 C+
322-101 CALCULUS I 02 3 D+
322-102 CALCULUS II 01 3 W
346-111 PRINCIPLES OF STATISTICS 01 3 D
346-161 STANDARD STATISTICAL SOFTWARE 01 3 C
460-001 IDEA TO ENTREPRENEURSHIP 08 1 W
890-102G1 EVERYDAY ENGLISH 13 2 D
895-001 GOOD CITIZENS 03 2 A
Semester Summary
Semester Credits 15
Semester 1/2025
Subject Code Subject Name Section Credit Grade
003-001 VOL LEADER FOR SUS COM DEL 03 3 A
142-010G2A ORGANIC THINKING 01 2 C+
193-031G8 NATURAL THERAPY 04 2 C
315-103G8 INTRO TO INTELLEC PROTERTY 01 2 A
315-202G2B THINKING AND REASONING 04 2 C+
346-221 PROBABILITY FOR STATISTICS 01 3 D+
346-222 NONPARAMETRIC STATISTICS 01 3 C+
346-231 INTRODUCTION TO INSURANCE 01 3 B+
460-001 IDEA TO ENTREPRENEURSHIP 03 1 A
874-192 LAW RELAT TO OCCU & EVERYDAY 01 2 W
890-103G1 ENGLISH ON THE GO 10 2 C+
B03-001G4 GET SMART ON CYBER THREATS 02 2 C
Semester 2/2025
Subject Code Subject Name Section Credit Grade
315-102G8 THE AESTHETIC IN PHOTOGRAPHY 03 2 D
346-223 MATHEMATICAL STATISTICS I 01 3 D+
346-232 REGRESSION ANALYSIS 01 4 C
346-241 MO:LINEAR ALGEBRA & OPERA RES 01 5 C+
346-261 BASIC COMPUTER PROGRAMMING 01 2 D+
346-343 INVENTORY MANAGEMENT 01 3 W
346-442 STOCHASTIC PROCESS 01 3 A
874-192 LAW RELAT TO OCCU & EVERYDAY 01 2 D
Created at 06/08/2026 22:18:31 Generated from PSU Student Information System`

describe('parseSisTranscript — transcript จริง "Study Result" ภาษาอังกฤษ (เคสที่เคยพัง)', () => {
  const rows = parseSisTranscript(realEnglish)
  it('แยกได้ครบ 39 วิชา (ข้ามหัวตาราง/สรุป/ชื่อ-รหัส นศ.)', () => {
    expect(rows).toHaveLength(39)
  })
  it('ผูกเทอมถูกจากหัว "Semester X/YYYY"', () => {
    const find = (code: string, grade: string) => rows.find((r) => r.code === code && r.grade === grade)!
    expect(find('145-101', 'A').term).toBe('1/2024')
    expect(find('315-104G4', 'C+').term).toBe('2/2024')
    expect(find('B03-001G4', 'C').term).toBe('1/2025')
    expect(find('346-442', 'A').term).toBe('2/2025')
  })
  it('รองรับเกรด G / S และรหัสขึ้นต้นตัวอักษร (B03-)', () => {
    expect(rows.find((r) => r.code === '388-100')!.grade).toBe('G')
    expect(rows.find((r) => r.code === '890-101G1' && r.term === '1/2024')!.grade).toBe('S')
    expect(rows.find((r) => r.code === 'B03-001G4')).toBeTruthy()
  })
  it('ไม่เก็บบรรทัดสรุป/ตัวเลขล้วน เป็นวิชา', () => {
    expect(rows.every((r) => /^[0-9A-Z]{3}-\d{3}/.test(r.code))).toBe(true)
    expect(rows.some((r) => r.name === '' || /summary|credits/i.test(r.name))).toBe(false)
  })
})

describe('เกรดโอน Y/Q', () => {
  it('แยกบรรทัดวิชาที่ได้เกรด Y หรือ Q ได้', () => {
    const text = `145-101 COMPANION ANIMALS 3 Y
890-102G1 EVERYDAY ENGLISH 2 Q`
    const rows = parseTranscript(text, '1/2567')
    expect(rows.find((r) => r.code === '145-101')).toMatchObject({ grade: 'Y', credits: 3 })
    expect(rows.find((r) => r.code === '890-102G1')).toMatchObject({ grade: 'Q', credits: 2 })
  })
})
