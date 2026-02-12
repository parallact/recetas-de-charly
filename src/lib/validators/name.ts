const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/

export function getNameError(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) return 'El nombre es requerido'
  if (trimmed.length < 2) return 'El nombre debe tener al menos 2 caracteres'
  if (trimmed.length > 50) return 'El nombre no puede tener mas de 50 caracteres'
  if (!NAME_REGEX.test(trimmed)) return 'El nombre solo puede contener letras, espacios, guiones y apostrofes'
  return null
}
