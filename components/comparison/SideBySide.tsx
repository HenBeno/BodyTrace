import React from "react";
import { Text, View } from "react-native";

import { ResolvedExpoImage } from "@/components/media/ResolvedExpoImage";
import { theme } from "@/utils/theme";

export interface SideBySideProps {
    beforeUri: string;
    afterUri: string;
    beforeLabel: string;
    afterLabel: string;
}

export function SideBySide({
    beforeUri,
    afterUri,
    beforeLabel,
    afterLabel,
}: SideBySideProps) {
    return (
        <View className="flex-row gap-3">
            <View className="flex-1">
                <View className="overflow-hidden rounded-3xl border border-white/10 shadow-vault">
                    <ResolvedExpoImage
                        uri={beforeUri}
                        style={{ width: "100%", aspectRatio: 3 / 4 }}
                        contentFit="cover"
                    />
                </View>
                <Text className="mt-2 text-center text-[11px] font-inter-semibold uppercase tracking-[0.12em] text-vault-muted">
                    Before · {beforeLabel}
                </Text>
            </View>
            <View className="flex-1">
                <View className="overflow-hidden rounded-3xl border border-white/10 shadow-vault">
                    <ResolvedExpoImage
                        uri={afterUri}
                        style={{ width: "100%", aspectRatio: 3 / 4 }}
                        contentFit="cover"
                    />
                </View>
                <Text
                    className="mt-2 text-center text-[11px] font-inter-semibold uppercase tracking-[0.12em]"
                    style={{ color: theme.accent }}
                >
                    After · {afterLabel}
                </Text>
            </View>
        </View>
    );
}
