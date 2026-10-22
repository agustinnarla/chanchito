import { render, screen } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'

describe('HomeScreen', () => {
  it('shows the app name', async () => {
    await render(<HomeScreen />)

    expect(screen.getByRole('header', { name: 'Chanchito' })).toBeOnTheScreen()
  })
})
