import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    // Test 1: Auth
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ step: 'auth', error: 'not authenticated' })
    }

    const body = await request.json()

    // Test 2: Simple DB write
    const recipe = await prisma.recipes.create({
      data: {
        user_id: session.user.id,
        title: body.title || 'Test Recipe',
        slug: 'test-' + Date.now(),
        description: 'Test',
        servings: 4,
        difficulty: 'easy',
        is_public: true,
      }
    })

    // Test 3: Transaction
    await prisma.$transaction(async (tx) => {
      await tx.instructions.create({
        data: {
          recipe_id: recipe.id,
          step_number: 1,
          content: 'Test step',
        }
      })
    })

    // Cleanup
    await prisma.instructions.deleteMany({ where: { recipe_id: recipe.id } })
    await prisma.recipes.delete({ where: { id: recipe.id } })

    return NextResponse.json({ success: true, steps: ['auth', 'create', 'transaction', 'cleanup'] })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: String(err),
      stack: (err as Error)?.stack?.substring(0, 500),
    })
  }
}
