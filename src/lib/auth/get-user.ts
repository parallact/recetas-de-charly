import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export interface AuthUser {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
}

/**
 * Gets the current authenticated user with profile data
 * For use in Server Components only
 */
export async function getUser(): Promise<AuthUser | null> {
  try {
    const session = await auth()

    if (!session?.user?.id) return null

    const profile = await prisma.profiles.findUnique({
      where: { id: session.user.id },
      select: { display_name: true, avatar_url: true }
    })

    return {
      id: session.user.id,
      email: session.user.email || '',
      display_name: profile?.display_name || session.user.name || undefined,
      avatar_url: profile?.avatar_url || session.user.image || undefined,
    }
  } catch {
    return null
  }
}
