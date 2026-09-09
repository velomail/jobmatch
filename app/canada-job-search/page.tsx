import type { Metadata } from 'next'
import Link from 'next/link'

import { FaqJsonLd } from '@/components/json-ld'
import { SiteHeader } from '@/components/site-chrome'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Canada job search without the feed',
  description:
    'A Canada-first job search alternative to endless Indeed and LinkedIn scrolling. JobMatch ranks the 10 roles worth your time every week from your resume.',
  alternates: { canonical: '/canada-job-search' },
  keywords: [
    'Canada job search',
    'jobs in Canada',
    'Toronto jobs',
    'Vancouver remote jobs',
    'Montreal jobs',
    'Indeed alternative Canada',
    'LinkedIn jobs Canada',
    'Canada-first job matcher',
  ],
}

const faqs = [
  {
    q: 'What is a Canada-first job search?',
    a: 'JobMatch ranks Canadian roles first — Toronto, Vancouver, Montreal, Ottawa, Calgary, Waterloo, and remote Canada — instead of flooding you with US listings you cannot take.',
  },
  {
    q: 'Is this better than searching Indeed for jobs in Canada?',
    a: 'Indeed is useful as a database. It is a poor weekly workflow. JobMatch uses that market, removes sponsored noise, and returns a Top 10 matched to your resume.',
  },
]

export default function CanadaJobSearchPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <FaqJsonLd items={faqs} />
      <SiteHeader marketing />
      <article className="mx-auto w-full max-w-2xl px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Canada job search</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Stop searching Canadian job boards. Start matching.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          If you are hunting jobs in Canada, the problem is not that roles do not exist. It is that LinkedIn, Indeed, and company career pages all ask you to do the same unpaid work: scroll, filter, guess keywords, and still miss the listing that closes Thursday.
        </p>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          JobMatch is built as a Canada-first job matcher. You upload a resume once. We scan the places you already search, drop sponsored jobs, and give you the 10 roles worth your time — every week.
        </p>
        <h2 className="mt-10 text-2xl font-semibold tracking-tight">Why Canada job search feels broken</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>US remote roles crowd out Toronto, Vancouver, and Montreal listings.</li>
          <li>Sponsored jobs sit above the role you actually fit.</li>
          <li>Keyword search punishes people who do the work under a different title.</li>
        </ul>
        <h2 className="mt-10 text-2xl font-semibold tracking-tight">A better weekly workflow</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Free is one ranked Top 10. Founding Pro is $9/month for a new list every week from the same Canadian boards — still named on every row.
        </p>
        <Link href="/app" className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Match Canadian jobs to my resume
        </Link>
        <dl className="mt-12 space-y-5">
          {faqs.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1 text-sm leading-6 text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </article>
      <SiteFooter />
    </main>
  )
}
