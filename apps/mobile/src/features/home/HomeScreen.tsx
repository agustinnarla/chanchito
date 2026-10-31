import { currentMonth, formatMonthLabel, groupMovementsByDay, type Month } from '@chanchito/core'
import { useState } from 'react'
import { router } from 'expo-router'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native'
import { useAuth } from '@/auth/auth-context'
import { AppText } from '@/components/AppText'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { IconButton } from '@/components/IconButton'
import { MonthNavigation } from '@/components/MonthNavigation'
import { Screen } from '@/components/Screen'
import { useMovements } from '@/features/movements/hooks'
import { MovementItem } from '@/features/movements/MovementItem'
import { useTheme } from '@/theme/use-theme'
import { MonthSummary } from './MonthSummary'

/** Inicio: one month at a time, with its result and its movements by day. */
export function HomeScreen() {
  const { signOut } = useAuth()
  const { colors } = useTheme()
  const [month, setMonth] = useState<Month>(() => currentMonth())
  const movements = useMovements(month)
  const [refreshing, setRefreshing] = useState(false)

  async function refresh() {
    setRefreshing(true)
    await movements.refetch()
    setRefreshing(false)
  }

  const sections = (movements.data ? groupMovementsByDay(movements.data) : []).map((day) => ({
    key: day.date,
    title: day.label,
    data: day.movements,
  }))

  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(movement) => movement.id}
        renderItem={({ item }) => (
          <MovementItem
            movement={item}
            onPress={() =>
              router.push({ pathname: '/movimiento', params: { id: item.id, mes: month } })
            }
          />
        )}
        renderSectionHeader={({ section }) => (
          <AppText
            accessibilityRole="header"
            size="caption"
            weight="semibold"
            muted
            style={[styles.day, { backgroundColor: colors.background }]}
          >
            {section.title}
          </AppText>
        )}
        stickySectionHeadersEnabled
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surfaceLow}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.top}>
              <AppText size="title" weight="bold">
                Chanchito
              </AppText>
              <IconButton icon="logout" label="Cerrar sesión" onPress={() => void signOut()} />
            </View>
            <MonthNavigation month={month} onChange={setMonth} />
            {movements.data && movements.data.length > 0 && (
              <MonthSummary movements={movements.data} />
            )}
          </View>
        }
        ListEmptyComponent={
          movements.isPending ? (
            <ActivityIndicator
              accessibilityLabel="Cargando movimientos…"
              color={colors.primary}
              style={styles.state}
            />
          ) : movements.isError ? (
            <View accessibilityRole="alert" style={styles.state}>
              <AppText color={colors.destructive}>{movements.error.message}</AppText>
              <Button label="Reintentar" variant="tonal" onPress={() => void movements.refetch()} />
            </View>
          ) : (
            <AppText muted style={styles.state}>
              No hay movimientos en {formatMonthLabel(month).toLowerCase()}.
            </AppText>
          )
        }
        contentContainerStyle={styles.content}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo movimiento"
        onPress={() => router.push('/movimiento')}
        android_ripple={{ color: colors.border }}
        style={[styles.fab, { backgroundColor: colors.active }]}
      >
        <Icon name="add" color={colors.activeForeground} />
        <AppText weight="semibold" color={colors.activeForeground}>
          Nuevo movimiento
        </AppText>
      </Pressable>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: 96 },
  header: { gap: 8, paddingBottom: 8 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  day: { paddingTop: 12, paddingBottom: 4 },
  state: { paddingVertical: 32, gap: 12, alignItems: 'flex-start' },
  // Material 3 extended FAB, above the list's last row (content has room for it)
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
})
