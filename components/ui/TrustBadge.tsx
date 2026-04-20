import { Lock, Smartphone } from "lucide-react-native"
import React from "react"
import { Text, View } from "react-native"

import { theme } from "@/utils/theme"

export interface TrustBadgeProps {
  /** Short line of trust copy */
  caption?: string
}

export function TrustBadge({
  caption = "Private — stored only on this device",
}: TrustBadgeProps) {
  return (
    <View className="flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-elevated/90">
      <Smartphone size={16} color={theme.accent} />
      <Lock size={14} color={theme.mutedText} />
      <Text className="flex-1 font-inter-medium text-xs leading-5 text-slate-600 dark:text-vault-muted">
        {caption}
      </Text>
    </View>
  )
}
