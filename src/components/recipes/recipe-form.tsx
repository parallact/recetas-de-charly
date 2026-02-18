'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { ChefHat, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { recipeSchema, generateSlug, type RecipeFormData } from '@/lib/schemas/recipe'
import { RecipeFormFields } from './recipe-form-fields'
// Use API routes instead of server actions (server action re-render causes RSC errors)
import { useTranslations } from 'next-intl'

interface TagData {
  id: string
  name: string
  slug: string
  is_default?: boolean
}

interface RecipeFormProps {
  mode: 'create' | 'edit'
  recipeId?: string
  initialData?: RecipeFormData
  initialCategories?: string[]
  initialTags?: string[]
  backUrl?: string
  serverCategories?: import('@/lib/types').Category[]
  serverTags?: TagData[]
}

const defaultFormValues: RecipeFormData = {
  title: '',
  description: '',
  imageUrl: '',
  prepTime: '',
  cookingTime: '',
  servings: 4,
  difficulty: undefined,
  ingredients: [{ name: '', quantity: '', unit: '', customUnit: '' }],
  instructions: [{ content: '' }],
  categoryIds: [],
}

export function RecipeForm({
  mode,
  recipeId,
  initialData,
  initialCategories = [],
  initialTags = [],
  backUrl = '/recipes',
  serverCategories,
  serverTags,
}: RecipeFormProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const t = useTranslations('recipeForm')
  const tc = useTranslations('common')
  const te = useTranslations('serverErrors')

  const [loading, setLoading] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)

  // Refs for tracking previous values and current state (avoids re-registering listeners)
  const prevCategoriesRef = useRef<string>(JSON.stringify(initialCategories))
  const prevTagsRef = useRef<string>(JSON.stringify(initialTags))
  const formStateRef = useRef({ isDirty: false, hasCategories: false })

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema) as Resolver<RecipeFormData>,
    defaultValues: initialData || defaultFormValues,
  })

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    }
  }, [initialData, form])

  // Update categories when initialCategories changes (proper deep comparison)
  useEffect(() => {
    const serialized = JSON.stringify(initialCategories)
    if (serialized !== prevCategoriesRef.current) {
      prevCategoriesRef.current = serialized
      setSelectedCategories(initialCategories)
    }
  }, [initialCategories])

  // Update tags when initialTags changes (proper deep comparison)
  useEffect(() => {
    const serialized = JSON.stringify(initialTags)
    if (serialized !== prevTagsRef.current) {
      prevTagsRef.current = serialized
      setSelectedTags(initialTags)
    }
  }, [initialTags])

  // Keep ref in sync with form state (for beforeunload handler)
  useEffect(() => {
    formStateRef.current = {
      isDirty: form.formState.isDirty,
      hasCategories: mode === 'create' && selectedCategories.length > 0,
    }
  }, [form.formState.isDirty, selectedCategories, mode])

  // Warn before leaving with unsaved changes (stable handler, no re-registration)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formStateRef.current.isDirty || formStateRef.current.hasCategories) {
        e.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId)
      }
      if (prev.length >= 3) {
        toast.error(t('maxCategoriesReached'))
        return prev
      }
      return [...prev, categoryId]
    })
  }, [t])

  const onSubmit = async (data: RecipeFormData) => {
    if (status === 'loading') return

    if (!session?.user) {
      toast.error(tc('requireLogin'))
      router.push('/login')
      return
    }

    // Filter out empty ingredients and instructions
    const validIngredients = data.ingredients.filter(i => i.name.trim())
    const validInstructions = data.instructions.filter(i => i.content.trim())

    if (validIngredients.length === 0) {
      toast.error(t('addIngredientError'))
      return
    }

    if (validInstructions.length === 0) {
      toast.error(t('addStepError'))
      return
    }

    if (selectedCategories.length === 0) {
      toast.error(t('addCategoryError'))
      return
    }

    setLoading(true)

    try {
      const slug = generateSlug(data.title)

      // Prepare ingredients
      const ingredientsJson = validIngredients.map(ing => ({
        name: ing.name.trim().toLowerCase(),
        quantity: ing.quantity ? parseFloat(ing.quantity) : null,
        unit: ing.unit === 'otro' ? ing.customUnit?.trim() || null : ing.unit || null,
      }))

      // Prepare instructions
      const instructionsJson = validInstructions.map(inst => ({
        content: inst.content.trim(),
      }))

      const formInput = {
        title: data.title.trim(),
        slug,
        description: data.description?.trim() || null,
        image_url: data.imageUrl?.trim() || null,
        prep_time: data.prepTime ? parseInt(data.prepTime, 10) : null,
        cooking_time: data.cookingTime ? parseInt(data.cookingTime, 10) : null,
        servings: data.servings || 4,
        difficulty: data.difficulty || 'medium',
        is_public: true,
        ingredients: ingredientsJson,
        instructions: instructionsJson,
        category_ids: selectedCategories,
        tag_ids: selectedTags,
      }

      if (mode === 'create') {
        const resp = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formInput),
        })
        const result = await resp.json()

        if (!result.success) {
          toast.error(result.error ? te(result.error) : t('createError'))
          return
        }

        toast.success(t('createSuccess'))
        router.push(`/recipes/${result.recipeId}`)
      } else {
        if (!recipeId) {
          toast.error(t('idNotFound'))
          return
        }

        const resp = await fetch(`/api/recipes/${recipeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formInput),
        })
        const result = await resp.json()

        if (!result.success) {
          toast.error(result.error ? te(result.error) : t('updateError'))
          return
        }

        toast.success(t('updateSuccess'))
        router.push(`/recipes/${recipeId}`)
      }
    } catch {
      toast.error(mode === 'create' ? t('createError') : t('updateError'))
    } finally {
      setLoading(false)
    }
  }

  const isCreate = mode === 'create'

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isCreate ? tc('backToRecipes') : tc('backToMyRecipes')}
          </Link>
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{isCreate ? t('newRecipe') : t('editRecipe')}</CardTitle>
              <CardDescription>
                {isCreate
                  ? t('shareSubtitle')
                  : t('editSubtitle')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <RecipeFormFields
                form={form}
                selectedCategories={selectedCategories}
                onToggleCategory={toggleCategory}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                serverCategories={serverCategories}
                serverTags={serverTags}
              />

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
                <Button type="button" variant="outline" asChild>
                  <Link href={backUrl}>{tc('cancel')}</Link>
                </Button>
                <Button type="submit" disabled={loading} size="lg">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tc('saving')}
                    </>
                  ) : isCreate ? (
                    t('publish')
                  ) : (
                    t('saveChanges')
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
