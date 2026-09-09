import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function AppContainer({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode
  className?: string
  size?: 'narrow' | 'default' | 'wide'
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-6 md:px-8 lg:px-12',
        size === 'narrow' && 'max-w-[520px] md:max-w-[560px] lg:max-w-[640px]',
        size === 'default' && 'max-w-[640px] md:max-w-[720px] lg:max-w-[840px]',
        size === 'wide' && 'max-w-[1120px] lg:max-w-[1280px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function OnboardingPanel({
  children,
  actions,
}: {
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] md:min-h-[calc(100dvh-6.5rem)]">
      <div className="m-auto w-full max-w-[480px] px-6 py-10 md:max-w-[560px] md:px-0 md:py-16 lg:max-w-[640px]">
        <div className="flex flex-col gap-8 rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-[0_24px_80px_-32px_rgba(26,26,26,0.18)] md:gap-10 md:rounded-[2rem] md:p-10 lg:p-12">
          <div className="flex flex-col gap-4 md:gap-6">{children}</div>
          {actions ? <div className="flex flex-col gap-3">{actions}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function AppPrimaryButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-accent md:h-14 md:rounded-3xl md:px-8 md:text-base',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
