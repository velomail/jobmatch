import { AppContainer } from '@/components/app-container'
import { BrandMark } from '@/components/brand-mark'

export function SiteFooter() {
  return (
    <footer>
      <AppContainer size="wide" className="flex items-center justify-between py-10 md:py-12">
        <BrandMark />
        <p className="max-w-xs text-right text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
          jobmatch. Founded in 2025.
        </p>
      </AppContainer>
    </footer>
  )
}
