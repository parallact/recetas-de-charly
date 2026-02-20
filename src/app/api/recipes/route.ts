import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { recipeInputSchema } from '@/lib/schemas/recipe-api'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'notAuthenticated' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = recipeInputSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'invalidRecipeData', details: parsed.error.issues }, { status: 400 })
    }

    const data = parsed.data

    const recipeId = await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipes.create({
        data: {
          user_id: session.user!.id!,
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

      // Upsert ingredients then batch-insert recipe_ingredients
      const resolved: { id: string; idx: number; quantity: typeof data.ingredients[number]['quantity']; unit: typeof data.ingredients[number]['unit'] }[] = []
      for (let i = 0; i < data.ingredients.length; i++) {
        const ing = data.ingredients[i]
        const ingredient = await tx.ingredients.upsert({
          where: { name: ing.name.toLowerCase() },
          create: { name: ing.name.toLowerCase() },
          update: {},
        })
        resolved.push({ id: ingredient.id, idx: i, quantity: ing.quantity, unit: ing.unit })
      }
      await tx.recipe_ingredients.createMany({
        data: resolved.map(({ id, idx, quantity, unit }) => ({
          recipe_id: recipe.id,
          ingredient_id: id,
          quantity,
          unit,
          order_index: idx,
        })),
      })

      if (data.instructions.length > 0) {
        await tx.instructions.createMany({
          data: data.instructions.map((inst, i) => ({
            recipe_id: recipe.id,
            step_number: i + 1,
            content: inst.content,
          }))
        })
      }

      if (data.category_ids.length > 0) {
        await tx.recipe_categories.createMany({
          data: data.category_ids.map(categoryId => ({
            recipe_id: recipe.id,
            category_id: categoryId,
          }))
        })
      }

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

    return NextResponse.json({ success: true, recipeId })
  } catch (err) {
    console.error('[API] createRecipe error:', err)
    const message = err instanceof Error ? err.message : 'serverError'
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ success: false, error: 'duplicateRecipeName' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 })
  }
}
