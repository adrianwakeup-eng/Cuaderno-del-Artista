export interface GlbAssetRequirement {
  id: string;
  label: string;
  slot: 'avatar' | 'top' | 'bottom';
  expectedPath: string;
  description: string;
  rigNotes: string;
}

export interface YarnBallColorOption {
  id: string;
  name: string;
  hex: string;
  trimHex: string;
  accentHex: string;
}

/**
 * Exact four-view orthographic male reference sheet supplied by the user (used in left UI strip).
 */
export const MALE_FOUR_VIEW_REFERENCE_URL =
  '/assets/aistudio/58e44196-3d30-452c-9dc7-7d8dcbde8e10_0e6c9143.png';

/**
 * Clean RGBA transparent 4-view orthographic turnaround sheet (Front, Left Profile, Back, Right Profile)
 * used as primary visual reference for 4-view 3D avatar projection & proportion calibration.
 */
export const MALE_FOUR_VIEW_TRANSPARENT_URL = '/assets/aistudio/image_96c670b6.png';

/**
 * Expected drop-in path for a custom sculpted/rigged GLB avatar matching the 4-view reference.
 */
export const DEFAULT_GLB_AVATAR_PATH = '/models/avatar_fuentes_nazco.glb';

/**
 * High-fidelity luxury visual reference supplied by the user.
 */
export const DRESSING_ROOM_REFERENCE_URL =
  '/assets/aistudio/44e03f5f-5a8f-4d73-93af-4fb944332fe5_fb55f46d.png';

/**
 * Curated 4-view orthographic slices aligned to MALE_FOUR_VIEW_REFERENCE_URL
 * (4 equally spaced columns: Front, Profile Left, Back, Profile Right).
 */
export const TURNAROUND_CAMERA_VIEWS = [
  {
    id: 'front',
    label: 'Frente',
    shortLabel: '0°',
    yawRad: 0,
    bgPositionX: '6%',
    bgPositionY: '14%',
  },
  {
    id: 'profile-left',
    label: 'Perfil Izq.',
    shortLabel: '90°',
    yawRad: -Math.PI / 2,
    bgPositionX: '37%',
    bgPositionY: '14%',
  },
  {
    id: 'back',
    label: 'Espalda',
    shortLabel: '180°',
    yawRad: Math.PI,
    bgPositionX: '64.5%',
    bgPositionY: '14%',
  },
  {
    id: 'profile-right',
    label: 'Perfil Der.',
    shortLabel: '270°',
    yawRad: Math.PI / 2,
    bgPositionX: '93.5%',
    bgPositionY: '14%',
  },
] as const;

/**
 * Fresh, trendy, youthful & atelier-curated fashion yarn palette for exact hyperrealistic recoloring.
 */
export const YARN_BALL_COLORS: YarnBallColorOption[] = [
  { id: 'blanco-nube', name: 'Blanco Nube', hex: '#F7F5F0', trimHex: '#D8CFC2', accentHex: '#E5D8C0' },
  { id: 'crema', name: 'Crema Marfil', hex: '#F0DEC1', trimHex: '#9E7842', accentHex: '#D8A438' },
  { id: 'mantequilla', name: 'Amarillo Mantequilla', hex: '#F6DF86', trimHex: '#C59F3A', accentHex: '#FFF4C4' },
  { id: 'menta-matcha', name: 'Menta Matcha', hex: '#92D9B1', trimHex: '#3C7E5A', accentHex: '#E6F9EE' },
  { id: 'salvia', name: 'Verde Salvia', hex: '#7FA57C', trimHex: '#EFE6D2', accentHex: '#C49B48' },
  { id: 'azul-cielo', name: 'Azul Cielo', hex: '#74B8EE', trimHex: '#2C6196', accentHex: '#EAF5FF' },
  { id: 'lavanda', name: 'Lavanda Pastel', hex: '#BBA0EA', trimHex: '#6B4D9E', accentHex: '#F2EAFF' },
  { id: 'rosa-chicle', name: 'Rosa Melocotón', hex: '#F2A3B7', trimHex: '#A64B65', accentHex: '#FFEAF0' },
  { id: 'coral-amalfi', name: 'Coral Amalfi', hex: '#EE7B62', trimHex: '#9A3F2B', accentHex: '#FFE8DF' },
  { id: 'girasol', name: 'Amarillo Girasol', hex: '#E6AE1E', trimHex: '#254C26', accentHex: '#F7E7C4' },
  { id: 'terracota', name: 'Terracota Canela', hex: '#C25F34', trimHex: '#F2E3C6', accentHex: '#3A2012' },
  { id: 'cobalto', name: 'Azul Cobalto', hex: '#2653B8', trimHex: '#F2E5C9', accentHex: '#D5A23C' },
  { id: 'denim', name: 'Denim Índigo', hex: '#3B5C8C', trimHex: '#EFE2C6', accentHex: '#C9973E' },
  { id: 'bosque', name: 'Verde Bosque', hex: '#225937', trimHex: '#EFE0C2', accentHex: '#D9A938' },
  { id: 'burdeos', name: 'Burdeos Cereza', hex: '#861F3B', trimHex: '#D9A74B', accentHex: '#F2E4CA' },
  { id: 'espresso', name: 'Espresso Mocha', hex: '#5D3925', trimHex: '#D7A44E', accentHex: '#F0E1C6' },
  { id: 'piedra', name: 'Gris Perla', hex: '#9499A1', trimHex: '#31363F', accentHex: '#E9DFCE' },
  { id: 'onix', name: 'Negro Ónix', hex: '#1F2127', trimHex: '#C99842', accentHex: '#EAE0CE' },
];

export interface ModelSkinToneOption {
  id: string;
  name: string;
  swatchHex: string;
  targetHex: string;
  lightScale: number;
  satScale: number;
}

export const MODEL_SKIN_TONES: ModelSkinToneOption[] = [
  { id: 'natural', name: 'Natural', swatchHex: '#D8A276', targetHex: '#D8A276', lightScale: 1.0, satScale: 1.0 },
  { id: 'porcelana', name: 'Porcelana', swatchHex: '#F5DBC9', targetHex: '#F3D6C3', lightScale: 1.24, satScale: 0.72 },
  { id: 'durazno', name: 'Durazno', swatchHex: '#EBC3A6', targetHex: '#E9BE9F', lightScale: 1.13, satScale: 0.86 },
  { id: 'miel', name: 'Miel Dorada', swatchHex: '#DDA574', targetHex: '#DBA270', lightScale: 1.04, satScale: 1.03 },
  { id: 'trigueno', name: 'Trigueño', swatchHex: '#C78A5C', targetHex: '#C58657', lightScale: 0.93, satScale: 1.04 },
  { id: 'bronceado', name: 'Bronceado', swatchHex: '#B17042', targetHex: '#AE6C3E', lightScale: 0.82, satScale: 1.08 },
  { id: 'canela', name: 'Canela', swatchHex: '#8E532F', targetHex: '#8B502C', lightScale: 0.68, satScale: 1.02 },
  { id: 'ebano', name: 'Ébano', swatchHex: '#5B341E', targetHex: '#58311C', lightScale: 0.48, satScale: 0.90 },
];

export interface AtelierCurtainDesign {
  id: string;
  name: string;
  subtitle: string;
  src: string;
  swatchHex: string;
  accentHex: string;
  showDreamcatcher?: boolean;
}

export const ATELIER_CURTAIN_DESIGNS: AtelierCurtainDesign[] = [
  {
    id: 'macrame-dorado',
    name: 'Macramé Dorado',
    subtitle: 'Macramé artesanal en hilos de oro y cuentas',
    src: '/vestidor/cortinas/macrame-dorado.webp',
    swatchHex: '#DFBE78',
    accentHex: '#9E7428',
    showDreamcatcher: true,
  },
  {
    id: 'encaje-marfil',
    name: 'Encaje Marfil',
    subtitle: 'Encaje francés de alta costura calado',
    src: '/vestidor/cortinas/encaje-marfil-alta-costura.webp',
    swatchHex: '#F8F0DF',
    accentHex: '#CBB183',
  },
  {
    id: 'puntilla-oro',
    name: 'Puntilla Oro 24k',
    subtitle: 'Puntilla veneciana real con flecos dorados',
    src: '/vestidor/cortinas/puntilla-veneciana-oro.webp',
    swatchHex: '#E5B958',
    accentHex: '#A6721A',
  },
  {
    id: 'encaje-rosa',
    name: 'Encaje Rosa Antiguo',
    subtitle: 'Puntilla romántica rosa empolvado de taller',
    src: '/vestidor/cortinas/encaje-rosa-romantico.webp',
    swatchHex: '#EBC2C8',
    accentHex: '#B66F7D',
  },
  {
    id: 'crochet-esmeralda',
    name: 'Crochet Esmeralda',
    subtitle: 'Crochet irlandés verde bosque con borlas oro',
    src: '/vestidor/cortinas/crochet-esmeralda-real.webp',
    swatchHex: '#3A7B5A',
    accentHex: '#D8AF52',
  },
  {
    id: 'lino-macrame',
    name: 'Lino Artesanal',
    subtitle: 'Macramé bohemio en algodón y lino crudo',
    src: '/vestidor/cortinas/lino-macrame-artesanal.webp',
    swatchHex: '#DEC7A4',
    accentHex: '#9C7A52',
    showDreamcatcher: true,
  },
];

/**
 * Exact checklist of external .GLB 3D production assets prepared for drop-in loading
 * via GLTFLoader. Currently no binary .glb files exist in /public/models/, so the
 * app exposes direct local .GLB upload & exact manifest paths transparently.
 */
export const REQUIRED_GLB_ASSETS: GlbAssetRequirement[] = [
  {
    id: 'avatar-base',
    label: 'Avatar Masculino Fuentes Nazco (.glb)',
    slot: 'avatar',
    expectedPath: '/models/avatar_fuentes_nazco.glb',
    description:
      'Malla humana masculina articulada con esqueleto humanoide (Mixamo/ReadyPlayerMe/Blender) fiel a las 4 vistas ortográficas con gafas doradas y cabello rizado.',
    rigNotes: 'Altura normalizada a 1.78m, pies en Y=0, mapa normal PBR de piel y clips Idle/Walk.',
  },
  {
    id: 'garment-camisa-girasol',
    label: 'Camisa Crochet Girasol (.glb)',
    slot: 'top',
    expectedPath: '/models/prendas/camisa_girasol_crochet.glb',
    description: 'Camisa manga corta de cuadros granny con flores girasol y cuello verde.',
    rigNotes: 'Pesado al mismo esqueleto humanoide (skinned mesh) o malla rígida torso + mangas.',
  },
  {
    id: 'garment-cardigan-atelier',
    label: 'Cárdigan Atelier Marino (.glb)',
    slot: 'top',
    expectedPath: '/models/prendas/cardigan_atelier.glb',
    description: 'Cárdigan cuello chal trenzado con ribete crema y botones de latón.',
    rigNotes: 'UVs limpios para mapa PBR crochet + oclusión ambiental en solapa y bolsillos.',
  },
  {
    id: 'garment-chaleco-oliva',
    label: 'Chaleco de Taller Oliva (.glb)',
    slot: 'top',
    expectedPath: '/models/prendas/chaleco_oliva.glb',
    description: 'Chaleco entallado de escote en V en punto espiga con botones metálicos.',
    rigNotes: 'Recorte limpio en sisas y escote sin solapamiento con el torso del avatar.',
  },
  {
    id: 'garment-shorts-crochet',
    label: 'Short Crochet Verde Bosque (.glb)',
    slot: 'bottom',
    expectedPath: '/models/prendas/shorts_crochet_bosque.glb',
    description: 'Short en punto alto texturizado con cordón trenzado crema en cintura.',
    rigNotes: 'Ajustado a cadera/muslos del avatar con caída natural en bajos.',
  },
  {
    id: 'garment-pantalon-sastre',
    label: 'Pantalón Sastre Crochet (.glb)',
    slot: 'bottom',
    expectedPath: '/models/prendas/pantalon_sastre_crochet.glb',
    description: 'Pantalón largo entallado de crochet con raya frontal y cintura estructurada.',
    rigNotes: 'Articulación limpia en rodillas y tobillos para poses de pasarela y sentado.',
  },
];
