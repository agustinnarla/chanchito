import Svg, { Path } from 'react-native-svg'
import { ICON_PATHS, type IconName } from './icons'

type Props = {
  name: IconName
  color: string
  size?: number
  /** Filled, like the icon of the active option. */
  filled?: boolean
}

/** A Material Symbols Rounded icon. Decorative: the control next to it carries the label. */
export function Icon({ name, color, size = 24, filled = false }: Props) {
  return (
    <Svg
      viewBox="0 -960 960 960"
      width={size}
      height={size}
      fill={color}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={ICON_PATHS[name][filled ? 1 : 0]} />
    </Svg>
  )
}
