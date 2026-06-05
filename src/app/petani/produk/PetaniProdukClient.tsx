'use client'

import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { Check, Edit2, Eye, EyeOff, ImageIcon, Loader, Package, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Category { id: string; name: string; slug: string }
interface Product {
  id: string
  name: string
  description: string | null
  price: number
  unit: string
  stock: number
  image_urls: string[]
  is_active: boolean
  sold_count: number
  category_id: string | null
  created_at: string
  categories?: Category | null
}
interface Props { products: Product[]; categories: Category[]; farmerId: string }

const UNITS = ['kg', 'gram', 'ikat', 'buah', 'pack', 'liter', 'pcs']
const emptyForm = { name: '', description: '', price: '', unit: 'kg', stock: '', category_id: '', is_active: true }

function formatRp(value: number) { return `Rp ${value.toLocaleString('id-ID')}` }

export default function PetaniProdukClient({ products: initialProducts, categories, farmerId }: Props) {
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
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'low'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stats = useMemo(() => ({
    active: products.filter(p => p.is_active).length,
    inactive: products.filter(p => !p.is_active).length,
    totalStock: products.reduce((sum, p) => sum + (p.stock ?? 0), 0),
    totalSold: products.reduce((sum, p) => sum + (p.sold_count ?? 0), 0),
    low: products.filter(p => p.stock > 0 && p.stock <= 5).length,
    empty: products.filter(p => p.stock <= 0).length,
  }), [products])

  const filteredProducts = useMemo(() => products.filter(product => {
    const q = search.toLowerCase()
    const matchesSearch = !q || product.name.toLowerCase().includes(q) || product.categories?.name?.toLowerCase().includes(q)
    const matchesFilter = filter === 'all' || (filter === 'active' && product.is_active) || (filter === 'inactive' && !product.is_active) || (filter === 'low' && product.stock <= 5)
    return matchesSearch && matchesFilter
  }), [products, search, filter])

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
    setUploadingImage(false)
  }

  async function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const validFiles = files.filter(f => f.size <= 3 * 1024 * 1024)
    if (validFiles.length < files.length) showToast('Beberapa gambar lebih dari 3MB dilewati', 'error')
    setNewImageFiles(prev => [...prev, ...validFiles])
    const previews = await Promise.all(validFiles.map(file => new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })))
    setPreviewImages(prev => [...prev, ...previews].slice(0, 4))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removeImage(index: number) {
    const existingCount = editingProduct?.image_urls?.length ?? 0
    setPreviewImages(prev => prev.filter((_, i) => i !== index))
    if (index >= existingCount) setNewImageFiles(prev => prev.filter((_, i) => i !== index - existingCount))
  }

  async function uploadImages(userId: string) {
    const supabase = createClient()
    const urls: string[] = []
    for (const file of newImageFiles) {
      const ext = file.name.split('.').pop() || 'jpg'
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
    if (!form.name.trim()) return showToast('Nama produk wajib diisi', 'error')
    if (!form.price || Number.isNaN(Number(form.price))) return showToast('Harga tidak valid', 'error')
    if (!form.stock || Number.isNaN(Number(form.stock))) return showToast('Stok tidak valid', 'error')

    setLoading(true)
    const supabase = createClient()
    let imageUrls = previewImages.filter(url => url.startsWith('http'))

    if (newImageFiles.length > 0) {
      setUploadingImage(true)
      imageUrls = [...imageUrls, ...(await uploadImages(farmerId))]
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
      const { data, error } = await supabase.from('products').insert({ ...payload, farmer_id: farmerId }).select('*, categories(id, name, slug)').single()
      if (error) showToast('Gagal menambah produk', 'error')
      else { setProducts(prev => [data, ...prev]); showToast('Produk berhasil ditambahkan'); closeModal() }
    }

    if (modal === 'edit' && editingProduct) {
      const { data, error } = await supabase.from('products').update(payload).eq('id', editingProduct.id).select('*, categories(id, name, slug)').single()
      if (error) showToast('Gagal mengupdate produk', 'error')
      else { setProducts(prev => prev.map(p => p.id === editingProduct.id ? data : p)); showToast('Produk berhasil diperbarui'); closeModal() }
    }
    setLoading(false)
  }

  async function handleDelete(productId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) showToast('Gagal menghapus produk', 'error')
    else { setProducts(prev => prev.filter(p => p.id !== productId)); showToast('Produk dihapus'); setDeleteConfirm(null) }
  }

  async function handleToggleActive(product: Product) {
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    if (error) showToast('Gagal mengubah status', 'error')
    else setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p))
  }

  return (
    <main className="min-h-screen bg-[#F4FAF3] px-4 pb-28 md:px-6 md:pb-10" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-[#71BC68]/15 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#71BC68]">Manajemen Produk</p>
              <h1 className="mt-2 text-2xl font-black text-[#0A4C3E] md:text-3xl" style={{ fontFamily: 'Sora, sans-serif' }}>Etalase Produk Tani</h1>
              <p className="mt-2 text-sm text-[#6B7C6A]">Kelola foto, harga, stok, dan status produk yang tampil ke pembeli.</p>
            </div>
            <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0A4C3E] px-5 py-3 text-sm font-black text-[#71BC68] transition hover:-translate-y-0.5">
              <Plus size={18} /> Tambah Produk
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Produk Aktif', stats.active], ['Total Stok', stats.totalStock], ['Produk Terjual', stats.totalSold], ['Stok Habis', stats.empty],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[24px] bg-[#F8FBF7] p-4">
                <p className="text-xs font-bold text-[#6B7C6A]">{label}</p>
                <p className="mt-2 text-2xl font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 flex flex-col gap-3 rounded-[28px] bg-white p-3 shadow-sm ring-1 ring-[#71BC68]/15 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-[#F8FBF7] px-4 py-3">
            <Search size={18} color="#8AA08A" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk atau kategori..." className="w-full bg-transparent text-sm font-medium text-[#0A4C3E] outline-none placeholder:text-[#9CA3AF]" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: 'all', label: 'Semua' }, { key: 'active', label: 'Aktif' }, { key: 'inactive', label: 'Nonaktif' }, { key: 'low', label: 'Stok Tipis' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key as typeof filter)} className="shrink-0 rounded-2xl px-4 py-2 text-xs font-black" style={{ background: filter === tab.key ? '#0A4C3E' : '#F8FBF7', color: filter === tab.key ? '#71BC68' : '#6B7C6A' }}>{tab.label}</button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-5 rounded-[32px] bg-white py-20 text-center shadow-sm ring-1 ring-[#71BC68]/15">
            <Package className="mx-auto mb-3" size={42} color="#9CA3AF" />
            <p className="font-black text-[#0A4C3E]">Produk belum ditemukan</p>
            <p className="mt-1 text-sm text-[#6B7C6A]">Tambah produk atau ubah kata pencarian.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map(product => (
              <article key={product.id} className="overflow-hidden rounded-[30px] bg-white shadow-sm ring-1 ring-[#71BC68]/15 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-[4/3] bg-[#F8FBF7]">
                  {product.image_urls?.[0] ? <img src={product.image_urls[0]} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon size={42} color="#9CA3AF" /></div>}
                  <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black" style={{ background: product.is_active ? '#E7F8EE' : '#F1F5F9', color: product.is_active ? '#0A4C3E' : '#64748B' }}>{product.is_active ? 'Aktif' : 'Nonaktif'}</span>
                  {product.stock <= 5 && <span className="absolute right-3 top-3 rounded-full bg-[#FFF5D6] px-3 py-1 text-xs font-black text-[#8A5B00]">Stok {product.stock}</span>}
                </div>
                <div className="p-4">
                  <p className="line-clamp-1 text-lg font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>{product.name}</p>
                  <p className="mt-1 text-xs font-bold text-[#8AA08A]">{product.categories?.name ?? 'Tanpa kategori'}</p>
                  <div className="mt-4">
                    <p className="text-xs font-bold text-[#6B7C6A]">Harga</p>
                    <p className="text-lg font-black text-[#0A4C3E]">{formatRp(product.price)}<span className="text-xs font-bold text-[#6B7C6A]">/{product.unit}</span></p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-[#F8FBF7] px-3 py-3 ring-1 ring-[#71BC68]/15">
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8AA08A]">Sisa Stok</p>
                      <p className="mt-1 text-xl font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>{product.stock ?? 0}<span className="ml-1 text-xs font-bold text-[#6B7C6A]">{product.unit}</span></p>
                    </div>
                    <div className="rounded-2xl bg-[#F0F8EE] px-3 py-3 ring-1 ring-[#71BC68]/15">
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8AA08A]">Terjual</p>
                      <p className="mt-1 text-xl font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>{product.sold_count ?? 0}<span className="ml-1 text-xs font-bold text-[#6B7C6A]">{product.unit}</span></p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button onClick={() => handleToggleActive(product)} className="rounded-2xl bg-[#F0F8EE] px-3 py-2 text-xs font-black text-[#0A4C3E]">{product.is_active ? <EyeOff className="mx-auto" size={16} /> : <Eye className="mx-auto" size={16} />}</button>
                    <button onClick={() => openEdit(product)} className="rounded-2xl bg-[#E7F0FF] px-3 py-2 text-xs font-black text-[#0B4A8B]"><Edit2 className="mx-auto" size={16} /></button>
                    <button onClick={() => setDeleteConfirm(product.id)} className="rounded-2xl bg-[#FFF4F4] px-3 py-2 text-xs font-black text-[#C92A2A]"><Trash2 className="mx-auto" size={16} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4 md:items-center" onClick={closeModal}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#71BC68]/15 bg-white px-5 py-4">
              <h3 className="text-lg font-black text-[#0A4C3E]" style={{ fontFamily: 'Sora, sans-serif' }}>{modal === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}</h3>
              <button onClick={closeModal} className="rounded-2xl bg-[#F8FBF7] p-2 text-[#6B7C6A]"><X size={18} /></button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-xs font-black text-[#6B7C6A]">Foto Produk</label>
                <div className="flex flex-wrap gap-3">
                  {previewImages.map((src, idx) => <div key={src + idx} className="relative h-24 w-24 overflow-hidden rounded-2xl bg-[#F8FBF7]"><img src={src} alt="Preview" className="h-full w-full object-cover" /><button onClick={() => removeImage(idx)} className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white"><X size={12} /></button></div>)}
                  {previewImages.length < 4 && <button onClick={() => fileInputRef.current?.click()} className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-[#71BC68]/35 bg-[#F8FBF7] text-xs font-black text-[#0A4C3E]"><Upload size={22} />Upload</button>}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nama Produk *"><input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} placeholder="Contoh: Kangkung Segar" className="kitani-input" /></Field>
                <Field label="Kategori"><select value={form.category_id} onChange={e => setForm(v => ({ ...v, category_id: e.target.value }))} className="kitani-input"><option value="">Pilih kategori</option>{categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></Field>
                <Field label="Harga (Rp) *"><input type="number" value={form.price} onChange={e => setForm(v => ({ ...v, price: e.target.value }))} placeholder="5000" className="kitani-input" /></Field>
                <Field label="Satuan *"><select value={form.unit} onChange={e => setForm(v => ({ ...v, unit: e.target.value }))} className="kitani-input">{UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></Field>
                <Field label="Stok *"><input type="number" value={form.stock} onChange={e => setForm(v => ({ ...v, stock: e.target.value }))} placeholder="100" className="kitani-input" /></Field>
                <div className="flex items-end"><button onClick={() => setForm(v => ({ ...v, is_active: !v.is_active }))} className="flex w-full items-center justify-between rounded-2xl bg-[#F8FBF7] px-4 py-3 text-left"><span><span className="block text-xs font-black text-[#6B7C6A]">Status Produk</span><span className="block text-sm font-black text-[#0A4C3E]">{form.is_active ? 'Aktif' : 'Nonaktif'}</span></span>{form.is_active ? <Eye size={20} color="#0A4C3E" /> : <EyeOff size={20} color="#8AA08A" />}</button></div>
              </div>
              <Field label="Deskripsi"><textarea value={form.description} onChange={e => setForm(v => ({ ...v, description: e.target.value }))} rows={4} placeholder="Ceritakan kualitas, asal kebun, atau catatan produk..." className="kitani-input resize-none" /></Field>
              <button onClick={handleSubmit} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A4C3E] px-5 py-3.5 text-sm font-black text-[#71BC68] disabled:bg-gray-300 disabled:text-white">
                {loading ? <Loader size={18} className="animate-spin" /> : <Check size={18} />} {loading ? (uploadingImage ? 'Mengupload gambar...' : 'Menyimpan...') : modal === 'add' ? 'Tambah Produk' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && <ConfirmModal title="Hapus produk?" body="Produk yang dihapus tidak bisa dikembalikan." onCancel={() => setDeleteConfirm(null)} onConfirm={() => handleDelete(deleteConfirm)} />}
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <style jsx global>{`.kitani-input{width:100%;border-radius:16px;border:1px solid rgba(113,188,104,.24);background:#F8FBF7;padding:12px 14px;font-size:14px;font-weight:700;color:#0A4C3E;outline:none}.kitani-input:focus{border-color:#71BC68;background:white}`}</style>
    </main>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-black text-[#6B7C6A]">{label}</span>{children}</label>
}

function ConfirmModal({ title, body, onCancel, onConfirm }: { title: string; body: string; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onCancel}><div className="w-full max-w-sm rounded-[28px] bg-white p-5 text-center shadow-2xl" onClick={e => e.stopPropagation()}><div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4F4] text-[#C92A2A]"><Trash2 size={24} /></div><h3 className="text-lg font-black text-[#0A4C3E]">{title}</h3><p className="mt-1 text-sm text-[#6B7C6A]">{body}</p><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={onCancel} className="rounded-2xl bg-[#F8FBF7] py-3 text-sm font-black text-[#6B7C6A]">Batal</button><button onClick={onConfirm} className="rounded-2xl bg-[#C92A2A] py-3 text-sm font-black text-white">Hapus</button></div></div></div>
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return <div className="fixed bottom-24 left-1/2 z-50 min-w-[220px] -translate-x-1/2 rounded-2xl px-5 py-3 text-center text-sm font-black text-white shadow-xl md:bottom-8" style={{ background: type === 'success' ? '#0A4C3E' : '#C92A2A' }}>{message}</div>
}
