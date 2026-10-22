import { StyleSheet, View } from 'react-native'
import { useAuth } from '@/auth/auth-context'
import { AppText } from '@/components/AppText'
import { IconButton } from '@/components/IconButton'
import { Screen } from '@/components/Screen'

export function HomeScreen() {
  const { signOut } = useAuth()
  return (
    <Screen>
      <View style={styles.header}>
        <AppText accessibilityRole="header" size="title" weight="bold">
          Chanchito
        </AppText>
        <IconButton icon="logout" label="Cerrar sesión" onPress={() => void signOut()} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})
