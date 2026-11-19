const processedCache = new Map<string, string>();
const inFlightCache = new Map<string, Promise<string>>();

const MAX_CONCURRENT = 4;
let activeCount = 0;
const queue: Array<() => void> = [];

function runWithLimit<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const start = () => {
      activeCount += 1;
      fn()
        .then(resolve, reject)
        .finally(() => {
          activeCount -= 1;
          const next = queue.shift();
          if (next) next();
        });
    };

    if (activeCount < MAX_CONCURRENT) {
      start();
    } else {
      queue.push(start);
    }
  });
}

function getCacheKey(src: string, maxDim: number): string {
  const prefix = src.length > 160 ? `${src.slice(0, 80)}::${src.length}::${src.slice(-40)}` : src;
  return `${maxDim}::${prefix}`;
}

export function getCachedTransparentDiagram(src: string, maxDim = 960): string | null {
  return processedCache.get(getCacheKey(src, maxDim)) ?? null;
}

/**
 * Removes white / off-white paper backgrounds to true alpha transparency,
 * de-fringes anti-aliased edges, and strengthens ink darkness & color vibrancy
 * so only the crisp crochet drawing remains on the parchment.
 */
export function processTransparentDiagram(src: string, maxDim = 960): Promise<string> {
  if (!src) return Promise.resolve(src);
  const key = getCacheKey(src, maxDim);

  const cached = processedCache.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = inFlightCache.get(key);
  if (pending) return pending;

  const job = runWithLimit(
    () =>
      new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';

        img.onload = () => {
          try {
            const natW = img.naturalWidth || 1;
            const natH = img.naturalHeight || 1;
            const scale = Math.min(1, maxDim / Math.max(natW, natH));
            const w = Math.max(1, Math.round(natW * scale));
            const h = Math.max(1, Math.round(natH * scale));

            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
              resolve(src);
              return;
            }

            ctx.drawImage(img, 0, 0, w, h);
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;

            for (let i = 0; i < d.length; i += 4) {
              const origA = d[i + 3];
              if (origA === 0) continue;

              let r = d[i];
              let g = d[i + 1];
              let b = d[i + 2];

              const maxC = r > g ? (r > b ? r : b) : g > b ? g : b;
              const minC = r < g ? (r < b ? r : b) : g < b ? g : b;
              const sat = maxC - minC;
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;

              // Separate neutral / near-white paper & faint watermarks from dark or colored ink
              const whiteness = minC * 0.72 + lum * 0.28 - sat * 1.45;

              if (whiteness >= 205) {
                d[i + 3] = 0;
                continue;
              }

              let alpha = origA;
              if (whiteness > 165) {
                const t = (205 - whiteness) / 40;
                // Exponent < 1 keeps thin 1px anti-aliased strokes crisp & strong
                const ramp = Math.pow(t, 0.56);
                alpha = Math.round(origA * Math.min(1, ramp * 1.12));
              }

              if (alpha <= 6) {
                d[i + 3] = 0;
                continue;
              }

              // De-fringe pixels that were anti-aliased against white paper
              if (alpha < 252) {
                const aFrac = Math.max(0.28, alpha / 255);
                r = Math.max(0, Math.min(255, (r - 255 * (1 - aFrac)) / aFrac));
                g = Math.max(0, Math.min(255, (g - 255 * (1 - aFrac)) / aFrac));
                b = Math.max(0, Math.min(255, (b - 255 * (1 - aFrac)) / aFrac));
              }

              // Strengthen lines & deepen midtones (stronger curve for grayscale ink, vibrant for colors)
              const gamma = sat < 16 ? 1.72 : 1.32;
              r = Math.pow(r / 255, gamma) * 255;
              g = Math.pow(g / 255, gamma) * 255;
              b = Math.pow(b / 255, gamma) * 255;

              // Boost color richness & saturation so colored diagrams pop vividly
              if (sat >= 6) {
                const lum2 = 0.299 * r + 0.587 * g + 0.114 * b;
                const satBoost = 1.9;
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
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const blobUrl = URL.createObjectURL(blob);
                  processedCache.set(key, blobUrl);
                  resolve(blobUrl);
                } else {
                  const dataUrl = canvas.toDataURL('image/png');
                  processedCache.set(key, dataUrl);
                  resolve(dataUrl);
                }
              },
              'image/png'
            );
          } catch {
            resolve(src);
          }
        };

        img.onerror = () => resolve(src);
        img.src = src;
      })
  ).finally(() => {
    inFlightCache.delete(key);
  });

  inFlightCache.set(key, job);
  return job;
}
