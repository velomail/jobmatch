import { briefListings } from '@/lib/ai/interpret-intent'
import { applyListingBriefs, type MatchRun } from '@/lib/match'
import type { ParsedResume } from '@/lib/resume'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    lookingFor?: string
    resume?: ParsedResume
    run?: MatchRun
  }

  const lookingFor = body.lookingFor?.trim() ?? ''
  if (!lookingFor || !body.run?.matches.length) {
    return Response.json({ error: 'A shortlist and what you want next are required.' }, { status: 400 })
  }

  const briefs = await briefListings({ lookingFor, resume: body.resume, jobs: body.run.matches })
  const run = applyListingBriefs(body.run, briefs ?? [])
  return Response.json({ run, briefed: Boolean(briefs?.length) })
}
