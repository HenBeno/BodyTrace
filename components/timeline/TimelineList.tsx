import { Link } from "expo-router";
import React from "react";
import { FlatList, ListRenderItem, Pressable, Text, View } from "react-native";

import type { Entry } from "@/types";

import { TimelineEntry } from "./TimelineEntry";

export interface TimelineListProps {
    entries: Entry[];
    ListHeaderComponent?: React.ReactElement | null;
}

function EmptyState() {
    return (
        <View className="w-full px-1 pb-6 pt-2">
            <View className="mx-auto w-full max-w-sm items-center rounded-3xl border-2 border-dashed border-slate-300 bg-white px-6 py-10 dark:border-white/25 dark:bg-elevated">
                <Text className="text-center text-base leading-6 text-slate-900 dark:text-vault-fg">
                    No entries yet. Use New entry to capture front, side, and
                    back photos — that is the only way they are saved to your
                    timeline. Everything stays private, on-device.
                </Text>
                <Link href="/entry/new" asChild>
                    <Pressable
                        className="mt-8 min-h-[52px] w-full justify-center rounded-2xl bg-accent px-8 active:opacity-90"
                        accessibilityRole="button"
                    >
                        <Text className="text-center font-inter-semibold text-base text-canvas">
                            New entry
                        </Text>
                    </Pressable>
                </Link>
            </View>
        </View>
    );
}

export function TimelineList({
    entries,
    ListHeaderComponent,
}: TimelineListProps) {
    const renderItem: ListRenderItem<Entry> = ({ item, index }) => (
        <TimelineEntry
            entry={item}
            index={index}
            isLast={index === entries.length - 1}
        />
    );

    return (
        <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={ListHeaderComponent ?? undefined}
            ListEmptyComponent={<EmptyState />}
            contentContainerStyle={{
                flexGrow: 1,
                paddingHorizontal: 20,
                paddingBottom: 36,
            }}
            showsVerticalScrollIndicator={false}
        />
    );
}
