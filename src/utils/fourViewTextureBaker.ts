import * as THREE from 'three';
import { MALE_FOUR_VIEW_TRANSPARENT_URL } from '../data/glbAssetManifest';

/* ============================================================================
   FOUR-VIEW ORTHOGRAPHIC PHOTO-PROJECTION TEXTURE BAKER
   Reads the user's clean transparent 4-view orthographic turnaround sheet
   (/assets/aistudio/image_96c670b6.png: Front, Left Profile, Back, Right Profile)
   and bakes seamless 360° PBR albedo, Sobel micro-relief normal, and skin
   roughness maps directly onto our rigged SkinnedMesh male avatar:
   - Head albedo + normal + roughness (real face, eyes, brows, beard, ears, curls)
   - Torso & Pelvis albedo + normal (real pecs, 6-pack abs, traps, lats, glutes)
   - White atelier boxer brief texture sampled directly from the reference
   - Unified calibrated limb skin albedo + micro-pore normal map
 ============================================================================ */

export interface BakedAvatarTextures {
  headAlbedo: THREE.CanvasTexture;
  headNormal: THREE.DataTexture;
  headRoughness: THREE.CanvasTexture;
  torsoAlbedo: THREE.CanvasTexture;
  torsoNormal: THREE.DataTexture;
  torsoBareWithBoxersAlbedo: THREE.CanvasTexture;
  skinAlbedo: THREE.CanvasTexture;
  skinNormal: THREE.DataTexture;
  skinRoughness: THREE.CanvasTexture;
  hairAlbedo: THREE.CanvasTexture;
  hairBump: THREE.CanvasTexture;
  sampledSkinHex: string;
}

interface ViewBounds {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  cx: number;
  w: number;
  h: number;
  /** Per-row tight opaque core span [minX, maxX] in image pixels to exclude edge halos */
  rowMinX: Int32Array;
  rowMaxX: Int32Array;
}

interface RawImageBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / Math.max(1e-5, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar referencia 4 vistas: ${src}`));
    img.src = src;
  });
}

/**
 * Extracts tight RGBA bounds and per-row opaque core spans for each of the
 * 4 orthographic figures in the turnaround sheet (Front, Profile +X, Back, Profile -X).
 */
function segmentFourViews(img: RawImageBuffer): [ViewBounds, ViewBounds, ViewBounds, ViewBounds] {
  const { data, width, height } = img;
  // Find 4 contiguous occupied X-bands across the sheet
  const colOccupied = new Uint8Array(width);
  for (let x = 0; x < width; x++) {
    let hits = 0;
    for (let y = 0; y < height; y += 3) {
      const p = (y * width + x) * 4;
      // Ignore translucent outer drop-shadow halo (alpha < 220 or dark neutral halo)
      if (data[p + 3] >= 230) {
        hits++;
        if (hits > 8) {
          colOccupied[x] = 1;
          break;
        }
      }
    }
  }

  const rawBands: Array<[number, number]> = [];
  let inBand = false;
  let startX = 0;
  for (let x = 0; x < width; x++) {
    if (colOccupied[x] && !inBand) {
      inBand = true;
      startX = x;
    } else if (!colOccupied[x] && inBand) {
      inBand = false;
      if (x - startX > width * 0.06) {
        rawBands.push([startX, x - 1]);
      }
    }
  }
  if (inBand && width - startX > width * 0.06) {
    rawBands.push([startX, width - 1]);
  }

  // Fallback equal quarters if segmentation ever finds != 4 bands
  const bands: Array<[number, number]> =
    rawBands.length === 4
      ? rawBands
      : [
          [0, Math.floor(width * 0.26)],
          [Math.floor(width * 0.28), Math.floor(width * 0.5)],
          [Math.floor(width * 0.51), Math.floor(width * 0.77)],
          [Math.floor(width * 0.78), width - 1],
        ];

  const views = bands.map(([bx0, bx1]): ViewBounds => {
    let y0 = height;
    let y1 = 0;
    let x0 = bx1;
    let x1 = bx0;
    const rowMinX = new Int32Array(height).fill(-1);
    const rowMaxX = new Int32Array(height).fill(-1);

    for (let y = 0; y < height; y++) {
      let rMin = -1;
      let rMax = -1;
      for (let x = bx0; x <= bx1; x++) {
        const p = (y * width + x) * 4;
        const a = data[p + 3];
        if (a >= 232) {
          if (rMin === -1) rMin = x;
          rMax = x;
        }
      }
      if (rMin !== -1 && rMax - rMin >= 6) {
        rowMinX[y] = rMin;
        rowMaxX[y] = rMax;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
        if (rMin < x0) x0 = rMin;
        if (rMax > x1) x1 = rMax;
      }
    }

    if (y0 >= y1) {
      y0 = 0;
      y1 = height - 1;
      x0 = bx0;
      x1 = bx1;
    }

    // Center X weighted by upper torso / head core (robust against outstretched arms)
    let sumCx = 0;
    let cntCx = 0;
    const yHeadLo = y0 + Math.floor((y1 - y0) * 0.05);
    const yHeadHi = y0 + Math.floor((y1 - y0) * 0.14);
    for (let y = yHeadLo; y <= yHeadHi; y++) {
      if (rowMinX[y] >= 0) {
        sumCx += 0.5 * (rowMinX[y] + rowMaxX[y]);
        cntCx++;
      }
    }
    const cx = cntCx > 0 ? sumCx / cntCx : 0.5 * (x0 + x1);

    return {
      x0,
      x1,
      y0,
      y1,
      cx,
      w: Math.max(1, x1 - x0),
      h: Math.max(1, y1 - y0),
      rowMinX,
      rowMaxX,
    };
  });

  return views as [ViewBounds, ViewBounds, ViewBounds, ViewBounds];
}

/**
 * Bilinearly samples a clean interior pixel from a segmented orthographic view,
 * clamping horizontally inside the opaque row core (with an inward safety inset)
 * so ZERO alpha drop-shadow fringe ever bleeds onto the 3D UV texture.
 */
function sampleCleanViewRgb(
  img: RawImageBuffer,
  view: ViewBounds,
  uRowFrac: number, // -1 (left edge of row) .. +1 (right edge of row)
  yNorm: number, // 0 (crown) .. 1 (soles)
  insetPx = 3
): [number, number, number] {
  const { data, width, height } = img;
  const yf = clamp(view.y0 + yNorm * view.h, view.y0 + 1, view.y1 - 1);
  const yInt = Math.round(yf);

  let rMin = view.rowMinX[yInt];
  let rMax = view.rowMaxX[yInt];
  if (rMin < 0 || rMax - rMin < insetPx * 2 + 2) {
    // Search nearest valid row
    for (let d = 1; d <= 18; d++) {
      const ya = clamp(yInt - d, 0, height - 1);
      const yb = clamp(yInt + d, 0, height - 1);
      if (view.rowMinX[ya] >= 0 && view.rowMaxX[ya] - view.rowMinX[ya] >= 8) {
        rMin = view.rowMinX[ya];
        rMax = view.rowMaxX[ya];
        break;
      }
      if (view.rowMinX[yb] >= 0 && view.rowMaxX[yb] - view.rowMinX[yb] >= 8) {
        rMin = view.rowMinX[yb];
        rMax = view.rowMaxX[yb];
        break;
      }
    }
  }
  if (rMin < 0) {
    rMin = view.x0 + insetPx;
    rMax = view.x1 - insetPx;
  }

  const safeMin = Math.min(rMax, rMin + insetPx);
  const safeMax = Math.max(safeMin, rMax - insetPx);
  const xf = clamp(
    safeMin + (clamp(uRowFrac, -1, 1) * 0.5 + 0.5) * (safeMax - safeMin),
    0,
    width - 1.001
  );

  const x0 = Math.floor(xf);
  const y0 = Math.floor(clamp(yf, 0, height - 1.001));
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const fx = xf - x0;
  const fy = yf - y0;

  const p00 = (y0 * width + x0) * 4;
  const p10 = (y0 * width + x1) * 4;
  const p01 = (y1 * width + x0) * 4;
  const p11 = (y1 * width + x1) * 4;

  const r =
    (data[p00] * (1 - fx) + data[p10] * fx) * (1 - fy) +
    (data[p01] * (1 - fx) + data[p11] * fx) * fy;
  const g =
    (data[p00 + 1] * (1 - fx) + data[p10 + 1] * fx) * (1 - fy) +
    (data[p01 + 1] * (1 - fx) + data[p11 + 1] * fx) * fy;
  const b =
    (data[p00 + 2] * (1 - fx) + data[p10 + 2] * fx) * (1 - fy) +
    (data[p01 + 2] * (1 - fx) + data[p11 + 2] * fx) * fy;

  return [r, g, b];
}

/**
 * Samples by absolute pixel X offset from the view's center `cx` (clamped inside opaque row core).
 * Essential for torso sampling on Front/Back views so hanging arms are excluded cleanly!
 */
function sampleCenteredViewRgb(
  img: RawImageBuffer,
  view: ViewBounds,
  dxNorm: number, // -1 .. +1 relative to halfSpanPx
  halfSpanPx: number,
  yNorm: number,
  insetPx = 3
): [number, number, number] {
  const { data, width, height } = img;
  const yf = clamp(view.y0 + yNorm * view.h, view.y0 + 1, view.y1 - 1);
  const yInt = Math.round(yf);
  const rMin = view.rowMinX[yInt] >= 0 ? view.rowMinX[yInt] + insetPx : view.x0 + insetPx;
  const rMax = view.rowMaxX[yInt] >= 0 ? view.rowMaxX[yInt] - insetPx : view.x1 - insetPx;

  const rawX = view.cx + dxNorm * halfSpanPx;
  const xf = clamp(rawX, Math.min(rMin, rMax), Math.max(rMin, rMax));
  const x0 = clamp(Math.floor(xf), 0, width - 2);
  const y0 = clamp(Math.floor(yf), 0, height - 2);
  const fx = xf - x0;
  const fy = yf - y0;

  const p00 = (y0 * width + x0) * 4;
  const p10 = (y0 * width + x0 + 1) * 4;
  const p01 = ((y0 + 1) * width + x0) * 4;
  const p11 = ((y0 + 1) * width + x0 + 1) * 4;

  const r =
    (data[p00] * (1 - fx) + data[p10] * fx) * (1 - fy) +
    (data[p01] * (1 - fx) + data[p11] * fx) * fy;
  const g =
    (data[p00 + 1] * (1 - fx) + data[p10 + 1] * fx) * (1 - fy) +
    (data[p01 + 1] * (1 - fx) + data[p11 + 1] * fx) * fy;
  const b =
    (data[p00 + 2] * (1 - fx) + data[p10 + 2] * fx) * (1 - fy) +
    (data[p01 + 2] * (1 - fx) + data[p11 + 2] * fx) * fy;

  return [r, g, b];
}

/**
 * Generates a linear Tangent-Space Normal Map from an RGBA canvas's luminance
 * combined with high-frequency organic skin micro-pores.
 */
function buildNormalFromLuminanceCanvas(
  canvas: HTMLCanvasElement,
  strength: number,
  poreStrength: number,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.DataTexture {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const src = ctx.getImageData(0, 0, w, h).data;
  const lum = new Float32Array(w * h);

  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    // Deterministic subtle organic skin pore grain
    const x = i % w;
    const y = (i - x) / w;
    const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const pore = (hash - Math.floor(hash) - 0.5) * poreStrength;
    lum[i] = (0.299 * src[p] + 0.587 * src[p + 1] + 0.114 * src[p + 2]) / 255 + pore;
  }

  const out = new Uint8Array(w * h * 4);
  const sample = (x: number, y: number): number => {
    const wx = ((x % w) + w) % w;
    const wy = clamp(y, 0, h - 1);
    return lum[wy * w + wx];
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dX = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dY = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const dZ = 1.0;
      const invLen = 1 / Math.hypot(dX, dY, dZ);

      const idx = (y * w + x) * 4;
      out[idx] = Math.round((-dX * invLen * 0.5 + 0.5) * 255);
      out[idx + 1] = Math.round((-dY * invLen * 0.5 + 0.5) * 255);
      out[idx + 2] = Math.round((dZ * invLen * 0.5 + 0.5) * 255);
      out[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(out, w, h, THREE.RGBAFormat);
  tex.flipY = true;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = repeatY > 1 ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Samples the clean warm athletic skin color directly from the reference chest & shoulders.
 */
function sampleAverageSkinColor(img: RawImageBuffer, front: ViewBounds): [number, number, number] {
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let n = 0;
  const halfChest = front.w * 0.24;
  for (let y = 0.21; y <= 0.34; y += 0.015) {
    for (let dx = -0.65; dx <= 0.65; dx += 0.18) {
      const [r, g, b] = sampleCenteredViewRgb(img, front, dx, halfChest, y, 4);
      if (r > 130 && r > b + 20) {
        sr += r;
        sg += g;
        sb += b;
        n++;
      }
    }
  }
  if (n < 4) return [204, 152, 114];
  return [sr / n, sg / n, sb / n];
}

/**
 * Bakes a 1024x512 seamless 360° photographic Head Albedo + Roughness map
 * directly from the 4 orthographic head views (Front, Left Profile +X, Back, Right Profile -X).
 *
 * UV convention matching our sculpted head geometry:
 *  - u = 0 / 1 -> +Z (front nose center)
 *  - u = 0.25  -> +X (character's left side / viewer's right) -> Col 1 (left-facing profile!)
 *  - u = 0.50  -> -Z (back of head) -> Col 2 (back view!)
 *  - u = 0.75  -> -X (character's right side / viewer's left) -> Col 3 (right-facing profile!)
 *  - v = 0 (canvas bottom) -> under-chin / neck join (yNorm ≈ 0.146)
 *  - v = 1 (canvas top)    -> top of curly hair crown (yNorm ≈ 0.004)
 */
function bakeFourViewHeadMaps(
  img: RawImageBuffer,
  views: [ViewBounds, ViewBounds, ViewBounds, ViewBounds],
  baseSkin: [number, number, number],
  maxAnisotropy: number
): {
  albedo: THREE.CanvasTexture;
  normal: THREE.DataTexture;
  roughness: THREE.CanvasTexture;
} {
  const [frontView, profLeftSideView, backView, profRightSideView] = views;
  const w = 1024;
  const h = 512;

  const colCanvas = document.createElement('canvas');
  colCanvas.width = w;
  colCanvas.height = h;
  const cctx = colCanvas.getContext('2d')!;
  const colData = cctx.createImageData(w, h);

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const rctx = roughCanvas.getContext('2d')!;
  const roughData = rctx.createImageData(w, h);

  // Calibrated vertical span of the head in the 4-view reference sheet:
  // Crown at yNorm = 0.005, chin bottom at yNorm = 0.144
  const headTopY = 0.005;
  const headChinY = 0.144;

  for (let py = 0; py < h; py++) {
    // v = 1 at top (crown), v = 0 at bottom (chin)
    const v = 1 - py / (h - 1);
    const phi = v * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = -Math.cos(phi); // -1 at chin, +1 at crown

    // Nonlinear orthographic mapping matching spherical Y = 0.5*(1 - cosPhi)
    const orthoYFromTop = 0.5 * (1 - cosPhi); // 0 at crown, 1 at chin
    const yNorm = clamp(headTopY + orthoYFromTop * (headChinY - headTopY), 0.002, 0.165);

    for (let px = 0; px < w; px++) {
      const u = px / (w - 1);
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta); // +1 on +X (character's left), -1 on -X (character's right)
      const cosT = Math.cos(theta); // +1 on +Z (front), -1 on -Z (back)

      // Outward spherical normal direction for view weighting
      const nx = sinT * sinPhi;
      const nz = cosT * sinPhi;

      // Sharp power weights prevent double-ghosting across front/profile transitions
      const wFront = Math.pow(Math.max(0, cosT), 3.4);
      const wBack = Math.pow(Math.max(0, -cosT), 3.4);
      const wPosX = Math.pow(Math.max(0, sinT), 3.4); // Character's left profile (Col 1, nose facing left)
      const wNegX = Math.pow(Math.max(0, -sinT), 3.4); // Character's right profile (Col 3, nose facing right)

      let r = 0;
      let g = 0;
      let b = 0;
      let wSum = 0;

      if (wFront > 0.001) {
        // Front view: sinT in [-1, 1] maps directly left->right across face row
        const [fr, fg, fb] = sampleCleanViewRgb(img, frontView, sinT * 0.94, yNorm, 3);
        r += fr * wFront;
        g += fg * wFront;
        b += fb * wFront;
        wSum += wFront;
      }

      if (wBack > 0.001) {
        // Back view: looking from -Z, +X is on left of photo, -X is on right of photo -> -sinT
        const [br, bg, bb] = sampleCleanViewRgb(img, backView, -sinT * 0.94, yNorm, 3);
        r += br * wBack;
        g += bg * wBack;
        b += bb * wBack;
        wSum += wBack;
      }

      if (wPosX > 0.001) {
        // Col 1 (+X side, facing left): +Z (nose) is on LEFT (-1), -Z (back hair) is on RIGHT (+1) -> -cosT
        const [lr, lg, lb] = sampleCleanViewRgb(img, profLeftSideView, -cosT * 0.92, yNorm, 3);
        r += lr * wPosX;
        g += lg * wPosX;
        b += lb * wPosX;
        wSum += wPosX;
      }

      if (wNegX > 0.001) {
        // Col 3 (-X side, facing right): +Z (nose) is on RIGHT (+1), -Z (back hair) is on LEFT (-1) -> +cosT
        const [rr, rg, rb] = sampleCleanViewRgb(img, profRightSideView, cosT * 0.92, yNorm, 3);
        r += rr * wNegX;
        g += rg * wNegX;
        b += rb * wNegX;
        wSum += wNegX;
      }

      if (wSum > 0.0001) {
        r /= wSum;
        g /= wSum;
        b /= wSum;
      } else {
        [r, g, b] = baseSkin;
      }

      // Smoothly blend extreme bottom pole (under-chin neck socket) to unified base skin tone
      const neckBlend = 1 - smoothstep(0.02, 0.11, v);
      if (neckBlend > 0) {
        r = r * (1 - neckBlend) + baseSkin[0] * 0.86 * neckBlend;
        g = g * (1 - neckBlend) + baseSkin[1] * 0.84 * neckBlend;
        b = b * (1 - neckBlend) + baseSkin[2] * 0.84 * neckBlend;
      }

      // Compute realistic per-pixel roughness: hair matte (0.86), skin warm satin (0.50), nose/cheek subtle glow (0.44)
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const isHairPixel = lum < 0.24 && (v > 0.62 || cosT < -0.15);
      const tZoneGlow =
        Math.exp(-Math.pow(nx / 0.35, 2)) *
        Math.exp(-Math.pow((v - 0.48) / 0.18, 2)) *
        Math.max(0, nz);
      const roughVal = isHairPixel ? 0.88 : clamp(0.55 - tZoneGlow * 0.1, 0.42, 0.72);
      const rByte = Math.round(roughVal * 255);

      const idx = (py * w + px) * 4;
      colData.data[idx] = clamp(Math.round(r), 0, 255);
      colData.data[idx + 1] = clamp(Math.round(g), 0, 255);
      colData.data[idx + 2] = clamp(Math.round(b), 0, 255);
      colData.data[idx + 3] = 255;

      roughData.data[idx] = rByte;
      roughData.data[idx + 1] = rByte;
      roughData.data[idx + 2] = rByte;
      roughData.data[idx + 3] = 255;
    }
  }

  cctx.putImageData(colData, 0, 0);
  rctx.putImageData(roughData, 0, 0);

  const albedo = new THREE.CanvasTexture(colCanvas);
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.ClampToEdgeWrapping;
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = maxAnisotropy;

  const roughness = new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.ClampToEdgeWrapping;
  roughness.anisotropy = maxAnisotropy;

  const normal = buildNormalFromLuminanceCanvas(colCanvas, 0.85, 0.012, maxAnisotropy);
  return { albedo, normal, roughness };
}

/**
 * Bakes 1024x1024 photographic Torso + Pelvis textures (both bare-skin under garments
 * AND with the authentic white Calvin Klein boxers from the 4-view reference!).
 * Uses strictly Front (+Z) and Back (-Z) torso spans so hanging arms on profile views
 * NEVER ghost onto the ribcage or obliques!
 */
function bakeTorsoAndPelvisMaps(
  img: RawImageBuffer,
  views: [ViewBounds, ViewBounds, ViewBounds, ViewBounds],
  baseSkin: [number, number, number],
  maxAnisotropy: number
): {
  bareAlbedo: THREE.CanvasTexture;
  withBoxersAlbedo: THREE.CanvasTexture;
  normal: THREE.DataTexture;
} {
  const [frontView, , backView] = views;
  const w = 1024;
  const h = 1024;

  const bareCanvas = document.createElement('canvas');
  bareCanvas.width = w;
  bareCanvas.height = h;
  const bctx = bareCanvas.getContext('2d')!;
  const bareData = bctx.createImageData(w, h);

  const boxCanvas = document.createElement('canvas');
  boxCanvas.width = w;
  boxCanvas.height = h;
  const xctx = boxCanvas.getContext('2d')!;
  const boxData = xctx.createImageData(w, h);

  // Calibrated vertical span of torso + pelvis in image_96c670b6.png:
  // Upper neck under chin at yNorm = 0.135, lower white boxer hem at yNorm = 0.555
  const torsoTopY = 0.135;
  const torsoBotY = 0.555;

  for (let py = 0; py < h; py++) {
    // v = 1 at top (neck base), v = 0 at bottom (groin/pelvis bottom)
    const v = 1 - py / (h - 1);
    const yNorm = torsoTopY + (1 - v) * (torsoBotY - torsoTopY);

    // Anatomical torso half-width in pixels inside Front & Back views (strictly inside armpits!)
    const waistFactor =
      v > 0.86
        ? 0.24 - (v - 0.86) * 0.9
        : v > 0.58
          ? 0.26 + (v - 0.58) * 0.18
          : v > 0.36
            ? 0.22 + (v - 0.36) * 0.18
            : 0.265;
    const frontHalfW = frontView.w * waistFactor;
    const backHalfW = backView.w * waistFactor;

    const inBoxerZone = smoothstep(0.398, 0.412, yNorm);

    for (let px = 0; px < w; px++) {
      const u = px / (w - 1);
      const theta = u * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      // Front/Back orthographic sampling with smooth lateral skin fill on upper flanks ONLY
      // (zero skin side-fill in the white boxer zone so boxers wrap seamlessly 360° around hips!)
      const wFront = Math.pow(Math.max(0, cosT + 0.18), 2.1);
      const wBack = Math.pow(Math.max(0, -cosT + 0.18), 2.1);
      const wSideFill = Math.pow(Math.abs(sinT), 5.0) * 0.52 * (1 - inBoxerZone);

      const [fr, fg, fb] = sampleCenteredViewRgb(img, frontView, sinT * 0.86, frontHalfW, yNorm, 4);
      const [br, bg, bb] = sampleCenteredViewRgb(img, backView, -sinT * 0.86, backHalfW, yNorm, 4);

      const denom = Math.max(0.0001, wFront + wBack + wSideFill);
      const rBox = (fr * wFront + br * wBack + baseSkin[0] * 0.92 * wSideFill) / denom;
      const gBox = (fg * wFront + bg * wBack + baseSkin[1] * 0.9 * wSideFill) / denom;
      const bBox = (fb * wFront + bb * wBack + baseSkin[2] * 0.9 * wSideFill) / denom;

      // For the bare torso (used when clothed so white boxer pixels never peek near waistbands),
      // replace the white boxer region (yNorm > 0.40) cleanly with warm athletic skin tone
      const isBoxerZone = smoothstep(0.39, 0.425, yNorm);
      const rBare = rBox * (1 - isBoxerZone) + baseSkin[0] * 0.93 * isBoxerZone;
      const gBare = gBox * (1 - isBoxerZone) + baseSkin[1] * 0.91 * isBoxerZone;
      const bBare = bBox * (1 - isBoxerZone) + baseSkin[2] * 0.91 * isBoxerZone;

      const idx = (py * w + px) * 4;
      boxData.data[idx] = clamp(Math.round(rBox), 0, 255);
      boxData.data[idx + 1] = clamp(Math.round(gBox), 0, 255);
      boxData.data[idx + 2] = clamp(Math.round(bBox), 0, 255);
      boxData.data[idx + 3] = 255;

      bareData.data[idx] = clamp(Math.round(rBare), 0, 255);
      bareData.data[idx + 1] = clamp(Math.round(gBare), 0, 255);
      bareData.data[idx + 2] = clamp(Math.round(bBare), 0, 255);
      bareData.data[idx + 3] = 255;
    }
  }

  bctx.putImageData(bareData, 0, 0);
  xctx.putImageData(boxData, 0, 0);

  const bareAlbedo = new THREE.CanvasTexture(bareCanvas);
  bareAlbedo.wrapS = THREE.RepeatWrapping;
  bareAlbedo.wrapT = THREE.ClampToEdgeWrapping;
  bareAlbedo.colorSpace = THREE.SRGBColorSpace;
  bareAlbedo.anisotropy = maxAnisotropy;

  const withBoxersAlbedo = new THREE.CanvasTexture(boxCanvas);
  withBoxersAlbedo.wrapS = THREE.RepeatWrapping;
  withBoxersAlbedo.wrapT = THREE.ClampToEdgeWrapping;
  withBoxersAlbedo.colorSpace = THREE.SRGBColorSpace;
  withBoxersAlbedo.anisotropy = maxAnisotropy;

  const normal = buildNormalFromLuminanceCanvas(bareCanvas, 0.95, 0.014, maxAnisotropy);
  return { bareAlbedo, withBoxersAlbedo, normal };
}

/**
 * Generates a unified warm Mediterranean athletic skin albedo, micro-pore normal,
 * and calibrated roughness map matched to the exact skin tone sampled from the 4-view reference.
 */
function buildMatchedLimbSkinMaps(
  baseSkin: [number, number, number],
  maxAnisotropy: number
): {
  albedo: THREE.CanvasTexture;
  normal: THREE.DataTexture;
  roughness: THREE.CanvasTexture;
} {
  const size = 512;
  const col = document.createElement('canvas');
  col.width = size;
  col.height = size;
  const ctx = col.getContext('2d')!;

  const [sr, sg, sb] = baseSkin;
  const rgb = (mul: number, dr = 0, dg = 0, db = 0) =>
    `rgb(${clamp(Math.round(sr * mul + dr), 0, 255)},${clamp(Math.round(sg * mul + dg), 0, 255)},${clamp(Math.round(sb * mul + db), 0, 255)})`;

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, rgb(0.95));
  grad.addColorStop(0.45, rgb(1.02));
  grad.addColorStop(0.85, rgb(0.97));
  grad.addColorStop(1, rgb(0.92));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle organic skin tone mottling & warm subsurface capillary blush
  for (let i = 0; i < 4200; i++) {
    const x = (i * 197 + 13) % size;
    const y = (i * 353 + 29) % size;
    const rad = 2 + (i % 5);
    ctx.fillStyle =
      i % 3 === 0
        ? `rgba(${clamp(Math.round(sr + 24), 0, 255)},${clamp(Math.round(sg + 14), 0, 255)},${clamp(Math.round(sb + 8), 0, 255)},0.05)`
        : i % 3 === 1
          ? `rgba(${clamp(Math.round(sr - 28), 0, 255)},${clamp(Math.round(sg - 26), 0, 255)},${clamp(Math.round(sb - 20), 0, 255)},0.045)`
          : `rgba(${clamp(Math.round(sr + 18), 0, 255)},${clamp(Math.round(sg - 10), 0, 255)},${clamp(Math.round(sb - 14), 0, 255)},0.035)`;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const rCv = document.createElement('canvas');
  rCv.width = size;
  rCv.height = size;
  const rctx = rCv.getContext('2d')!;
  rctx.fillStyle = 'rgb(142,142,142)'; // ~0.56 calibrated satin human skin roughness
  rctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2400; i++) {
    const x = (i * 131 + 7) % size;
    const y = (i * 271 + 19) % size;
    const v = 128 + ((i * 29) % 30);
    rctx.fillStyle = `rgb(${v},${v},${v})`;
    rctx.fillRect(x, y, 4, 4);
  }

  const albedo = new THREE.CanvasTexture(col);
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.repeat.set(2, 2);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = maxAnisotropy;

  const roughness = new THREE.CanvasTexture(rCv);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;
  roughness.repeat.set(2, 2);
  roughness.anisotropy = maxAnisotropy;

  const normal = buildNormalFromLuminanceCanvas(col, 0.52, 0.018, maxAnisotropy, 3, 3);
  return { albedo, normal, roughness };
}

/**
 * Generates dark curly Mediterranean hair albedo + bump texture matching the reference curls.
 */
function buildCurlyHairMaps(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const size = 256;
  const col = document.createElement('canvas');
  col.width = size;
  col.height = size;
  const ctx = col.getContext('2d')!;

  const bmp = document.createElement('canvas');
  bmp.width = size;
  bmp.height = size;
  const bctx = bmp.getContext('2d')!;

  ctx.fillStyle = '#141110';
  ctx.fillRect(0, 0, size, size);
  bctx.fillStyle = '#484848';
  bctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 520; i++) {
    const cx = (i * 73 + 17) % size;
    const cy = (i * 139 + 29) % size;
    const r = 6 + (i % 9);
    const startA = (i % 7) * 0.9;

    ctx.strokeStyle = i % 4 === 0 ? 'rgba(54, 44, 38, 0.62)' : 'rgba(8, 7, 7, 0.8)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startA, startA + Math.PI * 1.45);
    ctx.stroke();

    bctx.strokeStyle = i % 2 === 0 ? '#e6e6e6' : '#222222';
    bctx.lineWidth = 3.0;
    bctx.beginPath();
    bctx.arc(cx, cy, r, startA, startA + Math.PI * 1.45);
    bctx.stroke();
  }

  const albedo = new THREE.CanvasTexture(col);
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bmp);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.anisotropy = maxAnisotropy;

  return { albedo, bump };
}

/**
 * Loads /assets/aistudio/image_96c670b6.png and bakes the full 360° photographic
 * PBR texture suite for the male avatar.
 */
export async function bakeFourViewAvatarTextures(
  maxAnisotropy: number,
  referenceUrl = MALE_FOUR_VIEW_TRANSPARENT_URL
): Promise<BakedAvatarTextures> {
  const imgEl = await loadImage(referenceUrl);
  const w = imgEl.naturalWidth || imgEl.width;
  const h = imgEl.naturalHeight || imgEl.height;

  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(imgEl, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const buf: RawImageBuffer = { data, width: w, height: h };

  const views = segmentFourViews(buf);
  const baseSkin = sampleAverageSkinColor(buf, views[0]);
  const head = bakeFourViewHeadMaps(buf, views, baseSkin, maxAnisotropy);
  const torso = bakeTorsoAndPelvisMaps(buf, views, baseSkin, maxAnisotropy);
  const limbSkin = buildMatchedLimbSkinMaps(baseSkin, maxAnisotropy);
  const hair = buildCurlyHairMaps(maxAnisotropy);

  const sampledSkinHex = `#${new THREE.Color(
    baseSkin[0] / 255,
    baseSkin[1] / 255,
    baseSkin[2] / 255
  ).getHexString()}`;

  return {
    headAlbedo: head.albedo,
    headNormal: head.normal,
    headRoughness: head.roughness,
    torsoAlbedo: torso.bareAlbedo,
    torsoNormal: torso.normal,
    torsoBareWithBoxersAlbedo: torso.withBoxersAlbedo,
    skinAlbedo: limbSkin.albedo,
    skinNormal: limbSkin.normal,
    skinRoughness: limbSkin.roughness,
    hairAlbedo: hair.albedo,
    hairBump: hair.bump,
    sampledSkinHex,
  };
}
