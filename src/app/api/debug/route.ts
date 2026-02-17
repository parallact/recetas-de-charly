import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = await prisma.categories.findMany({ take: 3 })
    const tags = await prisma.tags.findMany({ where: { is_default: true }, take: 3 })
    return NextResponse.json({
      ok: true,
      categoriesCount: categories.length,
      tagsCount: tags.length,
      sampleCategory: categories[0] ? { id: categories[0].id, name: categories[0].name } : null,
      sampleTag: tags[0] ? { id: tags[0].id, name: tags[0].name } : null,
      dbUrl: process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : 'NOT SET',
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: String(err),
      stack: (err as Error).stack?.substring(0, 500),
      dbUrl: process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : 'NOT SET',
    }, { status: 500 })
  }
}
