import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl()
  const routes = ['', '/how-it-works', '/pricing', '/canada-job-search', '/resume-job-matcher']
  return routes.map((path) => ({
    url: `${base}${path || '/'}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.8,
  }))
}
