'use server'

import { prisma } from '@/lib/prisma'
import { handleActionError } from './error-utils'

// Get all categories
export async function getAllCategories() {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { name: 'asc' },
    })

    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
      created_at: cat.created_at,
    }))
  } catch (err) {
    handleActionError(err, 'getAllCategories')
    return []
  }
}
