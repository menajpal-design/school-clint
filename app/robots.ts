import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easyschool.live'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/settings/',
          '/profile/',
          '/billing/',
          '/finance/',
          '/institution/',
          '/users-roles/',
          '/documents/',
          '/attendance/',
          '/id-cards/',
          '/messages/',
          '/notifications/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
