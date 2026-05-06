/**
 * mediaService.ts
 * Handles image picking, camera capture and permanent storage in the app's document directory.
 */
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const IMAGES_DIR = `${FileSystem.documentDirectory}note_images/`;
const AUDIO_DIR  = `${FileSystem.documentDirectory}note_audio/`;

/** Ensure storage directories exist on startup */
export async function ensureMediaDirs() {
  const imgInfo  = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!imgInfo.exists) await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });

  const audioInfo = await FileSystem.getInfoAsync(AUDIO_DIR);
  if (!audioInfo.exists) await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
}

/** Copy a temporary URI into permanent storage and return the persistent path. */
export async function persistImage(tempUri: string): Promise<string> {
  await ensureMediaDirs();
  const filename  = `img_${Date.now()}.jpg`;
  const destPath  = `${IMAGES_DIR}${filename}`;
  await FileSystem.copyAsync({ from: tempUri, to: destPath });
  return destPath;
}

/** Copy a temporary audio URI into permanent storage and return the persistent path. */
export async function persistAudio(tempUri: string): Promise<string> {
  await ensureMediaDirs();
  const ext      = tempUri.split('.').pop() || 'm4a';
  const filename = `audio_${Date.now()}.${ext}`;
  const destPath = `${AUDIO_DIR}${filename}`;
  await FileSystem.copyAsync({ from: tempUri, to: destPath });
  return destPath;
}

/** Delete a media file from permanent storage (cleanup). */
export async function deleteMedia(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (_) {}
}

// ── Image Picker ──────────────────────────────────────────────────

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function requestGalleryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/** Launch camera; returns persistent URI or null if cancelled/denied. */
export async function takePhoto(): Promise<string | null> {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.75,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return await persistImage(result.assets[0].uri);
}

/** Open gallery picker; returns persistent URI or null if cancelled/denied. */
export async function pickFromGallery(): Promise<string | null> {
  const granted = await requestGalleryPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.75,
    allowsEditing: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return await persistImage(result.assets[0].uri);
}
