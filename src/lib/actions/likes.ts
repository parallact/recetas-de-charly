'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './utils'
import { handleActionError } from './error-utils'

// Get like count for a recipe
export async function getLikeCount(recipeId: string) {
  try {
    const count = await prisma.recipe_likes.count({
      where: { recipe_id: recipeId }
    })
    return count
  } catch {
    return 0
  }
}

// Check if current user has liked a recipe
export async function isRecipeLiked(recipeId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  try {
    const like = await prisma.recipe_likes.findUnique({
      where: {
        user_id_recipe_id: {
          user_id: session.user.id,
          recipe_id: recipeId
        }
      }
    })
    return !!like
  } catch {
    return false
  }
}

// Get like status and count for a recipe
export async function getLikeStatus(recipeId: string) {
  const session = await auth()

  try {
    const count = await prisma.recipe_likes.count({
      where: { recipe_id: recipeId }
    })

    if (!session?.user?.id) {
      return { isLiked: false, count, userId: null }
    }

    const like = await prisma.recipe_likes.findUnique({
      where: {
        user_id_recipe_id: {
          user_id: session.user.id,
          recipe_id: recipeId
        }
      }
    })

    return { isLiked: !!like, count, userId: session.user.id }
  } catch {
    return { isLiked: false, count: 0, userId: null }
  }
}

// Toggle like on a recipe
export async function toggleLike(recipeId: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error, isLiked: false }
  }

  try {
    const existing = await prisma.recipe_likes.findUnique({
      where: {
        user_id_recipe_id: {
          user_id: user.id,
          recipe_id: recipeId
        }
      }
    })

    if (existing) {
      await prisma.recipe_likes.delete({
        where: { id: existing.id }
      })
      revalidatePath(`/recipes/${recipeId}`)
      return { success: true, isLiked: false }
    } else {
      await prisma.recipe_likes.create({
        data: {
          user_id: user.id,
          recipe_id: recipeId
        }
      })
      revalidatePath(`/recipes/${recipeId}`)
      return { success: true, isLiked: true }
    }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'toggleLike'), isLiked: false }
  }
}
