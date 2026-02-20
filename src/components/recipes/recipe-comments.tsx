'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import { getRecipeComments, addComment, deleteComment } from '@/lib/actions/comments'
import { useTranslations, useLocale } from 'next-intl'

interface CommentUser {
  name: string
  avatar: string | null
}

interface RecipeComment {
  id: string
  content: string
  created_at: string
  user_id: string
  user: CommentUser
}

interface RecipeCommentsProps {
  recipeId: string
  userId?: string | null
}

const MAX_COMMENT_LENGTH = 500
const MIN_COMMENT_LENGTH = 10

export function RecipeComments({ recipeId, userId }: RecipeCommentsProps) {
  const [comments, setComments] = useState<RecipeComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const locale = useLocale()
  const t = useTranslations('comments')
  const te = useTranslations('serverErrors')

  useEffect(() => {
    let isMounted = true

    async function loadComments() {
      const result = await getRecipeComments(recipeId)
      if (!isMounted) return
      if (result.success) {
        setComments(result.data)
      }
      setIsLoading(false)
    }

    loadComments()
    return () => { isMounted = false }
  }, [recipeId])

  const trimmedComment = newComment.trim()
  const canSubmit = trimmedComment.length >= MIN_COMMENT_LENGTH && trimmedComment.length <= MAX_COMMENT_LENGTH && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)

    const result = await addComment(recipeId, trimmedComment)

    if (!result.success) {
      toast.error(result.error ? te(result.error) : t('addError'))
    } else if (result.data) {
      setComments(prev => [result.data!, ...prev])
      setNewComment('')
      toast.success(t('commentAdded'))
    }

    setSubmitting(false)
  }

  const handleDelete = async (commentId: string) => {
    if (deletingId) return
    if (!confirm(t('deleteConfirm'))) return

    setDeletingId(commentId)

    const result = await deleteComment(commentId)

    if (!result.success) {
      toast.error(result.error ? te(result.error) : t('deleteError'))
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success(t('commentDeleted'))
    }

    setDeletingId(null)
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">
          {comments.length > 0
            ? t('titleWithCount', { count: comments.length })
            : t('title')}
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Comment form or login prompt */}
          {userId ? (
            <div className="space-y-3 mb-6">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                placeholder={t('placeholder')}
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t('charCount', { count: trimmedComment.length })}
                  {trimmedComment.length > 0 && trimmedComment.length < MIN_COMMENT_LENGTH && (
                    <span className="text-destructive ml-2">{t('minLength')}</span>
                  )}
                </span>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('publish')
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 mb-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  {t('loginToComment')}
                </Link>
              </p>
            </div>
          )}

          {/* Comments list */}
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 mb-2">
                      {comment.user.avatar ? (
                        <Image
                          src={comment.user.avatar}
                          alt={comment.user.name}
                          width={28}
                          height={28}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {comment.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium">{comment.user.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {new Date(comment.created_at).toLocaleDateString(locale)}
                        </span>
                      </div>
                    </div>
                    {userId === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noComments')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
