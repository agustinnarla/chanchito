import type { SignInFailure } from '@chanchito/data'
import { useRef, useState, type ComponentRef } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type TextInput,
} from 'react-native'
import { useAuth } from '@/auth/auth-context'
import { AppText } from '@/components/AppText'
import { BRAND_IMAGES } from '@/components/brand-images'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { IconButton } from '@/components/IconButton'
import { Screen } from '@/components/Screen'
import { TextField } from '@/components/TextField'
import { useTheme } from '@/theme/use-theme'

const HINTS: Record<SignInFailure | 'empty', string> = {
  credentials: 'Revisalos y probá de nuevo.',
  network: '',
  other: '',
  empty: '',
}

type LoginError = { reason: SignInFailure | 'empty'; message: string }

export function LoginScreen() {
  const { signIn } = useAuth()
  const { colors } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<LoginError | null>(null)
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null)

  async function handleSubmit() {
    if (submitting) return
    if (!email.trim() || !password) {
      setError({ reason: 'empty', message: 'Ingresá tu email y tu contraseña.' })
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await signIn(email.trim(), password)
    // On success the session changes and the login screen goes away.
    if (!result.ok) {
      setError({ reason: result.reason, message: result.message })
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior="height" style={styles.fill}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Image
              source={BRAND_IMAGES.chanchito}
              style={styles.mascot}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <AppText size="title" weight="bold">
              Chanchito
            </AppText>
          </View>

          <View style={styles.heading}>
            <AppText accessibilityRole="header" size="display" weight="bold">
              Iniciar sesión
            </AppText>
            <AppText muted>Ingresá con tu email y contraseña.</AppText>
          </View>

          {error && (
            <View
              accessible
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
              style={[styles.alert, { backgroundColor: colors.badChip }]}
            >
              <Icon name="error" filled color={colors.badOnChip} size={20} />
              <View style={styles.fill}>
                <AppText weight="semibold" color={colors.badOnChip}>
                  {error.message}
                </AppText>
                {HINTS[error.reason] !== '' && (
                  <AppText color={colors.badOnChip}>{HINTS[error.reason]}</AppText>
                )}
              </View>
            </View>
          )}

          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <TextField
            ref={passwordRef}
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void handleSubmit()}
            trailing={
              <IconButton
                icon={showPassword ? 'visibility_off' : 'visibility'}
                label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onPress={() => setShowPassword((shown) => !shown)}
              />
            }
          />

          <Button
            label={submitting ? 'Ingresando…' : 'Ingresar'}
            loading={submitting}
            onPress={() => void handleSubmit()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', gap: 20, paddingVertical: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mascot: { width: 40, height: 40 },
  heading: { gap: 6 },
  alert: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
})
