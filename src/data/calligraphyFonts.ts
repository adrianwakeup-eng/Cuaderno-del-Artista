import type { FontChoice } from '../types/crochet';

export type CalligraphyCategory = 'realeza' | 'romantica' | 'poeta' | 'clasica';

export interface CalligraphyFontMeta {
  id: FontChoice;
  name: string;
  shortLabel: string;
  category: CalligraphyCategory;
  categoryLabel: string;
  className: string;
  cssFamily: string;
  previewScaleClass: string;
  defaultSizePx: number;
  sample: string;
  desc: string;
}

export const CALLIGRAPHY_FONTS: CalligraphyFontMeta[] = [
  // ======================== REALEZA Y CORTE ========================
  {
    id: 'pinyon',
    name: 'Pinyon Real',
    shortLabel: 'Pinyon Real',
    category: 'realeza',
    categoryLabel: 'Realeza',
    className: 'font-pinyon',
    cssFamily: "'Pinyon Script', 'Cormorant Garamond', cursive",
    previewScaleClass: 'text-3xl',
    defaultSizePx: 34,
    sample: 'Decreto de la Corte Real · Escrito con pluma de oro',
    desc: 'Caligrafía aristocrática europea del siglo XVIII con trazos de pluma fina y florituras majestuosas.',
  },
  {
    id: 'lavishly',
    name: 'Gala de Palacio',
    shortLabel: 'Gala Real',
    category: 'realeza',
    categoryLabel: 'Realeza',
    className: 'font-lavishly',
    cssFamily: "'Lavishly Yours', 'Pinyon Script', cursive",
    previewScaleClass: 'text-3xl',
    defaultSizePx: 34,
    sample: 'Su Majestad el Arte · Dedicatoria Imperial',
    desc: 'Caligrafía barroca de gala con lazos solemnes para títulos nobles, portadas y firmas reales.',
  },
  {
    id: 'petit-formal',
    name: 'Invitación Palaciega',
    shortLabel: 'Palaciega',
    category: 'realeza',
    categoryLabel: 'Realeza',
    className: 'font-petit-formal',
    cssFamily: "'Petit Formal Script', 'Cormorant Garamond', cursive",
    previewScaleClass: 'text-xl',
    defaultSizePx: 24,
    sample: 'Baile de Invierno en los Jardines del Palacio',
    desc: 'Caligrafía francesa ceremonial de pergamino, equilibrada, elegante y sumamente distinguida.',
  },
  {
    id: 'cinzel-decorative',
    name: 'Corona Imperial',
    shortLabel: 'Corona Imperial',
    category: 'realeza',
    categoryLabel: 'Realeza',
    className: 'font-cinzel-deco',
    cssFamily: "'Cinzel Decorative', 'Cinzel', Georgia, serif",
    previewScaleClass: 'text-xl',
    defaultSizePx: 24,
    sample: 'ATELIER REAL · COLECCIÓN DORADA',
    desc: 'Capitulares clásicas ornamentadas inspiradas en coronas, sellos y manuscritos imperiales.',
  },
  {
    id: 'unifraktur',
    name: 'Crónica Medieval',
    shortLabel: 'Crónica Medieval',
    category: 'realeza',
    categoryLabel: 'Realeza',
    className: 'font-unifraktur',
    cssFamily: "'UnifrakturMaguntia', Georgia, serif",
    previewScaleClass: 'text-2xl',
    defaultSizePx: 28,
    sample: 'Códice Antiguo de Artesanos y Bordados de Oro',
    desc: 'Caligrafía gótica histórica de libros iluminados y pergaminos reales encuadernados en cuero.',
  },

  // ======================== ROMÁNTICA ========================
  {
    id: 'great-vibes',
    name: 'Carta de Amor',
    shortLabel: 'Carta de Amor',
    category: 'romantica',
    categoryLabel: 'Romántica',
    className: 'font-great-vibes',
    cssFamily: "'Great Vibes', 'Cormorant Garamond', cursive",
    previewScaleClass: 'text-3xl',
    defaultSizePx: 32,
    sample: 'En cada hilo tejido vive un suspiro de amor eterno',
    desc: 'Caligrafía romántica y fluida de cartas selladas con lacre, con curvas suaves y mayúsculas poéticas.',
  },
  {
    id: 'alex-brush',
    name: 'Pluma Romántica',
    shortLabel: 'Pluma Romántica',
    category: 'romantica',
    categoryLabel: 'Romántica',
    className: 'font-alex-brush',
    cssFamily: "'Alex Brush', 'Cormorant Garamond', cursive",
    previewScaleClass: 'text-3xl',
    defaultSizePx: 30,
    sample: 'Bajo la luz dorada del atardecer nacen los sueños',
    desc: 'Escritura manuscrita romántica de pincel fino, armoniosa, suave y muy legible para versos.',
  },
  {
    id: 'parisienne',
    name: 'Salón de París',
    shortLabel: 'Salón París',
    category: 'romantica',
    categoryLabel: 'Romántica',
    className: 'font-parisienne',
    cssFamily: "'Parisienne', 'Cormorant Garamond', cursive",
    previewScaleClass: 'text-2xl',
    defaultSizePx: 28,
    sample: 'Noches de poesía, rosas secas y encajes en París',
    desc: 'Caligrafía bohemia y romántica inspirada en cartas y diarios literarios del París clásico.',
  },
  {
    id: 'allura',
    name: 'Verso de Seda',
    shortLabel: 'Verso de Seda',
    category: 'romantica',
    categoryLabel: 'Romántica',
    className: 'font-allura',
    cssFamily: "'Allura', 'Cormorant Garamond', cursive",
    previewScaleClass: 'text-3xl',
    defaultSizePx: 32,
    sample: 'Tejiendo versos de oro en las hojas de mi cuaderno',
    desc: 'Caligrafía lírica y delicada, extremadamente limpia para escribir dedicatorias y poemas largos.',
  },

  // ======================== POETA ANTIGUO ========================
  {
    id: 'italianno',
    name: 'Pluma de Poeta',
    shortLabel: 'Pluma de Poeta',
    category: 'poeta',
    categoryLabel: 'Poeta Antiguo',
    className: 'font-italianno',
    cssFamily: "'Italianno', 'Cormorant Garamond', cursive",
    previewScaleClass: 'text-3xl',
    defaultSizePx: 34,
    sample: 'Caminante, tus palabras quedan grabadas en tinta antigua',
    desc: 'Trazo inclinado de pluma fuente antigua, como manuscritos íntimos de poetas del siglo XIX.',
  },
  {
    id: 'tangerine',
    name: 'Soneto Renacentista',
    shortLabel: 'Soneto Antiguo',
    category: 'poeta',
    categoryLabel: 'Poeta Antiguo',
    className: 'font-tangerine',
    cssFamily: "'Tangerine', 'Cormorant Garamond', cursive",
    previewScaleClass: 'text-4xl',
    defaultSizePx: 36,
    sample: 'Soneto I · De la belleza eterna y las manos creadoras',
    desc: 'Inspirada en la caligrafía cancilleresca itálica del Renacimiento, estilizada y grácil.',
  },
  {
    id: 'mr-de-haviland',
    name: 'Manuscrito Antiguo',
    shortLabel: 'Manuscrito Poeta',
    category: 'poeta',
    categoryLabel: 'Poeta Antiguo',
    className: 'font-haviland',
    cssFamily: "'Mr De Haviland', 'Cormorant Garamond', cursive",
    previewScaleClass: 'text-3xl',
    defaultSizePx: 34,
    sample: 'Diario secreto de un escritor a la luz de las velas',
    desc: 'Escritura literaria vintage de biblioteca antigua con alma nostálgica y tinta de época.',
  },
  {
    id: 'im-fell',
    name: 'Imprenta de Poemas',
    shortLabel: 'Imprenta Antigua',
    category: 'poeta',
    categoryLabel: 'Poeta Antiguo',
    className: 'font-im-fell italic',
    cssFamily: "'IM Fell English', 'Cormorant Garamond', Georgia, serif",
    previewScaleClass: 'text-xl',
    defaultSizePx: 22,
    sample: 'Libro Primero de Versos, Notas y Patrones Artesanales',
    desc: 'Tipografía histórica de imprenta poética del siglo XVII con auténtico carácter de pergamino.',
  },

  // ======================== CLÁSICAS Y EDITORIALES ========================
  {
    id: 'cormorant',
    name: 'Cormorant Grabada',
    shortLabel: 'Cormorant',
    category: 'clasica',
    categoryLabel: 'Clásicas',
    className: 'font-editorial font-semibold',
    cssFamily: "'Cormorant Garamond', Georgia, serif",
    previewScaleClass: 'text-xl',
    defaultSizePx: 22,
    sample: 'Mandala Encaje Borgoña · Colección Otoño',
    desc: 'Estilo libro de artista europeo para encabezados y portadillas.',
  },
  {
    id: 'lora',
    name: 'Lora Clásica',
    shortLabel: 'Lora',
    category: 'clasica',
    categoryLabel: 'Clásicas',
    className: 'font-body',
    cssFamily: "'Lora', Georgia, serif",
    previewScaleClass: 'text-lg',
    defaultSizePx: 18,
    sample: 'Anillo mágico de 6 puntos bajos, cerrar con punto deslizado.',
    desc: 'Tipografía editorial cálida y muy legible para explicaciones largas.',
  },
  {
    id: 'caveat',
    name: 'Manuscrita de Taller',
    shortLabel: 'Manuscrita',
    category: 'clasica',
    categoryLabel: 'Clásicas',
    className: 'font-hand',
    cssFamily: "'Caveat', cursive",
    previewScaleClass: 'text-2xl',
    defaultSizePx: 24,
    sample: '¡Recordar cambiar a ganchillo 2.25 mm en la vuelta 5!',
    desc: 'Letra cursiva espontánea ideal para anotaciones rápidas al margen.',
  },
  {
    id: 'cinzel',
    name: 'Cinzel Dorada',
    shortLabel: 'Cinzel Clásica',
    category: 'clasica',
    categoryLabel: 'Clásicas',
    className: 'font-display',
    cssFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif",
    previewScaleClass: 'text-lg',
    defaultSizePx: 20,
    sample: 'CUADERNO DEL ARTISTA',
    desc: 'Tipografía monumental inspirada en el lomo repujado de cuero.',
  },
];

export const CALLIGRAPHY_CATEGORIES: Array<{
  id: 'todas' | CalligraphyCategory;
  label: string;
  badge: string;
}> = [
  { id: 'todas', label: 'Todas', badge: '✦' },
  { id: 'realeza', label: 'Realeza', badge: '👑' },
  { id: 'romantica', label: 'Romántica', badge: '💌' },
  { id: 'poeta', label: 'Poeta Antiguo', badge: '🪶' },
  { id: 'clasica', label: 'Clásicas', badge: '📜' },
];

export const FONT_CLASS_MAP: Record<FontChoice, string> = Object.fromEntries(
  CALLIGRAPHY_FONTS.map((f) => [f.id, f.className])
) as Record<FontChoice, string>;

export const FONT_CSS_MAP: Record<FontChoice, string> = Object.fromEntries(
  CALLIGRAPHY_FONTS.map((f) => [f.id, f.cssFamily])
) as Record<FontChoice, string>;

export const FONT_META_BY_ID: Record<FontChoice, CalligraphyFontMeta> = Object.fromEntries(
  CALLIGRAPHY_FONTS.map((f) => [f.id, f])
) as Record<FontChoice, CalligraphyFontMeta>;

export function getFontMeta(id?: FontChoice): CalligraphyFontMeta {
  return (id && FONT_META_BY_ID[id]) || FONT_META_BY_ID.lora;
}
