import { RATE, enforceRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, 'vapid', RATE.vapid)
  if (limited) return limited

  return Response.json({
    publicKey: process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  })
}
