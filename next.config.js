/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/tiles/:overlayId/:z/:x/:y',
        destination: '/api/tiles/:overlayId/:z/:x/:y',
      },
    ]
  },
}

module.exports = nextConfig
