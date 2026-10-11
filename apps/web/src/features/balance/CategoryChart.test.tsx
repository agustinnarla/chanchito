import type { CategoryTotal } from '@chanchito/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CategoryChart } from './CategoryChart'
import { shortenName } from './labels'

const totals: CategoryTotal[] = [
  {
    category: { id: 'a', name: 'Supermercado', kind: 'expense', archived: false },
    total: { amount: 60000, currency: 'ARS' },
    share: 0.6,
  },
  {
    category: { id: 'b', name: 'Salidas', kind: 'expense', archived: true },
    total: { amount: 30000, currency: 'ARS' },
    share: 0.3,
  },
  {
    category: { id: 'c', name: 'Mantenimiento del auto', kind: 'expense', archived: false },
    total: { amount: 10000, currency: 'ARS' },
    share: 0.1,
  },
]

/** jsdom has no layout: give the chart a size so Recharts draws it. */
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        const entry = { target, contentRect: { width: 400, height: 100 } }
        this.callback([entry as unknown as ResizeObserverEntry], this as unknown as ResizeObserver)
      }
      unobserve() {}
      disconnect() {}
    },
  )
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(400)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function renderChart() {
  render(<CategoryChart kind="expense" title="Gastos en pesos por categoría" totals={totals} />)
  return screen.getByRole('application', { name: 'Gráfico de gastos en pesos por categoría' })
}

describe('CategoryChart', () => {
  it('labels each bar with its category and share', () => {
    const chart = renderChart()

    expect(chart).toHaveTextContent('Supermercado')
    expect(chart).toHaveTextContent('Salidas')
    for (const share of ['60%', '30%', '10%']) expect(chart).toHaveTextContent(share)
  })

  it('shortens long names on the axis', () => {
    const chart = renderChart()

    expect(chart).toHaveTextContent('Mantenimiento d…')
    expect(chart).not.toHaveTextContent('Mantenimiento del auto')
  })

  it('shows the amount and share of the first bar when focused with the keyboard', async () => {
    renderChart()
    const user = userEvent.setup()

    await user.tab()
    await user.keyboard('{ArrowRight}')

    expect(await screen.findByText('$ 600,00 · 60%')).toBeInTheDocument()
  })

  it('shows the full name, amount and share of the bar under the pointer', async () => {
    const chart = renderChart()
    const user = userEvent.setup()

    // Rows are 32px tall from y=4: the third bar is around y=84.
    const area = chart.parentElement
    if (!area) throw new Error('The chart has no container')
    vi.spyOn(area, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ width: 400, height: 100 }),
    )
    await user.pointer({ target: area, coords: { clientX: 200, clientY: 84 } })
    expect(await screen.findByText('Mantenimiento del auto')).toBeInTheDocument()
    expect(screen.getByText('$ 100,00 · 10%')).toBeInTheDocument()

    await user.pointer({ target: area, coords: { clientX: 200, clientY: 50 } })
    expect(await screen.findByText('$ 300,00 · 30%')).toBeInTheDocument()
    expect(screen.getByText('(archivada)')).toBeInTheDocument()
  })
})

describe('shortenName', () => {
  it.each([
    ['Supermercado', 'Supermercado'],
    ['Dieciséis letras', 'Dieciséis letras'],
    ['Mantenimiento del auto', 'Mantenimiento d…'],
    ['Ropa y calzado de', 'Ropa y calzado…'],
  ])('%s → %s', (name, expected) => {
    expect(shortenName(name)).toBe(expected)
  })
})
