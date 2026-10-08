import { addMonths, formatMonthLabel, type Month } from '@chanchito/core'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = { month: Month; onChange: (month: Month) => void }

export function MonthNavigation({ month, onChange }: Props) {
  return (
    <nav aria-label="Mes" className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Mes anterior"
        onClick={() => onChange(addMonths(month, -1))}
      >
        <ChevronLeft />
      </Button>
      <h2 className="min-w-40 text-center text-lg font-semibold" aria-live="polite">
        {formatMonthLabel(month)}
      </h2>
      <Button
        variant="outline"
        size="icon"
        aria-label="Mes siguiente"
        onClick={() => onChange(addMonths(month, 1))}
      >
        <ChevronRight />
      </Button>
    </nav>
  )
}
