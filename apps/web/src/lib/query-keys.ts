/**
 * TanStack Query keys, in a module without dependencies: a feature can invalidate another
 * feature's data without importing its data layer.
 */
export const queryKeys = {
  categories: ['categories'],
  movements: ['movements'],
  budgets: ['budgets'],
} as const
