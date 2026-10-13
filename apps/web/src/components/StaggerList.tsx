import type { ComponentProps } from 'react'
import { useStaggerIn } from '@/lib/use-stagger-in'

/** A list whose items come in one after the other when it mounts (remount it with a `key`). */
export function StaggerList(props: ComponentProps<'ul'>) {
  const ref = useStaggerIn<HTMLUListElement>(':scope > li')
  return <ul ref={ref} {...props} />
}
