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
import { FadeIn, StaggerContainer, StaggerItem, BlurIn } from '@/components/ui/motion'
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
      include: {
        _count: { select: { recipe_likes: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 6
    })
    return recipes.map(recipe => ({
      ...recipe,
      likes_count: recipe._count.recipe_likes,
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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary dark:from-primary/10 dark:via-accent/5 dark:to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent" />
        <div className="container relative mx-auto max-w-7xl px-4 py-24 md:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <BlurIn delay={0.1} duration={0.8}>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                {t('heroTitle')}{' '}
                <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">{t('heroHighlight')}</span>
              </h1>
            </BlurIn>
            <FadeIn delay={0.4}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t('heroDescription')}
              </p>
            </FadeIn>
            <FadeIn delay={0.6}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button size="lg" asChild>
                  <Link href="/recipes">
                    {t('exploreRecipes')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {user ? (
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/recipes/new">
                      {t('createNewRecipe')}
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/register">
                      {t('createFreeAccount')}
                    </Link>
                  </Button>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-4">
          <StaggerContainer staggerDelay={0.15} className="grid md:grid-cols-3 gap-8">
            <StaggerItem>
              <Card className="border-none shadow-none bg-transparent group/feature">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover/feature:bg-primary/15 group-hover/feature:scale-110">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('featureSearch')}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t('featureSearchDesc')}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="border-none shadow-none bg-transparent group/feature">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover/feature:bg-accent/15 group-hover/feature:scale-110">
                    <Bookmark className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('featureSave')}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t('featureSaveDesc')}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="border-none shadow-none bg-transparent group/feature">
                <CardContent className="pt-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover/feature:bg-amber-500/15 group-hover/feature:scale-110">
                    <ChefHat className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{t('featureShare')}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t('featureShareDesc')}
                  </p>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4">
          <FadeIn>
            <div className="flex items-center justify-between mb-10">
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
          </FadeIn>
          <StaggerContainer staggerDelay={0.08} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category) => (
              <StaggerItem key={category.slug}>
                <Link href={`/recipes?category=${category.slug}`}>
                  <Card className="hover:shadow-md hover:-translate-y-1 hover:border-primary/20 cursor-pointer group/cat rounded-2xl">
                    <CardContent className="p-5 text-center">
                      <span className="text-4xl mb-3 block transition-transform duration-300 group-hover/cat:scale-110">{category.icon || '🍴'}</span>
                      <h3 className="font-semibold text-sm">{tcat.has(category.slug) ? tcat(category.slug) : category.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
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
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-4">
          <FadeIn>
            <div className="flex items-center justify-between mb-10">
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
          </FadeIn>

          {featuredRecipes.length === 0 ? (
            <FadeIn>
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <ChefHat className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('noRecipesYet')}</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {t('beFirstToShare')}
                </p>
                <Button size="lg" asChild>
                  <Link href={user ? "/recipes/new" : "/register"}>
                    {user ? t('createRecipe') : t('createAccountAndPublish')}
                  </Link>
                </Button>
              </div>
            </FadeIn>
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
