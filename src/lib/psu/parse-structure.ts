import { normalizeCode } from '@/lib/engine/normalize'
import { isPass } from '@/lib/engine/grades'

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

// เกรดที่ scmis แสดง (รวมกลุ่มถอน W/WC/WD/WF/WP และเกรดโอน Y/Q)
const GRADE = '(?:A|B\\+|B|C\\+|C|D\\+|D|E|F|P|S|U|G|R|I|Y|Q|W[CDFP]?)'
// เกรดอาจมีเทอมต่อท้าย เช่น A(1/2567) และมีหลายครั้งคั่นด้วย comma เช่น E(2/2567),C(2/2568)
const ATTEMPT_RE = new RegExp(`${GRADE}(?:\\(\\d+\\/\\d+\\))?`, 'g')

const clean = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

// หัวหมวด: <span bold>ชื่อหมวด</span> ... จำนวน N หน่วยกิต (ภายใน <tr> เดียวกัน)
const CATEGORY_RE =
  /<span style="font-weight: bold;">([^<]+)<\/span>(?:(?!<\/tr>)[\s\S])*?จำนวน(?:&nbsp;|\s)*(\d+)(?:&nbsp;|\s)*หน่วยกิต/g

// แถววิชา: รหัส  ชื่อ (หน่วยกิต) [เกรด(เทอม) ในบรรทัดเดียวกัน] </td><td> ...ช่องสถานะ... </tr>
// หน้าจริงของหมวด "วิชาเลือกเสรี" วางเกรด+เทอมต่อท้ายหน่วยกิตในช่องเดียวกัน เช่น
//   "145-101  COMPANION ANIMALS (3) A(1/2567)"
const COURSE_RE = new RegExp(
  `([0-9A-Z]{3}-[0-9]{3}[A-Z0-9]*)\\s+(.+?)\\s*\\((\\d+)\\)(?:\\s*((?:${GRADE}(?:\\(\\d+\\/\\d+\\))?(?:\\s*,\\s*${GRADE}(?:\\(\\d+\\/\\d+\\))?)*|\\(\\d+\\/\\d+\\))))?\\s*</td>\\s*<td>([\\s\\S]*?)</tr>`,
  'g',
)

// ลำดับเกรดจากดีสุด → แย่สุด ใช้เลือก attempt ที่ดีที่สุดเมื่อลงซ้ำ
const GRADE_RANK = [
  'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'P', 'S', 'G', 'R', 'Y', 'Q',
  'E', 'F', 'U', 'I', 'W', 'WC', 'WD', 'WF', 'WP',
]

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
/** เลือกเกรดจากหลาย attempt: เกรดที่ผ่านและดีที่สุด; ถ้าไม่ผ่านเลยเอา attempt สุดท้าย */
function pickGrade(attempts: string[]): string {
  if (!attempts.length) return ''
  const passing = attempts.filter((g) => isPass(g))
  if (passing.length) {
    return passing.reduce((best, g) => (GRADE_RANK.indexOf(g) < GRADE_RANK.indexOf(best) ? g : best))
  }
  return attempts[attempts.length - 1]
}

/** อ่าน "A(1/2567)" หรือ "E(2/2567),C(2/2568)" → เกรดเดียว; คืน null ถ้ามีข้อความอื่นเจือปน */
function parseAttempts(text: string): string | null {
  const attempts = text.match(ATTEMPT_RE)
  if (!attempts) return null
  const leftover = text.replace(ATTEMPT_RE, '').replace(/[\s,]/g, '')
  if (leftover) return null
  return pickGrade(attempts.map((a) => a.replace(/\(\d+\/\d+\)$/, '')))
}

function parseStatus(cell: string, inlineAttempts?: string): { taken: boolean; grade: string } {
  const noComments = cell.replace(/<!--[\s\S]*?-->/g, '')
  if (/background-color:\s*red/i.test(noComments)) return { taken: false, grade: '' }
  const text = clean(noComments.replace(/<[^>]*>/g, ''))
  const fromCell = parseAttempts(text)
  if (fromCell) return { taken: true, grade: fromCell }
  const fromInline = inlineAttempts ? parseAttempts(clean(inlineAttempts)) : null
  if (fromInline) return { taken: true, grade: fromInline }
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
    const { taken, grade } = parseStatus(m[5], m[4])
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
