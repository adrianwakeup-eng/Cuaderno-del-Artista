import React, { useEffect, useRef, useState } from 'react';
import fairyCelticHarpImg from '../assets/images/fairy_celtic_harp_play_1795185706248.jpg';
import fairyWingImg from '../assets/images/fairy_emerald_wing_1795185391561.jpg';
import { fairyMusicPlayer } from '../utils/fairyMusicPlayer';
import { GoldenFairyDustEngine } from '../utils/goldenFairyDust';

interface ProcessedFairyAssets {
  torsoUrl: string;
  rightArmUrl: string;
  leftHandUrl: string;
  backShinUrl: string;
  backFootUrl: string;
  frontShinUrl: string;
  frontFootUrl: string;
  wingUrl: string;
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
 * Cleanly extracts the male harp-playing fairy from his white background and
 * segments him into seamless, overlapping articulated layers:
 * - torso + head + harp + upper thighs (with behind-forearm tunic inpainted)
 * - right forearm & hand (pivoting from right elbow to strum/pluck upper-mid strings)
 * - left hand & wrist (pivoting from left wrist to pluck/accompany lower strings)
 * - back lower leg (knee pivot) + nested back foot (ankle buckle pivot)
 * - front lower leg (knee pivot) + nested front foot (ankle buckle pivot)
 */
function extractArticulatedFairyParts(
  img: HTMLImageElement
): Omit<ProcessedFairyAssets, 'wingUrl'> {
  const maxH = 920;
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
      rightArmUrl: '',
      leftHandUrl: '',
      backShinUrl: '',
      backFootUrl: '',
      frontShinUrl: '',
      frontFootUrl: '',
    };
  }

  ctx.drawImage(img, 0, 0, w, h);
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

  for (let y = 1; y < h - 1; y++) {
    const ny = y / h;
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      if (isBg[idx] || isProtected(x / w, ny)) continue;

      let touchesBg = false;
      for (let oy = -1; oy <= 1 && !touchesBg; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (isBg[(y + oy) * w + (x + ox)]) {
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

      if (lum > 188 && chroma < 42) {
        const aNorm = Math.max(0.04, Math.min(1, (242 - lum) / 56 + chroma / 75));
        src[p] = Math.max(0, Math.min(255, Math.round((r - (1 - aNorm) * 255) / aNorm)));
        src[p + 1] = Math.max(0, Math.min(255, Math.round((g - (1 - aNorm) * 255) / aNorm)));
        src[p + 2] = Math.max(0, Math.min(255, Math.round((b - (1 - aNorm) * 255) / aNorm)));
        src[p + 3] = Math.round(aNorm * 255);
      }
    }
  }

  // Step 2: Allocate articulated layer buffers
  const torso = new Uint8ClampedArray(src);
  const rightArm = new Uint8ClampedArray(w * h * 4);
  const leftHand = new Uint8ClampedArray(w * h * 4);
  const backShin = new Uint8ClampedArray(w * h * 4);
  const backFoot = new Uint8ClampedArray(w * h * 4);
  const frontShin = new Uint8ClampedArray(w * h * 4);
  const frontFoot = new Uint8ClampedArray(w * h * 4);

  const legDividerX = (ny: number) =>
    0.502 + Math.max(0, (ny - 0.675) / 0.245) * 0.09;

  const isWarmSkin = (r: number, g: number, b: number) =>
    r > 78 && r > b + 14 && r >= g + 3 && g > b + 4;

  // Helper to copy a pixel with weight into a destination buffer
  const writeWeighted = (
    dest: Uint8ClampedArray,
    p: number,
    weight: number
  ) => {
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
        // Taper the band cleanly from the elbow bracer out to the fingers
        const topEdge = nx < 0.52 ? 0.296 : 0.291;
        const botEdge = nx < 0.52 ? 0.362 : 0.364;
        const inLeft = smoothstep(0.308, 0.348, nx);
        const inTop = smoothstep(topEdge - 0.008, topEdge + 0.010, ny);
        const inBot = 1 - smoothstep(botEdge - 0.010, botEdge + 0.008, ny);
        const inRight = 1 - smoothstep(0.672, 0.688, nx);

        let armWeight = inLeft * inTop * inBot * inRight;

        // Past the wrist onto the harp column/strings, isolate the bare hand & fingers cleanly
        if (nx > 0.605 && armWeight > 0) {
          const skinMatch = isWarmSkin(r, g, b) ? 1 : 0;
          const handBlend = smoothstep(0.605, 0.635, nx);
          armWeight *= (1 - handBlend) + handBlend * skinMatch;
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
          // Clear protruding thumb/fingers outside the wooden harp curve on the base layer
          if (nx > 0.836 && isWarmSkin(r, g, b)) {
            torso[p + 3] = Math.round(torso[p + 3] * (1 - handWeight));
          } else if (nx > 0.765 && isWarmSkin(r, g, b)) {
            // Subtly blend the covered harp-frame pixels on the base layer toward dark carved bronze
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
  // so swinging the forearm up/down never reveals a ghost duplicate arm on the chest.
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

      // Sample natural woodland tunic tones from above & below the bracer
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

      // Slightly darken to create a realistic cast shadow under the hovering forearm
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
    rightArmUrl: makeLayerDataUrl(w, h, rightArm),
    leftHandUrl: makeLayerDataUrl(w, h, leftHand),
    backShinUrl: makeLayerDataUrl(w, h, backShin),
    backFootUrl: makeLayerDataUrl(w, h, backFoot),
    frontShinUrl: makeLayerDataUrl(w, h, frontShin),
    frontFootUrl: makeLayerDataUrl(w, h, frontFoot),
  };
}

/**
 * Extracts the emerald fairy butterfly wings with authentic gossamer translucency.
 */
function extractGossamerWingPng(img: HTMLImageElement): string {
  const maxDim = 640;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return img.src;

  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

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
      queue[tail++] = idx;
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

  while (head < tail) {
    const cur = queue[head++];
    const cx = cur % w;
    const cy = (cur - cx) / w;
    if (cx > 0) tryPush(cx - 1, cy);
    if (cx < w - 1) tryPush(cx + 1, cy);
    if (cy > 0) tryPush(cx, cy - 1);
    if (cy < h - 1) tryPush(cx, cy + 1);
  }

  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    if (visited[i]) {
      d[p + 3] = 0;
      continue;
    }
    const r = d[p];
    const g = d[p + 1];
    const b = d[p + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);

    if (lum > 215 && chroma < 38) {
      const aNorm = Math.max(0.18, Math.min(0.92, (254 - lum) / 48 + chroma / 45));
      d[p] = Math.max(0, Math.min(255, Math.round((r - (1 - aNorm) * 255) / aNorm)));
      d[p + 1] = Math.max(0, Math.min(255, Math.round((g - (1 - aNorm) * 255) / aNorm)));
      d[p + 2] = Math.max(0, Math.min(255, Math.round((b - (1 - aNorm) * 255) / aNorm)));
      d[p + 3] = Math.round(aNorm * 255);
    } else {
      d[p + 3] = lum > 155 ? 226 : 248;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

function getProcessedFairyAssets(): Promise<ProcessedFairyAssets> {
  if (!cachedAssetsPromise) {
    cachedAssetsPromise = Promise.all([
      loadImage(fairyCelticHarpImg),
      loadImage(fairyWingImg),
    ])
      .then(([bodyImg, wingImg]) => ({
        ...extractArticulatedFairyParts(bodyImg),
        wingUrl: extractGossamerWingPng(wingImg),
      }))
      .catch(() => ({
        torsoUrl: fairyCelticHarpImg,
        rightArmUrl: '',
        leftHandUrl: '',
        backShinUrl: '',
        backFootUrl: '',
        frontShinUrl: '',
        frontFootUrl: '',
        wingUrl: fairyWingImg,
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

const FLIGHT_WAYPOINTS: Array<{ nx: number; ny: number; hoverSec: number }> = [
  { nx: 0.62, ny: 0.34, hoverSec: 2.8 },
  { nx: 0.28, ny: 0.28, hoverSec: 3.1 },
  { nx: 0.18, ny: 0.56, hoverSec: 2.5 },
  { nx: 0.48, ny: 0.44, hoverSec: 3.2 },
  { nx: 0.78, ny: 0.26, hoverSec: 2.9 },
  { nx: 0.38, ny: 0.62, hoverSec: 2.6 },
];

export const CoverMagicFairy: React.FC<CoverMagicFairyProps> = ({
  isFlying,
  sfxEnabled = true,
}) => {
  const stageOverlayRef = useRef<HTMLDivElement>(null);
  const dustCanvasRef = useRef<HTMLCanvasElement>(null);
  const fairyRigRef = useRef<HTMLDivElement>(null);
  const fairyBodyRef = useRef<HTMLDivElement>(null);
  const leftWingRef = useRef<HTMLDivElement>(null);
  const rightWingRef = useRef<HTMLDivElement>(null);

  // Articulated limb refs: both harp-playing hands + both knee/ankle legs & feet
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

  const [assets, setAssets] = useState<ProcessedFairyAssets | null>(null);

  const dustEngineRef = useRef<GoldenFairyDustEngine | null>(null);
  if (!dustEngineRef.current) {
    dustEngineRef.current = new GoldenFairyDustEngine();
  }

  const motionRef = useRef({
    initialized: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    roll: -7,
    pitch: 2,
    yaw: -14,
    scale: 1,
    targetFacing: 1 as 1 | -1,
    // Smooth 3D body turn angle: 0° = facing right, 180° = facing left
    turnDeg: 0,
    turnVel: 0,
    wingPhase: 0,
    pluckImpulse: 0,
    pluckPitch: 0.5,
    musicSwayCurrent: 0,
    musicNodCurrent: 0,
    stringGlowOpacity: 0,
    emitAccum: 0,
    idleFlutterTimer: 3.2,
    idleFlutterAmount: 0,
    wpIndex: 0,
    hoverRemaining: 0,
    musicSwayTarget: 0,
    // Smoothly interpolated limb angles
    rArmRot: 0,
    rArmX: 0,
    rArmY: 0,
    rArmYaw: 0,
    lHandRot: 0,
    lHandX: 0,
    lHandY: 0,
    backKneeRot: 0,
    backAnkleRot: 0,
    frontKneeRot: 0,
    frontAnkleRot: 0,
    handPhase: 0,
    legPhase: 0,
  });

  // Pre-extract seamless articulated PNGs once
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

    const getRestCoords = () => {
      const fairyW = Math.max(134, Math.min(216, stageW * 0.155));
      const fairyH = fairyW * 1.49;
      return {
        x: stageW - fairyW * 0.5,
        y: stageH - fairyH * 0.49,
        fairyW,
        fairyH,
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
      const rest = getRestCoords();
      const fairyW = rest.fairyW;
      const fairyH = rest.fairyH;

      // Continuous horizontal facing cosine: +1 facing right (0°), -1 facing left (180°)
      const turnRad = (s.turnDeg * Math.PI) / 180;
      const facingCos = Math.cos(turnRad);
      const turnMid = Math.sin(Math.max(0, Math.min(Math.PI, turnRad))); // peaks at 1.0 mid-turn

      // Sample synchronized phrasing from the uploaded MP3 track
      const music = fairyMusicPlayer.sampleFrame(tSec);

      if (isFlying && music.onsetStrength > 0) {
        s.pluckImpulse = Math.min(1.45, Math.max(s.pluckImpulse, music.onsetStrength));
        s.pluckPitch = music.pitchNorm;
        s.stringGlowOpacity = Math.min(1, 0.55 + music.onsetStrength * 0.45);
        s.musicSwayTarget = (music.pitchNorm - 0.5) * 10.5;

        if (!reducedMotion) {
          const harpX = s.x + facingCos * fairyW * (0.18 + music.pitchNorm * 0.15);
          const harpY = s.y - fairyH * (0.04 + music.pitchNorm * 0.09);
          const emitFacing: 1 | -1 = facingCos >= 0 ? 1 : -1;
          dustEngine.emitHarpNoteBurst(harpX, harpY, emitFacing, s.vx, music.isChordAccent);
        }
      }

      s.pluckImpulse = Math.max(0, s.pluckImpulse - dt * 2.5);
      s.stringGlowOpacity = Math.max(
        isFlying ? music.melody * 0.48 : 0,
        s.stringGlowOpacity - dt * 1.65
      );
      s.musicSwayCurrent +=
        (s.musicSwayTarget - s.musicSwayCurrent) * (1 - Math.exp(-dt * 3.4));
      const targetNod = s.pluckImpulse * 4.4 + music.bass * 2.2;
      s.musicNodCurrent += (targetNod - s.musicNodCurrent) * (1 - Math.exp(-dt * 8.5));

      let wingFlapAngle = 54;
      let wingTurnDiff = 0;
      let wingTwistZ = -4;
      let wingPitchX = 8;
      let bodyBobY = 0;
      let breathScaleY = 1;

      // Target limb poses
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
        const wp = FLIGHT_WAYPOINTS[s.wpIndex];
        const padX = Math.max(fairyW * 0.62, stageW * 0.1);
        const padTop = Math.max(fairyH * 0.48, stageH * 0.14);
        const padBot = Math.max(fairyH * 0.54, stageH * 0.18);

        const goalX = padX + wp.nx * Math.max(80, stageW - padX * 2);
        const goalY = padTop + wp.ny * Math.max(60, stageH - padTop - padBot);

        const driftX = Math.sin(tSec * 0.9 + s.wpIndex) * 18;
        const driftY = Math.cos(tSec * 1.15 + s.wpIndex * 1.7) * 14;
        const tx = goalX + driftX;
        const ty = goalY + driftY;

        const dx = tx - s.x;
        const dy = ty - s.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 42) {
          if (s.hoverRemaining <= 0) {
            s.hoverRemaining = wp.hoverSec;
          } else {
            s.hoverRemaining -= dt;
            if (s.hoverRemaining <= 0) {
              s.wpIndex = (s.wpIndex + 1) % FLIGHT_WAYPOINTS.length;
            }
          }
        }

        const maxSpeed = reducedMotion ? 48 : 135;
        const desiredSpeed = Math.min(maxSpeed, dist * 0.95);
        const desiredVx = dist > 1 ? (dx / dist) * desiredSpeed : 0;
        const desiredVy = dist > 1 ? (dy / dist) * desiredSpeed : 0;

        const accelSmooth = 1 - Math.exp(-dt * 2.1);
        s.vx += (desiredVx - s.vx) * accelSmooth;
        s.vy += (desiredVy - s.vy) * accelSmooth;

        s.x += s.vx * dt;
        s.y += s.vy * dt;

        const speedNorm = Math.min(1, Math.hypot(s.vx, s.vy) / maxSpeed);

        // Anticipate direction change naturally using combined velocity + upcoming target vector
        const steerSignal = s.vx * 0.72 + desiredVx * 0.28;
        if (steerSignal > 24) {
          s.targetFacing = 1;
        } else if (steerSignal < -24) {
          s.targetFacing = -1;
        }

        // Smooth organic 3D spring turn (0° = right, 180° = left) with subtle follow-through
        const targetTurnDeg = s.targetFacing === 1 ? 0 : 180;
        if (reducedMotion) {
          s.turnDeg += (targetTurnDeg - s.turnDeg) * (1 - Math.exp(-dt * 5));
          s.turnVel = 0;
        } else {
          // Slightly faster acceleration as torso glides across 90° profile so it never stalls edge-on
          const profileBoost = 1 + turnMid * 0.65;
          const stiffness = 26 * profileBoost;
          const damping = 8.4;
          const turnAccel = (targetTurnDeg - s.turnDeg) * stiffness - s.turnVel * damping;
          s.turnVel += turnAccel * dt;
          s.turnDeg += s.turnVel * dt;
        }

        const liveTurnRad = (s.turnDeg * Math.PI) / 180;
        const liveTurnMid = Math.sin(Math.max(0, Math.min(Math.PI, liveTurnRad)));
        const liveFacingCos = Math.cos(liveTurnRad);

        // Faster wingbeat + buoyant lift + asymmetric wing steering during a body turn
        const wingSpeed = reducedMotion
          ? 3.2
          : 24 + speedNorm * 13 + s.pluckImpulse * 3.5 + music.energy * 5 + liveTurnMid * 7.5;
        s.wingPhase += dt * wingSpeed;
        const rawSine = Math.sin(s.wingPhase);
        const shapedBeat = rawSine + 0.25 * Math.sin(s.wingPhase * 2 - 0.45);
        const beatNorm = Math.max(-1, Math.min(1, shapedBeat / 1.22));

        wingFlapAngle = 41 + beatNorm * (29 + speedNorm * 7) - liveTurnMid * 10;
        wingTurnDiff = Math.max(-15, Math.min(15, s.turnVel * 0.048));
        wingTwistZ = beatNorm * (8 + speedNorm * 4) + liveTurnMid * 6;
        wingPitchX = 11 - beatNorm * 8 + liveTurnMid * 7;

        bodyBobY = reducedMotion
          ? 0
          : -beatNorm * (3.8 + speedNorm * 1.8) +
            Math.sin(tSec * 2.1) * 3.5 -
            liveTurnMid * 11;
        breathScaleY = 1 + Math.sin(tSec * 2.3) * 0.012 + s.pluckImpulse * 0.012;

        // Natural aerodynamic banking into horizontal movement & turn angular momentum
        const turnBankRoll = Math.max(-14, Math.min(14, -s.turnVel * 0.042));
        const targetRoll =
          Math.max(-15, Math.min(15, s.vx * 0.085)) +
          turnBankRoll +
          s.musicSwayCurrent * 0.42;
        const targetPitch =
          Math.max(-11, Math.min(13, -s.vy * 0.055 + 4)) +
          s.musicNodCurrent +
          liveTurnMid * 9.5;
        // Flattering subtle 3/4 torso yaw that breathes with speed & melody
        const targetYaw =
          Math.max(-18, Math.min(18, s.vx * liveFacingCos * 0.09)) +
          Math.sin(tSec * 0.85) * 5.5 +
          s.musicSwayCurrent * 0.55;
        const targetScale =
          0.94 + Math.sin(tSec * 0.45 + 0.4) * 0.085 + liveTurnMid * 0.035;

        const rotSmooth = 1 - Math.exp(-dt * 4.6);
        s.roll += (targetRoll - s.roll) * rotSmooth;
        s.pitch += (targetPitch - s.pitch) * rotSmooth;
        s.yaw += (targetYaw - s.yaw) * rotSmooth;
        s.scale += (targetScale - s.scale) * rotSmooth;

        // --- ARTICULATED HARP-PLAYING HANDS (synced to the uploaded MP3's phrasing & accents) ---
        if (!reducedMotion) {
          s.handPhase += dt * (6.2 + music.melody * 6.5 + s.pluckImpulse * 3.2);
          const arpeggioWave = Math.sin(s.handPhase);
          const fingerTrill = Math.sin(s.handPhase * 2.35 + 0.5) * (0.4 + music.treble * 0.85);
          const registerShift = (0.5 - s.pluckPitch) * 11;

          // Right forearm & hand sweeping gracefully across upper & middle harp strings
          targetRArmRot =
            registerShift * 0.72 +
            arpeggioWave * (5.8 + music.melody * 4.5) +
            fingerTrill * 2.4 -
            s.pluckImpulse * 3.8;
          targetRArmX = 1.6 + Math.cos(s.handPhase) * 2.4 + s.pluckImpulse * 2.2;
          targetRArmY = -1.2 + Math.sin(s.handPhase * 1.4) * 2.2;
          targetRArmYaw = Math.sin(s.handPhase * 1.8) * 12 + s.pluckImpulse * 9;

          // Left hand accompanying / plucking lower-right harp strings in natural counterpoint
          const counterWave = Math.sin(s.handPhase * 0.78 + 1.85);
          const bassPluck = Math.sin(s.handPhase * 1.55 + 0.6) * (0.5 + music.bass * 0.95);
          targetLHandRot =
            -counterWave * (6.8 + music.bass * 4.8) - bassPluck * 3.6 - s.pluckImpulse * 4.2;
          targetLHandX = -1.8 + Math.sin(s.handPhase * 0.9) * 2.4 - s.pluckImpulse * 1.8;
          targetLHandY = -1.8 + counterWave * 3.6 - music.bass * 2.8;

          // --- ARTICULATED AIRBORNE LEGS & FEET (graceful flying kicks + centrifugal turn swing) ---
          s.legPhase += dt * (2.65 + speedNorm * 1.85 + music.bass * 1.25);
          const forwardVelLocal = s.vx * liveFacingCos;
          const airTrailDeg = Math.max(-14, Math.min(16, forwardVelLocal * 0.095));
          const liftDragDeg = Math.max(-8, Math.min(10, -s.vy * 0.045));
          const turnCentrifugalDeg = Math.max(-14, Math.min(14, s.turnVel * 0.052));

          const kickA = Math.sin(s.legPhase);
          const kickB = Math.sin(s.legPhase + Math.PI * 0.88);

          targetBackKnee =
            airTrailDeg + liftDragDeg + turnCentrifugalDeg + kickA * (11.5 + speedNorm * 5.5) + 4;
          targetBackAnkle =
            -kickA * 7.5 +
            Math.sin(s.legPhase * 1.7 + 0.9) * (9.5 + music.bass * 6.5) +
            airTrailDeg * 0.55 +
            turnCentrifugalDeg * 0.45;

          targetFrontKnee =
            airTrailDeg * 0.85 +
            liftDragDeg +
            turnCentrifugalDeg * 0.75 +
            kickB * (10.5 + speedNorm * 5) -
            2;
          targetFrontAnkle =
            -kickB * 6.8 +
            Math.cos(s.legPhase * 1.65 + 0.4) * (9 + music.bass * 6) +
            airTrailDeg * 0.45 +
            turnCentrifugalDeg * 0.35;
        }

        // Emit luminous golden stardust ribbon + rich swirling golden powder from his wings (extra swirl on turns)
        if (!reducedMotion) {
          const wingOriginY = s.y - fairyH * 0.13 + bodyBobY;
          dustEngine.pushFlightTrail(s.x, wingOriginY, dt, speedNorm);

          const turnBurstBoost = Math.abs(s.turnVel) > 45 ? 26 : 0;
          s.emitAccum += dt * (46 + speedNorm * 48 + turnBurstBoost);
          const toEmit = Math.floor(s.emitAccum);
          if (toEmit > 0) {
            s.emitAccum -= toEmit;
            dustEngine.emitWingDust(
              s.x,
              wingOriginY,
              s.vx,
              s.vy,
              fairyW * (1.12 + liveTurnMid * 0.2),
              toEmit
            );
          }
        }
      } else {
        const settleRate = 1 - Math.exp(-dt * 3.2);
        s.x += (rest.x - s.x) * settleRate;
        s.y += (rest.y - s.y) * settleRate;
        s.vx *= 0.86;
        s.vy *= 0.86;
        s.musicSwayTarget = 0;

        // Smoothly turn back toward resting right-facing pose (0°) when returning to corner
        s.targetFacing = 1;
        const turnAccel = (0 - s.turnDeg) * 20 - s.turnVel * 8.5;
        s.turnVel += turnAccel * dt;
        s.turnDeg += s.turnVel * dt;

        const breath = reducedMotion ? 0 : Math.sin(tSec * 1.55);
        const targetRoll = -7.5 + breath * 1.1;
        const targetPitch = 2.5 + breath * 1.3;
        const targetYaw = -15 + Math.sin(tSec * 0.72) * 3.8;

        s.roll += (targetRoll - s.roll) * settleRate;
        s.pitch += (targetPitch - s.pitch) * settleRate;
        s.yaw += (targetYaw - s.yaw) * settleRate;
        s.scale += (0.98 - s.scale) * settleRate;
        bodyBobY = reducedMotion ? 0 : breath * 2.2;
        breathScaleY = 1 + breath * 0.008;

        // Calm, subtle breathing posture for hands and feet while resting at corner edge
        targetRArmRot = breath * 1.4;
        targetLHandRot = -breath * 1.2;
        targetBackKnee = breath * 1.8;
        targetBackAnkle = Math.sin(tSec * 1.15) * 2.4;
        targetFrontKnee = -breath * 1.1;
        targetFrontAnkle = Math.cos(tSec * 1.05) * 1.8;

        s.idleFlutterTimer -= dt;
        if (s.idleFlutterTimer <= 0) {
          s.idleFlutterAmount = 1;
          s.idleFlutterTimer = 3.8 + Math.random() * 3.5;
        }
        s.idleFlutterAmount = Math.max(0, s.idleFlutterAmount - dt * 1.25);
        const flutterWave =
          s.idleFlutterAmount > 0
            ? Math.sin(tSec * 16) * 15 * s.idleFlutterAmount
            : 0;

        wingFlapAngle = 57 + breath * 4.5 - flutterWave;
        wingTwistZ = -6 + breath * 2 + flutterWave * 0.25;
        wingPitchX = 8;

        // Occasional delicate golden speck drifting off his harp while resting
        if (!reducedMotion && Math.random() < dt * 2.4) {
          dustEngine.emitWingDust(
            s.x + fairyW * 0.14,
            s.y - fairyH * 0.06,
            -8,
            -26,
            fairyW * 0.35,
            1
          );
        }
      }

      // Smooth spring-like interpolation for every articulated limb
      const handSmooth = 1 - Math.exp(-dt * (isFlying ? 14 : 4.5));
      const legSmooth = 1 - Math.exp(-dt * (isFlying ? 7.5 : 4.2));

      s.rArmRot += (targetRArmRot - s.rArmRot) * handSmooth;
      s.rArmX += (targetRArmX - s.rArmX) * handSmooth;
      s.rArmY += (targetRArmY - s.rArmY) * handSmooth;
      s.rArmYaw += (targetRArmYaw - s.rArmYaw) * handSmooth;

      s.lHandRot += (targetLHandRot - s.lHandRot) * handSmooth;
      s.lHandX += (targetLHandX - s.lHandX) * handSmooth;
      s.lHandY += (targetLHandY - s.lHandY) * handSmooth;

      s.backKneeRot += (targetBackKnee - s.backKneeRot) * legSmooth;
      s.backAnkleRot += (targetBackAnkle - s.backAnkleRot) * legSmooth;
      s.frontKneeRot += (targetFrontKnee - s.frontKneeRot) * legSmooth;
      s.frontAnkleRot += (targetFrontAnkle - s.frontAnkleRot) * legSmooth;

      // Apply continuous 3D position + scale (NO abrupt scaleX flip!)
      if (fairyRigRef.current) {
        fairyRigRef.current.style.width = `${fairyW.toFixed(1)}px`;
        fairyRigRef.current.style.height = `${fairyH.toFixed(1)}px`;
        fairyRigRef.current.style.transform = `translate3d(${(s.x - fairyW * 0.5).toFixed(
          2
        )}px, ${(s.y - fairyH * 0.5 + bodyBobY).toFixed(2)}px, 0) scale(${s.scale.toFixed(
          3
        )}, ${(s.scale * breathScaleY).toFixed(3)})`;
      }

      // Apply continuous 3D body turn that preserves Z-layer depth (wings behind, arms in front)
      // on both sides: for 0..90° use scaleX(1) rotateY(θ); for 90..180° use scaleX(-1) rotateY(θ - 180°),
      // which is C1-continuous in X across 90° and keeps Z pointing toward the camera at 180°.
      if (fairyBodyRef.current) {
        const clampedTurn = Math.max(-20, Math.min(200, s.turnDeg));
        const flipX = clampedTurn >= 90 ? -1 : 1;
        const baseTurnY = clampedTurn >= 90 ? clampedTurn - 180 : clampedTurn;
        const turnMidDamp = Math.sin(
          Math.max(0, Math.min(Math.PI, (clampedTurn * Math.PI) / 180))
        );
        const finalLocalY = baseTurnY + s.yaw * (1 - turnMidDamp * 0.85);
        fairyBodyRef.current.style.transform = `rotateZ(${s.roll.toFixed(
          2
        )}deg) rotateX(${s.pitch.toFixed(2)}deg) scaleX(${flipX}) rotateY(${finalLocalY.toFixed(
          2
        )}deg)`;
      }

      // Asymmetric steering wingbeats during turns
      if (rightWingRef.current) {
        const rightAngle = Math.max(12, Math.min(82, wingFlapAngle + wingTurnDiff));
        rightWingRef.current.style.transform = `translate3d(0, 0, -16px) rotateY(${rightAngle.toFixed(
          2
        )}deg) rotateX(${wingPitchX.toFixed(2)}deg) rotateZ(${wingTwistZ.toFixed(2)}deg)`;
      }

      if (leftWingRef.current) {
        const leftAngle = Math.max(12, Math.min(82, wingFlapAngle - wingTurnDiff));
        leftWingRef.current.style.transform = `translate3d(0, 0, -16px) scaleX(-1) rotateY(${leftAngle.toFixed(
          2
        )}deg) rotateX(${wingPitchX.toFixed(2)}deg) rotateZ(${wingTwistZ.toFixed(2)}deg)`;
      }

      // Apply articulated harp-playing arm & hand transforms
      if (rightArmRef.current) {
        rightArmRef.current.style.transform = `translate3d(${s.rArmX.toFixed(
          2
        )}px, ${s.rArmY.toFixed(2)}px, 12px) rotateZ(${s.rArmRot.toFixed(
          2
        )}deg) rotateY(${s.rArmYaw.toFixed(2)}deg)`;
      }

      if (leftHandRef.current) {
        leftHandRef.current.style.transform = `translate3d(${s.lHandX.toFixed(
          2
        )}px, ${s.lHandY.toFixed(2)}px, 11px) rotateZ(${s.lHandRot.toFixed(
          2
        )}deg) rotateX(${(s.lHandRot * 0.7).toFixed(2)}deg)`;
      }

      const glintOp = isFlying
        ? Math.min(0.95, s.pluckImpulse * 0.72 + music.treble * 0.45)
        : 0;
      if (rightFingerGlintRef.current) {
        rightFingerGlintRef.current.style.opacity = `${glintOp.toFixed(2)}`;
      }
      if (leftFingerGlintRef.current) {
        leftFingerGlintRef.current.style.opacity = `${(glintOp * 0.85).toFixed(2)}`;
      }

      // Apply articulated 2-bone knee + ankle/foot transforms for both legs
      if (backShinRef.current) {
        backShinRef.current.style.transform = `translate3d(0, 0, 3px) rotateZ(${s.backKneeRot.toFixed(
          2
        )}deg)`;
      }
      if (backFootRef.current) {
        backFootRef.current.style.transform = `rotateZ(${s.backAnkleRot.toFixed(
          2
        )}deg) rotateX(${(s.backAnkleRot * 0.45).toFixed(2)}deg)`;
      }

      if (frontShinRef.current) {
        frontShinRef.current.style.transform = `translate3d(0, 0, 8px) rotateZ(${s.frontKneeRot.toFixed(
          2
        )}deg)`;
      }
      if (frontFootRef.current) {
        frontFootRef.current.style.transform = `rotateZ(${s.frontAnkleRot.toFixed(
          2
        )}deg) rotateX(${(s.frontAnkleRot * 0.4).toFixed(2)}deg)`;
      }

      if (harpAuraRef.current) {
        const auraOp = isFlying
          ? 0.42 + s.stringGlowOpacity * 0.58
          : 0.22 + Math.sin(tSec * 1.6) * 0.06;
        harpAuraRef.current.style.opacity = `${auraOp.toFixed(2)}`;
      }
      if (harpStringsSvgRef.current) {
        harpStringsSvgRef.current.style.opacity = `${(isFlying
          ? s.stringGlowOpacity * 0.92
          : 0
        ).toFixed(2)}`;
      }

      // Render high-performance additive golden fairy dust + luminous flight ribbon
      dustEngine.updateAndRender(ctx, stageW, stageH, dt, tSec);

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [isFlying]);

  return (
    <div
      ref={stageOverlayRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[35] overflow-hidden select-none"
    >
      {/* Real-time 60fps Additive Golden Fairy Dust & Flight Ribbon Canvas */}
      <canvas
        ref={dustCanvasRef}
        className="pointer-events-none absolute inset-0 w-full h-full"
      />

      {/* 3D Articulated Male Fairy Playing Harp with Natural 3D Turning, Moving Hands & Airborne Feet */}
      <div
        ref={fairyRigRef}
        style={{
          perspective: '1150px',
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
            willChange: 'transform',
          }}
          className="relative w-full h-full drop-shadow-[0_14px_22px_rgba(0,0,0,0.62)]"
        >
            {/* Left 3D Flapping Translucent Emerald Wing */}
            {assets && (
              <div
                ref={leftWingRef}
                style={{
                  position: 'absolute',
                  left: '36%',
                  top: '1%',
                  width: '108%',
                  height: '58%',
                  transformOrigin: '14% 57%',
                  backfaceVisibility: 'visible',
                  willChange: 'transform',
                }}
              >
                <img
                  src={assets.wingUrl}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-contain drop-shadow-[0_0_14px_rgba(116,255,164,0.45)]"
                />
              </div>
            )}

            {/* Right 3D Flapping Translucent Emerald Wing */}
            {assets && (
              <div
                ref={rightWingRef}
                style={{
                  position: 'absolute',
                  left: '36%',
                  top: '1%',
                  width: '108%',
                  height: '58%',
                  transformOrigin: '14% 57%',
                  backfaceVisibility: 'visible',
                  willChange: 'transform',
                }}
              >
                <img
                  src={assets.wingUrl}
                  alt=""
                  draggable={false}
                  className="w-full h-full object-contain drop-shadow-[0_0_14px_rgba(116,255,164,0.45)]"
                />
              </div>
            )}

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

            {/* Base Torso, Head, Upper Thighs & Carved Golden Harp */}
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

            {/* Luminous Golden Harp-String Vibration Overlay synced to the uploaded soundtrack */}
            <svg
              ref={harpStringsSvgRef}
              viewBox="0 0 100 100"
              style={{
                transform: 'translate3d(0, 0, 9px)',
                opacity: 0,
              }}
              className="pointer-events-none absolute left-[62%] top-[27%] w-[26%] h-[23%] z-20"
              fill="none"
            >
              {[16, 28, 40, 52, 64, 76].map((xPos, idx) => (
                <line
                  key={idx}
                  x1={xPos + 14}
                  y1={12 + idx * 2}
                  x2={xPos - 10}
                  y2={86 - idx * 3}
                  stroke="#FFF3B0"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity={0.78}
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
