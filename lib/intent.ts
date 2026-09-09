import type { Seniority, WorkStyle } from '@/lib/jobs'
import { extractCitiesFromText } from '@/lib/location'

export type MatchIntent = {
  titles: string[]
  skills: string[]
  seniority: Seniority | null
  workStyles: WorkStyle[]
  cities: string[]
  dealBreakers: string[]
  summary: string
}

export function emptyIntent(): MatchIntent {
  return {
    titles: [],
    skills: [],
    seniority: null,
    workStyles: [],
    cities: [],
    dealBreakers: [],
    summary: '',
  }
}

export function fallbackIntent(lookingFor: string): MatchIntent {
  const text = lookingFor.toLowerCase()
  const workStyles: WorkStyle[] = []
  if (/\bremote\b/.test(text)) workStyles.push('Remote')
  if (/\bhybrid\b/.test(text)) workStyles.push('Hybrid')
  if (/\bon-?site\b/.test(text)) workStyles.push('On-site')

  let seniority: MatchIntent['seniority'] = null
  if (/\b(intern|junior|jr|new grad)\b/.test(text)) seniority = 'junior'
  if (/\b(senior|sr\.?|staff)\b/.test(text)) seniority = 'senior'
  if (/\b(lead|director|head of|principal)\b/.test(text)) seniority = 'lead'
  if (!seniority && /\bmid\b/.test(text)) seniority = 'mid'

  const dealBreakers: string[] = []
  if (/\bno\s+(staffing|agenc|recruit)/.test(text) || /\bstaffing firms?\b/.test(text)) {
    dealBreakers.push('staffing', 'agency', 'recruiter')
  }

  const titles = lookingFor
    .split(/[,.]/)
    .map((part) =>
      part
        .replace(/\bno\s+.+$/i, '')
        .replace(
          /\b(i(?:'m| am)?|looking for|want(?:ing)?|seeking|my|a|an|the|next|step|role|roles|job|jobs|position|hybrid|remote)\b/gi,
          ' ',
        )
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((part) => part.length > 2 && part.split(' ').length <= 6)
    .slice(0, 3)

  return {
    titles,
    skills: [],
    seniority,
    workStyles,
    cities: extractCitiesFromText(lookingFor),
    dealBreakers,
    summary: lookingFor.trim(),
  }
}
