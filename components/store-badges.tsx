import { APP_STORE_URL, PLAY_STORE_URL, storeHref } from '@/lib/store-links'

function Badge({
  href,
  title,
  subtitle,
}: {
  href?: string
  title: string
  subtitle: string
}) {
  const className =
    'inline-flex min-h-12 min-w-[10.5rem] flex-col justify-center rounded-xl border border-border bg-card px-4 py-2 text-left shadow-sm transition hover:border-primary/30'
  const inner = (
    <>
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{subtitle}</span>
      <span className="text-sm font-semibold">{title}</span>
    </>
  )
  if (!href) {
    return (
      <span className={`${className} opacity-80`} aria-disabled="true">
        {inner}
      </span>
    )
  }
  return (
    <a href={href} className={className}>
      {inner}
    </a>
  )
}

export function StoreBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Badge href={storeHref(APP_STORE_URL)} subtitle="Download on the" title="App Store" />
      <Badge href={storeHref(PLAY_STORE_URL)} subtitle="Get it on" title="Google Play" />
    </div>
  )
}
