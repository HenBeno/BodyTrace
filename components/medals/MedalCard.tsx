import { Award, Camera, Dumbbell, Flame, Scale } from "lucide-react-native"
import React from "react"
import { Text, View } from "react-native"

import { MedalProgress } from "@/components/medals/MedalProgress"
import type { MedalFamily, MedalProgress as MedalProgressModel } from "@/utils/medals"
import { theme } from "@/utils/theme"

const tierClasses = {
  bronze: "border-amber-500/35 bg-amber-100/60 dark:bg-amber-500/10",
  silver: "border-slate-400/35 bg-slate-100/70 dark:bg-slate-300/10",
  gold: "border-yellow-500/35 bg-yellow-100/75 dark:bg-yellow-500/10",
} as const

function iconForFamily(family: MedalFamily) {
  if (family === "streak") return Flame
  if (family === "checkins") return Award
  if (family === "weightLoss") return Scale
  return Camera
}

function progressLabel(medal: MedalProgressModel) {
  if (medal.family === "weightLoss") {
    return `${medal.current.toFixed(1)} / ${medal.target.toFixed(1)} kg`
  }
  return `${Math.floor(medal.current)} / ${medal.target}`
}

function actionCopy(medal: MedalProgressModel) {
  if (medal.unlocked) return "Unlocked"
  if (medal.family === "weightLoss") {
    return `${medal.remaining.toFixed(1)} kg to unlock`
  }
  return `${Math.ceil(medal.remaining)} to unlock`
}

export interface MedalCardProps {
  medal: MedalProgressModel
}

export function MedalCard({ medal }: MedalCardProps) {
  const Icon = iconForFamily(medal.family)
  return (
    <View
      className={`mb-3 rounded-3xl border p-4 ${
        medal.unlocked
          ? "border-cyan-300/45 bg-white/90 dark:bg-surface/90"
          : "border-cyan-200/20 bg-white/70 dark:bg-surface/65"
      }`}
      style={{ opacity: medal.unlocked ? 1 : 0.84 }}
      accessibilityLabel={`${medal.title}, ${medal.unlocked ? "unlocked" : "locked"}`}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-inter-semibold text-base text-slate-900 dark:text-vault-fg">
            {medal.title}
          </Text>
          <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
            {medal.description}
          </Text>
        </View>
        <View className="items-center">
          <Icon size={20} color={theme.accent} />
          <View
            className={`mt-2 rounded-full border px-2.5 py-1 ${tierClasses[medal.tier]}`}
          >
            <Text className="font-inter-semibold text-[10px] uppercase tracking-[0.12em] text-slate-700 dark:text-vault-fg">
              {medal.tier}
            </Text>
          </View>
        </View>
      </View>

      <MedalProgress progress={medal.progress} label={progressLabel(medal)} />

      <View className="mt-3 flex-row items-center gap-1.5 rounded-2xl bg-accent/10 px-3 py-2">
        <Dumbbell size={14} color={theme.accent} />
        <Text className="text-xs text-slate-700 dark:text-vault-muted">
          {medal.unlocked ? "Medal unlocked - keep going for the next tier." : actionCopy(medal)}
        </Text>
      </View>
    </View>
  )
}
