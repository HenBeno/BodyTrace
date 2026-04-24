import React, { useMemo } from "react"
import { Text, View } from "react-native"

import {
  bmiCategoryLabel,
  bmiGaugePosition01,
  classifyBmi,
  computeBmi,
  type BmiCategory,
} from "@/utils/bmi"
import { theme } from "@/utils/theme"

const SEGMENTS: { category: BmiCategory; flex: number; label: string }[] = [
  { category: "underweight", flex: 3.5, label: "<18.5" },
  { category: "normal", flex: 6.5, label: "18.5-25" },
  { category: "overweight", flex: 5, label: "25-30" },
  { category: "obese", flex: 10, label: "30+" },
]

const SEGMENT_BG: Record<BmiCategory, string> = {
  underweight: "rgba(56,189,248,0.35)",
  normal: "rgba(52,211,153,0.45)",
  overweight: "rgba(251,191,36,0.45)",
  obese: "rgba(251,113,133,0.45)",
}

export interface BmiGaugeProps {
  weightKg: number | null
  heightCm: number | null
}

export function BmiGauge({ weightKg, heightCm }: BmiGaugeProps) {
  const bmi = useMemo(() => {
    if (weightKg == null || heightCm == null) return null
    return computeBmi(weightKg, heightCm)
  }, [weightKg, heightCm])

  if (bmi == null) {
    return (
      <View className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-elevated">
        <Text className="font-inter-semibold text-slate-800 dark:text-vault-fg">
          BMI
        </Text>
        <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
          Enter weight and height to calculate your BMI.
        </Text>
      </View>
    )
  }

  const category = classifyBmi(bmi)
  const markerX = bmiGaugePosition01(bmi)

  return (
    <View className="mt-2">
      <View className="flex-row items-end justify-between">
        <Text className="font-inter-semibold text-slate-800 dark:text-vault-fg">
          BMI
        </Text>
        <Text
          className="font-inter-bold text-2xl text-accent"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {bmi.toFixed(1)}
        </Text>
      </View>
      <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
        {bmiCategoryLabel(category)}
      </Text>

      <View className="mt-4">
        <View className="h-3 w-full flex-row overflow-hidden rounded-full">
          {SEGMENTS.map((seg) => (
            <View
              key={seg.category}
              style={{
                flex: seg.flex,
                backgroundColor: SEGMENT_BG[seg.category],
                borderRightWidth: seg.category === "obese" ? 0 : 1,
                borderRightColor: "rgba(0,0,0,0.08)",
              }}
            />
          ))}
        </View>
        <View className="relative mt-2 h-6 w-full">
          <View
            pointerEvents="none"
            className="absolute -top-3 h-0 w-0 self-start border-b-[10px] border-l-[7px] border-r-[7px] border-b-accent border-l-transparent border-r-transparent"
            style={{ left: `${markerX * 100}%`, marginLeft: -7 }}
          />
        </View>
        <View className="mt-1 flex-row">
          {SEGMENTS.map((seg) => (
            <View key={`${seg.category}-lbl`} style={{ flex: seg.flex }}>
              <Text className="text-center text-[10px] text-slate-500 dark:text-vault-muted">
                {seg.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text className="mt-3 text-xs leading-5 text-slate-500 dark:text-vault-muted">
        BMI is a screening measure only. It does not diagnose health or body
        composition.
      </Text>
      <Text style={{ color: theme.mutedText }} className="mt-1 text-[11px]">
        Scale shown for BMI 15-40.
      </Text>
    </View>
  )
}
