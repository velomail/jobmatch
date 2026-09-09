import type { Job, WorkStyle } from '@/lib/jobs'

export type ListingTime = Pick<Job, 'postedDaysAgo' | 'closesInDays' | 'title' | 'company' | 'city' | 'workStyle'> & {
  score?: number
}

export function postedInEnglish(daysAgo: number) {
  if (daysAgo <= 0) return 'Posted today'
  if (daysAgo === 1) return 'Posted yesterday'
  if (daysAgo < 7) return `Posted ${daysAgo} days ago`
  const weeks = Math.max(1, Math.round(daysAgo / 7))
  return weeks === 1 ? 'Posted last week' : `Posted ${weeks} weeks ago`
}

export function closesInEnglish(days: number) {
  if (days <= 2) return 'Apply today — this role is cooling off'
  if (days <= 5) return 'Still open this week'
  return 'Still open if you want this next role'
}

export function workDesire(workStyle: WorkStyle, city: string) {
  if (workStyle === 'Remote') return `remote work in Canada, based around ${city}`
  if (workStyle === 'Hybrid') return `hybrid work in ${city}`
  return `on-site work in ${city}`
}

export function listingHeadline(job: Pick<Job, 'company' | 'title' | 'city' | 'workStyle'>) {
  return `${job.company} is hiring a ${job.title} for ${workDesire(job.workStyle, job.city)}.`
}

export function listingDesire(score?: number) {
  if (score == null) return 'A role worth your time, matched to your resume.'
  if (score >= 86) return `A strong match for your resume (${score}% fit) — worth your time.`
  if (score >= 70) return `This job matches your resume (${score}% fit). Worth a look today.`
  return `A stretch role for your resume (${score}% fit) if you want the next step.`
}

export type ListingFit = {
  score?: number
  matchedSkills?: string[]
  missingSkills?: string[]
}

function joinEnglish(items: string[]) {
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function aOrAnPercent(score: number) {
  return score >= 80 && score < 90 ? 'an' : 'a'
}

export function listingFitReason(job: ListingFit) {
  const score = job.score
  const matched = [...new Set((job.matchedSkills ?? []).map((skill) => skill.trim()).filter(Boolean))].slice(0, 3)
  const missing = [...new Set((job.missingSkills ?? []).map((skill) => skill.trim()).filter(Boolean))].slice(0, 3)

  if (score == null) {
    return 'This listing is on your list because it lined up with your resume and what you asked for next.'
  }

  const article = aOrAnPercent(score)
  const band =
    score >= 86
      ? `This is ${article} ${score}% fit — a strong match for your resume.`
      : score >= 70
        ? `This is ${article} ${score}% fit. Enough of your resume lines up that it is worth a look.`
        : `This is ${article} ${score}% fit — a stretch, not a lock.`

  if (!matched.length && !missing.length) {
    const why =
      score >= 86
        ? 'The title, seniority, and location lined up with what you asked for, which is why the percentage is high even without a long skills list.'
        : score >= 70
          ? 'The score comes from the title and location matching what you asked for, not from a long skills overlap.'
          : 'Your resume and this listing barely share named skills. It made the list because the title and city still matched what you asked for, which is why the percentage stays in stretch range.'
    return `${band} ${why}`
  }

  const overlap = matched.length
    ? `Your resume already shows ${joinEnglish(matched)}.`
    : 'The title, city, and seniority lined up more than named skills on your resume.'

  const gap = missing.length
    ? `The listing also asks for ${joinEnglish(missing)}, which is why the percentage is not higher.`
    : 'Almost nothing the listing asks for is missing from your resume, which keeps the percentage up.'

  return `${band} ${overlap} ${gap}`
}

export function listingStory(job: ListingTime) {
  return `${postedInEnglish(job.postedDaysAgo)}. ${listingHeadline(job)} ${listingDesire(job.score)} ${closesInEnglish(job.closesInDays)}.`
}

export function cleanListingText(html: string, max = 1600) {
  const cleaned = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return completeSentences(cleaned, max)
}

export function completeSentences(text: string, max = 420) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  if (cleaned.length <= max && /[.!?]"?$/.test(cleaned)) return cleaned
  const slice = cleaned.slice(0, Math.max(max, 80))
  const stop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('! '), slice.lastIndexOf('? '), slice.lastIndexOf('."'))
  if (stop > 48) return slice.slice(0, stop + 1).trim()
  const word = slice.replace(/[,:;–—-]\s+\S*$/, '').replace(/\s+\S+$/, '').trim()
  return word ? `${word}.` : `${slice.trim()}.`
}

export function looksTruncated(text?: string) {
  const cleaned = text?.replace(/\s+/g, ' ').trim() ?? ''
  if (!cleaned) return true
  if (/^(location|compensation|schedule|job summary|responsible for)\b/i.test(cleaned)) return true
  if (!/[.!?]"?$/.test(cleaned)) return true
  if (/[&/]|scope:$/i.test(cleaned.slice(-12))) return true
  return false
}

export function byNewestPosted<T extends Pick<Job, 'postedDaysAgo' | 'closesInDays'>>(jobs: T[]) {
  return [...jobs].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo || a.closesInDays - b.closesInDays)
}
