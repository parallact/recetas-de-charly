import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Clock,
  Users,
  ExternalLink,
  ArrowLeft,
  Tag,
} from 'lucide-react'
import { BookmarkButton } from '@/components/recipes/bookmark-button'
import { LikeButton } from '@/components/recipes/like-button'
import { ServingsScaler } from '@/components/recipes/servings-scaler'
import { CookingMode } from '@/components/recipes/cooking-mode'
import { RecipeNotes } from '@/components/recipes/recipe-notes'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth/get-user'
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '@/lib/constants'
import { getTranslations } from 'next-intl/server'
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/ui/motion'

interface TagInfo {
  name: string
}

interface FormattedRecipe {
  id: string
  title: string
  slug: string
  description: string | null
  image_url: string | null
  cooking_time: number | null
  prep_time: number | null
  servings: number | null
  difficulty: string | null
  source_url: string | null
  imported_from: string | null
  author: {
    name: string
    avatar: string | null
  }
  ingredients: {
    quantity: number | null
    unit: string
    name: string
  }[]
  instructions: string[]
  categories: string[]
  tags: TagInfo[]
}

async function getRecipeById(id: string, userId?: string): Promise<FormattedRecipe | null> {
  try {
    // Build where clause based on auth status
    const whereClause = userId
      ? { id, OR: [{ is_public: true }, { user_id: userId }] }
      : { id, is_public: true }

    const recipe = await prisma.recipes.findFirst({
      where: whereClause,
      include: {
        users: {
          include: {
            profiles: true
          }
        },
        recipe_ingredients: {
          include: {
            ingredients: true
          },
          orderBy: { order_index: 'asc' }
        },
        instructions: {
          orderBy: { step_number: 'asc' }
        },
        recipe_categories: {
          include: {
            categories: true
          }
        },
        recipe_tags: {
          include: {
            tags: true
          }
        }
      }
    })

    if (!recipe) return null

    // Format ingredients
    const formattedIngredients = recipe.recipe_ingredients.map((ri) => ({
      quantity: ri.quantity ? Number(ri.quantity) : null,
      unit: ri.unit || '',
      name: ri.ingredients?.name || '',
    }))

    // Format instructions
    const sortedInstructions = recipe.instructions.map((i) => i.content)

    // Format categories
    const categories = recipe.recipe_categories
      .map((rc) => rc.categories?.name || '')
      .filter(Boolean)

    // Format tags
    const tags = recipe.recipe_tags
      .map((rt) => rt.tags)
      .filter((tag): tag is NonNullable<typeof tag> => tag !== null)
      .map(tag => ({ name: tag.name }))

    // Get profile data
    const profile = recipe.users?.profiles

    return {
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      image_url: recipe.image_url,
      cooking_time: recipe.cooking_time,
      prep_time: recipe.prep_time,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      source_url: recipe.source_url,
      imported_from: recipe.imported_from,
      author: {
        name: profile?.display_name || 'Usuario',
        avatar: profile?.avatar_url || null,
      },
      ingredients: formattedIngredients,
      instructions: sortedInstructions,
      categories,
      tags,
    }
  } catch {
    return null
  }
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [user, t, tc] = await Promise.all([
    getUser(),
    getTranslations('recipes'),
    getTranslations('common')
  ])
  const recipe = await getRecipeById(id, user?.id)

  if (!recipe) {
    notFound()
  }

  const difficulty = (recipe.difficulty as 'easy' | 'medium' | 'hard') || 'medium'

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Image */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-6xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

        {/* Action buttons in hero overlay */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex gap-2">
          <LikeButton
            recipeId={recipe.id}
            variant="icon"
            className="bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg h-10 w-10"
          />
          <BookmarkButton
            recipeId={recipe.id}
            variant="icon"
            className="bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg h-10 w-10"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container">
            <Link
              href="/recipes"
              className="inline-flex items-center text-white/80 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tc('backToRecipes')}
            </Link>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {recipe.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              {recipe.difficulty && (
                <Badge
                  className={DIFFICULTY_COLORS[difficulty]}
                  variant="secondary"
                >
                  {DIFFICULTY_LABELS[difficulty]}
                </Badge>
              )}
              {recipe.cooking_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{recipe.cooking_time} min</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{t('servings', { count: recipe.servings })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {recipe.description && (
              <FadeIn>
                <p className="text-lg text-muted-foreground">{recipe.description}</p>
              </FadeIn>
            )}

            {/* Author */}
            <div className="flex items-center gap-3">
              {recipe.author.avatar ? (
                <Image
                  src={recipe.author.avatar}
                  alt={recipe.author.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium">
                    {recipe.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">{recipe.author.name}</p>
                <p className="text-sm text-muted-foreground">{t('recipeAuthor')}</p>
              </div>
            </div>

            {/* Imported from attribution */}
            {recipe.imported_from && (
              <p className="text-sm text-muted-foreground italic">
                {t('importedFrom')} {recipe.imported_from}
              </p>
            )}

            <Separator />

            {/* Instructions */}
            {recipe.instructions.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6">{t('instructions')}</h2>

                {/* Cooking Mode Toggle */}
                <div className="mb-6">
                  <CookingMode instructions={recipe.instructions} />
                </div>

                {/* Static instructions list */}
                <StaggerContainer staggerDelay={0.1} className="space-y-6">
                  {recipe.instructions.map((step, index) => (
                    <StaggerItem key={index}>
                      <li className="flex gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <p className="pt-1">{step}</p>
                      </li>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            )}

            {/* Source */}
            {recipe.source_url && (
              <div className="pt-4">
                <Button variant="outline" asChild>
                  <a href={recipe.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t('viewOriginal')}
                  </a>
                </Button>
              </div>
            )}

            {/* Personal Notes */}
            <div className="pt-4">
              <RecipeNotes recipeId={recipe.id} />
            </div>
          </div>

          {/* Sidebar - Ingredients */}
          <div className="lg:col-span-1">
            <FadeIn direction="right" delay={0.2}>
            <div className="sticky top-24 space-y-4">
              <ServingsScaler
                originalServings={recipe.servings || 1}
                ingredients={recipe.ingredients}
              />

              {recipe.categories.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="font-medium mb-3">{tc('categories')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.categories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {recipe.tags.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4" />
                    <h3 className="font-medium">{t('tags')}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="outline"
                                          >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  )
}
