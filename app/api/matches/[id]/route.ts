import { RATE, enforceRateLimit } from '@/lib/rate-limit'
import { templateJson } from '@/lib/server/template'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = await enforceRateLimit(request, 'match-id', RATE.read)
  if (limited) return limited

  const { id } = await context.params
  return templateJson({
    id,
    hint: 'Return one ranked job plus match facts (skills, gaps, source, applicants). No generated brief.',
  })
}
