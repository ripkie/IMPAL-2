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

  // Belum login → redirect ke /login
  if (!user && (path.startsWith('/petani') || path.startsWith('/admin') || path.startsWith('/keranjang') || path.startsWith('/transaksi'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_verified')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Salah role → redirect ke beranda
    if (path.startsWith('/petani') && role !== 'petani')
      return NextResponse.redirect(new URL('/', request.url))

    if (path.startsWith('/admin') && role !== 'admin')
      return NextResponse.redirect(new URL('/', request.url))

    // Petani belum diverifikasi → redirect ke halaman tunggu
    if (path.startsWith('/petani') && role === 'petani' && !profile?.is_verified)
      return NextResponse.redirect(new URL('/petani/menunggu-verifikasi', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/petani/:path*', '/admin/:path*', '/keranjang/:path*', '/transaksi/:path*'],
}
