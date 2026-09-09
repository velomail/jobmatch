import type { MatchIntent } from '@/lib/intent'
import type { Job } from '@/lib/jobs'

const METRO: Record<string, string[]> = {
  toronto: [
    'toronto', 'north york', 'scarborough', 'etobicoke', 'east york', 'york', 'downtown toronto',
  ],
  vancouver: [
    'vancouver', 'burnaby', 'richmond', 'north vancouver', 'west vancouver', 'surrey',
    'new westminster', 'coquitlam', 'delta',
  ],
  montreal: ['montreal', 'montréal', 'laval', 'longueuil', 'westmount', 'brossard'],
  ottawa: ['ottawa', 'gatineau', 'kanata', 'nepean', 'orleans', 'orléans', 'kanata north'],
  calgary: ['calgary', 'airdrie', 'okotoks'],
  waterloo: ['waterloo', 'kitchener', 'cambridge', 'kw'],
}

const NOT_CITIES = new Set(['canada', 'remote', 'anywhere', 'nationwide', 'hybrid', 'on-site', 'onsite'])

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function keyOf(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function metroOf(name: string) {
  const key = keyOf(name)
  if (!key || NOT_CITIES.has(key)) return null
  for (const [metro, aliases] of Object.entries(METRO)) {
    if (key === metro || aliases.includes(key)) return metro
    if (key.startsWith(`${metro} `) || key.endsWith(` ${metro}`)) return metro
  }
  return null
}

export function extractCitiesFromText(text: string) {
  const hay = keyOf(text)
  if (!hay) return []
  const found: string[] = []
  for (const [metro, aliases] of Object.entries(METRO)) {
    const names = [metro, ...aliases]
    if (names.some((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`).test(hay))) {
      found.push(metro[0].toUpperCase() + metro.slice(1))
    }
  }
  return found
}

export function wantsRemote(lookingFor?: string, preferredCity?: string, intent?: MatchIntent) {
  if (preferredCity?.trim().toLowerCase() === 'remote') return true
  if (intent?.workStyles.includes('Remote')) {
    const note = `${lookingFor ?? ''} ${intent.summary}`.toLowerCase()
    if (/\bremote\b/.test(note) || preferredCity?.trim().toLowerCase() === 'remote') return true
  }
  return /\bremote\b/i.test(lookingFor ?? '')
}

export type LocationFilter = {
  cities: string[]
  allowRemote: boolean
}

export function resolveLocation(
  preferredCity?: string,
  intent?: MatchIntent,
  lookingFor?: string,
): LocationFilter {
  const allowRemote = wantsRemote(lookingFor, preferredCity, intent)
  const names = [
    ...(preferredCity && preferredCity.toLowerCase() !== 'any city' && preferredCity.toLowerCase() !== 'remote'
      ? [preferredCity]
      : []),
    ...(intent?.cities ?? []),
    ...extractCitiesFromText(lookingFor ?? ''),
  ]
  const metros = Array.from(
    new Set(names.map(metroOf).filter((metro): metro is string => Boolean(metro) && !NOT_CITIES.has(metro))),
  )
  return { cities: metros, allowRemote }
}

export function listingFitsLocation(job: Pick<Job, 'city' | 'workStyle' | 'summary'>, location: LocationFilter) {
  if (!location.cities.length) return true
  if (!location.allowRemote && job.workStyle === 'Remote') return false
  const jobMetro = metroOf(job.city)
  if (jobMetro && location.cities.includes(jobMetro)) return true
  if (location.allowRemote && job.workStyle === 'Remote') return true
  return false
}

export function applyLocationToIntent(
  intent: MatchIntent,
  preferredCity?: string,
  lookingFor?: string,
): MatchIntent {
  const location = resolveLocation(preferredCity, intent, lookingFor)
  const workStyles = location.allowRemote
    ? intent.workStyles
    : intent.workStyles.filter((style) => style !== 'Remote')
  return {
    ...intent,
    cities: location.cities.map((metro) => metro[0].toUpperCase() + metro.slice(1)),
    workStyles: preferredCity?.toLowerCase() === 'remote' && !workStyles.includes('Remote')
      ? [...workStyles, 'Remote']
      : workStyles,
  }
}

export function runMissesRequestedLocation(
  matches: Pick<Job, 'city' | 'workStyle' | 'summary'>[],
  preferredCity?: string,
  intent?: MatchIntent,
  lookingFor?: string,
) {
  const location = resolveLocation(preferredCity, intent, lookingFor)
  if (!location.cities.length) return false
  return matches.some((job) => !listingFitsLocation(job, location))
}
