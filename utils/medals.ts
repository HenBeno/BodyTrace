import type { Entry } from "@/types"
import { toKilograms } from "@/utils/measurements"

export type MedalTier = "bronze" | "silver" | "gold"
export type MedalFamily = "streak" | "checkins" | "weightLoss" | "fullCapture"

export interface MedalDefinition {
  id: string
  family: MedalFamily
  title: string
  description: string
  actionText: string
  tier: MedalTier
  target: number
}

export interface MedalProgress extends MedalDefinition {
  current: number
  progress: number
  remaining: number
  unlocked: boolean
}

export interface MedalsSnapshot {
  medals: MedalProgress[]
  unlockedCount: number
  totalCount: number
  nextMedal: MedalProgress | null
  metrics: {
    currentStreakDays: number
    totalCheckins: number
    fullCaptureCheckins: number
    bestWeightLossKg: number
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

export const MEDAL_DEFINITIONS: MedalDefinition[] = [
  {
    id: "streak_bronze",
    family: "streak",
    title: "Momentum Starter",
    description: "Keep a 3-day check-in streak.",
    actionText: "Add one check-in per day for 3 days.",
    tier: "bronze",
    target: 3,
  },
  {
    id: "streak_silver",
    family: "streak",
    title: "Rhythm Builder",
    description: "Reach a 7-day streak.",
    actionText: "Stay consistent and check in daily for a full week.",
    tier: "silver",
    target: 7,
  },
  {
    id: "streak_gold",
    family: "streak",
    title: "Unstoppable Chain",
    description: "Hold a 14-day streak.",
    actionText: "Lock in 14 consecutive days of progress.",
    tier: "gold",
    target: 14,
  },
  {
    id: "checkins_bronze",
    family: "checkins",
    title: "First Step",
    description: "Complete your first check-in.",
    actionText: "Capture your first progress checkpoint.",
    tier: "bronze",
    target: 1,
  },
  {
    id: "checkins_silver",
    family: "checkins",
    title: "Habits in Motion",
    description: "Complete 10 total check-ins.",
    actionText: "Keep logging to reach 10 check-ins.",
    tier: "silver",
    target: 10,
  },
  {
    id: "checkins_gold",
    family: "checkins",
    title: "Relentless Tracker",
    description: "Complete 25 total check-ins.",
    actionText: "Push to 25 check-ins for elite consistency.",
    tier: "gold",
    target: 25,
  },
  {
    id: "weight_bronze",
    family: "weightLoss",
    title: "Scale Shift",
    description: "Lose 1 kg (2.2 lb) from your baseline.",
    actionText: "Log weight consistently to unlock your first drop.",
    tier: "bronze",
    target: 1,
  },
  {
    id: "weight_silver",
    family: "weightLoss",
    title: "Body Recomposition",
    description: "Lose 3 kg (6.6 lb) from your baseline.",
    actionText: "Aim for a 3 kg net drop from your starting point.",
    tier: "silver",
    target: 3,
  },
  {
    id: "weight_gold",
    family: "weightLoss",
    title: "Transformation Arc",
    description: "Lose 5 kg (11 lb) from your baseline.",
    actionText: "Stay patient and stack small weekly wins.",
    tier: "gold",
    target: 5,
  },
  {
    id: "capture_bronze",
    family: "fullCapture",
    title: "Full Frame",
    description: "Complete 1 full-angle check-in (front, side, back).",
    actionText: "Capture all 3 angles in one session.",
    tier: "bronze",
    target: 1,
  },
  {
    id: "capture_silver",
    family: "fullCapture",
    title: "360 Discipline",
    description: "Complete 5 full-angle check-ins.",
    actionText: "Repeat all-angle capture 5 times.",
    tier: "silver",
    target: 5,
  },
  {
    id: "capture_gold",
    family: "fullCapture",
    title: "Complete Story",
    description: "Complete 12 full-angle check-ins.",
    actionText: "Build a full visual history with 12 complete captures.",
    tier: "gold",
    target: 12,
  },
]

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function getConsecutiveDayStreak(dates: Date[]) {
  if (dates.length === 0) return 0
  const unique = Array.from(new Set(dates.map(startOfDay))).sort((a, b) => b - a)
  let streak = 1
  for (let i = 1; i < unique.length; i += 1) {
    const diff = unique[i - 1] - unique[i]
    if (diff === DAY_MS) {
      streak += 1
    } else {
      break
    }
  }
  return streak
}

function getBestWeightLossKg(entries: Entry[]) {
  const byDateAsc = [...entries].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  )
  const weights = byDateAsc
    .map((entry) => entry.measurements.weight)
    .filter((weight): weight is NonNullable<Entry["measurements"]["weight"]> =>
      Boolean(weight),
    )
    .map((weight) => toKilograms(weight))

  if (weights.length < 2) return 0
  const baseline = weights[0]
  const minimumWeight = Math.min(...weights)
  return Math.max(0, baseline - minimumWeight)
}

function getFullCaptureCount(entries: Entry[]) {
  return entries.reduce((count, entry) => {
    const hasFront = Boolean(entry.photos.front)
    const hasSide = Boolean(entry.photos.side)
    const hasBack = Boolean(entry.photos.back)
    return hasFront && hasSide && hasBack ? count + 1 : count
  }, 0)
}

function metricForFamily(
  family: MedalFamily,
  metrics: MedalsSnapshot["metrics"],
): number {
  if (family === "streak") return metrics.currentStreakDays
  if (family === "checkins") return metrics.totalCheckins
  if (family === "fullCapture") return metrics.fullCaptureCheckins
  return metrics.bestWeightLossKg
}

function toProgressValue(current: number, target: number) {
  if (target <= 0) return 1
  return Math.max(0, Math.min(1, current / target))
}

export function computeMedalsProgress(
  entries: Entry[],
  definitions: MedalDefinition[] = MEDAL_DEFINITIONS,
): MedalsSnapshot {
  const metrics = {
    currentStreakDays: getConsecutiveDayStreak(entries.map((entry) => entry.createdAt)),
    totalCheckins: entries.length,
    fullCaptureCheckins: getFullCaptureCount(entries),
    bestWeightLossKg: getBestWeightLossKg(entries),
  }

  const medals = definitions.map((definition) => {
    const current = metricForFamily(definition.family, metrics)
    const unlocked = current >= definition.target
    const remaining = unlocked ? 0 : Math.max(0, definition.target - current)
    return {
      ...definition,
      current,
      progress: toProgressValue(current, definition.target),
      remaining,
      unlocked,
    }
  })

  const nextMedal =
    medals
      .filter((medal) => !medal.unlocked)
      .sort((a, b) => {
        if (b.progress !== a.progress) return b.progress - a.progress
        return a.remaining - b.remaining
      })[0] ?? null

  const unlockedCount = medals.filter((medal) => medal.unlocked).length

  return {
    medals,
    unlockedCount,
    totalCount: medals.length,
    nextMedal,
    metrics,
  }
}
