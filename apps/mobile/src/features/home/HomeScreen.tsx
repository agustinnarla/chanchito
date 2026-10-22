import { AppText } from '@/components/AppText'
import { Screen } from '@/components/Screen'

export function HomeScreen() {
  return (
    <Screen>
      <AppText accessibilityRole="header" size="display" weight="bold">
        Chanchito
      </AppText>
    </Screen>
  )
}
