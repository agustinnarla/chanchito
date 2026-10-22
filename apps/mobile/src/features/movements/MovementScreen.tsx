import {
  currentMonth,
  parseMonth,
  type Category,
  type Movement,
  type MovementInput,
} from '@chanchito/core'
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, ToastAndroid, View } from 'react-native'
import { AppText } from '@/components/AppText'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { Screen } from '@/components/Screen'
import { useCategories } from '@/features/categories/hooks'
import { useTheme } from '@/theme/use-theme'
import { useCreateMovement, useDeleteMovement, useMovements, useUpdateMovement } from './hooks'
import { initialValues, MovementForm } from './MovementForm'

/**
 * New movement, or editing one: `/movimiento?id=<id>&mes=<aaaa-mm>` (the month says where to find
 * it). Full screen; Back with changes asks before discarding them.
 */
export function MovementScreen() {
  const { colors } = useTheme()
  const params = useLocalSearchParams<{ id?: string; mes?: string }>()
  const month = parseMonth(params.mes, currentMonth())
  const categories = useCategories()
  const movements = useMovements(month)
  const editing = params.id !== undefined
  const movement = editing ? movements.data?.find((m) => m.id === params.id) : undefined

  const title = editing ? 'Editar movimiento' : 'Nuevo movimiento'
  const loading = categories.isPending || (editing && movements.isPending)
  const error = categories.error ?? (editing ? movements.error : null)

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="close" label="Cerrar" onPress={() => router.back()} />
        <AppText accessibilityRole="header" size="title" weight="bold">
          {title}
        </AppText>
      </View>
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Cargando…"
          color={colors.primary}
          style={styles.state}
        />
      ) : error ? (
        <View accessibilityRole="alert" style={styles.state}>
          <AppText color={colors.destructive}>{error.message}</AppText>
          <Button
            label="Reintentar"
            variant="tonal"
            onPress={() => {
              void categories.refetch()
              if (editing) void movements.refetch()
            }}
          />
        </View>
      ) : editing && !movement ? (
        <AppText muted style={styles.state}>
          No encontramos ese movimiento. Puede que se haya eliminado.
        </AppText>
      ) : (
        <Editor categories={categories.data ?? []} movement={movement} />
      )}
    </Screen>
  )
}

function Editor({ categories, movement }: { categories: Category[]; movement?: Movement }) {
  const [initial] = useState(() => initialValues(movement))
  const [values, setValues] = useState(initial)
  const [done, setDone] = useState(false)
  const create = useCreateMovement()
  const update = useUpdateMovement()
  const remove = useDeleteMovement()
  const save = movement ? update : create
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)

  const disablePrevention = usePreventRemove(dirty && !done, ({ repeat }) => {
    Alert.alert('¿Descartar los cambios?', 'Lo que escribiste no se va a guardar.', [
      { text: 'Seguir editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          setDone(true)
          repeat()
        },
      },
    ])
  })

  function finish(message: string) {
    setDone(true)
    disablePrevention()
    ToastAndroid.show(message, ToastAndroid.SHORT)
    router.back()
  }

  function submit(input: MovementInput) {
    const onSuccess = () => finish('Movimiento guardado')
    if (movement) {
      update.mutate({ id: movement.id, input }, { onSuccess })
    } else {
      create.mutate(input, { onSuccess })
    }
  }

  function confirmDelete() {
    if (!movement) return
    Alert.alert('¿Eliminar este movimiento?', 'No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          remove.mutate(movement.id, { onSuccess: () => finish('Movimiento eliminado') }),
      },
    ])
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <MovementForm
        categories={categories}
        movement={movement}
        values={values}
        onValuesChange={setValues}
        saving={save.isPending}
        saveError={(save.error ?? remove.error)?.message ?? null}
        onSubmit={submit}
        onDelete={movement ? confirmDelete : undefined}
        deleting={remove.isPending}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 },
  content: { paddingVertical: 8, paddingBottom: 32 },
  state: { paddingVertical: 32, gap: 12, alignItems: 'flex-start' },
})
