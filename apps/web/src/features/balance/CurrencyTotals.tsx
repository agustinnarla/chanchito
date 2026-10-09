import { formatMoney, formatSignedMoney, type Currency, type MonthSummary } from '@chanchito/core'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const CURRENCY_LABEL: Record<Currency, string> = { ARS: 'Pesos', USD: 'Dólares' }

const CURRENCIES: Currency[] = ['ARS', 'USD']

/** One card per currency with income, expenses and the net result. Always both currencies. */
export function CurrencyTotals({ summary }: { summary: MonthSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {CURRENCIES.map((currency) => {
        const { income, expense, net } = summary[currency]
        const titleId = `totales-${currency}`
        return (
          <Card key={currency} role="region" aria-labelledby={titleId}>
            <CardHeader>
              <CardTitle id={titleId}>{CURRENCY_LABEL[currency]}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 tabular-nums">
                <dt className="text-muted-foreground">Ingresos</dt>
                <dd className="text-right">{formatMoney(income)}</dd>
                <dt className="text-muted-foreground">Gastos</dt>
                <dd className="text-right">{formatMoney(expense)}</dd>
                <dt className="mt-2 border-t pt-2 font-medium">Resultado</dt>
                <dd
                  className={cn(
                    'mt-2 border-t pt-2 text-right text-2xl font-semibold',
                    net.amount < 0 && 'text-destructive',
                  )}
                >
                  {formatSignedMoney(net)}
                </dd>
              </dl>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
