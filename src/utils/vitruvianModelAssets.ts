// Photorealistic 3D-styled model & pose asset pipeline for El Vestidor Dorado's Vitruvio 3D.
// Extracts:
//  1) All 4 high-resolution 360° orthographic studio views (Frente 0°, Perfil Izq. 90°,
//     Espalda 180°, Perfil Der. 270°) from /assets/aistudio/image_7d49bf92.png
//  2) The 3/4 Trasera (225°) view + all 18 photo-identical poses from /assets/aistudio/image_b8959293.png
// Features:
//  - Zero-defect studio matte extraction (row-interpolated bg, foot-shadow stripping, morphological
//    hair-closing for dark curls, largest-component filtering, small-hole healing, edge decontamination)
//  - Seamless full-body lower-leg completion for mid-thigh poses (08 Saludo, 09 Pensativo, 10 Señalando)
//  - Automatic pixel-exact anatomical anchor calibration per normalized 1024x1536 sprite so every
//    crochet garment (top & bottom) fits tailored to the millimeter in every pose & across all 360°.

export const NEW_MODEL_TURNAROUND_SRC = '/assets/aistudio/image_7d49bf92.png';
export const NEW_MODEL_POSES_SHEET_SRC = '/assets/aistudio/image_b8959293.png';

export type TurntableViewKey = 'front' | 'left' | 'back' | 'back34' | 'right';

export type Vec2 = [number, number];

export interface PoseGarmentAnchors {
  pelvis: Vec2;
  abs: Vec2;
  chest: Vec2;
  neck: Vec2;
  armL: { sh: Vec2; el: Vec2; wr: Vec2; bendDeg: number };
  armR: { sh: Vec2; el: Vec2; wr: Vec2; bendDeg: number };
  hipL: Vec2;
  kneeL: Vec2;
  ankL: Vec2;
  hipR: Vec2;
  kneeR: Vec2;
  ankR: Vec2;
  torsoScaleX: number;
  torsoScaleY: number;
  isBack?: boolean;
  isProfile?: boolean;
  /** Facing direction for side profiles (-1 = facing left / 90°, +1 = facing right / 270°) */
  profileFacing?: -1 | 1;
  /** Seated / kneeling / crouched poses use custom contoured knee-bent bottoms */
  poseBottomStyle?: 'standing' | 'squat' | 'seated' | 'meditation' | 'kneeling';
  /** Crossed-arm poses render sleeves layered naturally across torso */
  crossedArms?: boolean;
  /** Single raised arm or foreshortened forward-pointing arm */
  skipBottoms?: boolean;
}

export interface ModelPoseDefinition {
  id: string;
  code: string;
  title: string;
  kind: 'turntable' | 'photo';
  /** Default 360° yaw angle (0=Frente, 90=Perfil Izq., 180=Espalda, 225=3/4 Trasera, 270=Perfil Der.) */
  defaultAngleDeg: number;
  /** Crop rectangle [x0, y0, x1, y1] inside image_b8959293.png for photo poses */
  cropBox?: [number, number, number, number];
  /** Vertical scale relative to full standing height */
  heightRatio: number;
  /** Whether to seamlessly graft HD lower legs from front turnaround for full-body pedestal standing */
  graftFullLegs?: boolean;
  /** Whether to seamlessly graft the HD 3D-animated Hero head/face onto unobstructed front-facing pose cards */
  graftHead?: boolean;
  /** Optional vertical card border cleanup for T-pose outstretched arms */
  stripSideBorders?: { aboveY: number; belowY: number };
  /** Pose-specific limb kinematics & overrides (pelvis/chest/scale auto-calibrated to normalized pixels) */
  anchors?: PoseGarmentAnchors;
}

// Calibrated 1024x1536 anatomical anchors for the HD turnaround views (image_7d49bf92.png)
export const NEW_FRONT_ANCHORS: PoseGarmentAnchors = {
  pelvis: [510, 712],
  abs: [510, 598],
  chest: [510, 482],
  neck: [510, 224],
  armL: { sh: [-166, -118], el: [-204, 72], wr: [-216, 248], bendDeg: 8 },
  armR: { sh: [166, -118], el: [204, 72], wr: [216, 248], bendDeg: -8 },
  hipL: [-82, 60],
  kneeL: [-94, 312],
  ankL: [-126, 646],
  hipR: [82, 60],
  kneeR: [100, 312],
  ankR: [138, 646],
  torsoScaleX: 0.96,
  torsoScaleY: 0.96,
  poseBottomStyle: 'standing',
};

export const NEW_BACK_ANCHORS: PoseGarmentAnchors = {
  pelvis: [510, 716],
  abs: [510, 598],
  chest: [510, 484],
  neck: [510, 224],
  armL: { sh: [-176, -118], el: [-232, 72], wr: [-244, 246], bendDeg: 8 },
  armR: { sh: [176, -118], el: [232, 72], wr: [244, 246], bendDeg: -8 },
  hipL: [-82, 68],
  kneeL: [-102, 308],
  ankL: [-144, 642],
  hipR: [82, 68],
  kneeR: [104, 308],
  ankR: [144, 642],
  torsoScaleX: 0.98,
  torsoScaleY: 0.96,
  isBack: true,
  poseBottomStyle: 'standing',
};

export const NEW_LEFT_PROFILE_ANCHORS: PoseGarmentAnchors = {
  ...NEW_FRONT_ANCHORS,
  pelvis: [512, 712],
  chest: [512, 482],
  neck: [512, 224],
  torsoScaleX: 0.92,
  torsoScaleY: 0.96,
  isProfile: true,
  profileFacing: -1,
  poseBottomStyle: 'standing',
};

export const NEW_RIGHT_PROFILE_ANCHORS: PoseGarmentAnchors = {
  ...NEW_FRONT_ANCHORS,
  pelvis: [508, 712],
  chest: [508, 482],
  neck: [508, 224],
  torsoScaleX: 0.92,
  torsoScaleY: 0.96,
  isProfile: true,
  profileFacing: 1,
  poseBottomStyle: 'standing',
};

export const MODEL_POSES_CATALOG: ModelPoseDefinition[] = [
  {
    id: '01-neutro',
    code: '01',
    title: 'Neutro (360°)',
    kind: 'turntable',
    defaultAngleDeg: 0,
    heightRatio: 1.0,
    anchors: NEW_FRONT_ANCHORS,
  },
  {
    id: '02-vitruvio',
    code: '02',
    title: 'Vitruvio',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [326, 702, 427, 880],
    heightRatio: 0.98,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-144, -118], el: [-248, -220], wr: [-355, -328], bendDeg: 4 },
      armR: { sh: [144, -118], el: [248, -220], wr: [355, -328], bendDeg: -4 },
      hipL: [-74, 58],
      kneeL: [-156, 305],
      ankL: [-242, 622],
      hipR: [74, 58],
      kneeR: [156, 305],
      ankR: [242, 622],
      torsoScaleX: 0.86,
      torsoScaleY: 0.9,
    },
  },
  {
    id: '03-tpose',
    code: '03',
    title: 'T-Pose',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [434, 696, 586, 880],
    heightRatio: 0.99,
    graftHead: true,
    stripSideBorders: { aboveY: 42, belowY: 66 },
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-148, -124], el: [-310, -126], wr: [-468, -124], bendDeg: 2 },
      armR: { sh: [148, -124], el: [310, -126], wr: [468, -124], bendDeg: -2 },
      hipL: [-76, 62],
      kneeL: [-96, 310],
      ankL: [-130, 640],
      hipR: [76, 62],
      kneeR: [96, 310],
      ankR: [130, 640],
      torsoScaleX: 0.88,
      torsoScaleY: 0.92,
    },
  },
  {
    id: '04-brazos-cruzados',
    code: '04',
    title: 'Brazos Cruzados',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [594, 696, 666, 880],
    heightRatio: 0.99,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-148, -118], el: [-170, 36], wr: [52, 8], bendDeg: 46 },
      armR: { sh: [148, -118], el: [170, 36], wr: [-52, 8], bendDeg: -46 },
      hipL: [-78, 60],
      kneeL: [-98, 308],
      ankL: [-142, 642],
      hipR: [78, 60],
      kneeR: [98, 308],
      ankR: [142, 642],
      torsoScaleX: 0.9,
      torsoScaleY: 0.94,
      crossedArms: true,
    },
  },
  {
    id: '05-manos-caderas',
    code: '05',
    title: 'Manos en Caderas',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [681, 696, 775, 880],
    heightRatio: 0.99,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-150, -118], el: [-240, 12], wr: [-126, 126], bendDeg: 46 },
      armR: { sh: [150, -118], el: [240, 12], wr: [126, 126], bendDeg: -46 },
      hipL: [-78, 60],
      kneeL: [-98, 310],
      ankL: [-144, 642],
      hipR: [78, 60],
      kneeR: [98, 310],
      ankR: [144, 642],
      torsoScaleX: 0.9,
      torsoScaleY: 0.94,
    },
  },
  {
    id: '06-biceps',
    code: '06',
    title: 'Bíceps',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [787, 696, 893, 880],
    heightRatio: 0.99,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-152, -120], el: [-302, -138], wr: [-258, -276], bendDeg: 68 },
      armR: { sh: [152, -120], el: [302, -138], wr: [258, -276], bendDeg: -68 },
      hipL: [-78, 60],
      kneeL: [-96, 310],
      ankL: [-136, 642],
      hipR: [78, 60],
      kneeR: [96, 310],
      ankR: [136, 642],
      torsoScaleX: 0.9,
      torsoScaleY: 0.94,
    },
  },
  {
    id: '07-heroe',
    code: '07',
    title: 'Héroe',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [907, 696, 1005, 880],
    heightRatio: 0.99,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-152, -118], el: [-202, 54], wr: [-222, 214], bendDeg: 10 },
      armR: { sh: [152, -118], el: [242, 16], wr: [128, 130], bendDeg: -45 },
      hipL: [-76, 60],
      kneeL: [-102, 308],
      ankL: [-144, 640],
      hipR: [80, 60],
      kneeR: [118, 308],
      ankR: [176, 638],
      torsoScaleX: 0.9,
      torsoScaleY: 0.94,
    },
  },
  {
    id: '08-saludo',
    code: '08',
    title: 'Saludo',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [200, 916, 360, 1098],
    heightRatio: 0.99,
    graftFullLegs: true,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-148, -118], el: [-176, -12], wr: [-126, -78], bendDeg: 45 },
      armR: { sh: [148, -118], el: [188, 64], wr: [204, 232], bendDeg: -8 },
      torsoScaleX: 0.9,
      torsoScaleY: 0.94,
    },
  },
  {
    id: '09-pensativo',
    code: '09',
    title: 'Pensativo',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [22, 1134, 166, 1280],
    heightRatio: 0.99,
    graftFullLegs: true,
    graftHead: false,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-142, -118], el: [-136, 48], wr: [-28, -162], bendDeg: 55 },
      armR: { sh: [142, -118], el: [164, 48], wr: [-26, 18], bendDeg: -45 },
      torsoScaleX: 0.88,
      torsoScaleY: 0.93,
      crossedArms: true,
    },
  },
  {
    id: '10-senalando',
    code: '10',
    title: 'Señalando',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [188, 1134, 330, 1280],
    heightRatio: 0.99,
    graftFullLegs: true,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-144, -118], el: [-168, -62], wr: [-146, -138], bendDeg: 35 },
      armR: { sh: [144, -118], el: [188, 60], wr: [206, 224], bendDeg: -8 },
      torsoScaleX: 0.88,
      torsoScaleY: 0.93,
    },
  },
  {
    id: '11-invitacion',
    code: '11',
    title: 'Invitación',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [380, 916, 550, 1098],
    heightRatio: 0.99,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-152, -118], el: [-274, 20], wr: [-412, 124], bendDeg: 14 },
      armR: { sh: [152, -118], el: [274, 20], wr: [412, 124], bendDeg: -14 },
      hipL: [-78, 60],
      kneeL: [-98, 308],
      ankL: [-146, 642],
      hipR: [78, 60],
      kneeR: [98, 308],
      ankR: [146, 642],
      torsoScaleX: 0.9,
      torsoScaleY: 0.94,
    },
  },
  {
    id: '12-presentacion',
    code: '12',
    title: 'Presentación',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [570, 916, 716, 1098],
    heightRatio: 0.99,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-146, -118], el: [-186, 56], wr: [-194, 220], bendDeg: 8 },
      armR: { sh: [146, -118], el: [292, -114], wr: [446, -118], bendDeg: -4 },
      hipL: [-74, 60],
      kneeL: [-92, 310],
      ankL: [-112, 640],
      hipR: [74, 60],
      kneeR: [88, 310],
      ankR: [110, 640],
      torsoScaleX: 0.88,
      torsoScaleY: 0.94,
    },
  },
  {
    id: '13-caminar',
    code: '13',
    title: 'Caminar',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [736, 916, 853, 1098],
    heightRatio: 0.99,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-142, -118], el: [-184, 52], wr: [-174, 212], bendDeg: 14 },
      armR: { sh: [142, -118], el: [182, 58], wr: [192, 226], bendDeg: -10 },
      hipL: [-68, 62],
      kneeL: [-64, 312],
      ankL: [-42, 622],
      hipR: [68, 62],
      kneeR: [56, 304],
      ankR: [36, 610],
      torsoScaleX: 0.86,
      torsoScaleY: 0.93,
    },
  },
  {
    id: '14-correr',
    code: '14',
    title: 'Correr',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [868, 916, 1004, 1098],
    heightRatio: 0.98,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-148, -118], el: [-242, 4], wr: [-222, 134], bendDeg: 38 },
      armR: { sh: [148, -118], el: [224, -18], wr: [110, -28], bendDeg: -52 },
      hipL: [-70, 60],
      kneeL: [-126, 274],
      ankL: [-168, 590],
      hipR: [70, 60],
      kneeR: [68, 250],
      ankR: [44, 495],
      torsoScaleX: 0.88,
      torsoScaleY: 0.92,
    },
  },
  {
    id: '15-agachado',
    code: '15',
    title: 'Agachado',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [20, 1316, 130, 1486],
    heightRatio: 0.65,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      pelvis: [510, 1070],
      abs: [510, 960],
      chest: [510, 855],
      neck: [510, 635],
      armL: { sh: [-144, -95], el: [-198, 46], wr: [-72, 124], bendDeg: 48 },
      armR: { sh: [144, -95], el: [198, 46], wr: [72, 124], bendDeg: -48 },
      hipL: [-82, 24],
      kneeL: [-202, 54],
      ankL: [-142, 322],
      hipR: [82, 24],
      kneeR: [202, 54],
      ankR: [142, 322],
      torsoScaleX: 0.88,
      torsoScaleY: 0.82,
      poseBottomStyle: 'squat',
    },
  },
  {
    id: '16-sentado',
    code: '16',
    title: 'Sentado',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [146, 1316, 256, 1486],
    heightRatio: 0.74,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      pelvis: [510, 980],
      abs: [510, 870],
      chest: [510, 760],
      neck: [510, 535],
      armL: { sh: [-138, -104], el: [-176, 46], wr: [-22, 74], bendDeg: 45 },
      armR: { sh: [138, -104], el: [176, 42], wr: [48, 72], bendDeg: -45 },
      hipL: [-76, 36],
      kneeL: [-54, 128],
      ankL: [-34, 412],
      hipR: [76, 36],
      kneeR: [128, 122],
      ankR: [152, 418],
      torsoScaleX: 0.84,
      torsoScaleY: 0.84,
      poseBottomStyle: 'seated',
    },
  },
  {
    id: '17-meditacion',
    code: '17',
    title: 'Meditación',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [274, 1316, 396, 1486],
    heightRatio: 0.62,
    graftHead: true,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      pelvis: [510, 1155],
      abs: [510, 1035],
      chest: [510, 920],
      neck: [510, 685],
      armL: { sh: [-146, -104], el: [-224, 44], wr: [-298, 162], bendDeg: 24 },
      armR: { sh: [146, -104], el: [224, 44], wr: [298, 162], bendDeg: -24 },
      hipL: [-80, 26],
      kneeL: [-260, 152],
      ankL: [-55, 206],
      hipR: [80, 26],
      kneeR: [260, 152],
      ankR: [55, 206],
      torsoScaleX: 0.88,
      torsoScaleY: 0.86,
      poseBottomStyle: 'meditation',
    },
  },
  {
    id: '18-rodilla',
    code: '18',
    title: 'Rodilla en Suelo',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [412, 1316, 528, 1486],
    heightRatio: 0.72,
    graftHead: false,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      pelvis: [510, 1005],
      abs: [510, 895],
      chest: [510, 785],
      neck: [510, 560],
      armL: { sh: [-138, -100], el: [-148, 36], wr: [-12, 74], bendDeg: 48 },
      armR: { sh: [138, -100], el: [170, 38], wr: [68, 86], bendDeg: -42 },
      hipL: [-72, 36],
      kneeL: [-136, 290],
      ankL: [-226, 345],
      hipR: [72, 36],
      kneeR: [128, 122],
      ankR: [148, 404],
      torsoScaleX: 0.85,
      torsoScaleY: 0.84,
      poseBottomStyle: 'kneeling',
    },
  },
  {
    id: '19-estiramiento',
    code: '19',
    title: 'Estiramiento',
    kind: 'photo',
    defaultAngleDeg: 0,
    cropBox: [541, 1316, 653, 1486],
    heightRatio: 1.02,
    graftHead: false,
    anchors: {
      ...NEW_FRONT_ANCHORS,
      armL: { sh: [-146, -124], el: [-202, -295], wr: [-44, -345], bendDeg: 68 },
      armR: { sh: [146, -124], el: [202, -295], wr: [44, -345], bendDeg: -68 },
      hipL: [-76, 60],
      kneeL: [-96, 310],
      ankL: [-134, 640],
      hipR: [76, 60],
      kneeR: [96, 310],
      ankR: [134, 640],
      torsoScaleX: 0.88,
      torsoScaleY: 0.94,
    },
  },
  {
    id: '20-espalda',
    code: '20',
    title: 'Espalda (180°)',
    kind: 'turntable',
    defaultAngleDeg: 180,
    heightRatio: 1.0,
    anchors: NEW_BACK_ANCHORS,
  },
  {
    id: '21-trasera-34',
    code: '21',
    title: '3/4 Trasera',
    kind: 'turntable',
    defaultAngleDeg: 225,
    heightRatio: 1.0,
    anchors: {
      ...NEW_BACK_ANCHORS,
      torsoScaleX: 0.82,
      isBack: true,
    },
  },
  {
    id: '22-lateral',
    code: '22',
    title: 'Lateral (90°)',
    kind: 'turntable',
    defaultAngleDeg: 90,
    heightRatio: 1.0,
    anchors: NEW_LEFT_PROFILE_ANCHORS,
  },
];

export interface LoadedVitruvianAssetPack {
  turntable: Record<TurntableViewKey, HTMLCanvasElement>;
  poseCanvases: Record<string, HTMLCanvasElement>;
  /** Automatically pixel-measured garment anchors in normalized 1024x1536 studio space for every pose */
  poseAnchors: Record<string, PoseGarmentAnchors>;
  poseThumbnails: Record<string, string>;
}

let cachedAssetPackPromise: Promise<LoadedVitruvianAssetPack> | null = null;

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Keeps only the single largest 4-connected foreground component (removes every stray floor smudge/speck). */
function keepLargestComponent(isBg: Uint8Array, cw: number, ch: number) {
  const vis = new Uint8Array(cw * ch);
  const q = new Int32Array(cw * ch);
  let best: Int32Array | null = null;
  let bestLen = 0;

  for (let i = 0; i < cw * ch; i++) {
    if (isBg[i] || vis[i]) continue;
    let hd = 0;
    let tl = 0;
    vis[i] = 1;
    q[tl++] = i;
    while (hd < tl) {
      const cur = q[hd++];
      const cx = cur % cw;
      const cy = (cur - cx) / cw;
      if (cx > 0 && !isBg[cur - 1] && !vis[cur - 1]) {
        vis[cur - 1] = 1;
        q[tl++] = cur - 1;
      }
      if (cx < cw - 1 && !isBg[cur + 1] && !vis[cur + 1]) {
        vis[cur + 1] = 1;
        q[tl++] = cur + 1;
      }
      if (cy > 0 && !isBg[cur - cw] && !vis[cur - cw]) {
        vis[cur - cw] = 1;
        q[tl++] = cur - cw;
      }
      if (cy < ch - 1 && !isBg[cur + cw] && !vis[cur + cw]) {
        vis[cur + cw] = 1;
        q[tl++] = cur + cw;
      }
    }
    if (tl > bestLen) {
      bestLen = tl;
      best = q.slice(0, tl);
    }
  }

  isBg.fill(1);
  if (best) {
    for (let k = 0; k < best.length; k++) isBg[best[k]] = 0;
  }
}

/** Heals small accidental interior transparent holes (beard/chin/hair shadow specks <= maxArea). */
function healSmallInteriorHoles(isBg: Uint8Array, cw: number, ch: number, maxArea: number) {
  const borderBg = new Uint8Array(cw * ch);
  const q = new Int32Array(cw * ch);
  let hd = 0;
  let tl = 0;

  const seed = (idx: number) => {
    if (isBg[idx] && !borderBg[idx]) {
      borderBg[idx] = 1;
      q[tl++] = idx;
    }
  };
  for (let x = 0; x < cw; x++) {
    seed(x);
    seed((ch - 1) * cw + x);
  }
  for (let y = 0; y < ch; y++) {
    seed(y * cw);
    seed(y * cw + cw - 1);
  }
  while (hd < tl) {
    const cur = q[hd++];
    const cx = cur % cw;
    const cy = (cur - cx) / cw;
    if (cx > 0) seed(cur - 1);
    if (cx < cw - 1) seed(cur + 1);
    if (cy > 0) seed(cur - cw);
    if (cy < ch - 1) seed(cur + cw);
  }

  const vis = new Uint8Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) {
    if (!isBg[i] || borderBg[i] || vis[i]) continue;
    let h2 = 0;
    let t2 = 0;
    vis[i] = 1;
    q[t2++] = i;
    while (h2 < t2) {
      const cur = q[h2++];
      const cx = cur % cw;
      const cy = (cur - cx) / cw;
      const n1 = cx > 0 ? cur - 1 : -1;
      const n2 = cx < cw - 1 ? cur + 1 : -1;
      const n3 = cy > 0 ? cur - cw : -1;
      const n4 = cy < ch - 1 ? cur + cw : -1;
      if (n1 >= 0 && isBg[n1] && !borderBg[n1] && !vis[n1]) {
        vis[n1] = 1;
        q[t2++] = n1;
      }
      if (n2 >= 0 && isBg[n2] && !borderBg[n2] && !vis[n2]) {
        vis[n2] = 1;
        q[t2++] = n2;
      }
      if (n3 >= 0 && isBg[n3] && !borderBg[n3] && !vis[n3]) {
        vis[n3] = 1;
        q[t2++] = n3;
      }
      if (n4 >= 0 && isBg[n4] && !borderBg[n4] && !vis[n4]) {
        vis[n4] = 1;
        q[t2++] = n4;
      }
    }
    if (t2 <= maxArea) {
      for (let k = 0; k < t2; k++) isBg[q[k]] = 0;
    }
  }
}

/** Fast O(N) separable morphological closing (dilate r then erode r) over y in [yMin, yMax). */
function morphCloseMask(
  mask: Uint8Array,
  cw: number,
  ch: number,
  yMin: number,
  yMax: number,
  r: number
): Uint8Array {
  const tmp = new Uint8Array(cw * ch);
  const dil = new Uint8Array(cw * ch);
  const tmp2 = new Uint8Array(cw * ch);
  const ero = new Uint8Array(cw * ch);
  const y0 = Math.max(0, yMin - r);
  const y1 = Math.min(ch, yMax + r);
  const diam = r * 2 + 1;

  for (let y = y0; y < y1; y++) {
    let run = 0;
    for (let x = 0; x < Math.min(cw, r); x++) run += mask[y * cw + x];
    for (let x = 0; x < cw; x++) {
      if (x + r < cw) run += mask[y * cw + x + r];
      if (x - r - 1 >= 0) run -= mask[y * cw + x - r - 1];
      tmp[y * cw + x] = run > 0 ? 1 : 0;
    }
  }
  for (let x = 0; x < cw; x++) {
    let run = 0;
    for (let y = y0; y < Math.min(y1, y0 + r); y++) run += tmp[y * cw + x];
    for (let y = y0; y < y1; y++) {
      if (y + r < y1) run += tmp[(y + r) * cw + x];
      if (y - r - 1 >= y0) run -= tmp[(y - r - 1) * cw + x];
      dil[y * cw + x] = run > 0 ? 1 : 0;
    }
  }
  for (let y = y0; y < y1; y++) {
    let run = 0;
    for (let x = 0; x < Math.min(cw, r); x++) run += dil[y * cw + x];
    for (let x = 0; x < cw; x++) {
      if (x + r < cw) run += dil[y * cw + x + r];
      if (x - r - 1 >= 0) run -= dil[y * cw + x - r - 1];
      const span = Math.min(cw - 1, x + r) - Math.max(0, x - r) + 1;
      tmp2[y * cw + x] = run === span && span >= diam - 2 ? 1 : 0;
    }
  }
  for (let x = 0; x < cw; x++) {
    let run = 0;
    for (let y = y0; y < Math.min(y1, y0 + r); y++) run += tmp2[y * cw + x];
    for (let y = y0; y < y1; y++) {
      if (y + r < y1) run += tmp2[(y + r) * cw + x];
      if (y - r - 1 >= y0) run -= tmp2[(y - r - 1) * cw + x];
      const span = Math.min(y1 - 1, y + r) - Math.max(y0, y - r) + 1;
      ero[y * cw + x] = run === span && span >= diam - 2 ? 1 : 0;
    }
  }
  return ero;
}

/** Hardware-accelerated progressive Canvas bicubic upscale (1x -> 2x -> upX) for silky-smooth curves. */
function progressiveCanvasUpscale(
  rawRgba: Uint8ClampedArray,
  sw: number,
  sh: number,
  up: number
): { data: Uint8ClampedArray; w: number; h: number } {
  const srcC = document.createElement('canvas');
  srcC.width = sw;
  srcC.height = sh;
  const sctx = srcC.getContext('2d')!;
  const id = sctx.createImageData(sw, sh);
  id.data.set(rawRgba);
  sctx.putImageData(id, 0, 0);

  let curC = srcC;
  let curW = sw;
  let curH = sh;
  const targetW = sw * up;
  const targetH = sh * up;

  while (curW < targetW || curH < targetH) {
    const nextW = Math.min(targetW, curW * 2);
    const nextH = Math.min(targetH, curH * 2);
    const nxt = document.createElement('canvas');
    nxt.width = nextW;
    nxt.height = nextH;
    const nctx = nxt.getContext('2d', { willReadFrequently: true })!;
    nctx.imageSmoothingEnabled = true;
    nctx.imageSmoothingQuality = 'high';
    nctx.drawImage(curC, 0, 0, curW, curH, 0, 0, nextW, nextH);
    curC = nxt;
    curW = nextW;
    curH = nextH;
  }

  const outData = curC.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, targetW, targetH).data;
  return { data: outData, w: targetW, h: targetH };
}

interface ExtractedHeroHead {
  w: number;
  h: number;
  data: Uint8ClampedArray;
  foreheadY: number;
  chinY: number;
  faceCx: number;
  skinR: number;
  skinG: number;
  skinB: number;
}

/**
 * Extracts the high-resolution 3D-animated Hero Head (glasses, curls, smile, studio lighting)
 * from the top-left Hero figure of image_b8959293.png so every small pose card gets razor-sharp HD facial clarity.
 */
function extractHeroHead(srcData: Uint8ClampedArray, srcW: number): ExtractedHeroHead {
  const x0 = 90;
  const y0 = 0;
  const x1 = 236;
  const y1 = 166;
  const sw = x1 - x0;
  const sh = y1 - y0;
  const raw = new Uint8ClampedArray(sw * sh * 4);
  for (let y = 0; y < sh; y++) {
    const srcOff = ((y0 + y) * srcW + x0) * 4;
    raw.set(srcData.subarray(srcOff, srcOff + sw * 4), y * sw * 4);
  }
  const { data: local, w: cw, h: ch } = progressiveCanvasUpscale(raw, sw, sh, 2);

  const fgMask = new Uint8Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) {
    const p = i * 4;
    const lum = 0.299 * local[p] + 0.587 * local[p + 1] + 0.114 * local[p + 2];
    if (lum >= 26 || local[p] >= 34) fgMask[i] = 1;
  }
  const sealed = morphCloseMask(fgMask, cw, ch, 0, ch, 14);
  const isBg = new Uint8Array(cw * ch);
  const q = new Int32Array(cw * ch);
  let hd = 0;
  let tl = 0;
  const trySeed = (x: number, y: number) => {
    const idx = y * cw + x;
    if (isBg[idx] || sealed[idx]) return;
    const p = idx * 4;
    const r = local[p];
    const g = local[p + 1];
    const b = local[p + 2];
    if (0.299 * r + 0.587 * g + 0.114 * b < 36 && !(r > b + 20 && r > 70)) {
      isBg[idx] = 1;
      q[tl++] = idx;
    }
  };
  for (let x = 0; x < cw; x++) trySeed(x, 0);
  for (let y = 0; y < ch; y++) {
    trySeed(0, y);
    trySeed(cw - 1, y);
  }
  while (hd < tl) {
    const cur = q[hd++];
    const cx = cur % cw;
    const cy = (cur - cx) / cw;
    if (cx > 0) trySeed(cx - 1, cy);
    if (cx < cw - 1) trySeed(cx + 1, cy);
    if (cy > 0) trySeed(cx, cy - 1);
    if (cy < ch - 1) trySeed(cx, cy + 1);
  }
  keepLargestComponent(isBg, cw, ch);
  healSmallInteriorHoles(isBg, cw, ch, 500);

  let foreheadY = ch;
  let sumX = 0;
  let cnt = 0;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sc = 0;
  for (let y = 20; y < 270; y++) {
    for (let x = 60; x < cw - 60; x++) {
      if (isBg[y * cw + x]) continue;
      const p = (y * cw + x) * 4;
      const r = local[p];
      const g = local[p + 1];
      const b = local[p + 2];
      if (r > 135 && g > 85 && r > b + 25) {
        if (y < foreheadY) foreheadY = y;
        if (y > 100 && y < 230) {
          sumX += x;
          cnt++;
          sr += r;
          sg += g;
          sb += b;
          sc++;
        }
      }
    }
  }
  const faceCx = sumX / Math.max(1, cnt);
  const chinY = 250;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const idx = y * cw + x;
      if (isBg[idx]) {
        local[idx * 4 + 3] = 0;
        continue;
      }
      if (y > 242) {
        const t = clamp((278 - y) / 36, 0, 1);
        const dx = Math.abs(x - faceCx);
        const neckFade = dx > 48 ? clamp((62 - dx) / 14, 0, 1) : 1;
        local[idx * 4 + 3] = Math.round(255 * t * t * (3 - 2 * t) * neckFade);
      }
    }
  }
  return {
    w: cw,
    h: ch,
    data: local,
    foreheadY,
    chinY,
    faceCx,
    skinR: sr / Math.max(1, sc),
    skinG: sg / Math.max(1, sc),
    skinB: sb / Math.max(1, sc),
  };
}

/**
 * Extracts a single studio figure from the charcoal turnaround sheet (image_7d49bf92.png)
 * with zero floor shadows, zero spotlight halos, intact dark curls, and edge color decontamination.
 */
function extractTurnaroundView(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  xMin: number,
  xMax: number,
  bgCols: [number, number],
  isBackView = false
): HTMLCanvasElement {
  const cw = xMax - xMin + 1;
  const ch = srcH;

  const local = new Uint8ClampedArray(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    const srcRow = (y * srcW + xMin) * 4;
    local.set(srcData.subarray(srcRow, srcRow + cw * 4), y * cw * 4);
  }

  // Row-wise left-to-right interpolated studio backdrop color
  const bgLR = new Float32Array(ch);
  const bgLG = new Float32Array(ch);
  const bgLB = new Float32Array(ch);
  const bgRR = new Float32Array(ch);
  const bgRG = new Float32Array(ch);
  const bgRB = new Float32Array(ch);
  for (let y = 0; y < ch; y++) {
    const pL = (y * srcW + bgCols[0]) * 4;
    const pR = (y * srcW + bgCols[1]) * 4;
    bgLR[y] = srcData[pL];
    bgLG[y] = srcData[pL + 1];
    bgLB[y] = srcData[pL + 2];
    bgRR[y] = srcData[pR];
    bgRG[y] = srcData[pR + 1];
    bgRB[y] = srcData[pR + 2];
  }
  const getBg = (lx: number, y: number): [number, number, number] => {
    const t = lx / Math.max(1, cw - 1);
    return [
      bgLR[y] + (bgRR[y] - bgLR[y]) * t,
      bgLG[y] + (bgRG[y] - bgLG[y]) * t,
      bgLB[y] + (bgRB[y] - bgLB[y]) * t,
    ];
  };

  const isBg = new Uint8Array(cw * ch);
  const queue = new Int32Array(cw * ch);
  let head = 0;
  let tail = 0;

  const isBgPixel = (lx: number, y: number): boolean => {
    const p = (y * cw + lx) * 4;
    const r = local[p];
    const g = local[p + 1];
    const b = local[p + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const [br, bg, bb] = getBg(lx, y);
    const dist = Math.hypot(r - br, g - bg, b - bb);

    // Foot floor-shadow zone (y > 955): strip neutral/warm-gray floor shadow below soles cleanly
    if (y > 955) {
      const isFootSkin = r >= 102 && r - b >= 26 && g >= 62;
      if (isFootSkin) return false;
      if (r - b < 26 || lum < 92) return true;
    }

    // Protect warm skin unconditionally
    if (r > b + 12 && r > 66) return false;
    // Protect bright white Calvin Klein boxers
    if (y > 380 && y < 600 && lum > 105) return false;
    // Protect dark hair curls & crown sheen at top
    if (y < 168 && lum < 44) return false;
    // Strip neutral overhead spotlight halo strictly on Back view
    if (isBackView && y < 188 && chroma < 11 && lum > 68 && lum < 185) return true;

    return dist < 24 && chroma < 13;
  };

  const trySeed = (lx: number, y: number) => {
    if (lx < 0 || lx >= cw || y < 0 || y >= ch) return;
    const idx = y * cw + lx;
    if (isBg[idx]) return;
    if (isBgPixel(lx, y)) {
      isBg[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < cw; x++) {
    trySeed(x, 0);
    trySeed(x, ch - 1);
  }
  for (let y = 0; y < ch; y++) {
    trySeed(0, y);
    trySeed(cw - 1, y);
  }

  // Interior neutral studio gaps (between legs & armpits)
  for (let y = 260; y < 955; y += 5) {
    for (let x = Math.floor(cw * 0.14); x < Math.floor(cw * 0.86); x += 4) {
      const idx = y * cw + x;
      if (isBg[idx]) continue;
      const p = idx * 4;
      const r = local[p];
      const g = local[p + 1];
      const b = local[p + 2];
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      const [br, bg, bb] = getBg(x, y);
      if (Math.hypot(r - br, g - bg, b - bb) < 11 && chroma < 7) {
        isBg[idx] = 1;
        queue[tail++] = idx;
      }
    }
  }

  while (head < tail) {
    const cur = queue[head++];
    const cx = cur % cw;
    const cy = (cur - cx) / cw;
    if (cx > 0) trySeed(cx - 1, cy);
    if (cx < cw - 1) trySeed(cx + 1, cy);
    if (cy > 0) trySeed(cx, cy - 1);
    if (cy < ch - 1) trySeed(cx, cy + 1);
  }

  keepLargestComponent(isBg, cw, ch);
  healSmallInteriorHoles(isBg, cw, ch, 160);

  for (let i = 0; i < cw * ch; i++) {
    if (isBg[i]) local[i * 4 + 3] = 0;
  }

  // 1px soft anti-aliased edge decontamination
  for (let y = 1; y < ch - 1; y++) {
    for (let x = 1; x < cw - 1; x++) {
      const idx = y * cw + x;
      if (isBg[idx]) continue;
      let bgN = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          if (isBg[(y + oy) * cw + (x + ox)]) bgN++;
        }
      }
      if (!bgN) continue;
      const p = idx * 4;
      const r = local[p];
      const g = local[p + 1];
      const b = local[p + 2];
      const [br, bg, bb] = getBg(x, y);
      const dist = Math.hypot(r - br, g - bg, b - bb);
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (dist < 36 && chroma < 22 && !(y < 168 && (r + g + b) / 3 < 46)) {
        const aNorm = clamp((dist - 10) / 26, 0.08, 1);
        local[p] = clamp(Math.round((r - (1 - aNorm) * br) / aNorm), 0, 255);
        local[p + 1] = clamp(Math.round((g - (1 - aNorm) * bg) / aNorm), 0, 255);
        local[p + 2] = clamp(Math.round((b - (1 - aNorm) * bb) / aNorm), 0, 255);
        local[p + 3] = Math.round(aNorm * 255);
      } else if (bgN >= 4) {
        local[p + 3] = Math.round(local[p + 3] * 0.85);
      }
    }
  }

  // Tight bounds & normalize into 1024x1536 studio space (soles grounded at y=1520, center x=510)
  let fgMinX = cw;
  let fgMaxX = 0;
  let fgMinY = ch;
  let fgMaxY = 0;
  for (let y = 2; y < ch - 2; y++) {
    for (let x = 2; x < cw - 2; x++) {
      if (local[(y * cw + x) * 4 + 3] > 140) {
        if (x < fgMinX) fgMinX = x;
        if (x > fgMaxX) fgMaxX = x;
        if (y < fgMinY) fgMinY = y;
        if (y > fgMaxY) fgMaxY = y;
      }
    }
  }

  const tmp = document.createElement('canvas');
  tmp.width = cw;
  tmp.height = ch;
  const tctx = tmp.getContext('2d')!;
  const imgData = tctx.createImageData(cw, ch);
  imgData.data.set(local);
  tctx.putImageData(imgData, 0, 0);

  const out = document.createElement('canvas');
  out.width = 1024;
  out.height = 1536;
  const octx = out.getContext('2d')!;
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';

  const figW = Math.max(1, fgMaxX - fgMinX + 1);
  const figH = Math.max(1, fgMaxY - fgMinY + 1);
  const targetH = 1506;
  const scale = targetH / figH;
  const dstW = figW * scale;
  const dstH = figH * scale;
  const dstX = 510 - dstW * 0.5;
  const dstY = 1520 - dstH;

  octx.drawImage(tmp, fgMinX, fgMinY, figW, figH, dstX, dstY, dstW, dstH);
  return out;
}

/**
 * Measures the white Calvin Klein boxers landmark directly inside a normalized 1024x1536 canvas
 * so every pose's garment anchors (chest, pelvis, waist, torsoScaleX/Y) lock onto the exact pixels!
 */
function measureNormalizedPoseAnchors(
  canvas: HTMLCanvasElement,
  baseTemplate: PoseGarmentAnchors
): PoseGarmentAnchors {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return baseTemplate;
  const { data } = ctx.getImageData(0, 0, 1024, 1536);

  let figMinY = 1536;
  let figMaxY = 0;
  for (let y = 10; y < 1530; y += 4) {
    for (let x = 20; x < 1004; x += 4) {
      if (data[(y * 1024 + x) * 4 + 3] > 140) {
        if (y < figMinY) figMinY = y;
        if (y > figMaxY) figMaxY = y;
      }
    }
  }
  const figH = Math.max(200, figMaxY - figMinY);

  // Detect bright neutral white boxers (excluding white studio stool below y > boxerZoneBot)
  const yScanStart = Math.round(figMinY + figH * 0.36);
  const yScanEnd = Math.round(figMinY + figH * (baseTemplate.poseBottomStyle === 'seated' ? 0.68 : 0.84));

  let boxMinX = 1024;
  let boxMaxX = 0;
  let boxMinY = 1536;
  let boxMaxY = 0;
  let boxSumX = 0;
  let boxCnt = 0;

  for (let y = yScanStart; y < yScanEnd; y += 3) {
    for (let x = 220; x < 804; x += 3) {
      const p = (y * 1024 + x) * 4;
      if (data[p + 3] < 180) continue;
      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      if (lum > 148 && chroma < 24) {
        if (x < boxMinX) boxMinX = x;
        if (x > boxMaxX) boxMaxX = x;
        if (y < boxMinY) boxMinY = y;
        if (y > boxMaxY) boxMaxY = y;
        boxSumX += x;
        boxCnt++;
      }
    }
  }

  if (boxCnt < 80) {
    return baseTemplate;
  }

  const boxerCx = clamp(boxSumX / boxCnt, 380, 640);
  const boxerW = clamp(boxMaxX - boxMinX, 130, 340);
  // Natural pelvis center sits ~46% down from the top of the waistband
  const boxerH = clamp(boxMaxY - boxMinY, 80, 240);
  const pelvisY = Math.round(boxMinY + Math.min(boxerH * 0.48, boxerW * 0.34));

  // Scale torso proportionally to the measured boxer width (front reference boxerW ≈ 268px -> torsoScaleX ≈ 0.96)
  const measuredScaleX = clamp((boxerW / 274) * 0.98, 0.58, 1.05);
  // Standing torso height from crown to boxer top is ~610px at scale 0.96
  const crownToWaist = Math.max(220, boxMinY - figMinY);
  const measuredScaleY = clamp((crownToWaist / 625) * 0.96, 0.56, 1.04);

  // Chest center sits directly above boxer waistband (~212px * scaleY above pelvisY)
  const chestY = Math.round(pelvisY - 226 * measuredScaleY);
  const absY = Math.round((chestY + pelvisY) * 0.5);
  const neckY = Math.round(chestY - 252 * measuredScaleY);

  return {
    ...baseTemplate,
    pelvis: [Math.round(boxerCx), pelvisY],
    abs: [Math.round(boxerCx), absY],
    chest: [Math.round(boxerCx), chestY],
    neck: [Math.round(boxerCx), neckY],
    torsoScaleX: Number(measuredScaleX.toFixed(3)),
    torsoScaleY: Number(measuredScaleY.toFixed(3)),
  };
}

/**
 * Extracts a studio-HD pose figure from the dark-studio golden reference sheet (image_b8959293.png):
 *  - Progressive 4x (3x for 3/4 Trasera) super-sampling BEFORE matte extraction for vector-smooth curves
 *  - Complete interior dark-cavity & floor-shadow removal (zero black elbow-waist holes)
 *  - Edge dark-fringe color decontamination + Gaussian anti-aliased alpha
 *  - Foreground-only luminance Unsharp Mask for crisp 3D anatomical clarity
 *  - Chin-anchored, skin-tone-matched HD 3D-animated Hero Head upgrade on front-facing poses
 *  - Seamless HD lower-leg completion for mid-thigh poses (08 Saludo, 09 Pensativo, 10 Señalando)
 */
function extractDarkSheetFigure(
  srcData: Uint8ClampedArray,
  srcW: number,
  cropBox: [number, number, number, number],
  heightRatio: number,
  options: {
    isBackHead?: boolean;
    stripSideBorders?: { aboveY: number; belowY: number };
    graftFrontCanvas?: HTMLCanvasElement;
    heroHead?: ExtractedHeroHead;
    graftHead?: boolean;
    baseAnchors?: PoseGarmentAnchors;
  } = {}
): { canvas: HTMLCanvasElement; thumbDataUrl: string; anchors: PoseGarmentAnchors } {
  const [x0, y0, x1, y1] = cropBox;
  const sw = Math.max(2, x1 - x0);
  const sh = Math.max(2, y1 - y0);

  const raw = new Uint8ClampedArray(sw * sh * 4);
  for (let y = 0; y < sh; y++) {
    const srcRow = ((y0 + y) * srcW + x0) * 4;
    raw.set(srcData.subarray(srcRow, srcRow + sw * 4), y * sw * 4);
  }

  // Strip vertical gold card border lines where outstretched arms cross frame (T-Pose)
  if (options.stripSideBorders) {
    const { aboveY, belowY } = options.stripSideBorders;
    for (let y = 0; y < sh; y++) {
      if (y >= aboveY && y <= belowY) continue;
      for (let x = 0; x < sw; x++) {
        if (x < 34 || x >= sw - 26) {
          const p = (y * sw + x) * 4;
          raw[p] = 8;
          raw[p + 1] = 6;
          raw[p + 2] = 3;
        }
      }
    }
  }

  const isBackHead = Boolean(options.isBackHead);

  // Trim top 3px card border edge on small pose cards so no top gold line ever clings to overhead arms/hair
  if (!isBackHead) {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < sw; x++) {
        const p = (y * sw + x) * 4;
        raw[p] = 8;
        raw[p + 1] = 6;
        raw[p + 2] = 3;
      }
    }
  }

  // Stage 1: Progressive 4x (3x for back34) super-sampling BEFORE matting so silhouette curves are razor-smooth!
  const up = isBackHead ? 3 : 4;
  const { data: local, w: cw, h: ch } = progressiveCanvasUpscale(raw, sw, sh, up);

  // Locate topmost warm face/neck skin strictly within narrow central head column (ignores raised hands!)
  let topSkinY = ch;
  const xScanLo = Math.floor(cw * (isBackHead ? 0.16 : 0.37));
  const xScanHi = Math.ceil(cw * (isBackHead ? 0.84 : 0.63));
  for (let y = 12; y < Math.floor(ch * 0.52); y++) {
    for (let x = xScanLo; x < xScanHi; x++) {
      const p = (y * cw + x) * 4;
      const r = local[p];
      const g = local[p + 1];
      const b = local[p + 2];
      if (r > 118 && g > 74 && r > b + 24) {
        if (y < topSkinY) topSkinY = y;
      }
    }
  }

  let headXSum = 0;
  let headXCnt = 0;
  for (let y = topSkinY; y <= Math.min(ch - 8, topSkinY + Math.max(24, Math.round(ch * 0.085))); y++) {
    for (let x = xScanLo; x < xScanHi; x++) {
      const p = (y * cw + x) * 4;
      if (local[p] > 118 && local[p + 1] > 74 && local[p] > local[p + 2] + 24) {
        headXSum += x;
        headXCnt++;
      }
    }
  }
  const headCx = headXCnt > 20 ? headXSum / headXCnt : cw * 0.5;

  // Measure local dark card background luminance from side margins
  let bgSum = 0;
  let bgCnt = 0;
  for (let y = 12; y < ch - 24; y += 6) {
    for (const sx of [6, 12, cw - 13, cw - 7]) {
      const p = (y * cw + sx) * 4;
      const l = 0.299 * local[p] + 0.587 * local[p + 1] + 0.114 * local[p + 2];
      if (l < 38) {
        bgSum += l;
        bgCnt++;
      }
    }
  }
  const localCardBgLum = bgCnt > 10 ? bgSum / bgCnt : 16;

  // Morphological hair-closing inside the tight head bounding box
  const headXHalf = Math.round(isBackHead ? cw * 0.34 : Math.max(48, ch * 0.125));
  const headYMin = Math.max(
    isBackHead ? 4 : 12,
    topSkinY - Math.round(ch * (isBackHead ? 0.14 : options.graftHead ? 0.082 : 0.058))
  );
  const headYMax = Math.min(ch - 2, topSkinY + Math.round(ch * (isBackHead ? 0.12 : 0.19)));
  const rawHeadFg = new Uint8Array(cw * ch);
  const hairLitThr = isBackHead ? 17 : Math.max(24, localCardBgLum + 10);

  for (let y = headYMin; y < headYMax; y++) {
    for (
      let x = Math.max(8, Math.floor(headCx - headXHalf));
      x < Math.min(cw - 8, Math.ceil(headCx + headXHalf));
      x++
    ) {
      const p = (y * cw + x) * 4;
      const lum = 0.299 * local[p] + 0.587 * local[p + 1] + 0.114 * local[p + 2];
      if (lum >= hairLitThr || local[p] >= hairLitThr + 6) {
        rawHeadFg[y * cw + x] = 1;
      }
    }
  }

  const closeR = isBackHead ? 36 : 16;
  const sealedHeadMask = morphCloseMask(rawHeadFg, cw, ch, headYMin, headYMax, closeR);

  if (!isBackHead) {
    const innerRx = Math.max(24, ch * 0.045);
    const innerRy = Math.max(20, ch * 0.034);
    const innerCy = topSkinY - Math.max(8, ch * 0.011);
    for (let y = headYMin; y < headYMax; y++) {
      for (
        let x = Math.max(8, Math.floor(headCx - headXHalf));
        x < Math.min(cw - 8, Math.ceil(headCx + headXHalf));
        x++
      ) {
        const dx = (x - headCx) / innerRx;
        const dy = (y - innerCy) / innerRy;
        if (dx * dx + dy * dy <= 1.0) sealedHeadMask[y * cw + x] = 1;
      }
    }
  }

  const isBg = new Uint8Array(cw * ch);
  const queue = new Int32Array(cw * ch);
  let head = 0;
  let tail = 0;

  const isOuterBg = (x: number, y: number): boolean => {
    const idx = y * cw + x;
    const p = idx * 4;
    const r = local[p];
    const g = local[p + 1];
    const b = local[p + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);

    const onRim = x <= 8 || x >= cw - 9 || y <= 10 || y >= ch - 9;
    if (onRim && r > 60 && g > 40 && b < 72 && r > b + 14) return true;

    if (sealedHeadMask[idx] && !onRim) return false;
    if (lum > 112) return false;
    if (y > ch - 110 && lum < 78 && !(r > 106 && g > 64 && r > b + 24)) return true;
    if (r > 104 && g > 62 && r > b + 20) return false;
    if (lum < Math.max(38, localCardBgLum + 20)) return true;
    if (lum < 74 && r < 102 && chroma < 68) return true;
    return false;
  };

  const trySeed = (x: number, y: number) => {
    if (x < 0 || x >= cw || y < 0 || y >= ch) return;
    const idx = y * cw + x;
    if (isBg[idx]) return;
    if (isOuterBg(x, y)) {
      isBg[idx] = 1;
      queue[tail++] = idx;
    }
  };

  for (let x = 0; x < cw; x++) {
    trySeed(x, 0);
    trySeed(x, ch - 1);
  }
  for (let y = 0; y < ch; y++) {
    trySeed(0, y);
    trySeed(cw - 1, y);
  }

  // Stage 2: Complete interior dark-cavity & floor-shadow seeding (arm-waist triangles, elbow gaps, groin floor ovals)
  const cavityLumMax = Math.max(34, localCardBgLum + 18);
  for (let y = 12; y < ch - 12; y += 3) {
    for (let x = 12; x < cw - 12; x += 3) {
      const idx = y * cw + x;
      if (isBg[idx] || sealedHeadMask[idx]) continue;
      let maxL = 0;
      let maxR = 0;
      for (let oy = -2; oy <= 2; oy += 2) {
        for (let ox = -2; ox <= 2; ox += 2) {
          const nIdx = (y + oy) * cw + (x + ox);
          if (sealedHeadMask[nIdx]) {
            maxL = 999;
            break;
          }
          const pp = nIdx * 4;
          const l = 0.299 * local[pp] + 0.587 * local[pp + 1] + 0.114 * local[pp + 2];
          if (l > maxL) maxL = l;
          if (local[pp] > maxR) maxR = local[pp];
        }
      }
      const isDarkCavity = maxL <= cavityLumMax && maxR < 52;
      const isFloorShadowVoid = !isBackHead && y > ch * 0.7 && maxL < 66 && maxR < 90;
      if (isDarkCavity || isFloorShadowVoid) {
        isBg[idx] = 1;
        queue[tail++] = idx;
      }
    }
  }

  while (head < tail) {
    const cur = queue[head++];
    const cx = cur % cw;
    const cy = (cur - cx) / cw;
    if (cx > 0) trySeed(cx - 1, cy);
    if (cx < cw - 1) trySeed(cx + 1, cy);
    if (cy > 0) trySeed(cx, cy - 1);
    if (cy < ch - 1) trySeed(cx, cy + 1);
  }

  keepLargestComponent(isBg, cw, ch);
  // Only heal tiny pinprick noise (<= 48px at 4x), NEVER refilling arm-to-waist cavities!
  healSmallInteriorHoles(isBg, cw, ch, isBackHead ? 280 : 48);

  // Stage 3: Sub-pixel distance-to-bg dark-fringe color decontamination + silky-smooth Gaussian alpha
  const alpha = new Float32Array(cw * ch);
  const distBg = new Uint8Array(cw * ch);
  distBg.fill(9);
  for (let i = 0; i < cw * ch; i++) {
    alpha[i] = isBg[i] ? 0 : 1;
    if (isBg[i]) distBg[i] = 0;
  }
  for (let pass = 1; pass <= 3; pass++) {
    for (let y = 1; y < ch - 1; y++) {
      for (let x = 1; x < cw - 1; x++) {
        const idx = y * cw + x;
        if (distBg[idx] <= pass) continue;
        if (
          distBg[idx - 1] === pass - 1 ||
          distBg[idx + 1] === pass - 1 ||
          distBg[idx - cw] === pass - 1 ||
          distBg[idx + cw] === pass - 1
        ) {
          distBg[idx] = pass;
        }
      }
    }
  }

  for (let y = 3; y < ch - 3; y++) {
    for (let x = 3; x < cw - 3; x++) {
      const idx = y * cw + x;
      if (distBg[idx] === 0 || distBg[idx] >= 3 || sealedHeadMask[idx]) continue;
      const p = idx * 4;
      const lum = 0.299 * local[p] + 0.587 * local[p + 1] + 0.114 * local[p + 2];
      if (lum < 98) {
        let sr = 0;
        let sg = 0;
        let sb = 0;
        let sc = 0;
        for (let oy = -3; oy <= 3; oy++) {
          for (let ox = -3; ox <= 3; ox++) {
            const ni = (y + oy) * cw + (x + ox);
            if (distBg[ni] >= 3) {
              const np = ni * 4;
              sr += local[np];
              sg += local[np + 1];
              sb += local[np + 2];
              sc++;
            }
          }
        }
        if (sc > 0) {
          const mix = distBg[idx] === 1 ? 0.8 : 0.45;
          local[p] = Math.round(local[p] * (1 - mix) + (sr / sc) * mix);
          local[p + 1] = Math.round(local[p + 1] * (1 - mix) + (sg / sc) * mix);
          local[p + 2] = Math.round(local[p + 2] * (1 - mix) + (sb / sc) * mix);
        }
      }
      if (distBg[idx] === 1) {
        alpha[idx] = clamp((lum - 20) / 56, 0.18, 0.85);
      }
    }
  }

  const smoothA = new Float32Array(cw * ch);
  for (let y = 1; y < ch - 1; y++) {
    for (let x = 1; x < cw - 1; x++) {
      const i = y * cw + x;
      if (distBg[i] >= 3) {
        smoothA[i] = 1;
        continue;
      }
      if (
        distBg[i] === 0 &&
        distBg[i - 1] === 0 &&
        distBg[i + 1] === 0 &&
        distBg[i - cw] === 0 &&
        distBg[i + cw] === 0
      ) {
        smoothA[i] = 0;
        continue;
      }
      smoothA[i] =
        (alpha[i - cw - 1] +
          2 * alpha[i - cw] +
          alpha[i - cw + 1] +
          2 * alpha[i - 1] +
          4 * alpha[i] +
          2 * alpha[i + 1] +
          alpha[i + cw - 1] +
          2 * alpha[i + cw] +
          alpha[i + cw + 1]) /
        16;
    }
  }

  // Stage 4: Foreground-only Luminance Unsharp Mask (razor-crisp 3D musculature & boxer weave, zero edge halo!)
  const lumBuf = new Float32Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) {
    const p = i * 4;
    lumBuf[i] = 0.299 * local[p] + 0.587 * local[p + 1] + 0.114 * local[p + 2];
  }
  const blurH = new Float32Array(cw * ch);
  const blurV = new Float32Array(cw * ch);
  const rad = 3;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = y * cw + x;
      if (distBg[i] === 0) continue;
      let s = 0;
      let w = 0;
      for (let ox = -rad; ox <= rad; ox++) {
        const nx = x + ox;
        if (nx >= 0 && nx < cw && distBg[y * cw + nx] > 0) {
          const wt = rad + 1 - Math.abs(ox);
          s += lumBuf[y * cw + nx] * wt;
          w += wt;
        }
      }
      blurH[i] = w > 0 ? s / w : lumBuf[i];
    }
  }
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = y * cw + x;
      if (distBg[i] === 0) continue;
      let s = 0;
      let w = 0;
      for (let oy = -rad; oy <= rad; oy++) {
        const ny = y + oy;
        if (ny >= 0 && ny < ch && distBg[ny * cw + x] > 0) {
          const wt = rad + 1 - Math.abs(oy);
          s += blurH[ny * cw + x] * wt;
          w += wt;
        }
      }
      blurV[i] = w > 0 ? s / w : blurH[i];
    }
  }

  const sharpAmt = isBackHead ? 0.36 : 0.72;
  for (let i = 0; i < cw * ch; i++) {
    const p = i * 4;
    local[p + 3] = Math.round(clamp(smoothA[i], 0, 1) * 255);
    if (distBg[i] >= 2) {
      const diff = clamp((lumBuf[i] - blurV[i]) * sharpAmt, -24, 28);
      local[p] = clamp(Math.round(local[p] + diff), 0, 255);
      local[p + 1] = clamp(Math.round(local[p + 1] + diff), 0, 255);
      local[p + 2] = clamp(Math.round(local[p + 2] + diff), 0, 255);
    }
  }

  // Stage 5: Chin-anchored, skin-tone-matched HD 3D-Animated Hero Head upgrade on front-facing pose cards!
  if (options.graftHead && options.heroHead && !isBackHead) {
    const heroHead = options.heroHead;
    let fMinY = ch;
    let fMaxY = 0;
    for (let y = 0; y < ch; y += 2) {
      for (let x = 0; x < cw; x += 2) {
        if (local[(y * cw + x) * 4 + 3] > 160) {
          if (y < fMinY) fMinY = y;
          if (y > fMaxY) fMaxY = y;
        }
      }
    }
    const fH = Math.max(100, fMaxY - fMinY);
    const isLowPose = heightRatio < 0.85;
    const isUpperCrop = Boolean(options.graftFrontCanvas);

    const maxFaceScanH = fH * (isUpperCrop ? 0.34 : isLowPose ? 0.34 : 0.21);
    const minFaceH = fH * (isUpperCrop ? 0.14 : isLowPose ? 0.14 : 0.082);
    let maxFaceW = 0;
    let faceMidSumX = 0;
    let faceMidCnt = 0;
    let neckY = Math.round(topSkinY + minFaceH * 1.15);
    let minNeckW = 9999;
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let sc = 0;

    for (let y = topSkinY + 4; y < Math.min(ch - 8, Math.round(topSkinY + maxFaceScanH)); y++) {
      let lx = cw;
      let rx = 0;
      const bandHalf = Math.round(fH * 0.125);
      for (
        let x = Math.max(0, Math.round(headCx - bandHalf));
        x <= Math.min(cw - 1, Math.round(headCx + bandHalf));
        x++
      ) {
        const p = (y * cw + x) * 4;
        if (
          local[p + 3] > 160 &&
          local[p] > 105 &&
          local[p + 1] > 62 &&
          local[p] > local[p + 2] + 18
        ) {
          if (x < lx) lx = x;
          if (x > rx) rx = x;
          if (y > topSkinY + 8 && y < topSkinY + minFaceH) {
            sr += local[p];
            sg += local[p + 1];
            sb += local[p + 2];
            sc++;
          }
        }
      }
      if (rx > lx) {
        const w = rx - lx;
        const dy = y - topSkinY;
        if (dy < minFaceH * 0.88) {
          if (w > maxFaceW) maxFaceW = w;
          faceMidSumX += (lx + rx) * 0.5;
          faceMidCnt++;
        } else {
          if (maxFaceW > 12 && w > maxFaceW * 1.45) break;
          if (w < minNeckW && w > maxFaceW * 0.35) {
            minNeckW = w;
            neckY = y;
          }
        }
      }
    }

    const trueFaceCx = faceMidCnt > 4 ? faceMidSumX / faceMidCnt : headCx;
    const poseForeheadToChin = clamp((neckY - topSkinY) * 0.98, minFaceH * 0.85, maxFaceScanH * 0.8);
    const heroForeheadToChin = heroHead.chinY - heroHead.foreheadY;
    const hScale = clamp((poseForeheadToChin / heroForeheadToChin) * 0.98, 0.14, 0.65);
    const dstOriginX = trueFaceCx - heroHead.faceCx * hScale;
    const dstOriginY = neckY + 2 - heroHead.chinY * hScale;

    const poseSkinR = sc > 10 ? sr / sc : heroHead.skinR;
    const poseSkinG = sc > 10 ? sg / sc : heroHead.skinG;
    const poseSkinB = sc > 10 ? sb / sc : heroHead.skinB;
    const gainR = clamp(poseSkinR / Math.max(1, heroHead.skinR), 0.88, 1.12);
    const gainG = clamp(poseSkinG / Math.max(1, heroHead.skinG), 0.88, 1.12);
    const gainB = clamp(poseSkinB / Math.max(1, heroHead.skinB), 0.88, 1.12);

    // Clear all old blurry head/hair pixels from y=0 down to neckY+6 so ZERO fuzzy hair slivers float above!
    const eraseRx = poseForeheadToChin * 0.72;
    const eraseBot = Math.min(ch, Math.floor(neckY + 8));
    for (let y = 0; y < eraseBot; y++) {
      for (
        let x = Math.max(0, Math.floor(trueFaceCx - eraseRx));
        x < Math.min(cw, Math.ceil(trueFaceCx + eraseRx));
        x++
      ) {
        const dx = (x - trueFaceCx) / eraseRx;
        if (dx * dx > 1.0) continue;
        const nyFade = clamp((neckY + 6 - y) / 22, 0, 1);
        const p = (y * cw + x) * 4;
        local[p + 3] = Math.round(local[p + 3] * (1 - nyFade));
      }
    }

    const dw = Math.round(heroHead.w * hScale);
    const dh = Math.round(heroHead.h * hScale);
    const ox = Math.round(dstOriginX);
    const oy = Math.round(dstOriginY);
    for (let y = 0; y < dh; y++) {
      const ty = oy + y;
      if (ty < 0 || ty >= ch) continue;
      const sy = (y + 0.5) / hScale - 0.5;
      const iy = clamp(Math.floor(sy), 0, heroHead.h - 2);
      const fy = clamp(sy - iy, 0, 1);
      for (let x = 0; x < dw; x++) {
        const tx = ox + x;
        if (tx < 0 || tx >= cw) continue;
        const sx = (x + 0.5) / hScale - 0.5;
        const ix = clamp(Math.floor(sx), 0, heroHead.w - 2);
        const fx = clamp(sx - ix, 0, 1);
        const p00 = (iy * heroHead.w + ix) * 4;
        const p10 = p00 + 4;
        const p01 = p00 + heroHead.w * 4;
        const p11 = p01 + 4;
        const w00 = (1 - fx) * (1 - fy);
        const w10 = fx * (1 - fy);
        const w01 = (1 - fx) * fy;
        const w11 = fx * fy;
        const sa =
          (heroHead.data[p00 + 3] * w00 +
            heroHead.data[p10 + 3] * w10 +
            heroHead.data[p01 + 3] * w01 +
            heroHead.data[p11 + 3] * w11) /
          255;
        if (sa <= 0.01) continue;
        let sr2 =
          heroHead.data[p00] * w00 +
          heroHead.data[p10] * w10 +
          heroHead.data[p01] * w01 +
          heroHead.data[p11] * w11;
        let sg2 =
          heroHead.data[p00 + 1] * w00 +
          heroHead.data[p10 + 1] * w10 +
          heroHead.data[p01 + 1] * w01 +
          heroHead.data[p11 + 1] * w11;
        let sb2 =
          heroHead.data[p00 + 2] * w00 +
          heroHead.data[p10 + 2] * w10 +
          heroHead.data[p01 + 2] * w01 +
          heroHead.data[p11 + 2] * w11;
        if (sr2 > sb2 + 18 && sr2 > 95) {
          sr2 = clamp(sr2 * (0.5 + 0.5 * gainR), 0, 255);
          sg2 = clamp(sg2 * (0.5 + 0.5 * gainG), 0, 255);
          sb2 = clamp(sb2 * (0.5 + 0.5 * gainB), 0, 255);
        }
        const dp = (ty * cw + tx) * 4;
        const da = local[dp + 3] / 255;
        const outA = sa + da * (1 - sa);
        if (outA > 0) {
          local[dp] = Math.round((sr2 * sa + local[dp] * da * (1 - sa)) / outA);
          local[dp + 1] = Math.round((sg2 * sa + local[dp + 1] * da * (1 - sa)) / outA);
          local[dp + 2] = Math.round((sb2 * sa + local[dp + 2] * da * (1 - sa)) / outA);
          local[dp + 3] = Math.round(outA * 255);
        }
      }
    }
  }

  // Tight foreground bounds
  let fgMinX = cw;
  let fgMaxX = 0;
  let fgMinY = ch;
  let fgMaxY = 0;
  for (let y = 2; y < ch - 2; y++) {
    for (let x = 2; x < cw - 2; x++) {
      if (local[(y * cw + x) * 4 + 3] > 120) {
        if (x < fgMinX) fgMinX = x;
        if (x > fgMaxX) fgMaxX = x;
        if (y < fgMinY) fgMinY = y;
        if (y > fgMaxY) fgMaxY = y;
      }
    }
  }

  const tmp = document.createElement('canvas');
  tmp.width = cw;
  tmp.height = ch;
  const tctx = tmp.getContext('2d')!;
  const imgData = tctx.createImageData(cw, ch);
  imgData.data.set(local);
  tctx.putImageData(imgData, 0, 0);

  const figW = Math.max(1, fgMaxX - fgMinX + 1);
  const figH = Math.max(1, fgMaxY - fgMinY + 1);

  const out = document.createElement('canvas');
  out.width = 1024;
  out.height = 1536;
  const octx = out.getContext('2d')!;
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';

  if (options.graftFrontCanvas) {
    // Seamless full-body pedestal completion for mid-thigh poses (08 Saludo, 09 Pensativo, 10 Señalando)
    let bMinX = cw;
    let bMaxX = 0;
    let bMinY = ch;
    let bMaxY = 0;
    for (let y = Math.floor(fgMinY + figH * 0.45); y <= fgMaxY; y++) {
      for (let x = fgMinX; x <= fgMaxX; x++) {
        const p = (y * cw + x) * 4;
        if (local[p + 3] < 160) continue;
        const lum = 0.299 * local[p] + 0.587 * local[p + 1] + 0.114 * local[p + 2];
        const chm =
          Math.max(local[p], local[p + 1], local[p + 2]) -
          Math.min(local[p], local[p + 1], local[p + 2]);
        if (lum > 142 && chm < 24) {
          if (x < bMinX) bMinX = x;
          if (x > bMaxX) bMaxX = x;
          if (y < bMinY) bMinY = y;
          if (y > bMaxY) bMaxY = y;
        }
      }
    }

    const bW = Math.max(48, bMaxX - bMinX + 1);
    const bCx = (bMinX + bMaxX) * 0.5;
    const upperScale = clamp(266 / bW, 1.1, 2.6);
    const upperDstW = figW * upperScale;
    const upperDstH = figH * upperScale;
    const upperDstX = 510 - (bCx - fgMinX) * upperScale;
    const upperDstY = 646 - (bMinY - fgMinY) * upperScale;

    // 1. Paint HD lower legs from front turnaround starting right at the boxer hem (y=770..1536)
    octx.save();
    octx.beginPath();
    octx.rect(0, 770, 1024, 1536 - 770);
    octx.clip();
    octx.filter = 'saturate(1.06) brightness(1.03)';
    octx.drawImage(options.graftFrontCanvas, 0, 0);
    octx.restore();

    // 2. Draw extracted upper pose cropped softly right below its boxers (feathered seamlessly into HD legs!)
    const upperLayer = document.createElement('canvas');
    upperLayer.width = 1024;
    upperLayer.height = 1536;
    const uctx = upperLayer.getContext('2d')!;
    uctx.imageSmoothingEnabled = true;
    uctx.imageSmoothingQuality = 'high';
    uctx.drawImage(tmp, fgMinX, fgMinY, figW, figH, upperDstX, upperDstY, upperDstW, upperDstH);

    const seamStart = Math.min(845, Math.round(upperDstY + (bMaxY - fgMinY) * upperScale + 6));
    const seamEnd = seamStart + 46;
    uctx.globalCompositeOperation = 'destination-in';
    const maskGrad = uctx.createLinearGradient(0, seamStart, 0, seamEnd);
    maskGrad.addColorStop(0, 'rgba(0,0,0,1)');
    maskGrad.addColorStop(0.55, 'rgba(0,0,0,0.65)');
    maskGrad.addColorStop(1, 'rgba(0,0,0,0)');
    uctx.fillStyle = '#000';
    uctx.fillRect(0, 0, 1024, seamStart);
    uctx.fillStyle = maskGrad;
    uctx.fillRect(0, seamStart, 1024, seamEnd - seamStart);

    octx.drawImage(upperLayer, 0, 0);
  } else {
    const maxTargetH = 1500 * heightRatio;
    const maxTargetW = 950;
    const scale = Math.min(maxTargetH / figH, maxTargetW / figW);
    const dstW = figW * scale;
    const dstH = figH * scale;
    const dstX = 510 - dstW * 0.5;
    const dstY = 1520 - dstH;
    octx.drawImage(tmp, fgMinX, fgMinY, figW, figH, dstX, dstY, dstW, dstH);
  }

  const anchors = measureNormalizedPoseAnchors(out, options.baseAnchors || NEW_FRONT_ANCHORS);

  // Crisp 84x112 thumbnail for the Muestrario de Poses gallery
  const thumb = document.createElement('canvas');
  thumb.width = 84;
  thumb.height = 112;
  const thctx = thumb.getContext('2d')!;
  thctx.imageSmoothingEnabled = true;
  thctx.imageSmoothingQuality = 'high';
  thctx.drawImage(out, 0, 0, 1024, 1536, 4, 4, 76, 104);

  return { canvas: out, thumbDataUrl: thumb.toDataURL('image/png'), anchors };
}

function makeThumbFromNormalized(canvas: HTMLCanvasElement): string {
  const thumb = document.createElement('canvas');
  thumb.width = 84;
  thumb.height = 112;
  const ctx = thumb.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, 1024, 1536, 4, 4, 76, 104);
  return thumb.toDataURL('image/png');
}

export function loadVitruvianAssetPack(): Promise<LoadedVitruvianAssetPack> {
  if (cachedAssetPackPromise) return cachedAssetPackPromise;
  cachedAssetPackPromise = Promise.all([
    loadImageEl(NEW_MODEL_TURNAROUND_SRC),
    loadImageEl(NEW_MODEL_POSES_SHEET_SRC),
  ])
    .then(([orthoImg, sheetImg]) => {
      // 1. Read pixels of 1536x1024 4-view turnaround sheet
      const oCanvas = document.createElement('canvas');
      oCanvas.width = orthoImg.naturalWidth || 1536;
      oCanvas.height = orthoImg.naturalHeight || 1024;
      const octx = oCanvas.getContext('2d', { willReadFrequently: true })!;
      octx.drawImage(orthoImg, 0, 0, oCanvas.width, oCanvas.height);
      const oData = octx.getImageData(0, 0, oCanvas.width, oCanvas.height).data;

      const frontCanvas = extractTurnaroundView(
        oData,
        oCanvas.width,
        oCanvas.height,
        32,
        458,
        [10, 448],
        false
      );
      const leftCanvas = extractTurnaroundView(
        oData,
        oCanvas.width,
        oCanvas.height,
        462,
        746,
        [452, 748],
        false
      );
      const backCanvas = extractTurnaroundView(
        oData,
        oCanvas.width,
        oCanvas.height,
        750,
        1216,
        [748, 1216],
        true
      );
      const rightCanvas = extractTurnaroundView(
        oData,
        oCanvas.width,
        oCanvas.height,
        1218,
        1520,
        [1216, 1522],
        false
      );

      // 2. Read pixels of 1024x1536 pose & turnaround reference sheet
      const sCanvas = document.createElement('canvas');
      sCanvas.width = sheetImg.naturalWidth || 1024;
      sCanvas.height = sheetImg.naturalHeight || 1536;
      const sctx = sCanvas.getContext('2d', { willReadFrequently: true })!;
      sctx.drawImage(sheetImg, 0, 0, sCanvas.width, sCanvas.height);
      const sData = sctx.getImageData(0, 0, sCanvas.width, sCanvas.height).data;

      // Extract ultra-HD 3D-animated Hero Head once to upgrade facial sharpness across front-facing poses
      const heroHead = extractHeroHead(sData, sCanvas.width);

      // 3/4 Trasera view extracted with 3x super-sampling + morphological back-head hair closing (ZERO head holes!)
      const back34Res = extractDarkSheetFigure(sData, sCanvas.width, [842, 276, 992, 584], 1.0, {
        isBackHead: true,
        baseAnchors: { ...NEW_BACK_ANCHORS, torsoScaleX: 0.82, isBack: true },
      });

      const turntable: Record<TurntableViewKey, HTMLCanvasElement> = {
        front: frontCanvas,
        left: leftCanvas,
        back: backCanvas,
        back34: back34Res.canvas,
        right: rightCanvas,
      };

      const poseCanvases: Record<string, HTMLCanvasElement> = {};
      const poseAnchors: Record<string, PoseGarmentAnchors> = {};
      const poseThumbnails: Record<string, string> = {};

      for (const poseDef of MODEL_POSES_CATALOG) {
        if (poseDef.kind === 'photo' && poseDef.cropBox) {
          const res = extractDarkSheetFigure(
            sData,
            sCanvas.width,
            poseDef.cropBox,
            poseDef.heightRatio,
            {
              stripSideBorders: poseDef.stripSideBorders,
              graftFrontCanvas: poseDef.graftFullLegs ? frontCanvas : undefined,
              heroHead,
              graftHead: poseDef.graftHead,
              baseAnchors: poseDef.anchors || NEW_FRONT_ANCHORS,
            }
          );
          poseCanvases[poseDef.id] = res.canvas;
          poseAnchors[poseDef.id] = res.anchors;
          poseThumbnails[poseDef.id] = res.thumbDataUrl;
        } else {
          const viewKey: TurntableViewKey =
            poseDef.defaultAngleDeg === 180
              ? 'back'
              : poseDef.defaultAngleDeg === 225
                ? 'back34'
                : poseDef.defaultAngleDeg === 90
                  ? 'left'
                  : 'front';
          poseAnchors[poseDef.id] = poseDef.anchors || NEW_FRONT_ANCHORS;
          poseThumbnails[poseDef.id] = makeThumbFromNormalized(turntable[viewKey]);
        }
      }

      return { turntable, poseCanvases, poseAnchors, poseThumbnails };
    })
    .catch((err) => {
      cachedAssetPackPromise = null;
      throw err;
    });
  return cachedAssetPackPromise;
}
