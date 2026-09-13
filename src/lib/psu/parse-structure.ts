import { normalizeCode } from '@/lib/engine/normalize'

// แกะหน้า std_chkstruc.asp (ผลตรวจสอบหลักสูตรของ scmis) เป็นโครงสร้างที่ใช้งานต่อได้
// pure function — เทสกับ fixture จริงใน parse-structure.test.ts

export interface PsuCourse {
  code: string
  name: string
  credits: number
  grade: string // เกรดจริง ('A','D+','P','WC',... ) — ว่างถ้ายังไม่ได้ลง
  taken: boolean // true = เรียนแล้ว (มีเกรด), false = ยังไม่ครบ (ช่องสีแดง)
  category: string // หมวดที่หัวข้ออยู่ก่อนหน้าวิชานี้
}

export interface PsuCategory {
  title: string
  requiredCredits: number
}

export interface PsuStructure {
  summary: { creditsEarned: number; gpa: number; status: string; degree: string }
  courses: PsuCourse[]
  categories: PsuCategory[]
}

// เกรดที่ scmis แสดง (รวมกลุ่มถอน W/WC/WD/WF/WP)
const GRADE_RE = /^(A|B\+|B|C\+|C|D\+|D|E|F|P|S|U|G|R|I|W[CDFP]?)$/

const clean = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

// หัวหมวด: <span bold>ชื่อหมวด</span> ... จำนวน N หน่วยกิต (ภายใน <tr> เดียวกัน)
const CATEGORY_RE =
  /<span style="font-weight: bold;">([^<]+)<\/span>(?:(?!<\/tr>)[\s\S])*?จำนวน(?:&nbsp;|\s)*(\d+)(?:&nbsp;|\s)*หน่วยกิต/g

// แถววิชา: รหัส  ชื่อ (หน่วยกิต) </td><td> ...ช่องสถานะ... </tr>
const COURSE_RE =
  /([0-9A-Z]{3}-[0-9]{3}[A-Z0-9]*)\s+(.+?)\s*\((\d+)\)\s*<\/td>\s*<td>([\s\S]*?)<\/tr>/g

function parseSummary(html: string): PsuStructure['summary'] {
  const credits = /หน่วยกิตสะสม\(จากระบบ SIS PSU\)(?:&nbsp;|\s)*(\d+)/.exec(html)
  const gpa = /เกรดเฉลี่ยสะสม\(จากระบบ SIS PSU\)(?:&nbsp;|\s)*([\d.]+)/.exec(html)
  const status = /สถานภาพ(?:&nbsp;|\s)*([^<]+?)<br>/.exec(html)
  const degree = /(วิทยาศาสตรบัณฑิต[^<]*?)<br>/.exec(html)
  return {
    creditsEarned: credits ? Number(credits[1]) : 0,
    gpa: gpa ? Number(gpa[1]) : 0,
    status: status ? clean(status[1]) : '',
    degree: degree ? clean(degree[1]) : '',
  }
}

// ช่องสถานะ: วิชาผ่าน → เกรดอยู่ใน <span> หลังคอมเมนต์; ยังไม่ครบ → span background-color:red (ไม่ถูกคอมเมนต์)
function parseStatus(cell: string): { taken: boolean; grade: string } {
  const noComments = cell.replace(/<!--[\s\S]*?-->/g, '')
  if (/background-color:\s*red/i.test(noComments)) return { taken: false, grade: '' }
  const text = clean(noComments.replace(/<[^>]*>/g, ''))
  if (text && GRADE_RE.test(text)) return { taken: true, grade: text }
  return { taken: false, grade: '' }
}

export function parseStructure(html: string): PsuStructure {
  const summary = parseSummary(html)

  const cats: { index: number; title: string; requiredCredits: number }[] = []
  for (const m of html.matchAll(CATEGORY_RE)) {
    cats.push({ index: m.index ?? 0, title: clean(m[1]), requiredCredits: Number(m[2]) })
  }

  const courses: PsuCourse[] = []
  for (const m of html.matchAll(COURSE_RE)) {
    const idx = m.index ?? 0
    let category = ''
    for (const c of cats) {
      if (c.index < idx) category = c.title
      else break
    }
    const { taken, grade } = parseStatus(m[4])
    courses.push({
      code: normalizeCode(m[1]),
      name: clean(m[2]),
      credits: Number(m[3]),
      grade,
      taken,
      category,
    })
  }

  return { summary, courses, categories: cats.map(({ title, requiredCredits }) => ({ title, requiredCredits })) }
}
