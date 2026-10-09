import { formatMoney, type Currency, type CurrencyBudgets } from '@chanchito/core'
import { BudgetItem } from './BudgetItem'
import { CURRENCY_NAME, CURRENCY_TITLE } from './labels'

type Props = { currency: Currency; budgets: CurrencyBudgets }

/** A currency's budgets with their totals, and the expenses that have no budget. */
export function BudgetSection({ currency, budgets }: Props) {
  const title = CURRENCY_TITLE[currency]
  const name = CURRENCY_NAME[currency]

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="tabular-nums">
        Gastado {formatMoney(budgets.spent)} de {formatMoney(budgets.budgeted)}
      </p>
      {budgets.unbudgetedSpent.amount > 0 && (
        <p className="text-sm text-muted-foreground">
          Además, {formatMoney(budgets.unbudgetedSpent)} en categorías sin presupuesto.
        </p>
      )}
      <ul aria-label={`Presupuestos en ${name}`} className="divide-y rounded-lg border">
        {budgets.progress.map((progress) => (
          <BudgetItem key={progress.budget.id} progress={progress} />
        ))}
      </ul>
    </section>
  )
}
