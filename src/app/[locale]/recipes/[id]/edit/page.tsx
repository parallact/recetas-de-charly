import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { EditRecipeClient } from './edit-recipe-client'
import type { Category } from '@/lib/types'

interface TagData {
  id: string
  name: string
  slug: string
  is_default: boolean
}

async function getCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { name: 'asc' },
    })
    return categories as Category[]
  } catch {
    return []
  }
}

async function getAllTags(): Promise<TagData[]> {
  try {
    const tags = await prisma.tags.findMany({
      orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        is_default: true,
      },
    })
    return tags
  } catch {
    return []
  }
}

interface EditRecipePageProps {
  params: Promise<{ id: string }>
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id: recipeId } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const [recipe, categories, tags] = await Promise.all([
    prisma.recipes.findFirst({
      where: {
        id: recipeId,
        user_id: session.user.id,
      },
      include: {
        recipe_ingredients: {
          include: { ingredients: true },
          orderBy: { order_index: 'asc' },
        },
        instructions: {
          orderBy: { step_number: 'asc' },
        },
        recipe_categories: true,
        recipe_tags: true,
      },
    }).catch(() => null),
    getCategories(),
    getAllTags(),
  ])

  if (!recipe) {
    redirect('/my-recipes')
  }

  return (
    <EditRecipeClient
      recipe={JSON.parse(JSON.stringify(recipe))}
      categories={categories}
      tags={tags}
    />
  )
}
