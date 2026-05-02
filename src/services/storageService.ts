import * as FileSystem from 'expo-file-system';

// In Expo SDK 54, we must use the legacy import for all methods
let FS: any = FileSystem;
try {
  // @ts-ignore
  const LegacyFS = require('expo-file-system/legacy');
  if (LegacyFS) FS = LegacyFS;
} catch (e) {}

// Use a function to get the directory to ensure it's not undefined at runtime
function getStorageDir() {
  const docDir = FileSystem.documentDirectory || FS.documentDirectory || FileSystem.cacheDirectory || FS.cacheDirectory;
  if (!docDir) {
    console.warn('CRITICAL: FileSystem directories are undefined, using temporary fallback');
    return 'file:///sdcard/RemindMe/storage/'; // Last resort for Android
  }
  return `${docDir}storage/`;
}

async function ensureDir() {
  const STORAGE_DIR = getStorageDir();
  if (!STORAGE_DIR) return;

  try {
    const dirInfo = await FS.getInfoAsync(STORAGE_DIR);
    if (!dirInfo.exists) {
      await FS.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
    }
  } catch (e) {
    try {
      await FS.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
    } catch (err) {}
  }
}

export const fileStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const STORAGE_DIR = getStorageDir();
      if (!STORAGE_DIR) return null;

      await ensureDir();
      const fileUri = `${STORAGE_DIR}${name}.json`;
      const fileInfo = await FS.getInfoAsync(fileUri);
      if (!fileInfo.exists) return null;
      return await FS.readAsStringAsync(fileUri);
    } catch (e) {
      console.warn('FileStorage getItem error:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const STORAGE_DIR = getStorageDir();
      if (!STORAGE_DIR) return;

      await ensureDir();
      const fileUri = `${STORAGE_DIR}${name}.json`;
      await FS.writeAsStringAsync(fileUri, value);
    } catch (e) {
      console.warn('FileStorage setItem error:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const STORAGE_DIR = getStorageDir();
      if (!STORAGE_DIR) return;

      const fileUri = `${STORAGE_DIR}${name}.json`;
      await FS.deleteAsync(fileUri, { idempotent: true });
    } catch (e) {
      console.warn('FileStorage removeItem error:', e);
    }
  },
};
