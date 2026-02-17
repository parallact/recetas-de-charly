'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { RecipeForm } from '@/components/recipes/recipe-form'
import { testServerAction } from '@/lib/actions/test-action'
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

  const handleTestAction = async () => {
    try {
      const result = await testServerAction('Test From Button')
      alert('Result: ' + JSON.stringify(result))
    } catch (err) {
      alert('THREW: ' + String(err))
    }
  }

  return (
    <>
      <div className="p-4 bg-yellow-100 m-4">
        <button onClick={handleTestAction} className="px-4 py-2 bg-blue-500 text-white rounded">
          TEST SERVER ACTION
        </button>
      </div>
      <RecipeForm
        mode="create"
        backUrl="/recipes"
        serverCategories={categories}
        serverTags={tags}
      />
    </>
  )
}
