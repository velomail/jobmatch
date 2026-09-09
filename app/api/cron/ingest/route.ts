import { searchLiveJobs } from '@/lib/inventory'
import { sendWeeklyPush } from '@/lib/push-server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  const allowed = secret ? auth === `Bearer ${secret}` : !process.env.VERCEL
  if (!allowed) {
    return Response.json({ error: 'Unauthorized cron request.' }, { status: 401 })
  }

  const queries = ['account executive', 'software engineer', 'product designer', 'marketing manager']
  let pulled = 0
  const errors: string[] = []

  for (const query of queries) {
    const result = await searchLiveJobs(query)
    pulled += result.jobs.length
    if (result.listingError) errors.push(result.listingError)
  }

  const push = await sendWeeklyPush(10).catch((error: Error) => ({ sent: 0, error: error.message }))

  return Response.json({
    pulled,
    queries: queries.length,
    errors,
    push,
    hint: 'Weekly scrape from Adzuna and HasData. Push pings phones when this week’s list is ready. Apply links stay on employer career pages.',
  })
}
