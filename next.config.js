/** @type {import('next').NextConfig} */
const API_TARGET = process.env.NEXT_PUBLIC_API_TARGET || process.env.API_TARGET || 'https://school-server-b264c1a1fac6.herokuapp.com';

const nextConfig = {
  // Force browser API calls to same-origin /api proxy in production builds.
  // This prevents CORS/preflight issues even if NEXT_PUBLIC_API_URL is set in Heroku/Vercel env.
  env: {
    NEXT_PUBLIC_API_URL: '',
  },
  images: {
    domains: ['localhost', 'i.ibb.co', 'ibb.co', 'school-server-b264c1a1fac6.herokuapp.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.imgbb.com' },
      { protocol: 'https', hostname: '**.ibb.co' },
      { protocol: 'https', hostname: 'school-server-b264c1a1fac6.herokuapp.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_TARGET}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${API_TARGET}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;