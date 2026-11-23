import type { BrushPresetId, BrushSettings } from '../types/crochet';
import {
  CATALOG_BRUSH_BY_ID,
  CATALOG_BRUSHES_BY_FAMILY,
  CATALOG_TEXTURE_BRUSHES,
  TEXTURE_FAMILIES,
  TOTAL_TEXTURE_BRUSH_COUNT,
  type CatalogTextureBrush,
  type TextureBrushParams,
  type TextureFamilyId,
  type TextureFamilyMeta,
} from './brushTextureCatalog';

import {
  renderParametricTextureSegment,
  renderTexturePreviewDataUrl,
  resolveTextureParams,
} from './proceduralTextureRenderers';

export {
  CATALOG_BRUSH_BY_ID,
  CATALOG_BRUSHES_BY_FAMILY,
  CATALOG_TEXTURE_BRUSHES,
  TEXTURE_FAMILIES,
  TOTAL_TEXTURE_BRUSH_COUNT,
  renderTexturePreviewDataUrl,
  type CatalogTextureBrush,
  type TextureBrushParams,
  type TextureFamilyId,
  type TextureFamilyMeta,
};

export interface BrushPresetMeta {
  id: BrushPresetId;
  shortLabel: string;
  label: string;
  description: string;
  tint: string;
  defaultSize: number;
  defaultOpacity: number;
  defaultSoftness: number;
  familyLabel?: string;
}

export const DIFUMINADO_PRESETS: BrushPresetMeta[] = [
  {
    id: 'difuminado-seda',
    shortLabel: 'Seda',
    label: 'Difuminado Seda',
    description: 'Arrastra y funde los pigmentos con suavidad para unir colores sin cortes.',
    tint: '#F0CFA8',
    defaultSize: 26,
    defaultOpacity: 68,
    defaultSoftness: 88,
  },
  {
    id: 'difuminado-suavizar',
    shortLabel: 'Suavizar',
    label: 'Suavizador Preciso',
    description: 'Difumina bordes y suaviza trazos existentes dejándolos homogéneos.',
    tint: '#D9C3EC',
    defaultSize: 28,
    defaultOpacity: 65,
    defaultSoftness: 92,
  },
  {
    id: 'difuminado-armonizar',
    shortLabel: 'Armonizar',
    label: 'Armonizador de Color',
    description: 'Unifica tonos desiguales equilibrando el color del lienzo con tu tono activo.',
    tint: '#E8A5B4',
    defaultSize: 30,
    defaultOpacity: 58,
    defaultSoftness: 90,
  },
  {
    id: 'difuminado-esfumino',
    shortLabel: 'Esfumino',
    label: 'Esfumino de Precisión',
    description: 'Punta fina de esfumino para párpados, labios, sombras delicadas y pelaje.',
    tint: '#D8CFC2',
    defaultSize: 14,
    defaultOpacity: 72,
    defaultSoftness: 76,
  },
  {
    id: 'difuminado-aerografo',
    shortLabel: 'Aerógrafo',
    label: 'Aerógrafo Veladura',
    description: 'Velo sedoso ultra homogéneo sin grano para degradados y rubores perfectos.',
    tint: '#B7D4E8',
    defaultSize: 32,
    defaultOpacity: 42,
    defaultSoftness: 96,
  },
  {
    id: 'difuminado-niebla',
    shortLabel: 'Niebla',
    label: 'Velo Luminoso',
    description: 'Difuminado amplio y etéreo para fondos, atmósferas y transiciones suaves.',
    tint: '#CBE0B4',
    defaultSize: 40,
    defaultOpacity: 48,
    defaultSoftness: 98,
  },
];

export const HYPERREAL_PINCEL_PRESETS: BrushPresetMeta[] = [
  {
    id: 'pelo-animal',
    shortLabel: 'Pelo animal',
    label: 'Pelo de Animal',
    description: 'Hebras cónicas direccionales con subpelo oscuro y brillo natural.',
    tint: '#C98A4E',
    defaultSize: 18,
    defaultOpacity: 88,
    defaultSoftness: 30,
  },
  {
    id: 'cabello-seda',
    shortLabel: 'Cabello',
    label: 'Cabello Sedoso',
    description: 'Mechones finos paralelos con reflejo sedoso para retratos hiperrealistas.',
    tint: '#7A4929',
    defaultSize: 16,
    defaultOpacity: 90,
    defaultSoftness: 25,
  },
  {
    id: 'arena-fina',
    shortLabel: 'Arena',
    label: 'Arena Fina',
    description: 'Microgranos minerales con destellos de cuarzo y sombras granuladas.',
    tint: '#E2BA78',
    defaultSize: 22,
    defaultOpacity: 84,
    defaultSoftness: 45,
  },
  {
    id: 'piel-poros',
    shortLabel: 'Piel y poros',
    label: 'Piel y Poros',
    description: 'Microtextura dérmica orgánica con poros sutiles y brillo cálido.',
    tint: '#E8B192',
    defaultSize: 20,
    defaultOpacity: 55,
    defaultSoftness: 65,
  },
  {
    id: 'plumas-finas',
    shortLabel: 'Plumas',
    label: 'Plumas y Bárbulas',
    description: 'Raquis central con finas bárbulas simétricas para plumaje hiperrealista.',
    tint: '#D8C7AF',
    defaultSize: 22,
    defaultOpacity: 86,
    defaultSoftness: 30,
  },
  {
    id: 'hierba-follaje',
    shortLabel: 'Hierba',
    label: 'Hierba y Musgo',
    description: 'Briznas botánicas cónicas con raíces en sombra y puntas iluminadas.',
    tint: '#6FA35A',
    defaultSize: 20,
    defaultOpacity: 90,
    defaultSoftness: 25,
  },
  {
    id: 'roca-piedra',
    shortLabel: 'Roca',
    label: 'Roca y Corteza',
    description: 'Facetas minerales fracturadas, grietas y relieve rugoso de piedra o árbol.',
    tint: '#9E9388',
    defaultSize: 24,
    defaultOpacity: 86,
    defaultSoftness: 35,
  },
  {
    id: 'tela-tejido',
    shortLabel: 'Tela',
    label: 'Tela y Trama',
    description: 'Urdimbre y trama entrelazada para lino, algodón, lana y moda realista.',
    tint: '#B5896B',
    defaultSize: 22,
    defaultOpacity: 78,
    defaultSoftness: 45,
  },
  {
    id: 'agua-destellos',
    shortLabel: 'Agua',
    label: 'Agua y Gotas',
    description: 'Veladura líquida con cáusticas translúcidas y microgotas con brillo.',
    tint: '#78B9D6',
    defaultSize: 22,
    defaultOpacity: 68,
    defaultSoftness: 60,
  },
  {
    id: 'oleo-cerdas',
    shortLabel: 'Óleo',
    label: 'Óleo Cerdas',
    description: 'Pincel físico de cerdas naturales con relieve empastado y luces.',
    tint: '#C95A42',
    defaultSize: 18,
    defaultOpacity: 90,
    defaultSoftness: 22,
  },
  {
    id: 'grafito-hiper',
    shortLabel: 'Grafito',
    label: 'Grafito Hiperreal',
    description: 'Trazo de grafito preciso con grano fino de papel de algodón.',
    tint: '#5B5652',
    defaultSize: 8,
    defaultOpacity: 88,
    defaultSoftness: 18,
  },
  {
    id: 'brillo-estelar',
    shortLabel: 'Destellos',
    label: 'Micro-Destellos',
    description: 'Puntos de luz especular para ojos, rocío, joyas y reflejos húmedos.',
    tint: '#FFF2C2',
    defaultSize: 14,
    defaultOpacity: 92,
    defaultSoftness: 35,
  },
];

export const ALL_BRUSH_META_MAP: Record<string, BrushPresetMeta> = Object.fromEntries(
  [...DIFUMINADO_PRESETS, ...HYPERREAL_PINCEL_PRESETS].map((p) => [p.id, p])
);

export function getBrushPresetMeta(id: BrushPresetId): BrushPresetMeta | undefined {
  const direct = ALL_BRUSH_META_MAP[id];
  if (direct) return direct;
  const cat = CATALOG_BRUSH_BY_ID[id];
  if (!cat) return undefined;
  return {
    id: cat.id,
    shortLabel: cat.shortLabel,
    label: cat.label,
    description: cat.description,
    tint: cat.tint,
    defaultSize: cat.defaultSize,
    defaultOpacity: cat.defaultOpacity,
    defaultSoftness: cat.defaultSoftness,
    familyLabel: cat.familyLabel,
  };
}

export function isDifuminadoPreset(brush: BrushSettings): boolean {
  return (
    brush.category === 'difuminados' ||
    brush.category === 'tizas' ||
    brush.preset.startsWith('difuminado-') ||
    brush.preset === 'difuminador' ||
    brush.preset === 'tiza-suave' ||
    brush.preset === 'tiza-pastel' ||
    brush.preset === 'tiza-gruesa' ||
    brush.preset === 'tiza-velo' ||
    brush.preset === 'carboncillo'
  );
}

/* ---------- Color & Random Helpers ---------- */

function createSeededRand(seed: number): () => number {
  let s = seed >>> 0 || 0x6d2b79f5;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [78, 39, 18];
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [Number.isNaN(r) ? 78 : r, Number.isNaN(g) ? 39 : g, Number.isNaN(b) ? 18 : b];
}

function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r},${g},${b},${Math.max(0.005, Math.min(1, a)).toFixed(4)})`;
}

/* ---------- Persistent Per-Stroke Runtime State ---------- */

export interface HyperrealStrokeState {
  dirX: number;
  dirY: number;
  hasDir: boolean;
  distAccum: number;
  bristleOffsets: number[];
  bristleShades: number[];
  smudgeReady: boolean;
  smudgeHasPigment: boolean;
  smudgeRadius: number;
  smudgeCanvas: HTMLCanvasElement | null;
  workCanvas: HTMLCanvasElement | null;
  rand: () => number;
}

export function createStrokeState(seed?: number): HyperrealStrokeState {
  const rand = seed !== undefined ? createSeededRand(seed) : Math.random;
  // Persistent bristle pattern for hair & oil bristle continuity across segments
  const count = 20;
  const bristleOffsets: number[] = [];
  const bristleShades: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); // 0..1
    bristleOffsets.push((t - 0.5) * 2 + (rand() - 0.5) * 0.14);
    bristleShades.push((rand() - 0.5) * 0.44);
  }
  return {
    dirX: 1,
    dirY: 0,
    hasDir: false,
    distAccum: 0,
    bristleOffsets,
    bristleShades,
    smudgeReady: false,
    smudgeHasPigment: false,
    smudgeRadius: 0,
    smudgeCanvas: null,
    workCanvas: null,
    rand,
  };
}

function ensureOffscreen(
  existing: HTMLCanvasElement | null,
  diameter: number
): HTMLCanvasElement {
  const size = Math.max(16, Math.min(256, Math.ceil(diameter)));
  const c = existing || document.createElement('canvas');
  if (c.width !== size || c.height !== size) {
    c.width = size;
    c.height = size;
  }
  return c;
}

/** Check if an offscreen stamp buffer actually contains painted pixels (alpha > threshold) */
function sampleStampAverage(
  canvas: HTMLCanvasElement
): { hasPigment: boolean; r: number; g: number; b: number; avgAlpha: number } {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { hasPigment: false, r: 0, g: 0, b: 0, avgAlpha: 0 };
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumA = 0;
  let count = 0;
  // Fast stride sampling every 4th pixel
  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3];
    if (a > 12) {
      sumR += data[i] * a;
      sumG += data[i + 1] * a;
      sumB += data[i + 2] * a;
      sumA += a;
    }
    count++;
  }
  if (sumA < 80) {
    return { hasPigment: false, r: 0, g: 0, b: 0, avgAlpha: 0 };
  }
  return {
    hasPigment: true,
    r: Math.round(sumR / sumA),
    g: Math.round(sumG / sumA),
    b: Math.round(sumB / sumA),
    avgAlpha: sumA / (Math.max(1, count) * 255),
  };
}

/** Apply silky radial Gaussian feather mask (destination-in) to a square stamp canvas */
function applyRadialFeatherMask(
  ctx: CanvasRenderingContext2D,
  size: number,
  softnessNorm: number
): void {
  const half = size / 2;
  const innerR = half * Math.max(0.05, (1 - softnessNorm) * 0.55);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  const grad = ctx.createRadialGradient(half, half, innerR, half, half, half);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.45, 'rgba(0,0,0,0.72)');
  grad.addColorStop(0.78, 'rgba(0,0,0,0.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();
}

/* ---------- PART 1: TRUE PIXEL-AWARE DIFUMINADOS (BLENDERS / SMUDGERS / HARMONIZERS) ---------- */

function drawDifuminadoSegment(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  brush: BrushSettings,
  resScale: number,
  state: HyperrealStrokeState
): void {
  const alpha = Math.max(0.05, Math.min(1, brush.opacity / 100));
  const softNorm = Math.max(0.3, Math.min(1, brush.softness / 100));
  const [r, g, b] = hexToRgb(brush.color);

  // Normalize legacy chalk IDs onto the new smooth difuminado behaviors
  const preset =
    brush.preset === 'tiza-suave' || brush.preset === 'difuminador'
      ? 'difuminado-seda'
      : brush.preset === 'tiza-pastel'
        ? 'difuminado-armonizar'
        : brush.preset === 'tiza-gruesa'
          ? 'difuminado-suavizar'
          : brush.preset === 'tiza-velo'
            ? 'difuminado-niebla'
            : brush.preset === 'carboncillo'
              ? 'difuminado-esfumino'
              : brush.preset;

  const sizeBase = Math.max(3, brush.size * 0.95) * resScale;
  const radiusMult =
    preset === 'difuminado-esfumino'
      ? 0.52
      : preset === 'difuminado-niebla'
        ? 1.45
        : preset === 'difuminado-aerografo'
          ? 1.25
          : 1.05;
  const radius = Math.max(6 * resScale, sizeBase * radiusMult);
  const diameter = Math.ceil(radius * 2);

  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const stepSpacing =
    preset === 'difuminado-suavizar' || preset === 'difuminado-armonizar'
      ? Math.max(3.5 * resScale, radius * 0.28)
      : Math.max(1.8 * resScale, radius * 0.16);
  const steps = Math.max(1, Math.min(40, Math.ceil(dist / stepSpacing)));

  // Helper: ultra-smooth Gaussian airbrush veil (zero grainy artifacts)
  const paintSilkyAirbrushVeil = (
    cx: number,
    cy: number,
    rad: number,
    cr: number,
    cg: number,
    cb: number,
    strength: number
  ) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, rgba(cr, cg, cb, strength));
    grad.addColorStop(0.32, rgba(cr, cg, cb, strength * 0.66));
    grad.addColorStop(0.65, rgba(cr, cg, cb, strength * 0.22));
    grad.addColorStop(1, rgba(cr, cg, cb, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  };

  // 1) AERÓGRAFO VELADURA: Pure silky Gaussian smooth airbrush glaze
  if (preset === 'difuminado-aerografo') {
    const stampA = Math.min(0.16, alpha * 0.052);
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + (p2.x - p1.x) * t;
      const cy = p1.y + (p2.y - p1.y) * t;
      paintSilkyAirbrushVeil(cx, cy, radius, r, g, b, stampA);
    }
    return;
  }

  // 2) DIFUMINADO SEDA & ESFUMINO DE PRECISIÓN: Real Pigment Pickup & Silky Smudge Carry!
  if (preset === 'difuminado-seda' || preset === 'difuminado-esfumino') {
    state.smudgeCanvas = ensureOffscreen(state.smudgeCanvas, diameter);
    state.workCanvas = ensureOffscreen(state.workCanvas, diameter);
    const sCanvas = state.smudgeCanvas;
    const wCanvas = state.workCanvas;
    const sCtx = sCanvas.getContext('2d', { willReadFrequently: true });
    const wCtx = wCanvas.getContext('2d', { willReadFrequently: true });
    if (!sCtx || !wCtx) return;

    const dSize = sCanvas.width;
    const half = dSize / 2;

    // Initial pigment pickup on stroke start
    if (!state.smudgeReady || state.smudgeRadius !== dSize) {
      sCtx.clearRect(0, 0, dSize, dSize);
      sCtx.drawImage(
        sourceCanvas,
        p1.x - half,
        p1.y - half,
        dSize,
        dSize,
        0,
        0,
        dSize,
        dSize
      );
      applyRadialFeatherMask(sCtx, dSize, softNorm);
      const info = sampleStampAverage(sCanvas);
      state.smudgeHasPigment = info.hasPigment;
      state.smudgeReady = true;
      state.smudgeRadius = dSize;
    }

    const carryStrength =
      preset === 'difuminado-esfumino'
        ? Math.min(0.72, 0.24 + alpha * 0.44)
        : Math.min(0.62, 0.18 + alpha * 0.38);
    const pickupRate = preset === 'difuminado-esfumino' ? 0.28 : 0.22;

    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const cx = p1.x + (p2.x - p1.x) * t;
      const cy = p1.y + (p2.y - p1.y) * t;

      // Sample canvas pixels at new position
      wCtx.clearRect(0, 0, dSize, dSize);
      wCtx.drawImage(
        sourceCanvas,
        cx - half,
        cy - half,
        dSize,
        dSize,
        0,
        0,
        dSize,
        dSize
      );
      applyRadialFeatherMask(wCtx, dSize, softNorm);

      // Lay down carried pigment smoothly to melt transitions!
      if (state.smudgeHasPigment) {
        ctx.save();
        ctx.globalAlpha = carryStrength;
        ctx.drawImage(sCanvas, cx - half, cy - half);
        ctx.restore();
      } else {
        // Gentle fallback veil if user strokes over completely blank paper
        paintSilkyAirbrushVeil(cx, cy, radius * 0.92, r, g, b, Math.min(0.08, alpha * 0.025));
      }

      // Gently mix new canvas pigment into the brush tip (true wet-on-wet smudge carry!)
      sCtx.save();
      sCtx.globalCompositeOperation = 'source-over';
      sCtx.globalAlpha = pickupRate;
      sCtx.drawImage(wCanvas, 0, 0);
      sCtx.restore();
      applyRadialFeatherMask(sCtx, dSize, softNorm);

      if (!state.smudgeHasPigment) {
        const info = sampleStampAverage(wCanvas);
        if (info.hasPigment) {
          sCtx.clearRect(0, 0, dSize, dSize);
          sCtx.drawImage(wCanvas, 0, 0);
          state.smudgeHasPigment = true;
        }
      }
    }
    return;
  }

  // 3) SUAVIZADOR PRECISO, ARMONIZADOR DE COLOR & VELO LUMINOSO (NIEBLA):
  //    True local Gaussian softening + color harmonization right over painted strokes!
  state.workCanvas = ensureOffscreen(state.workCanvas, diameter);
  const wCanvas = state.workCanvas;
  const wCtx = wCanvas.getContext('2d', { willReadFrequently: true });
  if (!wCtx) return;

  const dSize = wCanvas.width;
  const half = dSize / 2;
  const blurPx =
    preset === 'difuminado-niebla'
      ? Math.max(2.5, radius * 0.24)
      : preset === 'difuminado-armonizar'
        ? Math.max(1.8, radius * 0.16)
        : Math.max(2.0, radius * 0.20);

  for (let s = 0; s <= steps; s++) {
    const t = steps === 0 ? 1 : s / steps;
    const cx = p1.x + (p2.x - p1.x) * t;
    const cy = p1.y + (p2.y - p1.y) * t;

    // Sample local pixels with genuine soft Gaussian blur
    wCtx.clearRect(0, 0, dSize, dSize);
    wCtx.save();
    wCtx.filter = `blur(${blurPx.toFixed(1)}px)`;
    wCtx.drawImage(
      sourceCanvas,
      cx - half,
      cy - half,
      dSize,
      dSize,
      0,
      0,
      dSize,
      dSize
    );
    wCtx.restore();

    const info = sampleStampAverage(wCanvas);
    applyRadialFeatherMask(wCtx, dSize, softNorm);

    if (info.hasPigment) {
      // Composite softened pixels back cleanly to smooth edges & homogenize tones
      ctx.save();
      ctx.globalAlpha =
        preset === 'difuminado-niebla'
          ? Math.min(0.62, 0.22 + alpha * 0.38)
          : Math.min(0.68, 0.26 + alpha * 0.42);
      ctx.drawImage(wCanvas, cx - half, cy - half);
      ctx.restore();

      if (preset === 'difuminado-armonizar') {
        // Blend local sampled average color with 24% active palette color to unify patchy shades!
        const hr = Math.round(info.r * 0.76 + r * 0.24);
        const hg = Math.round(info.g * 0.76 + g * 0.24);
        const hb = Math.round(info.b * 0.76 + b * 0.24);
        paintSilkyAirbrushVeil(cx, cy, radius * 0.96, hr, hg, hb, Math.min(0.14, alpha * 0.065));
      } else if (preset === 'difuminado-niebla') {
        // Soft atmospheric veil glaze
        paintSilkyAirbrushVeil(cx, cy, radius * 1.05, r, g, b, Math.min(0.08, alpha * 0.032));
      }
    } else {
      // On blank areas: Armonizador & Niebla lay down an airy smooth glaze
      const veilA =
        preset === 'difuminado-suavizar'
          ? Math.min(0.05, alpha * 0.016)
          : Math.min(0.10, alpha * 0.038);
      paintSilkyAirbrushVeil(cx, cy, radius, r, g, b, veilA);
    }
  }
}

/* ---------- PART 2: 2,400+ PARAMETRIC HYPERREALISTIC TEXTURE BRUSHES ---------- */

export function drawHyperrealStrokeSegment(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  prevMid: { x: number; y: number },
  brush: BrushSettings,
  resScale: number,
  velocity: number,
  state: HyperrealStrokeState
): { nextMid: { x: number; y: number } } {
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  ctx.save();

  // Route Difuminados to true pixel-aware blending/smudging/harmonizing engine
  if (isDifuminadoPreset(brush)) {
    drawDifuminadoSegment(ctx, sourceCanvas, p1, p2, brush, resScale, state);
    ctx.restore();
    return { nextMid: mid };
  }

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);

  // Smoothly update filtered stroke direction tangent
  if (dist > 0.6) {
    const ux = dx / dist;
    const uy = dy / dist;
    if (!state.hasDir) {
      state.dirX = ux;
      state.dirY = uy;
      state.hasDir = true;
    } else {
      const fx = state.dirX * 0.58 + ux * 0.42;
      const fy = state.dirY * 0.58 + uy * 0.42;
      const fl = Math.hypot(fx, fy) || 1;
      state.dirX = fx / fl;
      state.dirY = fy / fl;
    }
  }

  // Route all 12 featured presets + all 2,400 catalog presets to the 17-engine parametric renderer
  const texParams = resolveTextureParams(brush.preset);
  if (texParams) {
    renderParametricTextureSegment(
      ctx,
      p1,
      p2,
      prevMid,
      mid,
      brush,
      resScale,
      velocity,
      state,
      texParams
    );
    ctx.restore();
    return { nextMid: mid };
  }

  // Fallback for legacy fine acrylic / crochet stitch presets
  const alpha = Math.max(0.06, Math.min(1, brush.opacity / 100));
  const size = Math.max(2, brush.size * 0.92) * resScale;
  const [r, g, b] = hexToRgb(brush.color);
  const preset = brush.preset;
  const fineMult =
    preset === 'pluma-fina'
      ? 0.18
      : preset === 'acrilico-detalle'
        ? 0.24
        : preset === 'hilo-crochet'
          ? 0.26
          : 0.32;
  const strokeW = Math.max(1.0 * resScale, size * fineMult);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (preset === 'hilo-crochet') {
    ctx.setLineDash([Math.max(5 * resScale, strokeW * 2.2), Math.max(4 * resScale, strokeW * 1.6)]);
  }
  ctx.strokeStyle = rgba(r, g, b, alpha * (preset === 'acuarela' ? 0.38 : 0.88));
  ctx.lineWidth = strokeW;
  ctx.beginPath();
  if (dist < 0.4) {
    ctx.arc(p1.x, p1.y, strokeW * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  } else {
    ctx.moveTo(prevMid.x, prevMid.y);
    ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
    ctx.stroke();
  }

  ctx.restore();
  return { nextMid: mid };
}
