import { getSupabase } from "@/lib/supabase"
import type { UserProfile, UserProfileUpsert } from "@/types/profile"

interface ProfileRow {
  id: string
  first_name: string
  last_name: string
  weight_kg: number
  height_cm: number
  target_weight_kg: number
  cardio_sessions_per_week: number | null
  strength_sessions_per_week: number | null
  circumferences_json: unknown
  body_fat_percent: number | null
  onboarding_completed: boolean
  updated_at: string | null
}

function parseCircumferences(raw: unknown): UserProfile["circumferences"] {
  if (!raw || typeof raw !== "object") return null
  return raw as UserProfile["circumferences"]
}

export function rowToProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    weightKg: Number(row.weight_kg),
    heightCm: Number(row.height_cm),
    targetWeightKg: Number(row.target_weight_kg),
    cardioSessionsPerWeek:
      row.cardio_sessions_per_week == null
        ? null
        : Number(row.cardio_sessions_per_week),
    strengthSessionsPerWeek:
      row.strength_sessions_per_week == null
        ? null
        : Number(row.strength_sessions_per_week),
    circumferences: parseCircumferences(row.circumferences_json),
    bodyFatPercent:
      row.body_fat_percent == null ? null : Number(row.body_fat_percent),
    onboardingCompleted: Boolean(row.onboarding_completed),
    updatedAt: row.updated_at,
  }
}

export async function fetchProfileForUser(
  userId: string,
): Promise<UserProfile | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return rowToProfile(data as ProfileRow)
}

export async function upsertProfile(
  userId: string,
  input: UserProfileUpsert,
): Promise<void> {
  const supabase = getSupabase()
  const payload = {
    id: userId,
    first_name: input.firstName,
    last_name: input.lastName,
    weight_kg: input.weightKg,
    height_cm: input.heightCm,
    target_weight_kg: input.targetWeightKg,
    cardio_sessions_per_week: input.cardioSessionsPerWeek ?? null,
    strength_sessions_per_week: input.strengthSessionsPerWeek ?? null,
    circumferences_json: input.circumferences ?? null,
    body_fat_percent: input.bodyFatPercent ?? null,
    onboarding_completed: input.onboardingCompleted,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id",
  })
  if (error) throw error
}
