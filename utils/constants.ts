export const APP_NAME = "BodyTrace"

export const MEASUREMENT_LABELS = [
  { key: "neck" as const, label: "Neck" },
  { key: "chest" as const, label: "Chest" },
  { key: "waist" as const, label: "Waist" },
  { key: "hips" as const, label: "Hips" },
  { key: "arm" as const, label: "Arm" },
  { key: "thigh" as const, label: "Thigh" },
  { key: "weight" as const, label: "Weight" },
] as const

/** Thumb-friendly grouped sections for measurement entry + detail screens */
export const MEASUREMENT_GROUPS = [
  { title: "Core", keys: ["chest", "waist", "hips"] as const },
  { title: "Limbs & neck", keys: ["neck", "arm", "thigh"] as const },
  { title: "Weight", keys: ["weight"] as const },
] as const
