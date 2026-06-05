'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bell, LayoutDashboard, LogOut, Menu, Package, ShoppingBag, Sprout, User, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/petani/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/petani/produk', label: 'Produk', icon: ShoppingBag },
  { href: '/petani/pesanan', label: 'Pesanan', icon: Package },
  { href: '/petani/notifikasi', label: 'Notifikasi', icon: Bell },
  { href: '/petani/profil', label: 'Profil', icon: User },
]

export default function PetaniNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <div className="h-[76px] md:h-[82px]" />

      <header className="fixed left-0 right-0 top-0 z-50 px-3 py-3 transition-all duration-300 md:px-6">
        <div
          className="mx-auto flex h-[56px] max-w-6xl items-center justify-between rounded-[24px] border px-4 shadow-lg backdrop-blur-xl transition-all duration-300 md:h-[60px] md:px-5"
          style={{
            background: scrolled ? 'rgba(255,255,255,0.94)' : 'rgba(10,76,62,0.96)',
            borderColor: scrolled ? 'rgba(113,188,104,0.20)' : 'rgba(255,255,255,0.12)',
            boxShadow: scrolled ? '0 18px 45px rgba(10,76,62,0.12)' : '0 18px 45px rgba(10,76,62,0.24)',
          }}
        >
          <Link href="/petani/dashboard" className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: scrolled ? '#F0F8EE' : 'rgba(113,188,104,0.18)' }}
            >
              <Sprout size={22} color={scrolled ? '#0A4C3E' : '#71BC68'} />
            </div>
            <div className="leading-none">
              <p className="text-base font-extrabold tracking-tight" style={{ fontFamily: 'Sora, sans-serif', color: scrolled ? '#0A4C3E' : 'white' }}>
                <span style={{ color: '#71BC68' }}>Ki</span>Tani
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: scrolled ? '#6B7C6A' : 'rgba(255,255,255,0.62)' }}>
                Seller Center
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map(link => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-bold transition hover:-translate-y-0.5"
                  style={{
                    background: active ? '#0A4C3E' : 'transparent',
                    color: active ? '#71BC68' : scrolled ? '#49645B' : 'rgba(255,255,255,0.72)',
                  }}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-bold transition hover:-translate-y-0.5"
              style={{ background: scrolled ? '#FFF4F4' : 'rgba(255,255,255,0.10)', color: scrolled ? '#C92A2A' : 'rgba(255,255,255,0.82)' }}
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>

          <button
            onClick={() => setOpen(prev => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl md:hidden"
            style={{ background: scrolled ? '#F0F8EE' : 'rgba(255,255,255,0.10)', color: scrolled ? '#0A4C3E' : 'white' }}
            aria-label="Buka menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="mx-auto mt-2 max-w-6xl rounded-[24px] border bg-white p-2 shadow-xl md:hidden" style={{ borderColor: 'rgba(113,188,104,0.18)' }}>
            {navLinks.map(link => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold"
                  style={{ background: active ? '#F0F8EE' : 'transparent', color: active ? '#0A4C3E' : '#49645B' }}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              )
            })}
            <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: '#FFF4F4', color: '#C92A2A' }}>
              <LogOut size={18} />
              Keluar
            </button>
          </div>
        )}
      </header>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 px-2 py-2 shadow-[0_-18px_40px_rgba(10,76,62,0.10)] backdrop-blur-xl md:hidden" style={{ borderColor: 'rgba(113,188,104,0.18)' }}>
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navLinks.map(link => {
            const active = pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href} className="flex flex-col items-center gap-1 rounded-2xl px-1 py-2" style={{ background: active ? '#F0F8EE' : 'transparent' }}>
                <link.icon size={19} color={active ? '#0A4C3E' : '#9CA3AF'} strokeWidth={active ? 2.7 : 2} />
                <span className="text-[10px] font-bold" style={{ color: active ? '#0A4C3E' : '#9CA3AF' }}>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
