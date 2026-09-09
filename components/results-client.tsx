'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { isPro, loadState, nextAppPath, type UserState } from '@/lib/storage'

export function ResultsClient() {
  const router = useRouter()
  const [state, setState] = useState<UserState | null>(null)

  useEffect(() => {
    const current = loadState()
    const gate = nextAppPath(current)
    if (gate !== '/app/matches') {
      router.replace(gate)
      return
    }
    setState(current)
  }, [router])

  if (!state) return <p className="text-sm text-muted-foreground md:text-lg">Loading results…</p>

  const pro = isPro(state)
  const matches = state.lastRun?.matches ?? []
  const saved = state.applications.length

  return (
    <div>
      <p className="type-label text-primary">Results</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">Your week of work</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground md:mt-4 md:text-lg md:leading-8">
        {pro
          ? 'A new Top 10 every week. Track what you actually opened.'
          : 'Your one free list is the proof. Pro writes a new 10 each week.'}
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 md:mt-10 md:gap-6">
        <div className="rounded-2xl border border-border/80 bg-card p-4 md:rounded-3xl md:p-8">
          <p className="font-mono text-3xl font-semibold md:text-5xl">{matches.length}</p>
          <p className="mt-1 text-xs text-muted-foreground md:mt-2 md:text-sm">Roles in this list</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4 md:rounded-3xl md:p-8">
          <p className="font-mono text-3xl font-semibold md:text-5xl">{saved}</p>
          <p className="mt-1 text-xs text-muted-foreground md:mt-2 md:text-sm">Saved or applied</p>
        </div>
      </div>

      {state.applications.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground md:mt-10 md:text-lg">
          Open a listing from Matches to start the tracker.{' '}
          <Link href="/app/matches" className="font-semibold text-primary">
            Back to the shortlist
          </Link>
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border/80 rounded-2xl border border-border/80 bg-card md:mt-10 md:rounded-3xl">
          {state.applications.map((item) => {
            const match = matches.find((job) => job.id === item.jobId)
            return (
              <li key={item.jobId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm md:px-8 md:py-5 md:text-base">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{match?.company ?? item.jobId}</p>
                  <p className="truncate text-muted-foreground">{match?.title ?? 'Role from a past list'}</p>
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground md:text-xs">
                  {item.status}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
