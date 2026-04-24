import { Link } from "expo-router"
import { UserPlus } from "lucide-react-native"
import React, { useCallback, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { FuturisticBackground } from "@/components/ui/FuturisticBackground"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { useAuth } from "@/contexts/AuthContext"
import { theme } from "@/utils/theme"

export default function SignupScreen() {
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { signUp, supabaseConfigured } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = useCallback(async () => {
    setError(null)
    if (!email.trim()) {
      setError("Enter your email.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    setBusy(true)
    try {
      const { error: err, needsEmailConfirmation } = await signUp(
        email,
        password,
      )
      if (err) {
        setError(err.message)
        return
      }
      if (needsEmailConfirmation) {
        Alert.alert(
          "Confirm your email",
          "We sent you a confirmation link. After confirming, return here and sign in.",
        )
      }
    } finally {
      setBusy(false)
    }
  }, [confirm, email, password, signUp])

  const bottomPad = Math.max(insets.bottom, 16) + 24
  const outline = isDark ? "rgba(148,163,184,0.35)" : "rgba(15,23,42,0.18)"

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
              eyebrow="Account"
              title="Create your account"
              subtitle="You will complete your body profile next (required)."
              leftAccessory={<UserPlus size={28} color={theme.accent} />}
            />

            {!supabaseConfigured ? (
              <Card className="mb-4 border-l-4 border-l-danger">
                <Text className="font-inter-bold text-lg text-slate-900 dark:text-vault-fg">
                  Supabase is not configured
                </Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-vault-muted">
                  Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
                  (see .env.example), then restart Expo.
                </Text>
              </Card>
            ) : null}

            <Card>
              <Text className="font-inter-semibold text-slate-800 dark:text-vault-fg">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="username"
                placeholder="you@example.com"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                style={{ borderColor: outline }}
              />

              <Text className="mt-4 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="newPassword"
                placeholder="At least 8 characters"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                style={{ borderColor: outline }}
              />

              <Text className="mt-4 font-inter-semibold text-slate-800 dark:text-vault-fg">
                Confirm password
              </Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                textContentType="newPassword"
                placeholder="Repeat password"
                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-inter-medium text-slate-900 dark:border-white/15 dark:bg-elevated dark:text-vault-fg"
                style={{ borderColor: outline }}
              />

              {error ? (
                <Text className="mt-3 text-sm text-danger">{error}</Text>
              ) : null}

              <View className="mt-6">
                <Button
                  title="Sign up"
                  onPress={() => {
                    void onSubmit()
                  }}
                  loading={busy}
                  disabled={!supabaseConfigured}
                />
              </View>

              <View className="mt-5 flex-row flex-wrap items-center gap-1">
                <Text className="text-sm text-slate-600 dark:text-vault-muted">
                  Already have an account?
                </Text>
                <Link href="/(auth)/login" asChild>
                  <Pressable accessibilityRole="button">
                    <Text className="font-inter-semibold text-sm text-accent">
                      Sign in
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}
