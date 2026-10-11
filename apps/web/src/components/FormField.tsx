import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

type Props = {
  label: string
  htmlFor: string
  error: string | undefined
  errorId: string
  children: ReactNode
}

/** A label, its control and the control's error, linked by `errorId` (aria-describedby). */
export function FormField({ label, htmlFor, error, errorId, children }: Props) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
