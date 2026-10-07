import { formatMoney, sumByCurrency } from '@finanzas/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function HomePage() {
  // No movements yet (spec 003); the balance is always calculated, never stored.
  const totals = sumByCurrency([])

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Inicio</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Balance en pesos</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {formatMoney(totals.ARS)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance en dólares</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {formatMoney(totals.USD)}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
