import { Text, type TextProps } from 'react-native'
import { fontFamily, type FontWeight } from '@/theme/fonts'
import { useTheme } from '@/theme/use-theme'

const SIZES = { caption: 13, body: 16, title: 22, display: 32 } as const

type Props = TextProps & {
  size?: keyof typeof SIZES
  weight?: FontWeight
  /** Geist Mono, for amounts. */
  mono?: boolean
  /** Secondary text, in the muted color. */
  muted?: boolean
  /** Overrides the text color (for example, income in green). */
  color?: string
}

/** Text in the app's fonts and colors. */
export function AppText({
  size = 'body',
  weight = 'regular',
  mono = false,
  muted = false,
  color,
  style,
  ...props
}: Props) {
  const { colors } = useTheme()
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: fontFamily(weight, mono),
          fontSize: SIZES[size],
          lineHeight: Math.round(SIZES[size] * 1.35),
          color: color ?? (muted ? colors.mutedForeground : colors.foreground),
        },
        style,
      ]}
    />
  )
}
