import React, { type ReactNode } from "react"
import { Text, View } from "react-native"

export interface ScreenHeaderProps {
  /** Small caps label above title */
  eyebrow?: string
  title: string
  subtitle?: string
  leftAccessory?: ReactNode
  right?: ReactNode
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  leftAccessory,
  right,
}: ScreenHeaderProps) {
  return (
    <View className="pb-4 pt-2">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-start gap-3">
          {leftAccessory ? (
            <View className="pt-0.5">{leftAccessory}</View>
          ) : null}
          <View className="min-w-0 flex-1">
            {eyebrow ? (
              <Text className="mb-1 font-inter-semibold text-[11px] uppercase tracking-[0.14em] text-vault-muted">
                {eyebrow}
              </Text>
            ) : null}
            <Text
              className="font-inter-bold text-2xl text-slate-900 dark:text-vault-fg"
              maxFontSizeMultiplier={1.35}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text className="mt-1.5 text-base leading-6 text-slate-600 dark:text-vault-muted">
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {right ? <View className="shrink-0">{right}</View> : null}
      </View>
    </View>
  )
}
