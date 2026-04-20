import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
    LayoutChangeEvent,
    Pressable,
    Text,
    View,
    type LayoutRectangle,
} from "react-native"
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated"

import { selection } from "@/services/haptics"

export interface SegmentOption<T extends string> {
  id: T
  label: string
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[]
  value: T
  onChange: (id: T) => void
  className?: string
  /** `onDark` — translucent chips for camera / vault panels */
  scheme?: "default" | "onDark"
  /** Tighter tap targets for camera toolbars */
  density?: "default" | "compact" | "micro"
}

const PAD = 6

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
  scheme = "default",
  density = "default",
}: SegmentedControlProps<T>) {
  const minH =
    density === "micro"
      ? "min-h-[30px]"
      : density === "compact"
        ? "min-h-[36px]"
        : "min-h-[44px]"
  const textSize =
    density === "micro"
      ? "text-[11px]"
      : density === "compact"
        ? "text-xs"
        : "text-sm"
  const gap = density === "micro" ? "gap-1" : "gap-1.5"
  const radius = density === "micro" ? "rounded-lg" : "rounded-xl"

  const trackSurface =
    scheme === "onDark" ? "bg-white/12" : "bg-slate-200 dark:bg-elevated"
  const activeText = "text-canvas"
  const inactiveText =
    scheme === "onDark" ? "text-white/85" : "text-slate-800 dark:text-vault-fg"

  const [layouts, setLayouts] = useState<(LayoutRectangle | null)[]>(() =>
    options.map(() => null),
  )
  const pillX = useSharedValue(PAD)
  const pillW = useSharedValue(0)
  const pillOpacity = useSharedValue(0)

  const optionKey = useMemo(() => options.map((o) => o.id).join("|"), [options])

  useEffect(() => {
    setLayouts(options.map(() => null))
    pillOpacity.value = 0
  }, [optionKey, options]) // eslint-disable-line react-hooks/exhaustive-deps -- pillOpacity stable ref

  const onCellLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout
    setLayouts((prev) => {
      const next = [...prev]
      next[index] = { x, y, width, height }
      return next
    })
  }, [])

  const activeIndex = options.findIndex((o) => o.id === value)

  useEffect(() => {
    const cell = layouts[activeIndex]
    if (!cell || cell.width <= 0) return
    pillX.value = withTiming(PAD + cell.x, { duration: 220 })
    pillW.value = withTiming(cell.width, { duration: 220 })
    pillOpacity.value = withTiming(1, { duration: 160 })
  }, [activeIndex, layouts, pillOpacity, pillW, pillX])

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    transform: [{ translateX: pillX.value }],
    width: Math.max(0, pillW.value),
  }))

  const onSelect = (id: T) => {
    if (id === value) return
    selection()
    onChange(id)
  }

  return (
    <View
      className={`relative overflow-hidden ${radius} p-1.5 ${trackSurface} ${className}`}
    >
      <Animated.View
        pointerEvents="none"
        className={`absolute left-0 z-0 bg-accent ${radius}`}
        style={[{ top: PAD, bottom: PAD }, pillStyle]}
      />
      <View className={`relative z-10 flex-row ${gap}`}>
        {options.map((o, i) => {
          const active = value === o.id
          return (
            <View
              key={o.id}
              className="min-w-0 flex-1"
              onLayout={(e) => onCellLayout(i, e)}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onSelect(o.id)}
                className={`${minH} items-center justify-center ${radius} px-1.5`}
              >
                <Text
                  className={`text-center font-inter-semibold ${textSize} ${active ? activeText : inactiveText}`}
                >
                  {o.label}
                </Text>
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}
