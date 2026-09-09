import 'server-only'

export type RateRule = {
  limit: number
  windowSec: number
}

export const RATE = {
  matches: { limit: 8, windowSec: 10 * 60 },
  briefs: { limit: 12, windowSec: 10 * 60 },
  resume: { limit: 20, windowSec: 10 * 60 },
  waitlist: { limit: 8, windowSec: 60 * 60 },
  push: { limit: 30, windowSec: 60 * 60 },
  vapid: { limit: 60, windowSec: 60 },
  applications: { limit: 40, windowSec: 10 * 60 },
  checkout: { limit: 12, windowSec: 10 * 60 },
  read: { limit: 60, windowSec: 60 },
} as const

type Hit = {
  ok: boolean
  remaining: number
  retryAfter: number
}

const memory = new Map<string, { count: number; resetAt: number }>()

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const real = request.headers.get('x-real-ip')?.trim()
  const vercel = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || real || vercel || 'local'
}

function memoryHit(key: string, rule: RateRule): Hit {
  const now = Date.now()
  const current = memory.get(key)
  if (!current || current.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + rule.windowSec * 1000 })
    if (memory.size > 4000) {
      for (const [item, value] of memory) {
        if (value.resetAt <= now) memory.delete(item)
      }
    }
    return { ok: true, remaining: rule.limit - 1, retryAfter: rule.windowSec }
  }
  current.count += 1
  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
  if (current.count > rule.limit) {
    return { ok: false, remaining: 0, retryAfter }
  }
  return { ok: true, remaining: rule.limit - current.count, retryAfter }
}

async function upstashHit(key: string, rule: RateRule): Promise<Hit | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, rule.windowSec, 'NX'],
      ['TTL', key],
    ]),
    cache: 'no-store',
  })
  if (!response.ok) return null

  const rows = (await response.json()) as { result?: number }[]
  const count = Number(rows[0]?.result ?? 0)
  const ttl = Number(rows[2]?.result ?? rule.windowSec)
  const retryAfter = ttl > 0 ? ttl : rule.windowSec
  if (count > rule.limit) {
    return { ok: false, remaining: 0, retryAfter }
  }
  return { ok: true, remaining: Math.max(0, rule.limit - count), retryAfter }
}

export async function enforceRateLimit(request: Request, name: string, rule: RateRule) {
  const key = `rl:${name}:${clientIp(request)}`
  const remote = await upstashHit(key, rule).catch(() => null)
  const hit = remote ?? memoryHit(key, rule)
  if (hit.ok) return null

  return Response.json(
    { error: 'Too many requests. Wait a minute and try again.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(hit.retryAfter),
        'X-RateLimit-Limit': String(rule.limit),
        'X-RateLimit-Remaining': '0',
      },
    },
  )
}
