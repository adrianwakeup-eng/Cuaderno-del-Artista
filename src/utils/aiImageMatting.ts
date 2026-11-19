const mattingResultCache = new Map<string, string>();
const mattingInFlight = new Map<string, Promise<string>>();

function getCacheKey(src: string): string {
  if (src.length <= 160) return src;
  return `${src.slice(0, 72)}::${src.length}::${src.slice(-48)}`;
}

async function loadImageToCanvas(imageSrc: string, maxDim = 1200): Promise<HTMLCanvasElement> {
  if (typeof document === 'undefined') {
    throw new Error('Entorno sin documento');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';

    img.onload = () => {
      try {
        const natW = img.naturalWidth || img.width || 1;
        const natH = img.naturalHeight || img.height || 1;
        const scale = Math.min(1, maxDim / Math.max(natW, natH));
        const w = Math.max(1, Math.round(natW * scale));
        const h = Math.max(1, Math.round(natH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Contexto 2D no disponible'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Error al leer imagen'));
      }
    };

    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = imageSrc;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo codificar PNG'));
      },
      'image/png'
    );
  });
}

interface PaperAnalysis {
  isPaperDiagram: boolean;
  bgR: number;
  bgG: number;
  bgB: number;
}

function analyzeImagePaper(canvas: HTMLCanvasElement): PaperAnalysis {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { isPaperDiagram: false, bgR: 255, bgG: 255, bgB: 255 };
  }
  const w = canvas.width;
  const h = canvas.height;
  const { data } = ctx.getImageData(0, 0, w, h);

  const borderSamples: Array<[number, number, number, number]> = [];
  const stepX = Math.max(1, Math.floor(w / 140));
  const stepY = Math.max(1, Math.floor(h / 140));

  const pushBorderPixel = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    if (data[idx + 3] < 20) return;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    borderSamples.push([r, g, b, lum]);
  };

  const margin = Math.min(4, Math.floor(Math.min(w, h) / 10));
  for (let x = 0; x < w; x += stepX) {
    pushBorderPixel(x, margin);
    pushBorderPixel(x, Math.max(0, h - 1 - margin));
  }
  for (let y = 0; y < h; y += stepY) {
    pushBorderPixel(margin, y);
    pushBorderPixel(Math.max(0, w - 1 - margin), y);
  }

  if (borderSamples.length === 0) {
    return { isPaperDiagram: false, bgR: 255, bgG: 255, bgB: 255 };
  }

  let brightBorderCount = 0;
  for (const [r, g, b, lum] of borderSamples) {
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (lum >= 182 && sat <= 46) {
      brightBorderCount += 1;
    }
  }
  const borderBrightRatio = brightBorderCount / borderSamples.length;

  // Interior sample for paper vs dark-stroke structure
  let totalInterior = 0;
  let brightInterior = 0;
  let darkOrColorInk = 0;
  const stride = Math.max(2, Math.floor(Math.min(w, h) / 120));
  for (let y = 0; y < h; y += stride) {
    for (let x = 0; x < w; x += stride) {
      const idx = (y * w + x) * 4;
      if (data[idx + 3] < 20) continue;
      totalInterior += 1;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC - minC;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum >= 190 && sat <= 44) {
        brightInterior += 1;
      } else if (lum < 175 || sat > 38) {
        darkOrColorInk += 1;
      }
    }
  }

  const interiorBrightRatio = totalInterior > 0 ? brightInterior / totalInterior : 0;
  const inkRatio = totalInterior > 0 ? darkOrColorInk / totalInterior : 0;

  // Estimate dominant bright paper color from top 60% brightest border pixels
  const sorted = [...borderSamples].sort((a, b) => b[3] - a[3]);
  const topCount = Math.max(1, Math.floor(sorted.length * 0.6));
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  for (let i = 0; i < topCount; i++) {
    sumR += sorted[i][0];
    sumG += sorted[i][1];
    sumB += sorted[i][2];
  }
  const bgR = Math.round(sumR / topCount);
  const bgG = Math.round(sumG / topCount);
  const bgB = Math.round(sumB / topCount);

  const isPaperDiagram =
    borderBrightRatio >= 0.72 &&
    interiorBrightRatio >= 0.42 &&
    inkRatio >= 0.015;

  return { isPaperDiagram, bgR, bgG, bgB };
}

function trimCanvasAndExportPng(srcCanvas: HTMLCanvasElement, maxOutputDim = 1200): string {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) {
    return srcCanvas.toDataURL('image/png');
  }
  const { data } = srcCtx.getImageData(0, 0, w, h);

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    const rowOffset = y * w * 4;
    for (let x = 0; x < w; x++) {
      const alpha = data[rowOffset + x * 4 + 3];
      if (alpha > 14) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    minX = 0;
    minY = 0;
    maxX = w - 1;
    maxY = h - 1;
  }

  const pad = 10;
  const sx = Math.max(0, minX - pad);
  const sy = Math.max(0, minY - pad);
  const sw = Math.min(w - sx, maxX - minX + 1 + pad * 2);
  const sh = Math.min(h - sy, maxY - minY + 1 + pad * 2);

  const scale = Math.min(1, maxOutputDim / Math.max(sw, sh));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));

  const outCanvas = document.createElement('canvas');
  outCanvas.width = dw;
  outCanvas.height = dh;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) {
    return srcCanvas.toDataURL('image/png');
  }
  outCtx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, dw, dh);
  return outCanvas.toDataURL('image/png');
}

function extractPaperDiagram(srcCanvas: HTMLCanvasElement, paper: PaperAnalysis): string {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (!ctx) return srcCanvas.toDataURL('image/png');

  ctx.drawImage(srcCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  // Normalize paper white to (255,255,255) so off-white / cream paper extracts cleanly
  const scaleR = 255 / Math.max(185, paper.bgR);
  const scaleG = 255 / Math.max(185, paper.bgG);
  const scaleB = 255 / Math.max(185, paper.bgB);

  for (let i = 0; i < d.length; i += 4) {
    const origA = d[i + 3];
    if (origA === 0) continue;

    let r = Math.min(255, d[i] * scaleR);
    let g = Math.min(255, d[i + 1] * scaleG);
    let b = Math.min(255, d[i + 2] * scaleB);

    const maxC = r > g ? (r > b ? r : b) : g > b ? g : b;
    const minC = r < g ? (r < b ? r : b) : g < b ? g : b;
    const sat = maxC - minC;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    const whiteness = minC * 0.72 + lum * 0.28 - sat * 1.45;
    if (whiteness >= 204) {
      d[i + 3] = 0;
      continue;
    }

    let alpha = origA;
    if (whiteness > 164) {
      const t = (204 - whiteness) / 40;
      const ramp = Math.pow(t, 0.55);
      alpha = Math.round(origA * Math.min(1, ramp * 1.12));
    }

    if (alpha <= 8) {
      d[i + 3] = 0;
      continue;
    }

    // De-fringe anti-aliased white halos
    if (alpha < 252) {
      const aFrac = Math.max(0.28, alpha / 255);
      r = Math.max(0, Math.min(255, (r - 255 * (1 - aFrac)) / aFrac));
      g = Math.max(0, Math.min(255, (g - 255 * (1 - aFrac)) / aFrac));
      b = Math.max(0, Math.min(255, (b - 255 * (1 - aFrac)) / aFrac));
    }

    // Crisp ink darkening & rich color saturation
    const gamma = sat < 18 ? 1.68 : 1.28;
    r = Math.pow(r / 255, gamma) * 255;
    g = Math.pow(g / 255, gamma) * 255;
    b = Math.pow(b / 255, gamma) * 255;

    if (sat >= 8) {
      const lum2 = 0.299 * r + 0.587 * g + 0.114 * b;
      const satBoost = 1.65;
      r = lum2 + (r - lum2) * satBoost;
      g = lum2 + (g - lum2) * satBoost;
      b = lum2 + (b - lum2) * satBoost;
    }

    d[i] = Math.max(0, Math.min(255, Math.round(r)));
    d[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
    d[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    d[i + 3] = alpha;
  }

  ctx.putImageData(imgData, 0, 0);
  return trimCanvasAndExportPng(out, 1200);
}

/**
 * Local border-seeded color-cluster & edge-aware background removal fallback.
 * Never depends on external network or WebAssembly so it always succeeds.
 */
function extractPhotoLocally(srcCanvas: HTMLCanvasElement): string {
  const w = srcCanvas.width;
  const h = srcCanvas.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  if (!ctx) return srcCanvas.toDataURL('image/png');

  ctx.drawImage(srcCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  // Quantize perimeter colors into up to 4 background prototypes
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  const addBorder = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    if (d[idx + 3] < 20) return;
    const r = d[idx];
    const g = d[idx + 1];
    const b = d[idx + 2];
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const prev = buckets.get(key);
    if (prev) {
      prev.r += r;
      prev.g += g;
      prev.b += b;
      prev.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  };

  for (let x = 0; x < w; x += 2) {
    for (let y = 0; y < Math.min(5, h); y++) addBorder(x, y);
    for (let y = Math.max(0, h - 5); y < h; y++) addBorder(x, y);
  }
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < Math.min(5, w); x++) addBorder(x, y);
    for (let x = Math.max(0, w - 5); x < w; x++) addBorder(x, y);
  }

  const prototypes = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((p) => [p.r / p.count, p.g / p.count, p.b / p.count] as const);

  if (prototypes.length === 0) {
    return trimCanvasAndExportPng(out, 1200);
  }

  const total = w * h;
  const isBg = new Uint8Array(total);
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const distToBg = (idx4: number): number => {
    const r = d[idx4];
    const g = d[idx4 + 1];
    const b = d[idx4 + 2];
    let best = 1e9;
    for (const [pr, pg, pb] of prototypes) {
      const dr = r - pr;
      const dg = g - pg;
      const db = b - pb;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < best) best = dist;
    }
    return Math.sqrt(best);
  };

  const bgThreshold = 54;
  const stepThreshold = 34;

  const trySeed = (x: number, y: number) => {
    const p = y * w + x;
    if (visited[p]) return;
    visited[p] = 1;
    const idx4 = p * 4;
    if (d[idx4 + 3] < 20 || distToBg(idx4) <= bgThreshold) {
      isBg[p] = 1;
      queue[tail++] = p;
    }
  };

  for (let x = 0; x < w; x++) {
    trySeed(x, 0);
    trySeed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    trySeed(0, y);
    trySeed(w - 1, y);
  }

  while (head < tail) {
    const p = queue[head++];
    const px = p % w;
    const py = (p - px) / w;
    const p4 = p * 4;
    const pr = d[p4];
    const pg = d[p4 + 1];
    const pb = d[p4 + 2];

    const neighbors = [
      px > 0 ? p - 1 : -1,
      px < w - 1 ? p + 1 : -1,
      py > 0 ? p - w : -1,
      py < h - 1 ? p + w : -1,
    ];

    for (const np of neighbors) {
      if (np < 0 || visited[np]) continue;
      visited[np] = 1;
      const n4 = np * 4;
      if (d[n4 + 3] < 20) {
        isBg[np] = 1;
        queue[tail++] = np;
        continue;
      }
      const dr = d[n4] - pr;
      const dg = d[n4 + 1] - pg;
      const db = d[n4 + 2] - pb;
      const neighborDiff = Math.sqrt(dr * dr + dg * dg + db * db);
      if (neighborDiff <= stepThreshold && distToBg(n4) <= bgThreshold * 1.25) {
        isBg[np] = 1;
        queue[tail++] = np;
      }
    }
  }

  // Soft 1-pixel edge feathering on boundary pixels
  let fgCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const idx4 = p * 4;
      if (isBg[p]) {
        d[idx4 + 3] = 0;
      } else {
        fgCount += 1;
        let bgNeighbors = 0;
        if (x > 0 && isBg[p - 1]) bgNeighbors++;
        if (x < w - 1 && isBg[p + 1]) bgNeighbors++;
        if (y > 0 && isBg[p - w]) bgNeighbors++;
        if (y < h - 1 && isBg[p + w]) bgNeighbors++;
        if (bgNeighbors > 0) {
          d[idx4 + 3] = Math.round(d[idx4 + 3] * (1 - bgNeighbors * 0.14));
        }
      }
    }
  }

  // Safety guard: if flood-fill ate almost everything, fall back to uncropped clean PNG
  if (fgCount < total * 0.02) {
    ctx.drawImage(srcCanvas, 0, 0);
  } else {
    ctx.putImageData(imgData, 0, 0);
  }
  return trimCanvasAndExportPng(out, 1200);
}

async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await loadImageToCanvas(objectUrl, 1400);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getOpaquePixelRatio(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let opaque = 0;
  const total = canvas.width * canvas.height;
  for (let i = 3; i < data.length; i += 16) {
    if (data[i] > 24) opaque += 1;
  }
  return opaque / Math.max(1, Math.ceil(total / 4));
}

async function runNeuralMattingWithTimeout(
  sourceBlob: Blob,
  onProgress?: (percent: number) => void,
  timeoutMs = 18000
): Promise<Blob> {
  const { removeBackground } = await import('@imgly/background-removal');

  const neuralPromise = removeBackground(sourceBlob, {
    model: 'isnet_quint8',
    device: 'cpu',
    proxyToWorker: false,
    output: {
      format: 'image/png',
      quality: 0.94,
    },
    progress: (_stage: string, current: number, total: number) => {
      if (total > 0) {
        const pct = Math.max(18, Math.min(92, Math.round((current / total) * 74) + 18));
        onProgress?.(pct);
      }
    },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('Tiempo agotado en segmentación neural')), timeoutMs);
  });

  return Promise.race([neuralPromise, timeoutPromise]);
}

/**
 * Extracts the foreground figure from any diagram or photograph.
 * - Crochet diagrams / charts on light paper use precision ink & color extraction with white halo removal.
 * - Real photographs use neural AI Image Matting (ISNet) with automatic local border-matting fallback so extraction never fails.
 */
export async function extractFigureMatting(
  imageSrc: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!imageSrc) {
    throw new Error('Imagen vacía');
  }

  const key = getCacheKey(imageSrc);
  const cached = mattingResultCache.get(key);
  if (cached) {
    onProgress?.(100);
    return cached;
  }

  const existing = mattingInFlight.get(key);
  if (existing) {
    return existing;
  }

  const task = (async () => {
    onProgress?.(8);
    const srcCanvas = await loadImageToCanvas(imageSrc, 1200);
    onProgress?.(20);

    const analysis = analyzeImagePaper(srcCanvas);
    let dataUrl: string;

    if (analysis.isPaperDiagram) {
      onProgress?.(65);
      dataUrl = extractPaperDiagram(srcCanvas, analysis);
      onProgress?.(98);
    } else {
      let neuralSuccess: string | null = null;
      try {
        const srcBlob = await canvasToPngBlob(srcCanvas);
        const resultBlob = await runNeuralMattingWithTimeout(srcBlob, onProgress, 18000);
        onProgress?.(94);
        const resultCanvas = await blobToCanvas(resultBlob);
        const ratio = getOpaquePixelRatio(resultCanvas);
        if (ratio >= 0.02 && ratio <= 0.97) {
          neuralSuccess = trimCanvasAndExportPng(resultCanvas, 1200);
        }
      } catch {
        neuralSuccess = null;
      }

      if (neuralSuccess) {
        dataUrl = neuralSuccess;
      } else {
        onProgress?.(78);
        dataUrl = extractPhotoLocally(srcCanvas);
        onProgress?.(96);
      }
    }

    mattingResultCache.set(key, dataUrl);
    onProgress?.(100);
    return dataUrl;
  })().finally(() => {
    mattingInFlight.delete(key);
  });

  mattingInFlight.set(key, task);
  return task;
}
