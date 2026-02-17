'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './utils'

export async function testServerAction(title: string) {
  try {
    const { user, error } = await requireAuth()
    if (!user) {
      return { success: false, step: 'auth', error }
    }

    const recipe = await prisma.recipes.create({
      data: {
        user_id: user.id,
        title,
        slug: 'test-action-' + Date.now(),
        description: 'Test from server action',
        servings: 4,
        difficulty: 'easy',
        is_public: true,
      }
    })

    // Cleanup
    await prisma.recipes.delete({ where: { id: recipe.id } })

    return { success: true, step: 'all', recipeId: recipe.id }
  } catch (err) {
    return { success: false, step: 'error', error: String(err) }
  }
}
