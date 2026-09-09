# JobMatch backend template

This folder is the contract for the next build. The product UI already assumes these pieces exist. This pass still scores and stores runs in the browser so the app is demoable.

## Stack

| Piece | Choice |
|---|---|
| App / functions | Vercel (Next.js route handlers in `app/api`) |
| Database | Neon Postgres (`schema.sql`) |
| Files | Vercel Blob (resume PDFs) |
| Rate limits | Upstash Redis (one free run; one Pro run per Toronto week) |
| Auth | Clerk (email magic link / OTP) |
| Billing | Stripe monthly Founding Pro `$9/month` locked (`$19/month` later) |
| Email | Resend |
| Jobs | Adzuna CA + Indeed Publisher if approved |
| Push | Web Push (VAPID) after the weekly cron exists |

## Product rules the server must enforce

- Free: one match run for the life of the account.
- Pro: one run per calendar week, `America/Toronto` (week starts Monday).
- Paying rematches immediately from the stored resume. Do not send the user back through onboarding.
- `source` is a discovery label only. The apply / listing URL must be the employer’s careers page. Never send a user to LinkedIn, Indeed, or another board.
- Matching uses `lib/match.ts` on the server. No model in the match path.

## Suggested order

1. Neon + Clerk + `users` / `match_runs`
2. Stripe founding checkout + webhook
3. Adzuna ingest + cron
4. Server `POST /api/matches` using the existing scorer
5. Web Push after cron writes the weekly run

Stub routes already live under `app/api/*`. They return template JSON until the env vars in `.env.example` are set.
