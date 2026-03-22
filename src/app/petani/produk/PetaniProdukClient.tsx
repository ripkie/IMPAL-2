'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Edit2, Trash2, X, Check, Upload,
  Package, ArrowLeft, ToggleLeft, ToggleRight,
  Loader, ImageIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Category { id: string; name: string; slug: string }
interface Product {
  id: string; name: string; description: string | null
  price: number; unit: string; stock: number
  image_urls: string[]; is_active: boolean; sold_count: number
  category_id: string | null; created_at: string
  categories?: Category | null
}

interface Props {
  products: Product[]
  categories: Category[]
  farmerId: string
}

const UNITS = ['kg', 'gram', 'ikat', 'buah', 'pack', 'liter', 'pcs']

const emptyForm = {
  name: '', description: '', price: '', unit: 'kg',
  stock: '', category_id: '', is_active: true
}

export default function PetaniProdukClient({ products: initialProducts, categories, farmerId }: Props) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function openAdd() {
    setForm(emptyForm)
    setPreviewImages([])
    setNewImageFiles([])
    setEditingProduct(null)
    setModal('add')
  }

  function openEdit(product: Product) {
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: product.price.toString(),
      unit: product.unit,
      stock: product.stock.toString(),
      category_id: product.category_id ?? '',
      is_active: product.is_active,
    })
    setPreviewImages(product.image_urls ?? [])
    setNewImageFiles([])
    setEditingProduct(product)
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditingProduct(null)
    setPreviewImages([])
    setNewImageFiles([])
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const validFiles = files.filter(f => f.size <= 3 * 1024 * 1024)
    if (validFiles.length < files.length) showToast('Beberapa gambar > 3MB dilewati', 'error')
    setNewImageFiles(prev => [...prev, ...validFiles])
    const previews = await Promise.all(validFiles.map(f => new Promise<string>(res => {
      const reader = new FileReader()
      reader.onload = () => res(reader.result as string)
      reader.readAsDataURL(f)
    })))
    setPreviewImages(prev => [...prev, ...previews])
  }

  function removeImage(idx: number) {
    setPreviewImages(prev => prev.filter((_, i) => i !== idx))
    // If it's a new file (index >= existing image count)
    const existingCount = (editingProduct?.image_urls?.length ?? 0)
    if (idx >= existingCount) {
      setNewImageFiles(prev => prev.filter((_, i) => i !== (idx - existingCount)))
    }
  }

  async function uploadImages(userId: string): Promise<string[]> {
    const supabase = createClient()
    const urls: string[] = []
    for (const file of newImageFiles) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
        urls.push(publicUrl)
      }
    }
    return urls
  }

  async function handleSubmit() {
    if (!form.name.trim()) { showToast('Nama produk wajib diisi', 'error'); return }
    if (!form.price || isNaN(Number(form.price))) { showToast('Harga tidak valid', 'error'); return }
    if (!form.stock || isNaN(Number(form.stock))) { showToast('Stok tidak valid', 'error'); return }

    setLoading(true)
    const supabase = createClient()

    // Upload new images
    let imageUrls = previewImages.filter(url => url.startsWith('http'))
    if (newImageFiles.length > 0) {
      setUploadingImage(true)
      const newUrls = await uploadImages(farmerId)
      imageUrls = [...imageUrls, ...newUrls]
      setUploadingImage(false)
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      unit: form.unit,
      stock: Number(form.stock),
      category_id: form.category_id || null,
      is_active: form.is_active,
      image_urls: imageUrls,
      updated_at: new Date().toISOString(),
    }

    if (modal === 'add') {
      const { data, error } = await supabase.from('products')
        .insert({ ...payload, farmer_id: farmerId })
        .select('*, categories(id, name, slug)')
        .single()
      if (error) { showToast('Gagal menambah produk', 'error') }
      else {
        setProducts(prev => [data, ...prev])
        showToast('Produk berhasil ditambahkan!')
        closeModal()
      }
    } else if (modal === 'edit' && editingProduct) {
      const { data, error } = await supabase.from('products')
        .update(payload)
        .eq('id', editingProduct.id)
        .select('*, categories(id, name, slug)')
        .single()
      if (error) { showToast('Gagal mengupdate produk', 'error') }
      else {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? data : p))
        showToast('Produk berhasil diperbarui!')
        closeModal()
      }
    }
    setLoading(false)
  }

  async function handleDelete(productId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) { showToast('Gagal menghapus produk', 'error') }
    else {
      setProducts(prev => prev.filter(p => p.id !== productId))
      showToast('Produk dihapus')
      setDeleteConfirm(null)
    }
  }

  async function handleToggleActive(product: Product) {
    const supabase = createClient()
    const { error } = await supabase.from('products')
      .update({ is_active: !product.is_active }).eq('id', product.id)
    if (!error) setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p))
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
              Produk Saya
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B7C6A' }}>{products.length} produk terdaftar</p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition hover:opacity-90"
            style={{ background: '#0A4C3E', color: '#71BC68' }}>
            <Plus size={16} /> Tambah Produk
          </button>
        </div>

        {/* Product list */}
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl"
            style={{ border: '1px solid rgba(113,188,104,0.15)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#F4FAF3' }}>
              <Package size={32} color="#71BC68" />
            </div>
            <p className="font-bold" style={{ color: '#0A4C3E' }}>Belum ada produk</p>
            <p className="text-sm mt-1 mb-4" style={{ color: '#6B7C6A' }}>Tambahkan produk pertama kamu</p>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm mx-auto"
              style={{ background: '#0A4C3E', color: '#71BC68' }}>
              <Plus size={16} /> Tambah Produk
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl p-4"
                style={{ border: `1px solid ${product.is_active ? 'rgba(113,188,104,0.2)' : 'rgba(0,0,0,0.08)'}` }}>
                <div className="flex items-start gap-3">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: '#F4FAF3' }}>
                    {product.image_urls?.[0] ? (
                      <img src={product.image_urls[0]} alt={product.name}
                        style={{ width: 64, height: 64, objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={24} color="#9CA3AF" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm" style={{ color: '#0A4C3E' }}>{product.name}</p>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: product.is_active ? '#D4EDDA' : '#f0f0f0',
                          color: product.is_active ? '#155724' : '#999'
                        }}>
                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: '#71BC68' }}>
                      Rp {product.price.toLocaleString('id-ID')} / {product.unit}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: '#6B7C6A' }}>Stok: {product.stock}</span>
                      <span className="text-xs" style={{ color: '#6B7C6A' }}>Terjual: {product.sold_count}</span>
                      {product.categories && (
                        <span className="text-xs" style={{ color: '#6B7C6A' }}>{product.categories.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid #f3f4f6' }}>
                  <button onClick={() => handleToggleActive(product)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                    style={{ background: '#F4FAF3', color: '#0A4C3E' }}>
                    {product.is_active ? <ToggleRight size={14} color="#71BC68" /> : <ToggleLeft size={14} color="#9CA3AF" />}
                    {product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                  <button onClick={() => openEdit(product)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition hover:bg-blue-50"
                    style={{ background: '#EFF6FF', color: '#1d4ed8' }}>
                    <Edit2 size={13} /> Edit
                  </button>
                  <button onClick={() => setDeleteConfirm(product.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition hover:bg-red-100"
                    style={{ background: '#FEE2E2', color: '#dc3545' }}>
                    <Trash2 size={13} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-4"
          style={{ background: 'rgba(0,0,0,0.5)' }} onClick={closeModal}>
          <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid #f3f4f6' }}>
              <h3 className="font-bold text-base" style={{ color: '#0A4C3E', fontFamily: 'Sora, sans-serif' }}>
                {modal === 'add' ? 'Tambah Produk' : 'Edit Produk'}
              </h3>
              <button onClick={closeModal} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
                <X size={16} color="#6B7C6A" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">

              {/* Gambar */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#6B7C6A' }}>
                  Foto Produk (maks 3MB/foto)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {previewImages.map((src, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden"
                      style={{ border: '1px solid rgba(113,188,104,0.2)' }}>
                      <img src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover' }} />
                      <button onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)' }}>
                        <X size={10} color="white" />
                      </button>
                    </div>
                  ))}
                  {previewImages.length < 4 && (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition hover:bg-green-50"
                      style={{ border: '2px dashed rgba(113,188,104,0.4)', color: '#71BC68' }}>
                      <Upload size={20} />
                      <span className="text-xs">Upload</span>
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={handleImageSelect} />
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7C6A' }}>Nama Produk *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Contoh: Kangkung Segar"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                  style={{ borderColor: '#e5e7eb', color: '#0A4C3E' }} />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7C6A' }}>Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Deskripsikan produk kamu..."
                  rows={3} className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none resize-none"
                  style={{ borderColor: '#e5e7eb', color: '#0A4C3E' }} />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7C6A' }}>Kategori</label>
                <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                  style={{ borderColor: '#e5e7eb', color: '#0A4C3E' }}>
                  <option value="">Pilih kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Harga & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7C6A' }}>Harga (Rp) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="5000"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                    style={{ borderColor: '#e5e7eb', color: '#0A4C3E' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7C6A' }}>Satuan *</label>
                  <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                    style={{ borderColor: '#e5e7eb', color: '#0A4C3E' }}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Stok */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6B7C6A' }}>Stok *</label>
                <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                  placeholder="100"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none"
                  style={{ borderColor: '#e5e7eb', color: '#0A4C3E' }} />
              </div>

              {/* Status aktif */}
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: '#F4FAF3' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#0A4C3E' }}>Status Produk</p>
                  <p className="text-xs" style={{ color: '#6B7C6A' }}>
                    {form.is_active ? 'Produk aktif & terlihat pembeli' : 'Produk nonaktif & tersembunyi'}
                  </p>
                </div>
                <button onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}>
                  {form.is_active
                    ? <ToggleRight size={32} color="#71BC68" />
                    : <ToggleLeft size={32} color="#9CA3AF" />}
                </button>
              </div>

              {/* Submit */}
              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm transition hover:opacity-90"
                style={{ background: loading ? '#ccc' : '#0A4C3E', color: '#71BC68' }}>
                {loading
                  ? (uploadingImage ? 'Mengupload gambar...' : 'Menyimpan...')
                  : modal === 'add' ? 'Tambah Produk' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: '#FEE2E2' }}>
              <Trash2 size={22} color="#dc3545" />
            </div>
            <h3 className="font-bold text-center mb-1" style={{ color: '#0A4C3E' }}>Hapus Produk?</h3>
            <p className="text-sm text-center mb-4" style={{ color: '#6B7C6A' }}>
              Produk yang dihapus tidak dapat dikembalikan
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#f5f5f5', color: '#666' }}>Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: '#dc3545', color: 'white' }}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-semibold shadow-lg"
          style={{ background: toast.type === 'success' ? '#0A4C3E' : '#dc3545', color: 'white', minWidth: '200px', textAlign: 'center' }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
