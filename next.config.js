/** @type {import('next').NextConfig} */
const API_TARGET = process.env.API_TARGET || process.env.NEXT_PUBLIC_API_TARGET || 'https://school-server-b264c1a1fac6.herokuapp.com';
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || `${API_TARGET.replace(/\/$/, '')}/api`;

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_TARGET: API_TARGET,
  },
  images: {
    domains: ['localhost', 'i.ibb.co', 'ibb.co'],
  },
};

module.exports = nextConfig;
