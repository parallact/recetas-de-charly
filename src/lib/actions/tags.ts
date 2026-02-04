'use server'

import { prisma } from '@/lib/prisma'
import { handleActionError, isPrismaError } from './error-utils'

// Get all tags
export async function getAllTags() {
  try {
    const tags = await prisma.tags.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      }
    })

    return { success: true, data: tags }
  } catch (err) {
    return { success: false, data: [], error: handleActionError(err, 'getAllTags') }
  }
}

// Create a new tag
export async function createTag(name: string, slug: string) {
  try {
    const tag = await prisma.tags.create({
      data: {
        name: name.trim(),
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      }
    })

    return { success: true, data: tag }
  } catch (error) {
    if (isPrismaError(error) && error.code === 'P2002') {
      return { success: false, error: 'Este tag ya existe', data: null }
    }
    return { success: false, error: handleActionError(error, 'createTag'), data: null }
  }
}
