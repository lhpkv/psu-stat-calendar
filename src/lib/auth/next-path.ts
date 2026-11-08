/** จำกัดปลายทางหลัง auth ให้เป็น path ภายในระบบเท่านั้น — กัน open redirect */
export function safeNextPath(next: string | null | undefined): string {
  if (!next) return '/dashboard'
  if (!next.startsWith('/')) return '/dashboard'
  // "//evil.example" และ "/\evil.example" ถูก browser ตีความเป็น protocol-relative
  if (next.startsWith('//') || next.startsWith('/\\')) return '/dashboard'
  return next
}