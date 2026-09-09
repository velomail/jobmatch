import Link from 'next/link'

export function BrandMark({ href = '/', size = 'md' }: { href?: string; size?: 'sm' | 'md' }) {
  return (
    <Link
      href={href}
      className={size === 'sm' ? 'font-semibold tracking-tight md:text-lg' : 'text-lg font-semibold tracking-tight md:text-xl'}
      aria-label="jobmatch home"
    >
      <span className="lowercase">jobmatch</span>
    </Link>
  )
}
