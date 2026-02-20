'use server'

import { prisma } from '@/lib/prisma'
import { handleActionError, isPrismaError } from './error-utils'
import { requireAuth } from './utils'

function isAdmin(email?: string | null): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  return !!adminEmail && email === adminEmail
}

// Predefined default tags
export const DEFAULT_TAGS = [
  // Dieta
  'Vegetariano', 'Vegano', 'Sin Gluten', 'Sin Lactosa', 'Keto', 'Bajo en Calorías',
  // Comida
  'Desayuno', 'Almuerzo', 'Cena', 'Merienda', 'Postre', 'Aperitivo',
  // Cocina
  'Argentino', 'Italiano', 'Mexicano', 'Asiático', 'Mediterráneo', 'Americano',
  // Estilo
  'Rápido', 'Al Horno', 'A la Parrilla', 'Saludable', 'Comfort Food', 'Para Niños',
]

// Get tags visible to the current user: default tags + their own custom tags
export async function getAllTags() {
  const { user } = await requireAuth()

  try {
    const where = user
      ? { OR: [{ is_default: true, user_id: null }, { user_id: user.id }] }
      : { is_default: true, user_id: null }

    const tags = await prisma.tags.findMany({
      where,
      orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        is_default: true,
      }
    })

    return { success: true, data: tags }
  } catch (err) {
    return { success: false, data: [], error: handleActionError(err, 'getAllTags') }
  }
}

// Create a new tag owned by the current user
export async function createTag(name: string, slug: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error: error || 'notAuthenticated', data: null }
  }

  const trimmedName = name.trim()
  if (trimmedName.length < 3) {
    return { success: false, error: 'tagNameTooShort', data: null }
  }
  if (trimmedName.length > 25) {
    return { success: false, error: 'tagNameInvalid', data: null }
  }
  if (!/^[A-Za-zÀ-ÿñÑ0-9\s]+$/.test(trimmedName)) {
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
        user_id: user.id,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        is_default: true,
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

// Seed default tags (admin only)
export async function seedDefaultTags() {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error: error || 'notAuthenticated' }
  }
  if (!isAdmin(user.email)) {
    return { success: false, error: 'forbidden' }
  }

  try {
    for (const name of DEFAULT_TAGS) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const existing = await prisma.tags.findFirst({
        where: { name, user_id: null },
      })

      if (!existing) {
        await prisma.tags.create({
          data: { name, slug, is_default: true, user_id: null },
        })
      } else {
        await prisma.tags.update({
          where: { id: existing.id },
          data: { is_default: true },
        })
      }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'seedDefaultTags') }
  }
}

// Delete a tag — only the owner can delete their own custom tags
export async function deleteTag(tagId: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error: error || 'notAuthenticated' }
  }

  try {
    const tag = await prisma.tags.findUnique({
      where: { id: tagId },
      select: { user_id: true, is_default: true },
    })

    if (!tag) {
      return { success: false, error: 'recordNotFound' }
    }

    if (tag.is_default) {
      return { success: false, error: 'cannotDeleteDefaultTag' }
    }

    if (tag.user_id !== user.id) {
      return { success: false, error: 'forbidden' }
    }

    await prisma.tags.delete({
      where: { id: tagId },
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'deleteTag') }
  }
}
