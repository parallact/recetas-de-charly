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

const MAX_INGREDIENTS = 25

/** Block "e", "E", "+", "-" in number inputs */
function blockInvalidNumberKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault()
  }
}

/** Clamp numeric input value to max digits and max value */
function clampNumericInput(e: React.FormEvent<HTMLInputElement>, maxDigits: number, maxValue: number) {
  const input = e.currentTarget
  if (input.value.length > maxDigits) {
    input.value = input.value.slice(0, maxDigits)
  }
  const num = Number(input.value)
  if (num > maxValue) {
    input.value = String(maxValue)
  }
}

/** Filter out characters that don't match letters and spaces */
function filterLettersOnly(e: React.FormEvent<HTMLInputElement>) {
  const input = e.currentTarget
  input.value = input.value.replace(/[^A-Za-zÀ-ÿñÑ\s]/g, '')
}

interface RecipeIngredientsProps {
  form: UseFormReturn<RecipeFormData>
}

export function RecipeIngredients({ form }: RecipeIngredientsProps) {
  const t = useTranslations('recipeForm')
  const tc = useTranslations('common')
  const tu = useTranslations('units')

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
        <h3 className="font-semibold text-base flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-accent" />
          {t('ingredientsTitle')}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{ingredientFields.length}/{MAX_INGREDIENTS}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendIngredient({ name: '', quantity: '', unit: '', customUnit: '' })}
            disabled={ingredientFields.length >= MAX_INGREDIENTS}
          >
            <Plus className="h-4 w-4 mr-1" />
            {tc('add')}
          </Button>
        </div>
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
                        <Input placeholder={t('ingredientPlaceholder', { index: index + 1 })} maxLength={100} onInput={filterLettersOnly} {...field} />
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
                        <Input type="number" inputMode="decimal" step="any" min="0" max="9999" onKeyDown={blockInvalidNumberKeys} onInput={(e) => clampNumericInput(e, 4, 9999)} placeholder={t('quantity')} {...field} />
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
                              {tu(unit.translationKey)}
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
                          <Input placeholder={t('unit')} maxLength={20} {...field} />
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
                        <Input type="number" inputMode="decimal" step="any" min="0" max="9999" onKeyDown={blockInvalidNumberKeys} onInput={(e) => clampNumericInput(e, 4, 9999)} placeholder={t('quantity')} {...field} />
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
                              {tu(unit.translationKey)}
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
                          <Input placeholder={t('unit')} maxLength={20} {...field} />
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
                        <Input placeholder={t('ingredientPlaceholder', { index: index + 1 })} maxLength={100} onInput={filterLettersOnly} {...field} />
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
