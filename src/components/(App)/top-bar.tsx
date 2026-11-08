'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAppData } from '@/hooks/use-app-data'
import { createClient } from '@/lib/supabase/client'
import { signOutOrThrow } from '@/lib/auth/sign-out'
import { describeDbError } from '@/lib/ui/errors'
import { toast } from 'sonner'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LogOut } from 'lucide-react'

const TITLES: Record<string, string> = {
  '/dashboard': 'ภาพรวม',
  '/courses': 'รายวิชาที่เรียน',
  '/plan': 'แผนเทอมหน้า',
  '/requirements': 'รายละเอียดหมวด',
}

export function TopBar() {
  const { profile, saveProfile } = useAppData()
  const pathname = usePathname()
  const router = useRouter()
  const title = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? ''

  async function signOut() {
    try {
      await signOutOrThrow(createClient().auth)
      router.replace('/login')
    } catch {
      toast.error('ออกจากระบบไม่สำเร็จ ลองใหม่อีกครั้ง')
    }
  }

  // controlled Select ต้องอัปเดตทันที (optimistic) และต้องไม่ทิ้ง rejection ลอย ๆ
  const save = (patch: Parameters<typeof saveProfile>[0]) => {
    void saveProfile(patch).catch((e) => toast.error(describeDbError(e)))
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/75 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-8">
        <Link href="/dashboard" className="font-semibold tracking-tight text-primary md:hidden">PSU Credit</Link>
        <h1 className="hidden text-lg font-semibold tracking-tight text-foreground md:block">{title}</h1>

        <div className="ml-auto flex items-center gap-2">
          {/* แผนปกติ/สหกิจ */}
          <Select value={profile.plan} items={{ regular: 'แผนปกติ', coop: 'แผนสหกิจ' }}
            onValueChange={(v) => v && v !== profile.plan && save({ plan: v as 'regular' | 'coop' })}>
            <SelectTrigger size="sm" className="w-24 rounded-xl sm:w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">แผนปกติ</SelectItem>
              <SelectItem value="coop">แผนสหกิจ</SelectItem>
            </SelectContent>
          </Select>
          {/* กรอบ GE */}
          <Select value={profile.geFramework} items={{ ge2565: 'GE 2565', core2564: 'สาระ 2564' }}
            onValueChange={(v) => v && v !== profile.geFramework && save({ geFramework: v as 'ge2565' | 'core2564' })}>
            <SelectTrigger size="sm" className="w-28 rounded-xl sm:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ge2565">GE 2565 · 132 นก</SelectItem>
              <SelectItem value="core2564">สาระ 2564 · 138 นก</SelectItem>
            </SelectContent>
          </Select>
          <button type="button" onClick={signOut} title="ออกจากระบบ" aria-label="ออกจากระบบ"
            className="grid size-8 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
