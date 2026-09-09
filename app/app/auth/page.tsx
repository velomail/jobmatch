'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppPrimaryButton, OnboardingPanel } from '@/components/app-container'
import { loadState, updateState } from '@/lib/storage'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const state = loadState()
    if (!state.onboardingSeen) {
      router.replace('/app/welcome')
      return
    }
    if (state.email) setEmail(state.email)
  }, [router])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        updateState({ email: email.trim().toLowerCase(), waitlist: true })
        router.push('/app/resume')
      }}
    >
      <OnboardingPanel
        actions={
          <AppPrimaryButton type="submit">Continue</AppPrimaryButton>
        }
      >
        <p className="type-label text-primary">Account</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">What’s your email?</h1>
        <p className="text-sm leading-6 text-muted-foreground md:text-lg md:leading-8">
          This keeps your resume and your one free list. Clerk magic link / OTP replaces this screen later.
        </p>
        <label className="sr-only" htmlFor="app-email">
          Email
        </label>
        <input
          id="app-email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@email.com"
          className="h-14 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 md:h-16 md:text-lg"
        />
      </OnboardingPanel>
    </form>
  )
}
