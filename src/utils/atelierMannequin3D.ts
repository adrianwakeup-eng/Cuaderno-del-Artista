import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { DressingRoomGarment } from '../types/crochet';
import { DEFAULT_GLB_AVATAR_PATH } from '../data/glbAssetManifest';
import {
  buildHumanSkinTextures,
  buildSculptedFaceTexture,
} from './crochetPbrTextures';
import {
  bakeFourViewAvatarTextures,
  type BakedAvatarTextures,
} from './fourViewTextureBaker';
import {
  applyMeasurementsToRig,
  applyPoseToHumanoidBones,
  buildRiggedAthleticHuman,
  createConfiguredGltfLoader,
  loadRiggedGlbAvatar,
  probeDropInGlbAvatar,
  type MappedGlbRig,
  type SkinnedHumanRig,
} from './professionalAvatarRig';
import {
  buildSkinnedBottomGarment,
  buildSkinnedTopGarment,
  type GarmentBuildContext,
} from './skinnedGarmentBuilder';

/* ============================================================================
   ATELIER CROCHET 3D COUTURE — PROFESSIONAL RIGGED AVATAR & SKINNED GARMENTS
   - Real 20-bone THREE.Skeleton + continuous THREE.SkinnedMesh athletic male
     anatomy (ZERO ball shoulders, ZERO ball elbows, ZERO ball hips/knees)
   - 4-view orthographic photo-projected PBR textures baked at runtime from
     /assets/aistudio/image_96c670b6.png (face, beard, glasses alignment, curls,
     athletic torso, white boxers, and matched skin tone across 360°)
   - Production GLTFLoader + DRACOLoader pipeline with automatic drop-in
     detection of /models/avatar_fuentes_nazco.glb & Mixamo/RPM/Blender/VRM
     bone auto-mapping so external .glb avatars pose AND wear all 960 garments
   - SkinnedMesh crochet garments bound directly to the avatar skeleton with
     mathematically guaranteed radial clearance (ZERO clipping / ZERO puffballs)
 ============================================================================ */

export type GraphicsQualityLevel = 'medio' | 'alto' | 'ultra';

export interface BodyMeasurements {
  chest: number; // 0.9 .. 1.15
  shoulders: number; // 0.9 .. 1.15
  waist: number; // 0.88 .. 1.15
  height: number; // 0.92 .. 1.1
}

export interface GlbLoadReport {
  fileName: string;
  meshCount: number;
  boneCount: number;
  animationCount: number;
}

export type StudioLightPresetId =
  | 'vestidor_lujo'
  | 'dorada'
  | 'pasarela'
  | 'claroscuro'
  | 'clasico';

export interface StudioLightPreset {
  id: StudioLightPresetId;
  label: string;
  bgHex: string | null;
  fogHex: string | null;
  keyColor: string;
  keyIntensity: number;
  fillSky: string;
  fillGround: string;
  fillIntensity: number;
  rimColor: string;
  rimIntensity: number;
  bounceIntensity: number;
  exposure: number;
  ringOpacity: number;
  showVitruvianFrame: boolean;
}

export const STUDIO_LIGHT_PRESETS: Record<StudioLightPresetId, StudioLightPreset> = {
  vestidor_lujo: {
    id: 'vestidor_lujo',
    label: 'Vestidor Dorado',
    bgHex: null, // Transparent alpha composite over the approved golden studio arch
    fogHex: null,
    keyColor: '#fff3df',
    keyIntensity: 2.2,
    fillSky: '#ffeed2',
    fillGround: '#5d3d22',
    fillIntensity: 0.66,
    rimColor: '#ffd382',
    rimIntensity: 1.72,
    bounceIntensity: 0.54,
    exposure: 1.03,
    ringOpacity: 0.0,
    showVitruvianFrame: false,
  },
  dorada: {
    id: 'dorada',
    label: 'Luz Dorada',
    bgHex: '#f4e6ca',
    fogHex: '#ecd9b5',
    keyColor: '#fff1d9',
    keyIntensity: 1.98,
    fillSky: '#fff6e8',
    fillGround: '#7a5430',
    fillIntensity: 0.64,
    rimColor: '#ffd182',
    rimIntensity: 1.38,
    bounceIntensity: 0.46,
    exposure: 1.02,
    ringOpacity: 0.68,
    showVitruvianFrame: true,
  },
  pasarela: {
    id: 'pasarela',
    label: 'Pasarela',
    bgHex: '#1d1712',
    fogHex: '#18120e',
    keyColor: '#fff8ec',
    keyIntensity: 2.38,
    fillSky: '#c8d6f5',
    fillGround: '#3d2a18',
    fillIntensity: 0.48,
    rimColor: '#ffc86d',
    rimIntensity: 1.98,
    bounceIntensity: 0.38,
    exposure: 1.04,
    ringOpacity: 0.52,
    showVitruvianFrame: false,
  },
  claroscuro: {
    id: 'claroscuro',
    label: 'Claroscuro',
    bgHex: '#281d13',
    fogHex: '#20170f',
    keyColor: '#ffe0ab',
    keyIntensity: 2.52,
    fillSky: '#8a94b4',
    fillGround: '#2d1c0f',
    fillIntensity: 0.38,
    rimColor: '#f5b84d',
    rimIntensity: 2.08,
    bounceIntensity: 0.28,
    exposure: 1.0,
    ringOpacity: 0.82,
    showVitruvianFrame: true,
  },
  clasico: {
    id: 'clasico',
    label: 'Estudio',
    bgHex: '#f8f0e1',
    fogHex: '#f2e6d0',
    keyColor: '#ffffff',
    keyIntensity: 1.86,
    fillSky: '#f2f6ff',
    fillGround: '#a88c6c',
    fillIntensity: 0.72,
    rimColor: '#ffecc8',
    rimIntensity: 1.1,
    bounceIntensity: 0.48,
    exposure: 1.0,
    ringOpacity: 0.48,
    showVitruvianFrame: true,
  },
};

export const STUDIO_LIGHT_ORDER: StudioLightPresetId[] = [
  'vestidor_lujo',
  'pasarela',
  'claroscuro',
  'dorada',
  'clasico',
];

export interface PoseJointTargets {
  pelvisYOffset: number;
  pelvisRotY: number;
  pelvisRotZ: number;
  spineRotX: number;
  spineRotY: number;
  spineRotZ: number;
  headRotX: number;
  headRotY: number;
  headRotZ: number;
  shoulderL: [number, number, number];
  elbowL: [number, number, number];
  shoulderR: [number, number, number];
  elbowR: [number, number, number];
  hipL: [number, number, number];
  kneeL: [number, number, number];
  ankleL: [number, number, number];
  hipR: [number, number, number];
  kneeR: [number, number, number];
  ankleR: [number, number, number];
}

export interface AtelierPoseDef {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  recommendedYaw?: number;
  joints: PoseJointTargets;
}

/**
 * Neutral bind-matched athletic stance mirroring /assets/aistudio/image_96c670b6.png:
 * Arms already hang at natural relaxed offset in bind pose, so Neutral uses zero double-splay!
 */
const NEUTRAL_JOINTS: PoseJointTargets = {
  pelvisYOffset: 0,
  pelvisRotY: 0,
  pelvisRotZ: 0,
  spineRotX: 0,
  spineRotY: 0,
  spineRotZ: 0,
  headRotX: 0,
  headRotY: 0,
  headRotZ: 0,
  shoulderL: [0.01, 0.02, 0.0],
  elbowL: [-0.08, 0.02, 0.03],
  shoulderR: [0.01, -0.02, 0.0],
  elbowR: [-0.08, -0.02, -0.03],
  hipL: [0, 0, 0],
  kneeL: [0.015, 0, 0],
  ankleL: [-0.015, 0, 0],
  hipR: [0, 0, 0],
  kneeR: [0.015, 0, 0],
  ankleR: [-0.015, 0, 0],
};

function makePose(partial: Partial<PoseJointTargets>): PoseJointTargets {
  return {
    ...NEUTRAL_JOINTS,
    ...partial,
  };
}

export const ATELIER_POSES: AtelierPoseDef[] = [
  {
    id: 'neutro',
    code: '01',
    title: 'Neutro',
    subtitle: 'Postura clásica de estudio',
    recommendedYaw: 0,
    joints: makePose({}),
  },
  {
    id: 'manos-cadera',
    code: '02',
    title: 'Manos en Cadera',
    subtitle: 'Silueta editorial firme',
    recommendedYaw: 0,
    joints: makePose({
      spineRotX: -0.04,
      headRotY: 0.08,
      shoulderL: [0.06, 0.24, -0.54],
      elbowL: [-0.24, 0.12, 1.18],
      shoulderR: [0.06, -0.24, 0.54],
      elbowR: [-0.24, -0.12, -1.18],
      hipL: [0, 0, -0.05],
      hipR: [0, 0, 0.05],
      ankleL: [0, 0, 0.05],
      ankleR: [0, 0, -0.05],
    }),
  },
  {
    id: 'pasarela',
    code: '03',
    title: 'Pasarela',
    subtitle: 'Paso elegante de desfile',
    recommendedYaw: 0.28,
    joints: makePose({
      pelvisYOffset: -0.04,
      pelvisRotY: -0.14,
      pelvisRotZ: -0.04,
      spineRotY: 0.18,
      spineRotZ: 0.04,
      headRotY: -0.08,
      shoulderL: [-0.24, 0.05, -0.06],
      elbowL: [-0.28, 0, 0.05],
      shoulderR: [0.28, -0.05, 0.08],
      elbowR: [-0.2, 0, -0.04],
      hipL: [-0.26, 0, -0.02],
      kneeL: [0.14, 0, 0],
      ankleL: [0.1, 0, 0.02],
      hipR: [0.22, 0, 0.02],
      kneeR: [0.3, 0, 0],
      ankleR: [-0.16, 0, -0.02],
    }),
  },
  {
    id: 'brazos-cruzados',
    code: '04',
    title: 'Brazos Cruzados',
    subtitle: 'Porte seguro de atelier',
    recommendedYaw: 0.18,
    joints: makePose({
      pelvisRotY: -0.08,
      spineRotY: 0.1,
      headRotY: -0.06,
      shoulderL: [-0.48, 0.34, -0.1],
      elbowL: [-1.12, 0.88, 0.3],
      shoulderR: [-0.44, -0.34, 0.12],
      elbowR: [-1.18, -0.86, -0.28],
      hipL: [0, 0, -0.04],
      hipR: [0, 0, 0.04],
      ankleL: [0, 0, 0.04],
      ankleR: [0, 0, -0.04],
    }),
  },
  {
    id: 'vitruvio',
    code: '05',
    title: 'Vitruvio',
    subtitle: 'Brazos abiertos en equilibrio',
    recommendedYaw: 0,
    joints: makePose({
      pelvisYOffset: -0.035,
      spineRotX: -0.03,
      shoulderL: [0, 0, -1.24],
      elbowL: [-0.06, 0, 0.04],
      shoulderR: [0, 0, 1.24],
      elbowR: [-0.06, 0, -0.04],
      hipL: [0, 0, -0.18],
      hipR: [0, 0, 0.18],
      ankleL: [0, 0, 0.18],
      ankleR: [0, 0, -0.18],
    }),
  },
  {
    id: 'invitacion',
    code: '06',
    title: 'Invitación',
    subtitle: 'Muestra caída de mangas y pecho',
    recommendedYaw: 0,
    joints: makePose({
      spineRotX: -0.04,
      headRotX: -0.04,
      shoulderL: [-0.14, 0.18, -0.68],
      elbowL: [-0.36, 0.32, 0.16],
      shoulderR: [-0.14, -0.18, 0.68],
      elbowR: [-0.36, -0.32, -0.16],
      hipL: [0, 0, -0.04],
      hipR: [0, 0, 0.04],
      ankleL: [0, 0, 0.04],
      ankleR: [0, 0, -0.04],
    }),
  },
  {
    id: 'saludo',
    code: '07',
    title: 'Saludo',
    subtitle: 'Gesto cálido de presentación',
    recommendedYaw: -0.14,
    joints: makePose({
      spineRotZ: -0.04,
      headRotZ: 0.06,
      headRotY: 0.12,
      shoulderL: [0.04, 0.1, -0.24],
      elbowL: [-0.32, 0, 0.5],
      shoulderR: [-0.42, -0.18, 2.08],
      elbowR: [-0.78, -0.2, -0.28],
    }),
  },
  {
    id: 'heroe',
    code: '08',
    title: 'Héroe',
    subtitle: 'Postura atlética con volumen',
    recommendedYaw: -0.24,
    joints: makePose({
      pelvisYOffset: -0.03,
      pelvisRotY: 0.16,
      spineRotY: -0.14,
      spineRotX: -0.04,
      headRotY: 0.16,
      shoulderL: [0.08, 0.16, -0.48],
      elbowL: [-0.24, 0.1, 1.12],
      shoulderR: [-0.1, -0.08, 0.14],
      elbowR: [-0.32, 0, -0.06],
      hipL: [-0.08, 0, -0.1],
      kneeL: [0.11, 0, 0],
      ankleL: [-0.03, 0, 0.1],
      hipR: [0.06, 0, 0.08],
      kneeR: [0.05, 0, 0],
      ankleR: [-0.11, 0, -0.08],
    }),
  },
  {
    id: 'biceps',
    code: '09',
    title: 'Bíceps',
    subtitle: 'Flexión atlética simétrica',
    recommendedYaw: 0,
    joints: makePose({
      spineRotX: -0.05,
      shoulderL: [-0.1, 0.2, -1.36],
      elbowL: [-0.26, 0.48, 1.62],
      shoulderR: [-0.1, -0.2, 1.36],
      elbowR: [-0.26, -0.48, -1.62],
      hipL: [0, 0, -0.07],
      hipR: [0, 0, 0.07],
      ankleL: [0, 0, 0.07],
      ankleR: [0, 0, -0.07],
    }),
  },
  {
    id: 'pensativo',
    code: '10',
    title: 'Pensativo',
    subtitle: 'Mano cerca del mentón',
    recommendedYaw: 0.24,
    joints: makePose({
      pelvisRotY: -0.1,
      spineRotY: 0.1,
      spineRotZ: -0.03,
      headRotX: 0.07,
      headRotY: -0.1,
      headRotZ: 0.06,
      shoulderL: [-0.38, 0.2, -0.08],
      elbowL: [-0.98, 0.64, 0.24],
      shoulderR: [-1.1, -0.24, 0.24],
      elbowR: [-1.48, -0.32, -0.24],
    }),
  },
  {
    id: 'relajado',
    code: '11',
    title: 'Relajado',
    subtitle: 'Contrapposto natural de taller',
    recommendedYaw: -0.18,
    joints: makePose({
      pelvisYOffset: -0.02,
      pelvisRotZ: 0.05,
      pelvisRotY: 0.1,
      spineRotZ: -0.05,
      spineRotY: -0.08,
      headRotZ: 0.04,
      headRotY: 0.08,
      shoulderL: [0.05, 0.05, -0.08],
      elbowL: [-0.22, 0, 0.06],
      shoulderR: [-0.08, -0.12, 0.22],
      elbowR: [-0.36, 0, -0.28],
      hipL: [-0.06, 0, -0.07],
      kneeL: [0.16, 0, 0],
      ankleL: [-0.1, 0, 0.06],
      hipR: [0.02, 0, 0.02],
      kneeR: [0.02, 0, 0],
      ankleR: [-0.04, 0, -0.04],
    }),
  },
  {
    id: 'espalda',
    code: '12',
    title: 'Espalda',
    subtitle: 'Vista posterior del tejido',
    recommendedYaw: Math.PI,
    joints: makePose({
      headRotY: 0.2,
      shoulderL: [0.03, 0.04, -0.04],
      elbowL: [-0.12, 0, 0.04],
      shoulderR: [0.03, -0.04, 0.04],
      elbowR: [-0.12, 0, -0.04],
    }),
  },
];

/* ============================================================================
   SOFTWARE WEBGL DETECTION & CLEAN RESOURCE DISPOSAL
 ============================================================================ */

export function detectSoftwareWebGL(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function disposeObjectTree(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) {
      geometries.add(mesh.geometry);
    }
    const matList = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    for (const mat of matList) {
      materials.add(mat);
      const anyMat = mat as unknown as Record<string, unknown>;
      for (const key of ['map', 'bumpMap', 'normalMap', 'roughnessMap', 'aoMap', 'alphaMap']) {
        const tex = anyMat[key];
        if (tex instanceof THREE.Texture) {
          textures.add(tex);
        }
      }
    }
  });

  textures.forEach((t) => t.dispose());
  materials.forEach((m) => m.dispose());
  geometries.forEach((g) => g.dispose());
}

/**
 * Engraved antique brass compass / degree ring texture for the approved Vitruvian pedestal top.
 */
function createPedestalCompassTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d')!;
  const c = size * 0.5;

  const bg = ctx.createRadialGradient(c, c, 24, c, c, c);
  bg.addColorStop(0, '#5a3d20');
  bg.addColorStop(0.55, '#482f18');
  bg.addColorStop(0.84, '#3a2411');
  bg.addColorStop(0.92, '#c89238');
  bg.addColorStop(1, '#7a5118');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(240, 198, 108, 0.58)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(240, 198, 108, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.68, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const isMajor = i % 9 === 0;
    const r0 = c * (isMajor ? 0.72 : 0.79);
    const r1 = c * 0.85;
    ctx.strokeStyle = isMajor ? 'rgba(255, 224, 146, 0.85)' : 'rgba(235, 190, 102, 0.45)';
    ctx.lineWidth = isMajor ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
    ctx.lineTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

/**
 * Soft radial contact shadow plane directly beneath the avatar's feet.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext('2d')!;
  const c = size * 0.5;
  const g = ctx.createRadialGradient(c, c, 8, c, c, c);
  g.addColorStop(0, 'rgba(24, 12, 4, 0.56)');
  g.addColorStop(0.45, 'rgba(24, 12, 4, 0.26)');
  g.addColorStop(1, 'rgba(24, 12, 4, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ============================================================================
   MAIN THREE.JS PROFESSIONAL AVATAR ENGINE
 ============================================================================ */

export interface AtelierSceneCallbacks {
  onYawChange?: (deg: number) => void;
  onAutoGlbLoaded?: (report: GlbLoadReport) => void;
}

export class AtelierMannequinScene {
  private container: HTMLElement;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private pmremEnv: THREE.Texture;

  // Lights & Stage
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;
  private bounceLight: THREE.DirectionalLight;
  private faceFillLight: THREE.DirectionalLight;
  private vitruvianFrameGroup: THREE.Group;
  private vitruvianLineMat: THREE.LineBasicMaterial;
  private vitruvianRingMat: THREE.MeshStandardMaterial;

  // Rigged Continuous SkinnedMesh Avatar + External GLB Avatar & Garment Slots
  private rig: SkinnedHumanRig;
  private skinnedGarmentsGroup: THREE.Group;
  private spine2DetailGroup: THREE.Group;
  private hipsDetailGroup: THREE.Group;

  private glbAvatarGroup: THREE.Group;
  private activeGlbRig: MappedGlbRig | null = null;
  private glbTopGroup: THREE.Group;
  private glbBottomGroup: THREE.Group;
  private gltfLoader: GLTFLoader;

  // Shared PBR Anatomical Materials (upgraded asynchronously with 4-view baked photo maps!)
  private skinMat: THREE.MeshPhysicalMaterial;
  private torsoMat: THREE.MeshPhysicalMaterial;
  private headMat: THREE.MeshPhysicalMaterial;
  private hairMat: THREE.MeshPhysicalMaterial;
  private bakedTextures: BakedAvatarTextures | null = null;
  private hasBottomGarment = false;

  // Quality, Lighting & Measurement State
  private qualityLevel: GraphicsQualityLevel = 'alto';
  private activeLightPresetId: StudioLightPresetId = 'vestidor_lujo';
  private activeMeasurements: BodyMeasurements = {
    chest: 1,
    shoulders: 1,
    waist: 1,
    height: 1,
  };

  // Camera & Animation State
  private currentYaw = 0;
  private targetYaw = 0;
  private currentPitch = 0.045;
  private targetPitch = 0.045;
  private currentDist = 6.95;
  private targetDist = 6.95;
  private targetY = 1.98;

  private autoSpin = false;
  private animateIdle = false;
  private activePose: PoseJointTargets = NEUTRAL_JOINTS;
  private elapsed = 0;
  private lastTime = performance.now();
  private lastReportedDeg = 0;
  private callbacks: AtelierSceneCallbacks;

  private frameId = 0;
  private isDisposed = false;
  private resizeObserver: ResizeObserver;
  private textureLoader = new THREE.TextureLoader();

  constructor(container: HTMLElement, callbacks: AtelierSceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.gltfLoader = createConfiguredGltfLoader();

    const width = Math.max(200, container.clientWidth);
    const height = Math.max(240, container.clientHeight);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 60);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.03;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvasEl = this.renderer.domElement;
    canvasEl.style.display = 'block';
    canvasEl.style.width = '100%';
    canvasEl.style.height = '100%';
    container.appendChild(canvasEl);

    // Studio IBL environment for brushed-gold glasses, bronze platform & subtle skin/wool specular
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.pmremEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.pmremEnv;
    pmrem.dispose();

    // High-Precision 5-Point Editorial Fashion Studio Lighting Rig
    this.hemiLight = new THREE.HemisphereLight('#ffeed2', '#5d3d22', 0.66);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight('#fff3df', 2.2);
    this.keyLight.position.set(-3.2, 5.2, 4.4);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 1.0;
    this.keyLight.shadow.camera.far = 16;
    this.keyLight.shadow.camera.left = -2.1;
    this.keyLight.shadow.camera.right = 2.1;
    this.keyLight.shadow.camera.top = 4.25;
    this.keyLight.shadow.camera.bottom = -0.35;
    this.keyLight.shadow.bias = -0.00025;
    this.keyLight.shadow.normalBias = 0.014;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight('#ffd382', 1.72);
    this.rimLight.position.set(3.5, 4.1, -3.6);
    this.scene.add(this.rimLight);

    this.bounceLight = new THREE.DirectionalLight('#e8d4b8', 0.54);
    this.bounceLight.position.set(3.2, 1.8, 3.0);
    this.scene.add(this.bounceLight);

    // Subtle softbox chin/cheek fill so eyes behind brushed-gold glasses stay crisp
    this.faceFillLight = new THREE.DirectionalLight('#fff2e0', 0.28);
    this.faceFillLight.position.set(0.4, 1.6, 3.8);
    this.scene.add(this.faceFillLight);

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.buildAtelierStage(maxAniso);

    this.vitruvianFrameGroup = new THREE.Group();
    this.vitruvianLineMat = new THREE.LineBasicMaterial({
      color: '#c28c2f',
      transparent: true,
      opacity: 0.45,
    });
    this.vitruvianRingMat = new THREE.MeshStandardMaterial({
      color: '#d49d3a',
      metalness: 0.85,
      roughness: 0.24,
      envMapIntensity: 0.9,
      transparent: true,
      opacity: 0.68,
    });
    this.buildVitruvianBackdropFrame();
    this.scene.add(this.vitruvianFrameGroup);

    // Immediate fallback anatomical skin/head PBR materials (upgraded in ~40ms with 4-view baked textures!)
    const fallbackSkin = buildHumanSkinTextures(maxAniso);
    const fallbackFace = buildSculptedFaceTexture(maxAniso);

    this.skinMat = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      map: fallbackSkin.albedo,
      normalMap: fallbackSkin.normal,
      normalScale: new THREE.Vector2(0.42, 0.42),
      roughness: 0.58,
      metalness: 0.0,
      clearcoat: 0.06,
      clearcoatRoughness: 0.68,
      sheen: 0.24,
      sheenRoughness: 0.76,
      sheenColor: new THREE.Color('#f0c29e'),
      envMapIntensity: 0.32,
    });

    this.torsoMat = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      map: fallbackSkin.albedo,
      normalMap: fallbackSkin.normal,
      normalScale: new THREE.Vector2(0.48, 0.48),
      roughness: 0.56,
      metalness: 0.0,
      clearcoat: 0.06,
      clearcoatRoughness: 0.66,
      sheen: 0.24,
      sheenRoughness: 0.76,
      sheenColor: new THREE.Color('#f0c29e'),
      envMapIntensity: 0.34,
    });

    this.headMat = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      map: fallbackFace,
      normalMap: fallbackSkin.normal,
      normalScale: new THREE.Vector2(0.32, 0.32),
      roughness: 0.58,
      metalness: 0.0,
      clearcoat: 0.05,
      clearcoatRoughness: 0.72,
      sheen: 0.2,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color('#f0c29e'),
      envMapIntensity: 0.3,
    });

    this.hairMat = new THREE.MeshPhysicalMaterial({
      color: '#1f1713',
      roughness: 0.82,
      metalness: 0.02,
      sheen: 0.36,
      sheenRoughness: 0.64,
      sheenColor: new THREE.Color('#5a4030'),
      envMapIntensity: 0.22,
    });

    // Build Real 20-Bone SkinnedMesh Athletic Male Rig
    this.rig = buildRiggedAthleticHuman({
      skinMat: this.skinMat,
      torsoMat: this.torsoMat,
      headMat: this.headMat,
      hairMat: this.hairMat,
    });
    this.scene.add(this.rig.root);

    // Garment containers (skinned shells inside rig.garmentRoot; rigid details attached directly to bones!)
    this.skinnedGarmentsGroup = new THREE.Group();
    this.skinnedGarmentsGroup.name = 'SkinnedGarmentsContainer';
    this.rig.garmentRoot.add(this.skinnedGarmentsGroup);

    this.spine2DetailGroup = new THREE.Group();
    this.spine2DetailGroup.name = 'Spine2GarmentDetails';
    this.rig.boneMap.spine2.add(this.spine2DetailGroup);

    this.hipsDetailGroup = new THREE.Group();
    this.hipsDetailGroup.name = 'HipsGarmentDetails';
    this.rig.boneMap.hips.add(this.hipsDetailGroup);

    // External .GLB Avatar & Garment Containers
    this.glbAvatarGroup = new THREE.Group();
    this.glbAvatarGroup.name = 'ExternalGlbAvatarSlot';
    this.glbAvatarGroup.visible = false;
    this.scene.add(this.glbAvatarGroup);

    this.glbTopGroup = new THREE.Group();
    this.glbTopGroup.name = 'ExternalGlbTopGarment';
    this.rig.boneMap.spine2.add(this.glbTopGroup);

    this.glbBottomGroup = new THREE.Group();
    this.glbBottomGroup.name = 'ExternalGlbBottomGarment';
    this.rig.boneMap.hips.add(this.glbBottomGroup);

    // Bake 360° photographic PBR maps from /assets/aistudio/image_96c670b6.png asynchronously
    this.hydrateFourViewPhotoTextures(maxAniso);

    // Automatically check if a custom drop-in /models/avatar_fuentes_nazco.glb exists
    this.tryAutoLoadDropInGlb();

    // Apply initial approved luxury lighting, quality tier & neutral pose
    this.setLightPreset('vestidor_lujo');
    this.setQualityLevel(this.isSoftwareGl ? 'medio' : 'alto');
    applyPoseToHumanoidBones(
      this.rig.boneMap,
      this.rig.restQuats,
      this.rig.hipsRestY,
      NEUTRAL_JOINTS,
      0.016,
      0,
      false,
      true
    );
    this.updateCameraTransform();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);

    this.lastTime = performance.now();
    this.tick();
  }

  /**
   * Asynchronously bakes 360° orthographic photo textures from the user's 4-view reference
   * and hot-swaps them cleanly onto head, torso/boxers, limb skin, and curly hair materials.
   */
  private async hydrateFourViewPhotoTextures(maxAniso: number): Promise<void> {
    try {
      const baked = await bakeFourViewAvatarTextures(maxAniso);
      if (this.isDisposed) {
        baked.headAlbedo.dispose();
        baked.headNormal.dispose();
        baked.headRoughness.dispose();
        baked.torsoAlbedo.dispose();
        baked.torsoNormal.dispose();
        baked.torsoBareWithBoxersAlbedo.dispose();
        baked.skinAlbedo.dispose();
        baked.skinNormal.dispose();
        baked.skinRoughness.dispose();
        baked.hairAlbedo.dispose();
        baked.hairBump.dispose();
        return;
      }

      this.bakedTextures = baked;

      // Head photo-projected PBR
      this.headMat.map?.dispose();
      this.headMat.map = baked.headAlbedo;
      this.headMat.normalMap = baked.headNormal;
      this.headMat.normalScale.set(0.45, 0.45);
      this.headMat.roughnessMap = baked.headRoughness;
      this.headMat.roughness = 1.0;
      this.headMat.needsUpdate = true;

      // Torso & Pelvis photo-projected PBR (white boxers when bare, clean skin under trousers)
      this.torsoMat.map = this.hasBottomGarment
        ? baked.torsoAlbedo
        : baked.torsoBareWithBoxersAlbedo;
      this.torsoMat.normalMap = baked.torsoNormal;
      this.torsoMat.normalScale.set(0.65, 0.65);
      this.torsoMat.roughnessMap = baked.skinRoughness;
      this.torsoMat.roughness = 1.0;
      this.torsoMat.needsUpdate = true;

      // Arms, Hands, Legs & Bare Feet matched to exact chest skin RGB from reference
      this.skinMat.map?.dispose();
      this.skinMat.map = baked.skinAlbedo;
      this.skinMat.normalMap?.dispose();
      this.skinMat.normalMap = baked.skinNormal;
      this.skinMat.normalScale.set(0.42, 0.42);
      this.skinMat.roughnessMap = baked.skinRoughness;
      this.skinMat.roughness = 1.0;
      this.skinMat.needsUpdate = true;

      // Curly hair PBR
      this.hairMat.color.set('#ffffff');
      this.hairMat.map = baked.hairAlbedo;
      this.hairMat.bumpMap = baked.hairBump;
      this.hairMat.bumpScale = 0.016;
      this.hairMat.needsUpdate = true;
    } catch {
      // Fallback procedural anatomical textures stay gracefully active if image fails to load
    }
  }

  private async tryAutoLoadDropInGlb(): Promise<void> {
    const exists = await probeDropInGlbAvatar(DEFAULT_GLB_AVATAR_PATH);
    if (!exists || this.isDisposed) return;
    try {
      const report = await this.loadGlbAvatar(DEFAULT_GLB_AVATAR_PATH, 'avatar_fuentes_nazco.glb');
      if (!this.isDisposed) {
        this.callbacks.onAutoGlbLoaded?.(report);
      }
    } catch {
      // Fall back silently to rigged SkinnedMesh avatar
    }
  }

  private setBuiltInBodyVisible(visible: boolean): void {
    this.rig.torsoMesh.visible = visible;
    this.rig.armLMesh.visible = visible;
    this.rig.armRMesh.visible = visible;
    this.rig.handLMesh.visible = visible;
    this.rig.handRMesh.visible = visible;
    this.rig.legLMesh.visible = visible;
    this.rig.legRMesh.visible = visible;
    this.rig.headMesh.visible = visible;
    this.rig.hairMesh.visible = visible;
    this.rig.glassesGroup.visible = visible;
    for (const f of this.rig.bareFeetGroup) f.visible = visible && !this.hasBottomGarment;
    for (const s of this.rig.sneakerGroup) s.visible = visible && this.hasBottomGarment;
  }

  /* ==========================================================================
     REAL .GLB / .GLTF AVATAR & GARMENT LOADER (GLTFLoader + DRACOLoader)
  ========================================================================== */

  public async loadGlbAvatar(url: string, fileName = 'avatar.glb'): Promise<GlbLoadReport> {
    const { rig, report } = await loadRiggedGlbAvatar(this.gltfLoader, url, fileName);
    if (this.isDisposed) {
      disposeObjectTree(rig.root);
      return { fileName, meshCount: 0, boneCount: 0, animationCount: 0 };
    }

    if (this.activeGlbRig?.mixer) {
      this.activeGlbRig.mixer.stopAllAction();
    }
    this.clearGroup(this.glbAvatarGroup);
    this.activeGlbRig = rig;
    this.glbAvatarGroup.add(rig.root);
    this.glbAvatarGroup.visible = true;

    // Hide ONLY the built-in body meshes while keeping the synchronized skeleton & all 960 3D garments active!
    this.setBuiltInBodyVisible(false);

    // Apply current measurements and active pose immediately to the loaded GLB rig
    applyMeasurementsToRig(rig.root, rig.bones, this.activeMeasurements);
    applyPoseToHumanoidBones(
      rig.bones,
      rig.restQuats,
      rig.hipsRestY,
      this.activePose,
      0.016,
      this.elapsed,
      this.animateIdle,
      true
    );

    return report;
  }

  public async loadGlbGarment(
    url: string,
    slot: 'top' | 'bottom',
    fileName = 'prenda.glb'
  ): Promise<GlbLoadReport> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          if (this.isDisposed) {
            disposeObjectTree(gltf.scene);
            resolve({ fileName, meshCount: 0, boneCount: 0, animationCount: 0 });
            return;
          }
          const targetGroup = slot === 'top' ? this.glbTopGroup : this.glbBottomGroup;
          this.clearGroup(targetGroup);

          const garmentScene = gltf.scene;
          const box = new THREE.Box3().setFromObject(garmentScene);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const desiredHeight = slot === 'top' ? 1.24 : 1.76;
          const scale = size.y > 0.001 ? desiredHeight / size.y : 1;
          garmentScene.scale.setScalar(scale);
          // Spine2 bone sits at world y = 2.74; Hips bone sits at world y = 1.94
          const localBottomY = slot === 'top' ? 1.92 - 2.74 : 0.24 - 1.94;
          garmentScene.position.set(
            -center.x * scale,
            localBottomY - box.min.y * scale,
            -center.z * scale
          );

          let meshCount = 0;
          let boneCount = 0;
          garmentScene.traverse((child) => {
            if ((child as THREE.Bone).isBone) boneCount++;
            if ((child as THREE.Mesh).isMesh) {
              meshCount++;
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
          });

          targetGroup.add(garmentScene);
          resolve({
            fileName,
            meshCount,
            boneCount,
            animationCount: gltf.animations?.length ?? 0,
          });
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  public clearGlbGarment(slot?: 'top' | 'bottom'): void {
    if (!slot || slot === 'top') this.clearGroup(this.glbTopGroup);
    if (!slot || slot === 'bottom') this.clearGroup(this.glbBottomGroup);
  }

  public resetToSculptedMannequin(): void {
    if (this.activeGlbRig?.mixer) {
      this.activeGlbRig.mixer.stopAllAction();
    }
    this.activeGlbRig = null;
    this.clearGroup(this.glbAvatarGroup);
    this.glbAvatarGroup.visible = false;
    this.setBuiltInBodyVisible(true);
  }

  /* ==========================================================================
     QUALITY TIERS & LIVE ANATOMICAL MEASUREMENTS
  ========================================================================== */

  public setQualityLevel(level: GraphicsQualityLevel): void {
    this.qualityLevel = level;
    const dprCap = level === 'medio' ? 1 : level === 'alto' ? 1.5 : 2;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, dprCap)
    );

    const shadowsOn = !this.isSoftwareGl && level !== 'medio';
    this.renderer.shadowMap.enabled = shadowsOn;
    this.keyLight.castShadow = shadowsOn;

    if (shadowsOn) {
      const mapDim = level === 'ultra' ? 2048 : 1024;
      if (this.keyLight.shadow.mapSize.x !== mapDim) {
        this.keyLight.shadow.mapSize.set(mapDim, mapDim);
        this.keyLight.shadow.map?.dispose();
        this.keyLight.shadow.map = null;
      }
    }
    this.handleResize();
  }

  public getQualityLevel(): GraphicsQualityLevel {
    return this.qualityLevel;
  }

  public setBodyMeasurements(m: BodyMeasurements): void {
    this.activeMeasurements = { ...m };
    applyMeasurementsToRig(this.rig.root, this.rig.boneMap, m);
    if (this.activeGlbRig) {
      applyMeasurementsToRig(this.activeGlbRig.root, this.activeGlbRig.bones, m);
    }
  }

  /* ==========================================================================
     APPROVED ILLUMINATED CIRCULAR LUXURY TURNTABLE PLATFORM (UNCHANGED)
  ========================================================================== */

  private buildAtelierStage(maxAniso: number): void {
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.24 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const pedestalGroup = new THREE.Group();

    const brushedBronzeMat = new THREE.MeshStandardMaterial({
      color: '#7a5832',
      metalness: 0.72,
      roughness: 0.34,
      envMapIntensity: 0.88,
    });
    const champagneDeckMat = new THREE.MeshStandardMaterial({
      color: '#d4b487',
      metalness: 0.45,
      roughness: 0.36,
      envMapIntensity: 0.75,
    });
    const illuminatedGoldHaloMat = new THREE.MeshStandardMaterial({
      color: '#ffe5a3',
      emissive: new THREE.Color('#f7be54'),
      emissiveIntensity: 1.05,
      metalness: 0.35,
      roughness: 0.2,
    });

    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(1.32, 1.36, 0.135, 80),
      brushedBronzeMat
    );
    drum.position.y = 0.072;
    drum.receiveShadow = true;
    drum.castShadow = true;
    pedestalGroup.add(drum);

    const bottomGlowRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.365, 0.015, 12, 88),
      illuminatedGoldHaloMat
    );
    bottomGlowRim.rotation.x = Math.PI / 2;
    bottomGlowRim.position.y = 0.012;
    pedestalGroup.add(bottomGlowRim);

    const topGlowRim = new THREE.Mesh(
      new THREE.TorusGeometry(1.315, 0.016, 12, 88),
      illuminatedGoldHaloMat
    );
    topGlowRim.rotation.x = Math.PI / 2;
    topGlowRim.position.y = 0.142;
    pedestalGroup.add(topGlowRim);

    const compassTex = createPedestalCompassTexture(maxAniso);
    const topDisc = new THREE.Mesh(new THREE.CircleGeometry(1.305, 80), champagneDeckMat);
    topDisc.rotation.x = -Math.PI / 2;
    topDisc.position.y = 0.143;
    topDisc.receiveShadow = true;
    pedestalGroup.add(topDisc);

    const innerMedallion = new THREE.Mesh(
      new THREE.CircleGeometry(1.06, 72),
      new THREE.MeshStandardMaterial({
        map: compassTex,
        roughness: 0.42,
        metalness: 0.32,
        transparent: true,
        opacity: 0.35,
        envMapIntensity: 0.55,
      })
    );
    innerMedallion.rotation.x = -Math.PI / 2;
    innerMedallion.position.y = 0.1445;
    innerMedallion.receiveShadow = true;
    pedestalGroup.add(innerMedallion);

    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 1.08),
      new THREE.MeshBasicMaterial({
        map: createContactShadowTexture(),
        transparent: true,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.146;
    pedestalGroup.add(contactShadow);

    this.scene.add(pedestalGroup);
  }

  private buildVitruvianBackdropFrame(): void {
    const zBack = -0.82;
    const centerY = 2.02;
    const outerRadius = 1.92;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(outerRadius, 0.011, 10, 96),
      this.vitruvianRingMat
    );
    ring.position.set(0, centerY, zBack);
    this.vitruvianFrameGroup.add(ring);

    const sqHalf = 1.56;
    const sqPts = [
      new THREE.Vector3(-sqHalf, centerY - sqHalf + 0.14, zBack),
      new THREE.Vector3(sqHalf, centerY - sqHalf + 0.14, zBack),
      new THREE.Vector3(sqHalf, centerY + sqHalf + 0.14, zBack),
      new THREE.Vector3(-sqHalf, centerY + sqHalf + 0.14, zBack),
      new THREE.Vector3(-sqHalf, centerY - sqHalf + 0.14, zBack),
    ];
    this.vitruvianFrameGroup.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(sqPts), this.vitruvianLineMat)
    );

    const gridYs = [0.95, 1.52, 2.02, 2.6, 3.12];
    for (const gy of gridYs) {
      const pts = [new THREE.Vector3(-sqHalf, gy, zBack), new THREE.Vector3(sqHalf, gy, zBack)];
      this.vitruvianFrameGroup.add(
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.vitruvianLineMat)
      );
    }
  }

  /* ==========================================================================
     SKINNED 3D CROCHET GARMENT UPDATE PIPELINE
  ========================================================================== */

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      disposeObjectTree(child);
    }
  }

  public updateGarments(
    top: DressingRoomGarment | null,
    bottom: DressingRoomGarment | null,
    showClothing: boolean,
    knitRelief: boolean,
    overrideTopPalette?: string[] | null,
    overrideBottomPalette?: string[] | null
  ): void {
    this.clearGroup(this.skinnedGarmentsGroup);
    this.clearGroup(this.spine2DetailGroup);
    this.clearGroup(this.hipsDetailGroup);

    const hasBottom = Boolean(showClothing && bottom);
    this.hasBottomGarment = hasBottom;

    // Toggle white boxers texture vs clean skin beneath waistband
    if (this.bakedTextures) {
      this.torsoMat.map = hasBottom
        ? this.bakedTextures.torsoAlbedo
        : this.bakedTextures.torsoBareWithBoxersAlbedo;
      this.torsoMat.needsUpdate = true;
    }

    let showSneakers = false;

    if (showClothing) {
      const maxAniso =
        this.qualityLevel === 'medio'
          ? 2
          : this.qualityLevel === 'alto'
            ? Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
            : this.renderer.capabilities.getMaxAnisotropy();

      const ctx: GarmentBuildContext = {
        rig: this.rig,
        skinnedContainer: this.skinnedGarmentsGroup,
        spine2DetailGroup: this.spine2DetailGroup,
        hipsDetailGroup: this.hipsDetailGroup,
        knitRelief,
        maxAnisotropy: maxAniso,
        textureLoader: this.textureLoader,
        isDisposed: () => this.isDisposed,
      };

      if (top) {
        const tintedTop =
          overrideTopPalette && overrideTopPalette.length > 0
            ? { ...top, palette: overrideTopPalette }
            : top;
        buildSkinnedTopGarment(ctx, tintedTop);
      }
      if (bottom) {
        const tintedBottom =
          overrideBottomPalette && overrideBottomPalette.length > 0
            ? { ...bottom, palette: overrideBottomPalette }
            : bottom;
        const res = buildSkinnedBottomGarment(ctx, tintedBottom);
        showSneakers = res.isLongTrouser;
      }
    }

    // Barefoot when undressed or in shorts (matching 4-view reference); studio sneakers with long trousers!
    const builtInVisible = !this.activeGlbRig;
    for (const f of this.rig.bareFeetGroup) f.visible = builtInVisible && !showSneakers;
    for (const s of this.rig.sneakerGroup) s.visible = builtInVisible && showSneakers;
  }

  /* ==========================================================================
     INTERACTIVE CONTROLS, LIGHTING, CAMERA & POSE ANIMATION LOOP
  ========================================================================== */

  public setLightPreset(presetId: StudioLightPresetId): void {
    this.activeLightPresetId = presetId;
    const p = STUDIO_LIGHT_PRESETS[presetId] || STUDIO_LIGHT_PRESETS.vestidor_lujo;
    this.scene.background = p.bgHex ? new THREE.Color(p.bgHex) : null;
    this.scene.fog = p.fogHex ? new THREE.Fog(p.fogHex, 13, 28) : null;
    this.keyLight.color.set(p.keyColor);
    this.keyLight.intensity = p.keyIntensity;
    this.hemiLight.color.set(p.fillSky);
    this.hemiLight.groundColor.set(p.fillGround);
    this.hemiLight.intensity = p.fillIntensity;
    this.rimLight.color.set(p.rimColor);
    this.rimLight.intensity = p.rimIntensity;
    this.bounceLight.intensity = p.bounceIntensity;
    this.renderer.toneMappingExposure = p.exposure;
    this.vitruvianFrameGroup.visible = p.showVitruvianFrame;
    this.vitruvianRingMat.opacity = p.ringOpacity;
  }

  public setPose(poseIndex: number, alignYaw = false): void {
    const pose = ATELIER_POSES[poseIndex] || ATELIER_POSES[0];
    this.activePose = pose.joints;
    if (alignYaw && pose.recommendedYaw !== undefined) {
      this.setTargetYaw(pose.recommendedYaw);
    }
  }

  public setGlassesVisible(visible: boolean): void {
    this.rig.glassesGroup.visible = visible && !this.activeGlbRig;
  }

  public setAutoSpin(enabled: boolean): void {
    this.autoSpin = enabled;
  }

  public setAnimateIdle(enabled: boolean): void {
    this.animateIdle = enabled;
  }

  public orbitBy(deltaYaw: number, deltaPitch = 0): void {
    this.targetYaw += deltaYaw;
    this.targetPitch = THREE.MathUtils.clamp(this.targetPitch + deltaPitch, -0.38, 0.44);
  }

  public setTargetYaw(rad: number): void {
    const curNorm = ((this.targetYaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const dstNorm = ((rad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let diff = dstNorm - curNorm;
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    this.targetYaw += diff;
  }

  public zoomBy(delta: number): void {
    this.targetDist = THREE.MathUtils.clamp(this.targetDist + delta, 3.8, 10.2);
  }

  public resetCamera(): void {
    this.setTargetYaw(0);
    this.targetPitch = 0.045;
    this.targetDist = 6.95;
  }

  public captureSnapshotDataUrl(): string | null {
    if (this.isDisposed) return null;
    this.renderer.render(this.scene, this.camera);
    const glCanvas = this.renderer.domElement;

    if (this.activeLightPresetId === 'vestidor_lujo') {
      const out = document.createElement('canvas');
      out.width = glCanvas.width;
      out.height = glCanvas.height;
      const ctx = out.getContext('2d');
      if (ctx) {
        const g = ctx.createRadialGradient(
          out.width * 0.5,
          out.height * 0.42,
          out.width * 0.06,
          out.width * 0.5,
          out.height * 0.5,
          out.width * 0.72
        );
        g.addColorStop(0, '#9c7d5e');
        g.addColorStop(0.55, '#594230');
        g.addColorStop(1, '#281a11');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(glCanvas, 0, 0);
        return out.toDataURL('image/png');
      }
    }
    return glCanvas.toDataURL('image/png');
  }

  private updateCameraTransform(): void {
    const horiz = Math.cos(this.currentPitch) * this.currentDist;
    const camX = Math.sin(this.currentYaw) * horiz;
    const camY = this.targetY + Math.sin(this.currentPitch) * this.currentDist;
    const camZ = Math.cos(this.currentYaw) * horiz;
    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(0, this.targetY, 0);
  }

  private handleResize(): void {
    if (this.isDisposed) return;
    const width = Math.max(180, this.container.clientWidth);
    const height = Math.max(220, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private afterDrawSoftware(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (status === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.isDisposed) return;

    const now = performance.now();
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;

    if (!document.hidden) {
      this.elapsed += dt;

      if (this.autoSpin) {
        this.targetYaw += dt * 0.58;
      }

      const camLambda = this.isSoftwareGl ? 14 : 9;
      this.currentYaw = THREE.MathUtils.damp(this.currentYaw, this.targetYaw, camLambda, dt);
      this.currentPitch = THREE.MathUtils.damp(this.currentPitch, this.targetPitch, camLambda, dt);
      this.currentDist = THREE.MathUtils.damp(this.currentDist, this.targetDist, camLambda, dt);
      this.updateCameraTransform();

      const deg = ((Math.round(THREE.MathUtils.radToDeg(this.currentYaw)) % 360) + 360) % 360;
      if (deg !== this.lastReportedDeg) {
        this.lastReportedDeg = deg;
        this.callbacks.onYawChange?.(deg);
      }

      // Drive the 20-bone SkinnedMesh rig (drives both built-in avatar AND all 3D skinned crochet garments!)
      applyPoseToHumanoidBones(
        this.rig.boneMap,
        this.rig.restQuats,
        this.rig.hipsRestY,
        this.activePose,
        dt,
        this.elapsed,
        this.animateIdle
      );

      // Drive any loaded external .glb humanoid rig in sync
      if (this.activeGlbRig) {
        if (this.activeGlbRig.mixer && this.animateIdle) {
          this.activeGlbRig.mixer.update(dt);
        } else {
          applyPoseToHumanoidBones(
            this.activeGlbRig.bones,
            this.activeGlbRig.restQuats,
            this.activeGlbRig.hipsRestY,
            this.activePose,
            dt,
            this.elapsed,
            this.animateIdle
          );
        }
      }

      this.renderer.render(this.scene, this.camera);
    }

    if (this.isSoftwareGl) {
      this.afterDrawSoftware(this.tick);
    } else {
      this.frameId = window.requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.isDisposed = true;
    window.cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    if (this.activeGlbRig?.mixer) {
      this.activeGlbRig.mixer.stopAllAction();
    }
    if (this.bakedTextures) {
      this.bakedTextures.headAlbedo.dispose();
      this.bakedTextures.headNormal.dispose();
      this.bakedTextures.headRoughness.dispose();
      this.bakedTextures.torsoAlbedo.dispose();
      this.bakedTextures.torsoNormal.dispose();
      this.bakedTextures.torsoBareWithBoxersAlbedo.dispose();
      this.bakedTextures.skinAlbedo.dispose();
      this.bakedTextures.skinNormal.dispose();
      this.bakedTextures.skinRoughness.dispose();
      this.bakedTextures.hairAlbedo.dispose();
      this.bakedTextures.hairBump.dispose();
      this.bakedTextures = null;
    }
    disposeObjectTree(this.scene);
    this.pmremEnv.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
