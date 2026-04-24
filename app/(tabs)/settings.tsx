import { Database, Fingerprint, Shield } from "lucide-react-native"
import React, { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  useColorScheme,
  View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { Card } from "@/components/ui/Card"
import { FuturisticBackground } from "@/components/ui/FuturisticBackground"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { TrustBadge } from "@/components/ui/TrustBadge"
import { useSettings } from "@/contexts/SettingsContext"
import {
  authenticateWithBiometrics,
  canUseBiometric,
} from "@/services/biometric"
import type { AppSettings, ReminderMode } from "@/types"
import { theme } from "@/utils/theme"

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const

const REMINDER_MODES: {
  value: ReminderMode
  label: string
  description: string
}[] = [
  {
    value: "daily",
    label: "Daily",
    description: "One reminder every day.",
  },
  {
    value: "everyXHours",
    label: "Every X hours",
    description: "Great for flexible check-ins during the day.",
  },
  {
    value: "weeklyDays",
    label: "Weekly days",
    description: "Pick exactly which days you want reminders.",
  },
  {
    value: "monthlyDate",
    label: "Monthly date",
    description: "Remind me once a month on a chosen date.",
  },
  {
    value: "countPerDay",
    label: "Count per day",
    description: "Spread reminders evenly throughout the day.",
  },
]

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

function pad2(value: number) {
  return String(value).padStart(2, "0")
}

function formatTime(hour: number, minute: number) {
  return `${pad2(hour)}:${pad2(minute)}`
}

function reminderPreview(settings: AppSettings) {
  if (!settings.reminderEnabled) return "Reminders are currently off."
  switch (settings.reminderMode) {
    case "daily":
      return `Every day at ${formatTime(settings.reminderTime.hour, settings.reminderTime.minute)}.`
    case "everyXHours":
      return `Every ${settings.everyXHours} hour${settings.everyXHours === 1 ? "" : "s"}.`
    case "weeklyDays": {
      const selected = WEEKDAY_OPTIONS.filter((day) =>
        settings.weeklyDays.includes(day.value),
      ).map((day) => day.label)
      const dayCopy = selected.length > 0 ? selected.join(", ") : "Mon"
      return `${dayCopy} at ${formatTime(settings.reminderTime.hour, settings.reminderTime.minute)}.`
    }
    case "monthlyDate":
      return `Day ${settings.monthlyDate} of each month at ${formatTime(settings.reminderTime.hour, settings.reminderTime.minute)}.`
    case "countPerDay":
      return `${settings.countPerDay} reminders each day, spaced between 08:00 and 22:00.`
    default:
      return "Custom reminder schedule is active."
  }
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { settings, ready, updateSettings } = useSettings()
  const [busy, setBusy] = useState(false)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"

  const runUpdate = useCallback(
    async (partial: Partial<AppSettings>) => {
      setBusy(true)
      try {
        await updateSettings(partial)
      } finally {
        setBusy(false)
      }
    },
    [updateSettings],
  )

  const onBiometricToggle = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        await runUpdate({ biometricEnabled: false })
        return
      }
      setBusy(true)
      try {
        const supported = await canUseBiometric()
        if (!supported) {
          Alert.alert(
            "Biometrics unavailable",
            "This device has no enrolled Face ID, Touch ID, or fingerprint.",
          )
          return
        }
        const ok = await authenticateWithBiometrics("Turn on app lock")
        if (!ok) return
        await updateSettings({ biometricEnabled: true })
      } finally {
        setBusy(false)
      }
    },
    [runUpdate, updateSettings],
  )

  const onReminderToggle = useCallback(
    async (enabled: boolean) => {
      await runUpdate({ reminderEnabled: enabled })
    },
    [runUpdate],
  )

  const onReminderModeChange = useCallback(
    async (nextMode: ReminderMode) => {
      const next: Partial<AppSettings> = { reminderMode: nextMode }
      if (nextMode === "weeklyDays" && settings.weeklyDays.length === 0) {
        next.weeklyDays = [1]
      }
      await runUpdate(next)
    },
    [runUpdate, settings.weeklyDays.length],
  )

  const adjustReminderTime = useCallback(
    async (part: "hour" | "minute", delta: number) => {
      await runUpdate({
        reminderTime: {
          hour: clamp(
            settings.reminderTime.hour + (part === "hour" ? delta : 0),
            0,
            23,
          ),
          minute: clamp(
            settings.reminderTime.minute + (part === "minute" ? delta : 0),
            0,
            59,
          ),
        },
      })
    },
    [runUpdate, settings.reminderTime.hour, settings.reminderTime.minute],
  )

  const onToggleWeeklyDay = useCallback(
    async (dayValue: number) => {
      const hasDay = settings.weeklyDays.includes(dayValue)
      const nextDays = hasDay
        ? settings.weeklyDays.filter((d) => d !== dayValue)
        : [...settings.weeklyDays, dayValue]
      const normalized = [...new Set(nextDays)].sort((a, b) => a - b)
      await runUpdate({
        weeklyDays: normalized.length > 0 ? normalized : [dayValue],
      })
    },
    [runUpdate, settings.weeklyDays],
  )

  const adjustMonthlyDate = useCallback(
    async (delta: number) => {
      await runUpdate({
        monthlyDate: clamp(settings.monthlyDate + delta, 1, 28),
      })
    },
    [runUpdate, settings.monthlyDate],
  )

  const adjustEveryXHours = useCallback(
    async (delta: number) => {
      await runUpdate({
        everyXHours: clamp(settings.everyXHours + delta, 1, 23),
      })
    },
    [runUpdate, settings.everyXHours],
  )

  const adjustCountPerDay = useCallback(
    async (delta: number) => {
      await runUpdate({
        countPerDay: clamp(settings.countPerDay + delta, 1, 6),
      })
    },
    [runUpdate, settings.countPerDay],
  )

  const renderStepper = (
    label: string,
    value: string | number,
    onMinus: () => Promise<void>,
    onPlus: () => Promise<void>,
  ) => (
    <View className="mt-5 min-h-[52px] flex-row items-center justify-between">
      <Text className="font-inter-medium text-slate-800 dark:text-vault-fg">
        {label}
      </Text>
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            void onMinus()
          }}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 active:opacity-80 dark:border-white/15 dark:bg-elevated"
        >
          <Text className="font-inter-bold text-lg text-slate-900 dark:text-white">
            -
          </Text>
        </Pressable>
        <Text
          className="min-w-[54px] text-center font-inter-bold text-2xl text-slate-900 dark:text-white"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            void onPlus()
          }}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 active:opacity-80 dark:border-white/15 dark:bg-elevated"
        >
          <Text className="font-inter-bold text-lg text-slate-900 dark:text-white">
            +
          </Text>
        </Pressable>
      </View>
    </View>
  )

  const selectedMode =
    REMINDER_MODES.find((mode) => mode.value === settings.reminderMode) ??
    REMINDER_MODES[0]
  const showTimeControls =
    settings.reminderMode === "daily" ||
    settings.reminderMode === "weeklyDays" ||
    settings.reminderMode === "monthlyDate"

  const scrollBottomPad = Math.max(insets.bottom, 16) + 28

  if (!ready) {
    return (
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <FuturisticBackground isDark={isDark} />
          <ActivityIndicator color={theme.accent} />
        </View>
      </SafeAreaView>
    )
  }

  const vaultCopy = {
    title: "Your vault is local",
    body: "Timeline, photos, and measurements stay in a private app folder with a local SQLite database. Nothing is uploaded by BodyTrace.",
  }

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="flex-1">
        <FuturisticBackground isDark={isDark} />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: scrollBottomPad,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            eyebrow="Security"
            title="Privacy"
            subtitle="BodyTrace is built for sensitive progress photos - quiet UI, obvious controls."
            leftAccessory={<Shield size={28} color={theme.accent} />}
          />

          <Card className="mb-5 border-l-4 border-l-accent">
            <View className="flex-row items-start gap-3">
              <Shield size={28} color={theme.accent} strokeWidth={2} />
              <View className="min-w-0 flex-1">
                <Text className="font-inter-bold text-xl text-slate-900 dark:text-vault-fg">
                  {vaultCopy.title}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-vault-muted">
                  {vaultCopy.body}
                </Text>
              </View>
            </View>
            <View className="mt-4">
              <TrustBadge caption="Encrypted at rest where the OS supports it - keys stay on-device." />
            </View>
          </Card>

          <Card className="mb-4">
            <View className="flex-row items-center gap-2">
              <Fingerprint size={22} color={theme.accent} />
              <Text className="font-inter-bold text-lg text-slate-900 dark:text-vault-fg">
                Biometric app lock
              </Text>
            </View>
            <Text className="mt-3 text-sm leading-6 text-slate-600 dark:text-vault-muted">
              When enabled, BodyTrace asks for Face ID, Touch ID, or fingerprint
              after you leave the app and when you open it again.
            </Text>
            <View className="mt-5 min-h-[48px] flex-row items-center justify-between border-t border-slate-100 pt-4 dark:border-white/10">
              <Text className="flex-1 pr-3 font-inter-medium text-slate-800 dark:text-vault-fg">
                Require biometrics
              </Text>
              {busy ? (
                <ActivityIndicator color={theme.accent} />
              ) : (
                <Switch
                  value={settings.biometricEnabled}
                  onValueChange={onBiometricToggle}
                  trackColor={{
                    false: isDark ? "#3f3f46" : "#e2e8f0",
                    true: theme.accentDim,
                  }}
                  thumbColor={
                    settings.biometricEnabled
                      ? "#f8fafc"
                      : isDark
                        ? "#a1a1aa"
                        : "#fff"
                  }
                  ios_backgroundColor={isDark ? "#3f3f46" : "#e2e8f0"}
                />
              )}
            </View>
          </Card>

          <Card className="mb-2">
            <View className="flex-row items-center gap-2">
              <Database size={20} color={theme.accent} />
              <Text className="font-inter-bold text-lg text-slate-900 dark:text-vault-fg">
                Friendly reminders
              </Text>
            </View>
            <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-vault-muted">
              Pick the reminder style that feels best for your routine.
            </Text>
            <View className="mt-5 min-h-[48px] flex-row items-center justify-between border-b border-slate-100 pb-5 dark:border-white/10">
              <Text className="flex-1 pr-3 font-inter-medium text-slate-800 dark:text-vault-fg">
                Enabled
              </Text>
              <Switch
                value={settings.reminderEnabled}
                onValueChange={onReminderToggle}
                disabled={busy}
                trackColor={{
                  false: isDark ? "#3f3f46" : "#e2e8f0",
                  true: theme.accentDim,
                }}
                thumbColor={
                  settings.reminderEnabled
                    ? "#f8fafc"
                    : isDark
                      ? "#a1a1aa"
                      : "#fff"
                }
                ios_backgroundColor={isDark ? "#3f3f46" : "#e2e8f0"}
              />
            </View>

            <View className="mt-5">
              <Text className="font-inter-medium text-slate-800 dark:text-vault-fg">
                Reminder style
              </Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {REMINDER_MODES.map((mode) => {
                  const selected = settings.reminderMode === mode.value
                  return (
                    <Pressable
                      key={mode.value}
                      accessibilityRole="button"
                      disabled={busy}
                      onPress={() => {
                        void onReminderModeChange(mode.value)
                      }}
                      className={`rounded-2xl border px-3 py-2 ${
                        selected
                          ? "border-accent bg-accent/10"
                          : "border-slate-200 bg-slate-100 dark:border-white/15 dark:bg-elevated"
                      }`}
                    >
                      <Text
                        className={`font-inter-semibold ${
                          selected
                            ? "text-accent"
                            : "text-slate-800 dark:text-vault-fg"
                        }`}
                      >
                        {mode.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              <Text className="mt-3 text-sm leading-6 text-slate-600 dark:text-vault-muted">
                {selectedMode.description}
              </Text>
            </View>

            {showTimeControls ? (
              <View>
                {renderStepper(
                  "Hour",
                  pad2(settings.reminderTime.hour),
                  async () => adjustReminderTime("hour", -1),
                  async () => adjustReminderTime("hour", 1),
                )}
                {renderStepper(
                  "Minute",
                  pad2(settings.reminderTime.minute),
                  async () => adjustReminderTime("minute", -5),
                  async () => adjustReminderTime("minute", 5),
                )}
              </View>
            ) : null}

            {settings.reminderMode === "weeklyDays" ? (
              <View className="mt-5">
                <Text className="font-inter-medium text-slate-800 dark:text-vault-fg">
                  Days
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {WEEKDAY_OPTIONS.map((day) => {
                    const selected = settings.weeklyDays.includes(day.value)
                    return (
                      <Pressable
                        key={day.value}
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={() => {
                          void onToggleWeeklyDay(day.value)
                        }}
                        className={`rounded-2xl border px-3 py-2 ${
                          selected
                            ? "border-accent bg-accent/10"
                            : "border-slate-200 bg-slate-100 dark:border-white/15 dark:bg-elevated"
                        }`}
                      >
                        <Text
                          className={`font-inter-semibold ${
                            selected
                              ? "text-accent"
                              : "text-slate-800 dark:text-vault-fg"
                          }`}
                        >
                          {day.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            ) : null}

            {settings.reminderMode === "monthlyDate"
              ? renderStepper(
                  "Day of month",
                  settings.monthlyDate,
                  async () => adjustMonthlyDate(-1),
                  async () => adjustMonthlyDate(1),
                )
              : null}
            {settings.reminderMode === "everyXHours"
              ? renderStepper(
                  "Every X hours",
                  settings.everyXHours,
                  async () => adjustEveryXHours(-1),
                  async () => adjustEveryXHours(1),
                )
              : null}
            {settings.reminderMode === "countPerDay"
              ? renderStepper(
                  "Reminders per day",
                  settings.countPerDay,
                  async () => adjustCountPerDay(-1),
                  async () => adjustCountPerDay(1),
                )
              : null}

            <View className="mt-5 rounded-2xl border border-slate-200 bg-slate-100 px-3 py-3 dark:border-white/10 dark:bg-elevated">
              <Text className="font-inter-semibold text-slate-800 dark:text-vault-fg">
                Reminder preview
              </Text>
              <Text className="mt-1 text-sm leading-6 text-slate-600 dark:text-vault-muted">
                {reminderPreview(settings)}
              </Text>
            </View>
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
