'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Package, ShoppingBag, LogOut, Sprout, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/petani/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/petani/produk', label: 'Produk', icon: ShoppingBag },
  { href: '/petani/pesanan', label: 'Pesanan', icon: Package },
  { href: '/petani/profil', label: 'Profil', icon: User },
]

export default function PetaniNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <div className="hidden md:block h-[60px]" />

      {/* TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ padding: scrolled ? '8px 16px' : '0' }}>
        <div className="flex items-center justify-between px-4 transition-all duration-300"
          style={{
            background: '#0A4C3E',
            height: 60,
            borderRadius: scrolled ? '16px' : '0px',
            boxShadow: scrolled ? '0 4px 24px rgba(10,76,62,0.35)' : '0 2px 16px rgba(10,76,62,0.2)',
            maxWidth: scrolled ? '860px' : '100%',
            margin: '0 auto',
          }}>

          {/* Logo */}
          <Link href="/petani/dashboard" className="flex items-center gap-2">
            <Sprout size={20} color="#71BC68" />
            <span className="font-bold text-base" style={{ fontFamily: 'Sora, sans-serif' }}>
              <span style={{ color: '#71BC68' }}>Ki</span><span style={{ color: 'white' }}>Tani</span>
              <span className="text-xs font-medium ml-1.5 px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(113,188,104,0.2)', color: '#71BC68' }}>Petani</span>
            </span>
          </Link>

          {/* Desktop nav - include Profil */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition"
                style={{
                  background: pathname.startsWith(link.href) ? '#71BC68' : 'transparent',
                  color: pathname.startsWith(link.href) ? '#0A4C3E' : 'rgba(255,255,255,0.7)',
                }}>
                <link.icon size={15} />{link.label}
              </Link>
            ))}
          </nav>

          {/* Keluar desktop */}
          <button onClick={handleLogout}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ background: 'white', borderTop: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 -4px 20px rgba(10,76,62,0.08)' }}>
        <div className="flex items-center justify-around py-2">
          {navLinks.map(link => {
            const active = pathname.startsWith(link.href)
            return (
              <Link key={link.href} href={link.href}
                className="flex flex-col items-center gap-0.5 px-4 py-1.5">
                <link.icon size={22} color={active ? '#0A4C3E' : '#9CA3AF'} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-xs font-semibold" style={{ color: active ? '#0A4C3E' : '#9CA3AF' }}>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="md:hidden h-16" />
    </>
  )
}
