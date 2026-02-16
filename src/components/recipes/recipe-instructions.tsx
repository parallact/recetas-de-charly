'use client'

import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Plus, Trash2 } from 'lucide-react'
import type { RecipeFormData } from '@/lib/schemas/recipe'
import { useTranslations } from 'next-intl'

const MAX_INSTRUCTIONS = 30

interface RecipeInstructionsProps {
  form: UseFormReturn<RecipeFormData>
}

export function RecipeInstructions({ form }: RecipeInstructionsProps) {
  const t = useTranslations('recipeForm')

  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
  } = useFieldArray({
    control: form.control,
    name: 'instructions',
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-primary" />
          {t('instructionsTitle')}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{instructionFields.length}/{MAX_INSTRUCTIONS}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendInstruction({ content: '' })}
            disabled={instructionFields.length >= MAX_INSTRUCTIONS}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('addStep')}
          </Button>
        </div>
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
                      maxLength={1000}
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
  )
}
