import 'server-only'

import { COMPANY_CAREERS, jobHref, type Job } from '@/lib/jobs'
import type { MatchIntent } from '@/lib/intent'
import { cleanListingText } from '@/lib/listing-copy'
import {
  daysAgoFromDate,
  inferSeniority,
  inferWorkStyle,
  salaryFromRange,
  searchTerms,
  skillsFrom,
} from '@/lib/listing-map'
import { listingFitsLocation, resolveLocation } from '@/lib/location'
import { isRecentEnough, listingMatchesQuery } from '@/lib/listing-quality'

type AdzunaHit = {
  id: string
  title?: string
  description?: string
  created?: string
  redirect_url?: string
  salary_min?: number
  salary_max?: number
  company?: { display_name?: string }
  location?: { display_name?: string; area?: string[] }
}

type AdzunaResponse = {
  results?: AdzunaHit[]
  count?: number
}

function cityFrom(hit: AdzunaHit) {
  const area = hit.location?.area ?? []
  const display = hit.location?.display_name ?? ''
  const city = area[area.length - 1] || display.split(',')[0] || 'Remote'
  const province = area.length > 1 ? area[area.length - 2] : ''
  return { city, province }
}

function toJob(hit: AdzunaHit): Job | null {
  const title = hit.title?.trim()
  const company = hit.company?.display_name?.trim()
  if (!title || !company) return null
  const { city, province } = cityFrom(hit)
  const applyUrl = hit.redirect_url
  return {
    id: `adzuna-${hit.id}`,
    title,
    company,
    city,
    province,
    workStyle: inferWorkStyle(title, hit.description ?? '', city),
    source: jobHref({ company, applyUrl }) && COMPANY_CAREERS[company] ? 'Company site' : 'Indeed',
    applyUrl,
    skills: skillsFrom(`${title} ${hit.description ?? ''}`),
    seniority: inferSeniority(title),
    salary: salaryFromRange(hit.salary_min, hit.salary_max),
    postedDaysAgo: daysAgoFromDate(hit.created),
    closesInDays: 14,
    applicants: 0,
    summary: cleanListingText(hit.description ?? title, 1600),
  }
}

export async function searchAdzunaJobs(
  lookingFor: string,
  preferredCity?: string,
  intent?: MatchIntent,
  pages = 1,
  query?: string,
  options?: { maxDays?: number; distance?: number },
): Promise<{ jobs: Job[]; error?: string }> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  const country = (process.env.ADZUNA_COUNTRY || 'ca').toLowerCase()
  if (!appId || !appKey) return { jobs: [], error: 'Adzuna keys are missing.' }

  const what = query ?? searchTerms(lookingFor, intent)
  if (!what) return { jobs: [] }
  const location = resolveLocation(preferredCity, intent, lookingFor)
  const where = preferredCity && preferredCity.toLowerCase() !== 'remote' && preferredCity.toLowerCase() !== 'any city'
    ? preferredCity
    : location.cities[0]

  const fetchPage = async (page: number) => {
    const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`)
    url.searchParams.set('app_id', appId)
    url.searchParams.set('app_key', appKey)
    url.searchParams.set('results_per_page', '50')
    url.searchParams.set('what', what)
    url.searchParams.set('max_days_old', String(options?.maxDays ?? 7))
    url.searchParams.set('sort_by', 'date')
    if (where) {
      url.searchParams.set('where', where)
      url.searchParams.set('distance', String(options?.distance ?? 40))
    }
    url.searchParams.set('content-type', 'application/json')
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) throw new Error(String(response.status))
    const data = (await response.json()) as AdzunaResponse
    return (data.results ?? [])
      .map(toJob)
      .filter((job): job is Job => Boolean(job))
      .filter((job) => isRecentEnough(job, options?.maxDays) && listingFitsLocation(job, location) && listingMatchesQuery(job.title, intent))
  }

  try {
    const first = await fetchPage(1)
    if (pages < 2) return { jobs: first }
    try {
      const second = await fetchPage(2)
      return { jobs: [...first, ...second] }
    } catch {
      return { jobs: first }
    }
  } catch (error) {
    const status = error instanceof Error && /^\d+$/.test(error.message) ? error.message : ''
    return { jobs: [], error: status ? `Adzuna returned ${status}.` : 'Adzuna request failed.' }
  }
}
