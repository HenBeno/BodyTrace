import { Link } from "expo-router"
import { CircleUserRound, PencilLine, Save, Target } from "lucide-react-native"
import React, { useMemo, useState } from "react"
import { Pressable, ScrollView, Text, TextInput, useColorScheme, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Card } from "@/components/ui/Card"
import { FuturisticBackground } from "@/components/ui/FuturisticBackground"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { useEntries } from "@/contexts/EntriesContext"
import { useSettings } from "@/contexts/SettingsContext"
import type { UserGoals, UserProfile } from "@/types"
import { toKilograms, toPounds } from "@/utils/measurements"
import { computeMedalsProgress } from "@/utils/medals"
import { theme } from "@/utils/theme"

const CIRC_KEYS = [
  { key: "neck", label: "Neck target (cm)" },
  { key: "chest", label: "Chest target (cm)" },
  { key: "waist", label: "Waist target (cm)" },
  { key: "hips", label: "Hips target (cm)" },
] as const

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

function parseOptionalNumber(raw: string): number | undefined {
  const normalized = raw.trim().replace(",", ".")
  if (!normalized) return undefined
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export default function ProfileScreen() {
  const isDark = useColorScheme() === "dark"
  const { entries } = useEntries()
  const { settings, updateSettings, ready } = useSettings()
  const [isEditing, setIsEditing] = useState(false)
  const [draftProfile, setDraftProfile] = useState<UserProfile>(settings.profile)
  const [draftGoals, setDraftGoals] = useState<UserGoals>(settings.goals)

  React.useEffect(() => {
    if (isEditing) return
    setDraftProfile(settings.profile)
    setDraftGoals(settings.goals)
  }, [isEditing, settings.goals, settings.profile])

  const activeProfile = isEditing ? draftProfile : settings.profile
  const activeGoals = isEditing ? draftGoals : settings.goals

  const weightsAsc = useMemo(
    () =>
      [...entries]
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((entry) => entry.measurements.weight)
        .filter(
          (weight): weight is NonNullable<(typeof entries)[number]["measurements"]["weight"]> =>
            Boolean(weight),
        )
        .map((weight) => toKilograms(weight)),
    [entries],
  )
  const baselineWeightKg = weightsAsc[0]
  const currentWeightKg = weightsAsc[weightsAsc.length - 1]
  const currentWeightLb =
    currentWeightKg !== undefined ? toPounds({ value: currentWeightKg, unit: "kg" }) : undefined
  const goalWeightKg = activeGoals.targetWeightKg
  const goalProgress = useMemo(() => {
    if (
      baselineWeightKg === undefined ||
      currentWeightKg === undefined ||
      goalWeightKg === undefined ||
      baselineWeightKg <= goalWeightKg
    ) {
      return undefined
    }
    const total = baselineWeightKg - goalWeightKg
    const done = baselineWeightKg - currentWeightKg
    return Math.max(0, Math.min(1, done / total))
  }, [baselineWeightKg, currentWeightKg, goalWeightKg])

  const bmi = useMemo(() => {
    if (!currentWeightKg || !activeProfile.heightCm) return undefined
    const meters = activeProfile.heightCm / 100
    if (!Number.isFinite(meters) || meters <= 0) return undefined
    return currentWeightKg / (meters * meters)
  }, [activeProfile.heightCm, currentWeightKg])
  const medals = useMemo(() => computeMedalsProgress(entries), [entries])

  const onSave = async () => {
    const nextProfile: UserProfile = {
      fullName: draftProfile.fullName.trim(),
      age:
        typeof draftProfile.age === "number"
          ? clamp(draftProfile.age, 13, 120)
          : undefined,
      sex: draftProfile.sex,
      heightCm:
        typeof draftProfile.heightCm === "number"
          ? clamp(draftProfile.heightCm, 90, 260)
          : undefined,
      bodyFatPercent:
        typeof draftProfile.bodyFatPercent === "number"
          ? clamp(draftProfile.bodyFatPercent, 2, 80)
          : undefined,
    }
    const nextGoals: UserGoals = {
      ...draftGoals,
      targetWeightKg:
        typeof draftGoals.targetWeightKg === "number"
          ? clamp(draftGoals.targetWeightKg, 25, 350)
          : undefined,
      targetBodyFatPercent:
        typeof draftGoals.targetBodyFatPercent === "number"
          ? clamp(draftGoals.targetBodyFatPercent, 2, 80)
          : undefined,
      habitCheckinsPerWeek: clamp(draftGoals.habitCheckinsPerWeek, 1, 21),
      habitStreakDays: clamp(draftGoals.habitStreakDays, 1, 60),
      milestones: draftGoals.milestones
        .map((milestone) => ({
          ...milestone,
          title: milestone.title.trim(),
          targetDate: milestone.targetDate?.trim() || undefined,
        }))
        .filter((milestone) => milestone.title.length > 0),
    }
    await updateSettings({
      profile: nextProfile,
      goals: nextGoals,
    })
    setIsEditing(false)
  }

  const profileName = activeProfile.fullName || "Your profile"

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="flex-1">
        <FuturisticBackground isDark={isDark} />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            eyebrow="Identity & Goals"
            title="Profile"
            subtitle="Personal baseline, body metrics, habit targets, and milestone progress."
            leftAccessory={<CircleUserRound size={26} color={theme.accent} />}
            right={
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (!isEditing) {
                    setIsEditing(true)
                    return
                  }
                  void onSave()
                }}
                className="flex-row items-center gap-1 rounded-2xl border border-cyan-300/40 bg-accent/15 px-3 py-2"
              >
                {isEditing ? (
                  <Save size={16} color={theme.accent} />
                ) : (
                  <PencilLine size={16} color={theme.accent} />
                )}
                <Text className="font-inter-semibold text-xs text-accent">
                  {isEditing ? "Save" : "Edit"}
                </Text>
              </Pressable>
            }
          />

          <Card className="mb-4">
            <Text className="font-inter-semibold text-xs uppercase tracking-[0.14em] text-accent">
              Personal info
            </Text>
            <Text className="mt-1 font-inter-bold text-2xl text-slate-900 dark:text-vault-fg">
              {profileName}
            </Text>
            {isEditing ? (
              <View className="mt-4 gap-2">
                <TextInput
                  value={draftProfile.fullName}
                  onChangeText={(value) =>
                    setDraftProfile((prev) => ({ ...prev, fullName: value }))
                  }
                  placeholder="Full name"
                  placeholderTextColor={theme.mutedText}
                  className="rounded-2xl border border-slate-300/60 bg-white/80 px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                />
                <TextInput
                  value={draftProfile.age?.toString() ?? ""}
                  onChangeText={(value) =>
                    setDraftProfile((prev) => ({
                      ...prev,
                      age: parseOptionalNumber(value),
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="Age"
                  placeholderTextColor={theme.mutedText}
                  className="rounded-2xl border border-slate-300/60 bg-white/80 px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                />
                <TextInput
                  value={draftProfile.heightCm?.toString() ?? ""}
                  onChangeText={(value) =>
                    setDraftProfile((prev) => ({
                      ...prev,
                      heightCm: parseOptionalNumber(value),
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="Height (cm)"
                  placeholderTextColor={theme.mutedText}
                  className="rounded-2xl border border-slate-300/60 bg-white/80 px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                />
              </View>
            ) : (
              <View className="mt-3">
                <Text className="text-sm text-slate-600 dark:text-vault-muted">
                  Age: {activeProfile.age ?? "-"} | Height: {activeProfile.heightCm ?? "-"} cm
                </Text>
              </View>
            )}
          </Card>

          <Card className="mb-4">
            <View className="flex-row items-center justify-between">
              <Text className="font-inter-semibold text-xs uppercase tracking-[0.14em] text-accent">
                Main goal
              </Text>
              <Target size={16} color={theme.accent} />
            </View>
            <Text className="mt-2 text-sm text-slate-600 dark:text-vault-muted">
              Current: {currentWeightKg ? `${currentWeightKg.toFixed(1)} kg` : "-"}{" "}
              {currentWeightLb ? `(${currentWeightLb.toFixed(1)} lb)` : ""}
            </Text>
            <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
              Target: {activeGoals.targetWeightKg ? `${activeGoals.targetWeightKg} kg` : "-"}
            </Text>
            <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
              Progress: {goalProgress !== undefined ? `${Math.round(goalProgress * 100)}%` : "-"}
            </Text>
            {isEditing ? (
              <TextInput
                value={draftGoals.targetWeightKg?.toString() ?? ""}
                onChangeText={(value) =>
                  setDraftGoals((prev) => ({
                    ...prev,
                    targetWeightKg: parseOptionalNumber(value),
                  }))
                }
                keyboardType="numeric"
                placeholder="Target weight (kg)"
                placeholderTextColor={theme.mutedText}
                className="mt-3 rounded-2xl border border-slate-300/60 bg-white/80 px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
              />
            ) : null}
          </Card>

          <Card className="mb-4">
            <Text className="font-inter-semibold text-xs uppercase tracking-[0.14em] text-accent">
              Body metrics
            </Text>
            <Text className="mt-2 text-sm text-slate-600 dark:text-vault-muted">
              BMI: {bmi ? bmi.toFixed(1) : "-"}
            </Text>
            <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
              Body fat target:{" "}
              {activeGoals.targetBodyFatPercent
                ? `${activeGoals.targetBodyFatPercent}%`
                : "-"}
            </Text>
            {isEditing ? (
              <View className="mt-3 gap-2">
                <TextInput
                  value={draftGoals.targetBodyFatPercent?.toString() ?? ""}
                  onChangeText={(value) =>
                    setDraftGoals((prev) => ({
                      ...prev,
                      targetBodyFatPercent: parseOptionalNumber(value),
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="Target body fat (%)"
                  placeholderTextColor={theme.mutedText}
                  className="rounded-2xl border border-slate-300/60 bg-white/80 px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                />
                {CIRC_KEYS.map((item) => (
                  <TextInput
                    key={item.key}
                    value={draftGoals.circumferenceTargetsCm[item.key]?.toString() ?? ""}
                    onChangeText={(value) =>
                      setDraftGoals((prev) => ({
                        ...prev,
                        circumferenceTargetsCm: {
                          ...prev.circumferenceTargetsCm,
                          [item.key]: parseOptionalNumber(value),
                        },
                      }))
                    }
                    keyboardType="numeric"
                    placeholder={item.label}
                    placeholderTextColor={theme.mutedText}
                    className="rounded-2xl border border-slate-300/60 bg-white/80 px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                  />
                ))}
              </View>
            ) : null}
          </Card>

          <Card className="mb-4">
            <Text className="font-inter-semibold text-xs uppercase tracking-[0.14em] text-accent">
              Habits & consistency
            </Text>
            <Text className="mt-2 text-sm text-slate-600 dark:text-vault-muted">
              Current streak: {medals.metrics.currentStreakDays} days
            </Text>
            <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
              Total check-ins: {medals.metrics.totalCheckins}
            </Text>
            <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
              Habit targets: {activeGoals.habitCheckinsPerWeek} check-ins/week,{" "}
              {activeGoals.habitStreakDays} streak days
            </Text>
            <Text className="mt-1 text-sm text-slate-600 dark:text-vault-muted">
              Reminder mode: {settings.reminderEnabled ? settings.reminderMode : "off"}
            </Text>
            {isEditing ? (
              <View className="mt-3 gap-2">
                <TextInput
                  value={draftGoals.habitCheckinsPerWeek.toString()}
                  onChangeText={(value) =>
                    setDraftGoals((prev) => ({
                      ...prev,
                      habitCheckinsPerWeek: parseOptionalNumber(value) ?? prev.habitCheckinsPerWeek,
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="Check-ins per week target"
                  placeholderTextColor={theme.mutedText}
                  className="rounded-2xl border border-slate-300/60 bg-white/80 px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                />
                <TextInput
                  value={draftGoals.habitStreakDays.toString()}
                  onChangeText={(value) =>
                    setDraftGoals((prev) => ({
                      ...prev,
                      habitStreakDays: parseOptionalNumber(value) ?? prev.habitStreakDays,
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="Streak days target"
                  placeholderTextColor={theme.mutedText}
                  className="rounded-2xl border border-slate-300/60 bg-white/80 px-3 py-2 text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                />
              </View>
            ) : null}
          </Card>

          <Card className="mb-4">
            <Text className="font-inter-semibold text-xs uppercase tracking-[0.14em] text-accent">
              Milestones
            </Text>
            {activeGoals.milestones.length === 0 ? (
              <Text className="mt-2 text-sm text-slate-600 dark:text-vault-muted">
                No milestones yet. Add one in edit mode.
              </Text>
            ) : (
              activeGoals.milestones.map((milestone) => (
                <View key={milestone.id} className="mt-2 rounded-2xl border border-slate-200/70 px-3 py-2 dark:border-white/10">
                  <Text className="font-inter-semibold text-sm text-slate-900 dark:text-vault-fg">
                    {milestone.title}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-600 dark:text-vault-muted">
                    {milestone.targetDate ? `Target: ${milestone.targetDate}` : "No date"} |{" "}
                    {milestone.completed ? "Completed" : "In progress"}
                  </Text>
                </View>
              ))
            )}
            {isEditing ? (
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  setDraftGoals((prev) => ({
                    ...prev,
                    milestones: [
                      ...prev.milestones,
                      {
                        id: `m-${Date.now()}`,
                        title: "New milestone",
                        completed: false,
                      },
                    ],
                  }))
                }
                className="mt-3 rounded-2xl border border-cyan-300/40 bg-accent/10 px-3 py-2"
              >
                <Text className="font-inter-semibold text-sm text-accent">Add milestone</Text>
              </Pressable>
            ) : null}
          </Card>

          <Link href="/(tabs)/settings" asChild>
            <Pressable className="mb-2 rounded-2xl border border-cyan-300/30 bg-white/75 px-4 py-3 dark:bg-surface/70">
              <Text className="text-center font-inter-semibold text-accent">
                Manage reminders & privacy settings
              </Text>
            </Pressable>
          </Link>
          {!ready ? (
            <Text className="text-center text-xs text-slate-500 dark:text-vault-muted">
              Loading settings...
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
