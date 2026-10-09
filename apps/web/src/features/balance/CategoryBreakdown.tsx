import {
  formatMoney,
  formatShare,
  type CategoryKind,
  type CategoryTotal,
  type Currency,
} from '@chanchito/core'
import { useId } from 'react'
import { CategoryChart } from './CategoryChart'

const KIND_LABEL: Record<CategoryKind, string> = { expense: 'Gastos', income: 'Ingresos' }
const CURRENCY_NAME: Record<Currency, string> = { ARS: 'pesos', USD: 'dólares' }

type Props = { kind: CategoryKind; currency: Currency; totals: CategoryTotal[] }

/** A kind's totals per category in one currency, from the largest to the smallest. */
export function CategoryBreakdown({ kind, currency, totals }: Props) {
  const titleId = useId()
  const title = `${KIND_LABEL[kind]} en ${CURRENCY_NAME[currency]} por categoría`

  if (totals.length === 0) {
    return (
      <p className="text-muted-foreground">
        No hay {KIND_LABEL[kind].toLowerCase()} en {CURRENCY_NAME[currency]} este mes.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h3 id={titleId} className="font-medium">
        {title}
      </h3>
      <CategoryChart kind={kind} title={title} totals={totals} />
      <table aria-labelledby={titleId} className="w-full text-sm tabular-nums">
        <thead className="sr-only">
          <tr>
            <th scope="col">Categoría</th>
            <th scope="col">Monto</th>
            <th scope="col">Porcentaje</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {totals.map(({ category, total, share }) => (
            <tr key={category.id}>
              <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                {category.name}
                {category.archived && (
                  <span className="ml-2 text-muted-foreground">(archivada)</span>
                )}
              </th>
              <td className="py-1.5 pr-2 text-right">{formatMoney(total)}</td>
              <td className="w-12 py-1.5 text-right text-muted-foreground">{formatShare(share)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
