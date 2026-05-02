import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, useThemeColors } from '../../src/theme';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useSoundStore } from '../../src/store/soundStore';
import { audioService } from '../../src/services/audioService';
import { BUILT_IN_SOUNDS } from '../../src/constants/sounds';
import { Card, SectionHeader } from '../../src/components/ui/Card';
import { Sound } from '../../src/types';

export default function SoundsScreen() {
  const router = useRouter();
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);
  const { sounds: customSounds, removeSound } = useSoundStore();

  const [playingId, setPlayingId] = useState<string | null>(null);

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

  const handleDelete = (sound: Sound) => {
    Alert.alert(
      'Eliminar sonido',
      `¿Quieres eliminar "${sound.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await audioService.deleteCustomSound(sound.uri);
            removeSound(sound.id);
          },
        },
      ]
    );
  };

  const renderSound = (sound: Sound) => (
    <Card key={sound.id} noPadding style={styles.soundCard}>
      <View style={styles.soundRow}>
        <Text style={styles.emoji}>{sound.emoji}</Text>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{sound.name}</Text>
          <Text style={[styles.type, { color: colors.textSecondary }]}>
            {sound.isBuiltIn ? 'Sistema' : sound.isRecorded ? 'Grabación' : 'MP3'}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handlePlay(sound)} style={styles.actionBtn}>
            <Ionicons
              name={playingId === sound.id ? 'stop-circle' : 'play-circle'}
              size={28}
              color={COLORS.primary}
            />
          </TouchableOpacity>
          
          {!sound.isBuiltIn && (
            <TouchableOpacity onPress={() => handleDelete(sound)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={24} color={COLORS.error} />
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
        <SectionHeader title="Tus Sonidos" />
        {customSounds.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No has agregado sonidos personalizados aún.
          </Text>
        ) : (
          customSounds.map(renderSound)
        )}

        <SectionHeader title="Sonidos del Sistema" />
        {BUILT_IN_SOUNDS.map(renderSound)}
      </ScrollView>
    </SafeAreaView>
  );
}

import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    gap: SPACING.md,
  },
  backBtn: { padding: 4 },
  title: { fontSize: TYPOGRAPHY.sizes.lg, fontWeight: TYPOGRAPHY.weights.bold },
  content: { padding: SPACING.base },
  soundCard: { marginBottom: SPACING.sm },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  emoji: { fontSize: 24, marginRight: SPACING.md },
  info: { flex: 1 },
  name: { fontSize: TYPOGRAPHY.sizes.base, fontWeight: TYPOGRAPHY.weights.semibold },
  type: { fontSize: TYPOGRAPHY.sizes.xs },
  actions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  actionBtn: { padding: 4 },
  emptyText: {
    textAlign: 'center',
    padding: SPACING.xl,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontStyle: 'italic',
  },
});
