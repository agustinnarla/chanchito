import { formatMoney, type Currency, type CurrencyBudgets } from '@chanchito/core'
import { BudgetItem } from './BudgetItem'

const CURRENCY = {
  ARS: { title: 'Pesos', name: 'pesos' },
  USD: { title: 'Dólares', name: 'dólares' },
} as const satisfies Record<Currency, { title: string; name: string }>

type Props = { currency: Currency; budgets: CurrencyBudgets }

/** A currency's budgets with their totals, and the expenses that have no budget. */
export function BudgetSection({ currency, budgets }: Props) {
  const { title, name } = CURRENCY[currency]

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
