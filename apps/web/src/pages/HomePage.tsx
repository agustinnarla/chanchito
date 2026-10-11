import { currentMonth, formatMonthLabel } from '@chanchito/core'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { CurrencyTotals } from '@/features/balance/CurrencyTotals'
import { useMonthSummary } from '@/features/balance/hooks'

export function HomePage() {
  const month = currentMonth()
  const summary = useMonthSummary(month)

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Inicio</h1>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{formatMonthLabel(month)}</h2>
        <Button asChild variant="outline" size="sm">
          <Link to="/balance">Ver balance</Link>
        </Button>
      </div>
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
        <CurrencyTotals summary={summary.data} />
      )}
    </section>
  )
}
