'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Bookmark, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { isRecipeBookmarked, toggleBookmark } from '@/lib/actions/bookmarks'
import { useTranslations } from 'next-intl'

interface BookmarkButtonProps {
  recipeId: string
  initialBookmarked?: boolean
  variant?: 'default' | 'icon'
  className?: string
}

export function BookmarkButton({
  recipeId,
  initialBookmarked = false,
  variant = 'default',
  className,
}: BookmarkButtonProps) {
  const { data: session, status } = useSession()
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const isMounted = useRef(true)
  const t = useTranslations('bookmarks')
  const ta = useTranslations('auth')

  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])

  const checkBookmarkStatus = useCallback(async () => {
    if (status === 'loading') return

    if (!session?.user) {
      setIsChecking(false)
      return
    }

    const bookmarked = await isRecipeBookmarked(recipeId)

    if (!isMounted.current) return
    setIsBookmarked(bookmarked)
    setIsChecking(false)
  }, [session, status, recipeId])

  useEffect(() => {
    checkBookmarkStatus()
  }, [checkBookmarkStatus])

  const handleToggleBookmark = async () => {
    if (!session?.user) {
      toast.error(ta('loginToBookmark'))
      return
    }

    // Prevent rapid clicks
    if (isLoading) return

    setIsLoading(true)
    const previousState = isBookmarked

    // Optimistic update
    setIsBookmarked(!isBookmarked)

    try {
      const result = await toggleBookmark(recipeId)

      if (!result.success) {
        throw new Error(result.error || t('bookmarkError'))
      }

      if (isMounted.current) {
        toast.success(result.isBookmarked ? t('bookmarkSaved') : t('bookmarkRemoved'))
      }
    } catch {
      // Revert optimistic update on error
      if (isMounted.current) {
        setIsBookmarked(previousState)
        toast.error(t('updateError'))
      }
    } finally {
      if (isMounted.current) setIsLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleBookmark}
        disabled={isLoading || isChecking}
        className={cn(
          'transition-colors',
          isBookmarked && 'text-primary',
          className
        )}
        title={isBookmarked ? t('removeTitle') : t('saveTitle')}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Bookmark
            className={cn('h-5 w-5', isBookmarked && 'fill-current')}
          />
        )}
      </Button>
    )
  }

  return (
    <Button
      variant={isBookmarked ? 'default' : 'outline'}
      onClick={handleToggleBookmark}
      disabled={isLoading || isChecking}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Bookmark
          className={cn('h-4 w-4 mr-2', isBookmarked && 'fill-current')}
        />
      )}
      {isBookmarked ? t('bookmarked') : t('bookmark')}
    </Button>
  )
}
