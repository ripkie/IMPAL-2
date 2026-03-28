// SECURITY: file ini server-only, JANGAN import di client component
import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Admin client pakai service role key — bypass RLS.
 * Hanya boleh dipakai untuk:
 * - Query join kompleks (dashboard petani, laporan)
 * - Webhook / proses backend
 * - Agregasi data
 *
 * TIDAK boleh untuk CRUD biasa milik user.
 * WAJIB selalu filter manual: .eq('farmer_id', user.id)
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
