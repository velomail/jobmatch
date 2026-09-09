import 'server-only'

import { generateText, Output } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

import { fallbackIntent, type MatchIntent } from '@/lib/intent'
import type { Job } from '@/lib/jobs'
import type { ParsedResume } from '@/lib/resume'

const intentSchema = z.object({
  titles: z.array(z.string()),
  skills: z.array(z.string()),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead']).nullable(),
  workStyles: z.array(z.enum(['Remote', 'Hybrid', 'On-site'])),
  cities: z.array(z.string()),
  dealBreakers: z.array(z.string()),
  summary: z.string(),
})

const rerankSchema = z.object({
  ids: z.array(z.string()),
})

function model(name: string) {
  return openai(name)
}

export async function interpretLookingFor(
  lookingFor: string,
  resume?: ParsedResume | null,
): Promise<{ intent: MatchIntent; source: 'openai' | 'fallback' }> {
  const trimmed = lookingFor.trim()
  if (!trimmed) return { intent: fallbackIntent(''), source: 'fallback' }
  if (!process.env.OPENAI_API_KEY) return { intent: fallbackIntent(trimmed), source: 'fallback' }

  try {
    const { output } = await generateText({
      model: model(process.env.OPENAI_PARSE_MODEL || 'gpt-4.1-mini'),
      output: Output.object({ schema: intentSchema }),
      prompt: `Extract matching criteria from ONLY the "what they want next" note.
Do not turn resume skills into the target job. If they asked for sales, titles must be sales titles — not engineering, host, cashier, or warehouse.
Titles must be real 2-4 word job titles (Account Executive, SDR, Product Manager). Never a sentence.
Do not invent jobs.
Only add Remote to workStyles if they explicitly asked for remote work. Naming a city without remote means that city only — not Calgary, Ottawa, or the rest of Canada.

What they want next:
${trimmed}

Resume is background only (do not override their note):
${resume?.summaryLine ?? ''}

Return titles they want, skills for THAT target role, seniority, work styles, cities, and deal-breakers.`,
    })

    if (!output) return { intent: fallbackIntent(trimmed), source: 'fallback' }
    return { intent: { ...output, summary: output.summary || trimmed }, source: 'openai' }
  } catch {
    return { intent: fallbackIntent(trimmed), source: 'fallback' }
  }
}

export async function rerankWithLookingFor(
  lookingFor: string,
  jobs: Pick<Job, 'id' | 'title' | 'company' | 'city' | 'workStyle' | 'summary' | 'skills' | 'postedDaysAgo'>[],
): Promise<string[] | null> {
  if (!process.env.OPENAI_API_KEY || jobs.length === 0) return null

  try {
    const { output } = await generateText({
      model: model(process.env.OPENAI_RERANK_MODEL || process.env.OPENAI_PARSE_MODEL || 'gpt-4.1-mini'),
      output: Output.object({ schema: rerankSchema }),
      prompt: `Rank these real job listings for this person. Fit to what they asked for comes first. Recency only breaks ties.
Drop anything that is a different career: host, server, cashier, warehouse, driver, or retail floor unless they asked for that work.
If two listings are the same job (same company and same or nearly same title), keep only the newest one.
If they named a city and did not ask for remote, drop every listing that is not in that city or its immediate metro. Calgary is not Toronto. Ottawa is not Toronto.
Return exactly 10 listing ids when at least 10 jobs match the career they asked for. Only return fewer if the list does not contain 10 on-target jobs. Never invent ids. Never include a job that does not match what they want next. Never include duplicates.

What they want next:
${lookingFor.trim()}

Listings:
${jobs
  .map(
    (job) =>
      `${job.id} | ${job.title} at ${job.company} | ${job.city} ${job.workStyle} | posted ${job.postedDaysAgo}d ago | ${job.skills.slice(0, 6).join(', ')} | ${job.summary}`,
  )
  .join('\n')}`,
    })

    const allowed = new Set(jobs.map((job) => job.id))
    const ids = (output?.ids ?? []).filter((id) => allowed.has(id))
    return ids.length ? ids : null
  } catch {
    return null
  }
}

const briefSchema = z.object({
  briefs: z.array(
    z.object({
      id: z.string(),
      summary: z.string(),
      whyFits: z.string(),
      watchFor: z.string(),
    }),
  ),
})

export async function briefListings(input: {
  lookingFor: string
  resume?: ParsedResume | null
  jobs: Pick<Job, 'id' | 'title' | 'company' | 'city' | 'workStyle' | 'salary' | 'summary' | 'skills'>[]
}): Promise<{ id: string; summary: string; whyFits: string; watchFor: string }[] | null> {
  if (!process.env.OPENAI_API_KEY || input.jobs.length === 0) return null

  try {
    const { output } = await generateText({
      model: model(process.env.OPENAI_PARSE_MODEL || 'gpt-4.1-mini'),
      output: Output.object({ schema: briefSchema }),
      prompt: `Write a brief for each real job listing for this one person.
Every field must be complete sentences that end with a period. Never cut a sentence off. Never copy raw posting dump (Location:, Compensation:, JOB SUMMARY, HTML).
Write in second person. Be specific and useful. Do not invent salary, visa, or perks that are not in the listing.

What they want next:
${input.lookingFor.trim()}

Resume background:
${input.resume?.summaryLine ?? ''}
Titles: ${(input.resume?.titles ?? []).slice(0, 4).join(', ')}
Skills: ${(input.resume?.skills ?? []).slice(0, 12).join(', ')}

For each listing return:
- summary: 2-3 sentences on what the job actually is and who it is for
- whyFits: 2 sentences on why it is on THEIR list, using the resume and what they want next
- watchFor: 1 sentence they should know before applying (quota, travel, seniority stretch, staffing firm, on-site vs remote, missing skill). If nothing notable, say what to confirm on the careers page.

Listings:
${input.jobs
  .map(
    (job) =>
      `${job.id} | ${job.title} at ${job.company} | ${job.city} ${job.workStyle} | ${job.salary || 'pay not listed'} | ${job.skills.slice(0, 6).join(', ')} | ${job.summary}`,
  )
  .join('\n')}`,
    })

    const allowed = new Set(input.jobs.map((job) => job.id))
    const briefs = (output?.briefs ?? []).filter((brief) => allowed.has(brief.id) && brief.summary.trim())
    return briefs.length ? briefs : null
  } catch {
    return null
  }
}
