/**
 * voiceService.ts
 * Handles audio recording with expo-av and transcription via Google Gemini 1.5 Flash.
 */
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { persistAudio } from './mediaService';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || '';

// ── Permissions ───────────────────────────────────────────────────────────────

export async function requestMicPermission(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

// ── Recording ─────────────────────────────────────────────────────────────────

let activeRecording: Audio.Recording | null = null;

export async function startRecording(): Promise<Audio.Recording | null> {
  const granted = await requestMicPermission();
  if (!granted) return null;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );

  activeRecording = recording;
  return recording;
}

export async function stopRecording(): Promise<string | null> {
  if (!activeRecording) return null;

  await activeRecording.stopAndUnloadAsync();
  const tempUri = activeRecording.getURI();
  activeRecording = null;

  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

  if (!tempUri) return null;
  return await persistAudio(tempUri);
}

export function getActiveRecording() {
  return activeRecording;
}

// ── Gemini Transcription ──────────────────────────────────────────────────────

/**
 * Transcribes an audio file using Google Gemini 1.5 Flash.
 *
 * @param audioUri  Persistent local URI returned by stopRecording()
 * @returns Transcribed text, or null on error / missing API key
 */
export async function transcribeWithGemini(audioUri: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.warn('[voiceService] EXPO_PUBLIC_GEMINI_KEY not set — skipping transcription.');
    return null;
  }

  try {
    // 1. Read audio file as Base64
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Detect MIME type from extension (expo-av records m4a on both platforms)
    const ext = audioUri.split('.').pop()?.toLowerCase() ?? 'm4a';
    const mimeType = ext === 'mp3'  ? 'audio/mp3'
                   : ext === 'wav'  ? 'audio/wav'
                   : ext === 'ogg'  ? 'audio/ogg'
                   : ext === 'flac' ? 'audio/flac'
                   : ext === 'webm' ? 'audio/webm'
                   : 'audio/mp4';   // m4a / mp4 container

    // 2. Initialize Gemini client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 3. Build request with inline audio
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      },
      {
        text:
          'Transcribe exactly what is said in this audio recording. ' +
          'Output ONLY the transcribed text in the same language as the audio — no explanations, ' +
          'no punctuation additions, no labels, no quotes. ' +
          'If the audio is in Spanish, respond in Spanish. ' +
          'If it is inaudible or silent, respond with an empty string.',
      },
    ]);

    const transcript = result.response.text().trim();

    // Return null for empty / inaudible responses
    if (!transcript || transcript === '""' || transcript === "''") return null;
    return transcript;

  } catch (error: any) {
    console.error('[voiceService] Gemini transcription failed:', error?.message ?? error);
    return null;
  }
}
