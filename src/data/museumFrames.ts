export type MuseumFrameCategory = 'oro' | 'madera' | 'naturaleza' | 'puntillas';

export interface MuseumFrameMeta {
  id: string;
  name: string;
  shortLabel: string;
  category: MuseumFrameCategory;
  categoryLabel: string;
  imagePath: string;
  naturalWidth: number;
  naturalHeight: number;
  isOval?: boolean;
  /** Percentage insets from outer frame edges to the visible inner art opening */
  insets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  defaultWidthPx: number;
  desc: string;
}

export const MUSEUM_FRAME_CATEGORIES: Array<{
  id: 'todos' | MuseumFrameCategory;
  label: string;
  badge: string;
}> = [
  { id: 'todos', label: 'Todos', badge: '✦' },
  { id: 'oro', label: 'Oro de Museo', badge: '🏛️' },
  { id: 'madera', label: 'Madera Tallada', badge: '🪵' },
  { id: 'naturaleza', label: 'Naturaleza', badge: '🌿' },
  { id: 'puntillas', label: 'Puntillas Tejidas', badge: '🧶' },
];

export const MUSEUM_FRAMES: MuseumFrameMeta[] = [
  // ======================== ORO LUJOSO DE MUSEO ========================
  {
    id: 'oro-louvre-barroco',
    name: 'Oro Barroco del Louvre',
    shortLabel: 'Oro Louvre',
    category: 'oro',
    categoryLabel: 'Oro de Museo',
    imagePath: '/marcos/oro-louvre-barroco.webp',
    naturalWidth: 792,
    naturalHeight: 1054,
    insets: { top: 18, right: 22, bottom: 18, left: 22 },
    defaultWidthPx: 270,
    desc: 'Marco de exhibición de museo en pan de oro de 24k tallado a mano con volutas barrocas y hojas de acanto.',
  },
  {
    id: 'oro-palacio-oval',
    name: 'Óvalo Imperial Dorado',
    shortLabel: 'Óvalo Real',
    category: 'oro',
    categoryLabel: 'Oro de Museo',
    imagePath: '/marcos/oro-palacio-oval.webp',
    naturalWidth: 796,
    naturalHeight: 1118,
    isOval: true,
    insets: { top: 20, right: 14, bottom: 10, left: 14 },
    defaultWidthPx: 255,
    desc: 'Marco ovalado palaciego de retrato real en oro bruñido antiguo con guirnalda de laurel y cresta rococó.',
  },
  {
    id: 'oro-renacimiento-galeria',
    name: 'Galería Renacimiento',
    shortLabel: 'Oro Galería',
    category: 'oro',
    categoryLabel: 'Oro de Museo',
    imagePath: '/marcos/oro-renacimiento-galeria.webp',
    naturalWidth: 1013,
    naturalHeight: 814,
    insets: { top: 20, right: 16, bottom: 20, left: 16 },
    defaultWidthPx: 320,
    desc: 'Marco horizontal florentino de museo con greca griega, perlas talladas y pátina dorada clásica.',
  },

  // ======================== MADERA TALLADA ARTESANAL ========================
  {
    id: 'madera-nogal-museo',
    name: 'Nogal de Museo y Oro',
    shortLabel: 'Nogal y Oro',
    category: 'madera',
    categoryLabel: 'Madera Tallada',
    imagePath: '/marcos/madera-nogal-museo.webp',
    naturalWidth: 793,
    naturalHeight: 1067,
    insets: { top: 15, right: 20, bottom: 15, left: 20 },
    defaultWidthPx: 265,
    desc: 'Madera noble de nogal oscuro tallada con molduras profundas y filete interior en pan de oro.',
  },
  {
    id: 'madera-roble-rustico',
    name: 'Roble Natural Artesanal',
    shortLabel: 'Roble Natural',
    category: 'madera',
    categoryLabel: 'Madera Tallada',
    imagePath: '/marcos/madera-roble-rustico.webp',
    naturalWidth: 812,
    naturalHeight: 1113,
    insets: { top: 17, right: 22, bottom: 17, left: 22 },
    defaultWidthPx: 265,
    desc: 'Marco cálido de roble envejecido con veta natural satinada a la cera y biseles de ebanistería.',
  },
  {
    id: 'madera-caoba-dorada',
    name: 'Caoba Victoriana Dorada',
    shortLabel: 'Caoba Oro',
    category: 'madera',
    categoryLabel: 'Madera Tallada',
    imagePath: '/marcos/madera-caoba-dorada.webp',
    naturalWidth: 988,
    naturalHeight: 779,
    insets: { top: 16, right: 13, bottom: 16, left: 13 },
    defaultWidthPx: 320,
    desc: 'Marco horizontal en caoba rojiza pulida con esquinas talladas florales y borde interior dorado.',
  },

  // ======================== CUADROS DE NATURALEZA ========================
  {
    id: 'naturaleza-ramas-oro',
    name: 'Laurel y Olivo de Oro',
    shortLabel: 'Olivo Dorado',
    category: 'naturaleza',
    categoryLabel: 'Naturaleza',
    imagePath: '/marcos/naturaleza-ramas-oro.webp',
    naturalWidth: 796,
    naturalHeight: 974,
    insets: { top: 14, right: 16, bottom: 14, left: 16 },
    defaultWidthPx: 270,
    desc: 'Escultura botánica de museo con ramas entrelazadas de olivo dorado, hojas de laurel y reflejos cálidos.',
  },
  {
    id: 'naturaleza-hiedra-bosque',
    name: 'Bosque Encantado e Hiedra',
    shortLabel: 'Hiedra Bosque',
    category: 'naturaleza',
    categoryLabel: 'Naturaleza',
    imagePath: '/marcos/naturaleza-hiedra-bosque.webp',
    naturalWidth: 840,
    naturalHeight: 1098,
    insets: { top: 17, right: 20, bottom: 17, left: 20 },
    defaultWidthPx: 270,
    desc: 'Cuadro de naturaleza en corteza de roble envuelta en hiedra esmeralda, musgo suave y florecitas doradas.',
  },
  {
    id: 'naturaleza-flores-silvestres',
    name: 'Madera Silvestre y Rosas',
    shortLabel: 'Flores Silvestres',
    category: 'naturaleza',
    categoryLabel: 'Naturaleza',
    imagePath: '/marcos/naturaleza-flores-silvestres.webp',
    naturalWidth: 793,
    naturalHeight: 1040,
    insets: { top: 16, right: 20, bottom: 15, left: 20 },
    defaultWidthPx: 265,
    desc: 'Madera natural de deriva adornada con rosas crema, eucalipto y espigas doradas de exhibición botánica.',
  },

  // ======================== MARCOS TEJIDOS (PUNTILLAS DE CROCHET) ========================
  {
    id: 'puntilla-encaje-marfil',
    name: 'Puntilla de Encaje Marfil',
    shortLabel: 'Puntilla Marfil',
    category: 'puntillas',
    categoryLabel: 'Puntillas Tejidas',
    imagePath: '/marcos/puntilla-encaje-marfil.webp',
    naturalWidth: 801,
    naturalHeight: 1007,
    insets: { top: 22, right: 26, bottom: 22, left: 26 },
    defaultWidthPx: 280,
    desc: 'Marco artesanal tejido a ganchillo en algodón marfil con abanicos calados, picots y cordón trenzado.',
  },
  {
    id: 'puntilla-dorada-real',
    name: 'Puntilla Dorada Real',
    shortLabel: 'Puntilla Oro',
    category: 'puntillas',
    categoryLabel: 'Puntillas Tejidas',
    imagePath: '/marcos/puntilla-dorada-real.webp',
    naturalWidth: 805,
    naturalHeight: 1108,
    insets: { top: 26, right: 27, bottom: 22, left: 27 },
    defaultWidthPx: 280,
    desc: 'Puntilla de lujo tejida en hilo dorado metálico y crema con rosetones florales y pétalos de encaje.',
  },
  {
    id: 'puntilla-oval-rosa',
    name: 'Óvalo Encaje Rosa Antiguo',
    shortLabel: 'Óvalo Puntilla',
    category: 'puntillas',
    categoryLabel: 'Puntillas Tejidas',
    imagePath: '/marcos/puntilla-oval-rosa.webp',
    naturalWidth: 827,
    naturalHeight: 1063,
    isOval: true,
    insets: { top: 19, right: 23, bottom: 20, left: 23 },
    defaultWidthPx: 275,
    desc: 'Marco ovalado romántico tejido a mano en algodón crema, rosa empolvado y detalles de hilo dorado.',
  },
];

export const MUSEUM_FRAME_BY_ID: Record<string, MuseumFrameMeta> = Object.fromEntries(
  MUSEUM_FRAMES.map((f) => [f.id, f])
);

export function getMuseumFrameById(id?: string): MuseumFrameMeta | undefined {
  return id ? MUSEUM_FRAME_BY_ID[id] : undefined;
}
