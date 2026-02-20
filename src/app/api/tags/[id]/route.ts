import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tagId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'notAuthenticated' }, { status: 401 })
    }

    const tag = await prisma.tags.findUnique({
      where: { id: tagId },
      select: { user_id: true, is_default: true },
    })

    if (!tag) {
      return NextResponse.json({ success: false, error: 'recordNotFound' }, { status: 404 })
    }

    if (tag.is_default) {
      return NextResponse.json({ success: false, error: 'cannotDeleteDefaultTag' }, { status: 403 })
    }

    if (tag.user_id !== session.user.id) {
      return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 })
    }

    await prisma.tags.delete({ where: { id: tagId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API] deleteTag error:', err)
    return NextResponse.json({ success: false, error: 'serverError' }, { status: 500 })
  }
}
