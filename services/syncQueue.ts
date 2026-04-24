import AsyncStorage from "@react-native-async-storage/async-storage"

const QUEUE_KEY = "bodytrace:journalSyncQueue:v1"

export type JournalSyncQueueItem =
  | { kind: "push"; entryId: string }
  | { kind: "delete"; entryId: string }

export async function readJournalSyncQueue(): Promise<JournalSyncQueueItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as JournalSyncQueueItem[]
  } catch {
    return []
  }
}

export async function saveJournalSyncQueue(
  items: JournalSyncQueueItem[],
): Promise<void> {
  if (items.length === 0) {
    await AsyncStorage.removeItem(QUEUE_KEY)
    return
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items))
}

export async function enqueueJournalSyncItem(
  item: JournalSyncQueueItem,
): Promise<void> {
  const list = await readJournalSyncQueue()
  list.push(item)
  await saveJournalSyncQueue(list)
}
