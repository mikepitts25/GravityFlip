import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { palette } from '../game/render/palette';
import { restore } from '../services/iap';
import { useMetaStore } from '../state/metaStore';
import { NeonButton } from '../ui/NeonButton';

interface Props {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: Props) {
  const muted = useMetaStore((s) => s.muted);
  const hapticsOn = useMetaStore((s) => s.hapticsOn);
  const toggleMute = useMetaStore((s) => s.toggleMute);
  const toggleHaptics = useMetaStore((s) => s.toggleHaptics);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>SETTINGS</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Sound</Text>
        <Switch value={!muted} onValueChange={toggleMute} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Haptics</Text>
        <Switch value={hapticsOn} onValueChange={toggleHaptics} />
      </View>

      <View style={styles.footer}>
        <NeonButton label="RESTORE PURCHASES" color={palette.textDim} onPress={() => void restore()} />
        <NeonButton label="BACK" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bgTop, paddingTop: 64, paddingHorizontal: 24 },
  title: { color: palette.text, fontSize: 36, fontWeight: '900', letterSpacing: 4, textAlign: 'center', marginBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: palette.surface,
  },
  label: { color: palette.text, fontSize: 20, fontWeight: '700' },
  footer: { gap: 14, alignItems: 'center', marginTop: 'auto', paddingBottom: 32 },
});
