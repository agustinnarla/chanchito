import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { disableMotion, enableMotion, seekAnimations } from '@/test/motion'
import { useAutoHeight } from './use-auto-height'

type Callback = (entries: { borderBoxSize: { blockSize: number }[] }[]) => void
let resize: Callback | null = null

beforeEach(() => {
  resize = null
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: Callback) {
        resize = callback
      }
      observe() {}
      disconnect() {}
    },
  )
})

afterEach(disableMotion)

function Box() {
  const { outer, inner } = useAutoHeight<HTMLDivElement, HTMLDivElement>()
  return (
    <div ref={outer}>
      <div ref={inner}>Contenido</div>
    </div>
  )
}

const contentResizesTo = (blockSize: number) => resize?.([{ borderBoxSize: [{ blockSize }] }])
const outer = () => screen.getByText('Contenido').parentElement as HTMLElement

describe('useAutoHeight', () => {
  it('does nothing with reduced motion', () => {
    render(<Box />)
    expect(resize).toBeNull()
  })

  it('goes from the old height to the new one, and then lets it follow the content', () => {
    enableMotion(1)
    render(<Box />)
    contentResizesTo(200)
    expect(outer().style.height).toBe('')

    contentResizesTo(320)
    expect(outer().style.height).toBe('200px')
    expect(outer().style.overflow).toBe('clip')

    seekAnimations(1)
    expect(outer().style.height).toBe('')
    expect(outer().style.overflow).toBe('')
  })
})
