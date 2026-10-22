import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { FONT_FILES } from '@/theme/fonts'
import { useTheme } from '@/theme/use-theme'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { colors } = useTheme()
  const [loaded, error] = useFonts(FONT_FILES)

  useEffect(() => {
    // Without the fonts the app still works, in the system font.
    if (loaded || error) void SplashScreen.hideAsync()
  }, [loaded, error])

  if (!loaded && !error) return null

  return (
    <>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
      />
      <StatusBar style="auto" />
    </>
  )
}
