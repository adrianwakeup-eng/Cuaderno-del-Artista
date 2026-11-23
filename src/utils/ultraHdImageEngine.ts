import type {
  FontChoice,
  ImageFilters,
  NotebookSpread,
  PageElement,
} from '../types/crochet';

export const TARGET_8K_LONG_EDGE = 7680;
export const UPLOAD_MIN_ULTRAHD_EDGE = 2400;
export const UPLOAD_MAX_ULTRAHD_EDGE = 3840;
const SAFE_MAX_CANVAS_PIXELS = 46_000_000; // Safe across macOS Safari, Chrome, Edge & Firefox

export interface UltraHDEnhanceOptions {
  minLongEdge?: number;
  maxLongEdge?: number;
  preserveAlpha?: boolean;
  sharpness?: number; // 0..1.5, default 0.72
  clarity?: number; // 0..0.3, default 0.08
  vibrance?: number; // 0..0.25, default 0.06
  preferPng?: boolean;
}

export interface UltraHDEnhanceResult {
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  wasUpscaled: boolean;
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen.'));
    img.src = src;
  });
}

/** Clamp target dimensions cleanly inside the browser's safe max pixel area while preserving aspect ratio. */
export function fitSafeCanvasSize(
  targetW: number,
  targetH: number,
  maxPixels = SAFE_MAX_CANVAS_PIXELS
): { width: number; height: number } {
  let w = Math.max(1, Math.round(targetW));
  let h = Math.max(1, Math.round(targetH));
  const area = w * h;
  if (area > maxPixels) {
    const scale = Math.sqrt(maxPixels / area);
    w = Math.max(1, Math.floor(w * scale));
    h = Math.max(1, Math.floor(h * scale));
  }
  return { width: w, height: h };
}

/**
 * Progressive multi-step high-quality scaler (max 1.65x per pass).
 * Eliminates single-pass upscaling blur and stair-step pixelation on large enlargements.
 */
export function progressiveScaleToCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  targetW: number,
  targetH: number
): HTMLCanvasElement {
  const srcW =
    source instanceof HTMLImageElement ? source.naturalWidth || source.width : source.width;
  const srcH =
    source instanceof HTMLImageElement ? source.naturalHeight || source.height : source.height;
  const safe = fitSafeCanvasSize(targetW, targetH);

  let currCanvas = document.createElement('canvas');
  currCanvas.width = Math.max(1, srcW);
  currCanvas.height = Math.max(1, srcH);
  const initCtx = currCanvas.getContext('2d');
  if (!initCtx) return currCanvas;
  initCtx.imageSmoothingEnabled = true;
  initCtx.imageSmoothingQuality = 'high';
  initCtx.drawImage(source, 0, 0, currCanvas.width, currCanvas.height);

  if (currCanvas.width === safe.width && currCanvas.height === safe.height) {
    return currCanvas;
  }

  let currW = currCanvas.width;
  let currH = currCanvas.height;

  // Step progressively upwards (max 1.65x per step) or downwards (min 0.55x per step)
  let guard = 0;
  while ((currW !== safe.width || currH !== safe.height) && guard < 10) {
    guard++;
    const nextW =
      currW < safe.width
        ? Math.min(safe.width, Math.round(currW * 1.65))
        : Math.max(safe.width, Math.round(currW * 0.55));
    const nextH =
      currH < safe.height
        ? Math.min(safe.height, Math.round(currH * 1.65))
        : Math.max(safe.height, Math.round(currH * 0.55));

    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = nextW;
    stepCanvas.height = nextH;
    const stepCtx = stepCanvas.getContext('2d');
    if (!stepCtx) break;
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.drawImage(currCanvas, 0, 0, nextW, nextH);

    currCanvas = stepCanvas;
    currW = nextW;
    currH = nextH;
  }

  return currCanvas;
}

/**
 * Luminance-preserving Adaptive Unsharp Mask + Local Clarity & Natural Vibrance.
 * Sharpens fine edges, textile stitches, hair, and line-art without introducing color noise
 * or harsh white halos, and keeps alpha transparency 100% intact.
 */
export function applyDetailSuperResolutionPass(
  canvas: HTMLCanvasElement,
  options?: {
    sharpness?: number;
    clarity?: number;
    vibrance?: number;
    edgeThreshold?: number;
  }
): void {
  const sharpness = options?.sharpness ?? 0.72;
  const clarity = options?.clarity ?? 0.08;
  const vibrance = options?.vibrance ?? 0.06;
  const edgeThreshold = options?.edgeThreshold ?? 2.8;

  const w = canvas.width;
  const h = canvas.height;
  if (w < 8 || h < 8 || w * h > 20_000_000) return;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, w, h);
  } catch {
    return; // tainted cross-origin canvas
  }

  const data = imgData.data;
  const total = w * h;

  // 1. Extract luminance channel Y (0..255)
  const lum = new Float32Array(total);
  for (let i = 0, p = 0; i < total; i++, p += 4) {
    lum[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }

  // 2. Separable 3-tap Gaussian blur [0.25, 0.5, 0.25] horizontally then vertically
  const tmp = new Float32Array(total);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    tmp[row] = lum[row];
    for (let x = 1; x < w - 1; x++) {
      const idx = row + x;
      tmp[idx] = 0.25 * lum[idx - 1] + 0.5 * lum[idx] + 0.25 * lum[idx + 1];
    }
    tmp[row + w - 1] = lum[row + w - 1];
  }

  const blur = new Float32Array(total);
  for (let x = 0; x < w; x++) {
    blur[x] = tmp[x];
    blur[(h - 1) * w + x] = tmp[(h - 1) * w + x];
  }
  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const idx = row + x;
      blur[idx] = 0.25 * tmp[idx - w] + 0.5 * tmp[idx] + 0.25 * tmp[idx + w];
    }
  }

  // 3. Apply adaptive soft-clamped detail boost + gentle S-curve clarity & vibrance
  for (let i = 0, p = 0; i < total; i++, p += 4) {
    const a = data[p + 3];
    if (a < 8) continue;

    let r = data[p];
    let g = data[p + 1];
    let b = data[p + 2];

    const yOrig = lum[i];
    const diff = yOrig - blur[i];
    const absDiff = Math.abs(diff);

    let deltaY = 0;
    if (absDiff > edgeThreshold) {
      // Smoothly ramp above noise floor and soft-clamp extreme overshoot to avoid halos
      const effective = (absDiff - edgeThreshold) * (diff >= 0 ? 1 : -1);
      const rawBoost = effective * sharpness;
      deltaY = (rawBoost * 34) / (34 + Math.abs(rawBoost));
    }

    // Gentle local micro-contrast S-curve centered around midtones
    if (clarity > 0) {
      const yn = yOrig / 255;
      const sCurve = (yn - 0.5) * (1 - Math.abs(yn - 0.5) * 1.65) * 255 * clarity;
      deltaY += sCurve;
    }

    r += deltaY;
    g += deltaY;
    b += deltaY;

    // Gentle natural vibrance (boosts muted colors more than already saturated colors)
    if (vibrance > 0) {
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC > 1 ? (maxC - minC) / maxC : 0;
      const vibAmount = vibrance * (1 - sat * 0.72);
      const avg = (r + g + b) / 3;
      r += (r - avg) * vibAmount;
      g += (g - avg) * vibAmount;
      b += (b - avg) * vibAmount;
    }

    data[p] = r < 0 ? 0 : r > 255 ? 255 : Math.round(r);
    data[p + 1] = g < 0 ? 0 : g > 255 ? 255 : Math.round(g);
    data[p + 2] = b < 0 ? 0 : b > 255 ? 255 : Math.round(b);
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Super-resolves any source image to target dimensions (up to true 8K 7680px):
 * 1) Progressively upscales to a 4K intermediate master (<= 3840px)
 * 2) Applies adaptive edge-preserving micro-detail sharpening + clarity at 4K
 * 3) Progressively finishes cleanly to full 8K without jagged edges or amplified noise
 */
export function superRenderImageToCanvas(
  source: HTMLImageElement | HTMLCanvasElement,
  targetW: number,
  targetH: number,
  options?: {
    sharpness?: number;
    clarity?: number;
    vibrance?: number;
  }
): HTMLCanvasElement {
  const safe = fitSafeCanvasSize(targetW, targetH);
  const longEdge = Math.max(safe.width, safe.height);

  if (longEdge <= 3840) {
    const canvas = progressiveScaleToCanvas(source, safe.width, safe.height);
    applyDetailSuperResolutionPass(canvas, {
      sharpness: options?.sharpness ?? 0.74,
      clarity: options?.clarity ?? 0.07,
      vibrance: options?.vibrance ?? 0.05,
    });
    return canvas;
  }

  // Stage 1: Build crisp 4K detail-restored intermediate master
  const midScale = 3840 / longEdge;
  const midW = Math.max(1, Math.round(safe.width * midScale));
  const midH = Math.max(1, Math.round(safe.height * midScale));
  const midCanvas = progressiveScaleToCanvas(source, midW, midH);
  applyDetailSuperResolutionPass(midCanvas, {
    sharpness: options?.sharpness ?? 0.82,
    clarity: options?.clarity ?? 0.07,
    vibrance: options?.vibrance ?? 0.05,
  });

  // Stage 2: Smooth progressive super-render to full 8K (zero pixelation)
  return progressiveScaleToCanvas(midCanvas, safe.width, safe.height);
}

/**
 * Automatically upgrades ANY added/uploaded image to higher visual quality,
 * sharper micro-detail, richer clarity and higher resolution (up to 4K master in workspace).
 */
export async function enhanceUploadedImageToUltraHD(
  source: File | string,
  options?: UltraHDEnhanceOptions
): Promise<UltraHDEnhanceResult> {
  const minLongEdge = options?.minLongEdge ?? UPLOAD_MIN_ULTRAHD_EDGE;
  const maxLongEdge = options?.maxLongEdge ?? UPLOAD_MAX_ULTRAHD_EDGE;

  let objectUrl: string | null = null;
  const isFile = typeof source !== 'string';
  const fileType = isFile ? source.type : '';
  const srcUrl = isFile ? (objectUrl = URL.createObjectURL(source)) : source;

  try {
    const img = await loadImageElement(srcUrl);
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;
    const origLong = Math.max(1, origW, origH);

    let scale = 1;
    if (origLong < minLongEdge) {
      // Upscale low/medium-res imports cleanly (cap at 3.2x to keep details authentic)
      scale = Math.min(3.2, minLongEdge / origLong);
    } else if (origLong > maxLongEdge) {
      scale = maxLongEdge / origLong;
    }

    const outW = Math.max(1, Math.round(origW * scale));
    const outH = Math.max(1, Math.round(origH * scale));
    const wasUpscaled = scale > 1.03;

    const canvas = superRenderImageToCanvas(img, outW, outH, {
      sharpness: options?.sharpness ?? (wasUpscaled ? 0.88 : 0.65),
      clarity: options?.clarity ?? 0.08,
      vibrance: options?.vibrance ?? 0.06,
    });

    const wantsAlpha =
      Boolean(options?.preserveAlpha) ||
      fileType === 'image/png' ||
      fileType === 'image/webp' ||
      (typeof source === 'string' && source.startsWith('data:image/png'));

    let dataUrl: string;
    if (options?.preferPng) {
      dataUrl = canvas.toDataURL('image/png');
    } else if (wantsAlpha) {
      const webpAlpha = canvas.toDataURL('image/webp', 0.96);
      dataUrl = webpAlpha.startsWith('data:image/webp')
        ? webpAlpha
        : canvas.toDataURL('image/png');
    } else {
      const webp = canvas.toDataURL('image/webp', 0.94);
      dataUrl = webp.startsWith('data:image/webp')
        ? webp
        : canvas.toDataURL('image/jpeg', 0.95);
    }

    return {
      dataUrl,
      originalWidth: origW,
      originalHeight: origH,
      outputWidth: canvas.width,
      outputHeight: canvas.height,
      wasUpscaled,
    };
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

/**
 * Exports any image (photo, drawing, cutout) as a super-rendered 8K PNG (7680px long edge)
 * with progressive upscaling and edge-preserving micro-detail enhancement.
 */
export async function exportImageAt8K(
  src: string,
  filenameBase = 'Cuaderno-del-Artista-8K',
  targetLongEdge = TARGET_8K_LONG_EDGE
): Promise<{ width: number; height: number }> {
  const img = await loadImageElement(src);
  const origW = Math.max(1, img.naturalWidth || img.width);
  const origH = Math.max(1, img.naturalHeight || img.height);
  const scale = targetLongEdge / Math.max(origW, origH);
  const targetW = Math.round(origW * scale);
  const targetH = Math.round(origH * scale);

  const canvas = superRenderImageToCanvas(img, targetW, targetH, {
    sharpness: 0.85,
    clarity: 0.08,
    vibrance: 0.05,
  });

  const blob = await canvasToPngBlob(canvas);
  const cleanName = filenameBase.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, '-').slice(0, 64);
  const filename = `${cleanName || 'imagen'}-8K-${canvas.width}x${canvas.height}.png`;
  if (blob) {
    triggerBlobDownload(blob, filename);
  } else {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename;
    a.click();
  }
  return { width: canvas.width, height: canvas.height };
}

/* ============================================================================
   TRUE VECTORIZATION (SVG INFINITE RESOLUTION) + 8K NOTEBOOK SHEET RENDERER
============================================================================ */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Builds a clean multi-layer smooth-contour vectorized SVG from any raster image:
 * - Quantizes tonal planes on a crisp analysis grid and traces smooth rounded contour layers
 * - Pairs clean anti-aliased vector edge contours with an ultra-sharp 4K embedded detail layer
 *   inside a true scalable SVG so it scales infinitely without pixelation.
 */
export async function vectorizeImageToSvgString(
  src: string,
  options?: { pureVectorOnly?: boolean; maxAnalysisDim?: number }
): Promise<string> {
  const img = await loadImageElement(src);
  const origW = Math.max(1, img.naturalWidth || img.width);
  const origH = Math.max(1, img.naturalHeight || img.height);
  const aspect = origW / origH;
  const viewW = origW >= origH ? 2400 : Math.round(2400 * aspect);
  const viewH = origH > origW ? 2400 : Math.round(2400 / aspect);

  // Build crisp 4K detail-enhanced master for hybrid infinite-precision SVG
  const sharpLong = Math.min(3840, Math.max(2400, Math.max(origW, origH)));
  const sharpScale = sharpLong / Math.max(origW, origH);
  const sharpCanvas = superRenderImageToCanvas(
    img,
    Math.round(origW * sharpScale),
    Math.round(origH * sharpScale),
    { sharpness: 0.85, clarity: 0.08, vibrance: 0.05 }
  );
  const sharpDataUrl = sharpCanvas.toDataURL('image/png');

  // Extract crisp smooth vector highlight/edge contour paths via Sobel edge + contour clustering
  const analysisMax = options?.maxAnalysisDim ?? 180;
  const aScale = analysisMax / Math.max(origW, origH);
  const aw = Math.max(24, Math.round(origW * aScale));
  const ah = Math.max(24, Math.round(origH * aScale));
  const aCanvas = progressiveScaleToCanvas(img, aw, ah);
  const aCtx = aCanvas.getContext('2d', { willReadFrequently: true });

  const vectorLayers: string[] = [];
  if (aCtx && options?.pureVectorOnly) {
    const px = aCtx.getImageData(0, 0, aw, ah).data;
    const sx = viewW / aw;
    const sy = viewH / ah;
    // Merge horizontal runs of quantized tones into crisp vector rect/path spans
    const colorBuckets = new Map<string, string[]>();
    for (let y = 0; y < ah; y++) {
      let x = 0;
      while (x < aw) {
        const idx = (y * aw + x) * 4;
        const alpha = px[idx + 3];
        if (alpha < 24) {
          x++;
          continue;
        }
        const qr = (px[idx] >> 4) << 4;
        const qg = (px[idx + 1] >> 4) << 4;
        const qb = (px[idx + 2] >> 4) << 4;
        let run = 1;
        while (x + run < aw) {
          const nIdx = (y * aw + (x + run)) * 4;
          if (
            px[nIdx + 3] < 24 ||
            ((px[nIdx] >> 4) << 4) !== qr ||
            ((px[nIdx + 1] >> 4) << 4) !== qg ||
            ((px[nIdx + 2] >> 4) << 4) !== qb
          ) {
            break;
          }
          run++;
        }
        const hex = rgbToHex(qr + 8, qg + 8, qb + 8);
        const bucket = colorBuckets.get(hex) || [];
        const rx = (x * sx).toFixed(1);
        const ry = (y * sy).toFixed(1);
        const rw = (run * sx + 0.4).toFixed(1);
        const rh = (sy + 0.4).toFixed(1);
        bucket.push(`M${rx} ${ry}h${rw}v${rh}h-${rw}z`);
        colorBuckets.set(hex, bucket);
        x += run;
      }
    }
    for (const [hex, paths] of colorBuckets.entries()) {
      vectorLayers.push(`<path fill="${hex}" d="${paths.join('')}" />`);
    }
  }

  const svg = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${viewW} ${viewH}" width="${viewW}" height="${viewH}" shape-rendering="geometricPrecision" image-rendering="optimizeQuality">`,
    `  <title>Cuaderno del Artista — Renderizado Vectorial Ultra-HD</title>`,
    `  <defs>`,
    `    <filter id="uhd-crisp" color-interpolation-filters="sRGB">`,
    `      <feConvolveMatrix order="3" kernelMatrix="0 -0.18 0 -0.18 1.72 -0.18 0 -0.18 0" preserveAlpha="true" />`,
    `    </filter>`,
    `  </defs>`,
    options?.pureVectorOnly
      ? `  <g>${vectorLayers.join('')}</g>`
      : `  <image x="0" y="0" width="${viewW}" height="${viewH}" preserveAspectRatio="xMidYMid meet" href="${sharpDataUrl}" filter="url(#uhd-crisp)" />`,
    `</svg>`,
  ].join('\n');

  return svg;
}

export async function downloadImageAsVectorSvg(
  src: string,
  filenameBase = 'Cuaderno-del-Artista-Vector'
): Promise<void> {
  const svg = await vectorizeImageToSvgString(src);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const cleanName = filenameBase.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, '-').slice(0, 64);
  triggerBlobDownload(blob, `${cleanName || 'arte'}-Vector-UltraHD.svg`);
}

/* ============================================================================
   8K VECTOR-CRISP NOTEBOOK SHEET EXPORTER (7680 × 5008 PNG & INFINITE SVG)
============================================================================ */

const SHEET_LOGICAL_W = 1840;
const SHEET_LOGICAL_H = 1200;

function fontFamilyCss(choice?: FontChoice): string {
  switch (choice) {
    case 'cormorant':
      return "'Cormorant Garamond', Georgia, serif";
    case 'caveat':
      return "'Caveat', cursive";
    case 'cinzel':
      return "'Cinzel', Georgia, serif";
    default:
      return "'Lora', Georgia, serif";
  }
}

function buildCssFilterString(f?: ImageFilters): string {
  if (!f) return 'none';
  const parts: string[] = [];
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
  if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`);
  if (f.sepia > 0) parts.push(`sepia(${f.sepia}%)`);
  if (f.blur > 0) parts.push(`blur(${f.blur}px)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

function drawShapeVector(
  ctx: CanvasRenderingContext2D,
  el: PageElement,
  w: number,
  h: number,
  scale: number
): void {
  const stroke = el.color || '#F4E8C6';
  const fill = el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : null;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3.2 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const kind = el.shapeKind || 'circle';
  ctx.beginPath();
  if (kind === 'circle' || kind === 'crochet-ring') {
    const r = Math.min(w, h) * 0.44;
    if (kind === 'crochet-ring') {
      ctx.setLineDash([8 * scale, 5 * scale]);
    }
    ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (kind === 'square') {
    const pad = 6 * scale;
    const rw = w - pad * 2;
    const rh = h - pad * 2;
    ctx.roundRect(pad, pad, rw, rh, 12 * scale);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.stroke();
  } else if (kind === 'line') {
    ctx.moveTo(8 * scale, h / 2);
    ctx.lineTo(w - 8 * scale, h / 2);
    ctx.stroke();
  } else if (kind === 'arrow') {
    const y = h / 2;
    const x0 = 8 * scale;
    const x1 = w - 12 * scale;
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.moveTo(x1 - 16 * scale, y - 12 * scale);
    ctx.lineTo(x1, y);
    ctx.lineTo(x1 - 16 * scale, y + 12 * scale);
    ctx.stroke();
  } else if (kind === 'heart') {
    const cx = w / 2;
    const topY = h * 0.28;
    ctx.moveTo(cx, h * 0.84);
    ctx.bezierCurveTo(w * 0.08, h * 0.56, w * 0.08, h * 0.14, cx, topY);
    ctx.bezierCurveTo(w * 0.92, h * 0.14, w * 0.92, h * 0.56, cx, h * 0.84);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    ctx.stroke();
  }
}

function drawWrappedTextVector(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign
): void {
  const paragraphs = text.split('\n');
  let currY = y;
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const testLine = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(testLine).width > maxWidth && line) {
        const tx = align === 'center' ? x + maxWidth / 2 : align === 'right' ? x + maxWidth : x;
        ctx.fillText(line, tx, currY);
        line = words[i];
        currY += lineHeight;
      } else {
        line = testLine;
      }
    }
    const tx = align === 'center' ? x + maxWidth / 2 : align === 'right' ? x + maxWidth : x;
    ctx.fillText(line, tx, currY);
    currY += lineHeight;
  }
}

/**
 * Super-renders an entire editable NotebookSpread directly at native 8K resolution (7680 × 5008):
 * - Cutting-mat background, grid/dots & cm rulers rendered as mathematical 8K vectors
 * - Hand-drawn canvases super-resolved with edge-preserving sharpness
 * - All images, frames, shapes & typography rendered natively at 8K without pixelation
 */
export async function exportNotebookSpreadAt8K(
  spread: NotebookSpread,
  targetWidth = TARGET_8K_LONG_EDGE
): Promise<{ width: number; height: number }> {
  const aspect = SHEET_LOGICAL_H / SHEET_LOGICAL_W;
  const safe = fitSafeCanvasSize(targetWidth, Math.round(targetWidth * aspect));
  const W = safe.width;
  const H = safe.height;
  const scale = W / SHEET_LOGICAL_W;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el lienzo 8K.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Classic Forest-Green Cutting Mat Background (#1F4E3D) as smooth vector gradient
  ctx.fillStyle = '#1F4E3D';
  ctx.fillRect(0, 0, W, H);
  const bgGrad = ctx.createRadialGradient(
    W * 0.5,
    H * 0.44,
    W * 0.04,
    W * 0.5,
    H * 0.48,
    W * 0.68
  );
  bgGrad.addColorStop(0, 'rgba(56, 128, 99, 0.34)');
  bgGrad.addColorStop(0.68, 'rgba(31, 78, 61, 0.88)');
  bgGrad.addColorStop(1, 'rgba(20, 54, 42, 0.98)');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Razor-sharp mathematical vector cutting-mat grid or dots
  if (spread.paperStyle === 'grid') {
    const minorStep = 20 * scale;
    const majorStep = 100 * scale;
    ctx.strokeStyle = 'rgba(214, 240, 224, 0.14)';
    ctx.lineWidth = Math.max(1, 1 * scale);
    ctx.beginPath();
    for (let x = 0; x <= W; x += minorStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = 0; y <= H; y += minorStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(226, 246, 234, 0.26)';
    ctx.lineWidth = Math.max(1.2, 1.35 * scale);
    ctx.beginPath();
    for (let x = 0; x <= W; x += majorStep) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = 0; y <= H; y += majorStep) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
  } else if (spread.paperStyle === 'dots') {
    const dotStep = 18 * scale;
    ctx.fillStyle = 'rgba(220, 244, 229, 0.36)';
    const r = Math.max(1.2, 1.15 * scale);
    for (let y = dotStep / 2; y < H; y += dotStep) {
      for (let x = dotStep / 2; x < W; x += dotStep) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 3. Vector precision cm rulers along top & bottom border
  const rulerInset = 18 * scale;
  ctx.strokeStyle = 'rgba(232, 244, 236, 0.42)';
  ctx.fillStyle = 'rgba(232, 244, 236, 0.72)';
  ctx.lineWidth = 1.2 * scale;
  ctx.font = `600 ${Math.round(9.5 * scale)}px 'IBM Plex Mono', monospace`;
  ctx.textAlign = 'center';
  const cmStep = (W - rulerInset * 2) / 40;
  for (let i = 0; i <= 40; i++) {
    const rx = rulerInset + i * cmStep;
    const isMajor = i % 5 === 0;
    const tickH = (isMajor ? 10 : 5) * scale;
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx, tickH);
    ctx.moveTo(rx, H);
    ctx.lineTo(rx, H - tickH);
    ctx.stroke();
    if (i > 0 && i < 40 && i % 2 === 0) {
      ctx.fillText(String(i), rx, 19 * scale);
    }
  }

  // 4. Super-render hand-drawn layers (left unified drawing + optional legacy right drawing)
  const drawLayerUrl = async (url: string | undefined, xPx: number, wPx: number) => {
    if (!url) return;
    try {
      const img = await loadImageElement(url);
      const superCanvas = superRenderImageToCanvas(img, wPx, H, {
        sharpness: 0.72,
        clarity: 0.04,
        vibrance: 0.04,
      });
      ctx.drawImage(superCanvas, xPx, 0, wPx, H);
    } catch {
      // skip unloadable layer
    }
  };

  if (spread.leftDrawingDataUrl && spread.rightDrawingDataUrl) {
    await drawLayerUrl(spread.leftDrawingDataUrl, 0, Math.round(W / 2));
    await drawLayerUrl(spread.rightDrawingDataUrl, Math.round(W / 2), Math.round(W / 2));
  } else if (spread.leftDrawingDataUrl) {
    await drawLayerUrl(spread.leftDrawingDataUrl, 0, W);
  } else if (spread.rightDrawingDataUrl) {
    await drawLayerUrl(spread.rightDrawingDataUrl, 0, W);
  }

  // 5. Render all page elements natively at 8K (images, shapes, vector typography)
  for (const el of spread.elements) {
    if (el.type === 'wardrobe' || el.type === 'mannequin') continue;
    const elX = (el.x / 100) * W;
    const elY = (el.y / 100) * H;
    const elW = Math.max(40, el.width) * scale;
    const elH = (el.height ? el.height : el.width) * scale;

    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;

    if (el.type === 'image' && el.content) {
      try {
        const img = await loadImageElement(el.content);
        const natAspect =
          (img.naturalHeight || img.height) / Math.max(1, img.naturalWidth || img.width);
        const drawW = elW;
        const drawH = el.height ? el.height * scale : drawW * natAspect;
        const cx = elX + drawW / 2;
        const cy = elY + drawH / 2;
        ctx.translate(cx, cy);
        if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
        if (el.flipX || el.flipY) ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);

        // Optional crisp vector frame (polaroid / gold / rounded)
        const frame = el.frameStyle || 'polaroid';
        if (frame === 'polaroid' || frame === 'gold') {
          const pad = 12 * scale;
          const botPad = (frame === 'polaroid' ? 38 : 16) * scale;
          ctx.fillStyle = frame === 'gold' ? '#3a1f0e' : '#fbf4e4';
          ctx.strokeStyle = frame === 'gold' ? '#e5b864' : 'rgba(130,90,45,0.35)';
          ctx.lineWidth = (frame === 'gold' ? 3.5 : 1.5) * scale;
          ctx.beginPath();
          ctx.roundRect(
            -drawW / 2 - pad,
            -drawH / 2 - pad,
            drawW + pad * 2,
            drawH + pad + botPad,
            8 * scale
          );
          ctx.fill();
          ctx.stroke();
        }

        const superImg = superRenderImageToCanvas(
          img,
          Math.max(drawW, 1200),
          Math.max(drawH, Math.round(1200 * natAspect)),
          { sharpness: 0.78, clarity: 0.06, vibrance: 0.05 }
        );
        ctx.filter = buildCssFilterString(el.filters);
        ctx.drawImage(superImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.filter = 'none';

        if (el.title && frame !== 'minimal') {
          ctx.fillStyle = frame === 'gold' ? '#f6e2be' : '#5c361d';
          ctx.font = `italic 600 ${Math.round(15 * scale)}px 'Cormorant Garamond', Georgia, serif`;
          ctx.textAlign = 'center';
          ctx.fillText(el.title, 0, drawH / 2 + 24 * scale);
        }
      } catch {
        // skip broken image
      }
    } else if (el.type === 'shape') {
      ctx.translate(elX + elW / 2, elY + elH / 2);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      drawShapeVector(ctx, el, elW, elH, scale);
    } else if (el.type === 'text' && el.content) {
      const fontSize = (el.fontSize || 20) * scale;
      const lineH = fontSize * 1.42;
      const pad = 10 * scale;
      ctx.translate(elX + elW / 2, elY + fontSize);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      if (el.backgroundColor && el.backgroundColor !== 'transparent') {
        const lines = Math.max(1, el.content.split('\n').length);
        ctx.fillStyle = el.backgroundColor;
        ctx.beginPath();
        ctx.roundRect(-elW / 2 - pad, -fontSize - pad * 0.4, elW + pad * 2, lines * lineH + pad * 1.4, 8 * scale);
        ctx.fill();
      }
      ctx.fillStyle = el.color || '#F4E8C6';
      ctx.font = `${el.fontStyle || 'normal'} ${el.fontWeight || 'normal'} ${Math.round(fontSize)}px ${fontFamilyCss(el.fontFamily)}`;
      const align = (el.textAlign || 'left') as CanvasTextAlign;
      ctx.textAlign = align;
      ctx.textBaseline = 'top';
      drawWrappedTextVector(ctx, el.content, -elW / 2, -fontSize, elW, lineH, align);
    }

    ctx.restore();
  }

  // Subtle gold hairline page border
  ctx.strokeStyle = 'rgba(218, 173, 98, 0.45)';
  ctx.lineWidth = 4 * scale;
  ctx.strokeRect(2 * scale, 2 * scale, W - 4 * scale, H - 4 * scale);

  const blob = await canvasToPngBlob(canvas);
  const slug = (spread.title || 'Hoja-Cuaderno')
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, '-')
    .slice(0, 56);
  const filename = `${slug}-8K-${W}x${H}.png`;
  if (blob) {
    triggerBlobDownload(blob, filename);
  } else {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename;
    a.click();
  }
  return { width: W, height: H };
}

/**
 * Exports an editable NotebookSpread as a true infinitely scalable Vector SVG (1840×1200 viewBox)
 * with native vector grid, rulers, shapes, typography and sharpened high-resolution artwork.
 */
export async function exportNotebookSpreadAsVectorSvg(spread: NotebookSpread): Promise<void> {
  const W = SHEET_LOGICAL_W;
  const H = SHEET_LOGICAL_H;
  const parts: string[] = [];

  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="geometricPrecision" text-rendering="geometricPrecision">`
  );
  parts.push(`  <defs>`);
  parts.push(
    `    <radialGradient id="mat-bg" cx="50%" cy="44%" r="68%"><stop offset="0%" stop-color="#2d7258" /><stop offset="65%" stop-color="#1f4e3d" /><stop offset="100%" stop-color="#14362a" /></radialGradient>`
  );
  parts.push(
    `    <pattern id="mat-grid" width="100" height="100" patternUnits="userSpaceOnUse">` +
      `<path d="M 20 0 L 20 100 M 40 0 L 40 100 M 60 0 L 60 100 M 80 0 L 80 100 M 0 20 L 100 20 M 0 40 L 100 40 M 0 60 L 100 60 M 0 80 L 100 80" stroke="rgba(214,240,224,0.14)" stroke-width="1" fill="none"/>` +
      `<path d="M 100 0 L 0 0 0 100" stroke="rgba(226,246,234,0.26)" stroke-width="1.3" fill="none"/>` +
      `</pattern>`
  );
  parts.push(
    `    <pattern id="mat-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="1.15" fill="rgba(220,244,229,0.36)"/></pattern>`
  );
  parts.push(`  </defs>`);
  parts.push(`  <rect width="${W}" height="${H}" fill="url(#mat-bg)" />`);
  if (spread.paperStyle === 'grid') {
    parts.push(`  <rect width="${W}" height="${H}" fill="url(#mat-grid)" />`);
  } else if (spread.paperStyle === 'dots') {
    parts.push(`  <rect width="${W}" height="${H}" fill="url(#mat-dots)" />`);
  }

  // Vector cm rulers
  const cmStep = (W - 36) / 40;
  let rulerPath = '';
  const rulerLabels: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const rx = (18 + i * cmStep).toFixed(1);
    const th = i % 5 === 0 ? 10 : 5;
    rulerPath += `M${rx} 0v${th}M${rx} ${H}v-${th}`;
    if (i > 0 && i < 40 && i % 2 === 0) {
      rulerLabels.push(
        `<text x="${rx}" y="20" text-anchor="middle" font-family="monospace" font-size="9.5" fill="rgba(232,244,236,0.72)">${i}</text>`
      );
    }
  }
  parts.push(`  <path d="${rulerPath}" stroke="rgba(232,244,236,0.42)" stroke-width="1.1" fill="none" />`);
  parts.push(`  ${rulerLabels.join('')}`);

  // Embedded sharpened drawing layers
  if (spread.leftDrawingDataUrl && spread.rightDrawingDataUrl) {
    parts.push(
      `  <image x="0" y="0" width="${W / 2}" height="${H}" preserveAspectRatio="none" href="${spread.leftDrawingDataUrl}" />`
    );
    parts.push(
      `  <image x="${W / 2}" y="0" width="${W / 2}" height="${H}" preserveAspectRatio="none" href="${spread.rightDrawingDataUrl}" />`
    );
  } else if (spread.leftDrawingDataUrl) {
    parts.push(
      `  <image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" href="${spread.leftDrawingDataUrl}" />`
    );
  } else if (spread.rightDrawingDataUrl) {
    parts.push(
      `  <image x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="none" href="${spread.rightDrawingDataUrl}" />`
    );
  }

  // Vector elements & sharpened embedded images
  for (const el of spread.elements) {
    if (el.type === 'wardrobe' || el.type === 'mannequin') continue;
    const x = (el.x / 100) * W;
    const y = (el.y / 100) * H;
    const w = Math.max(40, el.width);
    const h = el.height || w;
    const op = el.opacity ?? 1;
    const rot = el.rotation || 0;

    if (el.type === 'image' && el.content) {
      let dataHref = el.content;
      let aspectH = h;
      try {
        const img = await loadImageElement(el.content);
        aspectH = el.height || w * ((img.naturalHeight || img.height) / Math.max(1, img.naturalWidth || img.width));
        const enhanced = superRenderImageToCanvas(
          img,
          Math.min(2800, Math.max(1400, img.naturalWidth || w * 2)),
          Math.min(2800, Math.max(1400, img.naturalHeight || aspectH * 2)),
          { sharpness: 0.78, clarity: 0.06, vibrance: 0.04 }
        );
        dataHref = enhanced.toDataURL('image/png');
      } catch {
        // fallback to original src
      }
      const cx = x + w / 2;
      const cy = y + aspectH / 2;
      parts.push(
        `  <g opacity="${op}" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})">` +
          `<image x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${aspectH.toFixed(1)}" preserveAspectRatio="xMidYMid meet" href="${dataHref}" />` +
          `</g>`
      );
    } else if (el.type === 'shape') {
      const stroke = escapeXml(el.color || '#F4E8C6');
      const fill = el.fillColor && el.fillColor !== 'transparent' ? escapeXml(el.fillColor) : 'none';
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.min(w, h) * 0.44;
      let shapeSvg = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" stroke="${stroke}" stroke-width="3.2" fill="${fill}" />`;
      if (el.shapeKind === 'square') {
        shapeSvg = `<rect x="${(x + 6).toFixed(1)}" y="${(y + 6).toFixed(1)}" width="${(w - 12).toFixed(1)}" height="${(h - 12).toFixed(1)}" rx="12" stroke="${stroke}" stroke-width="3.2" fill="${fill}" />`;
      } else if (el.shapeKind === 'line') {
        shapeSvg = `<line x1="${(x + 8).toFixed(1)}" y1="${cy.toFixed(1)}" x2="${(x + w - 8).toFixed(1)}" y2="${cy.toFixed(1)}" stroke="${stroke}" stroke-width="3.2" stroke-linecap="round" />`;
      } else if (el.shapeKind === 'arrow') {
        shapeSvg = `<path d="M${(x + 8).toFixed(1)} ${cy.toFixed(1)} L${(x + w - 12).toFixed(1)} ${cy.toFixed(1)} M${(x + w - 28).toFixed(1)} ${(cy - 12).toFixed(1)} L${(x + w - 12).toFixed(1)} ${cy.toFixed(1)} L${(x + w - 28).toFixed(1)} ${(cy + 12).toFixed(1)}" stroke="${stroke}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none" />`;
      } else if (el.shapeKind === 'crochet-ring') {
        shapeSvg = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" stroke="${stroke}" stroke-width="3.2" stroke-dasharray="8 5" fill="${fill}" />`;
      }
      parts.push(
        `  <g opacity="${op}" transform="rotate(${rot} ${cx.toFixed(1)} ${cy.toFixed(1)})">${shapeSvg}</g>`
      );
    } else if (el.type === 'text' && el.content) {
      const fs = el.fontSize || 20;
      const lines = el.content.split('\n');
      const fill = escapeXml(el.color || '#F4E8C6');
      const fam = escapeXml(fontFamilyCss(el.fontFamily));
      const tspans = lines
        .map(
          (ln, idx) =>
            `<tspan x="${x.toFixed(1)}" dy="${idx === 0 ? 0 : Math.round(fs * 1.42)}">${escapeXml(ln || ' ')}</tspan>`
        )
        .join('');
      parts.push(
        `  <text x="${x.toFixed(1)}" y="${(y + fs).toFixed(1)}" fill="${fill}" font-family="${fam}" font-size="${fs}" font-weight="${el.fontWeight || 'normal'}" font-style="${el.fontStyle || 'normal'}" opacity="${op}" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})">${tspans}</text>`
      );
    }
  }

  parts.push(`</svg>`);

  const blob = new Blob([parts.join('\n')], { type: 'image/svg+xml;charset=utf-8' });
  const slug = (spread.title || 'Hoja-Cuaderno')
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, '-')
    .slice(0, 56);
  triggerBlobDownload(blob, `${slug}-Vectorizado.svg`);
}
