import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { disableMotion, enableMotion, seekAnimations } from '@/test/motion'
import { AnimatedMoney } from './AnimatedMoney'

afterEach(disableMotion)

const amount = () => screen.getByRole('status')

describe('AnimatedMoney', () => {
  it('shows the formatted amount, with its sign when asked', () => {
    const { rerender } = render(
      <output>
        <AnimatedMoney money={{ amount: 123456, currency: 'ARS' }} />
      </output>,
    )
    expect(amount()).toHaveTextContent('$ 1.234,56')

    rerender(
      <output>
        <AnimatedMoney money={{ amount: -5000, currency: 'USD' }} signed />
      </output>,
    )
    expect(amount()).toHaveTextContent('-US$ 50,00')
  })

  it('starts again from zero when the currency changes', () => {
    enableMotion(1)
    const { rerender } = render(
      <output>
        <AnimatedMoney money={{ amount: 100000000, currency: 'ARS' }} />
      </output>,
    )
    act(() => seekAnimations(1))

    rerender(
      <output>
        <AnimatedMoney money={{ amount: 5000, currency: 'USD' }} />
      </output>,
    )
    expect(amount()).toHaveTextContent('US$ 0,00')

    act(() => seekAnimations(1))
    expect(amount()).toHaveTextContent('US$ 50,00')
  })
})
