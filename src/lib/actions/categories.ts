'use server'

import { prisma } from '@/lib/prisma'
import { handleActionError } from './error-utils'

// Get all categories
export async function getAllCategories() {
  try {
    const categories = await prisma.categories.findMany({
      orderBy: { name: 'asc' },
    })

    return categories
  } catch (err) {
    handleActionError(err, 'getAllCategories')
    return []
  }
}
