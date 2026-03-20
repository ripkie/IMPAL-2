'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  ShoppingCart, Bell, Search, User, X,
  Home, ShoppingBag, ClipboardList, LogOut, Sprout, Menu
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cartCount, setCartCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)
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
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      const { count: cart } = await supabase.from('carts').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setCartCount(cart ?? 0)
      const { count: notif } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
      setNotifCount(notif ?? 0)
    }
    loadData()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setProfile(null)
    setProfileOpen(false)
    router.push('/login')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) router.push(`/produk?q=${encodeURIComponent(searchQuery)}`)
  }

  function getLogoHref() {
    if (!profile) return '/beranda'
    if (profile.role === 'petani') return '/petani/dashboard'
    if (profile.role === 'admin') return '/admin/dashboard'
    return '/home'
  }

  const navLinks = [
    { href: '/home', label: 'Beranda', icon: Home },
    { href: '/produk', label: 'Produk', icon: ShoppingBag },
    { href: '/transaksi', label: 'Transaksi', icon: ClipboardList },
  ]

  return (
    <>
      <div className="h-[72px]" />

      {/* TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ padding: scrolled ? '10px 16px' : '0' }}>
        <div className="transition-all duration-300 flex items-center gap-3 px-4 py-3"
          style={{
            background: '#0A4C3E',
            borderRadius: scrolled ? '999px' : '0px',
            maxWidth: scrolled ? '900px' : '100%',
            margin: '0 auto',
            boxShadow: scrolled ? '0 4px 32px rgba(10,76,62,0.25)' : 'none',
          }}>

          <Link href={getLogoHref()}
            className="flex items-center gap-1.5 font-bold text-lg shrink-0"
            style={{ fontFamily: 'Sora, sans-serif', letterSpacing: '-0.5px' }}>
            <Sprout size={20} color="#71BC68" />
            <span style={{ color: '#71BC68' }}>Ki</span><span style={{ color: 'white' }}>Tani</span>
          </Link>

          <div className="flex-1">
            <form onSubmit={handleSearch}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Search size={14} color="rgba(255,255,255,0.5)" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Cari sayuran, petani..."
                  className="bg-transparent border-none outline-none text-sm w-full" style={{ color: 'white' }} />
              </div>
            </form>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                style={{
                  color: pathname === link.href ? '#0A4C3E' : 'rgba(255,255,255,0.7)',
                  background: pathname === link.href ? '#71BC68' : 'transparent',
                }}>{link.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <Link href="/notifikasi" className="relative p-2 rounded-full transition hover:bg-white/10">
              <Bell size={18} color="rgba(255,255,255,0.8)" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#71BC68', fontSize: '9px', fontWeight: 700, border: '2px solid #0A4C3E' }}>
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            <Link href="/keranjang" className="relative p-2 rounded-full transition hover:bg-white/10">
              <ShoppingCart size={18} color="rgba(255,255,255,0.8)" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#71BC68', fontSize: '9px', fontWeight: 700, border: '2px solid #0A4C3E' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Desktop profile dropdown (hover) */}
            {profile ? (
              <div className="relative hidden md:block group">
                <button className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition hover:bg-white/10">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: '#71BC68', color: '#0A4C3E' }}>
                    {profile.full_name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <span className="text-white text-sm font-medium">{profile.full_name?.split(' ')[0]}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200"
                  style={{ background: 'white', border: '1px solid rgba(113,188,104,0.2)', boxShadow: '0 8px 32px rgba(10,76,62,0.15)' }}>
                  <Link href="/profil" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#F4FAF3] transition" style={{ color: '#0A4C3E' }}>
                    <User size={15} /> Profil Saya
                  </Link>
                  {profile.role === 'petani' && (
                    <Link href="/petani/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#F4FAF3] transition border-t border-gray-100" style={{ color: '#0A4C3E' }}>
                      <Sprout size={15} color="#71BC68" /> Dasbor Petani
                    </Link>
                  )}
                  {profile.role === 'admin' && (
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[#F4FAF3] transition border-t border-gray-100" style={{ color: '#0A4C3E' }}>
                      <User size={15} /> Panel Admin
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-50 transition border-t border-gray-100" style={{ color: '#dc3545' }}>
                    <LogOut size={15} /> Keluar
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="px-4 py-1.5 rounded-full text-sm font-bold transition hidden md:block"
                style={{ background: '#71BC68', color: '#0A4C3E' }}>
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ background: 'white', borderTop: '1px solid rgba(113,188,104,0.15)', boxShadow: '0 -4px 20px rgba(10,76,62,0.06)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex flex-row items-center w-full px-2 py-2">

          {[
            { href: '/home', label: 'Beranda', icon: Home, active: pathname === '/home' },
            { href: '/produk', label: 'Produk', icon: ShoppingBag, active: pathname.startsWith('/produk') },
            { href: '/keranjang', label: 'Keranjang', icon: ShoppingCart, active: pathname === '/keranjang', badge: cartCount },
            { href: '/transaksi', label: 'Transaksi', icon: ClipboardList, active: pathname === '/transaksi' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl"
              style={{ color: item.active ? '#0A4C3E' : '#9CA3AF' }}>
              <item.icon size={22} strokeWidth={item.active ? 2.5 : 1.8} />
              {item.badge ? (
                <span className="absolute top-0.5 right-3 w-4 h-4 rounded-full text-white flex items-center justify-center"
                  style={{ background: '#71BC68', fontSize: '9px', fontWeight: 700 }}>
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
              <span className="text-xs font-medium" style={{ fontSize: '10px' }}>{item.label}</span>
            </Link>
          ))}

          {/* Profil */}
          <button onClick={() => setProfileOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl"
            style={{ color: profileOpen ? '#0A4C3E' : '#9CA3AF' }}>
            {profile ? (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#71BC68', color: '#0A4C3E' }}>
                {profile.full_name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            ) : (
              <User size={22} strokeWidth={1.8} />
            )}
            <span className="text-xs font-medium" style={{ fontSize: '10px' }}>Profil</span>
          </button>

        </div>
      </nav>

      {/* MOBILE PROFILE BOTTOM SHEET */}
      {profileOpen && (
        <div className="md:hidden fixed inset-0 z-[100]" onClick={() => setProfileOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.45)' }} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl"
            style={{ background: 'white', zIndex: 101 }}
            onClick={e => e.stopPropagation()}>

            {/* Handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-8 h-1 rounded-full" style={{ background: '#e5e7eb' }} />
            </div>

            {/* Profile info */}
            {profile && (
              <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base"
                  style={{ background: '#71BC68', color: '#0A4C3E' }}>
                  {profile.full_name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#0A4C3E' }}>{profile.full_name}</p>
                  <p className="text-xs capitalize" style={{ color: '#6B7C6A' }}>{profile.role}</p>
                </div>
              </div>
            )}

            {/* Menu */}
            <div className="px-3 py-2">
              {profile ? (
                <>
                  <Link href="/profil" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-gray-50"
                    style={{ color: '#0A4C3E' }}>
                    <User size={18} color="#0A4C3E" />
                    <span className="font-medium text-sm">Profil Saya</span>
                  </Link>

                  {profile.role === 'petani' && (
                    <Link href="/petani/dashboard" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-gray-50"
                      style={{ color: '#0A4C3E' }}>
                      <Sprout size={18} color="#155724" />
                      <span className="font-medium text-sm">Dasbor Petani</span>
                    </Link>
                  )}

                  {profile.role === 'admin' && (
                    <Link href="/admin/dashboard" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-gray-50"
                      style={{ color: '#0A4C3E' }}>
                      <User size={18} color="#004085" />
                      <span className="font-medium text-sm">Panel Admin</span>
                    </Link>
                  )}

                  <div style={{ borderTop: '1px solid #f3f4f6', marginTop: '4px', paddingTop: '4px' }}>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl active:bg-red-50"
                      style={{ color: '#dc3545' }}>
                      <LogOut size={18} color="#dc3545" />
                      <span className="font-medium text-sm">Keluar</span>
                    </button>
                  </div>
                </>
              ) : (
                <Link href="/login" onClick={() => setProfileOpen(false)}
                  className="flex items-center justify-center gap-2 mx-1 py-3 rounded-xl font-bold text-sm"
                  style={{ background: '#0A4C3E', color: '#71BC68' }}>
                  Masuk ke Akun
                </Link>
              )}
            </div>
            {/* Padding agar tidak tertutup bottom nav (64px) + safe area */}
            <div style={{ height: '80px' }} />
          </div>
        </div>
      )}
    </>
  )
}
