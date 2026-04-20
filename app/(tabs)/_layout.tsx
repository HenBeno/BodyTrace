import { Tabs } from "expo-router"
import { Columns2, Home, Settings } from "lucide-react-native"
import React from "react"
import { useColorScheme } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useClientOnlyValue } from "@/components/useClientOnlyValue"
import { theme } from "@/utils/theme"

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
          backgroundColor: barBg,
          borderTopColor: border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12),
          /** Tab content + home indicator / Android gesture or 3-button bar */
          height: 56 + 8 + Math.max(insets.bottom, 12),
        },
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
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: "Compare",
          tabBarIcon: ({ color, size }) => (
            <Columns2 color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Privacy",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
