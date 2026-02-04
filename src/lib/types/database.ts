export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: Date | string | null
  updated_at: Date | string | null
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  created_at: Date | string | null
}

export interface Recipe {
  id: string
  user_id: string | null
  title: string
  slug: string
  description: string | null
  image_url: string | null
  source_url: string | null
  cooking_time: number | null
  prep_time: number | null
  servings: number | null
  difficulty: 'easy' | 'medium' | 'hard' | string | null
  is_public: boolean | null
  is_imported: boolean | null
  imported_from: string | null
  created_at: Date | string | null
  updated_at: Date | string | null
}

export interface RecipeWithDetails extends Recipe {
  profile?: Profile
  ingredients?: RecipeIngredient[]
  instructions?: Instruction[]
  categories?: Category[]
  tags?: Tag[]
  likes_count?: number
  is_bookmarked?: boolean
  is_liked?: boolean
}

export interface Ingredient {
  id: string
  name: string
  category: string | null
  created_at: Date | string | null
}

export interface RecipeIngredient {
  id: string
  recipe_id: string | null
  ingredient_id: string | null
  quantity: number | null
  unit: string | null
  notes: string | null
  order_index: number | null
  ingredient?: Ingredient
}

export interface Instruction {
  id: string
  recipe_id: string | null
  step_number: number
  content: string
  image_url: string | null
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: Date | string | null
}

export interface Bookmark {
  id: string
  user_id: string | null
  recipe_id: string | null
  created_at: Date | string | null
  recipe?: Recipe
}

export interface RecipeNote {
  id: string
  user_id: string | null
  recipe_id: string | null
  content: string
  is_private: boolean | null
  created_at: Date | string | null
  updated_at: Date | string | null
}

export interface Like {
  user_id: string | null
  recipe_id: string | null
  created_at: Date | string | null
}
