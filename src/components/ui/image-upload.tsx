'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Image as ImageIcon, Loader2, Link as LinkIcon, Upload, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { getUploadUrl } from '@/lib/actions/storage'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  folder?: 'recipes' | 'avatars'
  value?: string | null
  onChange: (url: string | null) => void
  className?: string
  aspectRatio?: 'square' | 'video' | 'auto'
  maxSizeMB?: number
  rounded?: boolean
}

interface UploadState {
  isUploading: boolean
  progress: number
  fileName: string
  fileSize: string
  status: 'idle' | 'uploading' | 'success' | 'error'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ImageUpload({
  folder = 'recipes',
  value,
  onChange,
  className,
  aspectRatio = 'auto',
  maxSizeMB = 5,
  rounded = false,
}: ImageUploadProps) {
  const { data: session } = useSession()
  const t = useTranslations('imageUpload')
  const te = useTranslations('serverErrors')
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    fileName: '',
    fileSize: '',
    status: 'idle',
  })
  const [isDragging, setIsDragging] = useState(false)
  const [useUrl, setUseUrl] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'aspect-4/3',
  }[aspectRatio]

  // Clean up progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const simulateProgress = useCallback(() => {
    setUploadState(prev => {
      if (prev.progress >= 90) return prev
      const increment = Math.max(1, (90 - prev.progress) / 10)
      return { ...prev, progress: Math.min(90, prev.progress + increment) }
    })
  }, [])

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!session?.user) {
        toast.error(t('loginRequired'))
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error(t('onlyImages'))
        return
      }

      const maxSize = maxSizeMB * 1024 * 1024
      if (file.size > maxSize) {
        toast.error(t('maxSize', { maxSizeMB }))
        return
      }

      // Start upload state
      setUploadState({
        isUploading: true,
        progress: 0,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        status: 'uploading',
      })

      // Start simulated progress
      progressIntervalRef.current = setInterval(simulateProgress, 150)

      try {
        // Get presigned URL from server
        const result = await getUploadUrl(file.name, file.type, folder)

        if (!result.success || !result.uploadUrl || !result.publicUrl) {
          throw new Error(result.error ? te(result.error) : t('uploadUrlError'))
        }

        // Upload directly to R2
        let uploadResponse: Response
        try {
          uploadResponse = await fetch(result.uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          })
        } catch {
          throw new Error(t('networkError'))
        }

        if (!uploadResponse.ok) {
          throw new Error(t('uploadError', { status: uploadResponse.status }))
        }

        // Complete progress
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
        setUploadState(prev => ({ ...prev, progress: 100, status: 'success' }))

        // Brief delay to show 100% completion
        await new Promise(resolve => setTimeout(resolve, 300))

        onChange(result.publicUrl)
        toast.success(t('uploadSuccess'))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('genericError')
        toast.error(errorMessage)
        setUploadState(prev => ({ ...prev, status: 'error' }))
      } finally {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
        setUploadState({
          isUploading: false,
          progress: 0,
          fileName: '',
          fileSize: '',
          status: 'idle',
        })
      }
    },
    [session, folder, maxSizeMB, onChange, simulateProgress, t]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error(t('invalidUrl'))
      return
    }
    try {
      const parsed = new URL(urlInput)
      if (parsed.protocol !== 'https:') {
        toast.error(t('httpsOnly'))
        return
      }
      onChange(urlInput.trim())
      setUrlInput('')
      setUseUrl(false)
      toast.success(t('urlSaved'))
    } catch {
      toast.error(t('urlInvalid'))
    }
  }

  // Preview mode - when image is already set
  if (value) {
    return (
      <div className={cn('relative group', className)}>
        <div className={cn(
          'relative overflow-hidden border-2 border-border w-full',
          aspectRatioClass,
          rounded ? 'rounded-full' : 'rounded-xl'
        )}>
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mr-2"
            >
              {t('change')}
            </Button>
          </div>
        </div>
        {/* Delete button */}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className={cn(
            'absolute h-7 w-7 shadow-lg',
            'opacity-70 hover:opacity-100 focus:opacity-100 transition-all duration-200',
            rounded ? '-top-1 -right-1' : '-top-2 -right-2'
          )}
          onClick={() => onChange(null)}
          aria-label={t('removeImage')}
        >
          <X className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>
    )
  }

  // URL input mode
  if (useUrl) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder={t('urlPlaceholder')}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlSubmit())}
            className="flex-1"
          />
          <Button type="button" onClick={handleUrlSubmit} size="sm">
            {t('save')}
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setUseUrl(false)}
          className="text-muted-foreground"
        >
          <Upload className="h-4 w-4 mr-1.5" />
          {t('uploadFile')}
        </Button>
      </div>
    )
  }

  // Upload mode - Simplified UI for circular/avatar uploads
  if (rounded) {
    return (
      <div
        className={cn(
          'relative cursor-pointer w-full',
          'border-2 border-dashed rounded-full',
          'transition-all duration-200',
          aspectRatioClass,
          isDragging
            ? 'border-primary bg-primary/10 scale-105'
            : 'border-muted-foreground/25 bg-muted/40 hover:border-primary/50 hover:bg-muted/60',
          uploadState.isUploading && 'pointer-events-none opacity-60',
          className
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={uploadState.isUploading}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          {uploadState.isUploading ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">
                {Math.round(uploadState.progress)}%
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className={cn(
                'h-8 w-8 transition-colors duration-200',
                isDragging ? 'text-primary' : 'text-muted-foreground/50'
              )} />
              <span className="text-[11px] text-muted-foreground/60 font-medium">
                {isDragging ? t('drop') : t('upload')}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Standard rectangular upload UI
  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative cursor-pointer',
          'border-2 border-dashed',
          'transition-all duration-200',
          aspectRatioClass,
          'rounded-xl',
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-muted-foreground/30 bg-muted/30 hover:border-primary/50 hover:bg-muted/50',
          uploadState.isUploading && 'pointer-events-none'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploadState.isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={uploadState.isUploading}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
          {uploadState.isUploading ? (
            <div className="w-full max-w-xs space-y-3">
              {/* Progress icon */}
              <div className="flex justify-center">
                {uploadState.status === 'success' ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* File info */}
              <div className="text-center">
                <p className="text-sm font-medium text-foreground truncate max-w-[200px] mx-auto">
                  {uploadState.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {uploadState.fileSize}
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      uploadState.status === 'success' ? 'bg-green-500' : 'bg-primary'
                    )}
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {uploadState.status === 'success' ? t('completed') : `${Math.round(uploadState.progress)}%`}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full',
                'bg-muted transition-colors duration-200',
                'group-hover:bg-primary/10'
              )}>
                <ImageIcon className={cn(
                  'h-6 w-6 text-muted-foreground transition-colors duration-200',
                  isDragging && 'text-primary'
                )} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? t('dropToUpload') : t('dragImage')}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('clickToSelect')}
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {t('formats', { maxSizeMB })}
              </p>
            </>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setUseUrl(true)}
        className="w-full text-muted-foreground hover:text-foreground"
      >
        <LinkIcon className="h-4 w-4 mr-1.5" />
        {t('useExternalUrl')}
      </Button>
    </div>
  )
}
