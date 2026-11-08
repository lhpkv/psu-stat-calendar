import type { Program, Requirement, Plan, GeFramework, Category } from './types'
import { COURSES } from './courses'
import { GE_CATALOG, type GeGroup } from './ge-catalog'

/** สร้าง fixed requirement จากรหัสวิชา (label/credits ดึงจาก COURSES) */
function fixed(
  code: string,
  category: Category,
  rec?: { year?: number; term?: number },
  extra?: { prereq?: string[]; verifyNote?: string },
): Requirement {
  const info = COURSES[code]
  return {
    kind: 'fixed',
    id: `fixed:${code}`,
    category,
    label: info?.name ?? code,
    courseCodes: [code],
    credits: info?.credits ?? 0,
    recYear: rec?.year,
    recTerm: rec?.term,
    prereq: extra?.prereq,
    verifyNote: extra?.verifyNote,
  }
}

// ── 2.1 วิทย์พื้นฐาน 24 (รหัส, ปี, เทอม ตามแผนการเรียน) ──
const FOUNDATION: Requirement[] = [
  fixed('322-101', 'foundation', { year: 1, term: 1 }),
  fixed('324-101', 'foundation', { year: 1, term: 1 }),
  fixed('325-101', 'foundation', { year: 1, term: 1 }),
  fixed('330-101', 'foundation', { year: 1, term: 1 }),
  fixed('331-101', 'foundation', { year: 1, term: 1 }),
  fixed('332-101', 'foundation', { year: 1, term: 1 }),
  fixed('333-101', 'foundation', { year: 1, term: 1 }),
  fixed('322-102', 'foundation', { year: 1, term: 2 }),
  fixed('346-111', 'foundation', { year: 1, term: 2 }),
  fixed('346-361', 'foundation', { year: 3, term: 1 }),
]

// ── 2.2 บังคับ (ร่วมทั้งสองแผน) ──
const CORE_COMMON: Requirement[] = [
  fixed('346-161', 'core', { year: 1, term: 2 }),
  fixed('346-221', 'core', { year: 2, term: 1 }),
  fixed('346-222', 'core', { year: 2, term: 1 }),
  fixed('346-231', 'core', { year: 2, term: 1 }),
  fixed('346-223', 'core', { year: 2, term: 2 }),
  fixed('346-232', 'core', { year: 2, term: 2 }),
  fixed('346-241', 'core', { year: 2, term: 2 }),
  fixed('346-261', 'core', { year: 2, term: 2 }),
  fixed('346-321', 'core', { year: 3, term: 1 }),
  fixed('346-322', 'core', { year: 3, term: 1 }),
  fixed('346-331', 'core', { year: 3, term: 1 }),
  fixed('346-332', 'core', { year: 3, term: 2 }),
  fixed('346-333', 'core', { year: 3, term: 2 }),
  fixed('346-334', 'core', { year: 3, term: 2 }),
  fixed('346-351', 'core', { year: 3, term: 2 }),
  fixed('346-451', 'core', { year: 3, term: 2 }),
  fixed('346-441', 'core', { year: 4, term: 1 }),
  fixed('346-471', 'core', { year: 4, term: 1 }),
  fixed('346-491', 'core', { year: 4, term: 1 }),
]

function coreFor(plan: Plan): Requirement[] {
  return plan === 'coop'
    ? [...CORE_COMMON, fixed('346-472', 'core', { year: 4, term: 2 })]
    : [...CORE_COMMON, fixed('346-492', 'core', { year: 4, term: 2 })]
}

// ── 2.3 วิชาเลือกสาขา ──
export const MAJOR_G1_CODES = new Set([
  '346-335', '346-336', '346-341', '346-342', '346-343', '346-344', '346-371',
  '346-431', '346-432', '346-442', '346-443', '346-444', '346-445', '346-481', '346-482',
  '322-201', '322-211', '322-252', '322-322', '322-324', '322-355',
])
export const MAJOR_G2_CODES = new Set([
  '225-355', '308-231', '308-232', '308-233', '308-311', '308-352',
  '344-212', '344-312', '344-334', '345-211', '460-101', '460-202', '476-201',
  '542-261', '876-102', '875-309',
])

function majorElectives(plan: Plan): Requirement[] {
  return [
    {
      kind: 'bucket',
      id: 'major_elec_g1',
      category: 'major_elective',
      label: 'วิชาเลือกสาขา (ภาควิชาคณิต-สถิติ) อย่างน้อย 12 นก',
      needCredits: 12,
      eligible: 'major_elec_g1',
      recYear: 3,
      recTerm: 1,
    },
    {
      kind: 'bucket',
      id: 'major_elec_g2',
      category: 'major_elective',
      // กลุ่ม 2 เป็น "ไม่เกิน" ไม่ใช่บังคับ — bucket นี้คือส่วนที่เหลือของ 21 นก.
      // จึงรับได้ทั้งกลุ่ม 1 ที่เกิน 12 นก. และกลุ่ม 2 (โดยรวมแล้วกลุ่ม 2 ยังไม่เกิน 9/5 นก.)
      label: `วิชาเลือกสาขาส่วนที่เหลือ (กลุ่ม 1 เพิ่มเติม หรือต่างคณะ) ไม่เกิน ${plan === 'coop' ? 5 : 9} นก`,
      needCredits: plan === 'coop' ? 5 : 9,
      remainderOf: { total: plan === 'coop' ? 17 : 21, dependsOn: 'major_elec_g1' },
      eligible: 'major_elec_any',
      recYear: 3,
      recTerm: 1,
    },
  ]
}

// ── GE กลาง 2565 (GE1–8, 24 นก) ──
const opt = (codes: string[]) => codes.map((code) => ({ code, credits: 2 }))

/** options ของ GE choose = ทุกวิชาในแคตตาล็อกกลุ่มนั้น (GE_CATALOG = single source of truth)
 *  + รหัสเก่า (ไม่มี suffix Gx) ที่ยังพบใน transcript ของรุ่นเปลี่ยนผ่าน
 *  แก้บั๊ก: เดิม hardcode แค่ subset → วิชา GE ในแคตตาล็อกที่ไม่อยู่ในลิสต์จะไม่ถูกนับ */
function geOptions(group: GeGroup, ...legacy: string[]): { code: string; credits: number }[] {
  return [
    ...GE_CATALOG.filter((c) => c.group === group).map((c) => ({ code: c.code, credits: c.credits })),
    ...legacy.map((code) => ({ code, credits: 2 })),
  ]
}

export const GE_2565: Requirement[] = [
  {
    kind: 'choose', id: 'ge:GE1', category: 'ge', label: 'GE1 ภาษาและการสื่อสาร (4)',
    needCredits: 4, recYear: 1, recTerm: 2, options: geOptions('GE1'),
  },
  {
    kind: 'choose', id: 'ge:GE2A', category: 'ge', label: 'GE2A การคิดเชิงตรรกะและตัวเลข (2)',
    needCredits: 2, recYear: 2, recTerm: 1, options: geOptions('GE2A'),
  },
  {
    kind: 'choose', id: 'ge:GE2B', category: 'ge', label: 'GE2B การคิดเชิงระบบ (2)',
    needCredits: 2, recYear: 2, recTerm: 1, options: geOptions('GE2B'),
  },
  {
    kind: 'choose', id: 'ge:GE3', category: 'ge', label: 'GE3 การคิดแบบผู้ประกอบการ (2)',
    needCredits: 2, recYear: 2, recTerm: 2, options: geOptions('GE3', '460-001'),
    verifyNote: 'ถ้าลง 460-001 (1 นก รหัสเก่า) อาจไม่ครบ 2 นก ตามเกณฑ์ GE 2565 — ยืนยันกับอาจารย์ที่ปรึกษา/SIS',
  },
  {
    kind: 'choose', id: 'ge:GE4', category: 'ge', label: 'GE4 การใช้เทคโนโลยีดิจิทัล (2)',
    needCredits: 2, recYear: 1, recTerm: 2, options: geOptions('GE4'),
  },
  {
    kind: 'choose', id: 'ge:GE5', category: 'ge', label: 'GE5 สุขภาวะองค์รวม (2)',
    needCredits: 2, recYear: 1, recTerm: 1, options: geOptions('GE5', '388-100'),
    verifyNote: 'ถ้าลง 388-100 (1 นก รหัสเก่า) อาจไม่ครบ 2 นก ตามเกณฑ์ GE 2565 — ยืนยันกับอาจารย์ที่ปรึกษา/SIS',
  },
  {
    kind: 'choose', id: 'ge:GE6', category: 'ge', label: 'GE6 จิตสาธารณะและการพัฒนาที่ยั่งยืน (2)',
    needCredits: 2, recYear: 2, recTerm: 2, options: geOptions('GE6', '003-001'),
  },
  {
    kind: 'choose', id: 'ge:GE7', category: 'ge', label: 'GE7 การปรับตัวให้เข้ากับพลวัตของโลก (2)',
    needCredits: 2, recYear: 1, recTerm: 2, options: geOptions('GE7'),
  },
  {
    kind: 'bucket', id: 'ge:GE8', category: 'ge', label: 'GE8 รายวิชาเลือก (≥6)',
    needCredits: 6, eligible: 'ge8', recYear: 1, recTerm: 2,
  },
]

// ── GE หลักสูตรสถิติ 2564 เดิม (สาระ 1–7, 30 นก) — preset ทางเลือก ──
// รองรับทั้งรหัสเก่าและรหัส GE กลางใหม่ (equivalent) ในแต่ละสาระ
const GE_CORE_2564: Requirement[] = [
  {
    kind: 'choose', id: 'sara:1', category: 'ge', label: 'สาระ 1 ศาสตร์พระราชาและประโยชน์เพื่อนมนุษย์ (4)',
    needCredits: 4, recYear: 1, recTerm: 1,
    options: opt(['001-102', '388-100', '315-200', '003-001', '003-001G6', '388-100G5']),
  },
  {
    kind: 'choose', id: 'sara:2', category: 'ge', label: 'สาระ 2 ความเป็นพลเมืองและชีวิตที่สันติ (5)',
    needCredits: 5, recYear: 1, recTerm: 1,
    options: opt(['950-102', '895-001', '950-102G5']),
  },
  {
    kind: 'choose', id: 'sara:3', category: 'ge', label: 'สาระ 3 การเป็นผู้ประกอบการ (1)',
    needCredits: 1, recYear: 2, recTerm: 2,
    options: opt(['001-103', '460-001', '460-001G3']),
  },
  {
    kind: 'choose', id: 'sara:4', category: 'ge', label: 'สาระ 4 การอยู่อย่างรู้เท่าทันและการรู้ดิจิทัล (4)',
    needCredits: 4, recYear: 1, recTerm: 2,
    options: opt(['315-201', '315-104', '345-104', '315-104G4', '315-201G7', '200-104G4']),
  },
  {
    kind: 'choose', id: 'sara:5', category: 'ge', label: 'สาระ 5 การคิดเชิงระบบ ตรรกะและตัวเลข (4)',
    needCredits: 4, recYear: 2, recTerm: 1,
    options: opt(['315-202', '315-202G2B', '142-129', '472-118', '473-001G2A', '895-211G2A', '315-100G2A', '322-100G2A']),
    verifyNote: 'ต้องมีทั้งส่วน "คิดเชิงระบบ" และ "ตรรกะ/ตัวเลข" อย่างละ 2 นก — ตรวจกับอาจารย์ที่ปรึกษา',
  },
  {
    kind: 'choose', id: 'sara:6', category: 'ge', label: 'สาระ 6 ภาษาและการสื่อสาร (4)',
    needCredits: 4, recYear: 1, recTerm: 2,
    options: opt(['890-002', '890-003', '890-004', '890-005', '890-102G1', '890-103G1', '890-104G1', '890-105G1']),
  },
  {
    kind: 'choose', id: 'sara:7', category: 'ge', label: 'สาระ 7 สุนทรียศาสตร์และกีฬา (2)',
    needCredits: 2, recYear: 2, recTerm: 1,
    options: opt(['061-001', '125-101', '142-135', '142-136', '142-137', '142-138', '142-139', '142-234', '142-237', '315-102', '315-102G8', '340-162', '472-116', '472-117', '895-020', '895-021', '895-022', '895-023', '895-024', '895-025', '895-026', '895-027', '895-028', '895-030', '895-031', '895-032', '895-033', '895-034', '895-035', '895-036', '895-037', '895-038', '895-039']),
  },
  {
    kind: 'bucket', id: 'sara:elective', category: 'ge', label: 'วิชาเลือกศึกษาทั่วไป (6)',
    needCredits: 6, eligible: 'ge8', recYear: 1, recTerm: 2,
  },
]

const FREE_ELECTIVE: Requirement = {
  kind: 'bucket',
  id: 'free',
  category: 'free_elective',
  label: 'วิชาเลือกเสรี (6)',
  needCredits: 6,
  eligible: 'free',
  recYear: 4,
  recTerm: 1,
  verifyNote: 'อาจดึงจากวิชา GE/อื่น ๆ ส่วนเกินได้ — ยืนยันกับอาจารย์ที่ปรึกษา',
}

export function buildProgram(plan: Plan, geFramework: GeFramework): Program {
  const geReqs = geFramework === 'core2564' ? GE_CORE_2564 : GE_2565
  const totalCredits = geFramework === 'ge2565' ? 132 : 138
  const requirements = [
    ...FOUNDATION,
    ...coreFor(plan),
    ...majorElectives(plan),
    ...geReqs,
    FREE_ELECTIVE,
  ]
  return { id: `stat2564-${plan}-${geFramework}`, plan, geFramework, totalCredits, requirements }
}
