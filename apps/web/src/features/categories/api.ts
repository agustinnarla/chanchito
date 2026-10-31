import { createCategoriesApi } from '@chanchito/data'
import { supabase } from '@/lib/supabase'

export const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  createSuggestedCategories,
} = createCategoriesApi(supabase)
