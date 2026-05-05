import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SPACING, TYPOGRAPHY, RADIUS, useThemeColors } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useSoundStore } from '../../src/store/soundStore';
import { audioService } from '../../src/services/audioService';
import { BUILT_IN_SOUNDS } from '../../src/constants/sounds';
import { Card, SectionHeader } from '../../src/components/ui/Card';
import { Sound } from '../../src/types';

export default function SoundsScreen() {
  const router = useRouter();
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);
  const { sounds: customSounds, removeSound, addSound } = useSoundStore();

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [recordingName, setRecordingName] = useState('Mi grabación');

  const handlePlay = async (sound: Sound) => {
    if (playingId === sound.id) {
      await audioService.stopCurrentSound();
      setPlayingId(null);
      return;
    }

    if (!sound.uri) return;
    setPlayingId(sound.id);
    await audioService.playSound(sound.uri);
    setPlayingId(null);
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
      Alert.alert('✅ Grabación guardada', `"${sound.name}" se agregó a tu biblioteca.`);
    }
  };

  const renderSound = (sound: Sound) => (
    <Card key={sound.id} noPadding style={styles.soundCard}>
      <View style={[styles.soundRow, { backgroundColor: colors.surface }]}>
        <Text style={styles.emoji}>{sound.emoji || '🎵'}</Text>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{sound.name}</Text>
          <Text style={[styles.type, { color: colors.textSecondary }]}>
            {sound.isBuiltIn ? 'Sistema' : sound.isRecorded ? 'Grabación de voz' : 'MP3'}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handlePlay(sound)} style={styles.actionBtn}>
            <Ionicons
              name={playingId === sound.id ? 'stop-circle' : 'play-circle'}
              size={32}
              color={colors.primary}
            />
          </TouchableOpacity>
          
          {!sound.isBuiltIn && (
            <TouchableOpacity onPress={() => removeSound(sound.id)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Biblioteca de Sonidos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.recordBox}>
          <TouchableOpacity style={styles.recordBtn} onPress={startRecord}>
            <View style={[styles.micCircle, { backgroundColor: colors.error }]}>
              <Ionicons name="mic" size={40} color="#FFF" />
            </View>
            <Text style={[styles.recordLabel, { color: colors.text }]}>Grabar nuevo sonido</Text>
            <Text style={[styles.recordSub, { color: colors.textSecondary }]}>Graba tu propia voz para tus alarmas</Text>
          </TouchableOpacity>
        </Card>

        <SectionHeader title="Tus Grabaciones" />
        {customSounds.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Aún no tienes sonidos grabados.
          </Text>
        ) : (
          customSounds.map(renderSound)
        )}

        <SectionHeader title="Sonidos del Sistema" />
        {BUILT_IN_SOUNDS.map(renderSound)}
      </ScrollView>

      {/* Modal de Grabación */}
      <Modal visible={recordModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Ionicons name="mic" size={60} color={colors.error} style={styles.modalMic} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Grabando...</Text>
            
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
              value={recordingName}
              onChangeText={setRecordingName}
              placeholder="Nombre de la grabación"
              placeholderTextColor={colors.textSecondary}
            />

            <TouchableOpacity 
              style={[styles.stopBtn, { backgroundColor: colors.error }]} 
              onPress={stopRecord}
            >
              <Text style={styles.stopText}>Detener y Guardar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => {
                audioService.cancelRecording();
                setRecordModalVisible(false);
              }}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold' },
  content: { padding: SPACING.lg },
  recordBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  recordBtn: { alignItems: 'center' },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 4,
  },
  recordLabel: { fontSize: 18, fontWeight: 'bold' },
  recordSub: { fontSize: 14, marginTop: 4 },
  soundCard: { marginBottom: SPACING.md },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  emoji: { fontSize: 32, marginRight: SPACING.md },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  type: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  actionBtn: { padding: 4 },
  emptyText: { textAlign: 'center', padding: SPACING.xl, fontStyle: 'italic' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  modalMic: { marginBottom: SPACING.md },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: SPACING.xl },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: SPACING.xl,
  },
  stopBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  stopText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { padding: 12 },
  cancelText: { fontSize: 16 },
});
