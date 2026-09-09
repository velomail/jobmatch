# How JobMatch reached this product

Paste-ready brief for v0 (open-ended UI): [`V0.md`](V0.md).

This is the step-by-step record of how the current app was decided — from the original waitlist page to a mobile shortlist with a monthly habit. Each step is a problem, the options that were on the table, and why we kept one.

## 1. The starting point

The first request was to rebuild the existing JobMatch landing as closely as possible, then make paid features feel like a **need**, not a want, and to win on Google keywords.

The original `job-match` repo was a v0 “coming soon” waitlist: Next.js, Tailwind, shadcn, purple brand, no backend, no matcher, no paywall. The useful assets were the line **Stop searching. Start matching.**, the glass “Today’s matches” preview, and the Canada-first positioning.

**Decision:** keep that brand and preview language, then build a real matcher behind it instead of shipping another waitlist.

## 2. First paid model: 3 of 10 + extras

The first working product used a common freemium job-app pattern:

- Free: 3 of 10 daily matches
- Paid: the other 7, plus “deeper search,” plus AI apply briefs

That looked complete. It also had three problems, which the later reviews exposed.

1. Blurring 7 cards trains people to treat JobMatch like a job board with a lock icon.
2. Extra paid features had to be explained. If you have to explain the product, the paywall is too complicated.
3. Generated briefs sounded useful and were not credible.

**Decision:** treat that first model as a draft, not the product.

## 3. “Deeper search” was defined, then dropped

We tried to make deeper search concrete: pull Greenhouse / Lever / Ashby career pages, label them “Company site,” and sell quieter applicant pools.

User pushback, in order:

- Being **faster** is not a reason to pay. Boards are already fast.
- Career-page inventory is a **supply idea**, not a user need. People already trust LinkedIn and Indeed. They will not pay to hunt employer ATS boards.
- If the listing URL is a company site, show **Company site** as a source label. That is credibility. It is not a second product.

**Decision:** remove deeper search from billing, matching, and the matches screen. Keep `source` on every row. Do not scrape LinkedIn. Do not build ATS ingest just to sell a feature.

## 4. Job briefs were defined, then cut to facts

We tried apply briefs: why you match, talking points, a resume tweak, a first paragraph to send today.

The doubt was correct. Those paragraphs are generated cover-letter filler. They fight the credibility we get from a real platform name and a real fit score.

**Decision:** match detail shows only evidence the scorer already has — fit %, platform, matched skills, missing skills, applicants, city, work style. No talking points. No “send this today.”

## 5. The paywall had to get simpler

The question was: is “free has limited results, Pro has it daily” enough to be paid?

The honest answer: **the list going stale is the need.** Searching every day is already the unpaid job. A new ranked 10 every morning is what people would pay to stop doing.

So the model collapsed to one sentence:

- **Free = one ranked list.** Full Top 10. Enough to see if the ranking is honest.
- **Pro = a new Top 10 every calendar day** from the resume they already uploaded.

Refreshing the resume does not mint a second free day. Paying does not restart onboarding. Checkout rematches immediately and opens today’s list.

**Decision:** one offer, one pay moment (“Unlock today’s 10 — $9/month”), one daily habit.

## 6. $9 is a month, not a day

The list is daily. The bill is monthly. Copy that said “$9 a day” or implied a daily charge was wrong.

**Decision:** always write **$9/month** or **$9/mo**. Founding price locks $9/month; later price is $19/month. Stripe is a monthly subscription.

## 7. The UI was copying Indeed

The cards were stacked white tiles: document icon, job title, company · location, “via Indeed,” a colored fit pill. That is a job-board row, even in purple.

User direction: keep the glass frame and “Today’s matches” header from the original landing. Change the row itself. Always show the platform, quietly, for credibility.

**Decision:** treat the list as an editorial shortlist.

- Mono rank (`01`) is the left identity.
- **Company** leads; role is second.
- Fit % sits in Geist Mono under the rank, not in a blue/purple chip.
- Platform is small-caps muted type (`LinkedIn`), not a “via Indeed” footer chip.
- Rows share one sheet with hairline dividers. No document glyph. No Indeed blue.

That is how the app *functions* differently: you review a ranked 10, you do not scroll a feed of postings.

## 8. Marketing and the product are different surfaces

A desktop marketing header, SEO footer, and “see my first matches” form dumped people into a website. The product needed to feel like a phone app.

**Decision:**

| Surface | URL | Job |
|---|---|---|
| Marketing | `/`, `/pricing`, `/how-it-works`, SEO pages | Simple landing, store badges, waitlist, explain $9/month |
| Product | `/app/*` | Onboarding → email → resume → notifications → daily Top 10 |

Landing CTAs are download (App Store / Play, `#` until live) plus a quieter **Open the web app**. Checkout lives in the app.

## 9. The mobile flow is the product

The app is a PWA (`manifest.ts`, standalone, purple theme). On desktop it still sits in a 430px column.

1. Onboarding — what it is, free once / $9 a month, continue
2. Auth — email + continue (Clerk-shaped; local session this pass)
3. Resume — camera / files / paste, once
4. Notifications — “ping when today’s 10 are ready” (permission + stub)
5. Matches — today’s shortlist; stale free day shows one button
6. Later days (Pro) — open the app, the list is there

Auth owns the resume and the free-run flag. Tabs: Matches, Results, Account.

## 10. Backend is required for the habit, not for the demo

Daily Pro only works for real if jobs, users, and billing live on the server. Today the UI is functional on a local catalog + `localStorage` so the funnel can be audited.

The template (not a fake launch backend) is:

- Neon Postgres schema: users, resumes, jobs, match_runs, match_items, applications, billing_events
- Vercel route handlers under `app/api/*`
- Vercel Blob, Upstash Redis, Clerk, Stripe, Resend, Adzuna, Web Push
- Cron stub for Canada ingest
- Source labels from real URL hosts only

Matching v1 stays `lib/match.ts`. No model invents jobs or letters.

## 11. What we will not build

- LinkedIn or Indeed scraping
- A live search box (that is a board)
- Fake `source` labels
- AI cover letters as a paid feature
- Greenhouse/Lever ingest as a product called “deeper search”
- Daily billing language

## 12. Audit bar before a push

The app is ready to **use**, not ready to **charge real cards**.

Must work in a phone viewport:

1. Landing is a download page; it does not dump into `/start`
2. `/app` walks onboarding → email → resume → notify → 10 rows
3. Each row shows company, role, rank, fit %, platform
4. Detail is facts only; listing link works
5. Next day (or Account → Preview stale list): yesterday’s list stays visible; **Unlock today’s 10 — $9/month** rematches and marks Pro
6. Pro opening Matches on a new `seedDate` rematches from the saved resume
7. Updating the resume after the free run does not mint a second free day

Do not push until those paths are walked. Clerk, Stripe, and Adzuna stay unwired until that audit is green.

## 13. The conclusion, in one paragraph

JobMatch is not Indeed with a paywall. Indeed is a daily feed of postings. JobMatch is a weekly ranked shortlist. Free exists to prove the ranking once. $9/month exists because searching again every week is still unpaid work. Everything that fought that sentence — blurred rows, ATS “deeper search,” generated briefs, desktop-website chrome, $9/day language — was removed.

## 14. Weekly, not daily

Daily refresh assumed the Canada market would mint ten new on-query roles overnight. It does not. A daily scrape repeated the same listings, padded with older posts, or returned fewer than 10 honest matches.

**Decision:** ingest and rematch once per week (`America/Toronto`, week starts Monday). Free is still one list. Pro is a new Top 10 each week from the saved resume. The bill stays $9/month. Copy that promised “every calendar day” or “today’s 10” as a daily habit is wrong.
