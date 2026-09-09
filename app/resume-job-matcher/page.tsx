import type { Metadata } from 'next'
import Link from 'next/link'

import { FaqJsonLd } from '@/components/json-ld'
import { SiteHeader } from '@/components/site-chrome'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Resume job matcher',
  description:
    'Upload your resume and get personalized job recommendations. JobMatch is an AI resume job matcher that ranks the best jobs for your experience every week.',
  alternates: { canonical: '/resume-job-matcher' },
  keywords: [
    'resume job matcher',
    'jobs for my resume',
    'AI resume matching',
    'personalized job recommendations',
    'best jobs for my experience',
    'resume to job search',
  ],
}

const faqs = [
  {
    q: 'How does a resume job matcher work?',
    a: 'JobMatch reads skills, titles, seniority, and cities from your resume, then scores live-style Canada roles on overlap — not on who paid for placement.',
  },
  {
    q: 'Is this an ATS keyword scanner?',
    a: 'No. It is a weekly ranking of roles worth your time, with the skills that matched, the gaps the listing asks for, and the real platform name.',
  },
]

export default function ResumeMatcherPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <FaqJsonLd items={faqs} />
      <SiteHeader marketing />
      <article className="mx-auto w-full max-w-2xl px-5 pb-20 pt-6 sm:px-8 sm:pt-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Resume job matcher</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Find jobs for your resume — not the other way around.</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Most job search starts with a keyword and hopes your resume catches up. A resume job matcher flips that. Your experience is the query. The market is what gets filtered.
        </p>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Paste or upload your resume. JobMatch extracts the work you have already done and returns a Top 10 with fit scores and the real platform each role came from.
        </p>
        <h2 className="mt-10 text-2xl font-semibold tracking-tight">What you get that a job board will not tell you</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>A match score based on skills and seniority, not a mystery algorithm.</li>
          <li>Skills on your resume vs skills the listing still asks for.</li>
          <li>One free list to prove it. $9/month for a new Top 10 every week.</li>
        </ul>
        <Link href="/app" className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Match jobs to my resume
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
