import * as Haptics from "expo-haptics"
import { Platform } from "react-native"

function run(promise: Promise<void>) {
  if (Platform.OS === "web") return
  void promise.catch(() => undefined)
}

/** Light tap on press-in (buttons, chips). */
export function lightImpact() {
  run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))
}

/** Toggles, segments, pickers. */
export function selection() {
  run(Haptics.selectionAsync())
}

/** Save succeeded, refresh completed. */
export function success() {
  run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
}

/** Errors, destructive confirmations. */
export function warning() {
  run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning))
}
