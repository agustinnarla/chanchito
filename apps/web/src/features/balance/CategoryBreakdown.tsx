import {
  formatMoney,
  formatShare,
  type CategoryKind,
  type CategoryTotal,
  type Currency,
} from '@chanchito/core'

const KIND_LABEL: Record<CategoryKind, string> = { expense: 'Gastos', income: 'Ingresos' }
const CURRENCY_NAME: Record<Currency, string> = { ARS: 'pesos', USD: 'dólares' }

type Props = { kind: CategoryKind; currency: Currency; totals: CategoryTotal[] }

/** A kind's totals per category in one currency, from the largest to the smallest. */
export function CategoryBreakdown({ kind, currency, totals }: Props) {
  const title = `${KIND_LABEL[kind]} en ${CURRENCY_NAME[currency]} por categoría`

  if (totals.length === 0) {
    return (
      <p className="text-muted-foreground">
        No hay {KIND_LABEL[kind].toLowerCase()} en {CURRENCY_NAME[currency]} este mes.
      </p>
    )
  }

  return (
    <table className="w-full text-sm tabular-nums">
      <caption className="mb-2 text-left font-medium">{title}</caption>
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
              {category.archived && <span className="ml-2 text-muted-foreground">(archivada)</span>}
            </th>
            <td className="py-1.5 pr-2 text-right">{formatMoney(total)}</td>
            <td className="w-12 py-1.5 text-right text-muted-foreground">{formatShare(share)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
