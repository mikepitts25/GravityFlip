import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { palette } from '../game/render/palette';

interface Props {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function NeonButton({ label, onPress, color = palette.accent, disabled, style }: Props) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: color, shadowColor: color, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    minWidth: 220,
  },
  label: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
