import {
  formatMonthLabel,
  formatSignedMoney,
  investedThisMonth,
  leftThisMonth,
  savedThisMonth,
  type Currency,
} from '@chanchito/core'
import { useState, type ReactNode } from 'react'
import { AnimatedMoney } from '@/components/AnimatedMoney'
import { MonthNavigation } from '@/components/MonthNavigation'
import { Panel } from '@/components/Panel'
import { Segmented } from '@/components/Segmented'
import { Loading, Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { useMonthParam } from '@/lib/use-month-param'
import { cn } from '@/lib/utils'
import { usePurchases } from '@/features/investments/hooks'
import { useContributions } from '@/features/savings/hooks'
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
  const contributions = useContributions()
  const purchases = usePurchases()
  // Put into savings goals (spec 009) and investments (spec 010) this month: not expenses, but
  // no longer available
  const saved = contributions.data ? savedThisMonth(contributions.data, month)[currency] : null
  const invested = purchases.data ? investedThisMonth(purchases.data, month)[currency] : null
  const left =
    summary.data &&
    leftThisMonth(summary.data[currency], {
      saved: saved ?? { amount: 0, currency },
      invested: invested ?? { amount: 0, currency },
    })
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
          <Loading label="Cargando balance…" className="mt-6 grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[5.25rem] rounded-[20px]" />
            ))}
          </Loading>
        ) : summary.isError ? (
          <div role="alert" className="mt-6 space-y-2">
            <p className="text-destructive">No se pudo calcular el balance del mes.</p>
            <Button variant="secondary" size="sm" onClick={() => void summary.refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <dl className="mt-6 grid gap-3 duration-300 animate-in fade-in sm:grid-cols-3">
            <Figure label="Ingresos">
              <AnimatedMoney money={summary.data[currency].income} />
            </Figure>
            <Figure label="Gastos">
              <AnimatedMoney money={summary.data[currency].expense} />
            </Figure>
            {saved && saved.amount !== 0 && (
              <Figure label="Ahorraste">
                <AnimatedMoney money={saved} />
              </Figure>
            )}
            {invested && invested.amount !== 0 && (
              <Figure label="Invertiste">
                <AnimatedMoney money={invested} />
              </Figure>
            )}
            {/* What's left after saving and investing is the main figure (spec 012) */}
            <Figure label="Te queda" highlight>
              <AnimatedMoney money={left ?? summary.data[currency].net} signed />
            </Figure>
          </dl>
        )}
        {left && summary.data && left.amount !== summary.data[currency].net.amount && (
          <p className="mt-3 text-sm text-muted-foreground">
            Resultado sin contar ahorro e inversión:{' '}
            <span className="font-mono">{formatSignedMoney(summary.data[currency].net)}</span>
          </p>
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
