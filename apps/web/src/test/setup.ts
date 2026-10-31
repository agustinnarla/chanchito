import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom lacks ResizeObserver, which Radix components use to measure elements.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// findBy* and waitFor wait up to 5 s (1 s by default): on CI, web's tests share the machine with
// mobile's and run slower.
configure({ asyncUtilTimeout: 5_000 })

afterEach(() => {
  cleanup()
})
