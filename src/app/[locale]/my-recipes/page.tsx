'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { getUserRecipes, deleteRecipe } from '@/lib/actions/recipes'

interface Recipe {
  id: string
  title: string
  slug: string
  description: string | null
  image_url: string | null
  cooking_time: number | null
  servings: number | null
  difficulty: string | null
  created_at: string
  likes_count: number
}

export default function MyRecipesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const t = useTranslations('myRecipes')
  const tc = useTranslations('common')
  const tr = useTranslations('recipes')
  const ta = useTranslations('auth')
  const te = useTranslations('serverErrors')

  const loadRecipes = useCallback(async () => {
    if (status === 'loading') return

    if (!session?.user) {
      toast.error(ta('loginToMyRecipes'))
      router.push('/login')
      return
    }

    const result = await getUserRecipes()

    if (!result.success) {
      toast.error(result.error ? te(result.error) : t('noRecipes'))
    } else {
      setRecipes(result.data)
    }

    setLoading(false)
  }, [session, status, router, ta])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)

    try {
      const result = await deleteRecipe(deleteId)

      if (!result.success) {
        throw new Error(result.error || tr('deleteError'))
      }

      setRecipes(recipes.filter(r => r.id !== deleteId))
      toast.success(tr('recipeDeleted'))
    } catch {
      toast.error(tr('deleteError'))
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-4/3" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
      </div>

      {recipes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              actions={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 opacity-70 hover:opacity-100 focus:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm"
                      aria-label={t('recipeOptions')}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/recipes/${recipe.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('edit')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteId(recipe.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tc('delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-4xl mb-4">📝</p>
              <h3 className="text-xl font-semibold mb-2">{t('noRecipes')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('noRecipesHint')}
              </p>
              <Button asChild>
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  {t('createFirst')}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('deleteRecipe')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr('deleteRecipeConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tr('deleting')}
                </>
              ) : (
                tc('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
