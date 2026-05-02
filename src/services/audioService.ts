import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Sound } from '../types';
import uuid from 'react-native-uuid';

class AudioService {
  private currentSound: Audio.Sound | null = null;
  private recording: Audio.Recording | null = null;
  private isRecording = false;

  async configure() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.warn('AudioService configure error:', e);
    }
  }

  async playSound(uri: string, volume = 1.0): Promise<void> {
    try {
      await this.stopCurrentSound();
      if (!uri || uri === '') return;

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { volume, shouldPlay: true }
      );
      this.currentSound = sound;

      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          this.currentSound = null;
        }
      });
    } catch (e) {
      console.warn('playSound error:', e);
    }
  }

  async stopCurrentSound(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (_) {}
      this.currentSound = null;
    }
  }

  // ── Grabación desde micrófono ────────────────────────────
  async requestMicrophonePermission(): Promise<boolean> {
    const { granted } = await Audio.requestPermissionsAsync();
    return granted;
  }

  async startRecording(): Promise<boolean> {
    if (this.isRecording) return false;

    const granted = await this.requestMicrophonePermission();
    if (!granted) return false;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
      this.isRecording = true;
      return true;
    } catch (e) {
      console.warn('startRecording error:', e);
      return false;
    }
  }

  async stopRecording(name: string): Promise<Sound | null> {
    if (!this.recording || !this.isRecording) return null;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.isRecording = false;

      if (!uri) return null;

      // Copy to permanent storage
      const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!docDir) throw new Error('DocumentDirectory and CacheDirectory are both undefined');
      const dir = `${docDir}sounds/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const id = uuid.v4() as string;
      const destUri = `${dir}${id}.m4a`;
      await FileSystem.copyAsync({ from: uri, to: destUri });

      const status = await this.recording.getStatusAsync();
      const duration =
        'durationMillis' in status ? (status as any).durationMillis / 1000 : undefined;

      this.recording = null;

      return {
        id,
        name: name.trim() || 'Mi grabación',
        uri: destUri,
        isBuiltIn: false,
        isRecorded: true,
        emoji: '🎙️',
        duration,
        createdAt: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('stopRecording error:', e);
      this.recording = null;
      this.isRecording = false;
      return null;
    }
  }

  cancelRecording() {
    if (this.recording) {
      this.recording.stopAndUnloadAsync().catch(() => {});
      this.recording = null;
    }
    this.isRecording = false;
  }

  getIsRecording() {
    return this.isRecording;
  }

  async getRecordingStatus() {
    if (!this.recording) return null;
    return this.recording.getStatusAsync();
  }

  // ── Importar desde archivo ───────────────────────────────
  async importSoundFromFile(): Promise<Sound | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return null;

      const asset = result.assets[0];
      const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!docDir) throw new Error('DocumentDirectory and CacheDirectory are both undefined');
      const dir = `${docDir}sounds/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

      const id = uuid.v4() as string;
      const ext = asset.name.split('.').pop() || 'mp3';
      const destUri = `${dir}${id}.${ext}`;
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });

      return {
        id,
        name: asset.name.replace(/\.[^/.]+$/, ''),
        uri: destUri,
        isBuiltIn: false,
        isRecorded: false,
        emoji: '🎵',
        createdAt: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('importSoundFromFile error:', e);
      return null;
    }
  }

  async deleteCustomSound(uri: string): Promise<void> {
    try {
      if (uri.startsWith(FileSystem.documentDirectory || '')) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch (_) {}
  }
}

export const audioService = new AudioService();
