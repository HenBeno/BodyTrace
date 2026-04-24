import * as FileSystem from "expo-file-system/legacy"
import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
import { Platform } from "react-native"

import type { Entry, PhotoAngle } from "@/types"
import { encryptPlainFileAtUriToEnc } from "@/services/encryption"
import { getPhotoOriginalUri } from "@/utils/photos"

const ANGLES: PhotoAngle[] = ["front", "side", "back"]

function mediaRoot(): string | null {
  const base = FileSystem.documentDirectory
  if (!base) return null
  return `${base}bodytrace/`
}

/** Copies captured files into app documents. Remote `http(s)` URIs are kept as-is. */
export async function persistEntryPhotos(
  entryId: string,
  photos: Entry["photos"],
): Promise<Entry["photos"]> {
  if (Platform.OS === "web" || !mediaRoot()) {
    return { ...photos }
  }

  const root = mediaRoot()!
  const dir = `${root}entries/${entryId}/`
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(
    () => undefined,
  )

  const out: Entry["photos"] = { ...photos }

  async function createEncryptedThumb(
    sourceUri: string,
    thumbDestJpg: string,
  ): Promise<string | undefined> {
    const resized = await manipulateAsync(
      sourceUri,
      [{ resize: { width: 720 } }],
      { compress: 0.72, format: SaveFormat.JPEG },
    )
    await FileSystem.copyAsync({ from: resized.uri, to: thumbDestJpg })
    await FileSystem.deleteAsync(resized.uri, { idempotent: true }).catch(
      () => undefined,
    )
    return encryptPlainFileAtUriToEnc(thumbDestJpg).catch(() => undefined)
  }

  for (const angle of ANGLES) {
    const uri = getPhotoOriginalUri(photos, angle)
    if (!uri) continue
    const originalDest = `${dir}${angle}.jpg`
    const thumbDest = `${dir}${angle}.thumb.jpg`
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      const { uri: downloaded } = await FileSystem.downloadAsync(
        uri,
        originalDest,
      )
      const thumbEncUri = await createEncryptedThumb(downloaded, thumbDest)
      const originalEncUri = await encryptPlainFileAtUriToEnc(downloaded)
      out[angle] = { originalEncUri, thumbEncUri }
      continue
    }
    await FileSystem.copyAsync({ from: uri, to: originalDest })
    const [originalEncUri, thumbEncUri] = await Promise.all([
      encryptPlainFileAtUriToEnc(originalDest),
      createEncryptedThumb(uri, thumbDest),
    ])
    out[angle] = { originalEncUri, thumbEncUri }
  }

  return out
}

export async function deleteEntryMediaFolder(entryId: string): Promise<void> {
  if (Platform.OS === "web" || !mediaRoot()) return
  const dir = `${mediaRoot()}entries/${entryId}/`
  await FileSystem.deleteAsync(dir, { idempotent: true }).catch(() => undefined)
}
