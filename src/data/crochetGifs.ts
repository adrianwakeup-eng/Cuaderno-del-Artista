export type CrochetGifCategory =
  | 'Puntos y Ganchillo'
  | 'Mandalas Animados'
  | 'Granny y Tapetes'
  | 'Flores Tejidas'
  | 'Amigurumi'
  | 'Notas del Cuaderno';

export type CrochetGifScene =
  | 'chain-hook'
  | 'dc-stitch'
  | 'magic-ring'
  | 'golden-hook'
  | 'scissors-snip'
  | 'yarn-unroll'
  | 'yarn-bounce'
  | 'measuring-tape'
  | 'stitch-markers'
  | 'yarn-basket'
  | 'mandala-spin'
  | 'mandala-bloom'
  | 'mandala-kaleidoscope'
  | 'mandala-sunburst'
  | 'mandala-boho'
  | 'mandala-lace-wheel'
  | 'mandala-star'
  | 'mandala-daisy'
  | 'mandala-autumn'
  | 'mandala-emerald'
  | 'granny-build'
  | 'granny-sunflower'
  | 'granny-heart'
  | 'granny-daisy'
  | 'hexagon-hive'
  | 'doily-expand'
  | 'ripple-wave'
  | 'rainbow-blanket'
  | 'african-flower'
  | 'lace-sparkle'
  | 'rose-bloom'
  | 'sunflower-sway'
  | 'daisy-dance'
  | 'tulip-open'
  | 'leaf-sway'
  | 'clover-spin'
  | 'butterfly-flap'
  | 'bee-fly'
  | 'mushroom-hop'
  | 'cactus-bloom'
  | 'bear-wave'
  | 'bunny-ears'
  | 'kitty-yarn'
  | 'octopus-bob'
  | 'whale-hearts'
  | 'chick-hop'
  | 'heart-beat'
  | 'star-smile'
  | 'cloud-rainbow'
  | 'mug-steam'
  | 'stamp-done'
  | 'progress-loop'
  | 'idea-bulb'
  | 'handmade-ribbon'
  | 'gold-sparkles'
  | 'bounce-arrow'
  | 'floating-hearts'
  | 'bunting-flags'
  | 'queen-crown'
  | 'floral-seal';

export interface CrochetGifDef {
  id: string;
  name: string;
  category: CrochetGifCategory;
  scene: CrochetGifScene;
  subtitle: string;
  colors: [string, string, string, string];
  delayCs?: number; // centiseconds per frame (default 8 = 80ms)
  variant?: number;
}

const BASE_CROCHET_GIFS: CrochetGifDef[] = [
  // 1. Puntos y Ganchillo (10)
  {
    id: 'gif-chain-hook',
    name: 'Cadeneta Tejiéndose',
    category: 'Puntos y Ganchillo',
    scene: 'chain-hook',
    subtitle: 'Ganchillo formando cadenetas',
    colors: ['#C9184A', '#F4A261', '#D4AF37', '#5C3016'],
  },
  {
    id: 'gif-dc-stitch',
    name: 'Punto Alto en Acción',
    category: 'Puntos y Ganchillo',
    scene: 'dc-stitch',
    subtitle: 'Lazada y punto vareta animado',
    colors: ['#1D70A2', '#2EC4B6', '#D4AF37', '#4E2712'],
  },
  {
    id: 'gif-magic-ring',
    name: 'Anillo Mágico',
    category: 'Puntos y Ganchillo',
    scene: 'magic-ring',
    subtitle: 'Aro ajustable con puntos bajos',
    colors: ['#9D4EDD', '#FF70A6', '#F4C95D', '#4A220D'],
  },
  {
    id: 'gif-golden-hook',
    name: 'Ganchillo Dorado',
    category: 'Puntos y Ganchillo',
    scene: 'golden-hook',
    subtitle: 'Aguja brillante con destellos',
    colors: ['#D97706', '#FBBF24', '#7A202A', '#FFF3D1'],
  },
  {
    id: 'gif-scissors-snip',
    name: 'Tijeras de Taller',
    category: 'Puntos y Ganchillo',
    scene: 'scissors-snip',
    subtitle: 'Tijeras cigüeña cortando hebra',
    colors: ['#B45309', '#F59E0B', '#E11D48', '#3E1E0C'],
  },
  {
    id: 'gif-yarn-unroll',
    name: 'Ovillo Desenrollándose',
    category: 'Puntos y Ganchillo',
    scene: 'yarn-unroll',
    subtitle: 'Madeja rodando con hilo vivo',
    colors: ['#E63946', '#FF758F', '#FFB3C1', '#6B2229'],
  },
  {
    id: 'gif-yarn-bounce',
    name: 'Ovillos Saltarines',
    category: 'Puntos y Ganchillo',
    scene: 'yarn-bounce',
    subtitle: 'Dúo de lanas alegres',
    colors: ['#00A896', '#F7B801', '#E63946', '#3A0CA3'],
  },
  {
    id: 'gif-measuring-tape',
    name: 'Cinta Métrica',
    category: 'Puntos y Ganchillo',
    scene: 'measuring-tape',
    subtitle: 'Cinta enrollándose en espiral',
    colors: ['#F59E0B', '#FEF3C7', '#78350F', '#D97706'],
  },
  {
    id: 'gif-stitch-markers',
    name: 'Marcadores de Punto',
    category: 'Puntos y Ganchillo',
    scene: 'stitch-markers',
    subtitle: 'Imperdibles de colores girando',
    colors: ['#E11D48', '#0EA5E9', '#10B981', '#F59E0B'],
  },
  {
    id: 'gif-yarn-basket',
    name: 'Canasta de Lanas',
    category: 'Puntos y Ganchillo',
    scene: 'yarn-basket',
    subtitle: 'Cesta tejida con ovillos vivos',
    colors: ['#9A5B25', '#E11D48', '#2EC4B6', '#F59E0B'],
  },

  // 2. Mandalas Animados (10)
  {
    id: 'gif-mandala-spin',
    name: 'Mandala Arcoíris',
    category: 'Mandalas Animados',
    scene: 'mandala-spin',
    subtitle: 'Rosetón multicolor giratorio',
    colors: ['#E11D48', '#F59E0B', '#10B981', '#2563EB'],
  },
  {
    id: 'gif-mandala-bloom',
    name: 'Mandala Loto Vivo',
    category: 'Mandalas Animados',
    scene: 'mandala-bloom',
    subtitle: 'Pétalos abriéndose por vueltas',
    colors: ['#9D174D', '#F472B6', '#FBBF24', '#0F766E'],
  },
  {
    id: 'gif-mandala-kaleidoscope',
    name: 'Mandala Caleidoscopio',
    category: 'Mandalas Animados',
    scene: 'mandala-kaleidoscope',
    subtitle: 'Anillos contrarrotatorios',
    colors: ['#4338CA', '#EC4899', '#14B8A6', '#F59E0B'],
  },
  {
    id: 'gif-mandala-sunburst',
    name: 'Mandala Sol Radiante',
    category: 'Mandalas Animados',
    scene: 'mandala-sunburst',
    subtitle: 'Rayos dorados latiendo',
    colors: ['#B45309', '#F59E0B', '#DC2626', '#FDE047'],
  },
  {
    id: 'gif-mandala-boho',
    name: 'Mandala Boho Turquesa',
    category: 'Mandalas Animados',
    scene: 'mandala-boho',
    subtitle: 'Turquesa y coral en vaivén',
    colors: ['#0F766E', '#2DD4BF', '#FB7185', '#F59E0B'],
  },
  {
    id: 'gif-mandala-lace-wheel',
    name: 'Rueda de Encaje Real',
    category: 'Mandalas Animados',
    scene: 'mandala-lace-wheel',
    subtitle: 'Filigrana violeta y oro',
    colors: ['#6D28D9', '#C084FC', '#D97706', '#FDE68A'],
  },
  {
    id: 'gif-mandala-star',
    name: 'Mandala Estrella Nórdica',
    category: 'Mandalas Animados',
    scene: 'mandala-star',
    subtitle: 'Estrella de 8 puntas tejiéndose',
    colors: ['#1E3A8A', '#0284C7', '#F59E0B', '#E11D48'],
  },
  {
    id: 'gif-mandala-daisy',
    name: 'Mandala Jardín Pastel',
    category: 'Mandalas Animados',
    scene: 'mandala-daisy',
    subtitle: 'Margaritas en ronda festiva',
    colors: ['#FF70A6', '#FF9770', '#10B981', '#FBBF24'],
  },
  {
    id: 'gif-mandala-autumn',
    name: 'Mandala Otoño Cálido',
    category: 'Mandalas Animados',
    scene: 'mandala-autumn',
    subtitle: 'Terracota, ocre y oliva',
    colors: ['#9A3412', '#EA580C', '#CA8A04', '#4D7C0F'],
  },
  {
    id: 'gif-mandala-emerald',
    name: 'Mandala Esmeralda',
    category: 'Mandalas Animados',
    scene: 'mandala-emerald',
    subtitle: 'Verde bosque con aro dorado',
    colors: ['#065F46', '#10B981', '#D97706', '#BE123C'],
  },

  // 3. Granny y Tapetes (10)
  {
    id: 'gif-granny-build',
    name: 'Granny Square Clásico',
    category: 'Granny y Tapetes',
    scene: 'granny-build',
    subtitle: 'Cuadro de la abuela vuelta a vuelta',
    colors: ['#DC2626', '#F59E0B', '#059669', '#1D4ED8'],
  },
  {
    id: 'gif-granny-sunflower',
    name: 'Granny Girasol',
    category: 'Granny y Tapetes',
    scene: 'granny-sunflower',
    subtitle: 'Centro café con pétalos oro',
    colors: ['#5C3016', '#EA580C', '#FBBF24', '#0F766E'],
  },
  {
    id: 'gif-granny-heart',
    name: 'Granny Corazón',
    category: 'Granny y Tapetes',
    scene: 'granny-heart',
    subtitle: 'Cuadro romántico palpitando',
    colors: ['#BE123C', '#FB7185', '#FDE2E4', '#6D28D9'],
  },
  {
    id: 'gif-granny-daisy',
    name: 'Granny Margarita',
    category: 'Granny y Tapetes',
    scene: 'granny-daisy',
    subtitle: 'Flor central sobre cuadro menta',
    colors: ['#F59E0B', '#FFFBEB', '#10B981', '#047857'],
  },
  {
    id: 'gif-hexagon-hive',
    name: 'Hexágonos Colmena',
    category: 'Granny y Tapetes',
    scene: 'hexagon-hive',
    subtitle: 'Mosaico hexagonal animado',
    colors: ['#D97706', '#FBBF24', '#0D9488', '#9D174D'],
  },
  {
    id: 'gif-doily-expand',
    name: 'Tapete Estrellado',
    category: 'Granny y Tapetes',
    scene: 'doily-expand',
    subtitle: 'Carpeta calada expandiéndose',
    colors: ['#7A202A', '#B45309', '#0F766E', '#4338CA'],
  },
  {
    id: 'gif-ripple-wave',
    name: 'Punto Chevron Ondulado',
    category: 'Granny y Tapetes',
    scene: 'ripple-wave',
    subtitle: 'Zigzag de colores fluyendo',
    colors: ['#E11D48', '#F97316', '#14B8A6', '#3B82F6'],
  },
  {
    id: 'gif-rainbow-blanket',
    name: 'Manta Arcoíris',
    category: 'Granny y Tapetes',
    scene: 'rainbow-blanket',
    subtitle: 'Franjas tejidas ondeando',
    colors: ['#EF4444', '#F59E0B', '#10B981', '#8B5CF6'],
  },
  {
    id: 'gif-african-flower',
    name: 'Flor Africana',
    category: 'Granny y Tapetes',
    scene: 'african-flower',
    subtitle: 'Hexágono floral iluminándose',
    colors: ['#BE185D', '#F43F5E', '#14B8A6', '#1E3A8A'],
  },
  {
    id: 'gif-lace-sparkle',
    name: 'Puntilla Destellante',
    category: 'Granny y Tapetes',
    scene: 'lace-sparkle',
    subtitle: 'Encaje clásico con brillos',
    colors: ['#5B285C', '#D97706', '#9F1239', '#FBBF24'],
  },

  // 4. Flores Tejidas (10)
  {
    id: 'gif-rose-bloom',
    name: 'Rosa de Ganchillo',
    category: 'Flores Tejidas',
    scene: 'rose-bloom',
    subtitle: 'Capullo en espiral abriéndose',
    colors: ['#9F1239', '#E11D48', '#FB7185', '#15803D'],
  },
  {
    id: 'gif-sunflower-sway',
    name: 'Girasol Alegre',
    category: 'Flores Tejidas',
    scene: 'sunflower-sway',
    subtitle: 'Pétalos dorados meciéndose',
    colors: ['#5C3016', '#F59E0B', '#FACC15', '#16A34A'],
  },
  {
    id: 'gif-daisy-dance',
    name: 'Margarita Bailarina',
    category: 'Flores Tejidas',
    scene: 'daisy-dance',
    subtitle: 'Flor campestre saltarina',
    colors: ['#F59E0B', '#FFF7ED', '#EC4899', '#16A34A'],
  },
  {
    id: 'gif-tulip-open',
    name: 'Tulipán de Hilo',
    category: 'Flores Tejidas',
    scene: 'tulip-open',
    subtitle: 'Flor en punto puff abriendo',
    colors: ['#DB2777', '#F472B6', '#15803D', '#FBBF24'],
  },
  {
    id: 'gif-leaf-sway',
    name: 'Rama y Hojas Tejidas',
    category: 'Flores Tejidas',
    scene: 'leaf-sway',
    subtitle: 'Hojas botánicas en relieve',
    colors: ['#14532D', '#16A34A', '#84CC16', '#D97706'],
  },
  {
    id: 'gif-clover-spin',
    name: 'Trébol de 4 Hojas',
    category: 'Flores Tejidas',
    scene: 'clover-spin',
    subtitle: 'Trébol de la suerte girando',
    colors: ['#047857', '#10B981', '#34D399', '#FBBF24'],
  },
  {
    id: 'gif-butterfly-flap',
    name: 'Mariposa de Crochet',
    category: 'Flores Tejidas',
    scene: 'butterfly-flap',
    subtitle: 'Aleteo colorido en encaje',
    colors: ['#7C3AED', '#EC4899', '#F59E0B', '#06B6D4'],
  },
  {
    id: 'gif-bee-fly',
    name: 'Abejita Amigurumi',
    category: 'Flores Tejidas',
    scene: 'bee-fly',
    subtitle: 'Abejita zumbando entre flores',
    colors: ['#F59E0B', '#291509', '#BAE6FD', '#EC4899'],
  },
  {
    id: 'gif-mushroom-hop',
    name: 'Honguito del Bosque',
    category: 'Flores Tejidas',
    scene: 'mushroom-hop',
    subtitle: 'Seta amigurumi con lunares',
    colors: ['#DC2626', '#FEF3C7', '#92400E', '#16A34A'],
  },
  {
    id: 'gif-cactus-bloom',
    name: 'Cactus en Maceta',
    category: 'Flores Tejidas',
    scene: 'cactus-bloom',
    subtitle: 'Cactus tejido con flor rosa',
    colors: ['#15803D', '#4ADE80', '#C2410C', '#EC4899'],
  },

  // 5. Amigurumi (10)
  {
    id: 'gif-bear-wave',
    name: 'Osito Saludando',
    category: 'Amigurumi',
    scene: 'bear-wave',
    subtitle: 'Osito tejido moviendo su patita',
    colors: ['#8B5A2B', '#C68B59', '#E11D48', '#FDE68A'],
  },
  {
    id: 'gif-bunny-ears',
    name: 'Conejito Tierno',
    category: 'Amigurumi',
    scene: 'bunny-ears',
    subtitle: 'Orejas largas moviéndose',
    colors: ['#E5D3B3', '#FB7185', '#4A2511', '#14B8A6'],
  },
  {
    id: 'gif-kitty-yarn',
    name: 'Gatito con Ovillo',
    category: 'Amigurumi',
    scene: 'kitty-yarn',
    subtitle: 'Michi jugando con la lana',
    colors: ['#EA580C', '#FDBA74', '#E11D48', '#2563EB'],
  },
  {
    id: 'gif-octopus-bob',
    name: 'Pulpito Amigurumi',
    category: 'Amigurumi',
    scene: 'octopus-bob',
    subtitle: 'Tentáculos en espiral bailando',
    colors: ['#7C3AED', '#C084FC', '#F472B6', '#FBBF24'],
  },
  {
    id: 'gif-whale-hearts',
    name: 'Ballenita Feliz',
    category: 'Amigurumi',
    scene: 'whale-hearts',
    subtitle: 'Lanzando chorrito de corazones',
    colors: ['#0284C7', '#38BDF8', '#E11D48', '#FEF3C7'],
  },
  {
    id: 'gif-chick-hop',
    name: 'Pollito Saltarín',
    category: 'Amigurumi',
    scene: 'chick-hop',
    subtitle: 'Pollito amarillo en punto bajo',
    colors: ['#FACC15', '#F59E0B', '#EA580C', '#291509'],
  },
  {
    id: 'gif-heart-beat',
    name: 'Corazón Amigurumi',
    category: 'Amigurumi',
    scene: 'heart-beat',
    subtitle: 'Corazón tejido latiendo',
    colors: ['#BE123C', '#F43F5E', '#FDA4AF', '#FDE047'],
  },
  {
    id: 'gif-star-smile',
    name: 'Estrellita Sonriente',
    category: 'Amigurumi',
    scene: 'star-smile',
    subtitle: 'Estrella dorada guiñando',
    colors: ['#F59E0B', '#FDE047', '#EA580C', '#4A220D'],
  },
  {
    id: 'gif-cloud-rainbow',
    name: 'Nube con Arcoíris',
    category: 'Amigurumi',
    scene: 'cloud-rainbow',
    subtitle: 'Nube amigurumi con lluvia de amor',
    colors: ['#E0F2FE', '#38BDF8', '#F43F5E', '#FBBF24'],
  },
  {
    id: 'gif-mug-steam',
    name: 'Taza con Cubre-Taza',
    category: 'Amigurumi',
    scene: 'mug-steam',
    subtitle: 'Cafecito con funda tejida',
    colors: ['#78350F', '#D97706', '#E11D48', '#FDE68A'],
  },

  // 6. Notas del Cuaderno (10)
  {
    id: 'gif-stamp-done',
    name: 'Sello ¡Terminado!',
    category: 'Notas del Cuaderno',
    scene: 'stamp-done',
    subtitle: 'Insignia festiva para proyectos',
    colors: ['#047857', '#10B981', '#FDE047', '#FFFFFF'],
  },
  {
    id: 'gif-progress-loop',
    name: 'En Progreso',
    category: 'Notas del Cuaderno',
    scene: 'progress-loop',
    subtitle: 'Anillo giratorio de labor activa',
    colors: ['#D97706', '#F59E0B', '#9F1239', '#0EA5E9'],
  },
  {
    id: 'gif-idea-bulb',
    name: '¡Idea de Diseño!',
    category: 'Notas del Cuaderno',
    scene: 'idea-bulb',
    subtitle: 'Bombilla tejida iluminándose',
    colors: ['#F59E0B', '#FDE047', '#B45309', '#EA580C'],
  },
  {
    id: 'gif-handmade-ribbon',
    name: 'Hecho a Mano',
    category: 'Notas del Cuaderno',
    scene: 'handmade-ribbon',
    subtitle: 'Listón artesanal ondeando',
    colors: ['#9F1239', '#E11D48', '#FBBF24', '#FFFBEB'],
  },
  {
    id: 'gif-gold-sparkles',
    name: 'Destellos Dorados',
    category: 'Notas del Cuaderno',
    scene: 'gold-sparkles',
    subtitle: 'Estrellitas doradas titilando',
    colors: ['#D97706', '#FBBF24', '#FDE047', '#9A3412'],
  },
  {
    id: 'gif-bounce-arrow',
    name: 'Flecha Señaladora',
    category: 'Notas del Cuaderno',
    scene: 'bounce-arrow',
    subtitle: 'Flecha bordada rebotando',
    colors: ['#B91C1C', '#F59E0B', '#D97706', '#4A220D'],
  },
  {
    id: 'gif-floating-hearts',
    name: 'Lluvia de Corazones',
    category: 'Notas del Cuaderno',
    scene: 'floating-hearts',
    subtitle: 'Corazones tejidos flotando',
    colors: ['#E11D48', '#FB7185', '#C084FC', '#F59E0B'],
  },
  {
    id: 'gif-bunting-flags',
    name: 'Banderines Tejidos',
    category: 'Notas del Cuaderno',
    scene: 'bunting-flags',
    subtitle: 'Guirnalda de triángulos crochet',
    colors: ['#E11D48', '#F59E0B', '#10B981', '#2563EB'],
  },
  {
    id: 'gif-queen-crown',
    name: 'Corona de Tejido',
    category: 'Notas del Cuaderno',
    scene: 'queen-crown',
    subtitle: 'Corona dorada con perlas',
    colors: ['#B45309', '#FBBF24', '#E11D48', '#0EA5E9'],
  },
  {
    id: 'gif-floral-seal',
    name: 'Sello Flor Dorada',
    category: 'Notas del Cuaderno',
    scene: 'floral-seal',
    subtitle: 'Medallón giratorio de taller',
    colors: ['#7A202A', '#D97706', '#FBBF24', '#0F766E'],
  },
];

interface GifEditionTheme {
  label: string;
  colors: [string, string, string, string];
  delayCs: number;
}

const GIF_EDITION_THEMES: GifEditionTheme[] = [
  { label: 'Rosa Antiguo', colors: ['#9F1239', '#FB7185', '#FDE2E4', '#D97706'], delayCs: 8 },
  { label: 'Turquesa Boho', colors: ['#0F766E', '#2DD4BF', '#F59E0B', '#1E3A8A'], delayCs: 7 },
  { label: 'Lavanda Real', colors: ['#6D28D9', '#C084FC', '#F472B6', '#FBBF24'], delayCs: 8 },
  { label: 'Atardecer Coral', colors: ['#C2410C', '#FB923C', '#FDE047', '#BE185D'], delayCs: 7 },
  { label: 'Bosque Salvia', colors: ['#14532D', '#4ADE80', '#D97706', '#FEF3C7'], delayCs: 9 },
  { label: 'Índigo y Oro', colors: ['#1E3A8A', '#38BDF8', '#FBBF24', '#7C3AED'], delayCs: 8 },
  { label: 'Miel y Cacao', colors: ['#5C3016', '#D97706', '#FCD34D', '#991B1B'], delayCs: 8 },
  { label: 'Pastel Primavera', colors: ['#EC4899', '#A7F3D0', '#FDE68A', '#60A5FA'], delayCs: 7 },
  { label: 'Rubí de Gala', colors: ['#881337', '#E11D48', '#FBBF24', '#4C1D95'], delayCs: 8 },
  { label: 'Océano Sereno', colors: ['#0369A1', '#06B6D4', '#2DD4BF', '#F472B6'], delayCs: 9 },
  { label: 'Otoño Terracota', colors: ['#7C2D12', '#EA580C', '#CA8A04', '#3F6212'], delayCs: 8 },
  { label: 'Vitral Festivo', colors: ['#DC2626', '#F59E0B', '#10B981', '#2563EB'], delayCs: 7 },
];

function buildAllCrochetGifs(): CrochetGifDef[] {
  const list: CrochetGifDef[] = [...BASE_CROCHET_GIFS];
  // 4 curated editions per base scene (60 + 240 = 300 animated crochet GIFs)
  for (let edition = 1; edition <= 4; edition++) {
    BASE_CROCHET_GIFS.forEach((base, idx) => {
      const theme = GIF_EDITION_THEMES[(idx + edition * 3) % GIF_EDITION_THEMES.length];
      list.push({
        id: `${base.id}-v${edition + 1}`,
        name: `${base.name} · ${theme.label}`,
        category: base.category,
        scene: base.scene,
        subtitle: `${base.subtitle} (${theme.label})`,
        colors: theme.colors,
        delayCs: theme.delayCs,
        variant: edition,
      });
    });
  }
  return list;
}

export const CROCHET_GIFS: CrochetGifDef[] = buildAllCrochetGifs();

