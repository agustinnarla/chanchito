import { useSyncExternalStore } from 'react'

/** Whether a media query matches, kept in sync. Without matchMedia (tests), it doesn't match. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia?.(query)
      list?.addEventListener('change', onChange)
      return () => list?.removeEventListener('change', onChange)
    },
    () => window.matchMedia?.(query).matches ?? false,
  )
}

/** Phones and narrow windows: bottom navigation instead of the side menu. */
export const PHONE_QUERY = '(max-width: 767px)'
