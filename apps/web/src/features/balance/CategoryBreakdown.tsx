import {
  formatMoney,
  formatShare,
  type CategoryKind,
  type CategoryTotal,
  type Currency,
} from '@chanchito/core'
import { useId } from 'react'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { cn } from '@/lib/utils'

const KIND_LABEL: Record<CategoryKind, string> = { expense: 'Gastos', income: 'Ingresos' }
const CURRENCY_NAME: Record<Currency, string> = { ARS: 'pesos', USD: 'dólares' }

type Props = { kind: CategoryKind; currency: Currency; totals: CategoryTotal[] }

/**
 * A kind's totals per category in one currency, largest first: each row with its emoji, amount,
 * share and a bar relative to the largest. Announced as a table, so it reads well without the bars.
 */
export function CategoryBreakdown({ kind, currency, totals }: Props) {
  const titleId = useId()
  const title = `${KIND_LABEL[kind]} en ${CURRENCY_NAME[currency]} por categoría`
  const largest = totals[0]?.total.amount ?? 0

  return (
    <section className="rounded-[28px] bg-surface-low p-5 sm:p-6">
      <h3 id={titleId} className="mb-4 text-lg font-semibold">
        {KIND_LABEL[kind]} por categoría
        <span className="sr-only"> en {CURRENCY_NAME[currency]}</span>
      </h3>
      {totals.length === 0 ? (
        <p className="text-muted-foreground">
          No hay {KIND_LABEL[kind].toLowerCase()} en {CURRENCY_NAME[currency]} este mes.
        </p>
      ) : (
        <div role="table" aria-label={title} className="space-y-4">
          <div role="row" className="sr-only">
            <span role="columnheader">Categoría</span>
            <span role="columnheader">Monto</span>
            <span role="columnheader">Porcentaje</span>
          </div>
          {totals.map(({ category, total, share }) => (
            <div
              key={category.id}
              role="row"
              className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5"
            >
              <CategoryEmoji emoji={category.emoji} className="row-span-2" />
              <span role="rowheader" className="truncate text-[15px] font-medium">
                {category.name}
                {category.archived && (
                  <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                    (archivada)
                  </span>
                )}
              </span>
              <span className="font-mono text-sm whitespace-nowrap">
                <span role="cell">{formatMoney(total)}</span>{' '}
                <span className="text-muted-foreground">
                  · <span role="cell">{formatShare(share)}</span>
                </span>
              </span>
              <span
                aria-hidden="true"
                className="col-span-2 h-2.5 overflow-hidden rounded-full bg-surface-high"
              >
                <span
                  className={cn(
                    'block h-full rounded-full',
                    kind === 'expense' ? 'bg-chart-expense' : 'bg-chart-income',
                  )}
                  style={{ width: `${(total.amount / largest) * 100}%` }}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
