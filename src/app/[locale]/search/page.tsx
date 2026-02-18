import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { prisma } from '@/lib/prisma'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { Badge } from '@/components/ui/badge'
import { Prisma } from '@/generated/prisma'
import { getTranslations } from 'next-intl/server'
import { StaggerContainer, StaggerItem } from '@/components/ui/motion'

const RECIPES_PER_PAGE = 12

interface SearchFilters {
  q?: string
  category?: string
  difficulty?: string
  time?: string
  tag?: string
  page?: number
}

// Recipe type for search results
interface SearchRecipe {
  id: string
  title: string
  slug: string
  description: string | null
  image_url: string | null
  cooking_time: number | null
  prep_time: number | null
  servings: number | null
  difficulty: string | null
  likes_count: number
  recipe_tags?: { tags: { name: string; slug: string } | null }[]
}

interface SearchResult {
  recipes: SearchRecipe[]
  categories: Array<{ id: string; name: string; slug: string }>
  tags: Array<{ id: string; name: string; slug: string }>
  totalCount: number
  totalPages: number
  currentPage: number
  error: string | null
}

async function searchRecipes(filters: SearchFilters): Promise<SearchResult> {
  const emptyResult: SearchResult = {
    recipes: [],
    categories: [],
    tags: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: filters.page || 1,
    error: null
  }

  try {
    // Fetch categories and tags for filter dropdowns
    const [categories, tags] = await Promise.all([
      prisma.categories.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' }
      }),
      prisma.tags.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: 'asc' }
      })
    ])

    // Calculate pagination
    const currentPage = Math.max(1, filters.page || 1)
    const skip = (currentPage - 1) * RECIPES_PER_PAGE

    // Build where clause
    const whereConditions: Prisma.recipesWhereInput[] = [{ is_public: true }]

    // Text search
    if (filters.q?.trim()) {
      const searchTerm = filters.q.trim().slice(0, 100)
      whereConditions.push({
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } }
        ]
      })
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty !== 'all') {
      whereConditions.push({ difficulty: filters.difficulty })
    }

    // Time filter
    if (filters.time && filters.time !== 'all') {
      const maxTime = parseInt(filters.time)
      whereConditions.push({ cooking_time: { lte: maxTime } })
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      whereConditions.push({
        recipe_categories: {
          some: {
            categories: { slug: filters.category }
          }
        }
      })
    }

    // Tag filter
    if (filters.tag && filters.tag !== 'all') {
      whereConditions.push({
        recipe_tags: {
          some: {
            tags: { slug: filters.tag }
          }
        }
      })
    }

    const whereClause: Prisma.recipesWhereInput = { AND: whereConditions }

    // Get recipes with count
    const [recipes, totalCount] = await Promise.all([
      prisma.recipes.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          image_url: true,
          cooking_time: true,
          prep_time: true,
          servings: true,
          difficulty: true,
          recipe_tags: {
            include: { tags: { select: { name: true, slug: true } } }
          },
          _count: { select: { recipe_likes: true } }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: RECIPES_PER_PAGE
      }),
      prisma.recipes.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(totalCount / RECIPES_PER_PAGE)

    const formattedRecipes = recipes.map(recipe => ({
      ...recipe,
      likes_count: recipe._count.recipe_likes,
    }))

    return {
      recipes: formattedRecipes as SearchRecipe[],
      categories,
      tags,
      totalCount,
      totalPages,
      currentPage,
      error: null
    }
  } catch {
    return { ...emptyResult, error: 'searchError' }
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; difficulty?: string; time?: string; tag?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1') || 1)
  const { recipes, categories, tags, totalPages, currentPage, error } = await searchRecipes({
    ...params,
    page
  })

  const t = await getTranslations('search')
  const tc = await getTranslations('common')
  const td = await getTranslations('difficulty')
  const tcat = await getTranslations('categoryNames')

  // Helper to build pagination URLs
  const buildPageUrl = (pageNum: number) => {
    const urlParams = new URLSearchParams()
    if (params.q) urlParams.set('q', params.q)
    if (params.category) urlParams.set('category', params.category)
    if (params.difficulty) urlParams.set('difficulty', params.difficulty)
    if (params.time) urlParams.set('time', params.time)
    if (params.tag) urlParams.set('tag', params.tag)
    if (pageNum > 1) urlParams.set('page', pageNum.toString())
    const queryString = urlParams.toString()
    return `/search${queryString ? `?${queryString}` : ''}`
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
        <div className="flex flex-col md:flex-row gap-4">
          <form className="flex-1 flex gap-2" action="/search" method="GET">
            {/* Preserve other filters */}
            {params.category && <input type="hidden" name="category" value={params.category} />}
            {params.difficulty && <input type="hidden" name="difficulty" value={params.difficulty} />}
            {params.time && <input type="hidden" name="time" value={params.time} />}
            {params.tag && <input type="hidden" name="tag" value={params.tag} />}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                type="search"
                placeholder={tc('searchByName')}
                className="pl-10"
                defaultValue={params.q || ''}
                maxLength={100}
              />
            </div>
            <Button type="submit">{tc('search')}</Button>
          </form>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t('filters')}</span>
        </div>
        <form className="flex flex-wrap gap-4" action="/search" method="GET">
          {/* Preserve search query */}
          {params.q && <input type="hidden" name="q" value={params.q} />}

          <Select name="difficulty" defaultValue={params.difficulty || 'all'}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={tc('difficulty')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc('all')}</SelectItem>
              <SelectItem value="easy">{td('easy')}</SelectItem>
              <SelectItem value="medium">{td('medium')}</SelectItem>
              <SelectItem value="hard">{td('hard')}</SelectItem>
            </SelectContent>
          </Select>
          <Select name="time" defaultValue={params.time || 'all'}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={tc('time')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('anyTime')}</SelectItem>
              <SelectItem value="15">{t('lessThan15')}</SelectItem>
              <SelectItem value="30">{t('lessThan30')}</SelectItem>
              <SelectItem value="60">{t('lessThan60')}</SelectItem>
            </SelectContent>
          </Select>
          <Select name="category" defaultValue={params.category || 'all'}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc('all')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {tcat.has(cat.slug) ? tcat(cat.slug) : cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tags.length > 0 && (
            <Select name="tag" defaultValue={params.tag || 'all'}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('tag')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tc('all')}</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.slug}>
                    <span className="flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      {tag.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button type="submit" variant="secondary">{tc('apply')}</Button>
        </form>
      </div>

      {/* Active Tag Filter Badge */}
      {params.tag && params.tag !== 'all' && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">{t('filteringByTag')}</span>
          {(() => {
            const activeTag = tags.find(tg => tg.slug === params.tag)
            if (!activeTag) return null
            return (
              <Badge variant="outline" className="gap-1">
                <Tag className="h-3 w-3" />
                {activeTag.name}
              </Badge>
            )
          })()}
          <Link
            href={buildPageUrl(1).replace(/[?&]tag=[^&]+/, '').replace(/\?$/, '')}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {t('removeFilter')}
          </Link>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">⚠️</p>
          <h3 className="text-xl font-semibold mb-2">{t('searchError')}</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Results */}
      {!error && params.q && (
        <p className="text-muted-foreground mb-6">
          {recipes.length} {recipes.length !== 1 ? t('results') : t('result')} {t('for')} &quot;{params.q}&quot;
        </p>
      )}

      {!error && recipes.length > 0 ? (
        <>
        <StaggerContainer staggerDelay={0.08} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <StaggerItem key={recipe.id}>
              <RecipeCard recipe={recipe} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={currentPage <= 1}
            >
              <Link href={buildPageUrl(currentPage - 1)} aria-disabled={currentPage <= 1}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {tc('previous')}
              </Link>
            </Button>

            <span className="text-sm text-muted-foreground px-4">
              {tc('page')} {currentPage} {tc('of')} {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={currentPage >= totalPages}
            >
              <Link href={buildPageUrl(currentPage + 1)} aria-disabled={currentPage >= totalPages}>
                {tc('next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
        </>
      ) : !error ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">🔍</p>
          <h3 className="text-xl font-semibold mb-2">{t('noResults')}</h3>
          <p className="text-muted-foreground mb-6">
            {params.q
              ? `${t('noResultsFor')} "${params.q}"`
              : t('tryDifferent')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {(params.q || params.category || params.difficulty || params.time || params.tag) && (
              <Button variant="outline" asChild>
                <Link href="/search">{t('clearFilters')}</Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/recipes">{t('viewAllRecipes')}</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
