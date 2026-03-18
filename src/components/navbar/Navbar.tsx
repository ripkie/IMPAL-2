'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, Bell, Search, User, Menu, X, Home, ShoppingBag, ClipboardList, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)

      const { count: cart } = await supabase
        .from('carts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setCartCount(cart ?? 0)

      const { count: notif } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('is_read', false)
      setNotifCount(notif ?? 0)
    }
    loadData()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/produk?q=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
    }
  }

  const navLinks = [
    { href: '/', label: 'Beranda', icon: Home },
    { href: '/produk', label: 'Produk', icon: ShoppingBag },
    { href: '/transaksi', label: 'Transaksi', icon: ClipboardList },
  ]

  return (
    <>
      {/* Spacer agar konten tidak tertutup navbar */}
      <div className="h-[72px]" />

      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ padding: scrolled ? '10px 16px' : '0' }}>
        <div
          className="transition-all duration-300 flex items-center gap-3 px-4 py-3"
          style={{
            background: '#0A4C3E',
            borderRadius: scrolled ? '999px' : '0px',
            maxWidth: scrolled ? '900px' : '100%',
            margin: '0 auto',
            boxShadow: scrolled ? '0 4px 32px rgba(10,76,62,0.25)' : 'none',
          }}
        >
          {/* Logo */}
          <Link href="/" className="font-bold text-lg shrink-0"
            style={{ fontFamily: 'Sora, sans-serif', color: '#71BC68', letterSpacing: '-0.5px' }}>
            Ki<span style={{ color: 'white' }}>Tani</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Search size={14} color="rgba(255,255,255,0.5)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari sayuran, petani..."
                  className="bg-transparent border-none outline-none text-white text-sm w-full"
                  style={{ '::placeholder': { color: 'rgba(255,255,255,0.4)' } } as React.CSSProperties}
                />
              </div>
            </form>
          </div>

          {/* Nav Links — desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                style={{
                  color: pathname === link.href ? '#0A4C3E' : 'rgba(255,255,255,0.7)',
                  background: pathname === link.href ? '#71BC68' : 'transparent',
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Notif */}
            <Link href="/notifikasi" className="relative p-2 rounded-full transition hover:bg-white/10">
              <Bell size={18} color="rgba(255,255,255,0.8)" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#71BC68', fontSize: '9px', fontWeight: 700, border: '2px solid #0A4C3E' }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/keranjang" className="relative p-2 rounded-full transition hover:bg-white/10">
              <ShoppingCart size={18} color="rgba(255,255,255,0.8)" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#71BC68', fontSize: '9px', fontWeight: 700, border: '2px solid #0A4C3E' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Profile / Login */}
            {profile ? (
              <div className="relative group">
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition hover:bg-white/10">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#71BC68', color: '#0A4C3E' }}>
                    {profile.full_name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="text-white text-sm font-medium hidden md:block" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                    {profile.full_name?.split(' ')[0]}
                  </span>
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                  style={{ background: 'white', border: '1px solid rgba(113,188,104,0.2)', boxShadow: '0 8px 32px rgba(10,76,62,0.15)' }}>
                  <Link href="/profil" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#F4FAF3] transition"
                    style={{ color: '#0A4C3E', fontFamily: 'DM Sans, sans-serif' }}>
                    <User size={15} />
                    Profil Saya
                  </Link>
                  {profile.role === 'petani' && (
                    <Link href="/petani/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#F4FAF3] transition border-t border-gray-100"
                      style={{ color: '#0A4C3E', fontFamily: 'DM Sans, sans-serif' }}>
                      🌾 Dasbor Petani
                    </Link>
                  )}
                  {profile.role === 'admin' && (
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#F4FAF3] transition border-t border-gray-100"
                      style={{ color: '#0A4C3E', fontFamily: 'DM Sans, sans-serif' }}>
                      🛡️ Panel Admin
                    </Link>
                  )}
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-50 transition border-t border-gray-100"
                    style={{ color: '#dc3545', fontFamily: 'DM Sans, sans-serif' }}>
                    <LogOut size={15} />
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login"
                className="px-4 py-1.5 rounded-full text-sm font-bold transition"
                style={{ background: '#71BC68', color: '#0A4C3E', fontFamily: 'DM Sans, sans-serif' }}>
                Masuk
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button className="md:hidden p-2 rounded-full transition hover:bg-white/10"
              onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} color="white" /> : <Menu size={18} color="white" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mt-2 rounded-2xl overflow-hidden mx-2"
            style={{ background: '#0A4C3E', border: '1px solid rgba(113,188,104,0.2)' }}>
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-5 py-4 border-b transition"
                style={{
                  borderColor: 'rgba(255,255,255,0.08)',
                  color: pathname === link.href ? '#71BC68' : 'rgba(255,255,255,0.8)',
                  fontFamily: 'DM Sans, sans-serif', fontSize: '14px',
                }}>
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  )
}
