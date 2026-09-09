import type { Metadata, Viewport } from 'next'

import { AppShell } from '@/components/app-shell'
import { PushRegistrar } from '@/components/push-registrar'

export const metadata: Metadata = {
  title: 'JobMatch app',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'JobMatch',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#4f46a5' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1528' },
  ],
}

export default function ProductAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PushRegistrar />
      <AppShell>{children}</AppShell>
    </>
  )
}
