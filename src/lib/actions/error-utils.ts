/**
 * Type guard helper for Prisma errors
 */
export function isPrismaError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  )
}

/**
 * Standard error handler for server actions
 * Logs errors in development, returns user-friendly messages
 */
export function handleActionError(error: unknown, context: string): string {
  if (isPrismaError(error)) {
    if (error.code === 'P2002') {
      return 'duplicateRecord'
    }
    if (error.code === 'P2025') {
      return 'recordNotFound'
    }
  }

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`Error in ${context}:`, error)
  }

  return 'serverError'
}
