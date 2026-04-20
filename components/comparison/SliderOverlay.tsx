import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
    LayoutChangeEvent,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

import { ResolvedExpoImage } from "@/components/media/ResolvedExpoImage";
import { theme } from "@/utils/theme";

export interface SliderOverlayProps {
    /** Shown on the left / clipped region (e.g. older). */
    beforeUri: string;
    /** Full frame (e.g. newer). */
    afterUri: string;
}

function triggerHaptic() {
    if (Platform.OS === "ios") {
        Haptics.selectionAsync().catch(() => {});
    }
}

export function SliderOverlay({ beforeUri, afterUri }: SliderOverlayProps) {
    const [trackW, setTrackW] = useState(280);
    const layoutWidth = useSharedValue(280);
    const split = useSharedValue(0.5);
    const startSplit = useSharedValue(0.5);

    const onLayout = useCallback(
        (e: LayoutChangeEvent) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) {
                setTrackW(w);
                layoutWidth.value = w;
            }
        },
        [layoutWidth],
    );

    /** Prefer vertical scroll on the parent Compare screen; only claim clearly horizontal drags. */
    const pan = Gesture.Pan()
        .activeOffsetX([-18, 18])
        .failOffsetY([-14, 14])
        .onBegin(() => {
            startSplit.value = split.value;
        })
        .onUpdate((e) => {
            const w = Math.max(1, layoutWidth.value);
            split.value = Math.max(
                0.05,
                Math.min(0.95, startSplit.value + e.translationX / w),
            );
        })
        .onEnd(() => {
            split.value = withSpring(split.value, {
                damping: 18,
                stiffness: 220,
                mass: 0.35,
            });
            runOnJS(triggerHaptic)();
        });

    const clipStyle = useAnimatedStyle(() => {
        return { width: layoutWidth.value * split.value };
    });

    const dividerStyle = useAnimatedStyle(() => ({
        left: layoutWidth.value * split.value - 1,
    }));

    const knobStyle = useAnimatedStyle(() => ({
        left: layoutWidth.value * split.value - 22,
    }));

    return (
        <GestureDetector gesture={pan}>
            <View
                className="w-full overflow-hidden rounded-3xl bg-black shadow-vault"
                onLayout={onLayout}
                style={{ aspectRatio: 3 / 4 }}
            >
                <ResolvedExpoImage
                    uri={afterUri}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                />

                <Animated.View
                    style={[
                        {
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: 0,
                            overflow: "hidden",
                        },
                        clipStyle,
                    ]}
                >
                    <ResolvedExpoImage
                        uri={beforeUri}
                        style={{ width: trackW, height: "100%" }}
                        contentFit="cover"
                    />
                </Animated.View>

                <View
                    pointerEvents="none"
                    className="absolute left-3 right-3 top-3 flex-row justify-between"
                >
                    <View className="rounded-full border border-white/15 bg-canvas/55 px-2.5 py-1">
                        <Text className="text-[10px] font-inter-semibold uppercase tracking-[0.12em] text-white/90">
                            Before
                        </Text>
                    </View>
                    <View className="rounded-full border border-white/15 bg-canvas/55 px-2.5 py-1">
                        <Text className="text-[10px] font-inter-semibold uppercase tracking-[0.12em] text-white/90">
                            After
                        </Text>
                    </View>
                </View>

                <Animated.View
                    pointerEvents="none"
                    style={[
                        {
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            width: 2,
                            backgroundColor: "rgba(255,255,255,0.95)",
                            shadowColor: theme.accent,
                            shadowOpacity: 0.45,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 0 },
                        },
                        dividerStyle,
                    ]}
                />

                <Animated.View
                    style={[
                        {
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            width: 44,
                            justifyContent: "center",
                            alignItems: "center",
                        },
                        knobStyle,
                    ]}
                >
                    <View
                        className="h-14 w-9 items-center justify-center rounded-full border-2 bg-canvas/95"
                        style={{
                            borderColor: theme.accent,
                            elevation: 6,
                            shadowColor: theme.accent,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.35,
                            shadowRadius: 10,
                        }}
                    >
                        <View className="h-8 w-1 rounded-full bg-white" />
                    </View>
                </Animated.View>
            </View>
        </GestureDetector>
    );
}
