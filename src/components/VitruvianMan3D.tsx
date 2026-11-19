import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Camera,
  RotateCcw,
  Shirt,
  Shuffle,
  Sparkles,
  Sun,
  User,
  X,
} from 'lucide-react';
import type { DressingRoomGarment } from '../types/crochet';
import { getStylizedWeaveTile } from '../data/menswearCrochetCatalog';
import { audioEngine } from '../utils/audioEngine';

const VITRUVIAN_PHOTO_SRC = '/assets/aistudio/image_478f8047.png';
const VITRUVIAN_BACK_PHOTO_SRC = '/assets/aistudio/image_abe402a7.png';

type ViewSide = 'front' | 'back';

export type BodyPartId =
  | 'head'
  | 'chest'
  | 'abs'
  | 'armUpperL'
  | 'armLowerL'
  | 'handL'
  | 'armUpperR'
  | 'armLowerR'
  | 'handR'
  | 'thighL'
  | 'shinL'
  | 'footL'
  | 'thighR'
  | 'shinR'
  | 'footR';

type Pose2D = {
  pelvisTilt: number;
  pelvisShiftX: number;
  abs: number;
  chest: number;
  head: number;
  armUpperL: number;
  armLowerL: number;
  handL: number;
  armUpperR: number;
  armLowerR: number;
  handR: number;
  thighL: number;
  shinL: number;
  footL: number;
  thighR: number;
  shinR: number;
  footR: number;
};

type StudioEffectMode = 'dorada' | 'pasarela' | 'claroscuro' | 'clasico';

const EFFECT_META: Record<
  StudioEffectMode,
  {
    label: string;
    bgTop: string;
    bgMid: string;
    bgBot: string;
    ringGold: string;
    vignette: string;
    spotlight: string;
    filterCss: string;
    showGeometry: boolean;
  }
> = {
  dorada: {
    label: 'Luz Dorada',
    bgTop: '#fbf3e2',
    bgMid: '#f4e4c7',
    bgBot: '#e3c89c',
    ringGold: '#c99335',
    vignette: 'rgba(128, 76, 18, 0.15)',
    spotlight: 'rgba(255, 238, 190, 0.45)',
    filterCss: 'contrast(1.03) saturate(1.04) brightness(1.01)',
    showGeometry: true,
  },
  pasarela: {
    label: 'Pasarela',
    bgTop: '#fffaf0',
    bgMid: '#f2e3c8',
    bgBot: '#d9bc8e',
    ringGold: '#d8a544',
    vignette: 'rgba(92, 56, 16, 0.2)',
    spotlight: 'rgba(255, 250, 232, 0.6)',
    filterCss: 'contrast(1.07) saturate(1.04) brightness(1.03)',
    showGeometry: false,
  },
  claroscuro: {
    label: 'Claroscuro',
    bgTop: '#e7d2ae',
    bgMid: '#cfa974',
    bgBot: '#9d723d',
    ringGold: '#f0be59',
    vignette: 'rgba(42, 20, 4, 0.38)',
    spotlight: 'rgba(255, 224, 152, 0.42)',
    filterCss: 'contrast(1.12) saturate(1.07) brightness(0.97)',
    showGeometry: true,
  },
  clasico: {
    label: 'Estudio',
    bgTop: '#fcf6ea',
    bgMid: '#f6ebd7',
    bgBot: '#ead7b7',
    ringGold: '#b88228',
    vignette: 'rgba(110, 72, 24, 0.08)',
    spotlight: 'rgba(255, 252, 244, 0.3)',
    filterCss: 'none',
    showGeometry: true,
  },
};

const EFFECT_ORDER: StudioEffectMode[] = ['dorada', 'pasarela', 'claroscuro', 'clasico'];

/* ============================================================================
   20 HAND-CRAFTED, ANATOMICALLY NATURAL EDITORIAL & VITRUVIAN 2D POSES
   Calibrated specifically to image_478f8047.png's natural open Vitruvian rest stance
   so every pose preserves continuous real-human skin and tailored garment drape.
============================================================================ */

const CURATED_20_POSES: Array<{ title: string; pose: Pose2D }> = [
  {
    title: 'Vitruvio Clásico',
    pose: {
      pelvisTilt: 0, pelvisShiftX: 0, abs: 0, chest: 0, head: 0,
      armUpperL: 0, armLowerL: 0, handL: 0,
      armUpperR: 0, armLowerR: 0, handR: 0,
      thighL: 0, shinL: 0, footL: 0,
      thighR: 0, shinR: 0, footR: 0,
    },
  },
  {
    title: 'En Cruz Vitruviana',
    pose: {
      pelvisTilt: 0, pelvisShiftX: 0, abs: 0, chest: 0, head: 0,
      armUpperL: 38, armLowerL: 4, handL: -4,
      armUpperR: -38, armLowerR: -4, handR: 4,
      thighL: -4, shinL: 3, footL: 1,
      thighR: 4, shinR: -3, footR: -1,
    },
  },
  {
    title: 'Estrella de Da Vinci',
    pose: {
      pelvisTilt: 0, pelvisShiftX: 0, abs: 0, chest: 0, head: 0,
      armUpperL: 44, armLowerL: 2, handL: -4,
      armUpperR: -44, armLowerR: -2, handR: 4,
      thighL: 8, shinL: -2, footL: -2,
      thighR: -8, shinR: 2, footR: 2,
    },
  },
  {
    title: 'Sastre de Atelier',
    pose: {
      pelvisTilt: 1.5, pelvisShiftX: -5, abs: -1, chest: -1, head: 4,
      armUpperL: -30, armLowerL: -6, handL: 6,
      armUpperR: 30, armLowerR: 6, handR: -6,
      thighL: -4, shinL: 3, footL: 1,
      thighR: 4, shinR: -3, footR: -1,
    },
  },
  {
    title: 'Contrapposto Clásico',
    pose: {
      pelvisTilt: 3, pelvisShiftX: -10, abs: -2, chest: -2, head: 6,
      armUpperL: -28, armLowerL: -8, handL: 6,
      armUpperR: 20, armLowerR: 12, handR: -6,
      thighL: -3, shinL: 2, footL: 1,
      thighR: -7, shinR: 5, footR: -2,
    },
  },
  {
    title: 'Contrapposto Espejo',
    pose: {
      pelvisTilt: -3, pelvisShiftX: 10, abs: 2, chest: 2, head: -6,
      armUpperL: -20, armLowerL: -12, handL: 6,
      armUpperR: 28, armLowerR: 8, handR: -6,
      thighL: 7, shinL: -5, footL: 2,
      thighR: 3, shinR: -2, footR: -1,
    },
  },
  {
    title: 'Pasarela Milán',
    pose: {
      pelvisTilt: 2.5, pelvisShiftX: 7, abs: -1.5, chest: 2, head: -6,
      armUpperL: -30, armLowerL: -8, handL: 5,
      armUpperR: 18, armLowerR: 14, handR: -6,
      thighL: -4, shinL: 3, footL: 2,
      thighR: -7, shinR: 5, footR: -2,
    },
  },
  {
    title: 'Pasarela Florencia',
    pose: {
      pelvisTilt: -2.5, pelvisShiftX: -7, abs: 1.5, chest: -2, head: 6,
      armUpperL: -18, armLowerL: -14, handL: 6,
      armUpperR: 30, armLowerR: 8, handR: -5,
      thighL: 7, shinL: -5, footL: 2,
      thighR: 4, shinR: -3, footR: -2,
    },
  },
  {
    title: 'Apertura Noble',
    pose: {
      pelvisTilt: 0, pelvisShiftX: 0, abs: 0, chest: 0, head: -3,
      armUpperL: 18, armLowerL: 6, handL: -5,
      armUpperR: -18, armLowerR: -6, handR: 5,
      thighL: 5, shinL: -2, footL: -1,
      thighR: -5, shinR: 2, footR: 1,
    },
  },
  {
    title: 'Saludo de Galería',
    pose: {
      pelvisTilt: -2, pelvisShiftX: 6, abs: 1.5, chest: 1.5, head: -6,
      armUpperL: -28, armLowerL: -6, handL: 5,
      armUpperR: -24, armLowerR: -22, handR: 8,
      thighL: 5, shinL: -3, footL: 0,
      thighR: -3, shinR: 2, footR: 0,
    },
  },
  {
    title: 'Saludo de Atelier',
    pose: {
      pelvisTilt: 2, pelvisShiftX: -6, abs: -1.5, chest: -1.5, head: 6,
      armUpperL: 24, armLowerL: 22, handL: -8,
      armUpperR: 28, armLowerR: 6, handR: -5,
      thighL: 3, shinL: -2, footL: 0,
      thighR: -5, shinR: 3, footR: 0,
    },
  },
  {
    title: 'Desfile de Otoño',
    pose: {
      pelvisTilt: 2, pelvisShiftX: -6, abs: -1.5, chest: -1, head: -5,
      armUpperL: -32, armLowerL: -4, handL: 4,
      armUpperR: 32, armLowerR: 4, handR: -4,
      thighL: -5, shinL: 4, footL: 1,
      thighR: 5, shinR: -4, footR: -1,
    },
  },
  {
    title: 'Presentación Real',
    pose: {
      pelvisTilt: 2, pelvisShiftX: -6, abs: -1.5, chest: -1.5, head: 6,
      armUpperL: 12, armLowerL: 14, handL: -8,
      armUpperR: 22, armLowerR: 10, handR: -6,
      thighL: 3, shinL: -2, footL: 0,
      thighR: -6, shinR: 4, footR: -2,
    },
  },
  {
    title: 'Guardia Clásica',
    pose: {
      pelvisTilt: -2, pelvisShiftX: 6, abs: 1.5, chest: 1.5, head: -6,
      armUpperL: -22, armLowerL: -10, handL: 6,
      armUpperR: -12, armLowerR: -14, handR: 8,
      thighL: 6, shinL: -4, footL: 2,
      thighR: -3, shinR: 2, footR: 0,
    },
  },
  {
    title: 'Mano a Cintura Izq.',
    pose: {
      pelvisTilt: 2.5, pelvisShiftX: -8, abs: -1.5, chest: -1.5, head: -6,
      armUpperL: -8, armLowerL: -34, handL: -10,
      armUpperR: 28, armLowerR: 6, handR: -5,
      thighL: 5, shinL: -4, footL: 1,
      thighR: 2, shinR: -1, footR: 0,
    },
  },
  {
    title: 'Mano a Cintura Der.',
    pose: {
      pelvisTilt: -2.5, pelvisShiftX: 8, abs: 1.5, chest: 1.5, head: 6,
      armUpperL: -28, armLowerL: -6, handL: 5,
      armUpperR: 8, armLowerR: 34, handR: 10,
      thighL: -2, shinL: 1, footL: 0,
      thighR: -5, shinR: 4, footR: -1,
    },
  },
  {
    title: 'Postura Escultórica',
    pose: {
      pelvisTilt: -2.5, pelvisShiftX: 8, abs: 1.5, chest: 2, head: -7,
      armUpperL: -18, armLowerL: -18, handL: -4,
      armUpperR: -16, armLowerR: -10, handR: 6,
      thighL: 7, shinL: -5, footL: 2,
      thighR: -2, shinR: 1, footR: 0,
    },
  },
  {
    title: 'Equilibrio Dorado',
    pose: {
      pelvisTilt: 2.5, pelvisShiftX: -8, abs: -1.5, chest: -2, head: 7,
      armUpperL: 16, armLowerL: 10, handL: -6,
      armUpperR: 18, armLowerR: 18, handR: 4,
      thighL: 2, shinL: -1, footL: 0,
      thighR: -7, shinR: 5, footR: -2,
    },
  },
  {
    title: 'Homenaje Renacentista',
    pose: {
      pelvisTilt: 0, pelvisShiftX: 0, abs: 0, chest: 0, head: 3,
      armUpperL: 28, armLowerL: 8, handL: -6,
      armUpperR: -28, armLowerR: -8, handR: 6,
      thighL: 4, shinL: -2, footL: 0,
      thighR: -4, shinR: 2, footR: 0,
    },
  },
  {
    title: 'Cierre de Pasarela',
    pose: {
      pelvisTilt: 2, pelvisShiftX: -6, abs: -1.5, chest: 1.5, head: 5,
      armUpperL: -24, armLowerL: -14, handL: 4,
      armUpperR: 28, armLowerR: 8, handR: -5,
      thighL: -2, shinL: 2, footL: 1,
      thighR: -6, shinR: 4, footR: -2,
    },
  },
];

/* ============================================================================
   EXACT 1024x1536 PHOTOREALISTIC 2D PUPPET SLICER FOR NATIVE RGBA VITRUVIAN
   (image_478f8047.png — native alpha, zero doll ball-joints, seamless organic blends)
============================================================================ */

type SpriteRegionId = BodyPartId | 'pelvis';

interface SpritePart {
  canvas: HTMLCanvasElement;
  pivotX: number;
  pivotY: number;
  offsetX: number;
  offsetY: number;
}

interface VitruvianSpritePack {
  fullCanvas: HTMLCanvasElement;
  parts: Record<SpriteRegionId, SpritePart>;
}

const FRONT_PIVOTS: Record<SpriteRegionId, [number, number]> = {
  pelvis: [510, 710],
  abs: [510, 598],
  chest: [510, 488],
  head: [510, 224],
  armUpperL: [342, 368],
  armLowerL: [238, 476],
  handL: [148, 558],
  armUpperR: [678, 368],
  armLowerR: [782, 476],
  handR: [872, 558],
  thighL: [414, 764],
  shinL: [378, 1026],
  footL: [316, 1368],
  thighR: [606, 764],
  shinR: [634, 1026],
  footR: [691, 1368],
};

// Exact normalized 1024x1536 anatomical landmarks for image_abe402a7.png (Back view)
const BACK_PIVOTS: Record<SpriteRegionId, [number, number]> = {
  pelvis: [510, 732],
  abs: [510, 596],
  chest: [510, 492],
  head: [510, 232],
  armUpperL: [332, 376],
  armLowerL: [257, 538],
  handL: [183, 705],
  armUpperR: [688, 376],
  armLowerR: [763, 538],
  handR: [837, 705],
  thighL: [411, 822],
  shinL: [394, 1046],
  footL: [339, 1382],
  thighR: [609, 822],
  shinR: [624, 1046],
  footR: [673, 1382],
};

function isExactRestPoseData(p: Pose2D): boolean {
  return (
    p.pelvisTilt === 0 &&
    p.abs === 0 &&
    p.chest === 0 &&
    p.head === 0 &&
    p.armUpperL === 0 &&
    p.armLowerL === 0 &&
    p.handL === 0 &&
    p.armUpperR === 0 &&
    p.armLowerR === 0 &&
    p.handR === 0 &&
    p.thighL === 0 &&
    p.shinL === 0 &&
    p.footL === 0 &&
    p.thighR === 0 &&
    p.shinR === 0 &&
    p.footR === 0
  );
}

// Mirror front pose anatomically for back view & calibrate arm rest angles (~25° back vs ~44° front)
function mapPoseForBackView(fp: Pose2D): Pose2D {
  if (isExactRestPoseData(fp)) return fp;

  const mapArmOut = (frontOutDeg: number): number =>
    frontOutDeg < 0
      ? clamp(frontOutDeg * 0.34, -12, 0)
      : clamp(frontOutDeg * 1.26, 0, 56);

  // Viewer's Left on Back view corresponds to Viewer's Right on Front view (and vice versa)
  const backArmUpperL = mapArmOut(-fp.armUpperR);
  const backArmUpperR = -mapArmOut(fp.armUpperL);

  return {
    pelvisTilt: -fp.pelvisTilt,
    pelvisShiftX: -fp.pelvisShiftX,
    abs: -fp.abs,
    chest: -fp.chest,
    head: -fp.head,
    armUpperL: backArmUpperL,
    armLowerL: clamp(-fp.armLowerR * 0.85, -34, 30),
    handL: clamp(-fp.handR * 0.85, -14, 14),
    armUpperR: backArmUpperR,
    armLowerR: clamp(-fp.armLowerL * 0.85, -30, 34),
    handR: clamp(-fp.handL * 0.85, -14, 14),
    thighL: -fp.thighR,
    shinL: -fp.shinR,
    footL: -fp.footR,
    thighR: -fp.thighL,
    shinR: -fp.shinL,
    footR: -fp.footL,
  };
}

let cachedVitruvianPackPromise: Promise<VitruvianSpritePack> | null = null;
let cachedVitruvianBackPackPromise: Promise<VitruvianSpritePack> | null = null;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function distSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

function pointToSegDistSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby || 1;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / lenSq, 0, 1);
  return distSq(px, py, ax + t * abx, ay + t * aby);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function extractCleanForeground(img: HTMLImageElement): HTMLCanvasElement {
  // image_478f8047.png already ships with razor-sharp native RGBA transparency (72% transparent).
  // Preserving native alpha directly keeps natural curls, fingers, white boxers & toes 100% artifact-free!
  const W = img.naturalWidth || 1024;
  const H = img.naturalHeight || 1536;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  return c;
}

function slicePartWithSoftMask(
  cleanFg: HTMLCanvasElement,
  pivots: Record<SpriteRegionId, [number, number]>,
  id: SpriteRegionId,
  box: { x0: number; y0: number; x1: number; y1: number },
  weightFn: (x: number, y: number) => number
): SpritePart {
  const [pivotX, pivotY] = pivots[id];
  const W = cleanFg.width;
  const H = cleanFg.height;
  const x0 = Math.max(0, Math.floor(box.x0));
  const y0 = Math.max(0, Math.floor(box.y0));
  const x1 = Math.min(W, Math.ceil(box.x1));
  const y1 = Math.min(H, Math.ceil(box.y1));
  const bw = Math.max(2, x1 - x0);
  const bh = Math.max(2, y1 - y0);

  const c = document.createElement('canvas');
  c.width = bw;
  c.height = bh;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(cleanFg, x0, y0, bw, bh, 0, 0, bw, bh);
  const imgData = ctx.getImageData(0, 0, bw, bh);
  const d = imgData.data;

  for (let ly = 0; ly < bh; ly++) {
    const gy = y0 + ly;
    for (let lx = 0; lx < bw; lx++) {
      const p = (ly * bw + lx) * 4;
      if (d[p + 3] === 0) continue;
      const w = weightFn(x0 + lx, gy);
      if (w <= 0.005) {
        d[p + 3] = 0;
      } else if (w < 0.995) {
        d[p + 3] = Math.round(d[p + 3] * w);
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);

  return {
    canvas: c,
    pivotX,
    pivotY,
    offsetX: x0 - pivotX,
    offsetY: y0 - pivotY,
  };
}

function loadVitruvianSpritePack(): Promise<VitruvianSpritePack> {
  if (cachedVitruvianPackPromise) return cachedVitruvianPackPromise;
  cachedVitruvianPackPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const fg = extractCleanForeground(img);
        const parts = {} as Record<SpriteRegionId, SpritePart>;

        // 1. HEAD (soft circular blend into upper neck so head tilt is 100% seamless)
        parts.head = slicePartWithSoftMask(
          fg,
          FRONT_PIVOTS,
          'head',
          { x0: 380, y0: 0, x1: 640, y1: 274 },
          (x, y) => {
            if (y <= 204) return 1;
            const dPivot = Math.hypot((x - 510) * 0.9, y - 216);
            return 1 - smoothstep(38, 60, dPivot);
          }
        );

        // 2. CHEST (deltopectoral groove contour + generous armpit/lat overlap for zero gaps in raised poses!)
        parts.chest = slicePartWithSoftMask(
          fg,
          FRONT_PIVOTS,
          'chest',
          { x0: 320, y0: 196, x1: 700, y1: 522 },
          (x, y) => {
            const topW = smoothstep(200, 232, y);
            const botW = 1 - smoothstep(474, 514, y);
            // Smooth deltopectoral groove curve hugging pecs and gently cradling armpit/lats
            const leftGrooveX =
              y < 368
                ? 360 - Math.pow((368 - y) / 86, 2) * 14
                : 356 - ((y - 368) / 80) * 14;
            const lChestW = smoothstep(leftGrooveX - 20, leftGrooveX + 10, x);
            const rightGrooveX = 1020 - leftGrooveX;
            const rChestW = smoothstep(x - 10, x + 20, rightGrooveX);
            return topW * botW * lChestW * rChestW;
          }
        );

        // 3. ABS (wide feathered overlap across ribcage & waistband)
        parts.abs = slicePartWithSoftMask(
          fg,
          FRONT_PIVOTS,
          'abs',
          { x0: 364, y0: 468, x1: 656, y1: 640 },
          (_x, y) => smoothstep(472, 506, y) * (1 - smoothstep(600, 634, y))
        );

        // 4. PELVIS / WHITE CALVIN KLEIN BOXERS
        parts.pelvis = slicePartWithSoftMask(
          fg,
          FRONT_PIVOTS,
          'pelvis',
          { x0: 324, y0: 590, x1: 702, y1: 816 },
          (x, y) => {
            const topW = smoothstep(594, 622, y);
            const dxCenter = Math.abs(x - 510);
            const briefsHemY = 804 - dxCenter * 0.27;
            const botW = 1 - smoothstep(briefsHemY - 8, briefsHemY + 6, y);
            return topW * botW;
          }
        );

        const sliceLimb = (
          id: SpriteRegionId,
          ax: number,
          ay: number,
          bx: number,
          by: number,
          rStart: number,
          rEnd: number,
          corridorR: number,
          extendEnd = false,
          extraMask?: (x: number, y: number) => number,
          jointFeather = 18
        ) => {
          const pad = Math.max(corridorR, rStart, rEnd) + 32;
          const x0 = Math.min(ax, bx) - pad;
          const x1 = Math.max(ax, bx) + pad;
          const y0 = Math.min(ay, by) - pad;
          const y1 = Math.max(ay, by) + pad;
          const vx = bx - ax;
          const vy = by - ay;
          const len = Math.hypot(vx, vy) || 1;
          const ux = vx / len;
          const uy = vy / len;

          parts[id] = slicePartWithSoftMask(fg, FRONT_PIVOTS, id, { x0, y0, x1, y1 }, (x, y) => {
            const proj = (x - ax) * ux + (y - ay) * uy;
            const dStart = Math.hypot(x - ax, y - ay);
            const inStartBall = 1 - smoothstep(rStart - jointFeather, rStart + 6, dStart);
            const dEnd = Math.hypot(x - bx, y - by);
            const inEndBall = extendEnd
              ? 1
              : 1 - smoothstep(rEnd - jointFeather, rEnd + 6, dEnd);
            const segD = Math.sqrt(pointToSegDistSq(x, y, ax, ay, bx, by));
            const inCorridor = 1 - smoothstep(corridorR - 10, corridorR + 8, segD);

            let baseW: number;
            if (proj < 0) baseW = inStartBall;
            else if (!extendEnd && proj > len) baseW = inEndBall;
            else baseW = Math.max(inStartBall * (proj < rStart ? 1 : 0), inCorridor);

            return extraMask ? baseW * extraMask(x, y) : baseW;
          });
        };

        // Upper arms capture full sculpted deltoid domes & smooth armpit overlap with ZERO gap in raised poses
        sliceLimb(
          'armUpperL',
          342,
          368,
          238,
          476,
          88,
          56,
          74,
          false,
          (x, y) => {
            const armpitWallX = y < 395 ? 394 : 374 - (y - 395) * 0.16;
            return 1 - smoothstep(armpitWallX - 20, armpitWallX + 8, x);
          },
          22
        );
        sliceLimb('armLowerL', 238, 476, 148, 558, 58, 40, 62, false, undefined, 20);
        sliceLimb('handL', 148, 558, 20, 605, 42, 110, 96, true, undefined, 16);

        sliceLimb(
          'armUpperR',
          678,
          368,
          782,
          476,
          88,
          56,
          74,
          false,
          (x, y) => {
            const armpitWallX = y < 395 ? 626 : 646 + (y - 395) * 0.16;
            return smoothstep(armpitWallX - 8, armpitWallX + 20, x);
          },
          22
        );
        sliceLimb('armLowerR', 782, 476, 872, 558, 58, 40, 62, false, undefined, 20);
        sliceLimb('handR', 872, 558, 1004, 605, 42, 110, 96, true, undefined, 16);

        // Muscular quads, knees, calves & feet with generous feathered overlap
        sliceLimb('thighL', 414, 764, 378, 1026, 110, 62, 108, false, undefined, 22);
        sliceLimb('shinL', 378, 1026, 316, 1368, 60, 38, 86, false, undefined, 22);
        sliceLimb('footL', 316, 1368, 268, 1522, 38, 122, 112, true, undefined, 14);

        sliceLimb('thighR', 606, 764, 634, 1026, 110, 62, 108, false, undefined, 22);
        sliceLimb('shinR', 634, 1026, 691, 1368, 60, 38, 86, false, undefined, 22);
        sliceLimb('footR', 691, 1368, 746, 1522, 38, 122, 112, true, undefined, 14);

        resolve({ fullCanvas: fg, parts });
      } catch (err) {
        cachedVitruvianPackPromise = null;
        reject(err);
      }
    };
    img.onerror = () => {
      cachedVitruvianPackPromise = null;
      reject(new Error('No se pudo cargar la imagen del Vitruvio'));
    };
    img.src = VITRUVIAN_PHOTO_SRC;
  });
  return cachedVitruvianPackPromise;
}

/* ============================================================================
   EXACT BACK-VIEW PHOTOREALISTIC 2D PUPPET SLICER (image_abe402a7.png)
   Normalized to identical 1024x1536 studio space & height, stripping stray far-right specks!
============================================================================ */
function loadVitruvianBackSpritePack(): Promise<VitruvianSpritePack> {
  if (cachedVitruvianBackPackPromise) return cachedVitruvianBackPackPromise;
  cachedVitruvianBackPackPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const W = 1024;
        const H = 1536;
        const fg = document.createElement('canvas');
        fg.width = W;
        fg.height = H;
        const fctx = fg.getContext('2d', { willReadFrequently: true })!;
        fctx.imageSmoothingEnabled = true;
        fctx.imageSmoothingQuality = 'high';

        // Crop strictly x=0..732 (removes stray dark margin dots at x=738..756) & normalize exact height to match Front!
        const srcCleanW = Math.min(732, img.naturalWidth || 757);
        const srcH = img.naturalHeight || 1430;
        const k = 1514 / 1420; // exact match to Front figure height (14..1528)
        const dstX = 510 - 381 * k; // aligns exact spine center x=381 -> x=510
        const dstY = 14 - 2 * k;
        fctx.drawImage(img, 0, 0, srcCleanW, srcH, dstX, dstY, srcCleanW * k, srcH * k);

        const parts = {} as Record<SpriteRegionId, SpritePart>;

        // 1. BACK HEAD (curly hair + upper nape with soft circular blend)
        parts.head = slicePartWithSoftMask(
          fg,
          BACK_PIVOTS,
          'head',
          { x0: 368, y0: 0, x1: 652, y1: 280 },
          (x, y) => {
            if (y <= 212) return 1;
            const dPivot = Math.hypot((x - 510) * 0.88, y - 224);
            return 1 - smoothstep(42, 66, dPivot);
          }
        );

        // 2. UPPER BACK / TRAPEZIUS / SCAPULAE / LATS
        parts.chest = slicePartWithSoftMask(
          fg,
          BACK_PIVOTS,
          'chest',
          { x0: 318, y0: 204, x1: 702, y1: 528 },
          (x, y) => {
            const topW = smoothstep(208, 240, y);
            const botW = 1 - smoothstep(478, 520, y);
            // Smooth anatomical rear-deltoid / scapula groove curve
            const leftGrooveX =
              y < 376
                ? 360 - Math.pow((376 - y) / 92, 2) * 16
                : 360 - ((y - 376) / 114) * 6;
            const lBackW = smoothstep(leftGrooveX - 18, leftGrooveX + 10, x);
            const rightGrooveX = 1020 - leftGrooveX;
            const rBackW = smoothstep(x - 10, x + 18, rightGrooveX);
            return topW * botW * lBackW * rBackW;
          }
        );

        // 3. LOWER BACK / LUMBAR
        parts.abs = slicePartWithSoftMask(
          fg,
          BACK_PIVOTS,
          'abs',
          { x0: 358, y0: 472, x1: 662, y1: 654 },
          (_x, y) => smoothstep(476, 512, y) * (1 - smoothstep(612, 648, y))
        );

        // 4. PELVIS / BACK WHITE CALVIN KLEIN BOXERS (GLUTES)
        parts.pelvis = slicePartWithSoftMask(
          fg,
          BACK_PIVOTS,
          'pelvis',
          { x0: 318, y0: 604, x1: 704, y1: 874 },
          (x, y) => {
            const topW = smoothstep(608, 634, y);
            const dxCenter = Math.abs(x - 510);
            const briefsHemY = 856 - dxCenter * 0.22;
            const botW = 1 - smoothstep(briefsHemY - 10, briefsHemY + 6, y);
            return topW * botW;
          }
        );

        const sliceBackLimb = (
          id: SpriteRegionId,
          ax: number,
          ay: number,
          bx: number,
          by: number,
          rStart: number,
          rEnd: number,
          corridorR: number,
          extendEnd = false,
          extraMask?: (x: number, y: number) => number,
          jointFeather = 20
        ) => {
          const pad = Math.max(corridorR, rStart, rEnd) + 34;
          const x0 = Math.min(ax, bx) - pad;
          const x1 = Math.max(ax, bx) + pad;
          const y0 = Math.min(ay, by) - pad;
          const y1 = Math.max(ay, by) + pad;
          const vx = bx - ax;
          const vy = by - ay;
          const len = Math.hypot(vx, vy) || 1;
          const ux = vx / len;
          const uy = vy / len;

          parts[id] = slicePartWithSoftMask(fg, BACK_PIVOTS, id, { x0, y0, x1, y1 }, (x, y) => {
            const proj = (x - ax) * ux + (y - ay) * uy;
            const dStart = Math.hypot(x - ax, y - ay);
            const inStartBall = 1 - smoothstep(rStart - jointFeather, rStart + 6, dStart);
            const dEnd = Math.hypot(x - bx, y - by);
            const inEndBall = extendEnd
              ? 1
              : 1 - smoothstep(rEnd - jointFeather, rEnd + 6, dEnd);
            const segD = Math.sqrt(pointToSegDistSq(x, y, ax, ay, bx, by));
            const inCorridor = 1 - smoothstep(corridorR - 10, corridorR + 8, segD);

            let baseW: number;
            if (proj < 0) baseW = inStartBall;
            else if (!extendEnd && proj > len) baseW = inEndBall;
            else baseW = Math.max(inStartBall * (proj < rStart ? 1 : 0), inCorridor);

            return extraMask ? baseW * extraMask(x, y) : baseW;
          });
        };

        // Back arms (rear deltoids + triceps + forearms + hands) cleanly excluding back lats past armpit crease
        sliceBackLimb(
          'armUpperL',
          332,
          376,
          257,
          538,
          86,
          56,
          68,
          false,
          (x, y) => {
            const armpitWallX = y < 378 ? 380 : 356 - (y - 378) * 0.24;
            return 1 - smoothstep(armpitWallX - 18, armpitWallX + 8, x);
          },
          20
        );
        sliceBackLimb('armLowerL', 257, 538, 183, 705, 56, 38, 58, false, undefined, 20);
        sliceBackLimb('handL', 183, 705, 152, 854, 40, 96, 86, true, undefined, 16);

        sliceBackLimb(
          'armUpperR',
          688,
          376,
          763,
          538,
          86,
          56,
          68,
          false,
          (x, y) => {
            const armpitWallX = y < 378 ? 640 : 664 + (y - 378) * 0.24;
            return smoothstep(armpitWallX - 8, armpitWallX + 18, x);
          },
          20
        );
        sliceBackLimb('armLowerR', 763, 538, 837, 705, 56, 38, 58, false, undefined, 20);
        sliceBackLimb('handR', 837, 705, 868, 854, 40, 96, 86, true, undefined, 16);

        // Hamstrings, back of knees, calves & heels
        sliceBackLimb('thighL', 411, 822, 394, 1046, 114, 64, 110, false, undefined, 22);
        sliceBackLimb('shinL', 394, 1046, 339, 1382, 62, 40, 88, false, undefined, 22);
        sliceBackLimb('footL', 339, 1382, 286, 1522, 40, 126, 118, true, undefined, 14);

        sliceBackLimb('thighR', 609, 822, 624, 1046, 114, 64, 110, false, undefined, 22);
        sliceBackLimb('shinR', 624, 1046, 673, 1382, 62, 40, 88, false, undefined, 22);
        sliceBackLimb('footR', 673, 1382, 732, 1522, 40, 126, 118, true, undefined, 14);

        resolve({ fullCanvas: fg, parts });
      } catch (err) {
        cachedVitruvianBackPackPromise = null;
        reject(err);
      }
    };
    img.onerror = () => {
      cachedVitruvianBackPackPromise = null;
      reject(new Error('No se pudo cargar la vista trasera del Vitruvio'));
    };
    img.src = VITRUVIAN_BACK_PHOTO_SRC;
  });
  return cachedVitruvianBackPackPromise;
}

/* ============================================================================
   UNIFIED STYLIZED GARMENT COMPOSITING ENGINE (CONTINUOUS ONE-PIECE TOPS,
   CALIBRATED TAILORED TROUSERS, SKIN CONTACT AO & ANATOMICAL DRAPE SHADING)
============================================================================ */

type Vec2 = [number, number];

interface ArmKinematics {
  sh: Vec2;
  el: Vec2;
  wr: Vec2;
  bendDeg: number;
}

let sharedTopCompositeCanvas: HTMLCanvasElement | null = null;
function getTopCompositeCanvas(): HTMLCanvasElement {
  if (!sharedTopCompositeCanvas) {
    sharedTopCompositeCanvas = document.createElement('canvas');
    sharedTopCompositeCanvas.width = 1160;
    sharedTopCompositeCanvas.height = 1080;
  }
  return sharedTopCompositeCanvas;
}

const customTopImageCache = new Map<string, HTMLImageElement>();
function getCachedCustomImage(url: string): HTMLImageElement | null {
  let img = customTopImageCache.get(url);
  if (!img) {
    img = new Image();
    img.src = url;
    customTopImageCache.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

function unitVec(dx: number, dy: number): Vec2 {
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}

function mixPt(a: Vec2, b: Vec2, t: number): Vec2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function addScaled(p: Vec2, v: Vec2, s: number): Vec2 {
  return [p[0] + v[0] * s, p[1] + v[1] * s];
}

/* Paint a lengthwise-aligned stylized weave swatch + 3D cylindrical studio lighting along a bone */
function paintLengthwiseKnitBand(
  ctx: CanvasRenderingContext2D,
  pattern: CanvasPattern | string,
  a: Vec2,
  b: Vec2,
  maxR: number,
  topBright = true,
  padStart = 20,
  padEnd = 20
) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.translate(a[0], a[1]);
  ctx.rotate(angle);

  // Rotate -90deg so vertical knit/twill/cable stitches ALWAYS run lengthwise along arms & legs
  ctx.save();
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = pattern;
  ctx.fillRect(-maxR - 18, -padStart, (maxR + 18) * 2, len + padStart + padEnd);
  ctx.restore();

  // Studio 3D cylindrical lighting matching overhead-front key light of the Vitruvian
  const grad = ctx.createLinearGradient(0, -maxR, 0, maxR);
  if (topBright) {
    grad.addColorStop(0, 'rgba(18, 8, 2, 0.34)');
    grad.addColorStop(0.22, 'rgba(255, 248, 232, 0.16)');
    grad.addColorStop(0.48, 'rgba(255, 244, 220, 0.08)');
    grad.addColorStop(0.76, 'rgba(18, 8, 2, 0.2)');
    grad.addColorStop(1, 'rgba(10, 4, 1, 0.46)');
  } else {
    grad.addColorStop(0, 'rgba(10, 4, 1, 0.46)');
    grad.addColorStop(0.24, 'rgba(18, 8, 2, 0.2)');
    grad.addColorStop(0.52, 'rgba(255, 244, 220, 0.08)');
    grad.addColorStop(0.78, 'rgba(255, 248, 232, 0.16)');
    grad.addColorStop(1, 'rgba(18, 8, 2, 0.34)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(-padStart, -maxR - 10, len + padStart + padEnd, (maxR + 10) * 2);

  ctx.restore();
}

function shadeHex(hex: string, factor: number): string {
  const clean = (hex || '#886644').replace('#', '').trim();
  const full = clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const r = Math.max(0, Math.min(255, Math.round(((n >> 16) & 255) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(((n >> 8) & 255) * factor)));
  const b = Math.max(0, Math.min(255, Math.round((n & 255) * factor)));
  return `rgb(${r},${g},${b})`;
}

/* Single continuous tailored trousers / joggers / bermudas calibrated to exact Vitruvian pixel anatomy */
function drawSeamlessContinuousBottoms(
  ctx: CanvasRenderingContext2D,
  pattern: CanvasPattern | string,
  garment: DressingRoomGarment,
  isBackView: boolean,
  hipL: Vec2,
  kneeL: Vec2,
  ankL: Vec2,
  hipR: Vec2,
  kneeR: Vec2,
  ankR: Vec2,
  kneeBendL: number,
  kneeBendR: number
) {
  const tpl = garment.baseTemplateId || garment.id;
  const bSil = garment.silhouetteKind || 'trousers';
  const bBase = garment.palette[0] || '#223659';
  const bTrim = garment.palette[1] || '#B88635';
  const bCord = garment.palette[2] || '#EFE0C2';
  const isShorts = bSil === 'shorts';
  const isJoggers = bSil === 'joggers';

  // Exact anatomical landmarks in pelvis-local coords (origin = [510, 710] front / [510, 732] back)
  const waistTopY = isBackView ? -96 : -88;
  const crotchArchY = isBackView ? 100 : 88;

  // Compute organic outer & inner rail control points calibrated to measured thigh/knee/calf/ankle widths
  const buildLegGeo = (
    hip: Vec2,
    knee: Vec2,
    ank: Vec2,
    side: 'L' | 'R'
  ) => {
    const sign = side === 'L' ? -1 : 1;
    const uTh = unitVec(knee[0] - hip[0], knee[1] - hip[1]);
    const uSh = unitVec(ank[0] - knee[0], ank[1] - knee[1]);
    // Outward normal: points LEFT for left leg, RIGHT for right leg
    const nThOut: Vec2 = side === 'L' ? [-uTh[1], uTh[0]] : [uTh[1], -uTh[0]];
    const nShOut: Vec2 = side === 'L' ? [-uSh[1], uSh[0]] : [uSh[1], -uSh[0]];
    const nKnOut = unitVec(nThOut[0] + nShOut[0], nThOut[1] + nShOut[1]);

    // Calibrated to Vitruvian pixel measurements (knee ~54px, calf ~62px, ankle ~30px) + clean tailored ease
    const rHipOut = isBackView ? 96 : 92;
    const rThighIn = isBackView ? 82 : 78;
    const rKnee = isShorts ? 72 : isJoggers ? 64 : 68;
    const rCalfOut = isJoggers ? 64 : 68;
    const rCalfIn = isJoggers ? 56 : 62;
    const rHem = isShorts ? 70 : isJoggers ? 40 : 50;

    const endPt: Vec2 = isShorts ? mixPt(hip, knee, 0.82) : mixPt(knee, ank, 0.96);
    const uEnd = isShorts ? uTh : uSh;
    const nEndOut = isShorts ? nThOut : nShOut;

    return {
      sign,
      hip,
      knee,
      endPt,
      uTh,
      uSh,
      uEnd,
      nThOut,
      nShOut,
      nKnOut,
      nEndOut,
      rHem,
      outerHip: [sign * 182, isBackView ? 28 : 20] as Vec2,
      outerThighMid: addScaled(mixPt(hip, knee, 0.48), nThOut, (rHipOut + rKnee) * 0.51),
      outerKnee: addScaled(knee, nKnOut, rKnee),
      outerCalfMid: addScaled(mixPt(knee, endPt, 0.48), nShOut, (rCalfOut + rHem) * 0.53),
      outerHem: addScaled(endPt, nEndOut, rHem),
      hemLip: addScaled(endPt, uEnd, isShorts ? 12 : 14),
      innerHem: addScaled(endPt, nEndOut, -rHem),
      innerCalfMid: addScaled(mixPt(knee, endPt, 0.48), nShOut, -(rCalfIn + rHem) * 0.51),
      innerKnee: addScaled(knee, nKnOut, -rKnee * 0.94),
      innerThighMid: addScaled(mixPt(hip, knee, 0.52), nThOut, -(rThighIn + rKnee) * 0.47),
      innerCrotch: [sign * 18, crotchArchY + 24] as Vec2,
    };
  };

  const L = buildLegGeo(hipL, kneeL, ankL, 'L');
  const R = buildLegGeo(hipR, kneeR, ankR, 'R');

  const traceBottomsPath = () => {
    ctx.beginPath();
    ctx.moveTo(-148, waistTopY);
    // Natural anatomical waistband curve dipping gently at navel/spine center
    ctx.quadraticCurveTo(0, waistTopY + 11, 148, waistTopY);
    // Right outer hip & thigh
    ctx.quadraticCurveTo(186, waistTopY + 54, R.outerHip[0], R.outerHip[1]);
    if (isShorts) {
      ctx.quadraticCurveTo(R.outerThighMid[0], R.outerThighMid[1], R.outerHem[0], R.outerHem[1]);
      ctx.quadraticCurveTo(R.hemLip[0], R.hemLip[1], R.innerHem[0], R.innerHem[1]);
      ctx.quadraticCurveTo(R.innerThighMid[0], R.innerThighMid[1], R.innerCrotch[0], R.innerCrotch[1]);
    } else {
      ctx.quadraticCurveTo(R.outerThighMid[0], R.outerThighMid[1], R.outerKnee[0], R.outerKnee[1]);
      ctx.quadraticCurveTo(R.outerCalfMid[0], R.outerCalfMid[1], R.outerHem[0], R.outerHem[1]);
      ctx.quadraticCurveTo(R.hemLip[0], R.hemLip[1], R.innerHem[0], R.innerHem[1]);
      ctx.quadraticCurveTo(R.innerCalfMid[0], R.innerCalfMid[1], R.innerKnee[0], R.innerKnee[1]);
      ctx.quadraticCurveTo(R.innerThighMid[0], R.innerThighMid[1], R.innerCrotch[0], R.innerCrotch[1]);
    }
    // Smooth realistic curved crotch rise arch
    ctx.quadraticCurveTo(0, crotchArchY, L.innerCrotch[0], L.innerCrotch[1]);
    // Left leg (inner -> curved hem -> outer -> hip)
    if (isShorts) {
      ctx.quadraticCurveTo(L.innerThighMid[0], L.innerThighMid[1], L.innerHem[0], L.innerHem[1]);
      ctx.quadraticCurveTo(L.hemLip[0], L.hemLip[1], L.outerHem[0], L.outerHem[1]);
      ctx.quadraticCurveTo(L.outerThighMid[0], L.outerThighMid[1], L.outerHip[0], L.outerHip[1]);
    } else {
      ctx.quadraticCurveTo(L.innerThighMid[0], L.innerThighMid[1], L.innerKnee[0], L.innerKnee[1]);
      ctx.quadraticCurveTo(L.innerCalfMid[0], L.innerCalfMid[1], L.innerHem[0], L.innerHem[1]);
      ctx.quadraticCurveTo(L.hemLip[0], L.hemLip[1], L.outerHem[0], L.outerHem[1]);
      ctx.quadraticCurveTo(L.outerCalfMid[0], L.outerCalfMid[1], L.outerKnee[0], L.outerKnee[1]);
      ctx.quadraticCurveTo(L.outerThighMid[0], L.outerThighMid[1], L.outerHip[0], L.outerHip[1]);
    }
    ctx.quadraticCurveTo(-186, waistTopY + 54, -148, waistTopY);
    ctx.closePath();
  };

  ctx.save();
  // ONE continuous tailored garment silhouette (waist -> right leg -> crotch arch -> left leg -> waist)
  traceBottomsPath();

  // Soft studio drop shadow cast onto backdrop & legs
  ctx.shadowColor = 'rgba(24, 10, 2, 0.34)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = typeof pattern === 'string' ? pattern : '#262018';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.clip();

  // 1. Base hip/pelvis upright photographic knit weave
  ctx.fillStyle = pattern;
  ctx.fillRect(-230, waistTopY - 10, 460, 260);

  // 2. Paint lengthwise-aligned photographic knit + 3D cylindrical volume down each leg!
  const paintLegFabric = (g: ReturnType<typeof buildLegGeo>, bendDeg: number) => {
    // Thigh section (clipped cleanly below hip crease)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, crotchArchY - 40);
    ctx.lineTo(g.sign * 260, waistTopY + 60);
    ctx.lineTo(g.sign * 290, g.knee[1] + 40);
    ctx.lineTo(0, g.knee[1] + 40);
    ctx.closePath();
    ctx.clip();
    paintLengthwiseKnitBand(
      ctx,
      pattern,
      g.hip,
      isShorts ? g.endPt : g.knee,
      110,
      g.sign < 0,
      90,
      36
    );
    ctx.restore();

    if (!isShorts) {
      // Lower calf section clipped along knee bisector
      ctx.save();
      ctx.beginPath();
      const kOut = addScaled(g.outerKnee, g.nKnOut, 60);
      const kIn = addScaled(g.innerKnee, g.nKnOut, -60);
      const hOut = addScaled(addScaled(g.outerHem, g.uSh, 60), g.nShOut, 60);
      const hIn = addScaled(addScaled(g.innerHem, g.uSh, 60), g.nShOut, -60);
      ctx.moveTo(kOut[0], kOut[1]);
      ctx.lineTo(hOut[0], hOut[1]);
      ctx.lineTo(hIn[0], hIn[1]);
      ctx.lineTo(kIn[0], kIn[1]);
      ctx.closePath();
      ctx.clip();
      paintLengthwiseKnitBand(ctx, pattern, g.knee, g.endPt, 96, g.sign < 0, 28, 36);
      ctx.restore();

      // Dynamic realistic horizontal knee drape fold (stronger when knee bends!)
      const kAlpha = clamp(0.16 + Math.abs(bendDeg) * 0.015, 0.14, 0.34);
      const kGrad = ctx.createLinearGradient(
        g.knee[0],
        g.knee[1] - 32,
        g.knee[0],
        g.knee[1] + 34
      );
      kGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      kGrad.addColorStop(0.35, `rgba(255, 246, 226, ${kAlpha * 0.55})`);
      kGrad.addColorStop(0.62, `rgba(10, 4, 1, ${kAlpha})`);
      kGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = kGrad;
      ctx.fillRect(g.knee[0] - 110, g.knee[1] - 36, 220, 72);

      // Subtle trouser break fold just above ankle hem on tailored trousers
      if (!isJoggers) {
        const bPt = addScaled(g.endPt, g.uSh, -38);
        ctx.strokeStyle = 'rgba(10, 4, 1, 0.24)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bPt[0] - g.nShOut[0] * 48, bPt[1] - g.nShOut[1] * 48);
        ctx.quadraticCurveTo(bPt[0], bPt[1] + 10, bPt[0] + g.nShOut[0] * 48, bPt[1] + g.nShOut[1] * 48);
        ctx.stroke();
      }
    }

    // Bespoke stylized cuff / hem finish dynamically colored for all 480 bottom designs!
    const isMarfilBermuda = tpl === 'bermuda-clasica-marfil';
    const isBurdeosBermuda = tpl === 'bermuda-taller-burdeos';
    const isCacaoTailored = tpl === 'pantalon-cacao-chevron';
    const isArenaCable = tpl === 'pantalon-atelier-arena';
    const isMarinoTailored = tpl === 'pantalon-sastre-marino';

    // Crisp vertical tailored front leg crease on tailored trousers
    if (!isBackView && (isMarinoTailored || isCacaoTailored)) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 246, 224, 0.18)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(g.hip[0] + g.sign * 6, g.hip[1] - 48);
      ctx.lineTo(g.knee[0], g.knee[1]);
      ctx.lineTo(g.endPt[0], g.endPt[1] - 18);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(12, 5, 2, 0.22)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(g.hip[0] + g.sign * 9, g.hip[1] - 48);
      ctx.lineTo(g.knee[0] + g.sign * 3, g.knee[1]);
      ctx.lineTo(g.endPt[0] + g.sign * 3, g.endPt[1] - 18);
      ctx.stroke();
      ctx.restore();
    }

    // Sculpted outer side cable stripe on knitted cable joggers
    if (isArenaCable) {
      ctx.save();
      ctx.strokeStyle = shadeHex(bBase, 0.62);
      ctx.globalAlpha = 0.52;
      ctx.lineWidth = 10;
      ctx.setLineDash([12, 7]);
      ctx.beginPath();
      ctx.moveTo(g.outerHip[0] - g.sign * 14, g.outerHip[1] + 24);
      ctx.quadraticCurveTo(g.outerThighMid[0] - g.sign * 12, g.outerThighMid[1], g.outerKnee[0] - g.sign * 10, g.outerKnee[1]);
      ctx.quadraticCurveTo(g.outerCalfMid[0] - g.sign * 10, g.outerCalfMid[1], g.outerHem[0] - g.sign * 10, g.outerHem[1] - 26);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    const cuffDepth = isShorts ? 24 : isJoggers ? 32 : isCacaoTailored ? 28 : 20;
    const cStart = addScaled(g.endPt, g.uEnd, -cuffDepth);
    const cOut = addScaled(cStart, g.nEndOut, g.rHem + 10);
    const cIn = addScaled(cStart, g.nEndOut, -(g.rHem + 10));
    const cLip = addScaled(cStart, g.uEnd, isShorts ? 14 : 18);

    ctx.save();
    if (isMarfilBermuda) {
      // Bold crisp contrast cuff band using garment's palette[1]!
      ctx.beginPath();
      ctx.moveTo(cOut[0], cOut[1]);
      ctx.quadraticCurveTo(cLip[0], cLip[1], cIn[0], cIn[1]);
      ctx.lineTo(g.innerHem[0] + g.uEnd[0] * 26, g.innerHem[1] + g.uEnd[1] * 26);
      ctx.lineTo(g.outerHem[0] + g.uEnd[0] * 26, g.outerHem[1] + g.uEnd[1] * 26);
      ctx.closePath();
      ctx.fillStyle = bTrim;
      ctx.fill();
    } else if (isBurdeosBermuda) {
      // Geometric chevron trim border along ribbed bermuda hem in palette[1]!
      ctx.beginPath();
      ctx.moveTo(cOut[0], cOut[1]);
      ctx.quadraticCurveTo(cLip[0], cLip[1], cIn[0], cIn[1]);
      ctx.lineTo(g.innerHem[0] + g.uEnd[0] * 26, g.innerHem[1] + g.uEnd[1] * 26);
      ctx.lineTo(g.outerHem[0] + g.uEnd[0] * 26, g.outerHem[1] + g.uEnd[1] * 26);
      ctx.closePath();
      ctx.fillStyle = shadeHex(bBase, 0.72);
      ctx.fill();
      const chevSteps = 12;
      ctx.strokeStyle = bTrim;
      ctx.lineWidth = 2.4;
      for (let i = 0; i < chevSteps; i++) {
        const t0 = i / chevSteps;
        const t1 = (i + 0.5) / chevSteps;
        const t2 = (i + 1) / chevSteps;
        const pA = addScaled(mixPt(cOut, cIn, t0), g.uEnd, Math.sin(t0 * Math.PI) * 10 + 13);
        const pB = addScaled(mixPt(cOut, cIn, t1), g.uEnd, Math.sin(t1 * Math.PI) * 10 + 5);
        const pC = addScaled(mixPt(cOut, cIn, t2), g.uEnd, Math.sin(t2 * Math.PI) * 10 + 13);
        ctx.beginPath();
        ctx.moveTo(pA[0], pA[1]);
        ctx.lineTo(pB[0], pB[1]);
        ctx.lineTo(pC[0], pC[1]);
        ctx.stroke();
      }
    } else if (isJoggers || isCacaoTailored) {
      ctx.beginPath();
      ctx.moveTo(cOut[0], cOut[1]);
      ctx.quadraticCurveTo(cLip[0], cLip[1], cIn[0], cIn[1]);
      ctx.lineTo(g.innerHem[0] + g.uEnd[0] * 26, g.innerHem[1] + g.uEnd[1] * 26);
      ctx.lineTo(g.outerHem[0] + g.uEnd[0] * 26, g.outerHem[1] + g.uEnd[1] * 26);
      ctx.closePath();
      ctx.fillStyle = isCacaoTailored ? shadeHex(bBase, 0.78) : bBase;
      ctx.globalAlpha = isCacaoTailored ? 0.52 : 0.44;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Recessed hem stitch / cuff join line
    ctx.strokeStyle = isBurdeosBermuda ? bTrim : 'rgba(18, 8, 2, 0.46)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cOut[0], cOut[1]);
    ctx.quadraticCurveTo(cLip[0], cLip[1], cIn[0], cIn[1]);
    ctx.stroke();

    // Ribbed vertical knit ridges on jogger cuffs
    if (isJoggers) {
      const steps = 16;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const base = mixPt(cOut, cIn, t);
        const arch = Math.sin(t * Math.PI) * 13;
        const p0 = addScaled(base, g.uEnd, arch);
        const p1 = addScaled(p0, g.uEnd, cuffDepth + 12);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 246, 224, 0.26)' : 'rgba(14, 6, 2, 0.34)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  paintLegFabric(L, kneeBendL);
  paintLegFabric(R, kneeBendR);

  // 3. Sculpted Hip / Pelvis 3D Volume Shading + Deep Crotch Ambient Occlusion!
  const hipGrad = ctx.createLinearGradient(-196, 0, 196, 0);
  if (isBackView) {
    hipGrad.addColorStop(0, 'rgba(14, 6, 2, 0.46)');
    hipGrad.addColorStop(0.24, 'rgba(255, 248, 230, 0.16)');
    hipGrad.addColorStop(0.46, 'rgba(16, 7, 2, 0.2)');
    hipGrad.addColorStop(0.5, 'rgba(10, 4, 1, 0.34)');
    hipGrad.addColorStop(0.54, 'rgba(16, 7, 2, 0.2)');
    hipGrad.addColorStop(0.76, 'rgba(255, 248, 230, 0.16)');
    hipGrad.addColorStop(1, 'rgba(14, 6, 2, 0.46)');
  } else {
    hipGrad.addColorStop(0, 'rgba(14, 6, 2, 0.44)');
    hipGrad.addColorStop(0.26, 'rgba(255, 248, 230, 0.16)');
    hipGrad.addColorStop(0.5, 'rgba(255, 246, 224, 0.1)');
    hipGrad.addColorStop(0.74, 'rgba(255, 248, 230, 0.15)');
    hipGrad.addColorStop(1, 'rgba(14, 6, 2, 0.46)');
  }
  ctx.fillStyle = hipGrad;
  ctx.fillRect(-210, waistTopY - 6, 420, 236);

  // Deep crotch & inner-thigh ambient occlusion shadow
  const crotchAo = ctx.createRadialGradient(0, crotchArchY + 6, 8, 0, crotchArchY + 12, 138);
  crotchAo.addColorStop(0, 'rgba(10, 4, 1, 0.42)');
  crotchAo.addColorStop(0.45, 'rgba(14, 6, 2, 0.16)');
  crotchAo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = crotchAo;
  ctx.fillRect(-160, crotchArchY - 120, 320, 260);

  const isTailoredWaist =
    tpl === 'pantalon-sastre-marino' || tpl === 'pantalon-cacao-chevron';

  // 4. Tailored Drapery Tension Whispers & Craftsmanship Details (Front vs Back)
  if (isBackView) {
    ctx.fillStyle = 'rgba(12, 5, 2, 0.34)';
    ctx.fillRect(-2, waistTopY + 34, 4, crotchArchY - waistTopY - 26);
    [-1, 1].forEach((dir) => {
      ctx.strokeStyle = 'rgba(12, 5, 2, 0.24)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(dir * 16, crotchArchY - 2);
      ctx.quadraticCurveTo(dir * 86, crotchArchY + 14, dir * 158, crotchArchY - 8);
      ctx.stroke();

      const px = dir < 0 ? -128 : 42;
      const py = -10;
      const pw = 86;
      const ph = 72;
      ctx.save();
      ctx.fillStyle = 'rgba(12, 5, 2, 0.2)';
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, [4, 4, 14, 14]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 244, 218, 0.22)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = bTrim;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(px - 2, py - 4, pw + 4, 11);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(12, 5, 2, 0.42)';
      ctx.fillRect(px - 2, py + 7, pw + 4, 3);
      ctx.fillStyle = bCord;
      ctx.beginPath();
      ctx.arc(px + pw * 0.5, py + 19, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  } else {
    [-1, 1].forEach((dir) => {
      ctx.strokeStyle = 'rgba(14, 6, 2, 0.18)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(dir * 12, crotchArchY - 22);
      ctx.quadraticCurveTo(dir * 66, crotchArchY - 18, dir * 126, crotchArchY - 46);
      ctx.stroke();

      // Tailored slanted side pocket seam
      ctx.strokeStyle = 'rgba(14, 6, 2, 0.38)';
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      ctx.moveTo(dir * 126, waistTopY + 34);
      ctx.quadraticCurveTo(dir * 158, waistTopY + 78, dir * 168, waistTopY + 132);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 246, 224, 0.22)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(dir * 122, waistTopY + 36);
      ctx.quadraticCurveTo(dir * 154, waistTopY + 80, dir * 164, waistTopY + 132);
      ctx.stroke();
    });

    // Tailored fly placket J-stitch
    ctx.strokeStyle = 'rgba(14, 6, 2, 0.36)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, waistTopY + 34);
    ctx.lineTo(0, crotchArchY - 4);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 246, 224, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, waistTopY + 36);
    ctx.lineTo(12, crotchArchY - 22);
    ctx.quadraticCurveTo(12, crotchArchY - 6, 0, crotchArchY - 4);
    ctx.stroke();
  }

  // 5. Curved Waistband matching each garment's tailored or ribbed style!
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-162, waistTopY - 2);
  ctx.quadraticCurveTo(0, waistTopY + 12, 162, waistTopY - 2);
  ctx.lineTo(168, waistTopY + 30);
  ctx.quadraticCurveTo(0, waistTopY + 44, -168, waistTopY + 30);
  ctx.closePath();
  ctx.fillStyle = isTailoredWaist ? garment.palette[0] : bTrim;
  ctx.globalAlpha = isTailoredWaist ? 0.52 : 0.22;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.clip();

  if (isTailoredWaist) {
    // Sleek horizontal tailored waistband lines
    ctx.strokeStyle = 'rgba(255, 246, 224, 0.18)';
    ctx.lineWidth = 1.6;
    [8, 18, 28].forEach((dy) => {
      ctx.beginPath();
      ctx.moveTo(-165, waistTopY + dy);
      ctx.quadraticCurveTo(0, waistTopY + dy + 12, 165, waistTopY + dy);
      ctx.stroke();
    });
  } else {
    for (let wx = -156; wx <= 156; wx += 8) {
      ctx.strokeStyle = wx % 16 === 0 ? 'rgba(255, 246, 224, 0.24)' : 'rgba(14, 6, 2, 0.26)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(wx, waistTopY - 4);
      ctx.lineTo(wx, waistTopY + 46);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(16, 7, 2, 0.42)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-164, waistTopY + 30);
  ctx.quadraticCurveTo(0, waistTopY + 44, 164, waistTopY + 30);
  ctx.stroke();

  // Front Waistband Hardware: Side clasp / Belt loops & button / Braided drawstring for all 480 bottoms!
  if (!isBackView) {
    if (tpl === 'pantalon-sastre-marino') {
      // Structured overlap tab + metallic side buckle clasp
      ctx.save();
      ctx.strokeStyle = bTrim;
      ctx.lineWidth = 3.5;
      ctx.strokeRect(108, waistTopY + 9, 18, 16);
      ctx.fillStyle = bCord;
      ctx.fillRect(114, waistTopY + 12, 5, 10);
      ctx.restore();
    } else if (tpl === 'pantalon-cacao-chevron') {
      // Neat tailored belt loops + center waist button
      ctx.save();
      [-92, 92].forEach((lx) => {
        ctx.fillStyle = bBase;
        ctx.strokeStyle = 'rgba(24, 10, 4, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(lx - 7, waistTopY + 2, 14, 34, 3);
        ctx.fill();
        ctx.stroke();
      });
      ctx.fillStyle = bTrim;
      ctx.strokeStyle = '#3b200a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-18, waistTopY + 20, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else {
      // Braided drawstring in each design's exact palette cord color!
      const cordHex =
        tpl === 'bermuda-taller-burdeos' ? bCord : bTrim;
      ctx.save();
      ctx.shadowColor = 'rgba(14, 6, 2, 0.45)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 3.5;
      ctx.strokeStyle = cordHex;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-8, waistTopY + 20);
      ctx.quadraticCurveTo(-20, waistTopY + 66, -13, waistTopY + 112);
      ctx.moveTo(8, waistTopY + 20);
      ctx.quadraticCurveTo(20, waistTopY + 66, 13, waistTopY + 112);
      ctx.stroke();
      // Subtle bow loops on Bermuda & Jogger cords
      if (isShorts || tpl === 'jogger-escultor-oliva') {
        ctx.lineWidth = 4.6;
        ctx.beginPath();
        ctx.ellipse(-18, waistTopY + 24, 15, 8, -0.35, 0, Math.PI * 2);
        ctx.ellipse(18, waistTopY + 24, 15, 8, 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = cordHex;
      ctx.beginPath();
      ctx.ellipse(0, waistTopY + 20, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = bCord;
      ctx.beginPath();
      ctx.arc(-13, waistTopY + 114, 3.8, 0, Math.PI * 2);
      ctx.arc(13, waistTopY + 114, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore(); // end bottoms clip

  // Crisp stylized digital-art ink outline around the entire continuous bottom silhouette!
  ctx.save();
  ctx.strokeStyle = 'rgba(34, 18, 8, 0.62)';
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  traceBottomsPath();
  ctx.stroke();
  ctx.restore();
}

/* ============================================================================
   ONE-PIECE ANATOMICAL TOP TAILORING ENGINE (ALL 6 BESPOKE STYLIZED TOPS,
   FRONT & BACK, CONTINUOUS SHOULDER-TO-WRIST SILHOUETTE ACROSS ALL 20 POSES)
============================================================================ */

function drawTailoredButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r = 7.5,
  baseHex = '#C6923A',
  rimHex = '#3D220A'
) {
  ctx.save();
  ctx.shadowColor = 'rgba(12, 5, 1, 0.48)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2.5;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 1, x, y, r);
  g.addColorStop(0, '#F8E09B');
  g.addColorStop(0.48, baseHex);
  g.addColorStop(1, '#6C4514');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = rimHex;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Inner engraved rim + 2 tiny stitch holes
  ctx.strokeStyle = 'rgba(255, 244, 210, 0.38)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.66, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = rimHex;
  ctx.beginPath();
  ctx.arc(x - r * 0.22, y, 1.3, 0, Math.PI * 2);
  ctx.arc(x + r * 0.22, y, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawUnifiedStylizedTop(
  ctx: CanvasRenderingContext2D,
  pattern: CanvasPattern | string,
  garment: DressingRoomGarment,
  isBackView: boolean,
  armL: ArmKinematics,
  armR: ArmKinematics
) {
  const tpl = garment.baseTemplateId || garment.id;
  const sil = garment.silhouetteKind || 'sweater';
  const baseHex = garment.palette[0] || '#DEC098';
  const trimHex = garment.palette[1] || '#1E2E4A';
  const accentHex = garment.palette[2] || '#D4A146';
  const darkBase = shadeHex(baseHex, 0.72);
  const deepBase = shadeHex(baseHex, 0.56);

  const isTunica = tpl === 'tunica-vitruvio-lino';
  const isVest = tpl === 'chaleco-taller-oliva' || sil === 'vest';
  const isCardigan = tpl === 'cardigan-atelier-azul' || sil === 'cardigan';
  const isTerracota = tpl === 'jersey-geometrico-terracota' || garment.stitchPattern === 'jacquard';
  const isJacket = tpl === 'chaqueta-corta-atelier' || sil === 'jacket';
  const isHoodie = tpl === 'sudadera-capucha-arena' || sil === 'hoodie';
  const hasSleeves = !isVest && sil !== 'scarf';

  // Exact anatomical landmarks in chest-local coords (origin = [510, 488] front / [510, 492] back)
  const neckTopY = isHoodie ? -246 : -242;
  const neckW = isHoodie ? 80 : isVest ? 74 : 78;
  const armpitY = -36;
  const armpitW = isJacket ? 154 : isHoodie ? 156 : 148;
  const waistW = isJacket ? 146 : isHoodie ? 150 : isVest ? 142 : 144;
  const hemW = isJacket ? 154 : isHoodie ? 154 : isVest ? 148 : 152;
  const hemY = isJacket ? 216 : isHoodie ? 214 : isVest ? 190 : 210;

  // Compute continuous anatomical sleeve rails for both arms (L = -1, R = +1)
  const buildArmGeo = (arm: ArmKinematics, side: 'L' | 'R') => {
    const sign = side === 'L' ? -1 : 1;
    const u1 = unitVec(arm.el[0] - arm.sh[0], arm.el[1] - arm.sh[1]);
    const u2 = unitVec(arm.wr[0] - arm.el[0], arm.wr[1] - arm.el[1]);
    // Outward/top normal (points UP/OUTWARD across all 20 arm poses!)
    const n1Out: Vec2 = side === 'L' ? [-u1[1], u1[0]] : [u1[1], -u1[0]];
    const n2Out: Vec2 = side === 'L' ? [-u2[1], u2[0]] : [u2[1], -u2[0]];
    const nMidOut = unitVec(n1Out[0] + n2Out[0], n1Out[1] + n2Out[1]);

    // Athletic tailored sleeve taper across resting and raised poses
    const rSh = isHoodie ? 82 : isJacket ? 80 : 78;
    const rEl = isHoodie ? 58 : 54;
    const rWr = isJacket ? 40 : 38;

    const neckPt: Vec2 = [sign * neckW, neckTopY];
    const shCap = addScaled(arm.sh, n1Out, rSh * 1.02);
    // Lift shoulder bridge smoothly above trapezius & deltoid dome in EVERY pose (rest, T-pose, raised!)
    const bridgeMid = mixPt(neckPt, shCap, 0.54);
    const shCrest: Vec2 = [
      bridgeMid[0] + sign * 8,
      Math.min(bridgeMid[1] - 18, Math.min(shCap[1] - 8, -214)),
    ];

    const midUpOut = addScaled(mixPt(arm.sh, arm.el, 0.5), n1Out, (rSh + rEl) * 0.51);
    const elOut = addScaled(arm.el, nMidOut, rEl * 1.03);
    const midLoOut = addScaled(mixPt(arm.el, arm.wr, 0.52), n2Out, (rEl + rWr) * 0.51);
    const wrOut = addScaled(arm.wr, n2Out, rWr);
    const wrLip = addScaled(arm.wr, u2, rWr * 0.2);
    const wrIn = addScaled(arm.wr, n2Out, -rWr);
    const midLoIn = addScaled(mixPt(arm.el, arm.wr, 0.52), n2Out, -(rEl + rWr) * 0.49);
    const elIn = addScaled(arm.el, nMidOut, -rEl * 0.94);

    const shBot = addScaled(arm.sh, n1Out, -rSh * 0.8);
    const midUpIn = addScaled(mixPt(arm.sh, arm.el, 0.5), n1Out, -(rSh * 0.82 + rEl) * 0.48);
    const armpit: Vec2 = [sign * armpitW, armpitY];
    const pitCtrl: Vec2 = [
      mixPt(shBot, armpit, 0.52)[0],
      Math.max(shBot[1], armpitY - 12),
    ];

    return {
      side,
      sign,
      arm,
      u1,
      u2,
      n1Out,
      n2Out,
      nMidOut,
      rSh,
      rEl,
      rWr,
      neckPt,
      shCrest,
      shCap,
      midUpOut,
      elOut,
      midLoOut,
      wrOut,
      wrLip,
      wrIn,
      midLoIn,
      elIn,
      midUpIn,
      shBot,
      pitCtrl,
      armpit,
    };
  };

  const aL = buildArmGeo(armL, 'L');
  const aR = buildArmGeo(armR, 'R');

  // Trace the ONE UNBROKEN CONTINUOUS SILHOUETTE (with true open anatomical neckline!)
  const traceTopSilhouette = () => {
    ctx.beginPath();

    // 1. TOP NECKLINE OPENING (left neck edge -> neckline -> right neck edge)
    ctx.moveTo(-neckW, neckTopY);
    if (isBackView) {
      ctx.quadraticCurveTo(0, neckTopY + 22, neckW, neckTopY);
    } else if (isTunica) {
      // Henley neckline with sharp central laced V-slit exposing real bronze sternum!
      ctx.quadraticCurveTo(-48, -214, -18, -208);
      ctx.lineTo(0, -124);
      ctx.lineTo(18, -208);
      ctx.quadraticCurveTo(48, -214, neckW, neckTopY);
    } else if (isVest) {
      // Crisp deep tailored waistcoat V-neck exposing real neck & collarbones
      ctx.quadraticCurveTo(-36, -152, 0, -76);
      ctx.quadraticCurveTo(36, -152, neckW, neckTopY);
    } else if (isCardigan) {
      // Deep shawl-collar cardigan V-neck
      ctx.quadraticCurveTo(-38, -148, 0, -68);
      ctx.quadraticCurveTo(38, -148, neckW, neckTopY);
    } else if (isJacket) {
      // Double-breasted peak-lapel blazer V-opening
      ctx.quadraticCurveTo(-34, -152, 0, -78);
      ctx.quadraticCurveTo(34, -152, neckW, neckTopY);
    } else if (isHoodie) {
      // Sculpted hooded collar arch under chin
      ctx.quadraticCurveTo(0, -196, neckW, neckTopY);
    } else {
      // Classic crew-neck sweater (Terracota)
      ctx.quadraticCurveTo(0, -206, neckW, neckTopY);
    }

    if (isVest) {
      // SLEEVELESS TAILORED WAISTCOAT (sculpted armholes exposing muscular deltoids & arms!)
      ctx.quadraticCurveTo(126, -222, 152, -202);
      ctx.quadraticCurveTo(132, -108, 158, -24);
      ctx.quadraticCurveTo(148, 86, hemW, hemY);
      if (isBackView) {
        ctx.quadraticCurveTo(0, hemY + 24, -hemW, hemY);
      } else {
        // Iconic pointed twin-tip gentleman's waistcoat front hem!
        ctx.lineTo(54, hemY + 34);
        ctx.lineTo(0, hemY + 6);
        ctx.lineTo(-54, hemY + 34);
        ctx.lineTo(-hemW, hemY);
      }
      ctx.quadraticCurveTo(-148, 86, -158, -24);
      ctx.quadraticCurveTo(-132, -108, -152, -202);
      ctx.quadraticCurveTo(-126, -222, -neckW, neckTopY);
    } else {
      // CONTINUOUS ONE-PIECE SLEEVED SILHOUETTE (Right shoulder -> Right wrist -> Right waist -> Hem -> Left waist -> Left wrist -> Left shoulder)
      // Right shoulder bridge & sleeve
      ctx.quadraticCurveTo(aR.shCrest[0], aR.shCrest[1], aR.shCap[0], aR.shCap[1]);
      ctx.quadraticCurveTo(aR.midUpOut[0], aR.midUpOut[1], aR.elOut[0], aR.elOut[1]);
      ctx.quadraticCurveTo(aR.midLoOut[0], aR.midLoOut[1], aR.wrOut[0], aR.wrOut[1]);
      ctx.quadraticCurveTo(aR.wrLip[0], aR.wrLip[1], aR.wrIn[0], aR.wrIn[1]);
      ctx.quadraticCurveTo(aR.midLoIn[0], aR.midLoIn[1], aR.elIn[0], aR.elIn[1]);
      ctx.quadraticCurveTo(aR.midUpIn[0], aR.midUpIn[1], aR.pitCtrl[0], aR.pitCtrl[1]);
      ctx.quadraticCurveTo(aR.armpit[0] + 6, aR.armpit[1] - 4, aR.armpit[0], aR.armpit[1]);

      // Right athletic V-taper torso side down to curved hem
      ctx.quadraticCurveTo(waistW, 74, hemW, hemY);
      ctx.quadraticCurveTo(0, hemY + 14, -hemW, hemY);
      ctx.quadraticCurveTo(-waistW, 74, aL.armpit[0], aL.armpit[1]);

      // Left armpit & continuous sleeve back up to left neck
      ctx.quadraticCurveTo(aL.armpit[0] - 6, aL.armpit[1] - 4, aL.pitCtrl[0], aL.pitCtrl[1]);
      ctx.quadraticCurveTo(aL.midUpIn[0], aL.midUpIn[1], aL.elIn[0], aL.elIn[1]);
      ctx.quadraticCurveTo(aL.midLoIn[0], aL.midLoIn[1], aL.wrIn[0], aL.wrIn[1]);
      ctx.quadraticCurveTo(aL.wrLip[0], aL.wrLip[1], aL.wrOut[0], aL.wrOut[1]);
      ctx.quadraticCurveTo(aL.midLoOut[0], aL.midLoOut[1], aL.elOut[0], aL.elOut[1]);
      ctx.quadraticCurveTo(aL.midUpOut[0], aL.midUpOut[1], aL.shCap[0], aL.shCap[1]);
      ctx.quadraticCurveTo(aL.shCrest[0], aL.shCrest[1], -neckW, neckTopY);
    }

    ctx.closePath();
  };

  // --- PRE-PASS: SLEEK BEHIND-NECK HOOD LINING ARCHING NATURALLY BEHIND HIS NAPE ---
  if (!isBackView && isHoodie) {
    ctx.save();
    // Subtle inner hood lining visible cleanly behind the neck sides (never a flat oval on chest!)
    ctx.beginPath();
    ctx.moveTo(-84, -244);
    ctx.quadraticCurveTo(-96, -268, -56, -270);
    ctx.quadraticCurveTo(0, -254, 56, -270);
    ctx.quadraticCurveTo(96, -268, 84, -244);
    ctx.quadraticCurveTo(0, -214, -84, -244);
    ctx.closePath();
    ctx.fillStyle = trimHex;
    ctx.fill();
    ctx.strokeStyle = 'rgba(28, 16, 8, 0.56)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Sculpted outer crochet hood rim framing both sides of his neck
    ctx.beginPath();
    ctx.moveTo(-94, -238);
    ctx.quadraticCurveTo(-108, -274, -62, -278);
    ctx.quadraticCurveTo(-42, -270, -54, -260);
    ctx.quadraticCurveTo(-82, -262, -74, -236);
    ctx.closePath();
    ctx.fillStyle = pattern;
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 18, 8, 0.58)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(94, -238);
    ctx.quadraticCurveTo(108, -274, 62, -278);
    ctx.quadraticCurveTo(42, -270, 54, -260);
    ctx.quadraticCurveTo(82, -262, 74, -236);
    ctx.closePath();
    ctx.fillStyle = pattern;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // --- MAIN CLIPPED ONE-PIECE GARMENT BODY + SLEEVES ---
  ctx.save();
  traceTopSilhouette();
  ctx.fillStyle = baseHex;
  ctx.fill();
  ctx.clip();

  // 1. Paint lengthwise stylized weave along BOTH sleeves (upper arm + elbow-bisected forearm)
  const paintSleeveFabric = (g: ReturnType<typeof buildArmGeo>) => {
    const topBright = g.side === 'L';
    paintLengthwiseKnitBand(ctx, pattern, g.arm.sh, g.arm.el, g.rSh + 18, topBright, g.rSh + 22, 28);

    // Forearm weave clipped along elbow bisector
    ctx.save();
    ctx.beginPath();
    const farOut = addScaled(g.elOut, g.nMidOut, 70);
    const farIn = addScaled(g.elIn, g.nMidOut, -70);
    const farWrOut = addScaled(addScaled(g.wrOut, g.u2, 70), g.n2Out, 70);
    const farWrIn = addScaled(addScaled(g.wrIn, g.u2, 70), g.n2Out, -70);
    ctx.moveTo(farOut[0], farOut[1]);
    ctx.lineTo(farWrOut[0], farWrOut[1]);
    ctx.lineTo(farWrIn[0], farWrIn[1]);
    ctx.lineTo(farIn[0], farIn[1]);
    ctx.closePath();
    ctx.clip();
    paintLengthwiseKnitBand(ctx, pattern, g.arm.el, g.arm.wr, g.rEl + 18, topBright, 26, 36);
    ctx.restore();

    // Geometric diamond tapestry band across upper sleeves (rotates dynamically with each arm!)
    if (isTerracota) {
      ctx.save();
      const bandCenter = mixPt(g.arm.sh, g.arm.el, 0.24);
      const ang = Math.atan2(g.u1[1], g.u1[0]);
      ctx.translate(bandCenter[0], bandCenter[1]);
      ctx.rotate(ang);
      ctx.fillStyle = accentHex;
      ctx.fillRect(-32, -g.rSh - 14, 64, (g.rSh + 14) * 2);
      ctx.fillStyle = trimHex;
      ctx.fillRect(-29, -g.rSh - 14, 5, (g.rSh + 14) * 2);
      ctx.fillRect(24, -g.rSh - 14, 5, (g.rSh + 14) * 2);
      for (let sy = -g.rSh - 6; sy <= g.rSh + 6; sy += 30) {
        ctx.fillStyle = trimHex;
        ctx.beginPath();
        ctx.moveTo(0, sy - 12);
        ctx.lineTo(17, sy);
        ctx.lineTo(0, sy + 12);
        ctx.lineTo(-17, sy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = accentHex;
        ctx.beginPath();
        ctx.moveTo(0, sy - 6);
        ctx.lineTo(8.5, sy);
        ctx.lineTo(0, sy + 6);
        ctx.lineTo(-8.5, sy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = trimHex;
        ctx.beginPath();
        ctx.arc(0, sy, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Dynamic inner-elbow drapery compression folds
    const bendIntensity = clamp(0.16 + Math.abs(g.arm.bendDeg) * 0.008, 0.14, 0.42);
    ctx.save();
    const elGrad = ctx.createRadialGradient(
      g.elIn[0] + g.nMidOut[0] * 10,
      g.elIn[1] + g.nMidOut[1] * 10,
      4,
      g.arm.el[0],
      g.arm.el[1],
      g.rEl * 1.25
    );
    elGrad.addColorStop(0, `rgba(12, 5, 1, ${bendIntensity})`);
    elGrad.addColorStop(0.55, `rgba(16, 7, 2, ${bendIntensity * 0.35})`);
    elGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = elGrad;
    ctx.fillRect(g.arm.el[0] - 110, g.arm.el[1] - 110, 220, 220);

    [-12, 0, 12].forEach((offset, idx) => {
      const start = addScaled(addScaled(g.elIn, g.u2, offset), g.nMidOut, 4);
      const ctrl = addScaled(addScaled(g.arm.el, g.u2, offset * 0.5), g.nMidOut, -5 + idx * 3.5);
      const end = addScaled(g.arm.el, g.nMidOut, g.rEl * 0.36);
      ctx.strokeStyle = `rgba(12, 5, 1, ${bendIntensity * (idx === 1 ? 0.58 : 0.36)})`;
      ctx.lineWidth = idx === 1 ? 3.8 : 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(start[0], start[1]);
      ctx.quadraticCurveTo(ctrl[0], ctrl[1], end[0], end[1]);
      ctx.stroke();
    });
    ctx.restore();

    // Soft armpit gusset shadow
    const pitGrad = ctx.createRadialGradient(g.armpit[0], g.armpit[1], 4, g.armpit[0], g.armpit[1], 76);
    pitGrad.addColorStop(0, 'rgba(14, 6, 2, 0.34)');
    pitGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pitGrad;
    ctx.fillRect(g.armpit[0] - 90, g.armpit[1] - 90, 180, 180);

    // Curved 3D stylized wrist cuff finish matching each top's exact palette & archetype!
    const cuffDepth = isTunica ? 24 : isJacket ? 22 : 28;
    const cuffStart = addScaled(g.arm.wr, g.u2, -cuffDepth);
    const cOut = addScaled(cuffStart, g.n2Out, g.rWr + 8);
    const cIn = addScaled(cuffStart, g.n2Out, -(g.rWr + 8));
    const cLip = addScaled(cuffStart, g.u2, g.rWr * 0.2);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cOut[0], cOut[1]);
    ctx.quadraticCurveTo(cLip[0], cLip[1], cIn[0], cIn[1]);
    ctx.lineTo(g.wrIn[0] + g.u2[0] * 18, g.wrIn[1] + g.u2[1] * 18);
    ctx.lineTo(g.wrOut[0] + g.u2[0] * 18, g.wrOut[1] + g.u2[1] * 18);
    ctx.closePath();

    if (isTunica) {
      ctx.fillStyle = accentHex;
      ctx.globalAlpha = 0.32;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = accentHex;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(cOut[0], cOut[1]);
      ctx.quadraticCurveTo(cLip[0], cLip[1], cIn[0], cIn[1]);
      ctx.stroke();
      const steps = 9;
      for (let i = 0; i < steps; i++) {
        const t0 = i / steps;
        const t1 = (i + 0.5) / steps;
        const t2 = (i + 1) / steps;
        const b0 = addScaled(mixPt(cOut, cIn, t0), g.u2, Math.sin(t0 * Math.PI) * 7 + 11);
        const b1 = addScaled(mixPt(cOut, cIn, t1), g.u2, Math.sin(t1 * Math.PI) * 7 + 4);
        const b2 = addScaled(mixPt(cOut, cIn, t2), g.u2, Math.sin(t2 * Math.PI) * 7 + 11);
        const b3 = addScaled(mixPt(cOut, cIn, t1), g.u2, Math.sin(t1 * Math.PI) * 7 + 18);
        ctx.beginPath();
        ctx.moveTo(b0[0], b0[1]);
        ctx.lineTo(b1[0], b1[1]);
        ctx.lineTo(b2[0], b2[1]);
        ctx.lineTo(b3[0], b3[1]);
        ctx.closePath();
        ctx.stroke();
      }
    } else if (isJacket) {
      // Clean tailored jacket cuff + 2 tiny metallic cuff buttons on outer wrist
      ctx.strokeStyle = 'rgba(20, 9, 3, 0.34)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cOut[0], cOut[1]);
      ctx.quadraticCurveTo(cLip[0], cLip[1], cIn[0], cIn[1]);
      ctx.stroke();
      const b1 = addScaled(addScaled(g.arm.wr, g.u2, -16), g.n2Out, g.rWr * 0.48);
      const b2 = addScaled(addScaled(g.arm.wr, g.u2, -30), g.n2Out, g.rWr * 0.48);
      drawTailoredButton(ctx, b1[0], b1[1], 3.8, trimHex, '#3A1E0A');
      drawTailoredButton(ctx, b2[0], b2[1], 3.8, trimHex, '#3A1E0A');
    } else {
      // Chunky ribbed knit cuff (Cardigan, Terracota, Hoodie)
      ctx.fillStyle = baseHex;
      ctx.globalAlpha = 0.42;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(20, 9, 3, 0.44)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cOut[0], cOut[1]);
      ctx.quadraticCurveTo(cLip[0], cLip[1], cIn[0], cIn[1]);
      ctx.stroke();
      const steps = 14;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const base = mixPt(cOut, cIn, t);
        const arch = Math.sin(t * Math.PI) * 7;
        const p0 = addScaled(base, g.u2, arch);
        const p1 = addScaled(p0, g.u2, 34);
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 246, 224, 0.26)' : 'rgba(18, 8, 2, 0.34)';
        ctx.lineWidth = i % 2 === 0 ? 2 : 1.7;
        ctx.beginPath();
        ctx.moveTo(p0[0], p0[1]);
        ctx.lineTo(p1[0], p1[1]);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  if (hasSleeves) {
    paintSleeveFabric(aL);
    paintSleeveFabric(aR);
  }

  // 2. Paint upright torso fabric clipped smoothly across the central anatomical chest/back zone
  ctx.save();
  if (hasSleeves) {
    ctx.beginPath();
    ctx.moveTo(-neckW - 14, -270);
    ctx.lineTo(neckW + 14, -270);
    ctx.quadraticCurveTo(156, -214, 174, -152);
    ctx.quadraticCurveTo(166, -92, armpitW + 4, armpitY);
    ctx.lineTo(hemW + 30, hemY + 40);
    ctx.lineTo(-hemW - 30, hemY + 40);
    ctx.lineTo(-armpitW - 4, armpitY);
    ctx.quadraticCurveTo(-166, -92, -174, -152);
    ctx.quadraticCurveTo(-156, -214, -neckW - 14, -270);
    ctx.closePath();
    ctx.clip();
  }

  // Custom user-uploaded garment image support
  const customImg =
    garment.isCustom && garment.photoDataUrl ? getCachedCustomImage(garment.photoDataUrl) : null;
  if (customImg && !isBackView) {
    ctx.drawImage(customImg, -172, -242, 344, 460);
  } else {
    ctx.fillStyle = pattern;
    ctx.fillRect(-200, -264, 400, 512);
  }

  // Sculpted 3D anatomical torso volume shading (Front pectorals/ribcage vs Back shoulder blades/spine)
  const torsoWrap = ctx.createLinearGradient(-176, 0, 176, 0);
  if (isBackView) {
    torsoWrap.addColorStop(0, 'rgba(14, 6, 2, 0.44)');
    torsoWrap.addColorStop(0.24, 'rgba(255, 248, 232, 0.16)');
    torsoWrap.addColorStop(0.46, 'rgba(18, 8, 2, 0.12)');
    torsoWrap.addColorStop(0.5, 'rgba(12, 5, 1, 0.22)');
    torsoWrap.addColorStop(0.54, 'rgba(18, 8, 2, 0.12)');
    torsoWrap.addColorStop(0.76, 'rgba(255, 248, 232, 0.16)');
    torsoWrap.addColorStop(1, 'rgba(14, 6, 2, 0.44)');
  } else {
    torsoWrap.addColorStop(0, 'rgba(14, 6, 2, 0.42)');
    torsoWrap.addColorStop(0.24, 'rgba(255, 248, 232, 0.15)');
    torsoWrap.addColorStop(0.5, 'rgba(255, 246, 224, 0.1)');
    torsoWrap.addColorStop(0.76, 'rgba(255, 248, 232, 0.14)');
    torsoWrap.addColorStop(1, 'rgba(14, 6, 2, 0.42)');
  }
  ctx.fillStyle = torsoWrap;
  ctx.fillRect(-190, -260, 380, 500);

  // Overhead warm key highlight + subtle lower hem depth falloff
  const vStudio = ctx.createLinearGradient(0, -244, 0, hemY + 24);
  vStudio.addColorStop(0, 'rgba(255, 248, 232, 0.14)');
  vStudio.addColorStop(0.45, 'rgba(255, 244, 222, 0.02)');
  vStudio.addColorStop(1, 'rgba(14, 6, 2, 0.22)');
  ctx.fillStyle = vStudio;
  ctx.fillRect(-190, -260, 380, 500);

  // Subtle under-pectoral muscular drape shadow on Front view
  if (!isBackView) {
    const pecGrad = ctx.createLinearGradient(0, -96, 0, -28);
    pecGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    pecGrad.addColorStop(0.5, 'rgba(16, 7, 2, 0.12)');
    pecGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pecGrad;
    ctx.beginPath();
    ctx.ellipse(0, -60, 146, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- 3. BESPOKE 1-TO-1 TAILORING DETAILS FOR EVERY SINGLE TOP (FRONT & BACK) ---

  if (isTunica) {
    // TÚNICA HENLEY CROCHET (dynamically adapts to all 80 colorways!)
    if (!isBackView) {
      ctx.save();
      ctx.strokeStyle = deepBase;
      ctx.globalAlpha = 0.42;
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      for (let row = 0; row < 3; row++) {
        const cy = -88 + row * 34;
        for (let col = -1; col <= 1; col++) {
          const cx = col * 32;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 16);
          ctx.lineTo(cx + 15, cy);
          ctx.lineTo(cx, cy + 16);
          ctx.lineTo(cx - 15, cy);
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255, 250, 238, 0.34)';
      ctx.lineWidth = 2;
      [-58, 58].forEach((bx) => {
        ctx.beginPath();
        ctx.moveTo(bx, -206);
        ctx.lineTo(bx, 174);
        ctx.stroke();
        ctx.strokeStyle = deepBase;
        ctx.globalAlpha = 0.38;
        ctx.lineWidth = 3.2;
        for (let y = -196; y < 170; y += 18) {
          ctx.beginPath();
          ctx.moveTo(bx - 6, y);
          ctx.quadraticCurveTo(bx + 6, y + 9, bx - 6, y + 18);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });

      // Ribbed Henley collar + stitched V-slit placket border
      ctx.strokeStyle = darkBase;
      ctx.lineWidth = 14;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-neckW, neckTopY);
      ctx.quadraticCurveTo(-48, -214, -18, -208);
      ctx.lineTo(0, -120);
      ctx.lineTo(18, -208);
      ctx.quadraticCurveTo(48, -214, neckW, neckTopY);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(34, 18, 8, 0.45)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = darkBase;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(-neckW - 8, neckTopY);
      ctx.quadraticCurveTo(0, neckTopY + 24, neckW + 8, neckTopY);
      ctx.lineTo(neckW + 12, neckTopY + 26);
      ctx.quadraticCurveTo(0, neckTopY + 46, -neckW - 12, neckTopY + 26);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Geometric diamond crochet border along bottom hem in accentHex!
    ctx.save();
    ctx.fillStyle = accentHex;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(-170, hemY - 26, 340, 38);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-170, hemY - 26);
    ctx.quadraticCurveTo(0, hemY - 12, 170, hemY - 26);
    ctx.moveTo(-170, hemY - 2);
    ctx.quadraticCurveTo(0, hemY + 12, 170, hemY - 2);
    ctx.stroke();
    for (let gx = -160; gx <= 160; gx += 22) {
      const arch = (1 - Math.pow(gx / 166, 2)) * 11;
      const cy = hemY - 14 + arch;
      ctx.beginPath();
      ctx.moveTo(gx, cy);
      ctx.lineTo(gx + 11, cy - 8);
      ctx.lineTo(gx + 22, cy);
      ctx.lineTo(gx + 11, cy + 8);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  } else if (isVest) {
    // CHALECO DE TALLER CROCHET (all 80 colorways!)
    if (!isBackView) {
      ctx.save();
      [-86, 86].forEach((px) => {
        ctx.strokeStyle = 'rgba(16, 12, 8, 0.34)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(px * 0.92, -160);
        ctx.quadraticCurveTo(px * 0.84, 12, px * 0.94, 178);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 248, 232, 0.16)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(px * 0.92 + 3, -160);
        ctx.quadraticCurveTo(px * 0.84 + 3, 12, px * 0.94 + 3, 178);
        ctx.stroke();
      });

      // Tailored darker binding along V-neck
      ctx.strokeStyle = deepBase;
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(-neckW, neckTopY);
      ctx.quadraticCurveTo(-36, -152, 0, -76);
      ctx.quadraticCurveTo(36, -152, neckW, neckTopY);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 248, 230, 0.22)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Center button placket strip
      ctx.fillStyle = deepBase;
      ctx.globalAlpha = 0.48;
      ctx.fillRect(-13, -78, 26, 274);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(16, 12, 8, 0.48)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -78);
      ctx.lineTo(0, hemY + 6);
      ctx.stroke();

      // Twin slanted lower welt pockets
      [-1, 1].forEach((dir) => {
        const x0 = dir * 48;
        const x1 = dir * 124;
        ctx.strokeStyle = deepBase;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x0, 108);
        ctx.lineTo(x1, 96);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 248, 230, 0.22)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x0, 104);
        ctx.lineTo(x1, 92);
        ctx.stroke();
      });

      // 5 waistcoat buttons + stitched buttonholes
      [-52, -4, 44, 92, 140].forEach((by) => {
        ctx.strokeStyle = 'rgba(18, 12, 8, 0.65)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-12, by);
        ctx.lineTo(12, by);
        ctx.stroke();
        drawTailoredButton(ctx, 0, by, 7.2, trimHex, '#2A1D0B');
      });
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(16, 12, 8, 0.34)';
      ctx.fillRect(-2, -210, 4, 412);
      ctx.save();
      ctx.fillStyle = deepBase;
      ctx.fillRect(-134, 68, 268, 22);
      ctx.strokeStyle = 'rgba(14, 10, 6, 0.56)';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(-134, 68, 268, 22);
      ctx.strokeStyle = trimHex;
      ctx.lineWidth = 4;
      ctx.strokeRect(-14, 64, 28, 30);
      ctx.beginPath();
      ctx.moveTo(0, 64);
      ctx.lineTo(0, 94);
      ctx.stroke();
      ctx.restore();
    }
  } else if (isCardigan) {
    // CÁRDIGAN SOLAPA CHAL CROCHET (all 80 colorways!)
    if (!isBackView) {
      ctx.save();
      [-104, -56, 56, 104].forEach((cx) => {
        ctx.strokeStyle = 'rgba(255, 246, 228, 0.16)';
        ctx.lineWidth = 4.5;
        for (let y = -164; y < 170; y += 22) {
          ctx.beginPath();
          ctx.moveTo(cx - 8, y);
          ctx.quadraticCurveTo(cx + 8, y + 11, cx - 8, y + 22);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(8, 10, 18, 0.34)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cx - 12, -172);
        ctx.lineTo(cx - 12, 174);
        ctx.moveTo(cx + 12, -172);
        ctx.lineTo(cx + 12, 174);
        ctx.stroke();
      });

      // Twin tailored square patch pockets with crisp contrast trimHex bar!
      [-1, 1].forEach((dir) => {
        const px = dir < 0 ? -136 : 44;
        const py = 74;
        const pw = 92;
        const ph = 86;
        ctx.fillStyle = deepBase;
        ctx.globalAlpha = 0.36;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, [4, 4, 12, 12]);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(12, 8, 6, 0.52)';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.fillStyle = trimHex;
        ctx.fillRect(px + 1, py, pw - 2, 10);
        ctx.strokeStyle = 'rgba(42, 26, 10, 0.42)';
        ctx.lineWidth = 1.6;
        ctx.strokeRect(px + 1, py, pw - 2, 10);
      });

      // Ribbed bottom hem + contrast edge piping
      ctx.fillStyle = darkBase;
      ctx.fillRect(-168, hemY - 26, 336, 42);
      for (let hx = -160; hx <= 160; hx += 8) {
        ctx.strokeStyle = hx % 16 === 0 ? 'rgba(255, 246, 224, 0.16)' : 'rgba(6, 12, 24, 0.38)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(hx, hemY - 26);
        ctx.lineTo(hx, hemY + 18);
        ctx.stroke();
      }
      ctx.strokeStyle = trimHex;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-162, hemY - 3);
      ctx.quadraticCurveTo(0, hemY + 11, 162, hemY - 3);
      ctx.stroke();

      // Plush ribbed SHAWL COLLAR + center placket with trimHex contrast piping!
      ctx.beginPath();
      ctx.moveTo(-neckW - 22, -234);
      ctx.quadraticCurveTo(-86, -138, -22, -56);
      ctx.lineTo(-22, hemY + 16);
      ctx.lineTo(22, hemY + 16);
      ctx.lineTo(22, -56);
      ctx.quadraticCurveTo(86, -138, neckW + 22, -234);
      ctx.lineTo(neckW, neckTopY);
      ctx.quadraticCurveTo(38, -148, 0, -68);
      ctx.quadraticCurveTo(-38, -148, -neckW, neckTopY);
      ctx.closePath();
      ctx.fillStyle = darkBase;
      ctx.fill();

      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 246, 226, 0.16)';
      ctx.lineWidth = 2.2;
      for (let sy = -238; sy <= 210; sy += 9) {
        ctx.beginPath();
        ctx.moveTo(-108, sy);
        ctx.lineTo(108, sy);
        ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = trimHex;
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-neckW - 20, -232);
      ctx.quadraticCurveTo(-84, -138, -21, -56);
      ctx.lineTo(-21, hemY + 6);
      ctx.moveTo(neckW + 20, -232);
      ctx.quadraticCurveTo(84, -138, 21, -56);
      ctx.lineTo(21, hemY + 6);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(6, 12, 24, 0.56)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -68);
      ctx.lineTo(0, hemY + 12);
      ctx.stroke();
      [-40, 12, 64, 116, 168].forEach((by) => {
        drawTailoredButton(ctx, 0, by, 7.6, accentHex, '#3A2108');
      });
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-neckW - 18, neckTopY - 2);
      ctx.quadraticCurveTo(0, neckTopY + 24, neckW + 18, neckTopY - 2);
      ctx.lineTo(neckW + 22, neckTopY + 38);
      ctx.quadraticCurveTo(0, neckTopY + 62, -neckW - 22, neckTopY + 38);
      ctx.closePath();
      ctx.fillStyle = darkBase;
      ctx.fill();
      ctx.strokeStyle = trimHex;
      ctx.lineWidth = 4.8;
      ctx.beginPath();
      ctx.moveTo(-neckW - 20, neckTopY + 36);
      ctx.quadraticCurveTo(0, neckTopY + 60, neckW + 20, neckTopY + 36);
      ctx.stroke();

      ctx.fillStyle = darkBase;
      ctx.fillRect(-168, hemY - 26, 336, 42);
      ctx.strokeStyle = trimHex;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-162, hemY - 3);
      ctx.quadraticCurveTo(0, hemY + 11, 162, hemY - 3);
      ctx.stroke();
      ctx.restore();
    }
  } else if (isTerracota) {
    // JERSEY TAPESTRY / GEOMÉTRICO CROCHET (all 80 colorways!)
    ctx.save();
    const bandTop = isBackView ? -174 : -170;
    const bandH = 104;
    ctx.fillStyle = accentHex;
    ctx.fillRect(-190, bandTop, 380, bandH);

    ctx.fillStyle = trimHex;
    ctx.fillRect(-190, bandTop + 5, 380, 5);
    ctx.fillRect(-190, bandTop + bandH - 10, 380, 5);

    ctx.strokeStyle = trimHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = -184; x <= 184; x += 16) {
      ctx.moveTo(x, bandTop + 18);
      ctx.lineTo(x + 8, bandTop + 12);
      ctx.lineTo(x + 16, bandTop + 18);
      ctx.moveTo(x, bandTop + bandH - 18);
      ctx.lineTo(x + 8, bandTop + bandH - 12);
      ctx.lineTo(x + 16, bandTop + bandH - 18);
    }
    ctx.stroke();

    const midY = bandTop + bandH * 0.5;
    for (let gx = -176; gx <= 176; gx += 44) {
      ctx.fillStyle = trimHex;
      ctx.beginPath();
      ctx.moveTo(gx, midY - 28);
      ctx.lineTo(gx + 20, midY);
      ctx.lineTo(gx, midY + 28);
      ctx.lineTo(gx - 20, midY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = baseHex;
      ctx.beginPath();
      ctx.moveTo(gx, midY - 18);
      ctx.lineTo(gx + 13, midY);
      ctx.lineTo(gx, midY + 18);
      ctx.lineTo(gx - 13, midY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = accentHex;
      ctx.beginPath();
      ctx.moveTo(gx, midY - 9);
      ctx.lineTo(gx + 6.5, midY);
      ctx.lineTo(gx, midY + 9);
      ctx.lineTo(gx - 6.5, midY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = trimHex;
      ctx.beginPath();
      ctx.arc(gx, midY, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = trimHex;
      ctx.beginPath();
      ctx.moveTo(gx + 22, midY - 8);
      ctx.lineTo(gx + 28, midY);
      ctx.lineTo(gx + 22, midY + 8);
      ctx.lineTo(gx + 16, midY);
      ctx.closePath();
      ctx.fill();
    }

    if (!isBackView) {
      ctx.strokeStyle = 'rgba(24, 12, 6, 0.22)';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      [-1, 1].forEach((dir) => {
        ctx.beginPath();
        ctx.moveTo(dir * 138, 126);
        ctx.quadraticCurveTo(dir * 74, 146, dir * 18, 134);
        ctx.stroke();
      });
    }

    // Chunky ribbed crew-neck collar in darker base yarn
    ctx.beginPath();
    ctx.moveTo(-neckW - 10, neckTopY - 2);
    ctx.quadraticCurveTo(0, isBackView ? neckTopY + 22 : -206, neckW + 10, neckTopY - 2);
    ctx.lineTo(neckW + 14, neckTopY + 26);
    ctx.quadraticCurveTo(0, isBackView ? neckTopY + 46 : -178, -neckW - 14, neckTopY + 26);
    ctx.closePath();
    ctx.fillStyle = darkBase;
    ctx.fill();
    ctx.strokeStyle = 'rgba(28, 12, 6, 0.42)';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    for (let rx = -76; rx <= 76; rx += 8) {
      ctx.strokeStyle = rx % 16 === 0 ? 'rgba(255, 240, 218, 0.22)' : 'rgba(28, 12, 6, 0.34)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(rx, neckTopY + 2);
      ctx.lineTo(rx, neckTopY + 48);
      ctx.stroke();
    }

    // Chunky ribbed bottom hem
    ctx.fillStyle = darkBase;
    ctx.fillRect(-168, hemY - 28, 336, 44);
    ctx.fillStyle = 'rgba(28, 12, 6, 0.34)';
    ctx.fillRect(-168, hemY - 28, 336, 3);
    for (let hx = -160; hx <= 160; hx += 8) {
      ctx.strokeStyle = hx % 16 === 0 ? 'rgba(255, 240, 218, 0.22)' : 'rgba(28, 12, 6, 0.32)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(hx, hemY - 26);
      ctx.lineTo(hx, hemY + 18);
      ctx.stroke();
    }
    ctx.restore();
  } else if (isJacket) {
    // CHAQUETA CRUZADA DE ATELIER CROCHET (all 80 colorways!)
    if (!isBackView) {
      ctx.save();
      ctx.fillStyle = 'rgba(22, 10, 4, 0.26)';
      ctx.fillRect(16, -78, 8, hemY + 96);
      ctx.strokeStyle = 'rgba(18, 8, 3, 0.56)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(16, -78);
      ctx.lineTo(16, hemY + 16);
      ctx.stroke();

      [-92, 92].forEach((dx) => {
        ctx.strokeStyle = 'rgba(20, 9, 3, 0.3)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(dx, -22);
        ctx.quadraticCurveTo(dx * 0.9, 64, dx * 0.96, 174);
        ctx.stroke();
      });

      [-1, 1].forEach((dir) => {
        const px = dir < 0 ? -136 : 44;
        const py = 94;
        const pw = 92;
        const ph = 78;
        ctx.fillStyle = 'rgba(22, 10, 4, 0.22)';
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, [4, 4, 14, 14]);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20, 9, 3, 0.52)';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 232, 200, 0.16)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 3);
        ctx.lineTo(px + pw - 4, py + 3);
        ctx.stroke();
      });

      [-1, 1].forEach((dir) => {
        ctx.save();
        ctx.shadowColor = 'rgba(16, 7, 2, 0.44)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = dir * 3;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.moveTo(dir * neckW, neckTopY);
        ctx.quadraticCurveTo(dir * 102, -214, dir * 106, -184);
        ctx.lineTo(dir * 86, -166);
        ctx.lineTo(dir * 116, -148);
        ctx.quadraticCurveTo(dir * 74, -84, dir * 14, -42);
        ctx.lineTo(0, -78);
        ctx.quadraticCurveTo(dir * 34, -152, dir * neckW, neckTopY);
        ctx.closePath();

        ctx.fillStyle = pattern;
        ctx.fill();
        ctx.shadowColor = 'transparent';

        const lGrad = ctx.createLinearGradient(0, -230, dir * 110, -50);
        lGrad.addColorStop(0, 'rgba(255, 240, 214, 0.16)');
        lGrad.addColorStop(1, 'rgba(24, 10, 3, 0.14)');
        ctx.fillStyle = lGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(24, 10, 4, 0.62)';
        ctx.lineWidth = 2.4;
        ctx.lineJoin = 'round';
        ctx.stroke();

        if (dir > 0) {
          ctx.strokeStyle = 'rgba(24, 10, 4, 0.72)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(64, -146);
          ctx.lineTo(80, -140);
          ctx.stroke();
        }
        ctx.restore();
      });

      // 6 metallic buttons in crisp 2×3 double-breasted grid using trimHex!
      [-14, 44, 102].forEach((by) => {
        drawTailoredButton(ctx, -40, by, 7.6, trimHex, '#3A1E0A');
        drawTailoredButton(ctx, 40, by, 7.6, trimHex, '#3A1E0A');
      });

      ctx.strokeStyle = 'rgba(20, 9, 3, 0.44)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-158, hemY - 10);
      ctx.quadraticCurveTo(0, hemY + 4, 158, hemY - 10);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-neckW - 8, neckTopY - 2);
      ctx.quadraticCurveTo(0, neckTopY + 22, neckW + 8, neckTopY - 2);
      ctx.lineTo(neckW + 12, neckTopY + 30);
      ctx.quadraticCurveTo(0, neckTopY + 50, -neckW - 12, neckTopY + 30);
      ctx.closePath();
      ctx.fillStyle = deepBase;
      ctx.globalAlpha = 0.52;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(20, 9, 3, 0.56)';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(18, 8, 3, 0.36)';
      ctx.fillRect(-2, -192, 4, 412);
      ctx.fillStyle = 'rgba(255, 236, 206, 0.14)';
      ctx.fillRect(2, -192, 2, 412);
      ctx.restore();
    }
  } else if (isHoodie) {
    // SUDADERA CON CAPUCHA CROCHET (all 80 colorways!)
    ctx.save();
    [-1, 1].forEach((dir) => {
      ctx.strokeStyle = 'rgba(28, 18, 10, 0.34)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(dir * neckW, neckTopY + 4);
      ctx.quadraticCurveTo(dir * 124, -124, dir * armpitW, armpitY);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 250, 238, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(dir * (neckW - 3), neckTopY + 6);
      ctx.quadraticCurveTo(dir * 120, -122, dir * (armpitW - 4), armpitY + 2);
      ctx.stroke();
    });

    if (!isBackView) {
      // Sculpted kangaroo pouch pocket
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-86, 66);
      ctx.lineTo(86, 66);
      ctx.lineTo(112, 126);
      ctx.lineTo(100, 166);
      ctx.quadraticCurveTo(0, 176, -100, 166);
      ctx.lineTo(-112, 126);
      ctx.closePath();
      ctx.fillStyle = darkBase;
      ctx.globalAlpha = 0.26;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(34, 22, 12, 0.44)';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      [-1, 1].forEach((dir) => {
        ctx.strokeStyle = 'rgba(24, 14, 8, 0.48)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(dir * 86, 68);
        ctx.lineTo(dir * 110, 126);
        ctx.stroke();
      });
      ctx.restore();

      // Thick ribbed bottom hem in shaded base yarn
      ctx.fillStyle = darkBase;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(-168, hemY - 28, 336, 44);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(34, 22, 12, 0.32)';
      ctx.fillRect(-168, hemY - 28, 336, 3);
      for (let hx = -160; hx <= 160; hx += 8) {
        ctx.strokeStyle = hx % 16 === 0 ? 'rgba(255, 250, 240, 0.28)' : 'rgba(28, 16, 8, 0.28)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(hx, hemY - 26);
        ctx.lineTo(hx, hemY + 18);
        ctx.stroke();
      }

      // Sculpted crossover hood collar seam + metallic eyelets + braided drawstrings in trimHex!
      ctx.strokeStyle = 'rgba(32, 18, 10, 0.46)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-neckW, neckTopY);
      ctx.quadraticCurveTo(0, -194, neckW, neckTopY);
      ctx.stroke();

      [-22, 22].forEach((ex) => {
        ctx.fillStyle = accentHex;
        ctx.strokeStyle = '#3E250E';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, -196, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.save();
      ctx.shadowColor = 'rgba(24, 12, 4, 0.38)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 3;
      ctx.strokeStyle = trimHex;
      ctx.lineWidth = 5.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-22, -194);
      ctx.quadraticCurveTo(-28, -124, -22, -66);
      ctx.moveTo(22, -194);
      ctx.quadraticCurveTo(28, -124, 22, -66);
      ctx.stroke();
      ctx.fillStyle = accentHex;
      ctx.fillRect(-24.5, -68, 5, 11);
      ctx.fillRect(19.5, -68, 5, 11);
      ctx.restore();
    } else {
      ctx.fillStyle = darkBase;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(-168, hemY - 28, 336, 44);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(34, 22, 12, 0.32)';
      ctx.fillRect(-168, hemY - 28, 336, 3);
      for (let hx = -160; hx <= 160; hx += 8) {
        ctx.strokeStyle = hx % 16 === 0 ? 'rgba(255, 250, 240, 0.28)' : 'rgba(28, 16, 8, 0.28)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(hx, hemY - 26);
        ctx.lineTo(hx, hemY + 18);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Subtle set-in shoulder seam shadow on non-hoodie sleeved tops for realistic tailored structure
  if (hasSleeves && !isHoodie) {
    [-1, 1].forEach((dir) => {
      ctx.strokeStyle = 'rgba(18, 8, 2, 0.2)';
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(dir * 144, -206);
      ctx.quadraticCurveTo(dir * 164, -124, dir * armpitW, armpitY);
      ctx.stroke();
    });
  }

  ctx.restore(); // end torso clip

  // Subtle top shoulder & outer arm rim sheen inside main silhouette clip
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 248, 230, 0.18)';
  ctx.lineWidth = 2.2;
  if (hasSleeves) {
    [aL, aR].forEach((g) => {
      ctx.beginPath();
      ctx.moveTo(g.neckPt[0], g.neckPt[1]);
      ctx.quadraticCurveTo(g.shCrest[0], g.shCrest[1], g.shCap[0], g.shCap[1]);
      ctx.quadraticCurveTo(g.midUpOut[0], g.midUpOut[1], g.elOut[0], g.elOut[1]);
      ctx.quadraticCurveTo(g.midLoOut[0], g.midLoOut[1], g.wrOut[0], g.wrOut[1]);
      ctx.stroke();
    });
  }
  ctx.restore();

  ctx.restore(); // end main silhouette clip

  // --- POST-CLIP CRISP STYLIZED DIGITAL-ART INK CONTOUR ---
  ctx.save();
  ctx.strokeStyle = 'rgba(34, 18, 8, 0.62)';
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  traceTopSilhouette();
  ctx.stroke();
  ctx.restore();

  // --- POST-CLIP 3D OVERLAY DETAILS (HENLEY LEATHER LACES OVER OPEN SLIT + DRAPED BACK HOOD) ---
  if (isTunica && !isBackView) {
    // 8 burnished brass eyelets + crisscrossed leather lacing right across the open V-slit over his bronze chest!
    ctx.save();
    const laceY = [-196, -176, -156, -138];
    const laceX = [16, 13, 10, 7];

    // Crisscross cords with soft drop shadow onto skin using trimHex
    ctx.shadowColor = 'rgba(20, 8, 2, 0.42)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 2;
    ctx.strokeStyle = trimHex;
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    for (let i = 0; i < laceY.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-laceX[i], laceY[i]);
      ctx.lineTo(laceX[i + 1], laceY[i + 1]);
      ctx.moveTo(laceX[i], laceY[i]);
      ctx.lineTo(-laceX[i + 1], laceY[i + 1]);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-laceX[3], laceY[3]);
    ctx.quadraticCurveTo(-18, -112, -12, -92);
    ctx.moveTo(laceX[3], laceY[3]);
    ctx.quadraticCurveTo(18, -112, 12, -92);
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(-12, -91, 2.8, 0, Math.PI * 2);
    ctx.arc(12, -91, 2.8, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < laceY.length; i++) {
      [-1, 1].forEach((dir) => {
        ctx.fillStyle = accentHex;
        ctx.strokeStyle = '#4A2B12';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(dir * laceX[i], laceY[i], 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  if (isHoodie && isBackView) {
    // Draped crochet hood resting organically across his upper back + contrast inner rim!
    ctx.save();
    ctx.shadowColor = 'rgba(16, 6, 1, 0.44)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 7;

    ctx.beginPath();
    ctx.moveTo(-88, -238);
    ctx.quadraticCurveTo(0, -252, 88, -238);
    ctx.quadraticCurveTo(0, -214, -88, -238);
    ctx.closePath();
    ctx.fillStyle = trimHex;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-92, -234);
    ctx.quadraticCurveTo(0, -220, 92, -234);
    ctx.quadraticCurveTo(132, -152, 82, -78);
    ctx.quadraticCurveTo(0, -46, -82, -78);
    ctx.quadraticCurveTo(-132, -152, -92, -234);
    ctx.closePath();
    ctx.fillStyle = pattern;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.save();
    ctx.clip();
    const hGrad = ctx.createRadialGradient(0, -152, 16, 0, -148, 134);
    hGrad.addColorStop(0, 'rgba(255, 248, 232, 0.16)');
    hGrad.addColorStop(0.55, 'rgba(24, 12, 4, 0.16)');
    hGrad.addColorStop(1, 'rgba(16, 7, 2, 0.46)');
    ctx.fillStyle = hGrad;
    ctx.fillRect(-144, -256, 288, 224);

    // Center hood seam fold
    ctx.strokeStyle = 'rgba(54, 34, 16, 0.36)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(0, -230);
    ctx.lineTo(0, -64);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(34, 18, 8, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  // Silence unused variable lint if trimHex/accentHex are reserved for custom palettes
  void trimHex;
  void accentHex;
}

/* ============================================================================
   MAIN STATIC PHOTOREALISTIC 2D VITRUVIAN STUDIO COMPONENT
============================================================================ */

export interface VitruvianMan3DHandle {
  captureSnapshot: () => string | null;
}

interface VitruvianMan3DProps {
  selectedTop: DressingRoomGarment | null;
  selectedBottom: DressingRoomGarment | null;
  onClearTop: () => void;
  onClearBottom: () => void;
  onUndressAll: () => void;
  onCaptureToNotebook?: (dataUrl: string) => void;
}

export const VitruvianMan3D = React.forwardRef<VitruvianMan3DHandle, VitruvianMan3DProps>(
  (
    {
      selectedTop,
      selectedBottom,
      onClearTop,
      onClearBottom,
      onUndressAll,
      onCaptureToNotebook,
    },
    ref
  ) => {
    const stageWrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [spritePack, setSpritePack] = useState<VitruvianSpritePack | null>(null);
    const [backSpritePack, setBackSpritePack] = useState<VitruvianSpritePack | null>(null);
    const [viewSide, setViewSide] = useState<ViewSide>('front');
    const [showClothing, setShowClothing] = useState(true);
    const [effectMode, setEffectMode] = useState<StudioEffectMode>('dorada');
    const [poseIndex, setPoseIndex] = useState(0);
    const [stageSize, setStageSize] = useState({ w: 460, h: 660 });
    const poseDeckRef = useRef<number[]>([]);

    const activePoseEntry = CURATED_20_POSES[poseIndex] || CURATED_20_POSES[0];
    const pose = activePoseEntry.pose;

    useEffect(() => {
      if (selectedTop || selectedBottom) setShowClothing(true);
    }, [selectedTop?.id, selectedBottom?.id]);

    useEffect(() => {
      let alive = true;
      void loadVitruvianSpritePack()
        .then((pack) => {
          if (alive) setSpritePack(pack);
        })
        .catch(() => {});
      void loadVitruvianBackSpritePack()
        .then((pack) => {
          if (alive) setBackSpritePack(pack);
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, []);

    useEffect(() => {
      const el = stageWrapRef.current;
      if (!el) return;
      const obs = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.max(240, Math.floor(entry.contentRect.width));
          const h = Math.max(360, Math.floor(entry.contentRect.height));
          setStageSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
        }
      });
      obs.observe(el);
      return () => obs.disconnect();
    }, []);

    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        if (!canvasRef.current) return null;
        return canvasRef.current.toDataURL('image/png');
      },
    }));

    /* ========================================================================
       STATIC HIGH-DPI 2D PHOTOREALISTIC RENDERER
    ======================================================================== */
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = stageSize.w;
      const H = stageSize.h;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const eff = EFFECT_META[effectMode];

      /* 1. BAROQUE GOLDEN PARCHMENT STUDIO BACKDROP */
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, eff.bgTop);
      bgGrad.addColorStop(0.58, eff.bgMid);
      bgGrad.addColorStop(1, eff.bgBot);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      const spot = ctx.createRadialGradient(
        W * 0.5,
        H * 0.34,
        W * 0.05,
        W * 0.5,
        H * 0.44,
        W * 0.72
      );
      spot.addColorStop(0, eff.spotlight);
      spot.addColorStop(1, 'rgba(255, 240, 200, 0)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, W, H);

      const vig = ctx.createRadialGradient(
        W * 0.5,
        H * 0.5,
        Math.min(W, H) * 0.32,
        W * 0.5,
        H * 0.5,
        Math.max(W, H) * 0.72
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, eff.vignette);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      /* 2. GOLDEN VITRUVIAN CIRCLE, PROPORTION GEOMETRY & MARBLE PEDESTAL */
      const topSafe = 74; // Generous headroom so top badges NEVER touch curly hair!
      const bottomFloorY = H - 46;
      const availH = Math.max(240, bottomFloorY - topSafe);
      const availW = W - 20;
      const scale = Math.min(availH / 1525, availW / 1060);
      const cx = W * 0.5;
      const ringCenterY = topSafe + availH * 0.49;
      const ringRadius = Math.min(W * 0.455, availH * 0.485);

      if (eff.showGeometry) {
        ctx.save();
        ctx.strokeStyle = 'rgba(176, 126, 44, 0.22)';
        ctx.lineWidth = 1;
        const sqHalf = ringRadius * 0.84;
        ctx.strokeRect(cx - sqHalf, bottomFloorY - sqHalf * 2, sqHalf * 2, sqHalf * 2);
        [0.25, 0.5, 0.75].forEach((f) => {
          const ly = bottomFloorY - sqHalf * 2 * f;
          ctx.beginPath();
          ctx.moveTo(cx - sqHalf - 10, ly);
          ctx.lineTo(cx + sqHalf + 10, ly);
          ctx.stroke();
        });
        ctx.restore();
      }

      ctx.save();
      const ringGrad = ctx.createLinearGradient(
        cx - ringRadius,
        ringCenterY - ringRadius,
        cx + ringRadius,
        ringCenterY + ringRadius
      );
      ringGrad.addColorStop(0, '#f3ce74');
      ringGrad.addColorStop(0.5, eff.ringGold);
      ringGrad.addColorStop(1, '#8c5a12');
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(cx, ringCenterY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(218, 168, 72, 0.34)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, ringCenterY, ringRadius - 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const pedRx = Math.min(W * 0.42, 200);
      const pedRy = Math.max(17, pedRx * 0.135);
      const pedY = bottomFloorY + 4;

      ctx.save();
      ctx.fillStyle = 'rgba(66, 36, 8, 0.22)';
      ctx.beginPath();
      ctx.ellipse(cx, pedY + 9, pedRx * 1.03, pedRy * 1.08, 0, 0, Math.PI * 2);
      ctx.fill();

      const brassWall = ctx.createLinearGradient(cx - pedRx, pedY, cx + pedRx, pedY);
      brassWall.addColorStop(0, '#8d5b14');
      brassWall.addColorStop(0.32, '#e8bc62');
      brassWall.addColorStop(0.55, '#fff0be');
      brassWall.addColorStop(0.8, '#c58a29');
      brassWall.addColorStop(1, '#7a4d0e');
      ctx.fillStyle = brassWall;
      ctx.beginPath();
      ctx.ellipse(cx, pedY + 5, pedRx, pedRy, 0, 0, Math.PI * 2);
      ctx.fill();

      const marbleGrad = ctx.createRadialGradient(cx, pedY - 3, 6, cx, pedY, pedRx);
      marbleGrad.addColorStop(0, '#fff9ec');
      marbleGrad.addColorStop(0.72, '#eedcb8');
      marbleGrad.addColorStop(1, '#d2b076');
      ctx.fillStyle = marbleGrad;
      ctx.beginPath();
      ctx.ellipse(cx, pedY, pedRx * 0.96, pedRy * 0.92, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c58c2e';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();

      const isBackView = viewSide === 'back';
      const activeSpritePack = isBackView ? backSpritePack : spritePack;
      if (!activeSpritePack) return;

      const activePivots = isBackView ? BACK_PIVOTS : FRONT_PIVOTS;
      const activePose = isBackView ? mapPoseForBackView(pose) : pose;

      /* 3. FORWARD KINEMATICS FOR AUTOMATIC FLOOR GROUNDING & FEET SHADOWS */
      const rad = (deg: number) => (deg * Math.PI) / 180;
      const rotPt = (px: number, py: number, a: number): [number, number] => {
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        return [px * ca - py * sa, px * sa + py * ca];
      };

      const computeFootSoleInFigureSpace = (side: 'L' | 'R'): [number, number] => {
        const thId = side === 'L' ? 'thighL' : 'thighR';
        const shId = side === 'L' ? 'shinL' : 'shinR';
        const ftId = side === 'L' ? 'footL' : 'footR';
        const pPel = activePivots.pelvis;
        const pTh = activePivots[thId];
        const pSh = activePivots[shId];
        const pFt = activePivots[ftId];
        const soleOffset: [number, number] = isBackView
          ? [side === 'L' ? -24 : 26, 1524 - pFt[1]]
          : [side === 'L' ? -44 : 52, 1526 - pFt[1]];

        const aPel = rad(activePose.pelvisTilt);
        const aTh = aPel + rad(activePose[thId]);
        const aSh = aTh + rad(activePose[shId]);
        const aFt = aSh + rad(activePose[ftId]);

        const vHip = rotPt(pTh[0] - pPel[0], pTh[1] - pPel[1], aPel);
        const vKnee = rotPt(pSh[0] - pTh[0], pSh[1] - pTh[1], aTh);
        const vAnk = rotPt(pFt[0] - pSh[0], pFt[1] - pSh[1], aSh);
        const vSole = rotPt(soleOffset[0], soleOffset[1], aFt);

        return [
          activePose.pelvisShiftX + vHip[0] + vKnee[0] + vAnk[0] + vSole[0],
          vHip[1] + vKnee[1] + vAnk[1] + vSole[1],
        ];
      };

      const soleL = computeFootSoleInFigureSpace('L');
      const soleR = computeFootSoleInFigureSpace('R');
      const lowestSoleY = Math.max(soleL[1], soleR[1]);
      const pelvisScreenX = cx + activePose.pelvisShiftX * scale;
      const pelvisScreenY = bottomFloorY - lowestSoleY * scale;

      [soleL, soleR].forEach(([sx, sy]) => {
        const fx = cx + sx * scale;
        const lift = Math.max(0, (lowestSoleY - sy) * scale);
        const alpha = clamp(0.28 - lift * 0.0025, 0.08, 0.28);
        const radX = (44 + lift * 0.16) * scale * 1.15;
        const radY = Math.max(5, 11 * scale);
        const shGrad = ctx.createRadialGradient(fx, bottomFloorY + 1, 2, fx, bottomFloorY + 1, radX);
        shGrad.addColorStop(0, `rgba(48, 24, 6, ${alpha})`);
        shGrad.addColorStop(1, 'rgba(48, 24, 6, 0)');
        ctx.fillStyle = shGrad;
        ctx.beginPath();
        ctx.ellipse(fx, bottomFloorY + 1, radX, radY, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      /* 4. PREPARE PURE SEAMLESS STYLIZED WEAVE PATTERNS FOR ALL 12 GARMENTS */
      const activeTop = showClothing ? selectedTop : null;
      const activeBottom = showClothing ? selectedBottom : null;

      let bottomPattern: CanvasPattern | string = activeBottom?.palette[0] || '#1E2E4A';
      if (activeBottom) {
        const tile = getStylizedWeaveTile(activeBottom);
        bottomPattern = ctx.createPattern(tile, 'repeat') || activeBottom.palette[0];
      }

      const isExactRestPose = isExactRestPoseData(activePose);

      const drawPartSprite = (id: SpriteRegionId) => {
        const sp = activeSpritePack.parts[id];
        ctx.drawImage(sp.canvas, sp.offsetX, sp.offsetY);
      };

      /* 5. HIERARCHICAL 2D VITRUVIAN + UNIFIED STYLIZED CLOTHING COMPOSITING (FRONT & BACK) */
      ctx.save();
      ctx.filter = eff.filterCss;
      ctx.translate(pelvisScreenX, pelvisScreenY);
      ctx.scale(scale, scale);
      ctx.rotate(rad(activePose.pelvisTilt));

      const bSil = activeBottom?.silhouetteKind || 'trousers';
      const tSil = activeTop?.silhouetteKind || 'sweater';

      // --- STEP 1: RENDER PHOTOREALISTIC HUMAN FIGURE (FRONT OR EXACT BACK) ---
      // In exact rest pose (Pose 1/20), draw the 100% untouched original photograph with ZERO cuts!
      if (isExactRestPose) {
        ctx.drawImage(
          activeSpritePack.fullCanvas,
          -activePivots.pelvis[0],
          -activePivots.pelvis[1]
        );
      } else {
        const renderBareLegChain = (side: 'L' | 'R') => {
          const thId = side === 'L' ? 'thighL' : 'thighR';
          const shId = side === 'L' ? 'shinL' : 'shinR';
          const ftId = side === 'L' ? 'footL' : 'footR';
          const pPel = activePivots.pelvis;
          const pTh = activePivots[thId];
          const pSh = activePivots[shId];
          const pFt = activePivots[ftId];

          ctx.save();
          ctx.translate(pTh[0] - pPel[0], pTh[1] - pPel[1]);
          ctx.rotate(rad(activePose[thId]));

          // Shin + Foot behind feathered knee cap of Thigh for natural continuous knee blend
          ctx.save();
          ctx.translate(pSh[0] - pTh[0], pSh[1] - pTh[1]);
          ctx.rotate(rad(activePose[shId]));
          ctx.save();
          ctx.translate(pFt[0] - pSh[0], pFt[1] - pSh[1]);
          ctx.rotate(rad(activePose[ftId]));
          drawPartSprite(ftId);
          ctx.restore();
          drawPartSprite(shId);
          ctx.restore();

          drawPartSprite(thId);
          ctx.restore();
        };

        renderBareLegChain('L');
        renderBareLegChain('R');
        drawPartSprite('pelvis');

        ctx.save();
        ctx.translate(
          activePivots.abs[0] - activePivots.pelvis[0],
          activePivots.abs[1] - activePivots.pelvis[1]
        );
        ctx.rotate(rad(activePose.abs));
        drawPartSprite('abs');

        ctx.save();
        ctx.translate(
          activePivots.chest[0] - activePivots.abs[0],
          activePivots.chest[1] - activePivots.abs[1]
        );
        ctx.rotate(rad(activePose.chest));

        // Bare arms tuck smoothly behind feathered pectoral / scapula contour (zero armpit flaps!)
        const renderBareArmChain = (side: 'L' | 'R') => {
          const upId = side === 'L' ? 'armUpperL' : 'armUpperR';
          const loId = side === 'L' ? 'armLowerL' : 'armLowerR';
          const haId = side === 'L' ? 'handL' : 'handR';
          const pCh = activePivots.chest;
          const pUp = activePivots[upId];
          const pLo = activePivots[loId];
          const pHa = activePivots[haId];

          ctx.save();
          ctx.translate(pUp[0] - pCh[0], pUp[1] - pCh[1]);
          ctx.rotate(rad(activePose[upId]));

          // Forearm + Hand behind feathered elbow overlap of Upper Arm
          ctx.save();
          ctx.translate(pLo[0] - pUp[0], pLo[1] - pUp[1]);
          ctx.rotate(rad(activePose[loId]));
          ctx.save();
          ctx.translate(pHa[0] - pLo[0], pHa[1] - pLo[1]);
          ctx.rotate(rad(activePose[haId]));
          drawPartSprite(haId);
          ctx.restore();
          drawPartSprite(loId);
          ctx.restore();

          drawPartSprite(upId);
          ctx.restore();
        };

        renderBareArmChain('L');
        renderBareArmChain('R');
        drawPartSprite('chest');

        ctx.save();
        ctx.translate(
          activePivots.head[0] - activePivots.chest[0],
          activePivots.head[1] - activePivots.chest[1]
        );
        ctx.rotate(rad(activePose.head));
        drawPartSprite('head');
        ctx.restore();

        ctx.restore(); // chest
        ctx.restore(); // abs
      }

      // --- STEP 2: REALISTIC SKIN CONTACT AMBIENT OCCLUSION + CONTINUOUS TAILORED BOTTOMS ---
      if (activeBottom) {
        const computeLegPts = (side: 'L' | 'R') => {
          const thId = side === 'L' ? 'thighL' : 'thighR';
          const shId = side === 'L' ? 'shinL' : 'shinR';
          const ftId = side === 'L' ? 'footL' : 'footR';
          const pPel = activePivots.pelvis;
          const pTh = activePivots[thId];
          const pSh = activePivots[shId];
          const pFt = activePivots[ftId];

          const hip: Vec2 = [pTh[0] - pPel[0], pTh[1] - pPel[1]];
          const aTh = rad(activePose[thId]);
          const aSh = aTh + rad(activePose[shId]);
          const vKn = rotPt(pSh[0] - pTh[0], pSh[1] - pTh[1], aTh);
          const knee: Vec2 = [hip[0] + vKn[0], hip[1] + vKn[1]];
          const vAnk = rotPt(pFt[0] - pSh[0], pFt[1] - pSh[1], aSh);
          const ank: Vec2 = [knee[0] + vAnk[0], knee[1] + vAnk[1]];
          return { hip, knee, ank };
        };

        const legL = computeLegPts('L');
        const legR = computeLegPts('R');

        // A. Real skin contact shadows cast by waistband & trouser/bermuda hems directly onto bare skin!
        ctx.save();
        const waistShadowY = isBackView ? -96 : -88;
        const waistAo = ctx.createLinearGradient(0, waistShadowY - 18, 0, waistShadowY + 12);
        waistAo.addColorStop(0, 'rgba(34, 14, 4, 0)');
        waistAo.addColorStop(0.75, 'rgba(34, 14, 4, 0.22)');
        waistAo.addColorStop(1, 'rgba(20, 8, 2, 0.3)');
        ctx.fillStyle = waistAo;
        ctx.beginPath();
        ctx.ellipse(0, waistShadowY - 2, 142, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        [legL, legR].forEach((lg) => {
          const hemPt = bSil === 'shorts' ? mixPt(lg.hip, lg.knee, 0.83) : mixPt(lg.knee, lg.ank, 0.96);
          const shR = bSil === 'shorts' ? 68 : bSil === 'joggers' ? 42 : 52;
          const hemAo = ctx.createRadialGradient(
            hemPt[0],
            hemPt[1] + 8,
            5,
            hemPt[0],
            hemPt[1] + 12,
            shR
          );
          hemAo.addColorStop(0, 'rgba(28, 12, 3, 0.38)');
          hemAo.addColorStop(0.55, 'rgba(28, 12, 3, 0.14)');
          hemAo.addColorStop(1, 'rgba(28, 12, 3, 0)');
          ctx.fillStyle = hemAo;
          ctx.beginPath();
          ctx.ellipse(hemPt[0], hemPt[1] + 12, shR, 20, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        // B. Single unified seamless tailored trousers / joggers / bermudas!
        drawSeamlessContinuousBottoms(
          ctx,
          bottomPattern,
          activeBottom,
          isBackView,
          legL.hip,
          legL.knee,
          legL.ank,
          legR.hip,
          legR.knee,
          legR.ank,
          activePose.shinL,
          activePose.shinR
        );
      }

      // --- STEP 3: UNIFIED PHOTOREALISTIC TOP COMPOSITING (CONTACT AO + CONTINUOUS SLEEVES + MUSCULAR DRAPE) ---
      if (activeTop) {
        ctx.save();
        ctx.translate(
          activePivots.abs[0] - activePivots.pelvis[0],
          activePivots.abs[1] - activePivots.pelvis[1]
        );
        ctx.rotate(rad(activePose.abs));
        ctx.translate(
          activePivots.chest[0] - activePivots.abs[0],
          activePivots.chest[1] - activePivots.abs[1]
        );
        ctx.rotate(rad(activePose.chest));

        const hasSleeves = tSil !== 'vest' && tSil !== 'scarf';
        const computeArmPts = (side: 'L' | 'R'): ArmKinematics => {
          const upId = side === 'L' ? 'armUpperL' : 'armUpperR';
          const loId = side === 'L' ? 'armLowerL' : 'armLowerR';
          const haId = side === 'L' ? 'handL' : 'handR';
          const pCh = activePivots.chest;
          const pUp = activePivots[upId];
          const pLo = activePivots[loId];
          const pHa = activePivots[haId];

          const sh: Vec2 = [pUp[0] - pCh[0], pUp[1] - pCh[1]];
          const aUp = rad(activePose[upId]);
          const aLo = aUp + rad(activePose[loId]);
          const vEl = rotPt(pLo[0] - pUp[0], pLo[1] - pUp[1], aUp);
          const el: Vec2 = [sh[0] + vEl[0], sh[1] + vEl[1]];
          const vWr = rotPt((pHa[0] - pLo[0]) * 0.96, (pHa[1] - pLo[1]) * 0.96, aLo);
          const wr: Vec2 = [el[0] + vWr[0], el[1] + vWr[1]];
          return { sh, el, wr, bendDeg: activePose[loId] };
        };

        const armL = computeArmPts('L');
        const armR = computeArmPts('R');

        // A. Cast realistic contact ambient occlusion shadows ONTO bare neck, collarbone, wrists & upper trousers!
        ctx.save();
        const neckAo = ctx.createRadialGradient(0, -234, 14, 0, -234, 96);
        neckAo.addColorStop(0, 'rgba(36, 14, 4, 0.34)');
        neckAo.addColorStop(0.6, 'rgba(36, 14, 4, 0.14)');
        neckAo.addColorStop(1, 'rgba(36, 14, 4, 0)');
        ctx.fillStyle = neckAo;
        ctx.beginPath();
        ctx.ellipse(0, -232, 92, 34, 0, 0, Math.PI * 2);
        ctx.fill();

        if (tSil === 'vest') {
          [-1, 1].forEach((dir) => {
            const armAo = ctx.createRadialGradient(dir * 156, -104, 10, dir * 156, -104, 72);
            armAo.addColorStop(0, 'rgba(32, 12, 3, 0.32)');
            armAo.addColorStop(1, 'rgba(32, 12, 3, 0)');
            ctx.fillStyle = armAo;
            ctx.beginPath();
            ctx.ellipse(dir * 156, -104, 34, 84, 0, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        if (hasSleeves) {
          [armL, armR].forEach((arm) => {
            const u = unitVec(arm.wr[0] - arm.el[0], arm.wr[1] - arm.el[1]);
            const tip = addScaled(arm.wr, u, 8);
            const wAo = ctx.createRadialGradient(tip[0], tip[1], 5, tip[0], tip[1], 44);
            wAo.addColorStop(0, 'rgba(30, 12, 3, 0.38)');
            wAo.addColorStop(0.6, 'rgba(30, 12, 3, 0.14)');
            wAo.addColorStop(1, 'rgba(30, 12, 3, 0)');
            ctx.fillStyle = wAo;
            ctx.beginPath();
            ctx.arc(tip[0], tip[1], 42, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        const hemShadow = ctx.createLinearGradient(0, 198, 0, 242);
        hemShadow.addColorStop(0, 'rgba(16, 6, 1, 0.36)');
        hemShadow.addColorStop(0.5, 'rgba(16, 6, 1, 0.14)');
        hemShadow.addColorStop(1, 'rgba(16, 6, 1, 0)');
        ctx.fillStyle = hemShadow;
        ctx.beginPath();
        ctx.ellipse(0, 220, 158, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // B. Composite ONE-PIECE continuous anatomical Top garment onto offscreen canvas for cohesive studio lighting!
        const topCanvas = getTopCompositeCanvas();
        const tctx = topCanvas.getContext('2d')!;
        const tcOx = topCanvas.width * 0.5;
        const tcOy = topCanvas.height * 0.48;
        tctx.clearRect(0, 0, topCanvas.width, topCanvas.height);

        tctx.save();
        tctx.translate(tcOx, tcOy);

        const topTile = getStylizedWeaveTile(activeTop);
        const topPattern =
          tctx.createPattern(topTile, 'repeat') || activeTop.palette[0] || '#DEC098';

        drawUnifiedStylizedTop(tctx, topPattern, activeTop, isBackView, armL, armR);

        // C. Subtle studio atmosphere tint matching Luz Dorada / Claroscuro
        if (effectMode === 'dorada' || effectMode === 'claroscuro') {
          tctx.globalCompositeOperation = 'source-atop';
          tctx.fillStyle =
            effectMode === 'claroscuro'
              ? 'rgba(180, 120, 44, 0.08)'
              : 'rgba(245, 206, 132, 0.05)';
          tctx.fillRect(-560, -400, 1120, 820);
        }

        tctx.restore();

        // Draw unified tailored top onto the Vitruvian with soft grounded studio shadow!
        ctx.save();
        ctx.shadowColor = 'rgba(20, 8, 2, 0.32)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 5;
        ctx.drawImage(topCanvas, -tcOx, -tcOy);
        ctx.restore();

        ctx.restore(); // abs + chest
      }

      ctx.restore(); // pelvis
    }, [
      spritePack,
      backSpritePack,
      viewSide,
      pose,
      selectedTop,
      selectedBottom,
      showClothing,
      effectMode,
      stageSize,
    ]);

    /* ========================================================================
       20-POSE SHUFFLED DECK & EFFECT HANDLERS
    ======================================================================== */
    const handleNextCuratedPose = () => {
      audioEngine.playYarnPluck(3);
      if (poseDeckRef.current.length === 0) {
        // Build freshly shuffled deck of all 20 poses excluding current index first
        const deck = CURATED_20_POSES.map((_, i) => i).filter((i) => i !== poseIndex);
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        poseDeckRef.current = deck;
      }
      const nextIdx = poseDeckRef.current.pop() ?? 0;
      setPoseIndex(nextIdx);
    };

    const handleResetPose = () => {
      audioEngine.playStitchClick();
      setPoseIndex(0);
      poseDeckRef.current = [];
    };

    const handleCycleEffect = () => {
      audioEngine.playToggleChime(true);
      setEffectMode((prev) => {
        const i = EFFECT_ORDER.indexOf(prev);
        return EFFECT_ORDER[(i + 1) % EFFECT_ORDER.length];
      });
    };

    const handleSnapshotClick = () => {
      if (!canvasRef.current || !onCaptureToNotebook) return;
      audioEngine.playSaveChime();
      onCaptureToNotebook(canvasRef.current.toDataURL('image/png'));
    };

    const hasAnyOutfit = Boolean(selectedTop || selectedBottom);
    const activeEffectMeta = EFFECT_META[effectMode];

    return (
      <div className="relative flex-1 flex flex-col rounded-2xl overflow-hidden border-2 border-[#c69138] bg-[#f7ecd7] shadow-[0_14px_30px_rgba(74,42,8,0.22)] select-none min-h-0">
        {/* TOP OVERLAY BAR — CLEANLY ABOVE HEAD WITH ZERO HAIR OVERLAP */}
        <div className="pointer-events-none absolute top-2.5 inset-x-2.5 z-20 flex items-center justify-between gap-1.5">
          <div className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#40230a] border border-[#e0ae4e] text-[#ffebc2] shadow-md shrink-0 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-[#f4c057] shrink-0" />
            <span className="font-display text-[10.5px] font-bold tracking-[0.12em]">
              VITRUVIO 2D
            </span>
          </div>

          <div className="px-2 py-1 rounded-lg bg-[#4a280c]/92 border border-[#d9a64c]/60 text-[#fff3d6] text-[10px] font-medium shadow truncate min-w-0">
            {poseIndex + 1}/{CURATED_20_POSES.length} · {activePoseEntry.title}
          </div>

          <button
            type="button"
            onClick={() => {
              audioEngine.playStitchClick();
              if (hasAnyOutfit && showClothing) {
                setShowClothing(false);
              } else if (hasAnyOutfit) {
                setShowClothing(true);
              } else {
                onUndressAll();
              }
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#40230a] hover:bg-[#57310f] border border-[#d7a246] text-[#ffebc2] text-[11px] font-semibold shadow-md transition-colors cursor-pointer shrink-0"
          >
            {hasAnyOutfit && showClothing ? (
              <>
                <User className="w-3.5 h-3.5 text-[#f4c057]" />
                <span>Sin ropa</span>
              </>
            ) : (
              <>
                <Shirt className="w-3.5 h-3.5 text-[#f4c057]" />
                <span>{hasAnyOutfit ? 'Vestir' : 'Sin prenda'}</span>
              </>
            )}
          </button>
        </div>

        {/* ULTRA-SHARP STATIC 2D PHOTOREALISTIC VITRUVIAN CANVAS */}
        <div ref={stageWrapRef} className="flex-1 w-full min-h-[380px] relative">
          <canvas ref={canvasRef} className="block w-full h-full" />

          {/* ACTIVE WORN GARMENT CHIPS — NEATLY ANCHORED AT THE PEDESTAL FOOT, NEVER COVERING FACE/HAIR */}
          {hasAnyOutfit && showClothing && (
            <div className="pointer-events-none absolute bottom-2 inset-x-2.5 z-20 flex flex-wrap items-center justify-center gap-1.5">
              {selectedTop && (
                <span className="pointer-events-auto inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg bg-[#fbf0db] border border-[#c68d2e] text-[#3d2107] text-[10.5px] font-semibold shadow max-w-[190px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#5d3812]/50"
                    style={{ backgroundColor: selectedTop.palette[0] }}
                  />
                  <span className="truncate">{selectedTop.name}</span>
                  <button
                    type="button"
                    aria-label="Quitar prenda superior"
                    onClick={() => {
                      audioEngine.playEraseBrush();
                      onClearTop();
                    }}
                    className="p-0.5 rounded hover:bg-[#e5c998] cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
              {selectedBottom && (
                <span className="pointer-events-auto inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg bg-[#fbf0db] border border-[#c68d2e] text-[#3d2107] text-[10.5px] font-semibold shadow max-w-[190px]">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-[#5d3812]/50"
                    style={{ backgroundColor: selectedBottom.palette[0] }}
                  />
                  <span className="truncate">{selectedBottom.name}</span>
                  <button
                    type="button"
                    aria-label="Quitar prenda inferior"
                    onClick={() => {
                      audioEngine.playEraseBrush();
                      onClearBottom();
                    }}
                    className="p-0.5 rounded hover:bg-[#e5c998] cursor-pointer"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* COMPACT SINGLE-ROW BOTTOM ACTION BAR WITH FRENTE / ESPALDA VIEW TOGGLE */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-2 bg-[#efe0c2] border-t border-[#cfa158]">
          <button
            type="button"
            onClick={handleNextCuratedPose}
            title="Cambia entre 20 poses naturales de estudio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-b from-[#b87e22] via-[#945e12] to-[#74470a] hover:brightness-110 active:scale-[0.98] border border-[#f2ca78] text-[#fff8e6] text-[11px] font-bold shadow-[0_3px_10px_rgba(92,52,8,0.28)] transition-all cursor-pointer shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#ffe39c]" />
            <span>Nueva Pose</span>
          </button>

          {/* FRENTE / ESPALDA SEGMENTED SWITCH */}
          <div
            role="group"
            aria-label="Vista del Vitruvio"
            className="inline-flex items-center p-0.5 rounded-xl bg-[#e3cea6] border border-[#c9953e] shadow-inner shrink-0"
          >
            <button
              type="button"
              onClick={() => {
                if (viewSide !== 'front') {
                  audioEngine.playToggleChime(true);
                  setViewSide('front');
                }
              }}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                viewSide === 'front'
                  ? 'bg-[#4a2809] text-[#ffefc8] shadow-sm'
                  : 'text-[#5b3510] hover:text-[#331a05]'
              }`}
            >
              Frente
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewSide !== 'back') {
                  audioEngine.playToggleChime(false);
                  setViewSide('back');
                }
              }}
              className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                viewSide === 'back'
                  ? 'bg-[#4a2809] text-[#ffefc8] shadow-sm'
                  : 'text-[#5b3510] hover:text-[#331a05]'
              }`}
            >
              Espalda
            </button>
          </div>

          <button
            type="button"
            onClick={handleCycleEffect}
            title="Cambiar ambiente de iluminación del estudio"
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#fbf1df] hover:bg-[#f4e2c0] border border-[#c9953e] text-[#4a2809] text-[10.5px] font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Sun className="w-3.5 h-3.5 text-[#b57a1c]" />
            <span>{activeEffectMeta.label}</span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleResetPose}
              title="Restablecer pose Vitruviana original"
              className="p-1.5 rounded-xl bg-[#fbf1df] hover:bg-[#f4e2c0] border border-[#cfa158] text-[#4a2809] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {onCaptureToNotebook && (
              <button
                type="button"
                onClick={handleSnapshotClick}
                title="Guardar foto del conjunto en el cuaderno"
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#5e340c] hover:bg-[#764312] border border-[#cfa158] text-[#ffefc8] text-[10.5px] font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#f4c057]" />
                <span className="hidden xl:inline">Foto</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

VitruvianMan3D.displayName = 'VitruvianMan3D';
