'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Bookmark, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { getUserBookmarks, deleteBookmark } from '@/lib/actions/bookmarks'

interface BookmarkedRecipe {
  id: string
  recipe: {
    id: string
    title: string
    slug: string
    description: string | null
    image_url: string | null
    cooking_time: number | null
    servings: number | null
    difficulty: string | null
    likes_count: number
  }
}

export default function BookmarksPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [bookmarks, setBookmarks] = useState<BookmarkedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteBookmarkId, setDeleteBookmarkId] = useState<string | null>(null)

  const t = useTranslations('bookmarks')
  const tc = useTranslations('common')
  const ta = useTranslations('auth')
  const te = useTranslations('serverErrors')

  useEffect(() => {
    async function loadBookmarks() {
      if (status === 'loading') return

      if (!session?.user) {
        toast.error(ta('loginToBookmarks'))
        router.push('/login')
        return
      }

      const result = await getUserBookmarks()

      if (!result.success) {
        toast.error(result.error ? te(result.error) : t('loadError'))
      } else {
        setBookmarks(result.data)
      }

      setLoading(false)
    }

    loadBookmarks()
  }, [session, status, router, t, ta])

  const confirmRemoveBookmark = async () => {
    if (!deleteBookmarkId) return

    const result = await deleteBookmark(deleteBookmarkId)

    if (!result.success) {
      toast.error(result.error ? te(result.error) : t('removeError'))
    } else {
      setBookmarks(bookmarks.filter((b) => b.id !== deleteBookmarkId))
      toast.success(t('bookmarkRemoved'))
    }
    setDeleteBookmarkId(null)
  }

  if (loading || status === 'loading') {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
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
      <div className="mb-8 flex items-center gap-3">
        <Bookmark className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {bookmarks.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarks.map((bookmark) => (
            <RecipeCard
              key={bookmark.id}
              recipe={bookmark.recipe}
              actions={
                <Button
                  variant="destructive"
                  size="icon"
                  className="opacity-70 hover:opacity-100 focus:opacity-100 transition-opacity"
                  onClick={() => setDeleteBookmarkId(bookmark.id)}
                  aria-label={t('removeBookmark')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-4xl mb-4">📚</p>
          <h3 className="text-xl font-semibold mb-2">{t('noBookmarks')}</h3>
          <p className="text-muted-foreground mb-6">
            {t('noBookmarksHint')}
          </p>
          <Button asChild>
            <Link href="/recipes">{tc('exploreRecipes')}</Link>
          </Button>
        </div>
      )}

      <AlertDialog open={!!deleteBookmarkId} onOpenChange={(open) => !open && setDeleteBookmarkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeBookmark')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('removeConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveBookmark}>
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
