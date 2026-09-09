import 'server-only'

import { searchAdzunaJobs } from '@/lib/adzuna'
import { searchHasdataIndeedJobs } from '@/lib/hasdata'
import type { Job } from '@/lib/jobs'
import type { MatchIntent } from '@/lib/intent'
import { searchQueries } from '@/lib/listing-map'
import { qualityFilter } from '@/lib/listing-quality'
import { listingFitsLocation, resolveLocation } from '@/lib/location'

export function mergeJobInventories(groups: Job[][]) {
  return qualityFilter(groups.flat())
}

export async function searchLiveJobs(
  lookingFor: string,
  preferredCity?: string,
  intent?: MatchIntent,
  excludeKeys: string[] = [],
): Promise<{ jobs: Job[]; listings: 'live' | 'catalog'; listingCount: number; listingError?: string }> {
  const location = resolveLocation(preferredCity, intent, lookingFor)
  const queries = searchQueries(lookingFor, intent).slice(0, 2)
  const results = await Promise.all(
    queries.flatMap((query, index) => [
      searchAdzunaJobs(lookingFor, preferredCity, intent, index === 0 ? 2 : 1, query),
      searchHasdataIndeedJobs(lookingFor, preferredCity, intent, 0, query),
    ]),
  )
  let jobs = qualityFilter(
    results.flatMap((result) => result.jobs).filter((job) => listingFitsLocation(job, location)),
    intent,
    excludeKeys,
  )

  if (jobs.length < 10 && queries[0]) {
    const fillQuery = queries[queries.length - 1] || queries[0]
    const fill = await Promise.all([
      searchAdzunaJobs(lookingFor, preferredCity, intent, 2, fillQuery, { maxDays: 14, distance: 80 }),
      searchHasdataIndeedJobs(lookingFor, preferredCity, intent, 10, fillQuery, { maxDays: 14 }),
    ])
    results.push(...fill)
    jobs = qualityFilter(
      [...jobs, ...fill.flatMap((result) => result.jobs)].filter((job) => listingFitsLocation(job, location)),
      intent,
      [],
    )
  }

  const errors = results.map((result) => result.error).filter(Boolean)
  return {
    jobs,
    listings: jobs.length || location.cities.length ? 'live' : 'catalog',
    listingCount: jobs.length,
    listingError: errors.length ? errors.join(' ') : undefined,
  }
}
