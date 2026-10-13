import { useEffect, useEffectEvent } from 'react'
import { useTheme } from '@/theme/theme-context'
import { useAccountAccent } from './hooks'

/**
 * Brings the account's accent (spec 011): it wins over the one this browser remembered, for
 * example when it was changed on another device. Renders nothing.
 */
export function AccentSync() {
  const { data } = useAccountAccent()
  const { accent, setAccent } = useTheme()
  // Reads the current accent without re-running when the person picks one here
  const apply = useEffectEvent((fromAccount: typeof data) => {
    if (fromAccount && fromAccount !== accent) setAccent(fromAccount)
  })

  useEffect(() => {
    apply(data)
  }, [data])

  return null
}
