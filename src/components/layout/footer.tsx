import { Link } from '@/i18n/navigation'
import { ChefHat } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('common')

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            <span>{t('appName')}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/recipes" className="hover:text-foreground transition-colors">
              {t('footer.recipes')}
            </Link>
            <Link href="/categories" className="hover:text-foreground transition-colors">
              {t('footer.categories')}
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  )
}
