import type { CrochetGifDef } from '../data/crochetGifs';
import { renderCrochetGifFrame } from './crochetGifScenes';

export interface EncodedCrochetGif {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

const gifCache = new Map<string, EncodedCrochetGif>();

function writeU16LE(out: number[], val: number) {
  out.push(val & 0xff, (val >> 8) & 0xff);
}

function lzwEncode(indices: Uint8Array, minCodeSize = 8): number[] {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;

  // Dictionary keyed by (prefix << 8) | suffix; max prefix 4095, suffix 255 => max 1,048,575
  const dict = new Int32Array(4096 * 256);
  dict.fill(-1);

  const bytes: number[] = [];
  let bitBuf = 0;
  let bitCount = 0;

  const emit = (code: number) => {
    bitBuf |= code << bitCount;
    bitCount += codeSize;
    while (bitCount >= 8) {
      bytes.push(bitBuf & 0xff);
      bitBuf >>= 8;
      bitCount -= 8;
    }
  };

  const resetDict = () => {
    dict.fill(-1);
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
  };

  emit(clearCode);
  let prefix = indices[0] ?? 0;

  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const found = dict[key];
    if (found !== -1) {
      prefix = found;
    } else {
      emit(prefix);
      if (nextCode < 4096) {
        dict[key] = nextCode++;
        if (nextCode > 1 << codeSize && codeSize < 12) {
          codeSize++;
        }
      } else {
        emit(clearCode);
        resetDict();
      }
      prefix = k;
    }
  }

  emit(prefix);
  emit(eoiCode);
  if (bitCount > 0) {
    bytes.push(bitBuf & 0xff);
  }

  // Split into GIF sub-blocks (<= 255 bytes each)
  const out: number[] = [minCodeSize];
  for (let i = 0; i < bytes.length; i += 255) {
    const chunkLen = Math.min(255, bytes.length - i);
    out.push(chunkLen);
    for (let j = 0; j < chunkLen; j++) {
      out.push(bytes[i + j]);
    }
  }
  out.push(0); // block terminator
  return out;
}

function uint8ToBase64(u8: Uint8Array): string {
  const chunks: string[] = [];
  const step = 0x8000;
  for (let i = 0; i < u8.length; i += step) {
    chunks.push(String.fromCharCode(...u8.subarray(i, i + step)));
  }
  return btoa(chunks.join(''));
}

export function encodeCrochetGif(
  gif: CrochetGifDef,
  options?: { size?: number; frames?: number; transparentBg?: boolean }
): EncodedCrochetGif {
  const size = options?.size ?? 128;
  const framesCount = options?.frames ?? 12;
  const transparentBg = options?.transparentBg ?? true;
  const cacheKey = `${gif.id}:${size}:${framesCount}:${transparentBg ? 't' : 'o'}`;

  const cached = gifCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Render all frames and collect 5-bit quantized color frequency
  const framePixels: Uint8ClampedArray[] = [];
  const bucketCounts = new Map<number, { count: number; rSum: number; gSum: number; bSum: number }>();

  for (let f = 0; f < framesCount; f++) {
    renderCrochetGifFrame(
      {
        scene: gif.scene,
        colors: gif.colors,
        variant: gif.variant ?? 0,
        progress: f / framesCount,
        size,
        transparentBg,
      },
      ctx
    );
    const data = ctx.getImageData(0, 0, size, size).data;
    framePixels.push(data);

    for (let p = 0; p < data.length; p += 4) {
      const a = data[p + 3];
      if (a < 96) continue;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const bucket = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      const entry = bucketCounts.get(bucket);
      if (entry) {
        entry.count++;
        entry.rSum += r;
        entry.gSum += g;
        entry.bSum += b;
      } else {
        bucketCounts.set(bucket, { count: 1, rSum: r, gSum: g, bSum: b });
      }
    }
  }

  // Top 255 colors for Global Color Table (index 0 reserved for transparency)
  const sorted = Array.from(bucketCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 255);

  const palette = new Uint8Array(256 * 3); // index 0 = 0,0,0
  for (let i = 0; i < sorted.length; i++) {
    const e = sorted[i];
    const idx = (i + 1) * 3;
    palette[idx] = Math.round(e.rSum / e.count);
    palette[idx + 1] = Math.round(e.gSum / e.count);
    palette[idx + 2] = Math.round(e.bSum / e.count);
  }
  const paletteSize = sorted.length + 1;

  // Lookup cache for fast RGB555 -> palette index mapping
  const colorLookup = new Int16Array(32768).fill(-1);
  const findNearestPaletteIndex = (r: number, g: number, b: number): number => {
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const hit = colorLookup[key];
    if (hit !== -1) return hit;

    let bestIdx = 1;
    let bestDist = Infinity;
    for (let i = 1; i < paletteSize; i++) {
      const pIdx = i * 3;
      const dr = r - palette[pIdx];
      const dg = g - palette[pIdx + 1];
      const db = b - palette[pIdx + 2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
        if (dist === 0) break;
      }
    }
    colorLookup[key] = bestIdx;
    return bestIdx;
  };

  const out: number[] = [];

  // Header "GIF89a"
  out.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);

  // Logical Screen Descriptor (256-entry GCT => packed 0xF7)
  writeU16LE(out, size);
  writeU16LE(out, size);
  out.push(0xf7, 0x00, 0x00);

  // Global Color Table (768 bytes)
  for (let i = 0; i < palette.length; i++) {
    out.push(palette[i]);
  }

  // Netscape 2.0 Application Extension (infinite loop)
  out.push(
    0x21, 0xff, 0x0b,
    0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30,
    0x03, 0x01, 0x00, 0x00, 0x00
  );

  const delayCs = gif.delayCs ?? 8;
  const pixelCount = size * size;

  for (let f = 0; f < framesCount; f++) {
    const rgba = framePixels[f];
    const indexed = new Uint8Array(pixelCount);

    for (let p = 0; p < pixelCount; p++) {
      const o = p * 4;
      if (rgba[o + 3] < 96) {
        indexed[p] = 0;
      } else {
        indexed[p] = findNearestPaletteIndex(rgba[o], rgba[o + 1], rgba[o + 2]);
      }
    }

    // Graphic Control Extension: disposal=2 (0x08) + transparent=1 (0x01) = 0x09
    out.push(0x21, 0xf9, 0x04, transparentBg ? 0x09 : 0x04);
    writeU16LE(out, delayCs);
    out.push(0x00, 0x00);

    // Image Descriptor
    out.push(0x2c);
    writeU16LE(out, 0);
    writeU16LE(out, 0);
    writeU16LE(out, size);
    writeU16LE(out, size);
    out.push(0x00);

    // LZW Image Data
    const lzw = lzwEncode(indexed, 8);
    for (let i = 0; i < lzw.length; i++) {
      out.push(lzw[i]);
    }
  }

  // GIF Trailer
  out.push(0x3b);

  const u8 = new Uint8Array(out);
  const blob = new Blob([u8], { type: 'image/gif' });
  const dataUrl = `data:image/gif;base64,${uint8ToBase64(u8)}`;
  const result: EncodedCrochetGif = { dataUrl, blob, width: size, height: size };
  gifCache.set(cacheKey, result);
  return result;
}
