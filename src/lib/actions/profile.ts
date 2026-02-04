'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireAuth } from './utils'
import { handleActionError } from './error-utils'

interface ProfileData {
  display_name?: string | null
  avatar_url?: string | null
  bio?: string | null
}

// Get user profile
export async function getUserProfile() {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error, data: null }
  }

  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: user.id }
    })

    if (!profile) {
      return { success: false, error: 'Perfil no encontrado', data: null }
    }

    return {
      success: true,
      data: {
        id: profile.id,
        email: user.email || '',
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        created_at: profile.created_at?.toISOString() || '',
      }
    }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'getUserProfile'), data: null }
  }
}

// Update user profile
export async function updateUserProfile(data: ProfileData) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error }
  }

  try {
    await prisma.profiles.update({
      where: { id: user.id },
      data: {
        display_name: data.display_name?.trim() || null,
        avatar_url: data.avatar_url?.trim() || null,
        bio: data.bio?.trim() || null,
        updated_at: new Date(),
      }
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'updateUserProfile') }
  }
}

// Get user stats (recipes, bookmarks, likes)
export async function getUserStats() {
  const session = await auth()
  if (!session?.user?.id) {
    return { recipes: 0, bookmarks: 0, likes: 0 }
  }

  try {
    const [recipesCount, bookmarksCount, likesCount] = await Promise.all([
      prisma.recipes.count({ where: { user_id: session.user.id } }),
      prisma.bookmarks.count({ where: { user_id: session.user.id } }),
      prisma.recipe_likes.count({ where: { user_id: session.user.id } }),
    ])

    return {
      recipes: recipesCount,
      bookmarks: bookmarksCount,
      likes: likesCount,
    }
  } catch {
    return { recipes: 0, bookmarks: 0, likes: 0 }
  }
}
