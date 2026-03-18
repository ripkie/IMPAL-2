'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'

// Halaman yang tidak pakai Navbar
const HIDE_NAVBAR_PATHS = ['/login', '/register', '/petani/menunggu-verifikasi']

export default function NavbarWrapper() {
  const pathname = usePathname()
  const hide = HIDE_NAVBAR_PATHS.some(p => pathname.startsWith(p))
  if (hide) return null
  return <Navbar />
}
