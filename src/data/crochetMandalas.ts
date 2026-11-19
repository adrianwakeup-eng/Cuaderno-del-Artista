export type MandalaCenterStyle = 'flower' | 'star' | 'ring' | 'sun' | 'spiral' | 'puff-flower';
export type MandalaRing2Style = 'petals' | 'spokes' | 'tulips' | 'chevron' | 'braid' | 'clusters';
export type MandalaMidLayer =
  | 'arches'
  | 'shells'
  | 'diamonds'
  | 'leaves'
  | 'popcorns'
  | 'lattice'
  | 'pineapples'
  | 'fans';
export type MandalaRing4Style =
  | 'chain-lace'
  | 'beads'
  | 'spikes'
  | 'v-stitch'
  | 'waves'
  | 'double-arch';
export type MandalaOuterBorder =
  | 'picot'
  | 'scallop'
  | 'pointed'
  | 'fan'
  | 'beaded'
  | 'lotus'
  | 'crown'
  | 'triple-picot';

export type MandalaDesignKind = 'mandala' | 'atrapasuenos' | 'espiral' | 'estrella';
export type DreamcatcherWebStyle =
  | 'sacred-star'
  | 'lotus-web'
  | 'spiral-web'
  | 'double-web'
  | 'peacock-web'
  | 'celtic-web';

export interface CrochetMandalaDef {
  id: string;
  name: string;
  kind: MandalaDesignKind;
  rounds: number;
  hookMm: string;
  yarnWeight: string;
  yarnNote: string;
  paletteName: string;
  petals: 6 | 8 | 10 | 12 | 14 | 16;
  centerStyle: MandalaCenterStyle;
  ring2Style: MandalaRing2Style;
  midLayer: MandalaMidLayer;
  ring4Style: MandalaRing4Style;
  outerBorder: MandalaOuterBorder;
  webStyle?: DreamcatcherWebStyle;
  featherCount?: 3 | 5 | 7;
  spiralDirection?: 1 | -1;
  palette: [string, string, string, string, string, string];
  primaryColor: string;
  accentColor: string;
}

interface YarnPaletteDef {
  name: string;
  colors: [string, string, string, string, string, string];
}

const YARN_PALETTES: YarnPaletteDef[] = [
  {
    name: 'Atardecer Marroquí',
    colors: ['#9B1D30', '#D9532F', '#ECA427', '#1F8A8C', '#243B6B', '#F4C95D'],
  },
  {
    name: 'Jardín Botánico',
    colors: ['#D64550', '#E07A5F', '#F2CC8F', '#4E8C6F', '#235347', '#F4A261'],
  },
  {
    name: 'Fiesta Boho',
    colors: ['#C9184A', '#FF7518', '#F7B801', '#00A896', '#3A0CA3', '#FF4D6D'],
  },
  {
    name: 'Océano y Coral',
    colors: ['#0A369D', '#1D70A2', '#2EC4B6', '#FF6B6B', '#F4A261', '#5E60CE'],
  },
  {
    name: 'Lavanda Real',
    colors: ['#5E2B7A', '#9D4EDD', '#E06D94', '#F4A259', '#3B7A57', '#C77DFF'],
  },
  {
    name: 'Primavera Floral',
    colors: ['#E63946', '#F4845F', '#F7B267', '#52B788', '#457B9D', '#FF70A6'],
  },
  {
    name: 'Otoño Dorado',
    colors: ['#7F1D1D', '#B93815', '#D97706', '#CA8A04', '#4D7C0F', '#9A3412'],
  },
  {
    name: 'Turquesa Azteca',
    colors: ['#0F766E', '#14B8A6', '#F59E0B', '#DC2626', '#1E3A8A', '#EA580C'],
  },
  {
    name: 'Rosa Antiguo',
    colors: ['#881337', '#BE123C', '#FB7185', '#D97706', '#3F6212', '#9F1239'],
  },
  {
    name: 'Bosque Encantado',
    colors: ['#14532D', '#15803D', '#65A30D', '#EAB308', '#B45309', '#0D9488'],
  },
  {
    name: 'Vitral Mediterráneo',
    colors: ['#1D4ED8', '#0284C7', '#059669', '#D97706', '#B91C1C', '#7C3AED'],
  },
  {
    name: 'Cítrico Tropical',
    colors: ['#EA580C', '#F59E0B', '#84CC16', '#06B6D4', '#E11D48', '#8B5CF6'],
  },
  {
    name: 'Noche Estrellada',
    colors: ['#1E1B4B', '#312E81', '#0369A1', '#D97706', '#F59E0B', '#BE185D'],
  },
  {
    name: 'Amapola y Trigo',
    colors: ['#B91C1C', '#EA580C', '#CA8A04', '#65A30D', '#365314', '#E11D48'],
  },
  {
    name: 'Pavo Real',
    colors: ['#164E63', '#0E7490', '#059669', '#4F46E5', '#D97706', '#0D9488'],
  },
  {
    name: 'Frambuesa y Menta',
    colors: ['#9D174D', '#DB2777', '#F472B6', '#10B981', '#047857', '#F59E0B'],
  },
  {
    name: 'Terracota Viva',
    colors: ['#7C2D12', '#C2410C', '#EA580C', '#0F766E', '#CA8A04', '#991B1B'],
  },
  {
    name: 'Jardín de Verbena',
    colors: ['#6D28D9', '#A855F7', '#EC4899', '#14B8A6', '#15803D', '#F59E0B'],
  },
  {
    name: 'Sol de Andalucía',
    colors: ['#B45309', '#D97706', '#F59E0B', '#DC2626', '#1D4ED8', '#047857'],
  },
  {
    name: 'Especias de Oriente',
    colors: ['#7F1D1D', '#B45309', '#D97706', '#0F766E', '#581C87', '#E11D48'],
  },
  {
    name: 'Acuarela Marina',
    colors: ['#0C4A6E', '#0284C7', '#38BDF8', '#2DD4BF', '#FB7185', '#FBBF24'],
  },
  {
    name: 'Dalia Mexicana',
    colors: ['#BE185D', '#E11D48', '#F97316', '#EAB308', '#16A34A', '#2563EB'],
  },
  {
    name: 'Camelia y Salvia',
    colors: ['#881337', '#E11D48', '#FDA4AF', '#4D7C0F', '#15803D', '#CA8A04'],
  },
  {
    name: 'Caleidoscopio Real',
    colors: ['#4338CA', '#7C3AED', '#DB2777', '#EA580C', '#059669', '#D97706'],
  },
];

// Dedicated lush Blue & Green predominant palettes for Dreamcatchers, Spirals & Stars
const BLUE_GREEN_PALETTES: YarnPaletteDef[] = [
  {
    name: 'Zafiro y Esmeralda',
    colors: ['#0D47A1', '#1565C0', '#00897B', '#26A69A', '#0288D1', '#4DB6AC'],
  },
  {
    name: 'Turquesa del Caribe',
    colors: ['#006064', '#00838F', '#00ACC1', '#26C6DA', '#00796B', '#80CBC4'],
  },
  {
    name: 'Bosque de Jade',
    colors: ['#1B5E20', '#2E7D32', '#00695C', '#0277BD', '#43A047', '#4DD0E1'],
  },
  {
    name: 'Cobalto y Menta',
    colors: ['#1E3A8A', '#2563EB', '#10B981', '#059669', '#38BDF8', '#34D399'],
  },
  {
    name: 'Aurora Boreal',
    colors: ['#0F172A', '#0369A1', '#0D9488', '#10B981', '#06B6D4', '#22D3EE'],
  },
  {
    name: 'Lapislázuli y Malaquita',
    colors: ['#1D4ED8', '#0F766E', '#047857', '#0284C7', '#15803D', '#2DD4BF'],
  },
  {
    name: 'Aguamarina Serena',
    colors: ['#0E7490', '#06B6D4', '#14B8A6', '#0D9488', '#3B82F6', '#6EE7B7'],
  },
  {
    name: 'Mar Profundo',
    colors: ['#0C4A6E', '#075985', '#0369A1', '#0F766E', '#115E59', '#38BDF8'],
  },
  {
    name: 'Pavo Real Realzado',
    colors: ['#164E63', '#0E7490', '#059669', '#1D4ED8', '#14B8A6', '#10B981'],
  },
  {
    name: 'Salvia y Celeste',
    colors: ['#0369A1', '#0284C7', '#15803D', '#22C55E', '#0D9488', '#60A5FA'],
  },
  {
    name: 'Laguna Azul',
    colors: ['#1E40AF', '#0284C7', '#06B6D4', '#0D9488', '#059669', '#5EEAD4'],
  },
  {
    name: 'Selva Esmeralda',
    colors: ['#064E3B', '#065F46', '#047857', '#0E7490', '#1D4ED8', '#34D399'],
  },
  {
    name: 'Índigo Botánico',
    colors: ['#312E81', '#1D4ED8', '#0F766E', '#15803D', '#0284C7', '#2DD4BF'],
  },
  {
    name: 'Hielo y Pino',
    colors: ['#0284C7', '#38BDF8', '#065F46', '#059669', '#0369A1', '#6EE7B7'],
  },
  {
    name: 'Oasis Azul',
    colors: ['#0A369D', '#1D70A2', '#2EC4B6', '#047857', '#0EA5E9', '#10B981'],
  },
  {
    name: 'Verdemar Imperial',
    colors: ['#115E59', '#0D9488', '#14B8A6', '#1E3A8A', '#2563EB', '#A7F3D0'],
  },
];

const BASE_LEGACY_MANDALAS: Array<{
  id: string;
  name: string;
  rounds: number;
  hookMm: string;
  yarnNote: string;
  petals: 6 | 8 | 10 | 12 | 16;
  centerStyle: MandalaCenterStyle;
  midLayer: MandalaMidLayer;
  outerBorder: MandalaOuterBorder;
}> = [
  { id: 'mandala-loto-borgona', name: 'Loto Borgoña', rounds: 8, hookMm: '2.25 mm', yarnNote: '8 pétalos calados con borde picot', petals: 8, centerStyle: 'flower', midLayer: 'arches', outerBorder: 'picot' },
  { id: 'mandala-sol-dorado', name: 'Sol de Ganchillo', rounds: 10, hookMm: '2.5 mm', yarnNote: 'Centro solar de 12 puntas y abanicos', petals: 12, centerStyle: 'sun', midLayer: 'diamonds', outerBorder: 'pointed' },
  { id: 'mandala-roseton-bosque', name: 'Rosetón del Bosque', rounds: 7, hookMm: '2.5 mm', yarnNote: 'Hojas en relieve sobre malla de cadenetas', petals: 8, centerStyle: 'ring', midLayer: 'leaves', outerBorder: 'scallop' },
  { id: 'mandala-estrella-indigo', name: 'Estrella Índigo', rounds: 9, hookMm: '2.0 mm', yarnNote: 'Estrella de 6 puntas y malla fina', petals: 6, centerStyle: 'star', midLayer: 'lattice', outerBorder: 'pointed' },
  { id: 'mandala-dalia-terracota', name: 'Dalia Terracota', rounds: 11, hookMm: '3.0 mm', yarnNote: 'Conchas dobles de 10 pétalos', petals: 10, centerStyle: 'flower', midLayer: 'shells', outerBorder: 'fan' },
  { id: 'mandala-encaje-perla', name: 'Encaje Imperial', rounds: 8, hookMm: '1.75 mm', yarnNote: 'Cuentas tejidas en 12 segmentos', petals: 12, centerStyle: 'spiral', midLayer: 'popcorns', outerBorder: 'beaded' },
  { id: 'mandala-camelia-rosa', name: 'Camelia Antigua', rounds: 9, hookMm: '2.25 mm', yarnNote: 'Pétalos suaves y ondas festoneadas', petals: 8, centerStyle: 'flower', midLayer: 'shells', outerBorder: 'scallop' },
  { id: 'mandala-espiral-cacao', name: 'Espiral Cacao', rounds: 7, hookMm: '3.5 mm', yarnNote: 'Vueltas en espiral con rombos calados', petals: 6, centerStyle: 'spiral', midLayer: 'diamonds', outerBorder: 'picot' },
  { id: 'mandala-brisa-marina', name: 'Brisa Marina', rounds: 10, hookMm: '2.5 mm', yarnNote: 'Arcos de cadeneta y abanicos abiertos', petals: 10, centerStyle: 'ring', midLayer: 'arches', outerBorder: 'fan' },
  { id: 'mandala-corona-ciruela', name: 'Corona Ciruela', rounds: 12, hookMm: '2.0 mm', yarnNote: '16 puntas finas estilo tapete clásico', petals: 16, centerStyle: 'star', midLayer: 'popcorns', outerBorder: 'pointed' },
  { id: 'mandala-girasol-miel', name: 'Girasol de Miel', rounds: 8, hookMm: '3.0 mm', yarnNote: '12 hojas radiantes y borde perlado', petals: 12, centerStyle: 'sun', midLayer: 'leaves', outerBorder: 'beaded' },
  { id: 'mandala-vitral-salvia', name: 'Vitral de Salvia', rounds: 9, hookMm: '2.5 mm', yarnNote: 'Celosía geométrica de 8 módulos', petals: 8, centerStyle: 'star', midLayer: 'lattice', outerBorder: 'scallop' },
  { id: 'mandala-medallon-victoriano', name: 'Medallón Victoriano', rounds: 12, hookMm: '1.75 mm', yarnNote: 'Encaje fino de 16 arcos picot', petals: 16, centerStyle: 'flower', midLayer: 'arches', outerBorder: 'picot' },
  { id: 'mandala-flor-azafran', name: 'Flor de Azafrán', rounds: 8, hookMm: '2.5 mm', yarnNote: '6 pétalos amplios en punto puff', petals: 6, centerStyle: 'sun', midLayer: 'popcorns', outerBorder: 'fan' },
  { id: 'mandala-trebol-celta', name: 'Trébol Calado', rounds: 7, hookMm: '2.75 mm', yarnNote: 'Hojas simétricas y onda suave', petals: 6, centerStyle: 'ring', midLayer: 'leaves', outerBorder: 'scallop' },
  { id: 'mandala-brujula-norte', name: 'Brújula del Norte', rounds: 10, hookMm: '2.25 mm', yarnNote: '8 puntas marcadas con rombo central', petals: 8, centerStyle: 'star', midLayer: 'diamonds', outerBorder: 'pointed' },
  { id: 'mandala-conchas-coral', name: 'Conchas de Coral', rounds: 9, hookMm: '3.0 mm', yarnNote: 'Conchas escalonadas en 10 ejes', petals: 10, centerStyle: 'spiral', midLayer: 'shells', outerBorder: 'beaded' },
  { id: 'mandala-jardin-lavanda', name: 'Jardín Lavanda', rounds: 8, hookMm: '2.5 mm', yarnNote: 'Celosía floral de 12 segmentos', petals: 12, centerStyle: 'flower', midLayer: 'lattice', outerBorder: 'picot' },
  { id: 'mandala-rueda-bohemia', name: 'Rueda Bohemia', rounds: 11, hookMm: '3.5 mm', yarnNote: 'Abanicos grandes para tapiz mural', petals: 12, centerStyle: 'ring', midLayer: 'arches', outerBorder: 'fan' },
  { id: 'mandala-magnolia-crema', name: 'Magnolia Tostada', rounds: 9, hookMm: '2.25 mm', yarnNote: 'Pétalos abiertos de 10 gajos', petals: 10, centerStyle: 'flower', midLayer: 'leaves', outerBorder: 'scallop' },
  { id: 'mandala-noche-estrellada', name: 'Noche Estrellada', rounds: 10, hookMm: '2.0 mm', yarnNote: '16 rayos con puntilla en pico', petals: 16, centerStyle: 'sun', midLayer: 'diamonds', outerBorder: 'pointed' },
  { id: 'mandala-baya-silvestre', name: 'Baya Silvestre', rounds: 7, hookMm: '2.5 mm', yarnNote: 'Puntos bodoque y remate de perlas', petals: 8, centerStyle: 'flower', midLayer: 'popcorns', outerBorder: 'beaded' },
  { id: 'mandala-oasis-turquesa', name: 'Oasis Turquesa', rounds: 9, hookMm: '2.75 mm', yarnNote: 'Conchas fluidas con malla radial', petals: 12, centerStyle: 'spiral', midLayer: 'shells', outerBorder: 'picot' },
  { id: 'mandala-filigrana-bronce', name: 'Filigrana Bronce', rounds: 10, hookMm: '2.0 mm', yarnNote: 'Red calada de 8 puntas antiguas', petals: 8, centerStyle: 'ring', midLayer: 'lattice', outerBorder: 'fan' },
  { id: 'mandala-crisantemo-real', name: 'Crisantemo Real', rounds: 12, hookMm: '2.0 mm', yarnNote: '16 pétalos largos con borde de abanico', petals: 16, centerStyle: 'flower', midLayer: 'leaves', outerBorder: 'fan' },
  { id: 'mandala-aurora-esmeralda', name: 'Aurora Esmeralda', rounds: 8, hookMm: '2.5 mm', yarnNote: 'Arcos superpuestos con 10 rayos', petals: 10, centerStyle: 'star', midLayer: 'arches', outerBorder: 'scallop' },
  { id: 'mandala-amapola-campestre', name: 'Amapola Campestre', rounds: 7, hookMm: '3.0 mm', yarnNote: '6 pétalos marcados con picot doble', petals: 6, centerStyle: 'flower', midLayer: 'shells', outerBorder: 'picot' },
  { id: 'mandala-calendula-ocre', name: 'Caléndula Ocre', rounds: 9, hookMm: '2.5 mm', yarnNote: 'Rombos solares en 12 vueltas', petals: 12, centerStyle: 'sun', midLayer: 'diamonds', outerBorder: 'beaded' },
  { id: 'mandala-pluma-pavo', name: 'Pluma de Pavo Real', rounds: 11, hookMm: '2.25 mm', yarnNote: 'Ojos tejidos de 10 puntas finas', petals: 10, centerStyle: 'ring', midLayer: 'popcorns', outerBorder: 'pointed' },
  { id: 'mandala-tartan-nogal', name: 'Roseta de Nogal', rounds: 8, hookMm: '3.0 mm', yarnNote: 'Malla entrelazada de 8 ejes clásicos', petals: 8, centerStyle: 'spiral', midLayer: 'lattice', outerBorder: 'picot' },
  { id: 'mandala-peonia-vino', name: 'Peonía de Vino', rounds: 10, hookMm: '2.5 mm', yarnNote: '12 ondas suaves con centro floral', petals: 12, centerStyle: 'flower', midLayer: 'shells', outerBorder: 'scallop' },
  { id: 'mandala-verbena-marino', name: 'Verbena Marino', rounds: 9, hookMm: '2.25 mm', yarnNote: 'Hojas caladas sobre red hexagonal', petals: 6, centerStyle: 'star', midLayer: 'leaves', outerBorder: 'beaded' },
  { id: 'mandala-amberes-lace', name: 'Encaje de Amberes', rounds: 12, hookMm: '1.5 mm', yarnNote: 'Tapete delicado de 16 conchas', petals: 16, centerStyle: 'ring', midLayer: 'shells', outerBorder: 'picot' },
  { id: 'mandala-granada-otono', name: 'Granada de Otoño', rounds: 8, hookMm: '3.0 mm', yarnNote: 'Puntos bodoque en 10 pétalos cálidos', petals: 10, centerStyle: 'sun', midLayer: 'popcorns', outerBorder: 'fan' },
  { id: 'mandala-escarcha-azul', name: 'Copo de Encaje', rounds: 9, hookMm: '2.0 mm', yarnNote: 'Estrella hexagonal de puntilla aguda', petals: 6, centerStyle: 'star', midLayer: 'arches', outerBorder: 'pointed' },
  { id: 'mandala-armonia-olivo', name: 'Armonía de Olivo', rounds: 10, hookMm: '2.5 mm', yarnNote: 'Rombos botánicos en 8 ejes simétricos', petals: 8, centerStyle: 'spiral', midLayer: 'diamonds', outerBorder: 'scallop' },
];

const PETAL_COUNTS: Array<6 | 8 | 10 | 12 | 14 | 16> = [8, 12, 10, 16, 6, 14, 12, 8];
const CENTER_STYLES: MandalaCenterStyle[] = [
  'puff-flower',
  'flower',
  'sun',
  'star',
  'spiral',
  'ring',
];
const RING2_STYLES: MandalaRing2Style[] = [
  'petals',
  'tulips',
  'spokes',
  'chevron',
  'braid',
  'clusters',
];
const MID_LAYERS: MandalaMidLayer[] = [
  'pineapples',
  'fans',
  'shells',
  'leaves',
  'popcorns',
  'arches',
  'diamonds',
  'lattice',
];
const RING4_STYLES: MandalaRing4Style[] = [
  'double-arch',
  'chain-lace',
  'v-stitch',
  'waves',
  'spikes',
  'beads',
];
const OUTER_BORDERS: MandalaOuterBorder[] = [
  'lotus',
  'crown',
  'triple-picot',
  'fan',
  'scallop',
  'picot',
  'pointed',
  'beaded',
];

const WEB_STYLES: DreamcatcherWebStyle[] = [
  'sacred-star',
  'lotus-web',
  'spiral-web',
  'double-web',
  'peacock-web',
  'celtic-web',
];

const HOOK_SIZES = ['1.75 mm', '2.0 mm', '2.25 mm', '2.5 mm', '2.75 mm', '3.0 mm', '3.5 mm', '4.0 mm'];
const YARN_WEIGHTS = [
  'Algodón Mercerizado #3',
  'Hilo Perlé #5',
  'Algodón Peinado DK',
  'Hilo Fino #10',
  'Lana Fingering',
];

const MOTIF_PREFIXES = [
  'Mandala',
  'Rosetón',
  'Tapete',
  'Flor',
  'Estrella',
  'Corona',
  'Sol',
  'Loto',
  'Dalia',
  'Camelia',
  'Medallón',
  'Muestra',
  'Filigrana',
  'Caleidoscopio',
  'Encaje',
  'Rueda',
  'Jardín',
  'Esfera',
  'Abanico',
  'Trébol',
  'Girasol',
  'Crisantemo',
  'Peonía',
  'Aurora',
];

const MOTIF_SUFFIXES = [
  'de Sevilla',
  'Primaveral',
  'Imperial',
  'Boho',
  'del Alba',
  'Arcoíris',
  'Real',
  'Botánico',
  'de Gala',
  'Solar',
  'Tropical',
  'Andaluz',
  'Sagrado',
  'de Encanto',
  'Celestial',
  'Cálido',
  'de Fiesta',
  'Estelar',
  'Mediterráneo',
  'Oriental',
  'de Verano',
  'Vintage',
  'Vibrante',
  'de Taller',
];

const DREAMCATCHER_TITLES = [
  'Atrapasueños Turquesa',
  'Atrapasueños Esmeralda',
  'Atrapasueños Zafiro',
  'Atrapasueños Aguamarina',
  'Atrapasueños Jade',
  'Atrapasueños Océano',
  'Atrapasueños Celeste',
  'Atrapasueños Bosque',
  'Atrapasueños Pavo Real',
  'Atrapasueños Aurora',
  'Atrapasueños Cobalto',
  'Atrapasueños Menta',
  'Atrapasueños Lagunas',
  'Atrapasueños Salvia',
  'Atrapasueños Lapislázuli',
  'Atrapasueños Verdemar',
  'Atrapasueños Índigo',
  'Atrapasueños Malaquita',
  'Atrapasueños Marino',
  'Atrapasueños Encantado',
];

const SPIRAL_TITLES = [
  'Espiral Turquesa',
  'Vórtice Esmeralda',
  'Remolino Zafiro',
  'Galaxia Aguamarina',
  'Hélice de Jade',
  'Espiral Océano',
  'Torbellino Cobalto',
  'Órbita Menta',
  'Espiral Aurora',
  'Corriente Azul',
  'Espiral Bosque',
  'Caleidoscopio Jade',
  'Espiral Celeste',
  'Nautilus Verde',
  'Giro Lapislázuli',
  'Marea Turquesa',
];

const STAR_TITLES = [
  'Estrella Zafiro',
  'Brújula Esmeralda',
  'Estrella Turquesa',
  'Constelación Jade',
  'Rosa Náutica Azul',
  'Lucero Aguamarina',
  'Estrella del Bosque',
  'Prisma Cobalto',
  'Estrella Boreal',
  'Cristal Verdemar',
  'Solsticio Azul',
  'Faro Esmeralda',
  'Estrella Índigo',
  'Destello Menta',
  'Estrella Malaquita',
  'Corona Celeste',
];

const BLUE_GREEN_QUALIFIERS = [
  'Real',
  'Calado',
  'de Seda',
  'del Alba',
  'Bohemio',
  'Sagrado',
  'Tejido',
  'Imperial',
  'Lotos',
  'Estelar',
  'Fino',
  'Sublime',
  'de Cristal',
  'Silvestre',
  'Luminoso',
  'de Encaje',
  'Artesanal',
  'Místico',
  'Sereno',
  'Profundo',
  'Brillante',
  'Floral',
  'Eterno',
  'del Sur',
  'de Mar',
  'de Luna',
  'Magistral',
];

const MID_DESC: Record<MandalaMidLayer, string> = {
  arches: 'arcos calados',
  shells: 'conchas en relieve',
  diamonds: 'rombos tejidos',
  leaves: 'hojas en punto alto',
  popcorns: 'puntos bodoque',
  lattice: 'celosía cruzada',
  pineapples: 'piñas clásicas',
  fans: 'abanicos amplios',
};

const BORDER_DESC: Record<MandalaOuterBorder, string> = {
  picot: 'puntilla picot',
  scallop: 'ondas festoneadas',
  pointed: 'puntas caladas',
  fan: 'abanico exterior',
  beaded: 'remate perlado',
  lotus: 'pétalos de loto',
  crown: 'corona tejida',
  'triple-picot': 'triple picot',
};

const WEB_DESC: Record<DreamcatcherWebStyle, string> = {
  'sacred-star': 'red estelar tejida',
  'lotus-web': 'telaraña de loto',
  'spiral-web': 'malla en espiral',
  'double-web': 'doble aro calado',
  'peacock-web': 'ojos de pavo real',
  'celtic-web': 'nudos entrelazados',
};

const LEGACY_COUNT = 300;
const NEW_EDITION_COUNT = 420; // 420 brand-new blue/green Dreamcatchers, Spirals & Stars!
const TOTAL_CROCHET_MANDALAS = LEGACY_COUNT + NEW_EDITION_COUNT;

function buildCrochetMandalas(): CrochetMandalaDef[] {
  const list: CrochetMandalaDef[] = [];

  // 1. Preserve original 300 IDs for compatibility, enriching some with blue/green palettes too
  for (let i = 0; i < LEGACY_COUNT; i++) {
    const legacy = i < BASE_LEGACY_MANDALAS.length ? BASE_LEGACY_MANDALAS[i] : null;
    const useBgPalette = i >= 120 && i % 2 === 0;
    const paletteDef = useBgPalette
      ? BLUE_GREEN_PALETTES[i % BLUE_GREEN_PALETTES.length]
      : YARN_PALETTES[i % YARN_PALETTES.length];
    const rot = Math.floor(i / paletteDef.colors.length) % 6;
    const rawColors = paletteDef.colors;
    const palette: [string, string, string, string, string, string] = [
      rawColors[rot % 6],
      rawColors[(rot + 1) % 6],
      rawColors[(rot + 2) % 6],
      rawColors[(rot + 3) % 6],
      rawColors[(rot + 4) % 6],
      rawColors[(rot + 5) % 6],
    ];

    const petals = legacy ? legacy.petals : PETAL_COUNTS[(i * 3 + Math.floor(i / 8)) % PETAL_COUNTS.length];
    const centerStyle = legacy ? legacy.centerStyle : CENTER_STYLES[(i + Math.floor(i / 6)) % CENTER_STYLES.length];
    const ring2Style = RING2_STYLES[(i * 5 + 1) % RING2_STYLES.length];
    const midLayer = legacy ? legacy.midLayer : MID_LAYERS[(i * 3 + 2) % MID_LAYERS.length];
    const ring4Style = RING4_STYLES[(i * 7 + 3) % RING4_STYLES.length];
    const outerBorder = legacy ? legacy.outerBorder : OUTER_BORDERS[(i * 5 + Math.floor(i / 7)) % OUTER_BORDERS.length];

    const prefix = MOTIF_PREFIXES[i % MOTIF_PREFIXES.length];
    const suffix = MOTIF_SUFFIXES[Math.floor(i / MOTIF_PREFIXES.length) % MOTIF_SUFFIXES.length];
    const edition = Math.floor(i / (MOTIF_PREFIXES.length * MOTIF_SUFFIXES.length));
    const generatedName =
      edition > 0 ? `${prefix} ${suffix} ${edition + 1}` : `${prefix} ${suffix}`;

    const kind: MandalaDesignKind =
      centerStyle === 'spiral' && i >= 60 && i % 3 === 0
        ? 'espiral'
        : centerStyle === 'star' && i >= 60 && i % 3 === 1
          ? 'estrella'
          : 'mandala';

    const rounds = legacy ? legacy.rounds : 7 + (i % 10);
    const hookMm = legacy ? legacy.hookMm : HOOK_SIZES[i % HOOK_SIZES.length];
    const yarnWeight = YARN_WEIGHTS[i % YARN_WEIGHTS.length];
    const yarnNote = legacy
      ? legacy.yarnNote
      : `${petals} pétalos · ${MID_DESC[midLayer]} y ${BORDER_DESC[outerBorder]}`;

    list.push({
      id: legacy ? legacy.id : `mandala-muestra-${String(i + 1).padStart(3, '0')}`,
      name: legacy ? legacy.name : generatedName,
      kind,
      rounds,
      hookMm,
      yarnWeight,
      yarnNote,
      paletteName: paletteDef.name,
      petals,
      centerStyle,
      ring2Style,
      midLayer,
      ring4Style,
      outerBorder,
      spiralDirection: i % 2 === 0 ? 1 : -1,
      palette,
      primaryColor: palette[0],
      accentColor: palette[2],
    });
  }

  // 2. 420 brand-new Blue & Green predominant Dreamcatchers, Spirals & Star Mandalas!
  for (let j = 0; j < NEW_EDITION_COUNT; j++) {
    // 85% Blue & Green dominant palettes, 15% jewel teal/ocean blends
    const paletteDef =
      j % 7 === 6
        ? YARN_PALETTES[(j * 3 + 3) % YARN_PALETTES.length]
        : BLUE_GREEN_PALETTES[j % BLUE_GREEN_PALETTES.length];
    const rot = Math.floor(j / BLUE_GREEN_PALETTES.length) % 6;
    const rawColors = paletteDef.colors;
    const palette: [string, string, string, string, string, string] = [
      rawColors[rot % 6],
      rawColors[(rot + 1) % 6],
      rawColors[(rot + 2) % 6],
      rawColors[(rot + 3) % 6],
      rawColors[(rot + 4) % 6],
      rawColors[(rot + 5) % 6],
    ];

    // Cycle kinds evenly: Dreamcatcher, Spiral, Star/Sacred Mandala
    const kindCycle = j % 3;
    const kind: MandalaDesignKind =
      kindCycle === 0 ? 'atrapasuenos' : kindCycle === 1 ? 'espiral' : 'estrella';

    const petals = PETAL_COUNTS[(j * 5 + 3) % PETAL_COUNTS.length];
    const centerStyle: MandalaCenterStyle =
      kind === 'espiral'
        ? 'spiral'
        : kind === 'estrella'
          ? 'star'
          : CENTER_STYLES[(j + 1) % CENTER_STYLES.length];
    const ring2Style = RING2_STYLES[(j * 3 + 2) % RING2_STYLES.length];
    const midLayer = MID_LAYERS[(j * 5 + 1) % MID_LAYERS.length];
    const ring4Style = RING4_STYLES[(j * 3 + 4) % RING4_STYLES.length];
    const outerBorder = OUTER_BORDERS[(j * 7 + 2) % OUTER_BORDERS.length];
    const webStyle = WEB_STYLES[j % WEB_STYLES.length];
    const featherCount: 3 | 5 | 7 = j % 3 === 0 ? 5 : j % 3 === 1 ? 3 : 7;

    let name = '';
    let yarnNote = '';
    if (kind === 'atrapasuenos') {
      const base = DREAMCATCHER_TITLES[j % DREAMCATCHER_TITLES.length];
      const qual =
        BLUE_GREEN_QUALIFIERS[
          Math.floor(j / DREAMCATCHER_TITLES.length) % BLUE_GREEN_QUALIFIERS.length
        ];
      name = `${base} ${qual}`;
      yarnNote = `Atrapasueños · ${featherCount} plumas, ${WEB_DESC[webStyle]}`;
    } else if (kind === 'espiral') {
      const base = SPIRAL_TITLES[j % SPIRAL_TITLES.length];
      const qual =
        BLUE_GREEN_QUALIFIERS[
          Math.floor(j / SPIRAL_TITLES.length) % BLUE_GREEN_QUALIFIERS.length
        ];
      name = `${base} ${qual}`;
      yarnNote = `Mandala espiral de ${petals} brazos · ${BORDER_DESC[outerBorder]}`;
    } else {
      const base = STAR_TITLES[j % STAR_TITLES.length];
      const qual =
        BLUE_GREEN_QUALIFIERS[
          Math.floor(j / STAR_TITLES.length) % BLUE_GREEN_QUALIFIERS.length
        ];
      name = `${base} ${qual}`;
      yarnNote = `Mandala estelar ${petals} puntas · ${MID_DESC[midLayer]}`;
    }

    const rounds = 9 + (j % 12);
    const hookMm = HOOK_SIZES[(j + 2) % HOOK_SIZES.length];
    const yarnWeight = YARN_WEIGHTS[(j + 1) % YARN_WEIGHTS.length];

    list.push({
      id: `mandala-az-ve-${String(j + 1).padStart(3, '0')}`,
      name,
      kind,
      rounds,
      hookMm,
      yarnWeight,
      yarnNote,
      paletteName: paletteDef.name,
      petals,
      centerStyle,
      ring2Style,
      midLayer,
      ring4Style,
      outerBorder,
      webStyle,
      featherCount,
      spiralDirection: j % 2 === 0 ? 1 : -1,
      palette,
      primaryColor: palette[0],
      accentColor: palette[2],
    });
  }

  return list;
}

export const CROCHET_MANDALAS: CrochetMandalaDef[] = buildCrochetMandalas();
export { TOTAL_CROCHET_MANDALAS };
