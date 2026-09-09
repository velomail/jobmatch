import { RATE, enforceRateLimit } from '@/lib/rate-limit'
import { templateJson } from '@/lib/server/template'

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'applications', RATE.applications)
  if (limited) return limited

  const body = await request.json().catch(() => ({}))
  return templateJson({
    accepted: body,
    hint: 'Persist saved / applied / interview / offer on the applications table.',
  })
}

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, 'applications-read', RATE.read)
  if (limited) return limited

  return templateJson({
    items: [],
    hint: 'List applications for the signed-in user.',
  })
}
