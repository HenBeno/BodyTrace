import React from "react";
import { View, type ViewProps } from "react-native";

export interface CardProps extends ViewProps {
    className?: string;
    /** @default vault — light: white panel; dark: vault surface */
    variant?: "vault" | "outline";
}

export function Card({
    className = "",
    variant = "vault",
    children,
    ...rest
}: CardProps) {
    const surface =
        variant === "vault"
            ? "rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-white/10 dark:bg-surface dark:shadow-vault"
            : "rounded-3xl border border-slate-200/90 bg-slate-50 dark:border-white/10 dark:bg-elevated";

    return (
        <View className={`${surface} p-4 ${className}`} {...rest}>
            {children}
        </View>
    );
}
