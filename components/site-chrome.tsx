'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { AppContainer } from '@/components/app-container'
import { BrandMark } from '@/components/brand-mark'
import { cn } from '@/lib/utils'

const marketingLinks = [
  { href: '/app', label: 'Today' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
]

export function SiteHeader({ marketing = true }: { marketing?: boolean }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Primary navigation">
      <AppContainer size="wide" className="flex items-center justify-between py-6 md:py-8">
        <BrandMark />
        <div className="hidden items-center gap-8 md:flex">
          {marketingLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'type-label text-muted-foreground transition hover:text-foreground',
                pathname === link.href && 'text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        {marketing ? (
          <Link href="/app" className="btn-pill h-10 px-4 text-[13px] md:h-12 md:px-6 md:text-sm">
            Open web app <ArrowUpRight className="size-3.5 md:size-4" />
          </Link>
        ) : (
          <span />
        )}
      </AppContainer>
    </nav>
  )
}
