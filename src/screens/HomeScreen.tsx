import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../game/render/palette';
import { useMetaStore } from '../state/metaStore';
import { NeonButton } from '../ui/NeonButton';

interface Props {
  onPlay: () => void;
  onShop: () => void;
  onSettings: () => void;
}

export function HomeScreen({ onPlay, onShop, onSettings }: Props) {
  const bestScore = useMetaStore((s) => s.bestScore);
  const coins = useMetaStore((s) => s.coins);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>GRAVITY</Text>
      <Text style={styles.titleAccent}>FLIP</Text>
      <Text style={styles.tag}>Tap to flip gravity. Dodge everything.</Text>

      <View style={styles.stats}>
        <Text style={styles.stat}>Best  {bestScore}</Text>
        <Text style={[styles.stat, { color: palette.coin }]}>🪙 {coins}</Text>
      </View>

      <View style={styles.buttons}>
        <NeonButton label="PLAY" onPress={onPlay} />
        <NeonButton label="SHOP" color={palette.coin} onPress={onShop} />
        <NeonButton label="SETTINGS" color={palette.textDim} onPress={onSettings} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bgTop, padding: 24 },
  title: { color: palette.text, fontSize: 56, fontWeight: '900', letterSpacing: 4 },
  titleAccent: { color: palette.accent, fontSize: 56, fontWeight: '900', letterSpacing: 12, marginTop: -12 },
  tag: { color: palette.textDim, fontSize: 15, marginTop: 16, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 24, marginTop: 28, marginBottom: 36 },
  stat: { color: palette.text, fontSize: 18, fontWeight: '700' },
  buttons: { gap: 16, alignItems: 'center' },
});
