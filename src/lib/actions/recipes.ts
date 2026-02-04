'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './utils'
import { handleActionError } from './error-utils'

// Get user's recipes
export async function getUserRecipes() {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error, data: [] }
  }

  try {
    const recipes = await prisma.recipes.findMany({
      where: { user_id: user.id },
      include: {
        _count: { select: { recipe_likes: true } }
      },
      orderBy: { created_at: 'desc' }
    })

    const formattedRecipes = recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      image_url: recipe.image_url,
      cooking_time: recipe.cooking_time,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      created_at: recipe.created_at?.toISOString() || '',
      likes_count: recipe._count.recipe_likes
    }))

    return { success: true, data: formattedRecipes }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'getUserRecipes'), data: [] }
  }
}

// Delete a recipe
export async function deleteRecipe(recipeId: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error }
  }

  try {
    // Verify ownership
    const recipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true }
    })

    if (!recipe || recipe.user_id !== user.id) {
      return { success: false, error: 'No tienes permiso para eliminar esta receta' }
    }

    await prisma.recipes.delete({
      where: { id: recipeId }
    })

    revalidatePath('/my-recipes')
    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'deleteRecipe') }
  }
}

// Get recipe for editing
export async function getRecipeForEdit(recipeId: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error, data: null }
  }

  try {
    const recipe = await prisma.recipes.findFirst({
      where: {
        id: recipeId,
        user_id: user.id
      },
      include: {
        recipe_ingredients: {
          include: { ingredients: true },
          orderBy: { order_index: 'asc' }
        },
        instructions: {
          orderBy: { step_number: 'asc' }
        },
        recipe_categories: true,
        recipe_tags: true
      }
    })

    if (!recipe) {
      return { success: false, error: 'Receta no encontrada', data: null }
    }

    return { success: true, data: recipe }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'getRecipeForEdit'), data: null }
  }
}
