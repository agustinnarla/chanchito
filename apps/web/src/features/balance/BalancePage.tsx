import { formatMonthLabel, type Currency } from '@chanchito/core'
import { useState, type ReactNode } from 'react'
import { AnimatedMoney } from '@/components/AnimatedMoney'
import { MonthNavigation } from '@/components/MonthNavigation'
import { Panel } from '@/components/Panel'
import { Segmented } from '@/components/Segmented'
import { Button } from '@/components/ui/button'
import { useMonthParam } from '@/lib/use-month-param'
import { cn } from '@/lib/utils'
import { CategoryBreakdown } from './CategoryBreakdown'
import { useMonthSummary } from './hooks'

const CURRENCIES = [
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
] as const

export function BalancePage() {
  const [month, goToMonth] = useMonthParam()
  const [currency, setCurrency] = useState<Currency>('ARS')
  const summary = useMonthSummary(month)
  const data = summary.data
  const isEmpty =
    data !== undefined &&
    (['ARS', 'USD'] as const).every(
      (c) => data[c].incomeByCategory.length === 0 && data[c].expenseByCategory.length === 0,
    )

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Balance</h1>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MonthNavigation month={month} onChange={goToMonth} />
          <Segmented label="Moneda" options={CURRENCIES} value={currency} onChange={setCurrency} />
        </div>
        {summary.isPending ? (
          <p className="mt-6 text-muted-foreground">Cargando balance…</p>
        ) : summary.isError ? (
          <div role="alert" className="mt-6 space-y-2">
            <p className="text-destructive">No se pudo calcular el balance del mes.</p>
            <Button variant="secondary" size="sm" onClick={() => void summary.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <Figure label="Ingresos">
              <AnimatedMoney money={summary.data[currency].income} />
            </Figure>
            <Figure label="Gastos">
              <AnimatedMoney money={summary.data[currency].expense} />
            </Figure>
            <Figure label="Resultado" highlight>
              <AnimatedMoney money={summary.data[currency].net} signed />
            </Figure>
          </dl>
        )}
      </Panel>

      {data &&
        (isEmpty ? (
          <Panel>
            <p className="text-muted-foreground">
              No hay movimientos en {formatMonthLabel(month).toLowerCase()}.
            </p>
          </Panel>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryBreakdown
              key={`expense-${month}-${currency}`}
              kind="expense"
              currency={currency}
              totals={data[currency].expenseByCategory}
            />
            <CategoryBreakdown
              key={`income-${month}-${currency}`}
              kind="income"
              currency={currency}
              totals={data[currency].incomeByCategory}
            />
          </div>
        ))}
    </div>
  )
}

function Figure({
  label,
  highlight = false,
  children,
}: {
  label: string
  highlight?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-[20px] px-5 py-4',
        highlight ? 'bg-active text-active-foreground' : 'bg-surface',
      )}
    >
      <dt className={cn('text-[13px]', !highlight && 'text-muted-foreground')}>{label}</dt>
      <dd className="mt-1.5 font-mono text-2xl font-medium">{children}</dd>
    </div>
  )
}
