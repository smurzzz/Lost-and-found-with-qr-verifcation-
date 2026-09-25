#!/usr/bin/env node
/**
 * ClaimIt — import a finished logo image into every icon slot.
 *
 * Usage: node scripts/import-app-icon.mjs <source.png>
 *
 * Decodes the source PNG (all standard row filters), scales it (box filter),
 * and writes the filenames app.config.ts already references:
 *   icon.png (1024), android-icon-foreground.png (512 artwork), android-icon-
 *   background.png (512 flat lavender), android-icon-monochrome.png (512 white
 *   silhouette), splash-icon.png (256 mini tile), favicon.png (48).
 */

import { deflateSync, inflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';

const [, , sourceArg] = process.argv;
if (!sourceArg) {
  console.error('Usage: node scripts/import-app-icon.mjs <source.png>');
  process.exit(1);
}

/* ------------------------------- PNG decode ------------------------------- */

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('Not a PNG file');
  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  let palette = null;
  let trns = null;

  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const payload = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = payload.readUInt32BE(0);
      height = payload.readUInt32BE(4);
      bitDepth = payload[8];
      colorType = payload[9];
      if (payload[12] !== 0) throw new Error('Interlaced PNGs are not supported');
    } else if (type === 'PLTE') {
      palette = Buffer.from(payload);
    } else if (type === 'tRNS') {
      trns = Buffer.from(payload);
    } else if (type === 'IDAT') {
      idat.push(payload);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (channels === undefined || bitDepth !== 8) {
    throw new Error(`Unsupported PNG (bit depth ${bitDepth}, color type ${colorType})`);
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 4);

  // Reverse the per-row filters, then expand to RGBA.
  const prev = Buffer.alloc(stride);
  const cur = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    raw.copy(cur, 0, rowStart + 1, rowStart + 1 + stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v = cur[i];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
      cur[i] = v;
    }
    prev.set(cur);

    for (let x = 0; x < width; x++) {
      const i = x * channels;
      const o = (y * width + x) * 4;
      if (colorType === 6) {
        out[o] = cur[i];
        out[o + 1] = cur[i + 1];
        out[o + 2] = cur[i + 2];
        out[o + 3] = cur[i + 3];
      } else if (colorType === 2) {
        out[o] = cur[i];
        out[o + 1] = cur[i + 1];
        out[o + 2] = cur[i + 2];
        out[o + 3] = 255;
      } else if (colorType === 0) {
        out[o] = out[o + 1] = out[o + 2] = cur[i];
        out[o + 3] = 255;
      } else if (colorType === 4) {
        out[o] = out[o + 1] = out[o + 2] = cur[i];
        out[o + 3] = cur[i + 1];
      } else if (colorType === 3) {
        const idx = cur[i];
        out[o] = palette[idx * 3];
        out[o + 1] = palette[idx * 3 + 1];
        out[o + 2] = palette[idx * 3 + 2];
        out[o + 3] = trns && idx < trns.length ? trns[idx] : 255;
      }
    }
  }
  return { width, height, data: out };
}

/* --------------------------------- scale ---------------------------------- */

/** Box-filter resize to square `size` (letterboxes non-square sources). */
function resizeToSquare(src, size) {
  const { width: sw, height: sh, data } = src;
  const out = Buffer.alloc(size * size * 4);
  // Integer source window per destination pixel (box average).
  const scale = Math.min(sw, sh) / size; // assume square-croppable source
  const srcW = Math.round(size * scale);
  const offX = Math.floor((sw - srcW) / 2);
  const offY = Math.floor((sh - Math.min(sh, srcW)) / 2);

  for (let y = 0; y < size; y++) {
    const y0 = offY + Math.floor(y * scale);
    const y1 = Math.max(y0 + 1, offY + Math.floor((y + 1) * scale));
    for (let x = 0; x < size; x++) {
      const x0 = offX + Math.floor(x * scale);
      const x1 = Math.max(x0 + 1, offX + Math.floor((x + 1) * scale));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      for (let sy = y0; sy < y1 && sy < sh; sy++) {
        for (let sx = x0; sx < x1 && sx < sw; sx++) {
          const i = (sy * sw + sx) * 4;
          const al = data[i + 3] / 255;
          r += data[i] * al;
          g += data[i + 1] * al;
          b += data[i + 2] * al;
          a += al;
          n++;
        }
      }
      const o = (y * size + x) * 4;
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
        out[o + 3] = Math.round((a / n) * 255);
      }
    }
  }
  return out;
}

/** Composite `top` over `base` (both RGBA buffers of one square size). */
function compositeOver(base, top) {
  const out = Buffer.alloc(base.length);
  for (let i = 0; i < base.length; i += 4) {
    const ta = top[i + 3] / 255;
    const ba = base[i + 3] / 255;
    const oa = ta + ba * (1 - ta);
    out[i] = Math.round((top[i] * ta + base[i] * ba * (1 - ta)) / (oa || 1));
    out[i + 1] = Math.round((top[i + 1] * ta + base[i + 1] * ba * (1 - ta)) / (oa || 1));
    out[i + 2] = Math.round((top[i + 2] * ta + base[i + 2] * ba * (1 - ta)) / (oa || 1));
    out[i + 3] = Math.round(oa * 255);
  }
  return out;
}

/** Fill an RGBA buffer with one color. */
function solid(size, [r, g, b]) {
  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = r;
    out[i + 1] = g;
    out[i + 2] = b;
    out[i + 3] = 255;
  }
  return out;
}

/** White silhouette of the artwork (alpha kept, color set to white). */
function whiteSilhouette(rgba) {
  const out = Buffer.from(rgba);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
  }
  return out;
}

/* ------------------------------ PNG encode -------------------------------- */

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
  ihdr[8] = 8;
  ihdr[9] = 6;
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

/* --------------------------------- main ----------------------------------- */

const src = decodePng(readFileSync(sourceArg));
console.log(`Source: ${sourceArg} (${src.width}×${src.height})`);

const ART = resizeToSquare(src, 512); // canonical artwork, square RGBA
const TILE = [244, 244, 252]; // #F4F4FC — near-white lavender like the art
const write = (path, size, rgba) => {
  writeFileSync(path, encodePng(size, rgba));
  console.log(`  ✓ ${path} (${size}×${size})`);
};

console.log('Importing into app icon slots…');

// Full icon: artwork on the light tile, 1024.
const art1024 = resizeToSquare(src, 1024);
write('assets/images/icon.png', 1024, compositeOver(solid(1024, TILE), art1024));

// Android adaptive: lavender background layer + artwork foreground layer.
write('assets/images/android-icon-background.png', 512, solid(512, TILE));
write('assets/images/android-icon-foreground.png', 512, ART);

// Monochrome: white silhouette (alpha from the artwork).
write('assets/images/android-icon-monochrome.png', 512, whiteSilhouette(ART));

// Splash: artwork over the tile (readable on the blue splash background).
write('assets/images/splash-icon.png', 256, compositeOver(solid(256, TILE), resizeToSquare(src, 256)));

// Favicon.
write('assets/images/favicon.png', 48, compositeOver(solid(48, TILE), resizeToSquare(src, 48)));

console.log('Done — icons now match the source artwork.');
