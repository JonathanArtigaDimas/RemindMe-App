import React, { useState } from 'react';
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
import { formatDateTime } from '../../utils/dateHelpers';

interface ReminderFormProps {
  initialData?: Partial<ReminderFormData>;
  onSubmit: (data: ReminderFormData) => void;
  submitLabel: string;
}

export function ReminderForm({ initialData, onSubmit, submitLabel }: ReminderFormProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.theme);

  const getDefaultDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 1);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  };

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

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDatetime(selectedDate);
    }
  };

  const showPicker = (mode: 'date' | 'time') => {
    if (Platform.OS === 'ios') {
      setPickerMode(mode);
      setShowDatePicker(true);
    } else {
      // On Android, we show the native picker directly
      setPickerMode(mode);
      setShowDatePicker(true);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      return;
    }

    onSubmit({
      title,
      description,
      datetime: datetime.toISOString(),
      category,
      color,
      soundId,
      recurrence,
      isActive,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Título</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="¿Qué quieres recordar?"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Detalles adicionales..."
          placeholderTextColor={colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Fecha y Hora</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={[styles.dateTimeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => showPicker('date')}
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={[styles.dateTimeText, { color: colors.text }]}>
              {datetime.toLocaleDateString('es-ES')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dateTimeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => showPicker('time')}
          >
            <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
            <Text style={[styles.dateTimeText, { color: colors.text }]}>
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
            // @ts-ignore - Some versions of the picker expect onValueChange on Android
            onValueChange={Platform.OS === 'android' ? onDateChange : undefined}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Categoría</Text>
        <CategorySelector value={category} onChange={setCategory} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
        <ColorSelector value={color} onChange={setColor} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Sonido</Text>
        <SoundPicker value={soundId} onChange={setSoundId} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Repetición</Text>
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
