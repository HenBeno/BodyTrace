import { Stack } from "expo-router"
import React, { useMemo } from "react"
import { ActivityIndicator, View, useColorScheme } from "react-native"

import { SecurityGate } from "@/components/auth/SecurityGate"
import { useAuthRedirect } from "@/components/auth/useAuthRedirect"
import { useAuth } from "@/contexts/AuthContext"
import { EntriesProvider } from "@/contexts/EntriesContext"
import { theme } from "@/utils/theme"

export function AppNavigation() {
  useAuthRedirect()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { authReady, session, needsOnboarding } = useAuth()

  const stackBg = useMemo(
    () => ({
      backgroundColor: isDark ? theme.canvas : "#f8fafc",
    }),
    [isDark],
  )

  const securityGateEnabled = Boolean(session?.user && !needsOnboarding)

  if (!authReady) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-canvas">
        <ActivityIndicator color={theme.accent} />
      </View>
    )
  }

  return (
    <SecurityGate enabled={securityGateEnabled}>
      <EntriesProvider>
        <Stack
          screenOptions={{
            contentStyle: stackBg,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="entry" options={{ headerShown: false }} />
        </Stack>
      </EntriesProvider>
    </SecurityGate>
  )
}
