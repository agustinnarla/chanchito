/**
 * TanStack Query keys, in a module without dependencies: a feature can invalidate another
 * feature's data without importing its data layer.
 */
export const queryKeys = {
  categories: ['categories'],
  movements: ['movements'],
  budgets: ['budgets'],
  /** Goals and contributions: one root, so a change refreshes both. */
  savings: ['savings'],
  purchases: ['crypto-purchases'],
  preferences: ['preferences'],
} as const
