import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Open JobMatch',
  robots: { index: false, follow: false },
}

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return children
}
