import { renderHook } from '@testing-library/react-native'
import { useColorScheme } from 'react-native'
import { COLORS } from './colors'
import { fontFamily } from './fonts'
import { useTheme } from './use-theme'

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: jest.fn(),
}))
const mockScheme = jest.mocked(useColorScheme)

describe('useTheme', () => {
  it('uses the dark palette when the system is dark', async () => {
    mockScheme.mockReturnValue('dark')

    const { result } = await renderHook(() => useTheme())

    expect(result.current).toEqual({ scheme: 'dark', colors: COLORS.dark })
  })

  it.each(['light', null] as const)('uses the light palette for %s', async (scheme) => {
    mockScheme.mockReturnValue(scheme)

    const { result } = await renderHook(() => useTheme())

    expect(result.current.scheme).toBe('light')
    expect(result.current.colors.background).toBe('#f1fded')
  })
})

describe('fontFamily', () => {
  it('picks DM Sans by weight', () => {
    expect(fontFamily('regular')).toBe('DMSans_400Regular')
    expect(fontFamily('semibold')).toBe('DMSans_600SemiBold')
  })

  it('uses Geist Mono for amounts, up to medium', () => {
    expect(fontFamily('regular', true)).toBe('GeistMono_400Regular')
    expect(fontFamily('bold', true)).toBe('GeistMono_500Medium')
  })
})
