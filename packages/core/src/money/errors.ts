export type MoneyErrorCode =
  'empty' | 'negative' | 'invalid_format' | 'too_many_decimals' | 'too_large' | 'currency_mismatch'

/** Domain error for money operations. `message` is user-facing (Spanish). */
export class MoneyError extends Error {
  override readonly name = 'MoneyError'

  constructor(
    readonly code: MoneyErrorCode,
    message: string,
  ) {
    super(message)
  }
}
