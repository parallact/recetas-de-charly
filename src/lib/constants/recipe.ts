/**
 * Recipe difficulty levels and their display properties
 */

export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'bg-green-500/80 text-white backdrop-blur-sm',
  medium: 'bg-amber-500/80 text-white backdrop-blur-sm',
  hard: 'bg-red-500/80 text-white backdrop-blur-sm',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Facil',
  medium: 'Media',
  hard: 'Dificil',
}

/**
 * Helper to get difficulty display info
 */
export function getDifficultyInfo(difficulty: string | null) {
  const key = difficulty as Difficulty
  if (!key || !DIFFICULTY_COLORS[key]) return null

  return {
    color: DIFFICULTY_COLORS[key],
    label: DIFFICULTY_LABELS[key],
  }
}

/**
 * Common cooking units
 */
export const INGREDIENT_UNITS = [
  { value: 'g',           label: 'g (gramos)',      translationKey: 'g' },
  { value: 'kg',          label: 'kg (kilogramos)', translationKey: 'kg' },
  { value: 'ml',          label: 'ml (mililitros)', translationKey: 'ml' },
  { value: 'l',           label: 'l (litros)',      translationKey: 'l' },
  { value: 'taza',        label: 'taza(s)',         translationKey: 'cup' },
  { value: 'cucharada',   label: 'cucharada(s)',    translationKey: 'tablespoon' },
  { value: 'cucharadita', label: 'cucharadita(s)', translationKey: 'teaspoon' },
  { value: 'unidad',      label: 'unidad(es)',      translationKey: 'unit' },
  { value: 'pizca',       label: 'pizca',           translationKey: 'pinch' },
  { value: 'al gusto',    label: 'al gusto',        translationKey: 'toTaste' },
  { value: 'rebanada',    label: 'rebanada(s)',     translationKey: 'slice' },
  { value: 'diente',      label: 'diente(s)',       translationKey: 'clove' },
  { value: 'otro',        label: 'Otro...',         translationKey: 'other' },
] as const

export type IngredientUnit = typeof INGREDIENT_UNITS[number]['value']
