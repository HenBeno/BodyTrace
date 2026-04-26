import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { Platform } from "react-native"

import { useAuth } from "@/contexts/AuthContext"
import { isSupabaseConfigured } from "@/lib/env"
import type { Entry, PhotoAngle } from "@/types"
import {
  deleteEntryById,
  ensureInitialized,
  insertEntry,
  loadAllEntries,
} from "@/services/database"
import {
  clearJournalRemoteApplied,
  deleteRemoteJournalEntry,
  pushJournalEntryToRemote,
  syncJournalForUser,
} from "@/services/entrySyncRepository"
import { enqueueJournalSyncItem } from "@/services/syncQueue"
import {
  deleteEntryMediaFolder,
  persistEntryPhotos,
} from "@/services/mediaStore"
import { getPhotoOriginalUri } from "@/utils/photos"

function sortByDateDesc(a: Entry, b: Entry) {
  return b.createdAt.getTime() - a.createdAt.getTime()
}

function sortByDateAsc(a: Entry, b: Entry) {
  return a.createdAt.getTime() - b.createdAt.getTime()
}

export interface EntriesContextValue {
  entries: Entry[]
  /** True after SQLite finished loading (or failed gracefully). */
  ready: boolean
  /** True while refreshEntries is running */
  refreshing: boolean
  refreshEntries: () => Promise<void>
  addEntry: (entry: Entry) => Promise<void>
  removeEntry: (id: string) => Promise<void>
  getOldestEntry: () => Entry | undefined
  getGhostUriForAngle: (
    angle: PhotoAngle,
    referenceEntryId?: string | null,
  ) => string | null
}

const EntriesContext = createContext<EntriesContextValue | undefined>(undefined)

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [entries, setEntries] = useState<Entry[]>([])
  const [ready, setReady] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const userId = session?.user?.id
  const shouldCloudSync =
    Platform.OS !== "web" && isSupabaseConfigured && Boolean(userId)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureInitialized()
        const list = await loadAllEntries()
        if (!cancelled) {
          setEntries(list.sort(sortByDateDesc))
          setReady(true)
        }
      } catch {
        if (!cancelled) {
          setEntries([])
          setReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready || Platform.OS === "web" || !shouldCloudSync || !userId) {
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await syncJournalForUser(userId)
        if (cancelled) return
        await ensureInitialized()
        const list = await loadAllEntries()
        if (!cancelled) {
          setEntries(list.sort(sortByDateDesc))
        }
      } catch {
        // Offline or transient errors — local data stays usable.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, shouldCloudSync, userId])

  const refreshEntries = useCallback(async () => {
    setRefreshing(true)
    try {
      await ensureInitialized()
      const list = await loadAllEntries()
      setEntries(list.sort(sortByDateDesc))
    } catch {
      setEntries([])
    } finally {
      setRefreshing(false)
    }
  }, [])

  const addEntry = useCallback(
    async (entry: Entry) => {
      const photos = await persistEntryPhotos(entry.id, entry.photos)
      const saved: Entry = { ...entry, photos }
      if (Platform.OS === "web") {
        setEntries((prev) => [saved, ...prev].sort(sortByDateDesc))
        return
      }
      await insertEntry(saved)
      setEntries((prev) => [saved, ...prev].sort(sortByDateDesc))

      if (shouldCloudSync && userId) {
        void pushJournalEntryToRemote(userId, saved).catch(() =>
          enqueueJournalSyncItem({ kind: "push", entryId: saved.id }),
        )
      }
    },
    [shouldCloudSync, userId],
  )

  const removeEntry = useCallback(
    async (id: string) => {
      if (Platform.OS === "web") {
        setEntries((prev) => prev.filter((e) => e.id !== id))
        return
      }
      await deleteEntryById(id)
      await deleteEntryMediaFolder(id).catch(() => undefined)
      setEntries((prev) => prev.filter((e) => e.id !== id))

      void clearJournalRemoteApplied(id).catch(() => undefined)
      if (shouldCloudSync && userId) {
        void deleteRemoteJournalEntry(userId, id).catch(() =>
          enqueueJournalSyncItem({ kind: "delete", entryId: id }),
        )
      }
    },
    [shouldCloudSync, userId],
  )

  const getOldestEntry = useCallback(() => {
    const sorted = [...entries].sort(sortByDateAsc)
    return sorted[0]
  }, [entries])

  const getGhostUriForAngle = useCallback(
    (angle: PhotoAngle, referenceEntryId?: string | null) => {
      if (entries.length === 0) return null
      let ref: Entry | undefined
      if (referenceEntryId) {
        ref = entries.find((e) => e.id === referenceEntryId)
      }
      if (!ref) {
        const sorted = [...entries].sort(sortByDateAsc)
        ref = sorted[0]
      }
      return ref ? getPhotoOriginalUri(ref.photos, angle) : null
    },
    [entries],
  )

  const value = useMemo(
    () => ({
      entries,
      ready,
      refreshing,
      refreshEntries,
      addEntry,
      removeEntry,
      getOldestEntry,
      getGhostUriForAngle,
    }),
    [
      entries,
      ready,
      refreshing,
      refreshEntries,
      addEntry,
      removeEntry,
      getOldestEntry,
      getGhostUriForAngle,
    ],
  )

  return (
    <EntriesContext.Provider value={value}>{children}</EntriesContext.Provider>
  )
}

export function useEntries() {
  const ctx = useContext(EntriesContext)
  if (!ctx) {
    throw new Error("useEntries must be used within EntriesProvider")
  }
  return ctx
}
