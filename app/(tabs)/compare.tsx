import { Columns2, MoreHorizontal, Share2 } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SideBySide } from "@/components/comparison/SideBySide";
import { SliderOverlay } from "@/components/comparison/SliderOverlay";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useEntries } from "@/contexts/EntriesContext";
import { shareImageUri } from "@/services/export";
import type { PhotoAngle } from "@/types";
import { theme } from "@/utils/theme";

const ANGLES: { id: PhotoAngle; label: string }[] = [
    { id: "front", label: "Front" },
    { id: "side", label: "Side" },
    { id: "back", label: "Back" },
];

const MODES: { id: "side" | "slider"; label: string }[] = [
    { id: "slider", label: "Slider" },
    { id: "side", label: "Side by side" },
];

function formatShort(d: Date) {
    return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function CompareScreen() {
    const { entries, ready } = useEntries();
    const [angle, setAngle] = useState<PhotoAngle>("front");
    const [mode, setMode] = useState<"side" | "slider">("slider");
    const [olderId, setOlderId] = useState<string | null>(null);
    const [newerId, setNewerId] = useState<string | null>(null);
    const [showShareRow, setShowShareRow] = useState(false);

    const sortedAsc = useMemo(
        () =>
            [...entries].sort(
                (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
            ),
        [entries],
    );
    const sortedDesc = useMemo(
        () =>
            [...entries].sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
            ),
        [entries],
    );

    const defaultOlder = sortedAsc[0];
    const defaultNewer = sortedDesc[0];

    const older = useMemo(
        () => entries.find((e) => e.id === (olderId ?? defaultOlder?.id)),
        [defaultOlder?.id, entries, olderId],
    );
    const newer = useMemo(
        () => entries.find((e) => e.id === (newerId ?? defaultNewer?.id)),
        [defaultNewer?.id, entries, newerId],
    );

    const beforeUri = older?.photos[angle];
    const afterUri = newer?.photos[angle];

    const onShareBefore = useCallback(async () => {
        if (!beforeUri) return;
        try {
            await shareImageUri(beforeUri);
        } catch (e) {
            Alert.alert(
                "Share failed",
                e instanceof Error ? e.message : "Unknown error",
            );
        }
    }, [beforeUri]);

    const onShareAfter = useCallback(async () => {
        if (!afterUri) return;
        try {
            await shareImageUri(afterUri);
        } catch (e) {
            Alert.alert(
                "Share failed",
                e instanceof Error ? e.message : "Unknown error",
            );
        }
    }, [afterUri]);

    if (!ready) {
        return (
            <SafeAreaView
                className="flex-1 items-center justify-center bg-slate-50 dark:bg-canvas"
                edges={["top"]}
            >
                <ActivityIndicator color={theme.accent} />
            </SafeAreaView>
        );
    }

    if (entries.length < 2) {
        return (
            <SafeAreaView
                className="flex-1 bg-slate-50 px-4 dark:bg-canvas"
                edges={["top"]}
            >
                <ScreenHeader
                    title="Compare"
                    subtitle="See change between two checkpoints — same angle, same framing."
                    leftAccessory={<Columns2 size={28} color={theme.accent} />}
                />
                <Card>
                    <Text className="leading-6 text-slate-700 dark:text-vault-muted">
                        Add at least two entries to your timeline to compare
                        before and after.
                    </Text>
                </Card>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            className="flex-1 bg-slate-50 dark:bg-canvas"
            edges={["top"]}
        >
            <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
            >
                <ScreenHeader
                    eyebrow="Visual diff"
                    title="Compare"
                    subtitle="Drag the slider to reveal the story between photos."
                    leftAccessory={<Columns2 size={28} color={theme.accent} />}
                    right={
                        <Pressable
                            accessibilityRole="button"
                            hitSlop={12}
                            onPress={() => setShowShareRow((v) => !v)}
                            className="rounded-full border border-slate-200 bg-white p-2 dark:border-white/15 dark:bg-elevated"
                        >
                            <MoreHorizontal size={22} color={theme.accent} />
                        </Pressable>
                    }
                />

                <View className="mb-3 flex-row flex-wrap items-end gap-3">
                    <View className="min-w-0 flex-1">
                        <Text className="mb-2 text-[11px] font-inter-semibold uppercase tracking-[0.12em] text-vault-muted">
                            Angle
                        </Text>
                        <SegmentedControl
                            options={ANGLES}
                            value={angle}
                            onChange={setAngle}
                        />
                    </View>
                </View>
                <View className="mb-5">
                    <Text className="mb-2 text-[11px] font-inter-semibold uppercase tracking-[0.12em] text-vault-muted">
                        Layout
                    </Text>
                    <SegmentedControl
                        options={MODES}
                        value={mode}
                        onChange={setMode}
                    />
                </View>

                <Text className="mb-2 text-[11px] font-inter-semibold uppercase tracking-[0.12em] text-vault-muted">
                    Earlier entry
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-3"
                >
                    {sortedAsc.map((e) => (
                        <Pressable
                            key={e.id}
                            onPress={() => setOlderId(e.id)}
                            className={`mr-2 min-h-[40px] justify-center rounded-2xl border px-3 py-2 ${
                                (olderId ?? defaultOlder?.id) === e.id
                                    ? "border-accent bg-accent-dim"
                                    : "border-slate-200 bg-white dark:border-white/10 dark:bg-elevated"
                            }`}
                        >
                            <Text className="text-xs font-inter-medium text-slate-800 dark:text-vault-fg">
                                {formatShort(e.createdAt)}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <Text className="mb-2 text-[11px] font-inter-semibold uppercase tracking-[0.12em] text-vault-muted">
                    Later entry
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                >
                    {sortedDesc.map((e) => (
                        <Pressable
                            key={e.id}
                            onPress={() => setNewerId(e.id)}
                            className={`mr-2 min-h-[40px] justify-center rounded-2xl border px-3 py-2 ${
                                (newerId ?? defaultNewer?.id) === e.id
                                    ? "border-accent bg-accent-dim"
                                    : "border-slate-200 bg-white dark:border-white/10 dark:bg-elevated"
                            }`}
                        >
                            <Text className="text-xs font-inter-medium text-slate-800 dark:text-vault-fg">
                                {formatShort(e.createdAt)}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                {older && newer ? (
                    beforeUri && afterUri ? (
                        <>
                            {mode === "slider" ? (
                                <SliderOverlay
                                    beforeUri={beforeUri}
                                    afterUri={afterUri}
                                />
                            ) : (
                                <SideBySide
                                    beforeUri={beforeUri}
                                    afterUri={afterUri}
                                    beforeLabel={formatShort(older.createdAt)}
                                    afterLabel={formatShort(newer.createdAt)}
                                />
                            )}
                            {showShareRow ? (
                                <View className="mt-4 flex-row gap-2">
                                    <View className="flex-1">
                                        <Button
                                            title="Share earlier"
                                            variant="secondary"
                                            onPress={onShareBefore}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Button
                                            title="Share later"
                                            variant="secondary"
                                            onPress={onShareAfter}
                                        />
                                    </View>
                                </View>
                            ) : null}
                            <View className="mt-3 flex-row items-center justify-center gap-2 opacity-80">
                                <Share2 size={14} color={theme.mutedText} />
                                <Text className="flex-1 text-center text-xs text-vault-muted">
                                    Exports use the system share sheet
                                    (on-device files when saved locally). Tap
                                    ··· to share.
                                </Text>
                            </View>
                        </>
                    ) : (
                        <Card>
                            <Text className="leading-6 text-slate-700 dark:text-vault-muted">
                                One or both entries have no photo for this
                                angle. Pick another angle above, or add that
                                photo in a new entry.
                            </Text>
                        </Card>
                    )
                ) : null}
            </ScrollView>
        </SafeAreaView>
    );
}
