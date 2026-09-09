import { searchLiveJobs } from '@/lib/inventory'
import { briefListings, interpretLookingFor, rerankWithLookingFor } from '@/lib/ai/interpret-intent'
import type { PlanId } from '@/lib/billing'
import { weekKey } from '@/lib/dates'
import { applyLocationToIntent } from '@/lib/location'
import { applyListingBriefs, applyRerank, candidatePool, MATCH_QUALITY, type MatchRun } from '@/lib/match'
import { parseResumeText, type ParsedResume } from '@/lib/resume'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    resume?: ParsedResume
    rawText?: string
    fileName?: string
    lookingFor?: string
    preferredCity?: string
    plan?: PlanId
    hasLastRun?: boolean
    replaceCatalog?: boolean
    excludeKeys?: string[]
  }

  const lookingFor = body.lookingFor?.trim() ?? ''
  const resume =
    body.resume ??
    (body.rawText && body.rawText.length >= 8 ? parseResumeText(body.rawText, body.fileName) : null)

  if (!resume) {
    return Response.json({ error: 'A resume or a “what you want next” note is required.' }, { status: 400 })
  }

  if (!lookingFor) {
    return Response.json({ error: 'Tell us what you want next so we can rank the 10.' }, { status: 400 })
  }

  const interpreted = await interpretLookingFor(lookingFor, resume)
  const intent = applyLocationToIntent(interpreted.intent, body.preferredCity, lookingFor)
  const source = interpreted.source
  const allowed = body.plan === 'founding' || !body.hasLastRun || body.replaceCatalog

  if (!allowed) {
    return Response.json(
      { allowed: false, intent, source, error: 'Free list already used. Unlock this week’s 10 — $9/month.' },
      { status: 402 },
    )
  }

  const live = await searchLiveJobs(lookingFor, body.preferredCity, intent, body.excludeKeys)
  const inventory = live.jobs
  const useCatalog = live.listings === 'catalog' && !inventory.length
  const excludeKeys = inventory.length < 10 ? [] : (body.excludeKeys ?? [])
  const pool = candidatePool(
    resume,
    body.preferredCity,
    intent,
    20,
    useCatalog ? undefined : inventory,
    excludeKeys,
  )
  let run: MatchRun = {
    generatedAt: new Date().toISOString(),
    seedDate: weekKey(),
    matches: pool.slice(0, 10),
    listings: useCatalog ? 'catalog' : 'live',
    quality: MATCH_QUALITY,
  }
  const reranked = await rerankWithLookingFor(lookingFor, pool)
  if (reranked?.length) {
    run = applyRerank(run, reranked, resume, body.preferredCity, intent, useCatalog ? undefined : inventory)
  }
  const briefs = await briefListings({ lookingFor, resume, jobs: run.matches })
  if (briefs?.length) {
    run = applyListingBriefs(run, briefs)
  } else {
    run = applyListingBriefs(run, [])
  }

  return Response.json({
    allowed: true,
    run,
    intent,
    source,
    listings: useCatalog ? 'catalog' : 'live',
    listingCount: live.listingCount,
    listingError: live.listingError,
  })
}
