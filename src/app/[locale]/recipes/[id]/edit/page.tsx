'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { INGREDIENT_UNITS } from '@/lib/constants'
import { RecipeForm } from '@/components/recipes/recipe-form'
import { getRecipeForEdit } from '@/lib/actions/recipes'
import type { RecipeFormData } from '@/lib/schemas/recipe'
import { useTranslations } from 'next-intl'

export default function EditRecipePage() {
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string
  const { data: session, status } = useSession()
  const ta = useTranslations('auth')
  const te = useTranslations('serverErrors')

  const [initialLoading, setInitialLoading] = useState(true)
  const [initialData, setInitialData] = useState<RecipeFormData | null>(null)
  const [initialCategories, setInitialCategories] = useState<string[]>([])
  const [initialTags, setInitialTags] = useState<string[]>([])

  useEffect(() => {
    async function loadRecipeData() {
      if (status === 'loading') return

      if (!session?.user) {
        toast.error(ta('loginToEditRecipe'))
        router.push('/login')
        return
      }

      if (!recipeId) return

      const result = await getRecipeForEdit(recipeId)

      if (!result.success || !result.data) {
        toast.error(result.error ? te(result.error) : te('recipeNotFound'))
        router.push('/my-recipes')
        return
      }

      const recipe = result.data

      // Process ingredients
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

      // Set initial data
      setInitialData({
        title: recipe.title,
        description: recipe.description || '',
        imageUrl: recipe.image_url || '',
        prepTime: recipe.prep_time?.toString() || '',
        cookingTime: recipe.cooking_time?.toString() || '',
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard' | undefined,
        ingredients: ingredients.length > 0 ? ingredients : [{ name: '', quantity: '', unit: '', customUnit: '' }],
        instructions: instructions.length > 0 ? instructions : [{ content: '' }],
        categoryIds: [],
      })

      // Set categories
      const categoryIds = (recipe.recipe_categories || []).map((rc) => rc.category_id)
      setInitialCategories(categoryIds)

      // Set tags
      const tagIds = (recipe.recipe_tags || []).map((rt) => rt.tag_id)
      setInitialTags(tagIds)

      setInitialLoading(false)
    }

    loadRecipeData()
  }, [session, status, recipeId, router, ta])

  if (initialLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-9 w-36" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!initialData) {
    return null
  }

  return (
    <RecipeForm
      mode="edit"
      recipeId={recipeId}
      initialData={initialData}
      initialCategories={initialCategories}
      initialTags={initialTags}
      backUrl="/my-recipes"
    />
  )
}
