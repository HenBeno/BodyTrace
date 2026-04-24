import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated"

import { theme } from "@/utils/theme"

export interface FuturisticBackgroundProps {
  isDark: boolean
}

export function FuturisticBackground({ isDark }: FuturisticBackgroundProps) {
  const reducedMotion = useReducedMotion()
  const glowScaleA = useSharedValue(1)
  const glowScaleB = useSharedValue(1)
  const glowOpacity = useSharedValue(isDark ? 0.45 : 0.22)

  React.useEffect(() => {
    if (reducedMotion) return

    glowScaleA.value = withRepeat(
      withSequence(
        withTiming(1.12, {
          duration: 2600,
          easing: Easing.inOut(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(1, {
          duration: 2600,
          easing: Easing.inOut(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      ),
      -1,
      false,
    )
    glowScaleB.value = withRepeat(
      withSequence(
        withTiming(0.92, {
          duration: 2900,
          easing: Easing.inOut(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(1.06, {
          duration: 2900,
          easing: Easing.inOut(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      ),
      -1,
      false,
    )
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(isDark ? 0.56 : 0.3, {
          duration: 2200,
          reduceMotion: ReduceMotion.System,
        }),
        withTiming(isDark ? 0.4 : 0.2, {
          duration: 2200,
          reduceMotion: ReduceMotion.System,
        }),
      ),
      -1,
      true,
    )
  }, [glowOpacity, glowScaleA, glowScaleB, isDark, reducedMotion])

  const glowAStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScaleA.value }],
    opacity: glowOpacity.value,
  }))
  const glowBStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScaleB.value }],
    opacity: glowOpacity.value * 0.92,
  }))

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={
          isDark
            ? ["#04060a", "#080a0d", "#0a0f17", "#080a0d"]
            : ["#f7fbff", "#f2f9ff", "#eef6ff", "#f8fafc"]
        }
        locations={[0, 0.35, 0.78, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.glowOrb,
          styles.topOrb,
          glowAStyle,
          {
            backgroundColor: theme.accentGlow,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrb,
          styles.bottomOrb,
          glowBStyle,
          {
            backgroundColor: "rgba(129, 140, 248, 0.34)",
          },
        ]}
      />
      <View
        style={[
          styles.gridOverlay,
          {
            borderColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(15,23,42,0.06)",
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  glowOrb: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
  },
  topOrb: {
    top: -90,
    right: -70,
  },
  bottomOrb: {
    bottom: -80,
    left: -90,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    opacity: 0.55,
  },
})
