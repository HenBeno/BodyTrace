import type { Entry } from "@/types"

/** Optional body circumferences stored on the user profile (same shape as entry measurements). */
export type ProfileCircumferences = Partial<
  Pick<
    Entry["measurements"],
    "neck" | "chest" | "waist" | "hips" | "arm" | "thigh"
  >
>

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  weightKg: number
  heightCm: number
  targetWeightKg: number
  cardioSessionsPerWeek: number | null
  strengthSessionsPerWeek: number | null
  circumferences: ProfileCircumferences | null
  bodyFatPercent: number | null
  onboardingCompleted: boolean
  updatedAt: string | null
}

export interface UserProfileUpsert {
  firstName: string
  lastName: string
  weightKg: number
  heightCm: number
  targetWeightKg: number
  cardioSessionsPerWeek?: number | null
  strengthSessionsPerWeek?: number | null
  circumferences?: ProfileCircumferences | null
  bodyFatPercent?: number | null
  onboardingCompleted: boolean
}
