import { PLANS } from '@/lib/billing'
import { RATE, enforceRateLimit } from '@/lib/rate-limit'
import { templateJson } from '@/lib/server/template'

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'checkout', RATE.checkout)
  if (limited) return limited

  return templateJson({
    url: null,
    price: PLANS.founding.price,
    cadence: 'month',
    hint: 'Create a Stripe Checkout session for Founding Pro at $9/month. After webhook, rematch from the stored resume and send the user to /app/matches.',
  })
}
