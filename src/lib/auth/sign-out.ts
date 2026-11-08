/**
 * ออกจากระบบแล้วโยน error ถ้า Supabase คืน error
 * จำเป็นเพราะ signOut() ไม่ throw — ถ้าไม่เช็ค ผู้ใช้จะถูกพาไป /login ทั้งที่ session ยังอยู่
 * แล้ว proxy จะเด้งกลับ /dashboard วนไปวนมา
 */
export async function signOutOrThrow(auth: {
  signOut: () => Promise<{ error: unknown }>
}): Promise<void> {
  const { error } = await auth.signOut()
  if (error) throw error
}