import { Database, Fingerprint, Shield } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TrustBadge } from '@/components/ui/TrustBadge';
import { Card } from '@/components/ui/Card';
import { useSettings } from '@/contexts/SettingsContext';
import { authenticateWithBiometrics, canUseBiometric } from '@/services/biometric';
import { theme } from '@/utils/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, ready, updateSettings } = useSettings();
  const [busy, setBusy] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const onBiometricToggle = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        setBusy(true);
        try {
          await updateSettings({ biometricEnabled: false });
        } finally {
          setBusy(false);
        }
        return;
      }
      setBusy(true);
      try {
        const supported = await canUseBiometric();
        if (!supported) {
          Alert.alert(
            'Biometrics unavailable',
            'This device has no enrolled Face ID, Touch ID, or fingerprint.',
          );
          return;
        }
        const ok = await authenticateWithBiometrics('Turn on app lock');
        if (!ok) return;
        await updateSettings({ biometricEnabled: true });
      } finally {
        setBusy(false);
      }
    },
    [updateSettings],
  );

  const onReminderToggle = useCallback(
    async (enabled: boolean) => {
      setBusy(true);
      try {
        await updateSettings({ reminderEnabled: enabled });
      } finally {
        setBusy(false);
      }
    },
    [updateSettings],
  );

  const onFrequencyPress = useCallback(async () => {
    const nextFreq = settings.frequency === 'weekly' ? 'monthly' : 'weekly';
    let nextDay = settings.reminderDay;
    if (nextFreq === 'weekly') {
      nextDay = Math.min(6, Math.max(0, nextDay));
    } else {
      nextDay = Math.min(28, Math.max(1, nextDay >= 1 ? nextDay : 1));
    }
    setBusy(true);
    try {
      await updateSettings({ frequency: nextFreq, reminderDay: nextDay });
    } finally {
      setBusy(false);
    }
  }, [settings.frequency, settings.reminderDay, updateSettings]);

  const scrollBottomPad = Math.max(insets.bottom, 16) + 28;

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 dark:bg-canvas" edges={['top']}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  const vaultCopy = {
    title: 'Your vault is local',
    body:
      'Timeline, photos, and measurements stay in a private app folder with a local SQLite database. Nothing is uploaded by BodyTrace.',
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-canvas" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: scrollBottomPad,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Security"
          title="Privacy"
          subtitle="BodyTrace is built for sensitive progress photos — quiet UI, obvious controls."
          leftAccessory={<Shield size={28} color={theme.accent} />}
        />

        <Card className="mb-5 border-l-4 border-l-accent">
          <View className="flex-row items-start gap-3">
            <Shield size={28} color={theme.accent} strokeWidth={2} />
            <View className="min-w-0 flex-1">
              <Text className="font-inter-bold text-xl text-slate-900 dark:text-vault-fg">{vaultCopy.title}</Text>
              <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-vault-muted">{vaultCopy.body}</Text>
            </View>
          </View>
          <View className="mt-4">
            <TrustBadge caption="Encrypted at rest where the OS supports it — keys stay on-device." />
          </View>
        </Card>

        <Card className="mb-4">
          <View className="flex-row items-center gap-2">
            <Fingerprint size={22} color={theme.accent} />
            <Text className="font-inter-bold text-lg text-slate-900 dark:text-vault-fg">Biometric app lock</Text>
          </View>
          <Text className="mt-3 text-sm leading-6 text-slate-600 dark:text-vault-muted">
            When enabled, BodyTrace asks for Face ID, Touch ID, or fingerprint after you leave the app and when you open it
            again.
          </Text>
          <View className="mt-5 min-h-[48px] flex-row items-center justify-between border-t border-slate-100 pt-4 dark:border-white/10">
            <Text className="flex-1 pr-3 font-inter-medium text-slate-800 dark:text-vault-fg">Require biometrics</Text>
            {busy ? (
              <ActivityIndicator color={theme.accent} />
            ) : (
              <Switch
                value={settings.biometricEnabled}
                onValueChange={onBiometricToggle}
                trackColor={{ false: isDark ? '#3f3f46' : '#e2e8f0', true: theme.accentDim }}
                thumbColor={settings.biometricEnabled ? '#f8fafc' : isDark ? '#a1a1aa' : '#fff'}
                ios_backgroundColor={isDark ? '#3f3f46' : '#e2e8f0'}
              />
            )}
          </View>
        </Card>

        <Card className="mb-4">
          <View className="flex-row items-center gap-2">
            <Database size={20} color={theme.accent} />
            <Text className="font-inter-bold text-lg text-slate-900 dark:text-vault-fg">Check-in frequency</Text>
          </View>
          <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-vault-muted">
            Local notification cadence (9:00) — weekly or monthly.
          </Text>
          <View className="mt-5 flex-row items-center justify-between">
            <Text className="font-inter-medium capitalize text-slate-800 dark:text-vault-fg">{settings.frequency}</Text>
            <Pressable onPress={busy ? undefined : onFrequencyPress} disabled={busy} accessibilityRole="button">
              <Text className="font-inter-semibold text-accent">
                Switch to {settings.frequency === 'weekly' ? 'monthly' : 'weekly'}
              </Text>
            </Pressable>
          </View>
        </Card>

        <Card className="mb-2">
          <Text className="font-inter-bold text-lg text-slate-900 dark:text-vault-fg">Reminders</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-vault-muted">
            Weekly: day 0 = Sunday … 6 = Saturday. Monthly: day of month 1–28.
          </Text>
          <View className="mt-5 min-h-[48px] flex-row items-center justify-between border-b border-slate-100 pb-5 dark:border-white/10">
            <Text className="flex-1 pr-3 font-inter-medium text-slate-800 dark:text-vault-fg">Enabled</Text>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={onReminderToggle}
              disabled={busy}
              trackColor={{ false: isDark ? '#3f3f46' : '#e2e8f0', true: theme.accentDim }}
              thumbColor={settings.reminderEnabled ? '#f8fafc' : isDark ? '#a1a1aa' : '#fff'}
              ios_backgroundColor={isDark ? '#3f3f46' : '#e2e8f0'}
            />
          </View>
          <View className="mt-5 min-h-[52px] flex-row items-center justify-between">
            <Text className="font-inter-medium text-slate-800 dark:text-vault-fg">Reminder day</Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={async () => {
                  const min = settings.frequency === 'weekly' ? 0 : 1;
                  const next = Math.max(min, settings.reminderDay - 1);
                  setBusy(true);
                  try {
                    await updateSettings({ reminderDay: next });
                  } finally {
                    setBusy(false);
                  }
                }}
                className="min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 active:opacity-80 dark:border-white/15 dark:bg-elevated">
                <Text className="font-inter-bold text-lg text-slate-900 dark:text-white">−</Text>
              </Pressable>
              <Text
                className="min-w-[36px] text-center font-inter-bold text-2xl text-slate-900 dark:text-white"
                style={{ fontVariant: ['tabular-nums'] }}>
                {settings.reminderDay}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={async () => {
                  const max = settings.frequency === 'weekly' ? 6 : 28;
                  const next = Math.min(max, settings.reminderDay + 1);
                  setBusy(true);
                  try {
                    await updateSettings({ reminderDay: next });
                  } finally {
                    setBusy(false);
                  }
                }}
                className="min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 active:opacity-80 dark:border-white/15 dark:bg-elevated">
                <Text className="font-inter-bold text-lg text-slate-900 dark:text-white">+</Text>
              </Pressable>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
