import type { ReactNode } from 'react'
import Link from 'next/link'

import type { Job } from '@/lib/jobs'
import { listingFitReason, listingHeadline, postedInEnglish, closesInEnglish } from '@/lib/listing-copy'
import { cn } from '@/lib/utils'

type MatchLike = Pick<
  Job,
  'id' | 'title' | 'company' | 'city' | 'workStyle' | 'source' | 'postedDaysAgo' | 'closesInDays' | 'summary' | 'whyFits' | 'watchFor' | 'briefed'
> & {
  rank?: string
  score: number
  matchedSkills?: string[]
  missingSkills?: string[]
}

export function MatchCard({
  match,
  href,
  preview = false,
}: {
  match: MatchLike
  href?: string
  preview?: boolean
}) {
  const inner = (
    <article className={cn('px-4 py-5 md:px-8 md:py-8 lg:px-10 lg:py-10', href && 'transition-colors hover:bg-primary/[0.03]')}>
      <p className="type-label text-primary">{postedInEnglish(match.postedDaysAgo)}</p>
      <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight md:text-xl lg:text-2xl">
        {listingHeadline(match)}
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground md:mt-4 md:text-lg md:leading-8">
        {listingFitReason(match)}
      </p>
      {match.whyFits ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-lg md:leading-8">{match.whyFits}</p>
      ) : null}
      {match.briefed && match.summary ? (
        <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-lg md:leading-8">{match.summary}</p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-lg md:leading-8">
          {closesInEnglish(match.closesInDays)} Apply on the {match.company} careers page — not a job board.
        </p>
      )}
    </article>
  )

  if (!href || preview) return inner
  return (
    <Link href={href} className="block">
      {inner}
    </Link>
  )
}

export function MatchList({
  children,
  footer,
}: {
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="overflow-hidden bg-card">
      <div className="divide-y divide-border/80">{children}</div>
      {footer}
    </div>
  )
}
