'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AppPrimaryButton, OnboardingPanel } from '@/components/app-container'
import { PLANS } from '@/lib/billing'
import { updateState } from '@/lib/storage'

const slides = [
  {
    kicker: 'A shortlist, not a feed',
    title: 'Ten roles. Ranked from your resume.',
    body: 'JobMatch is not another board. You get one honest Top 10 — company first, platform named, no sponsored jobs.',
  },
  {
    kicker: 'Free once. Pro weekly.',
    title: 'One list to prove it. $9/month for every week after.',
    body: `${PLANS.free.blurb} Founding Pro is ${PLANS.founding.blurb}`,
  },
  {
    kicker: 'Convenient every week',
    title: 'Pay once a month. Open the app. This week’s 10 are there.',
    body: 'Upload a resume once. Next week you do not search. You review a ranked list.',
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const slide = slides[index]
  const last = index === slides.length - 1

  return (
    <OnboardingPanel
      actions={
        <AppPrimaryButton
          type="button"
          onClick={() => {
            if (!last) {
              setIndex(index + 1)
              return
            }
            updateState({ onboardingSeen: true })
            router.push('/app/auth')
          }}
        >
          {last ? 'Continue' : 'Next'}
        </AppPrimaryButton>
      }
    >
      <p className="type-label text-primary">{slide.kicker}</p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">{slide.title}</h1>
      <p className="text-sm leading-7 text-muted-foreground md:text-lg md:leading-8">{slide.body}</p>
      <div className="flex gap-2">
        {slides.map((item, i) => (
          <span
            key={item.title}
            className={`h-1.5 flex-1 rounded-full md:h-2 ${i === index ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>
    </OnboardingPanel>
  )
}
