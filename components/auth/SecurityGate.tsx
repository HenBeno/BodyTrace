import React, { useCallback, useEffect, useState } from "react"
import {
    ActivityIndicator,
    AppState,
    StyleSheet,
    Text,
    View,
} from "react-native"

import { Button } from "@/components/ui/Button"
import { useSettings } from "@/contexts/SettingsContext"
import { authenticateWithBiometrics } from "@/services/biometric"
import { theme } from "@/utils/theme"

export function SecurityGate({ children }: { children: React.ReactNode }) {
  const { settings, ready: settingsReady } = useSettings()
  const [sessionUnlocked, setSessionUnlocked] = useState<boolean | null>(null)

  useEffect(() => {
    if (!settingsReady) return
    if (!settings.biometricEnabled) {
      setSessionUnlocked(true)
      return
    }
    setSessionUnlocked(false)
  }, [settingsReady, settings.biometricEnabled])

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "background" && settings.biometricEnabled) {
        setSessionUnlocked(false)
      }
    })
    return () => sub.remove()
  }, [settings.biometricEnabled])

  const onUnlock = useCallback(async () => {
    const ok = await authenticateWithBiometrics("Unlock BodyTrace")
    if (ok) setSessionUnlocked(true)
  }, [])

  if (!settingsReady) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-canvas">
        <ActivityIndicator color={theme.accent} />
      </View>
    )
  }

  const locked = settings.biometricEnabled && sessionUnlocked !== true

  return (
    <View className="flex-1 bg-slate-50 dark:bg-canvas">
      <View className="flex-1" pointerEvents={locked ? "none" : "auto"}>
        {children}
      </View>
      {locked ? (
        <View
          style={StyleSheet.absoluteFillObject}
          className="items-center justify-center bg-canvas px-6"
          pointerEvents="auto"
        >
          <Text className="text-center font-inter-bold text-2xl text-white">
            BodyTrace locked
          </Text>
          <Text className="mt-3 text-center font-inter-medium text-base text-vault-muted">
            Confirm it is you to view your timeline and photos.
          </Text>
          <View className="mt-8 w-full max-w-xs">
            <Button title="Unlock with biometrics" onPress={onUnlock} />
          </View>
        </View>
      ) : null}
    </View>
  )
}
