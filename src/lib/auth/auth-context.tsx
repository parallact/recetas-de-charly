'use client'

import { createContext, useContext, useMemo } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import type { AuthUser } from './get-user'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
})

interface AuthProviderProps {
  initialUser: AuthUser | null
  children: React.ReactNode
}

function AuthContextProvider({ initialUser, children }: AuthProviderProps) {
  const { data: session, status, update } = useSession()
  const isLoading = status === 'loading'

  // Derive user from session or initial value - no useEffect needed
  const user = useMemo<AuthUser | null>(() => {
    if (session?.user) {
      return {
        id: session.user.id || '',
        email: session.user.email || '',
        display_name: session.user.name || undefined,
        avatar_url: session.user.image || undefined,
      }
    }
    if (status === 'unauthenticated') {
      return null
    }
    // While loading, use initial value
    return initialUser
  }, [session, status, initialUser])

  const refreshUser = async () => {
    await update()
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthContextProvider initialUser={initialUser}>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Type guard for checking if user is authenticated
export function useRequireAuth() {
  const { user, isLoading } = useAuth()
  return { user, isLoading, isAuthenticated: !!user }
}
