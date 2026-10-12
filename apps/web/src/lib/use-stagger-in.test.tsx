import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { disableMotion, enableMotion } from '@/test/motion'
import { useStaggerIn } from './use-stagger-in'

afterEach(disableMotion)

function List() {
  const ref = useStaggerIn<HTMLUListElement>(':scope > li')
  return (
    <ul ref={ref}>
      {Array.from({ length: 12 }, (_, i) => (
        <li key={i}>Fila {i}</li>
      ))}
    </ul>
  )
}

describe('useStaggerIn', () => {
  it('leaves the items untouched with reduced motion', () => {
    render(<List />)
    for (const item of screen.getAllByRole('listitem')) expect(item).not.toHaveAttribute('style')
  })

  it('brings every item in and then clears its styles', async () => {
    enableMotion()
    render(<List />)
    // While they come in they are hidden, so they are queried with `hidden`
    const items = screen.getAllByRole('listitem', { hidden: true })
    expect(items[11]?.style.opacity).toBe('0')

    await waitFor(() => {
      for (const item of items) expect(item.style.opacity).toBe('')
    })
  })
})
