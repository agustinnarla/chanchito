import { summarizeBudgets, type Currency, type CurrencyBudgets } from '@chanchito/core'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { MonthNavigation } from '@/components/MonthNavigation'
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Presupuestos</h1>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <MonthNavigation month={month} onChange={goToMonth} />
        <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
          <Plus />
          Nuevo presupuesto
        </Button>
      </div>
      {budgets.isError || movements.isError ? (
        <div role="alert" className="space-y-2">
          <p className="text-destructive">No se pudieron cargar los presupuestos.</p>
          <Button variant="outline" size="sm" onClick={retry}>
            Reintentar
          </Button>
        </div>
      ) : budgets.isPending || movements.isPending ? (
        <p className="text-muted-foreground">Cargando presupuestos…</p>
      ) : budgets.data.length === 0 ? (
        <EmptyMonth month={month} onCreate={() => setCreating(true)} />
      ) : (
        <BudgetSections summary={summarizeBudgets(budgets.data, movements.data, month)} />
      )}
      <BudgetDialog open={creating} onOpenChange={setCreating} month={month} />
    </div>
  )
}

function BudgetSections({ summary }: { summary: Record<Currency, CurrencyBudgets> }) {
  return CURRENCIES.filter((currency) => summary[currency].progress.length > 0).map((currency) => (
    <BudgetSection key={currency} currency={currency} budgets={summary[currency]} />
  ))
}
