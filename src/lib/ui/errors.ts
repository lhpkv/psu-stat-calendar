/** แปลง error จาก Supabase/PostgREST เป็นข้อความที่ผู้ใช้เข้าใจ */
export function describeDbError(e: unknown): string {
  if (e && typeof e === 'object' && 'code' in e) {
    const code = String((e as { code?: unknown }).code ?? '')
    // unique_violation: วิชา/คีย์ซ้ำ
    if (code === '23505') return 'มีรายวิชานี้ในเทอมนี้อยู่แล้ว'
  }
  // PostgREST คืน object { message, details, hint, code } ที่ไม่ใช่ instanceof Error
  if (e && typeof e === 'object' && 'message' in e) {
    const message = (e as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  if (e instanceof Error && e.message) return e.message
  return 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง'
}

/**
 * รัน mutation แล้วรายงาน error ทาง onError แทนการปล่อย unhandled rejection
 * คืน true เมื่อสำเร็จ เพื่อให้ caller ตัดสินใจโชว์ toast สำเร็จ/ปิด dialog ได้
 */
export async function runMutation(
  action: () => Promise<void>,
  onError: (message: string) => void,
): Promise<boolean> {
  try {
    await action()
    return true
  } catch (e) {
    onError(describeDbError(e))
    return false
  }
}