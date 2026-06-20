import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://easyschool.live'

const publicRoutes = [
  { path: '/', priority: 1 },
  { path: '/pricing', priority: 0.8 },
  { path: '/admission', priority: 0.8 },
  { path: '/result', priority: 0.7 },
  { path: '/downloads', priority: 0.6 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.path === '/' ? 'weekly' : 'monthly',
    priority: route.priority,
  }))
}
