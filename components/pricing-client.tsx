'use client'

import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { loadState, unlockTodayAndRematch } from '@/lib/storage'

export function PricingClient() {
  const router = useRouter()
  const [annual, setAnnual] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <div className="mt-8">
      <div className="mb-3 flex rounded-full bg-background p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setAnnual(false)}
          className={`flex-1 rounded-full px-3 py-2 ${!annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
        >
          $9/month locked
        </button>
        <button
          type="button"
          onClick={() => setAnnual(true)}
          className={`flex-1 rounded-full px-3 py-2 ${annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
        >
          $79/year · best deal
        </button>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true)
          const current = loadState()
          if (!current.email) {
            router.push('/app')
            return
          }
          unlockTodayAndRematch()
          router.push('/app/matches')
        }}
        className="btn-pill h-12 w-full md:h-14"
      >
        {busy ? 'Unlocking this week’s 10…' : annual ? 'Unlock this week’s 10 — $79/year' : 'Unlock this week’s 10 — $9/month'}
        <Check className="size-4" />
      </button>
    </div>
  )
}
