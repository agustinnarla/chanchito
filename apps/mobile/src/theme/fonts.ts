import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans'
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono'

/** DM Sans for text and Geist Mono for amounts, as on the web. */
export const FONT_FILES = {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  GeistMono_400Regular,
  GeistMono_500Medium,
}

export type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold'

// Android picks a custom font by family name, not by fontWeight: one family per weight.
const SANS: Record<FontWeight, keyof typeof FONT_FILES> = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
}

const MONO: Record<FontWeight, keyof typeof FONT_FILES> = {
  regular: 'GeistMono_400Regular',
  medium: 'GeistMono_500Medium',
  semibold: 'GeistMono_500Medium',
  bold: 'GeistMono_500Medium',
}

export function fontFamily(weight: FontWeight, mono = false): string {
  return (mono ? MONO : SANS)[weight]
}
