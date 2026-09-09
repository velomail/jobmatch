'use client'

import { FileText, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppPrimaryButton, OnboardingPanel } from '@/components/app-container'
import { fallbackIntent } from '@/lib/intent'
import { requestMatchRun } from '@/lib/match-api'
import { extractTextFromFile, isReadableResumeText, parseResumeText } from '@/lib/resume'
import { canRunMatch, isLiveMatchRun, loadState, saveResumeWithoutExtraFreeRun, type UserState } from '@/lib/storage'

const CITIES = ['Any city', 'Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary', 'Waterloo', 'Remote']

export default function ResumePage() {
  const router = useRouter()
  const [city, setCity] = useState('Any city')
  const [resumeText, setResumeText] = useState('')
  const [lookingFor, setLookingFor] = useState('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0)
  const [state, setState] = useState<UserState | null>(null)

  useEffect(() => {
    const next = loadState()
    if (!next.email) {
      router.replace('/app/auth')
      return
    }
    setState(next)
    if (next.lookingFor) setLookingFor(next.lookingFor)
    if (next.resume?.fileName) setFileName(next.resume.fileName)
    if (next.resume?.rawText && isReadableResumeText(next.resume.rawText)) setResumeText(next.resume.rawText)
    if (next.preferredCity) setCity(next.preferredCity)
  }, [router])

  useEffect(() => {
    if (!scanning) return
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setScanStep(Math.min(i, 3))
    }, 650)
    return () => window.clearInterval(id)
  }, [scanning])

  async function onFile(file: File) {
    setError('')
    setFileName(file.name)
    try {
      const text = await extractTextFromFile(file)
      setResumeText(isReadableResumeText(text) ? text : '')
    } catch {
      setResumeText('')
    }
  }

  if (scanning) {
    const messages = [
      'Reading what you want next…',
      'Matching that against real listings…',
      'Removing weak fits and deal-breakers…',
      'Ranking the 10 roles worth your time…',
    ]
    return (
      <OnboardingPanel>
        <div className="flex flex-col items-center text-center">
          <LoaderCircle className="size-8 animate-spin text-primary md:size-10" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight md:text-4xl">Building your list</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-lg">{messages[scanStep]}</p>
        </div>
      </OnboardingPanel>
    )
  }

  const firstRun = !state || canRunMatch(state)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const intentText = lookingFor.trim()
        if (intentText.length < 8) {
          setError('Tell us what you want next — a title, a city, or what to skip.')
          return
        }
        const readable = isReadableResumeText(resumeText)
        if (!readable && !fileName) {
          setError('Add a resume file so we have something to rank from.')
          return
        }
        const combined = [intentText, readable ? resumeText : ''].filter(Boolean).join('\n\n')
        const preferredCity = city === 'Any city' ? undefined : city
        const current = loadState()
        const resume = parseResumeText(combined, fileName)
        const alreadyUsed = !canRunMatch(current)

        const finish = async () => {
          try {
            const result = await requestMatchRun({
              resume,
              lookingFor: intentText,
              preferredCity,
              plan: current.plan,
              hasLastRun: isLiveMatchRun(current.lastRun),
              replaceCatalog: !isLiveMatchRun(current.lastRun),
              excludeKeys: current.seenJobKeys,
            })
            const next = saveResumeWithoutExtraFreeRun(
              resume,
              preferredCity,
              intentText,
              result.intent ?? fallbackIntent(intentText),
              result.run,
            )
            router.push(next.notifyAsked ? '/app/matches' : '/app/notify')
          } catch {
            const next = saveResumeWithoutExtraFreeRun(
              resume,
              preferredCity,
              intentText,
              fallbackIntent(intentText),
            )
            router.push(next.notifyAsked ? '/app/matches' : '/app/notify')
          }
        }

        if (alreadyUsed) {
          void finish()
          return
        }
        setScanning(true)
        void finish()
      }}
    >
      <OnboardingPanel
        actions={<AppPrimaryButton type="submit">{firstRun ? 'Get my Top 10' : 'Save resume'}</AppPrimaryButton>}
      >
        <p className="type-label text-primary">What we rank from</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">Add your resume.</h1>
        <p className="text-sm leading-6 text-muted-foreground md:text-lg md:leading-8">
          Upload once. Paying later does not make you do this again.
        </p>

        <label className="block text-sm font-medium md:text-base" htmlFor="city">
          Where should we prioritize?
        </label>
        <select
          id="city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="h-14 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none focus:border-primary md:h-16 md:text-lg"
        >
          {CITIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <label className="text-sm font-medium md:text-base">Resume</label>
        <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-4 text-sm text-muted-foreground md:min-h-20 md:px-6 md:text-base">
          <FileText className="size-5 text-primary md:size-6" />
          <span>{fileName || 'Camera or files'}</span>
          <input
            type="file"
            accept=".txt,.pdf,text/plain,application/pdf,image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void onFile(file)
            }}
          />
        </label>

        <label className="block text-sm font-medium md:text-base" htmlFor="looking-for">
          What do you want next?
        </label>
        <textarea
          id="looking-for"
          value={lookingFor}
          onChange={(event) => setLookingFor(event.target.value)}
          rows={3}
          placeholder="A senior sales role, hybrid, no staffing firms…"
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-6 outline-none focus:border-primary md:px-6 md:text-base md:leading-7"
        />
        <p className="text-xs leading-5 text-muted-foreground md:text-sm">
          A sentence or two. We rank the 10 from your resume and this note together.
        </p>
        {error ? <p className="text-sm text-destructive md:text-base">{error}</p> : null}
      </OnboardingPanel>
    </form>
  )
}
