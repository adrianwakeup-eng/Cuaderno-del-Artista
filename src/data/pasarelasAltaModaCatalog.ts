import type {
  DressingRoomCategory,
  DressingRoomGarment,
  GarmentSilhouetteKind,
  GarmentStitchPattern,
  RunwayColorGrade,
} from '../types/crochet';

const NOW_ISO = '2026-11-22T21:30:00.000Z';

export interface RunwayHouseEdition {
  id: string;
  shortLabel: string;
  houseName: string;
  city: string;
  inspiration: string;
  swatchHex: string;
  accentHex: string;
  grade: RunwayColorGrade;
  suffix: string;
}

/**
 * 6 pasarelas claramente diferenciadas (sin repeticiones cromáticas redundantes):
 * Original + 5 ediciones de alta moda de pasarelas internacionales.
 */
export const RUNWAY_HOUSE_EDITIONS: RunwayHouseEdition[] = [
  {
    id: 'original',
    shortLabel: 'Original',
    houseName: 'Atelier Fuentes Nazco',
    city: 'Colección Original HD',
    inspiration: 'Colores artesanales originales con máxima definición de punto y relieve crochet',
    swatchHex: '#E5CFA8',
    accentHex: '#B87A2B',
    grade: { hueDeg: 0, satScale: 1, lightScale: 1, contrastScale: 1, tintStrength: 0 },
    suffix: 'Original',
  },
  {
    id: 'milan',
    shortLabel: 'Milán',
    houseName: 'Milán · Espresso & Cashmere',
    city: 'Milán Fashion Week',
    inspiration: 'Paleta cálida estilo Bottega Veneta y Loro Piana en espresso, tabaco y avena',
    swatchHex: '#6A4732',
    accentHex: '#C59A62',
    grade: {
      hueDeg: -12,
      satScale: 0.84,
      lightScale: 0.96,
      contrastScale: 1.07,
      tintHex: '#8C6239',
      tintStrength: 0.28,
    },
    suffix: 'Ed. Milán',
  },
  {
    id: 'paris',
    shortLabel: 'París',
    houseName: 'París · Azul Noche Couture',
    city: 'Paris Fashion Week',
    inspiration: 'Sastrería tejida estilo Dior Men en azul índigo nocturno, pizarra y marfil',
    swatchHex: '#25395E',
    accentHex: '#94A6C9',
    grade: {
      hueDeg: 22,
      satScale: 0.94,
      lightScale: 0.97,
      contrastScale: 1.06,
      tintHex: '#244578',
      tintStrength: 0.3,
    },
    suffix: 'Ed. París',
  },
  {
    id: 'amalfi',
    shortLabel: 'Amalfi',
    houseName: 'Costa Amalfitana · Turquesa Resort',
    city: 'Capri & Positano',
    inspiration: 'Resort tejido estilo Missoni en turquesa mediterráneo, verde agua y arena solar',
    swatchHex: '#22828E',
    accentHex: '#E2B66A',
    grade: {
      hueDeg: 48,
      satScale: 1.15,
      lightScale: 1.02,
      contrastScale: 1.04,
      tintHex: '#1F8B96',
      tintStrength: 0.28,
    },
    suffix: 'Ed. Amalfi',
  },
  {
    id: 'nueva-york',
    shortLabel: 'Nueva York',
    houseName: 'Nueva York · Burdeos Heritage',
    city: 'NYFW · SoHo',
    inspiration: 'Patchwork de archivo estilo Bode en burdeos vino profundo, crudo y nogal',
    swatchHex: '#7A2538',
    accentHex: '#DFC5A0',
    grade: {
      hueDeg: -28,
      satScale: 1.04,
      lightScale: 0.95,
      contrastScale: 1.07,
      tintHex: '#8A233A',
      tintStrength: 0.3,
    },
    suffix: 'Ed. Nueva York',
  },
  {
    id: 'roma',
    shortLabel: 'Roma',
    houseName: 'Roma · Ónix & Grafito',
    city: 'Alta Moda Roma',
    inspiration: 'Contraste arquitectónico estilo Valentino y Fendi en grafito ónix y marfil',
    swatchHex: '#2A2C34',
    accentHex: '#C99C4A',
    grade: {
      hueDeg: 0,
      satScale: 0.28,
      lightScale: 0.89,
      contrastScale: 1.15,
      tintHex: '#2D303A',
      tintStrength: 0.3,
    },
    suffix: 'Ed. Roma',
  },
];

export interface StaticModelPose2D {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  flipX?: boolean;
  framing: 'full' | 'mid' | 'wide';
  overrideBaseSrc?: string;
  previewSrc: string;
  dressedOverrideSrc?: string;
}

export const RUNWAY_MODEL_POSES: StaticModelPose2D[] = [
  {
    id: 'frontal-pasarela',
    title: 'Frontal Pasarela',
    subtitle: 'Postura editorial clásica 2D de frente sobre la alfombra',
    badge: 'Clásica',
    framing: 'full',
    previewSrc: '/vestidor/coleccion/camisa-guayabera-terracota-modelo.webp',
  },
  {
    id: 'contraposto-espejo',
    title: 'Contraposto Editorial',
    subtitle: 'Balance espejado para variar la caída y el ritmo del look',
    badge: 'Espejo 2D',
    flipX: true,
    framing: 'full',
    previewSrc: '/vestidor/coleccion/camisa-botanica-marino-oro-modelo.webp',
  },
  {
    id: 'manos-bolsillos',
    title: 'Manos en Bolsillos',
    subtitle: 'Actitud relajada de campaña resort y pasarela masculina',
    badge: 'Campaña',
    framing: 'full',
    overrideBaseSrc: '/vestidor/poses/cardigan-girasoles-shorts-verdes/manos-en-bolsillos.png',
    dressedOverrideSrc: '/vestidor/poses/cardigan-girasoles-shorts-verdes/manos-en-bolsillos.png',
    previewSrc: '/vestidor/poses/cardigan-girasoles-shorts-verdes/manos-en-bolsillos.png',
  },
  {
    id: 'editorial-torso',
    title: 'Plano Medio Tejido',
    subtitle: 'Encuadre cercano en alta resolución que resalta el punto crochet',
    badge: 'Detalle',
    framing: 'mid',
    previewSrc: '/vestidor/coleccion/pulover-polo-salvia-modelo.webp',
  },
  {
    id: 'lookbook-amplio',
    title: 'Cuerpo Entero Lookbook',
    subtitle: 'Proporción estilizada de catálogo de alta moda',
    badge: 'Lookbook',
    framing: 'wide',
    previewSrc: '/vestidor/coleccion/enguatada-patchwork-capucha-modelo.webp',
  },
  {
    id: 'perfil-izquierdo',
    title: 'Perfil Izquierdo',
    subtitle: 'Silueta lateral oficial en 2D para estudio de caída',
    badge: 'Perfil',
    framing: 'full',
    overrideBaseSrc: '/vestidor/modelo-oficial/perfil-izquierdo.png?v=hd4',
    previewSrc: '/vestidor/modelo-oficial/perfil-izquierdo.png?v=hd4',
  },
  {
    id: 'perfil-derecho',
    title: 'Perfil Derecho',
    subtitle: 'Silueta lateral contraria en 2D oficial',
    badge: 'Perfil',
    framing: 'full',
    overrideBaseSrc: '/vestidor/modelo-oficial/perfil-derecho.png?v=hd4',
    previewSrc: '/vestidor/modelo-oficial/perfil-derecho.png?v=hd4',
  },
  {
    id: 'espalda-editorial',
    title: 'Vista Espalda',
    subtitle: 'Toma trasera oficial 2D para diseñar espaldas y mangas',
    badge: 'Espalda',
    framing: 'full',
    overrideBaseSrc: '/vestidor/modelo-oficial/espalda.png?v=hd4',
    previewSrc: '/vestidor/modelo-oficial/espalda.png?v=hd4',
  },
];

interface BaseGarmentBlueprint {
  slug: string;
  modelSlug: string;
  name: string;
  category: DressingRoomCategory;
  slot: 'top' | 'bottom';
  silhouette: GarmentSilhouetteKind;
  stitch: GarmentStitchPattern;
  subtitle: string;
  fiber: string;
  hookSizeMm: string;
  stitchNote: string;
  palette: string[];
  accentColor: string;
  colorIds: string[];
  tags: string[];
  favorite?: boolean;
}

/**
 * 23 prendas ÚNICAS en Ultra-HD (960×1620 modelos / 640×760 miniaturas Retina),
 * sin duplicados ni recortes borrosos, cubriendo las 7 categorías completas.
 */
const BASE_BLUEPRINTS: BaseGarmentBlueprint[] = [
  // ======================== CAMISAS (4) ========================
  {
    slug: 'camisa-guayabera-terracota',
    modelSlug: 'camisa-guayabera-terracota',
    name: 'Camisa Guayabera Rombos',
    category: 'Camisas',
    slot: 'top',
    silhouette: 'polo',
    stitch: 'argyle',
    subtitle: 'Cuello camp calado marfil con columnas de rombos en terracota, salvia y mostaza',
    fiber: 'Algodón mercerizado peinado 100%',
    hookSizeMm: '3.5 mm',
    stitchNote: 'Red calada de rombos con medallones granny y botones de madera',
    palette: ['#F2E6D0', '#B85A34', '#5B7C59', '#D89E28'],
    accentColor: '#B85A34',
    colorIds: ['crema', 'terracota', 'oliva', 'girasol'],
    tags: ['Guayabera', 'Calado', 'Rombos'],
    favorite: true,
  },
  {
    slug: 'camisa-botanica-marino-oro',
    modelSlug: 'camisa-botanica-marino-oro',
    name: 'Camisa Botánica Girasoles',
    category: 'Camisas',
    slot: 'top',
    silhouette: 'polo',
    stitch: 'jacquard',
    subtitle: 'Manga corta calada azul marino con cuatro girasoles dorados y ribete mostaza',
    fiber: 'Algodón orgánico hilado mate',
    hookSizeMm: '3.5 mm',
    stitchNote: 'Cuadros botánicos de girasol integrados sobre malla diamante',
    palette: ['#1C3052', '#D99B26', '#F3E7CE'],
    accentColor: '#D99B26',
    colorIds: ['marino', 'girasol', 'crema'],
    tags: ['Girasol', 'Botánica', 'Pasarela'],
    favorite: true,
  },
  {
    slug: 'camisa-cuadros-salvia-crema',
    modelSlug: 'camisa-cuadros-salvia-crema',
    name: 'Camisa Calada Flor de Salvia',
    category: 'Camisas',
    slot: 'top',
    silhouette: 'polo',
    stitch: 'jacquard',
    subtitle: 'Camisa abotonada de encaje marfil con cuatro paneles florales en salvia',
    fiber: 'Algodón peinado transpirable',
    hookSizeMm: '3.0 mm',
    stitchNote: 'Encaje de abanicos con medallones florales artesanales',
    palette: ['#EFE2C8', '#6B8869', '#8A6741'],
    accentColor: '#6B8869',
    colorIds: ['crema', 'oliva', 'arena'],
    tags: ['Calado', 'Salvia', 'Resort'],
  },
  {
    slug: 'camisa-bloques-marino-crema',
    modelSlug: 'camisa-bloques-marino-crema',
    name: 'Camisa Bloques Granny Riviera',
    category: 'Camisas',
    slot: 'top',
    silhouette: 'polo',
    stitch: 'striped',
    subtitle: 'Franjas caladas en azul marino alternadas con paneles granny en crudo',
    fiber: 'Algodón natural de 4 cabos',
    hookSizeMm: '3.5 mm',
    stitchNote: 'Alternancia de franjas caladas y cuadros granny',
    palette: ['#1B3054', '#EFE1C6', '#2F466E'],
    accentColor: '#1B3054',
    colorIds: ['marino', 'crema', 'cobalto'],
    tags: ['Bloques', 'Granny', 'Riviera'],
  },

  // ======================== PULÓVERES (4) ========================
  {
    slug: 'pulover-polo-salvia',
    modelSlug: 'pulover-polo-salvia',
    name: 'Pulóver Polo Chevron Calado',
    category: 'Pulóveres',
    slot: 'top',
    silhouette: 'polo',
    stitch: 'chevron',
    subtitle: 'Pulóver manga corta cuello polo abierto en V con franjas chevron salvia',
    fiber: 'Algodón orgánico ligero',
    hookSizeMm: '3.5 mm',
    stitchNote: 'Chevron en relieve combinado con franjas transpirables',
    palette: ['#7C9776', '#F1E3C9', '#CFA030'],
    accentColor: '#7C9776',
    colorIds: ['oliva', 'crema', 'girasol'],
    tags: ['Pulóver', 'Polo', 'Chevron'],
    favorite: true,
  },
  {
    slug: 'pulover-sueter-rayas',
    modelSlug: 'pulover-sueter-rayas',
    name: 'Pulóver Suéter Rayas en Relieve',
    category: 'Pulóveres',
    slot: 'top',
    silhouette: 'sweater',
    stitch: 'striped',
    subtitle: 'Suéter manga larga cuello redondo con bandas en punto popcorn y musgo',
    fiber: 'Algodón peinado grueso + bambú',
    hookSizeMm: '4.5 mm',
    stitchNote: 'Bandas multicolores con textura tridimensional artesanal',
    palette: ['#1E3254', '#EFE2C8', '#2E5B32', '#B55732'],
    accentColor: '#1E3254',
    colorIds: ['marino', 'crema', 'bosque', 'terracota'],
    tags: ['Pulóver', 'Rayas', 'Relieve'],
    favorite: true,
  },
  {
    slug: 'pulover-rayas-mostaza-crema',
    modelSlug: 'pulover-rayas-mostaza-crema',
    name: 'Pulóver Panal Rayas Doradas',
    category: 'Pulóveres',
    slot: 'top',
    silhouette: 'sweater',
    stitch: 'honeycomb',
    subtitle: 'Suéter clásico en punto panal a rayas anchas mostaza dorado y crema',
    fiber: 'Algodón cardado suave',
    hookSizeMm: '4.5 mm',
    stitchNote: 'Punto panal tupido con elástico ancho en cuello y puños',
    palette: ['#D29524', '#F1E4CA'],
    accentColor: '#D29524',
    colorIds: ['girasol', 'crema', 'arena'],
    tags: ['Pulóver', 'Panal', 'Rayas'],
  },
  {
    slug: 'pulover-calado-crema-corto',
    modelSlug: 'pantalon-cargo-marino-ocre',
    name: 'Pulóver Manga Corta Calado Red',
    category: 'Pulóveres',
    slot: 'top',
    silhouette: 'polo',
    stitch: 'ribbed',
    subtitle: 'Pulóver cuello redondo en columnas verticales caladas con ribete bicolor',
    fiber: 'Algodón egipcio 100%',
    hookSizeMm: '3.0 mm',
    stitchNote: 'Columnas verticales caladas muy frescas',
    palette: ['#F2E6CE', '#5E7C63', '#1E3456'],
    accentColor: '#5E7C63',
    colorIds: ['crema', 'oliva', 'marino'],
    tags: ['Pulóver', 'Calado', 'Verano'],
  },

  // ======================== ENGUATADAS (3) ========================
  {
    slug: 'enguatada-patchwork-capucha',
    modelSlug: 'enguatada-patchwork-capucha',
    name: 'Enguatada Patchwork con Capucha',
    category: 'Enguatadas',
    slot: 'top',
    silhouette: 'hoodie',
    stitch: 'jacquard',
    subtitle: 'Sudadera gruesa con capucha y bolsillo canguro en bloques artesanales',
    fiber: 'Mezcla algodón-merino de alto relieve',
    hookSizeMm: '5.0 mm',
    stitchNote: 'Patchwork en punto alto tupido y cordón trenzado con borlas',
    palette: ['#4D6134', '#DCA024', '#AF5330', '#EFE0C2'],
    accentColor: '#DCA024',
    colorIds: ['oliva', 'girasol', 'terracota', 'crema'],
    tags: ['Enguatada', 'Capucha', 'Patchwork'],
    favorite: true,
  },
  {
    slug: 'enguatada-bosque-girasoles',
    modelSlug: 'enguatada-bosque-girasoles',
    name: 'Enguatada Cremallera & Girasoles',
    category: 'Enguatadas',
    slot: 'top',
    silhouette: 'hoodie',
    stitch: 'ribbed',
    subtitle: 'Chaqueta con capucha y cremallera acanalada con mangas de girasoles',
    fiber: 'Algodón grueso peinado',
    hookSizeMm: '5.0 mm',
    stitchNote: 'Cuerpo acanalado vertical + mangas con cuadros granny',
    palette: ['#4D724B', '#F2E5CC', '#DCA228'],
    accentColor: '#4D724B',
    colorIds: ['bosque', 'crema', 'girasol'],
    tags: ['Enguatada', 'Cremallera', 'Capucha'],
    favorite: true,
  },
  {
    slug: 'enguatada-bomber-oliva-mostaza',
    modelSlug: 'enguatada-bomber-oliva-mostaza',
    name: 'Enguatada Bomber Oliva & Oro',
    category: 'Enguatadas',
    slot: 'top',
    silhouette: 'jacket',
    stitch: 'waffle',
    subtitle: 'Chaqueta bomber tejida en bloques verde oliva y mostaza con cuello elástico',
    fiber: 'Algodón peinado grueso',
    hookSizeMm: '5.0 mm',
    stitchNote: 'Bloques en relieve y puños acanalados de estructura bomber',
    palette: ['#48592C', '#DFAA28', '#EFE2C8'],
    accentColor: '#48592C',
    colorIds: ['oliva', 'girasol', 'bosque'],
    tags: ['Bomber', 'Enguatada', 'Bloques'],
  },

  // ======================== CÁRDIGANS (2) ========================
  {
    slug: 'cardigan-patchwork-marino',
    modelSlug: 'cardigan-patchwork-marino',
    name: 'Cárdigan Damero Patchwork',
    category: 'Cárdigans',
    slot: 'top',
    silhouette: 'cardigan',
    stitch: 'waffle',
    subtitle: 'Chaqueta abotonada en damero crochet marino y terracota con botones madera',
    fiber: 'Algodón rústico de alto gramaje',
    hookSizeMm: '4.5 mm',
    stitchNote: 'Damero geométrico en punto gofre tupido',
    palette: ['#1A2D4E', '#B15430', '#5E3820'],
    accentColor: '#B15430',
    colorIds: ['marino', 'terracota', 'cacao'],
    tags: ['Cárdigan', 'Damero', 'Patchwork'],
    favorite: true,
  },
  {
    slug: 'flagship-girasoles',
    modelSlug: 'flagship-girasoles',
    name: 'Cárdigan Atelier Girasoles',
    category: 'Cárdigans',
    slot: 'top',
    silhouette: 'cardigan',
    stitch: 'jacquard',
    subtitle: 'Pieza insignia de la colección con girasoles artesanales y cuello verde',
    fiber: 'Algodón mercerizado premium',
    hookSizeMm: '3.5 mm',
    stitchNote: 'Cuadros girasol en alto relieve sobre base calada crema',
    palette: ['#F2E2C4', '#235A2A', '#F0B41C'],
    accentColor: '#F0B41C',
    colorIds: ['crema', 'bosque', 'girasol'],
    tags: ['Insignia', 'Girasol', 'Cárdigan'],
    favorite: true,
  },

  // ======================== CHALECOS (2) ========================
  {
    slug: 'chaleco-rombos-crema',
    modelSlug: 'chaleco-rombos-crema',
    name: 'Chaleco Artesanal Rombos',
    category: 'Chalecos',
    slot: 'top',
    silhouette: 'vest',
    stitch: 'argyle',
    subtitle: 'Chaleco abotonado crema con grecas de rombos en bosque y terracota',
    fiber: 'Algodón orgánico natural',
    hookSizeMm: '3.5 mm',
    stitchNote: 'Franjas caladas combinadas con tapiz de rombos artesanales',
    palette: ['#F2E6D0', '#385C3A', '#B55732'],
    accentColor: '#385C3A',
    colorIds: ['crema', 'bosque', 'terracota'],
    tags: ['Chaleco', 'Rombos', 'Abotonado'],
    favorite: true,
  },
  {
    slug: 'chaleco-calado-marfil',
    modelSlug: 'pantalon-bosque-granny',
    name: 'Chaleco Malla Calada Marfil',
    category: 'Chalecos',
    slot: 'top',
    silhouette: 'vest',
    stitch: 'honeycomb',
    subtitle: 'Sin mangas minimalista en malla crochet geométrica de verano',
    fiber: 'Algodón egipcio mercerizado',
    hookSizeMm: '3.0 mm',
    stitchNote: 'Malla calada regular con terminación en punto cangrejo',
    palette: ['#F4E8D2', '#DFCCA8'],
    accentColor: '#D8BC94',
    colorIds: ['crema', 'arena'],
    tags: ['Chaleco', 'Calado', 'Minimal'],
  },

  // ======================== SHORTS (3) ========================
  {
    slug: 'shorts-cargo-bosque',
    modelSlug: 'pulover-rayas-mostaza-crema',
    name: 'Shorts Cargo Crochet Bosque',
    category: 'Shorts',
    slot: 'bottom',
    silhouette: 'shorts',
    stitch: 'waffle',
    subtitle: 'Shorts tejidos tupidos en verde bosque con bolsillos cargo y cordón crudo',
    fiber: 'Algodón trenzado resistente',
    hookSizeMm: '4.0 mm',
    stitchNote: 'Punto musgo tupido con solapas y botones de madera',
    palette: ['#244C2A', '#F1E4CA'],
    accentColor: '#244C2A',
    colorIds: ['bosque', 'crema', 'oliva'],
    tags: ['Shorts', 'Cargo', 'Cordón'],
    favorite: true,
  },
  {
    slug: 'shorts-calados-crema',
    modelSlug: 'enguatada-bomber-oliva-mostaza',
    name: 'Shorts Calados Resort Arena',
    category: 'Shorts',
    slot: 'bottom',
    silhouette: 'shorts',
    stitch: 'honeycomb',
    subtitle: 'Shorts veraniegos en punto abanico calado con cordón trenzado y borlas',
    fiber: 'Algodón orgánico fresco',
    hookSizeMm: '3.5 mm',
    stitchNote: 'Abanicos geométricos con cintura elástica reforzada',
    palette: ['#E6D4B8', '#F4E8D4'],
    accentColor: '#D8BC94',
    colorIds: ['crema', 'arena'],
    tags: ['Shorts', 'Calado', 'Resort'],
  },
  {
    slug: 'shorts-oliva-textura',
    modelSlug: 'cardigan-patchwork-marino',
    name: 'Shorts Espiga Oliva Atelier',
    category: 'Shorts',
    slot: 'bottom',
    silhouette: 'shorts',
    stitch: 'waffle',
    subtitle: 'Shorts en punto espiga verde oliva musgo con cordón marfil contrastado',
    fiber: 'Algodón peinado de 4 cabos',
    hookSizeMm: '4.0 mm',
    stitchNote: 'Textura densa en espiga con caída limpia',
    palette: ['#5A6636', '#EFE2C8'],
    accentColor: '#5A6636',
    colorIds: ['oliva', 'crema', 'bosque'],
    tags: ['Shorts', 'Espiga', 'Oliva'],
  },

  // ======================== PANTALONES (5) ========================
  {
    slug: 'pantalon-bosque-granny',
    modelSlug: 'pantalon-bosque-granny',
    name: 'Pantalón Recto Bandas Granny',
    category: 'Pantalones',
    slot: 'bottom',
    silhouette: 'trousers',
    stitch: 'jacquard',
    subtitle: 'Pantalón recto verde bosque con tiras laterales de medallones granny',
    fiber: 'Algodón estructurado de alta densidad',
    hookSizeMm: '4.0 mm',
    stitchNote: 'Caída recta artesanal con franjas laterales de mini cuadros granny',
    palette: ['#244F34', '#F2E5CC', '#D69A24', '#B55B34'],
    accentColor: '#244F34',
    colorIds: ['bosque', 'crema', 'girasol', 'terracota'],
    tags: ['Pantalón', 'Granny', 'Pasarela'],
    favorite: true,
  },
  {
    slug: 'pantalon-cargo-marino-ocre',
    modelSlug: 'pantalon-cargo-marino-ocre',
    name: 'Pantalón Cargo Ribete Dorado',
    category: 'Pantalones',
    slot: 'bottom',
    silhouette: 'joggers',
    stitch: 'ribbed',
    subtitle: 'Pantalón cargo crochet marino con bolsillos 3D ribeteados en oro y botones',
    fiber: 'Algodón grueso de doble torsión',
    hookSizeMm: '4.5 mm',
    stitchNote: 'Acanalado vertical tupido con bolsillos cargo en relieve',
    palette: ['#182C50', '#C9942E', '#F2E5CC'],
    accentColor: '#182C50',
    colorIds: ['marino', 'girasol', 'crema'],
    tags: ['Pantalón', 'Cargo', 'Ribete'],
    favorite: true,
  },
  {
    slug: 'pantalon-marino-franja-crema',
    modelSlug: 'chaleco-rombos-crema',
    name: 'Pantalón Sastre Franja Lateral',
    category: 'Pantalones',
    slot: 'bottom',
    silhouette: 'tailored-pants',
    stitch: 'striped',
    subtitle: 'Pantalón fluido recto marino con galón lateral tejido en crema crudo',
    fiber: 'Algodón mercerizado suave',
    hookSizeMm: '4.0 mm',
    stitchNote: 'Silueta recta estilizada con banda lateral en contraste',
    palette: ['#182B4C', '#EFE2C8'],
    accentColor: '#182B4C',
    colorIds: ['marino', 'crema'],
    tags: ['Pantalón', 'Sastre', 'Franja'],
  },
  {
    slug: 'pantalon-terracota-acanalado',
    modelSlug: 'pulover-polo-salvia',
    name: 'Pantalón Acanalado Terracota',
    category: 'Pantalones',
    slot: 'bottom',
    silhouette: 'trousers',
    stitch: 'ribbed',
    subtitle: 'Pantalón entallado en canalé vertical terracota con cordón marfil',
    fiber: 'Algodón natural peinado',
    hookSizeMm: '4.0 mm',
    stitchNote: 'Canales verticales continuos que estilizan la figura',
    palette: ['#A64928', '#F2E5CE'],
    accentColor: '#A64928',
    colorIds: ['terracota', 'crema', 'cacao'],
    tags: ['Pantalón', 'Acanalado', 'Terracota'],
    favorite: true,
  },
  {
    slug: 'pantalon-cargo-camel',
    modelSlug: 'pulover-sueter-rayas',
    name: 'Pantalón Cargo Arena Camel',
    category: 'Pantalones',
    slot: 'bottom',
    silhouette: 'trousers',
    stitch: 'waffle',
    subtitle: 'Pantalón cargo en punto granulado arena camel con solapas abotonadas',
    fiber: 'Algodón grueso rústico',
    hookSizeMm: '4.5 mm',
    stitchNote: 'Tejido texturizado resistente con bolsillos cargo funcionales',
    palette: ['#B88D56', '#F2E6D0'],
    accentColor: '#B88D56',
    colorIds: ['arena', 'cacao', 'crema'],
    tags: ['Pantalón', 'Cargo', 'Camel'],
  },
];

const EDITION_BY_ID = new Map(RUNWAY_HOUSE_EDITIONS.map((e) => [e.id, e]));

/**
 * Genera 138 diseños Ultra-HD curados sin duplicados (23 prendas únicas × 6 pasarelas bien diferenciadas),
 * cada una con silueta 960×1620, miniatura Retina 640×760 y máscara de tejido para respetar 100% la piel.
 */
export function buildPasarelasAltaModaCatalog(): DressingRoomGarment[] {
  const result: DressingRoomGarment[] = [];
  let order = 0;

  for (const edition of RUNWAY_HOUSE_EDITIONS) {
    for (const bp of BASE_BLUEPRINTS) {
      const isOriginal = edition.id === 'original';
      const id = isOriginal ? `fn-col-${bp.slug}` : `fn-runway-${edition.id}-${bp.slug}`;
      const displayName = isOriginal ? bp.name : `${bp.name} · ${edition.shortLabel}`;
      const thumbPath = `/vestidor/coleccion/${bp.slug}-thumb.webp`;
      const modelPath = `/vestidor/coleccion/${bp.modelSlug}-modelo.webp`;
      const maskPath = `/vestidor/coleccion/${bp.modelSlug}-mask.webp`;

      result.push({
        id,
        name: displayName,
        category: bp.category,
        garmentSlot: bp.slot,
        silhouetteKind: bp.silhouette,
        stitchPattern: bp.stitch,
        eyebrow: `${edition.houseName} · ${edition.city}`,
        subtitle: isOriginal ? bp.subtitle : `${bp.subtitle} — ${edition.inspiration}`,
        fiber: bp.fiber,
        hookSizeMm: bp.hookSizeMm,
        stitchNote: bp.stitchNote,
        palette: isOriginal
          ? bp.palette
          : [edition.swatchHex, edition.accentHex, ...bp.palette.slice(0, 2)],
        accentColor: isOriginal ? bp.accentColor : edition.swatchHex,
        photoDataUrl: thumbPath,
        garmentViews: { front: thumbPath },
        modelViews: { front: modelPath },
        garmentMaskUrl: maskPath,
        runwayHouseId: edition.id,
        runwayHouseName: edition.houseName,
        runwayColorGrade: isOriginal ? undefined : edition.grade,
        availableColorIds: bp.colorIds,
        favorite: isOriginal ? Boolean(bp.favorite) : false,
        tags: [...bp.tags, edition.shortLabel],
        sortOrder: order++,
        techSheet: {
          stitchType: bp.stitchNote,
          yarnWeight: 'Artesanal Pasarela HD',
          materials: bp.fiber,
          hookSize: bp.hookSizeMm,
          craftingNotes: `${edition.houseName} (${edition.city}): ${edition.inspiration}.`,
        },
        createdAt: NOW_ISO,
        updatedAt: NOW_ISO,
      });
    }
  }

  return result;
}

export const PASARELAS_ALTA_MODA_CATALOG: DressingRoomGarment[] = buildPasarelasAltaModaCatalog();

export function getRunwayEditionById(id?: string): RunwayHouseEdition | undefined {
  return id ? EDITION_BY_ID.get(id) : undefined;
}
