import type { BrushPresetId, BrushSettings } from '../types/crochet';

export interface BrushPresetMeta {
  id: BrushPresetId;
  shortLabel: string;
  label: string;
  description: string;
  tint: string;
  defaultSize: number;
  defaultOpacity: number;
  defaultSoftness: number;
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

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [78, 39, 18];
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [Number.isNaN(r) ? 78 : r, Number.isNaN(g) ? 39 : g, Number.isNaN(b) ? 18 : b];
}

function shiftColor(
  r: number,
  g: number,
  b: number,
  delta: number
): [number, number, number] {
  if (delta >= 0) {
    return [
      Math.min(255, Math.round(r + (255 - r) * delta)),
      Math.min(255, Math.round(g + (255 - g) * delta)),
      Math.min(255, Math.round(b + (255 - b) * delta)),
    ];
  }
  const f = Math.max(0, 1 + delta);
  return [Math.round(r * f), Math.round(g * f), Math.round(b * f)];
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
}

export function createStrokeState(): HyperrealStrokeState {
  // Persistent bristle pattern for hair & oil bristle continuity across segments
  const count = 18;
  const bristleOffsets: number[] = [];
  const bristleShades: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1); // 0..1
    bristleOffsets.push((t - 0.5) * 2 + (Math.random() - 0.5) * 0.14);
    bristleShades.push((Math.random() - 0.5) * 0.42);
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

/* ---------- PART 2: 12 HYPERREALISTIC FINE-ART TEXTURE BRUSHES ---------- */

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

  const alpha = Math.max(0.06, Math.min(1, brush.opacity / 100));
  const softNorm = Math.max(0, Math.min(1, brush.softness / 100));
  const size = Math.max(2, brush.size * 0.92) * resScale;
  const [r, g, b] = hexToRgb(brush.color);
  const [dr, dg, db] = shiftColor(r, g, b, -0.34); // deep organic shadow tone
  const [lr, lg, lb] = shiftColor(r, g, b, 0.34); // crisp specular highlight tone

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
  const tx = state.dirX;
  const ty = state.dirY;
  const nx = -ty;
  const ny = tx;

  const preset = brush.preset;

  // =========================================================================
  // 1. PELO DE ANIMAL (Hyperrealistic Animal Fur: undercoat + mid hairs + sheen guard hairs)
  // =========================================================================
  if (preset === 'pelo-animal') {
    const spread = Math.max(5 * resScale, size * 0.72);
    const hairLen = Math.max(7 * resScale, size * (0.95 + (1 - softNorm) * 0.35));
    const stepSize = Math.max(2.2 * resScale, size * 0.22);
    const steps = Math.max(1, Math.min(28, Math.ceil(dist / stepSize)));
    const hairsPerStep = Math.max(7, Math.min(22, Math.round(7 + brush.size * 0.32)));

    ctx.lineCap = 'round';
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      // Subtle soft undercoat warmth behind fur
      if (softNorm > 0.15) {
        const ug = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread * 0.9);
        ug.addColorStop(0, rgba(dr, dg, db, alpha * 0.055));
        ug.addColorStop(1, rgba(dr, dg, db, 0));
        ctx.fillStyle = ug;
        ctx.beginPath();
        ctx.arc(cx, cy, spread * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let h = 0; h < hairsPerStep; h++) {
        // Gaussian-like lateral spread across brush width
        const lat = ((Math.random() + Math.random() - 1) * spread);
        const along = (Math.random() - 0.5) * stepSize * 1.4;
        const sx = cx + nx * lat + tx * along;
        const sy = cy + ny * lat + ty * along;

        // Organic slight fan + natural slight curve along fur growth direction
        const angleJitter = (Math.random() - 0.5) * 0.36 + (lat / spread) * 0.18;
        const baseAngle = Math.atan2(ty, tx) + angleJitter;
        const len = hairLen * (0.52 + Math.random() * 0.68);
        const bend = (Math.random() - 0.5) * len * 0.28;

        const mx = sx + Math.cos(baseAngle) * len * 0.52 - Math.sin(baseAngle) * bend;
        const my = sy + Math.sin(baseAngle) * len * 0.52 + Math.cos(baseAngle) * bend;
        const ex = sx + Math.cos(baseAngle) * len;
        const ey = sy + Math.sin(baseAngle) * len;

        // 3 natural fur layers: 30% dark undercoat, 50% true base pigment, 20% luminous guard hairs!
        const roll = Math.random();
        const [hr, hg, hb] =
          roll < 0.3
            ? shiftColor(r, g, b, -0.28 - Math.random() * 0.16)
            : roll > 0.8
              ? shiftColor(r, g, b, 0.24 + Math.random() * 0.26)
              : shiftColor(r, g, b, (Math.random() - 0.5) * 0.16);

        const hairW = Math.max(0.55 * resScale, (0.65 + Math.random() * 0.85) * resScale * (0.65 + brush.size / 60));
        const hairA = alpha * (roll > 0.8 ? 0.52 : 0.42 + Math.random() * 0.34);

        ctx.strokeStyle = rgba(hr, hg, hb, hairA);
        ctx.lineWidth = hairW;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(mx, my, ex, ey);
        ctx.stroke();

        // Ultra-fine tapered tip continuation
        ctx.lineWidth = hairW * 0.45;
        ctx.strokeStyle = rgba(hr, hg, hb, hairA * 0.55);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.cos(baseAngle) * len * 0.24, ey + Math.sin(baseAngle) * len * 0.24);
        ctx.stroke();
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 2. CABELLO SEDOSO (Continuous Parallel Silky Human Hair Ribbon with Luster)
  // =========================================================================
  if (preset === 'cabello-seda') {
    const widthSpread = Math.max(4 * resScale, size * 0.55);
    const taper = Math.max(0.55, Math.min(1.12, 1.08 - velocity * 0.18));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < state.bristleOffsets.length; i++) {
      const off = state.bristleOffsets[i] * widthSpread * taper;
      const shade = state.bristleShades[i];
      const isHighlightStrand = i % 5 === 2;
      const [sr, sg, sb] = isHighlightStrand
        ? shiftColor(r, g, b, 0.34)
        : shiftColor(r, g, b, shade);

      const strandW = Math.max(0.6 * resScale, (isHighlightStrand ? 0.72 : 1.05) * resScale * (0.55 + brush.size / 50));
      const strandA = alpha * (isHighlightStrand ? 0.48 : 0.55 + (1 - Math.abs(state.bristleOffsets[i]) * 0.35) * 0.3);

      ctx.strokeStyle = rgba(sr, sg, sb, strandA);
      ctx.lineWidth = strandW;
      ctx.beginPath();
      if (dist < 0.4) {
        ctx.arc(p1.x + nx * off, p1.y + ny * off, strandW * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      } else {
        ctx.moveTo(prevMid.x + nx * off, prevMid.y + ny * off);
        ctx.quadraticCurveTo(p1.x + nx * off, p1.y + ny * off, mid.x + nx * off, mid.y + ny * off);
        ctx.stroke();
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 3. ARENA FINA (Hyperrealistic Sand: multi-tone mineral grains + quartz sparkles)
  // =========================================================================
  if (preset === 'arena-fina') {
    const spread = Math.max(6 * resScale, size * 0.92);
    const stepSize = Math.max(2.5 * resScale, spread * 0.32);
    const steps = Math.max(1, Math.min(26, Math.ceil(dist / stepSize)));
    const grainsPerStep = Math.max(18, Math.min(65, Math.round(18 + brush.size * 0.95)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      // Soft warm base sand shadow bed
      const bed = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread);
      bed.addColorStop(0, rgba(r, g, b, alpha * 0.065));
      bed.addColorStop(1, rgba(r, g, b, 0));
      ctx.fillStyle = bed;
      ctx.beginPath();
      ctx.arc(cx, cy, spread, 0, Math.PI * 2);
      ctx.fill();

      for (let k = 0; k < grainsPerStep; k++) {
        // Gaussian radial scatter for natural sandy edges
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.pow(Math.random(), 0.62) * spread;
        const gx = cx + Math.cos(ang) * rad;
        const gy = cy + Math.sin(ang) * rad;
        const edgeFade = 1 - (rad / spread) * (0.45 + softNorm * 0.45);

        const roll = Math.random();
        const [gr, gg, gb] =
          roll < 0.24
            ? shiftColor(r, g, b, -0.36 - Math.random() * 0.16) // dark mineral speck
            : roll > 0.84
              ? shiftColor(r, g, b, 0.38 + Math.random() * 0.28) // sunlit quartz sparkle
              : shiftColor(r, g, b, (Math.random() - 0.5) * 0.22);

        const grainR = Math.max(0.55 * resScale, (0.55 + Math.random() * 1.25) * resScale);
        ctx.fillStyle = rgba(gr, gg, gb, alpha * edgeFade * (0.55 + Math.random() * 0.42));

        // Slightly angular micro-grain ellipse (more realistic than uniform circles)
        ctx.beginPath();
        ctx.ellipse(
          gx,
          gy,
          grainR,
          grainR * (0.62 + Math.random() * 0.4),
          Math.random() * Math.PI,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 4. PIEL Y POROS (Hyperrealistic Portrait Skin Micro-Pores + Dermal Glow)
  // =========================================================================
  if (preset === 'piel-poros') {
    const spread = Math.max(7 * resScale, size * 0.95);
    const stepSize = Math.max(3.0 * resScale, spread * 0.38);
    const steps = Math.max(1, Math.min(24, Math.ceil(dist / stepSize)));
    const poresPerStep = Math.max(12, Math.min(38, Math.round(10 + brush.size * 0.52)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      // Soft translucent subsurface skin tone veil
      const skinGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread);
      skinGrad.addColorStop(0, rgba(r, g, b, alpha * 0.085));
      skinGrad.addColorStop(0.6, rgba(r, g, b, alpha * 0.035));
      skinGrad.addColorStop(1, rgba(r, g, b, 0));
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, spread, 0, Math.PI * 2);
      ctx.fill();

      for (let k = 0; k < poresPerStep; k++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.pow(Math.random(), 0.65) * spread * 0.9;
        const px = cx + Math.cos(ang) * rad;
        const py = cy + Math.sin(ang) * rad;
        const fade = 1 - (rad / spread) * 0.65;
        const pr = Math.max(0.5 * resScale, (0.45 + Math.random() * 0.72) * resScale);

        // Recessed micro-pore dot
        ctx.fillStyle = rgba(dr, dg, db, alpha * fade * 0.24);
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();

        // Delicate micro-specular rim light beside pore (signature of realistic skin!)
        if (Math.random() > 0.35) {
          ctx.fillStyle = rgba(lr, lg, lb, alpha * fade * 0.22);
          ctx.beginPath();
          ctx.arc(px - pr * 0.85, py - pr * 0.85, pr * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 5. PLUMAS Y BÁRBULAS (Fine Feather Quill + Symmetrical Angled Barbules)
  // =========================================================================
  if (preset === 'plumas-finas') {
    const barbLen = Math.max(6 * resScale, size * 0.85);
    const stepSize = Math.max(1.8 * resScale, size * 0.16);
    const steps = Math.max(1, Math.min(34, Math.ceil(dist / stepSize)));

    // Fine central feather shaft (raquis)
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(lr, lg, lb, alpha * 0.65);
    ctx.lineWidth = Math.max(0.8 * resScale, size * 0.08);
    ctx.beginPath();
    ctx.moveTo(prevMid.x, prevMid.y);
    ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
    ctx.stroke();

    const baseAng = Math.atan2(ty, tx);
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      for (const side of [-1, 1] as const) {
        const bAng = baseAng + side * (0.58 + (Math.random() - 0.5) * 0.18);
        const len = barbLen * (0.68 + Math.random() * 0.42);
        const ex = cx + Math.cos(bAng) * len;
        const ey = cy + Math.sin(bAng) * len;
        const [br, bg, bb] =
          Math.random() > 0.72
            ? shiftColor(r, g, b, 0.26)
            : shiftColor(r, g, b, (Math.random() - 0.5) * 0.24);

        ctx.strokeStyle = rgba(br, bg, bb, alpha * (0.42 + Math.random() * 0.34));
        ctx.lineWidth = Math.max(0.55 * resScale, size * 0.048);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 6. HIERBA Y MUSGO (Botanical Curved Grass Blades & Micro-Foliage)
  // =========================================================================
  if (preset === 'hierba-follaje') {
    const spread = Math.max(6 * resScale, size * 0.8);
    const bladeLen = Math.max(8 * resScale, size * 1.15);
    const stepSize = Math.max(3.0 * resScale, size * 0.28);
    const steps = Math.max(1, Math.min(22, Math.ceil(dist / stepSize)));
    const blades = Math.max(5, Math.min(14, Math.round(4 + brush.size * 0.22)));

    ctx.lineCap = 'round';
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      for (let k = 0; k < blades; k++) {
        const bx = cx + (Math.random() - 0.5) * spread * 1.5;
        const by = cy + (Math.random() - 0.5) * spread * 0.7;
        // Natural upward botanical growth with organic lean
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.05;
        const len = bladeLen * (0.45 + Math.random() * 0.75);
        const curve = (Math.random() - 0.5) * len * 0.42;

        const mx = bx + Math.cos(ang) * len * 0.5 + curve;
        const my = by + Math.sin(ang) * len * 0.5;
        const ex = bx + Math.cos(ang) * len + curve * 1.3;
        const ey = by + Math.sin(ang) * len;

        // Shaded lower stem -> sunlit tip
        const [tr, tg, tb] = shiftColor(r, g, b, (Math.random() - 0.35) * 0.42);
        const grad = ctx.createLinearGradient(bx, by, ex, ey);
        grad.addColorStop(0, rgba(dr, dg, db, alpha * 0.82));
        grad.addColorStop(0.55, rgba(tr, tg, tb, alpha * 0.85));
        grad.addColorStop(1, rgba(lr, lg, lb, alpha * 0.65));

        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(0.8 * resScale, (0.9 + Math.random() * 0.9) * resScale);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(mx, my, ex, ey);
        ctx.stroke();
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 7. ROCA Y CORTEZA (Chiseled Mineral Facets, Cracks & Rough Stone Grit)
  // =========================================================================
  if (preset === 'roca-piedra') {
    const spread = Math.max(7 * resScale, size * 0.85);
    const stepSize = Math.max(3.5 * resScale, spread * 0.42);
    const steps = Math.max(1, Math.min(20, Math.ceil(dist / stepSize)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      // Angular rocky shards & mineral facets
      const facets = 6;
      for (let f = 0; f < facets; f++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.random() * spread * 0.72;
        const fx = cx + Math.cos(ang) * rad;
        const fy = cy + Math.sin(ang) * rad;
        const fr = spread * (0.16 + Math.random() * 0.24);
        const sides = 4 + Math.floor(Math.random() * 3);
        const toneShift = (Math.random() - 0.5) * 0.54;
        const [frCol, fgCol, fbCol] = shiftColor(r, g, b, toneShift);

        ctx.fillStyle = rgba(frCol, fgCol, fbCol, alpha * (0.28 + Math.random() * 0.3));
        ctx.beginPath();
        for (let v = 0; v < sides; v++) {
          const va = (v / sides) * Math.PI * 2 + Math.random() * 0.45;
          const vr = fr * (0.62 + Math.random() * 0.48);
          const vx = fx + Math.cos(va) * vr;
          const vy = fy + Math.sin(va) * vr;
          if (v === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Crisp micro-fissure crack line + lit upper mineral ridge
      const crAng = Math.atan2(ty, tx) + (Math.random() - 0.5) * 0.8;
      const crLen = spread * (0.45 + Math.random() * 0.5);
      const sx = cx + (Math.random() - 0.5) * spread * 0.6;
      const sy = cy + (Math.random() - 0.5) * spread * 0.6;
      ctx.strokeStyle = rgba(dr, dg, db, alpha * 0.46);
      ctx.lineWidth = Math.max(0.65 * resScale, 0.8 * resScale);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(crAng) * crLen * 0.5, sy + Math.sin(crAng) * crLen * 0.5 + (Math.random() - 0.5) * 3);
      ctx.lineTo(sx + Math.cos(crAng) * crLen, sy + Math.sin(crAng) * crLen);
      ctx.stroke();

      ctx.strokeStyle = rgba(lr, lg, lb, alpha * 0.34);
      ctx.beginPath();
      ctx.moveTo(sx - 1 * resScale, sy - 1 * resScale);
      ctx.lineTo(sx + Math.cos(crAng) * crLen * 0.5 - 1 * resScale, sy + Math.sin(crAng) * crLen * 0.5 - 1 * resScale);
      ctx.stroke();
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 8. TELA Y TRAMA (Woven Linen / Cotton Warp-and-Weft Micro-Threads)
  // =========================================================================
  if (preset === 'tela-tejido') {
    const spread = Math.max(7 * resScale, size * 0.88);
    const pitch = Math.max(2.6 * resScale, 3.2 * resScale);
    const stepSize = Math.max(3.0 * resScale, spread * 0.35);
    const steps = Math.max(1, Math.min(20, Math.ceil(dist / stepSize)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      // Soft woven base tint
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread);
      bg.addColorStop(0, rgba(r, g, b, alpha * 0.08));
      bg.addColorStop(1, rgba(r, g, b, 0));
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(cx, cy, spread, 0, Math.PI * 2);
      ctx.fill();

      // World-locked orthogonal warp & weft threads inside brush radius (zero moiré!)
      const minX = Math.floor((cx - spread) / pitch) * pitch;
      const maxX = Math.ceil((cx + spread) / pitch) * pitch;
      const minY = Math.floor((cy - spread) / pitch) * pitch;
      const maxY = Math.ceil((cy + spread) / pitch) * pitch;
      const threadW = Math.max(0.75 * resScale, pitch * 0.34);

      for (let gx = minX; gx <= maxX; gx += pitch) {
        for (let gy = minY; gy <= maxY; gy += pitch) {
          const d = Math.hypot(gx - cx, gy - cy);
          if (d >= spread) continue;
          const fade = Math.pow(1 - d / spread, 1.15);
          const parity = (Math.round(gx / pitch) + Math.round(gy / pitch)) & 1;

          // Interlaced over/under thread highlight & shadow
          if (parity === 0) {
            ctx.fillStyle = rgba(lr, lg, lb, alpha * fade * 0.34);
            ctx.fillRect(gx - pitch * 0.45, gy - threadW * 0.5, pitch * 0.9, threadW);
            ctx.fillStyle = rgba(dr, dg, db, alpha * fade * 0.18);
            ctx.fillRect(gx - pitch * 0.45, gy + threadW * 0.4, pitch * 0.9, threadW * 0.45);
          } else {
            ctx.fillStyle = rgba(r, g, b, alpha * fade * 0.36);
            ctx.fillRect(gx - threadW * 0.5, gy - pitch * 0.45, threadW, pitch * 0.9);
            ctx.fillStyle = rgba(dr, dg, db, alpha * fade * 0.16);
            ctx.fillRect(gx + threadW * 0.4, gy - pitch * 0.45, threadW * 0.45, pitch * 0.9);
          }
        }
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 9. AGUA Y GOTAS (Translucent Liquid Wash, Caustics & Rim-Lit Dew Droplets)
  // =========================================================================
  if (preset === 'agua-destellos') {
    const spread = Math.max(7 * resScale, size * 0.9);
    const stepSize = Math.max(3.5 * resScale, spread * 0.38);
    const steps = Math.max(1, Math.min(20, Math.ceil(dist / stepSize)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      // Translucent aqueous glaze
      const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread);
      wash.addColorStop(0, rgba(r, g, b, alpha * 0.12));
      wash.addColorStop(0.7, rgba(lr, lg, lb, alpha * 0.05));
      wash.addColorStop(1, rgba(r, g, b, 0));
      ctx.fillStyle = wash;
      ctx.beginPath();
      ctx.arc(cx, cy, spread, 0, Math.PI * 2);
      ctx.fill();

      // Luminous wet water droplets with shadow crescent + specular catchlight!
      const drops = 2 + Math.floor(Math.random() * 2);
      for (let dIdx = 0; dIdx < drops; dIdx++) {
        if (Math.random() > 0.65) continue;
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.random() * spread * 0.78;
        const dxp = cx + Math.cos(ang) * rad;
        const dyp = cy + Math.sin(ang) * rad;
        const dropR = Math.max(1.4 * resScale, spread * (0.09 + Math.random() * 0.14));

        // Soft drop shadow on bottom-right
        ctx.fillStyle = rgba(dr, dg, db, alpha * 0.28);
        ctx.beginPath();
        ctx.arc(dxp + dropR * 0.25, dyp + dropR * 0.28, dropR * 1.02, 0, Math.PI * 2);
        ctx.fill();

        // Translucent glassy water dome
        const dome = ctx.createRadialGradient(
          dxp - dropR * 0.3,
          dyp - dropR * 0.3,
          dropR * 0.1,
          dxp,
          dyp,
          dropR
        );
        dome.addColorStop(0, rgba(255, 255, 255, alpha * 0.55));
        dome.addColorStop(0.55, rgba(r, g, b, alpha * 0.24));
        dome.addColorStop(0.92, rgba(lr, lg, lb, alpha * 0.45));
        dome.addColorStop(1, rgba(dr, dg, db, alpha * 0.22));
        ctx.fillStyle = dome;
        ctx.beginPath();
        ctx.arc(dxp, dyp, dropR, 0, Math.PI * 2);
        ctx.fill();

        // Pinpoint specular highlight
        ctx.fillStyle = rgba(255, 255, 255, alpha * 0.88);
        ctx.beginPath();
        ctx.arc(dxp - dropR * 0.32, dyp - dropR * 0.34, Math.max(0.5 * resScale, dropR * 0.26), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 10. ÓLEO CERDAS (Physical Multi-Bristle Impasto Painter's Brush)
  // =========================================================================
  if (preset === 'oleo-cerdas') {
    const brushHalfW = Math.max(4 * resScale, size * 0.58);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Creamy base paint body
    ctx.strokeStyle = rgba(r, g, b, alpha * 0.42);
    ctx.lineWidth = brushHalfW * 1.9;
    ctx.beginPath();
    if (dist < 0.4) {
      ctx.arc(p1.x, p1.y, brushHalfW * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    } else {
      ctx.moveTo(prevMid.x, prevMid.y);
      ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
      ctx.stroke();
    }

    // Persistent hog-hair impasto bristle ridges with light & shadow grooves!
    for (let i = 0; i < state.bristleOffsets.length; i++) {
      const off = state.bristleOffsets[i] * brushHalfW;
      const shade = state.bristleShades[i];
      const [br, bg, bb] = shiftColor(r, g, b, shade * 0.85);
      const bw = Math.max(0.8 * resScale, (brushHalfW / state.bristleOffsets.length) * 2.2);

      ctx.strokeStyle = rgba(br, bg, bb, alpha * (0.55 + Math.abs(shade) * 0.4));
      ctx.lineWidth = bw;
      ctx.beginPath();
      if (dist < 0.4) {
        ctx.arc(p1.x + nx * off, p1.y + ny * off, bw * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      } else {
        ctx.moveTo(prevMid.x + nx * off, prevMid.y + ny * off);
        ctx.quadraticCurveTo(p1.x + nx * off, p1.y + ny * off, mid.x + nx * off, mid.y + ny * off);
        ctx.stroke();
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 11. GRAFITO HIPERREAL (Hyperrealist Graphite Lead + Cold-Press Paper Tooth)
  // =========================================================================
  if (preset === 'grafito-hiper') {
    const coreW = Math.max(0.85 * resScale, size * 0.22 * Math.max(0.65, Math.min(1.12, 1.08 - velocity * 0.16)));
    const stepSize = Math.max(1.0 * resScale, coreW * 0.45);
    const steps = Math.max(1, Math.min(48, Math.ceil(dist / stepSize)));

    // Crisp central graphite lead line
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = rgba(r, g, b, alpha * 0.72);
    ctx.lineWidth = coreW;
    ctx.beginPath();
    if (dist < 0.4) {
      ctx.arc(p1.x, p1.y, coreW * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    } else {
      ctx.moveTo(prevMid.x, prevMid.y);
      ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
      ctx.stroke();
    }

    // Authentic fine paper-tooth graphite micro-grain around core
    const grainSpread = coreW * (1.1 + softNorm * 0.85);
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;
      for (let k = 0; k < 5; k++) {
        const gx = cx + (Math.random() - 0.5) * grainSpread * 2;
        const gy = cy + (Math.random() - 0.5) * grainSpread * 2;
        // Paper tooth spatial hash (consistent across overlapping passes!)
        const tooth = Math.sin(gx * 0.78) * Math.cos(gy * 0.83);
        if (tooth < -0.15) continue;
        const gr = Math.max(0.45 * resScale, coreW * (0.14 + Math.random() * 0.16));
        ctx.fillStyle = rgba(r, g, b, alpha * (0.28 + tooth * 0.32));
        ctx.fillRect(gx, gy, gr, gr);
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // 12. MICRO-DESTELLOS (Hyperrealistic Specular Catchlights & Radiant Dust)
  // =========================================================================
  if (preset === 'brillo-estelar') {
    const spread = Math.max(6 * resScale, size * 0.9);
    const stepSize = Math.max(5.0 * resScale, spread * 0.55);
    const steps = Math.max(1, Math.min(18, Math.ceil(dist / stepSize)));
    const [sr, sg, sb] = shiftColor(r, g, b, 0.58);

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      const count = 3 + Math.floor(Math.random() * 4);
      for (let k = 0; k < count; k++) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.pow(Math.random(), 0.72) * spread;
        const sx = cx + Math.cos(ang) * rad;
        const sy = cy + Math.sin(ang) * rad;
        const starR = Math.max(0.75 * resScale, spread * (0.04 + Math.random() * 0.10));

        // Soft luminous halo
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, starR * 2.8);
        halo.addColorStop(0, rgba(255, 255, 255, alpha * 0.88));
        halo.addColorStop(0.35, rgba(sr, sg, sb, alpha * 0.45));
        halo.addColorStop(1, rgba(r, g, b, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, starR * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Crisp 4-point optical catchlight glint on larger motes
        if (Math.random() > 0.62) {
          const rayLen = starR * 3.4;
          ctx.strokeStyle = rgba(255, 255, 255, alpha * 0.78);
          ctx.lineWidth = Math.max(0.55 * resScale, starR * 0.45);
          ctx.beginPath();
          ctx.moveTo(sx - rayLen, sy);
          ctx.lineTo(sx + rayLen, sy);
          ctx.moveTo(sx, sy - rayLen);
          ctx.lineTo(sx, sy + rayLen);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
    return { nextMid: mid };
  }

  // =========================================================================
  // FALLBACK: Legacy Fine Acrylic / Crochet Stitch Brushes
  // =========================================================================
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
