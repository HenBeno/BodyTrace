import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import type { PhotoAngle } from "@/types";
import { encryptPlainFileAtUriToEnc } from "@/services/encryption";

const ANGLES: PhotoAngle[] = ["front", "side", "back"];

function mediaRoot(): string | null {
  const base = FileSystem.documentDirectory;
  if (!base) return null;
  return `${base}bodytrace/`;
}

/** Copies captured files into app documents. Remote `http(s)` URIs are kept as-is. */
export async function persistEntryPhotos(
  entryId: string,
  photos: Partial<Record<PhotoAngle, string>>,
): Promise<Partial<Record<PhotoAngle, string>>> {
  if (Platform.OS === "web" || !mediaRoot()) {
    return { ...photos };
  }

  const root = mediaRoot()!;
  const dir = `${root}entries/${entryId}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(
    () => undefined,
  );

  const out: Partial<Record<PhotoAngle, string>> = { ...photos };

  for (const angle of ANGLES) {
    const uri = photos[angle];
    if (!uri) continue;
    const dest = `${dir}${angle}.jpg`;
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      const { uri: downloaded } = await FileSystem.downloadAsync(uri, dest);
      out[angle] = await encryptPlainFileAtUriToEnc(downloaded);
      continue;
    }
    await FileSystem.copyAsync({ from: uri, to: dest });
    out[angle] = await encryptPlainFileAtUriToEnc(dest);
  }

  return out;
}

export async function deleteEntryMediaFolder(entryId: string): Promise<void> {
  if (Platform.OS === "web" || !mediaRoot()) return;
  const dir = `${mediaRoot()}entries/${entryId}/`;
  await FileSystem.deleteAsync(dir, { idempotent: true }).catch(
    () => undefined,
  );
}
