import { Columns2, MoreHorizontal, Share2 } from "lucide-react-native"
import React, { useCallback, useMemo, useState } from "react"
import { Alert, ScrollView, Text, useColorScheme, View } from "react-native"
import Animated, { FadeInDown } from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

import { SideBySide } from "@/components/comparison/SideBySide"
import { SliderOverlay } from "@/components/comparison/SliderOverlay"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { ListLoadingSkeleton } from "@/components/ui/ListLoadingSkeleton"
import { FuturisticBackground } from "@/components/ui/FuturisticBackground"
import { PressableScale } from "@/components/ui/PressableScale"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { SegmentedControl } from "@/components/ui/SegmentedControl"
import { useEntries } from "@/contexts/EntriesContext"
import { shareImageUri } from "@/services/export"
import { lightImpact, selection } from "@/services/haptics"
import type { PhotoAngle } from "@/types"
import { getPhotoOriginalUri } from "@/utils/photos"
import { space, theme } from "@/utils/theme"

const ANGLES: { id: PhotoAngle; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
]

const MODES: { id: "side" | "slider"; label: string }[] = [
  { id: "slider", label: "Slider" },
  { id: "side", label: "Side by side" },
]

const CHIP_SNAP = 96

function formatShort(d: Date) {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function CompareScreen() {
  const { entries, ready } = useEntries()
  const isDark = useColorScheme() === "dark"
  const [angle, setAngle] = useState<PhotoAngle>("front")
  const [mode, setMode] = useState<"side" | "slider">("slider")
  const [olderId, setOlderId] = useState<string | null>(null)
  const [newerId, setNewerId] = useState<string | null>(null)
  const [showShareRow, setShowShareRow] = useState(false)

  const sortedAsc = useMemo(
    () =>
      [...entries].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      ),
    [entries],
  )
  const sortedDesc = useMemo(
    () =>
      [...entries].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
    [entries],
  )

  const defaultOlder = sortedAsc[0]
  const defaultNewer = sortedDesc[0]

  const older = useMemo(
    () => entries.find((e) => e.id === (olderId ?? defaultOlder?.id)),
    [defaultOlder?.id, entries, olderId],
  )
  const newer = useMemo(
    () => entries.find((e) => e.id === (newerId ?? defaultNewer?.id)),
    [defaultNewer?.id, entries, newerId],
  )

  const beforeUri = older ? getPhotoOriginalUri(older.photos, angle) : null
  const afterUri = newer ? getPhotoOriginalUri(newer.photos, angle) : null

  const effectiveOlderId = olderId ?? defaultOlder?.id ?? null
  const effectiveNewerId = newerId ?? defaultNewer?.id ?? null

  const onPickOlder = useCallback(
    (id: string) => {
      if (id !== effectiveOlderId) selection()
      setOlderId(id)
    },
    [effectiveOlderId],
  )

  const onPickNewer = useCallback(
    (id: string) => {
      if (id !== effectiveNewerId) selection()
      setNewerId(id)
    },
    [effectiveNewerId],
  )

  const onShareBefore = useCallback(async () => {
    if (!beforeUri) return
    try {
      await shareImageUri(beforeUri)
    } catch (e) {
      Alert.alert(
        "Share failed",
        e instanceof Error ? e.message : "Unknown error",
      )
    }
  }, [beforeUri])

  const onShareAfter = useCallback(async () => {
    if (!afterUri) return
    try {
      await shareImageUri(afterUri)
    } catch (e) {
      Alert.alert(
        "Share failed",
        e instanceof Error ? e.message : "Unknown error",
      )
    }
  }, [afterUri])

  if (!ready) {
    return (
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-1">
          <FuturisticBackground isDark={isDark} />
          <ListLoadingSkeleton rows={2} />
        </View>
      </SafeAreaView>
    )
  }

  if (entries.length < 2) {
    return (
      <SafeAreaView className="flex-1 px-4" edges={["top"]}>
        <View className="flex-1">
          <FuturisticBackground isDark={isDark} />
          <ScreenHeader
            title="Compare"
            subtitle="Same angle, same framing — two checkpoints side by side."
            leftAccessory={<Columns2 size={28} color={theme.accent} />}
          />
          <Animated.View entering={FadeInDown.duration(280)}>
            <Card className="mt-1">
              <Text className="text-center font-inter-semibold text-base text-slate-900 dark:text-vault-fg">
                Add two checkpoints
              </Text>
              <Text className="mt-2 text-center leading-6 text-slate-600 dark:text-vault-muted">
                Capture one more entry on your timeline, then come back here to
                compare before and after.
              </Text>
            </Card>
          </Animated.View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="flex-1">
        <FuturisticBackground isDark={isDark} />
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: space.lg + 8 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <ScreenHeader
            eyebrow="Visual diff"
            title="Compare"
            subtitle="Drag the slider to compare the same angle between two dates."
            leftAccessory={<Columns2 size={28} color={theme.accent} />}
            right={
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Share and export options"
                accessibilityHint="Shows buttons to share the earlier or later photo"
                hitSlop={12}
                className="min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white/90 dark:border-cyan-300/25 dark:bg-elevated/90"
                onPress={() => {
                  lightImpact()
                  setShowShareRow((v) => !v)
                }}
                hapticOnPressIn={false}
              >
                <MoreHorizontal size={22} color={theme.accent} />
              </PressableScale>
            }
          />

          <View className="mb-3 flex-row flex-wrap items-end gap-3">
            <View className="min-w-0 flex-1">
              <Text className="mb-2 font-inter-semibold text-[11px] uppercase tracking-[0.12em] text-vault-muted">
                Angle
              </Text>
              <SegmentedControl
                options={ANGLES}
                value={angle}
                onChange={setAngle}
              />
            </View>
          </View>
          <View className="mb-5">
            <Text className="mb-2 font-inter-semibold text-[11px] uppercase tracking-[0.12em] text-vault-muted">
              Layout
            </Text>
            <SegmentedControl options={MODES} value={mode} onChange={setMode} />
            <Text className="mt-2 text-xs text-slate-600 dark:text-vault-muted">
              {mode === "slider"
                ? "Interactive mode: drag to reveal change."
                : "Gallery mode: inspect both photos side by side."}
            </Text>
          </View>

          <Text className="mb-2 font-inter-semibold text-[11px] uppercase tracking-[0.12em] text-vault-muted">
            Earlier entry
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            decelerationRate="fast"
            snapToInterval={CHIP_SNAP}
            snapToAlignment="start"
            contentContainerStyle={{ paddingRight: space.md }}
          >
            {sortedAsc.map((e) => {
              const selected = effectiveOlderId === e.id
              return (
                <PressableScale
                  key={e.id}
                  hapticOnPressIn={false}
                  onPress={() => onPickOlder(e.id)}
                  className={`mr-2 min-h-[44px] min-w-[88px] justify-center rounded-2xl border px-3 py-2 ${
                    selected
                      ? "border-accent bg-accent-dim"
                      : "border-slate-200 bg-white dark:border-white/10 dark:bg-elevated"
                  }`}
                >
                  <Text className="text-center font-inter-medium text-xs text-slate-800 dark:text-vault-fg">
                    {formatShort(e.createdAt)}
                  </Text>
                </PressableScale>
              )
            })}
          </ScrollView>

          <Text className="mb-2 font-inter-semibold text-[11px] uppercase tracking-[0.12em] text-vault-muted">
            Later entry
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            decelerationRate="fast"
            snapToInterval={CHIP_SNAP}
            snapToAlignment="start"
            contentContainerStyle={{ paddingRight: space.md }}
          >
            {sortedDesc.map((e) => {
              const selected = effectiveNewerId === e.id
              return (
                <PressableScale
                  key={e.id}
                  hapticOnPressIn={false}
                  onPress={() => onPickNewer(e.id)}
                  className={`mr-2 min-h-[44px] min-w-[88px] justify-center rounded-2xl border px-3 py-2 ${
                    selected
                      ? "border-accent bg-accent-dim"
                      : "border-slate-200 bg-white dark:border-white/10 dark:bg-elevated"
                  }`}
                >
                  <Text className="text-center font-inter-medium text-xs text-slate-800 dark:text-vault-fg">
                    {formatShort(e.createdAt)}
                  </Text>
                </PressableScale>
              )
            })}
          </ScrollView>

          {older && newer ? (
            beforeUri && afterUri ? (
              <>
                {mode === "slider" ? (
                  <SliderOverlay beforeUri={beforeUri} afterUri={afterUri} />
                ) : (
                  <SideBySide
                    beforeUri={beforeUri}
                    afterUri={afterUri}
                    beforeLabel={formatShort(older.createdAt)}
                    afterLabel={formatShort(newer.createdAt)}
                  />
                )}
                {showShareRow ? (
                  <View className="mt-4 flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        title="Share earlier photo"
                        variant="secondary"
                        onPress={onShareBefore}
                      />
                    </View>
                    <View className="flex-1">
                      <Button
                        title="Share later photo"
                        variant="secondary"
                        onPress={onShareAfter}
                      />
                    </View>
                  </View>
                ) : null}
                <View className="mt-3 flex-row items-center justify-center gap-2 opacity-80">
                  <Share2 size={14} color={theme.mutedText} />
                  <Text className="flex-1 text-center text-xs text-vault-muted">
                    Exports use the system share sheet (on-device files when
                    saved locally). Tap ··· to share.
                  </Text>
                </View>
              </>
            ) : (
              <Animated.View entering={FadeInDown.duration(240)}>
                <Card>
                  <Text className="leading-6 text-slate-700 dark:text-vault-muted">
                    One or both entries have no photo for this angle. Pick
                    another angle above, or add that photo in a new entry.
                  </Text>
                </Card>
              </Animated.View>
            )
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
