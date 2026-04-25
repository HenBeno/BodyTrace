import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import React, { useEffect, useRef } from "react"
import { Animated, Easing, View } from "react-native"

import { theme } from "@/utils/theme"

export function FlexingArmLoader() {
  const translateY = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current
  const rotate = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -14,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.16,
            duration: 260,
            easing: Easing.out(Easing.back(1.8)),
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: -1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 8,
            duration: 220,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.96,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 220,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    )

    animation.start()
    return () => {
      animation.stop()
    }
  }, [rotate, scale, translateY])

  const rotateDeg = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-10deg", "10deg"],
  })

  return (
    <View className="items-center justify-center">
      <Animated.View
        style={{
          transform: [{ translateY }, { scale }, { rotate: rotateDeg }],
        }}
      >
        <MaterialCommunityIcons
          name="arm-flex"
          size={44}
          color={theme.accent}
        />
      </Animated.View>
    </View>
  )
}
