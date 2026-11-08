'use client'

import Link from 'next/link'
import { useAppData } from '@/hooks/use-app-data'
import { Sidebar } from '@/components/(App)/sidebar'
import { TopBar } from '@/components/(App)/top-bar'
import { MobileNav } from '@/components/(App)/mobile-nav'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { envOk, loading, error, refresh } = useAppData()

  if (!envOk) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Alert>
          <AlertTitle>ยังไม่ได้เชื่อม Supabase</AlertTitle>
          <AlertDescription>
            เปิดไฟล์ <code className="font-mono">SETUP.md</code> เพื่อตั้งค่า แล้ว{' '}
            <Link href="/login" className="underline">ไปหน้าเข้าสู่ระบบ</Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {error && (
            <Alert className="mb-4">
              <AlertTitle>โหลดข้อมูลไม่สำเร็จ</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                <span>{error}</span>
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={() => { void refresh().catch(() => {}) }}
                >
                  ลองใหม่
                </button>
              </AlertDescription>
            </Alert>
          )}
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
