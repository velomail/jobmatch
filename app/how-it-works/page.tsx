import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, TrendingUp, Upload } from 'lucide-react'

import { FaqJsonLd } from '@/components/json-ld'
import { SiteHeader } from '@/components/site-chrome'
import { SiteFooter } from '@/components/site-footer'
import { StoreBadges } from '@/components/store-badges'

export const metadata: Metadata = {
  title: 'How JobMatch works',
  description:
    'Upload your resume once. JobMatch ranks the 10 Canada jobs worth your time. One list free. $9/month for a new Top 10 every week.',
  alternates: { canonical: '/how-it-works' },
  keywords: ['how JobMatch works', 'resume to job matches', 'weekly job matching Canada', 'AI job search how it works'],
}

const steps = [
  { number: '1', icon: Upload, title: 'Add your resume', copy: 'Upload once. JobMatch uses your experience as the source of truth.' },
  { number: '2', icon: Search, title: 'Get one ranked 10', copy: 'We check the boards you already trust and return a shortlist — not a feed.' },
  { number: '3', icon: TrendingUp, title: 'A new list every week', copy: 'Free is that first list. $9/month writes next week’s 10 while you sleep.' },
]

const faqs = [
  {
    q: 'Does JobMatch replace LinkedIn and Indeed?',
    a: 'No. It reads those markets for you and returns a ranked 10 so you stop living in the feed.',
  },
  {
    q: 'Are jobs sponsored?',
    a: 'Never. Rankings come from your resume, not from who paid to be at the top. Every row still names the real platform.',
  },
  {
    q: 'Is this only for tech jobs in Toronto?',
    a: 'Canada-first, including Toronto, Vancouver, Montreal, Ottawa, Calgary, Waterloo, and remote. Roles span engineering, product, design, marketing, ops, finance, and more.',
  },
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <FaqJsonLd items={faqs} />
      <SiteHeader marketing />
      <section className="mx-auto w-full max-w-6xl px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The weekly flow</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">From resume to right fit.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Searching is the job now. Matching should be honest. JobMatch is a weekly shortlist, not another board.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {steps.map(({ number, icon: Icon, title, copy }) => (
            <div key={number} className="rounded-2xl border border-border bg-card p-5 md:p-8">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground md:size-12 md:rounded-2xl">
                <Icon className="size-4 md:size-5" />
              </div>
              <p className="mt-5 text-xs font-bold text-primary md:text-sm">STEP {number}</p>
              <h2 className="mt-2 font-semibold tracking-tight md:text-xl">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base md:leading-7">{copy}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-primary/15 bg-primary/5 p-5 text-center">
          <p className="text-sm font-semibold">One list free. Then $9/month.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Open the app, get your first Top 10, and unlock this week when the list goes stale.
          </p>
          <div className="mt-5">
            <StoreBadges />
          </div>
          <Link href="/app" className="mt-4 inline-flex h-11 items-center justify-center text-sm font-semibold text-primary">
            Open the web app
          </Link>
        </div>
        <dl className="mx-auto mt-14 max-w-2xl space-y-5">
          {faqs.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1 text-sm leading-6 text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
      <SiteFooter />
    </main>
  )
}
