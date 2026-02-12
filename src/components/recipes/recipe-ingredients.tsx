'use client'

import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { INGREDIENT_UNITS } from '@/lib/constants'
import type { RecipeFormData } from '@/lib/schemas/recipe'
import { useTranslations } from 'next-intl'

interface RecipeIngredientsProps {
  form: UseFormReturn<RecipeFormData>
}

export function RecipeIngredients({ form }: RecipeIngredientsProps) {
  const t = useTranslations('recipeForm')
  const tc = useTranslations('common')

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control: form.control,
    name: 'ingredients',
  })

  return (
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
  )
}
