import { DAILY_MATCH_LIMIT } from '@/lib/billing'
import { weekKey } from '@/lib/dates'
import type { MatchIntent } from '@/lib/intent'
import { JOBS, type Job } from '@/lib/jobs'
import { completeSentences } from '@/lib/listing-copy'
import { capJobsPerCompany, excludeSeenJobs, isSpamListing, listingMatchesQuery } from '@/lib/listing-quality'
import { listingFitsLocation, resolveLocation } from '@/lib/location'
import type { ParsedResume } from '@/lib/resume'

export type MatchedJob = Job & {
  score: number
  matchedSkills: string[]
  missingSkills: string[]
  rank: string
  closingSoon: boolean
}

export const MATCH_QUALITY = 4

export type MatchRun = {
  generatedAt: string
  seedDate: string
  matches: MatchedJob[]
  listings?: 'live' | 'adzuna' | 'catalog'
  quality?: number
}

function overlap(a: string[], b: string[]) {
  const set = new Set(a.map((item) => item.toLowerCase()))
  return b.filter((item) => set.has(item.toLowerCase()))
}

const TITLE_STOP = new Set([
  'part', 'time', 'full', 'and', 'the', 'for', 'with', 'job', 'role', 'shift',
  'contract', 'permanent', 'immediate', 'needed', 'hiring',
])

function titleScore(resume: ParsedResume, job: Job, intent?: MatchIntent) {
  const hay = `${intent?.summary ?? ''} ${intent?.titles.join(' ') ?? ''} ${resume.rawText} ${resume.titles.join(' ')}`.toLowerCase()
  const parts = job.title
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z0-9+#.]/g, ''))
    .filter((part) => part.length > 2 && !TITLE_STOP.has(part))
  if (!parts.length) return 0
  const hits = parts.filter((part) => hay.includes(part)).length
  return hits / parts.length
}

function locationScore(resume: ParsedResume, job: Job, preferredCity?: string, intent?: MatchIntent) {
  const location = resolveLocation(preferredCity, intent, intent?.summary)
  if (location.cities.length && !listingFitsLocation(job, location)) return 0
  const cities = new Set(resume.cities.map((city) => city.toLowerCase()))
  if (preferredCity) cities.add(preferredCity.toLowerCase())
  intent?.cities.forEach((city) => cities.add(city.toLowerCase()))
  if (listingFitsLocation(job, location) && location.cities.length) return 1
  if (location.allowRemote && job.workStyle === 'Remote') return 1
  if (cities.has(job.city.toLowerCase())) return 1
  if (cities.size === 0) return 0.55
  return 0.2
}

function seniorityScore(resume: ParsedResume, job: Job, intent?: MatchIntent) {
  const order = { junior: 0, mid: 1, senior: 2, lead: 3 }
  const wanted = intent?.seniority ?? resume.seniority
  const delta = Math.abs(order[wanted] - order[job.seniority])
  return delta === 0 ? 1 : delta === 1 ? 0.72 : 0.35
}

function keywordScore(resume: ParsedResume, job: Job, intent?: MatchIntent) {
  const hay = `${intent?.summary ?? ''} ${resume.rawText}`.toLowerCase()
  const tokens = `${job.title} ${job.company} ${job.summary}`
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 4)
  const unique = Array.from(new Set(tokens))
  const hits = unique.filter((token) => hay.includes(token)).length
  return unique.length ? hits / unique.length : 0
}

function recencyScore(job: Job) {
  if (job.postedDaysAgo <= 1) return 1
  if (job.postedDaysAgo <= 3) return 0.82
  if (job.postedDaysAgo <= 7) return 0.5
  return 0.1
}

function intentFit(job: Job, intent?: MatchIntent) {
  if (!intent || (!intent.titles.length && !intent.workStyles.length && !intent.skills.length && !intent.summary)) {
    return 0.5
  }

  const titleHit = listingMatchesQuery(job.title, intent) ? 1 : 0.05
  const workHit = intent.workStyles.length ? (intent.workStyles.includes(job.workStyle) ? 1 : 0.2) : 0.5
  const skillHit = intent.skills.length
    ? overlap(intent.skills, job.skills).length / Math.max(intent.skills.length, 1)
    : 0.5
  return (titleHit * 2 + workHit + skillHit) / 4
}

function isBlocked(job: Job, intent?: MatchIntent) {
  if (!intent?.dealBreakers.length) return false
  const title = job.title.toLowerCase()
  return intent.dealBreakers.some((item) => {
    const needle = item.toLowerCase()
    if (/staff|agenc|recruit/.test(needle)) {
      return /staff|agenc|recruit/.test(`${job.title} ${job.company} ${job.summary}`.toLowerCase())
    }
    if (/engineer|engineering|developer|software/.test(needle)) {
      return /\b(engineer|developer|software|architect|devops)\b/i.test(job.title)
    }
    return title.includes(needle)
  })
}

export function scoreJob(resume: ParsedResume, job: Job, preferredCity?: string, intent?: MatchIntent) {
  const wantedSkills = intent?.skills.length ? [...new Set([...resume.skills, ...intent.skills])] : resume.skills
  const matchedSkills = overlap(wantedSkills, job.skills)
  const titleAlign = titleScore(resume, job, intent)
  const keywords = keywordScore(resume, job, intent)
  const skillScore = job.skills.length ? matchedSkills.length / job.skills.length : Math.max(titleAlign, keywords) * 0.65
  const resumeRaw =
    skillScore * 0.28 +
    titleAlign * 0.28 +
    seniorityScore(resume, job, intent) * 0.1 +
    locationScore(resume, job, preferredCity, intent) * 0.1 +
    keywords * 0.08 +
    recencyScore(job) * 0.16
  const raw = intent ? resumeRaw * 0.3 + intentFit(job, intent) * 0.7 : resumeRaw
  const bonus = listingMatchesQuery(job.title, intent) && titleAlign >= 0.35 ? 8 : 0
  const score = Math.round(Math.min(98, Math.max(1, raw * 100 + bonus)))
  return {
    score: isBlocked(job, intent) ? Math.min(score, 48) : score,
    matchedSkills,
    missingSkills: job.skills.filter((skill) => !matchedSkills.includes(skill)).slice(0, 4),
  }
}

function decorate(job: Job, resume: ParsedResume, preferredCity?: string, intent?: MatchIntent): MatchedJob {
  const { score, matchedSkills, missingSkills } = scoreJob(resume, job, preferredCity, intent)
  return {
    ...job,
    score,
    matchedSkills,
    missingSkills,
    rank: '00',
    closingSoon: job.closesInDays <= 5,
  }
}

function rankList(jobs: MatchedJob[]) {
  return capJobsPerCompany(
    jobs.sort((a, b) => b.score - a.score || a.postedDaysAgo - b.postedDaysAgo || a.closesInDays - b.closesInDays),
  ).map((job, index) => ({ ...job, rank: String(index + 1).padStart(2, '0') }))
}

export function keepBestFits(jobs: MatchedJob[], limit = DAILY_MATCH_LIMIT) {
  return rankList(jobs).slice(0, limit)
}

export function runNeedsQualityRefresh(run?: MatchRun) {
  return (run?.quality ?? 1) < MATCH_QUALITY
}

export function jobMatchesIntent(job: Job, intent?: MatchIntent, preferredCity?: string) {
  if (isBlocked(job, intent) || isSpamListing(job)) return false
  const location = resolveLocation(preferredCity, intent, intent?.summary)
  if (!listingFitsLocation(job, location)) return false
  if (!intent?.titles.length && !intent?.summary) return true
  return listingMatchesQuery(job.title, intent)
}

export function isLiveMatchRun(run?: MatchRun) {
  if (!run) return false
  if (run.listings === 'catalog') return false
  if (run.listings === 'live' || run.listings === 'adzuna') return true
  return run.matches.some((job) => job.id.startsWith('adzuna-') || job.id.startsWith('hasdata-'))
}

export function candidatePool(
  resume: ParsedResume,
  preferredCity?: string,
  intent?: MatchIntent,
  limit = 20,
  inventory: Job[] = JOBS,
  excludeKeys: string[] = [],
) {
  const location = resolveLocation(preferredCity, intent, intent?.summary)
  const located = inventory.filter((job) => listingFitsLocation(job, location))
  const pool = location.cities.length ? located : inventory
  const filtered = pool.filter((job) => jobMatchesIntent(job, intent, preferredCity))
  const isLive = inventory.some((job) => job.id.startsWith('adzuna-') || job.id.startsWith('hasdata-'))
  const source = filtered.length || isLive ? filtered : pool.filter((job) => !isBlocked(job, intent))
  const fresh = excludeSeenJobs(source, excludeKeys)
  return keepBestFits(fresh.map((job) => decorate(job, resume, preferredCity, intent)), limit)
}

export function runMatch(
  resume: ParsedResume,
  preferredCity?: string,
  intent?: MatchIntent,
  inventory?: Job[],
  excludeKeys: string[] = [],
): MatchRun {
  const matches = candidatePool(resume, preferredCity, intent, DAILY_MATCH_LIMIT, inventory, excludeKeys)
  return {
    generatedAt: new Date().toISOString(),
    seedDate: weekKey(),
    matches,
    quality: MATCH_QUALITY,
  }
}

export function applyRerank(
  run: MatchRun,
  orderedIds: string[],
  resume: ParsedResume,
  preferredCity?: string,
  intent?: MatchIntent,
  inventory: Job[] = JOBS,
): MatchRun {
  const byId = new Map(inventory.map((job) => [job.id, job]))
  for (const job of run.matches) byId.set(job.id, job)
  const picked = orderedIds
    .map((id) => byId.get(id))
    .filter((job): job is Job => Boolean(job))
    .filter((job) => jobMatchesIntent(job, intent, preferredCity))
    .slice(0, DAILY_MATCH_LIMIT)
    .map((job) => decorate(job, resume, preferredCity, intent))
  if (picked.length < DAILY_MATCH_LIMIT) {
    const used = new Set(picked.map((job) => job.id))
    const extras = keepBestFits(
      [...byId.values()]
        .filter((job) => !used.has(job.id) && jobMatchesIntent(job, intent, preferredCity))
        .map((job) => decorate(job, resume, preferredCity, intent)),
      DAILY_MATCH_LIMIT,
    )
    for (const job of extras) {
      if (used.has(job.id)) continue
      picked.push(job)
      used.add(job.id)
      if (picked.length >= DAILY_MATCH_LIMIT) break
    }
  }
  return {
    ...run,
    quality: MATCH_QUALITY,
    matches: keepBestFits(picked, DAILY_MATCH_LIMIT),
  }
}

export type ListingBrief = {
  id: string
  summary: string
  whyFits: string
  watchFor: string
}

export function applyListingBriefs(run: MatchRun, briefs: ListingBrief[]): MatchRun {
  const byId = new Map(briefs.map((brief) => [brief.id, brief]))
  return {
    ...run,
    matches: run.matches.map((job) => {
      const brief = byId.get(job.id)
      if (!brief) {
        return {
          ...job,
          summary: completeSentences(job.summary, 420),
          briefed: true,
        }
      }
      return {
        ...job,
        summary: completeSentences(brief.summary, 720),
        whyFits: completeSentences(brief.whyFits, 480),
        watchFor: completeSentences(brief.watchFor, 320),
        briefed: true,
      }
    }),
  }
}

export function needsListingBriefs(run?: MatchRun) {
  if (!run?.matches.length) return false
  return run.matches.some((job) => !job.briefed)
}

export { formatMatchDate } from '@/lib/dates'
