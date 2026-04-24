import { Award, Lock, Sparkles } from "lucide-react-native"
import React, { useMemo, useState } from "react"
import { ScrollView, Text, useColorScheme, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { MedalCard } from "@/components/medals/MedalCard"
import { FuturisticBackground } from "@/components/ui/FuturisticBackground"
import { PressableScale } from "@/components/ui/PressableScale"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { useEntries } from "@/contexts/EntriesContext"
import { computeMedalsProgress, type MedalProgress } from "@/utils/medals"
import { theme } from "@/utils/theme"

type FilterMode = "all" | "unlocked" | "progress"

const FILTERS: { id: FilterMode; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unlocked", label: "Unlocked" },
  { id: "progress", label: "In Progress" },
]

function getFilteredMedals(medals: MedalProgress[], mode: FilterMode) {
  if (mode === "unlocked") return medals.filter((medal) => medal.unlocked)
  if (mode === "progress") return medals.filter((medal) => !medal.unlocked)
  return medals
}

export default function MedalsScreen() {
  const isDark = useColorScheme() === "dark"
  const { entries } = useEntries()
  const [filter, setFilter] = useState<FilterMode>("all")

  const snapshot = useMemo(() => computeMedalsProgress(entries), [entries])
  const medals = useMemo(
    () => getFilteredMedals(snapshot.medals, filter),
    [filter, snapshot.medals],
  )

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="flex-1">
        <FuturisticBackground isDark={isDark} />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            eyebrow="Milestones"
            title="Medals"
            subtitle="Unlock badges for consistency, complete entries, and weight-loss momentum."
            leftAccessory={<Award size={26} color={theme.accent} />}
          />

          <View className="mb-4 rounded-3xl border border-cyan-300/25 bg-white/85 p-4 dark:bg-surface/85">
            <View className="flex-row items-center justify-between">
              <View className="min-w-0 flex-1 pr-3">
                <Text className="font-inter-semibold text-xs uppercase tracking-[0.14em] text-accent">
                  Progress overview
                </Text>
                <Text className="mt-1 font-inter-bold text-2xl text-slate-900 dark:text-vault-fg">
                  {snapshot.unlockedCount}/{snapshot.totalCount} unlocked
                </Text>
                <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
                  {snapshot.nextMedal
                    ? `Next: ${snapshot.nextMedal.title}`
                    : "Amazing! Every medal is unlocked."}
                </Text>
              </View>
              <View className="rounded-2xl border border-cyan-300/30 bg-accent/10 px-3 py-2">
                <Sparkles size={20} color={theme.accent} />
              </View>
            </View>
            {snapshot.nextMedal ? (
              <View className="mt-3 flex-row items-center gap-1.5">
                <Lock size={14} color={theme.mutedText} />
                <Text className="text-xs text-slate-600 dark:text-vault-muted">
                  {snapshot.nextMedal.actionText}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="mb-4 flex-row gap-2">
            {FILTERS.map((item) => {
              const active = item.id === filter
              return (
                <PressableScale
                  key={item.id}
                  onPress={() => setFilter(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter medals: ${item.label}`}
                  className={`rounded-full border px-4 py-2 ${
                    active
                      ? "border-cyan-300/40 bg-accent/15"
                      : "border-slate-300/50 bg-white/65 dark:border-white/10 dark:bg-surface/60"
                  }`}
                >
                  <Text
                    className={`font-inter-semibold text-xs ${
                      active
                        ? "text-accent"
                        : "text-slate-600 dark:text-vault-muted"
                    }`}
                  >
                    {item.label}
                  </Text>
                </PressableScale>
              )
            })}
          </View>

          {medals.map((medal) => (
            <MedalCard key={medal.id} medal={medal} />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
