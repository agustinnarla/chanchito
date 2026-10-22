import { createMovementsApi } from '@chanchito/data'
import { supabase } from '@/lib/supabase'

export const { listMovements, createMovement, updateMovement, deleteMovement } =
  createMovementsApi(supabase)
