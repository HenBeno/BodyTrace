import { Link } from "expo-router"
import { Plus, Sparkles } from "lucide-react-native"
import React from "react"
import { Text } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { TimelineList } from "@/components/timeline/TimelineList"
import { ListLoadingSkeleton } from "@/components/ui/ListLoadingSkeleton"
import { PressableScale } from "@/components/ui/PressableScale"
import { ScreenHeader } from "@/components/ui/ScreenHeader"
import { useEntries } from "@/contexts/EntriesContext"
import { APP_NAME } from "@/utils/constants"
import { theme } from "@/utils/theme"

export default function HomeScreen() {
  const { entries, ready } = useEntries()

  const header = (
    <ScreenHeader
      eyebrow="Your journey"
      title={APP_NAME}
      subtitle="Your photos are the hero — private and on-device. Tap New when you are ready to capture."
      leftAccessory={<Sparkles size={26} color={theme.accent} />}
      right={
        <Link href="/entry/new" asChild>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="New entry"
            accessibilityHint="Opens the camera flow to add a timeline checkpoint"
            className="flex-row items-center gap-1.5 rounded-2xl bg-accent px-3.5 py-2.5"
          >
            <Plus size={18} color={theme.canvas} />
            <Text className="font-inter-semibold text-sm text-canvas">New</Text>
          </PressableScale>
        </Link>
      }
    />
  )

  if (!ready) {
    return (
      <SafeAreaView
        className="flex-1 bg-slate-50 dark:bg-canvas"
        edges={["top"]}
      >
        <ListLoadingSkeleton rows={3} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-canvas" edges={["top"]}>
      <TimelineList entries={entries} ListHeaderComponent={header} />
    </SafeAreaView>
  )
}
