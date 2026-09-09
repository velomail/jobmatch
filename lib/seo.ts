export const SITE_NAME = 'JobMatch'
export const SITE_PARENT = 'RadarAI'
export const SITE_TAGLINE = 'Stop searching. Start matching.'
export const SITE_DESCRIPTION =
  'JobMatch finds jobs for your resume — newest company listings first, in plain English. Remote jobs in Canada, hybrid work in Toronto, and roles worth your time every week.'

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jobmatch.ca'
}

export const DEFAULT_KEYWORDS = [
  'JobMatch',
  'jobs for my resume',
  'jobs that match my resume',
  'jobs worth my time',
  'best jobs for my resume',
  'apply today',
  'next role',
  'remote jobs Canada',
  'hybrid jobs Toronto',
  'company careers Canada',
  'Canada job matcher',
  'resume job matching',
  'weekly job matches',
  'personalized job recommendations',
  'Toronto jobs for my resume',
  'stop scrolling job boards',
  'Indeed alternative Canada',
  'LinkedIn job search alternative',
  'Canada-first job search',
  'founding member job search app',
]

export function pageTitle(title?: string) {
  return title ? `${title} — JobMatch` : `JobMatch — ${SITE_TAGLINE}`
}

export function absoluteUrl(path = '/') {
  return new URL(path, getSiteUrl()).toString()
}
