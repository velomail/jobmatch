'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppContainer } from '@/components/app-container'
import { BrandMark } from '@/components/brand-mark'
import { UnlockTodayButton } from '@/components/unlock-today'
import { isListStale, isPro, loadState } from '@/lib/storage'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/app/matches', label: 'Matches' },
  { href: '/app/results', label: 'Results' },
  { href: '/app/account', label: 'Account' },
]

const quietPaths = ['/app/welcome', '/app/auth', '/app/resume', '/app/notify']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [pro, setPro] = useState(false)
  const [stale, setStale] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const sync = () => {
      const state = loadState()
      setPro(isPro(state))
      setStale(isListStale(state))
      setReady(true)
    }
    sync()
    window.addEventListener('jobmatch-state', sync)
    return () => window.removeEventListener('jobmatch-state', sync)
  }, [pathname, tick])

  const onboarding = quietPaths.some((path) => pathname.startsWith(path)) || pathname === '/app'
  const showTabs = !onboarding

  return (
    <div className="app-frame">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md">
        <AppContainer className="flex h-14 items-center justify-between gap-4 md:h-16">
          <BrandMark size="sm" />
          {showTabs ? (
            <nav className="hidden items-center gap-1 md:flex" aria-label="App">
              {tabs.map((tab) => {
                const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium md:text-base',
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </nav>
          ) : null}
          {ready && showTabs ? (
            stale && !pro ? (
              <UnlockTodayButton compact onUnlocked={() => setTick((value) => value + 1)} />
            ) : pro ? (
              <span className="type-label rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-primary md:px-4 md:py-2">
                Pro
              </span>
            ) : (
              <span className="type-label text-muted-foreground">Free list</span>
            )
          ) : (
            <span className="type-label text-muted-foreground">Canada</span>
          )}
        </AppContainer>
      </header>

      <div className={cn('flex flex-1 flex-col', showTabs && 'pb-24 md:pb-10')}>
        {showTabs ? (
          <AppContainer className="flex flex-1 flex-col py-6 md:py-10">{children}</AppContainer>
        ) : (
          children
        )}
      </div>

      {showTabs ? (
        <nav
          aria-label="App"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-background/95 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden"
        >
          <AppContainer>
            <div className="grid grid-cols-3 gap-2">
              {tabs.map((tab) => {
                const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      'rounded-xl py-3 text-center text-sm font-medium',
                      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {tab.label}
                  </Link>
                )
              })}
            </div>
          </AppContainer>
        </nav>
      ) : null}
    </div>
  )
}
