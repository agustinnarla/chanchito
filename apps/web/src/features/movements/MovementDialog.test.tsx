import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeDb } from '@/test/fake-db'
import { renderWithQuery } from '@/test/render-with-query'
import { MovementError } from './errors'
import { NewMovementButton } from './NewMovementButton'

vi.mock(
  '@/features/categories/api',
  async () => (await import('@/test/fake-db')).fakeDb.categoriesApi,
)
vi.mock('./api', async () => (await import('@/test/fake-db')).fakeDb.movementsApi)

const categories = [
  { name: 'Supermercado', kind: 'expense' as const },
  { name: 'Alquiler', kind: 'expense' as const },
  { name: 'Salidas', kind: 'expense' as const, archived: true },
  { name: 'Sueldo', kind: 'income' as const },
]

beforeEach(() => {
  // 23:30 on Oct 31 in Argentina is already Nov 1 in UTC.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 31, 23, 30))
  fakeDb.reset({ categories })
})

afterEach(() => {
  vi.useRealTimers()
})

async function openDialog() {
  const user = userEvent.setup()
  renderWithQuery(<NewMovementButton />)
  await user.click(screen.getByRole('button', { name: 'Nuevo movimiento' }))
  const dialog = await screen.findByRole('dialog', { name: 'Nuevo movimiento' })
  await within(dialog).findByLabelText('Monto')
  return { user, dialog }
}

function optionNames(dialog: HTMLElement) {
  return within(within(dialog).getByLabelText('Categoría'))
    .getAllByRole('option')
    .map((option) => option.textContent)
}

describe('new movement dialog', () => {
  it('starts with Gasto, ARS and the local date of today', async () => {
    const { dialog } = await openDialog()

    expect(within(dialog).getByRole('radio', { name: 'Gasto' })).toBeChecked()
    expect(within(dialog).getByRole('radio', { name: 'ARS' })).toBeChecked()
    expect(within(dialog).getByLabelText('Fecha')).toHaveValue('2026-10-31')
  })

  it('offers only active categories of the chosen kind, in alphabetical order', async () => {
    const { user, dialog } = await openDialog()

    expect(optionNames(dialog)).toEqual(['Elegí una categoría', 'Alquiler', 'Supermercado'])

    await user.click(within(dialog).getByRole('radio', { name: 'Ingreso' }))

    expect(optionNames(dialog)).toEqual(['Elegí una categoría', 'Sueldo'])
  })

  it('saves an expense and closes', async () => {
    const { user, dialog } = await openDialog()

    await user.type(within(dialog).getByLabelText('Monto'), '1.234,56')
    await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Supermercado')
    await user.type(within(dialog).getByLabelText('Descripción (opcional)'), '  Compra   del mes ')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Movimiento guardado')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(fakeDb.movements()).toEqual([
      expect.objectContaining({
        amount: { amount: 123456, currency: 'ARS' },
        occurredOn: '2026-10-31',
        description: 'Compra del mes',
        category: expect.objectContaining({ name: 'Supermercado' }),
      }),
    ])
  })

  it('saves an income in dollars with a blank description as empty', async () => {
    const { user, dialog } = await openDialog()

    await user.click(within(dialog).getByRole('radio', { name: 'Ingreso' }))
    await user.click(within(dialog).getByRole('radio', { name: 'USD' }))
    await user.type(within(dialog).getByLabelText('Monto'), '100')
    await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Sueldo')
    await user.type(within(dialog).getByLabelText('Descripción (opcional)'), '   ')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(fakeDb.movements()).toHaveLength(1))
    expect(fakeDb.movements()[0]).toMatchObject({
      amount: { amount: 10000, currency: 'USD' },
      description: null,
      category: { name: 'Sueldo', kind: 'income' },
    })
  })

  it('lets the date be changed', async () => {
    const { user, dialog } = await openDialog()

    const date = within(dialog).getByLabelText('Fecha')
    await user.clear(date)
    await user.type(date, '2026-09-15')
    await user.type(within(dialog).getByLabelText('Monto'), '10')
    await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Alquiler')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(fakeDb.movements()[0]?.occurredOn).toBe('2026-09-15'))
  })

  it.each([
    ['', 'Ingresá un monto.'],
    ['0', 'El monto tiene que ser mayor a 0.'],
    ['-5', 'El monto no puede ser negativo.'],
    ['12,345', 'El monto puede tener hasta 2 decimales.'],
  ])('shows an error for the amount %j and does not save', async (amount, message) => {
    const { user, dialog } = await openDialog()

    if (amount) await user.type(within(dialog).getByLabelText('Monto'), amount)
    await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Alquiler')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    const input = within(dialog).getByLabelText('Monto')
    expect(input).toHaveAccessibleDescription(message)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveValue(amount)
    expect(fakeDb.movements()).toEqual([])
  })

  it('requires a category', async () => {
    const { user, dialog } = await openDialog()

    await user.type(within(dialog).getByLabelText('Monto'), '10')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(within(dialog).getByLabelText('Categoría')).toHaveAccessibleDescription(
      'Elegí una categoría.',
    )
    expect(fakeDb.movements()).toEqual([])
  })

  it('rejects a description longer than 100 characters', async () => {
    const { user, dialog } = await openDialog()

    await user.type(within(dialog).getByLabelText('Monto'), '10')
    await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Alquiler')
    await user.type(within(dialog).getByLabelText('Descripción (opcional)'), 'a'.repeat(101))
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(within(dialog).getByLabelText('Descripción (opcional)')).toHaveAccessibleDescription(
      'La descripción puede tener hasta 100 caracteres.',
    )
    expect(fakeDb.movements()).toEqual([])
  })

  it('clears the category when switching to the other kind', async () => {
    const { user, dialog } = await openDialog()

    await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Alquiler')
    await user.click(within(dialog).getByRole('radio', { name: 'Ingreso' }))

    expect(within(dialog).getByLabelText('Categoría')).toHaveValue('')
  })

  it('points to Categorías when there are no categories of that kind', async () => {
    fakeDb.reset({ categories: [{ name: 'Sueldo', kind: 'income' }] })
    const { dialog } = await openDialog()

    expect(within(dialog).getByText(/No tenés categorías de gasto/)).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Crealas en Categorías' })).toHaveAttribute(
      'href',
      '/categorias',
    )
    expect(within(dialog).getByRole('button', { name: 'Guardar' })).toBeDisabled()
  })

  it('shows a save error and keeps the dialog open', async () => {
    fakeDb.movementsApi.createMovement.mockRejectedValueOnce(
      new MovementError('No se pudo guardar el movimiento. Revisá tu conexión y probá de nuevo.'),
    )
    const { user, dialog } = await openDialog()

    await user.type(within(dialog).getByLabelText('Monto'), '10')
    await user.selectOptions(within(dialog).getByLabelText('Categoría'), 'Alquiler')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'No se pudo guardar el movimiento.',
    )
    expect(within(dialog).getByLabelText('Monto')).toHaveValue('10')
  })

  it('closes without saving on Cancelar', async () => {
    const { user, dialog } = await openDialog()

    await user.type(within(dialog).getByLabelText('Monto'), '10')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(fakeDb.movementsApi.createMovement).not.toHaveBeenCalled()
  })

  it('starts empty again after being reopened', async () => {
    const { user, dialog } = await openDialog()
    await user.type(within(dialog).getByLabelText('Monto'), '10')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    await user.click(screen.getByRole('button', { name: 'Nuevo movimiento' }))

    const reopened = await screen.findByRole('dialog', { name: 'Nuevo movimiento' })
    expect(await within(reopened).findByLabelText('Monto')).toHaveValue('')
  })
})
