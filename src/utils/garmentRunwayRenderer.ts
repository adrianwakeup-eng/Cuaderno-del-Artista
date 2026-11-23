import type { RunwayColorGrade } from '../types/crochet';

const imageLoadCache = new Map<string, Promise<HTMLImageElement>>();
const gradedDataUrlCache = new Map<string, string>();
const MAX_GRADED_CACHE = 96;

export function loadCachedImage(src: string): Promise<HTMLImageElement> {
  const existing = imageLoadCache.get(src);
  if (existing) return existing;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      imageLoadCache.delete(src);
      reject(err);
    };
    img.src = src;
  });
  imageLoadCache.set(src, promise);
  return promise;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [214, 178, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hue2rgb(p: number, q: number, tInput: number): number {
  let t = tInput;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

export function isGradeIdentity(grade?: RunwayColorGrade | null): boolean {
  if (!grade) return true;
  const hue = grade.hueDeg ?? 0;
  const sat = grade.satScale ?? 1;
  const light = grade.lightScale ?? 1;
  const contrast = grade.contrastScale ?? 1;
  const tintStr = grade.tintStrength ?? 0;
  return (
    Math.abs(hue) < 0.5 &&
    Math.abs(sat - 1) < 0.02 &&
    Math.abs(light - 1) < 0.02 &&
    Math.abs(contrast - 1) < 0.02 &&
    tintStr < 0.01
  );
}

/**
 * Applies a luxury runway color-grade STRICTLY inside the precomputed garment-only mask
 * so the model's face, hair, glasses, skin, and white sneakers stay 100% untouched.
 */
export async function renderSkinSafeRunwayImage(
  srcUrl: string,
  maskUrl: string | undefined,
  grade: RunwayColorGrade | null | undefined,
  maxWidth = 960
): Promise<string> {
  if (!srcUrl || isGradeIdentity(grade)) return srcUrl;

  const key = `${srcUrl}|${maskUrl ?? 'all'}|${JSON.stringify(grade)}|${maxWidth}`;
  const cached = gradedDataUrlCache.get(key);
  if (cached) return cached;

  const [img, maskImg] = await Promise.all([
    loadCachedImage(srcUrl),
    maskUrl ? loadCachedImage(maskUrl).catch(() => null) : Promise.resolve(null),
  ]);

  const scale = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return srcUrl;

  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let maskData: Uint8ClampedArray | null = null;
  if (maskImg) {
    const mCanvas = document.createElement('canvas');
    mCanvas.width = w;
    mCanvas.height = h;
    const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });
    if (mCtx) {
      mCtx.drawImage(maskImg, 0, 0, w, h);
      maskData = mCtx.getImageData(0, 0, w, h).data;
    }
  }

  const hueShift = ((grade?.hueDeg ?? 0) % 360) / 360;
  const satScale = grade?.satScale ?? 1;
  const lightScale = grade?.lightScale ?? 1;
  const contrastScale = grade?.contrastScale ?? 1;
  const tintStrength = Math.max(0, Math.min(0.65, grade?.tintStrength ?? 0));
  const [tr, tg, tb] = grade?.tintHex ? hexToRgb(grade.tintHex) : [0, 0, 0];

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 10) continue;

    // Mask weight: 0 = protected skin/face/shoes, 1 = garment yarn
    const mWeight = maskData ? maskData[i] / 255 : 1;
    if (mWeight <= 0.02) continue;

    const r0 = data[i];
    const g0 = data[i + 1];
    const b0 = data[i + 2];

    const [h0, s0, l0] = rgbToHsl(r0, g0, b0);
    const h1 = (h0 + hueShift + 1) % 1;
    const s1 = Math.max(0, Math.min(1, s0 * satScale));
    let l1 = Math.max(0, Math.min(1, l0 * lightScale));
    if (contrastScale !== 1) {
      l1 = Math.max(0, Math.min(1, (l1 - 0.5) * contrastScale + 0.5));
    }

    let [r1, g1, b1] = hslToRgb(h1, s1, l1);

    if (tintStrength > 0) {
      // Soft luminance-preserving yarn dye blend
      const lum = (0.299 * r1 + 0.587 * g1 + 0.114 * b1) / 255;
      const dyedR = Math.min(255, tr * (0.35 + lum * 0.95));
      const dyedG = Math.min(255, tg * (0.35 + lum * 0.95));
      const dyedB = Math.min(255, tb * (0.35 + lum * 0.95));
      r1 = Math.round(r1 * (1 - tintStrength) + dyedR * tintStrength);
      g1 = Math.round(g1 * (1 - tintStrength) + dyedG * tintStrength);
      b1 = Math.round(b1 * (1 - tintStrength) + dyedB * tintStrength);
    }

    if (mWeight >= 0.99) {
      data[i] = r1;
      data[i + 1] = g1;
      data[i + 2] = b1;
    } else {
      data[i] = Math.round(r0 * (1 - mWeight) + r1 * mWeight);
      data[i + 1] = Math.round(g0 * (1 - mWeight) + g1 * mWeight);
      data[i + 2] = Math.round(b0 * (1 - mWeight) + b1 * mWeight);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const outUrl = canvas.toDataURL('image/png');

  if (gradedDataUrlCache.size >= MAX_GRADED_CACHE) {
    const firstKey = gradedDataUrlCache.keys().next().value;
    if (firstKey) gradedDataUrlCache.delete(firstKey);
  }
  gradedDataUrlCache.set(key, outUrl);
  return outUrl;
}

export interface TransparentModelWithRugResult {
  blob: Blob;
  dataUrl: string;
}

/**
 * Exports a 100% transparent RGBA PNG containing ONLY:
 * 1) The circular crochet rug at the model's feet
 * 2) A soft natural foot contact shadow on the rug
 * 3) The crisp 2D cut-out model figure standing flush on the rug
 * Zero studio walls, zero curtains, zero UI — ready to copy/paste anywhere with transparent background.
 */
export async function composeTransparentModelWithRug(options: {
  modelSrc: string;
  rugSrc?: string;
  flipX?: boolean;
  includeRug?: boolean;
}): Promise<TransparentModelWithRugResult | null> {
  const {
    modelSrc,
    rugSrc = '/vestidor/artisan/crochet-rug.png',
    flipX = false,
    includeRug = true,
  } = options;

  try {
    const [modelImg, rugImg] = await Promise.all([
      loadCachedImage(modelSrc),
      includeRug ? loadCachedImage(rugSrc).catch(() => null) : Promise.resolve(null),
    ]);

    const W = 1280;
    const H = 1820;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 100% transparent background
    ctx.clearRect(0, 0, W, H);

    const rugY = H - 208;

    // 1. Circular hand-crocheted rug at feet
    if (includeRug && rugImg && rugImg.naturalWidth > 0) {
      ctx.save();
      const rugW = 960;
      const rugH = (rugImg.naturalHeight / rugImg.naturalWidth) * rugW;
      ctx.shadowColor = 'rgba(54, 24, 10, 0.24)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;
      ctx.drawImage(rugImg, (W - rugW) / 2, rugY - rugH * 0.5, rugW, rugH);
      ctx.restore();

      // Grounded foot contact shadow on rug
      ctx.save();
      const footShadow = ctx.createRadialGradient(W / 2, rugY + 6, 22, W / 2, rugY + 6, 226);
      footShadow.addColorStop(0, 'rgba(54, 24, 10, 0.44)');
      footShadow.addColorStop(0.58, 'rgba(54, 24, 10, 0.16)');
      footShadow.addColorStop(1, 'rgba(54, 24, 10, 0)');
      ctx.fillStyle = footShadow;
      ctx.beginPath();
      ctx.ellipse(W / 2, rugY + 6, 226, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Crisp Ultra-HD 2D model standing flush on the rug
    const maxDrawH = rugY + 34 - 88;
    const maxDrawW = W - 160;
    const aspect = modelImg.naturalWidth / Math.max(1, modelImg.naturalHeight);
    let targetH = maxDrawH;
    let targetW = targetH * aspect;
    if (targetW > maxDrawW) {
      targetW = maxDrawW;
      targetH = targetW / aspect;
    }
    const drawX = (W - targetW) / 2;
    const drawY = rugY + 34 - targetH;

    ctx.save();
    if (flipX) {
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(modelImg, W - drawX - targetW, drawY, targetW, targetH);
    } else {
      ctx.drawImage(modelImg, drawX, drawY, targetW, targetH);
    }
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png');
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (!blob) return null;
    return { blob, dataUrl };
  } catch {
    return null;
  }
}

export async function copyPngBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.write === 'function' &&
      typeof ClipboardItem !== 'undefined'
    ) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    }
  } catch {
    // Clipboard permission denied or unsupported context — caller falls back to download
  }
  return false;
}
