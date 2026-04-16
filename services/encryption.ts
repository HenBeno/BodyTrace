import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64 } from 'tweetnacl-util';
import { Platform } from 'react-native';

const DEVICE_SECRET_KEY = 'bodytrace.deviceSecret';
const PHOTO_KEY_STORAGE = 'bodytrace.photoKey';

const NONCE_LEN = nacl.secretbox.nonceLength;

/**
 * Ensures a stable on-device secret exists (SecureStore / keychain).
 */
export async function ensureDeviceSecret(): Promise<void> {
  const existing = await SecureStore.getItemAsync(DEVICE_SECRET_KEY);
  if (existing) return;
  const secret = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  await SecureStore.setItemAsync(DEVICE_SECRET_KEY, secret, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

/** 32-byte NaCl secretbox key persisted in SecureStore. */
export async function ensurePhotoEncryptionKey(): Promise<void> {
  const existing = await SecureStore.getItemAsync(PHOTO_KEY_STORAGE);
  if (existing) return;
  const key = await Crypto.getRandomBytesAsync(nacl.secretbox.keyLength);
  await SecureStore.setItemAsync(PHOTO_KEY_STORAGE, encodeBase64(key), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED,
  });
}

async function getPhotoKey(): Promise<Uint8Array> {
  const raw = await SecureStore.getItemAsync(PHOTO_KEY_STORAGE);
  if (!raw) throw new Error('Missing photo encryption key');
  return decodeBase64(raw);
}

export function isEncryptedPhotoUri(uri: string): boolean {
  return uri.endsWith('.enc');
}

/**
 * Encrypts a JPEG file in place: reads `jpgUri`, writes `.enc` next to it, deletes the JPEG.
 * @returns URI of the `.enc` file
 */
export async function encryptPlainFileAtUriToEnc(jpgUri: string): Promise<string> {
  const encUri = jpgUri.replace(/\.(jpe?g)$/i, '.enc');
  const b64 = await FileSystem.readAsStringAsync(jpgUri, { encoding: FileSystem.EncodingType.Base64 });
  const plain = decodeBase64(b64);
  const key = await getPhotoKey();
  const nonce = await Crypto.getRandomBytesAsync(NONCE_LEN);
  const boxed = nacl.secretbox(plain, nonce, key);
  if (!boxed) throw new Error('Encryption failed');
  const combined = new Uint8Array(NONCE_LEN + boxed.length);
  combined.set(nonce, 0);
  combined.set(boxed, NONCE_LEN);
  await FileSystem.writeAsStringAsync(encUri, encodeBase64(combined), {
    encoding: FileSystem.EncodingType.Base64,
  });
  await FileSystem.deleteAsync(jpgUri, { idempotent: true });
  return encUri;
}

/** Returns a JPEG `file://` URI suitable for `<Image>` (decrypts to cache when needed). */
export async function resolvePhotoUriForDisplay(uri: string): Promise<string> {
  if (Platform.OS === 'web' || !isEncryptedPhotoUri(uri)) {
    return uri;
  }
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!base) return uri;

  const tail = uri.replace(/[^\w.-]+/g, '_');
  const outUri = `${base}bodytrace-dec-${tail.slice(-96)}.jpg`;

  const info = await FileSystem.getInfoAsync(outUri);
  if (info.exists) {
    return outUri;
  }

  const encB64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const combined = decodeBase64(encB64);
  const nonce = combined.slice(0, NONCE_LEN);
  const boxed = combined.slice(NONCE_LEN);
  const key = await getPhotoKey();
  const plain = nacl.secretbox.open(boxed, nonce, key);
  if (!plain) {
    throw new Error('Could not decrypt photo');
  }
  await FileSystem.writeAsStringAsync(outUri, encodeBase64(plain), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return outUri;
}
