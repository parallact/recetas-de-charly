import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const ingredientInputSchema = z.object({
  name: z.string().min(1).max(100).trim().regex(/^[A-Za-zÀ-ÿñÑ\s]+$/),
  quantity: z.number().min(0).max(9999).nullable(),
  unit: z.string().max(50).nullable(),
})

const instructionInputSchema = z.object({
  content: z.string().min(1).max(1000).trim(),
})

const recipeInputSchema = z.object({
  title: z.string().min(1).max(100).trim().regex(/^[A-Za-zÀ-ÿñÑ0-9\s,.\-()]+$/),
  slug: z.string().min(1).max(200),
  description: z.string().max(500).nullable(),
  image_url: z.union([z.string().url(), z.literal(''), z.null()]),
  prep_time: z.number().int().min(0).max(1440).nullable(),
  cooking_time: z.number().int().min(0).max(1440).nullable(),
  servings: z.number().int().min(1).max(99),
  difficulty: z.string().min(1).max(20),
  is_public: z.boolean(),
  ingredients: z.array(ingredientInputSchema).min(1).max(25),
  instructions: z.array(instructionInputSchema).min(1).max(30),
  category_ids: z.array(z.string()).min(1).max(3),
  tag_ids: z.array(z.string()).max(7),
})

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: recipeId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'notAuthenticated' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = recipeInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'invalidRecipeData' }, { status: 400 })
    }

    const data = parsed.data

    const existingRecipe = await prisma.recipes.findUnique({
      where: { id: recipeId },
      select: { user_id: true }
    })

    if (!existingRecipe || existingRecipe.user_id !== session.user.id) {
      return NextResponse.json({ success: false, error: 'noEditPermission' }, { status: 403 })
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

      // Upsert ingredients
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

      if (data.instructions.length > 0) {
        await tx.instructions.createMany({
          data: data.instructions.map((inst, i) => ({
            recipe_id: recipeId,
            step_number: i + 1,
            content: inst.content,
          }))
        })
      }

      if (data.category_ids.length > 0) {
        await tx.recipe_categories.createMany({
          data: data.category_ids.map(categoryId => ({
            recipe_id: recipeId,
            category_id: categoryId,
          }))
        })
      }

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

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API] updateRecipe error:', err)
    const message = err instanceof Error ? err.message : 'serverError'
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ success: false, error: 'duplicateRecipeName' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 })
  }
}
