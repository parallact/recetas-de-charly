'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from './utils'
import { handleActionError } from './error-utils'

// Get notes for a recipe
export async function getRecipeNotes(recipeId: string) {
  const { user } = await requireAuth()
  if (!user) {
    return { success: false, data: [], userId: null }
  }

  try {
    const notes = await prisma.recipe_notes.findMany({
      where: {
        recipe_id: recipeId,
        user_id: user.id,
      },
      orderBy: { created_at: 'desc' }
    })

    return {
      success: true,
      data: notes.map(note => ({
        id: note.id,
        content: note.content,
        is_private: note.is_private ?? true,
        created_at: note.created_at?.toISOString() || '',
        updated_at: note.updated_at?.toISOString() || '',
      })),
      userId: user.id,
    }
  } catch (err) {
    return { success: false, data: [], userId: null, error: handleActionError(err, 'getRecipeNotes') }
  }
}

// Add a note
export async function addRecipeNote(recipeId: string, content: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error, data: null }
  }

  const trimmed = content.trim()
  if (trimmed.length < 10) {
    return { success: false, error: 'noteTooShort', data: null }
  }
  if (trimmed.length > 500) {
    return { success: false, error: 'noteTooLong', data: null }
  }

  try {
    const note = await prisma.recipe_notes.create({
      data: {
        user_id: user.id,
        recipe_id: recipeId,
        content: trimmed,
        is_private: true,
      }
    })

    return {
      success: true,
      data: {
        id: note.id,
        content: note.content,
        is_private: note.is_private ?? true,
        created_at: note.created_at?.toISOString() || '',
        updated_at: note.updated_at?.toISOString() || '',
      }
    }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'addRecipeNote'), data: null }
  }
}

// Update a note
export async function updateRecipeNote(noteId: string, content: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error }
  }

  try {
    // Verify ownership
    const note = await prisma.recipe_notes.findUnique({
      where: { id: noteId },
      select: { user_id: true }
    })

    if (!note || note.user_id !== user.id) {
      return { success: false, error: 'noPermission' }
    }

    const trimmed = content.trim()
    if (trimmed.length < 10) {
      return { success: false, error: 'noteTooShort' }
    }
    if (trimmed.length > 500) {
      return { success: false, error: 'noteTooLong' }
    }

    await prisma.recipe_notes.update({
      where: { id: noteId },
      data: {
        content: trimmed,
        updated_at: new Date(),
      }
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'updateRecipeNote') }
  }
}

// Delete a note
export async function deleteRecipeNote(noteId: string) {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error }
  }

  try {
    // Verify ownership
    const note = await prisma.recipe_notes.findUnique({
      where: { id: noteId },
      select: { user_id: true }
    })

    if (!note || note.user_id !== user.id) {
      return { success: false, error: 'noPermission' }
    }

    await prisma.recipe_notes.delete({
      where: { id: noteId }
    })

    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'deleteRecipeNote') }
  }
}
