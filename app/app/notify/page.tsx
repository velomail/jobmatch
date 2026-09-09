'use client'

import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppPrimaryButton, OnboardingPanel } from '@/components/app-container'
import { enablePushNotifications, isIosSafari, isStandaloneDisplay } from '@/lib/push-client'
import { loadState, updateState } from '@/lib/storage'

export default function NotifyPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const state = loadState()
    if (!state.email) router.replace('/app/auth')
    else if (!state.resume) router.replace('/app/resume')
    if (isIosSafari() && !isStandaloneDisplay()) {
      setHint('On iPhone, tap Share → Add to Home Screen, then open JobMatch from there to get pings.')
    }
  }, [router])

  async function finish(granted: boolean) {
    updateState({ notifyAsked: true, notifyGranted: granted })
    router.push('/app/matches')
  }

  return (
    <OnboardingPanel
      actions={
        <>
          <AppPrimaryButton
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true)
              void (async () => {
                const result = await enablePushNotifications()
                if (!result.granted && result.error) {
                  setError(result.error)
                  setBusy(false)
                  if (isIosSafari() && !isStandaloneDisplay()) return
                }
                await finish(result.granted)
              })()
            }}
          >
            {busy ? 'Turning pings on…' : 'Notify me'}
          </AppPrimaryButton>
          <button
            type="button"
            className="h-12 text-sm font-medium text-muted-foreground md:h-14 md:text-base"
            onClick={() => void finish(false)}
          >
            Not now
          </button>
        </>
      }
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary md:size-16 md:rounded-3xl">
        <Bell className="size-5 md:size-7" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">Get a ping when this week’s 10 are ready.</h1>
      <p className="text-sm leading-6 text-muted-foreground md:text-lg md:leading-8">
        One notification a week, on your phone. Newest jobs first. No feed.
      </p>
      {hint ? <p className="text-sm leading-6 text-primary md:text-base md:leading-7">{hint}</p> : null}
      {error ? <p className="text-sm text-destructive md:text-base">{error}</p> : null}
    </OnboardingPanel>
  )
}
