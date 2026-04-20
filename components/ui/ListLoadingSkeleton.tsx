import React, { useEffect } from "react"
import { useColorScheme, View } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

export interface ListLoadingSkeletonProps {
  /** Number of placeholder rows */
  rows?: number
  className?: string
}

export function ListLoadingSkeleton({
  rows = 4,
  className = "",
}: ListLoadingSkeletonProps) {
  const scheme = useColorScheme()
  const isDark = scheme === "dark"
  const pulse = useSharedValue(0.4)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.72, { duration: 700 }),
        withTiming(0.38, { duration: 700 }),
      ),
      -1,
      false,
    )
  }, [pulse])

  const barStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }))

  const base = isDark ? "bg-white/12" : "bg-slate-200"
  const line = isDark ? "bg-white/10" : "bg-slate-300/90"

  return (
    <View className={`flex-1 px-5 pt-6 ${className}`}>
      <Animated.View
        className={`mb-6 h-24 rounded-3xl ${base}`}
        style={barStyle}
      />
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} className="mb-6 flex-row">
          <View className="w-8 items-center pt-1">
            <View className={`h-3.5 w-3.5 rounded-full ${base}`} />
            <View className={`mt-1 h-16 w-[2px] rounded-full ${line}`} />
          </View>
          <View className="min-w-0 flex-1 pl-1">
            <Animated.View
              className={`overflow-hidden rounded-3xl ${base}`}
              style={[{ aspectRatio: 3 / 4 }, barStyle]}
            />
          </View>
        </View>
      ))}
    </View>
  )
}
