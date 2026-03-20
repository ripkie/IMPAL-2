'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, ShoppingBag, Package, LogOut, Sprout, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/verifikasi', label: 'Verifikasi', icon: Users },
  { href: '/admin/produk', label: 'Produk', icon: ShoppingBag },
  { href: '/admin/pesanan', label: 'Pesanan', icon: Package },
]

export default function AdminNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <>
      <div className="h-[60px]" />

      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ padding: scrolled ? '8px 16px' : '0' }}>
        <div className="transition-all duration-300"
          style={{
            background: '#0A4C3E',
            borderRadius: scrolled ? '16px' : '0px',
            boxShadow: scrolled ? '0 4px 24px rgba(10,76,62,0.35)' : '0 2px 16px rgba(10,76,62,0.2)',
            maxWidth: scrolled ? '1100px' : '100%',
            margin: '0 auto',
          }}>
          <div className="flex items-center justify-between px-4 h-[60px]">

            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Sprout size={20} color="#71BC68" />
              <span className="font-bold text-base" style={{ fontFamily: 'Sora, sans-serif' }}>
                <span style={{ color: '#71BC68' }}>Ki</span><span style={{ color: 'white' }}>Tani</span>
                <span className="text-xs font-medium ml-1.5 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(113,188,104,0.2)', color: '#71BC68' }}>Admin</span>
              </span>
            </Link>

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

            <div className="flex items-center gap-2">
              <button onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                <LogOut size={15} /> Keluar
              </button>
              <button className="md:hidden p-2 rounded-xl hover:bg-white/10"
                onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X size={18} color="white" /> : <Menu size={18} color="white" />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden px-4 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {navLinks.map(link => (
                <Link key={link.href} href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium"
                  style={{ color: pathname.startsWith(link.href) ? '#71BC68' : 'rgba(255,255,255,0.8)' }}>
                  <link.icon size={16} />{link.label}
                </Link>
              ))}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium"
                style={{ color: '#fc8181' }}>
                <LogOut size={16} /> Keluar
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
