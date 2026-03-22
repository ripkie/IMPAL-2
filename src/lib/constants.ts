import {
  Clock, CheckCircle, Package, Truck, XCircle,
  ShoppingBag, Bell, Tag, Info,
} from 'lucide-react'

// Order & payment status — dipakai di TransaksiClient, PetaniPesananClient, HomeClient, AdminDashboard
export const ORDER_STATUS = {
  pending:    { label: 'Menunggu Pembayaran', color: '#856404', bg: '#FFF3CD', icon: Clock },
  paid:       { label: 'Sudah Dibayar',       color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  processing: { label: 'Sedang Diproses',     color: '#004085', bg: '#CCE5FF', icon: Package },
  shipped:    { label: 'Dalam Pengiriman',    color: '#0A4C3E', bg: '#D4EDDA', icon: Truck },
  done:       { label: 'Selesai',             color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  cancelled:  { label: 'Dibatalkan',          color: '#721c24', bg: '#F8D7DA', icon: XCircle },
} as const

// Versi label singkat untuk tampilan petani
export const ORDER_STATUS_SHORT: Record<string, string> = {
  pending:    'Menunggu',
  paid:       'Dibayar',
  processing: 'Diproses',
  shipped:    'Dikirim',
  done:       'Selesai',
  cancelled:  'Dibatal',
}

// Notifikasi type config — dipakai di NotifikasiClient
export const NOTIF_TYPE = {
  order:    { icon: ShoppingBag, color: '#004085', bg: '#CCE5FF' },
  payment:  { icon: CheckCircle, color: '#155724', bg: '#D4EDDA' },
  shipping: { icon: Truck,       color: '#0A4C3E', bg: '#D4EDDA' },
  promo:    { icon: Tag,         color: '#856404', bg: '#FFF3CD' },
  system:   { icon: Info,        color: '#6B7C6A', bg: '#f3f4f6' },
} as const

// Verifikasi status — dipakai di VerifikasiClient
export const VERIFY_STATUS = {
  pending:  { label: 'Menunggu',  color: '#856404', bg: '#FFF3CD', icon: Clock },
  approved: { label: 'Disetujui', color: '#155724', bg: '#D4EDDA', icon: CheckCircle },
  rejected: { label: 'Ditolak',   color: '#721c24', bg: '#F8D7DA', icon: XCircle },
} as const
