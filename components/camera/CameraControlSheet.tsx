import { BlurView } from "expo-blur";
import { Ghost, Grid3x3, SlidersHorizontal } from "lucide-react-native";
import React, { type ReactNode, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { OpacitySlider } from "@/components/camera/OpacitySlider";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { PhotoAngle } from "@/types";
import { theme } from "@/utils/theme";

const ANGLES: { id: PhotoAngle; label: string }[] = [
    { id: "front", label: "Front" },
    { id: "side", label: "Side" },
    { id: "back", label: "Back" },
];

export type CameraReferenceEntry = { id: string; createdAt: Date };

export interface CameraControlSheetProps {
    /** `tab` — tab bar hidden; `entry` — stack header may still show */
    variant?: "tab" | "entry";
    /** Shown only when “Ghost & reference” is expanded */
    title?: string;
    /** Progress hint, e.g. "2/3 done" */
    progressLabel?: string;
    angle: PhotoAngle;
    onAngleChange: (angle: PhotoAngle) => void;
    referenceEntryId: string | null;
    onReferenceEntryId: (id: string | null) => void;
    referenceEntries: CameraReferenceEntry[];
    ghostOpacity: number;
    onGhostOpacityChange: (value: number) => void;
    ghostEnabled: boolean;
    onGhostEnabledChange: (value: boolean) => void;
    showGuide: boolean;
    onToggleGuide: () => void;
    /** New-entry flow: step chips for front/side/back */
    photoOrder?: PhotoAngle[];
    photoIndex?: number;
    onPhotoIndexChange?: (index: number) => void;
    captured?: Partial<Record<PhotoAngle, string>>;
    footer: ReactNode;
    /** Start with ghost/reference panel open */
    defaultAdvancedOpen?: boolean;
}

export function CameraControlSheet({
    variant = "entry",
    title = "Overlay camera",
    progressLabel,
    angle,
    onAngleChange,
    referenceEntryId,
    onReferenceEntryId,
    referenceEntries,
    ghostOpacity,
    onGhostOpacityChange,
    ghostEnabled,
    onGhostEnabledChange,
    showGuide,
    onToggleGuide,
    photoOrder,
    photoIndex,
    onPhotoIndexChange,
    captured,
    footer,
    defaultAdvancedOpen = false,
}: CameraControlSheetProps) {
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const [advancedOpen, setAdvancedOpen] = useState(defaultAdvancedOpen);

    const showStepChips = Boolean(photoOrder?.length && onPhotoIndexChange);
    /** Extra lift so primary actions clear the home indicator / gesture bar */
    const bottomPad = Math.max(insets.bottom, 12) + (advancedOpen ? 14 : 8);

    const sheetMaxHeight = useMemo(() => {
        const frac = variant === "tab" ? 0.5 : 0.48;
        const cap = variant === "tab" ? 440 : 420;
        return Math.min(Math.round(windowHeight * frac), cap);
    }, [variant, windowHeight]);

    /** Space we must leave for controls that stay out of the scroll (shutter + strip + chips) */
    const footerReserve = useMemo(() => {
        /** Retake + Next / dual row needs more vertical room than a single Capture */
        if (showStepChips) return 200;
        return 76;
    }, [showStepChips]);
    const compactReserve = 50;
    const progressReserve = progressLabel ? 22 : 0;
    const chipReserve = showStepChips ? 42 : 0;
    const chromeMargin = 18;

    const advancedScrollMax = useMemo(() => {
        if (!advancedOpen) return 0;
        const reserved =
            footerReserve +
            compactReserve +
            progressReserve +
            chipReserve +
            bottomPad +
            chromeMargin;
        return Math.max(100, sheetMaxHeight - reserved);
    }, [
        advancedOpen,
        bottomPad,
        chipReserve,
        compactReserve,
        footerReserve,
        progressReserve,
        sheetMaxHeight,
    ]);

    const advancedBlock = advancedOpen ? (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: advancedScrollMax }}
            contentContainerStyle={{ paddingBottom: 6 }}
        >
            {title ? (
                <Text className="mb-2 font-inter-semibold text-xs uppercase tracking-wide text-white/70">
                    {title}
                </Text>
            ) : null}

            <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
                <View className="mr-2 min-w-0 flex-1 flex-row items-center gap-2">
                    <Ghost
                        size={18}
                        color={ghostEnabled ? theme.accent : theme.mutedText}
                    />
                    <View className="min-w-0 flex-1">
                        <Text
                            className="font-inter-semibold text-white"
                            numberOfLines={1}
                        >
                            Match previous photo
                        </Text>
                        <Text
                            className="text-[11px] font-inter-medium text-white/55"
                            numberOfLines={2}
                        >
                            Ghost from reference entry — tune strength below.
                        </Text>
                    </View>
                </View>
                <Switch
                    value={ghostEnabled}
                    onValueChange={onGhostEnabledChange}
                    trackColor={{ false: "#3f3f46", true: theme.accentDim }}
                    thumbColor={ghostEnabled ? "#f4f4f5" : "#a1a1aa"}
                />
            </View>

            <View className="mb-3">
                <OpacitySlider
                    value={ghostOpacity}
                    onChange={onGhostOpacityChange}
                    max={0.5}
                    disabled={!ghostEnabled}
                    compact
                />
            </View>

            <Text className="mb-1.5 text-[10px] font-inter-semibold uppercase tracking-[0.12em] text-accent/95">
                Reference
            </Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="pb-1"
            >
                <Pressable
                    onPress={() => onReferenceEntryId(null)}
                    className={`mr-2 rounded-xl border px-2.5 py-1.5 ${
                        referenceEntryId === null
                            ? "border-accent bg-accent-dim"
                            : "border-white/20 bg-white/5"
                    }`}
                >
                    <Text className="text-[11px] font-inter-medium text-white">
                        Oldest
                    </Text>
                </Pressable>
                {referenceEntries.map((e) => (
                    <Pressable
                        key={e.id}
                        onPress={() => onReferenceEntryId(e.id)}
                        className={`mr-2 rounded-xl border px-2.5 py-1.5 ${
                            referenceEntryId === e.id
                                ? "border-accent bg-accent-dim"
                                : "border-white/20 bg-white/5"
                        }`}
                    >
                        <Text className="text-[11px] font-inter-medium text-white">
                            {e.createdAt.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                            })}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
        </ScrollView>
    ) : null;

    /** Order: expanded block (scrolls) → meta → compact → chips → footer pinned near home indicator */
    const inner = (
        <View
            className="border-t border-white/10 px-3 pt-2"
            style={{ paddingBottom: bottomPad }}
        >
            {advancedBlock}

            {progressLabel ? (
                <Text className="mb-1.5 text-center text-[11px] font-inter-medium text-white/55">
                    {progressLabel}
                </Text>
            ) : null}

            <View className="mb-2 flex-row items-center gap-2">
                <Pressable
                    onPress={onToggleGuide}
                    accessibilityRole="button"
                    accessibilityLabel={
                        showGuide
                            ? "Hide alignment grid"
                            : "Show alignment grid"
                    }
                    hitSlop={10}
                    className="h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:opacity-70"
                >
                    <Grid3x3 size={18} color={theme.accent} />
                </Pressable>

                <View className="min-w-0 flex-1">
                    <SegmentedControl
                        options={ANGLES}
                        value={angle}
                        onChange={onAngleChange}
                        scheme="onDark"
                        density="compact"
                    />
                </View>

                <Pressable
                    onPress={() => setAdvancedOpen((o) => !o)}
                    accessibilityRole="button"
                    accessibilityLabel={
                        advancedOpen
                            ? "Hide ghost and reference"
                            : "Show ghost and reference"
                    }
                    hitSlop={8}
                    className={`h-10 w-10 items-center justify-center rounded-xl active:opacity-80 ${
                        advancedOpen ? "bg-accent/30" : "bg-white/10"
                    }`}
                >
                    <SlidersHorizontal
                        size={18}
                        color={advancedOpen ? "#fff" : theme.accent}
                    />
                </Pressable>
            </View>

            {showStepChips && photoOrder && onPhotoIndexChange ? (
                <View className="mb-2 flex-row flex-wrap justify-center gap-1.5">
                    {photoOrder.map((ang, i) => {
                        const done = Boolean(captured?.[ang]);
                        const active = photoIndex === i;
                        return (
                            <Pressable
                                key={ang}
                                accessibilityRole="button"
                                onPress={() => onPhotoIndexChange(i)}
                                className={`rounded-full px-2.5 py-1.5 ${active ? "bg-accent" : "bg-white/10"}`}
                            >
                                <Text
                                    className={`text-[11px] font-inter-semibold capitalize ${active ? "text-canvas" : "text-white/75"}`}
                                >
                                    {ang}
                                    {done ? " ✓" : ""}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            ) : null}

            <View
                className={advancedOpen ? "border-t border-white/10 pt-2" : ""}
            >
                {footer}
            </View>
        </View>
    );

    const sheetBody = (
        <View style={{ backgroundColor: "rgba(8,10,13,0.62)" }}>{inner}</View>
    );

    if (Platform.OS === "web") {
        return (
            <View className="border-t border-white/10 bg-surface/95">
                {inner}
            </View>
        );
    }

    return (
        <BlurView
            intensity={34}
            tint="dark"
            style={{ maxHeight: sheetMaxHeight }}
            className="overflow-hidden border-t border-white/10 rounded-t-2xl"
        >
            {sheetBody}
        </BlurView>
    );
}
