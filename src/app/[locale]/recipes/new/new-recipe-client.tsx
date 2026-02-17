'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { RecipeForm } from '@/components/recipes/recipe-form'
import { useTranslations } from 'next-intl'
import type { Category } from '@/lib/types'

interface TagData {
  id: string
  name: string
  slug: string
  is_default?: boolean
}

interface NewRecipeClientProps {
  categories: Category[]
  tags: TagData[]
}

export function NewRecipeClient({ categories, tags }: NewRecipeClientProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const ta = useTranslations('auth')

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      toast.error(ta('loginToCreateRecipe'))
      router.push('/login')
    }
  }, [session, status, router, ta])

  if (status === 'loading' || !session?.user) {
    return null
  }

  return (
    <RecipeForm
      mode="create"
      backUrl="/recipes"
      serverCategories={categories}
      serverTags={tags}
    />
  )
}
