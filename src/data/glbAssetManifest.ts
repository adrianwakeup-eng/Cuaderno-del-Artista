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
 * Authentic crochet yarn-ball palette matching the luxury reference ovillos
 * (Crema, Verde Bosque, Amarillo Girasol, Azul Cobalto, Terracota, Burdeos, Gris, Negro + extras).
 */
export const YARN_BALL_COLORS: YarnBallColorOption[] = [
  { id: 'crema', name: 'Crema Marfil', hex: '#F0DEC1', trimHex: '#9E7842', accentHex: '#D8A438' },
  { id: 'bosque', name: 'Verde Bosque', hex: '#28572A', trimHex: '#EFE0C2', accentHex: '#D9A938' },
  { id: 'girasol', name: 'Amarillo Girasol', hex: '#E3A91C', trimHex: '#254C26', accentHex: '#F7E7C4' },
  { id: 'cobalto', name: 'Azul Cobalto', hex: '#23499E', trimHex: '#F2E5C9', accentHex: '#D5A23C' },
  { id: 'terracota', name: 'Terracota Canela', hex: '#B46334', trimHex: '#F2E3C6', accentHex: '#3A2012' },
  { id: 'burdeos', name: 'Burdeos Vino', hex: '#7D2239', trimHex: '#D9A74B', accentHex: '#F2E4CA' },
  { id: 'piedra', name: 'Gris Piedra', hex: '#83878E', trimHex: '#31363F', accentHex: '#E9DFCE' },
  { id: 'onix', name: 'Negro Ónix', hex: '#212226', trimHex: '#C99842', accentHex: '#EAE0CE' },
  { id: 'oliva', name: 'Verde Oliva', hex: '#5D6B42', trimHex: '#EBDCC0', accentHex: '#C4923B' },
  { id: 'marino', name: 'Azul Marino', hex: '#1E3152', trimHex: '#EFE2C6', accentHex: '#C9973E' },
  { id: 'cacao', name: 'Cacao Nogal', hex: '#5E3A24', trimHex: '#D7A44E', accentHex: '#F0E1C6' },
  { id: 'arena', name: 'Arena Lino', hex: '#D8BC94', trimHex: '#634124', accentHex: '#F6EBD8' },
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
