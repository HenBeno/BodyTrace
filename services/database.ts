import * as SQLite from "expo-sqlite"

import type {
  AppSettings,
  CircumferenceMeasure,
  Entry,
  PhotoAngle,
  ProfileSex,
  ReminderMode,
  UserGoals,
  UserMilestoneGoal,
  UserProfile,
  WeightMeasure,
} from "@/types"

import { deleteEntryMediaFolder } from "@/services/mediaStore"
import { getPhotoOriginalUri } from "@/utils/photos"

import { ensureDeviceSecret, ensurePhotoEncryptionKey } from "./encryption"
function serializePhotoCell(photo: Entry["photos"][PhotoAngle]): string {
  if (!photo) return ""
  return typeof photo === "string" ? photo : JSON.stringify(photo)
}

function parsePhotoCell(
  raw: string,
): Entry["photos"][PhotoAngle] | undefined {
  if (!raw) return undefined
  if (!raw.startsWith("{")) return raw
  try {
    const parsed = JSON.parse(raw) as {
      originalEncUri?: unknown
      thumbEncUri?: unknown
    }
    if (typeof parsed.originalEncUri !== "string" || !parsed.originalEncUri) {
      return raw
    }
    return {
      originalEncUri: parsed.originalEncUri,
      thumbEncUri:
        typeof parsed.thumbEncUri === "string" ? parsed.thumbEncUri : undefined,
    }
  } catch {
    return raw
  }
}


let dbInstance: SQLite.SQLiteDatabase | null = null
let initOnce: Promise<void> | null = null

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("bodytrace.db")
  }
  return dbInstance
}

async function initSchema(): Promise<void> {
  const db = await getDb()
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL,
      photo_front TEXT NOT NULL,
      photo_side TEXT NOT NULL,
      photo_back TEXT NOT NULL,
      measurements_json TEXT NOT NULL,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `)
}

/** Removes rows left from an older build that shipped bundled / remote demo photos. */
async function pruneLegacyDemoEntries(): Promise<void> {
  const db = await getDb()
  const pattern = "%picsum.photos%"
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM entries WHERE photo_front LIKE ? OR photo_side LIKE ? OR photo_back LIKE ?`,
    [pattern, pattern, pattern],
  )
  for (const { id } of rows) {
    await deleteEntryMediaFolder(id).catch(() => undefined)
  }
  if (rows.length > 0) {
    await db.runAsync(
      `DELETE FROM entries WHERE photo_front LIKE ? OR photo_side LIKE ? OR photo_back LIKE ?`,
      [pattern, pattern, pattern],
    )
  }
}

async function insertEntryInternal(
  db: SQLite.SQLiteDatabase,
  entry: Entry,
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO entries (id, created_at, photo_front, photo_side, photo_back, measurements_json, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.createdAt.getTime(),
      serializePhotoCell(
        entry.photos.front ??
          (getPhotoOriginalUri(entry.photos, "front") ?? undefined),
      ),
      serializePhotoCell(
        entry.photos.side ??
          (getPhotoOriginalUri(entry.photos, "side") ?? undefined),
      ),
      serializePhotoCell(
        entry.photos.back ??
          (getPhotoOriginalUri(entry.photos, "back") ?? undefined),
      ),
      JSON.stringify(entry.measurements),
      entry.notes ?? null,
    ],
  )
}

/** One-time schema and device secrets. */
export function ensureInitialized(): Promise<void> {
  if (!initOnce) {
    initOnce = (async () => {
      await initSchema()
      try {
        await ensureDeviceSecret()
      } catch {
        // SecureStore unsupported (e.g. some web environments).
      }
      try {
        await ensurePhotoEncryptionKey()
      } catch {
        // Same as above.
      }
      await pruneLegacyDemoEntries()
    })()
  }
  return initOnce
}

interface EntryRow {
  id: string
  created_at: number
  photo_front: string
  photo_side: string
  photo_back: string
  measurements_json: string
  notes: string | null
}

function parseCirc(
  src: Record<string, unknown>,
  key: string,
): CircumferenceMeasure | undefined {
  const raw = src[key]
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { value: raw, unit: "inch" }
  }
  if (raw && typeof raw === "object" && "value" in raw) {
    const o = raw as unknown as { value: unknown; unit?: unknown }
    const { value, unit } = o
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      (unit === "cm" || unit === "inch")
    ) {
      return { value, unit }
    }
  }
  return undefined
}

function parseWeight(src: Record<string, unknown>): WeightMeasure | undefined {
  const raw = src.weight
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return { value: raw, unit: "lb" }
  }
  if (raw && typeof raw === "object" && "value" in raw) {
    const o = raw as unknown as { value: unknown; unit?: unknown }
    const { value, unit } = o
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      (unit === "kg" || unit === "lb")
    ) {
      return { value, unit }
    }
  }
  return undefined
}

/** Legacy JSON: plain numbers (inch / lb), optional `{ value, unit }`, merged limb keys. */
function normalizeMeasurements(raw: unknown): Entry["measurements"] {
  const src =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const out: Entry["measurements"] = {}

  const neck = parseCirc(src, "neck")
  if (neck) out.neck = neck
  const chest = parseCirc(src, "chest")
  if (chest) out.chest = chest
  const waist = parseCirc(src, "waist")
  if (waist) out.waist = waist
  const hips = parseCirc(src, "hips")
  if (hips) out.hips = hips

  let arm =
    parseCirc(src, "arm") ??
    parseCirc(src, "leftArm") ??
    parseCirc(src, "rightArm")
  if (arm) out.arm = arm

  let thigh =
    parseCirc(src, "thigh") ??
    parseCirc(src, "leftThigh") ??
    parseCirc(src, "rightThigh")
  if (thigh) out.thigh = thigh

  const weight = parseWeight(src)
  if (weight) out.weight = weight

  return out
}

function rowToEntry(r: EntryRow): Entry {
  const photos: Entry["photos"] = {}
  const front = parsePhotoCell(r.photo_front)
  const side = parsePhotoCell(r.photo_side)
  const back = parsePhotoCell(r.photo_back)
  if (front) photos.front = front
  if (side) photos.side = side
  if (back) photos.back = back
  return {
    id: r.id,
    createdAt: new Date(r.created_at),
    photos,
    measurements: normalizeMeasurements(JSON.parse(r.measurements_json)),
    notes: r.notes ?? undefined,
  }
}

export async function loadAllEntries(): Promise<Entry[]> {
  await ensureInitialized()
  const db = await getDb()
  const rows = await db.getAllAsync<EntryRow>(
    "SELECT * FROM entries ORDER BY created_at DESC",
    [],
  )
  return rows.map(rowToEntry)
}

export async function insertEntry(entry: Entry): Promise<void> {
  await ensureInitialized()
  const db = await getDb()
  await insertEntryInternal(db, entry)
}

export async function deleteEntryById(id: string): Promise<void> {
  await ensureInitialized()
  const db = await getDb()
  await db.runAsync("DELETE FROM entries WHERE id = ?", [id])
}

const DEFAULT_SETTINGS: AppSettings = {
  reminderEnabled: false,
  reminderMode: "weeklyDays",
  reminderTime: { hour: 9, minute: 0 },
  weeklyDays: [1],
  monthlyDate: 1,
  everyXHours: 4,
  countPerDay: 2,
  biometricEnabled: false,
  profile: {
    fullName: "",
  },
  goals: {
    circumferenceTargetsCm: {},
    habitCheckinsPerWeek: 3,
    habitStreakDays: 7,
    milestones: [],
  },
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

function parseReminderMode(raw: string | undefined): ReminderMode | null {
  if (
    raw === "daily" ||
    raw === "everyXHours" ||
    raw === "weeklyDays" ||
    raw === "monthlyDate" ||
    raw === "countPerDay"
  ) {
    return raw
  }
  return null
}

function parseWeeklyDays(raw: string | undefined): number[] {
  if (!raw) return [...DEFAULT_SETTINGS.weeklyDays]
  const days = [
    ...new Set(raw.split(",").map((part) => clamp(Number(part), 0, 6))),
  ].sort((a, b) => a - b)
  return days.length > 0 ? days : [...DEFAULT_SETTINGS.weeklyDays]
}

function parseProfile(raw: string | undefined): UserProfile {
  if (!raw) return { ...DEFAULT_SETTINGS.profile }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const sexRaw = parsed.sex
    const sex: ProfileSex | undefined =
      sexRaw === "male" || sexRaw === "female" || sexRaw === "other"
        ? sexRaw
        : undefined
    const asNumber = (value: unknown) =>
      typeof value === "number" && Number.isFinite(value) ? value : undefined
    const clampOptional = (value: number | undefined, min: number, max: number) =>
      typeof value === "number" ? clamp(value, min, max) : undefined
    return {
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      age: clampOptional(asNumber(parsed.age), 13, 120),
      sex,
      heightCm: clampOptional(asNumber(parsed.heightCm), 90, 260),
      bodyFatPercent: clampOptional(asNumber(parsed.bodyFatPercent), 2, 80),
    }
  } catch {
    return { ...DEFAULT_SETTINGS.profile }
  }
}

function normalizeMilestones(raw: unknown): UserMilestoneGoal[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null
      const rec = item as Record<string, unknown>
      const title = typeof rec.title === "string" ? rec.title.trim() : ""
      if (!title) return null
      return {
        id:
          typeof rec.id === "string" && rec.id.length > 0
            ? rec.id
            : `m-${index + 1}`,
        title,
        targetDate:
          typeof rec.targetDate === "string" && rec.targetDate.length > 0
            ? rec.targetDate
            : undefined,
        completed: rec.completed === true,
      }
    })
    .filter((goal): goal is UserMilestoneGoal => Boolean(goal))
}

function parseGoals(raw: string | undefined): UserGoals {
  if (!raw) return { ...DEFAULT_SETTINGS.goals }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const rawTargets =
      parsed.circumferenceTargetsCm &&
      typeof parsed.circumferenceTargetsCm === "object"
        ? (parsed.circumferenceTargetsCm as Record<string, unknown>)
        : {}
    const keys = ["neck", "chest", "waist", "hips", "arm", "thigh"] as const
    const circumferenceTargetsCm: UserGoals["circumferenceTargetsCm"] = {}
    for (const key of keys) {
      const value = rawTargets[key]
      if (typeof value === "number" && Number.isFinite(value)) {
        circumferenceTargetsCm[key] = clamp(value, 20, 300)
      }
    }
    const targetWeightKg =
      typeof parsed.targetWeightKg === "number" &&
      Number.isFinite(parsed.targetWeightKg)
        ? clamp(parsed.targetWeightKg, 25, 350)
        : undefined
    const targetBodyFatPercent =
      typeof parsed.targetBodyFatPercent === "number" &&
      Number.isFinite(parsed.targetBodyFatPercent)
        ? clamp(parsed.targetBodyFatPercent, 2, 80)
        : undefined
    return {
      targetWeightKg,
      targetBodyFatPercent,
      circumferenceTargetsCm,
      habitCheckinsPerWeek: clamp(
        typeof parsed.habitCheckinsPerWeek === "number"
          ? parsed.habitCheckinsPerWeek
          : DEFAULT_SETTINGS.goals.habitCheckinsPerWeek,
        1,
        21,
      ),
      habitStreakDays: clamp(
        typeof parsed.habitStreakDays === "number"
          ? parsed.habitStreakDays
          : DEFAULT_SETTINGS.goals.habitStreakDays,
        1,
        60,
      ),
      milestones: normalizeMilestones(parsed.milestones),
    }
  } catch {
    return { ...DEFAULT_SETTINGS.goals }
  }
}

export async function loadAppSettings(): Promise<AppSettings> {
  await ensureInitialized()
  const db = await getDb()
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM app_settings",
    [],
  )
  if (rows.length === 0) return { ...DEFAULT_SETTINGS }
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  const legacyFrequency = map.frequency === "monthly" ? "monthly" : "weekly"
  const legacyReminderDay =
    legacyFrequency === "monthly"
      ? clamp(Number(map.reminderDay ?? DEFAULT_SETTINGS.monthlyDate), 1, 28)
      : clamp(Number(map.reminderDay ?? DEFAULT_SETTINGS.weeklyDays[0]), 0, 6)
  const reminderMode =
    parseReminderMode(map.reminderMode) ??
    (legacyFrequency === "monthly" ? "monthlyDate" : "weeklyDays")
  return {
    reminderEnabled: map.reminderEnabled === "1",
    reminderMode,
    reminderTime: {
      hour: clamp(
        Number(map.reminderHour ?? DEFAULT_SETTINGS.reminderTime.hour),
        0,
        23,
      ),
      minute: clamp(
        Number(map.reminderMinute ?? DEFAULT_SETTINGS.reminderTime.minute),
        0,
        59,
      ),
    },
    weeklyDays: map.weeklyDays
      ? parseWeeklyDays(map.weeklyDays)
      : [
          legacyFrequency === "weekly"
            ? legacyReminderDay
            : DEFAULT_SETTINGS.weeklyDays[0],
        ],
    monthlyDate: clamp(
      Number(
        map.monthlyDate ??
          (legacyFrequency === "monthly"
            ? legacyReminderDay
            : DEFAULT_SETTINGS.monthlyDate),
      ),
      1,
      28,
    ),
    everyXHours: clamp(
      Number(map.everyXHours ?? DEFAULT_SETTINGS.everyXHours),
      1,
      23,
    ),
    countPerDay: clamp(
      Number(map.countPerDay ?? DEFAULT_SETTINGS.countPerDay),
      1,
      6,
    ),
    biometricEnabled: map.biometricEnabled === "1",
    profile: parseProfile(map.profileJson),
    goals: parseGoals(map.goalsJson),
  }
}

async function upsertSetting(
  db: SQLite.SQLiteDatabase,
  key: string,
  value: string,
): Promise<void> {
  await db.runAsync(
    "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
    [key, value],
  )
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await ensureInitialized()
  const db = await getDb()
  await upsertSetting(
    db,
    "reminderEnabled",
    settings.reminderEnabled ? "1" : "0",
  )
  await upsertSetting(db, "reminderMode", settings.reminderMode)
  await upsertSetting(
    db,
    "reminderHour",
    String(clamp(settings.reminderTime.hour, 0, 23)),
  )
  await upsertSetting(
    db,
    "reminderMinute",
    String(clamp(settings.reminderTime.minute, 0, 59)),
  )
  const weeklyDays = [
    ...new Set(settings.weeklyDays.map((day) => clamp(day, 0, 6))),
  ].sort((a, b) => a - b)
  await upsertSetting(
    db,
    "weeklyDays",
    (weeklyDays.length > 0 ? weeklyDays : DEFAULT_SETTINGS.weeklyDays)
      .map(String)
      .join(","),
  )
  await upsertSetting(
    db,
    "monthlyDate",
    String(clamp(settings.monthlyDate, 1, 28)),
  )
  await upsertSetting(
    db,
    "everyXHours",
    String(clamp(settings.everyXHours, 1, 23)),
  )
  await upsertSetting(
    db,
    "countPerDay",
    String(clamp(settings.countPerDay, 1, 6)),
  )
  // Keep legacy keys for forward compatibility with older app builds.
  const legacyFrequency =
    settings.reminderMode === "monthlyDate" ? "monthly" : "weekly"
  const legacyReminderDay =
    legacyFrequency === "monthly"
      ? clamp(settings.monthlyDate, 1, 28)
      : clamp(
          (weeklyDays.length > 0
            ? weeklyDays[0]
            : DEFAULT_SETTINGS.weeklyDays[0]) ?? 1,
          0,
          6,
        )
  await upsertSetting(db, "frequency", legacyFrequency)
  await upsertSetting(db, "reminderDay", String(legacyReminderDay))
  await upsertSetting(
    db,
    "biometricEnabled",
    settings.biometricEnabled ? "1" : "0",
  )
  const normalizedProfile: UserProfile = {
    fullName: settings.profile.fullName.trim(),
    age:
      typeof settings.profile.age === "number"
        ? clamp(settings.profile.age, 13, 120)
        : undefined,
    sex: settings.profile.sex,
    heightCm:
      typeof settings.profile.heightCm === "number"
        ? clamp(settings.profile.heightCm, 90, 260)
        : undefined,
    bodyFatPercent:
      typeof settings.profile.bodyFatPercent === "number"
        ? clamp(settings.profile.bodyFatPercent, 2, 80)
        : undefined,
  }
  const normalizedGoals: UserGoals = {
    targetWeightKg:
      typeof settings.goals.targetWeightKg === "number"
        ? clamp(settings.goals.targetWeightKg, 25, 350)
        : undefined,
    targetBodyFatPercent:
      typeof settings.goals.targetBodyFatPercent === "number"
        ? clamp(settings.goals.targetBodyFatPercent, 2, 80)
        : undefined,
    circumferenceTargetsCm: Object.fromEntries(
      Object.entries(settings.goals.circumferenceTargetsCm).filter(
        ([, value]) => typeof value === "number" && Number.isFinite(value),
      ),
    ) as UserGoals["circumferenceTargetsCm"],
    habitCheckinsPerWeek: clamp(settings.goals.habitCheckinsPerWeek, 1, 21),
    habitStreakDays: clamp(settings.goals.habitStreakDays, 1, 60),
    milestones: settings.goals.milestones
      .map((milestone, index) => ({
        id: milestone.id || `m-${index + 1}`,
        title: milestone.title.trim(),
        targetDate: milestone.targetDate?.trim() || undefined,
        completed: Boolean(milestone.completed),
      }))
      .filter((milestone) => milestone.title.length > 0),
  }
  await upsertSetting(db, "profileJson", JSON.stringify(normalizedProfile))
  await upsertSetting(db, "goalsJson", JSON.stringify(normalizedGoals))
}
