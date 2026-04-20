import { useEffect, useState } from "react";

import {
  isEncryptedPhotoUri,
  resolvePhotoUriForDisplay,
} from "@/services/encryption";

/** Resolves `file://…enc` to a temporary JPEG in cache; passes through http(s) and plain JPEG URIs. */
export function useResolvedPhotoUri(
  uri: string | null | undefined,
): string | null {
  const [out, setOut] = useState<string | null>(() => {
    if (!uri) return null;
    return isEncryptedPhotoUri(uri) ? null : uri;
  });

  useEffect(() => {
    if (!uri) {
      setOut(null);
      return;
    }
    if (!isEncryptedPhotoUri(uri)) {
      setOut(uri);
      return;
    }
    let cancelled = false;
    resolvePhotoUriForDisplay(uri)
      .then((r) => {
        if (!cancelled) setOut(r);
      })
      .catch(() => {
        if (!cancelled) setOut(null);
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return out;
}
