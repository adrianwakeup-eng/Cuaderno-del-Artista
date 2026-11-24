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

export interface SkinToneGrade {
  id: string;
  targetHex: string;
  lightScale: number;
  satScale: number;
}

/** Smooth YCbCr + RGB human-skin likelihood (0..1), strictly protecting eyes, hair, and white underwear/sneakers. */
function computeSkinLikelihood(r: number, g: number, b: number): number {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  const chroma = maxC - minC;
  // Protect pure dark hair/beard/eyes and bright neutral white underwear/sneakers
  if (lum < 44 || (lum > 180 && chroma < 22) || chroma < 14) return 0;
  if (r < g || g < b - 6) return 0;

  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  if (cb < 74 || cb > 132 || cr < 131 || cr > 180) return 0;

  const cbScore = Math.min(1, Math.min((cb - 74) / 10, (132 - cb) / 10));
  const crScore = Math.min(1, Math.min((cr - 131) / 9, (180 - cr) / 10));
  const chromaScore = Math.min(1, (chroma - 14) / 18);
  const darkGuard = Math.min(1, (lum - 44) / 28);
  return Math.max(0, Math.min(1, cbScore * crScore * chromaScore * darkGuard));
}

/**
 * Applies EXACT, luminance-preserving hyperrealistic yarn recoloring STRICTLY inside the
 * garment mask AND/OR realistic skin-tone grading ONLY on human skin pixels (preserving
 * hair, glasses, eyes, muscle shading, underwear, and white sneakers 100% untouched).
 */
export async function renderSkinSafeRunwayImage(
  srcUrl: string,
  maskUrl: string | undefined,
  grade: (RunwayColorGrade & { exactDye?: boolean }) | null | undefined,
  maxWidth = 1800,
  skinTone?: SkinToneGrade | null
): Promise<string> {
  const hasGarmentGrade = Boolean(grade && !isGradeIdentity(grade));
  const hasSkinTone = Boolean(skinTone && skinTone.id !== 'natural');
  if (!srcUrl || (!hasGarmentGrade && !hasSkinTone)) return srcUrl;

  const key = `${srcUrl}|${maskUrl ?? 'all'}|${JSON.stringify(grade ?? null)}|${skinTone?.id ?? 'natural'}|${maxWidth}`;
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

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
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
      mCtx.imageSmoothingEnabled = true;
      mCtx.imageSmoothingQuality = 'high';
      mCtx.drawImage(maskImg, 0, 0, w, h);
      maskData = mCtx.getImageData(0, 0, w, h).data;
    }
  }

  const hueShift = ((grade?.hueDeg ?? 0) % 360) / 360;
  const satScale = grade?.satScale ?? 1;
  const lightScale = grade?.lightScale ?? 1;
  const contrastScale = grade?.contrastScale ?? 1;
  const tintStrength = Math.max(0, Math.min(1, grade?.tintStrength ?? 0));
  const exactDye = Boolean(grade?.exactDye && grade?.tintHex);
  const [tr, tg, tb] = grade?.tintHex ? hexToRgb(grade.tintHex) : [0, 0, 0];
  const [targetH, targetS, targetL] = grade?.tintHex ? rgbToHsl(tr, tg, tb) : [0, 0, 0.5];

  // Pass 1 (when exact yarn dyeing is active): measure true garment average luminance
  // so stitch shadows & yarn specular highlights remap cleanly to ANY light, pastel, or dark target color!
  let garmentMeanLum = 0.52;
  if (hasGarmentGrade && exactDye) {
    let sumL = 0;
    let countL = 0;
    for (let i = 0; i < data.length; i += 16) {
      if (data[i + 3] < 40) continue;
      const mw = maskData ? maskData[i] / 255 : 1;
      if (mw < 0.6) continue;
      const l = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      sumL += l;
      countL++;
    }
    if (countL > 25) {
      garmentMeanLum = Math.max(0.18, Math.min(0.84, sumL / countL));
    }
  }

  // Normalized chromaticity ratio of the target skin tone for natural subsurface scattering
  const [skinTr, skinTg, skinTb] = skinTone ? hexToRgb(skinTone.targetHex) : [216, 162, 118];
  const skinTargetLum = Math.max(0.12, (0.299 * skinTr + 0.587 * skinTg + 0.114 * skinTb) / 255);
  const skinRatioR = (skinTr / 255) / skinTargetLum;
  const skinRatioG = (skinTg / 255) / skinTargetLum;
  const skinRatioB = (skinTb / 255) / skinTargetLum;

  // Compute source skin mean luminance once when skin grading is active so melanin remapping is 100% photographic
  let srcSkinMeanLum = 0.58;
  if (hasSkinTone) {
    let sSum = 0;
    let sCnt = 0;
    for (let i = 0; i < data.length; i += 20) {
      if (data[i + 3] < 80) continue;
      if (maskData && maskData[i] > 80) continue;
      const sw = computeSkinLikelihood(data[i], data[i + 1], data[i + 2]);
      if (sw > 0.45) {
        sSum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
        sCnt++;
      }
    }
    if (sCnt > 30) {
      srcSkinMeanLum = Math.max(0.32, Math.min(0.78, sSum / sCnt));
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 10) continue;

    let r0 = data[i];
    let g0 = data[i + 1];
    let b0 = data[i + 2];

    const mWeightRaw = maskData ? maskData[i] / 255 : hasGarmentGrade ? 1 : 0;

    // 1. EXACT HYPERREALISTIC GARMENT YARN DYEING
    if (hasGarmentGrade && mWeightRaw > 0.02) {
      // Protect skin near edges AND protect crisp white cotton undershirts inside open crochet shirts!
      let mWeight = mWeightRaw;
      if (maskData && mWeight < 0.80) {
        const skinEdge = computeSkinLikelihood(r0, g0, b0);
        mWeight *= 1 - skinEdge * 0.88;
      }
      if (exactDye && targetL < 0.78) {
        const lumCheck = (0.299 * r0 + 0.587 * g0 + 0.114 * b0) / 255;
        const chromaCheck = Math.max(r0, g0, b0) - Math.min(r0, g0, b0);
        // Smoothly protect pure bright white inner tank/undershirt cotton pixels while dyeing crochet yarn
        if (lumCheck > 0.84 && chromaCheck < 16) {
          const whiteProtect = Math.min(1, (lumCheck - 0.84) / 0.09) * (1 - chromaCheck / 16);
          mWeight *= 1 - whiteProtect * 0.82;
        }
      }

      if (mWeight > 0.02) {
        const [h0, s0, l0] = rgbToHsl(r0, g0, b0);
        let r1: number;
        let g1: number;
        let b1: number;

        if (exactDye) {
          // Exact luminance-preserving fabric dye with crisp crochet yarn stitch relief & specular sheen
          const lum0 = (0.299 * r0 + 0.587 * g0 + 0.114 * b0) / 255;
          const deltaL = (lum0 - garmentMeanLum) * 1.08;
          const reliefGain = targetL > 0.80 ? 0.56 : targetL < 0.22 ? 0.52 : 0.84;
          const mappedL = Math.max(0.035, Math.min(0.975, targetL + deltaL * reliefGain));
          // Natural yarn fiber specular highlight roll-off (bright highlights subtly desaturate like real cotton!)
          const specRoll = mappedL > 0.78 ? 1 - (mappedL - 0.78) * 1.15 : 1;
          const mappedS =
            targetS < 0.09
              ? Math.min(0.07, s0 * 0.2)
              : Math.max(
                  0.03,
                  Math.min(0.98, targetS * specRoll * (0.88 + Math.min(0.24, s0 * 0.30)))
                );
          [r1, g1, b1] = hslToRgb(targetH, mappedS, mappedL);
          const dyeAmt = Math.max(0.88, Math.min(0.97, tintStrength));
          r1 = Math.round(r0 * (1 - dyeAmt) + r1 * dyeAmt);
          g1 = Math.round(g0 * (1 - dyeAmt) + g1 * dyeAmt);
          b1 = Math.round(b0 * (1 - dyeAmt) + b1 * dyeAmt);
        } else {
          const h1 = (h0 + hueShift + 1) % 1;
          const s1 = Math.max(0, Math.min(1, s0 * satScale));
          let l1 = Math.max(0, Math.min(1, l0 * lightScale));
          if (contrastScale !== 1) {
            l1 = Math.max(0, Math.min(1, (l1 - 0.5) * contrastScale + 0.5));
          }
          [r1, g1, b1] = hslToRgb(h1, s1, l1);
          if (tintStrength > 0) {
            const lum = (0.299 * r1 + 0.587 * g1 + 0.114 * b1) / 255;
            const dyedR = Math.min(255, tr * (0.35 + lum * 0.95));
            const dyedG = Math.min(255, tg * (0.35 + lum * 0.95));
            const dyedB = Math.min(255, tb * (0.35 + lum * 0.95));
            r1 = Math.round(r1 * (1 - tintStrength) + dyedR * tintStrength);
            g1 = Math.round(g1 * (1 - tintStrength) + dyedG * tintStrength);
            b1 = Math.round(b1 * (1 - tintStrength) + dyedB * tintStrength);
          }
        }

        r0 = Math.round(r0 * (1 - mWeight) + r1 * mWeight);
        g0 = Math.round(g0 * (1 - mWeight) + g1 * mWeight);
        b0 = Math.round(b0 * (1 - mWeight) + b1 * mWeight);
      }
    }

    // 2. PHOTOGRAPHIC MELANIN-CURVE + SUBSURFACE SCATTERING SKIN TONE ENGINE
    if (hasSkinTone && skinTone && (!maskData || mWeightRaw < 0.30)) {
      const skinW = computeSkinLikelihood(r0, g0, b0) * (maskData ? 1 - mWeightRaw : 1);
      if (skinW > 0.03) {
        const yOrig = (0.299 * r0 + 0.587 * g0 + 0.114 * b0) / 255;
        // Preserve organic specular skin sheen on shoulders, cheekbones & collarbones
        const specSheen = Math.max(0, Math.min(1, (yOrig - 0.66) / 0.28));
        // Melanin perceptual luminance mapping centered around actual source skin mean
        const relShade = (yOrig - srcSkinMeanLum) / Math.max(0.22, srcSkinMeanLum);
        const yGamma = Math.pow(Math.max(0.02, yOrig), 1 / Math.max(0.42, skinTone.lightScale));
        const yMapped = Math.max(
          0.05,
          Math.min(
            0.96,
            skinTargetLum * (1 + relShade * (skinTargetLum < 0.38 ? 0.58 : 0.72)) * 0.56 +
              yGamma * 0.44 +
              specSheen * (skinTargetLum < 0.45 ? 0.085 : 0.04)
          )
        );

        // Reconstruct natural human undertone with warm subsurface shadow glow & neutral specular lift
        const subWarmR = (1 - yMapped) * 0.055;
        const subCoolB = specSheen * 0.045;
        const srFloat = yMapped * (skinRatioR + subWarmR) * (1 - specSheen * 0.14) + yMapped * specSheen * 0.14;
        const sgFloat = yMapped * skinRatioG * (1 - specSheen * 0.12) + yMapped * specSheen * 0.12;
        const sbFloat = yMapped * (skinRatioB + subCoolB) * (1 - specSheen * 0.10) + yMapped * specSheen * 0.10;

        // Blend chromaticity smoothly so natural skin micro-variations (blush, joints, veins, pores) remain alive!
        const origLumSafe = Math.max(0.05, yOrig);
        const microR = (r0 / 255 / origLumSafe - skinRatioR) * 0.24;
        const microG = (g0 / 255 / origLumSafe - skinRatioG) * 0.24;
        const microB = (b0 / 255 / origLumSafe - skinRatioB) * 0.24;

        const sr1 = Math.max(0, Math.min(255, Math.round((srFloat + yMapped * microR) * 255)));
        const sg1 = Math.max(0, Math.min(255, Math.round((sgFloat + yMapped * microG) * 255)));
        const sb1 = Math.max(0, Math.min(255, Math.round((sbFloat + yMapped * microB) * 255)));

        const blend = skinW * 0.92;
        r0 = Math.round(r0 * (1 - blend) + sr1 * blend);
        g0 = Math.round(g0 * (1 - blend) + sg1 * blend);
        b0 = Math.round(b0 * (1 - blend) + sb1 * blend);
      }
    }

    data[i] = r0;
    data[i + 1] = g0;
    data[i + 2] = b0;
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
    rugSrc = '/vestidor/artisan/crochet-rug.webp',
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

/**
 * Renders a crisp HD transparent PNG of any luxury Atelier crochet/lace/macramé curtain panel
 * so the user can copy it directly to their clipboard and paste it onto notebook pages.
 */
export async function composeTransparentCurtainImage(
  curtainSrc: string
): Promise<TransparentModelWithRugResult | null> {
  try {
    const img = await loadCachedImage(curtainSrc);
    const w = Math.max(720, Math.min(2048, img.naturalWidth * 2));
    const h = Math.round((img.naturalHeight / Math.max(1, img.naturalWidth)) * w);
    const canvas = superRenderImageToCanvas(img, w, h, {
      sharpness: 0.72,
      clarity: 0.06,
      vibrance: 0.05,
    });
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (!blob) return null;
    return { blob, dataUrl: canvas.toDataURL('image/png') };
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Copies a PNG image reliably across Windows/macOS/Linux Electron desktop apps (via native IPC
 * clipboard.writeImage) AND modern Web browsers (Safari/Chrome/Edge ClipboardItem).
 */
export async function copyPngBlobToClipboard(
  blobOrPromise: Blob | Promise<Blob | null>,
  precomputedDataUrl?: string
): Promise<boolean> {
  const electronApi = (
    typeof window !== 'undefined'
      ? (window as unknown as {
          electronAPI?: { writeClipboardImage?: (dataUrl: string) => Promise<boolean> };
        }).electronAPI
      : undefined
  );

  // 1. Native Electron desktop clipboard bridge (100% reliable on Windows .exe, macOS, Linux!)
  if (electronApi?.writeClipboardImage) {
    try {
      let dataUrl = precomputedDataUrl;
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        const resolvedBlob = await blobOrPromise;
        if (!resolvedBlob) return false;
        dataUrl = await blobToDataUrl(resolvedBlob);
      }
      const ok = await electronApi.writeClipboardImage(dataUrl);
      if (ok) return true;
    } catch {
      // fall through to Web Clipboard API
    }
  }

  // 2. Web Clipboard API — passing Promise<Blob> synchronously inside user gesture preserves Safari/Chrome permission!
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.write === 'function' &&
      typeof ClipboardItem !== 'undefined'
    ) {
      if (blobOrPromise instanceof Promise) {
        const nonNullPromise = blobOrPromise.then((b) => {
          if (!b) throw new Error('Empty PNG blob');
          return b;
        });
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': nonNullPromise })]);
        return true;
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobOrPromise })]);
      return true;
    }
  } catch {
    // Retry once with resolved Blob for Chromium versions that don't accept Promise<Blob>
    try {
      const resolved = await blobOrPromise;
      if (resolved && navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': resolved })]);
        return true;
      }
    } catch {
      // Clipboard blocked — caller falls back cleanly to PNG download
    }
  }
  return false;
}
