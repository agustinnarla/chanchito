import { useState } from 'react'

/** A boolean remembered in the browser. Blocked storage: it lasts until the page reloads. */
export function useStoredFlag(key: string, initial: boolean): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored === null ? initial : stored === 'true'
    } catch {
      return initial
    }
  })

  function set(next: boolean) {
    setValue(next)
    try {
      window.localStorage.setItem(key, String(next))
    } catch {
      // Blocked storage: keep it in memory only.
    }
  }

  return [value, set]
}
