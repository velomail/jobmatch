import type { PlanId } from '@/lib/billing'
import type { MatchIntent } from '@/lib/intent'
import type { MatchRun } from '@/lib/match'
import type { ParsedResume } from '@/lib/resume'

export async function requestMatchRun(input: {
  resume: ParsedResume
  lookingFor: string
  preferredCity?: string
  plan?: PlanId
  hasLastRun?: boolean
  replaceCatalog?: boolean
  excludeKeys?: string[]
}): Promise<{
  run?: MatchRun
  intent?: MatchIntent
  allowed: boolean
  source?: string
  error?: string
  listingError?: string
  listingCount?: number
}> {
  const response = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resume: input.resume,
      lookingFor: input.lookingFor,
      preferredCity: input.preferredCity,
      plan: input.plan,
      hasLastRun: input.hasLastRun,
      replaceCatalog: input.replaceCatalog,
      excludeKeys: input.excludeKeys,
    }),
  })
  const data = (await response.json().catch(() => ({}))) as {
    run?: MatchRun
    intent?: MatchIntent
    allowed?: boolean
    source?: string
    error?: string
    listingError?: string
    listingCount?: number
  }
  return {
    allowed: Boolean(data.allowed),
    run: data.run,
    intent: data.intent,
    source: data.source,
    error: data.error,
    listingError: data.listingError,
    listingCount: data.listingCount,
  }
}

export async function requestListingBriefs(input: {
  resume?: ParsedResume
  lookingFor: string
  run: MatchRun
}): Promise<MatchRun | undefined> {
  const response = await fetch('/api/listings/brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resume: input.resume,
      lookingFor: input.lookingFor,
      run: input.run,
    }),
  })
  const data = (await response.json().catch(() => ({}))) as { run?: MatchRun }
  return data.run
}
