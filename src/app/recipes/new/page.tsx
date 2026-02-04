'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { RecipeForm } from '@/components/recipes/recipe-form'

export default function NewRecipePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      toast.error('Debes iniciar sesion para crear recetas')
      router.push('/login')
    }
  }, [session, status, router])

  if (status === 'loading' || !session?.user) {
    return null
  }

  return <RecipeForm mode="create" backUrl="/recipes" />
}
