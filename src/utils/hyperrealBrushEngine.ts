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

export interface MagicLightColorOption {
  id: string;
  label: string;
  hex: string;
  coreHex: string;
  glowHex: string;
  primary?: boolean;
}

/**
 * Curated luminescent light colors for the Magic Light Brush.
 * Primary default: Oro Solar (#FFD84D) — radiant golden sunlight & fairy dust.
 */
export const MAGIC_LIGHT_COLORS: MagicLightColorOption[] = [
  {
    id: 'oro-solar',
    label: 'Oro Solar (Principal)',
    hex: '#FFD84D',
    coreHex: '#FFFDF0',
    glowHex: '#FFA818',
    primary: true,
  },
  {
    id: 'luz-blanca',
    label: 'Luz Solar Pura',
    hex: '#FFF8DC',
    coreHex: '#FFFFFF',
    glowHex: '#FFE28A',
  },
  {
    id: 'ambar-miel',
    label: 'Ámbar Atardecer',
    hex: '#FFA630',
    coreHex: '#FFF6D4',
    glowHex: '#FF6B1A',
  },
  {
    id: 'rosa-hada',
    label: 'Polvo Rosa Hada',
    hex: '#FF85D0',
    coreHex: '#FFF2FA',
    glowHex: '#FF3FA4',
  },
  {
    id: 'celeste-luz',
    label: 'Luz Celeste Estelar',
    hex: '#68E2FF',
    coreHex: '#F0FDFF',
    glowHex: '#1FA8FF',
  },
  {
    id: 'esmeralda-hada',
    label: 'Aura Esmeralda',
    hex: '#64FFB0',
    coreHex: '#F0FFF7',
    glowHex: '#12D678',
  },
  {
    id: 'violeta-magico',
    label: 'Nebulosa Violeta',
    hex: '#C48AFF',
    coreHex: '#FAF2FF',
    glowHex: '#8E42FF',
  },
  {
    id: 'coral-aurora',
    label: 'Brillo Aurora',
    hex: '#FF7D66',
    coreHex: '#FFF3EE',
    glowHex: '#FF4536',
  },
];

export const LUZ_MAGICA_PRESETS: BrushPresetMeta[] = [
  {
    id: 'luz-oro-solar',
    shortLabel: 'Polvo Hada',
    label: 'Polvo de Hada Solar',
    description:
      'Luz dorada muy luminosa con destellos centelleantes y polvo de hada como rayos de sol para iluminar dibujos.',
    tint: '#FFD84D',
    defaultSize: 28,
    defaultOpacity: 88,
    defaultSoftness: 86,
  },
  {
    id: 'luz-rayo-solar',
    shortLabel: 'Rayo Sol',
    label: 'Rayo de Sol Volumétrico',
    description:
      'Haz de luz cálida y envolvente con motas suspendidas para bañar de claridad tus obras y retratos.',
    tint: '#FFE680',
    defaultSize: 42,
    defaultOpacity: 74,
    defaultSoftness: 95,
  },
  {
    id: 'luz-estela-magica',
    shortLabel: 'Estela Luz',
    label: 'Estela Mágica Brillante',
    description:
      'Núcleo blanco incandescente con halo luminiscente intenso y chispas mágicas al trazar contornos de luz.',
    tint: '#FFCA3A',
    defaultSize: 20,
    defaultOpacity: 92,
    defaultSoftness: 78,
  },
  {
    id: 'luz-lluvia-estrellas',
    shortLabel: 'Estrellas',
    label: 'Lluvia de Destellos',
    description:
      'Cascada brillante de estrellitas de cuatro puntas, polvo luminoso y burbujas bokeh doradas.',
    tint: '#FFF1A8',
    defaultSize: 32,
    defaultOpacity: 90,
    defaultSoftness: 70,
  },
  {
    id: 'luz-halo-etereo',
    shortLabel: 'Halo Sol',
    label: 'Halo Etéreo Luminoso',
    description:
      'Resplandor puro, sedoso y homogéneo sin partículas para iluminar piel, cabello, ojos y relieves.',
    tint: '#FFDF73',
    defaultSize: 36,
    defaultOpacity: 66,
    defaultSoftness: 98,
  },
  {
    id: 'luz-prisma-iris',
    shortLabel: 'Prisma',
    label: 'Polvo Prisma Solar',
    description:
      'Destellos de oro solar combinados con micro-chispas iridiscentes de arcoíris luminoso.',
    tint: '#FFE08A',
    defaultSize: 30,
    defaultOpacity: 88,
    defaultSoftness: 84,
  },
];

export const ALL_BRUSH_META_MAP: Record<string, BrushPresetMeta> = Object.fromEntries(
  [...DIFUMINADO_PRESETS, ...LUZ_MAGICA_PRESETS, ...HYPERREAL_PINCEL_PRESETS].map((p) => [
    p.id,
    p,
  ])
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

export function isMagicLightPreset(brush: BrushSettings): boolean {
  return brush.category === 'luz' || brush.preset.startsWith('luz-');
}

export function isDifuminadoPreset(brush: BrushSettings): boolean {
  if (isMagicLightPreset(brush)) return false;
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

/* ---------- PART 1B: LUMINESCENT MAGIC LIGHT & FAIRY-DUST ENGINE (LUZ MÁGICA) ---------- */

function boostLuminousRgb(r: number, g: number, b: number): [number, number, number] {
  const maxC = Math.max(r, g, b);
  if (maxC < 45) {
    // Fallback to radiant solar gold if brush color was near-black
    return [255, 216, 77];
  }
  const scale = maxC < 245 ? 255 / maxC : 1;
  return [
    Math.min(255, Math.round(r * scale)),
    Math.min(255, Math.round(g * scale)),
    Math.min(255, Math.round(b * scale)),
  ];
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Draw a delicate glowing 4-point or 8-point starburst sparkle flare */
function drawStarburstGlint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rayLen: number,
  rgb: [number, number, number],
  coreRgb: [number, number, number],
  intensity: number,
  angleRad: number,
  eightPoint = false
): void {
  if (rayLen < 1.5 || intensity <= 0.01) return;

  // Soft circular halo around the sparkle
  const haloR = rayLen * 0.95;
  const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR);
  haloGrad.addColorStop(0, rgba(coreRgb[0], coreRgb[1], coreRgb[2], intensity * 0.85));
  haloGrad.addColorStop(0.28, rgba(rgb[0], rgb[1], rgb[2], intensity * 0.45));
  haloGrad.addColorStop(0.68, rgba(rgb[0], rgb[1], rgb[2], intensity * 0.12));
  haloGrad.addColorStop(1, rgba(rgb[0], rgb[1], rgb[2], 0));
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();

  // Sharp tapered luminous diamond rays
  const drawCross = (len: number, thick: number, rot: number, alphaMult: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    for (let arm = 0; arm < 2; arm++) {
      ctx.rotate((Math.PI / 2) * arm);
      const grad = ctx.createLinearGradient(-len, 0, len, 0);
      grad.addColorStop(0, rgba(rgb[0], rgb[1], rgb[2], 0));
      grad.addColorStop(0.35, rgba(rgb[0], rgb[1], rgb[2], intensity * 0.52 * alphaMult));
      grad.addColorStop(0.5, rgba(255, 255, 250, Math.min(1, intensity * 0.96 * alphaMult)));
      grad.addColorStop(0.65, rgba(rgb[0], rgb[1], rgb[2], intensity * 0.52 * alphaMult));
      grad.addColorStop(1, rgba(rgb[0], rgb[1], rgb[2], 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.quadraticCurveTo(0, -thick, len, 0);
      ctx.quadraticCurveTo(0, thick, -len, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  drawCross(rayLen, Math.max(0.7, rayLen * 0.14), angleRad, 1);
  if (eightPoint) {
    drawCross(rayLen * 0.58, Math.max(0.55, rayLen * 0.1), angleRad + Math.PI / 4, 0.72);
  }

  // Hot white incandescent center pinpoint
  ctx.fillStyle = rgba(255, 255, 252, Math.min(1, intensity * 0.98));
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(0.85, rayLen * 0.14), 0, Math.PI * 2);
  ctx.fill();
}

const PRISMA_SPARKLE_PALETTE: Array<[number, number, number]> = [
  [255, 218, 82],  // Solar Gold
  [255, 246, 198], // Sunlight Cream
  [255, 145, 212], // Fairy Rose
  [112, 230, 255], // Celestial Cyan
  [142, 255, 196], // Mint Fairy
  [208, 152, 255], // Lilac Star
];

function drawMagicLightSegment(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  brush: BrushSettings,
  resScale: number,
  state: HyperrealStrokeState
): void {
  const alpha = Math.max(0.08, Math.min(1, brush.opacity / 100));
  const softNorm = Math.max(0.2, Math.min(1, brush.softness / 100));
  const [rawR, rawG, rawB] = hexToRgb(brush.color);
  const baseRgb = boostLuminousRgb(rawR, rawG, rawB);
  const coreRgb = mixRgb(baseRgb, [255, 254, 244], 0.78);
  const outerRgb = mixRgb(baseRgb, [255, 178, 36], baseRgb[0] > 220 && baseRgb[1] > 180 ? 0.35 : 0.08);
  const preset = brush.preset;
  const rand = state.rand;

  const sizeBase = Math.max(4, brush.size) * resScale;
  const radiusMult =
    preset === 'luz-rayo-solar'
      ? 1.75
      : preset === 'luz-halo-etereo'
        ? 1.55
        : preset === 'luz-estela-magica'
          ? 0.92
          : preset === 'luz-lluvia-estrellas'
            ? 1.45
            : 1.25;
  const radius = Math.max(8 * resScale, sizeBase * radiusMult);

  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const stepSpacing =
    preset === 'luz-lluvia-estrellas'
      ? Math.max(4 * resScale, radius * 0.24)
      : Math.max(2 * resScale, radius * 0.16);
  const steps = Math.max(1, Math.min(44, Math.ceil(dist / stepSpacing)));

  // True physical additive illumination: brightens & adds sunlight directly over existing art
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Helper to paint an exponential multi-stop sunlit glow bloom
  const paintGlowBloom = (
    cx: number,
    cy: number,
    rad: number,
    innerCol: [number, number, number],
    midCol: [number, number, number],
    edgeCol: [number, number, number],
    strength: number
  ) => {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, rgba(innerCol[0], innerCol[1], innerCol[2], strength));
    grad.addColorStop(0.24, rgba(midCol[0], midCol[1], midCol[2], strength * 0.68));
    grad.addColorStop(0.56, rgba(edgeCol[0], edgeCol[1], edgeCol[2], strength * 0.24));
    grad.addColorStop(1, rgba(edgeCol[0], edgeCol[1], edgeCol[2], 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  };

  // 1) LUMINOUS AMBIENT BLOOM & SUNBEAM CORE RIBBON
  for (let s = 0; s <= steps; s++) {
    const t = steps === 0 ? 1 : s / steps;
    const cx = p1.x + (p2.x - p1.x) * t;
    const cy = p1.y + (p2.y - p1.y) * t;

    if (preset === 'luz-halo-etereo') {
      // Pure silky sunlit luminescence without dust particles
      const bloomA = Math.min(0.16, alpha * (0.048 + (1 - softNorm) * 0.032));
      paintGlowBloom(cx, cy, radius * 1.15, coreRgb, baseRgb, outerRgb, bloomA);
    } else if (preset === 'luz-rayo-solar') {
      // Wide volumetric warm sunbeam
      const bloomA = Math.min(0.13, alpha * 0.042);
      paintGlowBloom(cx, cy, radius * 1.32, coreRgb, baseRgb, outerRgb, bloomA);
      // Warm inner sun shaft core
      paintGlowBloom(cx, cy, radius * 0.45, [255, 255, 246], coreRgb, baseRgb, bloomA * 0.72);
    } else if (preset === 'luz-estela-magica') {
      // Intense glowing neon-fairy trail with white-hot core
      const outerA = Math.min(0.18, alpha * 0.068);
      paintGlowBloom(cx, cy, radius * 1.12, baseRgb, baseRgb, outerRgb, outerA);
      paintGlowBloom(cx, cy, radius * 0.36, [255, 255, 252], coreRgb, baseRgb, Math.min(0.32, alpha * 0.16));
    } else if (preset === 'luz-lluvia-estrellas') {
      // Delicate misty shimmer bed beneath the star cascade
      const mistA = Math.min(0.08, alpha * 0.028);
      paintGlowBloom(cx, cy, radius * 1.05, coreRgb, baseRgb, outerRgb, mistA);
    } else {
      // Polvo de Hada Solar (default primary) & Prisma Solar:
      // Lush golden sunlight aura + bright inner glow ribbon
      const auraA = Math.min(0.15, alpha * 0.052);
      paintGlowBloom(cx, cy, radius * 1.18, coreRgb, baseRgb, outerRgb, auraA);
      paintGlowBloom(cx, cy, radius * 0.38, [255, 255, 246], coreRgb, baseRgb, Math.min(0.19, alpha * 0.082));
    }
  }

  // 2) FAIRY-DUST MICRO-SPARKLES, BOKEH ORBS & STARBURST GLINTS
  if (preset !== 'luz-halo-etereo') {
    const dustInterval =
      preset === 'luz-lluvia-estrellas'
        ? Math.max(4.5 * resScale, radius * 0.22)
        : preset === 'luz-rayo-solar'
          ? Math.max(11 * resScale, radius * 0.48)
          : Math.max(5.5 * resScale, radius * 0.28);

    state.distAccum += Math.max(dist, dist < 0.5 ? dustInterval : 0);
    let emitted = 0;
    const maxEmits = 22;

    while (state.distAccum >= dustInterval && emitted < maxEmits) {
      state.distAccum -= dustInterval;
      emitted++;
      const t = rand();
      const bx = p1.x + (p2.x - p1.x) * t;
      const by = p1.y + (p2.y - p1.y) * t;

      const spread =
        preset === 'luz-lluvia-estrellas'
          ? radius * 1.48
          : preset === 'luz-rayo-solar'
            ? radius * 1.25
            : preset === 'luz-estela-magica'
              ? radius * 0.92
              : radius * 1.18;

      // Scatter crisp glowing fairy-dust micro-motes
      const moteCount =
        preset === 'luz-lluvia-estrellas'
          ? 6
          : preset === 'luz-rayo-solar'
            ? 3
            : preset === 'luz-estela-magica'
              ? 4
              : 5;

      for (let m = 0; m < moteCount; m++) {
        const ang = rand() * Math.PI * 2;
        const rDist = Math.pow(rand(), 0.65) * spread;
        const mx = bx + Math.cos(ang) * rDist;
        const my = by + Math.sin(ang) * rDist;

        const moteRgb =
          preset === 'luz-prisma-iris' && rand() < 0.58
            ? PRISMA_SPARKLE_PALETTE[Math.floor(rand() * PRISMA_SPARKLE_PALETTE.length)]
            : baseRgb;
        const moteCore = mixRgb(moteRgb, [255, 255, 248], 0.82);

        const moteR = Math.max(1.1 * resScale, (0.04 + rand() * 0.11) * radius);
        const moteAlpha = Math.min(0.95, alpha * (0.42 + rand() * 0.55));

        // Glowing dust mote aura
        const mGrad = ctx.createRadialGradient(mx, my, 0, mx, my, moteR * 2.4);
        mGrad.addColorStop(0, rgba(255, 255, 252, moteAlpha));
        mGrad.addColorStop(0.28, rgba(moteCore[0], moteCore[1], moteCore[2], moteAlpha * 0.78));
        mGrad.addColorStop(0.62, rgba(moteRgb[0], moteRgb[1], moteRgb[2], moteAlpha * 0.28));
        mGrad.addColorStop(1, rgba(moteRgb[0], moteRgb[1], moteRgb[2], 0));
        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.arc(mx, my, moteR * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Soft translucent golden bokeh orbs (especially in Polvo de Hada & Lluvia Estelar)
      if (
        (preset === 'luz-oro-solar' ||
          preset === 'luz-lluvia-estrellas' ||
          preset === 'luz-prisma-iris') &&
        rand() < 0.48
      ) {
        const bAng = rand() * Math.PI * 2;
        const bDist = (0.25 + rand() * 0.85) * spread;
        const ox = bx + Math.cos(bAng) * bDist;
        const oy = by + Math.sin(bAng) * bDist;
        const orbR = Math.max(2.6 * resScale, (0.12 + rand() * 0.18) * radius);
        const orbRgb =
          preset === 'luz-prisma-iris'
            ? PRISMA_SPARKLE_PALETTE[Math.floor(rand() * PRISMA_SPARKLE_PALETTE.length)]
            : baseRgb;
        const orbGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orbR);
        orbGrad.addColorStop(0, rgba(255, 254, 240, alpha * 0.28));
        orbGrad.addColorStop(0.72, rgba(orbRgb[0], orbRgb[1], orbRgb[2], alpha * 0.22));
        orbGrad.addColorStop(0.92, rgba(255, 252, 232, alpha * 0.34));
        orbGrad.addColorStop(1, rgba(orbRgb[0], orbRgb[1], orbRgb[2], 0));
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, orbR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Crisp 4-point & 8-point twinkling starburst glints
      const starChance =
        preset === 'luz-lluvia-estrellas'
          ? 0.92
          : preset === 'luz-oro-solar' || preset === 'luz-prisma-iris'
            ? 0.68
            : preset === 'luz-estela-magica'
              ? 0.52
              : 0.28;

      if (rand() < starChance) {
        const sAng = rand() * Math.PI * 2;
        const sDist = Math.pow(rand(), 0.72) * spread * 0.95;
        const sx = bx + Math.cos(sAng) * sDist;
        const sy = by + Math.sin(sAng) * sDist;
        const starLen = Math.max(
          4.2 * resScale,
          radius * (preset === 'luz-lluvia-estrellas' ? 0.32 + rand() * 0.42 : 0.24 + rand() * 0.34)
        );
        const starRgb =
          preset === 'luz-prisma-iris' && rand() < 0.55
            ? PRISMA_SPARKLE_PALETTE[Math.floor(rand() * PRISMA_SPARKLE_PALETTE.length)]
            : baseRgb;
        const starCore = mixRgb(starRgb, [255, 255, 250], 0.85);
        const starRot = (rand() - 0.5) * 0.45; // slight twinkle tilt around upright cross
        drawStarburstGlint(
          ctx,
          sx,
          sy,
          starLen,
          starRgb,
          starCore,
          Math.min(0.98, alpha * (0.58 + rand() * 0.42)),
          starRot,
          rand() < 0.32
        );
      }
    }
  }

  ctx.restore();
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

  // Route Magic Light & Fairy-Dust presets to additive luminescent engine
  if (isMagicLightPreset(brush)) {
    drawMagicLightSegment(ctx, p1, p2, brush, resScale, state);
    ctx.restore();
    return { nextMid: mid };
  }

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
