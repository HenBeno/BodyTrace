import React from "react";
import { Image, StyleSheet, View } from "react-native";

import { useResolvedPhotoUri } from "@/hooks/useResolvedPhotoUri";

export interface GhostOverlayProps {
  /** Local file URI or remote URL of the reference photo */
  imageUri: string | null;
  /** 0–1 opacity of the ghost layer */
  opacity: number;
}

/**
 * Semi-transparent reference image aligned with the live camera preview.
 * Uses `cover` to match typical full-bleed camera framing.
 */
export function GhostOverlay({ imageUri, opacity }: GhostOverlayProps) {
  const resolved = useResolvedPhotoUri(imageUri);
  if (!imageUri || opacity <= 0) {
    return null;
  }
  if (!resolved) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={{ uri: resolved }}
        style={[StyleSheet.absoluteFill, { opacity }]}
        resizeMode="cover"
      />
    </View>
  );
}
