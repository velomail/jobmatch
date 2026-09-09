import { templateJson } from '@/lib/server/template'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return templateJson({
    id,
    hint: 'Return one ranked job plus match facts (skills, gaps, source, applicants). No generated brief.',
  })
}
