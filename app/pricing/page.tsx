import type { Metadata } from 'next'
import Link from 'next/link'

import { FaqJsonLd } from '@/components/json-ld'
import { SiteHeader } from '@/components/site-chrome'
import { SiteFooter } from '@/components/site-footer'
import { PricingClient } from '@/components/pricing-client'
import { StoreBadges } from '@/components/store-badges'
import { foundingSeatsLeft, monthlySavings, PLANS, PRO_FEATURES, yearlySavings } from '@/lib/billing'

export const metadata: Metadata = {
  title: 'Founding Pro pricing',
  description:
    'JobMatch is free for one ranked Top 10. Founding Pro is $9/month locked for a new list every week from the resume you already uploaded.',
  alternates: { canonical: '/pricing' },
  keywords: [
    'JobMatch pricing',
    'cheap AI job search Canada',
    'founding member job matcher',
    'LinkedIn Premium alternative Canada',
  ],
}

const faqs = [
  {
    q: 'Is JobMatch free?',
    a: 'Yes. You get one full ranked Top 10. That is enough to see if the ranking is honest on your resume.',
  },
  {
    q: 'Is this $9 a day?',
    a: 'No. Founding Pro is a monthly subscription: $9/month. The list refreshes every week. The bill does not.',
  },
  {
    q: 'Why would I pay if I already have Indeed?',
    a: 'Indeed is a feed. JobMatch is a weekly shortlist ranked from your resume. Free proves it once. Pro writes a new Top 10 every week.',
  },
  {
    q: 'How long does founding pricing last?',
    a: 'If you lock Founding Pro now, you keep $9/month for as long as you stay subscribed. After founding seats fill, new members pay $19/month.',
  },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <FaqJsonLd items={faqs} />
      <SiteHeader marketing />
      <section className="mx-auto w-full max-w-6xl px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Pricing</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          One list free. A new Top 10 every week for $9/month.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Checkout happens in the app. Paying unlocks this week’s 10 from the resume you already uploaded.
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.5rem] border border-border bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{PLANS.free.name}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">$0</p>
            <p className="mt-2 text-sm text-muted-foreground">{PLANS.free.headline}</p>
            <ul className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground">
              <li>One full Top 10</li>
              <li>Fit %, matched skills, and the real platform name</li>
              <li>Canada-first ranking from your resume</li>
              <li className="text-foreground/80">The next week, the list is stale.</li>
            </ul>
            <Link href="/app" className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold">
              Open the app
            </Link>
          </article>

          <article className="rounded-[1.5rem] border border-primary/25 bg-primary/5 p-6 shadow-xl shadow-primary/10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{PLANS.founding.name}</p>
              <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
                {foundingSeatsLeft()} seats left
              </span>
            </div>
            <div className="mt-3 flex items-end gap-3">
              <p className="text-4xl font-semibold tracking-tight">${PLANS.founding.price}<span className="text-lg text-muted-foreground">/month</span></p>
              <p className="mb-1 text-sm text-muted-foreground line-through">${PLANS.founding.compareAt}/month</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{PLANS.founding.lockCopy}</p>
            <ul className="mt-6 space-y-3 text-sm leading-6">
              {PRO_FEATURES.map((feature) => (
                <li key={feature.id}>
                  <span className="font-medium">{feature.name}.</span>{' '}
                  <span className="text-muted-foreground">{feature.need}</span>
                </li>
              ))}
            </ul>
            <PricingClient />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Or ${PLANS.founding.annualPrice}/year — save ${yearlySavings()} vs launch pricing. That is ${monthlySavings()}/month less, locked.
            </p>
          </article>
        </div>

        <div className="mt-10">
          <StoreBadges />
        </div>

        <section className="mt-14 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">Questions people ask before they pay</h2>
          <dl className="mt-6 space-y-5">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt className="font-semibold">{item.q}</dt>
                <dd className="mt-1 text-sm leading-6 text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </section>
      <SiteFooter />
    </main>
  )
}
