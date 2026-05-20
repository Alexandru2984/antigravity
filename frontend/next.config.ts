import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '*.polymarket.ro' },
      { protocol: 'https', hostname: 'minio.polymarket.ro' },
    ],
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
    return [
      { source: '/api/:path*', destination: `${apiBase}/:path*` },
    ]
  },
}

export default nextConfig
