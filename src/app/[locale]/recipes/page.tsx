import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ChefHat } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import type { Recipe, Category } from '@/lib/types'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { Pagination } from '@/components/ui/pagination'
import { getTranslations } from 'next-intl/server'
import { StaggerContainer, StaggerItem } from '@/components/ui/motion'

const RECIPES_PER_PAGE = 12

interface RecipeWithAuthor extends Recipe {
  profiles: { display_name: string | null } | null
}

interface PaginatedResult {
  recipes: RecipeWithAuthor[]
  totalCount: number
  totalPages: number
  currentPage: number
}

async function getRecipes(categorySlug?: string, page = 1): Promise<PaginatedResult> {
  const emptyResult: PaginatedResult = { recipes: [], totalCount: 0, totalPages: 0, currentPage: page }

  try {
    const currentPage = Math.max(1, page)
    const skip = (currentPage - 1) * RECIPES_PER_PAGE

    // Build where clause
    let whereClause: Record<string, unknown> = { is_public: true }

    if (categorySlug) {
      const category = await prisma.categories.findUnique({
        where: { slug: categorySlug }
      })

      if (!category) return emptyResult

      whereClause = {
        ...whereClause,
        recipe_categories: {
          some: { category_id: category.id }
        }
      }
    }

    // Get recipes with count
    const [recipes, totalCount] = await Promise.all([
      prisma.recipes.findMany({
        where: whereClause,
        include: {
          users: {
            include: { profiles: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: RECIPES_PER_PAGE
      }),
      prisma.recipes.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(totalCount / RECIPES_PER_PAGE)

    // Transform to expected format
    const formattedRecipes = recipes.map(recipe => ({
      ...recipe,
      profiles: recipe.users?.profiles
        ? { display_name: recipe.users.profiles.display_name }
        : null
    })) as RecipeWithAuthor[]

    return {
      recipes: formattedRecipes,
      totalCount,
      totalPages,
      currentPage
    }
  } catch {
    return emptyResult
  }
}

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

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const params = await searchParams
  const categorySlug = params.category
  const page = Math.max(1, parseInt(params.page || '1') || 1)

  const [result, categories, t, tc] = await Promise.all([
    getRecipes(categorySlug, page),
    getCategories(),
    getTranslations('recipes'),
    getTranslations('common')
  ])

  const { recipes, totalCount, totalPages, currentPage } = result

  const currentCategory = categorySlug
    ? categories.find(c => c.slug === categorySlug)
    : null

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {currentCategory ? currentCategory.name : t('allRecipes')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentCategory
              ? `${t('recipesOf')} ${currentCategory.name.toLowerCase()}`
              : t('exploreCollection')}
          </p>
        </div>
        <Button asChild>
          <Link href="/recipes/new">
            <Plus className="mr-2 h-4 w-4" />
            {tc('newRecipe')}
          </Link>
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/recipes">
          <Badge
            variant={!categorySlug ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/90"
          >
            {tc('all')}
          </Badge>
        </Link>
        {categories.map((category) => (
          <Link key={category.id} href={`/recipes?category=${category.slug}`}>
            <Badge
              variant={categorySlug === category.slug ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/90"
            >
              {category.icon} {category.name}
            </Badge>
          </Link>
        ))}
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16">
          <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('noRecipesYet')}</h3>
          <p className="text-muted-foreground mb-4">
            {currentCategory
              ? `${t('noRecipesInCategory')} ${currentCategory.name}`
              : t('beFirstToShare')}
          </p>
          <Button asChild>
            <Link href="/recipes/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('createFirstRecipe')}
            </Link>
          </Button>
        </div>
      ) : (
        <>
        <StaggerContainer staggerDelay={0.08} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <StaggerItem key={recipe.id}>
              <RecipeCard
                recipe={recipe}
                useIconPlaceholder
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          basePath="/recipes"
          preserveParams={categorySlug ? { category: categorySlug } : {}}
          itemName={t('recipe')}
        />
        </>
      )}
    </div>
  )
}
