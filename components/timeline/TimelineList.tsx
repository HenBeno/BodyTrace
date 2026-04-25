import { Link } from "expo-router"
import { Camera } from "lucide-react-native"
import React, { useCallback } from "react"
import {
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  Text,
  useColorScheme,
  View,
} from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"

import { PressableScale } from "@/components/ui/PressableScale"
import { useEntries } from "@/contexts/EntriesContext"
import { success } from "@/services/haptics"
import type { Entry } from "@/types"
import { space, theme } from "@/utils/theme"

import { TimelineEntry } from "./TimelineEntry"

/** Pixels from top; offsets at or below this count as "at top" to reduce flicker. */
const SCROLL_TOP_THRESHOLD_PX = 12

export interface TimelineListProps {
  entries: Entry[]
  ListHeaderComponent?: React.ReactElement | null
  /** When false, empty state hides the primary CTA (parent controls single-button policy). */
  showEmptyNewEntryCta?: boolean
  /** Fired when scroll position crosses the top threshold (list at top vs scrolled). */
  onAtTopChange?: (atTop: boolean) => void
}

function EmptyState({ showNewEntryCta }: { showNewEntryCta: boolean }) {
  return (
    <View className="w-full flex-1 justify-center px-1 pb-6 pt-4">
      <Animated.View
        entering={FadeInDown.duration(300)}
        className="mx-auto w-full max-w-sm"
      >
        <View className="items-center rounded-3xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 dark:border-white/25 dark:bg-elevated">
          <View className="mb-4 rounded-full bg-accent/15 p-4">
            <Camera size={32} color={theme.accent} />
          </View>
          <Text className="text-center font-inter-bold text-lg text-slate-900 dark:text-vault-fg">
            Start your timeline
          </Text>
          <Text className="mt-2 text-center text-base leading-6 text-slate-600 dark:text-vault-muted">
            Capture front, side, and back — saved only on your device.
          </Text>
          {showNewEntryCta ? (
            <Link href="/entry/new" asChild>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Create new entry"
                accessibilityHint="Opens the camera to capture progress photos"
                className="mt-8 min-h-[52px] w-full items-center justify-center rounded-2xl bg-accent px-8"
              >
                <Text className="text-center font-inter-semibold text-base text-canvas">
                  New entry
                </Text>
              </PressableScale>
            </Link>
          ) : null}
        </View>
      </Animated.View>
    </View>
  )
}

export function TimelineList({
  entries,
  ListHeaderComponent,
  showEmptyNewEntryCta = true,
  onAtTopChange,
}: TimelineListProps) {
  const { refreshEntries, refreshing } = useEntries()
  const colorScheme = useColorScheme()

  const onRefresh = useCallback(async () => {
    await refreshEntries()
    success()
  }, [refreshEntries])

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!onAtTopChange) return
      const y = event.nativeEvent.contentOffset.y
      const atTop = y <= SCROLL_TOP_THRESHOLD_PX
      onAtTopChange(atTop)
    },
    [onAtTopChange],
  )

  const renderItem: ListRenderItem<Entry> = ({ item, index }) => (
    <TimelineEntry
      entry={item}
      index={index}
      isLast={index === entries.length - 1}
    />
  )

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent ?? undefined}
      ListEmptyComponent={<EmptyState showNewEntryCta={showEmptyNewEntryCta} />}
      onScroll={onAtTopChange ? handleScroll : undefined}
      scrollEventThrottle={onAtTopChange ? 16 : undefined}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={11}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.accent}
          colors={[theme.accent]}
          progressBackgroundColor={
            colorScheme === "dark" ? theme.surface : "#ffffff"
          }
        />
      }
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: space.md + 4,
        paddingBottom: 36,
      }}
      showsVerticalScrollIndicator={false}
    />
  )
}
