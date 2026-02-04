'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './utils'
import { handleActionError } from './error-utils'

// Get user's bookmarks
export async function getUserBookmarks() {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error, data: [] }
  }

  try {
    const bookmarks = await prisma.bookmarks.findMany({
      where: { user_id: user.id },
      include: {
        recipes: {
          include: {
            _count: { select: { recipe_likes: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    const formattedBookmarks = bookmarks
      .filter(b => b.recipes)
      .map(bookmark => {
        const recipe = bookmark.recipes!
        return {
          id: bookmark.id,
          recipe: {
            id: recipe.id,
            title: recipe.title,
            slug: recipe.slug,
            description: recipe.description,
            image_url: recipe.image_url,
            cooking_time: recipe.cooking_time,
            servings: recipe.servings,
            difficulty: recipe.difficulty,
            likes_count: recipe._count.recipe_likes
          }
        }
      })

    return { success: true, data: formattedBookmarks }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'getUserBookmarks'), data: [] }
  }
}

// Toggle bookmark
export async function toggleBookmark(recipeId: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error, isBookmarked: false }
  }

  try {
    const existing = await prisma.bookmarks.findUnique({
      where: {
        user_id_recipe_id: {
          user_id: user.id,
          recipe_id: recipeId
        }
      }
    })

    if (existing) {
      await prisma.bookmarks.delete({
        where: { id: existing.id }
      })
      revalidatePath('/bookmarks')
      return { success: true, isBookmarked: false }
    } else {
      await prisma.bookmarks.create({
        data: {
          user_id: user.id,
          recipe_id: recipeId
        }
      })
      revalidatePath('/bookmarks')
      return { success: true, isBookmarked: true }
    }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'toggleBookmark'), isBookmarked: false }
  }
}

// Check if recipe is bookmarked
export async function isRecipeBookmarked(recipeId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return false
  }

  try {
    const bookmark = await prisma.bookmarks.findUnique({
      where: {
        user_id_recipe_id: {
          user_id: session.user.id,
          recipe_id: recipeId
        }
      }
    })
    return !!bookmark
  } catch {
    return false
  }
}

// Delete bookmark
export async function deleteBookmark(bookmarkId: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error }
  }

  try {
    const bookmark = await prisma.bookmarks.findUnique({
      where: { id: bookmarkId },
      select: { user_id: true }
    })

    if (!bookmark || bookmark.user_id !== user.id) {
      return { success: false, error: 'No tienes permiso' }
    }

    await prisma.bookmarks.delete({
      where: { id: bookmarkId }
    })

    revalidatePath('/bookmarks')
    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'deleteBookmark') }
  }
}
