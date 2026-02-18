import { z } from 'zod'

// Helper to validate bounded integer string (for time fields)
function boundedIntString(max: number) {
  return z.string().optional().refine(
    (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= max && Number.isInteger(Number(val))),
    { message: `Debe ser un numero entero entre 0 y ${max}` }
  )
}

// Helper to validate bounded number string (for quantity fields)
function boundedNumberString(max: number) {
  return z.string().optional().refine(
    (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= max),
    { message: `Debe ser un numero entre 0 y ${max}` }
  )
}

// Regex patterns
const TITLE_REGEX = /^[A-Za-zÀ-ÿñÑ0-9\s,.\-()]+$/
const LETTERS_ONLY_REGEX = /^[A-Za-zÀ-ÿñÑ\s]+$/

// Zod schema for recipe form validation
export const ingredientSchema = z.object({
  name: z.string().min(2, 'Minimo 2 caracteres').max(100, 'Maximo 100 caracteres').regex(LETTERS_ONLY_REGEX, 'Solo letras y espacios'),
  quantity: boundedNumberString(9999),
  unit: z.string().optional(),
  customUnit: z.string().max(20, 'Maximo 20 caracteres').regex(/^[A-Za-zÀ-ÿñÑ\s]*$/, 'Solo letras y espacios').optional().or(z.literal('')),
})

export const instructionSchema = z.object({
  content: z.string().min(10, 'Minimo 10 caracteres').max(1000, 'Maximo 1000 caracteres'),
})

export const recipeSchema = z.object({
  title: z.string().min(3, 'Minimo 3 caracteres').max(100, 'Maximo 100 caracteres').regex(TITLE_REGEX, 'Solo letras, numeros, espacios y puntuacion basica (,.-)'),
  description: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
  imageUrl: z.string().url('URL no valida').optional().or(z.literal('')),
  prepTime: boundedIntString(1440),
  cookingTime: boundedIntString(1440),
  servings: z.coerce.number().min(1, 'Minimo 1 porcion').max(99, 'Maximo 99 porciones'),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Agrega al menos un ingrediente').max(25, 'Maximo 25 ingredientes'),
  instructions: z.array(instructionSchema).min(1, 'Agrega al menos un paso').max(30, 'Maximo 30 pasos'),
  categoryIds: z.array(z.string()).max(3, 'Maximo 3 categorias').optional(),
})

// Exported for use in form field filtering
export { TITLE_REGEX, LETTERS_ONLY_REGEX }

export type RecipeFormData = z.infer<typeof recipeSchema>

// Helper to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
