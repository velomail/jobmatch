import type { Seniority, WorkStyle } from '@/lib/jobs'
import type { MatchIntent } from '@/lib/intent'
import { metroOf } from '@/lib/location'
import { KNOWN_SKILLS } from '@/lib/resume'

const QUERY_FLUFF =
  /\b(i(?:'m| am)?|looking for|want(?:ing)?|seeking|interested in|please|find|me|my|a|an|the|next|step|role|roles|job|jobs|position|hybrid|remote|onsite|on-site|full-time|part-time|in)\b/gi

export function cleanSearchQuery(text: string) {
  const stripped = text
    .replace(/\bno\s+[^,.]+/gi, ' ')
    .replace(/\bin\s+[A-Za-z][A-Za-z\s-]+$/i, ' ')
    .replace(QUERY_FLUFF, ' ')
    .replace(/[^a-zA-Z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped
    .split(' ')
    .filter((word) => word.length > 1)
    .slice(0, 5)
    .join(' ')
}

const FAMILY_SEARCH: { pattern: RegExp; query: string }[] = [
  { pattern: /\b(sales|sdr|bdr|account executive|account manager|business development)\b/i, query: 'sales' },
  { pattern: /\b(software engineer|engineer|developer|frontend|backend|full[- ]?stack)\b/i, query: 'software engineer' },
  { pattern: /\b(product designer|designer|ux|ui)\b/i, query: 'product designer' },
  { pattern: /\b(product manager|product owner|product management)\b/i, query: 'product manager' },
  { pattern: /\b(marketing|growth|seo|brand manager)\b/i, query: 'marketing' },
  { pattern: /\b(data scientist|data analyst|data engineer|machine learning)\b/i, query: 'data analyst' },
  { pattern: /\b(finance|financial analyst|accountant|controller)\b/i, query: 'financial analyst' },
  { pattern: /\b(nurse|nursing|rn)\b/i, query: 'nurse' },
  { pattern: /\b(customer success|csm|onboarding specialist)\b/i, query: 'customer success' },
]

function familySearchQuery(lookingFor: string, intent?: MatchIntent) {
  const hay = `${intent?.titles.join(' ') ?? ''} ${intent?.summary ?? ''} ${lookingFor}`
  return FAMILY_SEARCH.find((family) => family.pattern.test(hay))?.query
}

function pushQuery(unique: string[], query: string) {
  const cleaned = cleanSearchQuery(query) || query.trim()
  if (cleaned.length < 2) return
  if (unique.some((existing) => existing.toLowerCase() === cleaned.toLowerCase())) return
  unique.push(cleaned)
}

export function searchQueries(lookingFor: string, intent?: MatchIntent) {
  const unique: string[] = []
  for (const title of intent?.titles ?? []) {
    pushQuery(unique, title)
    if (unique.length >= 3) break
  }
  if (!unique.length) {
    const fromNote = cleanSearchQuery(lookingFor.split(/[.,]/)[0] || lookingFor)
    if (fromNote) unique.push(fromNote)
  }
  const family = familySearchQuery(lookingFor, intent)
  if (family) pushQuery(unique, family)
  if (!unique.length && intent?.skills.length) unique.push(intent.skills.slice(0, 3).join(' '))
  if (!unique.length && lookingFor.trim()) unique.push(lookingFor.trim())
  return unique.slice(0, 3)
}

export function searchTerms(lookingFor: string, intent?: MatchIntent) {
  return searchQueries(lookingFor, intent)[0] || lookingFor
}

export function inferWorkStyle(title: string, description: string, city: string): WorkStyle {
  const titleHay = title.toLowerCase()
  const hay = `${title} ${description}`.toLowerCase()
  if (/\bhybrid\b/.test(hay)) return 'Hybrid'
  const placed = Boolean(metroOf(city))
  if (/\bremote\b/.test(titleHay)) return 'Remote'
  if (/\bremote\b/.test(hay) && !placed) return 'Remote'
  return 'On-site'
}

export function inferSeniority(title: string): Seniority {
  if (/\b(intern|junior|jr|new grad|entry)\b/i.test(title)) return 'junior'
  if (/\b(lead|principal|director|head)\b/i.test(title)) return 'lead'
  if (/\b(senior|sr\.?|staff)\b/i.test(title)) return 'senior'
  return 'mid'
}

export function skillsFrom(text: string) {
  const hay = ` ${text.toLowerCase().replace(/[^a-z0-9+.#/\s-]/g, ' ').replace(/\s+/g, ' ')} `
  return KNOWN_SKILLS.filter((skill) => {
    const needle = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|\\s)${needle}(s)?(\\s|$)`, 'i').test(hay)
  }).slice(0, 8)
}

export function parsePostedAge(value?: string) {
  if (!value?.trim()) return null
  const text = value.trim().toLowerCase()
  if (/today|just posted|hour/.test(text)) return 0
  if (/yesterday/.test(text)) return 1
  const relative = text.match(/(\d+)\+?\s*(day|week|month)s?/)
  if (relative) {
    const amount = Number(relative[1])
    if (relative[2] === 'week') return Math.min(60, amount * 7)
    if (relative[2] === 'month') return Math.min(60, amount * 30)
    return Math.min(60, amount)
  }
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) return null
  return Math.max(0, Math.min(60, Math.round((Date.now() - then) / 86_400_000)))
}

export function daysAgoFromDate(value?: string) {
  return parsePostedAge(value) ?? 2
}

export function postedDaysFromSignals(...values: (string | undefined)[]) {
  const ages = values.map(parsePostedAge).filter((age): age is number => age != null)
  if (!ages.length) return 7
  return Math.max(...ages)
}

export function salaryFromRange(min?: number, max?: number, label?: string) {
  if (label?.trim()) return label.trim()
  if (min && max) return `$${Math.round(min / 1000)}k–$${Math.round(max / 1000)}k`
  if (min) return `From $${Math.round(min / 1000)}k`
  return ''
}

export function cityFromLabel(value?: string) {
  const display = value?.trim() ?? ''
  const city = display.split(',')[0]?.trim() || 'Remote'
  const province = display.split(',')[1]?.trim() ?? ''
  return { city, province }
}
