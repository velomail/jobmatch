'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { MatchCard, MatchList } from '@/components/match-card'
import { UnlockTodayButton } from '@/components/unlock-today'
import { formatMatchDate } from '@/lib/dates'
import { requestListingBriefs, requestMatchRun } from '@/lib/match-api'
import { needsListingBriefs, runNeedsQualityRefresh } from '@/lib/match'
import { notifyWeeklyListReady } from '@/lib/push-client'
import {
  isListStale,
  isLiveMatchRun,
  isPro,
  loadState,
  lookingForText,
  needsLiveRefresh,
  nextAppPath,
  rememberShownJobs,
  refreshProListIfNeeded,
  updateState,
  type UserState,
} from '@/lib/storage'

export function MatchesClient() {
  const router = useRouter()
  const [state, setState] = useState<UserState | null>(null)
  const [hydrating, setHydrating] = useState(false)

  useEffect(() => {
    let cancelled = false
    let attempted = false
    let briefed = false

    const hydrateLiveList = async (current: UserState) => {
      if (cancelled || attempted || !needsLiveRefresh(current) || !current.resume || !lookingForText(current)) {
        return
      }
      attempted = true
      setHydrating(true)
      try {
        const previousIds = new Set((current.lastRun?.matches ?? []).map((job) => job.id))
        const result = await requestMatchRun({
          resume: current.resume,
          lookingFor: lookingForText(current),
          preferredCity: current.preferredCity,
          plan: current.plan,
          hasLastRun: isLiveMatchRun(current.lastRun),
          replaceCatalog: true,
          excludeKeys: runNeedsQualityRefresh(current.lastRun) ? [] : current.seenJobKeys,
        })
        if (result.run && (result.run.matches.length || !result.listingError)) {
          updateState({
            lastRun: result.run,
            intent: result.intent,
            preferredCity: current.preferredCity || result.intent?.cities[0],
          })
          rememberShownJobs(result.run)
          const changed = result.run.matches.some((job) => !previousIds.has(job.id))
          if (changed) void notifyWeeklyListReady(result.run.matches.length)
          if (!cancelled) setState(loadState())
        }
      } finally {
        if (!cancelled) setHydrating(false)
      }
    }

    const hydrateBriefs = async (current: UserState) => {
      if (
        cancelled ||
        briefed ||
        needsLiveRefresh(current) ||
        !current.lastRun ||
        !needsListingBriefs(current.lastRun) ||
        !current.resume ||
        !lookingForText(current)
      ) {
        return
      }
      briefed = true
      const run = await requestListingBriefs({
        resume: current.resume,
        lookingFor: lookingForText(current),
        run: current.lastRun,
      })
      if (!run) return
      const next = updateState({ lastRun: run })
      if (!cancelled) setState(next)
    }

    const sync = () => {
      const current = loadState()
      const gate = nextAppPath(current)
      if (gate !== '/app/matches') {
        router.replace(gate)
        return
      }
      setState(refreshProListIfNeeded())
      if (needsLiveRefresh(current) && !attempted) {
        setHydrating(true)
        void hydrateLiveList(current)
      } else if (!needsLiveRefresh(current)) {
        setHydrating(false)
        void hydrateBriefs(current)
      }
    }
    sync()
    window.addEventListener('jobmatch-state', sync)
    return () => {
      cancelled = true
      window.removeEventListener('jobmatch-state', sync)
    }
  }, [router])

  const listed = useMemo(() => state?.lastRun?.matches ?? [], [state?.lastRun])

  if (hydrating) {
    return (
      <p className="text-sm text-muted-foreground md:text-lg">
        Finding live listings{state?.preferredCity && state.preferredCity !== 'Remote' ? ` in ${state.preferredCity}` : ''} for what you want next…
      </p>
    )
  }

  if (!state?.lastRun) {
    return <p className="text-sm text-muted-foreground md:text-lg">Loading the jobs that match your resume…</p>
  }

  const stale = isListStale(state)
  const pro = isPro(state)
  const cityLabel = state.preferredCity && state.preferredCity !== 'Remote' ? state.preferredCity : state.intent?.cities[0]

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {stale ? (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 md:rounded-3xl md:p-8">
          <p className="text-sm font-semibold md:text-lg">Last week’s list — the market moved.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-lg md:leading-8">
            Founding Pro is $9/month. Paying unlocks this week’s jobs for your resume right now. You do not upload again.
          </p>
          <div className="mt-4 md:mt-6">
            <UnlockTodayButton onUnlocked={() => setState(loadState())} />
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[1.25rem] border border-border/80 bg-card md:rounded-[1.75rem]">
        <div className="border-b border-border px-4 py-5 md:px-8 md:py-8 lg:px-10 lg:py-10">
          <p className="type-label text-primary">
            {stale ? 'From last week' : formatMatchDate(state.lastRun.generatedAt)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            {stale ? 'The market moved' : 'Jobs worth your time this week'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground md:mt-4 md:text-lg md:leading-8">
            {stale
              ? 'Unlock this week to see jobs ranked for your resume, not leftover listings.'
              : cityLabel
                ? `Ranked for your resume in ${cityLabel}. Remote roles only appear if you asked for remote.`
                : pro
                  ? 'Ranked for your resume. Each one should be a real next step. Next week a fresh list will be here.'
                  : 'Ranked for your resume. Your one free shortlist. Next week this list goes stale.'}
          </p>
        </div>
        {listed.length ? (
          <MatchList
            footer={
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-4 text-xs md:px-8 md:py-5 md:text-sm lg:px-10">
                <span className="font-medium text-muted-foreground">
                  {listed.length} {listed.length === 1 ? 'role' : 'roles'}, best fit first
                </span>
                <span className="font-semibold text-primary">{stale ? 'Needs this week' : 'Updated this week'}</span>
              </div>
            }
          >
            {listed.map((match) => (
              <MatchCard key={match.id} match={match} href={`/app/matches/${match.id}`} />
            ))}
          </MatchList>
        ) : (
          <p className="px-4 py-5 text-sm leading-6 text-muted-foreground md:px-8 md:py-8 md:text-lg md:leading-8 lg:px-10">
            {cityLabel
              ? `No live listings in ${cityLabel} matched what you want next. Ask for remote in the note if you can work from anywhere.`
              : 'No live listings matched what you want next. Try a broader title or city.'}
          </p>
        )}
      </div>
    </div>
  )
}
