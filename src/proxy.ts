import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // ยังไม่ตั้งค่า Supabase → ปล่อยผ่าน (จะเห็นหน้าแนะนำตั้งค่า)
  if (!url || !key) return NextResponse.next()

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isAppRoute = ['/dashboard', '/courses', '/requirements', '/plan'].some((p) => path.startsWith(p))

  if (!data.user && isAppRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }
  if (data.user && path === '/login') {
    const dash = request.nextUrl.clone()
    dash.pathname = '/dashboard'
    return NextResponse.redirect(dash)
  }
  return response
}

export const config = {
  // ไม่รวม /api — route handler ตรวจ auth เอง และ Next 16 จะ buffer/ตัด body ของ proxy ที่ 10MB
  // (ถ้าให้ proxy วิ่งบน /api/parse-pdf ไฟล์ PDF ใหญ่จะถูกตัดเหลือ 10MB ก่อนถึง handler)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
