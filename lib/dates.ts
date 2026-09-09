export const TORONTO_TZ = 'America/Toronto'

export function todayKey(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: TORONTO_TZ })
}

function mondayOfCalendarDay(ymd: string) {
  const [year, month, day] = ymd.split('-').map(Number)
  const utc = Date.UTC(year, month - 1, day)
  const weekday = new Date(utc).getUTCDay()
  const daysFromMonday = (weekday + 6) % 7
  return new Date(utc - daysFromMonday * 86_400_000).toISOString().slice(0, 10)
}

export function weekKey(date = new Date()) {
  return mondayOfCalendarDay(todayKey(date))
}

export function inCurrentPeriod(seedDate?: string, date = new Date()) {
  if (!seedDate || !/^\d{4}-\d{2}-\d{2}$/.test(seedDate)) return false
  return mondayOfCalendarDay(seedDate) === weekKey(date)
}

export function formatMatchDate(iso?: string) {
  const date = iso ? new Date(iso) : new Date()
  return date.toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: TORONTO_TZ,
  })
}
