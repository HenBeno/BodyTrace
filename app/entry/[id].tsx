import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ResolvedExpoImage } from '@/components/media/ResolvedExpoImage';
import { Card } from '@/components/ui/Card';
import { useEntries } from '@/contexts/EntriesContext';
import { MEASUREMENT_LABELS } from '@/utils/constants';
import { formatMeasurementDisplay } from '@/utils/measurements';
import { theme } from '@/utils/theme';

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, ready, removeEntry } = useEntries();

  const entry = useMemo(() => entries.find((e) => e.id === id), [entries, id]);

  const onDelete = useCallback(() => {
    if (!entry) return;
    Alert.alert('Delete this entry?', 'Photos and measurements will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeEntry(entry.id);
            router.back();
          } catch (e) {
            Alert.alert('Delete failed', e instanceof Error ? e.message : 'Unknown error');
          }
        },
      },
    ]);
  }, [entry, removeEntry]);

  const statItems = useMemo(() => {
    if (!entry) return [];
    return MEASUREMENT_LABELS.map(({ key, label }) => {
      const m = entry.measurements[key];
      if (!m) return null;
      return { key, label, display: formatMeasurementDisplay(m) };
    }).filter(Boolean) as { key: string; label: string; display: string }[];
  }, [entry]);

  if (!ready) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 dark:bg-canvas">
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 dark:bg-canvas">
        <Text className="font-inter-medium text-vault-muted">Entry not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: entry.createdAt.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={onDelete} className="p-2">
              <Trash2 color={theme.danger} size={22} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-slate-50 dark:bg-canvas" edges={['bottom']}>
        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="mb-5 flex-row gap-2">
            {(['front', 'side', 'back'] as const).map((angle) => {
              const uri = entry.photos[angle];
              return (
                <View key={angle} className="flex-1 overflow-hidden rounded-2xl border border-white/10">
                  {uri ? (
                    <ResolvedExpoImage
                      uri={uri}
                      style={{ width: '100%', aspectRatio: 3 / 4 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      className="w-full items-center justify-center bg-slate-200 dark:bg-white/10"
                      style={{ aspectRatio: 3 / 4 }}>
                      <Text className="px-2 text-center text-xs font-inter-medium text-slate-500 dark:text-vault-muted">
                        No {angle} photo
                      </Text>
                    </View>
                  )}
                  <Text className="bg-canvas/90 py-1.5 text-center text-[11px] font-inter-semibold uppercase tracking-[0.1em] text-white">
                    {angle}
                  </Text>
                </View>
              );
            })}
          </View>

          <Card>
            <Text className="mb-4 font-inter-bold text-lg text-slate-900 dark:text-vault-fg">Measurements</Text>
            {statItems.length === 0 ? (
              <Text className="font-inter-medium text-vault-muted">No measurements logged for this entry.</Text>
            ) : (
              <View className="flex-row flex-wrap gap-3">
                {statItems.map((row) => (
                  <View
                    key={row.key}
                    className="w-[47%] flex-grow rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-elevated/80">
                    <Text className="text-[11px] font-inter-semibold uppercase tracking-[0.12em] text-vault-muted">
                      {row.label}
                    </Text>
                    <Text
                      className="mt-1 font-inter-bold text-2xl text-slate-900 dark:text-white"
                      style={{ fontVariant: ['tabular-nums'] }}>
                      {row.display}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {entry.notes ? (
            <Card className="mt-4">
              <Text className="mb-2 font-inter-bold text-lg text-slate-900 dark:text-vault-fg">Notes</Text>
              <Text className="leading-6 text-slate-600 dark:text-vault-muted">{entry.notes}</Text>
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
