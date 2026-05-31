export default function ProdukLoading() {
    return (
        <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#F4FAF3', minHeight: '100vh' }}>
            <style>{`
        @keyframes shimmer {
          0%   { background-position: -600px 0 }
          100% { background-position: 600px 0 }
        }
        .shimmer {
          background: linear-gradient(90deg, #e8f5e4 25%, #d4edda 50%, #e8f5e4 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 10px;
        }
      `}</style>

            <div className="max-w-5xl mx-auto px-4 py-5 pb-28">

                {/* Search bar skeleton */}
                <div className="shimmer h-12 w-full rounded-2xl mb-4" />

                {/* Kategori + sort skeleton */}
                <div className="flex gap-2 mb-5">
                    {[80, 100, 110, 95, 105, 90].map((w, i) => (
                        <div key={i} className="shimmer h-8 rounded-full shrink-0" style={{ width: w }} />
                    ))}
                    <div className="shimmer h-8 w-28 rounded-full ml-auto shrink-0" />
                </div>

                {/* Info hasil skeleton */}
                <div className="shimmer h-4 w-32 rounded-lg mb-4" />

                {/* Product grid skeleton — 8 cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl overflow-hidden"
                            style={{ border: '1px solid rgba(113,188,104,0.1)' }}>
                            {/* Gambar */}
                            <div className="shimmer w-full aspect-square" style={{ borderRadius: 0 }} />
                            {/* Konten */}
                            <div className="p-3 space-y-2">
                                <div className="shimmer h-3.5 w-full rounded-md" />
                                <div className="shimmer h-3.5 w-3/4 rounded-md" />
                                <div className="shimmer h-3 w-1/2 rounded-md mt-1" />
                                <div className="shimmer h-3 w-2/3 rounded-md" />
                                <div className="shimmer h-8 w-full rounded-xl mt-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}