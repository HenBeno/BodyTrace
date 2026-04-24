import type { Entry, PhotoAngle } from "@/types"

export interface StoredPhotoAsset {
  originalEncUri: string
  thumbEncUri?: string
}

export type EntryPhotoValue = string | StoredPhotoAsset
export type EntryPhotos = Partial<Record<PhotoAngle, EntryPhotoValue>>

export function isStoredPhotoAsset(
  value: EntryPhotoValue,
): value is StoredPhotoAsset {
  return typeof value === "object" && value != null && "originalEncUri" in value
}

export function getPhotoOriginalUri(
  photos: Entry["photos"] | EntryPhotos,
  angle: PhotoAngle,
): string | null {
  const value = photos[angle]
  if (!value) return null
  if (typeof value === "string") return value
  return value.originalEncUri || null
}

export function getPhotoThumbnailUri(
  photos: Entry["photos"] | EntryPhotos,
  angle: PhotoAngle,
): string | null {
  const value = photos[angle]
  if (!value) return null
  if (typeof value === "string") return value
  return value.thumbEncUri ?? value.originalEncUri ?? null
}

export function getPhotoPreferredUri(
  photos: Entry["photos"] | EntryPhotos,
  angle: PhotoAngle,
): string | null {
  return getPhotoThumbnailUri(photos, angle)
}
