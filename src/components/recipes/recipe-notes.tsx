'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StickyNote, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getRecipeNotes, addRecipeNote, updateRecipeNote, deleteRecipeNote } from '@/lib/actions/notes'
import { useTranslations, useLocale } from 'next-intl'

interface RecipeNote {
  id: string
  content: string
  is_private: boolean
  created_at: string
  updated_at: string
}

interface RecipeNotesProps {
  recipeId: string
}

export function RecipeNotes({ recipeId }: RecipeNotesProps) {
  const [notes, setNotes] = useState<RecipeNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const locale = useLocale()
  const t = useTranslations('notes')
  const tc = useTranslations('common')
  const te = useTranslations('serverErrors')

  useEffect(() => {
    let isMounted = true

    async function loadNotes() {
      const result = await getRecipeNotes(recipeId)

      if (!isMounted) return

      if (result.success) {
        setNotes(result.data)
        setUserId(result.userId)
      }

      setIsLoading(false)
    }

    loadNotes()

    return () => {
      isMounted = false
    }
  }, [recipeId])

  const handleAddNote = async () => {
    if (!userId || !newNote.trim()) return

    setSaving(true)

    const result = await addRecipeNote(recipeId, newNote.trim())

    if (!result.success) {
      toast.error(result.error ? te(result.error) : t('saveError'))
    } else if (result.data) {
      setNotes(prev => [result.data!, ...prev])
      setNewNote('')
      setIsAdding(false)
      toast.success(t('noteSaved'))
    }

    setSaving(false)
  }

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return

    setSaving(true)

    const result = await updateRecipeNote(noteId, editContent.trim())

    if (!result.success) {
      toast.error(result.error ? te(result.error) : t('updateError'))
    } else {
      setNotes(prev =>
        prev.map(n =>
          n.id === noteId ? { ...n, content: editContent.trim() } : n
        )
      )
      setEditingId(null)
      toast.success(t('noteUpdated'))
    }

    setSaving(false)
  }

  const handleDeleteNote = async (noteId: string) => {
    const result = await deleteRecipeNote(noteId)

    if (!result.success) {
      toast.error(result.error ? te(result.error) : t('deleteError'))
    } else {
      setNotes(prev => prev.filter(n => n.id !== noteId))
      toast.success(t('noteDeleted'))
    }
  }

  // Not logged in
  if (!userId && !isLoading) {
    return null
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">{t('title')}</h3>
        </div>
        {!isAdding && userId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {tc('add')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Add new note form */}
          {isAdding && (
            <div className="space-y-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={t('placeholder')}
                rows={3}
                maxLength={500}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span className={`text-xs ${newNote.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {newNote.length}/500{newNote.trim().length > 0 && newNote.trim().length < 10 && ` — ${t('minLength')}`}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAdding(false)
                      setNewNote('')
                    }}
                  >
                    {tc('cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={saving || newNote.trim().length < 10}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      tc('save')
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notes list */}
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-muted/30 rounded-lg"
                >
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${editContent.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {editContent.length}/500{editContent.trim().length > 0 && editContent.trim().length < 10 && ` — ${t('minLength')}`}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            {tc('cancel')}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={saving || editContent.trim().length < 10}
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              tc('save')
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(note.created_at).toLocaleDateString(locale)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingId(note.id)
                              setEditContent(note.content)
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : !isAdding ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('noNotes')}
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}
