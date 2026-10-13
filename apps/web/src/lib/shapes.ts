/**
 * Material 3 Expressive shapes (spec 008) as CSS polygons. They all have the same number of
 * points, so CSS can morph one into another with a clip-path transition.
 */
const POINTS = 96

export const SHAPE_NAMES = ['cookie', 'clover', 'squircle', 'pentagon', 'sunny', 'flower'] as const
export type ShapeName = (typeof SHAPE_NAMES)[number]

/** A radius, between 0 and 1, for each angle. */
type Radius = (angle: number) => number

/** A circle with `lobes` soft bumps of relative `depth`, scaled to fit its box. */
const wavy =
  (lobes: number, depth: number): Radius =>
  (angle) =>
    (1 + depth * Math.cos(lobes * angle)) / (1 + depth)

/** |x|⁴ + |y|⁴ = 1: a square with very round corners. */
const squircle: Radius = (angle) =>
  (Math.abs(Math.cos(angle)) ** 4 + Math.abs(Math.sin(angle)) ** 4) ** -0.25

const RADIUS: Record<ShapeName, Radius> = {
  cookie: wavy(9, 0.07),
  clover: wavy(4, 0.18),
  squircle,
  pentagon: wavy(5, 0.11),
  sunny: wavy(12, 0.05),
  flower: wavy(8, 0.16),
}

export function shapePolygon(name: ShapeName): string {
  const radius = RADIUS[name]
  const points = Array.from({ length: POINTS }, (_, i) => {
    // From the top, clockwise
    const angle = (i / POINTS) * 2 * Math.PI - Math.PI / 2
    const r = radius(angle)
    const x = 50 + 50 * r * Math.cos(angle)
    const y = 50 + 50 * r * Math.sin(angle)
    return `${x.toFixed(2)}% ${y.toFixed(2)}%`
  })
  return `polygon(${points.join(', ')})`
}

/**
 * Always the same shape for the same category, picked from its id. The flower is left out:
 * it marks the chosen one.
 */
export function shapeFor(id: string): ShapeName {
  let hash = 0
  for (const character of id) hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0
  const shapes = SHAPE_NAMES.filter((name) => name !== 'flower')
  return shapes[hash % shapes.length] as ShapeName
}

/** Makes the shapes available to CSS as `--shape-<name>` (see `.shape-*` in index.css). */
export function installShapes(root: HTMLElement = document.documentElement): void {
  for (const name of SHAPE_NAMES) root.style.setProperty(`--shape-${name}`, shapePolygon(name))
}
