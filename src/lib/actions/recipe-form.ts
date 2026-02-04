'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './utils'
import { handleActionError, isPrismaError } from './error-utils'

interface IngredientInput {
  name: string
  quantity: number | null
  unit: string | null
}

interface InstructionInput {
  content: string
}

interface RecipeFormInput {
  title: string
  slug: string
  description: string | null
  image_url: string | null
  prep_time: number | null
  cooking_time: number | null
  servings: number
  difficulty: string
  is_public: boolean
  ingredients: IngredientInput[]
  instructions: InstructionInput[]
  category_ids: string[]
  tag_ids: string[]
}

// Create a new recipe atomically
export async function createRecipe(input: RecipeFormInput) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error, recipeId: null }
  }

  try {
    const recipeId = await prisma.$transaction(async (tx) => {
      // Create the recipe
      const recipe = await tx.recipes.create({
        data: {
          user_id: user.id,
          title: input.title,
          slug: input.slug,
          description: input.description,
          image_url: input.image_url,
          prep_time: input.prep_time,
          cooking_time: input.cooking_time,
          servings: input.servings,
          difficulty: input.difficulty,
          is_public: input.is_public,
        }
      })

      // Create ingredients
      for (let i = 0; i < input.ingredients.length; i++) {
        const ing = input.ingredients[i]

        // Find or create ingredient
        let ingredient = await tx.ingredients.findFirst({
          where: { name: ing.name.toLowerCase() }
        })

        if (!ingredient) {
          ingredient = await tx.ingredients.create({
            data: { name: ing.name.toLowerCase() }
          })
        }

        // Create recipe_ingredient
        await tx.recipe_ingredients.create({
          data: {
            recipe_id: recipe.id,
            ingredient_id: ingredient.id,
            quantity: ing.quantity,
            unit: ing.unit,
            order_index: i,
          }
        })
      }

      // Create instructions
      for (let i = 0; i < input.instructions.length; i++) {
        await tx.instructions.create({
          data: {
            recipe_id: recipe.id,
            step_number: i + 1,
            content: input.instructions[i].content,
          }
        })
      }

      // Create recipe categories
      for (const categoryId of input.category_ids) {
        await tx.recipe_categories.create({
          data: {
            recipe_id: recipe.id,
            category_id: categoryId,
          }
        })
      }

      // Create recipe tags
      for (const tagId of input.tag_ids) {
        await tx.recipe_tags.create({
          data: {
            recipe_id: recipe.id,
            tag_id: tagId,
          }
        })
      }

      return recipe.id
    })

    revalidatePath('/recipes')
    revalidatePath('/my-recipes')

    return { success: true, recipeId }
  } catch (err) {
    if (isPrismaError(err) && err.code === 'P2002') {
      return { success: false, error: 'Ya tienes una receta con ese nombre', recipeId: null }
    }
    return { success: false, error: handleActionError(err, 'createRecipe'), recipeId: null }
  }
}

// Update an existing recipe atomically
export async function updateRecipe(recipeId: string, input: RecipeFormInput) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error }
  }

  try {
    // Verify ownership
    const existingRecipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true }
    })

    if (!existingRecipe || existingRecipe.user_id !== user.id) {
      return { success: false, error: 'No tienes permiso para editar esta receta' }
    }

    await prisma.$transaction(async (tx) => {
      // Update the recipe
      await tx.recipes.update({
        where: { id: recipeId },
        data: {
          title: input.title,
          slug: input.slug,
          description: input.description,
          image_url: input.image_url,
          prep_time: input.prep_time,
          cooking_time: input.cooking_time,
          servings: input.servings,
          difficulty: input.difficulty,
          is_public: input.is_public,
          updated_at: new Date(),
        }
      })

      // Delete existing ingredients, instructions, categories, tags
      await tx.recipe_ingredients.deleteMany({ where: { recipe_id: recipeId } })
      await tx.instructions.deleteMany({ where: { recipe_id: recipeId } })
      await tx.recipe_categories.deleteMany({ where: { recipe_id: recipeId } })
      await tx.recipe_tags.deleteMany({ where: { recipe_id: recipeId } })

      // Recreate ingredients
      for (let i = 0; i < input.ingredients.length; i++) {
        const ing = input.ingredients[i]

        let ingredient = await tx.ingredients.findFirst({
          where: { name: ing.name.toLowerCase() }
        })

        if (!ingredient) {
          ingredient = await tx.ingredients.create({
            data: { name: ing.name.toLowerCase() }
          })
        }

        await tx.recipe_ingredients.create({
          data: {
            recipe_id: recipeId,
            ingredient_id: ingredient.id,
            quantity: ing.quantity,
            unit: ing.unit,
            order_index: i,
          }
        })
      }

      // Recreate instructions
      for (let i = 0; i < input.instructions.length; i++) {
        await tx.instructions.create({
          data: {
            recipe_id: recipeId,
            step_number: i + 1,
            content: input.instructions[i].content,
          }
        })
      }

      // Recreate categories
      for (const categoryId of input.category_ids) {
        await tx.recipe_categories.create({
          data: {
            recipe_id: recipeId,
            category_id: categoryId,
          }
        })
      }

      // Recreate tags
      for (const tagId of input.tag_ids) {
        await tx.recipe_tags.create({
          data: {
            recipe_id: recipeId,
            tag_id: tagId,
          }
        })
      }
    })

    revalidatePath(`/recipes/${recipeId}`)
    revalidatePath('/my-recipes')

    return { success: true }
  } catch (err) {
    if (isPrismaError(err) && err.code === 'P2002') {
      return { success: false, error: 'Ya tienes una receta con ese nombre' }
    }
    return { success: false, error: handleActionError(err, 'updateRecipe') }
  }
}
