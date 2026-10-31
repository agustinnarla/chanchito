import { render, screen, userEvent } from '@testing-library/react-native'
import { AppText } from './AppText'
import { Button } from './Button'
import { CategoryEmoji } from './CategoryEmoji'
import { EMOJI_IMAGES } from './emoji-images'
import { Screen } from './Screen'

describe('Button', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn()
    await render(<Button label="Guardar" icon="check" onPress={onPress} />)

    await userEvent.press(screen.getByRole('button', { name: 'Guardar' }))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('ignores presses while disabled', async () => {
    const onPress = jest.fn()
    await render(<Button label="Guardar" variant="tonal" disabled onPress={onPress} />)

    const button = screen.getByRole('button', { name: 'Guardar' })
    await userEvent.press(button)

    expect(button).toBeDisabled()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows it is busy while loading, keeping its name', async () => {
    const onPress = jest.fn()
    await render(<Button label="Eliminar" variant="destructive" loading onPress={onPress} />)

    const button = screen.getByRole('button', { name: 'Eliminar' })
    await userEvent.press(button)

    expect(button).toBeBusy()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders as a text button', async () => {
    await render(<Button label="Cancelar" variant="text" onPress={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
  })
})

describe('AppText', () => {
  it('uses the muted color for secondary text', async () => {
    await render(<AppText muted>07/10/2026</AppText>)

    expect(screen.getByText('07/10/2026')).toHaveStyle({ color: '#3b4b3b' })
  })

  it('uses Geist Mono for amounts and lets the color be overridden', async () => {
    await render(
      <AppText mono color="#006e2c">
        +$ 100,00
      </AppText>,
    )

    expect(screen.getByText('+$ 100,00')).toHaveStyle({
      fontFamily: 'GeistMono_400Regular',
      color: '#006e2c',
    })
  })
})

describe('CategoryEmoji', () => {
  it('shows the emoji of the key', async () => {
    await render(<CategoryEmoji emoji="shopping_cart" />)

    // Decorative and hidden from screen readers, so it's the only thing on the screen.
    expect(screen.root).toHaveProp('source', EMOJI_IMAGES.shopping_cart)
  })

  it('falls back to the default emoji for unknown keys', async () => {
    await render(<CategoryEmoji emoji="rocket" />)

    expect(screen.root).toHaveProp('source', EMOJI_IMAGES.package)
  })
})

describe('Screen', () => {
  it('renders its content', async () => {
    await render(
      <Screen>
        <AppText>Hola</AppText>
      </Screen>,
    )

    expect(screen.getByText('Hola')).toBeOnTheScreen()
  })
})
