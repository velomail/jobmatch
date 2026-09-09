import { PLANS, type PlanId } from '@/lib/billing'
import { inCurrentPeriod } from '@/lib/dates'
import type { MatchIntent } from '@/lib/intent'
import { isLiveMatchRun, runMatch, runNeedsQualityRefresh, type MatchRun } from '@/lib/match'
import { jobSeenKeys } from '@/lib/listing-quality'
import { runMissesRequestedLocation } from '@/lib/location'
import type { ParsedResume } from '@/lib/resume'

const KEY = 'jobmatch.v2'

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer'

export type Application = {
  jobId: string
  status: ApplicationStatus
  at: string
}

export type UserState = {
  email: string
  plan: PlanId
  foundingLocked: boolean
  createdAt: string
  onboardingSeen: boolean
  notifyAsked: boolean
  notifyGranted: boolean
  resume?: ParsedResume
  preferredCity?: string
  lookingFor?: string
  intent?: MatchIntent
  lastRun?: MatchRun
  seenJobKeys?: string[]
  applications: Application[]
  waitlist: boolean
}

const emptyState = (): UserState => ({
  email: '',
  plan: 'free',
  foundingLocked: false,
  createdAt: '0',
  onboardingSeen: false,
  notifyAsked: false,
  notifyGranted: false,
  seenJobKeys: [],
  applications: [],
  waitlist: false,
})

export function loadState(): UserState {
  if (typeof window === 'undefined') return emptyState()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return emptyState()
    return { ...emptyState(), ...JSON.parse(raw) } as UserState
  } catch {
    return emptyState()
  }
}

export function saveState(next: UserState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('jobmatch-state'))
}

export function isPro(state: UserState) {
  return state.plan === 'founding'
}

export function hasUsedFreeList(state: UserState) {
  return !isPro(state) && isLiveMatchRun(state.lastRun)
}

export function isListStale(state: UserState) {
  return !isPro(state) && isLiveMatchRun(state.lastRun) && !inCurrentPeriod(state.lastRun!.seedDate)
}

export function canRunMatch(state: UserState) {
  return isPro(state) || !isLiveMatchRun(state.lastRun)
}

export function lookingForText(state: UserState) {
  return state.lookingFor?.trim() || state.intent?.summary?.trim() || ''
}

export function needsLiveRefresh(state: UserState) {
  if (!state.resume || !lookingForText(state)) return false
  if (!isLiveMatchRun(state.lastRun)) return true
  if (runNeedsQualityRefresh(state.lastRun)) return true
  if (!state.lastRun?.matches.length) {
    return !inCurrentPeriod(state.lastRun.seedDate)
  }
  if (runMissesRequestedLocation(state.lastRun.matches, state.preferredCity, state.intent, lookingForText(state))) {
    return true
  }
  return isPro(state) && !inCurrentPeriod(state.lastRun.seedDate)
}

export function updateState(patch: Partial<UserState>) {
  const current = loadState()
  const next = {
    ...current,
    ...patch,
    createdAt: current.createdAt === '0' ? new Date().toISOString() : current.createdAt,
  }
  saveState(next)
  return next
}

export function markApplied(jobId: string, status: ApplicationStatus = 'applied') {
  const state = loadState()
  const rest = state.applications.filter((item) => item.jobId !== jobId)
  return updateState({
    applications: [...rest, { jobId, status, at: new Date().toISOString() }],
  })
}

export function activateFounding(email: string) {
  return updateState({
    email: email || loadState().email,
    plan: 'founding',
    foundingLocked: true,
    waitlist: true,
  })
}

export function rememberShownJobs(run?: MatchRun) {
  if (!run?.matches.length) return loadState()
  const current = loadState()
  const seenJobKeys = [...new Set([...(current.seenJobKeys ?? []), ...run.matches.flatMap(jobSeenKeys)])].slice(-80)
  return updateState({ seenJobKeys })
}

export { isLiveMatchRun }

export function rematchFromSavedResume() {
  const state = loadState()
  if (!state.resume) return state
  const lastRun = runMatch(state.resume, state.preferredCity, state.intent, undefined, state.seenJobKeys)
  updateState({ lastRun })
  return rememberShownJobs(lastRun)
}

export function unlockTodayAndRematch() {
  const current = loadState()
  activateFounding(current.email || 'founding@jobmatch.ca')
  return rematchFromSavedResume()
}

export function refreshProListIfNeeded() {
  const state = loadState()
  if (!isPro(state) || !state.resume) return state
  if (inCurrentPeriod(state.lastRun?.seedDate) && isLiveMatchRun(state.lastRun)) return state
  if (state.lookingFor) return state
  return rematchFromSavedResume()
}

export function saveResumeWithoutExtraFreeRun(
  resume: ParsedResume,
  preferredCity?: string,
  lookingFor?: string,
  intent?: MatchIntent,
  run?: MatchRun,
) {
  const current = loadState()
  updateState({ resume, preferredCity, lookingFor, intent })
  if (run) {
    updateState({ lastRun: run })
    return rememberShownJobs(run)
  }
  if (canRunMatch(current)) {
    const generated = runMatch(resume, preferredCity, intent, undefined, current.seenJobKeys)
    updateState({ lastRun: generated })
    return rememberShownJobs(generated)
  }
  return loadState()
}

export function markListYesterday() {
  const state = loadState()
  if (!state.lastRun) return state
  return updateState({
    lastRun: { ...state.lastRun, seedDate: '2000-01-01' },
  })
}

export function nextAppPath(state: UserState = loadState()) {
  if (!state.onboardingSeen) return '/app/welcome'
  if (!state.email) return '/app/auth'
  if (!state.resume) return '/app/resume'
  if (!state.notifyAsked) return '/app/notify'
  return '/app/matches'
}

export function planLabel(state: UserState) {
  return isPro(state)
    ? `${PLANS.founding.name} · $${PLANS.founding.price}/month locked`
    : 'One free list'
}

export function signOut() {
  const cleared = emptyState()
  saveState(cleared)
  return cleared
}
