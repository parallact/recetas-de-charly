'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { ChefHat, Home, Search } from 'lucide-react'
import { ScaleIn, FadeIn } from '@/components/ui/motion'

export default function NotFound() {
  const t = useTranslations('errors')
  const t2 = useTranslations('common')

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="flex flex-col items-center text-center">
        <ScaleIn>
          <div className="p-4 rounded-full bg-muted mb-6">
            <ChefHat className="h-16 w-16 text-muted-foreground" />
          </div>
        </ScaleIn>

        <FadeIn delay={0.2}>
          <h1 className="text-4xl font-bold mb-2">{t('404')}</h1>
          <h2 className="text-xl font-medium mb-4">{t('pageNotFound')}</h2>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="text-muted-foreground mb-8 max-w-md">
            {t('pageNotFoundDesc')}
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                {t('goHome')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/recipes">
                <Search className="mr-2 h-4 w-4" />
                {t2('exploreRecipes')}
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
