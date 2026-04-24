import React from "react"
import { ActivityIndicator, Text, type PressableProps } from "react-native"

import { PressableScale } from "@/components/ui/PressableScale"
import { theme } from "@/utils/theme"

type Variant = "primary" | "secondary" | "ghost"

export interface ButtonProps extends PressableProps {
  title: string
  variant?: Variant
  loading?: boolean
  className?: string
  /** @default true */
  hapticOnPressIn?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent shadow-vault dark:border dark:border-cyan-300/35",
  secondary:
    "border border-slate-300/90 bg-slate-100/95 dark:border-cyan-300/20 dark:bg-elevated/90",
  ghost: "bg-transparent",
}

const textClasses: Record<Variant, string> = {
  primary: "text-canvas font-inter-semibold",
  secondary: "text-slate-900 font-inter-semibold dark:text-vault-fg",
  ghost: "text-accent font-inter-semibold",
}

export function Button({
  title,
  variant = "primary",
  loading,
  disabled,
  className = "",
  hapticOnPressIn = true,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <PressableScale
      accessibilityRole="button"
      disabled={isDisabled}
      hapticOnPressIn={hapticOnPressIn && !isDisabled}
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
    </PressableScale>
  )
}
