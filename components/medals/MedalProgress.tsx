import React from "react"
import { Text, View } from "react-native"

export interface MedalProgressProps {
  progress: number
  label: string
}

export function MedalProgress({ progress, label }: MedalProgressProps) {
  const clamped = Math.max(0, Math.min(1, progress))
  return (
    <View className="mt-3">
      <View className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
        <View
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max(6, clamped * 100)}%` }}
        />
      </View>
      <Text className="mt-1.5 text-xs text-slate-600 dark:text-vault-muted">
        {label}
      </Text>
    </View>
  )
}
