import { z } from 'zod'
import { TITLE_REGEX } from './recipe'

export const ingredientInputSchema = z.object({
  name: z.string().min(1).max(100).trim().regex(/^[A-Za-zÀ-ÿñÑ\s]+$/),
  quantity: z.number().min(0).max(9999).nullable(),
  unit: z.string().max(50).nullable(),
})

export const instructionInputSchema = z.object({
  content: z.string().min(1).max(1000).trim(),
})

export const recipeInputSchema = z.object({
  title: z.string().min(3).max(100).trim().regex(TITLE_REGEX),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).nullable(),
  image_url: z.union([z.string().url(), z.literal(''), z.null()]),
  prep_time: z.number().int().min(0).max(1440).nullable(),
  cooking_time: z.number().int().min(0).max(1440).nullable(),
  servings: z.number().int().min(1).max(99),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  is_public: z.boolean(),
  ingredients: z.array(ingredientInputSchema).min(1).max(25),
  instructions: z.array(instructionInputSchema).min(1).max(30),
  category_ids: z.array(z.string()).min(1).max(3),
  tag_ids: z.array(z.string()).max(7),
})

export type RecipeApiInput = z.infer<typeof recipeInputSchema>
