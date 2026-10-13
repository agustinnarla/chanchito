import { formatDate, groupMovementsByDay, type Movement } from '@chanchito/core'
import { useState } from 'react'
import { Icon } from '@/components/Icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteMovementDialog } from './DeleteMovementDialog'
import { MovementDialog } from './MovementDialog'
import { MovementItem } from './MovementItem'

type Props = { label: string; movements: Movement[] }

/** Movements grouped by day, newest first (they come sorted). */
export function MovementList({ label, movements }: Props) {
  return (
    <section aria-label={label} className="space-y-2">
      {groupMovementsByDay(movements).map((day) => (
        <div key={day.date}>
          <h3 className="px-3.5 pt-2 pb-1 text-[13px] font-semibold text-muted-foreground">
            {day.label}
          </h3>
          <ul aria-label={day.label}>
            {day.movements.map((movement) => (
              <MovementRow key={movement.id} movement={movement} />
            ))}
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
