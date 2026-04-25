import { Link } from "expo-router"
import { Flame, Plus, Sparkles, Target } from "lucide-react-native"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Text, useColorScheme, View } from "react-native"
import Animated, {
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

import { TimelineList } from "@/components/timeline/TimelineList"
import { ListLoadingSkeleton } from "@/components/ui/ListLoadingSkeleton"
import { FuturisticBackground } from "@/components/ui/FuturisticBackground"
import { PressableScale } from "@/components/ui/PressableScale"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { useEntries } from "@/contexts/EntriesContext"
import { APP_NAME } from "@/utils/constants"
import { computeMedalsProgress, getConsecutiveDayStreak } from "@/utils/medals"
import { theme } from "@/utils/theme"

function FloatingNewEntryCta() {
  const pulse = useSharedValue(1)
  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.04, {
          duration: 1100,
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(1, { duration: 1100, reduceMotion: ReduceMotion.System }),
      ),
      -1,
      false,
    )
  }, [pulse])
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  return (
    <Animated.View style={pulseStyle} entering={FadeInDown.duration(320)}>
      <Link href="/entry/new" asChild>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="New entry"
          accessibilityHint="Start a new progress check-in"
          className="absolute bottom-6 right-5 min-h-[56px] flex-row items-center gap-2 rounded-full border border-cyan-300/35 bg-accent px-5 shadow-vault"
        >
          <Plus size={18} color={theme.canvas} />
          <Text className="font-inter-semibold text-base text-canvas">
            New entry
          </Text>
        </PressableScale>
      </Link>
    </Animated.View>
  )
}

export default function HomeScreen() {
  const { entries, ready } = useEntries()
  const hasEntries = entries.length > 0
  const [isAtTop, setIsAtTop] = useState(true)
  const isDark = useColorScheme() === "dark"

  useEffect(() => {
    if (!hasEntries) {
      setIsAtTop(true)
    }
  }, [hasEntries])

  const onAtTopChange = useCallback((atTop: boolean) => {
    setIsAtTop((prev) => (prev !== atTop ? atTop : prev))
  }, [])

  const showHeaderNew = hasEntries && isAtTop
  const showFloatingNew = hasEntries && !isAtTop

  const streak = useMemo(
    () => getConsecutiveDayStreak(entries.map((e) => e.createdAt)),
    [entries],
  )
  const medalsSnapshot = useMemo(
    () => computeMedalsProgress(entries),
    [entries],
  )

  const header = (
    <View>
      <ScreenHeader
        eyebrow="Your journey"
        title={APP_NAME}
        subtitle="Keep momentum with quick check-ins. Tiny steps, visible change."
        leftAccessory={<Sparkles size={26} color={theme.accent} />}
        right={
          showHeaderNew ? (
            <Link href="/entry/new" asChild>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="New entry"
                accessibilityHint="Opens the camera flow to add a timeline checkpoint"
                className="flex-row items-center gap-1.5 rounded-2xl border border-cyan-300/35 bg-accent px-3.5 py-2.5 shadow-vault"
              >
                <Plus size={18} color={theme.canvas} />
                <Text className="font-inter-semibold text-sm text-canvas">
                  New
                </Text>
              </PressableScale>
            </Link>
          ) : undefined
        }
      />
      <Animated.View
        entering={FadeInDown.duration(300)}
        className="mb-4 rounded-3xl border border-cyan-300/20 bg-white/80 p-4 dark:bg-surface/85"
      >
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1 pr-3">
            <Text className="font-inter-semibold text-xs uppercase tracking-[0.14em] text-accent">
              Momentum
            </Text>
            <Text className="mt-1 font-inter-bold text-xl text-slate-900 dark:text-vault-fg">
              {streak > 0 ? `${streak}-day streak` : "Start your streak"}
            </Text>
            <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
              {entries.length > 0
                ? "Log one checkpoint today to keep the chain alive."
                : "Take your first progress photo to unlock momentum."}
            </Text>
          </View>
          <View className="items-center rounded-2xl border border-cyan-300/25 bg-accent/10 px-3 py-2">
            <Flame size={20} color={theme.accent} />
            <Text className="mt-1 font-inter-semibold text-xs text-accent">
              {entries.length} total
            </Text>
          </View>
        </View>
        <View className="mt-3 flex-row items-center gap-2">
          <Target size={14} color={theme.mutedText} />
          <Text className="text-xs text-slate-600 dark:text-vault-muted">
            {medalsSnapshot.nextMedal
              ? `Next medal: ${medalsSnapshot.nextMedal.title}`
              : "All medals unlocked. Keep your momentum alive."}
          </Text>
        </View>
      </Animated.View>
    </View>
  )

  if (!ready) {
    return (
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-1">
          <FuturisticBackground isDark={isDark} />
          <ListLoadingSkeleton rows={3} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="flex-1">
        <FuturisticBackground isDark={isDark} />
        <TimelineList
          entries={entries}
          ListHeaderComponent={header}
          showEmptyNewEntryCta={!hasEntries}
          onAtTopChange={onAtTopChange}
        />
        {showFloatingNew ? <FloatingNewEntryCta /> : null}
      </View>
    </SafeAreaView>
  )
}
