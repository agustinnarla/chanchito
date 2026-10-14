import { addWeeks, formatWeekLabel, type Week } from '@chanchito/core'
import { Icon } from '@/components/Icon'

type Props = { week: Week; onChange: (week: Week) => void }

const arrow =
  'flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground'

/** ← Semana del 12 al 18 de octubre → (spec 013), like the month navigation. */
export function WeekNavigation({ week, onChange }: Props) {
  return (
    <nav aria-label="Semana" className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Semana anterior"
        className={arrow}
        onClick={() => onChange(addWeeks(week, -1))}
      >
        <Icon name="chevron_left" />
      </button>
      <h2 className="text-center text-[15px] font-semibold" aria-live="polite">
        {/* Keyed by week so the new one fades in; the live region itself stays */}
        <span
          key={week}
          className="inline-block duration-300 ease-emphasized animate-in fade-in slide-in-from-bottom-1"
        >
          {formatWeekLabel(week)}
        </span>
      </h2>
      <button
        type="button"
        aria-label="Semana siguiente"
        className={arrow}
        onClick={() => onChange(addWeeks(week, 1))}
      >
        <Icon name="chevron_right" />
      </button>
    </nav>
  )
}
