import 'server-only'

import { COMPANY_CAREERS, isEmployerUrl, jobHref, type Job } from '@/lib/jobs'
import type { MatchIntent } from '@/lib/intent'
import { cleanListingText } from '@/lib/listing-copy'
import {
  cityFromLabel,
  inferSeniority,
  inferWorkStyle,
  postedDaysFromSignals,
  salaryFromRange,
  searchTerms,
  skillsFrom,
} from '@/lib/listing-map'
import { listingFitsLocation, resolveLocation } from '@/lib/location'
import { isRecentEnough, listingMatchesQuery } from '@/lib/listing-quality'

type HasdataJob = {
  id?: string
  jk?: string
  title?: string
  jobTitle?: string
  positionName?: string
  description?: string
  descriptionText?: string
  snippet?: string
  url?: string
  jobUrl?: string
  link?: string
  postedAt?: string
  date?: string
  isoDate?: string
  datePublished?: string
  company?: string | { name?: string; display_name?: string }
  companyName?: string
  location?: string | { city?: string; formattedAddress?: string; display_name?: string }
  salary?: string | { min?: number; max?: number; text?: string }
  sponsored?: boolean
}

type HasdataResponse = {
  jobs?: HasdataJob[]
  jobListings?: HasdataJob[]
  listings?: HasdataJob[]
  results?: HasdataJob[]
  data?: { jobs?: HasdataJob[] }
}

function companyName(hit: HasdataJob) {
  if (typeof hit.company === 'string') return hit.company.trim()
  return hit.company?.name?.trim() || hit.company?.display_name?.trim() || hit.companyName?.trim() || ''
}

function jobTitle(hit: HasdataJob) {
  return hit.title?.trim() || hit.jobTitle?.trim() || hit.positionName?.trim() || ''
}

function locationLabel(hit: HasdataJob) {
  if (typeof hit.location === 'string') return hit.location
  return hit.location?.formattedAddress || hit.location?.display_name || hit.location?.city || ''
}

function descriptionOf(hit: HasdataJob) {
  return hit.descriptionText || hit.description || hit.snippet || ''
}

function jobUrl(hit: HasdataJob) {
  return hit.url || hit.jobUrl || hit.link
}

function salaryOf(hit: HasdataJob) {
  if (typeof hit.salary === 'string') return salaryFromRange(undefined, undefined, hit.salary)
  return salaryFromRange(hit.salary?.min, hit.salary?.max, hit.salary?.text)
}

function jobId(hit: HasdataJob) {
  const fromUrl = jobUrl(hit)?.match(/jk=([a-z0-9]+)/i)?.[1]
  return hit.id || hit.jk || fromUrl || `${companyName(hit)}-${jobTitle(hit)}`.slice(0, 80)
}

const CITY_PROVINCE: Record<string, string> = {
  toronto: 'ON',
  vancouver: 'BC',
  montreal: 'QC',
  ottawa: 'ON',
  calgary: 'AB',
  waterloo: 'ON',
}

function indeedLocation(preferredCity?: string, metro?: string) {
  const city = preferredCity && preferredCity.toLowerCase() !== 'any city' ? preferredCity : metro
  if (!city) return 'Canada'
  if (city.toLowerCase() === 'remote') return 'Remote'
  const province = CITY_PROVINCE[city.toLowerCase()]
  const label = city[0].toUpperCase() + city.slice(1)
  return province ? `${label}, ${province}` : label
}

function hitsFrom(data: HasdataResponse) {
  return data.jobs ?? data.jobListings ?? data.listings ?? data.results ?? data.data?.jobs ?? []
}

function toJob(hit: HasdataJob): Job | null {
  if (hit.sponsored) return null
  const title = jobTitle(hit)
  const company = companyName(hit)
  if (!title || !company) return null
  const description = descriptionOf(hit)
  const { city, province } = cityFromLabel(locationLabel(hit))
  const applyUrl = jobUrl(hit)
  const employerUrl = applyUrl && isEmployerUrl(applyUrl) ? applyUrl : undefined
  return {
    id: `hasdata-${jobId(hit)}`,
    title,
    company,
    city,
    province,
    workStyle: inferWorkStyle(title, description, city),
    source: jobHref({ company, applyUrl: employerUrl }) && COMPANY_CAREERS[company] ? 'Company site' : 'Indeed',
    applyUrl: employerUrl ?? applyUrl,
    skills: skillsFrom(`${title} ${description}`),
    seniority: inferSeniority(title),
    salary: salaryOf(hit),
    postedDaysAgo: postedDaysFromSignals(hit.date, hit.postedAt, hit.isoDate, hit.datePublished),
    closesInDays: 14,
    applicants: 0,
    summary: cleanListingText(description || title, 1600),
  }
}

export async function searchHasdataIndeedJobs(
  lookingFor: string,
  preferredCity?: string,
  intent?: MatchIntent,
  start = 0,
  query?: string,
  options?: { maxDays?: number },
): Promise<{ jobs: Job[]; error?: string }> {
  const apiKey = process.env.HASDATA_API_KEY
  if (!apiKey) return { jobs: [], error: 'HasData key is missing.' }

  const keyword = query ?? searchTerms(lookingFor, intent)
  if (!keyword) return { jobs: [] }
  const location = resolveLocation(preferredCity, intent, lookingFor)
  const where = indeedLocation(preferredCity, location.cities[0])
  const domain = process.env.HASDATA_INDEED_DOMAIN || 'ca.indeed.com'
  const url = new URL('https://api.hasdata.com/scrape/indeed/listing')
  url.searchParams.set('keyword', keyword)
  url.searchParams.set('location', where)
  url.searchParams.set('sort', 'date')
  url.searchParams.set('domain', domain)
  if (start > 0) url.searchParams.set('start', String(start))

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      signal: AbortSignal.timeout(25_000),
    })
    if (!response.ok) {
      return { jobs: [], error: `HasData returned ${response.status}.` }
    }
    const data = (await response.json()) as HasdataResponse
    const jobs = hitsFrom(data)
      .map(toJob)
      .filter((job): job is Job => Boolean(job))
      .filter((job) => isRecentEnough(job, options?.maxDays) && listingFitsLocation(job, location) && listingMatchesQuery(job.title, intent))
    return { jobs }
  } catch {
    return { jobs: [], error: 'HasData request failed.' }
  }
}
