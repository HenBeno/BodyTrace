import { LinearGradient } from "expo-linear-gradient"
import { Link } from "expo-router"
import { ChevronRight } from "lucide-react-native"
import React from "react"
import { Pressable, Text, View } from "react-native"
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated"

import { ResolvedExpoImage } from "@/components/media/ResolvedExpoImage"
import type { Entry } from "@/types"
import { formatMeasurementDisplay } from "@/utils/measurements"
import { getPhotoPreferredUri } from "@/utils/photos"
import { theme } from "@/utils/theme"

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export interface TimelineEntryProps {
  entry: Entry
  index: number
  isLast: boolean
}

function measurementChips(entry: Entry): { label: string; value: string }[] {
  const { waist, weight } = entry.measurements
  const chips: { label: string; value: string }[] = []
  if (waist)
    chips.push({ label: "Waist", value: formatMeasurementDisplay(waist) })
  if (weight)
    chips.push({
      label: "Weight",
      value: formatMeasurementDisplay(weight),
    })
  return chips.slice(0, 3)
}

export function TimelineEntry({ entry, index, isLast }: TimelineEntryProps) {
  const chips = measurementChips(entry)
  const summaryEmpty = chips.length === 0
  const heroUri =
    getPhotoPreferredUri(entry.photos, "front") ??
    getPhotoPreferredUri(entry.photos, "side") ??
    getPhotoPreferredUri(entry.photos, "back")
  return (
    <Link href={`/entry/${entry.id}`} asChild>
      <Pressable accessibilityRole="button">
        <Animated.View
          entering={FadeInDown.duration(260)
            .delay(Math.min(index * 55, 280))
            .reduceMotion(ReduceMotion.System)}
        >
          <View className="mb-6 flex-row">
            <View className="w-8 items-center pt-1">
              {index > 0 ? (
                <View className="mb-1 h-4 w-[2px] rounded-full bg-accent/45" />
              ) : (
                <View className="h-4" />
              )}
              <View
                className="z-10 h-3.5 w-3.5 rounded-full border-2 bg-canvas"
                style={{ borderColor: theme.accent }}
              />
              {!isLast ? (
                <View className="mt-1 h-20 w-[2px] rounded-full bg-accent/35" />
              ) : (
                <View className="mt-1 h-5 w-[2px] rounded-full bg-accent/25" />
              )}
            </View>

            <View className="min-w-0 flex-1 pl-1">
              <View className="overflow-hidden rounded-3xl border border-cyan-300/20 bg-black shadow-vault">
                <View
                  className="relative w-full"
                  style={{ aspectRatio: 3 / 4 }}
                >
                  <ResolvedExpoImage
                    uri={heroUri}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    contentFit="cover"
                    transition={220}
                  />
                  <LinearGradient
                    colors={[
                      "rgba(56,189,248,0.1)",
                      "rgba(0,0,0,0.18)",
                      theme.scrim,
                    ]}
                    locations={[0, 0.45, 1]}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: "46%",
                    }}
                  />
                  <View className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
                    <Text className="font-inter-medium text-[11px] uppercase tracking-[0.14em] text-white/70">
                      {formatDate(entry.createdAt)}
                    </Text>
                    <View className="mt-1 flex-row items-center justify-between gap-2">
                      <Text
                        className="flex-1 font-inter-bold text-xl text-white"
                        numberOfLines={1}
                        maxFontSizeMultiplier={1.35}
                      >
                        Progress check-in
                      </Text>
                      <ChevronRight color={theme.accent} size={22} />
                    </View>
                    <View className="mt-3 flex-row flex-wrap gap-2">
                      {summaryEmpty ? (
                        <View className="rounded-full border border-white/25 bg-white/10 px-3 py-1">
                          <Text className="font-inter-medium text-xs text-white/90">
                            No measurements
                          </Text>
                        </View>
                      ) : (
                        chips.map((c) => (
                          <View
                            key={c.label}
                            className="rounded-full border border-accent/50 bg-canvas/25 px-3 py-1"
                          >
                            <Text
                              className="font-inter-semibold text-sm text-accent"
                              style={{
                                fontVariant: ["tabular-nums"],
                              }}
                            >
                              {c.label} {c.value}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Link>
  )
}
