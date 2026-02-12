'use client'

import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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
        <h3 className="font-medium">{t('basicInfo')}</h3>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('title')}</FormLabel>
              <FormControl>
                <Input placeholder={t('titlePlaceholder')} {...field} />
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
                    placeholder="15"
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
                    placeholder="30"
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
                    placeholder="4"
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
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-4">
        <h3 className="font-medium">{t('categories')}</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategories.includes(category.id) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onToggleCategory(category.id)}
            >
              {category.icon} {tcat.has(category.slug) ? tcat(category.slug) : category.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tags */}
      {onTagsChange && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-medium">{t('tags')}</h3>
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
