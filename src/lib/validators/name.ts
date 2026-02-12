const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/

export function getNameError(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'nameRequired'
  if (trimmed.length < 2) return 'nameTooShort'
  if (trimmed.length > 50) return 'nameTooLong'
  if (!NAME_REGEX.test(trimmed)) return 'nameInvalidChars'
  return null
}
