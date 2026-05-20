'use client'

import { use } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import { listingsApi } from '@/lib/api'
import { formatPrice } from '@/lib/utils'

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: listing, isLoading, error } = useSWR(`/listings/${id}`, () => listingsApi.get(id))

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-96 bg-gray-200 rounded-xl mb-6" />
      <div className="h-8 w-2/3 bg-gray-200 rounded mb-4" />
      <div className="h-6 w-1/3 bg-gray-200 rounded mb-6" />
      <div className="h-32 bg-gray-200 rounded" />
    </div>
  )

  if (error || !listing) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-xl text-gray-500">Anunțul nu a fost găsit</p>
    </div>
  )

  const mainImage = listing.images?.[0]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Image gallery */}
      <div className="relative h-96 bg-gray-100 rounded-xl overflow-hidden mb-6">
        {mainImage ? (
          <Image src={mainImage.medium} alt={listing.title} fill className="object-contain" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span className="text-5xl">📷</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
          <p className="text-3xl font-bold text-blue-600 mb-4">
            {formatPrice(listing.price, listing.currency)}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            📍 {listing.location?.city}, {listing.location?.county}
            &nbsp;·&nbsp;
            {new Date(listing.created_at).toLocaleDateString('ro-RO')}
          </p>
          <div className="prose max-w-none">
            <h2 className="text-lg font-semibold mb-2">Descriere</h2>
            <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
          </div>
        </div>

        {/* Seller card */}
        <div className="md:col-span-1">
          <div className="border rounded-xl p-4 sticky top-4">
            <h2 className="font-semibold mb-3">Vânzător</h2>
            <p className="text-sm text-gray-500 mb-4 font-mono">{listing.seller_id}</p>
            <a
              href={`tel:`}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-medium transition"
            >
              Contactează vânzătorul
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
