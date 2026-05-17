/** @type {import('next').NextConfig} */
const API_TARGET = process.env.API_TARGET || process.env.NEXT_PUBLIC_API_TARGET;

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: '',
    NEXT_PUBLIC_API_TARGET: API_TARGET || '',
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    domains: ['localhost', 'i.ibb.co', 'ibb.co'],
  },
};

module.exports = nextConfig;
