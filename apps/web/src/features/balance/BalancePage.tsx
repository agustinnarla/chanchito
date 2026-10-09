import { formatMonthLabel, type Currency, type CurrencySummary } from '@chanchito/core'
import { MonthNavigation } from '@/components/MonthNavigation'
import { Button } from '@/components/ui/button'
import { useMonthParam } from '@/lib/use-month-param'
import { CategoryBreakdown } from './CategoryBreakdown'
import { CURRENCY_LABEL, CurrencyTotals } from './CurrencyTotals'
import { useMonthSummary } from './hooks'

const CURRENCIES: Currency[] = ['ARS', 'USD']

const hasMovements = (s: CurrencySummary) =>
  s.incomeByCategory.length > 0 || s.expenseByCategory.length > 0

export function BalancePage() {
  const [month, goToMonth] = useMonthParam()
  const summary = useMonthSummary(month)
  const withMovements = summary.data
    ? CURRENCIES.filter((currency) => hasMovements(summary.data[currency]))
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Balance</h1>
      <MonthNavigation month={month} onChange={goToMonth} />
      {summary.isPending ? (
        <p className="text-muted-foreground">Cargando balance…</p>
      ) : summary.isError ? (
        <div role="alert" className="space-y-2">
          <p className="text-destructive">No se pudo calcular el balance del mes.</p>
          <Button variant="outline" size="sm" onClick={() => void summary.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <CurrencyTotals summary={summary.data} />
          {withMovements.length === 0 ? (
            <p className="text-muted-foreground">
              No hay movimientos en {formatMonthLabel(month).toLowerCase()}.
            </p>
          ) : (
            withMovements.map((currency) => (
              <section key={currency} className="space-y-4">
                <h2 className="text-lg font-semibold">{CURRENCY_LABEL[currency]}</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  <CategoryBreakdown
                    kind="expense"
                    currency={currency}
                    totals={summary.data[currency].expenseByCategory}
                  />
                  <CategoryBreakdown
                    kind="income"
                    currency={currency}
                    totals={summary.data[currency].incomeByCategory}
                  />
                </div>
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}
