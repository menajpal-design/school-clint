/** @type {import('next').NextConfig} */
const API_TARGET = process.env.API_TARGET || process.env.NEXT_PUBLIC_API_TARGET || 'https://school-server-b264c1a1fac6.herokuapp.com';
const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || `${API_TARGET.replace(/\/$/, '')}/api`;

const csp = `
  default-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  font-src 'self' https: data:;
  img-src 'self' data: https:;
  object-src 'none';
  script-src 'self' https: 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https:;
  connect-src 'self' https: wss:;
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: csp.replace(/\n/g, ' ').trim(),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'X-XSS-Protection',
    value: '0',
  },
];

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_TARGET: API_TARGET,
  },
  images: {
    domains: ['localhost', 'i.ibb.co', 'ibb.co'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
