import { RATE, enforceRateLimit } from '@/lib/rate-limit'
import { templateJson } from '@/lib/server/template'

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request, 'matches-today', RATE.read)
  if (limited) return limited

  return templateJson({
    run: null,
    hint: 'GET today’s match_run for the signed-in user (Toronto seed_date). Client reads localStorage until Clerk is wired.',
  })
}
