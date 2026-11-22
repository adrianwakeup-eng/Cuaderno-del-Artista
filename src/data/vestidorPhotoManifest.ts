import type { DressingRoomGarment } from '../types/crochet';

/* ============================================================================
   EL VESTIDOR DORADO — MANIFIESTO FOTOGRÁFICO 2.5D
   Arquitectura basada en fotografías reales de alta resolución (sin geometría
   3D para reconstruir el cuerpo), preparada para 4, 8, 12 o 24+ vistas.
============================================================================ */

export type PhotoPoseId =
  | 'natural'
  | 'manos-bolsillos'
  | 'brazos-cruzados'
  | 'perfil-moda'
  | 'sentado'
  | 'caminando'
  | 'mirando-lado';

export interface PhotoAngleFrame {
  id: string;
  angleDeg: number;
  label: string;
  src: string;
}

export interface PhotoPoseDefinition {
  id: PhotoPoseId;
  code: string;
  title: string;
  subtitle: string;
  recommendedAngleDeg: number;
}

export interface OutfitPoseTrack {
  available: boolean;
  frames: PhotoAngleFrame[];
}

export interface OutfitColorVariant {
  id: string;
  label: string;
  palette: string[];
}

export interface OutfitPhotoManifest {
  id: string;
  name: string;
  collection: string;
  garments: {
    topId: string | null;
    bottomId: string | null;
  };
  thumbnails: {
    top?: string;
    bottom?: string;
  };
  colors: {
    defaultColorId: string;
    available: OutfitColorVariant[];
  };
  canvas: {
    width: number;
    height: number;
    headTopY: number;
    feetBaselineY: number;
  };
  supportedAngles: number;
  poses: Record<PhotoPoseId, OutfitPoseTrack>;
}

export interface OfficialModelManifest {
  id: string;
  name: string;
  description: string;
  canvas: {
    width: number;
    height: number;
    headTopY: number;
    feetBaselineY: number;
  };
  supportedAngles: number;
  supportsMultiAngleSequences: number[];
  poses: Partial<Record<PhotoPoseId, OutfitPoseTrack>>;
}

export interface VestidorManifestBundle {
  model: OfficialModelManifest;
  poses: PhotoPoseDefinition[];
  outfits: OutfitPhotoManifest[];
}

export type FittingResolutionStatus =
  | 'matched'
  | 'base-model'
  | 'missing-combination'
  | 'missing-angle'
  | 'missing-pose'
  | 'missing-color'
  | 'custom-photo';

export interface ResolvedFittingView {
  mode: 'outfit' | 'base-model' | 'custom-photo';
  status: FittingResolutionStatus;
  activeFrame: PhotoAngleFrame;
  availableFrames: PhotoAngleFrame[];
  resolvedAngleDeg: number;
  supports360: boolean;
  outfitId: string | null;
  outfitName: string;
  poseId: PhotoPoseId;
  poseTitle: string;
  noticeTitle: string | null;
  noticeMessage: string | null;
  canRestoreFlagship: boolean;
  canEditGarment?: boolean;
}

export const FLAGSHIP_TOP_ID = 'cardigan-girasoles-crema';
export const FLAGSHIP_BOTTOM_ID = 'shorts-crochet-verde-bosque';
export const FLAGSHIP_OUTFIT_ID = 'cardigan-girasoles-shorts-verdes';

export const VESTIDOR_MANIFEST_PATHS = {
  model: '/vestidor/modelo-oficial/manifest.json',
  poses: '/vestidor/poses/manifest.json',
  outfits: ['/vestidor/conjuntos/cardigan-girasoles-shorts-verdes/manifest.json'],
} as const;

export const PHOTO_POSES: PhotoPoseDefinition[] = [
  {
    id: 'natural',
    code: '01',
    title: 'Natural',
    subtitle: 'Postura erguida de estudio con rotación real de 4 vistas (0°, 90°, 180°, 270°)',
    recommendedAngleDeg: 0,
  },
  {
    id: 'manos-bolsillos',
    code: '02',
    title: 'Manos en los bolsillos',
    subtitle: 'Pose editorial relajada con fotografía frontal real',
    recommendedAngleDeg: 0,
  },
  {
    id: 'brazos-cruzados',
    code: '03',
    title: 'Brazos cruzados',
    subtitle: 'Porte de estudio — pendiente de sesión fotográfica',
    recommendedAngleDeg: 0,
  },
  {
    id: 'perfil-moda',
    code: '04',
    title: 'Perfil de moda',
    subtitle: 'Silueta lateral fotográfica real (90° y 270°)',
    recommendedAngleDeg: 90,
  },
  {
    id: 'sentado',
    code: '05',
    title: 'Sentado',
    subtitle: 'Retrato editorial sentado — pendiente de sesión fotográfica',
    recommendedAngleDeg: 0,
  },
  {
    id: 'caminando',
    code: '06',
    title: 'Caminando',
    subtitle: 'Movimiento de pasarela — pendiente de sesión fotográfica',
    recommendedAngleDeg: 0,
  },
  {
    id: 'mirando-lado',
    code: '07',
    title: 'Mirando hacia un lado',
    subtitle: 'Giro sutil de rostro y hombros — pendiente de sesión fotográfica',
    recommendedAngleDeg: 0,
  },
];

export const OFFICIAL_MODEL_MANIFEST: OfficialModelManifest = {
  id: 'modelo-oficial',
  name: 'Modelo Oficial Fuentes Nazco',
  description:
    'Referencia fotográfica oficial de cuatro vistas (Frente, Perfil Izquierdo, Espalda, Perfil Derecho) conservando rostro, gafas, cabello rizado, barba y proporciones anatómicas originales.',
  canvas: {
    width: 640,
    height: 1080,
    headTopY: 48,
    feetBaselineY: 1036,
  },
  supportedAngles: 4,
  supportsMultiAngleSequences: [4, 8, 12, 24],
  poses: {
    natural: {
      available: true,
      frames: [
        {
          id: 'frente',
          angleDeg: 0,
          label: 'Frente (0°)',
          src: '/vestidor/modelo-oficial/frente.png',
        },
        {
          id: 'perfil-izquierdo',
          angleDeg: 90,
          label: 'Perfil Izquierdo (90°)',
          src: '/vestidor/modelo-oficial/perfil-izquierdo.png',
        },
        {
          id: 'espalda',
          angleDeg: 180,
          label: 'Espalda (180°)',
          src: '/vestidor/modelo-oficial/espalda.png',
        },
        {
          id: 'perfil-derecho',
          angleDeg: 270,
          label: 'Perfil Derecho (270°)',
          src: '/vestidor/modelo-oficial/perfil-derecho.png',
        },
      ],
    },
    'perfil-moda': {
      available: true,
      frames: [
        {
          id: 'perfil-izquierdo',
          angleDeg: 90,
          label: 'Perfil Izquierdo (90°)',
          src: '/vestidor/modelo-oficial/perfil-izquierdo.png',
        },
        {
          id: 'perfil-derecho',
          angleDeg: 270,
          label: 'Perfil Derecho (270°)',
          src: '/vestidor/modelo-oficial/perfil-derecho.png',
        },
      ],
    },
  },
};

export const OUTFIT_PHOTO_MANIFESTS: OutfitPhotoManifest[] = [
  {
    id: FLAGSHIP_OUTFIT_ID,
    name: 'Cárdigan Crochet Girasoles Crema + Shorts Verde Bosque',
    collection: 'Colección Crochet Fuentes Nazco',
    garments: {
      topId: FLAGSHIP_TOP_ID,
      bottomId: FLAGSHIP_BOTTOM_ID,
    },
    thumbnails: {
      top: '/vestidor/conjuntos/cardigan-girasoles-shorts-verdes/thumb-cardigan.jpg',
      bottom: '/vestidor/conjuntos/cardigan-girasoles-shorts-verdes/thumb-shorts.jpg',
    },
    colors: {
      defaultColorId: 'original',
      available: [
        {
          id: 'original',
          label: 'Crema Girasol y Verde Bosque',
          palette: ['#F2E2C4', '#235A2A', '#F0B41C'],
        },
      ],
    },
    canvas: {
      width: 720,
      height: 1080,
      headTopY: 48,
      feetBaselineY: 1044,
    },
    supportedAngles: 4,
    poses: {
      natural: {
        available: true,
        frames: [
          {
            id: 'frente',
            angleDeg: 0,
            label: 'Frente (0°)',
            src: '/vestidor/conjuntos/cardigan-girasoles-shorts-verdes/frente.png',
          },
          {
            id: 'perfil-izquierdo',
            angleDeg: 90,
            label: 'Perfil Izquierdo (90°)',
            src: '/vestidor/conjuntos/cardigan-girasoles-shorts-verdes/perfil-izquierdo.png',
          },
          {
            id: 'espalda',
            angleDeg: 180,
            label: 'Espalda (180°)',
            src: '/vestidor/conjuntos/cardigan-girasoles-shorts-verdes/espalda.png',
          },
          {
            id: 'perfil-derecho',
            angleDeg: 270,
            label: 'Perfil Derecho (270°)',
            src: '/vestidor/conjuntos/cardigan-girasoles-shorts-verdes/perfil-derecho.png',
          },
        ],
      },
      'manos-bolsillos': {
        available: true,
        frames: [
          {
            id: 'frente',
            angleDeg: 0,
            label: 'Frente · Manos en los bolsillos (0°)',
            src: '/vestidor/poses/cardigan-girasoles-shorts-verdes/manos-en-bolsillos.png',
          },
        ],
      },
      'perfil-moda': {
        available: true,
        frames: [
          {
            id: 'perfil-izquierdo',
            angleDeg: 90,
            label: 'Perfil de Moda Izquierdo (90°)',
            src: '/vestidor/conjuntos/cardigan-girasoles-shorts-verdes/perfil-izquierdo.png',
          },
          {
            id: 'perfil-derecho',
            angleDeg: 270,
            label: 'Perfil de Moda Derecho (270°)',
            src: '/vestidor/conjuntos/cardigan-girasoles-shorts-verdes/perfil-derecho.png',
          },
        ],
      },
      'brazos-cruzados': { available: false, frames: [] },
      sentado: { available: false, frames: [] },
      caminando: { available: false, frames: [] },
      'mirando-lado': { available: false, frames: [] },
    },
  },
];

export function normalizeAngleDeg(deg: number): number {
  const mod = deg % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * Maps viewer yaw radians (where -PI/2 is Left Profile 90°, PI is Back 180°, +PI/2 is Right Profile 270°)
 * to canonical manifest angle degrees [0, 360).
 */
export function yawRadToManifestDeg(yawRad: number): number {
  return normalizeAngleDeg((-yawRad * 180) / Math.PI);
}

/**
 * Picks the closest real photograph in a sorted multi-angle sequence (supports 4, 8, 12, 24+ views).
 */
export function selectClosestAngleFrame(
  frames: PhotoAngleFrame[],
  targetAngleDeg: number
): PhotoAngleFrame {
  const norm = normalizeAngleDeg(targetAngleDeg);
  let best = frames[0];
  let bestDist = Infinity;

  for (const frame of frames) {
    const fDeg = normalizeAngleDeg(frame.angleDeg);
    const rawDiff = Math.abs(fDeg - norm);
    const circDist = Math.min(rawDiff, 360 - rawDiff);
    if (circDist < bestDist) {
      bestDist = circDist;
      best = frame;
    }
  }
  return best;
}

export function getPoseDefinitionByIndex(
  poseIndex: number,
  poses: PhotoPoseDefinition[] = PHOTO_POSES
): PhotoPoseDefinition {
  if (!poses.length) return PHOTO_POSES[0];
  const idx = ((poseIndex % poses.length) + poses.length) % poses.length;
  return poses[idx];
}

function buildUserModelFrames(garment: DressingRoomGarment | null): PhotoAngleFrame[] {
  if (!garment?.modelViews) return [];
  const frames: PhotoAngleFrame[] = [];
  if (garment.modelViews.front) {
    frames.push({
      id: `${garment.id}-frente`,
      angleDeg: 0,
      label: 'Frente (0°)',
      src: garment.modelViews.front,
    });
  }
  if (garment.modelViews.profileLeft) {
    frames.push({
      id: `${garment.id}-perfil-izq`,
      angleDeg: 90,
      label: 'Perfil Izquierdo (90°)',
      src: garment.modelViews.profileLeft,
    });
  }
  if (garment.modelViews.back) {
    frames.push({
      id: `${garment.id}-espalda`,
      angleDeg: 180,
      label: 'Espalda (180°)',
      src: garment.modelViews.back,
    });
  }
  if (garment.modelViews.profileRight) {
    frames.push({
      id: `${garment.id}-perfil-der`,
      angleDeg: 270,
      label: 'Perfil Derecho (270°)',
      src: garment.modelViews.profileRight,
    });
  }
  return frames;
}

function getAngleNameLabel(deg: number): string {
  const a = normalizeAngleDeg(deg);
  if (a < 45 || a >= 315) return 'Frente (0°)';
  if (a >= 45 && a < 135) return 'Perfil Izquierdo (90°)';
  if (a >= 135 && a < 225) return 'Espalda (180°)';
  return 'Perfil Derecho (270°)';
}

function circularAngleDistance(a: number, b: number): number {
  const raw = Math.abs(normalizeAngleDeg(a) - normalizeAngleDeg(b));
  return Math.min(raw, 360 - raw);
}

export function isPosePhotographedForSelection(
  poseId: PhotoPoseId,
  selectedTop: DressingRoomGarment | null,
  selectedBottom: DressingRoomGarment | null,
  showClothing: boolean,
  bundle: VestidorManifestBundle
): { available: boolean; frameCount: number } {
  if (!showClothing || (!selectedTop && !selectedBottom)) {
    const track = bundle.model.poses[poseId];
    return {
      available: Boolean(track?.available && track.frames.length > 0),
      frameCount: track?.frames.length ?? 0,
    };
  }

  // Check user-uploaded modelViews on active garment
  const primaryGarment = selectedTop ?? selectedBottom;
  const userFrames = buildUserModelFrames(primaryGarment);
  if (userFrames.length > 0) {
    if (poseId === 'natural') {
      return { available: true, frameCount: userFrames.length };
    }
    if (poseId === 'perfil-moda') {
      const sideFrames = userFrames.filter((f) => f.angleDeg === 90 || f.angleDeg === 270);
      return { available: sideFrames.length > 0, frameCount: sideFrames.length };
    }
    return { available: false, frameCount: 0 };
  }

  const matched = bundle.outfits.find(
    (o) =>
      o.garments.topId === (selectedTop?.id ?? null) &&
      o.garments.bottomId === (selectedBottom?.id ?? null)
  );
  if (!matched) {
    return { available: false, frameCount: 0 };
  }
  const track = matched.poses[poseId];
  return {
    available: Boolean(track?.available && track.frames.length > 0),
    frameCount: track?.frames.length ?? 0,
  };
}

export function isGarmentPartOfPhotographedOutfit(
  garmentId: string,
  outfits: OutfitPhotoManifest[] = OUTFIT_PHOTO_MANIFESTS
): boolean {
  return outfits.some(
    (o) => o.garments.topId === garmentId || o.garments.bottomId === garmentId
  );
}

/**
 * Resolves the exact real photograph to render for the current outfit, color, pose, and angle.
 * Strictly honest: NEVER invents or warps missing outfits, colorways, or back views.
 */
export function resolveFittingView(params: {
  selectedTop: DressingRoomGarment | null;
  selectedBottom: DressingRoomGarment | null;
  overrideTopPalette?: string[] | null;
  overrideBottomPalette?: string[] | null;
  showClothing: boolean;
  poseIndex: number;
  angleDeg: number;
  customPhotoUrl?: string | null;
  customPhotoLabel?: string | null;
  bundle?: VestidorManifestBundle;
}): ResolvedFittingView {
  const bundle: VestidorManifestBundle = params.bundle ?? {
    model: OFFICIAL_MODEL_MANIFEST,
    poses: PHOTO_POSES,
    outfits: OUTFIT_PHOTO_MANIFESTS,
  };

  const poseDef = getPoseDefinitionByIndex(params.poseIndex, bundle.poses);
  const baseNaturalFrames = bundle.model.poses.natural?.frames ?? OFFICIAL_MODEL_MANIFEST.poses.natural!.frames;

  // Optional custom studio photograph uploaded by user in Settings
  if (params.customPhotoUrl) {
    const customFrame: PhotoAngleFrame = {
      id: 'custom-photo',
      angleDeg: 0,
      label: params.customPhotoLabel || 'Fotografía personalizada (0°)',
      src: params.customPhotoUrl,
    };
    return {
      mode: 'custom-photo',
      status: 'custom-photo',
      activeFrame: customFrame,
      availableFrames: [customFrame],
      resolvedAngleDeg: 0,
      supports360: false,
      outfitId: 'custom-photo',
      outfitName: params.customPhotoLabel || 'Fotografía cargada por el usuario',
      poseId: poseDef.id,
      poseTitle: poseDef.title,
      noticeTitle: null,
      noticeMessage: null,
      canRestoreFlagship: false,
    };
  }

  // Case 1: Official base model (Sin ropa / sin prendas seleccionadas)
  if (!params.showClothing || (!params.selectedTop && !params.selectedBottom)) {
    const modelTrack = bundle.model.poses[poseDef.id];
    if (modelTrack?.available && modelTrack.frames.length > 0) {
      const activeFrame = selectClosestAngleFrame(modelTrack.frames, params.angleDeg);
      return {
        mode: 'base-model',
        status: 'base-model',
        activeFrame,
        availableFrames: modelTrack.frames,
        resolvedAngleDeg: activeFrame.angleDeg,
        supports360: modelTrack.frames.length >= 3,
        outfitId: null,
        outfitName: bundle.model.name,
        poseId: poseDef.id,
        poseTitle: poseDef.title,
        noticeTitle: null,
        noticeMessage: null,
        canRestoreFlagship: false,
      };
    }

    const fallbackFrame = selectClosestAngleFrame(baseNaturalFrames, params.angleDeg);
    return {
      mode: 'base-model',
      status: 'missing-pose',
      activeFrame: fallbackFrame,
      availableFrames: baseNaturalFrames,
      resolvedAngleDeg: fallbackFrame.angleDeg,
      supports360: baseNaturalFrames.length >= 3,
      outfitId: null,
      outfitName: bundle.model.name,
      poseId: poseDef.id,
      poseTitle: poseDef.title,
      noticeTitle: `Pose «${poseDef.title}» no disponible aún`,
      noticeMessage:
        'Todavía no existe una sesión fotográfica de esta pose para el modelo base. Mostrando la vista Natural oficial.',
      canRestoreFlagship: false,
    };
  }

  const hasCustomColorOverride = Boolean(
    (params.overrideTopPalette && params.overrideTopPalette.length > 0) ||
      (params.overrideBottomPalette && params.overrideBottomPalette.length > 0)
  );

  // Case 2A: User-created garments with real uploaded modelViews
  const topUserFrames = buildUserModelFrames(params.selectedTop);
  const bottomUserFrames = buildUserModelFrames(params.selectedBottom);

  if (topUserFrames.length > 0 || bottomUserFrames.length > 0) {
    const bothSelected = Boolean(params.selectedTop && params.selectedBottom);
    const activeGarment =
      topUserFrames.length > 0 ? params.selectedTop! : params.selectedBottom!;
    const activeFrames = topUserFrames.length > 0 ? topUserFrames : bottomUserFrames;
    const selectedLabel = [params.selectedTop?.name, params.selectedBottom?.name]
      .filter(Boolean)
      .join(' + ');

    // Pose check for user-uploaded modelViews
    if (poseDef.id !== 'natural') {
      const sideFrames = activeFrames.filter((f) => f.angleDeg === 90 || f.angleDeg === 270);
      if (poseDef.id === 'perfil-moda' && sideFrames.length > 0) {
        const frame = selectClosestAngleFrame(sideFrames, params.angleDeg);
        return {
          mode: 'outfit',
          status: hasCustomColorOverride ? 'missing-color' : 'matched',
          activeFrame: frame,
          availableFrames: sideFrames,
          resolvedAngleDeg: frame.angleDeg,
          supports360: false,
          outfitId: activeGarment.id,
          outfitName: selectedLabel,
          poseId: poseDef.id,
          poseTitle: poseDef.title,
          noticeTitle: hasCustomColorOverride ? 'Variante de color aún no fotografiada' : null,
          noticeMessage: hasCustomColorOverride
            ? 'El visor muestra la fotografía real original del diseño sin teñirla artificialmente.'
            : null,
          canRestoreFlagship: false,
          canEditGarment: true,
        };
      }

      const fallbackFrame = selectClosestAngleFrame(activeFrames, params.angleDeg);
      return {
        mode: 'outfit',
        status: 'missing-pose',
        activeFrame: fallbackFrame,
        availableFrames: activeFrames,
        resolvedAngleDeg: fallbackFrame.angleDeg,
        supports360: activeFrames.length >= 3,
        outfitId: activeGarment.id,
        outfitName: selectedLabel,
        poseId: poseDef.id,
        poseTitle: poseDef.title,
        noticeTitle: `Pose «${poseDef.title}» aún no disponible`,
        noticeMessage: `Todavía no hay fotografía de esta pose para «${activeGarment.name}». Mostrando la vista Natural real.`,
        canRestoreFlagship: false,
        canEditGarment: true,
      };
    }

    const closestFrame = selectClosestAngleFrame(activeFrames, params.angleDeg);
    const angleDist = circularAngleDistance(closestFrame.angleDeg, params.angleDeg);
    const isAngleMissing = angleDist > 45;

    if (bothSelected) {
      return {
        mode: 'outfit',
        status: 'missing-combination',
        activeFrame: closestFrame,
        availableFrames: activeFrames,
        resolvedAngleDeg: closestFrame.angleDeg,
        supports360: activeFrames.length >= 3,
        outfitId: activeGarment.id,
        outfitName: selectedLabel,
        poseId: poseDef.id,
        poseTitle: poseDef.title,
        noticeTitle: 'Mostrando vista individual del diseño',
        noticeMessage: `Aún no existe una fotografía combinada de «${selectedLabel}». Mostrando la fotografía real de «${activeGarment.name}».`,
        canRestoreFlagship: false,
        canEditGarment: true,
      };
    }

    if (isAngleMissing) {
      return {
        mode: 'outfit',
        status: 'missing-angle',
        activeFrame: closestFrame,
        availableFrames: activeFrames,
        resolvedAngleDeg: closestFrame.angleDeg,
        supports360: activeFrames.length >= 3,
        outfitId: activeGarment.id,
        outfitName: activeGarment.name,
        poseId: poseDef.id,
        poseTitle: poseDef.title,
        noticeTitle: `Vista «${getAngleNameLabel(params.angleDeg)}» aún no disponible`,
        noticeMessage: `«${activeGarment.name}» tiene ${activeFrames.length} ${
          activeFrames.length === 1 ? 'vista fotografiada' : 'vistas fotografiadas'
        }. Puedes subir este ángulo en Editar diseño.`,
        canRestoreFlagship: false,
        canEditGarment: true,
      };
    }

    if (hasCustomColorOverride) {
      return {
        mode: 'outfit',
        status: 'missing-color',
        activeFrame: closestFrame,
        availableFrames: activeFrames,
        resolvedAngleDeg: closestFrame.angleDeg,
        supports360: activeFrames.length >= 3,
        outfitId: activeGarment.id,
        outfitName: activeGarment.name,
        poseId: poseDef.id,
        poseTitle: poseDef.title,
        noticeTitle: 'Variante de color aún no fotografiada',
        noticeMessage:
          'Mostrando la fotografía real del diseño en su tono original. El visor nunca tiñe ni deforma fotografías.',
        canRestoreFlagship: false,
        canEditGarment: true,
      };
    }

    return {
      mode: 'outfit',
      status: 'matched',
      activeFrame: closestFrame,
      availableFrames: activeFrames,
      resolvedAngleDeg: closestFrame.angleDeg,
      supports360: activeFrames.length >= 3,
      outfitId: activeGarment.id,
      outfitName: activeGarment.name,
      poseId: poseDef.id,
      poseTitle: poseDef.title,
      noticeTitle: null,
      noticeMessage: null,
      canRestoreFlagship: false,
      canEditGarment: true,
    };
  }

  // Case 2B: Find an exact static photographed outfit manifest for the selected garment combination
  const topId = params.selectedTop?.id ?? null;
  const bottomId = params.selectedBottom?.id ?? null;

  const matchedOutfit = bundle.outfits.find(
    (outfit) => outfit.garments.topId === topId && outfit.garments.bottomId === bottomId
  );

  if (!matchedOutfit) {
    const selectedLabel = [params.selectedTop?.name, params.selectedBottom?.name]
      .filter(Boolean)
      .join(' + ');

    const fallbackFrame = selectClosestAngleFrame(baseNaturalFrames, params.angleDeg);
    return {
      mode: 'base-model',
      status: 'missing-combination',
      activeFrame: fallbackFrame,
      availableFrames: baseNaturalFrames,
      resolvedAngleDeg: fallbackFrame.angleDeg,
      supports360: baseNaturalFrames.length >= 3,
      outfitId: null,
      outfitName: selectedLabel || 'Diseño seleccionado',
      poseId: poseDef.id,
      poseTitle: poseDef.title,
      noticeTitle: 'Vista del modelo aún no asociada',
      noticeMessage: `«${selectedLabel}» todavía no tiene fotografías del modelo vistiendo esta prenda. Puedes añadirlas desde Editar diseño.`,
      canRestoreFlagship: false,
      canEditGarment: Boolean(params.selectedTop || params.selectedBottom),
    };
  }

  // Matched static outfit manifest! Check pose availability first
  const poseTrack = matchedOutfit.poses[poseDef.id];
  const naturalTrack = matchedOutfit.poses.natural;

  if (!poseTrack || !poseTrack.available || poseTrack.frames.length === 0) {
    const fallbackFrames = naturalTrack.frames;
    const activeFrame = selectClosestAngleFrame(fallbackFrames, params.angleDeg);
    return {
      mode: 'outfit',
      status: 'missing-pose',
      activeFrame,
      availableFrames: fallbackFrames,
      resolvedAngleDeg: activeFrame.angleDeg,
      supports360: fallbackFrames.length >= 3,
      outfitId: matchedOutfit.id,
      outfitName: matchedOutfit.name,
      poseId: poseDef.id,
      poseTitle: poseDef.title,
      noticeTitle: `Pose «${poseDef.title}» pendiente de fotografía`,
      noticeMessage:
        'Aún no se ha generado la fotografía real de esta pose para este conjunto. Mostrando la secuencia fotográfica Natural.',
      canRestoreFlagship: false,
    };
  }

  const activeFrame = selectClosestAngleFrame(poseTrack.frames, params.angleDeg);

  if (hasCustomColorOverride) {
    return {
      mode: 'outfit',
      status: 'missing-color',
      activeFrame,
      availableFrames: poseTrack.frames,
      resolvedAngleDeg: activeFrame.angleDeg,
      supports360: poseTrack.frames.length >= 3,
      outfitId: matchedOutfit.id,
      outfitName: matchedOutfit.name,
      poseId: poseDef.id,
      poseTitle: poseDef.title,
      noticeTitle: 'Variante de color aún no fotografiada',
      noticeMessage: `Solo está disponible la sesión real en el color original (${matchedOutfit.colors.available[0]?.label ?? 'Original'}). No se tiñe artificialmente la fotografía.`,
      canRestoreFlagship: false,
    };
  }

  return {
    mode: 'outfit',
    status: 'matched',
    activeFrame,
    availableFrames: poseTrack.frames,
    resolvedAngleDeg: activeFrame.angleDeg,
    supports360: poseTrack.frames.length >= 3,
    outfitId: matchedOutfit.id,
    outfitName: matchedOutfit.name,
    poseId: poseDef.id,
    poseTitle: poseDef.title,
    noticeTitle: null,
    noticeMessage: null,
    canRestoreFlagship: false,
  };
}

/* ============================================================================
   PRELOADER & RUNTIME JSON MANIFEST LOADER
============================================================================ */

const preloadedImageUrls = new Set<string>();

export function preloadPhotoUrls(urls: string[]): void {
  if (typeof window === 'undefined') return;
  for (const url of urls) {
    if (!url || preloadedImageUrls.has(url)) continue;
    preloadedImageUrls.add(url);
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  }
}

export function collectBundlePhotoUrls(bundle: VestidorManifestBundle): string[] {
  const urls: string[] = [];
  Object.values(bundle.model.poses).forEach((track) => {
    track?.frames.forEach((f) => urls.push(f.src));
  });
  bundle.outfits.forEach((outfit) => {
    Object.values(outfit.poses).forEach((track) => {
      track?.frames.forEach((f) => urls.push(f.src));
    });
  });
  return urls;
}

/**
 * Loads manifests dynamically from /vestidor/.../manifest.json so adding new
 * 8/12/24-view sequences or new outfit folders in public/vestidor/ works cleanly.
 */
export async function loadVestidorManifests(): Promise<VestidorManifestBundle> {
  const fallback: VestidorManifestBundle = {
    model: OFFICIAL_MODEL_MANIFEST,
    poses: PHOTO_POSES,
    outfits: OUTFIT_PHOTO_MANIFESTS,
  };

  try {
    const [modelRes, posesRes, ...outfitResList] = await Promise.all([
      fetch(VESTIDOR_MANIFEST_PATHS.model, { cache: 'no-cache' }),
      fetch(VESTIDOR_MANIFEST_PATHS.poses, { cache: 'no-cache' }),
      ...VESTIDOR_MANIFEST_PATHS.outfits.map((path) => fetch(path, { cache: 'no-cache' })),
    ]);

    const model: OfficialModelManifest = modelRes.ok
      ? ((await modelRes.json()) as OfficialModelManifest)
      : fallback.model;

    const posesJson = posesRes.ok
      ? ((await posesRes.json()) as { poses?: PhotoPoseDefinition[] })
      : null;
    const poses = Array.isArray(posesJson?.poses) && posesJson.poses.length > 0
      ? posesJson.poses
      : fallback.poses;

    const loadedOutfits: OutfitPhotoManifest[] = [];
    for (let i = 0; i < outfitResList.length; i++) {
      const res = outfitResList[i];
      if (res.ok) {
        loadedOutfits.push((await res.json()) as OutfitPhotoManifest);
      } else if (fallback.outfits[i]) {
        loadedOutfits.push(fallback.outfits[i]);
      }
    }

    const bundle: VestidorManifestBundle = {
      model,
      poses,
      outfits: loadedOutfits.length > 0 ? loadedOutfits : fallback.outfits,
    };
    preloadPhotoUrls(collectBundlePhotoUrls(bundle));
    return bundle;
  } catch {
    preloadPhotoUrls(collectBundlePhotoUrls(fallback));
    return fallback;
  }
}
