import { resolveCategoryEmoji } from '@chanchito/core'
import { Image } from 'react-native'
import { EMOJI_IMAGES } from './emoji-images'

type Props = { emoji: string; size?: number }

/**
 * A category's Fluent Emoji 3D image. Decorative: the category's name is always next to it.
 * Unknown keys show the default emoji.
 */
export function CategoryEmoji({ emoji, size = 28 }: Props) {
  return (
    <Image
      source={EMOJI_IMAGES[resolveCategoryEmoji(emoji)]}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  )
}
