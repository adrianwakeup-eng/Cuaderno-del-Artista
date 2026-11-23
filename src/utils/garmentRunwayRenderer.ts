import type { RunwayColorGrade } from '../types/crochet';
import { fitSafeCanvasSize, superRenderImageToCanvas } from './ultraHdImageEngine';

const imageLoadCache = new Map<string, Promise<HTMLImageElement>>();
const gradedDataUrlCache = new Map<string, string>();
const bottomPadFractionCache = new Map<string, number>();
const MAX_GRADED_CACHE = 96;

/**
 * Estimates a safe default transparent bottom-margin fraction from the image URL
 * before pixel scanning completes (e.g. 4.16% on 1280×2160 official/collection renders,
 * 3.31% on 720×1080 / 1440×2160 pose & outfit renders).
 */
export function estimateBottomPadFractionFromSrc(src: string | undefined | null): number {
  if (!src) return 0.0416;
  if (src.includes('/poses/') || src.includes('/conjuntos/')) return 0.033;
  if (src.includes('/coleccion/') || src.includes('/modelo-oficial/')) return 0.0416;
  return 0.02;
}

/**
 * Measures the exact fraction of empty transparent padding beneath the model's shoe soles
 * (0..0.25) so the soles always land dead-center on the circular crochet rug with zero floating.
 * Results are cached per image URL and computed in < 1ms on a downsampled offscreen canvas.
 */
export function measureImageBottomPadFraction(img: HTMLImageElement | null | undefined): number {
  if (!img || !img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
    return estimateBottomPadFractionFromSrc(img?.src);
  }
  const cacheKey = img.currentSrc || img.src;
  const cached = cacheKey ? bottomPadFractionCache.get(cacheKey) : undefined;
  if (cached !== undefined) return cached;

  try {
    const sampleW = 140;
    const sampleH = Math.max(80, Math.round((img.naturalHeight / img.naturalWidth) * sampleW));
    const canvas = document.createElement('canvas');
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return estimateBottomPadFractionFromSrc(cacheKey);
    ctx.clearRect(0, 0, sampleW, sampleH);
    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    const data = ctx.getImageData(0, 0, sampleW, sampleH).data;

    let maxOpaqueY = -1;
    // Scan from bottom up for the first row with opaque sole pixels (alpha > 42)
    outer: for (let y = sampleH - 1; y >= Math.floor(sampleH * 0.65); y--) {
      const rowOffset = y * sampleW * 4;
      let opaqueCount = 0;
      for (let x = 0; x < sampleW; x++) {
        if (data[rowOffset + x * 4 + 3] > 42) {
          opaqueCount++;
          if (opaqueCount >= 2) {
            maxOpaqueY = y;
            break outer;
          }
        }
      }
    }

    const measured =
      maxOpaqueY >= 0
        ? Math.max(0, Math.min(0.22, (sampleH - 1 - maxOpaqueY) / sampleH))
        : estimateBottomPadFractionFromSrc(cacheKey);

    if (cacheKey) {
      if (bottomPadFractionCache.size >= 160) {
        const first = bottomPadFractionCache.keys().next().value;
        if (first) bottomPadFractionCache.delete(first);
      }
      bottomPadFractionCache.set(cacheKey, measured);
    }
    return measured;
  } catch {
    return estimateBottomPadFractionFromSrc(cacheKey);
  }
}

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
  maxWidth = 1280
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
 * Exports a 100% transparent RGBA PNG at 8K Ultra-HD (5390×7680, or 4K for fast clipboard)
 * containing ONLY:
 * 1) The circular crochet rug super-rendered flat beneath the model's feet
 * 2) Soft natural foot contact shadows on the rug center medallion
 * 3) The crisp super-resolved 2D cut-out model figure standing flush on the rug
 * Zero studio walls, zero curtains, zero UI — zero pixelation.
 */
export async function composeTransparentModelWithRug(options: {
  modelSrc: string;
  rugSrc?: string;
  flipX?: boolean;
  includeRug?: boolean;
  resolution?: '4k' | '8k';
}): Promise<TransparentModelWithRugResult | null> {
  const {
    modelSrc,
    rugSrc = '/vestidor/artisan/crochet-rug.png',
    flipX = false,
    includeRug = true,
    resolution = '8k',
  } = options;

  try {
    const [modelImg, rugImg] = await Promise.all([
      loadCachedImage(modelSrc),
      includeRug ? loadCachedImage(rugSrc).catch(() => null) : Promise.resolve(null),
    ]);

    const targetLong = resolution === '8k' ? 7680 : 3648;
    const baseAspect = 1600 / 2280;
    const safe = fitSafeCanvasSize(Math.round(targetLong * baseAspect), targetLong);
    const W = safe.width;
    const H = safe.height;
    const unit = H / 2280;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 100% transparent background
    ctx.clearRect(0, 0, W, H);

    // Measure exact transparent padding beneath the shoe soles so feet land dead-center on rug
    const bottomPadFrac = measureImageBottomPadFraction(modelImg);
    const RUG_PERSPECTIVE_ASPECT = 2.85;
    const rugW = Math.round(1180 * unit);
    const rugH = Math.round(rugW / RUG_PERSPECTIVE_ASPECT);
    const rugBottomY = H - Math.round(36 * unit);
    const rugTopY = rugBottomY - rugH;
    const soleY = rugBottomY - Math.round(rugH * 0.48);

    // 1. Circular hand-crocheted rug super-rendered flat beneath the model's feet
    if (includeRug && rugImg && rugImg.naturalWidth > 0) {
      // Soft grounded floor shadow beneath the woven rug
      ctx.save();
      const rugFloorShadow = ctx.createRadialGradient(
        W / 2,
        rugBottomY - rugH * 0.42,
        rugW * 0.18,
        W / 2,
        rugBottomY - rugH * 0.42,
        rugW * 0.54
      );
      rugFloorShadow.addColorStop(0, 'rgba(54, 24, 10, 0.34)');
      rugFloorShadow.addColorStop(0.72, 'rgba(54, 24, 10, 0.14)');
      rugFloorShadow.addColorStop(1, 'rgba(54, 24, 10, 0)');
      ctx.fillStyle = rugFloorShadow;
      ctx.beginPath();
      ctx.ellipse(W / 2, rugBottomY - rugH * 0.42, rugW * 0.53, rugH * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const superRug = superRenderImageToCanvas(rugImg, rugW, rugH, {
        sharpness: 0.78,
        clarity: 0.06,
        vibrance: 0.04,
      });
      ctx.save();
      ctx.drawImage(superRug, (W - rugW) / 2, rugTopY, rugW, rugH);
      ctx.restore();

      // Grounded foot contact shadows directly under the shoe soles on the rug center medallion
      ctx.save();
      const ambientShadow = ctx.createRadialGradient(
        W / 2,
        soleY + 4 * unit,
        24 * unit,
        W / 2,
        soleY + 4 * unit,
        290 * unit
      );
      ambientShadow.addColorStop(0, 'rgba(48, 20, 8, 0.42)');
      ambientShadow.addColorStop(0.55, 'rgba(48, 20, 8, 0.18)');
      ambientShadow.addColorStop(1, 'rgba(48, 20, 8, 0)');
      ctx.fillStyle = ambientShadow;
      ctx.beginPath();
      ctx.ellipse(W / 2, soleY + 4 * unit, 290 * unit, 40 * unit, 0, 0, Math.PI * 2);
      ctx.fill();

      const crispSoleShadow = ctx.createRadialGradient(
        W / 2,
        soleY + 2 * unit,
        12 * unit,
        W / 2,
        soleY + 2 * unit,
        210 * unit
      );
      crispSoleShadow.addColorStop(0, 'rgba(38, 14, 4, 0.46)');
      crispSoleShadow.addColorStop(0.62, 'rgba(38, 14, 4, 0.16)');
      crispSoleShadow.addColorStop(1, 'rgba(38, 14, 4, 0)');
      ctx.fillStyle = crispSoleShadow;
      ctx.beginPath();
      ctx.ellipse(W / 2, soleY + 2 * unit, 210 * unit, 20 * unit, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. Super-rendered 8K 2D model with shoe soles anchored squarely onto the rug center
    const topMargin = Math.round(64 * unit);
    const maxDrawH = Math.round((soleY - topMargin) / Math.max(0.5, 1 - bottomPadFrac));
    const maxDrawW = W - Math.round(160 * unit);
    const aspect = modelImg.naturalWidth / Math.max(1, modelImg.naturalHeight);
    let targetH = maxDrawH;
    let targetW = targetH * aspect;
    if (targetW > maxDrawW) {
      targetW = maxDrawW;
      targetH = targetW / aspect;
    }
    const drawX = (W - targetW) / 2;
    const drawY = soleY - targetH * (1 - bottomPadFrac);

    const superModel = superRenderImageToCanvas(
      modelImg,
      Math.round(targetW),
      Math.round(targetH),
      { sharpness: 0.84, clarity: 0.06, vibrance: 0.04 }
    );

    ctx.save();
    if (flipX) {
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(superModel, W - drawX - targetW, drawY, targetW, targetH);
    } else {
      ctx.drawImage(superModel, drawX, drawY, targetW, targetH);
    }
    ctx.restore();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (!blob) return null;
    const dataUrl = resolution === '8k' ? URL.createObjectURL(blob) : canvas.toDataURL('image/png');
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
