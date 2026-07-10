import type { Metadata } from 'next'
import { Kanit } from 'next/font/google'
import '@/styles/globals.css'
import { Toaster } from '@/components/ui/sonner'

const kanit = Kanit({
  variable: '--font-sans',
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
})


export const metadata: Metadata = {
  title: 'PSU Credit Checker — เช็คหน่วยกิตหลักสูตร ม.อ.',
  description: 'เช็ควิชาครบ/ขาด หลักสูตร วท.บ. สถิติ ม.อ. หาดใหญ่',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${kanit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
