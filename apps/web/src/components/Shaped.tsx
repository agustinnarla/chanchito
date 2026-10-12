import type { ReactNode } from 'react'
import type { ShapeName } from '@/lib/shapes'
import { cn } from '@/lib/utils'

type Props = {
  shape: ShapeName
  /** Size and layout of the whole thing. */
  className?: string
  /** Color, hover and motion of the shape behind (`shape-morph` turns it into a flower on hover). */
  shapeClassName?: string
  children: ReactNode
}

/**
 * Content (an emoji, an icon) on an expressive shape (spec 008). The shape is a layer behind it,
 * so it can turn and morph without clipping the content or a focus outline.
 */
export function Shaped({ shape, className, shapeClassName, children }: Props) {
  return (
    <span className={cn('relative grid shrink-0 place-items-center', className)}>
      <span
        aria-hidden="true"
        className={cn('shape absolute inset-0', `shape-${shape}`, shapeClassName)}
      />
      <span className="relative grid place-items-center">{children}</span>
    </span>
  )
}
