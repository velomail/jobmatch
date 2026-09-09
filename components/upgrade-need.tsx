import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { monthlySavings, PLANS } from '@/lib/billing'

export function UpgradeNeed({
  title,
  body,
  compact = false,
}: {
  title: string
  body: string
  compact?: boolean
}) {
  return (
    <div className={`rounded-2xl border border-primary/15 bg-primary/5 text-left md:rounded-3xl ${compact ? 'p-4 md:p-6' : 'p-5 md:p-8'}`}>
      <p className="text-sm font-semibold text-foreground md:text-lg">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base md:leading-7">{body}</p>
      <Link
        href="/pricing"
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-accent md:h-14 md:rounded-2xl md:px-8 md:text-base"
      >
        Lock Founding Pro at ${PLANS.founding.price}/mo
        <ArrowRight className="size-4" />
      </Link>
      <p className="mt-2 text-xs text-muted-foreground">
        ${monthlySavings()} less than launch price. One recruiter intro costs more than a year of this.
      </p>
    </div>
  )
}
