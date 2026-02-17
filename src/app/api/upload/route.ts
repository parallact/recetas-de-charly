import { NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { auth } from '@/auth'
import { getR2Client, R2_BUCKET_NAME } from '@/lib/r2'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']
const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'notAuthenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const rawFolder = (formData.get('folder') as string) || 'recipes'
    const ALLOWED_FOLDERS = ['recipes', 'avatars', 'profiles']
    const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'recipes'

    if (!file) {
      return NextResponse.json({ success: false, error: 'noFileProvided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'fileTypeNotAllowed' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
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
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
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
