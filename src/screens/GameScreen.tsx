import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { GameView, type GameViewHandle } from '../game/render/GameView';
import { palette } from '../game/render/palette';
import { maybeShowInterstitial, showRewarded } from '../services/ads';
import { useMetaStore } from '../state/metaStore';
import { NeonButton } from '../ui/NeonButton';

interface Props {
  onExit: () => void;
}

interface DeathResult {
  score: number;
  coins: number;
  canResurrect: boolean;
}

export function GameScreen({ onExit }: Props) {
  const equippedSkin = useMetaStore((s) => s.equippedSkin);
  const bestScore = useMetaStore((s) => s.bestScore);
  const recordDeath = useMetaStore((s) => s.recordDeath);

  const viewRef = useRef<GameViewHandle>(null);
  const [death, setDeath] = useState<DeathResult | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [resurrected, setResurrected] = useState(false);

  const handleDeath = useCallback(
    (result: DeathResult) => {
      // Record the run, then decide whether an interstitial is due.
      recordDeath(result.score, result.coins);
      const deaths = useMetaStore.getState().deaths;
      setDeath(result);
      void maybeShowInterstitial(deaths);
    },
    [recordDeath],
  );

  const restart = useCallback(() => {
    setDeath(null);
    setResurrected(false);
    setRunKey((k) => k + 1); // remount GameView → fresh run
  }, []);

  const onWatchRewarded = useCallback(async () => {
    const ok = await showRewarded();
    if (ok && viewRef.current?.resurrect()) {
      setResurrected(true);
      setDeath(null);
    }
  }, []);

  return (
    <View style={styles.root}>
      <GameView key={runKey} ref={viewRef} skin={equippedSkin} onDeath={handleDeath} />

      {death && (
        <View style={styles.overlay}>
          <Text style={styles.gameOver}>GAME OVER</Text>
          <Text style={styles.score}>{death.score}</Text>
          <Text style={styles.best}>Best  {bestScore}</Text>
          <Text style={styles.coins}>🪙 +{death.coins}</Text>

          <View style={styles.buttons}>
            {death.canResurrect && !resurrected && (
              <NeonButton
                label="↺  REVIVE (watch ad)"
                color={palette.coin}
                onPress={onWatchRewarded}
              />
            )}
            <NeonButton label="PLAY AGAIN" onPress={restart} />
            <NeonButton label="HOME" color={palette.textDim} onPress={onExit} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bgTop },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,5,20,0.78)',
  },
  gameOver: { color: palette.hazard, fontSize: 40, fontWeight: '900', letterSpacing: 3 },
  score: { color: palette.text, fontSize: 72, fontWeight: '900', marginTop: 8 },
  best: { color: palette.textDim, fontSize: 18, marginTop: 4 },
  coins: { color: palette.coin, fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 28 },
  buttons: { gap: 14, alignItems: 'center' },
});
