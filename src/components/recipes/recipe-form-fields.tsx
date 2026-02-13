'use client'

import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ImageUpload } from '@/components/ui/image-upload'
import { TagSelector } from './tag-selector'
import { RecipeIngredients } from './recipe-ingredients'
import { RecipeInstructions } from './recipe-instructions'
import { getAllCategories } from '@/lib/actions/categories'
import type { RecipeFormData } from '@/lib/schemas/recipe'
import type { Category } from '@/lib/types'
import { useTranslations } from 'next-intl'

const MAX_CATEGORIES = 3

/** Block "e", "E", "+", "-" in number inputs (HTML allows these for scientific notation) */
function blockInvalidNumberKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault()
  }
}

interface RecipeFormFieldsProps {
  form: UseFormReturn<RecipeFormData>
  selectedCategories: string[]
  onToggleCategory: (categoryId: string) => void
  selectedTags?: string[]
  onTagsChange?: (tagIds: string[]) => void
}

export function RecipeFormFields({
  form,
  selectedCategories,
  onToggleCategory,
  selectedTags = [],
  onTagsChange,
}: RecipeFormFieldsProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const t = useTranslations('recipeForm')
  const td = useTranslations('difficulty')
  const tcat = useTranslations('categoryNames')

  const prepTime = form.watch('prepTime')
  const cookingTime = form.watch('cookingTime')
  const totalTime = (parseInt(prepTime || '0') || 0) + (parseInt(cookingTime || '0') || 0)

  useEffect(() => {
    async function loadCategories() {
      const data = await getAllCategories()
      setCategories(data)
    }
    loadCategories()
  }, [])

  return (
    <div className="space-y-8">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          {t('basicInfo')}
        </h3>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('title')}</FormLabel>
              <FormControl>
                <Input placeholder={t('titlePlaceholder')} maxLength={100} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('description')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                  maxLength={500}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('image')}</FormLabel>
              <FormControl>
                <ImageUpload
                  folder="recipes"
                  value={field.value || null}
                  onChange={(url) => field.onChange(url || '')}
                  aspectRatio="video"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="prepTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('prepTime')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="1440"
                    placeholder="15"
                    onKeyDown={blockInvalidNumberKeys}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cookingTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('cookingTime')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="1440"
                    placeholder="30"
                    onKeyDown={blockInvalidNumberKeys}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="servings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('servings')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    placeholder="4"
                    onKeyDown={blockInvalidNumberKeys}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('difficulty')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectDifficulty')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="easy">{td('easy')}</SelectItem>
                    <SelectItem value="medium">{td('medium')}</SelectItem>
                    <SelectItem value="hard">{td('hard')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {totalTime > 0 && (
          <p className="text-sm text-muted-foreground">
            {t('totalTime')}: <span className="font-medium text-foreground">{totalTime} min</span>
          </p>
        )}
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-accent" />
            {t('categories')}
          </h3>
          <span className="text-xs text-muted-foreground">{selectedCategories.length}/{MAX_CATEGORIES}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id)
            const isDisabled = !isSelected && selectedCategories.length >= MAX_CATEGORIES
            return (
              <Badge
                key={category.id}
                variant={isSelected ? 'default' : 'outline'}
                className={cn(
                  "cursor-pointer",
                  isDisabled && "opacity-40 cursor-not-allowed"
                )}
                onClick={() => !isDisabled && onToggleCategory(category.id)}
              >
                {category.icon} {tcat.has(category.slug) ? tcat(category.slug) : category.name}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Tags */}
      {onTagsChange && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-amber-500" />
              {t('tags')}
            </h3>
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={onTagsChange}
              allowCreate
            />
          </div>
        </>
      )}

      <Separator />

      <RecipeIngredients form={form} />

      <Separator />

      <RecipeInstructions form={form} />

      <Separator />
    </div>
  )
}
