'use server'

import { auth } from '@/auth'

export interface AuthenticatedUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface AuthResult {
  user: AuthenticatedUser | null
  error: string | null
}

/**
 * Validates that the user is authenticated.
 * Use this at the start of server actions that require authentication.
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return { user: null, error: 'No autenticado' }
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
    error: null
  }
}
