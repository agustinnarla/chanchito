import type { FakeDataSeed } from '@chanchito/data/testing'
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { act, screen, userEvent, waitFor } from '@testing-library/react-native'
import { Alert, ToastAndroid, type AlertButton } from 'react-native'
import { fakeData } from '@/test/fake-data'
import { setToday } from '@/test/clock'
import { renderApp } from '@/test/render-app'

const seed: FakeDataSeed = {
  categories: [
    { name: 'Supermercado', kind: 'expense', emoji: 'shopping_cart' },
    { name: 'Farmacia', kind: 'expense', emoji: 'pill' },
    { name: 'Gimnasio', kind: 'expense', archived: true },
    { name: 'Sueldo', kind: 'income', emoji: 'briefcase' },
  ],
  movements: [
    { category: 'Supermercado', amount: 50000, occurredOn: '2026-10-07', description: 'Coto' },
  ],
}

let toast: jest.SpyInstance
let alert: jest.SpyInstance

beforeEach(() => {
  setToday(new Date(2026, 9, 15, 12, 0))
  fakeData.reset(seed)
  toast = jest.spyOn(ToastAndroid, 'show').mockImplementation(() => undefined)
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

/** Presses a button of the last Alert.alert, like tapping it in the dialog. */
async function answerAlert(text: string) {
  const buttons = alert.mock.lastCall?.[2] as AlertButton[] | undefined
  const button = buttons?.find((b) => b.text === text)
  if (!button) throw new Error(`No "${text}" in the alert`)
  await act(async () => button.onPress?.())
}

async function openNewMovement() {
  await renderApp()
  await userEvent.press(await screen.findByRole('button', { name: 'Nuevo movimiento' }))
  await screen.findByRole('header', { name: 'Nuevo movimiento' })
}

async function openMovement(name: RegExp) {
  await renderApp()
  await userEvent.press(await screen.findByRole('button', { name }))
  await screen.findByRole('header', { name: 'Editar movimiento' })
}

describe('new movement', () => {
  it('starts as an expense in pesos dated today', async () => {
    await openNewMovement()

    expect(screen.getByRole('radio', { name: 'Gasto' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'ARS' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Fecha: 15/10/2026' })).toBeOnTheScreen()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeOnTheScreen()
  })

  it('saves an expense and shows it on the home screen', async () => {
    await openNewMovement()

    await userEvent.type(screen.getByLabelText('Monto'), '1.234,56')
    await userEvent.press(screen.getByRole('radio', { name: 'Supermercado' }))
    await userEvent.type(screen.getByLabelText('Descripción (opcional)'), '  Compra   del mes ')
    await userEvent.press(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('-$ 1.234,56')).toBeOnTheScreen()
    expect(screen.getByText('Compra del mes')).toBeOnTheScreen()
    expect(toast).toHaveBeenCalledWith('Movimiento guardado', ToastAndroid.SHORT)
    expect(fakeData.movements().at(-1)).toMatchObject({
      amount: { amount: 123456, currency: 'ARS' },
      occurredOn: '2026-10-15',
      description: 'Compra del mes',
    })
  })

  it('saves income in dollars', async () => {
    await openNewMovement()

    await userEvent.press(screen.getByRole('radio', { name: 'Ingreso' }))
    await userEvent.type(screen.getByLabelText('Monto'), '100')
    await userEvent.press(screen.getByRole('radio', { name: 'USD' }))
    await userEvent.press(screen.getByRole('radio', { name: 'Sueldo' }))
    await userEvent.press(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('+US$ 100,00')).toBeOnTheScreen()
  })

  it.each([
    ['', 'Ingresá un monto.'],
    ['0', 'El monto tiene que ser mayor a 0.'],
    ['-5', 'El monto no puede ser negativo.'],
    ['1,234', 'El monto puede tener hasta 2 decimales.'],
  ])('rejects the amount %j', async (amount, message) => {
    await openNewMovement()

    if (amount) await userEvent.type(screen.getByLabelText('Monto'), amount)
    await userEvent.press(screen.getByRole('radio', { name: 'Supermercado' }))
    await userEvent.press(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByText(message)).toBeOnTheScreen()
    expect(fakeData.movements()).toHaveLength(1)
  })

  it('asks for a category', async () => {
    await openNewMovement()

    await userEvent.type(screen.getByLabelText('Monto'), '100')
    await userEvent.press(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByText('Elegí una categoría.')).toBeOnTheScreen()
    expect(fakeData.movements()).toHaveLength(1)
  })

  it('rejects a description longer than 100 characters', async () => {
    await openNewMovement()

    await userEvent.type(screen.getByLabelText('Monto'), '100')
    await userEvent.press(screen.getByRole('radio', { name: 'Supermercado' }))
    await userEvent.type(screen.getByLabelText('Descripción (opcional)'), 'a'.repeat(101))
    await userEvent.press(screen.getByRole('button', { name: 'Guardar' }))

    expect(screen.getByText('La descripción puede tener hasta 100 caracteres.')).toBeOnTheScreen()
  })

  it("offers only the chosen kind's active categories", async () => {
    await openNewMovement()
    const OTHER_CHOICES = ['Gasto', 'Ingreso', 'ARS', 'USD']
    const categories = () =>
      screen
        .getAllByRole('radio')
        .map((radio) => radio.props.accessibilityLabel)
        .filter((name) => !OTHER_CHOICES.includes(name))

    expect(categories()).toEqual(['Farmacia', 'Supermercado'])

    await userEvent.press(screen.getByRole('radio', { name: 'Supermercado' }))
    await userEvent.press(screen.getByRole('radio', { name: 'Ingreso' }))

    expect(categories()).toEqual(['Sueldo'])
    expect(screen.getByRole('radio', { name: 'Sueldo' })).not.toBeChecked()
  })

  it('says when there are no categories of the kind', async () => {
    fakeData.reset({ categories: [{ name: 'Supermercado', kind: 'expense' }] })
    await openNewMovement()

    await userEvent.press(screen.getByRole('radio', { name: 'Ingreso' }))

    expect(
      screen.getByText('No tenés categorías de ingreso. Crealas desde la web, en Categorías.'),
    ).toBeOnTheScreen()
  })

  it('takes the date from the calendar', async () => {
    jest
      .spyOn(DateTimePickerAndroid, 'open')
      .mockImplementation(({ onChange }) =>
        onChange?.(
          { type: 'set', nativeEvent: { timestamp: 0, utcOffset: 0 } },
          new Date(2026, 8, 30, 23, 30),
        ),
      )
    await openNewMovement()

    await userEvent.press(screen.getByRole('button', { name: 'Fecha: 15/10/2026' }))
    expect(screen.getByRole('button', { name: 'Fecha: 30/09/2026' })).toBeOnTheScreen()

    await userEvent.type(screen.getByLabelText('Monto'), '10')
    await userEvent.press(screen.getByRole('radio', { name: 'Farmacia' }))
    await userEvent.press(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(fakeData.movements().at(-1)?.occurredOn).toBe('2026-09-30'))
  })

  it('keeps the date when the calendar is dismissed', async () => {
    jest
      .spyOn(DateTimePickerAndroid, 'open')
      .mockImplementation(({ onChange }) =>
        onChange?.({ type: 'dismissed', nativeEvent: { timestamp: 0, utcOffset: 0 } }, undefined),
      )
    await openNewMovement()

    await userEvent.press(screen.getByRole('button', { name: 'Fecha: 15/10/2026' }))

    expect(screen.getByRole('button', { name: 'Fecha: 15/10/2026' })).toBeOnTheScreen()
  })

  it('shows the error without losing what was typed when it cannot save', async () => {
    await openNewMovement()
    await userEvent.type(screen.getByLabelText('Monto'), '100')
    await userEvent.press(screen.getByRole('radio', { name: 'Supermercado' }))
    fakeData.setOffline(true)

    await userEvent.press(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo guardar el movimiento. Revisá tu conexión y probá de nuevo.',
    )
    expect(screen.getByLabelText('Monto')).toHaveDisplayValue('100')
  })

  it('leaves right away when nothing was typed', async () => {
    await openNewMovement()

    await userEvent.press(screen.getByRole('button', { name: 'Cerrar' }))

    expect(await screen.findByRole('header', { name: 'Octubre 2026' })).toBeOnTheScreen()
    expect(alert).not.toHaveBeenCalled()
  })

  it('asks before discarding what was typed', async () => {
    await openNewMovement()
    await userEvent.type(screen.getByLabelText('Monto'), '100')

    await userEvent.press(screen.getByRole('button', { name: 'Cerrar' }))
    expect(alert).toHaveBeenCalledWith(
      '¿Descartar los cambios?',
      'Lo que escribiste no se va a guardar.',
      expect.any(Array),
    )
    await answerAlert('Seguir editando')
    expect(screen.getByLabelText('Monto')).toHaveDisplayValue('100')

    await userEvent.press(screen.getByRole('button', { name: 'Cerrar' }))
    await answerAlert('Descartar')

    expect(await screen.findByRole('header', { name: 'Octubre 2026' })).toBeOnTheScreen()
    expect(fakeData.movements()).toHaveLength(1)
  })
})

describe('editing', () => {
  it('opens the movement with its data and saves the changes', async () => {
    await openMovement(/Coto/)

    expect(screen.getByLabelText('Monto')).toHaveDisplayValue('500')
    expect(screen.getByRole('radio', { name: 'Supermercado' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Fecha: 07/10/2026' })).toBeOnTheScreen()

    await userEvent.clear(screen.getByLabelText('Monto'))
    await userEvent.type(screen.getByLabelText('Monto'), '750')
    await userEvent.press(screen.getByRole('button', { name: 'Guardar' }))

    expect(
      await screen.findByRole('button', { name: 'Supermercado, Coto, -$ 750,00' }),
    ).toBeOnTheScreen()
    expect(fakeData.movements()).toHaveLength(1)
  })

  it('keeps an archived category', async () => {
    fakeData.reset({
      categories: [{ name: 'Gimnasio', kind: 'expense', archived: true }],
      movements: [{ category: 'Gimnasio', occurredOn: '2026-10-03', description: 'Cuota' }],
    })
    await openMovement(/Cuota/)

    expect(screen.getByRole('radio', { name: 'Gimnasio (archivada)' })).toBeChecked()
  })

  it('deletes the movement after confirming', async () => {
    await openMovement(/Coto/)

    await userEvent.press(screen.getByRole('button', { name: 'Eliminar' }))
    expect(alert).toHaveBeenCalledWith(
      '¿Eliminar este movimiento?',
      'No se puede deshacer.',
      expect.any(Array),
    )
    await answerAlert('Eliminar')

    expect(await screen.findByText('No hay movimientos en octubre 2026.')).toBeOnTheScreen()
    expect(toast).toHaveBeenCalledWith('Movimiento eliminado', ToastAndroid.SHORT)
  })

  it('keeps the movement when deleting is canceled', async () => {
    await openMovement(/Coto/)

    await userEvent.press(screen.getByRole('button', { name: 'Eliminar' }))
    await answerAlert('Cancelar')

    expect(fakeData.movements()).toHaveLength(1)
    expect(screen.getByRole('header', { name: 'Editar movimiento' })).toBeOnTheScreen()
  })

  it('says when the movement no longer exists', async () => {
    await openMovement(/Coto/)
    await userEvent.press(screen.getByRole('button', { name: 'Cerrar' }))
    for (const movement of fakeData.movements()) {
      await fakeData.movementsApi.deleteMovement(movement.id)
    }

    // The list still shows it until it refreshes
    await userEvent.press(await screen.findByRole('button', { name: /Coto/ }))

    expect(
      await screen.findByText('No encontramos ese movimiento. Puede que se haya eliminado.'),
    ).toBeOnTheScreen()
  })
})
