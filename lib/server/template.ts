export const BACKEND_TEMPLATE = {
  ready: false,
  message:
    'Template route. Client still uses lib/match.ts and localStorage. Connect Neon, Clerk, and Stripe to move entitlements onto the server.',
} as const

export function templateJson(extra: Record<string, unknown> = {}, status = 200) {
  return Response.json({ ...BACKEND_TEMPLATE, ...extra }, { status })
}

export function hasServerBackend() {
  return Boolean(process.env.DATABASE_URL && process.env.CLERK_SECRET_KEY)
}
