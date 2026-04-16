import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

import { isEncryptedPhotoUri, resolvePhotoUriForDisplay } from '@/services/encryption';

/**
 * Opens the system share sheet for an image URI (local or remote).
 */
export async function shareImageUri(uri: string): Promise<void> {
  if (Platform.OS === 'web') {
    Alert.alert('Export', 'Sharing from the browser is not supported in this build.');
    return;
  }
  let localUri = uri;
  if (isEncryptedPhotoUri(uri)) {
    localUri = await resolvePhotoUriForDisplay(uri);
  } else if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
    const dest = `${base}bodytrace-share-${Date.now()}.jpg`;
    const { uri: downloaded } = await FileSystem.downloadAsync(uri, dest);
    localUri = downloaded;
  }
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
    return;
  }
  await Sharing.shareAsync(localUri, {
    mimeType: 'image/jpeg',
    dialogTitle: 'Share photo',
  });
}
