import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JobMatch',
    short_name: 'JobMatch',
    description: 'A weekly ranked Top 10 from your resume. Not another job board.',
    start_url: '/app',
    scope: '/app',
    display: 'standalone',
    background_color: '#f7f7f8',
    theme_color: '#4f46a5',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
