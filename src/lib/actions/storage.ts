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
  folder: 'recipes' | 'avatars' = 'recipes'
): Promise<UploadUrlResult> {
  const { user, error } = await requireAuth()
  if (!user) {
    return { success: false, error: error || 'No autenticado' }
  }

  const r2 = getR2Client()
  if (!r2) {
    return { success: false, error: 'El almacenamiento de archivos no está configurado. Contacta al administrador.' }
  }

  if (!process.env.R2_PUBLIC_URL) {
    return { success: false, error: 'URL pública de almacenamiento no configurada. Contacta al administrador.' }
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

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })

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
    return { success: false, error: error || 'No autenticado' }
  }

  const r2 = getR2Client()
  if (!r2) {
    return { success: false, error: 'Storage no configurado' }
  }

  // Security: Only allow deleting files in user's folder
  if (!key.includes(`/${user.id}/`)) {
    return { success: false, error: 'No tienes permiso para eliminar este archivo' }
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
