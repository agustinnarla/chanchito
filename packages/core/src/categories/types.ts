import type { z } from 'zod'
import type { CategoryInputSchema, CategoryKindSchema, CategorySchema } from './schema'

export type CategoryKind = z.infer<typeof CategoryKindSchema>

export type CategoryInput = z.infer<typeof CategoryInputSchema>

export type Category = z.infer<typeof CategorySchema>
