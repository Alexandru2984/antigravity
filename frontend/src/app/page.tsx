import Link from 'next/link'
import { Suspense } from 'react'
import { SearchBar } from '@/components/search-bar'
import { ListingGrid } from '@/components/listing-grid'
import { CategoryNav } from '@/components/category-nav'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Hero */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Găsești orice pe <span className="text-blue-600">PolyMarket</span>
        </h1>
        <p className="text-gray-500 text-lg mb-8">
          Milioane de anunțuri. Vânzători verificați. Plată securizată.
        </p>
        <SearchBar className="max-w-2xl mx-auto" />
      </section>

      {/* Category navigation */}
      <CategoryNav />

      {/* Latest listings */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Cele mai noi anunțuri</h2>
          <Link href="/search" className="text-blue-600 hover:underline text-sm">
            Vezi toate →
          </Link>
        </div>
        <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 bg-gray-200 animate-pulse rounded-xl" />
          ))}
        </div>}>
          <ListingGrid />
        </Suspense>
      </section>
    </div>
  )
}
