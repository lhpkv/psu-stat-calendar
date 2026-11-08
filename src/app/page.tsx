import { redirect } from 'next/navigation'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // ลิงก์จากอีเมลของ Supabase อาจลงที่ root พร้อม ?code= / ?token_hash=
  // ต้องส่งต่อไป /auth/confirm ก่อน ไม่งั้น code จะหายและยืนยัน/รีเซ็ตไม่สำเร็จ
  const params = await searchParams
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') qs.set(key, value)
  }

  if (qs.has('code') || qs.has('token_hash')) {
    redirect(`/auth/confirm?${qs.toString()}`)
  }

  redirect('/dashboard')
}