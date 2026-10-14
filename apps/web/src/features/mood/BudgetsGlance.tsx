import { formatBudgetStatus, type BudgetProgress, type WeeklyBudgetProgress } from '@chanchito/core'
import { Link } from 'react-router'
import { CategoryEmoji } from '@/components/CategoryEmoji'
import { Icon } from '@/components/Icon'
import { Panel } from '@/components/Panel'
import { Shaped } from '@/components/Shaped'
import { BUDGET_TONE } from './tone'

const STATUS_ICON = { ok: 'check_circle', warning: 'warning', exceeded: 'error' } as const
const ORDER = { exceeded: 0, warning: 1, ok: 2 } as const
const MAX = 3

type Props = {
  progress: readonly BudgetProgress[]
  /** This week's weekly budgets (spec 013), when the month on screen is the current one. */
  weekly?: readonly WeeklyBudgetProgress[]
  month: string
}

/**
 * Up to 3 budgets on Inicio, the ones that need attention first, each with its tone (spec 008).
 * Monthly and weekly ones mix, each marked "mes" or "semana" (spec 013).
 */
export function BudgetsGlance({ progress, weekly = [], month }: Props) {
  const items = [
    ...progress.map((item) => ({ item, period: 'mes' as const })),
    ...weekly.map((item) => ({ item, period: 'semana' as const })),
  ]
  const shown = items
    .sort((a, b) => ORDER[a.item.status] - ORDER[b.item.status] || b.item.ratio - a.item.ratio)
    .slice(0, MAX)
  if (shown.length === 0) return null

  return (
    <Panel className="px-3 sm:px-4">
      <div className="flex items-center justify-between px-3 pb-3">
        <h2 className="text-lg font-semibold">Tus presupuestos</h2>
        <Link
          viewTransition
          to={`/presupuestos?mes=${month}`}
          aria-label="Ver todos los presupuestos"
          className="rounded-full bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-surface-high"
        >
          Ver todos
        </Link>
      </div>
      <ul aria-label="Presupuestos que más atención necesitan" className="space-y-2">
        {shown.map(({ item, period }) => (
          <li
            key={`${period}-${item.budget.id}`}
            data-tone={BUDGET_TONE[item.status]}
            className="group flex items-center gap-3.5 rounded-[22px] bg-tone-soft py-2.5 pr-4 pl-2.5 transition-colors duration-500"
          >
            <Shaped shape="cookie" className="size-12" shapeClassName="shape-morph bg-tone-glow">
              <CategoryEmoji emoji={item.budget.category.emoji} />
            </Shaped>
            <div className="min-w-0 flex-1">
              <p className="flex justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[15px] font-semibold">
                    {item.budget.category.name}
                  </span>
                  {weekly.length > 0 && (
                    <span className="shrink-0 rounded-full bg-tone-chip px-2 py-0.5 text-[11px] font-semibold text-tone-on-chip">
                      {period}
                    </span>
                  )}
                </span>
                <span className="font-mono text-sm">{Math.round(item.ratio * 100)}%</span>
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px]">
                <Icon
                  name={STATUS_ICON[item.status]}
                  filled
                  className="size-[18px] text-tone-strong"
                />
                {formatBudgetStatus(item)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
