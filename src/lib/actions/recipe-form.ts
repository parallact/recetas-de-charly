'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './utils'
import { handleActionError, isPrismaError } from './error-utils'

const ingredientInputSchema = z.object({
  name: z.string().min(1).max(100).trim().regex(/^[A-Za-zÀ-ÿñÑ\s]+$/),
  quantity: z.number().min(0).nullable(),
  unit: z.string().max(50).nullable(),
})

const instructionInputSchema = z.object({
  content: z.string().min(1).max(1000).trim(),
})

const recipeInputSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  slug: z.string().min(1).max(200),
  description: z.string().max(500).nullable(),
  image_url: z.union([z.string().url(), z.literal(''), z.null()]),
  prep_time: z.number().int().min(0).max(1440).nullable(),
  cooking_time: z.number().int().min(0).max(1440).nullable(),
  servings: z.number().int().min(1).max(50),
  difficulty: z.string().min(1).max(20),
  is_public: z.boolean(),
  ingredients: z.array(ingredientInputSchema).min(1),
  instructions: z.array(instructionInputSchema).min(1),
  category_ids: z.array(z.string()),
  tag_ids: z.array(z.string()).max(7),
})

type RecipeFormInput = z.infer<typeof recipeInputSchema>

// Create a new recipe atomically
export async function createRecipe(input: RecipeFormInput) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error, recipeId: null }
  }

  const parsed = recipeInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'invalidRecipeData', recipeId: null }
  }

  const data = parsed.data

  try {
    const recipeId = await prisma.$transaction(async (tx) => {
      // Create the recipe
      const recipe = await tx.recipes.create({
        data: {
          user_id: user.id,
          title: data.title,
          slug: data.slug,
          description: data.description,
          image_url: data.image_url,
          prep_time: data.prep_time,
          cooking_time: data.cooking_time,
          servings: data.servings,
          difficulty: data.difficulty,
          is_public: data.is_public,
        }
      })

      // Upsert ingredients and create recipe_ingredients
      for (let i = 0; i < data.ingredients.length; i++) {
        const ing = data.ingredients[i]
        const name = ing.name.toLowerCase()

        const ingredient = await tx.ingredients.upsert({
          where: { name },
          create: { name },
          update: {},
        })

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

      // Batch create instructions
      if (data.instructions.length > 0) {
        await tx.instructions.createMany({
          data: data.instructions.map((inst, i) => ({
            recipe_id: recipe.id,
            step_number: i + 1,
            content: inst.content,
          }))
        })
      }

      // Batch create recipe categories
      if (data.category_ids.length > 0) {
        await tx.recipe_categories.createMany({
          data: data.category_ids.map(categoryId => ({
            recipe_id: recipe.id,
            category_id: categoryId,
          }))
        })
      }

      // Batch create recipe tags
      if (data.tag_ids.length > 0) {
        await tx.recipe_tags.createMany({
          data: data.tag_ids.map(tagId => ({
            recipe_id: recipe.id,
            tag_id: tagId,
          }))
        })
      }

      return recipe.id
    })

    revalidatePath('/recipes')
    revalidatePath('/my-recipes')

    return { success: true, recipeId }
  } catch (err) {
    if (isPrismaError(err) && err.code === 'P2002') {
      return { success: false, error: 'duplicateRecipeName', recipeId: null }
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

  const parsed = recipeInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'invalidRecipeData' }
  }

  const data = parsed.data

  try {
    // Verify ownership
    const existingRecipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true }
    })

    if (!existingRecipe || existingRecipe.user_id !== user.id) {
      return { success: false, error: 'noEditPermission' }
    }

    await prisma.$transaction(async (tx) => {
      // Update the recipe
      await tx.recipes.update({
        where: { id: recipeId },
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          image_url: data.image_url,
          prep_time: data.prep_time,
          cooking_time: data.cooking_time,
          servings: data.servings,
          difficulty: data.difficulty,
          is_public: data.is_public,
          updated_at: new Date(),
        }
      })

      // Delete existing ingredients, instructions, categories, tags
      await tx.recipe_ingredients.deleteMany({ where: { recipe_id: recipeId } })
      await tx.instructions.deleteMany({ where: { recipe_id: recipeId } })
      await tx.recipe_categories.deleteMany({ where: { recipe_id: recipeId } })
      await tx.recipe_tags.deleteMany({ where: { recipe_id: recipeId } })

      // Upsert ingredients and create recipe_ingredients
      for (let i = 0; i < data.ingredients.length; i++) {
        const ing = data.ingredients[i]
        const name = ing.name.toLowerCase()

        const ingredient = await tx.ingredients.upsert({
          where: { name },
          create: { name },
          update: {},
        })

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

      // Batch create instructions
      if (data.instructions.length > 0) {
        await tx.instructions.createMany({
          data: data.instructions.map((inst, i) => ({
            recipe_id: recipeId,
            step_number: i + 1,
            content: inst.content,
          }))
        })
      }

      // Batch create categories
      if (data.category_ids.length > 0) {
        await tx.recipe_categories.createMany({
          data: data.category_ids.map(categoryId => ({
            recipe_id: recipeId,
            category_id: categoryId,
          }))
        })
      }

      // Batch create tags
      if (data.tag_ids.length > 0) {
        await tx.recipe_tags.createMany({
          data: data.tag_ids.map(tagId => ({
            recipe_id: recipeId,
            tag_id: tagId,
          }))
        })
      }
    })

    revalidatePath(`/recipes/${recipeId}`)
    revalidatePath('/my-recipes')

    return { success: true }
  } catch (err) {
    if (isPrismaError(err) && err.code === 'P2002') {
      return { success: false, error: 'duplicateRecipeName' }
    }
    return { success: false, error: handleActionError(err, 'updateRecipe') }
  }
}
