'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { UnlockTodayButton } from '@/components/unlock-today'
import { PLANS } from '@/lib/billing'
import { enablePushNotifications } from '@/lib/push-client'
import {
  isListStale,
  isPro,
  loadState,
  markListYesterday,
  nextAppPath,
  signOut,
  updateState,
  type UserState,
} from '@/lib/storage'

export default function AppAccountPage() {
  const router = useRouter()
  const [state, setState] = useState<UserState | null>(null)

  useEffect(() => {
    const current = loadState()
    if (!current.email) {
      router.replace(nextAppPath(current))
      return
    }
    setState(current)
  }, [router])

  if (!state) return <p className="text-sm text-muted-foreground md:text-lg">Loading account…</p>

  const pro = isPro(state)
  const stale = isListStale(state)

  return (
    <div>
      <p className="type-label text-primary">Account</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">Your JobMatch</h1>

      <dl className="mt-8 space-y-4 rounded-2xl border border-border/80 bg-card p-5 text-sm md:mt-10 md:space-y-5 md:rounded-3xl md:p-8 md:text-base">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium">{state.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Plan</dt>
          <dd className="font-medium">
            {pro ? `${PLANS.founding.name} · $${PLANS.founding.price}/month` : 'One free list'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Resume</dt>
          <dd className="max-w-[12rem] truncate text-right font-medium md:max-w-xs">
            {state.resume ? state.resume.fileName || 'Pasted resume' : 'None'}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Notifications</dt>
          <dd className="font-medium">{state.notifyGranted ? 'On' : state.notifyAsked ? 'Skipped' : 'Not asked'}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col gap-3 md:mt-8 md:gap-4">
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-border text-sm font-semibold md:h-14 md:rounded-3xl md:text-base"
          onClick={() => router.push('/app/resume')}
        >
          Update resume
        </button>
        <button
          type="button"
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-border text-sm font-semibold md:h-14 md:rounded-3xl md:text-base"
          onClick={() => {
            void (async () => {
              const result = await enablePushNotifications()
              setState(updateState({ notifyAsked: true, notifyGranted: result.granted }))
            })()
          }}
        >
          {state.notifyGranted ? 'Notifications on' : 'Turn on phone notifications'}
        </button>
        {!pro || stale ? <UnlockTodayButton onUnlocked={() => setState(loadState())} /> : null}
        {pro ? (
          <button
            type="button"
            className="h-12 text-sm text-muted-foreground md:h-14 md:text-base"
            onClick={() => setState(updateState({ plan: 'free', foundingLocked: false }))}
          >
            Downgrade to free (demo)
          </button>
        ) : (
          <button
            type="button"
            className="h-12 text-sm text-muted-foreground md:h-14 md:text-base"
            onClick={() => setState(markListYesterday())}
          >
            Preview stale list (demo)
          </button>
        )}
        <button
          type="button"
          className="h-12 text-sm text-muted-foreground md:h-14 md:text-base"
          onClick={() => {
            signOut()
            router.replace('/app/welcome')
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
