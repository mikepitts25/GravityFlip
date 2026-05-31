import {
  BlurMask,
  Circle,
  Group,
  Path,
  RoundedRect,
  Skia,
} from '@shopify/react-native-skia';
import React from 'react';

import { SKINS } from '../skins';
import type { SkinId } from '../../state/metaStore';

interface Props {
  skin: SkinId;
  x: number;
  y: number;
  size: number;
  opacity?: number;
}

/** Renders the player body as a glowing neon shape per the equipped skin. */
export function PlayerShape({ skin, x, y, size, opacity = 1 }: Props) {
  const def = SKINS[skin];
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;

  let body: React.ReactNode;
  switch (def.shape) {
    case 'triangle': {
      const p = Skia.Path.Make();
      p.moveTo(x + size, cy);
      p.lineTo(x, y + size * 0.15);
      p.lineTo(x, y + size * 0.85);
      p.close();
      body = <Path path={p} color={def.color} />;
      break;
    }
    case 'blob':
      body = <Circle cx={cx} cy={cy} r={r} color={def.color} />;
      break;
    case 'cat': {
      const p = Skia.Path.Make();
      // ears
      p.moveTo(x + size * 0.1, y + size * 0.15);
      p.lineTo(x + size * 0.3, y - size * 0.1);
      p.lineTo(x + size * 0.45, y + size * 0.15);
      p.moveTo(x + size * 0.55, y + size * 0.15);
      p.lineTo(x + size * 0.7, y - size * 0.1);
      p.lineTo(x + size * 0.9, y + size * 0.15);
      body = (
        <Group>
          <Path path={p} color={def.color} />
          <RoundedRect x={x} y={y + size * 0.1} width={size} height={size * 0.9} r={size * 0.28} color={def.color} />
        </Group>
      );
      break;
    }
    case 'square':
    default:
      body = <RoundedRect x={x} y={y} width={size} height={size} r={size * 0.22} color={def.color} />;
      break;
  }

  return (
    <Group opacity={opacity}>
      <Group>
        <BlurMask blur={18} style="solid" />
        {body}
      </Group>
      {body}
    </Group>
  );
}
