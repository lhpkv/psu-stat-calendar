import type { TakenCourse } from '@/lib/types'

// เกรดที่ PSU ใช้ (รวมรูปแบบที่พบบ่อย)
const GRADES = new Set(['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E', 'F', 'W', 'U', 'G', 'P', 'S', 'I', 'R', 'Y', 'Q'])

// รหัสวิชาขึ้นต้นบรรทัด: 145-101, 890-101G1, B03-001G4, 315-202G2B
const CODE_AT_START = /^([0-9A-Za-z]{3}-\d{3}[A-Za-z0-9]*)\b\s*(.*)$/

/**
 * ตรวจหัวเทอมแบบยืดหยุ่น — รองรับ:
 *  "ภาคการศึกษา 1/2567", "ภาคการศึกษาที่ 1/2567", "ภาคเรียนที่ 1/2567",
 *  "ภาคฤดูร้อน/2567" (=เทอม 3), "Semester 1/2567"
 */
export function matchTermHeader(line: string): string | null {
  let m = /ภาค(?:การศึกษา|เรียน)?\s*(?:ที่)?\s*([1-3])\s*[/.]\s*(\d{4})/.exec(line)
  if (m) return `${m[1]}/${m[2]}`
  m = /(?:ภาค)?ฤดูร้อน\s*[/.]?\s*(\d{4})/.exec(line)
  if (m) return `3/${m[1]}`
  m = /Semester\s*([1-3])\s*[/.,]\s*(\d{4})/i.exec(line)
  if (m) return `${m[1]}/${m[2]}`
  return null
}

/**
 * แยกบรรทัดรายวิชาแบบ token-based (ทนต่อรูปแบบที่ต่างกัน):
 *  รหัส → [ชื่อวิชา] → [ตอน] → หน่วยกิต → เกรด → [คอลัมน์อื่น ๆ ต่อท้าย]
 *  รองรับ credits แบบ "3", "3.0", "3(3-0-6)", และคอลัมน์เกินท้ายบรรทัด (เช่น แต้มเฉลี่ย)
 */
function matchCourseLine(line: string, term: string): TakenCourse | null {
  const cm = CODE_AT_START.exec(line)
  if (!cm) return null
  const code = cm[1].toUpperCase()
  const tokens = cm[2].trim().split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return null // อย่างน้อยต้องมี หน่วยกิต + เกรด

  // เกรด = token สุดท้ายที่เป็นเกรดที่ถูกต้อง (ข้ามคอลัมน์ต่อท้าย เช่น แต้มเฉลี่ย)
  let gi = -1
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (GRADES.has(tokens[i].toUpperCase())) {
      gi = i
      break
    }
  }
  if (gi <= 0) return null // ต้องมีอย่างน้อย credits ก่อนหน้าเกรด
  const grade = tokens[gi].toUpperCase()

  // หน่วยกิต = token ตัวเลขตัวแรกก่อนเกรด (รองรับ "3", "3.0", "3(3-0-6)")
  let ci = -1
  let credits = 0
  for (let i = gi - 1; i >= 0; i--) {
    const nm = /^(\d+(?:\.\d+)?)(?:\(|$)/.exec(tokens[i])
    if (nm) {
      credits = Number(nm[1])
      ci = i
      break
    }
  }
  if (ci < 0) return null

  // ตอน = token ก่อนหน้าหน่วยกิต ถ้าเป็นเลข/รหัสตอนสั้น ๆ (เช่น 01, 1, P1)
  let nameEnd = ci
  let section = ''
  const prev = tokens[ci - 1]
  if (prev && /\d/.test(prev) && /^[0-9A-Za-z]{1,4}$/.test(prev)) {
    section = prev
    nameEnd = ci - 1
  }

  const name = tokens.slice(0, nameEnd).join(' ').trim()
  if (!name) return null // ต้องมีชื่อวิชา (กันบรรทัดสรุป/ตัวเลขล้วน)

  return { code, name, section, credits, grade, term }
}

/** แยกข้อความ transcript แบบเทอมเดียว (ใส่ term เอง) */
export function parseTranscript(text: string, term: string): TakenCourse[] {
  const out: TakenCourse[] = []
  for (const raw of (text || '').split(/\r?\n/)) {
    const c = matchCourseLine(raw.trim().replace(/\s+/g, ' '), term)
    if (c) out.push(c)
  }
  return out
}

/**
 * แยก transcript จาก SIS ที่มีหลายเทอม — ตรวจหัวเทอมแล้วผูกรายวิชาเข้าเทอมที่ถูกต้อง
 * ถ้าตรวจหัวเทอมไม่เจอ ก็ยังดึงรายวิชาออกมา (term ว่าง ให้ผู้ใช้กรอกเอง) — ดีกว่าได้ 0 วิชา
 * @param fallbackTerm เทอมเริ่มต้นสำหรับบรรทัดก่อนเจอหัวเทอมแรก
 */
export function parseSisTranscript(text: string, fallbackTerm = ''): TakenCourse[] {
  const out: TakenCourse[] = []
  let currentTerm = fallbackTerm
  for (const raw of (text || '').split(/\r?\n/)) {
    const line = raw.trim().replace(/\s+/g, ' ')
    if (!line) continue
    const th = matchTermHeader(line)
    if (th) {
      currentTerm = th
      continue
    }
    const c = matchCourseLine(line, currentTerm)
    if (c) out.push(c)
  }
  return out
}
