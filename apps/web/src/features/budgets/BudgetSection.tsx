import { formatMoney, type Currency, type CurrencyBudgets } from '@chanchito/core'
import { useId } from 'react'
import { Panel } from '@/components/Panel'
import { StaggerList } from '@/components/StaggerList'
import { BudgetItem } from './BudgetItem'
import { CURRENCY_NAME, CURRENCY_TITLE } from './labels'

type Props = { currency: Currency; budgets: CurrencyBudgets }

/** A currency's budgets with their totals, and the expenses that have no budget. */
export function BudgetSection({ currency, budgets }: Props) {
  const name = CURRENCY_NAME[currency]
  const titleId = useId()

  return (
    <Panel aria-labelledby={titleId} className="px-2 sm:px-3">
      <div className="px-3 pb-2">
        <h2 id={titleId} className="text-lg font-semibold">
          {CURRENCY_TITLE[currency]}
        </h2>
        <dl className="mt-3">
          <dt className="text-[15px] text-muted-foreground">Gastado en {name}</dt>
          <dd className="font-mono text-3xl font-medium tracking-tight sm:text-4xl">
            {formatMoney(budgets.spent)}{' '}
            <span className="text-lg tracking-normal text-muted-foreground">
              de {formatMoney(budgets.budgeted)}
            </span>
          </dd>
        </dl>
        {budgets.unbudgetedSpent.amount > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Además, {formatMoney(budgets.unbudgetedSpent)} en categorías sin presupuesto.
          </p>
        )}
      </div>
      <StaggerList aria-label={`Presupuestos en ${name}`}>
        {budgets.progress.map((progress) => (
          <BudgetItem key={progress.budget.id} progress={progress} />
        ))}
      </StaggerList>
    </Panel>
  )
}
