'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppData } from '@/hooks/use-app-data'
import { createClient } from '@/lib/supabase/client'
import { signOutOrThrow } from '@/lib/auth/sign-out'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { GraduationCap, LayoutDashboard, BookOpenCheck, CalendarClock, LogOut } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { href: '/courses', label: 'รายวิชาที่เรียน', icon: BookOpenCheck },
  { href: '/plan', label: 'แผนเทอมหน้า', icon: CalendarClock },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { email } = useAppData()

  async function signOut() {
    try {
      await signOutOrThrow(createClient().auth)
      router.replace('/login')
    } catch {
      toast.error('ออกจากระบบไม่สำเร็จ ลองใหม่อีกครั้ง')
    }
  }

  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 p-3 md:block">
      <div className="flex h-full w-60 flex-col rounded-3xl bg-sidebar p-4 text-sidebar-foreground shadow-xl shadow-sidebar/20">
        {/* brand */}
        <Link href="/dashboard" className="mb-7 flex items-center gap-3 px-1.5 pt-2">
          <span className="grid size-11 place-items-center rounded-2xl bg-sidebar-accent ring-1 ring-white/10">
            <GraduationCap className="size-6 text-white" strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block font-semibold tracking-tight text-white">PSU Credit</span>
            <span className="block text-xs text-sidebar-foreground/70">เช็คหน่วยกิตหลักสูตร</span>
          </span>
        </Link>

        {/* nav */}
        <nav className="flex flex-1 flex-col gap-1.5">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href)
            const Icon = n.icon
            return (
              <Link key={n.href} href={n.href}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white',
                )}>
                <Icon className={cn('size-[18px]', active ? '' : 'opacity-80')} strokeWidth={2.1} />
                {n.label}
              </Link>
            )
          })}
        </nav>

        {/* user / logout */}
        <div className="mt-3 border-t border-sidebar-border/60 pt-3">
          <div className="flex items-center gap-3 px-1.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar-accent text-sm font-semibold text-white">
              {(email?.[0] ?? 'S').toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs text-sidebar-foreground/90">{email ?? 'นักศึกษา'}</span>
            </span>
            <button onClick={signOut} title="ออกจากระบบ"
              className="grid size-8 place-items-center rounded-xl text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-white">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
