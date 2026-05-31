import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Rect,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import {
  COIN_RADIUS,
  PLAYER_SIZE,
  WORLD_H,
  WORLD_W,
} from '../constants';
import { createRng, type Rng } from '../logic/rng';
import {
  createInitialState,
  resurrect as resurrectSim,
  startRun,
  step,
} from '../logic/step';
import type { GameState } from '../types';
import { haptic, playSfx } from '../../services/audio';
import { track } from '../../services/analytics';
import { useMetaStore, type SkinId } from '../../state/metaStore';
import { obstacleColor, palette } from './palette';
import { PlayerShape } from './PlayerShape';

export interface GameViewHandle {
  resurrect: () => boolean;
}

interface Props {
  skin: SkinId;
  onDeath: (result: { score: number; coins: number; canResurrect: boolean }) => void;
}

/** Number of vertical grid lines drawn for the parallax background. */
const GRID_LINES = 9;

export const GameView = forwardRef<GameViewHandle, Props>(function GameView(
  { skin, onDeath },
  ref,
) {
  const { width, height } = useWindowDimensions();
  // Uniform scale + letterbox the virtual world into the device viewport.
  const scale = Math.min(width / WORLD_W, height / WORLD_H);
  const offX = (width - WORLD_W * scale) / 2;
  const offY = (height - WORLD_H * scale) / 2;

  const stateRef = useRef<GameState>(createInitialState());
  const rngRef = useRef<Rng>(createRng(Date.now() >>> 0));
  const flipQueuedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const deadRef = useRef(false);

  // A frame counter drives Skia re-renders from the imperative sim.
  const [, setFrame] = useState(0);

  const handleDeath = useCallback(() => {
    const s = stateRef.current;
    playSfx('death');
    haptic('heavy');
    track('death', { distance: Math.floor(s.distance), coins: s.coinsCollected });
    onDeath({
      score: Math.floor(s.distance / 10),
      coins: s.coinsCollected,
      canResurrect: !s.usedResurrect,
    });
  }, [onDeath]);

  const loop = useCallback(
    (ts: number) => {
      const last = lastTsRef.current || ts;
      // Clamp dt so a tab-out / GC pause can't teleport the world.
      const dtMs = Math.min(ts - last, 50);
      lastTsRef.current = ts;

      const flip = flipQueuedRef.current;
      flipQueuedRef.current = false;

      const events = step(stateRef.current, { dtMs, flip, rng: rngRef.current });
      if (events.flipped) {
        playSfx('flip');
        haptic('light');
        track('flip');
      }
      if (events.coinsPickedThisStep > 0) {
        playSfx('coin');
        for (let i = 0; i < events.coinsPickedThisStep; i++) track('coin_pickup');
      }

      setFrame((f) => (f + 1) % 1_000_000);

      if (events.died && !deadRef.current) {
        deadRef.current = true;
        handleDeath();
        return; // stop the loop on death
      }
      rafRef.current = requestAnimationFrame(loop);
    },
    [handleDeath],
  );

  // Start a fresh run on mount.
  useEffect(() => {
    startRun(stateRef.current);
    track('run_start');
    deadRef.current = false;
    lastTsRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  const onTap = useCallback(() => {
    flipQueuedRef.current = true;
  }, []);

  // Revive the current run for the one-time rewarded resurrect.
  useImperativeHandle(
    ref,
    () => ({
      resurrect: () => {
        const ok = resurrectSim(stateRef.current);
        if (!ok) return false;
        deadRef.current = false;
        lastTsRef.current = 0;
        haptic('light');
        rafRef.current = requestAnimationFrame(loop);
        return true;
      },
    }),
    [loop],
  );

  const s = stateRef.current;
  const p = s.player;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onTap}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Background gradient */}
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, height)}
            colors={[palette.bgTop, palette.bgBottom]}
          />
        </Rect>

        {/* World, scaled + letterboxed */}
        <Group transform={[{ translateX: offX }, { translateY: offY }, { scale }]}>
          {/* Parallax grid (scrolls slower than the world) */}
          {Array.from({ length: GRID_LINES }).map((_, i) => {
            const spacing = WORLD_W / (GRID_LINES - 1);
            const drift = (s.distance * 0.3) % spacing;
            const x = i * spacing - drift;
            return (
              <Rect key={`g${i}`} x={x} y={0} width={2} height={WORLD_H} color={palette.grid} />
            );
          })}

          {/* Surface rails */}
          <Rect x={0} y={0} width={WORLD_W} height={8} color={palette.surface} />
          <Rect x={0} y={WORLD_H - 8} width={WORLD_W} height={8} color={palette.surface} />

          {/* Coins */}
          {s.coins.map((c) =>
            c.collected ? null : (
              <Group key={`c${c.id}`}>
                <Group>
                  <BlurMask blur={12} style="solid" />
                  <Circle cx={c.x} cy={c.y} r={COIN_RADIUS} color={palette.coinGlow} />
                </Group>
                <Circle cx={c.x} cy={c.y} r={COIN_RADIUS} color={palette.coin} />
              </Group>
            ),
          )}

          {/* Obstacles */}
          {s.obstacles.map((o) => (
            <Group key={`o${o.id}`}>
              <Group>
                <BlurMask blur={14} style="solid" />
                {o.boxes.map((b, bi) => (
                  <RoundedRect
                    key={bi}
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    r={8}
                    color={obstacleColor(o.kind)}
                  />
                ))}
              </Group>
              {o.boxes.map((b, bi) => (
                <RoundedRect
                  key={`f${bi}`}
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  r={8}
                  color={obstacleColor(o.kind)}
                />
              ))}
            </Group>
          ))}

          {/* Player (blinks while invulnerable) */}
          <PlayerShape
            skin={skin}
            x={p.x}
            y={p.y}
            size={PLAYER_SIZE}
            opacity={s.time < p.invulnUntil && Math.floor(s.time / 100) % 2 === 0 ? 0.35 : 1}
          />
        </Group>
      </Canvas>

      {/* Live HUD overlay (re-rendered each frame with the sim) */}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.score}>{Math.floor(s.distance / 10)}</Text>
        <Text style={styles.coins}>🪙 {s.coinsCollected}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  hud: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  score: {
    color: palette.text,
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: 2,
  },
  coins: {
    color: palette.coin,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
});
