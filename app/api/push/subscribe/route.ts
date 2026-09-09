import { savePushSubscription } from '@/lib/push-server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    granted?: boolean
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  }
  if (body.granted && body.subscription?.endpoint) {
    await savePushSubscription(body.subscription)
  }
  return Response.json({ ok: true })
}
