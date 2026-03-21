import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // /admin/login bebas diakses siapapun
  if (path === '/admin/login') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'admin')
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Halaman tunggu verifikasi bebas diakses
  if (path === '/petani/menunggu-verifikasi') return supabaseResponse

  // Root path & beranda & login → redirect sesuai role kalau sudah login
  if (path === '/' || path === '/beranda' || path === '/login') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role, is_verified').eq('id', user.id).single()
      const role = profile?.role
      if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      if (role === 'petani') {
        if (!profile?.is_verified) return NextResponse.redirect(new URL('/petani/menunggu-verifikasi', request.url))
        return NextResponse.redirect(new URL('/petani/dashboard', request.url))
      }
      return NextResponse.redirect(new URL('/home', request.url))
    }
    return supabaseResponse
  }

  // Belum login
  if (!user) {
    if (path.startsWith('/admin'))
      return NextResponse.redirect(new URL('/admin/login', request.url))
    if (
      path.startsWith('/petani') ||
      path.startsWith('/keranjang') ||
      path.startsWith('/transaksi') ||
      path === '/home' ||
      path === '/profil' ||
      path.startsWith('/produk')
    )
      return NextResponse.redirect(new URL('/login', request.url))
    return supabaseResponse
  }

  // Sudah login → cek role
  const { data: profile } = await supabase
    .from('profiles').select('role, is_verified').eq('id', user.id).single()
  const role = profile?.role

  // Admin hanya boleh akses /admin/*
  if (role === 'admin') {
    if (!path.startsWith('/admin'))
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    return supabaseResponse
  }

  // Petani hanya boleh akses /petani/* — tidak boleh ke halaman pembeli
  if (role === 'petani') {
    if (path === '/home' || path === '/profil' ||
        path.startsWith('/keranjang') || path.startsWith('/transaksi') ||
        path.startsWith('/produk')) {
      return NextResponse.redirect(new URL('/petani/dashboard', request.url))
    }
    if (path.startsWith('/petani') && !profile?.is_verified)
      return NextResponse.redirect(new URL('/petani/menunggu-verifikasi', request.url))
    return supabaseResponse
  }

  // Pembeli tidak boleh akses /petani/* atau /admin/*
  if (path.startsWith('/petani'))
    return NextResponse.redirect(new URL('/home', request.url))
  if (path.startsWith('/admin'))
    return NextResponse.redirect(new URL('/home', request.url))

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/beranda',
    '/admin/:path*',
    '/petani/:path*',
    '/keranjang/:path*',
    '/transaksi/:path*',
    '/produk/:path*',
    '/home',
    '/profil',
  ],
}
