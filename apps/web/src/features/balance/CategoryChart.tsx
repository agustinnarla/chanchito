import { formatMoney, formatShare, type CategoryKind, type CategoryTotal } from '@chanchito/core'
import { Bar, BarChart, LabelList, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import { shortenName } from './labels'

const BAR_COLOR: Record<CategoryKind, string> = {
  expense: 'var(--chart-expense)',
  income: 'var(--chart-income)',
}
const ROW_HEIGHT = 32
const NAME_WIDTH = 112

type Datum = {
  id: string
  name: string
  archived: boolean
  amount: number
  total: string
  share: string
}

/** One bar per category. The full name and the amount are in the tooltip and the table. */
function toChartData(totals: readonly CategoryTotal[]): Datum[] {
  return totals.map(({ category, total, share }) => ({
    id: category.id,
    name: category.name,
    archived: category.archived,
    amount: total.amount,
    total: formatMoney(total),
    share: formatShare(share),
  }))
}

type Props = { kind: CategoryKind; title: string; totals: CategoryTotal[] }

/** Horizontal bars from the largest category to the smallest, with its share at the tip. */
export function CategoryChart({ kind, title, totals }: Props) {
  const data = toChartData(totals)

  return (
    <div>
      <BarChart
        title={`Gráfico de ${title.toLowerCase()}`}
        responsive
        layout="vertical"
        data={data}
        style={{ width: '100%', height: data.length * ROW_HEIGHT + 8 }}
        margin={{ top: 4, right: 40, bottom: 4, left: 0 }}
      >
        <XAxis type="number" dataKey="amount" hide domain={[0, 'dataMax']} />
        <YAxis
          type="category"
          dataKey="name"
          width={NAME_WIDTH}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          tickFormatter={shortenName}
        />
        <Tooltip cursor={{ fill: 'var(--muted)' }} content={ChartTooltip} />
        <Bar
          dataKey="amount"
          fill={BAR_COLOR[kind]}
          maxBarSize={16}
          radius={[0, 4, 4, 0]}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="share"
            position="right"
            style={{ fill: 'var(--foreground)', fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </div>
  )
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  const datum = payload[0]?.payload as Datum | undefined
  if (!active || !datum) return null

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="font-medium">
        {datum.name}
        {datum.archived && <span className="ml-1 text-muted-foreground">(archivada)</span>}
      </p>
      <p className="tabular-nums">
        {datum.total} · {datum.share}
      </p>
    </div>
  )
}
