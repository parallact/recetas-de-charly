'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Bookmark, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { isRecipeBookmarked, toggleBookmark } from '@/lib/actions/bookmarks'

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
      toast.error('Debes iniciar sesion para guardar recetas')
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
        throw new Error(result.error || 'Error al guardar')
      }

      if (isMounted.current) {
        toast.success(result.isBookmarked ? 'Receta guardada' : 'Receta eliminada de guardados')
      }
    } catch {
      // Revert optimistic update on error
      if (isMounted.current) {
        setIsBookmarked(previousState)
        toast.error('Error al actualizar guardados')
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
        title={isBookmarked ? 'Quitar de guardados' : 'Guardar receta'}
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
      {isBookmarked ? 'Guardada' : 'Guardar'}
    </Button>
  )
}
