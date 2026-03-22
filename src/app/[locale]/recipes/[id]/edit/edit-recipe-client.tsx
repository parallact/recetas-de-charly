'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { INGREDIENT_UNITS } from '@/lib/constants'
import { RecipeForm } from '@/components/recipes/recipe-form'
import type { RecipeFormData } from '@/lib/schemas/recipe'
import type { Category } from '@/lib/types'
import { useTranslations } from 'next-intl'

interface TagData {
  id: string
  name: string
  slug: string
  is_default?: boolean
}

interface RecipeData {
  id: string
  title: string
  description: string | null
  image_url: string | null
  prep_time: number | null
  cooking_time: number | null
  servings: number | null
  difficulty: string | null
  recipe_ingredients: {
    quantity: number | null
    unit: string | null
    ingredients: { name: string } | null
  }[]
  instructions: {
    content: string | null
  }[]
  recipe_categories: {
    category_id: string
  }[]
  recipe_tags: {
    tag_id: string
  }[]
}

interface EditRecipeClientProps {
  recipe: RecipeData
  categories: Category[]
  tags: TagData[]
}

export function EditRecipeClient({ recipe, categories, tags }: EditRecipeClientProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const ta = useTranslations('auth')

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      toast.error(ta('loginToEditRecipe'))
      router.push('/login')
    }
  }, [session, status, router, ta])

  // Process ingredients (before hooks guard)
  const ingredients = (recipe.recipe_ingredients || []).map((ri) => {
    const isCustomUnit = ri.unit && !INGREDIENT_UNITS.find(u => u.value === ri.unit)
    return {
      name: ri.ingredients?.name || '',
      quantity: ri.quantity?.toString() || '',
      unit: isCustomUnit ? 'otro' : (ri.unit || ''),
      customUnit: isCustomUnit ? (ri.unit || '') : '',
    }
  })

  // Process instructions
  const instructions = (recipe.instructions || []).map((inst) => ({
    content: inst.content || '',
  }))

  const categoryIds = (recipe.recipe_categories || []).map((rc) => rc.category_id)
  const tagIds = (recipe.recipe_tags || []).map((rt) => rt.tag_id)

  // Memoized so form.reset doesn't fire on every re-render (e.g. session refresh)
  const initialData = useMemo<RecipeFormData>(() => ({
    title: recipe.title,
    description: recipe.description || '',
    imageUrl: recipe.image_url || '',
    prepTime: recipe.prep_time?.toString() || '',
    cookingTime: recipe.cooking_time?.toString() || '',
    servings: recipe.servings || 4,
    difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard' | undefined,
    ingredients: ingredients.length > 0 ? ingredients : [{ name: '', quantity: '', unit: '', customUnit: '' }],
    instructions: instructions.length > 0 ? instructions : [{ content: '' }],
    categoryIds,
  }), [recipe]) // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading' || !session?.user) {
    return null
  }

  return (
    <RecipeForm
      mode="edit"
      recipeId={recipe.id}
      initialData={initialData}
      initialCategories={categoryIds}
      initialTags={tagIds}
      backUrl="/my-recipes"
      serverCategories={categories}
      serverTags={tags}
    />
  )
}
