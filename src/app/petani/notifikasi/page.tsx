import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import PetaniNotifikasiClient, { type FarmerNotification } from './PetaniNotifikasiClient'
import { getFarmerOrders } from '@/lib/queries/farmer'

function formatRp(value: number) {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

function normalizeStatus(status?: string | null) {
  return (status ?? '').toLowerCase()
}

export default async function PetaniNotifikasiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'petani') redirect('/home')

  const orderItems = await getFarmerOrders(user.id)
  const admin = createAdminClient()

  const { data: products } = await admin
    .from('products')
    .select('id, name, stock, unit, created_at, updated_at, is_active')
    .eq('farmer_id', user.id)
    .order('stock', { ascending: true })

  const orderMap = new Map<string, any>()

  for (const item of orderItems ?? []) {
    const order = (item as any).orders
    if (!order?.id) continue

    const current = orderMap.get(order.id) ?? {
      ...order,
      items: [],
      farmerTotal: 0,
      itemCount: 0,
    }

    current.items.push(item)
    current.farmerTotal += Number((item as any).subtotal ?? 0)
    current.itemCount += Number((item as any).quantity ?? 0)
    orderMap.set(order.id, current)
  }

  const notifications: FarmerNotification[] = []

  for (const order of orderMap.values()) {
    const status = normalizeStatus(order.status)
    const orderNumber = order.order_number ?? `TRX-${String(order.id).slice(0, 8).toUpperCase()}`
    const productPreview = order.items
      .slice(0, 2)
      .map((item: any) => item.product_name)
      .filter(Boolean)
      .join(', ')

    if (status === 'paid') {
      notifications.push({
        id: `order-paid-${order.id}`,
        type: 'order',
        title: `Pesanan baru siap diproses`,
        body: `${orderNumber} sudah dibayar. ${productPreview ? `Produk: ${productPreview}. ` : ''}Total pesanan petani ${formatRp(order.farmerTotal)}.`,
        is_read: false,
        reference_id: order.id,
        href: '/petani/pesanan',
        created_at: order.created_at,
      })
    }

    if (status === 'processing') {
      notifications.push({
        id: `order-processing-${order.id}`,
        type: 'shipping',
        title: `Pesanan sedang diproses`,
        body: `${orderNumber} sedang disiapkan. Pastikan produk sudah dipacking dan siap dikirim.`,
        is_read: false,
        reference_id: order.id,
        href: '/petani/pesanan',
        created_at: order.created_at,
      })
    }

    if (status === 'shipped') {
      notifications.push({
        id: `order-shipped-${order.id}`,
        type: 'shipping',
        title: `Pesanan sudah dikirim`,
        body: `${orderNumber} dalam perjalanan${order.tracking_number ? ` dengan resi ${order.tracking_number}` : ''}.`,
        is_read: true,
        reference_id: order.id,
        href: '/petani/pesanan',
        created_at: order.created_at,
      })
    }

    if (status === 'done') {
      notifications.push({
        id: `order-done-${order.id}`,
        type: 'payment',
        title: `Pesanan selesai`,
        body: `${orderNumber} sudah diterima pembeli. Pendapatan masuk: ${formatRp(order.farmerTotal)}.`,
        is_read: true,
        reference_id: order.id,
        href: '/petani/pesanan',
        created_at: order.created_at,
      })
    }
  }

  for (const product of products ?? []) {
    const stock = Number((product as any).stock ?? 0)
    const isActive = Boolean((product as any).is_active)

    if (!isActive) continue
    if (stock > 5) continue

    notifications.push({
      id: `stock-${(product as any).id}`,
      type: stock <= 0 ? 'danger' : 'stock',
      title: stock <= 0 ? 'Stok produk habis' : 'Stok produk menipis',
      body: `${(product as any).name} tersisa ${stock} ${(product as any).unit ?? ''}. Segera tambah stok agar produk tetap bisa dibeli.`,
      is_read: stock > 0,
      reference_id: (product as any).id,
      href: '/petani/produk',
      created_at: (product as any).updated_at ?? (product as any).created_at ?? new Date().toISOString(),
    })
  }

  notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return <PetaniNotifikasiClient notifications={notifications.slice(0, 80)} />
}
