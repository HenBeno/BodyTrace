import { useCameraPermissions } from "expo-camera";
import { useCallback, useState } from "react";

export function useCameraPermissionGate() {
  const [permission, requestPermission] = useCameraPermissions();
  const [pending, setPending] = useState(false);

  const ensurePermission = useCallback(async () => {
    if (permission?.granted) return true;
    setPending(true);
    try {
      const res = await requestPermission();
      return res.granted;
    } finally {
      setPending(false);
    }
  }, [permission?.granted, requestPermission]);

  return {
    permission,
    pending,
    ensurePermission,
    canUseCamera: permission?.granted === true,
  };
}
