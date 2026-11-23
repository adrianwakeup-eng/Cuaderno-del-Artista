import React, { useEffect, useRef, useState } from 'react';
import fairyCelticHarpImg from '../assets/images/fairy_celtic_harp_play_1795185706248.jpg';
import fairyWingImg from '../assets/images/fairy_emerald_wing_1795185391561.jpg';
import { fairyMusicPlayer } from '../utils/fairyMusicPlayer';
import { GoldenFairyDustEngine } from '../utils/goldenFairyDust';
import { applyDetailSuperResolutionPass } from '../utils/ultraHdImageEngine';

interface ProcessedFairyAssets {
  torsoUrl: string;
  headUrl: string;
  tabardUrl: string;
  rightArmUrl: string;
  leftHandUrl: string;
  backShinUrl: string;
  backFootUrl: string;
  frontShinUrl: string;
  frontFootUrl: string;
  foreWingUrl: string;
  hindWingUrl: string;
}

interface SpringState {
  value: number;
  vel: number;
}

let cachedAssetsPromise: Promise<ProcessedFairyAssets> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function stepSpring(
  spring: SpringState,
  target: number,
  stiffness: number,
  damping: number,
  dt: number
): number {
  const accel = (target - spring.value) * stiffness - spring.vel * damping;
  spring.vel += accel * dt;
  spring.value += spring.vel * dt;
  return spring.value;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function makeLayerDataUrl(w: number, h: number, data: Uint8ClampedArray): string {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  const imgData = ctx.createImageData(w, h);
  imgData.data.set(data);
  ctx.putImageData(imgData, 0, 0);
  return c.toDataURL('image/png');
}

/**
 * Cleanly extracts the male harp-playing fairy at full native resolution with
 * micro-texture super-resolution enhancement and segments him into seamless,
 * overlapping articulated layers:
 * - head + laurel crown + flowing emerald hair (neck collar pivot)
 * - torso + pauldrons + carved golden harp + upper thighs (with behind-collar,
 *   behind-forearm, and behind-tabard areas naturally inpainted)
 * - center pointed leaf-tabard (waist buckle wind-sway pivot)
 * - right forearm & hand (elbow pivot strumming upper/mid strings)
 * - left hand & wrist (wrist pivot plucking lower strings)
 * - back lower leg (knee pivot) + nested back foot (ankle buckle pivot)
 * - front lower leg (knee pivot) + nested front foot (ankle buckle pivot)
 */
function extractArticulatedFairyParts(
  img: HTMLImageElement
): Omit<ProcessedFairyAssets, 'foreWingUrl' | 'hindWingUrl'> {
  const maxH = 1264;
  const scale = Math.min(1, maxH / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      torsoUrl: img.src,
      headUrl: '',
      tabardUrl: '',
      rightArmUrl: '',
      leftHandUrl: '',
      backShinUrl: '',
      backFootUrl: '',
      frontShinUrl: '',
      frontFootUrl: '',
    };
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  // Enhance tactile surface realism (leaf-embossed leather armor, hair strands, skin, carved gold harp)
  applyDetailSuperResolutionPass(canvas, {
    sharpness: 0.78,
    clarity: 0.09,
    vibrance: 0.075,
    edgeThreshold: 2.2,
  });

  const baseImgData = ctx.getImageData(0, 0, w, h);
  const src = baseImgData.data;

  // Step 1: Clean white-background removal with face highlight protection & edge decontamination
  const isProtected = (nx: number, ny: number): boolean =>
    nx > 0.43 && nx < 0.61 && ny > 0.045 && ny < 0.165;

  const isBg = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const p = idx * 4;
      const r = src[p];
      const g = src[p + 1];
      const b = src[p + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const chroma = maxC - minC;

      if (!isProtected(x / w, ny) && minC > 228 && chroma < 20) {
        isBg[idx] = 1;
        src[p + 3] = 0;
      }
    }
  }

  // Two-pass soft edge decontamination for clean dark-wood blending with zero white halo
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 1; y < h - 1; y++) {
      const ny = y / h;
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (isBg[idx] || isProtected(x / w, ny)) continue;

        let touchesBg = false;
        for (let oy = -1; oy <= 1 && !touchesBg; oy++) {
          for (let ox = -1; ox <= 1; ox++) {
            const nIdx = (y + oy) * w + (x + ox);
            if (isBg[nIdx] || (pass === 1 && src[nIdx * 4 + 3] < 120)) {
              touchesBg = true;
              break;
            }
          }
        }
        if (!touchesBg) continue;

        const p = idx * 4;
        const r = src[p];
        const g = src[p + 1];
        const b = src[p + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        const lumThresh = pass === 0 ? 184 : 204;

        if (lum > lumThresh && chroma < 44) {
          const aNorm = clamp((242 - lum) / 58 + chroma / 78, 0.04, 1);
          src[p] = clamp(Math.round((r - (1 - aNorm) * 255) / aNorm), 0, 255);
          src[p + 1] = clamp(Math.round((g - (1 - aNorm) * 255) / aNorm), 0, 255);
          src[p + 2] = clamp(Math.round((b - (1 - aNorm) * 255) / aNorm), 0, 255);
          src[p + 3] = Math.round(Math.min(src[p + 3], aNorm * 255));
        }
      }
    }
  }

  // Step 2: Allocate articulated layer buffers
  const torso = new Uint8ClampedArray(src);
  const head = new Uint8ClampedArray(w * h * 4);
  const tabard = new Uint8ClampedArray(w * h * 4);
  const rightArm = new Uint8ClampedArray(w * h * 4);
  const leftHand = new Uint8ClampedArray(w * h * 4);
  const backShin = new Uint8ClampedArray(w * h * 4);
  const backFoot = new Uint8ClampedArray(w * h * 4);
  const frontShin = new Uint8ClampedArray(w * h * 4);
  const frontFoot = new Uint8ClampedArray(w * h * 4);

  const legDividerX = (ny: number) =>
    0.502 + Math.max(0, (ny - 0.675) / 0.245) * 0.09;

  // Curved V-neck collar boundary separating articulated head/neck/hair from pauldrons & chest
  const headCollarY = (nx: number) => {
    const distFromCenter = Math.abs(nx - 0.495);
    const neckDip = 1 - smoothstep(0.036, 0.088, distFromCenter);
    return 0.160 + neckDip * 0.038;
  };

  const isWarmSkin = (r: number, g: number, b: number) =>
    r > 78 && r > b + 14 && r >= g + 3 && g > b + 4;

  const writeWeighted = (dest: Uint8ClampedArray, p: number, weight: number) => {
    const a = Math.round(src[p + 3] * weight);
    if (a <= 0) return;
    dest[p] = src[p];
    dest[p + 1] = src[p + 1];
    dest[p + 2] = src[p + 2];
    dest[p + 3] = a;
  };

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    const divX = legDividerX(ny);

    for (let x = 0; x < w; x++) {
      const nx = x / w;
      const p = (y * w + x) * 4;
      const origA = src[p + 3];
      if (origA === 0) continue;

      const r = src[p];
      const g = src[p + 1];
      const b = src[p + 2];

      // --- 0. ARTICULATED HEAD, CROWN, NECK & UPPER FLOWING HAIR ---
      if (ny <= 0.214 && nx >= 0.345 && nx <= 0.635) {
        const cutY = headCollarY(nx);
        const headWeight = 1 - smoothstep(cutY - 0.014, cutY + 0.011, ny);
        if (headWeight > 0.01) {
          writeWeighted(head, p, headWeight);
          // Fade out cleanly from base torso above the inner collar overlap
          const torsoCut = smoothstep(cutY - 0.020, cutY - 0.002, ny);
          if (ny < cutY - 0.018) {
            torso[p + 3] = 0;
          } else if (torsoCut < 1) {
            // Soft dark-woodland neck shadow under the moving collar seam so tilting never exposes a gap
            const shadowMix = (1 - torsoCut) * 0.45;
            torso[p] = Math.round(r * (1 - shadowMix) + 20 * shadowMix);
            torso[p + 1] = Math.round(g * (1 - shadowMix) + 34 * shadowMix);
            torso[p + 2] = Math.round(b * (1 - shadowMix) + 19 * shadowMix);
            torso[p + 3] = Math.round(torso[p + 3] * (0.28 + 0.72 * torsoCut));
          }
        }
      }

      // --- 0b. CENTER POINTED LEAF-TABARD (gentle aerodynamic cloth sway) ---
      if (ny >= 0.440 && ny <= 0.642 && nx >= 0.382 && nx <= 0.506) {
        const tabProgress = clamp((ny - 0.440) / 0.198, 0, 1);
        // Natural pointed diamond silhouette tapering cleanly toward (0.438, 0.638)
        const halfWidth =
          tabProgress < 0.68
            ? 0.056 - tabProgress * 0.008
            : Math.max(0.004, 0.050 * (1 - (tabProgress - 0.68) / 0.32));
        const centerX = 0.443 - tabProgress * 0.005;
        const dxCenter = Math.abs(nx - centerX);

        const inTop = smoothstep(0.440, 0.458, ny);
        const inSides = 1 - smoothstep(halfWidth - 0.010, halfWidth + 0.006, dxCenter);
        const inBot = 1 - smoothstep(0.625, 0.640, ny);
        const tabWeight = inTop * inSides * inBot;

        if (tabWeight > 0.02) {
          writeWeighted(tabard, p, tabWeight);
          // Deepen the inner shadow behind the moving cloth flap on torso
          const k = tabWeight * 0.76;
          torso[p] = Math.round(r * (1 - k) + 10 * k);
          torso[p + 1] = Math.round(g * (1 - k) + 21 * k);
          torso[p + 2] = Math.round(b * (1 - k) + 12 * k);
        }
      }

      // --- A. BACK LOWER LEG & BACK FOOT (viewer-left leg, his right leg) ---
      if (nx < divX && ny >= 0.674) {
        const kneeIn = smoothstep(0.674, 0.706, ny);
        const torsoFadeOut = 1 - smoothstep(0.692, 0.718, ny);
        torso[p + 3] = Math.round(torso[p + 3] * torsoFadeOut);

        const ankleLineY = 0.842 + (nx - 0.522) * 0.44;
        const footIn = smoothstep(ankleLineY - 0.014, ankleLineY + 0.012, ny);
        const shinFadeOut = 1 - smoothstep(ankleLineY + 0.002, ankleLineY + 0.022, ny);

        if (kneeIn > 0.01 && shinFadeOut > 0.01) {
          writeWeighted(backShin, p, kneeIn * shinFadeOut);
        }
        if (footIn > 0.01) {
          writeWeighted(backFoot, p, footIn);
        }
      }

      // --- B. FRONT LOWER LEG & FRONT FOOT (viewer-right leg, his left leg) ---
      if (nx >= divX && ny >= 0.704) {
        const kneeIn = smoothstep(0.704, 0.734, ny);
        const torsoFadeOut = 1 - smoothstep(0.720, 0.744, ny);
        torso[p + 3] = Math.round(torso[p + 3] * torsoFadeOut);

        const ankleLineY = 0.904;
        const footIn = smoothstep(ankleLineY - 0.014, ankleLineY + 0.012, ny);
        const shinFadeOut = 1 - smoothstep(ankleLineY + 0.002, ankleLineY + 0.022, ny);

        if (kneeIn > 0.01 && shinFadeOut > 0.01) {
          writeWeighted(frontShin, p, kneeIn * shinFadeOut);
        }
        if (footIn > 0.01) {
          writeWeighted(frontFoot, p, footIn);
        }
      }

      // --- C. RIGHT FOREARM + HAND PLUCKING UPPER/MID HARP STRINGS ---
      if (nx >= 0.308 && nx <= 0.688 && ny >= 0.288 && ny <= 0.368) {
        const topEdge = nx < 0.52 ? 0.296 : 0.291;
        const botEdge = nx < 0.52 ? 0.362 : 0.364;
        const inLeft = smoothstep(0.308, 0.348, nx);
        const inTop = smoothstep(topEdge - 0.008, topEdge + 0.010, ny);
        const inBot = 1 - smoothstep(botEdge - 0.010, botEdge + 0.008, ny);
        const inRight = 1 - smoothstep(0.672, 0.688, nx);

        let armWeight = inLeft * inTop * inBot * inRight;

        if (nx > 0.605 && armWeight > 0) {
          const skinMatch = isWarmSkin(r, g, b) ? 1 : 0;
          const handBlend = smoothstep(0.605, 0.635, nx);
          armWeight *= 1 - handBlend + handBlend * skinMatch;
        }

        if (armWeight > 0.02) {
          writeWeighted(rightArm, p, armWeight);
        }
      }

      // --- D. LEFT HAND & WRIST PLUCKING LOWER HARP STRINGS ---
      if (nx >= 0.735 && nx <= 0.885 && ny >= 0.368 && ny <= 0.460) {
        const inLeft = smoothstep(0.735, 0.768, nx);
        const inTop = smoothstep(0.368, 0.388, ny);
        const inBot = 1 - smoothstep(0.444, 0.460, ny);
        const inRight = 1 - smoothstep(0.870, 0.885, nx);
        const skinFactor = isWarmSkin(r, g, b) ? 1 : nx < 0.775 && g > r * 0.75 ? 0.75 : 0;
        const handWeight = inLeft * inTop * inBot * inRight * skinFactor;

        if (handWeight > 0.04) {
          writeWeighted(leftHand, p, handWeight);
          if (nx > 0.836 && isWarmSkin(r, g, b)) {
            torso[p + 3] = Math.round(torso[p + 3] * (1 - handWeight));
          } else if (nx > 0.765 && isWarmSkin(r, g, b)) {
            const k = handWeight * 0.78;
            torso[p] = Math.round(r * (1 - k) + 92 * k);
            torso[p + 1] = Math.round(g * (1 - k) + 72 * k);
            torso[p + 2] = Math.round(b * (1 - k) + 38 * k);
          }
        }
      }
    }
  }

  // Step 3: Cleanly inpaint the dark-green chest tunic behind the lifted right forearm/hand
  const yAbove = Math.round(0.286 * h);
  const yBelow = Math.round(0.371 * h);
  const xStartInpaint = Math.round(0.345 * w);
  const xEndInpaint = Math.round(0.618 * w);

  for (let x = xStartInpaint; x <= xEndInpaint; x++) {
    const nx = x / w;
    const pTop = (yAbove * w + x) * 4;
    const pBot = (yBelow * w + x) * 4;
    const topValid = src[pTop + 3] > 180;
    const botValid = src[pBot + 3] > 180;

    for (let y = yAbove + 1; y < yBelow; y++) {
      const ny = y / h;
      const p = (y * w + x) * 4;
      if (torso[p + 3] < 40) continue;

      const t = (y - yAbove) / Math.max(1, yBelow - yAbove);
      const maskX = smoothstep(0.345, 0.375, nx) * (1 - smoothstep(0.585, 0.618, nx));
      const maskY = smoothstep(0.292, 0.308, ny) * (1 - smoothstep(0.352, 0.368, ny));
      const blend = maskX * maskY;
      if (blend <= 0.01) continue;

      let fr = 28;
      let fg = 54;
      let fb = 30;
      if (topValid && botValid) {
        fr = src[pTop] * (1 - t) + src[pBot] * t;
        fg = src[pTop + 1] * (1 - t) + src[pBot + 1] * t;
        fb = src[pTop + 2] * (1 - t) + src[pBot + 2] * t;
      } else if (topValid) {
        fr = src[pTop];
        fg = src[pTop + 1];
        fb = src[pTop + 2];
      } else if (botValid) {
        fr = src[pBot];
        fg = src[pBot + 1];
        fb = src[pBot + 2];
      }

      fr *= 0.78;
      fg *= 0.8;
      fb *= 0.78;

      torso[p] = Math.round(torso[p] * (1 - blend) + fr * blend);
      torso[p + 1] = Math.round(torso[p + 1] * (1 - blend) + fg * blend);
      torso[p + 2] = Math.round(torso[p + 2] * (1 - blend) + fb * blend);
    }
  }

  return {
    torsoUrl: makeLayerDataUrl(w, h, torso),
    headUrl: makeLayerDataUrl(w, h, head),
    tabardUrl: makeLayerDataUrl(w, h, tabard),
    rightArmUrl: makeLayerDataUrl(w, h, rightArm),
    leftHandUrl: makeLayerDataUrl(w, h, leftHand),
    backShinUrl: makeLayerDataUrl(w, h, backShin),
    backFootUrl: makeLayerDataUrl(w, h, backFoot),
    frontShinUrl: makeLayerDataUrl(w, h, frontShin),
    frontFootUrl: makeLayerDataUrl(w, h, frontFoot),
  };
}

/**
 * Extracts the emerald fairy wings at high resolution with super-resolution vein
 * micro-texture, stained-glass gossamer membrane translucency, and splits them cleanly
 * into independent Forewing (upper) & Hindwing (lower) PNGs for lifelike phased flapping.
 */
function extractSplitGossamerWings(
  img: HTMLImageElement
): { foreWingUrl: string; hindWingUrl: string } {
  const maxDim = 880;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { foreWingUrl: img.src, hindWingUrl: '' };

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  // Sharpen fine dragonfly/gossamer wing venation & iridescence
  applyDetailSuperResolutionPass(canvas, {
    sharpness: 0.88,
    clarity: 0.11,
    vibrance: 0.10,
    edgeThreshold: 1.7,
  });

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let headIdx = 0;
  let tailIdx = 0;

  const tryPush = (x: number, y: number) => {
    const idx = y * w + x;
    if (visited[idx]) return;
    const p = idx * 4;
    const r = d[p];
    const g = d[p + 1];
    const b = d[p + 2];
    const minC = Math.min(r, g, b);
    const chroma = Math.max(r, g, b) - minC;
    if (minC > 224 && chroma < 24) {
      visited[idx] = 1;
      queue[tailIdx++] = idx;
    }
  };

  for (let x = 0; x < w; x++) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }

  while (headIdx < tailIdx) {
    const cur = queue[headIdx++];
    const cx = cur % w;
    const cy = (cur - cx) / w;
    if (cx > 0) tryPush(cx - 1, cy);
    if (cx < w - 1) tryPush(cx + 1, cy);
    if (cy > 0) tryPush(cx, cy - 1);
    if (cy < h - 1) tryPush(cx, cy + 1);
  }

  const foreData = new Uint8ClampedArray(w * h * 4);
  const hindData = new Uint8ClampedArray(w * h * 4);

  for (let y = 0; y < h; y++) {
    const ny = y / h;
    for (let x = 0; x < w; x++) {
      const nx = x / w;
      const i = y * w + x;
      const p = i * 4;
      if (visited[i]) continue;

      let r = d[p];
      let g = d[p + 1];
      let b = d[p + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);

      let alpha = 248;
      if (lum > 212 && chroma < 40) {
        const aNorm = clamp((254 - lum) / 48 + chroma / 46, 0.16, 0.90);
        r = clamp(Math.round((r - (1 - aNorm) * 255) / aNorm), 0, 255);
        g = clamp(Math.round((g - (1 - aNorm) * 255) / aNorm), 0, 255);
        b = clamp(Math.round((b - (1 - aNorm) * 255) / aNorm), 0, 255);
        alpha = Math.round(aNorm * 255);
      } else {
        // Stained-glass gossamer translucency: dark emerald veins stay crisp (~248),
        // luminous sunlit membrane cells breathe translucently (182..232) so background shines through
        const membraneFactor = smoothstep(95, 205, lum);
        alpha = Math.round(248 - membraneFactor * 58);
        // Subtle sunlit gold-emerald iridescence on bright translucent wing cells
        if (membraneFactor > 0.35 && g > r) {
          r = clamp(Math.round(r + membraneFactor * 14), 0, 255);
          g = clamp(Math.round(g + membraneFactor * 10), 0, 255);
        }
      }

      // Clean diagonal split right down the hinge & natural gap between forewing and hindwing
      const splitY = 0.576 + Math.max(0, nx - 0.17) * 0.085;
      const feather = nx < 0.28 ? 0.014 : 0.006;
      const hindWeight = smoothstep(splitY - feather, splitY + feather, ny);
      const foreWeight = 1 - hindWeight;

      if (foreWeight > 0.01) {
        foreData[p] = r;
        foreData[p + 1] = g;
        foreData[p + 2] = b;
        foreData[p + 3] = Math.round(alpha * foreWeight);
      }
      if (hindWeight > 0.01) {
        hindData[p] = r;
        hindData[p + 1] = g;
        hindData[p + 2] = b;
        hindData[p + 3] = Math.round(alpha * hindWeight);
      }
    }
  }

  return {
    foreWingUrl: makeLayerDataUrl(w, h, foreData),
    hindWingUrl: makeLayerDataUrl(w, h, hindData),
  };
}

function getProcessedFairyAssets(): Promise<ProcessedFairyAssets> {
  if (!cachedAssetsPromise) {
    cachedAssetsPromise = Promise.all([
      loadImage(fairyCelticHarpImg),
      loadImage(fairyWingImg),
    ])
      .then(([bodyImg, wingImg]) => ({
        ...extractArticulatedFairyParts(bodyImg),
        ...extractSplitGossamerWings(wingImg),
      }))
      .catch(() => ({
        torsoUrl: fairyCelticHarpImg,
        headUrl: '',
        tabardUrl: '',
        rightArmUrl: '',
        leftHandUrl: '',
        backShinUrl: '',
        backFootUrl: '',
        frontShinUrl: '',
        frontFootUrl: '',
        foreWingUrl: fairyWingImg,
        hindWingUrl: '',
      }));
  }
  return cachedAssetsPromise;
}

export const ButterflyWingsIcon: React.FC<{ className?: string }> = ({
  className = 'w-4 h-4',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M11.4 11.4C9.4 6.2 4.5 3.6 2.6 5.2C1.1 6.5 2.1 10.6 5.3 12.1C7.4 13.1 9.8 12.6 11.4 11.4Z"
      fill="currentColor"
      fillOpacity="0.32"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M12.6 11.4C14.6 6.2 19.5 3.6 21.4 5.2C22.9 6.5 21.9 10.6 18.7 12.1C16.6 13.1 14.2 12.6 12.6 11.4Z"
      fill="currentColor"
      fillOpacity="0.32"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M11.3 12.6C8.7 12.8 5.4 14.6 5.4 17.2C5.4 19.1 7.6 19.8 9.4 18.5C10.7 17.5 11.3 15.1 11.3 12.6Z"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M12.7 12.6C15.3 12.8 18.6 14.6 18.6 17.2C18.6 19.1 16.4 19.8 14.6 18.5C13.3 17.5 12.7 15.1 12.7 12.6Z"
      fill="currentColor"
      fillOpacity="0.22"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M12 7.5V17.8M12 7.8C11.4 6.2 10.6 5.1 9.8 4.4M12 7.8C12.6 6.2 13.4 5.1 14.2 4.4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

interface CoverMagicFairyProps {
  isFlying: boolean;
  sfxEnabled?: boolean;
}

// Smooth closed Catmull-Rom flight circuit sweeping gracefully across the crochet artist desk
const FLIGHT_SPLINE_NODES: Array<{ nx: number; ny: number }> = [
  { nx: 0.68, ny: 0.36 },
  { nx: 0.44, ny: 0.24 },
  { nx: 0.20, ny: 0.34 },
  { nx: 0.22, ny: 0.62 },
  { nx: 0.48, ny: 0.50 },
  { nx: 0.78, ny: 0.25 },
  { nx: 0.64, ny: 0.58 },
];

const HARP_STRINGS = [
  { x1: 30, y1: 12, x2: 6, y2: 86, freq: 38 },
  { x1: 42, y1: 14, x2: 18, y2: 83, freq: 44 },
  { x1: 54, y1: 16, x2: 30, y2: 80, freq: 50 },
  { x1: 66, y1: 18, x2: 42, y2: 77, freq: 56 },
  { x1: 78, y1: 20, x2: 54, y2: 74, freq: 63 },
  { x1: 90, y1: 22, x2: 66, y2: 71, freq: 70 },
];

export const CoverMagicFairy: React.FC<CoverMagicFairyProps> = ({
  isFlying,
  sfxEnabled = true,
}) => {
  const stageOverlayRef = useRef<HTMLDivElement>(null);
  const dustCanvasRef = useRef<HTMLCanvasElement>(null);
  const groundShadowRef = useRef<HTMLDivElement>(null);
  const fairyRigRef = useRef<HTMLDivElement>(null);
  const fairyBodyRef = useRef<HTMLDivElement>(null);

  // 4 independent 3D wings (Left/Right Forewing + Left/Right Hindwing)
  const leftForeWingRef = useRef<HTMLDivElement>(null);
  const leftHindWingRef = useRef<HTMLDivElement>(null);
  const rightForeWingRef = useRef<HTMLDivElement>(null);
  const rightHindWingRef = useRef<HTMLDivElement>(null);
  const leftForeWingImgRef = useRef<HTMLImageElement>(null);
  const leftHindWingImgRef = useRef<HTMLImageElement>(null);
  const rightForeWingImgRef = useRef<HTMLImageElement>(null);
  const rightHindWingImgRef = useRef<HTMLImageElement>(null);

  // Articulated anatomical refs: head/hair, leaf-tabard, both harp-playing hands, both knee/ankle legs
  const headRef = useRef<HTMLDivElement>(null);
  const tabardRef = useRef<HTMLDivElement>(null);
  const rightArmRef = useRef<HTMLDivElement>(null);
  const rightFingerGlintRef = useRef<HTMLDivElement>(null);
  const leftHandRef = useRef<HTMLDivElement>(null);
  const leftFingerGlintRef = useRef<HTMLDivElement>(null);
  const backShinRef = useRef<HTMLDivElement>(null);
  const backFootRef = useRef<HTMLDivElement>(null);
  const frontShinRef = useRef<HTMLDivElement>(null);
  const frontFootRef = useRef<HTMLDivElement>(null);

  const harpAuraRef = useRef<HTMLDivElement>(null);
  const harpStringsSvgRef = useRef<SVGSVGElement>(null);
  const harpStringPathRefs = useRef<Array<SVGPathElement | null>>([]);
  const rimGlowRef = useRef<HTMLDivElement>(null);

  const [assets, setAssets] = useState<ProcessedFairyAssets | null>(null);

  const dustEngineRef = useRef<GoldenFairyDustEngine | null>(null);
  if (!dustEngineRef.current) {
    dustEngineRef.current = new GoldenFairyDustEngine();
  }

  // Passive pointer awareness so the fairy subtly notices cursor proximity without ever blocking UI
  const pointerRef = useRef({
    active: false,
    x: 0,
    y: 0,
    lastMoveSec: 0,
  });

  const motionRef = useRef({
    initialized: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    roll: -6.5,
    pitch: 2,
    yaw: -14,
    scale: 1,
    targetFacing: 1 as 1 | -1,
    turnDeg: 0,
    turnVel: 0,
    wingPhase: 0,
    splineT: 0,
    flightProgress: 0,
    pluckImpulse: 0,
    pluckPitch: 0.5,
    stringAmps: [0, 0, 0, 0, 0, 0],
    musicSwayCurrent: 0,
    musicNodCurrent: 0,
    stringGlowOpacity: 0,
    emitAccum: 0,
    idleFlutterTimer: 2.8,
    idleFlutterAmount: 0,
    proximityFlutterCooldown: 0,
    musicSwayTarget: 0,
    handPhase: 0,
    legPhase: 0,
    // Second-order spring states for natural weight, momentum & follow-through
    headRot: { value: 0, vel: 0 } as SpringState,
    headPitch: { value: 0, vel: 0 } as SpringState,
    headYaw: { value: 0, vel: 0 } as SpringState,
    tabardRot: { value: 0, vel: 0 } as SpringState,
    tabardPitch: { value: 0, vel: 0 } as SpringState,
    rArmRot: { value: 0, vel: 0 } as SpringState,
    rArmX: { value: 0, vel: 0 } as SpringState,
    rArmY: { value: 0, vel: 0 } as SpringState,
    rArmYaw: { value: 0, vel: 0 } as SpringState,
    lHandRot: { value: 0, vel: 0 } as SpringState,
    lHandX: { value: 0, vel: 0 } as SpringState,
    lHandY: { value: 0, vel: 0 } as SpringState,
    backKneeRot: { value: 0, vel: 0 } as SpringState,
    backAnkleRot: { value: 0, vel: 0 } as SpringState,
    frontKneeRot: { value: 0, vel: 0 } as SpringState,
    frontAnkleRot: { value: 0, vel: 0 } as SpringState,
  });

  // Pre-extract high-resolution micro-textured articulated PNGs once
  useEffect(() => {
    let active = true;
    void getProcessedFairyAssets().then((res) => {
      if (active) setAssets(res);
    });
    return () => {
      active = false;
    };
  }, []);

  // Keep uploaded track mute state synced with CoverScreen's Sonidos toggle
  useEffect(() => {
    fairyMusicPlayer.setMuted(!sfxEnabled);
  }, [sfxEnabled]);

  // Play / stop the user's uploaded MP3 track when MAGIA toggles (clean up on unmount)
  useEffect(() => {
    if (!isFlying) {
      fairyMusicPlayer.stop();
      return;
    }
    fairyMusicPlayer.start(!sfxEnabled);
    return () => {
      fairyMusicPlayer.stop();
    };
  }, [isFlying]);

  useEffect(() => {
    const container = stageOverlayRef.current;
    const canvas = dustCanvasRef.current;
    const dustEngine = dustEngineRef.current;
    if (!container || !canvas || !dustEngine) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let stageW = container.clientWidth || 1200;
    let stageH = container.clientHeight || 720;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      stageW = container.clientWidth || 1200;
      stageH = container.clientHeight || 720;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(stageW * dpr);
      canvas.height = Math.round(stageH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(container);

    // Passive pointer tracker relative to stage container
    const handlePointerMove = (ev: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current.x = ev.clientX - rect.left;
      pointerRef.current.y = ev.clientY - rect.top;
      pointerRef.current.active = true;
      pointerRef.current.lastMoveSec = performance.now() * 0.001;
    };
    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    const getRestCoords = () => {
      const fairyW = Math.max(138, Math.min(222, stageW * 0.158));
      const fairyH = fairyW * 1.49;
      return {
        x: stageW - fairyW * 0.5,
        y: stageH - fairyH * 0.49,
        fairyW,
        fairyH,
      };
    };

    const sampleSplinePoint = (tNorm: number, fairyW: number, fairyH: number) => {
      const n = FLIGHT_SPLINE_NODES.length;
      const wrapped = ((tNorm % n) + n) % n;
      const i1 = Math.floor(wrapped);
      const u = wrapped - i1;
      const p0 = FLIGHT_SPLINE_NODES[(i1 - 1 + n) % n];
      const p1 = FLIGHT_SPLINE_NODES[i1];
      const p2 = FLIGHT_SPLINE_NODES[(i1 + 1) % n];
      const p3 = FLIGHT_SPLINE_NODES[(i1 + 2) % n];

      const nx = catmullRom(p0.nx, p1.nx, p2.nx, p3.nx, u);
      const ny = catmullRom(p0.ny, p1.ny, p2.ny, p3.ny, u);

      const padX = Math.max(fairyW * 0.60, stageW * 0.09);
      const padTop = Math.max(fairyH * 0.47, stageH * 0.13);
      const padBot = Math.max(fairyH * 0.52, stageH * 0.16);

      return {
        x: padX + clamp(nx, 0.02, 0.98) * Math.max(80, stageW - padX * 2),
        y: padTop + clamp(ny, 0.02, 0.98) * Math.max(60, stageH - padTop - padBot),
      };
    };

    if (!motionRef.current.initialized) {
      const rest = getRestCoords();
      motionRef.current.x = rest.x;
      motionRef.current.y = rest.y;
      motionRef.current.initialized = true;
    }

    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.045, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const tSec = now * 0.001;

      const s = motionRef.current;
      const ptr = pointerRef.current;
      const rest = getRestCoords();
      const fairyW = rest.fairyW;
      const fairyH = rest.fairyH;

      // Smoothly blend flight progress (0 = calm resting corner, 1 = full airborne glide)
      const targetFlight = isFlying ? 1 : 0;
      s.flightProgress += (targetFlight - s.flightProgress) * (1 - Math.exp(-dt * 3.8));

      const turnRad = (s.turnDeg * Math.PI) / 180;
      const facingCos = Math.cos(turnRad);
      const turnMid = Math.sin(clamp(turnRad, 0, Math.PI));

      // Sample synchronized musical phrasing from the uploaded MP3 soundtrack
      const music = fairyMusicPlayer.sampleFrame(tSec);

      if (isFlying && music.onsetStrength > 0) {
        s.pluckImpulse = Math.min(1.48, Math.max(s.pluckImpulse, music.onsetStrength));
        s.pluckPitch = music.pitchNorm;
        s.stringGlowOpacity = Math.min(1, 0.58 + music.onsetStrength * 0.42);
        s.musicSwayTarget = (music.pitchNorm - 0.5) * 11.5;

        // Excite individual vibrating harp strings matching the note pitch (or ripple on chords)
        const primaryIdx = clamp(Math.round(music.pitchNorm * 5), 0, 5);
        if (music.isChordAccent) {
          for (let k = 0; k < 6; k++) {
            const distFromCore = Math.abs(k - primaryIdx);
            const boost = Math.max(0.42, 1.15 - distFromCore * 0.16) * music.onsetStrength;
            s.stringAmps[k] = Math.min(1.5, Math.max(s.stringAmps[k], boost));
          }
        } else {
          s.stringAmps[primaryIdx] = Math.min(
            1.4,
            Math.max(s.stringAmps[primaryIdx], 0.92 * music.onsetStrength)
          );
          if (primaryIdx > 0) {
            s.stringAmps[primaryIdx - 1] = Math.max(
              s.stringAmps[primaryIdx - 1],
              0.38 * music.onsetStrength
            );
          }
          if (primaryIdx < 5) {
            s.stringAmps[primaryIdx + 1] = Math.max(
              s.stringAmps[primaryIdx + 1],
              0.38 * music.onsetStrength
            );
          }
        }

        if (!reducedMotion) {
          const harpX = s.x + facingCos * fairyW * (0.18 + music.pitchNorm * 0.15);
          const harpY = s.y - fairyH * (0.04 + music.pitchNorm * 0.09);
          const emitFacing: 1 | -1 = facingCos >= 0 ? 1 : -1;
          dustEngine.emitHarpNoteBurst(harpX, harpY, emitFacing, s.vx, music.isChordAccent);
        }
      }

      s.pluckImpulse = Math.max(0, s.pluckImpulse - dt * 2.45);
      for (let k = 0; k < 6; k++) {
        // Longer bass strings sustain vibration slightly longer than short treble strings
        const decayRate = 2.6 + k * 0.35;
        s.stringAmps[k] = Math.max(0, s.stringAmps[k] * Math.exp(-dt * decayRate));
      }

      s.stringGlowOpacity = Math.max(
        isFlying ? music.melody * 0.52 : 0,
        s.stringGlowOpacity - dt * 1.55
      );
      s.musicSwayCurrent +=
        (s.musicSwayTarget - s.musicSwayCurrent) * (1 - Math.exp(-dt * 3.2));
      const targetNod = s.pluckImpulse * 4.6 + music.bass * 2.4;
      s.musicNodCurrent += (targetNod - s.musicNodCurrent) * (1 - Math.exp(-dt * 8.2));

      // Compute gentle pointer awareness vector (subtly decays if cursor sits still > 7s)
      const ptrFresh = ptr.active && tSec - ptr.lastMoveSec < 7.5;
      const ptrDx = ptrFresh ? ptr.x - s.x : 0;
      const ptrDy = ptrFresh ? ptr.y - (s.y - fairyH * 0.25) : 0;
      const ptrDist = Math.hypot(ptrDx, ptrDy);
      const ptrWeight = ptrFresh ? clamp(1 - ptrDist / (stageW * 0.72), 0, 1) : 0;

      // Trigger a soft curious wing micro-flutter when user brings cursor close while resting
      s.proximityFlutterCooldown = Math.max(0, s.proximityFlutterCooldown - dt);
      if (!isFlying && ptrFresh && ptrDist < fairyW * 1.35 && s.proximityFlutterCooldown <= 0) {
        s.idleFlutterAmount = Math.max(s.idleFlutterAmount, 0.85);
        s.proximityFlutterCooldown = 3.2;
      }

      let foreWingAngle = 56;
      let hindWingAngle = 60;
      let wingTurnDiff = 0;
      let foreTwistZ = -5;
      let hindTwistZ = -7;
      let forePitchX = 8;
      let hindPitchX = 11;
      let wingVelocityBlur = 0;
      let bodyBobY = 0;
      let breathScaleY = 1;
      let speedNorm = 0;

      // Target articulated limb & head poses
      let targetHeadRot = 0;
      let targetHeadPitch = 0;
      let targetHeadYaw = 0;
      let targetTabardRot = 0;
      let targetTabardPitch = 0;
      let targetRArmRot = 0;
      let targetRArmX = 0;
      let targetRArmY = 0;
      let targetRArmYaw = 0;
      let targetLHandRot = 0;
      let targetLHandX = 0;
      let targetLHandY = 0;
      let targetBackKnee = 0;
      let targetBackAnkle = 0;
      let targetFrontKnee = 0;
      let targetFrontAnkle = 0;

      if (isFlying) {
        // Organic cruising vs. lyrical hovering tempo: smoothly alternates between gliding arcs
        // and lingering figure-8 hover interludes synced subtly with musical energy
        const tempoPulse = 0.52 + 0.48 * Math.sin(tSec * 0.42 + 0.6);
        const splineRate = reducedMotion
          ? 0.055
          : 0.085 + tempoPulse * 0.135 + music.energy * 0.045;
        s.splineT += dt * splineRate;

        const basePt = sampleSplinePoint(s.splineT, fairyW, fairyH);
        const lookAheadPt = sampleSplinePoint(s.splineT + 0.22, fairyW, fairyH);

        // Layered organic Lissajous figure-8 hover dance (stronger during lingering phrases)
        const hoverStrength = 1 - tempoPulse * 0.55;
        const fig8X = Math.sin(tSec * 1.05) * (24 * hoverStrength);
        const fig8Y = Math.sin(tSec * 2.1 + 0.4) * (14 * hoverStrength);

        // Subtle curious drift toward cursor when nearby, never crowding the cursor
        const cursorAttractX =
          ptrFresh && ptrDist > fairyW * 0.95 && ptrDist < stageW * 0.45
            ? clamp(ptrDx * 0.08, -32, 32)
            : 0;
        const cursorAttractY =
          ptrFresh && ptrDist > fairyW * 0.95 && ptrDist < stageW * 0.45
            ? clamp(ptrDy * 0.06, -22, 22)
            : 0;

        const tx = basePt.x + fig8X + cursorAttractX;
        const ty = basePt.y + fig8Y + cursorAttractY;

        const dx = tx - s.x;
        const dy = ty - s.y;
        const dist = Math.hypot(dx, dy);

        const maxSpeed = reducedMotion ? 52 : 148;
        const desiredSpeed = Math.min(maxSpeed, dist * 1.25);
        const desiredVx = dist > 0.5 ? (dx / dist) * desiredSpeed : 0;
        const desiredVy = dist > 0.5 ? (dy / dist) * desiredSpeed : 0;

        // Fluid aerodynamic inertia (smooth gliding acceleration & graceful deceleration)
        const accelSmooth = 1 - Math.exp(-dt * 2.45);
        s.vx += (desiredVx - s.vx) * accelSmooth;
        s.vy += (desiredVy - s.vy) * accelSmooth;

        s.x += s.vx * dt;
        s.y += s.vy * dt;

        speedNorm = clamp(Math.hypot(s.vx, s.vy) / maxSpeed, 0, 1);

        // Anticipate direction changes smoothly using velocity + spline look-ahead tangent
        const lookDx = lookAheadPt.x - basePt.x;
        const steerSignal = s.vx * 0.65 + desiredVx * 0.22 + lookDx * 0.28;
        if (steerSignal > 22) {
          s.targetFacing = 1;
        } else if (steerSignal < -22) {
          s.targetFacing = -1;
        }

        // Smooth organic 3D spring turn (0° = right, 180° = left)
        const targetTurnDeg = s.targetFacing === 1 ? 0 : 180;
        if (reducedMotion) {
          s.turnDeg += (targetTurnDeg - s.turnDeg) * (1 - Math.exp(-dt * 5));
          s.turnVel = 0;
        } else {
          const profileBoost = 1 + turnMid * 0.68;
          const stiffness = 25 * profileBoost;
          const damping = 8.6;
          const turnAccel = (targetTurnDeg - s.turnDeg) * stiffness - s.turnVel * damping;
          s.turnVel += turnAccel * dt;
          s.turnDeg += s.turnVel * dt;
        }

        const liveTurnRad = (s.turnDeg * Math.PI) / 180;
        const liveTurnMid = Math.sin(clamp(liveTurnRad, 0, Math.PI));
        const liveFacingCos = Math.cos(liveTurnRad);

        // --- REALISTIC DUAL-PAIR FIGURE-8 AERODYNAMIC WINGBEATS ---
        // Rapid hummingbird/dragonfly stroke with steeper downstroke, feathered recovery upstroke,
        // and natural 0.42 rad phase lag between Forewing and Hindwing!
        const wingFreq = reducedMotion
          ? 3.4
          : 25.5 + speedNorm * 12.5 + s.pluckImpulse * 3.8 + music.energy * 5.2 + liveTurnMid * 8.0;
        s.wingPhase += dt * wingFreq;

        const foreWave =
          Math.sin(s.wingPhase) +
          0.27 * Math.sin(s.wingPhase * 2 - 0.52) +
          0.08 * Math.sin(s.wingPhase * 3 - 1.1);
        const foreBeat = clamp(foreWave / 1.24, -1, 1);
        const foreVelNorm = Math.abs(Math.cos(s.wingPhase));

        const hindPhase = s.wingPhase - 0.44;
        const hindWave =
          Math.sin(hindPhase) +
          0.24 * Math.sin(hindPhase * 2 - 0.48) +
          0.07 * Math.sin(hindPhase * 3 - 1.0);
        const hindBeat = clamp(hindWave / 1.22, -1, 1);

        foreWingAngle = 40 + foreBeat * (31 + speedNorm * 7.5) - liveTurnMid * 9.5;
        hindWingAngle = 44 + hindBeat * (25 + speedNorm * 5.5) - liveTurnMid * 7.5;
        wingTurnDiff = clamp(s.turnVel * 0.052, -16, 16);

        // Figure-8 wingtip sweep & aerodynamic pitch feathering (flatter on downstroke, sliced on upstroke)
        foreTwistZ = foreBeat * (9.5 + speedNorm * 4.5) + liveTurnMid * 5.5;
        hindTwistZ = hindBeat * (7.5 + speedNorm * 3.5) - 2.5 + liveTurnMid * 4;
        forePitchX = 12 - foreBeat * 10.5 + Math.cos(s.wingPhase) * 6.5 + liveTurnMid * 6;
        hindPitchX = 14 - hindBeat * 8.5 + Math.cos(hindPhase) * 5.5 + liveTurnMid * 5;
        wingVelocityBlur = reducedMotion ? 0 : clamp(foreVelNorm * (0.45 + speedNorm * 0.55), 0, 1);

        // Buoyant lift bobbing coupled directly to wing downstroke + gentle air-current heave
        bodyBobY = reducedMotion
          ? 0
          : -foreBeat * (3.6 + speedNorm * 1.9) +
            Math.sin(tSec * 2.15) * 4.2 +
            Math.cos(tSec * 1.35) * 2.1 -
            liveTurnMid * 10.5;
        breathScaleY = 1 + Math.sin(tSec * 2.4) * 0.013 + s.pluckImpulse * 0.013;

        // Aerodynamic banking into curves, pitch into climb/dive, subtle torso yaw
        const turnBankRoll = clamp(-s.turnVel * 0.044, -15, 15);
        const targetRoll =
          clamp(s.vx * 0.088, -16, 16) + turnBankRoll + s.musicSwayCurrent * 0.42;
        const targetPitch =
          clamp(-s.vy * 0.058 + 3.5, -12, 13.5) + s.musicNodCurrent * 0.72 + liveTurnMid * 8.5;
        const targetYaw =
          clamp(s.vx * liveFacingCos * 0.095, -19, 19) +
          Math.sin(tSec * 0.85) * 5.5 +
          s.musicSwayCurrent * 0.55;
        const targetScale =
          0.94 + Math.sin(tSec * 0.44 + 0.4) * 0.085 + liveTurnMid * 0.036;

        const rotSmooth = 1 - Math.exp(-dt * 4.8);
        s.roll += (targetRoll - s.roll) * rotSmooth;
        s.pitch += (targetPitch - s.pitch) * rotSmooth;
        s.yaw += (targetYaw - s.yaw) * rotSmooth;
        s.scale += (targetScale - s.scale) * rotSmooth;

        if (!reducedMotion) {
          // --- EXPRESSIVE ARTICULATED HEAD & GAZE (musical feeling + flight anticipation + gentle cursor glance) ---
          const localLookX = clamp((lookAheadPt.x - s.x) * liveFacingCos * 0.025, -4.5, 4.5);
          const localPtrX = clamp(ptrDx * liveFacingCos * 0.018 * ptrWeight, -6.5, 6.5);
          const localPtrY = clamp(ptrDy * 0.016 * ptrWeight, -4.5, 4.5);
          targetHeadRot =
            -s.musicSwayCurrent * 0.42 +
            Math.sin(tSec * 1.45) * 2.4 +
            localPtrX * 0.35 -
            clamp(s.vx * 0.018, -3, 3);
          targetHeadPitch =
            s.musicNodCurrent * 1.15 -
            clamp(s.vy * 0.028, -4.5, 4.5) +
            localPtrY * 0.65;
          targetHeadYaw =
            localLookX * 1.1 +
            localPtrX * 1.25 +
            Math.sin(tSec * 0.95) * 3.8;

          // --- WIND-SWEPT LEAF-TABARD CLOTH PHYSICS ---
          const forwardAirLocal = s.vx * liveFacingCos;
          targetTabardRot =
            clamp(-forwardAirLocal * 0.068, -9, 9) +
            clamp(s.turnVel * 0.032, -7, 7) +
            Math.sin(tSec * 4.6 + s.wingPhase * 0.15) * (1.8 + speedNorm * 2.4);
          targetTabardPitch =
            clamp(-s.vy * 0.055, -7, 9) + Math.cos(tSec * 3.9) * (2.2 + speedNorm * 3.0);

          // --- EXPRESSIVE HARP-PLAYING HANDS ---
          s.handPhase += dt * (6.4 + music.melody * 6.8 + s.pluckImpulse * 3.5);
          const arpeggioWave = Math.sin(s.handPhase);
          const fingerTrill = Math.sin(s.handPhase * 2.4 + 0.5) * (0.42 + music.treble * 0.9);
          const registerShift = (0.5 - s.pluckPitch) * 11.5;

          targetRArmRot =
            registerShift * 0.75 +
            arpeggioWave * (6.2 + music.melody * 4.8) +
            fingerTrill * 2.6 -
            s.pluckImpulse * 4.1;
          targetRArmX = 1.6 + Math.cos(s.handPhase) * 2.5 + s.pluckImpulse * 2.4;
          targetRArmY = -1.2 + Math.sin(s.handPhase * 1.45) * 2.3;
          targetRArmYaw = Math.sin(s.handPhase * 1.85) * 13 + s.pluckImpulse * 10;

          const counterWave = Math.sin(s.handPhase * 0.78 + 1.85);
          const bassPluck = Math.sin(s.handPhase * 1.58 + 0.6) * (0.52 + music.bass * 0.98);
          targetLHandRot =
            -counterWave * (7.2 + music.bass * 5.0) - bassPluck * 3.8 - s.pluckImpulse * 4.4;
          targetLHandX = -1.8 + Math.sin(s.handPhase * 0.9) * 2.5 - s.pluckImpulse * 1.9;
          targetLHandY = -1.8 + counterWave * 3.8 - music.bass * 2.9;

          // --- FLUID AIRBORNE 2-BONE LEGS & FEET (natural swimming/treading momentum + banking lag) ---
          s.legPhase += dt * (2.55 + speedNorm * 1.95 + music.bass * 1.25);
          const airTrailDeg = clamp(forwardAirLocal * 0.102, -15, 17);
          const liftDragDeg = clamp(-s.vy * 0.048, -9, 11);
          const turnCentrifugalDeg = clamp(s.turnVel * 0.056, -15, 15);

          const kickA = Math.sin(s.legPhase);
          const kickB = Math.sin(s.legPhase + Math.PI * 0.88);

          targetBackKnee =
            airTrailDeg + liftDragDeg + turnCentrifugalDeg + kickA * (11.5 + speedNorm * 5.8) + 4;
          targetBackAnkle =
            -kickA * 7.8 +
            Math.sin(s.legPhase * 1.68 + 0.9) * (9.5 + music.bass * 6.5) +
            airTrailDeg * 0.58 +
            turnCentrifugalDeg * 0.48;

          targetFrontKnee =
            airTrailDeg * 0.86 +
            liftDragDeg +
            turnCentrifugalDeg * 0.78 +
            kickB * (10.5 + speedNorm * 5.2) -
            2;
          targetFrontAnkle =
            -kickB * 7.0 +
            Math.cos(s.legPhase * 1.62 + 0.4) * (9 + music.bass * 6) +
            airTrailDeg * 0.48 +
            turnCentrifugalDeg * 0.38;
        }

        // Emit silky golden stardust ribbon + sunlit emerald-gold wing-pollen
        if (!reducedMotion) {
          const wingOriginY = s.y - fairyH * 0.13 + bodyBobY;
          dustEngine.pushFlightTrail(s.x, wingOriginY, dt, speedNorm);

          const turnBurstBoost = Math.abs(s.turnVel) > 42 ? 28 : 0;
          s.emitAccum += dt * (48 + speedNorm * 52 + turnBurstBoost);
          const toEmit = Math.floor(s.emitAccum);
          if (toEmit > 0) {
            s.emitAccum -= toEmit;
            dustEngine.emitWingDust(
              s.x,
              wingOriginY,
              s.vx,
              s.vy,
              fairyW * (1.16 + liveTurnMid * 0.22),
              toEmit
            );
          }
        }
      } else {
        // --- LIFELIKE RESTING POSE (breathing chest, subtle gaze tracking, occasional double wing-flutter) ---
        const settleRate = 1 - Math.exp(-dt * 3.1);
        s.x += (rest.x - s.x) * settleRate;
        s.y += (rest.y - s.y) * settleRate;
        s.vx *= 0.86;
        s.vy *= 0.86;
        s.musicSwayTarget = 0;

        s.targetFacing = 1;
        const turnAccel = (0 - s.turnDeg) * 20 - s.turnVel * 8.6;
        s.turnVel += turnAccel * dt;
        s.turnDeg += s.turnVel * dt;

        const breath = reducedMotion ? 0 : Math.sin(tSec * 1.52);
        const microBreath = reducedMotion ? 0 : Math.sin(tSec * 0.76 + 0.9);
        const targetRoll = -6.8 + breath * 1.15;
        const targetPitch = 2.4 + breath * 1.35;
        const targetYaw = -14.5 + microBreath * 3.8 + clamp(ptrDx * 0.008 * ptrWeight, -4, 4);

        s.roll += (targetRoll - s.roll) * settleRate;
        s.pitch += (targetPitch - s.pitch) * settleRate;
        s.yaw += (targetYaw - s.yaw) * settleRate;
        s.scale += (0.985 - s.scale) * settleRate;
        bodyBobY = reducedMotion ? 0 : breath * 2.5 + microBreath * 0.9;
        breathScaleY = 1 + breath * 0.0095;

        if (!reducedMotion) {
          // Gentle curious glances toward the user's cursor while resting
          const lookX = clamp(ptrDx * 0.016 * ptrWeight, -6.5, 5.5);
          const lookY = clamp(ptrDy * 0.014 * ptrWeight, -4.5, 4.5);
          targetHeadRot = breath * 1.35 + lookX * 0.42 + Math.sin(tSec * 0.62) * 1.6;
          targetHeadPitch = breath * 1.6 + lookY * 0.75;
          targetHeadYaw = lookX * 1.3 + Math.sin(tSec * 0.54) * 3.2;

          targetTabardRot = breath * 1.1 + Math.sin(tSec * 1.25) * 0.9;
          targetTabardPitch = breath * 1.4;

          // Subtle resting finger hover over the golden harp strings
          targetRArmRot = breath * 1.6 + Math.sin(tSec * 0.95) * 0.9;
          targetRArmY = breath * 0.7;
          targetLHandRot = -breath * 1.4;
          targetBackKnee = breath * 2.0;
          targetBackAnkle = Math.sin(tSec * 1.15) * 2.6;
          targetFrontKnee = -breath * 1.2;
          targetFrontAnkle = Math.cos(tSec * 1.05) * 2.0;
        }

        // Natural resting wing breathing + occasional expressive double-flutter stretch
        s.idleFlutterTimer -= dt;
        if (s.idleFlutterTimer <= 0) {
          s.idleFlutterAmount = 1;
          s.idleFlutterTimer = 3.4 + Math.random() * 3.6;
        }
        s.idleFlutterAmount = Math.max(0, s.idleFlutterAmount - dt * 1.18);
        const flutterEnvelope = Math.sin(s.idleFlutterAmount * Math.PI);
        const foreFlutter =
          s.idleFlutterAmount > 0
            ? Math.sin(tSec * 19.5) * 17.5 * flutterEnvelope
            : 0;
        const hindFlutter =
          s.idleFlutterAmount > 0
            ? Math.sin(tSec * 19.5 - 0.55) * 14.5 * flutterEnvelope
            : 0;

        foreWingAngle = 56 + breath * 4.8 - foreFlutter;
        hindWingAngle = 61 + Math.sin(tSec * 1.52 - 0.35) * 4.2 - hindFlutter;
        foreTwistZ = -5.5 + breath * 2.2 + foreFlutter * 0.28;
        hindTwistZ = -7.5 + breath * 1.8 + hindFlutter * 0.24;
        forePitchX = 8 + foreFlutter * 0.22;
        hindPitchX = 11 + hindFlutter * 0.18;
        wingVelocityBlur = s.idleFlutterAmount * 0.22;

        // Occasional delicate golden pollen mote rising softly from his harp while resting
        if (!reducedMotion && Math.random() < dt * 2.6) {
          dustEngine.emitWingDust(
            s.x + fairyW * 0.14,
            s.y - fairyH * 0.06,
            -8,
            -26,
            fairyW * 0.36,
            1
          );
        }
      }

      // Advance organic second-order springs for every articulated joint
      const headStiff = isFlying ? 52 : 24;
      const headDamp = isFlying ? 11.5 : 8.2;
      const headRot = stepSpring(s.headRot, targetHeadRot, headStiff, headDamp, dt);
      const headPitch = stepSpring(s.headPitch, targetHeadPitch, headStiff, headDamp, dt);
      const headYaw = stepSpring(s.headYaw, targetHeadYaw, headStiff * 0.85, headDamp, dt);

      const tabStiff = isFlying ? 42 : 18;
      const tabDamp = isFlying ? 7.2 : 6.4;
      const tabardRot = stepSpring(s.tabardRot, targetTabardRot, tabStiff, tabDamp, dt);
      const tabardPitch = stepSpring(s.tabardPitch, targetTabardPitch, tabStiff, tabDamp, dt);

      const handStiff = isFlying ? 145 : 32;
      const handDamp = isFlying ? 17.5 : 9.5;
      const rArmRot = stepSpring(s.rArmRot, targetRArmRot, handStiff, handDamp, dt);
      const rArmX = stepSpring(s.rArmX, targetRArmX, handStiff, handDamp, dt);
      const rArmY = stepSpring(s.rArmY, targetRArmY, handStiff, handDamp, dt);
      const rArmYaw = stepSpring(s.rArmYaw, targetRArmYaw, handStiff, handDamp, dt);

      const lHandRot = stepSpring(s.lHandRot, targetLHandRot, handStiff, handDamp, dt);
      const lHandX = stepSpring(s.lHandX, targetLHandX, handStiff, handDamp, dt);
      const lHandY = stepSpring(s.lHandY, targetLHandY, handStiff, handDamp, dt);

      const legStiff = isFlying ? 56 : 24;
      const legDamp = isFlying ? 9.8 : 7.8;
      const backKneeRot = stepSpring(s.backKneeRot, targetBackKnee, legStiff, legDamp, dt);
      const backAnkleRot = stepSpring(s.backAnkleRot, targetBackAnkle, legStiff * 1.1, legDamp, dt);
      const frontKneeRot = stepSpring(s.frontKneeRot, targetFrontKnee, legStiff, legDamp, dt);
      const frontAnkleRot = stepSpring(
        s.frontAnkleRot,
        targetFrontAnkle,
        legStiff * 1.1,
        legDamp,
        dt
      );

      // Update soft grounded/hovering desk shadow beneath the fairy for realistic depth
      if (groundShadowRef.current) {
        const elevation = clamp((rest.y - s.y) / Math.max(120, stageH * 0.55), 0, 1);
        const shadowW = fairyW * (0.62 + elevation * 0.42);
        const shadowH = fairyW * (0.14 + elevation * 0.08);
        const shadowY = s.y + fairyH * 0.45 + elevation * 38;
        const shadowOp = clamp(0.46 - elevation * 0.28, 0.14, 0.46);
        groundShadowRef.current.style.width = `${shadowW.toFixed(1)}px`;
        groundShadowRef.current.style.height = `${shadowH.toFixed(1)}px`;
        groundShadowRef.current.style.opacity = `${shadowOp.toFixed(2)}`;
        groundShadowRef.current.style.transform = `translate3d(${(s.x - shadowW * 0.5).toFixed(
          1
        )}px, ${(shadowY - shadowH * 0.5).toFixed(1)}px, 0)`;
      }

      // Apply continuous 3D position + breathing scale
      if (fairyRigRef.current) {
        fairyRigRef.current.style.width = `${fairyW.toFixed(1)}px`;
        fairyRigRef.current.style.height = `${fairyH.toFixed(1)}px`;
        fairyRigRef.current.style.transform = `translate3d(${(s.x - fairyW * 0.5).toFixed(
          2
        )}px, ${(s.y - fairyH * 0.5 + bodyBobY).toFixed(2)}px, 0) scale(${s.scale.toFixed(
          3
        )}, ${(s.scale * breathScaleY).toFixed(3)})`;
      }

      // Continuous 3D body turn + subtle dynamic warm environmental lighting response
      if (fairyBodyRef.current) {
        const clampedTurn = clamp(s.turnDeg, -20, 200);
        const flipX = clampedTurn >= 90 ? -1 : 1;
        const baseTurnY = clampedTurn >= 90 ? clampedTurn - 180 : clampedTurn;
        const turnMidDamp = Math.sin(clamp((clampedTurn * Math.PI) / 180, 0, Math.PI));
        const finalLocalY = baseTurnY + s.yaw * (1 - turnMidDamp * 0.85);

        // Dynamic light-catch on his armor/hair when turning toward the desk lamp or strumming chords
        const lightCatch =
          1.01 + s.stringGlowOpacity * 0.065 + Math.cos((finalLocalY * Math.PI) / 180) * 0.03;
        const shadowShiftX = clamp(-s.roll * 0.45, -8, 8);

        fairyBodyRef.current.style.transform = `rotateZ(${s.roll.toFixed(
          2
        )}deg) rotateX(${s.pitch.toFixed(2)}deg) scaleX(${flipX}) rotateY(${finalLocalY.toFixed(
          2
        )}deg)`;
        fairyBodyRef.current.style.filter = `brightness(${lightCatch.toFixed(
          3
        )}) contrast(1.035) drop-shadow(${shadowShiftX.toFixed(
          1
        )}px 16px 20px rgba(10, 6, 3, 0.58))`;
      }

      // Warm golden volumetric rim glow responding to harp resonance & motion
      if (rimGlowRef.current) {
        const rimOp = isFlying
          ? 0.24 + s.stringGlowOpacity * 0.34 + speedNorm * 0.14
          : 0.16 + Math.sin(tSec * 1.52) * 0.05;
        rimGlowRef.current.style.opacity = `${rimOp.toFixed(2)}`;
      }

      // --- APPLY 4 INDEPENDENT 3D WINGS + LIVE IRIDESCENT SPECULAR SHEEN ---
      const applyWingStyle = (
        el: HTMLDivElement | null,
        imgEl: HTMLImageElement | null,
        angle: number,
        pitchX: number,
        twistZ: number,
        zPx: number,
        mirrorX: boolean,
        isHind: boolean
      ) => {
        if (!el) return;
        const clampedAngle = clamp(angle, 10, 84);
        const mirrorPrefix = mirrorX ? 'scaleX(-1) ' : '';
        el.style.transform = `translate3d(0, 0, ${zPx}px) ${mirrorPrefix}rotateY(${clampedAngle.toFixed(
          2
        )}deg) rotateX(${pitchX.toFixed(2)}deg) rotateZ(${twistZ.toFixed(2)}deg)`;

        if (imgEl) {
          // Prismatic iridescent glint peaks as wing face sweeps across the warm overhead light cone (~36..54°)
          const glint = Math.exp(-Math.pow((clampedAngle - 44) / 16, 2));
          const bright = 1.0 + glint * 0.24 + s.stringGlowOpacity * 0.08;
          const sat = 1.04 + glint * 0.28;
          const hue = (glint - 0.5) * 14 + (isHind ? -4 : 3);
          const motionOpacity = isHind
            ? 0.94 - wingVelocityBlur * 0.10
            : 0.96 - wingVelocityBlur * 0.13;
          imgEl.style.opacity = `${motionOpacity.toFixed(2)}`;
          imgEl.style.filter = `brightness(${bright.toFixed(2)}) saturate(${sat.toFixed(
            2
          )}) hue-rotate(${hue.toFixed(1)}deg) drop-shadow(0 0 ${(
            10 +
            glint * 10
          ).toFixed(1)}px rgba(132, 255, 174, ${(0.32 + glint * 0.28).toFixed(2)}))`;
        }
      };

      applyWingStyle(
        rightForeWingRef.current,
        rightForeWingImgRef.current,
        foreWingAngle + wingTurnDiff,
        forePitchX,
        foreTwistZ,
        -15,
        false,
        false
      );
      applyWingStyle(
        rightHindWingRef.current,
        rightHindWingImgRef.current,
        hindWingAngle + wingTurnDiff * 0.85,
        hindPitchX,
        hindTwistZ,
        -19,
        false,
        true
      );
      applyWingStyle(
        leftForeWingRef.current,
        leftForeWingImgRef.current,
        foreWingAngle - wingTurnDiff,
        forePitchX,
        foreTwistZ,
        -15,
        true,
        false
      );
      applyWingStyle(
        leftHindWingRef.current,
        leftHindWingImgRef.current,
        hindWingAngle - wingTurnDiff * 0.85,
        hindPitchX,
        hindTwistZ,
        -19,
        true,
        true
      );

      // Apply articulated Head, Crown & Flowing Hair
      if (headRef.current) {
        headRef.current.style.transform = `translate3d(0, 0, 9px) rotateZ(${headRot.toFixed(
          2
        )}deg) rotateX(${headPitch.toFixed(2)}deg) rotateY(${headYaw.toFixed(2)}deg)`;
      }

      // Apply wind-swept Center Leaf-Tabard
      if (tabardRef.current) {
        tabardRef.current.style.transform = `translate3d(0, 0, 8px) rotateZ(${tabardRot.toFixed(
          2
        )}deg) rotateX(${tabardPitch.toFixed(2)}deg)`;
      }

      // Apply articulated harp-playing arm & hand transforms
      if (rightArmRef.current) {
        rightArmRef.current.style.transform = `translate3d(${rArmX.toFixed(
          2
        )}px, ${rArmY.toFixed(2)}px, 13px) rotateZ(${rArmRot.toFixed(
          2
        )}deg) rotateY(${rArmYaw.toFixed(2)}deg)`;
      }

      if (leftHandRef.current) {
        leftHandRef.current.style.transform = `translate3d(${lHandX.toFixed(
          2
        )}px, ${lHandY.toFixed(2)}px, 12px) rotateZ(${lHandRot.toFixed(
          2
        )}deg) rotateX(${(lHandRot * 0.7).toFixed(2)}deg)`;
      }

      const glintOp = isFlying
        ? Math.min(0.95, s.pluckImpulse * 0.75 + music.treble * 0.45)
        : 0;
      if (rightFingerGlintRef.current) {
        rightFingerGlintRef.current.style.opacity = `${glintOp.toFixed(2)}`;
      }
      if (leftFingerGlintRef.current) {
        leftFingerGlintRef.current.style.opacity = `${(glintOp * 0.85).toFixed(2)}`;
      }

      // Apply articulated 2-bone knee + ankle/foot transforms
      if (backShinRef.current) {
        backShinRef.current.style.transform = `translate3d(0, 0, 3px) rotateZ(${backKneeRot.toFixed(
          2
        )}deg)`;
      }
      if (backFootRef.current) {
        backFootRef.current.style.transform = `rotateZ(${backAnkleRot.toFixed(
          2
        )}deg) rotateX(${(backAnkleRot * 0.45).toFixed(2)}deg)`;
      }

      if (frontShinRef.current) {
        frontShinRef.current.style.transform = `translate3d(0, 0, 8px) rotateZ(${frontKneeRot.toFixed(
          2
        )}deg)`;
      }
      if (frontFootRef.current) {
        frontFootRef.current.style.transform = `rotateZ(${frontAnkleRot.toFixed(
          2
        )}deg) rotateX(${(frontAnkleRot * 0.4).toFixed(2)}deg)`;
      }

      if (harpAuraRef.current) {
        const auraOp = isFlying
          ? 0.44 + s.stringGlowOpacity * 0.56
          : 0.22 + Math.sin(tSec * 1.52) * 0.06;
        harpAuraRef.current.style.opacity = `${auraOp.toFixed(2)}`;
      }

      // Live physically vibrating quadratic Bézier golden harp strings
      if (harpStringsSvgRef.current) {
        const svgOp = isFlying ? Math.max(0.22, s.stringGlowOpacity * 0.96) : 0;
        harpStringsSvgRef.current.style.opacity = `${svgOp.toFixed(2)}`;
        if (svgOp > 0.02) {
          for (let k = 0; k < HARP_STRINGS.length; k++) {
            const pathEl = harpStringPathRefs.current[k];
            if (!pathEl) continue;
            const st = HARP_STRINGS[k];
            const amp = s.stringAmps[k];
            const vib = reducedMotion ? 0 : Math.sin(tSec * st.freq + k * 1.3) * amp * 5.2;
            const mx = (st.x1 + st.x2) * 0.5 + vib;
            const my = (st.y1 + st.y2) * 0.5 + vib * 0.28;
            pathEl.setAttribute('d', `M ${st.x1} ${st.y1} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${st.x2} ${st.y2}`);
            pathEl.setAttribute('stroke-opacity', `${clamp(0.42 + amp * 0.58, 0.42, 1).toFixed(2)}`);
            pathEl.setAttribute('stroke-width', `${(1.35 + amp * 0.85).toFixed(2)}`);
          }
        }
      }

      // Render high-performance additive golden fairy dust + silky flight vortex ribbon
      dustEngine.updateAndRender(ctx, stageW, stageH, dt, tSec);

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [isFlying]);

  return (
    <div
      ref={stageOverlayRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[35] overflow-hidden select-none"
    >
      {/* Real-time 60fps Additive Golden Fairy Dust & Silky Flight Vortex Canvas */}
      <canvas
        ref={dustCanvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full"
      />

      {/* Soft Dynamic Ambient Shadow grounded on the workshop desk */}
      <div
        ref={groundShadowRef}
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(14, 7, 3, 0.78) 0%, rgba(18, 9, 4, 0.36) 48%, rgba(18, 9, 4, 0) 76%)',
          willChange: 'transform, opacity',
        }}
        className="pointer-events-none absolute top-0 left-0 rounded-full blur-[6px]"
      />

      {/* 3D Articulated Male Fairy Playing Harp with Independent Dual-Pair Wings, Head/Gaze & Spring Physics */}
      <div
        ref={fairyRigRef}
        style={{
          perspective: '1180px',
          perspectiveOrigin: '50% 42%',
          willChange: 'transform',
        }}
        className="absolute top-0 left-0"
      >
        <div
          ref={fairyBodyRef}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'visible',
            willChange: 'transform, filter',
          }}
          className="relative w-full h-full"
        >
          {/* Left 3D Translucent Gossamer Hindwing (lower, phase-lagged) */}
          {assets?.hindWingUrl && (
            <div
              ref={leftHindWingRef}
              style={{
                position: 'absolute',
                left: '36%',
                top: '1%',
                width: '108%',
                height: '58%',
                transformOrigin: '15.5% 59.2%',
                backfaceVisibility: 'visible',
                willChange: 'transform',
              }}
            >
              <img
                ref={leftHindWingImgRef}
                src={assets.hindWingUrl}
                alt=""
                draggable={false}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Left 3D Translucent Gossamer Forewing (upper, leading aerodynamic stroke) */}
          {assets?.foreWingUrl && (
            <div
              ref={leftForeWingRef}
              style={{
                position: 'absolute',
                left: '36%',
                top: '1%',
                width: '108%',
                height: '58%',
                transformOrigin: '15.5% 55.8%',
                backfaceVisibility: 'visible',
                willChange: 'transform',
              }}
            >
              <img
                ref={leftForeWingImgRef}
                src={assets.foreWingUrl}
                alt=""
                draggable={false}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Right 3D Translucent Gossamer Hindwing (lower, phase-lagged) */}
          {assets?.hindWingUrl && (
            <div
              ref={rightHindWingRef}
              style={{
                position: 'absolute',
                left: '36%',
                top: '1%',
                width: '108%',
                height: '58%',
                transformOrigin: '15.5% 59.2%',
                backfaceVisibility: 'visible',
                willChange: 'transform',
              }}
            >
              <img
                ref={rightHindWingImgRef}
                src={assets.hindWingUrl}
                alt=""
                draggable={false}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Right 3D Translucent Gossamer Forewing (upper, leading aerodynamic stroke) */}
          {assets?.foreWingUrl && (
            <div
              ref={rightForeWingRef}
              style={{
                position: 'absolute',
                left: '36%',
                top: '1%',
                width: '108%',
                height: '58%',
                transformOrigin: '15.5% 55.8%',
                backfaceVisibility: 'visible',
                willChange: 'transform',
              }}
            >
              <img
                ref={rightForeWingImgRef}
                src={assets.foreWingUrl}
                alt=""
                draggable={false}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Subtle Warm Volumetric Rim Aura behind shoulders & crown */}
          <div
            ref={rimGlowRef}
            style={{
              transform: 'translate3d(0, 0, -4px)',
              background:
                'radial-gradient(ellipse at 52% 34%, rgba(255, 224, 130, 0.42) 0%, rgba(132, 236, 166, 0.24) 44%, rgba(0, 0, 0, 0) 74%)',
              opacity: 0.18,
            }}
            className="pointer-events-none absolute inset-[6%] rounded-full blur-xl"
          />

          {/* Warm Golden Harp Glow synced to live music */}
          <div
            ref={harpAuraRef}
            style={{
              transform: 'translate3d(0, 0, 2px)',
            }}
            className="pointer-events-none absolute right-[2%] top-[24%] w-[42%] aspect-square rounded-full bg-[#ffd966]/55 blur-xl"
          />

          {/* Articulated Back Leg (Knee Pivot) + Nested Back Foot (Ankle Buckle Pivot) */}
          {assets?.backShinUrl && (
            <div
              ref={backShinRef}
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '38.8% 70.2%',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
            >
              <img
                src={assets.backShinUrl}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain block select-none"
              />
              {assets.backFootUrl && (
                <div
                  ref={backFootRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transformOrigin: '52.2% 84.4%',
                    willChange: 'transform',
                  }}
                >
                  <img
                    src={assets.backFootUrl}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain block select-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Base Torso, Pauldrons, Upper Thighs & Carved Golden Harp */}
          {assets && (
            <img
              src={assets.torsoUrl}
              alt="Hada varón tocando el arpa con alas batientes"
              draggable={false}
              style={{
                transform: 'translate3d(0, 0, 6px)',
              }}
              className="relative z-10 w-full h-full object-contain block select-none"
            />
          )}

          {/* Articulated Wind-Swept Center Leaf-Tabard */}
          {assets?.tabardUrl && (
            <div
              ref={tabardRef}
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '44.2% 44.0%',
                willChange: 'transform',
              }}
            >
              <img
                src={assets.tabardUrl}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain block select-none"
              />
            </div>
          )}

          {/* Articulated Head, Laurel Crown, Neck & Flowing Hair (musical nod + subtle gaze) */}
          {assets?.headUrl && (
            <div
              ref={headRef}
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '49.8% 16.6%',
                willChange: 'transform',
              }}
            >
              <img
                src={assets.headUrl}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain block select-none"
              />
            </div>
          )}

          {/* Articulated Front Leg (Knee Pivot) + Nested Front Foot (Ankle Buckle Pivot) */}
          {assets?.frontShinUrl && (
            <div
              ref={frontShinRef}
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '61.6% 72.8%',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
            >
              <img
                src={assets.frontShinUrl}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain block select-none"
              />
              {assets.frontFootUrl && (
                <div
                  ref={frontFootRef}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    transformOrigin: '64.8% 90.6%',
                    willChange: 'transform',
                  }}
                >
                  <img
                    src={assets.frontFootUrl}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain block select-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Live Physically Vibrating Golden Harp Strings (Quadratic Bézier Oscillation) */}
          <svg
            ref={harpStringsSvgRef}
            viewBox="0 0 100 100"
            style={{
              transform: 'translate3d(0, 0, 10px)',
              opacity: 0,
              filter: 'drop-shadow(0 0 3px rgba(255, 224, 118, 0.9))',
            }}
            className="pointer-events-none absolute left-[62%] top-[27%] w-[26%] h-[23%] z-20"
            fill="none"
          >
            {HARP_STRINGS.map((st, idx) => (
              <path
                key={idx}
                ref={(el) => {
                  harpStringPathRefs.current[idx] = el;
                }}
                d={`M ${st.x1} ${st.y1} Q ${(st.x1 + st.x2) * 0.5} ${(st.y1 + st.y2) * 0.5} ${st.x2} ${st.y2}`}
                stroke="#FFF6C4"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeOpacity="0.72"
              />
            ))}
          </svg>

          {/* Articulated Left Hand & Wrist plucking lower harp strings */}
          {assets?.leftHandUrl && (
            <div
              ref={leftHandRef}
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '74.5% 38.5%',
                willChange: 'transform',
              }}
            >
              <img
                src={assets.leftHandUrl}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain block select-none"
              />
              <div
                ref={leftFingerGlintRef}
                style={{ opacity: 0 }}
                className="pointer-events-none absolute left-[77%] top-[39%] w-[10%] aspect-square rounded-full bg-[#fff2b2]/80 blur-[4px]"
              />
            </div>
          )}

          {/* Articulated Right Forearm & Hand strumming upper/middle harp strings */}
          {assets?.rightArmUrl && (
            <div
              ref={rightArmRef}
              style={{
                position: 'absolute',
                inset: 0,
                transformOrigin: '33.5% 33.2%',
                willChange: 'transform',
              }}
            >
              <img
                src={assets.rightArmUrl}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain block select-none"
              />
              <div
                ref={rightFingerGlintRef}
                style={{ opacity: 0 }}
                className="pointer-events-none absolute left-[60%] top-[30%] w-[11%] aspect-square rounded-full bg-[#fff5c4]/85 blur-[4px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
