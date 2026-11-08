function rawMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  if (typeof err === 'string') return err
  return ''
}

/** แปล error จาก Supabase auth เป็นข้อความที่ผู้ใช้เข้าใจ */
export function describeAuthError(err: unknown): string {
  const raw = rawMessage(err)
  const m = raw.toLowerCase()
  if (!m) return 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง'

  if (m.includes('invalid login credentials')) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  if (m.includes('email not confirmed')) {
    return 'ยังไม่ได้ยืนยันอีเมล — เช็คกล่องจดหมายแล้วกดลิงก์ยืนยันก่อนเข้าสู่ระบบ'
  }
  if (m.includes('user already registered')) {
    return 'อีเมลนี้มีบัญชีอยู่แล้ว — ลองเข้าสู่ระบบหรือใช้ "ลืมรหัสผ่าน"'
  }
  if (m.includes('rate limit') || m.includes('for security purposes') || m.includes('too many')) {
    return 'ทำรายการบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'
  }
  if (m.includes('password should be at least') || m.includes('password is too short')) {
    return 'รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัวอักษร)'
  }
  if (m.includes('unable to validate email') || m.includes('invalid email')) {
    return 'รูปแบบอีเมลไม่ถูกต้อง'
  }
  if (m.includes('auth session missing') || m.includes('session missing')) {
    return 'ลิงก์หมดอายุหรือยังไม่ได้เข้าสู่ระบบ — ลองขอลิงก์ใหม่'
  }

  return raw
}