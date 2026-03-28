'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Star, Check, Loader, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface OrderItem {
  id: string
  product_id: string | null
  product_name: string
  price: number
  unit: string
  quantity: number
  subtotal: number
}

interface Order {
  id: string
  order_number: string
  created_at: string
  order_items: OrderItem[]
}

interface ExistingReview {
  order_item_id: string
  rating: number
  comment: string | null
}

interface Props {
  order: Order
  userId: string
  existingReviews: ExistingReview[]
}

// State review per item
interface ReviewState {
  rating: number
  comment: string
  submitted: boolean
  loading: boolean
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 28,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: number
}) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  const labels: Record<number, string> = {
    1: 'Sangat Buruk',
    2: 'Buruk',
    3: 'Cukup',
    4: 'Bagus',
    5: 'Sangat Bagus',
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: readonly ? 'default' : 'pointer',
              padding: '2px',
              transition: 'transform 0.1s',
              transform: !readonly && hovered >= star ? 'scale(1.15)' : 'scale(1)',
            }}>
            <Star
              size={size}
              color="#FFB347"
              fill={display >= star ? '#FFB347' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        ))}
        {!readonly && display > 0 && (
          <span style={{ fontSize: '13px', color: '#6B7C6A', marginLeft: '4px', fontWeight: 500 }}>
            {labels[display]}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ReviewClient({ order, userId, existingReviews }: Props) {
  const router = useRouter()

  // Inisialisasi state tiap item
  const initReviews = () => {
    const map: Record<string, ReviewState> = {}
    for (const item of order.order_items) {
      const existing = existingReviews.find(r => r.order_item_id === item.id)
      map[item.id] = {
        rating: existing?.rating ?? 0,
        comment: existing?.comment ?? '',
        submitted: !!existing,
        loading: false,
      }
    }
    return map
  }

  const [reviews, setReviews] = useState<Record<string, ReviewState>>(initReviews)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [allDone, setAllDone] = useState(existingReviews.length === order.order_items.length)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function setItemReview(itemId: string, patch: Partial<ReviewState>) {
    setReviews(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }))
  }

  async function handleSubmitItem(item: OrderItem) {
    const review = reviews[item.id]
    if (!review || review.rating === 0) {
      showToast('Pilih bintang dulu sebelum kirim ulasan', 'error')
      return
    }

    setItemReview(item.id, { loading: true })
    const supabase = createClient()

    const { error } = await supabase.from('reviews').insert({
      order_item_id: item.id,
      product_id: item.product_id,
      buyer_id: userId,
      rating: review.rating,
      comment: review.comment.trim() || null,
    })

    if (error) {
      showToast('Gagal mengirim ulasan', 'error')
      setItemReview(item.id, { loading: false })
    } else {
      setItemReview(item.id, { loading: false, submitted: true })
      showToast('Ulasan berhasil dikirim!')

      // Cek apakah semua item sudah diulas
      const updatedReviews = { ...reviews, [item.id]: { ...review, submitted: true } }
      const allSubmitted = order.order_items.every(i => updatedReviews[i.id]?.submitted)
      if (allSubmitted) setAllDone(true)
    }
  }

  async function handleSubmitAll() {
    const unsubmitted = order.order_items.filter(i => !reviews[i.id]?.submitted)
    const noRating = unsubmitted.filter(i => reviews[i.id]?.rating === 0)

    if (noRating.length > 0) {
      showToast(`Berikan bintang untuk semua produk dulu`, 'error')
      return
    }

    for (const item of unsubmitted) {
      await handleSubmitItem(item)
    }
  }

  const submittedCount = order.order_items.filter(i => reviews[i.id]?.submitted).length
  const totalCount = order.order_items.length

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 16px 100px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => router.push('/transaksi')}
            style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid rgba(113,188,104,0.2)', cursor: 'pointer' }}>
            <ArrowLeft size={16} color="#0A4C3E" />
          </button>
          <div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '18px', fontWeight: 700, color: '#0A4C3E', margin: 0 }}>
              Beri Ulasan
            </h1>
            <p style={{ fontSize: '12px', color: '#6B7C6A', margin: '2px 0 0' }}>
              #{order.order_number} · {submittedCount}/{totalCount} diulas
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: '#e5e7eb', borderRadius: '99px', height: '6px', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{
            background: '#71BC68',
            height: '100%',
            borderRadius: '99px',
            width: `${(submittedCount / totalCount) * 100}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Selesai semua */}
        {allDone && (
          <div style={{ background: '#D4EDDA', border: '1px solid rgba(21,87,36,0.2)', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#0A4C3E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Check size={24} color="#71BC68" />
            </div>
            <p style={{ fontFamily: 'Sora, sans-serif', fontSize: '16px', fontWeight: 700, color: '#0A4C3E', margin: '0 0 6px' }}>
              Semua ulasan sudah dikirim!
            </p>
            <p style={{ fontSize: '13px', color: '#3B6D11', margin: '0 0 16px' }}>
              Terima kasih sudah membantu petani dengan ulasanmu 🌾
            </p>
            <button
              onClick={() => router.push('/produk')}
              style={{ background: '#0A4C3E', color: '#71BC68', border: 'none', borderRadius: '12px', padding: '10px 24px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Belanja Lagi →
            </button>
          </div>
        )}

        {/* Review per item */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {order.order_items.map(item => {
            const review = reviews[item.id]
            const isSubmitted = review?.submitted

            return (
              <div key={item.id}
                style={{
                  background: 'white', borderRadius: '18px',
                  border: `1.5px solid ${isSubmitted ? 'rgba(113,188,104,0.4)' : 'rgba(113,188,104,0.15)'}`,
                  overflow: 'hidden',
                  opacity: isSubmitted ? 0.9 : 1,
                }}>

                {/* Item header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#F4FAF3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={20} color="#71BC68" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A4C3E', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product_name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7C6A', margin: '2px 0 0' }}>
                      {item.quantity} {item.unit} · Rp {item.subtotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                  {isSubmitted && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#D4EDDA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={14} color="#155724" />
                    </div>
                  )}
                </div>

                {/* Review form */}
                <div style={{ padding: '16px' }}>
                  {/* Star rating */}
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A4C3E', margin: '0 0 10px' }}>
                    {isSubmitted ? 'Ulasanmu' : 'Berikan penilaian'}
                  </p>
                  <StarRating
                    value={review?.rating ?? 0}
                    onChange={v => !isSubmitted && setItemReview(item.id, { rating: v })}
                    readonly={isSubmitted}
                    size={isSubmitted ? 22 : 28}
                  />

                  {/* Komentar */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#0A4C3E', display: 'block', marginBottom: '6px' }}>
                      Komentar <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opsional)</span>
                    </label>
                    {isSubmitted ? (
                      review?.comment ? (
                        <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, background: '#F9FBF9', borderRadius: '10px', padding: '10px 12px', margin: 0 }}>
                          "{review.comment}"
                        </p>
                      ) : (
                        <p style={{ fontSize: '13px', color: '#9CA3AF', fontStyle: 'italic' }}>Tidak ada komentar</p>
                      )
                    ) : (
                      <textarea
                        value={review?.comment ?? ''}
                        onChange={e => setItemReview(item.id, { comment: e.target.value })}
                        placeholder="Ceritakan pengalamanmu dengan produk ini..."
                        rows={3}
                        style={{
                          width: '100%', borderRadius: '12px', border: '1.5px solid #e5e7eb',
                          padding: '10px 12px', fontSize: '13px', color: '#111827',
                          fontFamily: 'DM Sans, sans-serif', outline: 'none', resize: 'none',
                          boxSizing: 'border-box', lineHeight: 1.6,
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = '#71BC68'}
                        onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                      />
                    )}
                  </div>

                  {/* Tombol kirim */}
                  {!isSubmitted && (
                    <button
                      onClick={() => handleSubmitItem(item)}
                      disabled={review?.loading || review?.rating === 0}
                      style={{
                        width: '100%', marginTop: '12px', padding: '11px',
                        borderRadius: '12px', fontWeight: 700, fontSize: '13px',
                        border: 'none', cursor: review?.rating === 0 ? 'not-allowed' : 'pointer',
                        background: review?.rating === 0 ? '#f3f4f6' : '#0A4C3E',
                        color: review?.rating === 0 ? '#9CA3AF' : '#71BC68',
                        fontFamily: 'DM Sans, sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'opacity 0.15s',
                      }}>
                      {review?.loading
                        ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Mengirim...</>
                        : 'Kirim Ulasan'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Kirim semua sekaligus — kalau ada yang belum */}
        {!allDone && order.order_items.some(i => !reviews[i.id]?.submitted) && (
          <button
            onClick={handleSubmitAll}
            style={{
              width: '100%', marginTop: '16px', padding: '14px',
              borderRadius: '14px', fontWeight: 700, fontSize: '14px',
              border: 'none', cursor: 'pointer',
              background: '#0A4C3E', color: '#71BC68',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
            <Star size={16} fill="#71BC68" color="#71BC68" />
            Kirim Semua Ulasan Sekaligus
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, padding: '12px 20px', borderRadius: '16px',
          fontSize: '13px', fontWeight: 600, minWidth: '220px', textAlign: 'center',
          background: toast.type === 'success' ? '#0A4C3E' : '#dc3545',
          color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
