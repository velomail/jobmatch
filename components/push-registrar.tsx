'use client'

import { useEffect } from 'react'

import { registerPushWorker } from '@/lib/push-client'

export function PushRegistrar() {
  useEffect(() => {
    void registerPushWorker()
  }, [])
  return null
}
