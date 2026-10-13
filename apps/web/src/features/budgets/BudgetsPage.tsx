import { summarizeBudgets, type Currency, type CurrencyBudgets, type Month } from '@chanchito/core'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import { MonthNavigation } from '@/components/MonthNavigation'
import { Panel } from '@/components/Panel'
import { Loading, Skeleton, SkeletonRows } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { movementsQuery } from '@/features/movements/hooks'
import { useMonthParam } from '@/lib/use-month-param'
import { BudgetDialog } from './BudgetDialog'
import { BudgetSection } from './BudgetSection'
import { EmptyMonth } from './EmptyMonth'
import { useBudgets } from './hooks'

const CURRENCIES: Currency[] = ['ARS', 'USD']

export function BudgetsPage() {
  const [month, goToMonth] = useMonthParam()
  const budgets = useBudgets(month)
  // Same query as Movimientos and Balance: changing a movement updates the progress.
  const movements = useQuery(movementsQuery(month))
  const [creating, setCreating] = useState(false)

  function retry() {
    if (budgets.isError) void budgets.refetch()
    if (movements.isError) void movements.refetch()
  }

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Presupuestos</h1>
      <Panel className="flex flex-wrap items-center justify-between gap-3">
        <MonthNavigation month={month} onChange={goToMonth} />
        <Button variant="secondary" onClick={() => setCreating(true)}>
          <Icon name="add" className="size-5" />
          Nuevo presupuesto
        </Button>
      </Panel>
      {budgets.isError || movements.isError ? (
        <Panel role="alert" className="space-y-2">
          <p className="text-destructive">No se pudieron cargar los presupuestos.</p>
          <Button variant="secondary" size="sm" onClick={retry}>
            Reintentar
          </Button>
        </Panel>
      ) : budgets.isPending || movements.isPending ? (
        <Panel className="px-2 sm:px-3">
          <Loading label="Cargando presupuestos…">
            <div className="space-y-2 px-3 pb-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-56" />
            </div>
            <SkeletonRows count={3} />
          </Loading>
        </Panel>
      ) : budgets.data.length === 0 ? (
        <Panel>
          <EmptyMonth month={month} onCreate={() => setCreating(true)} />
        </Panel>
      ) : (
        <BudgetSections
          month={month}
          summary={summarizeBudgets(budgets.data, movements.data, month)}
        />
      )}
      <BudgetDialog open={creating} onOpenChange={setCreating} month={month} />
    </div>
  )
}

function BudgetSections({
  month,
  summary,
}: {
  month: Month
  summary: Record<Currency, CurrencyBudgets>
}) {
  return CURRENCIES.filter((currency) => summary[currency].progress.length > 0).map((currency) => (
    // Keyed by month too: a new month staggers its budgets and grows its bars again
    <BudgetSection key={`${month}-${currency}`} currency={currency} budgets={summary[currency]} />
  ))
}
