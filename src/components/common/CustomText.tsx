import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { TYPOGRAPHY } from '../../theme';

interface CustomTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'bold' | 'italic';
}

export function CustomText({ style, weight = 'regular', ...props }: CustomTextProps) {
  const { settings } = useSettingsStore();
  
  const fontFamily = TYPOGRAPHY.getFontFamily(settings.fontFamily, weight);
  
  return (
    <Text
      {...props}
      style={[
        { fontFamily },
        style,
      ]}
    />
  );
}
