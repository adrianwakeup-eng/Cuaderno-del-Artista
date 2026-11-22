export type MandalaColorMode = 'original' | 'solid' | 'radial' | 'linear';

export interface MandalaColorSettings {
  mode: MandalaColorMode;
  color1: string;
  color2: string;
  color3: string;
  intensity: number; // 0..100
  hue: number; // -180..180
  saturation: number; // 0..200
  brightness: number; // 50..150
  contrast: number; // 60..160
}

export const DEFAULT_MANDALA_COLOR_SETTINGS: MandalaColorSettings = {
  mode: 'solid',
  color1: '#8F2D3A',
  color2: '#D99B38',
  color3: '#2E6E65',
  intensity: 90,
  hue: 0,
  saturation: 110,
  brightness: 100,
  contrast: 105,
};

export interface MandalaPalettePreset {
  id: string;
  name: string;
  mode: MandalaColorMode;
  color1: string;
  color2: string;
  color3: string;
  intensity?: number;
}

export const MANDALA_SOLID_SWATCHES: Array<{ name: string; hex: string }> = [
  { name: 'Burdeos', hex: '#8F2D3A' },
  { name: 'Oro Antiguo', hex: '#C88D32' },
  { name: 'Terracota', hex: '#C65B38' },
  { name: 'Esmeralda', hex: '#266B5B' },
  { name: 'Azul Índigo', hex: '#284B7A' },
  { name: 'Turquesa', hex: '#1F8B96' },
  { name: 'Lavanda', hex: '#7A549E' },
  { name: 'Rosa Antiguo', hex: '#C4687F' },
  { name: 'Oliva', hex: '#5D703A' },
  { name: 'Mostaza', hex: '#D8A22E' },
  { name: 'Cacao', hex: '#5B341C' },
  { name: 'Tinta Oscura', hex: '#231A16' },
  { name: 'Coral Vivo', hex: '#DF5A56' },
  { name: 'Celeste', hex: '#4B89B8' },
  { name: 'Ciruela', hex: '#6B2A53' },
  { name: 'Marfil Perla', hex: '#E9DBC2' },
];

export const MANDALA_TONE_PRESETS: MandalaPalettePreset[] = [
  {
    id: 'sunset-gold',
    name: 'Atardecer Dorado',
    mode: 'radial',
    color1: '#F0B642',
    color2: '#D65A38',
    color3: '#7C2338',
    intensity: 95,
  },
  {
    id: 'ocean-bloom',
    name: 'Océano Turquesa',
    mode: 'radial',
    color1: '#65C8C6',
    color2: '#237A9C',
    color3: '#1D3564',
    intensity: 95,
  },
  {
    id: 'botanical-garden',
    name: 'Jardín Botánico',
    mode: 'radial',
    color1: '#D9B64E',
    color2: '#5B8F52',
    color3: '#1F5648',
    intensity: 92,
  },
  {
    id: 'vintage-rose',
    name: 'Rosa Bohemia',
    mode: 'radial',
    color1: '#F2C0C8',
    color2: '#C75D7A',
    color3: '#6A2346',
    intensity: 92,
  },
  {
    id: 'royal-amethyst',
    name: 'Amatista Real',
    mode: 'radial',
    color1: '#E5A852',
    color2: '#8B4F9E',
    color3: '#32225C',
    intensity: 95,
  },
  {
    id: 'artisan-rainbow',
    name: 'Arcoíris Artesanal',
    mode: 'radial',
    color1: '#E8A838',
    color2: '#D14B67',
    color3: '#2E6FA3',
    intensity: 95,
  },
  {
    id: 'golden-linen',
    name: 'Seda Dorada',
    mode: 'linear',
    color1: '#E4B15A',
    color2: '#B56B2D',
    color3: '#68341A',
    intensity: 90,
  },
  {
    id: 'aurora-teal',
    name: 'Aurora Boreal',
    mode: 'linear',
    color1: '#42B3A0',
    color2: '#4B74C4',
    color3: '#8A48A6',
    intensity: 92,
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length !== 6) return [143, 45, 58];
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [
    Number.isNaN(r) ? 143 : r,
    Number.isNaN(g) ? 45 : g,
    Number.isNaN(b) ? 58 : b,
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
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

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number;
  let g: number;
  let b: number;
  const hh = ((h % 1) + 1) % 1;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, hh + 1 / 3);
    g = hue2rgb(p, q, hh);
    b = hue2rgb(p, q, hh - 1 / 3);
  }
  return [r * 255, g * 255, b * 255];
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

export interface PreparedMandalaSource {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  bboxMinX: number;
  bboxMaxX: number;
  bboxMinY: number;
  bboxMaxY: number;
  cx: number;
  cy: number;
  maxRadius: number;
  meanLum: number;
  minLum: number;
  maxLum: number;
}

export async function prepareMandalaSource(
  imageSrc: string,
  maxDim = 560
): Promise<PreparedMandalaSource> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      try {
        const natW = img.naturalWidth || img.width || 1;
        const natH = img.naturalHeight || img.height || 1;
        const scale = Math.min(1, maxDim / Math.max(natW, natH));
        const width = Math.max(1, Math.round(natW * scale));
        const height = Math.max(1, Math.round(natH * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('No 2D context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const { data } = ctx.getImageData(0, 0, width, height);

        let bboxMinX = width;
        let bboxMaxX = 0;
        let bboxMinY = height;
        let bboxMaxY = 0;
        let lumSum = 0;
        let lumCount = 0;
        let minLum = 1;
        let maxLum = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const a = data[idx + 3];
            if (a > 24) {
              if (x < bboxMinX) bboxMinX = x;
              if (x > bboxMaxX) bboxMaxX = x;
              if (y < bboxMinY) bboxMinY = y;
              if (y > bboxMaxY) bboxMaxY = y;
              const lum = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
              lumSum += lum;
              lumCount += 1;
              if (lum < minLum) minLum = lum;
              if (lum > maxLum) maxLum = lum;
            }
          }
        }

        if (lumCount === 0) {
          bboxMinX = 0;
          bboxMaxX = width - 1;
          bboxMinY = 0;
          bboxMaxY = height - 1;
          minLum = 0;
          maxLum = 1;
        }

        const cx = (bboxMinX + bboxMaxX) / 2;
        const cy = (bboxMinY + bboxMaxY) / 2;
        const rx = Math.max(1, (bboxMaxX - bboxMinX) / 2);
        const ry = Math.max(1, (bboxMaxY - bboxMinY) / 2);
        const maxRadius = Math.max(1, Math.hypot(rx, ry) * 0.85);
        const meanLum = lumCount > 0 ? lumSum / lumCount : 0.5;

        resolve({
          width,
          height,
          pixels: new Uint8ClampedArray(data),
          bboxMinX,
          bboxMaxX,
          bboxMinY,
          bboxMaxY,
          cx,
          cy,
          maxRadius,
          meanLum,
          minLum,
          maxLum: Math.max(minLum + 0.08, maxLum),
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Error preparando mandala'));
      }
    };
    img.onerror = () => reject(new Error('No se pudo cargar la figura'));
    img.src = imageSrc;
  });
}

function sampleThreeStopColor(
  t: number,
  c1: [number, number, number],
  c2: [number, number, number],
  c3: [number, number, number]
): [number, number, number] {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  if (clamped <= 0.5) {
    const f = clamped * 2;
    return [
      c1[0] + (c2[0] - c1[0]) * f,
      c1[1] + (c2[1] - c1[1]) * f,
      c1[2] + (c2[2] - c1[2]) * f,
    ];
  }
  const f = (clamped - 0.5) * 2;
  return [
    c2[0] + (c3[0] - c2[0]) * f,
    c2[1] + (c3[1] - c2[1]) * f,
    c2[2] + (c3[2] - c2[2]) * f,
  ];
}

export function renderRecoloredMandalaToCanvas(
  source: PreparedMandalaSource,
  settings: MandalaColorSettings,
  targetCanvas: HTMLCanvasElement
): void {
  const { width, height, pixels, bboxMinX, bboxMaxX, bboxMinY, bboxMaxY, cx, cy, maxRadius, meanLum, minLum, maxLum } =
    source;
  if (targetCanvas.width !== width) targetCanvas.width = width;
  if (targetCanvas.height !== height) targetCanvas.height = height;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const out = ctx.createImageData(width, height);
  const dst = out.data;

  const c1 = hexToRgb(settings.color1);
  const c2 = hexToRgb(settings.color2);
  const c3 = hexToRgb(settings.color3);

  const intensity = Math.max(0, Math.min(1, settings.intensity / 100));
  const hueShift = settings.hue / 360;
  const satMult = Math.max(0, settings.saturation / 100);
  const brightMult = Math.max(0.2, settings.brightness / 100);
  const contrastMult = Math.max(0.2, settings.contrast / 100);

  const isDarkInkDiagram = meanLum < 0.46;
  const lumSpan = Math.max(0.12, maxLum - minLum);
  const spanX = Math.max(1, bboxMaxX - bboxMinX);
  const spanY = Math.max(1, bboxMaxY - bboxMinY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = pixels[idx + 3];
      if (a === 0) {
        dst[idx + 3] = 0;
        continue;
      }

      const sr = pixels[idx];
      const sg = pixels[idx + 1];
      const sb = pixels[idx + 2];

      let r = sr;
      let g = sg;
      let b = sb;

      if (settings.mode !== 'original' && intensity > 0.001) {
        let targetRgb: [number, number, number] = c1;
        if (settings.mode === 'radial') {
          const dist = Math.hypot(x - cx, y - cy) / maxRadius;
          targetRgb = sampleThreeStopColor(dist, c1, c2, c3);
        } else if (settings.mode === 'linear') {
          const nx = (x - bboxMinX) / spanX;
          const ny = (y - bboxMinY) / spanY;
          targetRgb = sampleThreeStopColor((nx + ny) * 0.5, c1, c2, c3);
        }

        const lum = (0.299 * sr + 0.587 * sg + 0.114 * sb) / 255;
        const relLum = Math.max(0, Math.min(1, (lum - minLum) / lumSpan));

        let dyedR: number;
        let dyedG: number;
        let dyedB: number;

        if (isDarkInkDiagram) {
          // Dark crochet chart lines: map dark strokes to rich chosen color and soften lighter edges
          const lift = relLum * 0.34;
          dyedR = targetRgb[0] + (255 - targetRgb[0]) * lift;
          dyedG = targetRgb[1] + (255 - targetRgb[1]) * lift;
          dyedB = targetRgb[2] + (255 - targetRgb[2]) * lift;
        } else {
          // Textured crochet doily/mandala photo: preserve 3D stitch shading and thread highlights
          const shade = 0.52 + relLum * 0.72;
          const highlight = relLum > 0.76 ? (relLum - 0.76) * 1.15 : 0;
          dyedR = targetRgb[0] * shade + (255 - targetRgb[0]) * highlight * 0.45;
          dyedG = targetRgb[1] * shade + (255 - targetRgb[1]) * highlight * 0.45;
          dyedB = targetRgb[2] * shade + (255 - targetRgb[2]) * highlight * 0.45;
        }

        r = sr + (dyedR - sr) * intensity;
        g = sg + (dyedG - sg) * intensity;
        b = sb + (dyedB - sb) * intensity;
      }

      // Apply Hue, Saturation, Brightness, Contrast adjustments
      if (Math.abs(hueShift) > 0.001 || Math.abs(satMult - 1) > 0.005) {
        const [h, s, l] = rgbToHsl(clamp255(r), clamp255(g), clamp255(b));
        const nextS = Math.max(0, Math.min(1, s * satMult));
        [r, g, b] = hslToRgb(h + hueShift, nextS, l);
      }

      if (Math.abs(brightMult - 1) > 0.005) {
        r *= brightMult;
        g *= brightMult;
        b *= brightMult;
      }

      if (Math.abs(contrastMult - 1) > 0.005) {
        r = (r - 128) * contrastMult + 128;
        g = (g - 128) * contrastMult + 128;
        b = (b - 128) * contrastMult + 128;
      }

      dst[idx] = clamp255(r);
      dst[idx + 1] = clamp255(g);
      dst[idx + 2] = clamp255(b);
      dst[idx + 3] = a;
    }
  }

  ctx.putImageData(out, 0, 0);
}

export async function exportRecoloredMandalaDataUrl(
  imageSrc: string,
  settings: MandalaColorSettings,
  maxDim = 1200
): Promise<string> {
  const source = await prepareMandalaSource(imageSrc, maxDim);
  const canvas = document.createElement('canvas');
  renderRecoloredMandalaToCanvas(source, settings, canvas);
  return canvas.toDataURL('image/png');
}
