import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard', '/admin', '/api/', '/auth/'] },
    ],
    sitemap: 'https://profity-x.com/sitemap.xml',
    host: 'https://profity-x.com',
  }
}
