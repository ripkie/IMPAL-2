'use client'

import { usePathname } from 'next/navigation'
import AdminNavbar from '@/components/navbar/AdminNavbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#F5FAF4] font-['DM_Sans'] text-[#0A4C3E]">
      <AdminNavbar />
      <main className="min-h-screen pb-24 lg:pb-0 lg:pl-[292px]">
        {children}
      </main>
    </div>
  )
}
