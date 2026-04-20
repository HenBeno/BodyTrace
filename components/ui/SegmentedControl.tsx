import React from "react";
import { Pressable, Text, View } from "react-native";

export interface SegmentOption<T extends string> {
    id: T;
    label: string;
}

export interface SegmentedControlProps<T extends string> {
    options: SegmentOption<T>[];
    value: T;
    onChange: (id: T) => void;
    className?: string;
    /** `onDark` — translucent chips for camera / vault panels */
    scheme?: "default" | "onDark";
    /** Tighter tap targets for camera toolbars */
    density?: "default" | "compact" | "micro";
}

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    className = "",
    scheme = "default",
    density = "default",
}: SegmentedControlProps<T>) {
    const minH =
        density === "micro"
            ? "min-h-[30px]"
            : density === "compact"
              ? "min-h-[36px]"
              : "min-h-[44px]";
    const textSize =
        density === "micro"
            ? "text-[11px]"
            : density === "compact"
              ? "text-xs"
              : "text-sm";
    const gap = density === "micro" ? "gap-1" : "gap-1.5";
    const radius = density === "micro" ? "rounded-lg" : "rounded-xl";
    const pad = density === "micro" ? "px-1 py-0.5" : "px-1.5 py-1.5";
    return (
        <View className={`flex-row ${gap} ${className}`}>
            {options.map((o) => {
                const active = value === o.id;
                const inactiveSurface =
                    scheme === "onDark"
                        ? "bg-white/12"
                        : "bg-slate-200 dark:bg-elevated";
                const activeText = "text-canvas";
                const inactiveText =
                    scheme === "onDark"
                        ? "text-white/85"
                        : "text-slate-800 dark:text-vault-fg";
                return (
                    <Pressable
                        key={o.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => onChange(o.id)}
                        className={`${minH} flex-1 items-center justify-center ${radius} ${pad} ${
                            active ? "bg-accent" : inactiveSurface
                        }`}
                    >
                        <Text
                            className={`text-center font-inter-semibold ${textSize} ${active ? activeText : inactiveText}`}
                        >
                            {o.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
