import { MetadataRoute } from 'next'
import { POSTS } from '@/lib/blog-posts'

const BASE = 'https://profity-x.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: `${BASE}/leaderboard`, changeFrequency: 'daily'  as const, priority: 0.8,  lastModified: new Date() },
    { url: BASE,            changeFrequency: 'weekly'  as const, priority: 1.0,  lastModified: new Date() },
    { url: `${BASE}/en`,    changeFrequency: 'weekly'  as const, priority: 0.95, lastModified: new Date() },
    { url: `${BASE}/results`, changeFrequency: 'daily' as const, priority: 0.85, lastModified: new Date() },
    { url: `${BASE}/blog`,  changeFrequency: 'weekly'  as const, priority: 0.8,  lastModified: new Date() },
  ]

  const blogPages = POSTS.map(post => ({
    url:              `${BASE}/blog/${post.slug}`,
    changeFrequency:  'monthly' as const,
    priority:         0.7,
    lastModified:     new Date(post.date),
  }))

  return [...staticPages, ...blogPages]
}
