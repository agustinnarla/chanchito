import type { Category } from '@chanchito/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { CategoryPicker } from './CategoryPicker'

const categories: Category[] = [
  { id: 'a', name: 'Alquiler', kind: 'expense', archived: false, emoji: 'house' },
  { id: 'b', name: 'Salidas', kind: 'expense', archived: true, emoji: 'clinking_beer_mugs' },
  { id: 'c', name: 'Supermercado', kind: 'expense', archived: false, emoji: 'shopping_cart' },
]

function Picker({ error }: { error?: string }) {
  const [value, setValue] = useState('')
  return (
    <>
      <p id="label">Categoría</p>
      <CategoryPicker
        categories={categories}
        value={value}
        onChange={setValue}
        labelId="label"
        error={error}
        errorId="error"
      />
    </>
  )
}

describe('CategoryPicker', () => {
  it('chooses a category by clicking it', async () => {
    render(<Picker />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('radio', { name: 'Supermercado' }))

    expect(screen.getByRole('radio', { name: 'Supermercado' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Alquiler' })).not.toBeChecked()
  })

  it('is one tab stop and moves with the arrow keys, wrapping around', async () => {
    render(<Picker />)
    const user = userEvent.setup()

    await user.tab()
    expect(screen.getByRole('radio', { name: 'Alquiler' })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Salidas (archivada)' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Salidas (archivada)' })).toHaveFocus()

    await user.keyboard('{ArrowLeft}{ArrowLeft}')
    expect(screen.getByRole('radio', { name: 'Supermercado' })).toBeChecked()

    await user.keyboard('{Enter}')
    expect(screen.getByRole('radio', { name: 'Supermercado' })).toBeChecked()

    await user.tab()
    expect(document.body).toHaveFocus()
  })

  it('shows the error linked to the group', () => {
    render(<Picker error="Elegí una categoría." />)

    expect(screen.getByRole('radiogroup', { name: 'Categoría' })).toHaveAccessibleDescription(
      'Elegí una categoría.',
    )
  })
})
