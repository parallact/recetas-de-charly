export const dynamic = 'force-dynamic'

import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChefHat,
  Search,
  Bookmark,
  ArrowRight,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { getUser } from '@/lib/auth/get-user'
import { getTranslations } from 'next-intl/server'
import { FadeIn, SlideIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import type { Category, Recipe } from '@/lib/types'

async function getCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { name: 'asc' }
    })
    return categories as Category[]
  } catch {
    return []
  }
}

async function getFeaturedRecipes(): Promise<(Recipe & { likes_count: number })[]> {
  try {
    const recipes = await prisma.recipes.findMany({
      where: { is_public: true },
      orderBy: { created_at: 'desc' },
      take: 6
    })
    return recipes.map(recipe => ({
      ...recipe,
      likes_count: 0,
      // Convert Decimal to number for servings
      servings: recipe.servings ?? 4
    })) as (Recipe & { likes_count: number })[]
  } catch {
    return []
  }
}

async function getCategoryCounts(): Promise<Record<string, number>> {
  try {
    const grouped = await prisma.recipe_categories.groupBy({
      by: ['category_id'],
      where: { recipes: { is_public: true } },
      _count: { category_id: true },
    })

    const counts: Record<string, number> = {}
    for (const g of grouped) {
      counts[g.category_id] = g._count.category_id
    }
    return counts
  } catch {
    return {}
  }
}

export default async function HomePage() {
  const [categories, featuredRecipes, categoryCounts, user, t, tc, tcat] = await Promise.all([
    getCategories(),
    getFeaturedRecipes(),
    getCategoryCounts(),
    getUser(),
    getTranslations('home'),
    getTranslations('common'),
    getTranslations('categoryNames')
  ])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950">
        <div className="container mx-auto max-w-7xl px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <SlideIn direction="up" delay={0.2} duration={0.7}>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                {t('heroTitle')}{' '}
                <span className="text-primary">{t('heroHighlight')}</span>
              </h1>
            </SlideIn>
            <FadeIn delay={0.4}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('heroDescription')}
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-7xl px-4">
          <StaggerContainer staggerDelay={0.15} className="grid md:grid-cols-3 gap-8">
            <StaggerItem>
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('featureSearch')}</h3>
                  <p className="text-muted-foreground">
                    {t('featureSearchDesc')}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('featureSave')}</h3>
                  <p className="text-muted-foreground">
                    {t('featureSaveDesc')}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <ChefHat className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('featureShare')}</h3>
                  <p className="text-muted-foreground">
                    {t('featureShareDesc')}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{t('categoriesTitle')}</h2>
              <p className="text-muted-foreground mt-1">
                {t('categoriesSubtitle')}
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/categories">
                {tc('viewAll')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <StaggerContainer staggerDelay={0.08} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category) => (
              <StaggerItem key={category.slug}>
                <Link href={`/recipes?category=${category.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <span className="text-4xl mb-2 block">{category.icon || '🍴'}</span>
                      <h3 className="font-medium">{tcat.has(category.slug) ? tcat(category.slug) : category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {categoryCounts[category.id] || 0} {tc('recipes').toLowerCase()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">
                {t('featuredTitle')}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t('featuredSubtitle')}
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/recipes">
                {tc('viewAll')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('noRecipesYet')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('beFirstToShare')}
              </p>
              <Button asChild>
                <Link href={user ? "/recipes/new" : "/register"}>
                  {user ? t('createRecipe') : t('createAccountAndPublish')}
                </Link>
              </Button>
            </div>
          ) : (
            <StaggerContainer staggerDelay={0.1} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredRecipes.map((recipe) => (
                <StaggerItem key={recipe.id}>
                  <RecipeCard recipe={recipe} useIconPlaceholder />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

    </div>
  )
}
