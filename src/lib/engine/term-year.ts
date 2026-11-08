/** อ่านปี พ.ศ. จากเทอมรูปแบบ "1/2567" — คืน null ถ้ารูปแบบไม่ตรง */
export function termYear(term: string): number | null {
  const m = /^\s*[1-3]\s*\/\s*(\d{4})\s*$/.exec(term || '')
  return m ? Number(m[1]) : null
}

/** ปีที่รับเข้า = ปีของเทอมแรกสุดที่ลงทะเบียน */
export function admissionYearOf(rows: { term: string }[]): number | null {
  const years = rows.map((r) => termYear(r.term)).filter((y): y is number => y !== null)
  return years.length ? Math.min(...years) : null
}

/** แปลงเทอมเป็นชั้นปี: รับเข้า 2567, เทอม 2/2568 → ปี 2 */
export function studyYearOfTerm(term: string, admissionYear: number | null): number | null {
  const year = termYear(term)
  if (year === null || admissionYear === null) return null
  const studyYear = year - admissionYear + 1
  return studyYear >= 1 ? studyYear : null
}