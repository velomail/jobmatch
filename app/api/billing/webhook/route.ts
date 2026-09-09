import { templateJson } from '@/lib/server/template'

export async function POST() {
  return templateJson({
    hint: 'Verify Stripe signature. On checkout.session.completed set users.plan = founding, founding_locked, stripe_customer_id.',
  })
}
