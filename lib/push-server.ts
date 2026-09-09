import 'server-only'

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import webpush from 'web-push'

type PushSubscriptionJSON = {
  endpoint: string
  keys?: { p256dh?: string; auth?: string }
}

function storePath() {
  if (process.env.VERCEL) return '/tmp/jobmatch-push.json'
  return path.join(process.cwd(), '.data', 'push-subscriptions.json')
}

async function readSubscriptions() {
  try {
    const raw = await readFile(storePath(), 'utf8')
    const parsed = JSON.parse(raw) as PushSubscriptionJSON[]
    return Array.isArray(parsed) ? parsed.filter((item) => item.endpoint) : []
  } catch {
    return []
  }
}

async function writeSubscriptions(items: PushSubscriptionJSON[]) {
  const file = storePath()
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(items, null, 2))
}

export async function savePushSubscription(subscription?: PushSubscriptionJSON | null) {
  if (!subscription?.endpoint) return
  const current = await readSubscriptions()
  const next = current.filter((item) => item.endpoint !== subscription.endpoint)
  next.push({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys?.p256dh,
      auth: subscription.keys?.auth,
    },
  })
  await writeSubscriptions(next.slice(-200))
}

export async function sendWeeklyPush(count?: number) {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return { sent: 0, error: 'VAPID keys are missing.' }

  webpush.setVapidDetails('mailto:hello@jobmatch.ca', publicKey, privateKey)
  const payload = JSON.stringify({
    title: 'JobMatch',
    body: count ? `${count} new roles this week. Newest first.` : 'This week’s 10 are ready. Newest first.',
    url: '/app/matches',
  })

  const subscriptions = await readSubscriptions()
  let sent = 0
  const kept: PushSubscriptionJSON[] = []
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys?.p256dh || '',
            auth: subscription.keys?.auth || '',
          },
        },
        payload,
      )
      sent += 1
      kept.push(subscription)
    } catch (error) {
      const status = Number((error as { statusCode?: number }).statusCode)
      if (status !== 404 && status !== 410) kept.push(subscription)
    }
  }
  await writeSubscriptions(kept)
  return { sent }
}
