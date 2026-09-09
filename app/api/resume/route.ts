import { RATE, enforceRateLimit } from '@/lib/rate-limit'
import { parseResumeText } from '@/lib/resume'
import { hasServerBackend, templateJson } from '@/lib/server/template'

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, 'resume', RATE.resume)
  if (limited) return limited

  const form = await request.formData().catch(() => null)
  const text = String(form?.get('text') ?? '')
  const fileName = String(form?.get('fileName') ?? '') || undefined

  if (text.trim().length < 40) {
    return templateJson(
      {
        error: 'Paste at least a few lines of resume text. PDF extract via Vercel Blob is the next wire-up.',
      },
      400,
    )
  }

  const resume = parseResumeText(text, fileName)
  return templateJson({
    resume,
    stored: hasServerBackend(),
    hint: hasServerBackend()
      ? 'Ready to persist to Neon + Blob.'
      : 'Parsed locally. Persist to Vercel Blob + resumes table when DATABASE_URL is set.',
  })
}
