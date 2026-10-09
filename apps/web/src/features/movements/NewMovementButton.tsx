import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MovementDialog } from './MovementDialog'

export function NewMovementButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        Nuevo movimiento
      </Button>
      <MovementDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
