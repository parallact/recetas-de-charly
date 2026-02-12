'use server'

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getR2Client, R2_BUCKET_NAME } from '@/lib/r2'
import { requireAuth } from './utils'
import { handleActionError } from './error-utils'

interface UploadUrlResult {
  success: boolean
  uploadUrl?: string
  publicUrl?: string
  key?: string
  error?: string
}

// Generate a presigned URL for uploading
export async function getUploadUrl(
  filename: string,
  contentType: string,
  folder: 'recipes' | 'avatars' = 'recipes',
  fileSize?: number
): Promise<UploadUrlResult> {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error: error || 'notAuthenticated' }
  }

  // Validate content type
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!ALLOWED_TYPES.includes(contentType)) {
    return { success: false, error: 'fileTypeNotAllowed' }
  }

  // Validate file size
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  if (fileSize && fileSize > MAX_FILE_SIZE) {
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
    // Generate unique filename
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const key = `${folder}/${user.id}/${timestamp}-${random}.${ext}`

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    })

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 600 })

    // Public URL for accessing the file after upload
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return {
      success: true,
      uploadUrl,
      publicUrl,
      key,
    }
  } catch (err) {
    return { success: false, error: handleActionError(err, 'getUploadUrl') }
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
