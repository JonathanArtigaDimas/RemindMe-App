import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, useThemeColors } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';
import { ReminderFormData, ReminderCategory, RecurrenceConfig } from '../../types';
import { CategorySelector, ColorSelector, RecurrenceSelector } from './Selectors';
import { SoundPicker } from './SoundPicker';
import { Button } from '../ui/Button';
import { parseNaturalLanguage, formatDetectedDate } from '../../services/nlpService';

interface ReminderFormProps {
  initialData?: Partial<ReminderFormData>;
  onSubmit: (data: ReminderFormData) => void;
  submitLabel: string;
}

export function ReminderForm({ initialData, onSubmit, submitLabel }: ReminderFormProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);
  const fontStyle = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily) };
  const fontBold = { fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily, 'bold') };

  const getDefaultDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  };

  // NLP state
  const [nlpInput, setNlpInput] = useState('');
  const [nlpDate, setNlpDate] = useState<Date | null>(null);
  const [nlpDateLabel, setNlpDateLabel] = useState<string | null>(null);
  const [nlpApplied, setNlpApplied] = useState(false);

  // Manual form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [datetime, setDatetime] = useState(new Date(initialData?.datetime || getDefaultDate()));
  const [category, setCategory] = useState<ReminderCategory>(
    initialData?.category || settings.defaultCategory
  );
  const [color, setColor] = useState(initialData?.color || settings.defaultColor);
  const [soundId, setSoundId] = useState(initialData?.soundId || settings.defaultSoundId);
  const [recurrence, setRecurrence] = useState<RecurrenceConfig>(
    initialData?.recurrence || { type: 'none' }
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  // Parse NLP input on every keystroke for real-time feedback
  const handleNlpChange = useCallback((text: string) => {
    setNlpInput(text);
    setNlpApplied(false);

    if (text.trim().length < 5) {
      setNlpDate(null);
      setNlpDateLabel(null);
      return;
    }

    const result = parseNaturalLanguage(text);
    if (result.date && result.date > new Date()) {
      setNlpDate(result.date);
      setNlpDateLabel(formatDetectedDate(result.date));
    } else {
      setNlpDate(null);
      setNlpDateLabel(null);
    }
  }, []);

  // Apply NLP result → populate title + datetime fields automatically
  const applyNlpResult = () => {
    if (!nlpDate) return;
    const result = parseNaturalLanguage(nlpInput);
    setTitle(result.title);
    setDatetime(nlpDate);
    setNlpApplied(true);
    setNlpInput('');
    setNlpDate(null);
    setNlpDateLabel(null);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const now = new Date();
      const syncedDate = new Date(selectedDate);
      syncedDate.setSeconds(0);
      syncedDate.setMilliseconds(0);
      if (pickerMode === 'time' && syncedDate.getTime() < now.getTime()) {
        syncedDate.setDate(syncedDate.getDate() + 1);
      }
      setDatetime(syncedDate);
    }
  };

  const showPicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowDatePicker(true);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title,
      description,
      datetime: datetime.getTime(),
      category,
      color,
      soundId,
      recurrence,
      isActive,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── NLP Smart Input ── */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }, fontBold]}>
          ✨ Entrada inteligente
        </Text>
        <Text style={[styles.nlpHint, { color: colors.textTertiary }, fontStyle]}>
          Escribe en lenguaje natural: "Llamar al médico mañana a las 3pm"
        </Text>

        <View style={[
          styles.nlpInputWrapper,
          { backgroundColor: colors.surface, borderColor: nlpDate ? colors.primary : colors.border },
        ]}>
          <TextInput
            style={[styles.nlpInput, { color: colors.text }, fontStyle]}
            placeholder="¿Qué quieres recordar y cuándo?"
            placeholderTextColor={colors.textTertiary}
            value={nlpInput}
            onChangeText={handleNlpChange}
            multiline
          />
          {nlpDate && (
            <TouchableOpacity
              style={[styles.nlpApplyBtn, { backgroundColor: colors.primary }]}
              onPress={applyNlpResult}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Real-time detection badge */}
        {nlpDateLabel && (
          <TouchableOpacity
            style={[styles.nlpBadge, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}
            onPress={applyNlpResult}
            activeOpacity={0.75}
          >
            <Ionicons name="calendar" size={14} color={colors.primary} />
            <Text style={[styles.nlpBadgeText, { color: colors.primary }, fontBold]}>
              {' '}{nlpDateLabel}
            </Text>
            <Text style={[styles.nlpBadgeTap, { color: colors.primary }, fontStyle]}>
              {' '}· Toca para aplicar
            </Text>
          </TouchableOpacity>
        )}

        {/* Success confirmation */}
        {nlpApplied && (
          <View style={[styles.nlpBadge, { backgroundColor: colors.success + '18', borderColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[styles.nlpBadgeText, { color: colors.success }, fontStyle]}>
              {' '}¡Título y fecha aplicados automáticamente!
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* ── Manual Title ── */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }, fontBold]}>Título</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }, fontStyle]}
          placeholder="¿Qué quieres recordar?"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }, fontBold]}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }, fontStyle]}
          placeholder="Detalles adicionales..."
          placeholderTextColor={colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }, fontBold]}>Fecha y Hora</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={[styles.dateTimeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => showPicker('date')}
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={[styles.dateTimeText, { color: colors.text }, fontStyle]}>
              {datetime.toLocaleDateString('es-ES')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateTimeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => showPicker('time')}
          >
            <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
            <Text style={[styles.dateTimeText, { color: colors.text }, fontStyle]}>
              {datetime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={datetime}
            mode={pickerMode}
            is24Hour={true}
            display="default"
            onChange={onDateChange}
            // @ts-ignore
            onValueChange={Platform.OS === 'android' ? onDateChange : undefined}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }, fontBold]}>Categoría</Text>
        <CategorySelector value={category} onChange={setCategory} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }, fontBold]}>Color</Text>
        <ColorSelector value={color} onChange={setColor} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }, fontBold]}>Sonido</Text>
        <SoundPicker value={soundId} onChange={setSoundId} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }, fontBold]}>Repetición</Text>
        <RecurrenceSelector value={recurrence} onChange={setRecurrence} />
      </View>

      <Button
        label={submitLabel}
        onPress={handleSubmit}
        disabled={!title.trim()}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.base, paddingBottom: SPACING.xxxl },
  section: { marginBottom: SPACING.lg },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  nlpHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  nlpInputWrapper: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  nlpInput: {
    flex: 1,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  nlpApplyBtn: {
    width: 44,
    height: 44,
    margin: SPACING.xs,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  nlpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
  },
  nlpBadgeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: '600',
  },
  nlpBadgeTap: {
    fontSize: TYPOGRAPHY.sizes.xs,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    marginBottom: SPACING.lg,
    marginHorizontal: -SPACING.base,
  },
  input: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateTimeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  dateTimeText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
});
