import { templateJson } from '@/lib/server/template'

export async function GET() {
  return templateJson({
    run: null,
    hint: 'GET today’s match_run for the signed-in user (Toronto seed_date). Client reads localStorage until Clerk is wired.',
  })
}
