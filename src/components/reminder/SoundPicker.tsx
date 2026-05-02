import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, useThemeColors } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';
import { useSoundStore } from '../../store/soundStore';
import { audioService } from '../../services/audioService';
import { Sound } from '../../types';

interface SoundPickerProps {
  value: string;
  onChange: (soundId: string) => void;
}

export function SoundPicker({ value, onChange }: SoundPickerProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);
  const { getAllSounds, addSound } = useSoundStore();

  const [playing, setPlaying] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [recordingName, setRecordingName] = useState('Mi grabación');
  const [loadingImport, setLoadingImport] = useState(false);

  const sounds = getAllSounds();
  const selected = sounds.find((s) => s.id === value);

  const playPreview = async (sound: Sound) => {
    if (playing === sound.id) {
      await audioService.stopCurrentSound();
      setPlaying(null);
      return;
    }
    if (!sound.uri) return;
    setPlaying(sound.id);
    await audioService.playSound(sound.uri);
    setPlaying(null);
  };

  const importFile = async () => {
    setLoadingImport(true);
    const sound = await audioService.importSoundFromFile();
    setLoadingImport(false);
    if (sound) {
      addSound(sound);
      onChange(sound.id);
      Alert.alert('✅ Sonido importado', `"${sound.name}" se agregó a tu biblioteca.`);
    }
  };

  const startRecord = async () => {
    const ok = await audioService.startRecording();
    if (!ok) {
      Alert.alert('Sin permiso', 'Necesitamos acceso al micrófono para grabar.');
      return;
    }
    setRecording(true);
    setRecordModalVisible(true);
  };

  const stopRecord = async () => {
    setRecording(false);
    const sound = await audioService.stopRecording(recordingName);
    setRecordModalVisible(false);
    if (sound) {
      addSound(sound);
      onChange(sound.id);
      Alert.alert('✅ Grabación guardada', `"${sound.name}" se guardó correctamente.`);
    }
  };

  const cancelRecord = () => {
    audioService.cancelRecording();
    setRecording(false);
    setRecordModalVisible(false);
  };

  return (
    <View>
      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={importFile}
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {loadingImport ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="folder-open-outline" size={18} color={COLORS.primary} />
              <Text style={[styles.actionLabel, { color: colors.text }]}>Importar MP3</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={startRecord}
          style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="mic-outline" size={18} color={COLORS.secondary} />
          <Text style={[styles.actionLabel, { color: colors.text }]}>Grabar</Text>
        </TouchableOpacity>
      </View>

      {/* Sound List */}
      {sounds.map((sound) => {
        const sel = value === sound.id;
        return (
          <TouchableOpacity
            key={sound.id}
            onPress={() => onChange(sound.id)}
            style={[
              styles.soundRow,
              {
                backgroundColor: sel ? COLORS.primary + '20' : colors.surface,
                borderColor: sel ? COLORS.primary : colors.border,
              },
            ]}
          >
            <Text style={styles.soundEmoji}>{sound.emoji}</Text>
            <Text style={[styles.soundName, { color: colors.text }]} numberOfLines={1}>
              {sound.name}
            </Text>
            {sound.isRecorded && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>Grabado</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => playPreview(sound)}
              style={styles.playBtn}
              disabled={!sound.uri}
            >
              <Ionicons
                name={playing === sound.id ? 'stop-circle' : 'play-circle'}
                size={24}
                color={sound.uri ? COLORS.primary : colors.border}
              />
            </TouchableOpacity>
            {sel && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={styles.checkmark} />}
          </TouchableOpacity>
        );
      })}

      {/* Record Modal */}
      <Modal visible={recordModalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {recording ? '🎙️ Grabando...' : 'Grabación completada'}
            </Text>
            {recording && (
              <View style={styles.recordingIndicator}>
                <ActivityIndicator color={COLORS.error} size="large" />
                <Text style={[styles.recLabel, { color: colors.textSecondary }]}>
                  Habla ahora...
                </Text>
              </View>
            )}
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={cancelRecord} style={styles.modalBtn}>
                <Text style={{ color: COLORS.error }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={stopRecord} style={[styles.modalBtn, { backgroundColor: COLORS.primary }]}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.xs, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1,
  },
  actionLabel: { fontSize: TYPOGRAPHY.sizes.sm, fontWeight: TYPOGRAPHY.weights.medium },
  soundRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  soundEmoji: { fontSize: 20, marginRight: SPACING.sm },
  soundName: { flex: 1, fontSize: TYPOGRAPHY.sizes.base },
  tag: {
    backgroundColor: COLORS.secondary + '30', borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.xs, paddingVertical: 2, marginRight: SPACING.sm,
  },
  tagText: { fontSize: TYPOGRAPHY.sizes.xs, color: COLORS.secondary },
  playBtn: { padding: SPACING.xs },
  checkmark: { marginLeft: SPACING.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modal: {
    width: '80%', borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center',
  },
  modalTitle: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold, marginBottom: SPACING.lg },
  recordingIndicator: { alignItems: 'center', marginBottom: SPACING.lg },
  recLabel: { marginTop: SPACING.sm, fontSize: TYPOGRAPHY.sizes.base },
  modalBtns: { flexDirection: 'row', gap: SPACING.md },
  modalBtn: {
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderRadius: RADIUS.md, alignItems: 'center',
  },
});
