import type { BrushPresetId, BrushSettings } from '../types/crochet';
import {
  CATALOG_BRUSH_BY_ID,
  type TextureBrushParams,
} from './brushTextureCatalog';

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

function createSeededRand(seed: number): () => number {
  let s = seed >>> 0 || 0x6d2b79f5;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ParametricStrokeRuntime {
  dirX: number;
  dirY: number;
  hasDir: boolean;
  distAccum: number;
  bristleOffsets: number[];
  bristleShades: number[];
  rand: () => number;
}

/** Built-in featured presets mapped to the same parametric 17-engine pipeline */
const FEATURED_PARAMS: Record<string, TextureBrushParams> = {
  'pelo-animal': {
    engine: 'fur',
    seed: 101,
    density: 1.05,
    scale: 1.0,
    curl: 0.32,
    contrast: 0.36,
    sheen: 0.24,
    scatter: 0.9,
    spacing: 0.24,
    subMode: 0,
  },
  'cabello-seda': {
    engine: 'hair',
    seed: 202,
    density: 1.0,
    scale: 1.0,
    curl: 0.14,
    contrast: 0.34,
    sheen: 0.42,
    scatter: 0.72,
    spacing: 0.22,
    subMode: 0,
  },
  'arena-fina': {
    engine: 'sand',
    seed: 303,
    density: 1.1,
    scale: 0.95,
    curl: 0.25,
    contrast: 0.38,
    sheen: 0.28,
    scatter: 1.0,
    spacing: 0.32,
    subMode: 0,
  },
  'piel-poros': {
    engine: 'skin',
    seed: 404,
    density: 1.0,
    scale: 0.95,
    curl: 0.18,
    contrast: 0.32,
    sheen: 0.3,
    scatter: 0.95,
    spacing: 0.36,
    subMode: 0,
  },
  'plumas-finas': {
    engine: 'feather',
    seed: 505,
    density: 1.05,
    scale: 1.0,
    curl: 0.25,
    contrast: 0.3,
    sheen: 0.32,
    scatter: 0.85,
    spacing: 0.18,
    subMode: 0,
  },
  'hierba-follaje': {
    engine: 'botanical',
    seed: 606,
    density: 1.0,
    scale: 1.08,
    curl: 0.42,
    contrast: 0.36,
    sheen: 0.24,
    scatter: 0.95,
    spacing: 0.28,
    subMode: 0,
  },
  'roca-piedra': {
    engine: 'rock',
    seed: 707,
    density: 1.0,
    scale: 1.0,
    curl: 0.35,
    contrast: 0.48,
    sheen: 0.22,
    scatter: 0.92,
    spacing: 0.4,
    subMode: 0,
  },
  'tela-tejido': {
    engine: 'fabric',
    seed: 808,
    density: 1.0,
    scale: 1.0,
    curl: 0.1,
    contrast: 0.32,
    sheen: 0.22,
    scatter: 0.9,
    spacing: 0.34,
    subMode: 0,
  },
  'agua-destellos': {
    engine: 'water',
    seed: 909,
    density: 1.0,
    scale: 1.0,
    curl: 0.25,
    contrast: 0.34,
    sheen: 0.65,
    scatter: 0.92,
    spacing: 0.36,
    subMode: 0,
  },
  'oleo-cerdas': {
    engine: 'oil',
    seed: 1010,
    density: 1.05,
    scale: 1.0,
    curl: 0.12,
    contrast: 0.38,
    sheen: 0.28,
    scatter: 0.78,
    spacing: 0.22,
    subMode: 0,
  },
  'grafito-hiper': {
    engine: 'graphite',
    seed: 1111,
    density: 1.0,
    scale: 1.0,
    curl: 0.15,
    contrast: 0.32,
    sheen: 0.08,
    scatter: 0.85,
    spacing: 0.24,
    subMode: 0,
  },
  'brillo-estelar': {
    engine: 'sparkle',
    seed: 1212,
    density: 1.0,
    scale: 1.0,
    curl: 0.2,
    contrast: 0.42,
    sheen: 0.85,
    scatter: 1.0,
    spacing: 0.52,
    subMode: 0,
  },
};

export function resolveTextureParams(preset: BrushPresetId): TextureBrushParams | null {
  const cat = CATALOG_BRUSH_BY_ID[preset];
  if (cat) return cat.params;
  return FEATURED_PARAMS[preset] || null;
}

/**
 * Renders one stroke segment using any of the 17 parametric hyperrealistic fine-art engines.
 */
export function renderParametricTextureSegment(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  prevMid: { x: number; y: number },
  mid: { x: number; y: number },
  brush: BrushSettings,
  resScale: number,
  velocity: number,
  state: ParametricStrokeRuntime,
  params: TextureBrushParams
): void {
  const rand = state.rand;
  const alpha = Math.max(0.06, Math.min(1, brush.opacity / 100));
  const softNorm = Math.max(0, Math.min(1, brush.softness / 100));
  const size = Math.max(2, brush.size * 0.92) * resScale;
  const [r, g, b] = hexToRgb(brush.color);
  const cAmt = Math.max(0.14, Math.min(0.68, params.contrast));
  const [dr, dg, db] = shiftColor(r, g, b, -cAmt);
  const [lr, lg, lb] = shiftColor(r, g, b, Math.min(0.75, cAmt + params.sheen * 0.32));

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.hypot(dx, dy);
  const tx = state.dirX;
  const ty = state.dirY;
  const nx = -ty;
  const ny = tx;
  const baseAng = Math.atan2(ty, tx);

  const { engine, density, scale, curl, sheen, scatter, spacing, subMode } = params;

  // =========================================================================
  // 1. FUR (Pelaje animal: corto, largo, rizado, felino, lanudo, bigotes)
  // =========================================================================
  if (engine === 'fur') {
    const spread = Math.max(4 * resScale, size * 0.72 * scatter);
    const hairLen = Math.max(5 * resScale, size * (0.86 + (1 - softNorm) * 0.34) * scale);
    const stepSize = Math.max(2.0 * resScale, size * Math.max(0.14, spacing));
    const steps = Math.max(1, Math.min(28, Math.ceil(dist / stepSize)));
    const hairsPerStep = Math.max(5, Math.min(26, Math.round((6 + brush.size * 0.28) * density)));

    ctx.lineCap = 'round';
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      if (softNorm > 0.14) {
        const ug = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread * 0.95);
        ug.addColorStop(0, rgba(dr, dg, db, alpha * 0.06));
        ug.addColorStop(1, rgba(dr, dg, db, 0));
        ctx.fillStyle = ug;
        ctx.beginPath();
        ctx.arc(cx, cy, spread * 0.95, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let h = 0; h < hairsPerStep; h++) {
        const lat = (rand() + rand() - 1) * spread;
        const along = (rand() - 0.5) * stepSize * 1.4;
        const sx = cx + nx * lat + tx * along;
        const sy = cy + ny * lat + ty * along;

        const fanSign = subMode === 3 ? (rand() - 0.5) * 1.6 : (lat / Math.max(1, spread)) * 0.22;
        const angleJitter = (rand() - 0.5) * (0.34 + curl * 0.55) + fanSign;
        const hAng = baseAng + angleJitter;
        const len = hairLen * (0.48 + rand() * 0.68);
        const bend = (rand() - 0.5) * len * (0.24 + curl * 0.55);

        const mx = sx + Math.cos(hAng) * len * 0.52 - Math.sin(hAng) * bend;
        const my = sy + Math.sin(hAng) * len * 0.52 + Math.cos(hAng) * bend;
        const ex = sx + Math.cos(hAng) * len;
        const ey = sy + Math.sin(hAng) * len;

        const roll = rand();
        const highlightCutoff = 1 - Math.min(0.45, 0.14 + sheen * 0.32);
        const [hr, hg, hb] =
          roll < 0.3
            ? shiftColor(r, g, b, -cAmt * (0.7 + rand() * 0.45))
            : roll > highlightCutoff
              ? shiftColor(r, g, b, cAmt * 0.7 + sheen * 0.38)
              : shiftColor(r, g, b, (rand() - 0.5) * cAmt * 0.55);

        const thickFactor = subMode === 2 ? 1.28 : subMode === 1 ? 0.72 : 1.0;
        const hairW = Math.max(
          0.48 * resScale,
          (0.6 + rand() * 0.75) * resScale * (0.58 + brush.size / 62) * thickFactor
        );
        const hairA = alpha * (roll > highlightCutoff ? 0.54 : 0.42 + rand() * 0.34);

        ctx.strokeStyle = rgba(hr, hg, hb, hairA);
        ctx.lineWidth = hairW;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        if (subMode === 2 && curl > 0.65) {
          // Curly wool / fleece loop
          const c2x = mx + Math.sin(hAng) * bend * 0.85;
          const c2y = my - Math.cos(hAng) * bend * 0.85;
          ctx.bezierCurveTo(mx, my, c2x, c2y, ex, ey);
        } else {
          ctx.quadraticCurveTo(mx, my, ex, ey);
        }
        ctx.stroke();

        // Tapered fine tip
        ctx.lineWidth = hairW * 0.42;
        ctx.strokeStyle = rgba(hr, hg, hb, hairA * 0.52);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + Math.cos(hAng) * len * 0.24, ey + Math.sin(hAng) * len * 0.24);
        ctx.stroke();
      }
    }
    return;
  }

  // =========================================================================
  // 2. HAIR (Cabello sedoso, ondas, rizos, trenzas, pestañas, mechones)
  // =========================================================================
  if (engine === 'hair') {
    const widthSpread = Math.max(3.5 * resScale, size * 0.54 * scatter);
    const taper = Math.max(0.52, Math.min(1.14, 1.08 - velocity * 0.18));
    const strandCount = Math.max(
      6,
      Math.min(state.bristleOffsets.length, Math.round(12 * density))
    );
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    state.distAccum += dist;
    const waveFreq = 0.08 / Math.max(0.4, scale);
    const waveAmp = curl * widthSpread * (subMode === 2 ? 0.48 : subMode === 1 ? 0.28 : 0.08);

    for (let i = 0; i < strandCount; i++) {
      const idx = Math.floor((i / strandCount) * state.bristleOffsets.length);
      const baseOff = state.bristleOffsets[idx] * widthSpread * taper;
      const phase = state.distAccum * waveFreq + i * (subMode === 3 ? 1.15 : 0.45);
      const wOff1 = Math.sin(phase - dist * waveFreq) * waveAmp;
      const wOff2 = Math.sin(phase) * waveAmp;
      const off1 = baseOff + wOff1;
      const off2 = baseOff + wOff2;

      const shade = state.bristleShades[idx] * (cAmt / 0.34);
      const isHighlight = i % Math.max(3, Math.round(6 - sheen * 3)) === 1;
      const [sr, sg, sb] = isHighlight
        ? shiftColor(r, g, b, 0.24 + sheen * 0.42)
        : shiftColor(r, g, b, shade);

      const strandW = Math.max(
        0.5 * resScale,
        (isHighlight ? 0.68 : 0.96) * resScale * (0.5 + brush.size / 54) * Math.sqrt(scale)
      );
      const strandA =
        alpha *
        (isHighlight
          ? 0.42 + sheen * 0.24
          : 0.54 + (1 - Math.abs(state.bristleOffsets[idx]) * 0.34) * 0.28);

      ctx.strokeStyle = rgba(sr, sg, sb, strandA);
      ctx.lineWidth = strandW;
      ctx.beginPath();
      if (dist < 0.4) {
        ctx.arc(p1.x + nx * off2, p1.y + ny * off2, strandW * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      } else {
        ctx.moveTo(prevMid.x + nx * off1, prevMid.y + ny * off1);
        ctx.quadraticCurveTo(p1.x + nx * ((off1 + off2) * 0.5), p1.y + ny * ((off1 + off2) * 0.5), mid.x + nx * off2, mid.y + ny * off2);
        ctx.stroke();
      }
    }
    return;
  }

  // =========================================================================
  // 3. SKIN (Piel hiperreal: micro-poros, pecas, líneas finas, vello, brillo)
  // =========================================================================
  if (engine === 'skin') {
    const spread = Math.max(6 * resScale, size * 0.92 * scatter);
    const stepSize = Math.max(2.8 * resScale, spread * Math.max(0.24, spacing));
    const steps = Math.max(1, Math.min(24, Math.ceil(dist / stepSize)));
    const pores = Math.max(8, Math.min(42, Math.round((10 + brush.size * 0.46) * density)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      const skinGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread);
      skinGrad.addColorStop(0, rgba(r, g, b, alpha * (0.07 + softNorm * 0.04)));
      skinGrad.addColorStop(0.65, rgba(r, g, b, alpha * 0.03));
      skinGrad.addColorStop(1, rgba(r, g, b, 0));
      ctx.fillStyle = skinGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, spread, 0, Math.PI * 2);
      ctx.fill();

      for (let k = 0; k < pores; k++) {
        const ang = rand() * Math.PI * 2;
        const rad = Math.pow(rand(), 0.65) * spread * 0.9;
        const px = cx + Math.cos(ang) * rad;
        const py = cy + Math.sin(ang) * rad;
        const fade = 1 - (rad / spread) * 0.65;

        if (subMode === 1) {
          // Fine dermal micro-lines (knuckles, eyelids, lip creases)
          const lAng = baseAng + (rand() - 0.5) * (0.6 + curl);
          const lLen = Math.max(2 * resScale, spread * 0.22 * scale);
          ctx.strokeStyle = rgba(dr, dg, db, alpha * fade * 0.26);
          ctx.lineWidth = Math.max(0.45 * resScale, 0.55 * resScale);
          ctx.beginPath();
          ctx.moveTo(px - Math.cos(lAng) * lLen * 0.5, py - Math.sin(lAng) * lLen * 0.5);
          ctx.lineTo(px + Math.cos(lAng) * lLen * 0.5, py + Math.sin(lAng) * lLen * 0.5);
          ctx.stroke();
        } else if (subMode === 2) {
          // Freckles / beauty spots / organic mottling
          const fr = Math.max(0.7 * resScale, (0.7 + rand() * 1.45) * resScale * scale);
          const [mr, mg, mb] = shiftColor(r, g, b, -cAmt * (0.55 + rand() * 0.45));
          ctx.fillStyle = rgba(mr, mg, mb, alpha * fade * (0.28 + rand() * 0.25));
          ctx.beginPath();
          ctx.ellipse(px, py, fr, fr * (0.7 + rand() * 0.35), rand() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Classic hyperreal micro-pores + specular dermal rim light
          const pr = Math.max(0.45 * resScale, (0.42 + rand() * 0.68) * resScale * scale);
          ctx.fillStyle = rgba(dr, dg, db, alpha * fade * (0.22 + cAmt * 0.2));
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();

          if (rand() < 0.45 + sheen * 0.4) {
            ctx.fillStyle = rgba(lr, lg, lb, alpha * fade * (0.18 + sheen * 0.25));
            ctx.beginPath();
            ctx.arc(px - pr * 0.85, py - pr * 0.85, pr * 0.72, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    return;
  }

  // =========================================================================
  // 4. SAND (Arena, minerales, tierra, grava, polvo, sal, nieve, punteado)
  // =========================================================================
  if (engine === 'sand') {
    const spread = Math.max(5 * resScale, size * 0.9 * scatter);
    const stepSize = Math.max(2.2 * resScale, spread * Math.max(0.22, spacing));
    const steps = Math.max(1, Math.min(26, Math.ceil(dist / stepSize)));
    const grains = Math.max(12, Math.min(68, Math.round((16 + brush.size * 0.85) * density)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      if (subMode !== 3) {
        const bed = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread);
        bed.addColorStop(0, rgba(r, g, b, alpha * (0.055 + softNorm * 0.03)));
        bed.addColorStop(1, rgba(r, g, b, 0));
        ctx.fillStyle = bed;
        ctx.beginPath();
        ctx.arc(cx, cy, spread, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let k = 0; k < grains; k++) {
        const ang = rand() * Math.PI * 2;
        const rad = Math.pow(rand(), 0.62) * spread;
        const gx = cx + Math.cos(ang) * rad;
        const gy = cy + Math.sin(ang) * rad;
        const edgeFade = 1 - (rad / spread) * (0.42 + softNorm * 0.42);

        const roll = rand();
        const glintCut = 1 - Math.min(0.45, 0.12 + sheen * 0.32);
        const [gr, gg, gb] =
          roll < 0.25
            ? shiftColor(r, g, b, -cAmt * (0.75 + rand() * 0.45))
            : roll > glintCut
              ? shiftColor(r, g, b, 0.35 + sheen * 0.45)
              : shiftColor(r, g, b, (rand() - 0.5) * cAmt * 0.7);

        const baseGrain = subMode === 1 ? 1.55 : subMode === 3 ? 0.62 : 1.0;
        const grainR = Math.max(
          0.45 * resScale,
          (0.48 + rand() * 1.15) * resScale * scale * baseGrain
        );
        ctx.fillStyle = rgba(gr, gg, gb, alpha * edgeFade * (0.52 + rand() * 0.44));
        ctx.beginPath();
        ctx.ellipse(
          gx,
          gy,
          grainR,
          grainR * (0.58 + rand() * 0.44),
          rand() * Math.PI,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    return;
  }

  // =========================================================================
  // 5. ROCK (Roca, mármol, granito, corteza, grietas, mosaico, cristal)
  // =========================================================================
  if (engine === 'rock') {
    const spread = Math.max(6 * resScale, size * 0.85 * scatter);
    const stepSize = Math.max(3.0 * resScale, spread * Math.max(0.28, spacing));
    const steps = Math.max(1, Math.min(20, Math.ceil(dist / stepSize)));
    const facets = Math.max(3, Math.min(10, Math.round(5 * density)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      for (let f = 0; f < facets; f++) {
        const ang = rand() * Math.PI * 2;
        const rad = rand() * spread * 0.72;
        const fx = cx + Math.cos(ang) * rad;
        const fy = cy + Math.sin(ang) * rad;
        const fr = spread * (0.14 + rand() * 0.22) * scale;
        const sides = subMode === 3 ? 4 : 4 + Math.floor(rand() * 3);
        const toneShift = (rand() - 0.5) * cAmt * 1.35;
        const [frC, fgC, fbC] = shiftColor(r, g, b, toneShift);

        ctx.fillStyle = rgba(frC, fgC, fbC, alpha * (0.28 + rand() * 0.34));
        ctx.beginPath();
        const rot0 = subMode === 3 ? baseAng : rand() * Math.PI;
        for (let v = 0; v < sides; v++) {
          const va = rot0 + (v / sides) * Math.PI * 2 + (subMode === 3 ? 0 : rand() * 0.4);
          const vr = fr * (subMode === 3 ? 0.88 : 0.58 + rand() * 0.5);
          const vx = fx + Math.cos(va) * vr;
          const vy = fy + Math.sin(va) * vr;
          if (v === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Mineral fissure / marble vein + illuminated ridge
      const crAng = baseAng + (rand() - 0.5) * (0.65 + curl * 0.7);
      const crLen = spread * (0.45 + rand() * 0.55) * scale;
      const sx = cx + (rand() - 0.5) * spread * 0.55;
      const sy = cy + (rand() - 0.5) * spread * 0.55;
      const midX = sx + Math.cos(crAng) * crLen * 0.5 + (rand() - 0.5) * 3 * resScale;
      const midY = sy + Math.sin(crAng) * crLen * 0.5 + (rand() - 0.5) * 3 * resScale;
      ctx.strokeStyle = rgba(dr, dg, db, alpha * (0.4 + cAmt * 0.3));
      ctx.lineWidth = Math.max(0.6 * resScale, 0.85 * resScale);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(midX, midY);
      ctx.lineTo(sx + Math.cos(crAng) * crLen, sy + Math.sin(crAng) * crLen);
      ctx.stroke();

      if (sheen > 0.08) {
        ctx.strokeStyle = rgba(lr, lg, lb, alpha * (0.24 + sheen * 0.38));
        ctx.beginPath();
        ctx.moveTo(sx - resScale, sy - resScale);
        ctx.lineTo(midX - resScale, midY - resScale);
        ctx.stroke();
      }
    }
    return;
  }

  // =========================================================================
  // 6. BOTANICAL (Hierba, musgo, hojas, helechos, pétalos, flores, ramas)
  // =========================================================================
  if (engine === 'botanical') {
    const spread = Math.max(5 * resScale, size * 0.82 * scatter);
    const elemLen = Math.max(7 * resScale, size * 1.1 * scale);
    const stepSize = Math.max(2.6 * resScale, size * Math.max(0.2, spacing));
    const steps = Math.max(1, Math.min(22, Math.ceil(dist / stepSize)));
    const count = Math.max(4, Math.min(16, Math.round((4 + brush.size * 0.2) * density)));

    ctx.lineCap = 'round';
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      for (let k = 0; k < count; k++) {
        const bx = cx + (rand() - 0.5) * spread * 1.45;
        const by = cy + (rand() - 0.5) * spread * 0.85;
        const [tr, tg, tb] = shiftColor(r, g, b, (rand() - 0.38) * cAmt * 1.1);

        if (subMode === 1 || subMode === 2) {
          // Pointed botanical leaf / petal stamp
          const ang =
            subMode === 2
              ? rand() * Math.PI * 2
              : baseAng + (rand() > 0.5 ? 1 : -1) * (0.45 + rand() * 0.55);
          const len = elemLen * (0.38 + rand() * 0.45);
          const wid = len * (subMode === 2 ? 0.52 : 0.34);
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(ang);
          ctx.fillStyle = rgba(tr, tg, tb, alpha * (0.64 + rand() * 0.28));
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(len * 0.48, -wid, len, 0);
          ctx.quadraticCurveTo(len * 0.48, wid, 0, 0);
          ctx.fill();
          // Central leaf vein highlight
          ctx.strokeStyle = rgba(lr, lg, lb, alpha * 0.42);
          ctx.lineWidth = Math.max(0.45 * resScale, len * 0.05);
          ctx.beginPath();
          ctx.moveTo(len * 0.1, 0);
          ctx.lineTo(len * 0.82, 0);
          ctx.stroke();
          ctx.restore();
        } else {
          // Curved shaded grass blades & moss shoots
          const ang = -Math.PI / 2 + (rand() - 0.5) * (0.85 + curl * 0.75);
          const len = elemLen * (0.45 + rand() * 0.72);
          const curve = (rand() - 0.5) * len * (0.35 + curl * 0.3);
          const mx = bx + Math.cos(ang) * len * 0.5 + curve;
          const my = by + Math.sin(ang) * len * 0.5;
          const ex = bx + Math.cos(ang) * len + curve * 1.25;
          const ey = by + Math.sin(ang) * len;

          const grad = ctx.createLinearGradient(bx, by, ex, ey);
          grad.addColorStop(0, rgba(dr, dg, db, alpha * 0.8));
          grad.addColorStop(0.55, rgba(tr, tg, tb, alpha * 0.85));
          grad.addColorStop(1, rgba(lr, lg, lb, alpha * 0.65));

          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(0.7 * resScale, (0.85 + rand() * 0.85) * resScale);
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(mx, my, ex, ey);
          ctx.stroke();
        }
      }
    }
    return;
  }

  // =========================================================================
  // 7. FEATHER (Plumas, bárbulas simétricas, plumón suave, alas)
  // =========================================================================
  if (engine === 'feather') {
    const barbLen = Math.max(5 * resScale, size * 0.84 * scale);
    const stepSize = Math.max(1.6 * resScale, size * Math.max(0.14, spacing));
    const steps = Math.max(1, Math.min(34, Math.ceil(dist / stepSize)));

    ctx.lineCap = 'round';
    if (subMode !== 2) {
      ctx.strokeStyle = rgba(lr, lg, lb, alpha * (0.58 + sheen * 0.25));
      ctx.lineWidth = Math.max(0.75 * resScale, size * 0.075);
      ctx.beginPath();
      ctx.moveTo(prevMid.x, prevMid.y);
      ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
      ctx.stroke();
    }

    const fanSpread = subMode === 2 ? 1.1 : 0.58 + curl * 0.28;
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      const repeats = density > 1.3 ? 2 : 1;
      for (let rep = 0; rep < repeats; rep++) {
        for (const side of [-1, 1] as const) {
          const bAng = baseAng + side * (fanSpread + (rand() - 0.5) * (0.2 + curl * 0.25));
          const len = barbLen * (0.62 + rand() * 0.45);
          const bend = side * len * curl * 0.22;
          const mx = cx + Math.cos(bAng) * len * 0.5 - Math.sin(bAng) * bend;
          const my = cy + Math.sin(bAng) * len * 0.5 + Math.cos(bAng) * bend;
          const ex = cx + Math.cos(bAng) * len;
          const ey = cy + Math.sin(bAng) * len;
          const [br, bg, bb] =
            rand() > 1 - (0.22 + sheen * 0.35)
              ? shiftColor(r, g, b, 0.25 + sheen * 0.3)
              : shiftColor(r, g, b, (rand() - 0.5) * cAmt);

          ctx.strokeStyle = rgba(br, bg, bb, alpha * (0.4 + rand() * 0.36));
          ctx.lineWidth = Math.max(0.5 * resScale, size * (subMode === 2 ? 0.036 : 0.048));
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.quadraticCurveTo(mx, my, ex, ey);
          ctx.stroke();
        }
      }
    }
    return;
  }

  // =========================================================================
  // 8. SCALES (NEW! Escamas 3D de dragón, serpiente, pez, sirena, art deco)
  // =========================================================================
  if (engine === 'scales') {
    const scaleR = Math.max(3.2 * resScale, size * 0.32 * scale);
    const stepSize = Math.max(scaleR * 0.9, size * Math.max(0.28, spacing));
    const steps = Math.max(1, Math.min(22, Math.ceil(dist / stepSize)));
    const rows = Math.max(1, Math.min(4, Math.round(1.5 + scatter * 1.4)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;
      const stagger = (s & 1) * scaleR * 0.65;

      for (let row = -Math.floor(rows / 2); row <= Math.floor(rows / 2); row++) {
        const sx = cx + nx * (row * scaleR * 1.35 + stagger * 0.5);
        const sy = cy + ny * (row * scaleR * 1.35 + stagger * 0.5);
        const [sr, sg, sb] = shiftColor(r, g, b, (rand() - 0.5) * cAmt * 0.6);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(baseAng);

        // Shaded 3D scale body
        const grad = ctx.createRadialGradient(-scaleR * 0.25, -scaleR * 0.25, scaleR * 0.1, 0, 0, scaleR * 1.1);
        grad.addColorStop(0, rgba(lr, lg, lb, alpha * (0.72 + sheen * 0.22)));
        grad.addColorStop(0.58, rgba(sr, sg, sb, alpha * 0.82));
        grad.addColorStop(1, rgba(dr, dg, db, alpha * 0.88));
        ctx.fillStyle = grad;

        ctx.beginPath();
        if (subMode === 2) {
          // Pointed diamond dragon/reptile scale
          ctx.moveTo(-scaleR * 0.8, 0);
          ctx.lineTo(0, -scaleR * 0.68);
          ctx.lineTo(scaleR * 1.05, 0);
          ctx.lineTo(0, scaleR * 0.68);
          ctx.closePath();
        } else {
          // Overlapping rounded fish / mermaid / art-deco scallop
          ctx.arc(0, 0, scaleR * 0.78, -Math.PI * 0.65, Math.PI * 0.65);
          ctx.quadraticCurveTo(-scaleR * 0.5, 0, -scaleR * 0.35, -scaleR * 0.68);
          ctx.closePath();
        }
        ctx.fill();

        // Crisp dark overlapping shadow rim + luminous iridescent edge
        ctx.strokeStyle = rgba(dr, dg, db, alpha * 0.65);
        ctx.lineWidth = Math.max(0.55 * resScale, scaleR * 0.12);
        ctx.stroke();

        if (sheen > 0.18) {
          ctx.strokeStyle = rgba(255, 252, 240, alpha * sheen * 0.65);
          ctx.lineWidth = Math.max(0.45 * resScale, scaleR * 0.08);
          ctx.beginPath();
          ctx.arc(0, 0, scaleR * 0.54, -0.7, 0.7);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    return;
  }

  // =========================================================================
  // 9. FABRIC (Telas, lino, crochet, pana, seda, encaje, punto, terciopelo)
  // =========================================================================
  if (engine === 'fabric') {
    const spread = Math.max(6 * resScale, size * 0.88 * scatter);
    const pitch = Math.max(2.2 * resScale, 3.1 * resScale * scale);
    const stepSize = Math.max(2.8 * resScale, spread * Math.max(0.28, spacing));
    const steps = Math.max(1, Math.min(20, Math.ceil(dist / stepSize)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread);
      bg.addColorStop(0, rgba(r, g, b, alpha * (0.08 + softNorm * 0.05)));
      bg.addColorStop(1, rgba(r, g, b, 0));
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(cx, cy, spread, 0, Math.PI * 2);
      ctx.fill();

      const minX = Math.floor((cx - spread) / pitch) * pitch;
      const maxX = Math.ceil((cx + spread) / pitch) * pitch;
      const minY = Math.floor((cy - spread) / pitch) * pitch;
      const maxY = Math.ceil((cy + spread) / pitch) * pitch;
      const threadW = Math.max(0.65 * resScale, pitch * (subMode === 2 ? 0.44 : 0.33));

      for (let gx = minX; gx <= maxX; gx += pitch) {
        for (let gy = minY; gy <= maxY; gy += pitch) {
          const d = Math.hypot(gx - cx, gy - cy);
          if (d >= spread) continue;
          const fade = Math.pow(1 - d / spread, 1.12);
          const ix = Math.round(gx / pitch);
          const iy = Math.round(gy / pitch);

          if (subMode === 1) {
            // Diagonal twill / denim weave
            const twill = (ix + iy) % 3 === 0;
            ctx.fillStyle = twill
              ? rgba(lr, lg, lb, alpha * fade * 0.42)
              : rgba(dr, dg, db, alpha * fade * 0.28);
            ctx.fillRect(gx - threadW * 0.6, gy - threadW * 0.6, pitch * 0.72, threadW);
          } else if (subMode === 3) {
            // Delicate knitted V-stitch / lace loop pattern
            ctx.strokeStyle = rgba(lr, lg, lb, alpha * fade * 0.44);
            ctx.lineWidth = Math.max(0.55 * resScale, threadW * 0.62);
            ctx.beginPath();
            ctx.moveTo(gx - pitch * 0.35, gy - pitch * 0.25);
            ctx.lineTo(gx, gy + pitch * 0.3);
            ctx.lineTo(gx + pitch * 0.35, gy - pitch * 0.25);
            ctx.stroke();
          } else {
            // Classic orthogonal linen / canvas warp & weft
            const parity = (ix + iy) & 1;
            if (parity === 0) {
              ctx.fillStyle = rgba(lr, lg, lb, alpha * fade * (0.34 + sheen * 0.14));
              ctx.fillRect(gx - pitch * 0.45, gy - threadW * 0.5, pitch * 0.9, threadW);
              ctx.fillStyle = rgba(dr, dg, db, alpha * fade * 0.18);
              ctx.fillRect(gx - pitch * 0.45, gy + threadW * 0.4, pitch * 0.9, threadW * 0.45);
            } else {
              ctx.fillStyle = rgba(r, g, b, alpha * fade * 0.38);
              ctx.fillRect(gx - threadW * 0.5, gy - pitch * 0.45, threadW, pitch * 0.9);
              ctx.fillStyle = rgba(dr, dg, db, alpha * fade * 0.16);
              ctx.fillRect(gx + threadW * 0.4, gy - pitch * 0.45, threadW * 0.45, pitch * 0.9);
            }
          }
        }
      }
    }
    return;
  }

  // =========================================================================
  // 10. WATER (Agua, gotas de rocío, espuma, cáusticas, ondas, hielo)
  // =========================================================================
  if (engine === 'water') {
    const spread = Math.max(6 * resScale, size * 0.9 * scatter);
    const stepSize = Math.max(3.2 * resScale, spread * Math.max(0.28, spacing));
    const steps = Math.max(1, Math.min(20, Math.ceil(dist / stepSize)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, spread);
      wash.addColorStop(0, rgba(r, g, b, alpha * 0.12));
      wash.addColorStop(0.7, rgba(lr, lg, lb, alpha * 0.05));
      wash.addColorStop(1, rgba(r, g, b, 0));
      ctx.fillStyle = wash;
      ctx.beginPath();
      ctx.arc(cx, cy, spread, 0, Math.PI * 2);
      ctx.fill();

      if (subMode === 2) {
        // Luminous water ripples / caustic rings
        const ringR = spread * (0.4 + rand() * 0.45) * scale;
        ctx.strokeStyle = rgba(255, 255, 255, alpha * (0.28 + sheen * 0.35));
        ctx.lineWidth = Math.max(0.6 * resScale, 1.0 * resScale);
        ctx.beginPath();
        ctx.ellipse(cx, cy, ringR, ringR * 0.46, baseAng, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const drops = Math.max(1, Math.min(5, Math.round((1.8 + rand() * 1.6) * density)));
        for (let dIdx = 0; dIdx < drops; dIdx++) {
          if (rand() > 0.72) continue;
          const ang = rand() * Math.PI * 2;
          const rad = rand() * spread * 0.78;
          const dxp = cx + Math.cos(ang) * rad;
          const dyp = cy + Math.sin(ang) * rad;
          const dropR = Math.max(1.2 * resScale, spread * (0.08 + rand() * 0.13) * scale);

          ctx.fillStyle = rgba(dr, dg, db, alpha * 0.28);
          ctx.beginPath();
          ctx.arc(dxp + dropR * 0.24, dyp + dropR * 0.28, dropR * 1.02, 0, Math.PI * 2);
          ctx.fill();

          const dome = ctx.createRadialGradient(
            dxp - dropR * 0.3,
            dyp - dropR * 0.3,
            dropR * 0.08,
            dxp,
            dyp,
            dropR
          );
          dome.addColorStop(0, rgba(255, 255, 255, alpha * (0.45 + sheen * 0.35)));
          dome.addColorStop(0.55, rgba(r, g, b, alpha * 0.26));
          dome.addColorStop(0.92, rgba(lr, lg, lb, alpha * 0.46));
          dome.addColorStop(1, rgba(dr, dg, db, alpha * 0.22));
          ctx.fillStyle = dome;
          ctx.beginPath();
          ctx.arc(dxp, dyp, dropR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = rgba(255, 255, 255, alpha * 0.9);
          ctx.beginPath();
          ctx.arc(
            dxp - dropR * 0.32,
            dyp - dropR * 0.34,
            Math.max(0.45 * resScale, dropR * 0.26),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
    return;
  }

  // =========================================================================
  // 11. OIL (Óleo empastado, cerdas físicas, espátula, gouache, acrílico)
  // =========================================================================
  if (engine === 'oil') {
    const brushHalfW = Math.max(3.5 * resScale, size * 0.56 * scatter);
    ctx.lineCap = subMode === 2 ? 'butt' : 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = rgba(r, g, b, alpha * (subMode === 1 ? 0.22 : 0.44));
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

    const bristleCount = Math.max(6, Math.min(state.bristleOffsets.length, Math.round(14 * density)));
    for (let i = 0; i < bristleCount; i++) {
      const idx = Math.floor((i / bristleCount) * state.bristleOffsets.length);
      // Drybrush skips random bristles
      if (subMode === 1 && rand() > 0.62) continue;
      const off = state.bristleOffsets[idx] * brushHalfW;
      const shade = state.bristleShades[idx] * (cAmt / 0.34);
      const [br, bg, bb] = shiftColor(r, g, b, shade * 0.95);
      const bw = Math.max(0.7 * resScale, (brushHalfW / bristleCount) * 2.15 * Math.sqrt(scale));

      ctx.strokeStyle = rgba(br, bg, bb, alpha * (0.54 + Math.abs(shade) * 0.42));
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

    // Palette knife / thick impasto top highlight edge
    if (subMode === 2 || sheen > 0.35) {
      const edgeOff = -brushHalfW * 0.78;
      ctx.strokeStyle = rgba(lr, lg, lb, alpha * (0.36 + sheen * 0.34));
      ctx.lineWidth = Math.max(0.8 * resScale, brushHalfW * 0.16);
      ctx.beginPath();
      ctx.moveTo(prevMid.x + nx * edgeOff, prevMid.y + ny * edgeOff);
      ctx.lineTo(mid.x + nx * edgeOff, mid.y + ny * edgeOff);
      ctx.stroke();
    }
    return;
  }

  // =========================================================================
  // 12. WATERCOLOR (NEW! Acuarela húmeda con borde capilar, veladura, tinta)
  // =========================================================================
  if (engine === 'watercolor') {
    const spread = Math.max(6 * resScale, size * 0.9 * scatter);
    const stepSize = Math.max(3.0 * resScale, spread * Math.max(0.24, spacing));
    const steps = Math.max(1, Math.min(22, Math.ceil(dist / stepSize)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;
      const blobR = spread * (0.72 + rand() * 0.36) * scale;

      // Translucent wet wash center with authentic darkened capillary bloom rim!
      const wash = ctx.createRadialGradient(cx, cy, blobR * 0.15, cx, cy, blobR);
      wash.addColorStop(0, rgba(r, g, b, alpha * 0.08));
      wash.addColorStop(0.68, rgba(r, g, b, alpha * 0.11));
      wash.addColorStop(0.9, rgba(dr, dg, db, alpha * (0.17 + cAmt * 0.16)));
      wash.addColorStop(1, rgba(dr, dg, db, 0));
      ctx.fillStyle = wash;
      ctx.beginPath();
      ctx.ellipse(
        cx + (rand() - 0.5) * spread * 0.2,
        cy + (rand() - 0.5) * spread * 0.2,
        blobR,
        blobR * (0.76 + rand() * 0.28),
        rand() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Pigment granulation specks settling into paper valleys
      if (subMode === 1 || subMode === 2) {
        const specks = Math.max(4, Math.round(7 * density));
        for (let k = 0; k < specks; k++) {
          const ang = rand() * Math.PI * 2;
          const rad = Math.pow(rand(), 0.45) * blobR * 0.92;
          const gx = cx + Math.cos(ang) * rad;
          const gy = cy + Math.sin(ang) * rad;
          ctx.fillStyle = rgba(dr, dg, db, alpha * 0.16);
          ctx.beginPath();
          ctx.arc(gx, gy, Math.max(0.55 * resScale, 1.1 * resScale), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    return;
  }

  // =========================================================================
  // 13. GRAPHITE (Grafito hiperreal, carbón, sanguina, achurado, grabado)
  // =========================================================================
  if (engine === 'graphite') {
    const coreW = Math.max(
      0.75 * resScale,
      size * 0.22 * scale * Math.max(0.65, Math.min(1.12, 1.08 - velocity * 0.16))
    );
    const stepSize = Math.max(1.0 * resScale, coreW * Math.max(0.35, spacing * 1.6));
    const steps = Math.max(1, Math.min(44, Math.ceil(dist / stepSize)));

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (subMode === 3) {
      // Fine cross-hatching / copperplate engraving strokes!
      const hatchLen = Math.max(4 * resScale, size * 0.72 * scale);
      const hSteps = Math.max(1, Math.min(24, Math.ceil(dist / Math.max(2.2 * resScale, size * 0.22))));
      const hAng = baseAng + Math.PI * 0.34;
      ctx.strokeStyle = rgba(r, g, b, alpha * 0.72);
      ctx.lineWidth = Math.max(0.55 * resScale, coreW * 0.45);
      for (let s = 0; s <= hSteps; s++) {
        const t = hSteps === 0 ? 1 : s / hSteps;
        const cx = p1.x + dx * t;
        const cy = p1.y + dy * t;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(hAng) * hatchLen * 0.5, cy - Math.sin(hAng) * hatchLen * 0.5);
        ctx.lineTo(cx + Math.cos(hAng) * hatchLen * 0.5, cy + Math.sin(hAng) * hatchLen * 0.5);
        ctx.stroke();
      }
      return;
    }

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

    const grainSpread = coreW * (1.05 + softNorm * 0.9) * scatter;
    const grainCount = Math.max(3, Math.round(5 * density));
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;
      for (let k = 0; k < grainCount; k++) {
        const gx = cx + (rand() - 0.5) * grainSpread * 2;
        const gy = cy + (rand() - 0.5) * grainSpread * 2;
        const tooth = Math.sin(gx * 0.78) * Math.cos(gy * 0.83);
        if (tooth < -0.15) continue;
        const gr = Math.max(0.45 * resScale, coreW * (0.14 + rand() * 0.16));
        ctx.fillStyle = rgba(r, g, b, alpha * (0.26 + tooth * 0.34));
        ctx.fillRect(gx, gy, gr, gr);
      }
    }
    return;
  }

  // =========================================================================
  // 14. WOODMETAL (NEW! Vetas de madera noble OR metal cepillado / oro / bronce)
  // =========================================================================
  if (engine === 'woodmetal') {
    const halfW = Math.max(4 * resScale, size * 0.58 * scatter);
    const lines = Math.max(7, Math.min(18, Math.round(10 * density)));
    ctx.lineCap = 'round';

    const isMetal = subMode >= 2 || sheen > 0.48;
    // Base continuous wood/metal ribbon
    const bandGrad = ctx.createLinearGradient(
      mid.x - nx * halfW,
      mid.y - ny * halfW,
      mid.x + nx * halfW,
      mid.y + ny * halfW
    );
    if (isMetal) {
      bandGrad.addColorStop(0, rgba(dr, dg, db, alpha * 0.78));
      bandGrad.addColorStop(0.28, rgba(lr, lg, lb, alpha * 0.92));
      bandGrad.addColorStop(0.46, rgba(255, 250, 236, alpha * Math.min(0.95, 0.5 + sheen * 0.48)));
      bandGrad.addColorStop(0.68, rgba(r, g, b, alpha * 0.85));
      bandGrad.addColorStop(1, rgba(dr, dg, db, alpha * 0.82));
    } else {
      bandGrad.addColorStop(0, rgba(dr, dg, db, alpha * 0.42));
      bandGrad.addColorStop(0.5, rgba(r, g, b, alpha * 0.48));
      bandGrad.addColorStop(1, rgba(dr, dg, db, alpha * 0.42));
    }
    ctx.strokeStyle = bandGrad;
    ctx.lineWidth = halfW * 1.95;
    ctx.beginPath();
    if (dist < 0.4) {
      ctx.arc(p1.x, p1.y, halfW * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = bandGrad;
      ctx.fill();
    } else {
      ctx.moveTo(prevMid.x, prevMid.y);
      ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y);
      ctx.stroke();
    }

    // Parallel wood-grain fibers or fine brushed-metal micro-scratches
    state.distAccum += dist;
    for (let i = 0; i < lines; i++) {
      const f = i / (lines - 1) - 0.5;
      const grainWave = isMetal
        ? 0
        : Math.sin(state.distAccum * 0.045 + i * 0.9) * halfW * 0.16 * curl;
      const off = f * halfW * 1.85 + grainWave;
      const isDarkFiber = i % 2 === 0;
      const [gr, gg, gb] = isDarkFiber ? [dr, dg, db] : [lr, lg, lb];
      ctx.strokeStyle = rgba(
        gr,
        gg,
        gb,
        alpha * (isMetal ? (isDarkFiber ? 0.25 : 0.42) : isDarkFiber ? 0.46 : 0.26)
      );
      ctx.lineWidth = Math.max(0.5 * resScale, (halfW / lines) * (isMetal ? 0.55 : 0.85));
      ctx.beginPath();
      ctx.moveTo(prevMid.x + nx * off, prevMid.y + ny * off);
      ctx.quadraticCurveTo(p1.x + nx * off, p1.y + ny * off, mid.x + nx * off, mid.y + ny * off);
      ctx.stroke();
    }
    return;
  }

  // =========================================================================
  // 15. CLOUD (NEW! Nubes volumétricas, humo, neblina, llamas suaves, galaxia)
  // =========================================================================
  if (engine === 'cloud') {
    const spread = Math.max(7 * resScale, size * 0.98 * scatter);
    const stepSize = Math.max(3.5 * resScale, spread * Math.max(0.24, spacing));
    const steps = Math.max(1, Math.min(20, Math.ceil(dist / stepSize)));
    const puffs = Math.max(2, Math.min(6, Math.round(2.5 * density)));

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      for (let p = 0; p < puffs; p++) {
        const ox = (rand() - 0.5) * spread * 1.1;
        const oy = (rand() - 0.5) * spread * 0.85;
        const pr = spread * (0.42 + rand() * 0.45) * scale;
        const px = cx + ox;
        const py = cy + oy;

        // Top-lit volumetric puff (bright crest + soft shadowed belly)
        const grad = ctx.createRadialGradient(
          px - pr * 0.22,
          py - pr * 0.28,
          pr * 0.08,
          px,
          py,
          pr
        );
        const puffA = alpha * (0.14 + (1 - softNorm) * 0.12);
        grad.addColorStop(0, rgba(lr, lg, lb, puffA * 1.15));
        grad.addColorStop(0.52, rgba(r, g, b, puffA * 0.72));
        grad.addColorStop(0.84, rgba(dr, dg, db, puffA * 0.25));
        grad.addColorStop(1, rgba(r, g, b, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }

  // =========================================================================
  // 16. SPARKLE (Destellos, estrellas, bokeh óptico, purpurina, polvo mágico)
  // =========================================================================
  if (engine === 'sparkle') {
    const spread = Math.max(5 * resScale, size * 0.92 * scatter);
    const stepSize = Math.max(4.5 * resScale, spread * Math.max(0.32, spacing));
    const steps = Math.max(1, Math.min(18, Math.ceil(dist / stepSize)));
    const [sr, sg, sb] = shiftColor(r, g, b, 0.55);

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 1 : s / steps;
      const cx = p1.x + dx * t;
      const cy = p1.y + dy * t;

      const count = Math.max(2, Math.min(8, Math.round((2.5 + rand() * 2.5) * density)));
      for (let k = 0; k < count; k++) {
        const ang = rand() * Math.PI * 2;
        const rad = Math.pow(rand(), 0.72) * spread;
        const sx = cx + Math.cos(ang) * rad;
        const sy = cy + Math.sin(ang) * rad;
        const starR = Math.max(0.75 * resScale, spread * (0.05 + rand() * 0.11) * scale);

        if (subMode === 2) {
          // Soft translucent optical bokeh lens discs
          const bokehR = starR * 2.6;
          ctx.fillStyle = rgba(sr, sg, sb, alpha * 0.22);
          ctx.strokeStyle = rgba(255, 255, 255, alpha * 0.48);
          ctx.lineWidth = Math.max(0.55 * resScale, bokehR * 0.12);
          ctx.beginPath();
          ctx.arc(sx, sy, bokehR, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, starR * 2.8);
          halo.addColorStop(0, rgba(255, 255, 255, alpha * 0.9));
          halo.addColorStop(0.35, rgba(sr, sg, sb, alpha * 0.46));
          halo.addColorStop(1, rgba(r, g, b, 0));
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(sx, sy, starR * 2.8, 0, Math.PI * 2);
          ctx.fill();

          if (rand() > 0.45 - sheen * 0.25) {
            const rayLen = starR * (3.2 + sheen * 1.4);
            ctx.strokeStyle = rgba(255, 255, 255, alpha * 0.82);
            ctx.lineWidth = Math.max(0.5 * resScale, starR * 0.42);
            ctx.beginPath();
            ctx.moveTo(sx - rayLen, sy);
            ctx.lineTo(sx + rayLen, sy);
            ctx.moveTo(sx, sy - rayLen);
            ctx.lineTo(sx, sy + rayLen);
            ctx.stroke();
          }
        }
      }
    }
    return;
  }

  // =========================================================================
  // 17. ORNAMENT (NEW! Perlas 3D, lentejuelas, cadena crochet, costuras, espiga)
  // =========================================================================
  const elemR = Math.max(2.2 * resScale, size * 0.28 * scale);
  const stepSize = Math.max(elemR * 1.65, size * Math.max(0.32, spacing));
  const steps = Math.max(1, Math.min(26, Math.ceil(dist / stepSize)));

  ctx.lineCap = 'round';
  for (let s = 0; s <= steps; s++) {
    const t = steps === 0 ? 1 : s / steps;
    const cx = p1.x + dx * t;
    const cy = p1.y + dy * t;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(baseAng);

    if (subMode === 2) {
      // 3D shaded pearls / beads / sequins with luminous specular catchlight!
      ctx.fillStyle = rgba(dr, dg, db, alpha * 0.34);
      ctx.beginPath();
      ctx.arc(elemR * 0.18, elemR * 0.22, elemR * 0.96, 0, Math.PI * 2);
      ctx.fill();

      const pearl = ctx.createRadialGradient(
        -elemR * 0.32,
        -elemR * 0.32,
        elemR * 0.08,
        0,
        0,
        elemR
      );
      pearl.addColorStop(0, rgba(255, 255, 255, alpha * 0.95));
      pearl.addColorStop(0.38, rgba(lr, lg, lb, alpha * 0.9));
      pearl.addColorStop(0.82, rgba(r, g, b, alpha * 0.88));
      pearl.addColorStop(1, rgba(dr, dg, db, alpha * 0.9));
      ctx.fillStyle = pearl;
      ctx.beginPath();
      ctx.arc(0, 0, elemR, 0, Math.PI * 2);
      ctx.fill();
    } else if (subMode === 1) {
      // Braided crochet chain / herringbone stitch link
      ctx.strokeStyle = rgba(r, g, b, alpha * 0.86);
      ctx.lineWidth = Math.max(0.9 * resScale, elemR * 0.42);
      ctx.beginPath();
      ctx.ellipse(0, 0, elemR * 1.15, elemR * 0.56, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = rgba(lr, lg, lb, alpha * 0.55);
      ctx.lineWidth = Math.max(0.5 * resScale, elemR * 0.18);
      ctx.beginPath();
      ctx.arc(0, -elemR * 0.08, elemR * 0.65, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      // Crisp artisanal tailoring / embroidery stitch dash
      ctx.strokeStyle = rgba(r, g, b, alpha * 0.88);
      ctx.lineWidth = Math.max(0.9 * resScale, elemR * 0.44);
      ctx.beginPath();
      ctx.moveTo(-elemR * 0.85, 0);
      ctx.lineTo(elemR * 0.85, 0);
      ctx.stroke();

      ctx.strokeStyle = rgba(lr, lg, lb, alpha * 0.42);
      ctx.lineWidth = Math.max(0.45 * resScale, elemR * 0.18);
      ctx.beginPath();
      ctx.moveTo(-elemR * 0.65, -elemR * 0.14);
      ctx.lineTo(elemR * 0.65, -elemR * 0.14);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/* ---------- Live Cached Miniature Canvas Stroke Preview (Fast LRU) ---------- */

const PREVIEW_CACHE = new Map<string, string>();
const MAX_PREVIEW_CACHE = 480;
let SHARED_PREVIEW_CANVAS: HTMLCanvasElement | null = null;

/**
 * Generates a crisp, real procedural miniature S-curve stroke preview for ANY of the
 * 2,400+ hyperrealistic texture brushes. Cached in an LRU Map for instant 60fps browsing.
 */
export function renderTexturePreviewDataUrl(
  presetId: BrushPresetId,
  colorHex: string
): string {
  const key = `${presetId}|${colorHex}`;
  const cached = PREVIEW_CACHE.get(key);
  if (cached) return cached;

  if (typeof document === 'undefined') return '';
  const params = resolveTextureParams(presetId);
  if (!params) return '';

  if (!SHARED_PREVIEW_CANVAS) {
    SHARED_PREVIEW_CANVAS = document.createElement('canvas');
    SHARED_PREVIEW_CANVAS.width = 112;
    SHARED_PREVIEW_CANVAS.height = 34;
  }
  const canvas = SHARED_PREVIEW_CANVAS;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const rand = createSeededRand(params.seed ^ 0x9e3779b9);
  const count = 18;
  const bristleOffsets: number[] = [];
  const bristleShades: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    bristleOffsets.push((t - 0.5) * 2 + (rand() - 0.5) * 0.14);
    bristleShades.push((rand() - 0.5) * 0.44);
  }
  const state: ParametricStrokeRuntime = {
    dirX: 1,
    dirY: 0,
    hasDir: false,
    distAccum: 0,
    bristleOffsets,
    bristleShades,
    rand,
  };

  const previewBrush: BrushSettings = {
    category: 'pinceles',
    preset: presetId,
    color: colorHex,
    size: 13,
    opacity: 92,
    softness: 32,
  };

  // Smooth graceful S-curve across the 112x34 swatch
  const pts: Array<{ x: number; y: number }> = [];
  const totalPts = 14;
  for (let i = 0; i < totalPts; i++) {
    const u = i / (totalPts - 1);
    const x = 11 + u * 90;
    const y = 17 + Math.sin(u * Math.PI * 2 - 0.5) * 6.2;
    pts.push({ x, y });
  }

  let prevMid = pts[0];
  for (let i = 1; i < pts.length; i++) {
    const p1 = pts[i - 1];
    const p2 = pts[i];
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const d = Math.hypot(dx, dy) || 1;
    state.dirX = dx / d;
    state.dirY = dy / d;
    state.hasDir = true;

    ctx.save();
    renderParametricTextureSegment(ctx, p1, p2, prevMid, mid, previewBrush, 0.9, 0.25, state, params);
    ctx.restore();
    prevMid = mid;
  }

  const url = canvas.toDataURL('image/png');
  if (PREVIEW_CACHE.size >= MAX_PREVIEW_CACHE) {
    const firstKey = PREVIEW_CACHE.keys().next().value;
    if (firstKey !== undefined) PREVIEW_CACHE.delete(firstKey);
  }
  PREVIEW_CACHE.set(key, url);
  return url;
}
