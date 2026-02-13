'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, Heart, ChefHat, Tag } from 'lucide-react'
import { DIFFICULTY_COLORS, type Difficulty } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { memo, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

// Tag type from join
interface TagData {
  name: string
  color?: string | null
}

// Flexible recipe type that accepts different data shapes
interface RecipeData {
  id: string
  title: string
  slug?: string
  description?: string | null
  image_url?: string | null
  cooking_time?: number | null
  prep_time?: number | null
  servings?: number | null
  difficulty?: string | null
  profiles?: { display_name: string | null } | null // From join
  profile?: { display_name: string | null } // Alternative key
  likes_count?: number
  recipe_tags?: { tags: TagData | null }[] | null // Tags from join
}

interface RecipeCardProps {
  recipe: RecipeData
  /** Optional action buttons to render in top-right corner */
  actions?: ReactNode
  /** Use ChefHat icon instead of emoji for placeholder */
  useIconPlaceholder?: boolean
  /** Additional class for the card */
  className?: string
  /** Show tags section (default: false) */
  showTags?: boolean
  /** Show author name (default: false) */
  showAuthor?: boolean
}

export const RecipeCard = memo(function RecipeCard({
  recipe,
  actions,
  useIconPlaceholder = false,
  className,
  showTags = false,
  showAuthor = false
}: RecipeCardProps) {
  const t = useTranslations('recipes')
  const tc = useTranslations('common')
  const td = useTranslations('difficulty')
  const tl = useTranslations('likes')

  const difficulty = recipe.difficulty as Difficulty | null

  // Get author name from either profiles (join) or profile key
  const authorName = recipe.profiles?.display_name || recipe.profile?.display_name

  // Extract tags from join
  const tags = (recipe.recipe_tags || [])
    .map(rt => rt.tags)
    .filter((tag): tag is TagData => tag !== null)
    .slice(0, 3) // Max 3 tags to avoid overflow

  return (
    <Card className={cn(
      "group overflow-hidden h-full border-transparent",
      "rounded-2xl shadow-sm",
      "hover:shadow-lg hover:shadow-primary/8 hover:-translate-y-1",
      "transition-all duration-300 ease-out",
      className
    )}>
      <div className="relative">
        <Link href={`/recipes/${recipe.id}`}>
          <div className="relative aspect-4/3 overflow-hidden bg-muted">
            {recipe.image_url ? (
              <>
                <Image
                  src={recipe.image_url}
                  alt={recipe.title}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
                {useIconPlaceholder ? (
                  <ChefHat className="h-12 w-12 text-primary/40" />
                ) : (
                  <span className="text-4xl">🍽️</span>
                )}
              </div>
            )}
          </div>
        </Link>
        {difficulty && (
          <Badge
            className={cn("absolute top-3 left-3 shadow-sm", DIFFICULTY_COLORS[difficulty])}
            variant="secondary"
          >
            {td(difficulty)}
          </Badge>
        )}
        {actions && (
          <div
            className="absolute top-3 right-3 flex gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
      <CardContent className="p-4 pt-3.5">
        <Link href={`/recipes/${recipe.id}`}>
          <h3 className="font-semibold text-lg leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {recipe.title}
          </h3>
        </Link>
        {recipe.description && (
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>
        )}
        {showTags && tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <Tag className="h-3 w-3 text-primary/50 shrink-0" />
            {tags.map((tag) => (
              <Badge
                key={tag.name}
                variant="warm"
                className="text-xs px-2 py-0 h-5"
                style={tag.color ? { backgroundColor: `${tag.color}15`, color: tag.color } : undefined}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          {recipe.cooking_time && (
            <div className="flex items-center gap-1.5" title={t('cookingTime')}>
              <Clock className="h-3.5 w-3.5 text-primary/60" aria-hidden="true" />
              <span>{recipe.cooking_time} min</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1.5" title={tc('servings')}>
              <Users className="h-3.5 w-3.5 text-primary/60" aria-hidden="true" />
              <span>{recipe.servings}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5" title={tl('like')}>
            <Heart className="h-3.5 w-3.5 text-primary/60" aria-hidden="true" />
            <span>{recipe.likes_count ?? 0}</span>
          </div>
        </div>
        {showAuthor && authorName && (
          <p className="text-xs text-muted-foreground/80 mt-2.5 font-medium">
            {tc('by')} {authorName}
          </p>
        )}
      </CardContent>
    </Card>
  )
})
