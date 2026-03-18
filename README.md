# KiTani — File Setup

## Cara pakai:
Salin isi folder ini ke dalam project Next.js kamu.

## Struktur file yang ada di zip ini:

```
middleware.ts                         
src/
├── lib/
│   └── supabase/
│       ├── client.ts                  → Supabase client untuk browser
│       └── server.ts                  → Supabase client untuk server
├── types/
│   └── index.ts                       → Semua TypeScript types
└── app/
    ├── (auth)/
    │   ├── login/page.tsx             → Halaman login
    │   └── register/page.tsx         → Halaman register (2 step, pilih role)
    └── petani/
        └── menunggu-verifikasi/
            └── page.tsx              → Halaman tunggu verifikasi petani
```


## Buka localhost:3000/login untuk test
