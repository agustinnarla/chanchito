import { z } from 'zod'
import { normalizeCategoryName } from './names'

export const CATEGORY_KINDS = ['income', 'expense'] as const

export const CATEGORY_NAME_MAX_LENGTH = 50

export const CategoryKindSchema = z.enum(CATEGORY_KINDS)

/** Counts code points like Postgres `char_length`, so an emoji counts as one character. */
const characterCount = (value: string) => [...value].length

export const CategoryNameSchema = z
  .string()
  .transform(normalizeCategoryName)
  .pipe(
    z
      .string()
      .min(1, 'Ingresá un nombre.')
      .refine((name) => characterCount(name) <= CATEGORY_NAME_MAX_LENGTH, {
        message: `El nombre puede tener hasta ${CATEGORY_NAME_MAX_LENGTH} caracteres.`,
      }),
  )

/** What the user types to create or rename a category. */
export const CategoryInputSchema = z.object({
  name: CategoryNameSchema,
  kind: CategoryKindSchema,
})

/** A stored category. */
export const CategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  kind: CategoryKindSchema,
})
