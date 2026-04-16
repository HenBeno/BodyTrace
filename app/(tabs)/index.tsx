import { Link } from 'expo-router';
import { Plus, Sparkles } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TimelineList } from '@/components/timeline/TimelineList';
import { APP_NAME } from '@/utils/constants';
import { useEntries } from '@/contexts/EntriesContext';
import { theme } from '@/utils/theme';

export default function HomeScreen() {
  const { entries, ready } = useEntries();

  const header = (
    <ScreenHeader
      eyebrow="Your journey"
      title={APP_NAME}
      subtitle="Proof of progress — your photos are the hero. Tap New to capture and save a set to your timeline."
      leftAccessory={<Sparkles size={26} color={theme.accent} />}
      right={
        <Link href="/entry/new" asChild>
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-1.5 rounded-2xl bg-accent px-3.5 py-2.5 active:opacity-90">
            <Plus size={18} color={theme.canvas} />
            <Text className="font-inter-semibold text-canvas text-sm">New</Text>
          </Pressable>
        </Link>
      }
    />
  );

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 dark:bg-canvas" edges={['top']}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-canvas" edges={['top']}>
      <TimelineList entries={entries} ListHeaderComponent={header} />
    </SafeAreaView>
  );
}
