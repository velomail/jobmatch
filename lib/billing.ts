export const DAILY_MATCH_LIMIT = 10

export const PLANS = {
  free: {
    id: 'free' as const,
    name: 'One list',
    price: 0,
    cadence: 'once',
    headline: 'Prove the ranking is honest.',
    blurb: 'One ranked Top 10 from your resume. Enough to see if JobMatch is worth a month.',
  },
  founding: {
    id: 'founding' as const,
    name: 'Founding Pro',
    price: 9,
    compareAt: 19,
    annualPrice: 79,
    annualCompareAt: 228,
    cadence: 'month',
    lockCopy: 'Lock $9/month forever. Regular price is $19/month after founding seats fill.',
    headline: 'A new Top 10 every week.',
    blurb: '$9/month. Open the app — this week’s 10 are already there.',
  },
} as const

export type PlanId = keyof typeof PLANS

export const FOUNDING_SEATS = 500
export const FOUNDING_SEATS_TAKEN = 312

export const UNLOCK_TODAY_CTA = 'Unlock this week’s 10 — $9/month'

export function foundingSeatsLeft() {
  return FOUNDING_SEATS - FOUNDING_SEATS_TAKEN
}

export function yearlySavings() {
  return PLANS.founding.annualCompareAt - PLANS.founding.annualPrice
}

export function monthlySavings() {
  return PLANS.founding.compareAt - PLANS.founding.price
}

export const PRO_FEATURES = [
  {
    id: 'weekly',
    name: 'A new Top 10 every week',
    need: 'Free is one list. Fresh roles take a week to pile up. Pro writes this week’s 10 from the resume you already uploaded.',
  },
  {
    id: 'zero-work',
    name: 'Open the app. It’s there.',
    need: 'No second onboarding. No re-upload. Paying unlocks this week, then every later week is automatic.',
  },
  {
    id: 'same-boards',
    name: 'Same boards you already trust',
    need: 'LinkedIn, Indeed, and company sites — ranked, not another feed. The platform name stays on every row.',
  },
  {
    id: 'tracker',
    name: 'Results tracker',
    need: 'Saved, applied, interview, offer — so the shortlist becomes a week of work, not a screenshot.',
  },
] as const
