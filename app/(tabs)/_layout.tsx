import { BlurView } from "expo-blur"
import { LinearGradient } from "expo-linear-gradient"
import { Tabs } from "expo-router"
import { Columns2, Home, Settings } from "lucide-react-native"
import React from "react"
import { useColorScheme } from "react-native"
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useClientOnlyValue } from "@/components/useClientOnlyValue"
import { theme } from "@/utils/theme"

function FuturisticTabIcon({
  focused,
  color,
  size,
  Icon,
}: {
  focused: boolean
  color: string
  size: number
  Icon: typeof Home
}) {
  const scale = useSharedValue(focused ? 1.1 : 1)
  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, {
      damping: 16,
      stiffness: 260,
      reduceMotion: ReduceMotion.System,
    })
  }, [focused, scale])
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={style}>
      <Icon color={color} size={size} strokeWidth={focused ? 2.5 : 2.2} />
    </Animated.View>
  )
}

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const inactive = isDark ? theme.mutedText : "#64748b"
  const active = theme.accent
  const barBg = isDark ? theme.canvas : "#ffffff"
  const border = isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)"

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopColor: border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12),
          /** Tab content + home indicator / Android gesture or 3-button bar */
          height: 56 + 8 + Math.max(insets.bottom, 12),
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={
              isDark
                ? ["rgba(8,10,13,0.86)", "rgba(8,10,13,0.98)"]
                : ["rgba(255,255,255,0.74)", "rgba(248,250,252,0.96)"]
            }
            style={{ flex: 1 }}
          >
            <BlurView
              intensity={isDark ? 40 : 32}
              tint={isDark ? "dark" : "light"}
              style={{ flex: 1 }}
            />
          </LinearGradient>
        ),
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: isDark ? theme.canvas : "#f8fafc",
        },
        headerTintColor: theme.accent,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          color: isDark ? theme.primaryText : "#0f172a",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Timeline",
          tabBarIcon: ({ color, size, focused }) => (
            <FuturisticTabIcon
              focused={focused}
              color={color}
              size={size}
              Icon={Home}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: "Compare",
          tabBarIcon: ({ color, size, focused }) => (
            <FuturisticTabIcon
              focused={focused}
              color={color}
              size={size}
              Icon={Columns2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Privacy",
          tabBarIcon: ({ color, size, focused }) => (
            <FuturisticTabIcon
              focused={focused}
              color={color}
              size={size}
              Icon={Settings}
            />
          ),
        }}
      />
    </Tabs>
  )
}
