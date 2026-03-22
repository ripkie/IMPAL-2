import type { Metadata } from 'next'
import './globals.css'
import NavbarWrapper from '@/components/navbar/NavbarWrapper'

export const metadata: Metadata = {
  title: 'KiTani - Sayuran Segar Langsung dari Petani',
  description: 'Beli sayuran segar organik langsung dari petani lokal. Hemat, sehat, tanpa perantara.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', margin: 0 }}>
        <NavbarWrapper />
        {children}
      </body>
    </html>
  )
}
