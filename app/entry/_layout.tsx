import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

import { theme } from "@/utils/theme";

export default function EntryLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const bg = isDark ? theme.canvas : "#f8fafc";

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Timeline",
        headerTintColor: theme.accent,
        headerStyle: { backgroundColor: bg },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: bg },
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          color: isDark ? theme.primaryText : "#0f172a",
        },
      }}
    />
  );
}
