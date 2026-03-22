'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from './utils'
import { handleActionError, isPrismaError } from './error-utils'
import { recipeInputSchema, type RecipeApiInput } from '@/lib/schemas/recipe-api'


type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

// --- Shared transaction helpers ---

async function upsertRecipeIngredients(
  tx: Tx,
  recipeId: string,
  ingredients: RecipeApiInput['ingredients']
) {
  // Upsert each ingredient name (sequential — no upsertMany in Prisma)
  const resolved: { id: string; idx: number; quantity: RecipeApiInput['ingredients'][number]['quantity']; unit: RecipeApiInput['ingredients'][number]['unit'] }[] = []
  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i]
    const name = ing.name.toLowerCase()
    const ingredient = await tx.ingredients.upsert({
      where: { name },
      create: { name },
      update: {},
    })
    resolved.push({ id: ingredient.id, idx: i, quantity: ing.quantity, unit: ing.unit })
  }

  // Batch insert all recipe_ingredients in one query
  await tx.recipe_ingredients.createMany({
    data: resolved.map(({ id, idx, quantity, unit }) => ({
      recipe_id: recipeId,
      ingredient_id: id,
      quantity,
      unit,
      order_index: idx,
    })),
  })
}

async function createRecipeInstructions(
  tx: Tx,
  recipeId: string,
  instructions: RecipeApiInput['instructions']
) {
  if (instructions.length > 0) {
    await tx.instructions.createMany({
      data: instructions.map((inst, i) => ({
        recipe_id: recipeId,
        step_number: i + 1,
        content: inst.content,
      }))
    })
  }
}

async function createRecipeCategories(
  tx: Tx,
  recipeId: string,
  categoryIds: string[]
) {
  if (categoryIds.length > 0) {
    await tx.recipe_categories.createMany({
      data: categoryIds.map(categoryId => ({
        recipe_id: recipeId,
        category_id: categoryId,
      }))
    })
  }
}

async function createRecipeTags(
  tx: Tx,
  recipeId: string,
  tagIds: string[]
) {
  if (tagIds.length > 0) {
    await tx.recipe_tags.createMany({
      data: tagIds.map(tagId => ({
        recipe_id: recipeId,
        tag_id: tagId,
      }))
    })
  }
}

// --- Public actions ---

export async function createRecipe(input: RecipeApiInput) {
  try {
    const { user, error } = await requireAuth()
    if (!user) {
      return { success: false, error, recipeId: null }
    }

    const parsed = recipeInputSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'invalidRecipeData', recipeId: null }
    }

    const data = parsed.data

    const recipeId = await prisma.$transaction(async (tx) => {
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

      await upsertRecipeIngredients(tx, recipe.id, data.ingredients)
      await createRecipeInstructions(tx, recipe.id, data.instructions)
      await createRecipeCategories(tx, recipe.id, data.category_ids)
      await createRecipeTags(tx, recipe.id, data.tag_ids)

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

export async function updateRecipe(recipeId: string, input: RecipeApiInput) {
  try {
    const { user, error } = await requireAuth()
    if (!user) {
      return { success: false, error }
    }

    const parsed = recipeInputSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: 'invalidRecipeData' }
    }

    const data = parsed.data

    const existingRecipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true }
    })

    if (!existingRecipe || existingRecipe.user_id !== user.id) {
      return { success: false, error: 'noEditPermission' }
    }

    await prisma.$transaction(async (tx) => {
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

      await tx.recipe_ingredients.deleteMany({ where: { recipe_id: recipeId } })
      await tx.instructions.deleteMany({ where: { recipe_id: recipeId } })
      await tx.recipe_categories.deleteMany({ where: { recipe_id: recipeId } })
      await tx.recipe_tags.deleteMany({ where: { recipe_id: recipeId } })

      await upsertRecipeIngredients(tx, recipeId, data.ingredients)
      await createRecipeInstructions(tx, recipeId, data.instructions)
      await createRecipeCategories(tx, recipeId, data.category_ids)
      await createRecipeTags(tx, recipeId, data.tag_ids)
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
