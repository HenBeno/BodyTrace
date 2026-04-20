import { Image, type ImageProps } from "expo-image";
import React from "react";
import { View } from "react-native";

import { useResolvedPhotoUri } from "@/hooks/useResolvedPhotoUri";

export type ResolvedExpoImageProps = Omit<ImageProps, "source"> & {
  uri?: string | null;
};

export function ResolvedExpoImage({
  uri,
  style,
  ...rest
}: ResolvedExpoImageProps) {
  const resolved = useResolvedPhotoUri(uri);
  if (!resolved) {
    return (
      <View style={style} className="bg-neutral-200 dark:bg-neutral-800" />
    );
  }
  return <Image source={{ uri: resolved }} style={style} {...rest} />;
}
