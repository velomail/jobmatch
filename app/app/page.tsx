'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { loadState, nextAppPath } from '@/lib/storage'

export default function AppIndexPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace(nextAppPath(loadState()))
  }, [router])

  return <p className="text-sm text-muted-foreground">Opening JobMatch…</p>
}
