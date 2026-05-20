'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import useSWR from 'swr'
import { searchApi } from '@/lib/api'
import { ListingCard } from '@/components/listing-card'

function SearchResults() {
  const searchParams = useSearchParams()
  const q        = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''
  const [page, setPage] = useState(1)

  const { data, isLoading } = useSWR(
    ['search', q, category, page],
    () => searchApi.search({ q, category, page, size: 24 })
  )

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-56 bg-gray-200 animate-pulse rounded-xl" />
      ))}
    </div>
  )

  const listings = data?.data ?? []
  const total    = data?.total ?? 0

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        {total.toLocaleString('ro-RO')} rezultate
        {q ? ` pentru "${q}"` : ''}
        {category ? ` în "${category}"` : ''}
      </p>

      {listings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-xl">Niciun anunț găsit</p>
          <p className="text-sm mt-2">Încearcă alt termen de căutare</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing: Record<string, unknown>) => (
            <ListingCard key={listing._id as string} listing={listing} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.hasNext && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Pagina următoare
          </button>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Rezultate căutare</h1>
      <Suspense fallback={<div className="animate-pulse h-8 w-48 bg-gray-200 rounded" />}>
        <SearchResults />
      </Suspense>
    </div>
  )
}
