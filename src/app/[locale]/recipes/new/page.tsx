import { prisma } from '@/lib/prisma'
import { NewRecipeClient } from './new-recipe-client'
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

async function getDefaultTags(): Promise<TagData[]> {
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

export default async function NewRecipePage() {
  const [categories, tags] = await Promise.all([getCategories(), getDefaultTags()])

  return <NewRecipeClient categories={categories} tags={tags} />
}
