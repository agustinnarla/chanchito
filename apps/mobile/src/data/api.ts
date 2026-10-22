import { createCategoriesApi, createMovementsApi } from '@chanchito/data'
import { supabase } from '@/lib/supabase'

/** The data layer on the app's Supabase client. Tests replace this module with a fake. */
export const categoriesApi = createCategoriesApi(supabase)
export const movementsApi = createMovementsApi(supabase)
