'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, Tag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getAllTags, createTag, deleteTag } from '@/lib/actions/tags'
import { useTranslations } from 'next-intl'

interface TagData {
  id: string
  name: string
  slug: string
  is_default?: boolean
}

const MAX_TAGS = 7

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tagIds: string[]) => void
  allowCreate?: boolean
  className?: string
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function TagSelector({
  selectedTags,
  onTagsChange,
  allowCreate = true,
  className,
}: TagSelectorProps) {
  const [tags, setTags] = useState<TagData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newTagName, setNewTagName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const t = useTranslations('tags')
  const tc = useTranslations('common')
  const te = useTranslations('serverErrors')

  useEffect(() => {
    async function loadTags() {
      try {
        const result = await getAllTags()

        if (result.success) {
          setTags(result.data)
        }
      } catch {
        // Server action failed (network/500 error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTags()
  }, [])

  const toggleTag = useCallback((tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId))
    } else {
      if (selectedTags.length >= MAX_TAGS) {
        toast.error(t('maxTagsReached'))
        return
      }
      onTagsChange([...selectedTags, tagId])
    }
  }, [selectedTags, onTagsChange, t])

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    if (selectedTags.length >= MAX_TAGS) {
      toast.error(t('maxTagsReached'))
      return
    }

    const trimmedName = newTagName.trim()
    const slug = generateSlug(trimmedName)

    // Check if tag already exists
    const existingTag = tags.find(
      t => t.name.toLowerCase() === trimmedName.toLowerCase() || t.slug === slug
    )

    if (existingTag) {
      // Just select it if it exists
      if (!selectedTags.includes(existingTag.id)) {
        onTagsChange([...selectedTags, existingTag.id])
      }
      setNewTagName('')
      setShowInput(false)
      return
    }

    setIsCreating(true)

    const result = await createTag(trimmedName, slug)

    if (!result.success) {
      toast.error(result.error ? te(result.error) : t('createError'))
    } else if (result.data) {
      setTags(prev => [...prev, result.data!].sort((a, b) => a.name.localeCompare(b.name)))
      onTagsChange([...selectedTags, result.data.id])
      setNewTagName('')
      setShowInput(false)
      toast.success(t('tagCreated'))
    }

    setIsCreating(false)
  }

  const handleDeleteTag = async (tagId: string) => {
    const result = await deleteTag(tagId)
    if (!result.success) {
      toast.error(result.error ? te(result.error) : t('createError'))
      return
    }
    setTags(prev => prev.filter(t => t.id !== tagId))
    onTagsChange(selectedTags.filter(id => id !== tagId))
    toast.success(t('tagDeleted'))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateTag()
    } else if (e.key === 'Escape') {
      setShowInput(false)
      setNewTagName('')
    }
  }

  // Memoized filtered lists - must be before any early returns
  const selectedTagObjects = useMemo(
    () => tags.filter(t => selectedTags.includes(t.id)),
    [tags, selectedTags]
  )
  const availableTags = useMemo(
    () => tags.filter(t => !selectedTags.includes(t.id)),
    [tags, selectedTags]
  )

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t('loadingTags')}</span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Selected Tags */}
      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagObjects.map(tag => (
            <Badge
              key={tag.id}
              variant="default"
              className="gap-1 pr-1"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag count */}
      <p className="text-xs text-muted-foreground">
        {selectedTags.length}/{MAX_TAGS}
      </p>

      {/* Available Tags */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <div key={tag.id} className="flex items-center gap-0.5">
              <Badge
                variant="outline"
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedTags.length >= MAX_TAGS
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-muted"
                )}
                onClick={() => toggleTag(tag.id)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {tag.name}
              </Badge>
              {!tag.is_default && (
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag.id)}
                  className="p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title={tc('delete')}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create New Tag */}
      {allowCreate && (
        <div>
          {showInput ? (
            <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('tagNamePlaceholder')}
                className="h-8 text-sm"
                maxLength={25}
                autoFocus
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateTag}
                disabled={isCreating || !newTagName.trim()}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  tc('create')
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowInput(false)
                  setNewTagName('')
                }}
              >
                {tc('cancel')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">3-25 caracteres, letras y numeros</p>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowInput(true)}
              className="text-muted-foreground"
            >
              <Tag className="h-4 w-4 mr-1" />
              {t('createNewTag')}
            </Button>
          )}
        </div>
      )}

      {tags.length === 0 && !showInput && (
        <p className="text-sm text-muted-foreground">
          {t('noTags')}
        </p>
      )}
    </div>
  )
}
