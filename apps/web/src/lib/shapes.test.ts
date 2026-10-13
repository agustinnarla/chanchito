import { describe, expect, it } from 'vitest'
import { installShapes, SHAPE_NAMES, shapeFor, shapePolygon } from './shapes'

const pointsOf = (polygon: string) =>
  polygon
    .slice('polygon('.length, -1)
    .split(', ')
    .map((point) => point.split(' ').map((value) => Number.parseFloat(value)))

describe('shapePolygon', () => {
  it('gives every shape the same number of points, so they can morph into each other', () => {
    const counts = SHAPE_NAMES.map((name) => pointsOf(shapePolygon(name)).length)
    expect(new Set(counts)).toEqual(new Set([96]))
  })

  it('keeps every point inside its box', () => {
    for (const name of SHAPE_NAMES) {
      for (const [x, y] of pointsOf(shapePolygon(name))) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(100)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(100)
      }
    }
  })

  it('starts at the top center, so every morph turns the same way', () => {
    for (const name of SHAPE_NAMES) {
      const [x, y] = pointsOf(shapePolygon(name))[0] ?? []
      expect(x).toBe(50)
      expect(y).toBeLessThan(10)
    }
  })
})

describe('shapeFor', () => {
  it('always gives the same shape to the same category', () => {
    expect(shapeFor('c-super')).toBe(shapeFor('c-super'))
  })

  it('spreads categories over the shapes, but never the flower', () => {
    const shapes = new Set(Array.from({ length: 200 }, (_, i) => shapeFor(`category-${i}`)))
    expect(shapes.size).toBe(SHAPE_NAMES.length - 1)
    expect(shapes.has('flower')).toBe(false)
  })
})

describe('installShapes', () => {
  it('exposes every shape as a CSS custom property', () => {
    const root = document.createElement('div')
    installShapes(root)
    for (const name of SHAPE_NAMES) {
      expect(root.style.getPropertyValue(`--shape-${name}`)).toBe(shapePolygon(name))
    }
  })
})
