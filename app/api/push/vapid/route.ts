export const runtime = 'nodejs'

export async function GET() {
  return Response.json({
    publicKey: process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  })
}
