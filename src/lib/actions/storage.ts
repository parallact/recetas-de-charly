'use server'

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, R2_BUCKET_NAME } from '@/lib/r2'
import { requireAuth } from './utils'
import { handleActionError } from './error-utils'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB (Vercel serverless limit)

interface UploadResult {
  success: boolean
  publicUrl?: string
  key?: string
  error?: string
}

// Upload file directly to R2 from server (avoids CORS issues)
export async function uploadFile(
  formData: FormData
): Promise<UploadResult> {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error: error || 'notAuthenticated' }
  }

  const file = formData.get('file') as File | null
  const rawFolder = (formData.get('folder') as string) || 'recipes'
  const ALLOWED_FOLDERS = ['recipes', 'avatars', 'profiles']
  const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'recipes'

  if (!file) {
    return { success: false, error: 'noFileProvided' }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'fileTypeNotAllowed' }
  }

  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'fileTooLarge' }
  }

  const r2 = getR2Client()
  if (!r2) {
    return { success: false, error: 'storageNotConfigured' }
  }

  if (!process.env.R2_PUBLIC_URL) {
    return { success: false, error: 'storageUrlNotConfigured' }
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { success: false, error: 'invalidFileExtension' }
    }

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const key = `${folder}/${user.id}/${timestamp}-${random}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })

    await r2.send(command)

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return { success: true, publicUrl, key }
  } catch (err) {
    console.error('[uploadFile] R2 upload failed:', err)
    return { success: false, error: handleActionError(err, 'uploadFile') }
  }
}

// Delete a file from R2
export async function deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error: error || 'notAuthenticated' }
  }

  const r2 = getR2Client()
  if (!r2) {
    return { success: false, error: 'storageNotConfigured' }
  }

  // Security: Only allow deleting files in user's folder
  if (!key.includes(`/${user.id}/`)) {
    return { success: false, error: 'noDeleteFilePermission' }
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    await r2.send(command)
    return { success: true }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'deleteFile') }
  }
}
