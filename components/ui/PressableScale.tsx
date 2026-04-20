import React, { forwardRef, type ReactNode } from "react"
import { Pressable, type PressableProps, type View } from "react-native"
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated"

import { lightImpact } from "@/services/haptics"

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PressableScaleProps extends PressableProps {
  children: ReactNode
  /** Scale when pressed (default 0.97). */
  pressedScale?: number
  /** Fire light haptic on press in (default true). */
  hapticOnPressIn?: boolean
}

export const PressableScale = forwardRef<View, PressableScaleProps>(
  function PressableScale(
    {
      children,
      disabled,
      pressedScale = 0.97,
      hapticOnPressIn = true,
      onPressIn,
      onPressOut,
      style,
      ...rest
    },
    ref,
  ) {
    const scale = useSharedValue(1)
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }))

    return (
      <ReanimatedPressable
        ref={ref}
        disabled={disabled}
        style={[animatedStyle, style]}
        onPressIn={(e) => {
          if (!disabled && hapticOnPressIn) lightImpact()
          scale.value = withSpring(pressedScale, {
            damping: 18,
            stiffness: 420,
          })
          onPressIn?.(e)
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, { damping: 16, stiffness: 380 })
          onPressOut?.(e)
        }}
        {...rest}
      >
        {children}
      </ReanimatedPressable>
    )
  },
)
