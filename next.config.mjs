/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/start', destination: '/app', permanent: false },
      { source: '/matches', destination: '/app/matches', permanent: false },
      { source: '/matches/:id', destination: '/app/matches/:id', permanent: false },
      { source: '/results', destination: '/app/results', permanent: false },
      { source: '/account', destination: '/app/account', permanent: false },
    ]
  },
}

export default nextConfig
