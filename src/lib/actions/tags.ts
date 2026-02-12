'use server'

import { prisma } from '@/lib/prisma'
import { handleActionError, isPrismaError } from './error-utils'
import { requireAuth } from './utils'

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
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error: error || 'notAuthenticated', data: null }
  }

  const trimmedName = name.trim()
  if (!trimmedName || trimmedName.length > 50) {
    return { success: false, error: 'tagNameInvalid', data: null }
  }

  const trimmedSlug = slug.trim()
  if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
    return { success: false, error: 'invalidSlug', data: null }
  }

  try {
    const tag = await prisma.tags.create({
      data: {
        name: trimmedName,
        slug: trimmedSlug,
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
      return { success: false, error: 'duplicateTag', data: null }
    }
    return { success: false, error: handleActionError(error, 'createTag'), data: null }
  }
}
