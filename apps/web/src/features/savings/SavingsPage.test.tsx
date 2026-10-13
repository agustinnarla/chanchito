import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeDb, type FakeSeed } from '@/test/fake-db'
import { stubPublicApis } from '@/test/public-apis'
import { renderWithQuery } from '@/test/render-with-query'
import { SavingsPage } from './SavingsPage'

vi.mock('@/features/savings/api', async () => (await import('@/test/fake-db')).fakeDb.savingsApi)
vi.mock(
  '@/features/investments/api',
  async () => (await import('@/test/fake-db')).fakeDb.investmentsApi,
)

const seed: FakeSeed = {
  goals: [
    { name: 'Celular nuevo', emoji: 'mobile_phone', target: { amount: 80000, currency: 'USD' } },
  ],
  contributions: [
    { goal: 'Celular nuevo', amount: 30000000, occurredOn: '2026-09-10' },
    { goal: 'Celular nuevo', amount: 15000000, occurredOn: '2026-10-05' },
  ],
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 15, 12, 0))
  localStorage.clear()
  stubPublicApis()
  fakeDb.reset(seed)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const goalRow = async (name = 'Celular nuevo') =>
  (await screen.findByText(name, { selector: 'p' })).closest('li') as HTMLElement

describe('SavingsPage', () => {
  it('shows what was saved against the target converted with the MEP dollar', async () => {
    renderWithQuery(<SavingsPage />)
    const row = await goalRow()

    await vi.waitFor(() => expect(row).toHaveTextContent('$ 450.000,00 de $ 1.160.000,00'))
    expect(row).toHaveTextContent('39% · Te faltan $ 710.000,00 (US$ 489,66)')
    expect(row).toHaveTextContent('Meta: US$ 800,00 al dólar MEP de hoy, $ 1.450,00')
    expect(
      within(row).getByRole('progressbar', { name: 'Ahorrado para Celular nuevo' }),
    ).toHaveAttribute('aria-valuenow', '39')
    expect(screen.getByText(/Dólar MEP actualizado hoy a las 11:20/)).toBeInTheDocument()
    expect(screen.getByRole('term')).toHaveTextContent('Guardado en pesos')
    expect(screen.getByRole('definition')).toHaveTextContent('$ 450.000,00')
  })

  it('uses the last stored MEP dollar when DolarApi fails, and says so', async () => {
    localStorage.setItem(
      'chanchito:mep',
      JSON.stringify({ rate: 140000, at: '2026-10-14T21:00:00.000Z' }),
    )
    stubPublicApis({ mep: null })
    renderWithQuery(<SavingsPage />)

    expect(await goalRow()).toHaveTextContent('de $ 1.120.000,00')
    expect(
      await screen.findByText(/Usamos el último dólar MEP que conseguimos, ayer a las 18:00/),
    ).toBeInTheDocument()
  })

  it('shows what was saved without a percentage when there has never been a rate', async () => {
    stubPublicApis({ mep: null })
    renderWithQuery(<SavingsPage />)

    expect(
      await screen.findByText('No pudimos traer el dólar MEP para comparar con el objetivo.'),
    ).toBeInTheDocument()
    expect(await goalRow()).toHaveTextContent('$ 450.000,00')
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('creates a goal in pesos, and rejects a repeated name', async () => {
    fakeDb.reset()
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Crear una meta' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nueva meta' })
    await user.type(within(dialog).getByLabelText('Nombre'), 'Vacaciones')
    await user.type(within(dialog).getByRole('textbox', { name: 'Objetivo' }), '1.000.000')
    await user.click(within(dialog).getByRole('radio', { name: 'Avión' }))
    await user.click(within(dialog).getByRole('button', { name: 'Crear' }))

    const row = await goalRow('Vacaciones')
    expect(row).toHaveTextContent('$ 0,00 de $ 1.000.000,00')
    expect(fakeDb.goals()[0]).toMatchObject({ emoji: 'airplane', savingCurrency: 'ARS' })

    await user.click(screen.getByRole('button', { name: 'Nueva meta' }))
    const again = await screen.findByRole('dialog', { name: 'Nueva meta' })
    await user.type(within(again).getByLabelText('Nombre'), 'VACACIONES')
    await user.type(within(again).getByRole('textbox', { name: 'Objetivo' }), '10')
    await user.click(within(again).getByRole('button', { name: 'Crear' }))

    expect(await within(again).findByText('Ya tenés una meta con ese nombre.')).toBeInTheDocument()
  })

  it('puts money in, with its dollar equivalent and how the goal ends up', async () => {
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()
    const row = await goalRow()
    await vi.waitFor(() => expect(row).toHaveTextContent('39%'))

    await user.click(within(row).getByRole('button', { name: 'Aportar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Aportar' })
    await user.type(within(dialog).getByLabelText('Monto'), '80.000')

    expect(dialog).toHaveTextContent('≈ US$ 55,17 al dólar MEP de hoy')
    expect(dialog).toHaveTextContent('Con este aporte46%')
    expect(dialog).toHaveTextContent('Sale de lo disponible de octubre, pero no cuenta como gasto.')
    await user.click(within(dialog).getByRole('button', { name: 'Aportar' }))

    await vi.waitFor(() => expect(row).toHaveTextContent('$ 530.000,00 de $ 1.160.000,00'))
    expect(fakeDb.contributions().at(-1)).toMatchObject({
      amount: { amount: 8000000, currency: 'ARS' },
      occurredOn: '2026-10-15',
    })
  })

  it('takes money out, but never more than what was saved', async () => {
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()
    const row = await goalRow()

    await user.click(within(row).getByRole('button', { name: 'Acciones de la meta Celular nuevo' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Retirar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Retirar' })
    await user.type(within(dialog).getByLabelText('Monto'), '500.000')
    await user.click(within(dialog).getByRole('button', { name: 'Retirar' }))

    expect(
      within(dialog).getByText('No podés retirar más de lo que tenés ahorrado ($ 450.000,00).'),
    ).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Monto'))
    await user.type(within(dialog).getByLabelText('Monto'), '50.000')
    await user.click(within(dialog).getByRole('button', { name: 'Retirar' }))

    await vi.waitFor(() => expect(row).toHaveTextContent('$ 400.000,00 de'))
  })

  it('celebrates a goal that was reached', async () => {
    fakeDb.reset({
      goals: [{ name: 'Auriculares', target: { amount: 5000000, currency: 'ARS' } }],
      contributions: [{ goal: 'Auriculares', amount: 5000000 }],
    })
    renderWithQuery(<SavingsPage />)

    expect(await goalRow('Auriculares')).toHaveTextContent('¡Lo lograste! 100%')
  })

  it('lists the contributions and deletes one', async () => {
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()
    const row = await goalRow()

    await user.click(within(row).getByRole('button', { name: 'Acciones de la meta Celular nuevo' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Ver aportes' }))
    const dialog = await screen.findByRole('dialog', { name: 'Aportes' })
    const items = within(dialog).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      'Aporte05/10/2026+$ 150.000,00',
      'Aporte10/09/2026+$ 300.000,00',
    ])

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar aporte del 10/09/2026' }))

    await vi.waitFor(() => expect(within(dialog).getAllByRole('listitem')).toHaveLength(1))
    expect(row).toHaveTextContent('$ 150.000,00 de')
  })

  it('archives a goal, which still counts in what was saved', async () => {
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()
    const row = await goalRow()

    await user.click(within(row).getByRole('button', { name: 'Acciones de la meta Celular nuevo' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Archivar' }))

    await user.click(await screen.findByRole('button', { name: 'Archivadas (1)' }))
    expect(await goalRow()).not.toHaveTextContent('Aportar')
    expect(
      screen.getByText('Todavía no tenés metas. Creá una para juntar plata para algo concreto.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('definition')).toHaveTextContent('$ 450.000,00')
  })

  it('deletes a goal after confirming', async () => {
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()
    const row = await goalRow()

    await user.click(within(row).getByRole('button', { name: 'Acciones de la meta Celular nuevo' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }))
    const confirm = await screen.findByRole('alertdialog', { name: '¿Eliminar «Celular nuevo»?' })
    expect(confirm).toHaveTextContent('Se borran también sus aportes ($ 450.000,00 ahorrados).')
    await user.click(within(confirm).getByRole('button', { name: 'Eliminar' }))

    expect(await screen.findByRole('button', { name: 'Crear una meta' })).toBeInTheDocument()
    expect(fakeDb.contributions()).toEqual([])
  })

  it('edits the name and target', async () => {
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()
    const row = await goalRow()

    await user.click(within(row).getByRole('button', { name: 'Acciones de la meta Celular nuevo' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    const dialog = await screen.findByRole('dialog', { name: 'Editar meta' })
    expect(dialog).toHaveTextContent('Ahorrás en pesos.')
    await user.clear(within(dialog).getByLabelText('Nombre'))
    await user.type(within(dialog).getByLabelText('Nombre'), 'Celular')
    await user.clear(within(dialog).getByRole('textbox', { name: 'Objetivo' }))
    await user.type(within(dialog).getByRole('textbox', { name: 'Objetivo' }), '900')
    await user.click(within(dialog).getByRole('button', { name: 'Guardar' }))

    await vi.waitFor(() =>
      expect(fakeDb.goals()[0]).toMatchObject({
        name: 'Celular',
        target: { amount: 90000, currency: 'USD' },
      }),
    )
  })

  it('offers to retry when the savings fail to load', async () => {
    fakeDb.savingsApi.listGoals.mockRejectedValueOnce(new Error('offline'))
    renderWithQuery(<SavingsPage />)
    const user = userEvent.setup()

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar tus ahorros.')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await goalRow()).toBeInTheDocument()
  })
})
