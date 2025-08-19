/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  async rewrites() {
    // Only use rewrites in development
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/:path*',
        },
      ]
    }
    return []
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://aiweb1-c965.onrender.com',
  },
  // Ensure environment variables are available at build time
  experimental: {
    esmExternals: false,
  },
  // Production optimizations
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig
