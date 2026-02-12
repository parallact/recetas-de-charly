import { Link } from '@/i18n/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

async function getCategories() {
  try {
    const [categories, counts] = await Promise.all([
      prisma.categories.findMany({
        select: { id: true, name: true, slug: true, icon: true, description: true },
        orderBy: { name: 'asc' }
      }),
      prisma.recipe_categories.groupBy({
        by: ['category_id'],
        _count: { category_id: true },
      })
    ])

    const countsByCategory: Record<string, number> = {}
    for (const c of counts) {
      countsByCategory[c.category_id] = c._count.category_id
    }

    return categories.map((cat) => ({
      ...cat,
      recipeCount: countsByCategory[cat.id] || 0,
    }))
  } catch {
    return []
  }
}

export default async function CategoriesPage() {
  const [categories, t, tr] = await Promise.all([
    getCategories(),
    getTranslations('categories'),
    getTranslations('recipes')
  ])

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </FadeIn>

      {categories.length > 0 ? (
        <StaggerContainer staggerDelay={0.06} className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <StaggerItem key={category.id}>
              <Link href={`/recipes?category=${category.slug}`}>
                <Card className="group hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6 text-center">
                    <span className="text-4xl mb-3 block">{category.icon || '🍽️'}</span>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {category.recipeCount} {category.recipeCount === 1 ? tr('recipe') : tr('recipePlural')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📂</p>
          <h3 className="text-xl font-semibold mb-2">{t('noCategories')}</h3>
          <p className="text-muted-foreground mb-6">
            {t('noCategoriesHint')}
          </p>
          <Button asChild>
            <Link href="/recipes">{t('viewAllRecipes')}</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
