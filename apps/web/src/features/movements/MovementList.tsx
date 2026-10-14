import { formatDate, groupEntriesByDay, type MonthEntry, type Movement } from '@chanchito/core'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStaggerIn } from '@/lib/use-stagger-in'
import { DeleteMovementDialog } from './DeleteMovementDialog'
import { MovementDialog } from './MovementDialog'
import { MovementItem } from './MovementItem'
import { SetAsideItem } from './SetAsideItem'
import { entryKey } from './use-month-entries'

type Props = { label: string; entries: MonthEntry[] }

/**
 * The month's movements, savings and investments (spec 012) grouped by day, newest first (they
 * come sorted). Remount it to stagger them again.
 */
export function MovementList({ label, entries }: Props) {
  const ref = useStaggerIn<HTMLElement>('h3, li')
  return (
    <section ref={ref} aria-label={label} className="space-y-2">
      {groupEntriesByDay(entries).map((day) => (
        <div key={day.date}>
          <h3 className="px-3.5 pt-2 pb-1 text-[13px] font-semibold text-muted-foreground">
            {day.label}
          </h3>
          <ul aria-label={day.label}>
            {day.entries.map((entry) =>
              entry.kind === 'movement' ? (
                <MovementRow key={entryKey(entry)} movement={entry.movement} />
              ) : (
                <SetAsideItem key={entryKey(entry)} entry={entry} />
              ),
            )}
          </ul>
        </div>
      ))}
    </section>
  )
}

function MovementRow({ movement }: { movement: Movement }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const describe = `${movement.category.name} del ${formatDate(movement.occurredOn)}`

  return (
    <>
      <MovementItem
        movement={movement}
        detail={movement.description ?? 'Sin descripción'}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Acciones del movimiento de ${describe}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface"
            >
              <Icon name="more_vert" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Icon name="edit" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                <Icon name="delete" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <MovementDialog open={editing} onOpenChange={setEditing} movement={movement} />
      <DeleteMovementDialog movement={movement} open={deleting} onOpenChange={setDeleting} />
    </>
  )
}
