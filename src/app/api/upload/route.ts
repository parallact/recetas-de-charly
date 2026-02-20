import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '@/auth'
import { getR2Client, R2_BUCKET_NAME } from '@/lib/r2'
import {
  UPLOAD_ALLOWED_TYPES,
  UPLOAD_ALLOWED_EXTENSIONS,
  UPLOAD_MAX_FILE_SIZE,
  UPLOAD_ALLOWED_FOLDERS,
} from '@/lib/upload-config'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'notAuthenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const rawFolder = (formData.get('folder') as string) || 'recipes'
    const folder = UPLOAD_ALLOWED_FOLDERS.includes(rawFolder as typeof UPLOAD_ALLOWED_FOLDERS[number]) ? rawFolder : 'recipes'

    if (!file) {
      return NextResponse.json({ success: false, error: 'noFileProvided' }, { status: 400 })
    }

    if (!UPLOAD_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'fileTypeNotAllowed' }, { status: 400 })
    }

    if (file.size > UPLOAD_MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'fileTooLarge' }, { status: 400 })
    }

    const r2 = getR2Client()
    if (!r2) {
      return NextResponse.json({ success: false, error: 'storageNotConfigured' }, { status: 500 })
    }

    if (!process.env.R2_PUBLIC_URL) {
      return NextResponse.json({ success: false, error: 'storageUrlNotConfigured' }, { status: 500 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    if (!UPLOAD_ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ success: false, error: 'invalidFileExtension' }, { status: 400 })
    }

    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const key = `${folder}/${session.user.id}/${timestamp}-${random}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ success: true, publicUrl, key })
  } catch (err) {
    console.error('[API] upload error:', err)
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 })
  }
}
