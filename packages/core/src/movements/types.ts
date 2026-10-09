import type { CategoryKind } from '../categories'
import type { IsoDate } from '../dates'
import type { Currency, Money } from '../money'

export type MovementCategory = {
  id: string
  name: string
  kind: CategoryKind
  archived: boolean
}

/** A stored movement. The amount is always positive; the kind comes from the category. */
export type Movement = {
  id: string
  amount: Money
  occurredOn: IsoDate
  description: string | null
  category: MovementCategory
  /** Timestamp, used to sort movements of the same day. */
  createdAt: string
}

/** What is needed to create or update a movement. */
export type MovementInput = {
  categoryId: string
  amount: Money
  occurredOn: IsoDate
  description: string | null
}

export type MovementFilters = {
  kind?: CategoryKind
  categoryId?: string
  currency?: Currency
}
