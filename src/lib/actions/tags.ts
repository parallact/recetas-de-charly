'use server'

import { prisma } from '@/lib/prisma'
import { handleActionError, isPrismaError } from './error-utils'
import { requireAuth } from './utils'

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

// Get all tags
export async function getAllTags() {
  try {
    const tags = await prisma.tags.findMany({
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

// Create a new tag
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

// Seed default tags
export async function seedDefaultTags() {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error: error || 'notAuthenticated' }
  }

  try {
    for (const name of DEFAULT_TAGS) {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      await prisma.tags.upsert({
        where: { name },
        create: { name, slug, is_default: true },
        update: { is_default: true },
      })
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'seedDefaultTags') }
  }
}

// Delete a tag
export async function deleteTag(tagId: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error: error || 'notAuthenticated' }
  }

  try {
    const tag = await prisma.tags.findUnique({
      where: { id: tagId },
      select: { is_default: true },
    })

    if (!tag) {
      return { success: false, error: 'recordNotFound' }
    }

    if (tag.is_default) {
      return { success: false, error: 'cannotDeleteDefaultTag' }
    }

    await prisma.tags.delete({
      where: { id: tagId },
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'deleteTag') }
  }
}
