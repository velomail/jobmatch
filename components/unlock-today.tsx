'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { UNLOCK_TODAY_CTA } from '@/lib/billing'
import { requestMatchRun } from '@/lib/match-api'
import { notifyWeeklyListReady } from '@/lib/push-client'
import { loadState, rememberShownJobs, unlockTodayAndRematch, updateState } from '@/lib/storage'
import { cn } from '@/lib/utils'

export function UnlockTodayButton({
  onUnlocked,
  className,
  compact = false,
}: {
  onUnlocked?: () => void
  className?: string
  compact?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true)
        void (async () => {
          const current = loadState()
          if (current.resume && current.lookingFor) {
            const result = await requestMatchRun({
              resume: current.resume,
              lookingFor: current.lookingFor,
              preferredCity: current.preferredCity,
              plan: 'founding',
              hasLastRun: false,
              excludeKeys: current.seenJobKeys,
            })
            if (result.run) {
              updateState({
                plan: 'founding',
                foundingLocked: true,
                lastRun: result.run,
                intent: result.intent,
              })
              rememberShownJobs(result.run)
              void notifyWeeklyListReady(result.run.matches.length)
              onUnlocked?.()
              if (!onUnlocked) router.push('/app/matches')
              return
            }
          }
          unlockTodayAndRematch()
          onUnlocked?.()
          if (!onUnlocked) router.push('/app/matches')
        })()
      }}
      className={cn(
        compact
          ? 'rounded-full bg-primary px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-primary-foreground md:px-4 md:py-2 md:text-xs'
          : 'btn-pill h-12 w-full md:h-14',
        className,
      )}
    >
      {busy ? 'Unlocking this week’s 10…' : UNLOCK_TODAY_CTA}
    </button>
  )
}
