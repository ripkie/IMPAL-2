'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, Menu, ShieldCheck, Sprout, Users, X } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', desc: 'Ringkasan verifikasi', icon: LayoutDashboard },
  { href: '/admin/verifikasi', label: 'Verifikasi', desc: 'Validasi petani', icon: Users },
]

export default function AdminNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[292px] border-r border-[#0A4C3E]/10 bg-white/90 px-5 py-5 shadow-[18px_0_55px_rgba(10,76,62,0.08)] backdrop-blur-xl lg:flex lg:flex-col">
        <Link href="/admin/dashboard" className="flex items-center gap-3 rounded-[24px] bg-[#F4FAF3] p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A4C3E] text-[#71BC68] shadow-[0_12px_30px_rgba(10,76,62,0.22)]">
            <Sprout size={26} />
          </div>
          <div className="min-w-0">
            <p className="font-['Sora'] text-lg font-extrabold leading-none tracking-tight text-[#0A4C3E]">
              Ki<span className="text-[#71BC68]">Tani</span>
            </p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[#6B7C6A]">
              Admin Verifikator
            </p>
          </div>
        </Link>

        <div className="mt-5 rounded-[24px] border border-[#71BC68]/20 bg-gradient-to-br from-[#0A4C3E] to-[#0D6B55] p-4 text-white shadow-[0_20px_60px_rgba(10,76,62,0.18)]">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-[#71BC68]">
            <ShieldCheck size={22} />
          </div>
          <p className="font-['Sora'] text-sm font-extrabold">Farmer Verification</p>
          <p className="mt-2 text-xs font-medium leading-5 text-white/68">
            Fokus admin adalah memvalidasi petani agar marketplace hanya diisi oleh petani yang tepat dan terpercaya.
          </p>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-2">
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-[20px] px-3 py-3.5 transition hover:-translate-y-0.5 hover:bg-[#F4FAF3]"
                style={{
                  background: active ? '#0A4C3E' : 'transparent',
                  boxShadow: active ? '0 16px 35px rgba(10,76,62,0.16)' : 'none',
                }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition"
                  style={{
                    background: active ? 'rgba(113,188,104,0.18)' : '#F0F8EE',
                    color: active ? '#71BC68' : '#0A4C3E',
                  }}
                >
                  <link.icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold" style={{ color: active ? 'white' : '#0A4C3E' }}>
                    {link.label}
                  </p>
                  <p className="mt-0.5 text-[11px] font-bold" style={{ color: active ? 'rgba(255,255,255,0.56)' : '#8A9A89' }}>
                    {link.desc}
                  </p>
                </div>
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100"
        >
          <LogOut size={18} />
          Keluar Admin
        </button>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 border-b border-[#0A4C3E]/10 bg-white/92 px-4 py-3 shadow-[0_16px_40px_rgba(10,76,62,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A4C3E] text-[#71BC68]">
              <Sprout size={23} />
            </div>
            <div>
              <p className="font-['Sora'] text-base font-extrabold leading-none text-[#0A4C3E]">
                Ki<span className="text-[#71BC68]">Tani</span>
              </p>
              <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#6B7C6A]">Admin</p>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F8EE] text-[#0A4C3E]"
            aria-label="Buka menu admin"
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="mx-auto mt-3 max-w-3xl rounded-[24px] border border-[#0A4C3E]/10 bg-white p-2 shadow-xl">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold"
                  style={{ background: active ? '#F0F8EE' : 'transparent', color: active ? '#0A4C3E' : '#49645B' }}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-extrabold text-red-600"
            >
              <LogOut size={18} />
              Keluar Admin
            </button>
          </div>
        )}
      </header>

      <div className="h-[76px] lg:hidden" />

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#0A4C3E]/10 bg-white/95 px-2 py-2 shadow-[0_-18px_40px_rgba(10,76,62,0.10)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-xs grid-cols-2 gap-1">
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-1 rounded-2xl px-0.5 py-2"
                style={{ background: active ? '#F0F8EE' : 'transparent' }}
              >
                <link.icon size={19} color={active ? '#0A4C3E' : '#9CA3AF'} strokeWidth={active ? 2.8 : 2} />
                <span className="text-[9px] font-bold" style={{ color: active ? '#0A4C3E' : '#9CA3AF' }}>
                  {link.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
