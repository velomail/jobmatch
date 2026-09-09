import { templateJson } from '@/lib/server/template'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return templateJson({
    accepted: body,
    hint: 'Persist saved / applied / interview / offer on the applications table.',
  })
}

export async function GET() {
  return templateJson({
    items: [],
    hint: 'List applications for the signed-in user.',
  })
}
