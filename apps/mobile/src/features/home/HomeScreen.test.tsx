import { screen, userEvent } from '@testing-library/react-native'
import type { FakeDataSeed } from '@chanchito/data/testing'
import { fakeData } from '@/test/fake-data'
import { setToday } from '@/test/clock'
import { renderApp } from '@/test/render-app'

const seed: FakeDataSeed = {
  categories: [
    { name: 'Supermercado', kind: 'expense', emoji: 'shopping_cart' },
    { name: 'Sueldo', kind: 'income', emoji: 'briefcase' },
  ],
  movements: [
    { category: 'Supermercado', amount: 123456, occurredOn: '2026-10-07', description: 'Coto' },
    { category: 'Sueldo', amount: 300000, occurredOn: '2026-10-01' },
    { category: 'Supermercado', amount: 99900, occurredOn: '2026-09-30', description: 'Día' },
    { category: 'Sueldo', amount: 10000, currency: 'USD', occurredOn: '2026-10-02' },
  ],
}

beforeEach(() => {
  setToday(new Date(2026, 9, 15, 12, 0))
  fakeData.reset(seed)
})

afterEach(() => {
  jest.useRealTimers()
})

it("shows the current month's result and totals in pesos", async () => {
  await renderApp()

  expect(await screen.findByLabelText('Resultado del mes: +$ 1.765,44')).toBeOnTheScreen()
  expect(screen.getByRole('header', { name: 'Octubre 2026' })).toBeOnTheScreen()
  expect(screen.getByLabelText('Ingresos: $ 3.000,00')).toBeOnTheScreen()
  expect(screen.getByLabelText('Gastos: $ 1.234,56')).toBeOnTheScreen()
})

it('lists the movements by day, newest first', async () => {
  await renderApp()
  await screen.findByText('Coto')

  const days = screen.getAllByRole('header').map((header) => header.props.children)
  expect(days).toEqual([
    'Octubre 2026',
    'Miércoles 7 de octubre',
    'Viernes 2 de octubre',
    'Jueves 1 de octubre',
  ])
  expect(screen.getByText('-$ 1.234,56')).toBeOnTheScreen()
  expect(screen.getByText('+US$ 100,00')).toBeOnTheScreen()
  expect(screen.getAllByText('Sin descripción')).toHaveLength(2)
  expect(screen.queryByText('Día')).not.toBeOnTheScreen()
})

it('switches to dollars when the month has both currencies', async () => {
  await renderApp()
  const dollars = await screen.findByRole('radio', { name: 'Dólares' })
  expect(screen.getByRole('radio', { name: 'Pesos' })).toBeChecked()

  await userEvent.press(dollars)

  expect(screen.getByLabelText('Resultado del mes: +US$ 100,00')).toBeOnTheScreen()
  expect(dollars).toBeChecked()
})

it('moves between months', async () => {
  await renderApp()
  await screen.findByText('Coto')

  await userEvent.press(screen.getByRole('button', { name: 'Mes anterior' }))

  expect(await screen.findByText('Día')).toBeOnTheScreen()
  expect(screen.getByRole('header', { name: 'Septiembre 2026' })).toBeOnTheScreen()
  expect(screen.getByLabelText('Resultado del mes: -$ 999,00')).toBeOnTheScreen()
  // Only pesos in September: no currency choice
  expect(screen.queryByRole('radio', { name: 'Dólares' })).not.toBeOnTheScreen()

  await userEvent.press(screen.getByRole('button', { name: 'Mes siguiente' }))
  await userEvent.press(screen.getByRole('button', { name: 'Mes siguiente' }))

  expect(await screen.findByText('No hay movimientos en noviembre 2026.')).toBeOnTheScreen()
  expect(screen.queryByText(/Resultado del mes/)).not.toBeOnTheScreen()
})

it('marks archived categories', async () => {
  fakeData.reset({
    categories: [{ name: 'Gimnasio', kind: 'expense', archived: true }],
    movements: [{ category: 'Gimnasio', occurredOn: '2026-10-03' }],
  })
  await renderApp()

  expect(await screen.findByText('(archivada)', { exact: false })).toBeOnTheScreen()
})

it('shows the error and retries', async () => {
  fakeData.setOffline(true)
  await renderApp()

  expect(await screen.findByText('No se pudieron cargar los movimientos.')).toBeOnTheScreen()

  fakeData.setOffline(false)
  await userEvent.press(screen.getByRole('button', { name: 'Reintentar' }))

  expect(await screen.findByText('Coto')).toBeOnTheScreen()
})
