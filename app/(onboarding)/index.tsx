import { type Href, router } from "expo-router"
import { ClipboardList } from "lucide-react-native"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { BmiGauge } from "@/components/profile/BmiGauge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FuturisticBackground } from "@/components/ui/FuturisticBackground"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { SegmentedControl } from "@/components/ui/SegmentedControl"
import { useAuth } from "@/contexts/AuthContext"
import { upsertProfile } from "@/services/profileRepository"
import type {
  CircumferenceMeasure,
  CircumferenceUnit,
  WeightUnit,
} from "@/types"
import { MEASUREMENT_LABELS } from "@/utils/constants"
import { feetInchesFromCm, cmFromFeetInches } from "@/utils/height"
import { computeBmi } from "@/utils/bmi"
import { toKilograms } from "@/utils/measurements"
import { theme } from "@/utils/theme"

const CIRC_KEYS = MEASUREMENT_LABELS.filter((m) => m.key !== "weight")

function parseOptionalPositiveInt(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t)
  if (!Number.isFinite(n)) return null
  const rounded = Math.round(n)
  if (rounded < 0 || rounded > 7) return null
  return rounded
}

function parseOptionalPercent(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t)
  if (!Number.isFinite(n)) return null
  if (n < 0 || n > 100) return null
  return n
}

function parseRequiredPositive(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { user, profile, refreshProfile, supabaseConfigured } = useAuth()

  const lastUserId = useRef<string | null>(null)
  const didPrefill = useRef(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("lb")
  const [weightText, setWeightText] = useState("")
  const [targetWeightText, setTargetWeightText] = useState("")
  const [heightMode, setHeightMode] = useState<"cm" | "ft">("cm")
  const [heightCmText, setHeightCmText] = useState("")
  const [heightFeetText, setHeightFeetText] = useState("")
  const [heightInchesText, setHeightInchesText] = useState("")
  const [circUnit, setCircUnit] = useState<CircumferenceUnit>("inch")
  const [circInputs, setCircInputs] = useState<Record<string, string>>({})
  const [cardioText, setCardioText] = useState("")
  const [strengthText, setStrengthText] = useState("")
  const [bodyFatText, setBodyFatText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id !== lastUserId.current) {
      lastUserId.current = user?.id ?? null
      didPrefill.current = false
    }
  }, [user?.id])

  useEffect(() => {
    if (!profile || didPrefill.current) return
    didPrefill.current = true
    setFirstName(profile.firstName ?? "")
    setLastName(profile.lastName ?? "")
    const wKg = profile.weightKg
    setWeightUnit("lb")
    setWeightText(String(Math.round((wKg / 0.45359237) * 10) / 10))
    const tKg = profile.targetWeightKg
    setTargetWeightText(String(Math.round((tKg / 0.45359237) * 10) / 10))
    const hCm = profile.heightCm
    setHeightCmText(String(Math.round(hCm * 10) / 10))
    const fi = feetInchesFromCm(hCm)
    setHeightFeetText(String(fi.feet))
    setHeightInchesText(String(fi.inches))
    if (profile.cardioSessionsPerWeek != null) {
      setCardioText(String(profile.cardioSessionsPerWeek))
    }
    if (profile.strengthSessionsPerWeek != null) {
      setStrengthText(String(profile.strengthSessionsPerWeek))
    }
    if (profile.bodyFatPercent != null) {
      setBodyFatText(String(profile.bodyFatPercent))
    }
    const nextCirc: Record<string, string> = {}
    const circ = profile.circumferences
    if (circ) {
      for (const { key } of CIRC_KEYS) {
        const m = circ[key]
        if (m) {
          nextCirc[key] = String(m.value)
          setCircUnit(m.unit)
        }
      }
    }
    setCircInputs(nextCirc)
  }, [profile])

  const weightKg = useMemo(() => {
    const v = parseRequiredPositive(weightText)
    if (v == null) return null
    return toKilograms({ value: v, unit: weightUnit })
  }, [weightText, weightUnit])

  const heightCm = useMemo(() => {
    if (heightMode === "cm") {
      const v = parseRequiredPositive(heightCmText)
      return v
    }
    const feet = Number(heightFeetText.trim())
    const inches = Number(heightInchesText.trim())
    if (!Number.isFinite(feet) || !Number.isFinite(inches)) return null
    if (feet < 0 || inches < 0 || inches >= 12) return null
    if (feet === 0 && inches === 0) return null
    return cmFromFeetInches(feet, inches)
  }, [heightCmText, heightFeetText, heightInchesText, heightMode])

  const onSave = useCallback(async () => {
    setError(null)
    if (!user?.id) {
      setError("You are not signed in.")
      return
    }
    if (!supabaseConfigured) {
      setError("Supabase is not configured.")
      return
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.")
      return
    }
    const wKg = weightKg
    const hCm = heightCm
    if (wKg == null) {
      setError("Enter a valid current weight.")
      return
    }
    if (hCm == null) {
      setError("Enter a valid height.")
      return
    }
    const targetVal = parseRequiredPositive(targetWeightText)
    if (targetVal == null) {
      setError("Enter a valid target weight.")
      return
    }
    const targetKg = toKilograms({ value: targetVal, unit: weightUnit })

    const cardio = parseOptionalPositiveInt(cardioText)
    const strength = parseOptionalPositiveInt(strengthText)
    const bodyFat = parseOptionalPercent(bodyFatText)

    if (cardioText.trim() && cardio == null) {
      setError("Cardio sessions / week must be between 0 and 7.")
      return
    }
    if (strengthText.trim() && strength == null) {
      setError("Strength sessions / week must be between 0 and 7.")
      return
    }
    if (bodyFatText.trim() && bodyFat == null) {
      setError("Body fat % must be between 0 and 100.")
      return
    }

    const circumferences: Partial<
      Record<(typeof CIRC_KEYS)[number]["key"], CircumferenceMeasure>
    > = {}
    for (const { key } of CIRC_KEYS) {
      const raw = circInputs[key]?.trim() ?? ""
      if (!raw) continue
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) {
        setError(`Enter a valid ${key} circumference or leave it blank.`)
        return
      }
      circumferences[key] = { value: n, unit: circUnit }
    }

    setBusy(true)
    try {
      await upsertProfile(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        weightKg: wKg,
        heightCm: hCm,
        targetWeightKg: targetKg,
        cardioSessionsPerWeek: cardio,
        strengthSessionsPerWeek: strength,
        circumferences:
          Object.keys(circumferences).length > 0 ? circumferences : null,
        bodyFatPercent: bodyFat,
        onboardingCompleted: true,
      })
      await refreshProfile()
      router.replace("/(tabs)" as Href)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save profile."
      setError(msg)
      Alert.alert("Save failed", msg)
    } finally {
      setBusy(false)
    }
  }, [
    bodyFatText,
    cardioText,
    circInputs,
    circUnit,
    firstName,
    heightCm,
    lastName,
    refreshProfile,
    strengthText,
    supabaseConfigured,
    targetWeightText,
    user?.id,
    weightKg,
    weightUnit,
  ])

  const bottomPad = Math.max(insets.bottom, 16) + 28
  const outline = isDark ? "rgba(148,163,184,0.35)" : "rgba(15,23,42,0.18)"

  const bmiPreview = useMemo(() => {
    if (weightKg == null || heightCm == null) return null
    return computeBmi(weightKg, heightCm)
  }, [heightCm, weightKg])

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="flex-1">
        <FuturisticBackground isDark={isDark} />
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: bottomPad,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ScreenHeader
              eyebrow="Profile"
              title="Tell us about you"
              subtitle="Required fields unlock your timeline. Optional fields help you track habits and shape."
              leftAccessory={<ClipboardList size={28} color={theme.accent} />}
            />

            <Card className="mb-4">
              <Text className="font-inter-bold text-lg text-slate-900 dark:text-vault-fg">
                Required
              </Text>

              <Text className="mt-4 font-inter-semibold text-slate-800 dark:text-vault-fg">
                First name
              </Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                autoCorrect
                textContentType="givenName"
                placeholder="Ada"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                style={{ borderColor: outline }}
              />

              <Text className="mt-4 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Last name
              </Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                autoCorrect
                textContentType="familyName"
                placeholder="Lovelace"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                style={{ borderColor: outline }}
              />

              <Text className="mt-5 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Weight unit
              </Text>
              <View className="mt-2">
                <SegmentedControl
                  options={[
                    { id: "lb", label: "lb" },
                    { id: "kg", label: "kg" },
                  ]}
                  value={weightUnit}
                  onChange={setWeightUnit}
                />
              </View>

              <Text className="mt-4 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Current weight
              </Text>
              <TextInput
                value={weightText}
                onChangeText={setWeightText}
                keyboardType="decimal-pad"
                placeholder={weightUnit === "kg" ? "72.5" : "160"}
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                style={{ borderColor: outline }}
              />

              <Text className="mt-4 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Target weight
              </Text>
              <TextInput
                value={targetWeightText}
                onChangeText={setTargetWeightText}
                keyboardType="decimal-pad"
                placeholder={weightUnit === "kg" ? "68" : "150"}
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                style={{ borderColor: outline }}
              />

              <Text className="mt-5 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Height
              </Text>
              <View className="mt-2">
                <SegmentedControl
                  options={[
                    { id: "cm", label: "cm" },
                    { id: "ft", label: "ft / in" },
                  ]}
                  value={heightMode}
                  onChange={setHeightMode}
                />
              </View>

              {heightMode === "cm" ? (
                <TextInput
                  value={heightCmText}
                  onChangeText={setHeightCmText}
                  keyboardType="decimal-pad"
                  placeholder="175"
                  placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                  className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                  style={{ borderColor: outline }}
                />
              ) : (
                <View className="mt-3 flex-row gap-3">
                  <View className="min-w-0 flex-1">
                    <Text className="mb-2 font-inter-semibold text-xs text-slate-600 dark:text-vault-muted">
                      Feet
                    </Text>
                    <TextInput
                      value={heightFeetText}
                      onChangeText={setHeightFeetText}
                      keyboardType="number-pad"
                      placeholder="5"
                      placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                      style={{ borderColor: outline }}
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="mb-2 font-inter-semibold text-xs text-slate-600 dark:text-vault-muted">
                      Inches
                    </Text>
                    <TextInput
                      value={heightInchesText}
                      onChangeText={setHeightInchesText}
                      keyboardType="decimal-pad"
                      placeholder="10"
                      placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                      style={{ borderColor: outline }}
                    />
                  </View>
                </View>
              )}

              <BmiGauge weightKg={weightKg} heightCm={heightCm} />

              {bmiPreview != null ? (
                <Text className="mt-2 text-xs text-slate-500 dark:text-vault-muted">
                  Preview updates as you edit weight and height.
                </Text>
              ) : null}
            </Card>

            <Card className="mb-4">
              <Text className="font-inter-bold text-lg text-slate-900 dark:text-vault-fg">
                Optional
              </Text>
              <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-vault-muted">
                Training frequency is per week (0-7). Leave blank if you prefer
                not to say.
              </Text>

              <Text className="mt-4 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Cardio sessions / week
              </Text>
              <TextInput
                value={cardioText}
                onChangeText={setCardioText}
                keyboardType="number-pad"
                placeholder="e.g. 3"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                style={{ borderColor: outline }}
              />

              <Text className="mt-4 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Strength sessions / week
              </Text>
              <TextInput
                value={strengthText}
                onChangeText={setStrengthText}
                keyboardType="number-pad"
                placeholder="e.g. 2"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                style={{ borderColor: outline }}
              />

              <Text className="mt-5 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Circumference unit
              </Text>
              <View className="mt-2">
                <SegmentedControl
                  options={[
                    { id: "inch", label: "in" },
                    { id: "cm", label: "cm" },
                  ]}
                  value={circUnit}
                  onChange={setCircUnit}
                />
              </View>

              {CIRC_KEYS.map(({ key, label }) => (
                <View key={key} className="mt-4">
                  <Text className="font-inter-semibold text-slate-800 dark:text-vault-fg">
                    {label} ({circUnit})
                  </Text>
                  <TextInput
                    value={circInputs[key] ?? ""}
                    onChangeText={(t) =>
                      setCircInputs((prev) => ({ ...prev, [key]: t }))
                    }
                    keyboardType="decimal-pad"
                    placeholder="Optional"
                    placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                    className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                    style={{ borderColor: outline }}
                  />
                </View>
              ))}

              <Text className="mt-4 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Body fat %
              </Text>
              <TextInput
                value={bodyFatText}
                onChangeText={setBodyFatText}
                keyboardType="decimal-pad"
                placeholder="Optional"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                style={{ borderColor: outline }}
              />
            </Card>

            {error ? (
              <Text className="mb-3 text-sm text-danger">{error}</Text>
            ) : null}

            <Button
              title="Save and continue"
              onPress={() => {
                void onSave()
              }}
              loading={busy}
              disabled={!supabaseConfigured}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}
