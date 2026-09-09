import type { Metadata } from 'next'
import Link from 'next/link'

import { SiteHeader } from '@/components/site-chrome'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Page not found',
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader marketing />
      <section className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">That page is not a match.</h1>
        <p className="mt-3 text-sm text-muted-foreground">Try today’s flow instead — resume in, Top 10 out.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Back to JobMatch
        </Link>
      </section>
      <SiteFooter />
    </main>
  )
}
