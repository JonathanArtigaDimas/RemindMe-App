/**
 * QuickNoteModal.tsx
 * A minimal floating modal triggered by the FAB.
 * Supports: text, camera photo, gallery pick, and voice recording.
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Animated, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, TYPOGRAPHY, useThemeColors } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';
import { useNoteStore } from '../../store/noteStore';
import { takePhoto, pickFromGallery } from '../../services/mediaService';
import { startRecording, stopRecording, transcribeWithGemini } from '../../services/voiceService';
import { Note } from '../../types';
import * as Haptics from 'expo-haptics';

interface QuickNoteModalProps {
  visible: boolean;
  onClose: () => void;
}

type RecordState = 'idle' | 'recording' | 'transcribing' | 'error';

export function QuickNoteModal({ visible, onClose }: QuickNoteModalProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);
  const { addNote } = useNoteStore();
  const fontStyle = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily) };
  const fontBold  = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily, 'bold') };

  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const reset = () => {
    setText('');
    setImageUri(null);
    setTranscript(null);
    setAudioUri(null);
    setRecordState('idle');
    stopPulse();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Save note ──────────────────────────────────────────────────
  const handleSave = () => {
    const finalContent = text.trim() || transcript || '';
    if (!finalContent && !imageUri) return;

    addNote({
      title: finalContent ? finalContent.split('\n')[0].substring(0, 60) : '📷 Foto rápida',
      content: finalContent,
      isPinned: false,
      imageUri: imageUri || undefined,
      audioUri: audioUri || undefined,
      audioTranscript: transcript || undefined,
    });

    if (settings.hapticFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  };

  // ── Camera ─────────────────────────────────────────────────────
  const handleCamera = async () => {
    const uri = await takePhoto();
    if (uri) setImageUri(uri);
  };

  // ── Gallery ────────────────────────────────────────────────────
  const handleGallery = async () => {
    const uri = await pickFromGallery();
    if (uri) setImageUri(uri);
  };

  // ── Voice Recording ────────────────────────────────────────────
  const handleVoiceToggle = async () => {
    if (recordState === 'idle') {
      const rec = await startRecording();
      if (rec) {
        setRecordState('recording');
        startPulse();
        if (settings.hapticFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else if (recordState === 'recording') {
      stopPulse();
      setRecordState('transcribing');
      const uri = await stopRecording();
      if (uri) {
        setAudioUri(uri);
        const tx = await transcribeWithGemini(uri);
        if (tx) {
          setTranscript(tx);
          setText(tx);
        } else {
          // Gemini returned null — audio saved but no transcript
          setRecordState('error');
          setTimeout(() => setRecordState('idle'), 2500);
          return;
        }
      }
      setRecordState('idle');
      if (settings.hapticFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const canSave = text.trim().length > 0 || !!imageUri || !!transcript;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }, fontBold]}>
              ⚡ Nota rápida
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Image preview */}
          {imageUri && (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <TouchableOpacity
                style={[styles.removeImage, { backgroundColor: colors.error }]}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="close" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Gemini loading state */}
          {recordState === 'transcribing' && (
            <View style={[styles.transcribingRow, { backgroundColor: colors.primary + '15' }]}>
              <ActivityIndicator size="small" color={colors.primary} />
              <View>
                <Text style={[styles.transcribingText, { color: colors.primary }, fontBold]}>
                  {' '}Gemini está procesando...
                </Text>
                <Text style={[styles.transcribingSubtext, { color: colors.primary }, fontStyle]}>
                  {'  '}Esto puede tardar unos segundos
                </Text>
              </View>
            </View>
          )}

          {/* Error state */}
          {recordState === 'error' && (
            <View style={[styles.transcribingRow, { backgroundColor: colors.error + '15' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={[styles.transcribingText, { color: colors.error }, fontStyle]}>
                {' '}No se pudo transcribir el audio
              </Text>
            </View>
          )}

          {/* Text input */}
          <TextInput
            style={[styles.input, { color: colors.text }, fontStyle]}
            placeholder="Escribe tu nota aquí..."
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
          />

          {/* Action bar */}
          <View style={[styles.actionBar, { borderTopColor: colors.border }]}>
            {/* Camera */}
            <TouchableOpacity style={styles.actionBtn} onPress={handleCamera}>
              <Ionicons name="camera-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Gallery */}
            <TouchableOpacity style={styles.actionBtn} onPress={handleGallery}>
              <Ionicons name="images-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Voice */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.voiceBtn,
                  {
                    backgroundColor: recordState === 'recording'
                      ? colors.error
                      : colors.primary + '20',
                  },
                ]}
                onPress={handleVoiceToggle}
                disabled={recordState === 'transcribing'}
              >
                <Ionicons
                  name={recordState === 'recording' ? 'stop' : 'mic-outline'}
                  size={24}
                  color={recordState === 'recording' ? '#FFF' : colors.primary}
                />
              </TouchableOpacity>
            </Animated.View>

            <View style={{ flex: 1 }} />

            {/* Save */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.border }]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Ionicons name="checkmark" size={20} color={canSave ? '#FFF' : colors.textTertiary} />
              <Text style={[styles.saveBtnText, { color: canSave ? '#FFF' : colors.textTertiary }, fontBold]}>
                Guardar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  imagePreviewWrapper: { position: 'relative', marginBottom: SPACING.sm },
  imagePreview: { width: '100%', height: 180, borderRadius: RADIUS.md },
  removeImage: {
    position: 'absolute', top: 8, right: 8,
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  transcribingRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.sm, borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  transcribingText: { fontSize: 13 },
  transcribingSubtext: { fontSize: 11, opacity: 0.8, marginTop: 1 },
  input: {
    minHeight: 90, fontSize: 16, lineHeight: 24,
    textAlignVertical: 'top', paddingVertical: SPACING.sm,
  },
  actionBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: SPACING.sm, borderTopWidth: 1,
    gap: SPACING.sm, marginTop: SPACING.xs,
  },
  actionBtn: { padding: SPACING.sm, borderRadius: RADIUS.md },
  voiceBtn: { padding: SPACING.sm, borderRadius: RADIUS.full },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg, gap: 6,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
});
