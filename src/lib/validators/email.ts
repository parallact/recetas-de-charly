const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim()
  if (!trimmed || trimmed.length > 255) return false
  return EMAIL_REGEX.test(trimmed)
}

export function getEmailError(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'El email es requerido'
  if (trimmed.length > 255) return 'El email no puede tener mas de 255 caracteres'
  const parts = trimmed.split('@')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return 'El email no es valido'
  const domain = parts[1]
  if (domain.length > 63) return 'El dominio del email es demasiado largo (max 63 caracteres)'
  if (!EMAIL_REGEX.test(trimmed)) return 'El email no es valido'
  return null
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
