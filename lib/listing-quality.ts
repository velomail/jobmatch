import { jobHref, type Job } from '@/lib/jobs'
import type { MatchIntent } from '@/lib/intent'

export const MAX_POSTED_DAYS = 7
const MAX_PER_COMPANY = 2

const LEGAL_SUFFIX =
  /\b(inc|incorporated|ltd|limited|llc|llp|corp|corporation|co|company|companies|group|holdings|financial group|financial|the|of canada|canada)\b/g

const TITLE_NOISE =
  /\b(sr|senior|jr|junior|staff|lead|i|ii|iii|iv|remote|hybrid|onsite|on-site|toronto|vancouver|montreal|ottawa|calgary|waterloo|canada)\b/g

const QUERY_STOP = new Set([
  'senior', 'junior', 'staff', 'lead', 'role', 'roles', 'job', 'jobs', 'position', 'looking',
  'want', 'next', 'the', 'and', 'for', 'with', 'not', 'in', 'at', 'a', 'an', 'or', 'to', 'of',
  'on', 'my', 'me', 'hybrid', 'remote', 'onsite', 'city', 'canada', 'toronto', 'vancouver',
  'montreal', 'ottawa', 'calgary', 'waterloo',
])

const ROLE_FAMILIES: { name: string; pattern: RegExp }[] = [
  {
    name: 'sales',
    pattern:
      /\b(sales|sdr|bdr|account executive|account manager|business development|quota|closer)\b/i,
  },
  {
    name: 'engineering',
    pattern:
      /\b(software engineer|engineer|developer|frontend|front-end|backend|back-end|full[- ]?stack|sre|devops)\b/i,
  },
  {
    name: 'design',
    pattern: /\b(product designer|designer|design systems?|ux|ui)\b/i,
  },
  {
    name: 'product',
    pattern: /\b(product manager|product owner|product management)\b/i,
  },
  {
    name: 'marketing',
    pattern: /\b(marketing|growth|seo|brand manager|content marketing)\b/i,
  },
  {
    name: 'data',
    pattern: /\b(data scientist|data analyst|data engineer|machine learning|analytics)\b/i,
  },
  {
    name: 'finance',
    pattern: /\b(finance|financial analyst|accountant|controller|fp&a)\b/i,
  },
  {
    name: 'nursing',
    pattern: /\b(nurse|nursing|rn)\b/i,
  },
  {
    name: 'hospitality',
    pattern:
      /\b(host|hostess|server|bartender|barista|chef|cook|dishwasher|busser|restaurant|waiter|waitress|sommelier)\b/i,
  },
  {
    name: 'retail',
    pattern: /\b(cashier|retail|store associate|sales associate|sales floor|merchandis)\b/i,
  },
  {
    name: 'driving',
    pattern: /\b(driver|delivery driver|courier|truck driver|cdl)\b/i,
  },
  {
    name: 'warehouse',
    pattern: /\b(warehouse|picker|packer|forklift|general labour|general labor)\b/i,
  },
  {
    name: 'customer-success',
    pattern: /\b(customer success|csm|onboarding specialist|implementation specialist)\b/i,
  },
]

const OFF_TARGET_FAMILIES = new Set(['hospitality', 'retail', 'driving', 'warehouse'])
const PRO_SALES = /\b(sdr|bdr|account executive|\bae\b|account manager|business development|enterprise|inside sales|outside sales)\b/i

function compact(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function normalizeCompany(company: string) {
  return compact(company).replace(LEGAL_SUFFIX, ' ').replace(/\s+/g, ' ').trim()
}

export function normalizeTitle(title: string) {
  return compact(title.replace(/\(.*?\)/g, ' ')).replace(TITLE_NOISE, ' ').replace(/\s+/g, ' ').trim()
}

export function familiesOf(text: string) {
  return ROLE_FAMILIES.filter((family) => family.pattern.test(text)).map((family) => family.name)
}

function queryText(intent?: MatchIntent) {
  return `${intent?.titles.join(' ') ?? ''} ${intent?.summary ?? ''}`.trim()
}

function roleTokens(text: string) {
  return compact(text.replace(/\(.*?\)/g, ' '))
    .replace(TITLE_NOISE, ' ')
    .split(' ')
    .filter((token) => token.length > 2 && !QUERY_STOP.has(token))
}

function titleMatchesWanted(title: string, wantedTitles: string[]) {
  const got = roleTokens(title)
  if (!got.length) return false
  return wantedTitles.some((wanted) => {
    const need = roleTokens(wanted)
    if (!need.length) return false
    const hits = need.filter((token) =>
      got.some((part) => part === token || part.includes(token) || token.includes(part)),
    )
    if (need.length === 1) return hits.length >= 1
    return hits.length >= Math.ceil(need.length * 0.5)
  })
}

export function listingMatchesQuery(title: string, intent?: MatchIntent) {
  const query = queryText(intent)
  if (!query) return true

  const wanted = familiesOf(`${query} ${(intent?.titles ?? []).join(' ')}`)
  const got = familiesOf(title)
  if (wanted.length && got.length && !wanted.some((family) => got.includes(family))) return false
  if (got.some((family) => OFF_TARGET_FAMILIES.has(family) && !wanted.includes(family))) return false
  if (PRO_SALES.test(query) && /\b(host|hostess|server|cashier|barista|dishwasher)\b/i.test(title)) {
    return false
  }

  const wantedTitles = (intent?.titles ?? []).filter((item) => item.trim().length > 2)
  if (wantedTitles.length && titleMatchesWanted(title, wantedTitles)) return true

  if (wanted.length && got.some((family) => wanted.includes(family))) return true

  const needles = roleTokens(query)
  if (!needles.length) return false
  const hay = compact(title)
  const hits = needles.filter((token) => hay.includes(token))
  return needles.length === 1 ? hits.length === 1 : hits.length >= 2
}

export function isRecentEnough(job: Pick<Job, 'postedDaysAgo'>, maxDays = MAX_POSTED_DAYS) {
  return job.postedDaysAgo <= maxDays
}

function indeedKey(job: Job) {
  const fromUrl = job.applyUrl?.match(/jk=([a-z0-9]+)/i)?.[1]
  const fromId = job.id.match(/^hasdata-([a-z0-9]+)$/i)?.[1]
  return (fromUrl || fromId || '').toLowerCase()
}

function titleOverlap(a: string, b: string) {
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) {
    const shorter = a.length < b.length ? a : b
    return shorter.split(' ').filter(Boolean).length >= 2 ? 0.9 : 0
  }
  const left = new Set(a.split(' ').filter(Boolean))
  const right = new Set(b.split(' ').filter(Boolean))
  let hit = 0
  for (const token of left) if (right.has(token)) hit += 1
  const union = new Set([...left, ...right]).size
  return union ? hit / union : 0
}

function preferJob(prev: Job, next: Job) {
  if (next.postedDaysAgo !== prev.postedDaysAgo) {
    return next.postedDaysAgo < prev.postedDaysAgo ? next : prev
  }
  const prevEmployer = Boolean(jobHref(prev))
  const nextEmployer = Boolean(jobHref(next))
  if (nextEmployer && !prevEmployer) return next
  if (next.summary.length > prev.summary.length) {
    return { ...prev, summary: next.summary, applyUrl: prev.applyUrl || next.applyUrl }
  }
  return prev
}

function sameListing(a: Job, b: Job) {
  const jkA = indeedKey(a)
  const jkB = indeedKey(b)
  if (jkA && jkB && jkA === jkB) return true
  if (normalizeCompany(a.company) !== normalizeCompany(b.company)) return false
  return titleOverlap(normalizeTitle(a.title), normalizeTitle(b.title)) >= 0.72
}

export function dedupeJobs(jobs: Job[]) {
  const kept: Job[] = []
  for (const job of jobs) {
    const index = kept.findIndex((existing) => sameListing(existing, job))
    if (index === -1) {
      kept.push(job)
      continue
    }
    kept[index] = preferJob(kept[index], job)
  }
  return kept
}

export function capJobsPerCompany<T extends Pick<Job, 'company'>>(jobs: T[], max = MAX_PER_COMPANY) {
  const counts = new Map<string, number>()
  const out: T[] = []
  for (const job of jobs) {
    const key = normalizeCompany(job.company) || job.company.toLowerCase()
    const seen = counts.get(key) ?? 0
    if (seen >= max) continue
    counts.set(key, seen + 1)
    out.push(job)
  }
  return out
}

export function isSpamListing(job: Pick<Job, 'title' | 'company'>) {
  const hay = `${job.company} ${job.title}`.toLowerCase()
  return /\b(hire resolve|staffing agency|recruitment agency|talent agency)\b/.test(hay)
}

export function listingFingerprint(job: Pick<Job, 'id' | 'title' | 'company' | 'applyUrl'>) {
  const fromUrl = job.applyUrl?.match(/jk=([a-z0-9]+)/i)?.[1]
  const fromId = job.id.match(/^hasdata-([a-z0-9]+)$/i)?.[1]
  const jk = (fromUrl || fromId || '').toLowerCase()
  if (jk) return `jk:${jk}`
  return `ct:${normalizeCompany(job.company)}|${normalizeTitle(job.title) || job.id}`
}

export function jobSeenKeys(job: Pick<Job, 'id' | 'title' | 'company' | 'applyUrl'>) {
  return [...new Set([job.id, listingFingerprint(job)])]
}

export function excludeSeenJobs<T extends Pick<Job, 'id' | 'title' | 'company' | 'applyUrl'>>(jobs: T[], seen: string[] = []) {
  if (!seen.length) return jobs
  const blocked = new Set(seen)
  return jobs.filter((job) => !jobSeenKeys(job).some((key) => blocked.has(key)))
}

export function newestFirst<T extends Pick<Job, 'postedDaysAgo'>>(jobs: T[]) {
  return [...jobs].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
}

export function qualityFilter(jobs: Job[], intent?: MatchIntent, seen: string[] = []) {
  return newestFirst(
    excludeSeenJobs(
      dedupeJobs(
        jobs.filter(
          (job) =>
            isRecentEnough(job) && listingMatchesQuery(job.title, intent) && !isSpamListing(job),
        ),
      ),
      seen,
    ),
  )
}
