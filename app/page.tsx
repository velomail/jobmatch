import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

import { SiteHeader } from '@/components/site-chrome'
import { SiteFooter } from '@/components/site-footer'

const preview = [
  { company: 'Ada', title: 'Senior Product Designer', city: 'Toronto', work: 'Hybrid', fit: 84, featured: true },
  { company: 'Shopify', title: 'Product Engineer', city: 'Toronto', work: 'Remote', fit: 79 },
  { company: 'Wealthsimple', title: 'Frontend Engineer', city: 'Toronto', work: 'Hybrid', fit: 76 },
]

export default function Page() {
  return (
    <main id="top" className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <SiteHeader marketing />

      <section className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 pb-16 pt-6 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-10">
        <div className="flex flex-col items-center text-center">
          <h1 className="max-w-xl text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
            Stop searching.
            <br />
            <span className="text-primary">Start matching.</span>
          </h1>
          <p className="mt-6 max-w-md text-[1.05rem] leading-7 text-muted-foreground">
            One resume. Ten jobs worth your time. Newest company listings first — apply on the employer site, not a board.
          </p>
          <Link href="/app" className="btn-pill mt-8">
            Open the web app <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <aside className="w-full rounded-[1.75rem] bg-card p-5 shadow-[0_24px_80px_-32px_rgba(26,26,26,0.18)] sm:p-6" aria-labelledby="preview-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="type-label text-muted-foreground">Tuesday 8 Oct</p>
              <h2 id="preview-title" className="mt-2 text-2xl font-semibold tracking-tight">
                This week’s <span className="type-accent text-[1.35rem] font-normal text-foreground">shortlist</span>
              </h2>
            </div>
            <p className="type-label text-primary">Resume matched</p>
          </div>

          <ul className="mt-6 space-y-3">
            {preview.map((role) =>
              role.featured ? (
                <li key={role.company} className="rounded-[1.35rem] bg-primary p-5 text-primary-foreground">
                  <p className="type-label text-primary-foreground/70">Founding Pro</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">{role.company}</p>
                  <p className="mt-1 text-sm text-primary-foreground/80">{role.title}</p>
                  <div className="mt-6 flex items-end justify-between gap-3">
                    <p className="text-xs text-primary-foreground/75">
                      {role.city} · {role.work}
                    </p>
                    <p className="text-right">
                      <span className="font-mono text-2xl font-medium">{role.fit}%</span>
                      <span className="type-label ml-2 text-primary-foreground/70">fit</span>
                    </p>
                  </div>
                  <p className="type-label mt-4 text-primary-foreground/70">Company site</p>
                </li>
              ) : (
                <li key={role.company} className="flex items-center justify-between gap-4 rounded-[1.2rem] bg-muted/70 px-5 py-4">
                  <div>
                    <p className="font-semibold tracking-tight">{role.company}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{role.title}</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm text-muted-foreground">{role.fit}%</p>
                </li>
              ),
            )}
          </ul>
        </aside>
      </section>

      <section className="border-y border-border py-5">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-3 px-6 text-center text-muted-foreground sm:flex-row sm:justify-center sm:gap-8 md:px-8 lg:px-12">
          <p className="type-label">Built for the next role</p>
          <p className="type-label">One resume. Ten thoughtful matches.</p>
          <p className="type-label">Apply on the company site.</p>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-8 px-6 py-16 text-center md:px-8 lg:px-12">
        <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">
          The list is weekly.
          <br />
          The bill is monthly.
        </h2>
        <p>
          <span className="text-[clamp(3.5rem,8vw,5rem)] font-semibold leading-none tracking-tight text-primary">$9</span>
          <span className="ml-2 text-muted-foreground">/ month</span>
        </p>
        <Link href="/app" className="btn-pill">
          Join the first list <ArrowUpRight className="size-4" />
        </Link>
      </section>

      <SiteFooter />
    </main>
  )
}
