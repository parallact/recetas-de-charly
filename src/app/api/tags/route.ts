import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'notAuthenticated' }, { status: 401 })
    }

    const { name, slug } = await request.json()

    const trimmedName = (name || '').trim()
    if (trimmedName.length < 3) {
      return NextResponse.json({ success: false, error: 'tagNameTooShort' }, { status: 400 })
    }
    if (trimmedName.length > 25) {
      return NextResponse.json({ success: false, error: 'tagNameInvalid' }, { status: 400 })
    }
    if (!/^[A-Za-zÀ-ÿñÑ0-9\s]+$/.test(trimmedName)) {
      return NextResponse.json({ success: false, error: 'tagNameInvalid' }, { status: 400 })
    }

    const trimmedSlug = (slug || '').trim()
    if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      return NextResponse.json({ success: false, error: 'invalidSlug' }, { status: 400 })
    }

    const tag = await prisma.tags.create({
      data: { name: trimmedName, slug: trimmedSlug },
      select: { id: true, name: true, slug: true, is_default: true },
    })

    return NextResponse.json({ success: true, data: tag })
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ success: false, error: 'duplicateTag' }, { status: 409 })
    }
    console.error('[API] createTag error:', err)
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 })
  }
}
