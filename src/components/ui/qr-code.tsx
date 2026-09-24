import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

type QrCodeProps = {
  /** String encoded by the mock QR (the tag id in Phase 1). */
  value: string;
  size?: number;
};

/**
 * Deterministic QR-look placeholder (mockup qr-tag-ready.webp). Real QR
 * generation lands in Phase 6; until then a seeded 21×21 matrix with the
 * three finder patterns renders a convincing, stable code per tag id.
 */
export function QrCode({ value, size = 190 }: QrCodeProps) {
  const grid = useMemo(() => buildMatrix(value), [value]);
  const cell = size / 21;

  return (
    <View style={[styles.frame, { padding: cell }]}>
      <View style={styles.grid}>
        {grid.map((row, y) => (
          <View key={`row-${y}`} style={styles.row}>
            {row.map((dark, x) => (
              <View
                key={`cell-${x}-${y}`}
                style={[styles.cell, { height: cell, width: cell }, dark && styles.cellDark]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/** 21×21 QR-shaped matrix with finder patterns, seeded by the value. */
function buildMatrix(seedValue: string): boolean[][] {
  const n = 21;
  const grid: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => false));

  // Tiny deterministic PRNG (mulberry32) seeded from the string.
  let seed = 0;
  for (const ch of seedValue) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  let state = seed || 1;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const inFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);

  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (inFinder(x, y)) continue;
      grid[y][x] = next() > 0.52;
    }
  }

  const drawFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const ring = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = ring || core;
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(n - 7, 0);
  drawFinder(0, n - 7);

  return grid;
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.line,
  },
  grid: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    backgroundColor: '#ffffff',
  },
  cellDark: {
    backgroundColor: '#111111',
  },
});
