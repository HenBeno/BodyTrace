import AsyncStorage from "@react-native-async-storage/async-storage"
import * as FileSystem from "expo-file-system/legacy"
import { Platform } from "react-native"

import { isSupabaseConfigured } from "@/lib/env"
import { getSupabase } from "@/lib/supabase"
import { insertEntry, loadAllEntries } from "@/services/database"
import { resolvePhotoUriForDisplay } from "@/services/encryption"
import { persistEntryPhotos } from "@/services/mediaStore"
import {
  enqueueJournalSyncItem,
  readJournalSyncQueue,
  saveJournalSyncQueue,
} from "@/services/syncQueue"
import type { Entry, PhotoAngle } from "@/types"
import { getPhotoOriginalUri } from "@/utils/photos"

export const ENTRY_PHOTOS_BUCKET = "entry-photos"

const ANGLES: PhotoAngle[] = ["front", "side", "back"]

const APPLIED_REMOTE_META_KEY = "bodytrace:journalRemoteApplied:v1"

export interface JournalEntryRow {
  id: string
  user_id: string
  created_at: string
  measurements: Entry["measurements"]
  notes: string | null
  updated_at: string
  photo_paths: Partial<Record<PhotoAngle, string>>
}

async function readAppliedRemoteMap(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(APPLIED_REMOTE_META_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

async function writeAppliedRemoteMap(
  map: Record<string, string>,
): Promise<void> {
  await AsyncStorage.setItem(APPLIED_REMOTE_META_KEY, JSON.stringify(map))
}

async function markRemoteApplied(id: string, updatedAt: string): Promise<void> {
  const map = await readAppliedRemoteMap()
  map[id] = updatedAt
  await writeAppliedRemoteMap(map)
}

export async function clearJournalRemoteApplied(id: string): Promise<void> {
  const map = await readAppliedRemoteMap()
  delete map[id]
  await writeAppliedRemoteMap(map)
}

function storageObjectPath(
  userId: string,
  entryId: string,
  angle: PhotoAngle,
): string {
  return `${userId}/${entryId}/${angle}.jpg`
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = globalThis.atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function uploadJpegToStorage(
  objectPath: string,
  jpegFileUri: string,
): Promise<void> {
  const supabase = getSupabase()
  const b64 = await FileSystem.readAsStringAsync(jpegFileUri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  const body = base64ToUint8Array(b64)
  const { error } = await supabase.storage
    .from(ENTRY_PHOTOS_BUCKET)
    .upload(objectPath, body, {
      contentType: "image/jpeg",
      upsert: true,
    })
  if (error) throw error
}

async function writeBlobToTempJpeg(blob: Blob, key: string): Promise<string> {
  const ab = await blob.arrayBuffer()
  const bytes = new Uint8Array(ab)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  const b64 = globalThis.btoa(binary)
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory
  if (!base) {
    throw new Error("No writable cache directory")
  }
  const out = `${base}bodytrace-pull-${key.replace(/[^\w.-]+/g, "_")}.jpg`
  await FileSystem.writeAsStringAsync(out, b64, {
    encoding: FileSystem.EncodingType.Base64,
  })
  return out
}

export async function listRemoteJournalEntries(
  userId: string,
): Promise<JournalEntryRow[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as JournalEntryRow[]
}

export async function pushJournalEntryToRemote(
  userId: string,
  entry: Entry,
): Promise<void> {
  if (!isSupabaseConfigured) return
  const supabase = getSupabase()
  const photo_paths: Partial<Record<PhotoAngle, string>> = {}
  const nowIso = new Date().toISOString()

  for (const angle of ANGLES) {
    const uri = getPhotoOriginalUri(entry.photos, angle)
    if (!uri) continue
    const objectPath = storageObjectPath(userId, entry.id, angle)
    const sourceUri =
      uri.endsWith(".enc") || uri.endsWith(".ENC")
        ? await resolvePhotoUriForDisplay(uri)
        : uri
    await uploadJpegToStorage(objectPath, sourceUri)
    photo_paths[angle] = objectPath
  }

  const { error } = await supabase.from("journal_entries").upsert(
    {
      id: entry.id,
      user_id: userId,
      created_at: entry.createdAt.toISOString(),
      measurements: entry.measurements,
      notes: entry.notes ?? null,
      updated_at: nowIso,
      photo_paths,
    },
    { onConflict: "id" },
  )
  if (error) throw error
  await markRemoteApplied(entry.id, nowIso)
}

export async function deleteRemoteJournalEntry(
  userId: string,
  entryId: string,
): Promise<void> {
  if (!isSupabaseConfigured) return
  const supabase = getSupabase()
  const folder = `${userId}/${entryId}`
  const { data: listed, error: listError } = await supabase.storage
    .from(ENTRY_PHOTOS_BUCKET)
    .list(folder)
  if (listError) throw listError
  const paths = (listed ?? []).map((f) => `${folder}/${f.name}`)
  if (paths.length > 0) {
    const { error: rmError } = await supabase.storage
      .from(ENTRY_PHOTOS_BUCKET)
      .remove(paths)
    if (rmError) throw rmError
  }
  const { error } = await supabase
    .from("journal_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId)
  if (error) throw error
  await clearJournalRemoteApplied(entryId)
}

export async function applyRemoteJournalRowToLocal(
  row: JournalEntryRow,
): Promise<Entry> {
  const supabase = getSupabase()
  const paths = row.photo_paths ?? {}
  const photos: Entry["photos"] = {}

  for (const angle of ANGLES) {
    const p = paths[angle]
    if (!p) continue
    const { data, error } = await supabase.storage
      .from(ENTRY_PHOTOS_BUCKET)
      .download(p)
    if (error || !data) continue
    const tmp = await writeBlobToTempJpeg(data, `${row.id}-${angle}`)
    photos[angle] = tmp
  }

  const entry: Entry = {
    id: row.id,
    createdAt: new Date(row.created_at),
    measurements: (row.measurements ?? {}) as Entry["measurements"],
    notes: row.notes ?? undefined,
    photos,
  }

  const persisted = await persistEntryPhotos(entry.id, entry.photos)
  const saved: Entry = { ...entry, photos: persisted }
  await insertEntry(saved)
  await markRemoteApplied(row.id, row.updated_at)
  return saved
}

async function processPendingQueue(userId: string): Promise<void> {
  const pending = await readJournalSyncQueue()
  if (pending.length === 0) return
  const remaining: typeof pending = []
  for (const item of pending) {
    try {
      if (item.kind === "delete") {
        await deleteRemoteJournalEntry(userId, item.entryId)
      } else {
        const locals = await loadAllEntries()
        const found = locals.find((e) => e.id === item.entryId)
        if (found) await pushJournalEntryToRemote(userId, found)
      }
    } catch {
      remaining.push(item)
    }
  }
  await saveJournalSyncQueue(remaining)
}

/**
 * Full two-way sync: drain queue, push locals missing on server, pull remote rows.
 * Skips entirely on web or when Supabase env is missing.
 */
export async function syncJournalForUser(userId: string): Promise<void> {
  if (!isSupabaseConfigured || Platform.OS === "web") return

  await processPendingQueue(userId)

  let remoteRows = await listRemoteJournalEntries(userId)
  const remoteIds = new Set(remoteRows.map((r) => r.id))
  const locals = await loadAllEntries()

  for (const local of locals) {
    if (!remoteIds.has(local.id)) {
      try {
        await pushJournalEntryToRemote(userId, local)
      } catch {
        await enqueueJournalSyncItem({ kind: "push", entryId: local.id })
      }
    }
  }

  remoteRows = await listRemoteJournalEntries(userId)
  const applied = await readAppliedRemoteMap()

  for (const row of remoteRows) {
    const prev = applied[row.id]
    if (prev === row.updated_at) {
      continue
    }
    try {
      await applyRemoteJournalRowToLocal(row)
    } catch {
      // Leave unapplied; a future sync may succeed.
    }
  }
}
