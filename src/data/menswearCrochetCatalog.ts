import type {
  DressingRoomCategory,
  DressingRoomGarment,
  GarmentSilhouetteKind,
  GarmentStitchPattern,
} from '../types/crochet';

import topTunicaLinoImg from '../assets/images/top_tunica_lino_1795121775006.jpg';
import topChalecoOlivaImg from '../assets/images/top_chaleco_oliva_1795121774825.jpg';
import topCardiganMarinoImg from '../assets/images/top_cardigan_marino_1795121775795.jpg';
import topJerseyTerracotaImg from '../assets/images/top_jersey_terracota_1795121774344.jpg';
import topChaquetaCacaoImg from '../assets/images/top_chaqueta_cacao_1795121774286.jpg';
import topSudaderaArenaImg from '../assets/images/top_sudadera_arena_1795121775074.jpg';

import botPantalonMarinoImg from '../assets/images/bot_pantalon_marino_1795121775486.jpg';
import botPantalonArenaImg from '../assets/images/bot_pantalon_arena_1795121775792.jpg';
import botJoggerOlivaImg from '../assets/images/bot_jogger_oliva_1795121775430.jpg';
import botBermudaMarfilImg from '../assets/images/bot_bermuda_marfil_1795121774855.jpg';
import botBermudaBurdeosImg from '../assets/images/bot_bermuda_burdeos_1795121774225.jpg';
import botPantalonCacaoImg from '../assets/images/bot_pantalon_cacao_1795121775064.jpg';

/* ============================================================================
   1. 12 FLAGSHIP STYLIZED CROCHET MASTERPIECES (6 ENCIMA + 6 DEBAJO)
   Each flagship serves as both a featured atelier piece and a lookbook plate
   blueprint for the 960-design Vitruvian crochet collection.
============================================================================ */

export const CURATED_STYLIZED_TOPS: DressingRoomGarment[] = [
  {
    id: 'tunica-vitruvio-lino',
    baseTemplateId: 'tunica-vitruvio-lino',
    name: 'Túnica Vitruvio de Lino',
    category: 'Suéteres',
    garmentSlot: 'top',
    silhouetteKind: 'sweater',
    stitchPattern: 'cable',
    eyebrow: 'COLECCIÓN VITRUVIO',
    subtitle:
      'Túnica tejida a crochet en tono marfil con escote acordonado en cuero, panel trenzado romboidal y cenefa dorada en puños y bajo.',
    fiber: 'Lino Peinado y Algodón',
    fiberDetail: 'Ligera y escultórica',
    hookSizeMm: '3.0 mm',
    stitchNote: 'Trenza romboidal central, cuerpo en punto texturizado y remate geométrico dorado.',
    palette: ['#F2E6CE', '#9B6532', '#C9973E'],
    accentColor: '#F2E6CE',
    photoDataUrl: topTunicaLinoImg,
  },
  {
    id: 'chaleco-taller-oliva',
    baseTemplateId: 'chaleco-taller-oliva',
    name: 'Chaleco de Taller Oliva',
    category: 'Chalecos',
    garmentSlot: 'top',
    silhouetteKind: 'vest',
    stitchPattern: 'herringbone',
    eyebrow: 'SASTRERÍA DE ATELIER',
    subtitle:
      'Chaleco entallado sin mangas en verde salvia oliva tejido en punto espiga limpio, bolsillos de ojal y cinco botones de bronce.',
    fiber: 'Algodón Egipcio y Lino',
    fiberDetail: 'Entalle atlético limpio',
    hookSizeMm: '2.75 mm',
    stitchNote: 'Punto espiga compacto a crochet, escote en V estructurado y abotonadura en latón envejecido.',
    palette: ['#677450', '#B5893D', '#D9C7A3'],
    accentColor: '#677450',
    photoDataUrl: topChalecoOlivaImg,
  },
  {
    id: 'cardigan-atelier-azul',
    baseTemplateId: 'cardigan-atelier-azul',
    name: 'Cárdigan Atelier Marino',
    category: 'Cardigans',
    garmentSlot: 'top',
    silhouetteKind: 'cardigan',
    stitchPattern: 'cable',
    eyebrow: 'CÁRDIGANS CLÁSICOS',
    subtitle:
      'Cárdigan de solapa chal en azul prusia con ribete marfil contrastante, columnas trenzadas y botones dorados.',
    fiber: 'Algodón Mercerizado',
    fiberDetail: 'Relieve definido',
    hookSizeMm: '3.25 mm',
    stitchNote: 'Solapa chal acanalada, trenzas verticales simétricas y bolsillos con vivo crema.',
    palette: ['#22385B', '#EFE3C8', '#C69137'],
    accentColor: '#22385B',
    photoDataUrl: topCardiganMarinoImg,
  },
  {
    id: 'jersey-geometrico-terracota',
    baseTemplateId: 'jersey-geometrico-terracota',
    name: 'Jersey Geométrico Terracota',
    category: 'Suéteres',
    garmentSlot: 'top',
    silhouetteKind: 'sweater',
    stitchPattern: 'jacquard',
    eyebrow: 'EDICIÓN RENACENTISTA',
    subtitle:
      'Jersey de cuello redondo en arcilla terracota con cenefa tapestry de rombos geométricos en marfil y cacao oscuro.',
    fiber: 'Merino Suave y Algodón',
    fiberDetail: 'Acabado limpio mate',
    hookSizeMm: '3.5 mm',
    stitchNote: 'Canesú tapestry crochet de rombos contrastantes con cuello, puños y cintura elásticos.',
    palette: ['#B3522C', '#F2E5C9', '#321B11'],
    accentColor: '#B3522C',
    photoDataUrl: topJerseyTerracotaImg,
  },
  {
    id: 'chaqueta-corta-atelier',
    baseTemplateId: 'chaqueta-corta-atelier',
    name: 'Chaqueta Corta de Atelier',
    category: 'Chaquetas',
    garmentSlot: 'top',
    silhouetteKind: 'jacket',
    stitchPattern: 'waffle',
    eyebrow: 'ABRIGOS DE ESTUDIO',
    subtitle:
      'Chaqueta cruzada de corte al talle en cacao nogal con solapas de muesca, punto gofre fino y doble botonadura dorada.',
    fiber: 'Lana Peinada Compacta',
    fiberDetail: 'Estructura impecable',
    hookSizeMm: '3.75 mm',
    stitchNote: 'Micro-punto gofre estructurado a crochet, solapas definidas y seis botones de latón mate.',
    palette: ['#69432B', '#C99746', '#E8D5B4'],
    accentColor: '#69432B',
    photoDataUrl: topChaquetaCacaoImg,
  },
  {
    id: 'sudadera-capucha-arena',
    baseTemplateId: 'sudadera-capucha-arena',
    name: 'Sudadera Ligera de Capucha',
    category: 'Suéteres',
    garmentSlot: 'top',
    silhouetteKind: 'hoodie',
    stitchPattern: 'waffle',
    eyebrow: 'ESTILO CONTEMPORÁNEO',
    subtitle:
      'Sudadera a crochet en tono arena con textura gofre suave, interior de capucha azul pizarra, cordones trenzados y bolsillo canguro.',
    fiber: 'Algodón Orgánico Peinado',
    fiberDetail: 'Suave y estructurada',
    hookSizeMm: '4.0 mm',
    stitchNote: 'Punto gofre uniforme, mangas raglán limpias y cordones pizarra con puntas metálicas.',
    palette: ['#EBDAC0', '#44556E', '#9E7840'],
    accentColor: '#EBDAC0',
    photoDataUrl: topSudaderaArenaImg,
  },
];

export const CURATED_STYLIZED_BOTTOMS: DressingRoomGarment[] = [
  {
    id: 'pantalon-sastre-marino',
    baseTemplateId: 'pantalon-sastre-marino',
    name: 'Pantalón Sastre Marino',
    category: 'Pantalones',
    garmentSlot: 'bottom',
    silhouetteKind: 'tailored-pants',
    stitchPattern: 'herringbone',
    eyebrow: 'SASTRERÍA INFERIOR',
    subtitle:
      'Pantalón de corte sastre entallado en azul marino con pinzas limpias, raya frontal y hebilla lateral dorada.',
    fiber: 'Algodón Compacto y Lana',
    fiberDetail: 'Caída estilizada',
    hookSizeMm: '3.0 mm',
    stitchNote: 'Punto bajo cerrado de acabado sastre con cinturilla estructurada y bolsillos diagonales.',
    palette: ['#223659', '#C4923B', '#E5D8BE'],
    accentColor: '#223659',
    photoDataUrl: botPantalonMarinoImg,
  },
  {
    id: 'pantalon-atelier-arena',
    baseTemplateId: 'pantalon-atelier-arena',
    name: 'Pantalón de Punto Arena',
    category: 'Pantalones',
    garmentSlot: 'bottom',
    silhouetteKind: 'joggers',
    stitchPattern: 'cable',
    eyebrow: 'PUNTO ESCULTÓRICO',
    subtitle:
      'Pantalón cónico en tono arena avena con banda trenzada lateral, cordón cacao oscuro y puños acanalados.',
    fiber: 'Algodón y Lino Suave',
    fiberDetail: 'Tejido flexible',
    hookSizeMm: '3.5 mm',
    stitchNote: 'Punto fino en cuerpo, trenza lateral estilizada y cintura acanalada con jareta.',
    palette: ['#D5B68C', '#4B2D1C', '#EDE0C8'],
    accentColor: '#D5B68C',
    photoDataUrl: botPantalonArenaImg,
  },
  {
    id: 'jogger-escultor-oliva',
    baseTemplateId: 'jogger-escultor-oliva',
    name: 'Jogger Escultor Oliva',
    category: 'Pantalones',
    garmentSlot: 'bottom',
    silhouetteKind: 'joggers',
    stitchPattern: 'waffle',
    eyebrow: 'LÍNEA ATLÉTICA',
    subtitle:
      'Jogger entallado verde oliva en punto gofre definido con cordón marfil trenzado y tobillos ceñidos.',
    fiber: 'Algodón Orgánico',
    fiberDetail: 'Ajuste anatómico',
    hookSizeMm: '3.75 mm',
    stitchNote: 'Relieve gofre limpio, bolsillos laterales con ribete y puños elásticos en tobillo.',
    palette: ['#677452', '#EFE3C6', '#3A422D'],
    accentColor: '#677452',
    photoDataUrl: botJoggerOlivaImg,
  },
  {
    id: 'bermuda-clasica-marfil',
    baseTemplateId: 'bermuda-clasica-marfil',
    name: 'Bermuda Clásica Marfil',
    category: 'Bermudas',
    garmentSlot: 'bottom',
    silhouetteKind: 'shorts',
    stitchPattern: 'waffle',
    eyebrow: 'BERMUDAS DE ESTUDIO',
    subtitle:
      'Bermuda de corte limpio en marfil crema con dobladillo en azul marino contrastante, pinzas y cordón marino.',
    fiber: '100% Algodón Fresco',
    fiberDetail: 'Tejido aireado',
    hookSizeMm: '3.0 mm',
    stitchNote: 'Punto calado fino, cinturilla acanalada y banda inferior en contraste azul prusia.',
    palette: ['#EFE0C2', '#1B2D4C', '#1B2D4C'],
    accentColor: '#EFE0C2',
    photoDataUrl: botBermudaMarfilImg,
  },
  {
    id: 'bermuda-taller-burdeos',
    baseTemplateId: 'bermuda-taller-burdeos',
    name: 'Bermuda de Taller Burdeos',
    category: 'Bermudas',
    garmentSlot: 'bottom',
    silhouetteKind: 'shorts',
    stitchPattern: 'ribbed',
    eyebrow: 'EDICIÓN DORADA',
    subtitle:
      'Bermuda atlética en burdeos vino con canalé vertical, cenefa chevrón dorada en el bajo y cordón crema.',
    fiber: 'Algodón Mercerizado',
    fiberDetail: 'Color profundo mate',
    hookSizeMm: '3.0 mm',
    stitchNote: 'Canalé vertical estilizado con remate geométrico dorado y pequeña abertura lateral.',
    palette: ['#72222E', '#C89948', '#EFE2C6'],
    accentColor: '#72222E',
    photoDataUrl: botBermudaBurdeosImg,
  },
  {
    id: 'pantalon-cacao-chevron',
    baseTemplateId: 'pantalon-cacao-chevron',
    name: 'Pantalón Chevrón Cacao',
    category: 'Pantalones',
    garmentSlot: 'bottom',
    silhouetteKind: 'tailored-pants',
    stitchPattern: 'chevron',
    eyebrow: 'SASTRERÍA CLÁSICA',
    subtitle:
      'Pantalón entallado en cacao nogal con textura espiga chevrón tonal, trabillas, botón de latón y vuelta en el bajo.',
    fiber: 'Merino Fino y Algodón',
    fiberDetail: 'Textura sutil elegante',
    hookSizeMm: '3.25 mm',
    stitchNote: 'Punto espiga chevrón tonal, raya marcada y vuelta clásica en el tobillo.',
    palette: ['#6E4933', '#C49549', '#E6D4B6'],
    accentColor: '#6E4933',
    photoDataUrl: botPantalonCacaoImg,
  },
];

/* ============================================================================
   2. 960-DESIGN ARTISANAL CROCHET ATELIER GENERATOR (480 ENCIMA + 480 DEBAJO)
   Every design pairs an authentic crochet stitch, yarn fiber, hook gauge, and
   curated 3-tone yarn palette — 100% compatible with Vitruvian Front & Back!
============================================================================ */

interface YarnColorway {
  slug: string;
  name: string;
  palette: [string, string, string];
  fiber: string;
}

const CROCHET_COLORWAYS: YarnColorway[] = [
  { slug: 'marfil', name: 'Marfil Antiguo', palette: ['#F0E3CA', '#8F5D2D', '#C9963D'], fiber: 'Lino Peinado y Algodón' },
  { slug: 'prusia', name: 'Azul Prusia', palette: ['#22385B', '#EFE2C6', '#C8943B'], fiber: 'Algodón Mercerizado' },
  { slug: 'oliva', name: 'Oliva Salvia', palette: ['#5F6E4B', '#EBDDC0', '#B68639'], fiber: 'Algodón Egipcio y Lino' },
  { slug: 'terracota', name: 'Terracota Toscana', palette: ['#B24F2B', '#F3E5C8', '#331A10'], fiber: 'Merino Suave y Algodón' },
  { slug: 'cacao', name: 'Cacao Nogal', palette: ['#674129', '#C99746', '#EBD7B5'], fiber: 'Lana Peinada Compacta' },
  { slug: 'arena', name: 'Arena Avena', palette: ['#E3CFAF', '#42536C', '#A67A3A'], fiber: 'Algodón Orgánico Peinado' },
  { slug: 'burdeos', name: 'Burdeos Florencia', palette: ['#6E1F2C', '#D2A24C', '#F0E2C6'], fiber: 'Algodón Mercerizado' },
  { slug: 'esmeralda', name: 'Esmeralda Bosque', palette: ['#234E3C', '#EBDAB9', '#C99840'], fiber: 'Merino Extrafino' },
  { slug: 'ocre', name: 'Ocre Mostaza', palette: ['#B9822B', '#2C1B12', '#F3E5C8'], fiber: 'Lana de Taller' },
  { slug: 'pizarra', name: 'Pizarra Grafito', palette: ['#3C4654', '#E8D8BC', '#C59342'], fiber: 'Algodón Peinado' },
  { slug: 'indigo', name: 'Índigo Profundo', palette: ['#283C68', '#D7A348', '#F1E4CA'], fiber: 'Hilo Egipcio de 4 Hebras' },
  { slug: 'canela', name: 'Canela Tostada', palette: ['#9A5A31', '#F2E3C6', '#382012'], fiber: 'Lino y Algodón Artesanal' },
  { slug: 'musgo', name: 'Musgo Real', palette: ['#475637', '#D6A44C', '#EFE2C8'], fiber: 'Lana Merino Compacta' },
  { slug: 'ciruela', name: 'Ciruela Imperial', palette: ['#542840', '#ECDAC0', '#C8943E'], fiber: 'Algodón Seda Mate' },
  { slug: 'carbon', name: 'Carbón de Atelier', palette: ['#2E3136', '#D4A14B', '#EBE0CC'], fiber: 'Lana Peinada Fina' },
  { slug: 'crema', name: 'Crema de Lino', palette: ['#EDE1C8', '#223659', '#B98535'], fiber: '100% Lino Artesanal' },
  { slug: 'cobre', name: 'Cobre Veneciano', palette: ['#A64A29', '#EFE0C2', '#2B160D'], fiber: 'Algodón Retorcido' },
  { slug: 'petroleo', name: 'Petróleo Nórdico', palette: ['#224B57', '#ECDABA', '#C99740'], fiber: 'Merino y Bambú' },
  { slug: 'tabaco', name: 'Tabaco Ahumado', palette: ['#5A3B26', '#E8D6B5', '#C48E38'], fiber: 'Hilo Rústico Peinado' },
  { slug: 'azafran', name: 'Azafrán Dorado', palette: ['#C58B2E', '#2C1C12', '#F5E9D0'], fiber: 'Algodón Orgánico' },
  { slug: 'cobalto', name: 'Azul Cobalto', palette: ['#2A4B80', '#F1E4C8', '#C8953C'], fiber: 'Algodón Mercerizado' },
  { slug: 'pino', name: 'Verde Pino', palette: ['#2B4938', '#DFB054', '#F2E5CB'], fiber: 'Lana Suave de Estudio' },
  { slug: 'borgona', name: 'Vino Borgoña', palette: ['#5B1C28', '#EEDEC0', '#C4913B'], fiber: 'Merino Extrafino' },
  { slug: 'piedra', name: 'Piedra Caliza', palette: ['#B5A791', '#35261A', '#C8953E'], fiber: 'Lino y Algodón Fresco' },
  { slug: 'granada', name: 'Rojo Granada', palette: ['#8D2828', '#F1E3C7', '#2E1610'], fiber: 'Algodón Egipcio' },
  { slug: 'espresso', name: 'Espresso Oscuro', palette: ['#3E271A', '#D6A54D', '#EFE2C8'], fiber: 'Lana Peinada Compacta' },
  { slug: 'salvia', name: 'Salvia Clara', palette: ['#7F8F71', '#2E3A26', '#EFE3C9'], fiber: 'Bambú y Algodón' },
  { slug: 'acero', name: 'Azul Acero', palette: ['#4A627A', '#F0E3C8', '#BA8838'], fiber: 'Algodón de 4 Hebras' },
  { slug: 'miel', name: 'Miel de Roble', palette: ['#C89445', '#3A2312', '#F4E8D0'], fiber: 'Algodón Peinado' },
  { slug: 'bronce', name: 'Bronce Viejo', palette: ['#7E5B32', '#EFE1C4', '#2F1D0E'], fiber: 'Lino y Lana Fina' },
  { slug: 'celeste', name: 'Azul Serenata', palette: ['#5B7A96', '#F3E7CE', '#9B6C2F'], fiber: 'Algodón Fresco' },
  { slug: 'arcilla', name: 'Arcilla Antigua', palette: ['#9F5741', '#F0E3CA', '#321B12'], fiber: 'Hilo de Algodón Mate' },
];

interface StitchVariantMeta {
  pattern: GarmentStitchPattern;
  label: string;
  hook: string;
  note: string;
}

const CROCHET_STITCH_VARIANTS: StitchVariantMeta[] = [
  {
    pattern: 'cable',
    label: 'Trenzado',
    hook: '3.5 mm',
    note: 'Trenzas en relieve tejidas en punto alto tomado por delante con estructura escultórica.',
  },
  {
    pattern: 'waffle',
    label: 'Punto Gofre',
    hook: '3.75 mm',
    note: 'Trama gofre tridimensional tejida a crochet con relieve cuadrado uniforme.',
  },
  {
    pattern: 'herringbone',
    label: 'Espiga',
    hook: '3.0 mm',
    note: 'Medio punto alto en espiga inclinado que aporta caída de sastrería limpia.',
  },
  {
    pattern: 'ribbed',
    label: 'Canalé',
    hook: '3.25 mm',
    note: 'Canalé vertical elástico tejido en hebra trasera con ajuste anatómico.',
  },
  {
    pattern: 'honeycomb',
    label: 'Punto Panal',
    hook: '3.5 mm',
    note: 'Celdas hexagonales en relieve de panal con gran riqueza táctil.',
  },
  {
    pattern: 'chevron',
    label: 'Chevrón',
    hook: '3.25 mm',
    note: 'Ondas geométricas en zigzag tonal tejidas a crochet con tensión pareja.',
  },
  {
    pattern: 'jacquard',
    label: 'Tapestry',
    hook: '3.5 mm',
    note: 'Punto bajo tapestry bicolor con motivo geométrico renacentista limpio.',
  },
  {
    pattern: 'argyle',
    label: 'Rombos',
    hook: '3.0 mm',
    note: 'Trama clásica de rombos entrelazados en crochet fino de estudio.',
  },
  {
    pattern: 'striped',
    label: 'Franjas',
    hook: '3.25 mm',
    note: 'Rayas horizontales equilibradas en punto musgo y medio punto compacto.',
  },
];

interface ArchetypeBlueprint {
  templateId: string;
  slot: 'top' | 'bottom';
  category: DressingRoomCategory;
  silhouette: GarmentSilhouetteKind;
  eyebrow: string;
  prefixes: string[];
  preferredStitches: GarmentStitchPattern[];
  subtitleBase: string;
}

const ARCHETYPE_BLUEPRINTS: ArchetypeBlueprint[] = [
  // 6 ENCIMA ARCHETYPES (79 variants each + 1 flagship = 80 each -> 480 Encima!)
  {
    templateId: 'tunica-vitruvio-lino',
    slot: 'top',
    category: 'Suéteres',
    silhouette: 'sweater',
    eyebrow: 'TÚNICAS HENLEY CROCHET',
    prefixes: ['Túnica Henley', 'Túnica de Atelier', 'Blusón Tejido', 'Camisa Crochet', 'Túnica Clásica'],
    preferredStitches: ['cable', 'honeycomb', 'ribbed', 'waffle', 'herringbone', 'chevron', 'argyle', 'striped'],
    subtitleBase: 'Túnica masculina tejida a crochet con escote Henley acordonado, celosía central y cenefas artesanales.',
  },
  {
    templateId: 'chaleco-taller-oliva',
    slot: 'top',
    category: 'Chalecos',
    silhouette: 'vest',
    eyebrow: 'CHALECOS DE SASTRERÍA',
    prefixes: ['Chaleco Sastre', 'Chaleco de Taller', 'Chaleco Escultor', 'Chaleco Clásico', 'Chaleco Artesanal'],
    preferredStitches: ['herringbone', 'chevron', 'ribbed', 'waffle', 'cable', 'honeycomb', 'argyle'],
    subtitleBase: 'Chaleco entallado sin mangas tejido a crochet con sisas limpias, botones de latón y cincha trasera.',
  },
  {
    templateId: 'cardigan-atelier-azul',
    slot: 'top',
    category: 'Cardigans',
    silhouette: 'cardigan',
    eyebrow: 'CÁRDIGANS SOLAPA CHAL',
    prefixes: ['Cárdigan Solapa Chal', 'Cárdigan de Atelier', 'Cárdigan Trenzado', 'Cárdigan Clásico', 'Cárdigan de Gala'],
    preferredStitches: ['cable', 'waffle', 'ribbed', 'honeycomb', 'herringbone', 'argyle', 'chevron'],
    subtitleBase: 'Cárdigan masculino a crochet con cuello chal acanalado, vivos en contraste y bolsillos parche.',
  },
  {
    templateId: 'jersey-geometrico-terracota',
    slot: 'top',
    category: 'Suéteres',
    silhouette: 'sweater',
    eyebrow: 'JERSEYS TAPESTRY',
    prefixes: ['Jersey Geométrico', 'Suéter Tapestry', 'Jersey Renacentista', 'Suéter Jacquard', 'Jersey de Estudio'],
    preferredStitches: ['jacquard', 'argyle', 'chevron', 'striped', 'cable', 'waffle', 'honeycomb'],
    subtitleBase: 'Jersey de cuello redondo tejido en tapestry crochet con cenefa geométrica en pecho, espalda y mangas.',
  },
  {
    templateId: 'chaqueta-corta-atelier',
    slot: 'top',
    category: 'Chaquetas',
    silhouette: 'jacket',
    eyebrow: 'CHAQUETAS CRUZADAS',
    prefixes: ['Chaqueta Corta', 'Blazer de Crochet', 'Americana de Taller', 'Chaqueta Cruzada', 'Saco Artesanal'],
    preferredStitches: ['waffle', 'herringbone', 'chevron', 'ribbed', 'honeycomb', 'cable', 'argyle'],
    subtitleBase: 'Chaqueta cruzada a crochet con solapas de pico, doble botonadura metálica y entalle estructurado.',
  },
  {
    templateId: 'sudadera-capucha-arena',
    slot: 'top',
    category: 'Suéteres',
    silhouette: 'hoodie',
    eyebrow: 'SUDADERAS CON CAPUCHA',
    prefixes: ['Sudadera con Capucha', 'Hoodie Crochet', 'Sudadera Raglán', 'Buzo de Taller', 'Sudadera Escultora'],
    preferredStitches: ['waffle', 'honeycomb', 'ribbed', 'cable', 'striped', 'chevron', 'herringbone'],
    subtitleBase: 'Sudadera tejida a crochet con capucha forrada en contraste, mangas raglán, cordones y bolsillo canguro.',
  },

  // 6 DEBAJO ARCHETYPES (79 variants each + 1 flagship = 80 each -> 480 Debajo!)
  {
    templateId: 'pantalon-sastre-marino',
    slot: 'bottom',
    category: 'Pantalones',
    silhouette: 'tailored-pants',
    eyebrow: 'PANTALONES SASTRE',
    prefixes: ['Pantalón Sastre', 'Pantalón de Pinzas', 'Pantalón Entallado', 'Pantalón de Gala', 'Pantalón Atelier'],
    preferredStitches: ['herringbone', 'ribbed', 'chevron', 'waffle', 'honeycomb', 'cable'],
    subtitleBase: 'Pantalón masculino a crochet de corte sastre con pinzas, raya frontal definida y hebilla lateral.',
  },
  {
    templateId: 'pantalon-atelier-arena',
    slot: 'bottom',
    category: 'Pantalones',
    silhouette: 'joggers',
    eyebrow: 'PANTALONES TRENZADOS',
    prefixes: ['Pantalón de Punto', 'Pantalón Trenzado', 'Jogger Trenzado', 'Pantalón Cónico', 'Pantalón Artesanal'],
    preferredStitches: ['cable', 'honeycomb', 'ribbed', 'waffle', 'herringbone', 'striped'],
    subtitleBase: 'Pantalón cónico tejido a crochet con banda trenzada lateral, cintura acanalada y cordón trenzado.',
  },
  {
    templateId: 'jogger-escultor-oliva',
    slot: 'bottom',
    category: 'Pantalones',
    silhouette: 'joggers',
    eyebrow: 'JOGGERS ESCULTORES',
    prefixes: ['Jogger Escultor', 'Jogger Gofre', 'Jogger Atlético', 'Jogger de Estudio', 'Jogger Crochet'],
    preferredStitches: ['waffle', 'honeycomb', 'ribbed', 'cable', 'chevron', 'striped'],
    subtitleBase: 'Jogger anatómico a crochet con puños elásticos ceñidos al tobillo, bolsillos ribeteados y cordón.',
  },
  {
    templateId: 'bermuda-clasica-marfil',
    slot: 'bottom',
    category: 'Bermudas',
    silhouette: 'shorts',
    eyebrow: 'BERMUDAS DE ESTUDIO',
    prefixes: ['Bermuda Clásica', 'Bermuda de Lino', 'Short Crochet', 'Bermuda Ribeteada', 'Bermuda de Verano'],
    preferredStitches: ['waffle', 'honeycomb', 'cable', 'ribbed', 'herringbone', 'striped'],
    subtitleBase: 'Bermuda masculina a crochet con banda inferior contrastante, cintura acanalada y jareta trenzada.',
  },
  {
    templateId: 'bermuda-taller-burdeos',
    slot: 'bottom',
    category: 'Bermudas',
    silhouette: 'shorts',
    eyebrow: 'BERMUDAS ACANALADAS',
    prefixes: ['Bermuda de Taller', 'Bermuda Acanalada', 'Bermuda Dorada', 'Short Canalé', 'Bermuda Cenefa'],
    preferredStitches: ['ribbed', 'chevron', 'argyle', 'waffle', 'cable', 'honeycomb'],
    subtitleBase: 'Bermuda atlética tejida en canalé vertical con cenefa chevrón bordada en contraste y cordón.',
  },
  {
    templateId: 'pantalon-cacao-chevron',
    slot: 'bottom',
    category: 'Pantalones',
    silhouette: 'tailored-pants',
    eyebrow: 'PANTALONES CHEVRÓN',
    prefixes: ['Pantalón Chevrón', 'Pantalón Espiga', 'Pantalón de Vuelta', 'Pantalón Clásico', 'Pantalón Tejido'],
    preferredStitches: ['chevron', 'herringbone', 'argyle', 'ribbed', 'waffle', 'cable'],
    subtitleBase: 'Pantalón entallado a crochet con textura espiga chevrón, trabillas, botón metálico y vuelta en tobillo.',
  },
];

const STITCH_LOOKUP = new Map<GarmentStitchPattern, StitchVariantMeta>(
  CROCHET_STITCH_VARIANTS.map((s) => [s.pattern, s])
);

const EDITION_SUFFIXES = [
  '',
  'de Atelier',
  'Edición Dorada',
  'de Estudio',
  'Artesanal',
  'del Taller',
];

function build960CrochetCatalog(): DressingRoomGarment[] {
  const generatedTops: DressingRoomGarment[] = [];
  const generatedBottoms: DressingRoomGarment[] = [];
  const VARIANTS_PER_ARCHETYPE = 79; // 12 flagships + 12 * 79 = 960 total designs!

  // Generate round-robin across variants & archetypes so browsing feels richly varied on every row
  for (let v = 0; v < VARIANTS_PER_ARCHETYPE; v++) {
    for (let aIdx = 0; aIdx < ARCHETYPE_BLUEPRINTS.length; aIdx++) {
      const bp = ARCHETYPE_BLUEPRINTS[aIdx];
      // Spread colorway & stitch cleanly with coprime strides so no two adjacent cards share color + stitch
      const colorIdx = (v * 5 + aIdx * 3 + Math.floor(v / 16)) % CROCHET_COLORWAYS.length;
      const cw = CROCHET_COLORWAYS[colorIdx];
      const stitchKey =
        bp.preferredStitches[(v + aIdx) % bp.preferredStitches.length];
      const st = STITCH_LOOKUP.get(stitchKey) || CROCHET_STITCH_VARIANTS[0];
      const prefix = bp.prefixes[(v + Math.floor(v / 7)) % bp.prefixes.length];

      // Construct clean, natural, non-duplicate Spanish artisanal name
      const tier = Math.floor(v / CROCHET_COLORWAYS.length);
      const edition = EDITION_SUFFIXES[(tier + aIdx) % EDITION_SUFFIXES.length];
      const name =
        tier === 0
          ? `${prefix} ${cw.name}`
          : tier === 1
            ? `${prefix} ${st.label} ${cw.name}`
            : `${prefix} ${cw.name} · ${st.label}${edition ? ` ${edition}` : ''}`;

      // Alternate contrast trim/accent ordering on later tiers for fresh 3-tone yarn combinations
      const p0 = cw.palette[0];
      const p1 = tier % 2 === 0 ? cw.palette[1] : cw.palette[2];
      const p2 = tier % 2 === 0 ? cw.palette[2] : cw.palette[1];

      const item: DressingRoomGarment = {
        id: `${bp.templateId}--v${String(v + 1).padStart(2, '0')}-${cw.slug}-${st.pattern}`,
        baseTemplateId: bp.templateId,
        name,
        category: bp.category,
        garmentSlot: bp.slot,
        silhouetteKind: bp.silhouette,
        stitchPattern: st.pattern,
        eyebrow: bp.eyebrow,
        subtitle: `${bp.subtitleBase} Acabado en ${st.label.toLowerCase()} tono ${cw.name.toLowerCase()}.`,
        fiber: cw.fiber,
        fiberDetail: `Tejido ${st.label.toLowerCase()}`,
        hookSizeMm: st.hook,
        stitchNote: st.note,
        palette: [p0, p1, p2],
        accentColor: p0,
      };

      if (bp.slot === 'top') {
        generatedTops.push(item);
      } else {
        generatedBottoms.push(item);
      }
    }
  }

  // Place the 12 flagship plates first, then interleave Tops and Bottoms smoothly for 960 total designs!
  const result: DressingRoomGarment[] = [
    ...CURATED_STYLIZED_TOPS,
    ...CURATED_STYLIZED_BOTTOMS,
  ];
  const maxLen = Math.max(generatedTops.length, generatedBottoms.length);
  for (let i = 0; i < maxLen; i++) {
    if (generatedTops[i]) result.push(generatedTops[i]);
    if (generatedBottoms[i]) result.push(generatedBottoms[i]);
  }
  return result;
}

export const FULL_MENSWEAR_CATALOG: DressingRoomGarment[] = build960CrochetCatalog();

/* ============================================================================
   3. PURE, BLOTCH-FREE STYLIZED CROCHET WEAVE TILE SYNTHESIZER
   Supports ALL 10 crochet stitch patterns dynamically in any of the 960 yarn
   palettes for ultra-crisp rendering on the Vitruvian!
============================================================================ */

export interface PlateTemplateData {
  width: number;
  height: number;
  rgba: Uint8ClampedArray;
  bgAlpha: Float32Array; // 0 = pure parchment background, 1 = garment foreground
  isTrim: Uint8Array; // 1 = accent/trim/hardware pixel, 0 = main yarn body
  medianLum: number;
}

export interface StudioPhotoPack {
  ready: boolean;
  templates: Record<string, PlateTemplateData>;
  cableSwatchCanvas: HTMLCanvasElement;
  waffleSwatchCanvas: HTMLCanvasElement;
}

const stylizedWeaveTileCache = new Map<string, HTMLCanvasElement>();

function hexToRgb(hex: string): [number, number, number] {
  const clean = (hex || '#DEC098').replace('#', '').trim();
  const full = clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean.padEnd(6, '0').slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [222, 192, 152];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbStr(r: number, g: number, b: number, a = 1): string {
  const cr = Math.max(0, Math.min(255, Math.round(r)));
  const cg = Math.max(0, Math.min(255, Math.round(g)));
  const cb = Math.max(0, Math.min(255, Math.round(b)));
  return a >= 1 ? `rgb(${cr},${cg},${cb})` : `rgba(${cr},${cg},${cb},${a})`;
}

/**
 * Generates a crisp, seamless stylized digital-art crochet fabric tile
 * tuned to each garment's exact yarn palette and crochet stitch pattern.
 */
export function getStylizedWeaveTile(garment: DressingRoomGarment): HTMLCanvasElement {
  const tpl = garment.baseTemplateId || garment.id;
  const stitch = garment.stitchPattern || 'waffle';
  const p0 = garment.palette[0] || garment.accentColor || '#DEC098';
  const p1 = garment.palette[1] || '#C8963E';
  const key = `${tpl}|${p0}|${p1}|${stitch}`;
  const cached = stylizedWeaveTileCache.get(key);
  if (cached) return cached;

  const [br, bg, bb] = hexToRgb(p0);
  const [tr, tg, tb] = hexToRgb(p1);
  const dark = rgbStr(br * 0.62, bg * 0.6, bb * 0.58);
  const midDark = rgbStr(br * 0.78, bg * 0.76, bb * 0.74);
  const softHi = rgbStr(
    br + (255 - br) * 0.24,
    bg + (255 - bg) * 0.22,
    bb + (255 - bb) * 0.18
  );

  const c = document.createElement('canvas');

  if (stitch === 'jacquard') {
    // Clean smooth painterly matte jersey knit ground (jacquard frieze drawn in VitruvianMan3D)
    c.width = 48;
    c.height = 48;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = rgbStr(br, bg, bb);
    ctx.fillRect(0, 0, 48, 48);
    ctx.strokeStyle = rgbStr(br * 0.84, bg * 0.8, bb * 0.78, 0.35);
    ctx.lineWidth = 1;
    for (let x = 0; x < 48; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 48);
      ctx.stroke();
    }
    ctx.strokeStyle = rgbStr(br + 24, bg + 18, bb + 14, 0.2);
    for (let y = 0; y < 48; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(48, y);
      ctx.stroke();
    }
  } else if (tpl === 'pantalon-sastre-marino' && stitch === 'herringbone') {
    // Sleek fine tailored twill weave
    c.width = 40;
    c.height = 40;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = rgbStr(br, bg, bb);
    ctx.fillRect(0, 0, 40, 40);
    ctx.strokeStyle = rgbStr(br * 0.76, bg * 0.76, bb * 0.8, 0.38);
    ctx.lineWidth = 1.2;
    for (let i = -40; i < 80; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 40, 40);
      ctx.stroke();
    }
    ctx.strokeStyle = rgbStr(br + 26, bg + 30, bb + 38, 0.16);
    for (let i = -40; i < 80; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i + 2, 0);
      ctx.lineTo(i + 42, 40);
      ctx.stroke();
    }
  } else if (stitch === 'herringbone' || stitch === 'chevron') {
    // Crisp sculpted herringbone / chevron vertical columns
    const W = 48;
    const H = 36;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = rgbStr(br, bg, bb);
    ctx.fillRect(0, 0, W, H);

    const colW = 12;
    for (let col = 0; col < W / colW; col++) {
      const x0 = col * colW;
      const flip = col % 2 === 1;
      ctx.strokeStyle = rgbStr(br * 0.65, bg * 0.63, bb * 0.6, 0.48);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, 0);
      ctx.lineTo(x0, H);
      ctx.stroke();

      for (let y = -12; y < H + 12; y += 6) {
        ctx.strokeStyle = midDark;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        if (!flip) {
          ctx.moveTo(x0 + 1, y + 5);
          ctx.lineTo(x0 + colW - 1, y);
        } else {
          ctx.moveTo(x0 + 1, y);
          ctx.lineTo(x0 + colW - 1, y + 5);
        }
        ctx.stroke();

        ctx.strokeStyle = softHi;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        if (!flip) {
          ctx.moveTo(x0 + 1, y + 7);
          ctx.lineTo(x0 + colW - 1, y + 2);
        } else {
          ctx.moveTo(x0 + 1, y + 2);
          ctx.lineTo(x0 + colW - 1, y + 7);
        }
        ctx.stroke();
      }
    }
  } else if (stitch === 'cable') {
    if (tpl === 'tunica-vitruvio-lino' || tpl === 'pantalon-atelier-arena') {
      // Fine sculpted linen/sand crochet vertical stitch texture
      const W = 40;
      const H = 40;
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = rgbStr(br, bg, bb);
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 8) {
        for (let x = 0; x < W; x += 8) {
          ctx.fillStyle = rgbStr(br * 0.76, bg * 0.72, bb * 0.66, 0.55);
          ctx.beginPath();
          ctx.roundRect(x + 1.5, y + 2, 4.5, 4.2, 1.5);
          ctx.fill();
          ctx.fillStyle = softHi;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, 4.2, 2.6, 1.2);
          ctx.fill();
        }
      }
    } else {
      // Sculpted vertical Aran cable-and-seed-stitch columns in any colorway
      const W = 64;
      const H = 64;
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = rgbStr(br, bg, bb);
      ctx.fillRect(0, 0, W, H);

      for (let y = 4; y < H; y += 8) {
        for (let x = 4; x < W; x += 8) {
          if (x > 16 && x < 48) continue;
          ctx.fillStyle = dark;
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = softHi;
          ctx.beginPath();
          ctx.arc(x - 0.6, y - 0.8, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.lineCap = 'round';
      ctx.strokeStyle = dark;
      ctx.lineWidth = 8.5;
      for (let y = -16; y <= H + 16; y += 20) {
        ctx.beginPath();
        ctx.moveTo(22, y);
        ctx.bezierCurveTo(42, y + 6, 42, y + 14, 22, y + 20);
        ctx.stroke();
      }
      ctx.strokeStyle = softHi;
      ctx.lineWidth = 4.2;
      for (let y = -16; y <= H + 16; y += 20) {
        ctx.beginPath();
        ctx.moveTo(22, y);
        ctx.bezierCurveTo(42, y + 6, 42, y + 14, 22, y + 20);
        ctx.stroke();
      }
      ctx.strokeStyle = dark;
      ctx.lineWidth = 7.5;
      for (let y = -6; y <= H + 16; y += 20) {
        ctx.beginPath();
        ctx.moveTo(42, y);
        ctx.bezierCurveTo(22, y + 6, 22, y + 14, 42, y + 20);
        ctx.stroke();
      }
      ctx.strokeStyle = rgbStr(br + 32, bg + 34, bb + 36);
      ctx.lineWidth = 3.8;
      for (let y = -6; y <= H + 16; y += 20) {
        ctx.beginPath();
        ctx.moveTo(42, y);
        ctx.bezierCurveTo(22, y + 6, 22, y + 14, 42, y + 20);
        ctx.stroke();
      }
    }
  } else if (stitch === 'ribbed') {
    // Crisp sculpted vertical ribbed crochet knit
    const W = 48;
    const H = 48;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = rgbStr(br, bg, bb);
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 8) {
      ctx.fillStyle = dark;
      ctx.fillRect(x, 0, 2.2, H);
      ctx.fillStyle = softHi;
      ctx.fillRect(x + 2.4, 0, 1.8, H);
      ctx.strokeStyle = midDark;
      ctx.lineWidth = 0.9;
      for (let y = 0; y < H; y += 6) {
        ctx.beginPath();
        ctx.moveTo(x + 2.5, y);
        ctx.lineTo(x + 5, y + 3);
        ctx.lineTo(x + 7.5, y);
        ctx.stroke();
      }
    }
  } else if (stitch === 'honeycomb') {
    // Sculpted hexagonal honeycomb crochet relief
    const W = 48;
    const H = 42;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = rgbStr(br, bg, bb);
    ctx.fillRect(0, 0, W, H);
    const drawHex = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = rgbStr(br * 0.78, bg * 0.76, bb * 0.74);
      ctx.fill();
      ctx.strokeStyle = softHi;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.strokeStyle = dark;
      ctx.lineWidth = 0.9;
      ctx.stroke();
    };
    const r = 7.4;
    for (let row = -1; row <= 3; row++) {
      for (let col = -1; col <= 4; col++) {
        const ox = (row % 2 === 0 ? 0 : 12) + col * 24;
        const oy = row * 14;
        drawHex(ox, oy, r);
      }
    }
  } else if (stitch === 'argyle') {
    // Classic atelier diamond argyle crochet lattice
    const W = 48;
    const H = 64;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = rgbStr(br, bg, bb);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgbStr(br * 0.86, bg * 0.84, bb * 0.82);
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(48, 32);
    ctx.lineTo(24, 64);
    ctx.lineTo(0, 32);
    ctx.closePath();
    ctx.fill();
    // Fine diagonal crochet overstitch lines in palette trim tint
    ctx.strokeStyle = rgbStr(tr, tg, tb, 0.45);
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(48, 64);
    ctx.moveTo(48, 0);
    ctx.lineTo(0, 64);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (stitch === 'striped') {
    // Balanced tonal & contrast artisanal crochet stripes
    const W = 48;
    const H = 48;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = rgbStr(br, bg, bb);
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = rgbStr(tr, tg, tb, 0.28);
    ctx.fillRect(0, 14, W, 10);
    ctx.fillStyle = dark;
    ctx.fillRect(0, 13, W, 1.5);
    ctx.fillRect(0, 24, W, 1.5);
    for (let y = 0; y < H; y += 6) {
      for (let x = 0; x < W; x += 6) {
        ctx.fillStyle = softHi;
        ctx.fillRect(x + 1, y + 1, 2.5, 1.4);
      }
    }
  } else {
    // Crisp sculpted micro-waffle / waffle crochet knit
    const step = tpl === 'chaqueta-corta-atelier' ? 9 : 11;
    const W = step * 4;
    const H = step * 4;
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = rgbStr(br, bg, bb);
    ctx.fillRect(0, 0, W, H);

    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, step - 4, step - 4, 2);
        ctx.fill();
        ctx.strokeStyle = softHi;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x + 0.8, y + step - 1);
        ctx.lineTo(x + 0.8, y + 0.8);
        ctx.lineTo(x + step - 1, y + 0.8);
        ctx.stroke();
      }
    }
  }

  stylizedWeaveTileCache.set(key, c);
  return c;
}

/* ============================================================================
   4. HIGH-FIDELITY LOOKBOOK CARD RE-DYEING STUDIO ENGINE
   Pre-extracts clean foreground & trim masks for all 12 flagship lookbook
   plates once, then renders any of the 960 designs on demand in <2ms on the
   exact warm ivory #F7EEDB parchment backdrop!
============================================================================ */

const PLATE_SOURCES: Record<string, { src: string; baseHex: string; trimHex: string }> = {
  'tunica-vitruvio-lino': { src: topTunicaLinoImg, baseHex: '#F2E6CE', trimHex: '#9B6532' },
  'chaleco-taller-oliva': { src: topChalecoOlivaImg, baseHex: '#677450', trimHex: '#B5893D' },
  'cardigan-atelier-azul': { src: topCardiganMarinoImg, baseHex: '#22385B', trimHex: '#EFE3C8' },
  'jersey-geometrico-terracota': { src: topJerseyTerracotaImg, baseHex: '#B3522C', trimHex: '#F2E5C9' },
  'chaqueta-corta-atelier': { src: topChaquetaCacaoImg, baseHex: '#69432B', trimHex: '#C99746' },
  'sudadera-capucha-arena': { src: topSudaderaArenaImg, baseHex: '#EBDAC0', trimHex: '#44556E' },
  'pantalon-sastre-marino': { src: botPantalonMarinoImg, baseHex: '#223659', trimHex: '#C4923B' },
  'pantalon-atelier-arena': { src: botPantalonArenaImg, baseHex: '#D5B68C', trimHex: '#4B2D1C' },
  'jogger-escultor-oliva': { src: botJoggerOlivaImg, baseHex: '#677452', trimHex: '#EFE3C6' },
  'bermuda-clasica-marfil': { src: botBermudaMarfilImg, baseHex: '#EFE0C2', trimHex: '#1B2D4C' },
  'bermuda-taller-burdeos': { src: botBermudaBurdeosImg, baseHex: '#72222E', trimHex: '#C89948' },
  'pantalon-cacao-chevron': { src: botPantalonCacaoImg, baseHex: '#6E4933', trimHex: '#C49549' },
};

const CARD_W = 240;
const CARD_H = 320;

function extractPlateTemplate(
  img: HTMLImageElement,
  baseHex: string,
  trimHex: string
): PlateTemplateData {
  const c = document.createElement('canvas');
  c.width = CARD_W;
  c.height = CARD_H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, CARD_W, CARD_H);

  const imgData = ctx.getImageData(0, 0, CARD_W, CARD_H);
  const d = imgData.data;
  const total = CARD_W * CARD_H;

  // Sample corner warm parchment color
  const bgR = d[0];
  const bgG = d[1];
  const bgB = d[2];

  // Flood-fill from image edges to detect smooth warm ivory parchment studio background
  const visited = new Uint8Array(total);
  const isBg = new Uint8Array(total);
  const queue = new Int32Array(total);
  let qHead = 0;
  let qTail = 0;

  const isLightBase = (hexToRgb(baseHex)[0] + hexToRgb(baseHex)[1] + hexToRgb(baseHex)[2]) / 3 > 192;
  const bgTol = isLightBase ? 26 : 42;

  const tryPush = (idx: number) => {
    if (visited[idx]) return;
    visited[idx] = 1;
    const o = idx * 4;
    const dr = d[o] - bgR;
    const dg = d[o + 1] - bgG;
    const db = d[o + 2] - bgB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    const lum = 0.299 * d[o] + 0.587 * d[o + 1] + 0.114 * d[o + 2];
    // Background is bright warm parchment (or soft floor cast shadow near very bottom)
    const y = Math.floor(idx / CARD_W);
    const floorShadow = y > CARD_H * 0.87 && dist < 76 && lum > 155;
    if (dist < bgTol || floorShadow) {
      isBg[idx] = 1;
      queue[qTail++] = idx;
    }
  };

  for (let x = 0; x < CARD_W; x++) {
    tryPush(x);
    tryPush((CARD_H - 1) * CARD_W + x);
  }
  for (let y = 0; y < CARD_H; y++) {
    tryPush(y * CARD_W);
    tryPush(y * CARD_W + (CARD_W - 1));
  }

  while (qHead < qTail) {
    const idx = queue[qHead++];
    const x = idx % CARD_W;
    const y = (idx - x) / CARD_W;
    if (x > 0) tryPush(idx - 1);
    if (x < CARD_W - 1) tryPush(idx + 1);
    if (y > 0) tryPush(idx - CARD_W);
    if (y < CARD_H - 1) tryPush(idx + CARD_W);
  }

  // Soft 1-pixel edge feathering on bgAlpha (1 = garment, 0 = parchment backdrop)
  const bgAlpha = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    bgAlpha[i] = isBg[i] ? 0 : 1;
  }
  // Smooth boundary transition so re-dyed garment edges blend organically onto #F7EEDB
  for (let y = 1; y < CARD_H - 1; y++) {
    for (let x = 1; x < CARD_W - 1; x++) {
      const i = y * CARD_W + x;
      if (!isBg[i]) {
        const bgNeighbors =
          isBg[i - 1] + isBg[i + 1] + isBg[i - CARD_W] + isBg[i + CARD_W];
        if (bgNeighbors > 0) {
          bgAlpha[i] = 1 - bgNeighbors * 0.16;
        }
      }
    }
  }

  // Classify main body vs. contrasting trim/accents & compute median body luminance
  const [br0, bg0, bb0] = hexToRgb(baseHex);
  const [tr0, tg0, tb0] = hexToRgb(trimHex);
  const baseSum = Math.max(1, br0 + bg0 + bb0);
  const trimSum = Math.max(1, tr0 + tg0 + tb0);
  const bRN = br0 / baseSum;
  const bGN = bg0 / baseSum;
  const bBN = bb0 / baseSum;
  const tRN = tr0 / trimSum;
  const tGN = tg0 / trimSum;
  const tBN = tb0 / trimSum;

  const isTrim = new Uint8Array(total);
  const lumHist = new Uint32Array(256);
  let fgCount = 0;

  for (let i = 0; i < total; i++) {
    if (bgAlpha[i] < 0.5) continue;
    const o = i * 4;
    const r = d[o];
    const g = d[o + 1];
    const b = d[o + 2];
    const lum = Math.min(255, Math.max(0, Math.round(0.299 * r + 0.587 * g + 0.114 * b)));
    const pSum = Math.max(1, r + g + b);
    const pRN = r / pSum;
    const pGN = g / pSum;
    const pBN = b / pSum;

    const dBaseChroma = Math.hypot(pRN - bRN, pGN - bGN, pBN - bBN);
    const dTrimChroma = Math.hypot(pRN - tRN, pGN - tGN, pBN - tBN);
    const baseLum = 0.299 * br0 + 0.587 * bg0 + 0.114 * bb0;
    const trimLum = 0.299 * tr0 + 0.587 * tg0 + 0.114 * tb0;
    const lumCloserToTrim =
      Math.abs(baseLum - trimLum) > 55 &&
      Math.abs(lum - trimLum) * 1.25 < Math.abs(lum - baseLum);

    if ((dTrimChroma + 0.045 < dBaseChroma && dBaseChroma > 0.07) || lumCloserToTrim) {
      isTrim[i] = 1;
    } else {
      lumHist[lum]++;
      fgCount++;
    }
  }

  // Median foreground body luminance (55th percentile gives natural mid-lit yarn brightness)
  let accum = 0;
  const targetCount = fgCount * 0.55;
  let medianLum = 128;
  for (let l = 0; l < 256; l++) {
    accum += lumHist[l];
    if (accum >= targetCount) {
      medianLum = Math.max(36, Math.min(224, l));
      break;
    }
  }

  return {
    width: CARD_W,
    height: CARD_H,
    rgba: d,
    bgAlpha,
    isTrim,
    medianLum,
  };
}

let cachedStudioPackPromise: Promise<StudioPhotoPack> | null = null;

export function loadStudioPhotoPack(): Promise<StudioPhotoPack> {
  if (cachedStudioPackPromise) return cachedStudioPackPromise;

  const entries = Object.entries(PLATE_SOURCES);
  cachedStudioPackPromise = Promise.all(
    entries.map(
      ([id, meta]) =>
        new Promise<[string, PlateTemplateData] | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              resolve([id, extractPlateTemplate(img, meta.baseHex, meta.trimHex)]);
            } catch {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = meta.src;
        })
    )
  ).then((results) => {
    const templates: Record<string, PlateTemplateData> = {};
    for (const r of results) {
      if (r) templates[r[0]] = r[1];
    }
    return {
      ready: true,
      templates,
      cableSwatchCanvas: getStylizedWeaveTile(CURATED_STYLIZED_TOPS[0]),
      waffleSwatchCanvas: getStylizedWeaveTile(CURATED_STYLIZED_TOPS[5]),
    };
  });

  return cachedStudioPackPromise;
}

const cardDataUrlCache = new Map<string, string>();
let sharedCardCanvas: HTMLCanvasElement | null = null;

function mapLuminanceToColor(
  lum: number,
  medianLum: number,
  tr: number,
  tg: number,
  tb: number
): [number, number, number] {
  const rel = lum / Math.max(32, medianLum);
  if (rel <= 1.0) {
    const shade = Math.pow(Math.max(0.06, rel), 1.08);
    return [tr * shade, tg * shade, tb * shade];
  }
  const hi = Math.min(0.74, (rel - 1.0) * 0.72);
  return [
    tr + (255 - tr) * hi,
    tg + (255 - tg) * hi,
    tb + (255 - tb) * hi,
  ];
}

export function renderPhotorealisticGarmentCard(
  garment: DressingRoomGarment,
  pack: StudioPhotoPack
): string {
  if (garment.photoDataUrl) return garment.photoDataUrl;

  const cacheKey = `${garment.id}`;
  const cached = cardDataUrlCache.get(cacheKey);
  if (cached) return cached;

  const tplId =
    garment.baseTemplateId ||
    (garment.garmentSlot === 'bottom' ? 'pantalon-sastre-marino' : 'tunica-vitruvio-lino');
  const tpl = pack.templates[tplId];
  if (!tpl) return '';

  if (!sharedCardCanvas) {
    sharedCardCanvas = document.createElement('canvas');
    sharedCardCanvas.width = tpl.width;
    sharedCardCanvas.height = tpl.height;
  }
  const ctx = sharedCardCanvas.getContext('2d', { willReadFrequently: true })!;
  const outImg = ctx.createImageData(tpl.width, tpl.height);
  const src = tpl.rgba;
  const dst = outImg.data;
  const bgAlpha = tpl.bgAlpha;
  const isTrim = tpl.isTrim;
  const medianLum = tpl.medianLum;

  const [br, bg, bb] = hexToRgb(garment.palette[0] || garment.accentColor || '#DEC098');
  const [tr, tg, tb] = hexToRgb(garment.palette[1] || '#C8963E');
  const trimMedian = Math.max(48, Math.min(210, 0.299 * tr + 0.587 * tg + 0.114 * tb));
  const total = tpl.width * tpl.height;

  for (let i = 0; i < total; i++) {
    const o = i * 4;
    const fg = bgAlpha[i];
    if (fg <= 0.01) {
      dst[o] = src[o];
      dst[o + 1] = src[o + 1];
      dst[o + 2] = src[o + 2];
      dst[o + 3] = 255;
      continue;
    }

    const r0 = src[o];
    const g0 = src[o + 1];
    const b0 = src[o + 2];
    const lum = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;

    let nr: number;
    let ng: number;
    let nb: number;
    if (isTrim[i]) {
      [nr, ng, nb] = mapLuminanceToColor(lum, Math.max(96, (medianLum + trimMedian) * 0.5), tr, tg, tb);
    } else {
      [nr, ng, nb] = mapLuminanceToColor(lum, medianLum, br, bg, bb);
    }

    if (fg < 0.99) {
      nr = src[o] * (1 - fg) + nr * fg;
      ng = src[o + 1] * (1 - fg) + ng * fg;
      nb = src[o + 2] * (1 - fg) + nb * fg;
    }

    dst[o] = Math.max(0, Math.min(255, Math.round(nr)));
    dst[o + 1] = Math.max(0, Math.min(255, Math.round(ng)));
    dst[o + 2] = Math.max(0, Math.min(255, Math.round(nb)));
    dst[o + 3] = 255;
  }

  ctx.putImageData(outImg, 0, 0);

  // Subtle artisanal crochet weave micro-badge in bottom-right corner of the card only if stitch differs?
  // No — keep the studio lookbook plate 100% pure, clean, zero overlaid text badges!
  const url = sharedCardCanvas.toDataURL('image/jpeg', 0.86);
  cardDataUrlCache.set(cacheKey, url);
  return url;
}

export type { GarmentSilhouetteKind, GarmentStitchPattern };
