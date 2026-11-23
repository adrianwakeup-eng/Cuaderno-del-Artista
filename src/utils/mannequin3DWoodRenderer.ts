import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type MannequinGender = 'male' | 'female';

export interface MannequinRenderOptions {
  gender: MannequinGender;
  yawDeg: number;
  color?: string;
  width?: number;
  height?: number;
}

interface LoftStation {
  y: number;
  cx?: number;
  cz?: number;
  rx: number;
  rz: number;
  /** Optional angular radius modulation; theta=0 is front (+Z), PI/2 is +X, PI is back (-Z) */
  sculpt?: (theta: number) => number;
  /** Optional subtle Z-shift modulation as a function of theta */
  sculptZ?: (theta: number) => number;
  /** Optional subtle X-shift modulation as a function of theta */
  sculptX?: (theta: number) => number;
}

/** Angular shortest distance on circle [-PI, PI] */
function angDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Smooth Gaussian bump in angular space */
function angGauss(theta: number, center: number, width: number): number {
  const d = angDiff(theta, center) / width;
  return Math.exp(-d * d);
}

/**
 * Build a smooth outward-facing lofted BufferGeometry with clean wood UVs.
 * UV convention:
 *   u = 0.0 / 1.0 -> FRONT center (+Z, theta = 0)
 *   u = 0.25      -> Left side (+X, theta = +PI/2)
 *   u = 0.50      -> BACK center (-Z, theta = PI)
 *   u = 0.75      -> Right side (-X, theta = -PI/2)
 *   v = 0..1      -> bottom..top of this lofted mesh
 */
function createLoftedGeometry(
  stations: LoftStation[],
  radialSegs = 60,
  capBottom = true,
  capTop = true,
  uvScaleU = 1,
  uvScaleV = 1
): THREE.BufferGeometry {
  const rows = stations.length;
  const cols = radialSegs + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const minY = stations[0].y;
  const maxY = stations[rows - 1].y;
  const spanY = Math.max(0.001, maxY - minY);

  for (let i = 0; i < rows; i++) {
    const st = stations[i];
    const cx = st.cx ?? 0;
    const cz = st.cz ?? 0;
    const v = (st.y - minY) / spanY;

    for (let j = 0; j < cols; j++) {
      const u = j / radialSegs;
      const theta = u * Math.PI * 2;
      const mod = st.sculpt ? st.sculpt(theta) : 1;
      const xShift = st.sculptX ? st.sculptX(theta) : 0;
      const zShift = st.sculptZ ? st.sculptZ(theta) : 0;

      const x = cx + Math.sin(theta) * st.rx * mod + xShift;
      const z = cz + Math.cos(theta) * st.rz * mod + zShift;

      positions.push(x, st.y, z);
      uvs.push(u * uvScaleU, v * uvScaleV);
    }
  }

  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * cols + j;
      const b = i * cols + (j + 1);
      const c = (i + 1) * cols + j;
      const d = (i + 1) * cols + (j + 1);
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  if (capBottom) {
    const first = stations[0];
    const centerIdx = positions.length / 3;
    positions.push(first.cx ?? 0, first.y, first.cz ?? 0);
    uvs.push(0.5 * uvScaleU, 0);
    for (let j = 0; j < radialSegs; j++) {
      indices.push(centerIdx, j + 1, j);
    }
  }

  if (capTop) {
    const last = stations[rows - 1];
    const baseRow = (rows - 1) * cols;
    const centerIdx = positions.length / 3;
    positions.push(last.cx ?? 0, last.y, last.cz ?? 0);
    uvs.push(0.5 * uvScaleU, uvScaleV);
    for (let j = 0; j < radialSegs; j++) {
      indices.push(centerIdx, baseRow + j, baseRow + j + 1);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/* ---------- Rich Warm Honey-Caramel Cathedral Wood Grain (Matched to mannequin_front.png) ---------- */

/**
 * Generates seamless swirling European beech / maple cathedral wood grain
 * tuned so under warm studio lighting it hits the EXACT RGB curve of mannequin_front.png:
 *   Highlights: #fddecd / #fbcba8
 *   Midtone:    #e29962 / #ca7e43
 *   Shadows:    #974f19 / #763403
 */
function fillCathedralWoodPixels(
  width: number,
  height: number,
  dImg: ImageData,
  bImg: ImageData,
  rImg: ImageData,
  repeatX = 1,
  repeatY = 1
): void {
  for (let y = 0; y < height; y++) {
    const ny = (y / height) * Math.PI * 2 * repeatY;
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * Math.PI * 2 * repeatX;

      // Fine, silky vertical-flowing European beech / pearwood cathedral grain
      // (subtle, refined, photographic — matching mannequin_front.png!)
      const gentleWarp =
        Math.sin(ny * 1 + Math.sin(nx * 2) * 0.7) * 0.65 +
        Math.cos(ny * 2 - nx * 1) * 0.32;
      const cathedralField =
        nx * 6.5 + gentleWarp * 2.2 + Math.sin(ny * 1 + nx * 1) * 1.15;

      const ringWave = Math.sin(cathedralField * 2.6) * 0.5 + 0.5;
      const latewood = Math.pow(ringWave, 3.8);

      // Ultra-fine vertical wood fibers & micro pores (characteristic of turned beechwood)
      const fiber =
        Math.sin(nx * 36 + gentleWarp * 2.4) * 0.40 +
        Math.sin(nx * 78 + ny * 3 + gentleWarp * 1.4) * 0.25 +
        Math.sin(nx * 149 - ny * 6) * 0.14;
      const fiberNorm = fiber * 0.5 + 0.5;

      // Subtle warm organic wood tone modulation
      const streak = Math.sin(nx * 14 + Math.sin(ny * 2) * 0.8) * 0.5 + 0.5;

      // Velvety museum-polished European beechwood grain so sculpted muscles & facial planes shine!
      const darkness = Math.min(
        1,
        Math.max(0, latewood * 0.16 + (1 - fiberNorm) * 0.16 + streak * 0.10)
      );

      // Rich saturated warm honey-caramel beechwood albedo calibrated to mannequin_front.png
      const r = Math.round(220 - darkness * 54); // 166..220
      const g = Math.round(134 - darkness * 48); // 86..134
      const b = Math.round(70 - darkness * 34);  // 36..70

      const idx = (y * width + x) * 4;
      dImg.data[idx] = r;
      dImg.data[idx + 1] = g;
      dImg.data[idx + 2] = b;
      dImg.data[idx + 3] = 255;

      const bump = Math.round(168 - darkness * 46);
      bImg.data[idx] = bump;
      bImg.data[idx + 1] = bump;
      bImg.data[idx + 2] = bump;
      bImg.data[idx + 3] = 255;

      const rough = Math.round(104 + darkness * 56);
      rImg.data[idx] = rough;
      rImg.data[idx + 1] = rough;
      rImg.data[idx + 2] = rough;
      rImg.data[idx + 3] = 255;
    }
  }
}

interface WoodTextureSet {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

function finalizeTextureSet(
  dCanvas: HTMLCanvasElement,
  bCanvas: HTMLCanvasElement,
  rCanvas: HTMLCanvasElement,
  wrapT: THREE.Wrapping = THREE.RepeatWrapping
): WoodTextureSet {
  const map = new THREE.CanvasTexture(dCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = wrapT;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = wrapT;
  bumpMap.anisotropy = 4;
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = wrapT;
  roughnessMap.anisotropy = 4;
  roughnessMap.needsUpdate = true;

  return { map, bumpMap, roughnessMap };
}

function createBaseCathedralWoodMaps(): WoodTextureSet {
  const size = 512;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;

  const dImg = dCtx.createImageData(size, size);
  const bImg = bCtx.createImageData(size, size);
  const rImg = rCtx.createImageData(size, size);

  fillCathedralWoodPixels(size, size, dImg, bImg, rImg, 1, 1);

  dCtx.putImageData(dImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  return finalizeTextureSet(dCanvas, bCanvas, rCanvas, THREE.RepeatWrapping);
}

/**
 * Generates seamless luminous Classical Greek Pentelic / Carrara marble texture
 * (warm alabaster-ivory base with whisper-delicate natural pearl-taupe mineral veins!)
 */
function createPentelicMarbleMaps(): WoodTextureSet {
  const size = 512;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d')!;

  const dImg = dCtx.createImageData(size, size);
  const bImg = bCtx.createImageData(size, size);
  const rImg = rCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const ny = (y / size) * Math.PI * 2;
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * Math.PI * 2;

      // Multi-octave organic domain-warped Carrara marble veining
      const warp1 =
        Math.sin(nx * 2 + Math.cos(ny * 2) * 1.4) * 1.15 +
        Math.cos(ny * 3 - Math.sin(nx * 2) * 1.1) * 0.65;
      const warp2 =
        Math.sin(nx * 5 - ny * 4 + warp1 * 1.2) * 0.42 +
        Math.cos(nx * 9 + ny * 7 + warp1 * 0.8) * 0.18;

      const veinWave = Math.abs(Math.sin(nx * 2 + ny * 1.5 + warp1 * 1.35 + warp2 * 0.9));
      // Ultra-delicate crisp marble veins (thin translucent mineral lines, never loud!)
      const fineVein = Math.pow(Math.max(0, 1 - veinWave), 8.0);
      const softCloud =
        (Math.sin(nx * 3 - ny * 2 + warp1 * 0.6) * 0.5 + 0.5) * 0.55 +
        (Math.cos(nx * 6 + ny * 5 + warp2) * 0.5 + 0.5) * 0.45;

      // Warm antique Pentelic Museum Marble (#dfd5c4 base -> luminous sunlit highlights & sculptural shadows on cream paper!)
      const cloudAmt = softCloud * 0.22;
      const veinAmt = fineVein * 0.30;
      const r = Math.round(224 - cloudAmt * 32 - veinAmt * 72);
      const g = Math.round(214 - cloudAmt * 36 - veinAmt * 76);
      const b = Math.round(198 - cloudAmt * 40 - veinAmt * 78);

      const idx = (y * size + x) * 4;
      dImg.data[idx] = r;
      dImg.data[idx + 1] = g;
      dImg.data[idx + 2] = b;
      dImg.data[idx + 3] = 255;

      const bump = Math.round(150 - fineVein * 28 + (softCloud - 0.5) * 16);
      bImg.data[idx] = bump;
      bImg.data[idx + 1] = bump;
      bImg.data[idx + 2] = bump;
      bImg.data[idx + 3] = 255;

      // Hand-polished satin-gloss museum marble surface
      const rough = Math.round(78 + fineVein * 34 + softCloud * 24);
      rImg.data[idx] = rough;
      rImg.data[idx + 1] = rough;
      rImg.data[idx + 2] = rough;
      rImg.data[idx + 3] = 255;
    }
  }

  dCtx.putImageData(dImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  return finalizeTextureSet(dCanvas, bCanvas, rCanvas, THREE.RepeatWrapping);
}

/** Paint soft warm sculptural ambient occlusion ellipse (seamlessly wraps across u=0/1) */
function paintAoEllipse(
  ctx: CanvasRenderingContext2D,
  W: number,
  u: number,
  yPx: number,
  rxPx: number,
  ryPx: number,
  strength: number
): void {
  for (const offsetU of [-1, 0, 1]) {
    const cx = (u + offsetU) * W;
    if (cx < -rxPx * 2 || cx > W + rxPx * 2) continue;
    ctx.save();
    ctx.translate(cx, yPx);
    ctx.scale(rxPx, ryPx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(92, 34, 4, ${strength})`);
    g.addColorStop(0.55, `rgba(116, 48, 10, ${strength * 0.45})`);
    g.addColorStop(1, 'rgba(116, 48, 10, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Paint warm satin highlight ellipse (seamlessly wraps across u=0/1) */
function paintWarmHighlight(
  ctx: CanvasRenderingContext2D,
  W: number,
  u: number,
  yPx: number,
  rxPx: number,
  ryPx: number,
  strength: number
): void {
  for (const offsetU of [-1, 0, 1]) {
    const cx = (u + offsetU) * W;
    if (cx < -rxPx * 2 || cx > W + rxPx * 2) continue;
    ctx.save();
    ctx.translate(cx, yPx);
    ctx.scale(rxPx, ryPx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(255, 224, 190, ${strength})`);
    g.addColorStop(1, 'rgba(255, 224, 190, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * 512×512 Head UV Map with rich cathedral wood grain + sculpted Loomis/Asaro face AO
 * (warm carved eye-socket shading, temple planes, cheekbone highlights — matches mannequin_front.png!)
 */
function createHeadWoodMaps(gender: MannequinGender): WoodTextureSet {
  const W = 512;
  const H = 512;
  const isFemale = gender === 'female';

  const dCanvas = document.createElement('canvas');
  dCanvas.width = W;
  dCanvas.height = H;
  const dCtx = dCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = W;
  bCanvas.height = H;
  const bCtx = bCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = W;
  rCanvas.height = H;
  const rCtx = rCanvas.getContext('2d')!;

  const dImg = dCtx.createImageData(W, H);
  const bImg = bCtx.createImageData(W, H);
  const rImg = rCtx.createImageData(W, H);

  fillCathedralWoodPixels(W, H, dImg, bImg, rImg, 1, 1);
  dCtx.putImageData(dImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const minY = 0.650;
  const maxY = 0.892;
  const py = (wy: number) => (1 - (wy - minY) / (maxY - minY)) * H;

  // Sculpted classical carved orbital eye-socket hollows (left & right of nose bridge)
  const socketStrength = isFemale ? 0.52 : 0.64;
  paintAoEllipse(dCtx, W, 0.056, py(0.764), 24, 28, socketStrength);
  paintAoEllipse(dCtx, W, -0.056, py(0.764), 24, 28, socketStrength);

  // Subtle sculpted brow-ridge highlight & cheekbone luminous wood planes
  paintWarmHighlight(dCtx, W, 0.0, py(0.796), 46, 18, 0.26);
  paintWarmHighlight(dCtx, W, 0.095, py(0.734), 26, 20, 0.20);
  paintWarmHighlight(dCtx, W, -0.095, py(0.734), 26, 20, 0.20);

  // Sculpted jaw plane & under-nose shadow
  paintAoEllipse(dCtx, W, 0.0, py(0.714), 14, 10, 0.38);
  paintAoEllipse(dCtx, W, 0.125, py(0.695), 28, 22, 0.28);
  paintAoEllipse(dCtx, W, -0.125, py(0.695), 28, 22, 0.28);

  // Deep carved shadow under chin & base of skull
  paintAoEllipse(dCtx, W, 0.0, py(0.654), 56, 16, 0.45);
  paintAoEllipse(dCtx, W, 0.5, py(0.658), 96, 16, 0.38);

  return finalizeTextureSet(dCanvas, bCanvas, rCanvas, THREE.ClampToEdgeWrapping);
}

/**
 * 1024×1024 Torso UV Map with EXACT carved wood-panel joinery seams AND baked sculptural AO
 * directly matching src/assets/images/mannequin_front.png & mannequin_back.png!
 */
function createTorsoPanelWoodMaps(gender: MannequinGender): WoodTextureSet {
  const W = 1024;
  const H = 1024;
  const isFemale = gender === 'female';

  const dCanvas = document.createElement('canvas');
  dCanvas.width = W;
  dCanvas.height = H;
  const dCtx = dCanvas.getContext('2d')!;

  const bCanvas = document.createElement('canvas');
  bCanvas.width = W;
  bCanvas.height = H;
  const bCtx = bCanvas.getContext('2d')!;

  const rCanvas = document.createElement('canvas');
  rCanvas.width = W;
  rCanvas.height = H;
  const rCtx = rCanvas.getContext('2d')!;

  const dImg = dCtx.createImageData(W, H);
  const bImg = bCtx.createImageData(W, H);
  const rImg = rCtx.createImageData(W, H);

  fillCathedralWoodPixels(W, H, dImg, bImg, rImg, 2, 2);
  dCtx.putImageData(dImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);

  const minY = -0.068;
  const maxY = 0.578;
  const py = (worldY: number) => (1 - (worldY - minY) / (maxY - minY)) * H;
  const px = (u: number) => u * W;

  // --- A. BAKED SCULPTURAL ANATOMICAL AMBIENT OCCLUSION & HIGHLIGHTS (EXACT mannequin_front/back.png CONTRAST!) ---
  if (!isFemale) {
    // Male: deep rich caramel sternum valley, bold under-pec shadows, 6-pack carved blocks, clavicles, spinal valley
    paintAoEllipse(dCtx, W, 0.0, py(0.415), 16, 68, 0.54);
    paintAoEllipse(dCtx, W, 0.072, py(0.352), 58, 22, 0.62);
    paintAoEllipse(dCtx, W, -0.072, py(0.352), 58, 22, 0.62);
    paintWarmHighlight(dCtx, W, 0.074, py(0.422), 48, 38, 0.28);
    paintWarmHighlight(dCtx, W, -0.074, py(0.422), 48, 38, 0.28);

    // Clavicle ridge & deep suprasternal hollow
    paintAoEllipse(dCtx, W, 0.0, py(0.515), 26, 20, 0.46);
    paintAoEllipse(dCtx, W, 0.085, py(0.486), 46, 12, 0.28);
    paintAoEllipse(dCtx, W, -0.085, py(0.486), 46, 12, 0.28);
    paintWarmHighlight(dCtx, W, 0.082, py(0.506), 48, 12, 0.26);
    paintWarmHighlight(dCtx, W, -0.082, py(0.506), 48, 12, 0.26);

    // Sculpted 6-pack abdominal valleys (linea alba + horizontal tendinous intersections)
    paintAoEllipse(dCtx, W, 0.0, py(0.235), 12, 98, 0.42);
    paintAoEllipse(dCtx, W, 0.0, py(0.280), 66, 13, 0.38);
    paintAoEllipse(dCtx, W, 0.0, py(0.218), 64, 13, 0.40);
    paintAoEllipse(dCtx, W, 0.0, py(0.158), 54, 12, 0.34);
    for (const ay of [0.304, 0.248, 0.188]) {
      paintWarmHighlight(dCtx, W, 0.042, py(ay), 26, 18, 0.24);
      paintWarmHighlight(dCtx, W, -0.042, py(ay), 26, 18, 0.24);
    }

    // Back: deep sculpted spinal valley + pronounced scapular shadows (matches mannequin_back.png!)
    paintAoEllipse(dCtx, W, 0.5, py(0.34), 24, 175, 0.58);
    paintWarmHighlight(dCtx, W, 0.422, py(0.42), 50, 56, 0.28);
    paintWarmHighlight(dCtx, W, 0.578, py(0.42), 50, 56, 0.28);
    paintAoEllipse(dCtx, W, 0.402, py(0.335), 46, 26, 0.42);
    paintAoEllipse(dCtx, W, 0.598, py(0.335), 46, 26, 0.42);
  } else {
    // Female: sculpted under-bust contour, delicate sternum, slender clavicle hollow, graceful spinal furrow
    paintAoEllipse(dCtx, W, 0.0, py(0.402), 14, 48, 0.42);
    paintAoEllipse(dCtx, W, 0.068, py(0.342), 50, 20, 0.58);
    paintAoEllipse(dCtx, W, -0.068, py(0.342), 50, 20, 0.58);
    paintWarmHighlight(dCtx, W, 0.068, py(0.404), 42, 34, 0.30);
    paintWarmHighlight(dCtx, W, -0.068, py(0.404), 42, 34, 0.30);

    paintAoEllipse(dCtx, W, 0.0, py(0.515), 24, 16, 0.38);
    paintWarmHighlight(dCtx, W, 0.0, py(0.195), 44, 52, 0.20);

    // Graceful back spinal furrow + delicate shoulder blades
    paintAoEllipse(dCtx, W, 0.5, py(0.32), 20, 170, 0.52);
    paintWarmHighlight(dCtx, W, 0.432, py(0.42), 42, 48, 0.26);
    paintWarmHighlight(dCtx, W, 0.568, py(0.42), 42, 48, 0.26);
  }

  // Deep underarm, rib-flank & gluteal cleft warm shadows
  paintAoEllipse(dCtx, W, 0.25, py(0.38), 46, 54, 0.52);
  paintAoEllipse(dCtx, W, 0.75, py(0.38), 46, 54, 0.52);
  paintAoEllipse(dCtx, W, 0.5, py(-0.025), 18, 52, 0.52);

  // --- B. RAZOR-SHARP HAND-CARVED WOOD PANEL JOINERY LINES (EXACT mannequin_front/back.png MATCH!) ---
  const drawCarvedSeam = (pts: Array<[number, number]>, widthPx = 3.2, softHalo = 8.5) => {
    const drawPass = (
      ctx: CanvasRenderingContext2D,
      strokeStyle: string,
      lineWidth: number,
      offsetU = 0
    ) => {
      ctx.save();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      pts.forEach(([u, wy], i) => {
        const x = px(u + offsetU);
        const y = py(wy);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    };

    for (const offsetU of [-1, 0, 1]) {
      // Soft recessed warm-amber bevel shadow
      drawPass(dCtx, 'rgba(116, 46, 8, 0.38)', softHalo, offsetU);
      // Crisp dark-walnut carved wood kerf line
      drawPass(dCtx, 'rgba(46, 17, 3, 0.94)', widthPx, offsetU);

      // Deep crisp bump groove so studio light catches the beveled wood edge
      drawPass(bCtx, 'rgba(220, 220, 220, 0.45)', softHalo + 3, offsetU);
      drawPass(bCtx, 'rgba(45, 45, 45, 0.75)', softHalo * 0.65, offsetU);
      drawPass(bCtx, 'rgba(6, 6, 6, 1.0)', widthPx, offsetU);

      drawPass(rCtx, 'rgba(240, 240, 240, 0.95)', widthPx + 1.5, offsetU);
    }
  };

  // 1. FRONT: Arched sub-pectoral / sub-bust costal seam
  const archTopY = isFemale ? 0.334 : 0.336;
  const archEdgeY = isFemale ? 0.314 : 0.312;
  const archSpanU = isFemale ? 0.082 : 0.088;

  drawCarvedSeam([
    [-archSpanU, archEdgeY],
    [-archSpanU * 0.5, archTopY - 0.004],
    [0, archTopY],
    [archSpanU * 0.5, archTopY - 0.004],
    [archSpanU, archEdgeY],
  ], 3.4, 9);

  // Subtle outer under-pec / under-bust curved wings toward armpits
  for (const s of [-1, 1] as const) {
    drawCarvedSeam([
      [s * archSpanU, archEdgeY],
      [s * (archSpanU + 0.036), archEdgeY + 0.036],
      [s * (archSpanU + 0.092), archEdgeY + 0.056],
      [s * 0.228, isFemale ? 0.395 : 0.405],
    ], 2.8, 7.5);
  }

  // Twin sweeping vertical-curved abdominal-plate seams flanking 6-pack & navel down to hips
  const abMidU = isFemale ? 0.092 : 0.104;
  const abBottomU = isFemale ? 0.068 : 0.078;
  for (const s of [-1, 1] as const) {
    drawCarvedSeam([
      [s * archSpanU, archEdgeY],
      [s * abMidU, 0.24],
      [s * (abMidU - 0.004), 0.175],
      [s * (abBottomU + 0.012), 0.105],
      [s * abBottomU, 0.048],
    ], 3.3, 8.5);
  }

  // Horizontal oblique / waist side seams connecting front plate to back lumbar plate
  const waistY = 0.175;
  for (const s of [-1, 1] as const) {
    drawCarvedSeam([
      [s * (abMidU - 0.004), waistY],
      [s * 0.165, waistY + 0.012],
      [s * 0.25, waistY + 0.014],
      [s * 0.355, waistY + 0.008],
      [s * (0.5 - (isFemale ? 0.072 : 0.082)), waistY + 0.004],
    ], 3.1, 8);
  }

  // 2. BACK: Diagonal V-curved scapular/lat seams + sweeping lumbar central plate (matches mannequin_back.png!)
  const backWaistU = isFemale ? 0.072 : 0.082;
  const backHipU = isFemale ? 0.044 : 0.052;
  for (const s of [-1, 1] as const) {
    drawCarvedSeam([
      [0.5 + s * 0.232, isFemale ? 0.388 : 0.396],
      [0.5 + s * 0.168, 0.32],
      [0.5 + s * 0.108, 0.278],
    ], 3.1, 8);

    drawCarvedSeam([
      [0.5 + s * 0.108, 0.278],
      [0.5 + s * 0.088, 0.228],
      [0.5 + s * backWaistU, waistY + 0.004],
      [0.5 + s * (backWaistU - 0.014), 0.115],
      [0.5 + s * backHipU, 0.048],
    ], 3.3, 8.5);
  }

  // 3. Clean pelvic / waist-to-hip joinery ring bridging smoothly into full legs
  drawCarvedSeam([
    [-0.14, 0.048],
    [-0.07, 0.044],
    [0.0, 0.042],
    [0.07, 0.044],
    [0.14, 0.048],
    [0.25, 0.058],
    [0.37, 0.052],
    [0.5, 0.048],
    [0.63, 0.052],
    [0.75, 0.058],
    [0.86, 0.048],
  ], 2.9, 7.5);

  // 4. Sculpted carved belly button (navel) on front
  const navelY = py(isFemale ? 0.158 : 0.152);
  for (const uPos of [0, 1]) {
    const nx = px(uPos);
    const nGrad = dCtx.createRadialGradient(nx, navelY, 1, nx, navelY, 9);
    nGrad.addColorStop(0, 'rgba(66, 26, 4, 0.92)');
    nGrad.addColorStop(0.55, 'rgba(128, 56, 16, 0.45)');
    nGrad.addColorStop(1, 'rgba(128, 56, 16, 0)');
    dCtx.fillStyle = nGrad;
    dCtx.beginPath();
    dCtx.ellipse(nx, navelY, 6, 8.5, 0, 0, Math.PI * 2);
    dCtx.fill();

    const bGrad = bCtx.createRadialGradient(nx, navelY, 1, nx, navelY, 10);
    bGrad.addColorStop(0, 'rgba(10, 10, 10, 1)');
    bGrad.addColorStop(0.6, 'rgba(90, 90, 90, 0.5)');
    bGrad.addColorStop(1, 'rgba(150, 150, 150, 0)');
    bCtx.fillStyle = bGrad;
    bCtx.beginPath();
    bCtx.ellipse(nx, navelY, 7, 9.5, 0, 0, Math.PI * 2);
    bCtx.fill();
  }

  // 5. Crisp recessed collar joinery groove around neck base
  drawCarvedSeam([
    [0, 0.556],
    [0.25, 0.556],
    [0.5, 0.556],
    [0.75, 0.556],
    [1.0, 0.556],
  ], 3.2, 8);

  return finalizeTextureSet(dCanvas, bCanvas, rCanvas, THREE.ClampToEdgeWrapping);
}

/** Soft translucent contact shadow disc under feet */
function createShadowDisc(): THREE.Mesh {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(72, 34, 10, 0.24)');
  grad.addColorStop(0.55, 'rgba(72, 34, 10, 0.10)');
  grad.addColorStop(1, 'rgba(72, 34, 10, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.40), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, -0.885, 0.01);
  return mesh;
}

/**
 * Iconic Italian blond-wood slotted clevis ball joint
 * (visually identical to the wooden elbow spheres in mannequin_front.png & mannequin_back.png!)
 */
function buildWoodSlottedJoint(
  radius: number,
  woodMat: THREE.Material,
  kerfMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();

  // Warm honey-maple wooden sphere (EXACT same wood as arms/legs!)
  g.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 18), woodMat));

  // Razor-thin central carved mechanical clevis slot (dark walnut groove)
  const slot = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.992, radius * 0.068, 8, 28),
    kerfMat
  );
  slot.rotation.y = Math.PI / 2;
  g.add(slot);

  return g;
}

/** Build a delicate razor-thin recessed carved wood joinery ring */
function createKerfRing(
  rx: number,
  rz: number,
  tube: number,
  y: number,
  cz: number,
  mat: THREE.Material
): THREE.Mesh {
  const geom = new THREE.TorusGeometry(1, tube, 8, 44);
  geom.scale(rx, rz, 1);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(0, y, cz);
  return mesh;
}

/* ---------- 1. SCULPTED CLASSICAL LOOMIS/ASARO ARTIST HEAD ---------- */

function buildSculptedArtistHead(
  isFemale: boolean,
  headWoodMat: THREE.Material,
  baseWoodMat: THREE.Material,
  kerfMat: THREE.Material
): THREE.Group {
  const g = new THREE.Group();
  const s = isFemale ? 0.94 : 1.04; // Bold classic 7.2-head artist proportions matching mannequin_front.png

  const headStations: LoftStation[] = [
    {
      y: 0.650,
      cz: 0.022,
      rx: 0.027 * s,
      rz: 0.036 * s,
      sculpt: (t) => 1 + 0.14 * angGauss(t, 0, 0.5),
    },
    {
      y: 0.672,
      cz: 0.021,
      rx: 0.049 * s,
      rz: 0.065 * s,
      sculpt: (t) =>
        1 +
        0.12 * angGauss(t, 0, 0.44) -
        0.05 * angGauss(t, Math.PI * 0.52, 0.42) -
        0.05 * angGauss(t, -Math.PI * 0.52, 0.42),
    },
    {
      y: 0.704,
      cz: 0.017,
      rx: 0.064 * s,
      rz: 0.082 * s,
      sculpt: (t) =>
        1 +
        0.04 * angGauss(t, 0, 0.42) +
        (isFemale ? 0.02 : 0.06) * angGauss(t, 1.15, 0.34) +
        (isFemale ? 0.02 : 0.06) * angGauss(t, -1.15, 0.34),
    },
    {
      y: 0.736,
      cz: 0.013,
      rx: 0.072 * s,
      rz: 0.091 * s,
      sculpt: (t) =>
        1 +
        0.055 * angGauss(t, 0.62, 0.28) +
        0.055 * angGauss(t, -0.62, 0.28) -
        0.055 * angGauss(t, 0.34, 0.22) -
        0.055 * angGauss(t, -0.34, 0.22),
    },
    {
      y: 0.764,
      cz: 0.008,
      rx: 0.075 * s,
      rz: 0.096 * s,
      // Classical deep carved eye-socket hollows + central nose root
      sculpt: (t) =>
        1 -
        0.155 * angGauss(t, 0.35, 0.20) -
        0.155 * angGauss(t, -0.35, 0.20) +
        0.048 * angGauss(t, 0, 0.14) +
        0.025 * angGauss(t, Math.PI, 0.9),
    },
    {
      y: 0.790,
      cz: 0.006,
      rx: 0.077 * s,
      rz: 0.099 * s,
      // Strong classical brow ridge overhanging eye sockets
      sculpt: (t) =>
        1 +
        (isFemale ? 0.045 : 0.085) * angGauss(t, 0, 0.56) -
        0.025 * angGauss(t, Math.PI * 0.5, 0.4) -
        0.025 * angGauss(t, -Math.PI * 0.5, 0.4),
    },
    {
      y: 0.824,
      cz: 0.001,
      rx: 0.076 * s,
      rz: 0.097 * s,
      sculpt: (t) => 1 + 0.025 * angGauss(t, Math.PI, 0.85),
    },
    { y: 0.860, cz: -0.005, rx: 0.062 * s, rz: 0.080 * s },
    { y: 0.882, cz: -0.008, rx: 0.036 * s, rz: 0.048 * s },
    { y: 0.892, cz: -0.009, rx: 0.011 * s, rz: 0.015 * s },
  ];

  // Mapped 1:1 to createHeadWoodMaps(gender)
  g.add(new THREE.Mesh(createLoftedGeometry(headStations, 60, true, true, 1, 1), headWoodMat));

  // Sculpted 3D classical trapezoidal wooden nose (exact iconic silhouette from mannequin_front.png!)
  const noseStations: LoftStation[] = [
    { y: 0.720, cz: 0.093 * s, rx: 0.0115 * s, rz: 0.017 * s },
    { y: 0.728, cz: 0.098 * s, rx: 0.0138 * s, rz: 0.024 * s },
    { y: 0.750, cz: 0.096 * s, rx: 0.0115 * s, rz: 0.018 * s },
    { y: 0.774, cz: 0.092 * s, rx: 0.0105 * s, rz: 0.013 * s },
    { y: 0.790, cz: 0.089 * s, rx: 0.014 * s, rz: 0.009 * s },
  ];
  g.add(new THREE.Mesh(createLoftedGeometry(noseStations, 22), baseWoodMat));

  // Warm sculpted wooden ears (NO black blotches!)
  for (const side of [-1, 1] as const) {
    const earOuter = new THREE.Mesh(
      new THREE.SphereGeometry(0.0175 * s, 14, 12),
      baseWoodMat
    );
    earOuter.scale.set(0.38, 1.32, 0.72);
    earOuter.position.set(side * 0.074 * s, 0.746, -0.004);
    earOuter.rotation.y = -side * 0.25;
    g.add(earOuter);
  }

  // Crisp occiput / skull-base joinery kerf line (visible in mannequin_back.png!)
  g.add(createKerfRing(0.048 * s, 0.052 * s, 0.0020, 0.656, -0.002, kerfMat));

  return g;
}

/* ---------- 2. SCULPTED WOODEN HAND (WARM HONEY MAPLE + ARTICULATED FINGERS) ---------- */

function buildWoodenHand(
  side: -1 | 1,
  isFemale: boolean,
  woodMat: THREE.Material,
  kerfMat: THREE.Material
): THREE.Group {
  const hand = new THREE.Group();
  const s = isFemale ? 0.87 : 1.0;

  // Matching warm honey-wood slotted wrist ball joint
  hand.add(buildWoodSlottedJoint(0.023 * s, woodMat, kerfMat));

  const palmStations: LoftStation[] = [
    { y: -0.086 * s, rx: 0.0125 * s, rz: 0.035 * s },
    { y: -0.068 * s, rx: 0.015 * s, rz: 0.040 * s },
    { y: -0.042 * s, rx: 0.016 * s, rz: 0.037 * s },
    { y: -0.018 * s, rx: 0.014 * s, rz: 0.029 * s },
    { y: -0.005 * s, rx: 0.012 * s, rz: 0.022 * s },
  ];
  hand.add(new THREE.Mesh(createLoftedGeometry(palmStations, 24), woodMat));

  // 4 sculpted gently curved warm-wood fingers
  const fingerDefs = [
    { z: 0.026 * s, len: 0.066 * s, r: 0.0068 * s, curl: 0.14 },
    { z: 0.009 * s, len: 0.074 * s, r: 0.0072 * s, curl: 0.17 },
    { z: -0.008 * s, len: 0.068 * s, r: 0.0068 * s, curl: 0.19 },
    { z: -0.024 * s, len: 0.055 * s, r: 0.0059 * s, curl: 0.21 },
  ];

  for (const f of fingerDefs) {
    const fGroup = new THREE.Group();
    fGroup.position.set(0, -0.082 * s, f.z);
    fGroup.add(new THREE.Mesh(new THREE.SphereGeometry(f.r * 0.94, 10, 8), woodMat));

    const p1 = new THREE.Mesh(
      new THREE.CylinderGeometry(f.r * 0.9, f.r * 0.82, f.len * 0.56, 12),
      woodMat
    );
    p1.position.set(-side * 0.003 * s, -f.len * 0.28, 0);
    p1.rotation.z = -side * f.curl;
    fGroup.add(p1);

    const p2 = new THREE.Mesh(
      new THREE.CapsuleGeometry(f.r * 0.70, f.len * 0.34, 6, 10),
      woodMat
    );
    p2.position.set(-side * (0.007 + f.curl * 0.022) * s, -f.len * 0.72, 0);
    p2.rotation.z = -side * (f.curl * 1.75);
    fGroup.add(p2);

    hand.add(fGroup);
  }

  // Sculpted wooden thumb angled naturally forward & inward
  const thumbGroup = new THREE.Group();
  thumbGroup.position.set(-side * 0.006 * s, -0.042 * s, 0.035 * s);
  thumbGroup.rotation.x = -0.34;
  thumbGroup.rotation.z = -side * 0.24;
  thumbGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.0080 * s, 10, 8), woodMat));
  const t1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0072 * s, 0.035 * s, 6, 10), woodMat);
  t1.position.set(0, -0.024 * s, 0.004 * s);
  thumbGroup.add(t1);
  hand.add(thumbGroup);

  return hand;
}

/* ---------- 3. SCULPTED WOODEN FOOT ---------- */

function buildWoodenFoot(
  side: -1 | 1,
  isFemale: boolean,
  woodMat: THREE.Material,
  kerfMat: THREE.Material
): THREE.Group {
  const foot = new THREE.Group();
  const sX = isFemale ? 0.87 : 1.0;
  const sZ = isFemale ? 0.90 : 1.0;

  // Matching warm honey-wood slotted ankle ball joint
  foot.add(buildWoodSlottedJoint(0.031 * sX, woodMat, kerfMat));

  const footStations: LoftStation[] = [
    {
      y: -0.095,
      cx: side * 0.004,
      cz: 0.056 * sZ,
      rx: 0.042 * sX,
      rz: 0.106 * sZ,
      sculpt: (t) => 1 + 0.08 * angGauss(t, 0, 0.7) - 0.14 * angGauss(t, Math.PI, 0.9),
    },
    {
      y: -0.082,
      cx: side * 0.004,
      cz: 0.058 * sZ,
      rx: 0.045 * sX,
      rz: 0.112 * sZ,
      sculpt: (t) =>
        1 +
        0.08 * angGauss(t, 0, 0.65) -
        0.16 * angGauss(t, Math.PI, 0.85) -
        0.09 * angGauss(t, -side * Math.PI * 0.5, 0.6),
    },
    {
      y: -0.062,
      cx: side * 0.002,
      cz: 0.044 * sZ,
      rx: 0.040 * sX,
      rz: 0.091 * sZ,
      sculpt: (t) => 1 - 0.12 * angGauss(t, Math.PI, 0.85),
    },
    { y: -0.038, cx: 0, cz: 0.018 * sZ, rx: 0.035 * sX, rz: 0.055 * sZ },
    { y: -0.016, cx: 0, cz: 0.004 * sZ, rx: 0.031 * sX, rz: 0.036 * sZ },
  ];
  foot.add(new THREE.Mesh(createLoftedGeometry(footStations, 34), woodMat));

  // Crisp subtle toe-block hinge line across forefoot
  const toeSeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.080 * sX, 0.0026, 0.0026),
    kerfMat
  );
  toeSeam.position.set(side * 0.004, -0.070, 0.115 * sZ);
  toeSeam.rotation.y = -side * 0.12;
  foot.add(toeSeam);

  foot.rotation.y = side * 0.12;
  return foot;
}

/* ---------- 4. FLUSH-FITTING CARVED WOODEN ARM (EXACT SHOULDER & SLOTTED ELBOW MATCH) ---------- */

function buildFullArticulatedArm(
  side: -1 | 1,
  isFemale: boolean,
  woodMat: THREE.Material,
  kerfMat: THREE.Material
): THREE.Group {
  const armRoot = new THREE.Group();
  const s = isFemale ? 0.82 : 1.0;

  const upperLen = isFemale ? 0.268 : 0.284;
  const upperStations: LoftStation[] = [
    { y: -upperLen, rx: 0.036 * s, rz: 0.039 * s },
    {
      y: -upperLen * 0.84,
      rx: 0.044 * s,
      rz: 0.047 * s,
      sculpt: (t) => 1 + (isFemale ? 0.03 : 0.12) * angGauss(t, 0, 0.72),
    },
    {
      y: -upperLen * 0.54,
      rx: 0.052 * s,
      rz: 0.057 * s,
      // Muscular sculpted bicep peak & tricep horseshoe matching mannequin_front/back.png
      sculpt: (t) =>
        1 +
        (isFemale ? 0.04 : 0.18) * angGauss(t, 0, 0.70) +
        (isFemale ? 0.03 : 0.15) * angGauss(t, Math.PI, 0.72) +
        (isFemale ? 0.03 : 0.09) * angGauss(t, side * Math.PI * 0.5, 0.8),
    },
    {
      y: -upperLen * 0.24,
      cx: side * 0.005,
      rx: 0.060 * s,
      rz: 0.062 * s,
      // Rounded sculptural deltoid cap
      sculpt: (t) => 1 + (isFemale ? 0.06 : 0.19) * angGauss(t, side * Math.PI * 0.5, 0.85),
    },
    {
      y: -0.006,
      cx: -side * 0.005,
      rx: 0.058 * s,
      rz: 0.060 * s,
      sculpt: (t) => 1 + (isFemale ? 0.05 : 0.14) * angGauss(t, side * Math.PI * 0.5, 0.9),
    },
    { y: 0.032, cx: -side * 0.022, rx: 0.044 * s, rz: 0.048 * s },
    { y: 0.052, cx: -side * 0.032, rx: 0.024 * s, rz: 0.028 * s },
  ];
  armRoot.add(new THREE.Mesh(createLoftedGeometry(upperStations, 40, true, true, 1.2, 1.5), woodMat));

  // Flush razor-thin vertical shoulder joinery slit tucked neatly at the deltoid/torso crease
  const shoulderCut = new THREE.Mesh(
    new THREE.TorusGeometry(isFemale ? 0.047 : 0.057, 0.0022, 8, 36),
    kerfMat
  );
  shoulderCut.rotation.y = Math.PI / 2;
  shoulderCut.scale.set(1.0, 1.12, 1.0);
  shoulderCut.position.set(-side * (isFemale ? 0.032 : 0.040), -0.012, 0.0);
  armRoot.add(shoulderCut);

  // --- ICONIC WARM-WOOD SLOTTED ELBOW JOINT (EXACT MATCH TO mannequin_front.png!) ---
  const elbowGroup = new THREE.Group();
  elbowGroup.position.set(0, -upperLen - 0.012, 0);
  elbowGroup.rotation.x = -0.10;
  elbowGroup.rotation.z = -side * 0.045;

  elbowGroup.add(buildWoodSlottedJoint(0.036 * s, woodMat, kerfMat));
  elbowGroup.add(createKerfRing(0.036 * s, 0.039 * s, 0.0018, 0.012, 0, kerfMat));

  // --- MISSING FOREARM ADDED (IN IDENTICAL CARVED HONEY-MAPLE WOOD!) ---
  const foreLen = isFemale ? 0.238 : 0.248;
  const foreStations: LoftStation[] = [
    { y: -foreLen, rx: 0.024 * s, rz: 0.029 * s },
    { y: -foreLen * 0.72, rx: 0.029 * s, rz: 0.033 * s },
    {
      y: -foreLen * 0.40,
      rx: 0.038 * s,
      rz: 0.042 * s,
      sculpt: (t) => 1 + (isFemale ? 0.03 : 0.12) * angGauss(t, side * Math.PI * 0.35, 0.8),
    },
    {
      y: -foreLen * 0.16,
      rx: 0.044 * s,
      rz: 0.047 * s,
      sculpt: (t) => 1 + (isFemale ? 0.04 : 0.14) * angGauss(t, side * Math.PI * 0.4, 0.85),
    },
    { y: -0.016, rx: 0.036 * s, rz: 0.038 * s },
  ];
  elbowGroup.add(new THREE.Mesh(createLoftedGeometry(foreStations, 34, true, true, 1.1, 1.4), woodMat));
  elbowGroup.add(createKerfRing(0.036 * s, 0.038 * s, 0.0018, -0.015, 0, kerfMat));

  // Sculpted wooden hand attached to wrist
  const hand = buildWoodenHand(side, isFemale, woodMat, kerfMat);
  hand.position.set(0, -foreLen - 0.01, 0.004);
  elbowGroup.add(hand);

  armRoot.add(elbowGroup);

  armRoot.rotation.z = side * (isFemale ? 0.145 : 0.12);
  armRoot.rotation.x = 0.025;
  return armRoot;
}

/* ---------- 5. FLUSH-FITTING CARVED WOODEN LEG (PELVIS -> FEET) ---------- */

function buildFullArticulatedLeg(
  side: -1 | 1,
  isFemale: boolean,
  woodMat: THREE.Material,
  kerfMat: THREE.Material
): THREE.Group {
  const leg = new THREE.Group();

  // Flush hip joinery kerf line
  const hipSeam = new THREE.Mesh(
    new THREE.TorusGeometry(isFemale ? 0.075 : 0.074, 0.0020, 8, 36),
    kerfMat
  );
  hipSeam.rotation.x = Math.PI / 2;
  hipSeam.rotation.y = side * 0.30;
  hipSeam.position.set(side * 0.003, -0.042, 0.0);
  leg.add(hipSeam);

  // Sculpted Thigh (quadriceps, hamstrings, outer curve)
  const thighStations: LoftStation[] = [
    { y: -0.416, cx: side * -0.004, cz: 0.002, rx: isFemale ? 0.046 : 0.052, rz: isFemale ? 0.050 : 0.055 },
    {
      y: -0.34,
      cx: side * -0.003,
      cz: 0.006,
      rx: isFemale ? 0.056 : 0.063,
      rz: isFemale ? 0.061 : 0.068,
      sculpt: (t) => 1 + (isFemale ? 0.05 : 0.13) * angGauss(t, 0, 0.76),
    },
    {
      y: -0.22,
      cx: side * 0.002,
      cz: 0.007,
      rx: isFemale ? 0.072 : 0.076,
      rz: isFemale ? 0.076 : 0.081,
      sculpt: (t) =>
        1 +
        (isFemale ? 0.05 : 0.14) * angGauss(t, 0, 0.76) +
        (isFemale ? 0.09 : 0.05) * angGauss(t, side * Math.PI * 0.5, 0.85) +
        0.07 * angGauss(t, Math.PI, 0.85),
    },
    {
      y: -0.105,
      cx: side * 0.006,
      cz: 0.002,
      rx: isFemale ? 0.082 : 0.082,
      rz: isFemale ? 0.085 : 0.085,
      sculpt: (t) =>
        1 +
        (isFemale ? 0.11 : 0.06) * angGauss(t, side * Math.PI * 0.5, 0.8) +
        (isFemale ? 0.10 : 0.06) * angGauss(t, Math.PI, 0.85),
    },
    { y: -0.036, cx: side * 0.003, cz: 0, rx: isFemale ? 0.076 : 0.075, rz: isFemale ? 0.078 : 0.077 },
  ];
  leg.add(new THREE.Mesh(createLoftedGeometry(thighStations, 40, true, true, 1.3, 1.8), woodMat));

  // Warm-wood slotted knee joint + sculpted wooden patella shield
  const kneeJoint = buildWoodSlottedJoint(isFemale ? 0.044 : 0.049, woodMat, kerfMat);
  kneeJoint.position.set(side * -0.005, -0.436, 0.0);
  leg.add(kneeJoint);

  const patella = new THREE.Mesh(
    new THREE.SphereGeometry(isFemale ? 0.031 : 0.036, 18, 14),
    woodMat
  );
  patella.scale.set(0.95, 1.12, 0.52);
  patella.position.set(side * -0.005, -0.432, 0.035);
  leg.add(patella);

  leg.add(createKerfRing(isFemale ? 0.046 : 0.052, isFemale ? 0.050 : 0.055, 0.0018, -0.416, 0.002, kerfMat));
  leg.add(createKerfRing(isFemale ? 0.044 : 0.049, isFemale ? 0.047 : 0.052, 0.0018, -0.456, -0.002, kerfMat));

  // Sculpted Calf & Shin
  const calfStations: LoftStation[] = [
    { y: -0.772, cx: side * -0.007, cz: -0.008, rx: isFemale ? 0.029 : 0.034, rz: isFemale ? 0.034 : 0.039 },
    {
      y: -0.68,
      cx: side * -0.007,
      cz: -0.010,
      rx: isFemale ? 0.037 : 0.043,
      rz: isFemale ? 0.043 : 0.049,
      sculpt: (t) => 1 + 0.09 * angGauss(t, Math.PI, 0.75),
    },
    {
      y: -0.57,
      cx: side * -0.005,
      cz: -0.014,
      rx: isFemale ? 0.051 : 0.059,
      rz: isFemale ? 0.057 : 0.066,
      sculpt: (t) =>
        1 +
        (isFemale ? 0.14 : 0.21) * angGauss(t, Math.PI, 0.72) +
        0.07 * angGauss(t, side * Math.PI * 0.65, 0.7) +
        0.045 * angGauss(t, 0, 0.45),
    },
    {
      y: -0.50,
      cx: side * -0.005,
      cz: -0.008,
      rx: isFemale ? 0.049 : 0.056,
      rz: isFemale ? 0.053 : 0.060,
      sculpt: (t) => 1 + (isFemale ? 0.10 : 0.16) * angGauss(t, Math.PI, 0.8),
    },
    { y: -0.456, cx: side * -0.005, cz: -0.002, rx: isFemale ? 0.044 : 0.049, rz: isFemale ? 0.047 : 0.052 },
  ];
  leg.add(new THREE.Mesh(createLoftedGeometry(calfStations, 38, true, true, 1.2, 1.7), woodMat));

  // Warm-wood slotted ankle + sculpted wooden foot
  const foot = buildWoodenFoot(side, isFemale, woodMat, kerfMat);
  foot.position.set(side * -0.007, -0.785, -0.008);
  leg.add(foot);

  return leg;
}

/* ---------- 6. FULL-BODY SCULPTED MANNEQUIN ASSEMBLY ---------- */

function buildSculptedMannequin(
  gender: MannequinGender,
  baseWoodMat: THREE.Material,
  headWoodMat: THREE.Material,
  torsoWoodMat: THREE.Material,
  kerfMat: THREE.Material
): THREE.Group {
  const isFemale = gender === 'female';
  const root = new THREE.Group();

  // 1. Classical Sculpted Artist Head
  root.add(buildSculptedArtistHead(isFemale, headWoodMat, baseWoodMat, kerfMat));

  // 2. Neck with sternocleidomastoid V-cords & recessed collar joinery ring
  const neckStations: LoftStation[] = [
    { y: 0.556, cz: -0.004, rx: isFemale ? 0.052 : 0.068, rz: isFemale ? 0.050 : 0.065 },
    {
      y: 0.592,
      cz: -0.002,
      rx: isFemale ? 0.044 : 0.058,
      rz: isFemale ? 0.045 : 0.058,
      sculpt: (t) =>
        1 +
        0.055 * angGauss(t, 0.42, 0.24) +
        0.055 * angGauss(t, -0.42, 0.24) -
        0.045 * angGauss(t, 0, 0.20),
    },
    { y: 0.638, cz: 0.001, rx: isFemale ? 0.041 : 0.054, rz: isFemale ? 0.043 : 0.055 },
    { y: 0.662, cz: 0.003, rx: isFemale ? 0.039 : 0.050, rz: isFemale ? 0.041 : 0.051 },
  ];
  root.add(new THREE.Mesh(createLoftedGeometry(neckStations, 38, true, true, 1.1, 1.0), baseWoodMat));
  root.add(
    createKerfRing(
      isFemale ? 0.053 : 0.069,
      isFemale ? 0.051 : 0.066,
      0.0022,
      0.562,
      -0.004,
      kerfMat
    )
  );

  // 3. CONTINUOUS SCULPTED TORSO + PELVIS (mapped 1:1 with createTorsoPanelWoodMaps)
  const torsoStations: LoftStation[] = isFemale
    ? [
        { y: -0.068, cz: -0.002, rx: 0.066, rz: 0.064 },
        {
          y: -0.030,
          cz: -0.004,
          rx: 0.156,
          rz: 0.105,
          sculpt: (t) =>
            1 +
            0.20 * angGauss(t, Math.PI - 0.44, 0.42) +
            0.20 * angGauss(t, -Math.PI + 0.44, 0.42) -
            0.10 * angGauss(t, Math.PI, 0.18),
        },
        {
          y: 0.020,
          cz: -0.002,
          rx: 0.172,
          rz: 0.108,
          sculpt: (t) =>
            1 +
            0.18 * angGauss(t, Math.PI - 0.44, 0.44) +
            0.18 * angGauss(t, -Math.PI + 0.44, 0.44) -
            0.09 * angGauss(t, Math.PI, 0.18) +
            0.05 * angGauss(t, 0, 0.58),
        },
        {
          y: 0.072,
          cz: 0.003,
          rx: 0.148,
          rz: 0.097,
          sculpt: (t) =>
            1 +
            0.08 * angGauss(t, Math.PI - 0.44, 0.42) +
            0.08 * angGauss(t, -Math.PI + 0.44, 0.42) -
            0.09 * angGauss(t, Math.PI, 0.24),
        },
        {
          y: 0.130,
          cz: 0.008,
          rx: 0.116,
          rz: 0.087,
          sculpt: (t) => 1 + 0.05 * angGauss(t, 0, 0.52) - 0.11 * angGauss(t, Math.PI, 0.28),
        },
        {
          y: 0.185,
          cz: 0.009,
          rx: 0.106,
          rz: 0.083,
          sculpt: (t) => 1 + 0.04 * angGauss(t, 0, 0.48) - 0.12 * angGauss(t, Math.PI, 0.28),
        },
        {
          y: 0.245,
          cz: 0.007,
          rx: 0.112,
          rz: 0.086,
          sculpt: (t) => 1 - 0.10 * angGauss(t, Math.PI, 0.28),
        },
        {
          y: 0.305,
          cz: 0.006,
          rx: 0.125,
          rz: 0.092,
          sculpt: (t) => 1 - 0.10 * angGauss(t, Math.PI, 0.26),
        },
        {
          y: 0.348,
          cz: 0.009,
          rx: 0.138,
          rz: 0.100,
          sculpt: (t) =>
            1 +
            0.14 * angGauss(t, 0.44, 0.33) +
            0.14 * angGauss(t, -0.44, 0.33) -
            0.07 * angGauss(t, 0, 0.18) -
            0.10 * angGauss(t, Math.PI, 0.26),
        },
        {
          y: 0.392,
          cz: 0.012,
          rx: 0.148,
          rz: 0.106,
          sculpt: (t) =>
            1 +
            0.31 * angGauss(t, 0.44, 0.32) +
            0.31 * angGauss(t, -0.44, 0.32) -
            0.09 * angGauss(t, 0, 0.17) -
            0.12 * angGauss(t, Math.PI, 0.24) +
            0.08 * angGauss(t, Math.PI - 0.54, 0.38) +
            0.08 * angGauss(t, -Math.PI + 0.54, 0.38),
        },
        {
          y: 0.438,
          cz: 0.010,
          rx: 0.157,
          rz: 0.103,
          sculpt: (t) =>
            1 +
            0.23 * angGauss(t, 0.45, 0.34) +
            0.23 * angGauss(t, -0.45, 0.34) -
            0.07 * angGauss(t, 0, 0.18) -
            0.12 * angGauss(t, Math.PI, 0.24) +
            0.10 * angGauss(t, Math.PI - 0.54, 0.38) +
            0.10 * angGauss(t, -Math.PI + 0.54, 0.38),
        },
        {
          y: 0.488,
          cz: 0.002,
          rx: 0.165,
          rz: 0.090,
          sculpt: (t) =>
            1 +
            0.07 * angGauss(t, 0.52, 0.34) +
            0.07 * angGauss(t, -0.52, 0.34) -
            0.05 * angGauss(t, 0, 0.18) -
            0.11 * angGauss(t, Math.PI, 0.24) +
            0.09 * angGauss(t, Math.PI - 0.55, 0.38) +
            0.09 * angGauss(t, -Math.PI + 0.55, 0.38),
        },
        {
          y: 0.528,
          cz: -0.002,
          rx: 0.124,
          rz: 0.072,
          // Graceful diagonal trapezius slope into neck!
          sculpt: (t) => 1 - 0.07 * angGauss(t, Math.PI, 0.26),
        },
        { y: 0.558, cz: -0.003, rx: 0.074, rz: 0.055 },
        { y: 0.576, cz: -0.004, rx: 0.052, rz: 0.049 },
      ]
    : [
        { y: -0.068, cz: -0.002, rx: 0.068, rz: 0.066 },
        {
          y: -0.030,
          cz: -0.003,
          rx: 0.148,
          rz: 0.102,
          sculpt: (t) =>
            1 +
            0.15 * angGauss(t, Math.PI - 0.44, 0.42) +
            0.15 * angGauss(t, -Math.PI + 0.44, 0.42) -
            0.10 * angGauss(t, Math.PI, 0.18),
        },
        {
          y: 0.022,
          cz: 0.000,
          rx: 0.158,
          rz: 0.106,
          sculpt: (t) =>
            1 +
            0.14 * angGauss(t, Math.PI - 0.44, 0.44) +
            0.14 * angGauss(t, -Math.PI + 0.44, 0.44) -
            0.10 * angGauss(t, Math.PI, 0.18),
        },
        {
          y: 0.078,
          cz: 0.004,
          rx: 0.149,
          rz: 0.101,
          sculpt: (t) =>
            1 +
            0.07 * angGauss(t, 0.26, 0.22) +
            0.07 * angGauss(t, -0.26, 0.22) -
            0.06 * angGauss(t, 0, 0.12) -
            0.11 * angGauss(t, Math.PI, 0.24),
        },
        {
          y: 0.132,
          cz: 0.007,
          rx: 0.140,
          rz: 0.099,
          sculpt: (t) =>
            1 +
            0.11 * angGauss(t, 0.27, 0.22) +
            0.11 * angGauss(t, -0.27, 0.22) -
            0.08 * angGauss(t, 0, 0.12) -
            0.12 * angGauss(t, Math.PI, 0.24),
        },
        {
          y: 0.182,
          cz: 0.008,
          rx: 0.136,
          rz: 0.098,
          sculpt: (t) =>
            1 +
            0.08 * angGauss(t, 0.27, 0.22) +
            0.08 * angGauss(t, -0.27, 0.22) -
            0.07 * angGauss(t, 0, 0.12) -
            0.13 * angGauss(t, Math.PI, 0.24),
        },
        {
          y: 0.232,
          cz: 0.008,
          rx: 0.142,
          rz: 0.101,
          sculpt: (t) =>
            1 +
            0.13 * angGauss(t, 0.28, 0.22) +
            0.13 * angGauss(t, -0.28, 0.22) -
            0.09 * angGauss(t, 0, 0.12) -
            0.13 * angGauss(t, Math.PI, 0.24),
        },
        {
          y: 0.280,
          cz: 0.007,
          rx: 0.151,
          rz: 0.105,
          sculpt: (t) =>
            1 +
            0.13 * angGauss(t, 0.29, 0.23) +
            0.13 * angGauss(t, -0.29, 0.23) -
            0.09 * angGauss(t, 0, 0.12) -
            0.13 * angGauss(t, Math.PI, 0.24),
        },
        {
          y: 0.330,
          cz: 0.008,
          rx: 0.166,
          rz: 0.113,
          sculpt: (t) =>
            1 +
            0.11 * angGauss(t, 0.42, 0.35) +
            0.11 * angGauss(t, -0.42, 0.35) -
            0.08 * angGauss(t, 0, 0.16) -
            0.13 * angGauss(t, Math.PI, 0.23) +
            0.09 * angGauss(t, Math.PI - 0.56, 0.38) +
            0.09 * angGauss(t, -Math.PI + 0.56, 0.38),
        },
        {
          y: 0.382,
          cz: 0.011,
          rx: 0.184,
          rz: 0.121,
          sculpt: (t) =>
            1 +
            0.27 * angGauss(t, 0.44, 0.36) +
            0.27 * angGauss(t, -0.44, 0.36) -
            0.12 * angGauss(t, 0, 0.14) -
            0.15 * angGauss(t, Math.PI, 0.22) +
            0.14 * angGauss(t, Math.PI - 0.54, 0.38) +
            0.14 * angGauss(t, -Math.PI + 0.54, 0.38),
        },
        {
          y: 0.436,
          cz: 0.011,
          rx: 0.200,
          rz: 0.122,
          sculpt: (t) =>
            1 +
            0.28 * angGauss(t, 0.44, 0.38) +
            0.28 * angGauss(t, -0.44, 0.38) -
            0.12 * angGauss(t, 0, 0.14) -
            0.16 * angGauss(t, Math.PI, 0.22) +
            0.15 * angGauss(t, Math.PI - 0.54, 0.38) +
            0.15 * angGauss(t, -Math.PI + 0.54, 0.38),
        },
        {
          y: 0.490,
          cz: 0.005,
          rx: 0.204,
          rz: 0.109,
          sculpt: (t) =>
            1 +
            0.12 * angGauss(t, 0.50, 0.36) +
            0.12 * angGauss(t, -0.50, 0.36) -
            0.09 * angGauss(t, 0, 0.15) -
            0.13 * angGauss(t, Math.PI, 0.22) +
            0.12 * angGauss(t, Math.PI - 0.54, 0.40) +
            0.12 * angGauss(t, -Math.PI + 0.54, 0.40),
        },
        {
          y: 0.530,
          cz: -0.001,
          rx: 0.152,
          rz: 0.086,
          // Smooth sculpted trapezius diagonal taper matching mannequin_front/back.png!
          sculpt: (t) => 1 - 0.09 * angGauss(t, Math.PI, 0.24),
        },
        { y: 0.560, cz: -0.003, rx: 0.096, rz: 0.068 },
        { y: 0.578, cz: -0.004, rx: 0.068, rz: 0.064 },
      ];

  root.add(new THREE.Mesh(createLoftedGeometry(torsoStations, 64, true, true, 1, 1), torsoWoodMat));

  // 4. Full Flush-Fitting Carved Wooden Arms
  const shoulderX = isFemale ? 0.162 : 0.200;
  const shoulderY = isFemale ? 0.478 : 0.484;
  for (const side of [-1, 1] as const) {
    const arm = buildFullArticulatedArm(side, isFemale, baseWoodMat, kerfMat);
    arm.position.set(side * shoulderX, shoulderY, -0.004);
    root.add(arm);
  }

  // 5. Full Flush-Fitting Carved Wooden Legs
  const hipX = isFemale ? 0.092 : 0.090;
  for (const side of [-1, 1] as const) {
    const leg = buildFullArticulatedLeg(side, isFemale, baseWoodMat, kerfMat);
    leg.position.set(side * hipX, 0, 0);
    root.add(leg);
  }

  // 6. Subtle Contact Shadow Disc
  root.add(createShadowDisc());

  if (isFemale) {
    root.scale.set(0.97, 0.985, 0.97);
  }

  return root;
}

/* ---------- Singleton Shared WebGL Renderer + Calibrated Warm Studio Lighting ---------- */

interface RendererSingleton {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  hemi: THREE.HemisphereLight;
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  rimLeft: THREE.DirectionalLight;
  rimRight: THREE.DirectionalLight;
  maleModel: THREE.Group;
  femaleModel: THREE.Group;
  woodMats: THREE.MeshPhysicalMaterial[];
  sculptedMarbleMat: THREE.MeshPhysicalMaterial;
  sculptedWoodMat: THREE.MeshPhysicalMaterial;
  glbMeshes: THREE.Mesh[];
  glbLoaded: { male: boolean; female: boolean };
}

let singleton: RendererSingleton | null = null;
const dataUrlCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 160;
const readyListeners = new Set<() => void>();
let glbLoadStarted = false;

/** Subscribe to be notified once the high-resolution sculpted humanoid GLB models finish loading */
export function onMannequinModelsLoaded(cb: () => void): () => void {
  readyListeners.add(cb);
  return () => {
    readyListeners.delete(cb);
  };
}

function notifyModelsLoaded(): void {
  dataUrlCache.clear();
  for (const cb of readyListeners) {
    try {
      cb();
    } catch {
      // ignore listener errors
    }
  }
}

function attachSculptedGlbScene(
  s: RendererSingleton,
  gender: MannequinGender,
  gltfScene: THREE.Group
): void {
  const container = new THREE.Group();
  gltfScene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.material = s.sculptedMarbleMat;
      obj.castShadow = true;
      obj.receiveShadow = true;
      s.glbMeshes.push(obj);
    }
  });
  container.add(gltfScene);
  container.add(createShadowDisc());
  if (gender === 'female') {
    container.scale.set(0.985, 0.985, 0.985);
  }
  container.visible = false;

  if (gender === 'male') {
    s.scene.remove(s.maleModel);
    s.maleModel = container;
    s.glbLoaded.male = true;
  } else {
    s.scene.remove(s.femaleModel);
    s.femaleModel = container;
    s.glbLoaded.female = true;
  }
  s.scene.add(container);
  notifyModelsLoaded();
}

/** Optional helper to load pre-fetched ArrayBuffers (used by offline QA harness) */
export async function loadMannequinGlbBuffers(
  maleBuffer: ArrayBuffer,
  femaleBuffer: ArrayBuffer
): Promise<void> {
  const s = getSingleton();
  if (!s) return;
  const loader = new GLTFLoader();
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      loader.parse(
        maleBuffer,
        '',
        (gltf) => {
          attachSculptedGlbScene(s, 'male', gltf.scene);
          resolve();
        },
        reject
      );
    }),
    new Promise<void>((resolve, reject) => {
      loader.parse(
        femaleBuffer,
        '',
        (gltf) => {
          attachSculptedGlbScene(s, 'female', gltf.scene);
          resolve();
        },
        reject
      );
    }),
  ]);
}

function startLoadingSculptedGlbs(s: RendererSingleton): void {
  if (glbLoadStarted) return;
  glbLoadStarted = true;
  if (typeof window === 'undefined' || window.location?.protocol === 'file:') return;

  const base = (import.meta as unknown as { env?: { BASE_URL?: string } })?.env?.BASE_URL || '/';
  const loader = new GLTFLoader();
  const pairs: Array<{ gender: MannequinGender; url: string }> = [
    { gender: 'male', url: `${base}models/mannequin-male.glb` },
    { gender: 'female', url: `${base}models/mannequin-female.glb` },
  ];

  for (const item of pairs) {
    loader.load(
      item.url,
      (gltf) => {
        attachSculptedGlbScene(s, item.gender, gltf.scene);
      },
      undefined,
      () => {
        // Keep procedural fallback if GLB fetch fails
      }
    );
  }
}

function getSingleton(): RendererSingleton | null {
  if (singleton) return singleton;
  if (typeof document === 'undefined') return null;

  try {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.86;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();

    // Subtle studio reflection environment for crisp satin beechwood sheen
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.08).texture;
    scene.environment = envTex;
    pmrem.dispose();

    // Dramatic museum studio lighting matched directly to mannequin_front.png & mannequin_back.png:
    // Warm top sky + rich burnt-chestnut ground bounce
    const hemi = new THREE.HemisphereLight(0xffe5c4, 0x351001, 0.24);
    scene.add(hemi);

    // Primary dramatic 3/4 right-top key light with soft shadows -> rich sculptural #fddecd highlights & #8c4110 shadows!
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.55);
    keyLight.position.set(3.6, 2.9, 2.1);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 12.0;
    keyLight.shadow.camera.left = -1.2;
    keyLight.shadow.camera.right = 1.2;
    keyLight.shadow.camera.top = 1.3;
    keyLight.shadow.camera.bottom = -1.3;
    keyLight.shadow.bias = -0.0008;
    scene.add(keyLight);

    // Warm subtle amber fill on left (keeps shadow side rich caramel, NEVER washed out!)
    const fillLight = new THREE.DirectionalLight(0xd97d3b, 0.20);
    fillLight.position.set(-3.2, 0.4, 1.8);
    scene.add(fillLight);

    // Crisp dual rim lights from upper rear -> luminous wood silhouette edges matching mannequin_front/back.png
    const rimLeft = new THREE.DirectionalLight(0xffe0b4, 1.12);
    rimLeft.position.set(-2.6, 2.9, -2.6);
    scene.add(rimLeft);

    const rimRight = new THREE.DirectionalLight(0xffd29a, 0.58);
    rimRight.position.set(2.4, 2.4, -2.8);
    scene.add(rimRight);

    const baseMaps = createBaseCathedralWoodMaps();
    const marbleMaps = createPentelicMarbleMaps();
    const maleHeadMaps = createHeadWoodMaps('male');
    const femaleHeadMaps = createHeadWoodMaps('female');
    const maleTorsoMaps = createTorsoPanelWoodMaps('male');
    const femaleTorsoMaps = createTorsoPanelWoodMaps('female');

    // NOTE: vertexColors is intentionally FALSE so Sphere/Cylinder/Capsule parts render in exact warm wood!
    const makeWoodMat = (maps: WoodTextureSet, bumpScale = 0.012) =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        map: maps.map,
        bumpMap: maps.bumpMap,
        bumpScale,
        roughnessMap: maps.roughnessMap,
        roughness: 0.44,
        metalness: 0.0,
        clearcoat: 0.28,
        clearcoatRoughness: 0.30,
        envMapIntensity: 0.14,
      });

    const baseWoodMat = makeWoodMat(baseMaps, 0.007);
    const maleHeadMat = makeWoodMat(maleHeadMaps, 0.009);
    const femaleHeadMat = makeWoodMat(femaleHeadMaps, 0.009);
    const maleTorsoMat = makeWoodMat(maleTorsoMaps, 0.016);
    const femaleTorsoMat = makeWoodMat(femaleTorsoMaps, 0.016);

    // Classical Greek Pentelic / Carrara Marble Material (Louvre translucent alabaster-marble glow!)
    const sculptedMarbleMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      map: marbleMaps.map,
      bumpMap: marbleMaps.bumpMap,
      bumpScale: 0.0032,
      roughnessMap: marbleMaps.roughnessMap,
      roughness: 0.34,
      metalness: 0.0,
      clearcoat: 0.36,
      clearcoatRoughness: 0.24,
      sheen: 0.26,
      sheenColor: new THREE.Color('#fff7eb'),
      sheenRoughness: 0.42,
      envMapIntensity: 0.18,
      vertexColors: true,
    });

    // Optional Carved Italian Beechwood Material (when user chooses 'wood')
    const sculptedWoodMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      map: baseMaps.map,
      bumpMap: baseMaps.bumpMap,
      bumpScale: 0.006,
      roughnessMap: baseMaps.roughnessMap,
      roughness: 0.44,
      metalness: 0.0,
      clearcoat: 0.28,
      clearcoatRoughness: 0.30,
      envMapIntensity: 0.16,
      vertexColors: true,
    });

    // Dark recessed carved wood kerf material
    const kerfMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#280e03'),
      roughness: 0.85,
      metalness: 0.02,
      envMapIntensity: 0.05,
    });

    const maleModel = buildSculptedMannequin(
      'male',
      baseWoodMat,
      maleHeadMat,
      maleTorsoMat,
      kerfMat
    );
    const femaleModel = buildSculptedMannequin(
      'female',
      baseWoodMat,
      femaleHeadMat,
      femaleTorsoMat,
      kerfMat
    );

    const enableShadows = (group: THREE.Group) => {
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.material !== kerfMat && !(obj.material instanceof THREE.MeshBasicMaterial)) {
          obj.castShadow = true;
          obj.receiveShadow = true;
        }
      });
    };
    enableShadows(maleModel);
    enableShadows(femaleModel);
    maleModel.visible = false;
    femaleModel.visible = false;
    scene.add(maleModel);
    scene.add(femaleModel);

    // Telephoto studio portrait FOV (25°) -> zero lens distortion from crown to feet
    const camera = new THREE.PerspectiveCamera(25, 7 / 16, 0.1, 20);
    camera.position.set(0, 0.0, 4.52);
    camera.lookAt(0, -0.002, 0);

    singleton = {
      renderer,
      scene,
      camera,
      hemi,
      keyLight,
      fillLight,
      rimLeft,
      rimRight,
      maleModel,
      femaleModel,
      woodMats: [
        baseWoodMat,
        maleHeadMat,
        femaleHeadMat,
        maleTorsoMat,
        femaleTorsoMat,
        sculptedMarbleMat,
        sculptedWoodMat,
      ],
      sculptedMarbleMat,
      sculptedWoodMat,
      glbMeshes: [],
      glbLoaded: { male: false, female: false },
    };
    startLoadingSculptedGlbs(singleton);
    return singleton;
  } catch {
    return null;
  }
}

export function normalizeYawDeg(deg: number): number {
  const n = Math.round(deg) % 360;
  return n < 0 ? n + 360 : n;
}

function renderInternal(opts: MannequinRenderOptions): HTMLCanvasElement | null {
  const s = getSingleton();
  if (!s) return null;

  const width = opts.width ?? 448;
  const height = opts.height ?? 1024;
  const yawRad = (normalizeYawDeg(opts.yawDeg) * Math.PI) / 180;

  if (s.renderer.domElement.width !== width || s.renderer.domElement.height !== height) {
    s.renderer.setSize(width, height, false);
  }
  s.camera.aspect = width / height;
  s.camera.updateProjectionMatrix();

  const isWoodMode = opts.color === 'wood';
  const isCustomTint = Boolean(opts.color && opts.color !== 'natural' && opts.color !== 'wood');

  // Switch between Classical Greek Marble (default) and Carved Italian Wood
  const activeGlbMat = isWoodMode ? s.sculptedWoodMat : s.sculptedMarbleMat;
  for (const mesh of s.glbMeshes) {
    if (mesh.material !== activeGlbMat) {
      mesh.material = activeGlbMat;
    }
  }

  // Calibrate Louvre museum chiaroscuro lighting for Marble vs. warm atelier lighting for Wood
  if (isWoodMode) {
    s.renderer.toneMappingExposure = 0.86;
    s.hemi.color.setHex(0xffe5c4);
    s.hemi.groundColor.setHex(0x351001);
    s.hemi.intensity = 0.24;
    s.keyLight.color.setHex(0xfff1dc);
    s.keyLight.intensity = 2.55;
    s.fillLight.color.setHex(0xd97d3b);
    s.fillLight.intensity = 0.20;
    s.rimLeft.color.setHex(0xffe0b4);
    s.rimLeft.intensity = 1.12;
  } else {
    // Dramatic Louvre gallery chiaroscuro -> breathtaking carved marble relief & rich contrast on cream paper!
    s.renderer.toneMappingExposure = 0.78;
    s.hemi.color.setHex(0xfff8ee);
    s.hemi.groundColor.setHex(0x3f3429);
    s.hemi.intensity = 0.19;
    s.keyLight.color.setHex(0xfff6e8);
    s.keyLight.position.set(4.0, 2.8, 1.85);
    s.keyLight.intensity = 2.68;
    s.fillLight.color.setHex(0xb8ab98);
    s.fillLight.intensity = 0.16;
    s.rimLeft.color.setHex(0xffefd6);
    s.rimLeft.intensity = 1.05;
  }

  for (const mat of s.woodMats) {
    if (isCustomTint && opts.color) {
      mat.color.set(opts.color);
      mat.color.lerp(new THREE.Color('#ffffff'), 0.22);
    } else {
      mat.color.set('#ffffff');
    }
  }

  s.maleModel.visible = opts.gender === 'male';
  s.femaleModel.visible = opts.gender === 'female';

  const active = opts.gender === 'male' ? s.maleModel : s.femaleModel;
  active.rotation.set(0, yawRad, 0);

  s.renderer.clear(true, true, true);
  s.renderer.render(s.scene, s.camera);
  return s.renderer.domElement;
}

/** Render directly into a target 2D <canvas> at 60fps (zero WebGL context leaks!) */
export function renderMannequinToCanvas(
  targetCanvas: HTMLCanvasElement,
  opts: MannequinRenderOptions
): boolean {
  const width = opts.width ?? 448;
  const height = opts.height ?? 1024;
  const src = renderInternal({ ...opts, width, height });
  if (!src) return false;

  if (targetCanvas.width !== width || targetCanvas.height !== height) {
    targetCanvas.width = width;
    targetCanvas.height = height;
  }
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return false;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(src, 0, 0, width, height);
  return true;
}

/** Render and cache a transparent PNG data URL for miniatures or static snapshots */
export function renderMannequinToDataUrl(opts: MannequinRenderOptions): string | null {
  const width = opts.width ?? 224;
  const height = opts.height ?? 512;
  const yaw = normalizeYawDeg(opts.yawDeg);
  const colorKey = opts.color || 'natural';
  const key = `${opts.gender}|${yaw}|${colorKey}|${width}x${height}`;

  const cached = dataUrlCache.get(key);
  if (cached) return cached;

  const src = renderInternal({ ...opts, yawDeg: yaw, width, height });
  if (!src) return null;

  const url = src.toDataURL('image/png');
  if (dataUrlCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = dataUrlCache.keys().next().value;
    if (firstKey !== undefined) dataUrlCache.delete(firstKey);
  }
  dataUrlCache.set(key, url);
  return url;
}

/** Render a crisp 2K-grade transparent RGBA PNG Blob of the mannequin at its exact 360° angle */
export async function renderMannequinPngBlob(
  opts: Omit<MannequinRenderOptions, 'width' | 'height'>
): Promise<Blob | null> {
  const src = renderInternal({
    ...opts,
    width: 728,
    height: 1664,
  });
  if (!src) return null;

  return new Promise((resolve) => {
    src.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/** Format human-friendly Spanish label for any 360° yaw angle */
export function getYawAngleLabel(yawDeg: number): string {
  const y = normalizeYawDeg(yawDeg);
  if (y <= 15 || y >= 345) return 'Frente';
  if (y >= 75 && y <= 105) return 'Perfil izq.';
  if (y >= 165 && y <= 195) return 'Espalda';
  if (y >= 255 && y <= 285) return 'Perfil der.';
  if (y > 15 && y < 75) return '¾ Frente';
  if (y > 105 && y < 165) return '¾ Espalda';
  if (y > 195 && y < 255) return '¾ Espalda';
  return '¾ Frente';
}
