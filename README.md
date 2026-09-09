# JobMatch

Canada-first weekly job matching. Marketing site at `/`. Mobile-first PWA at `/app`.

## Stack

Next.js 16 · React 19 · Tailwind v4 · shadcn

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, then [http://localhost:3000/app](http://localhost:3000/app) for the product.

## Product

- **Free:** one ranked Top 10 from your resume
- **Founding Pro ($9/month** locked, $19/month later**):** a new Top 10 every week

The list always names the real platform (LinkedIn, Indeed, or company site). There is no deeper-search product and no generated apply brief.

## Demo notes

This pass stores the session in `localStorage` (`jobmatch.v2`) so the funnel works without Clerk or Stripe. On Account, **Preview stale list** shows the next-week paywall. **Unlock this week’s 10** rematches immediately.

Backend contract: [`backend/README.md`](backend/README.md), [`backend/schema.sql`](backend/schema.sql), stub routes under `app/api`, env keys in `.env.example`.

How the product decisions were made: [`DECISIONS.md`](DECISIONS.md). Paste into v0 for more UI: [`V0.md`](V0.md).
