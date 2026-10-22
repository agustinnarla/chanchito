import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { useAuth } from '@/auth/auth-context'
import { AuthProvider } from '@/auth/AuthProvider'
import { createQueryClient } from '@/lib/query-client'
import { FONT_FILES } from '@/theme/fonts'
import { useTheme } from '@/theme/use-theme'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

/** Without a session only the login exists; with one, only the app. */
function RootNavigator() {
  const { colors } = useTheme()
  const { session, loading } = useAuth()
  const [fontsLoaded, fontsError] = useFonts(FONT_FILES)
  // Without the fonts the app still works, in the system font.
  const ready = !loading && (fontsLoaded || fontsError !== null)

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Protected guard={session !== null}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={session === null}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  )
}
