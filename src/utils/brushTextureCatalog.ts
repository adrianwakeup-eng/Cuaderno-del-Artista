import type { BrushPresetId } from '../types/crochet';

export type TextureFamilyId =
  | 'pelaje'
  | 'cabello'
  | 'piel'
  | 'arena'
  | 'roca'
  | 'botanica'
  | 'plumas'
  | 'telas'
  | 'agua'
  | 'oleo'
  | 'acuarela'
  | 'grafito'
  | 'madera'
  | 'cielo'
  | 'luz'
  | 'ornamento';

export type TextureEngineKind =
  | 'fur'
  | 'hair'
  | 'skin'
  | 'sand'
  | 'rock'
  | 'botanical'
  | 'feather'
  | 'scales'
  | 'fabric'
  | 'water'
  | 'oil'
  | 'watercolor'
  | 'graphite'
  | 'woodmetal'
  | 'cloud'
  | 'sparkle'
  | 'ornament';

export interface TextureBrushParams {
  engine: TextureEngineKind;
  /** Deterministic variation seed */
  seed: number;
  /** Particle/strand density multiplier (0.4 .. 2.2) */
  density: number;
  /** Element scale / length multiplier (0.4 .. 2.0) */
  scale: number;
  /** Angular spread / curliness (0.05 .. 1.6) */
  curl: number;
  /** Tonal shadow/highlight contrast (0.1 .. 0.75) */
  contrast: number;
  /** Specular sheen / highlight ratio (0.0 .. 1.0) */
  sheen: number;
  /** Lateral scatter factor (0.25 .. 1.6) */
  scatter: number;
  /** Step spacing multiplier (0.12 .. 0.7) */
  spacing: number;
  /** Secondary sub-mode inside each engine (0..4) */
  subMode: number;
}

export interface CatalogTextureBrush {
  id: BrushPresetId;
  familyId: TextureFamilyId;
  familyLabel: string;
  shortLabel: string;
  label: string;
  description: string;
  tint: string;
  defaultSize: number;
  defaultOpacity: number;
  defaultSoftness: number;
  params: TextureBrushParams;
}

export interface TextureFamilyMeta {
  id: TextureFamilyId;
  label: string;
  shortLabel: string;
  tint: string;
  count: number;
}

interface SubtypeSpec {
  slug: string;
  name: string;
  tint: string;
  engine: TextureEngineKind;
  subMode: number;
  density: number;
  scale: number;
  curl: number;
  contrast: number;
  sheen: number;
  scatter: number;
  spacing: number;
  defaultSize: number;
  defaultOpacity: number;
  defaultSoftness: number;
}

interface VariationSpec {
  slug: string;
  name: string;
  desc: string;
  densityM: number;
  scaleM: number;
  curlM: number;
  contrastM: number;
  sheenAdd: number;
  scatterM: number;
  spacingM: number;
  sizeM: number;
  opacityAdd: number;
  softnessAdd: number;
}

interface FamilyBlueprint {
  id: TextureFamilyId;
  label: string;
  shortLabel: string;
  tint: string;
  subtypes: SubtypeSpec[];
  variations: VariationSpec[];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const COMMON_VARIATIONS: Record<string, VariationSpec[]> = {
  organic: [
    { slug: 'fino', name: 'Ultrafino', desc: 'trazo microscópico de precisión', densityM: 0.9, scaleM: 0.65, curlM: 0.75, contrastM: 0.95, sheenAdd: 0.05, scatterM: 0.65, spacingM: 0.8, sizeM: 0.75, opacityAdd: 4, softnessAdd: -10 },
    { slug: 'sedoso', name: 'Sedoso', desc: 'acabado suave con brillo aterciopelado', densityM: 1.1, scaleM: 1.15, curlM: 0.9, contrastM: 0.85, sheenAdd: 0.22, scatterM: 0.9, spacingM: 0.9, sizeM: 1.0, opacityAdd: 0, softnessAdd: 8 },
    { slug: 'denso', name: 'Denso', desc: 'alta densidad de microdetalles', densityM: 1.45, scaleM: 1.0, curlM: 1.0, contrastM: 1.05, sheenAdd: 0.05, scatterM: 1.0, spacingM: 0.78, sizeM: 1.1, opacityAdd: 6, softnessAdd: -4 },
    { slug: 'rizado', name: 'Ondulado', desc: 'curvatura orgánica natural y fluida', densityM: 1.0, scaleM: 1.1, curlM: 1.45, contrastM: 1.0, sheenAdd: 0.1, scatterM: 1.15, spacingM: 0.95, sizeM: 1.05, opacityAdd: 0, softnessAdd: 4 },
    { slug: 'solar', name: 'Luz solar', desc: 'con destellos cálidos en las puntas', densityM: 1.05, scaleM: 1.05, curlM: 0.95, contrastM: 1.15, sheenAdd: 0.34, scatterM: 1.0, spacingM: 0.92, sizeM: 1.0, opacityAdd: 2, softnessAdd: 5 },
    { slug: 'sombra', name: 'Subpelo profundo', desc: 'sombras ricas para dar volumen 3D', densityM: 1.2, scaleM: 0.95, curlM: 1.05, contrastM: 1.35, sheenAdd: -0.1, scatterM: 0.95, spacingM: 0.88, sizeM: 1.15, opacityAdd: 5, softnessAdd: 10 },
    { slug: 'aereo', name: 'Ligero aéreo', desc: 'dispersión delicada para capas suaves', densityM: 0.68, scaleM: 0.9, curlM: 1.1, contrastM: 0.8, sheenAdd: 0.12, scatterM: 1.32, spacingM: 1.18, sizeM: 1.2, opacityAdd: -14, softnessAdd: 16 },
    { slug: 'macro', name: 'Detalle macro', desc: 'máxima nitidez para primeros planos', densityM: 1.15, scaleM: 0.78, curlM: 0.85, contrastM: 1.25, sheenAdd: 0.18, scatterM: 0.75, spacingM: 0.75, sizeM: 0.82, opacityAdd: 8, softnessAdd: -14 },
    { slug: 'suelto', name: 'Al viento', desc: 'dirección dinámica y expresiva', densityM: 0.85, scaleM: 1.35, curlM: 1.35, contrastM: 0.95, sheenAdd: 0.14, scatterM: 1.25, spacingM: 1.05, sizeM: 1.15, opacityAdd: -4, softnessAdd: 4 },
    { slug: 'estudio', name: 'Acabado estudio', desc: 'equilibrio hiperrealista de galería', densityM: 1.25, scaleM: 1.05, curlM: 1.0, contrastM: 1.18, sheenAdd: 0.2, scatterM: 0.95, spacingM: 0.85, sizeM: 1.0, opacityAdd: 4, softnessAdd: 0 },
  ],
  mineral: [
    { slug: 'micro', name: 'Micrograno', desc: 'partículas finísimas de alta precisión', densityM: 1.35, scaleM: 0.62, curlM: 0.8, contrastM: 0.95, sheenAdd: 0.08, scatterM: 0.85, spacingM: 0.82, sizeM: 0.8, opacityAdd: 2, softnessAdd: 6 },
    { slug: 'medio', name: 'Grano medio', desc: 'relieve natural equilibrado', densityM: 1.05, scaleM: 1.0, curlM: 1.0, contrastM: 1.05, sheenAdd: 0.1, scatterM: 1.0, spacingM: 0.95, sizeM: 1.0, opacityAdd: 0, softnessAdd: 0 },
    { slug: 'grueso', name: 'Grueso mineral', desc: 'granos y facetas marcadas con relieve', densityM: 0.88, scaleM: 1.42, curlM: 1.15, contrastM: 1.25, sheenAdd: 0.05, scatterM: 1.12, spacingM: 1.08, sizeM: 1.25, opacityAdd: 6, softnessAdd: -10 },
    { slug: 'brillo', name: 'Con cuarzo', desc: 'destellos minerales luminosos', densityM: 1.1, scaleM: 0.95, curlM: 0.95, contrastM: 1.15, sheenAdd: 0.36, scatterM: 1.05, spacingM: 0.92, sizeM: 1.0, opacityAdd: 2, softnessAdd: 2 },
    { slug: 'compacto', name: 'Compacto', desc: 'cobertura densa y uniforme', densityM: 1.5, scaleM: 0.9, curlM: 0.85, contrastM: 1.0, sheenAdd: 0.04, scatterM: 0.78, spacingM: 0.74, sizeM: 0.95, opacityAdd: 8, softnessAdd: -6 },
    { slug: 'disperso', name: 'Dispersión amplia', desc: 'salpicadura orgánica de borde suave', densityM: 0.75, scaleM: 0.88, curlM: 1.2, contrastM: 0.9, sheenAdd: 0.12, scatterM: 1.48, spacingM: 1.2, sizeM: 1.3, opacityAdd: -12, softnessAdd: 18 },
    { slug: 'humedo', name: 'Húmedo brillante', desc: 'sombras profundas con reflejo húmedo', densityM: 1.15, scaleM: 1.05, curlM: 0.9, contrastM: 1.32, sheenAdd: 0.3, scatterM: 0.92, spacingM: 0.86, sizeM: 1.05, opacityAdd: 6, softnessAdd: 4 },
    { slug: 'seco', name: 'Seco polvoriento', desc: 'acabado mate y texturizado', densityM: 0.95, scaleM: 0.82, curlM: 1.05, contrastM: 0.85, sheenAdd: -0.1, scatterM: 1.22, spacingM: 1.05, sizeM: 1.1, opacityAdd: -8, softnessAdd: 12 },
    { slug: 'cincel', name: 'Alto contraste', desc: 'aristas definidas y sombras dramáticas', densityM: 1.0, scaleM: 1.15, curlM: 1.0, contrastM: 1.42, sheenAdd: 0.22, scatterM: 0.88, spacingM: 0.88, sizeM: 1.0, opacityAdd: 8, softnessAdd: -14 },
    { slug: 'veladura', name: 'Sutil veladura', desc: 'textura translúcida para construir capas', densityM: 0.8, scaleM: 0.92, curlM: 0.95, contrastM: 0.75, sheenAdd: 0.14, scatterM: 1.15, spacingM: 1.02, sizeM: 1.18, opacityAdd: -18, softnessAdd: 22 },
  ],
  painterly: [
    { slug: 'preciso', name: 'Preciso', desc: 'control exacto para detalles finos', densityM: 1.0, scaleM: 0.72, curlM: 0.7, contrastM: 1.05, sheenAdd: 0.08, scatterM: 0.7, spacingM: 0.8, sizeM: 0.75, opacityAdd: 6, softnessAdd: -12 },
    { slug: 'cremoso', name: 'Cremoso', desc: 'carga rica y suave sobre el papel', densityM: 1.25, scaleM: 1.05, curlM: 0.9, contrastM: 0.95, sheenAdd: 0.18, scatterM: 0.92, spacingM: 0.85, sizeM: 1.05, opacityAdd: 8, softnessAdd: 6 },
    { slug: 'seco', name: 'Pincel seco', desc: 'arrastre roto que deja respirar el grano', densityM: 0.78, scaleM: 0.95, curlM: 1.15, contrastM: 1.22, sheenAdd: 0.04, scatterM: 1.18, spacingM: 1.15, sizeM: 1.1, opacityAdd: -10, softnessAdd: -8 },
    { slug: 'impasto', name: 'Relieve 3D', desc: 'borde con luz y sombra de pasta real', densityM: 1.35, scaleM: 1.18, curlM: 0.95, contrastM: 1.35, sheenAdd: 0.28, scatterM: 0.95, spacingM: 0.82, sizeM: 1.15, opacityAdd: 10, softnessAdd: -6 },
    { slug: 'veladura', name: 'Veladura', desc: 'capa fina translúcida acumulable', densityM: 0.9, scaleM: 1.1, curlM: 0.85, contrastM: 0.75, sheenAdd: 0.16, scatterM: 1.1, spacingM: 0.95, sizeM: 1.2, opacityAdd: -22, softnessAdd: 20 },
    { slug: 'expresivo', name: 'Expresivo', desc: 'trazo gestual lleno de carácter', densityM: 1.1, scaleM: 1.3, curlM: 1.35, contrastM: 1.2, sheenAdd: 0.14, scatterM: 1.25, spacingM: 1.02, sizeM: 1.25, opacityAdd: 2, softnessAdd: 0 },
    { slug: 'satinado', name: 'Satinado', desc: 'brillo elegante y transición sedosa', densityM: 1.15, scaleM: 1.0, curlM: 0.85, contrastM: 0.9, sheenAdd: 0.3, scatterM: 0.9, spacingM: 0.88, sizeM: 1.0, opacityAdd: 0, softnessAdd: 12 },
    { slug: 'gastado', name: 'Cerdas abiertas', desc: 'filamentos separados para texturas ricas', densityM: 0.85, scaleM: 1.12, curlM: 1.25, contrastM: 1.15, sheenAdd: 0.1, scatterM: 1.32, spacingM: 0.96, sizeM: 1.15, opacityAdd: -4, softnessAdd: -4 },
    { slug: 'capilar', name: 'Capilar 000', desc: 'punta ultra fina para microdetalles', densityM: 0.95, scaleM: 0.55, curlM: 0.65, contrastM: 1.1, sheenAdd: 0.12, scatterM: 0.55, spacingM: 0.72, sizeM: 0.58, opacityAdd: 8, softnessAdd: -16 },
    { slug: 'maestro', name: 'Maestro', desc: 'balance perfecto de pigmento y textura', densityM: 1.2, scaleM: 1.05, curlM: 1.0, contrastM: 1.18, sheenAdd: 0.22, scatterM: 0.98, spacingM: 0.86, sizeM: 1.0, opacityAdd: 4, softnessAdd: 2 },
  ],
};

function makeSubtypes(
  engine: TextureEngineKind,
  base: {
    density: number;
    scale: number;
    curl: number;
    contrast: number;
    sheen: number;
    scatter: number;
    spacing: number;
    defaultSize: number;
    defaultOpacity: number;
    defaultSoftness: number;
  },
  defs: Array<[string, string, string, number, Partial<SubtypeSpec>?]>
): SubtypeSpec[] {
  return defs.map(([slug, name, tint, subMode, overrides]) => ({
    slug,
    name,
    tint,
    engine,
    subMode,
    ...base,
    ...(overrides || {}),
  }));
}

const FAMILY_BLUEPRINTS: FamilyBlueprint[] = [
  {
    id: 'pelaje',
    label: 'Pelaje y Animales',
    shortLabel: 'Pelaje',
    tint: '#C98A4E',
    variations: COMMON_VARIATIONS.organic,
    subtypes: makeSubtypes(
      'fur',
      { density: 1.05, scale: 1.0, curl: 0.4, contrast: 0.36, sheen: 0.25, scatter: 0.95, spacing: 0.24, defaultSize: 18, defaultOpacity: 88, defaultSoftness: 30 },
      [
        ['lobo', 'Lobo ártico', '#D9D2C5', 0, { scale: 1.25, density: 1.2 }],
        ['felino', 'Felino atigrado', '#C8894B', 0, { scale: 0.82, density: 1.3 }],
        ['leon', 'Melena de león', '#B97834', 1, { scale: 1.55, curl: 0.75 }],
        ['conejo', 'Terciopelo conejo', '#E8DDD0', 2, { scale: 0.72, density: 1.45, defaultSoftness: 52 }],
        ['caballo', 'Crin de caballo', '#6D4325', 1, { scale: 1.6, curl: 0.35, sheen: 0.42 }],
        ['oso', 'Oso pardo', '#784E2D', 1, { scale: 1.15, curl: 0.65, contrast: 0.45 }],
        ['zorro', 'Zorro sedoso', '#D16C2E', 0, { scale: 1.18, sheen: 0.35 }],
        ['oveja', 'Lana merino', '#F2E7D3', 2, { scale: 0.85, curl: 1.25, density: 1.3 }],
        ['ciervo', 'Ciervo suave', '#B68356', 0, { scale: 0.76, density: 1.25 }],
        ['bigotes', 'Bigotes finos', '#F6EFE2', 3, { scale: 1.7, density: 0.45, defaultSize: 10, scatter: 0.35 }],
        ['mojado', 'Pelaje mojado', '#6A4E3A', 1, { scale: 1.2, sheen: 0.52, contrast: 0.48 }],
        ['chinchilla', 'Chinchilla densa', '#A9A4A0', 2, { scale: 0.68, density: 1.5 }],
        ['pestanas', 'Pestañas finas', '#2B1F1B', 3, { scale: 1.15, density: 0.65, defaultSize: 9, scatter: 0.32 }],
        ['ceja', 'Ceja hiperreal', '#4E3424', 3, { scale: 0.85, density: 0.85, defaultSize: 11, scatter: 0.4 }],
        ['pantera', 'Pantera satinada', '#3D3532', 0, { scale: 0.78, sheen: 0.48, contrast: 0.42 }],
      ]
    ),
  },
  {
    id: 'cabello',
    label: 'Cabello Humano',
    shortLabel: 'Cabello',
    tint: '#7A4929',
    variations: COMMON_VARIATIONS.organic,
    subtypes: makeSubtypes(
      'hair',
      { density: 1.0, scale: 1.0, curl: 0.28, contrast: 0.34, sheen: 0.34, scatter: 0.85, spacing: 0.2, defaultSize: 16, defaultOpacity: 90, defaultSoftness: 24 },
      [
        ['liso', 'Liso seda', '#5B361F', 0, { curl: 0.12, sheen: 0.46 }],
        ['ondas', 'Ondas suaves', '#8C5932', 1, { curl: 0.55, sheen: 0.38 }],
        ['rizos', 'Rizos cerrados', '#4C2D1B', 2, { curl: 1.1, density: 1.15 }],
        ['trenza', 'Trenza fina', '#B8844A', 1, { curl: 0.68, contrast: 0.42 }],
        ['mechon', 'Mechón suelto', '#734527', 0, { density: 0.65, defaultSize: 11 }],
        ['babyhair', 'Baby hairs', '#4A2F1F', 3, { density: 0.55, scale: 0.65, defaultSize: 8 }],
        ['barbacorta', 'Barba corta', '#3E2B20', 3, { engine: 'fur', scale: 0.55, density: 1.25, defaultSize: 12 }],
        ['barbalarga', 'Barba larga', '#553B2B', 1, { engine: 'fur', scale: 1.15, curl: 0.6 }],
        ['reflejo', 'Brillo capilar', '#F6E0B8', 0, { sheen: 0.75, defaultOpacity: 62 }],
        ['humedo', 'Cabello húmedo', '#3D271B', 0, { sheen: 0.62, contrast: 0.48 }],
        ['flequillo', 'Flequillo ligero', '#9E6E44', 0, { density: 0.8, scale: 0.9 }],
        ['coleta', 'Coleta tensa', '#633A22', 0, { curl: 0.08, density: 1.25 }],
        ['afro', 'Rizo afro', '#2C211D', 2, { engine: 'fur', curl: 1.45, density: 1.4, scale: 0.72 }],
        ['patillas', 'Patillas finas', '#523828', 3, { engine: 'fur', scale: 0.62, defaultSize: 10 }],
        ['viento', 'Cabello al viento', '#C8965A', 1, { curl: 0.72, scatter: 1.2 }],
      ]
    ),
  },
  {
    id: 'piel',
    label: 'Piel y Retrato',
    shortLabel: 'Piel',
    tint: '#E8B192',
    variations: COMMON_VARIATIONS.organic,
    subtypes: makeSubtypes(
      'skin',
      { density: 1.0, scale: 1.0, curl: 0.25, contrast: 0.28, sheen: 0.22, scatter: 1.0, spacing: 0.34, defaultSize: 20, defaultOpacity: 55, defaultSoftness: 65 },
      [
        ['poros', 'Poros mejilla', '#E6B090', 0],
        ['porosnariz', 'Poros nariz', '#DEA482', 0, { density: 1.3, scale: 1.15 }],
        ['porcelana', 'Piel porcelana', '#F4D4C0', 0, { density: 0.7, contrast: 0.18, sheen: 0.35 }],
        ['pecas', 'Pecas naturales', '#B67652', 1, { density: 0.72, scale: 1.35, contrast: 0.42 }],
        ['labios', 'Líneas labiales', '#C86D72', 2, { scale: 1.15, density: 1.1, defaultSize: 14 }],
        ['parpado', 'Pliegue párpado', '#CFA084', 2, { scale: 0.9, density: 0.9, defaultSize: 14 }],
        ['madura', 'Piel madura', '#D8A280', 2, { density: 1.25, contrast: 0.38 }],
        ['arrugas', 'Micro-arrugas', '#C68E6C', 2, { scale: 1.3, contrast: 0.44 }],
        ['venas', 'Venas sutiles', '#7892A8', 2, { defaultOpacity: 32, scale: 1.4, density: 0.55 }],
        ['sudor', 'Brillo sudor', '#FFF2E4', 3, { engine: 'water', defaultOpacity: 54, scale: 0.65 }],
        ['terciopelo', 'Piel aterciopelada', '#EAC0A6', 0, { defaultSoftness: 82, contrast: 0.2 }],
        ['lunares', 'Lunares micro', '#6E4530', 1, { density: 0.4, scale: 1.25, defaultSize: 12 }],
        ['cuticula', 'Cutícula fina', '#E2B49B', 0, { scale: 0.78, defaultSize: 13 }],
        ['bronceada', 'Piel bronceada', '#C48358', 0, { sheen: 0.34, contrast: 0.32 }],
        ['humeda', 'Piel húmeda', '#E5AF90', 3, { sheen: 0.56, contrast: 0.3 }],
      ]
    ),
  },
  {
    id: 'arena',
    label: 'Arena y Minerales',
    shortLabel: 'Arena',
    tint: '#E2BA78',
    variations: COMMON_VARIATIONS.mineral,
    subtypes: makeSubtypes(
      'sand',
      { density: 1.1, scale: 1.0, curl: 0.3, contrast: 0.38, sheen: 0.25, scatter: 1.0, spacing: 0.3, defaultSize: 22, defaultOpacity: 84, defaultSoftness: 45 },
      [
        ['playa', 'Arena de playa', '#E5C488', 0],
        ['duna', 'Duna desierto', '#D89E58', 0, { density: 1.25, scale: 0.85 }],
        ['cuarzo', 'Cuarzo brillante', '#F2DFC0', 1, { sheen: 0.58, contrast: 0.42 }],
        ['tierra', 'Tierra húmeda', '#6E4C32', 0, { contrast: 0.48, scale: 1.25 }],
        ['arcilla', 'Arcilla fina', '#B86E48', 0, { scale: 0.75, density: 1.3 }],
        ['volcanica', 'Gravilla volcánica', '#4E4A47', 2, { scale: 1.45, contrast: 0.52 }],
        ['polvooro', 'Polvo de oro', '#E6B84C', 1, { sheen: 0.72, scale: 0.8 }],
        ['sal', 'Sal marina', '#F4F0E8', 1, { sheen: 0.55, scale: 1.1 }],
        ['ceniza', 'Ceniza suave', '#8B8782', 0, { defaultOpacity: 68, defaultSoftness: 68 }],
        ['cosmico', 'Polvo cósmico', '#9C88C4', 1, { sheen: 0.68, scatter: 1.3 }],
        ['arenisca', 'Arenisca', '#C99864', 2, { density: 1.2, contrast: 0.44 }],
        ['agrietada', 'Tierra seca', '#9A744C', 2, { scale: 1.35, contrast: 0.48 }],
        ['cafe', 'Grano tostado', '#5A3620', 2, { scale: 1.3, contrast: 0.46 }],
        ['salpicadura', 'Salpicadura seca', '#7E5438', 2, { scatter: 1.45, density: 0.78 }],
        ['escarcha', 'Escarcha fina', '#DCEFF7', 1, { sheen: 0.65, scale: 0.82 }],
      ]
    ),
  },
  {
    id: 'roca',
    label: 'Roca, Mármol y Corteza',
    shortLabel: 'Roca',
    tint: '#9E9388',
    variations: COMMON_VARIATIONS.mineral,
    subtypes: makeSubtypes(
      'rock',
      { density: 1.0, scale: 1.0, curl: 0.4, contrast: 0.48, sheen: 0.16, scatter: 0.95, spacing: 0.36, defaultSize: 24, defaultOpacity: 86, defaultSoftness: 32 },
      [
        ['granito', 'Granito áspero', '#8E8882', 0],
        ['marmol', 'Mármol vetas', '#E6DFD3', 1, { contrast: 0.36, sheen: 0.42 }],
        ['pizarra', 'Pizarra laminada', '#5B6066', 2, { contrast: 0.52, scale: 1.15 }],
        ['volcanica', 'Roca volcánica', '#45413E', 0, { contrast: 0.58, density: 1.2 }],
        ['roble', 'Corteza de roble', '#6B4B32', 2, { scale: 1.2, contrast: 0.54 }],
        ['pino', 'Corteza de pino', '#825638', 2, { scale: 1.1, contrast: 0.48 }],
        ['musgopiedra', 'Piedra con musgo', '#6F7D5A', 0, { contrast: 0.44, density: 1.15 }],
        ['grieta', 'Grieta profunda', '#3A322C', 1, { defaultSize: 14, scale: 0.85, contrast: 0.62 }],
        ['cristal', 'Cristal mineral', '#B8D4E2', 0, { sheen: 0.64, contrast: 0.5 }],
        ['acantilado', 'Acantilado', '#7D6E60', 2, { scale: 1.35, contrast: 0.56 }],
        ['pulida', 'Piedra pulida', '#B2ABA2', 0, { sheen: 0.46, contrast: 0.32 }],
        ['muro', 'Muro antiguo', '#B5A188', 0, { density: 1.15, contrast: 0.42 }],
        ['estuco', 'Estuco rugoso', '#D8C7AE', 0, { contrast: 0.34, density: 1.25 }],
        ['concreto', 'Concreto fino', '#989692', 0, { scale: 0.82, density: 1.3 }],
        ['obsidiana', 'Obsidiana', '#2A282D', 0, { sheen: 0.68, contrast: 0.62 }],
      ]
    ),
  },
  {
    id: 'botanica',
    label: 'Botánica y Follaje',
    shortLabel: 'Botánica',
    tint: '#6FA35A',
    variations: COMMON_VARIATIONS.organic,
    subtypes: makeSubtypes(
      'botanical',
      { density: 1.0, scale: 1.0, curl: 0.55, contrast: 0.38, sheen: 0.22, scatter: 1.0, spacing: 0.28, defaultSize: 20, defaultOpacity: 90, defaultSoftness: 25 },
      [
        ['hierba', 'Hierba fina', '#6FA35A', 0],
        ['cesped', 'Césped alto', '#588E46', 0, { scale: 1.35, density: 1.15 }],
        ['musgo', 'Musgo terciopelo', '#4E7A3C', 1, { scale: 0.62, density: 1.45, defaultSoftness: 48 }],
        ['helecho', 'Hojas de helecho', '#4C8642', 2, { scale: 1.25, curl: 0.4 }],
        ['petalos', 'Pétalos de rosa', '#D66B7B', 3, { scale: 1.1, sheen: 0.32 }],
        ['otono', 'Hojas de otoño', '#C86D32', 3, { scale: 1.2, contrast: 0.46 }],
        ['pino', 'Agujas de pino', '#3B6638', 2, { scale: 0.9, density: 1.3 }],
        ['hiedra', 'Hiedra trepadora', '#4A7C3D', 3, { scale: 1.05, density: 1.1 }],
        ['silvestres', 'Flores silvestres', '#E8B84A', 3, { scale: 0.82, sheen: 0.36 }],
        ['trigo', 'Espigas de trigo', '#D9B25F', 2, { scale: 1.3, sheen: 0.34 }],
        ['liana', 'Liana boscosa', '#547842', 0, { scale: 1.4, curl: 0.95 }],
        ['polen', 'Polen dorado', '#F2D064', 1, { engine: 'sand', scale: 0.72, sheen: 0.55 }],
        ['tropical', 'Hoja tropical', '#3C884C', 3, { scale: 1.45, sheen: 0.34 }],
        ['arbusto', 'Arbusto denso', '#426E38', 1, { density: 1.35, scale: 0.92 }],
        ['ramitas', 'Ramitas secas', '#7A5B3E', 2, { scale: 1.15, density: 0.78, contrast: 0.48 }],
      ]
    ),
  },
  {
    id: 'plumas',
    label: 'Plumas y Escamas',
    shortLabel: 'Plumas',
    tint: '#D8C7AF',
    variations: COMMON_VARIATIONS.organic,
    subtypes: makeSubtypes(
      'feather',
      { density: 1.05, scale: 1.0, curl: 0.35, contrast: 0.34, sheen: 0.3, scatter: 0.9, spacing: 0.2, defaultSize: 22, defaultOpacity: 86, defaultSoftness: 30 },
      [
        ['aguila', 'Pluma de águila', '#8A6748', 0, { scale: 1.2, contrast: 0.42 }],
        ['plumon', 'Plumón suave', '#F2EAE0', 1, { scale: 0.92, defaultSoftness: 56 }],
        ['cisne', 'Ala de cisne', '#F8F4EC', 0, { sheen: 0.46, scale: 1.15 }],
        ['pavoreal', 'Pavo real', '#2E8B84', 0, { sheen: 0.58, contrast: 0.44 }],
        ['colibri', 'Pluma colibrí', '#42A87A', 1, { scale: 0.75, sheen: 0.62 }],
        ['pez', 'Escama de pez', '#6BA2B8', 0, { engine: 'scales', sheen: 0.52 }],
        ['dragon', 'Escama dragón', '#5A6E52', 1, { engine: 'scales', contrast: 0.54, scale: 1.25 }],
        ['serpiente', 'Piel serpiente', '#8A7B56', 2, { engine: 'scales', scale: 0.82, contrast: 0.46 }],
        ['iridiscente', 'Escama nacarada', '#B4C8E8', 0, { engine: 'scales', sheen: 0.68 }],
        ['mariposa', 'Ala mariposa', '#E08C48', 1, { scale: 0.88, sheen: 0.44 }],
        ['buho', 'Pluma búho', '#A68E74', 1, { contrast: 0.4, density: 1.2 }],
        ['fenix', 'Pluma fénix', '#DF642E', 0, { scale: 1.35, sheen: 0.56 }],
        ['reptil', 'Escama reptil', '#6E7A58', 2, { engine: 'scales', scale: 0.95, contrast: 0.5 }],
        ['barbulas', 'Bárbulas finas', '#DDD2C2', 0, { scale: 0.8, density: 1.35 }],
        ['cresta', 'Cresta plumosa', '#C89864', 1, { scale: 1.25, curl: 0.65 }],
      ]
    ),
  },
  {
    id: 'telas',
    label: 'Telas, Crochet y Moda',
    shortLabel: 'Telas',
    tint: '#B5896B',
    variations: COMMON_VARIATIONS.painterly,
    subtypes: makeSubtypes(
      'fabric',
      { density: 1.0, scale: 1.0, curl: 0.2, contrast: 0.34, sheen: 0.2, scatter: 0.95, spacing: 0.32, defaultSize: 22, defaultOpacity: 78, defaultSoftness: 42 },
      [
        ['lino', 'Lino natural', '#D6C2A3', 0],
        ['crochet', 'Punto crochet', '#E2B480', 1, { scale: 1.2, contrast: 0.42 }],
        ['lana', 'Lana gruesa', '#B88464', 1, { scale: 1.35, contrast: 0.46 }],
        ['denim', 'Mezclilla denim', '#4D6E96', 2, { scale: 0.85, contrast: 0.38 }],
        ['seda', 'Seda satinada', '#E8CFD6', 0, { scale: 0.65, sheen: 0.58, defaultOpacity: 68 }],
        ['encaje', 'Encaje floral', '#F4EBDC', 3, { scale: 1.15, contrast: 0.36 }],
        ['tweed', 'Tweed escocés', '#7A6858', 2, { scale: 1.1, contrast: 0.48 }],
        ['terciopelo', 'Terciopelo moda', '#7A2838', 0, { sheen: 0.44, defaultSoftness: 64 }],
        ['algodon', 'Algodón fino', '#ECE4D8', 0, { scale: 0.72, contrast: 0.24 }],
        ['tul', 'Tul transparente', '#E6DCE8', 3, { defaultOpacity: 44, scale: 0.9 }],
        ['cuero', 'Cuero graneado', '#6E3E24', 2, { engine: 'rock', scale: 0.68, sheen: 0.36 }],
        ['gamuza', 'Gamuza suave', '#A87850', 0, { engine: 'skin', contrast: 0.32, defaultOpacity: 72 }],
        ['pana', 'Pana acanalada', '#845A3E', 2, { scale: 1.05, contrast: 0.44 }],
        ['malla', 'Malla calada', '#C4A882', 3, { scale: 1.1, density: 0.9 }],
        ['bordadooro', 'Bordado hilo oro', '#E6BA56', 1, { sheen: 0.65, contrast: 0.46 }],
      ]
    ),
  },
  {
    id: 'agua',
    label: 'Agua, Gotas y Hielo',
    shortLabel: 'Agua',
    tint: '#78B9D6',
    variations: COMMON_VARIATIONS.organic,
    subtypes: makeSubtypes(
      'water',
      { density: 1.0, scale: 1.0, curl: 0.3, contrast: 0.32, sheen: 0.65, scatter: 1.0, spacing: 0.36, defaultSize: 22, defaultOpacity: 68, defaultSoftness: 58 },
      [
        ['rocio', 'Gotas de rocío', '#94CCE4', 0],
        ['lluvia', 'Lluvia fina', '#7AB4D2', 1, { scale: 0.8, density: 1.3 }],
        ['olas', 'Olas marinas', '#3B82A6', 2, { scale: 1.3, contrast: 0.42 }],
        ['espuma', 'Espuma de mar', '#E8F4F8', 3, { density: 1.35, sheen: 0.75 }],
        ['causticas', 'Cáusticas luz', '#8AD8EC', 2, { sheen: 0.78, defaultOpacity: 58 }],
        ['lago', 'Reflejo lago', '#5894B2', 2, { defaultSoftness: 74 }],
        ['hielo', 'Hielo cristal', '#C4E6F5', 1, { engine: 'rock', sheen: 0.76, contrast: 0.44 }],
        ['escarcha', 'Escarcha cristal', '#E2F3FA', 3, { engine: 'sand', sheen: 0.78, scale: 0.8 }],
        ['cascada', 'Cascada vapor', '#D4EDF6', 3, { engine: 'cloud', defaultOpacity: 52 }],
        ['burbujas', 'Burbujas agua', '#A4DDF2', 0, { scale: 1.25, density: 1.2 }],
        ['charco', 'Charco brillante', '#608FA6', 2, { sheen: 0.7 }],
        ['lagrima', 'Lágrima realista', '#C6E7F5', 0, { scale: 1.15, defaultSize: 12, density: 0.65 }],
        ['nieve', 'Nieve fresca', '#F2F7FA', 3, { engine: 'sand', scale: 1.15, sheen: 0.62 }],
        ['vidrio', 'Cristal mojado', '#B6DCEA', 0, { scale: 0.85, sheen: 0.74 }],
        ['nieblamar', 'Niebla marina', '#CBE2EC', 3, { engine: 'cloud', defaultOpacity: 44 }],
      ]
    ),
  },
  {
    id: 'oleo',
    label: 'Óleo e Impasto',
    shortLabel: 'Óleo',
    tint: '#C95A42',
    variations: COMMON_VARIATIONS.painterly,
    subtypes: makeSubtypes(
      'oil',
      { density: 1.0, scale: 1.0, curl: 0.25, contrast: 0.38, sheen: 0.22, scatter: 0.9, spacing: 0.2, defaultSize: 18, defaultOpacity: 90, defaultSoftness: 22 },
      [
        ['cerdas', 'Cerdas de cerdo', '#C95A42', 0],
        ['espatula', 'Espátula óleo', '#D47B42', 1, { contrast: 0.48, scale: 1.25 }],
        ['impasto', 'Impasto espeso', '#C84838', 1, { contrast: 0.52, density: 1.25 }],
        ['abanico', 'Pincel abanico', '#B46A46', 2, { scatter: 1.35, density: 1.2 }],
        ['lenguagato', 'Lengua de gato', '#9E4C3E', 0, { defaultSoftness: 36 }],
        ['plano', 'Pincel plano', '#844834', 1, { scale: 1.1 }],
        ['redondo', 'Pincel redondo', '#B85A3E', 0, { scale: 0.9 }],
        ['barroco', 'Veladura barroca', '#A46A34', 0, { defaultOpacity: 56, defaultSoftness: 48 }],
        ['seco', 'Óleo seco', '#8E583C', 2, { density: 0.75, contrast: 0.46 }],
        ['acrilico', 'Acrílico cremoso', '#D46648', 0, { sheen: 0.34 }],
        ['gastadas', 'Cerdas gastadas', '#7E4A32', 2, { scatter: 1.25, contrast: 0.44 }],
        ['lienzo', 'Trama lienzo', '#C49A6E', 2, { engine: 'fabric', defaultOpacity: 82 }],
        ['barniz', 'Barniz satinado', '#E8C48A', 0, { sheen: 0.56, defaultOpacity: 48 }],
        ['empaste', 'Empaste relieve', '#B64432', 1, { contrast: 0.56, scale: 1.2 }],
        ['impresionista', 'Pincel impresionista', '#D68448', 2, { curl: 0.55, scatter: 1.15 }],
      ]
    ),
  },
  {
    id: 'acuarela',
    label: 'Acuarela y Tinta',
    shortLabel: 'Acuarela',
    tint: '#5E98B8',
    variations: COMMON_VARIATIONS.painterly,
    subtypes: makeSubtypes(
      'watercolor',
      { density: 1.0, scale: 1.0, curl: 0.35, contrast: 0.28, sheen: 0.16, scatter: 1.0, spacing: 0.26, defaultSize: 22, defaultOpacity: 52, defaultSoftness: 62 },
      [
        ['humeda', 'Acuarela húmeda', '#649EC0', 0],
        ['floracion', 'Borde floración', '#7888C2', 1, { contrast: 0.42 }],
        ['lavado', 'Lavado cielo', '#8AC0DE', 0, { scale: 1.35, defaultOpacity: 38 }],
        ['tintachina', 'Tinta china', '#282220', 2, { defaultOpacity: 94, defaultSize: 10, defaultSoftness: 12 }],
        ['estilografo', 'Pluma estilográfica', '#322620', 2, { defaultOpacity: 96, defaultSize: 6, defaultSoftness: 8 }],
        ['sumie', 'Sumi-e bambú', '#3A3430', 2, { defaultOpacity: 84, scale: 1.15 }],
        ['gouache', 'Gouache mate', '#C87464', 0, { defaultOpacity: 86, defaultSoftness: 24 }],
        ['salpicadura', 'Salpicadura tinta', '#443238', 3, { engine: 'sand', scatter: 1.45, scale: 1.35 }],
        ['mancha', 'Mancha orgánica', '#8C6A9E', 1, { scale: 1.25, scatter: 1.2 }],
        ['agua', 'Pincel de agua', '#96C4D8', 0, { defaultOpacity: 34, defaultSoftness: 78 }],
        ['caligrafia', 'Caligrafía fina', '#422618', 2, { defaultOpacity: 94, defaultSize: 8 }],
        ['antigua', 'Tinta sepia antigua', '#6E4626', 2, { defaultOpacity: 82 }],
        ['granulada', 'Pigmento granulado', '#54789E', 1, { contrast: 0.44, density: 1.25 }],
        ['seca', 'Acuarela seca', '#789882', 1, { defaultOpacity: 62, contrast: 0.38 }],
        ['metalica', 'Tinta dorada', '#D8AC4E', 2, { sheen: 0.68, defaultOpacity: 88 }],
      ]
    ),
  },
  {
    id: 'grafito',
    label: 'Grafito y Carbón',
    shortLabel: 'Grafito',
    tint: '#5B5652',
    variations: COMMON_VARIATIONS.painterly,
    subtypes: makeSubtypes(
      'graphite',
      { density: 1.0, scale: 1.0, curl: 0.2, contrast: 0.34, sheen: 0.14, scatter: 0.9, spacing: 0.22, defaultSize: 9, defaultOpacity: 86, defaultSoftness: 20 },
      [
        ['g2h', 'Grafito 2H', '#94908C', 0, { defaultOpacity: 62, defaultSize: 6 }],
        ['ghb', 'Grafito HB', '#76726E', 0, { defaultOpacity: 78, defaultSize: 7 }],
        ['g2b', 'Grafito 2B', '#5A5652', 0, { defaultOpacity: 88, defaultSize: 8 }],
        ['g6b', 'Grafito 6B', '#3E3A37', 1, { defaultOpacity: 94, defaultSize: 11 }],
        ['g8b', 'Grafito 8B', '#282523', 1, { defaultOpacity: 96, defaultSize: 13 }],
        ['carbonveg', 'Carbón vegetal', '#332F2C', 2, { defaultSize: 16, scatter: 1.25, contrast: 0.48 }],
        ['carboncomp', 'Carbón comprimido', '#221F1D', 2, { defaultSize: 14, density: 1.3 }],
        ['lapizcolor', 'Lápiz de color', '#C46854', 0, { defaultSize: 9, density: 1.1 }],
        ['sanguina', 'Sanguina clásica', '#A84E36', 1, { defaultSize: 12, scatter: 1.15 }],
        ['sepia', 'Sepia renacentista', '#744A2C', 1, { defaultSize: 11 }],
        ['conte', 'Conté blanco', '#F2ECE0', 2, { defaultSize: 13, sheen: 0.32 }],
        ['pastelseco', 'Pastel seco', '#D8A482', 2, { defaultSize: 18, scatter: 1.35, defaultOpacity: 76 }],
        ['portaminas', 'Portaminas 0.3', '#484542', 0, { defaultSize: 4, density: 1.15, defaultSoftness: 8 }],
        ['biselado', 'Punta biselada', '#524E4A', 1, { defaultSize: 14, scale: 1.2 }],
        ['achurado', 'Trama achurado', '#46413D', 3, { defaultSize: 14, density: 1.25 }],
      ]
    ),
  },
  {
    id: 'madera',
    label: 'Madera, Metal y Oro',
    shortLabel: 'Madera/Oro',
    tint: '#D4A04E',
    variations: COMMON_VARIATIONS.mineral,
    subtypes: makeSubtypes(
      'woodmetal',
      { density: 1.0, scale: 1.0, curl: 0.25, contrast: 0.42, sheen: 0.48, scatter: 0.88, spacing: 0.22, defaultSize: 18, defaultOpacity: 88, defaultSoftness: 24 },
      [
        ['nogal', 'Veta de nogal', '#6E4424', 0, { sheen: 0.28 }],
        ['haya', 'Madera haya miel', '#D69856', 0, { sheen: 0.34 }],
        ['roble', 'Roble tallado', '#9C6B3C', 0, { contrast: 0.48, sheen: 0.24 }],
        ['oro', 'Oro cepillado', '#E6B94E', 1, { sheen: 0.78 }],
        ['plata', 'Plata pulida', '#CFD5DC', 1, { sheen: 0.82 }],
        ['bronce', 'Bronce antiguo', '#9E7442', 1, { sheen: 0.62, contrast: 0.48 }],
        ['cobre', 'Cobre cálido', '#C87246', 1, { sheen: 0.68 }],
        ['hierro', 'Hierro forjado', '#4E5054', 2, { sheen: 0.4, contrast: 0.54 }],
        ['cromo', 'Acero cromado', '#DCE4EC', 1, { sheen: 0.9, contrast: 0.56 }],
        ['filigrana', 'Filigrana oro', '#F0CA6A', 3, { engine: 'ornament', sheen: 0.76, defaultSize: 12 }],
        ['perla', 'Perla nacarada', '#F2E9DE', 3, { engine: 'ornament', sheen: 0.82, defaultSize: 12 }],
        ['gema', 'Gema facetada', '#5AA2C4', 2, { engine: 'rock', sheen: 0.84, contrast: 0.58 }],
        ['oxido', 'Óxido rugoso', '#A2522C', 2, { engine: 'sand', contrast: 0.52 }],
        ['laton', 'Latón martillado', '#CFA254', 2, { sheen: 0.64, contrast: 0.46 }],
        ['hojaoro', 'Hoja de oro', '#F2C85B', 1, { sheen: 0.86, scale: 1.2 }],
      ]
    ),
  },
  {
    id: 'cielo',
    label: 'Nubes, Humo y Fuego',
    shortLabel: 'Nubes',
    tint: '#D8CFC4',
    variations: COMMON_VARIATIONS.organic,
    subtypes: makeSubtypes(
      'cloud',
      { density: 1.0, scale: 1.0, curl: 0.5, contrast: 0.3, sheen: 0.25, scatter: 1.15, spacing: 0.32, defaultSize: 30, defaultOpacity: 52, defaultSoftness: 78 },
      [
        ['cumulo', 'Nube cúmulo', '#EFECE6', 0],
        ['cirros', 'Cirros altos', '#E4EAF0', 1, { scale: 1.35, defaultOpacity: 38 }],
        ['humo', 'Humo incienso', '#B6B2AC', 1, { defaultOpacity: 44, curl: 0.9 }],
        ['fuego', 'Llamas fuego', '#E86A28', 2, { sheen: 0.65, defaultOpacity: 74, contrast: 0.48 }],
        ['brasas', 'Brasas vivas', '#D44222', 2, { engine: 'sparkle', sheen: 0.72, defaultOpacity: 82 }],
        ['niebla', 'Niebla bosque', '#D4DDD8', 0, { defaultOpacity: 34, defaultSoftness: 92 }],
        ['vapor', 'Vapor suave', '#ECEFF2', 0, { defaultOpacity: 38, scale: 1.2 }],
        ['tormenta', 'Nube tormenta', '#68707A', 0, { contrast: 0.46, defaultOpacity: 62 }],
        ['aurora', 'Aurora boreal', '#62C8A4', 1, { sheen: 0.58, defaultOpacity: 48 }],
        ['rayoluz', 'Polvo en luz', '#F6E2B0', 1, { engine: 'sparkle', defaultOpacity: 52 }],
        ['chispas', 'Chispas fuego', '#F4A238', 2, { engine: 'sparkle', defaultOpacity: 88, defaultSize: 16 }],
        ['algodon', 'Nube algodón', '#F8F4EE', 0, { density: 1.25 }],
        ['bruma', 'Bruma dorada', '#E8C88E', 0, { defaultOpacity: 40 }],
        ['cenizaviva', 'Ceniza flotante', '#8A847E', 1, { engine: 'sand', defaultOpacity: 58 }],
        ['halosolar', 'Halo solar', '#FBE2A4', 2, { sheen: 0.72, defaultOpacity: 46 }],
      ]
    ),
  },
  {
    id: 'luz',
    label: 'Luz, Bokeh y Destellos',
    shortLabel: 'Luz',
    tint: '#FFF2C2',
    variations: COMMON_VARIATIONS.mineral,
    subtypes: makeSubtypes(
      'sparkle',
      { density: 1.0, scale: 1.0, curl: 0.3, contrast: 0.35, sheen: 0.85, scatter: 1.1, spacing: 0.45, defaultSize: 16, defaultOpacity: 90, defaultSoftness: 38 },
      [
        ['ocular', 'Destello ocular', '#FFFFFF', 0, { defaultSize: 9, scatter: 0.35, density: 0.6 }],
        ['estelar', 'Polvo estelar', '#FFF0B8', 1, { scatter: 1.35, density: 1.25 }],
        ['bokeh', 'Bokeh circular', '#F6D894', 2, { scale: 1.6, defaultOpacity: 52, defaultSize: 28 }],
        ['diamante', 'Brillo diamante', '#E8F6FF', 0, { sheen: 0.95 }],
        ['rayos', 'Rayos de luz', '#FFF4CE', 0, { scale: 1.45, defaultOpacity: 68 }],
        ['luciernagas', 'Luciérnagas', '#E8F28C', 2, { scatter: 1.4, defaultOpacity: 82 }],
        ['chispasoro', 'Chispas doradas', '#F6C654', 1, { density: 1.2 }],
        ['constelacion', 'Constelación', '#D8EAFF', 1, { scatter: 1.5, density: 0.85 }],
        ['humedo', 'Brillo húmedo', '#F4FBFF', 0, { defaultSize: 11, defaultOpacity: 78 }],
        ['cristal', 'Reflejo cristal', '#DFF2FC', 0, { scale: 1.15 }],
        ['cuatropuntas', 'Estrella 4 puntas', '#FFF7DA', 0, { scale: 1.3 }],
        ['hadas', 'Polvo de hadas', '#F6D0EE', 1, { scatter: 1.4, density: 1.3 }],
        ['aura', 'Aura luminosa', '#FFE8AE', 2, { scale: 1.5, defaultOpacity: 44, defaultSize: 26 }],
        ['escarchaluz', 'Escarcha brillo', '#E4F4FF', 1, { scale: 0.85, density: 1.35 }],
        ['lente', 'Destello lente', '#FFE2B8', 2, { scale: 1.4, defaultOpacity: 58 }],
      ]
    ),
  },
  {
    id: 'ornamento',
    label: 'Bordados y Detalles',
    shortLabel: 'Detalles',
    tint: '#E2B468',
    variations: COMMON_VARIATIONS.painterly,
    subtypes: makeSubtypes(
      'ornament',
      { density: 1.0, scale: 1.0, curl: 0.25, contrast: 0.36, sheen: 0.35, scatter: 0.55, spacing: 0.55, defaultSize: 14, defaultOpacity: 90, defaultSoftness: 18 },
      [
        ['pespunte', 'Pespunte fino', '#D8B07C', 0, { defaultSize: 10 }],
        ['cadena', 'Cadena crochet', '#E2BA78', 1, { defaultSize: 14 }],
        ['perlas', 'Perlas en hilera', '#F4ECE0', 2, { sheen: 0.78, defaultSize: 12 }],
        ['artdeco', 'Escamas art deco', '#D4A856', 1, { engine: 'scales', sheen: 0.54, defaultSize: 16 }],
        ['stippling', 'Punteado fino', '#4E3828', 3, { engine: 'sand', scale: 0.65, defaultSize: 14 }],
        ['grabado', 'Trama grabado', '#3E2E24', 3, { engine: 'graphite', defaultSize: 14 }],
        ['espiga', 'Espiga clásica', '#C89862', 1, { defaultSize: 15 }],
        ['cuerda', 'Cuerda trenzada', '#B88C58', 1, { defaultSize: 14, contrast: 0.44 }],
        ['puntilla', 'Encaje puntilla', '#F6EFE4', 2, { defaultSize: 16 }],
        ['estrellitas', 'Micro-estrellas', '#F6D47A', 3, { engine: 'sparkle', defaultSize: 12 }],
        ['laurel', 'Hojas laurel', '#689454', 1, { engine: 'botanical', defaultSize: 16 }],
        ['puntosluz', 'Puntos de luz', '#FFF4D2', 2, { sheen: 0.85, defaultSize: 10 }],
        ['lentejuelas', 'Lentejuelas', '#E8B85C', 2, { sheen: 0.82, defaultSize: 13 }],
        ['zigzag', 'Costura zigzag', '#D47B6A', 0, { defaultSize: 12 }],
        ['mosaico', 'Micro-mosaico', '#7EA4B8', 3, { engine: 'rock', scale: 0.78, defaultSize: 16 }],
      ]
    ),
  },
];

function buildCatalog(): {
  families: TextureFamilyMeta[];
  brushes: CatalogTextureBrush[];
  byId: Record<string, CatalogTextureBrush>;
  byFamily: Record<TextureFamilyId, CatalogTextureBrush[]>;
} {
  const families: TextureFamilyMeta[] = [];
  const brushes: CatalogTextureBrush[] = [];
  const byId: Record<string, CatalogTextureBrush> = {};
  const byFamily = {} as Record<TextureFamilyId, CatalogTextureBrush[]>;

  for (const fam of FAMILY_BLUEPRINTS) {
    const famList: CatalogTextureBrush[] = [];
    for (const sub of fam.subtypes) {
      for (const vari of fam.variations) {
        const id = `tex-${fam.id}-${sub.slug}-${vari.slug}` as BrushPresetId;
        const label = `${sub.name} · ${vari.name}`;
        const shortLabel = `${sub.name}`;
        const description = `${fam.label}: ${sub.name.toLowerCase()} (${vari.desc}).`;
        const item: CatalogTextureBrush = {
          id,
          familyId: fam.id,
          familyLabel: fam.label,
          shortLabel,
          label,
          description,
          tint: sub.tint,
          defaultSize: Math.round(clamp(sub.defaultSize * vari.sizeM, 3, 56)),
          defaultOpacity: Math.round(clamp(sub.defaultOpacity + vari.opacityAdd, 18, 100)),
          defaultSoftness: Math.round(clamp(sub.defaultSoftness + vari.softnessAdd, 5, 98)),
          params: {
            engine: sub.engine,
            seed: hashStr(id),
            density: clamp(sub.density * vari.densityM, 0.35, 2.2),
            scale: clamp(sub.scale * vari.scaleM, 0.4, 2.1),
            curl: clamp(sub.curl * vari.curlM, 0.05, 1.7),
            contrast: clamp(sub.contrast * vari.contrastM, 0.12, 0.75),
            sheen: clamp(sub.sheen + vari.sheenAdd, 0.0, 0.98),
            scatter: clamp(sub.scatter * vari.scatterM, 0.25, 1.65),
            spacing: clamp(sub.spacing * vari.spacingM, 0.14, 0.78),
            subMode: sub.subMode,
          },
        };
        brushes.push(item);
        famList.push(item);
        byId[id] = item;
      }
    }
    byFamily[fam.id] = famList;
    families.push({
      id: fam.id,
      label: fam.label,
      shortLabel: fam.shortLabel,
      tint: fam.tint,
      count: famList.length,
    });
  }

  return { families, brushes, byId, byFamily };
}

const BUILT = buildCatalog();

export const TEXTURE_FAMILIES: TextureFamilyMeta[] = BUILT.families;
export const CATALOG_TEXTURE_BRUSHES: CatalogTextureBrush[] = BUILT.brushes;
export const CATALOG_BRUSH_BY_ID: Record<string, CatalogTextureBrush> = BUILT.byId;
export const CATALOG_BRUSHES_BY_FAMILY: Record<TextureFamilyId, CatalogTextureBrush[]> =
  BUILT.byFamily;
export const TOTAL_TEXTURE_BRUSH_COUNT = CATALOG_TEXTURE_BRUSHES.length;
