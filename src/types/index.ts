export type Role = 'pembeli' | 'petani' | 'admin'

export type VerifyStatus = 'pending' | 'approved' | 'rejected'

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'done' | 'cancelled'

export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded'

export type NotifType = 'order' | 'payment' | 'shipping' | 'promo' | 'system'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  address: string | null
  role: Role
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface FarmerProfile {
  id: string
  user_id: string
  farm_name: string
  farm_location: string
  farm_size: string | null
  ktp_url: string | null
  cert_url: string | null
  verify_status: VerifyStatus
  reject_reason: string | null
  verified_at: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon_url: string | null
  sort_order: number
}

export interface Product {
  id: string
  farmer_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  unit: string
  stock: number
  image_urls: string[]
  is_active: boolean
  sold_count: number
  created_at: string
  updated_at: string
  // joined
  profiles?: Pick<Profile, 'id' | 'full_name'>
  categories?: Pick<Category, 'id' | 'name' | 'slug'>
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  updated_at: string
  // joined
  products?: Product
}

export interface Order {
  id: string
  buyer_id: string
  order_number: string
  status: OrderStatus
  shipping_name: string
  shipping_phone: string
  shipping_address: string
  shipping_courier: string | null
  tracking_number: string | null
  subtotal: number
  shipping_cost: number
  discount: number
  total_amount: number
  payment_method: string | null
  payment_status: PaymentStatus
  midtrans_order_id: string | null
  midtrans_token: string | null
  notes: string | null
  created_at: string
  paid_at: string | null
  shipped_at: string | null
  done_at: string | null
  // joined
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  farmer_id: string | null
  product_name: string
  price: number
  unit: string
  quantity: number
  subtotal: number
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: NotifType
  reference_id: string | null
  is_read: boolean
  created_at: string
}

export interface Review {
  id: string
  order_item_id: string
  product_id: string | null
  buyer_id: string
  rating: number
  comment: string | null
  created_at: string
}
