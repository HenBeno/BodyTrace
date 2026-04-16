import * as SQLite from 'expo-sqlite';

import type { AppSettings, CircumferenceMeasure, Entry, PhotoAngle, WeightMeasure } from '@/types';

import { deleteEntryMediaFolder } from '@/services/mediaStore';

import { ensureDeviceSecret, ensurePhotoEncryptionKey } from './encryption';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initOnce: Promise<void> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('bodytrace.db');
  }
  return dbInstance;
}

async function initSchema(): Promise<void> {
  const db = await getDb();
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
  `);
}

/** Removes rows left from an older build that shipped bundled / remote demo photos. */
async function pruneLegacyDemoEntries(): Promise<void> {
  const db = await getDb();
  const pattern = '%picsum.photos%';
  const rows = await db.getAllAsync<{ id: string }>(
    `SELECT id FROM entries WHERE photo_front LIKE ? OR photo_side LIKE ? OR photo_back LIKE ?`,
    [pattern, pattern, pattern],
  );
  for (const { id } of rows) {
    await deleteEntryMediaFolder(id).catch(() => undefined);
  }
  if (rows.length > 0) {
    await db.runAsync(
      `DELETE FROM entries WHERE photo_front LIKE ? OR photo_side LIKE ? OR photo_back LIKE ?`,
      [pattern, pattern, pattern],
    );
  }
}

async function insertEntryInternal(db: SQLite.SQLiteDatabase, entry: Entry): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO entries (id, created_at, photo_front, photo_side, photo_back, measurements_json, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.createdAt.getTime(),
      entry.photos.front ?? '',
      entry.photos.side ?? '',
      entry.photos.back ?? '',
      JSON.stringify(entry.measurements),
      entry.notes ?? null,
    ],
  );
}

/** One-time schema and device secrets. */
export function ensureInitialized(): Promise<void> {
  if (!initOnce) {
    initOnce = (async () => {
      await initSchema();
      try {
        await ensureDeviceSecret();
      } catch {
        // SecureStore unsupported (e.g. some web environments).
      }
      try {
        await ensurePhotoEncryptionKey();
      } catch {
        // Same as above.
      }
      await pruneLegacyDemoEntries();
    })();
  }
  return initOnce;
}

interface EntryRow {
  id: string;
  created_at: number;
  photo_front: string;
  photo_side: string;
  photo_back: string;
  measurements_json: string;
  notes: string | null;
}

function parseCirc(src: Record<string, unknown>, key: string): CircumferenceMeasure | undefined {
  const raw = src[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { value: raw, unit: 'inch' };
  }
  if (raw && typeof raw === 'object' && 'value' in raw) {
    const o = raw as unknown as { value: unknown; unit?: unknown };
    const { value, unit } = o;
    if (typeof value === 'number' && Number.isFinite(value) && (unit === 'cm' || unit === 'inch')) {
      return { value, unit };
    }
  }
  return undefined;
}

function parseWeight(src: Record<string, unknown>): WeightMeasure | undefined {
  const raw = src.weight;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { value: raw, unit: 'lb' };
  }
  if (raw && typeof raw === 'object' && 'value' in raw) {
    const o = raw as unknown as { value: unknown; unit?: unknown };
    const { value, unit } = o;
    if (typeof value === 'number' && Number.isFinite(value) && (unit === 'kg' || unit === 'lb')) {
      return { value, unit };
    }
  }
  return undefined;
}

/** Legacy JSON: plain numbers (inch / lb), optional `{ value, unit }`, merged limb keys. */
function normalizeMeasurements(raw: unknown): Entry['measurements'] {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out: Entry['measurements'] = {};

  const neck = parseCirc(src, 'neck');
  if (neck) out.neck = neck;
  const chest = parseCirc(src, 'chest');
  if (chest) out.chest = chest;
  const waist = parseCirc(src, 'waist');
  if (waist) out.waist = waist;
  const hips = parseCirc(src, 'hips');
  if (hips) out.hips = hips;

  let arm = parseCirc(src, 'arm') ?? parseCirc(src, 'leftArm') ?? parseCirc(src, 'rightArm');
  if (arm) out.arm = arm;

  let thigh = parseCirc(src, 'thigh') ?? parseCirc(src, 'leftThigh') ?? parseCirc(src, 'rightThigh');
  if (thigh) out.thigh = thigh;

  const weight = parseWeight(src);
  if (weight) out.weight = weight;

  return out;
}

function rowToEntry(r: EntryRow): Entry {
  const photos: Partial<Record<PhotoAngle, string>> = {};
  if (r.photo_front) photos.front = r.photo_front;
  if (r.photo_side) photos.side = r.photo_side;
  if (r.photo_back) photos.back = r.photo_back;
  return {
    id: r.id,
    createdAt: new Date(r.created_at),
    photos,
    measurements: normalizeMeasurements(JSON.parse(r.measurements_json)),
    notes: r.notes ?? undefined,
  };
}

export async function loadAllEntries(): Promise<Entry[]> {
  await ensureInitialized();
  const db = await getDb();
  const rows = await db.getAllAsync<EntryRow>('SELECT * FROM entries ORDER BY created_at DESC', []);
  return rows.map(rowToEntry);
}

export async function insertEntry(entry: Entry): Promise<void> {
  await ensureInitialized();
  const db = await getDb();
  await insertEntryInternal(db, entry);
}

export async function deleteEntryById(id: string): Promise<void> {
  await ensureInitialized();
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?', [id]);
}

const DEFAULT_SETTINGS: AppSettings = {
  frequency: 'weekly',
  reminderEnabled: false,
  reminderDay: 0,
  biometricEnabled: false,
};

export async function loadAppSettings(): Promise<AppSettings> {
  await ensureInitialized();
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM app_settings', []);
  if (rows.length === 0) return { ...DEFAULT_SETTINGS };
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    frequency: map.frequency === 'monthly' ? 'monthly' : 'weekly',
    reminderEnabled: map.reminderEnabled === '1',
    reminderDay: Number(map.reminderDay ?? 0) || 0,
    biometricEnabled: map.biometricEnabled === '1',
  };
}

async function upsertSetting(db: SQLite.SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await ensureInitialized();
  const db = await getDb();
  await upsertSetting(db, 'frequency', settings.frequency);
  await upsertSetting(db, 'reminderEnabled', settings.reminderEnabled ? '1' : '0');
  await upsertSetting(db, 'reminderDay', String(settings.reminderDay));
  await upsertSetting(db, 'biometricEnabled', settings.biometricEnabled ? '1' : '0');
}
