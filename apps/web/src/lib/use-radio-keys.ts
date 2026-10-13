import { useRef, type KeyboardEvent } from 'react'

/**
 * Keyboard behavior of a radio group made of buttons: one tab stop (the checked item, or the
 * first), and the arrow keys move between items, wrapping around, and choose them.
 */
export function useRadioKeys(count: number, checkedIndex: number, choose: (index: number) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const focusable = checkedIndex === -1 ? 0 : checkedIndex

  return (index: number) => ({
    ref: (element: HTMLButtonElement | null) => {
      refs.current[index] = element
    },
    tabIndex: index === focusable ? 0 : -1,
    onKeyDown: (event: KeyboardEvent) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
      if (step === undefined) return
      event.preventDefault()
      const next = (index + step + count) % count
      choose(next)
      refs.current[next]?.focus()
    },
  })
}
