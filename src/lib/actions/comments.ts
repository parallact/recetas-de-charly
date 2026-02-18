'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './utils'
import { handleActionError } from './error-utils'

export async function getRecipeComments(recipeId: string) {
  try {
    const comments = await prisma.recipe_comments.findMany({
      where: { recipe_id: recipeId },
      include: {
        users: {
          include: { profiles: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    return {
      success: true,
      data: comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at?.toISOString() || '',
        user_id: comment.user_id,
        user: {
          name: comment.users.profiles?.display_name || comment.users.name || 'Usuario',
          avatar: comment.users.profiles?.avatar_url || comment.users.image || null,
        }
      })),
    }
  } catch (err) {
    return { success: false, data: [], error: handleActionError(err, 'getRecipeComments') }
  }
}

export async function addComment(recipeId: string, content: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error, data: null }
  }

  const trimmed = content.trim()
  if (trimmed.length < 10) {
    return { success: false, error: 'commentTooShort', data: null }
  }
  if (trimmed.length > 500) {
    return { success: false, error: 'commentTooLong', data: null }
  }
  // Reject whitespace-only or newline-only content
  if (!trimmed.replace(/\s/g, '')) {
    return { success: false, error: 'commentTooShort', data: null }
  }

  try {
    const comment = await prisma.recipe_comments.create({
      data: {
        user_id: user.id,
        recipe_id: recipeId,
        content: trimmed,
      },
      include: {
        users: {
          include: { profiles: true }
        }
      }
    })

    return {
      success: true,
      data: {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at?.toISOString() || '',
        user_id: comment.user_id,
        user: {
          name: comment.users.profiles?.display_name || comment.users.name || 'Usuario',
          avatar: comment.users.profiles?.avatar_url || comment.users.image || null,
        }
      }
    }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'addComment'), data: null }
  }
}

export async function deleteComment(commentId: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error }
  }

  try {
    const comment = await prisma.recipe_comments.findUnique({
      where: { id: commentId },
      select: { user_id: true }
    })

    if (!comment || comment.user_id !== user.id) {
      return { success: false, error: 'noPermission' }
    }

    await prisma.recipe_comments.delete({
      where: { id: commentId }
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'deleteComment') }
  }
}
