import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { recipeInputSchema } from '@/lib/schemas/recipe-api'

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
          recipe_id: recipeId,
          ingredient_id: id,
          quantity,
          unit,
          order_index: idx,
        })),
      })

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
    revalidatePath('/recipes')
    revalidatePath('/recipes', 'layout')

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
