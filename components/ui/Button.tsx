import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";

import { theme } from "@/utils/theme";

type Variant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends PressableProps {
  title: string;
  variant?: Variant;
  loading?: boolean;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent active:opacity-90",
  secondary:
    "border border-slate-300/90 bg-slate-100 active:opacity-90 dark:border-white/15 dark:bg-elevated",
  ghost: "bg-transparent active:opacity-80",
};

const textClasses: Record<Variant, string> = {
  primary: "text-canvas font-inter-semibold",
  secondary: "text-slate-900 font-inter-semibold dark:text-vault-fg",
  ghost: "text-accent font-inter-semibold",
};

export function Button({
  title,
  variant = "primary",
  loading,
  disabled,
  className = "",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={`min-h-[52px] items-center justify-center rounded-2xl px-5 py-3.5 ${variantClasses[variant]} ${isDisabled ? "opacity-50" : ""} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? theme.canvas : theme.accent}
        />
      ) : (
        <Text className={`text-center text-base ${textClasses[variant]}`}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
