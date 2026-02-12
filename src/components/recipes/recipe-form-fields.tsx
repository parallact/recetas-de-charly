'use client'

import { useEffect, useState } from 'react'
import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
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
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { ImageUpload } from '@/components/ui/image-upload'
import { TagSelector } from './tag-selector'
import { INGREDIENT_UNITS } from '@/lib/constants'
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
  const tc = useTranslations('common')
  const td = useTranslations('difficulty')

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  })

  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
  } = useFieldArray({
    control: form.control,
    name: 'instructions',
  })

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
              {category.icon} {category.name}
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

      {/* Ingredients */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{t('ingredientsTitle')}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendIngredient({ name: '', quantity: '', unit: '', customUnit: '' })}
          >
            <Plus className="h-4 w-4 mr-1" />
            {tc('add')}
          </Button>
        </div>

        <div className="space-y-4">
          {ingredientFields.map((field, index) => {
            const unitValue = form.watch(`ingredients.${index}.unit`)
            return (
              <div key={field.id} className="space-y-2 p-3 bg-muted/30 rounded-lg sm:p-0 sm:bg-transparent sm:rounded-none">
                {/* Mobile: Ingredient name first, full width */}
                <div className="flex items-center gap-2 sm:hidden">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={t('ingredientPlaceholder', { index: index + 1 })} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredientFields.length === 1}
                    aria-label={t('removeIngredient')}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                {/* Mobile: Quantity and unit on second row */}
                <div className="flex items-center gap-2 pl-6 sm:hidden">
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-20">
                        <FormControl>
                          <Input placeholder={t('quantity')} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.unit`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('unit')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INGREDIENT_UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  {unitValue === 'otro' && (
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.customUnit`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl>
                            <Input placeholder={t('unit')} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Desktop: All in one row */}
                <div className="hidden sm:flex items-start gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground mt-3 shrink-0" />

                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-20">
                        <FormControl>
                          <Input placeholder={t('quantity')} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.unit`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('unit')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INGREDIENT_UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {unitValue === 'otro' && (
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.customUnit`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl>
                            <Input placeholder={t('unit')} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name={`ingredients.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={t('ingredientPlaceholder', { index: index + 1 })} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredientFields.length === 1}
                    className="mt-0.5"
                    aria-label={t('removeIngredient')}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        {form.formState.errors.ingredients?.message && (
          <p className="text-sm text-destructive">{form.formState.errors.ingredients.message}</p>
        )}
      </div>

      <Separator />

      {/* Instructions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{t('instructionsTitle')}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendInstruction({ content: '' })}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('addStep')}
          </Button>
        </div>

        <div className="space-y-3">
          {instructionFields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium shrink-0 mt-1">
                {index + 1}
              </div>

              <FormField
                control={form.control}
                name={`instructions.${index}.content`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        placeholder={t('stepPlaceholder', { index: index + 1 })}
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeInstruction(index)}
                disabled={instructionFields.length === 1}
                className="mt-1"
                aria-label={t('removeStep')}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        {form.formState.errors.instructions?.message && (
          <p className="text-sm text-destructive">{form.formState.errors.instructions.message}</p>
        )}
      </div>

      <Separator />
    </div>
  )
}
