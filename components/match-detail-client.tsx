'use client'

import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { jobHref } from '@/lib/jobs'
import { listingFitReason, listingHeadline, looksTruncated, postedInEnglish } from '@/lib/listing-copy'
import { requestListingBriefs } from '@/lib/match-api'
import { needsListingBriefs } from '@/lib/match'
import { loadState, lookingForText, markApplied, nextAppPath, updateState, type UserState } from '@/lib/storage'

export function MatchDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [state, setState] = useState<UserState | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    let attempted = false

    const hydrate = async () => {
      const next = loadState()
      const gate = nextAppPath(next)
      if (!next.lastRun) {
        router.replace(gate)
        return
      }
      setState(next)
      setSaved(next.applications.some((item) => item.jobId === id))

      if (
        cancelled ||
        attempted ||
        !needsListingBriefs(next.lastRun) ||
        !next.resume ||
        !lookingForText(next)
      ) {
        return
      }
      attempted = true
      const run = await requestListingBriefs({
        resume: next.resume,
        lookingFor: lookingForText(next),
        run: next.lastRun,
      })
      if (!run) return
      const savedState = updateState({ lastRun: run })
      if (!cancelled) setState(savedState)
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [id, router])

  const match = state?.lastRun?.matches.find((job) => job.id === id)

  if (!state?.lastRun) {
    return <p className="text-sm text-muted-foreground md:text-lg">Loading this job for your resume…</p>
  }

  const applyHref = match ? jobHref(match) : null

  if (!match) {
    return (
      <div>
        <p className="text-sm text-muted-foreground md:text-lg">That job is no longer in this list.</p>
        <Link href="/app/matches" className="mt-4 inline-block font-semibold text-primary md:text-lg">
          Back to today’s jobs
        </Link>
      </div>
    )
  }

  const writing = needsListingBriefs(state.lastRun)

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <Link href="/app/matches" className="inline-flex items-center gap-2 text-sm text-muted-foreground md:text-base">
        <ArrowLeft className="size-4 md:size-5" /> Jobs worth your time
      </Link>

      <article className="overflow-hidden rounded-[1.25rem] border border-border/80 bg-card md:rounded-[1.75rem]">
        <div className="border-b border-border px-4 py-5 md:px-8 md:py-8 lg:px-10 lg:py-10">
          <p className="type-label text-primary">{postedInEnglish(match.postedDaysAgo)}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">{listingHeadline(match)}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground md:mt-4 md:text-lg md:leading-8">
            {listingFitReason(match)}
          </p>
          {match.whyFits ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-lg md:leading-8">{match.whyFits}</p>
          ) : null}
        </div>

        <div className="border-b border-border px-4 py-5 md:px-8 md:py-8 lg:px-10 lg:py-10">
          <p className="type-label text-primary">Why this is on your list</p>
          <p className="mt-3 text-sm leading-6 md:mt-4 md:text-lg md:leading-8">
            {writing && looksTruncated(match.summary)
              ? 'Writing a plain-English brief for your resume…'
              : match.summary}
          </p>
          {match.watchFor ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-lg md:leading-8">{match.watchFor}</p>
          ) : null}
        </div>

        <div className="border-b border-border px-4 py-5 md:px-8 md:py-8 lg:px-10 lg:py-10">
          <p className="type-label text-primary">On your resume</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground md:mt-4 md:text-lg md:leading-8">
            {match.matchedSkills.length
              ? `Those overlapping skills — ${match.matchedSkills.join(', ')} — are what lifts the fit percentage.`
              : 'Named skills barely overlap here, so the percentage leans on title, city, and seniority instead.'}
          </p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground md:text-lg md:leading-8">
            {match.missingSkills.length
              ? `The listing still asks for ${match.missingSkills.join(', ')}. Missing those on your resume is what holds the percentage back.`
              : 'No extra skill gaps jumped out, so little of the score is being held back by the listing.'}
          </p>
        </div>

        <div className="flex flex-col gap-4 px-6 py-6 md:gap-5 md:px-8 md:py-8 lg:px-10 lg:py-10">
          {applyHref ? (
            <a
              href={applyHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                setState(markApplied(match.id, 'applied'))
                setSaved(true)
              }}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-8 text-center text-base font-semibold text-primary-foreground transition hover:bg-accent md:h-16 md:text-lg"
            >
              Apply on the {match.company} site <ArrowUpRight className="size-5 md:size-6" />
            </a>
          ) : (
            <p className="text-base text-muted-foreground md:text-lg">No company careers link for this role yet.</p>
          )}
          <button
            type="button"
            onClick={() => {
              setState(markApplied(match.id, 'saved'))
              setSaved(true)
            }}
            className="inline-flex h-14 w-full items-center justify-center rounded-full border border-border bg-card px-8 text-base font-semibold md:h-16 md:text-lg"
          >
            {saved ? 'Saved to results' : 'Save this next role'}
          </button>
        </div>
      </article>
    </div>
  )
}
