import { addMonths, formatMonthLabel, type Month } from '@chanchito/core'
import { Icon } from '@/components/Icon'

type Props = { month: Month; onChange: (month: Month) => void }

const arrow =
  'flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground'

export function MonthNavigation({ month, onChange }: Props) {
  return (
    <nav aria-label="Mes" className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Mes anterior"
        className={arrow}
        onClick={() => onChange(addMonths(month, -1))}
      >
        <Icon name="chevron_left" />
      </button>
      <h2 className="min-w-36 text-center text-lg font-semibold" aria-live="polite">
        {formatMonthLabel(month)}
      </h2>
      <button
        type="button"
        aria-label="Mes siguiente"
        className={arrow}
        onClick={() => onChange(addMonths(month, 1))}
      >
        <Icon name="chevron_right" />
      </button>
    </nav>
  )
}
