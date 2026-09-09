import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'JobMatch — Stop searching. Start matching.'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#f7f7f7',
          color: '#1a1a1a',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#4b2ea8',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            ⌕
          </div>
          JobMatch
        </div>
        <div style={{ marginTop: 36, fontSize: 72, fontWeight: 650, lineHeight: 1.05, letterSpacing: '-0.04em' }}>
          Stop searching.
        </div>
        <div style={{ fontSize: 72, fontWeight: 650, lineHeight: 1.05, letterSpacing: '-0.04em', color: '#4b2ea8' }}>
          Start matching.
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: '#666', maxWidth: 760 }}>
          Canada-first weekly Top 10 jobs from your resume. No sponsored listings.
        </div>
      </div>
    ),
    size,
  )
}
