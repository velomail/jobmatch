import { templateJson } from '@/lib/server/template'

const emails = new Set<string>()

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { email?: string }
  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return templateJson({ error: 'A valid email is required.' }, 400)
  }
  emails.add(email)
  return templateJson({
    ok: true,
    count: emails.size,
    hint: 'Swap this in-memory set for the waitlist table + Resend when DATABASE_URL is set.',
  })
}
