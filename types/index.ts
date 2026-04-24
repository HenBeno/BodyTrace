export type PhotoAngle = "front" | "side" | "back"

export type CircumferenceUnit = "cm" | "inch"
export type WeightUnit = "kg" | "lb"

export type CircumferenceMeasure = { value: number; unit: CircumferenceUnit }
export type WeightMeasure = { value: number; unit: WeightUnit }

export interface Entry {
  id: string
  createdAt: Date
  /** At least one angle should be present for a saved entry; others may be skipped. */
  photos: Partial<
    Record<
      PhotoAngle,
      | string
      | {
          originalEncUri: string
          thumbEncUri?: string
        }
    >
  >
  measurements: {
    neck?: CircumferenceMeasure
    chest?: CircumferenceMeasure
    waist?: CircumferenceMeasure
    hips?: CircumferenceMeasure
    arm?: CircumferenceMeasure
    thigh?: CircumferenceMeasure
    weight?: WeightMeasure
  }
  notes?: string
}

export type ReminderMode =
  | "daily"
  | "everyXHours"
  | "weeklyDays"
  | "monthlyDate"
  | "countPerDay"

export interface ReminderTime {
  hour: number
  minute: number
}

export type ProfileSex = "male" | "female" | "other"

export interface UserProfile {
  fullName: string
  age?: number
  sex?: ProfileSex
  heightCm?: number
  bodyFatPercent?: number
}

export interface UserMilestoneGoal {
  id: string
  title: string
  targetDate?: string
  completed: boolean
}

export interface UserGoals {
  targetWeightKg?: number
  targetBodyFatPercent?: number
  circumferenceTargetsCm: Partial<
    Record<Exclude<keyof Entry["measurements"], "weight">, number>
  >
  habitCheckinsPerWeek: number
  habitStreakDays: number
  milestones: UserMilestoneGoal[]
}

export interface AppSettings {
  reminderEnabled: boolean
  reminderMode: ReminderMode
  reminderTime: ReminderTime
  weeklyDays: number[]
  monthlyDate: number
  everyXHours: number
  countPerDay: number
  biometricEnabled: boolean
  profile: UserProfile
  goals: UserGoals
}
