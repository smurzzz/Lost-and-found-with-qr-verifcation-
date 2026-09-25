#!/usr/bin/env node
/**
 * ClaimIt — app icon generator (pure Node, zero dependencies).
 *
 * Artwork (user-selected design): a navy QR tag (clipboard-style hanger,
 * outline body, finder squares + data dots) wrapped by an orange scan swoosh
 * with an arrowhead, finished with a green "verified" check badge — on a
 * light lavender tile.
 *
 * Multi-layer SDF renderer with 4×4 supersampling; PNGs are encoded directly
 * (zlib deflate + CRC32). Writes the filenames app.config.ts already
 * references. Rerun any time: node scripts/generate-app-icons.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

/* ------------------------------- palette ---------------------------------- */

const NAVY = [31, 43, 91, 255]; // #1F2B5B tag + modules
const ORANGE = [249, 162, 63, 255]; // #F9A23F scan swoosh
const GREEN = [22, 160, 106, 255]; // #16A06A verified badge
const TILE = [238, 240, 250, 255]; // #EEF0FA light lavender tile
const WHITE = [255, 255, 255, 255];

/* --------------------------- coverage primitives -------------------------- */

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const covFromSDF = (d) => clamp01(0.5 - d);

/** Rounded-rect signed distance (x, y, w, h = top-left + size, r = radius). */
function roundedRectSDF(px, py, x, y, w, h, r) {
  const qx = Math.abs(px - (x + w / 2)) - (w / 2 - r);
  const qy = Math.abs(py - (y + h / 2)) - (h / 2 - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

/** Capsule (thick round-capped segment) distance. */
function capsuleSDF(px, py, ax, ay, bx, by, r) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const t = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
  return Math.hypot(pax - bax * t, pay - bay * t) - r;
}

/** Ring (annulus) distance. */
function ringSDF(px, py, cx, cy, radius, stroke) {
  return Math.abs(Math.hypot(px - cx, py - cy) - radius) - stroke / 2;
}

/** Triangle SDF via edge distances + winding sign (verts in order, y-down). */
function triangleSDF(px, py, verts) {
  const sign = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const d1 = sign(verts[0], verts[1], [px, py]);
  const d2 = sign(verts[1], verts[2], [px, py]);
  const d3 = sign(verts[2], verts[0], [px, py]);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  const inside = !(hasNeg && hasPos);
  let dist = Infinity;
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = verts[i];
    const [bx, by] = verts[(i + 1) % 3];
    dist = Math.min(dist, capsuleSDF(px, py, ax, ay, bx, by, 0));
  }
  return inside ? -dist : dist;
}

/** Square-in-square "finder" coverage: outer ring + solid core. */
function finderSquare(px, py, x, y, cell, stroke) {
  const outer = roundedRectSDF(px, py, x, y, cell, cell, cell * 0.09);
  const inner = roundedRectSDF(
    px,
    py,
    x + stroke,
    y + stroke,
    cell - stroke * 2,
    cell - stroke * 2,
    cell * 0.045,
  );
  const ring = Math.max(covFromSDF(outer), -covFromSDF(inner));
  const coreSide = cell * 0.4;
  const core = roundedRectSDF(
    px,
    py,
    x + (cell - coreSide) / 2,
    y + (cell - coreSide) / 2,
    coreSide,
    coreSide,
    coreSide * 0.12,
  );
  return Math.max(ring, covFromSDF(core));
}

/* ------------------------------- artwork ---------------------------------- */

/**
 * Build the artwork as an ordered layer list in NORMALIZED coords (0..1).
 * Each layer: { color, op: 'over'|'erase', cov(nx, ny) }.
 * `punch` = the color the tag's hanger hole should show (tile color, or null
 * for a transparent punch on the adaptive foreground layer).
 */
function artworkLayers(punch) {
  const ARC_R = 0.46;
  const ARC_W = 0.048;
  // Gap in the swoosh: bottom-left, so it flows clockwise into the arrowhead.
  const GAP_CENTER = (135 * Math.PI) / 180;
  const GAP_HALF = (32 * Math.PI) / 180;

  const arcCov = (nx, ny) => {
    const ring = covFromSDF(ringSDF(nx, ny, 0.5, 0.5, ARC_R, ARC_W));
    if (ring <= 0) return 0;
    const angle = Math.atan2(ny - 0.5, nx - 0.5); // (−π, π]
    const delta = Math.abs(Math.atan2(Math.sin(angle - GAP_CENTER), Math.cos(angle - GAP_CENTER)));
    return delta > GAP_HALF ? ring : 0;
  };

  // Arrowhead at the right side (θ ≈ 10° below horizontal), pointing along
  // the clockwise tangent (down-left).
  const theta = (10 * Math.PI) / 180;
  const cx = 0.5 + ARC_R * Math.cos(theta);
  const cy = 0.5 + ARC_R * Math.sin(theta);
  const tx = -Math.sin(theta); // clockwise tangent
  const ty = Math.cos(theta);
  const nx = Math.cos(theta); // outward normal
  const ny = Math.sin(theta);
  const tip = [cx + tx * 0.115, cy + ty * 0.115];
  const base1 = [cx - tx * 0.015 + nx * 0.072, cy - ty * 0.015 + ny * 0.072];
  const base2 = [cx - tx * 0.015 - nx * 0.072, cy - ty * 0.015 - ny * 0.072];

  const tagRing = (nx2, ny2) => {
    const outer = roundedRectSDF(nx2, ny2, 0.2, 0.17, 0.6, 0.68, 0.12);
    const inner = roundedRectSDF(nx2, ny2, 0.25, 0.22, 0.5, 0.58, 0.075);
    return Math.max(covFromSDF(outer), -covFromSDF(inner));
  };

  // QR data dots (bottom-right quadrant inside the tag).
  const dots = [
    [0.55, 0.5],
    [0.635, 0.5],
    [0.72, 0.5],
    [0.635, 0.555],
    [0.55, 0.61],
    [0.72, 0.61],
    [0.59, 0.655],
    [0.675, 0.655],
  ];
  const dotCov = (nx2, ny2) => {
    let cov = 0;
    for (const [dx, dy] of dots) {
      cov = Math.max(cov, covFromSDF(roundedRectSDF(nx2, ny2, dx, dy, 0.042, 0.042, 0.006)));
    }
    return cov;
  };

  return [
    { op: 'over', color: ORANGE, cov: arcCov },
    {
      op: 'over',
      color: ORANGE,
      cov: (x, y) => covFromSDF(convexPolySDF(x, y, [tip, base1, base2]) + 0.008),
    },
    {
      op: 'over',
      color: NAVY,
      cov: (x, y) =>
        Math.max(tagRing(x, y), covFromSDF(Math.hypot(x - 0.5, y - 0.17) - 0.095)),
    },
    {
      op: punch ? 'over' : 'erase',
      color: punch ?? null,
      cov: (x, y) => covFromSDF(Math.hypot(x - 0.5, y - 0.17) - 0.043),
    },
    {
      op: 'over',
      color: NAVY,
      cov: (x, y) =>
        Math.max(
          finderSquare(x, y, 0.275, 0.275, 0.17, 0.034),
          finderSquare(x, y, 0.555, 0.275, 0.17, 0.034),
          finderSquare(x, y, 0.275, 0.555, 0.17, 0.034),
          dotCov(x, y),
        ),
    },
    {
      op: 'over',
      color: GREEN,
      cov: (x, y) => covFromSDF(Math.hypot(x - 0.5, y - 0.84) - 0.14),
    },
    {
      op: 'over',
      color: WHITE,
      cov: (x, y) =>
        Math.min(
          capsuleSDF(x, y, 0.435, 0.85, 0.482, 0.9, 0.025),
          capsuleSDF(x, y, 0.482, 0.9, 0.575, 0.795, 0.025),
        ) <= 0
          ? 1
          : 0,
    },
  ];
}

/* ------------------------------- rendering -------------------------------- */

/**
 * Render RGBA into `size × size` pixels.
 *  - tile: { color, radius } fills the rounded tile first (null = none).
 *  - layers: normalized-coverage layers mapped through (gx, gy, gw).
 */
function render(size, { tile = null, layers, gx, gy, gw, supersample = 4 }) {
  const data = Buffer.alloc(size * size * 4);
  const SS = supersample;
  const step = 1 / SS;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      // Per-sample accumulated color over the pixel.
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = px + (sx + 0.5) * step;
          const fy = py + (sy + 0.5) * step;

          // Start from the tile (or transparency).
          let sr = 0;
          let sg = 0;
          let sb = 0;
          let sa = 0;
          if (tile) {
            const cov = tile.radius
              ? covFromSDF(roundedRectSDF(fx + 0.5, fy + 0.5, 0, 0, size, size, tile.radius * size))
              : 1;
            const ca = cov;
            sr = tile.color[0] * ca;
            sg = tile.color[1] * ca;
            sb = tile.color[2] * ca;
            sa = ca * 255;
          }

          for (const layer of layers) {
            const cov = layer.cov((fx - gx) / gw, (fy - gy) / gw);
            if (cov <= 0) continue;
            if (layer.op === 'erase' || !layer.color) {
              const ea = cov;
              sa *= 1 - ea;
            } else {
              const ca = cov * (layer.color[3] / 255);
              sr = sr * (1 - ca) + layer.color[0] * ca;
              sg = sg * (1 - ca) + layer.color[1] * ca;
              sb = sb * (1 - ca) + layer.color[2] * ca;
              sa = sa * (1 - ca) + ca * 255;
            }
          }

          // Accumulate the sample into the pixel (box filter).
          const w = 1 / (SS * SS);
          r += sr * w;
          g += sg * w;
          b += sb * w;
          a += sa * w;
        }
      }
      const offset = (py * size + px) * 4;
      data[offset] = Math.round(r);
      data[offset + 1] = Math.round(g);
      data[offset + 2] = Math.round(b);
      data[offset + 3] = Math.round(Math.min(255, a));
    }
  }
  return data;
}

/* ------------------------------ PNG encoding ------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, payload) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(payload.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), payload]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function writeIcon(path, size, options) {
  writeFileSync(path, encodePng(size, render(size, options)));
  console.log(`  ✓ ${path} (${size}×${size})`);
}

/* --------------------------------- outputs -------------------------------- */

console.log('Generating ClaimIt app icons…');

// Full icon: lavender tile (iOS-style radius) + artwork.
const TILE_OPTS = { color: TILE, radius: 0.225 };
writeIcon('assets/images/icon.png', 1024, {
  tile: TILE_OPTS,
  layers: artworkLayers(TILE),
  gx: 60,
  gy: 60,
  gw: 904,
  supersample: 3,
});

// Android adaptive background: flat lavender field.
writeIcon('assets/images/android-icon-background.png', 512, {
  tile: { color: TILE, radius: 0 },
  layers: [],
  gx: 0,
  gy: 0,
  gw: 1,
});

// Android adaptive foreground: artwork only, inside the safe zone (~66%).
const FG = 512;
const fgBox = FG * 0.64;
writeIcon('assets/images/android-icon-foreground.png', FG, {
  tile: null,
  layers: artworkLayers(null), // hole punches through to transparency
  gx: (FG - fgBox) / 2,
  gy: (FG - fgBox) / 2,
  gw: fgBox,
  supersample: 4,
});

// Monochrome: single-color silhouette (badge check erased out of the badge).
const monoLayers = artworkLayers(null).map((layer) => {
  if (layer.op === 'erase') return layer;
  return { ...layer, color: WHITE };
});
writeIcon('assets/images/android-icon-monochrome.png', 512, {
  tile: null,
  layers: monoLayers,
  gx: (FG - fgBox) / 2,
  gy: (FG - fgBox) / 2,
  gw: fgBox,
  supersample: 4,
});

// Splash glyph: mini tile + artwork (reads cleanly on the blue splash bg).
writeIcon('assets/images/splash-icon.png', 256, {
  tile: { color: TILE, radius: 0.2 },
  layers: artworkLayers(TILE),
  gx: 18,
  gy: 18,
  gw: 220,
  supersample: 4,
});

// Favicon.
writeIcon('assets/images/favicon.png', 48, {
  tile: { color: TILE, radius: 10 },
  layers: artworkLayers(TILE),
  gx: 3,
  gy: 3,
  gw: 42,
  supersample: 4,
});

console.log('Done — rerun `npx expo start --clear` / rebuild to see them.');
