import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';
import { useThemeColors } from '../../theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  style,
  textStyle,
  fullWidth,
}: ButtonProps) {
  const { settings } = useSettingsStore();
  const colors = useThemeColors(settings.themeId);

  const handlePress = async () => {
    if (settings.hapticFeedback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const bgColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
      ? colors.success
      : variant === 'danger'
      ? colors.error
      : 'transparent';

  const textColor =
    variant === 'ghost' ? colors.primary : '#FFF';

  const height = size === 'sm' ? 36 : size === 'lg' ? 56 : 46;
  const fontSize =
    size === 'sm' ? TYPOGRAPHY.sizes.sm : size === 'lg' ? TYPOGRAPHY.sizes.md : TYPOGRAPHY.sizes.base;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        { backgroundColor: bgColor, height, borderRadius: RADIUS.md },
        variant === 'ghost' && { borderWidth: 1.5, borderColor: colors.primary },
        fullWidth && { width: '100%' },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.text, { color: textColor, fontSize, fontFamily: TYPOGRAPHY.getFontFamily(settings.fontFamily) }, textStyle]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { marginRight: SPACING.sm },
  text: { fontWeight: TYPOGRAPHY.weights.semibold },
});
