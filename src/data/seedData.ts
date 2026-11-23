import type {
  CrochetPattern,
  DeskNoteItem,
  FinishedProject,
  MaterialItem,
  NotebookSpread,
  NotebookWorkspaceData,
  PageElement,
  StitchSymbol,
} from '../types/crochet';

const emptyGrid = (): StitchSymbol[][] =>
  Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => '' as StitchSymbol));

const mandalaGrid = (): StitchSymbol[][] => {
  const g = emptyGrid();
  // Centered 7x7 mandala at [1..7, 1..7], center = (4,4)
  g[4][4] = '✿';
  // Round 1 around center
  g[3][4] = '○';
  g[5][4] = '○';
  g[4][3] = '○';
  g[4][5] = '○';
  g[3][3] = '×';
  g[3][5] = '×';
  g[5][3] = '×';
  g[5][5] = '×';
  // Round 2 ring [2..6]
  for (let i = 3; i <= 5; i++) {
    g[2][i] = 'Ŧ';
    g[6][i] = 'Ŧ';
    g[i][2] = 'Ŧ';
    g[i][6] = 'Ŧ';
  }
  g[2][2] = 'V';
  g[2][6] = 'V';
  g[6][2] = 'V';
  g[6][6] = 'V';
  // Round 3 outer petals [1..7]
  g[1][4] = '●';
  g[7][4] = '●';
  g[4][1] = '●';
  g[4][7] = '●';
  g[1][3] = '○';
  g[1][5] = '○';
  g[7][3] = '○';
  g[7][5] = '○';
  g[3][1] = '○';
  g[5][1] = '○';
  g[3][7] = '○';
  g[5][7] = '○';
  return g;
};

const grannyGrid = (): StitchSymbol[][] => {
  const g = emptyGrid();
  // Centered 5x5 granny square at [2..6, 2..6], center = (4,4)
  g[4][4] = '✿';
  // Round 1 chains & clusters
  g[3][4] = '○';
  g[5][4] = '○';
  g[4][3] = '○';
  g[4][5] = '○';
  g[3][3] = 'Ŧ';
  g[3][5] = 'Ŧ';
  g[5][3] = 'Ŧ';
  g[5][5] = 'Ŧ';
  // Round 2 sides & corners
  for (let i = 3; i <= 5; i++) {
    g[2][i] = 'Ŧ';
    g[6][i] = 'Ŧ';
    g[i][2] = 'Ŧ';
    g[i][6] = 'Ŧ';
  }
  g[2][2] = 'V';
  g[2][6] = 'V';
  g[6][2] = 'V';
  g[6][6] = 'V';
  return g;
};

export const ositoGrid = (): StitchSymbol[][] => {
  const g = emptyGrid();
  // Centered amigurumi sphere + ears chart at [1..7, 2..6]
  g[1][2] = '○';
  g[1][6] = '○';
  g[2][3] = '×';
  g[2][4] = '×';
  g[2][5] = '×';
  g[3][2] = 'V';
  g[3][3] = '×';
  g[3][4] = '×';
  g[3][5] = '×';
  g[3][6] = 'V';
  g[4][2] = '×';
  g[4][3] = '×';
  g[4][4] = '✿';
  g[4][5] = '×';
  g[4][6] = '×';
  g[5][2] = '×';
  g[5][3] = '×';
  g[5][4] = '×';
  g[5][5] = '×';
  g[5][6] = '×';
  g[6][3] = 'Λ';
  g[6][4] = 'Λ';
  g[6][5] = 'Λ';
  return g;
};

export type StickerCategory =
  | 'Flores'
  | 'Perlas'
  | 'Cuentas'
  | 'Hilos'
  | 'Herramientas'
  | 'Etiquetas';

export type { CrochetStickerDef } from './crochetStickersCatalog';
export { CROCHET_STICKERS, STICKER_RECIPE_MAP } from './crochetStickersCatalog';

export const INITIAL_LEFT_MANNEQUINS: PageElement[] = [
  {
    id: 'el-mannequin-front',
    side: 'left',
    type: 'mannequin',
    x: 5,
    y: 9,
    width: 192,
    content: 'front',
    mannequinGender: 'male',
    mannequinYawDeg: 0,
    color: 'natural',
    opacity: 1,
    title: 'Maniquí Hombre 360°',
  },
  {
    id: 'el-mannequin-back',
    side: 'left',
    type: 'mannequin',
    x: 50,
    y: 9,
    width: 192,
    content: 'front',
    mannequinGender: 'female',
    mannequinYawDeg: 0,
    color: 'natural',
    opacity: 1,
    title: 'Maniquí Mujer 360°',
  },
];

export const INITIAL_LEFT_WARDROBE: PageElement = {
  id: 'el-wardrobe-main',
  side: 'left',
  type: 'wardrobe',
  x: 4.5,
  y: 3.5,
  width: 430,
  content: 'closed',
  opacity: 1,
  title: 'Armario Barroco de Crochet',
};

export const INITIAL_ARMARIO_MANNEQUINS: PageElement[] = [
  {
    id: 'el-armario-mannequin-front',
    side: 'right',
    type: 'mannequin',
    x: 5,
    y: 9,
    width: 192,
    content: 'front',
    mannequinGender: 'male',
    mannequinYawDeg: 0,
    color: 'natural',
    opacity: 1,
    title: 'Maniquí Hombre 360°',
    permanent: true,
  },
  {
    id: 'el-armario-mannequin-back',
    side: 'right',
    type: 'mannequin',
    x: 50,
    y: 9,
    width: 192,
    content: 'front',
    mannequinGender: 'female',
    mannequinYawDeg: 0,
    color: 'natural',
    opacity: 1,
    title: 'Maniquí Mujer 360°',
    permanent: true,
  },
];

export const INITIAL_WARDROBE_SPREAD: NotebookSpread = {
  id: 'spread-armario',
  title: 'Mi Armario de Crochet',
  paperStyle: 'grid',
  updatedAt: '2026-11-19T08:00:00.000Z',
  elements: [
    INITIAL_LEFT_WARDROBE,
    ...INITIAL_ARMARIO_MANNEQUINS,
  ],
};

export const INITIAL_SPREADS: NotebookSpread[] = [
  INITIAL_WARDROBE_SPREAD,
  {
    id: 'spread-1',
    title: 'Portada Interior y Notas de Encaje',
    paperStyle: 'grid',
    updatedAt: '2026-11-18T05:30:00.000Z',
    elements: [
      ...INITIAL_LEFT_MANNEQUINS,
      {
        id: 'el-right-header',
        side: 'right',
        type: 'text',
        x: 10,
        y: 12,
        width: 270,
        content: 'Muestra: Mandala Encaje Borgoña',
        color: '#6b2229',
        fontSize: 25,
        fontFamily: 'cormorant',
      },
      {
        id: 'el-right-hand',
        side: 'right',
        type: 'text',
        x: 10,
        y: 24,
        width: 270,
        content:
          '• Hilo: Algodón mercerizado nº 8 (Crudo + Borgoña)\n• Ganchillo: 2.25 mm ergonómico\n• Diámetro final: 34 cm tras bloqueo',
        color: '#4f3320',
        fontSize: 20,
        fontFamily: 'caveat',
      },
      {
        id: 'el-right-photo',
        side: 'right',
        type: 'image',
        x: 16,
        y: 48,
        width: 220,
        content: '/assets/aistudio/image_e6ae2ac2.png',
        title: 'Mandala de portada',
        rotation: -1.5,
      },
    ],
  },
  {
    id: 'spread-2',
    title: 'Bocetos de Granny Squares y Paleta',
    paperStyle: 'dots',
    updatedAt: '2026-11-17T01:00:00.000Z',
    elements: [
      {
        id: 'el-s2-title',
        side: 'left',
        type: 'text',
        x: 12,
        y: 14,
        width: 260,
        content: 'Combinación de Otoño',
        color: '#4e2712',
        fontSize: 26,
        fontFamily: 'cormorant',
      },
      {
        id: 'el-s2-body',
        side: 'left',
        type: 'text',
        x: 12,
        y: 26,
        width: 265,
        content:
          'Vuelta 1: Centro en mostaza antiguo.\nVuelta 2: Pétalos en rosa empolvado.\nVuelta 3: Marco en crema crudo con puntos altos dobles.',
        color: '#5a3822',
        fontSize: 19,
        fontFamily: 'caveat',
      },
      {
        id: 'el-s2-granny',
        side: 'right',
        type: 'sticker',
        x: 24,
        y: 22,
        width: 155,
        content: 'granny-square',
        rotation: 2,
      },
      {
        id: 'el-s2-ovillo',
        side: 'right',
        type: 'sticker',
        x: 42,
        y: 58,
        width: 125,
        content: 'ovillo-crema',
        rotation: -5,
      },
    ],
  },
];

export const INITIAL_PATTERNS: CrochetPattern[] = [
  {
    id: 'pat-mandala-borgona',
    title: 'Mandala Encaje Borgoña',
    category: 'Tapetes y Mandalas',
    difficulty: 'Avanzado',
    hookSizeMm: '2.25 mm',
    yarnWeight: 'Fino / Algodón #8',
    estimatedHours: 9,
    materialsSummary: '120g algodón crudo, 45g algodón borgoña oscuro, aguja lanera',
    currentRound: 3,
    steps: [
      {
        id: 'st-1',
        roundLabel: 'Vuelta 1',
        instruction: 'Anillo mágico. 3 cad (cuenta como 1 pa), 15 pa dentro del anillo. Cerrar con pd en la 3ª cad. (16 puntos)',
        stitchCount: 16,
      },
      {
        id: 'st-2',
        roundLabel: 'Vuelta 2',
        instruction: '*1 pa, 2 cad* repetir alrededor de la vuelta. Cerrar con pd en el primer punto alto.',
        stitchCount: 48,
      },
      {
        id: 'st-3',
        roundLabel: 'Vuelta 3 (Borgoña)',
        instruction: 'Cambiar a hilo borgoña. En cada arco de 2 cad tejer (1 pb, 1 mpa, 1 pa, 1 mpa, 1 pb) formando pétalos.',
        stitchCount: 80,
      },
      {
        id: 'st-4',
        roundLabel: 'Vuelta 4',
        instruction: 'Volver a hilo crudo. Tejer arcos de 5 cad por detrás de cada pétalo sujetando con 1 pb en relieve.',
        stitchCount: 96,
      },
      {
        id: 'st-5',
        roundLabel: 'Vuelta 5 (Puntilla)',
        instruction: 'Abanicos de 7 pa dobles separados por picot de 3 cad en cada arco exterior. Rematar y bloquear.',
        stitchCount: 144,
      },
    ],
    diagramGrid: mandalaGrid(),
    notes: 'Ideal como centro de mesa o sobre tapa de madera rústica.',
    createdAt: '2026-11-10',
  },
  {
    id: 'pat-granny-floral',
    title: 'Granny Square Roseta Vintage',
    category: 'Mantas',
    difficulty: 'Principiante',
    hookSizeMm: '3.5 mm',
    yarnWeight: 'DK / Ligero',
    estimatedHours: 1.5,
    materialsSummary: '25g lana merino crema, 15g rosa antiguo, 15g salvia',
    currentRound: 2,
    steps: [
      {
        id: 'gr-1',
        roundLabel: 'Vuelta 1',
        instruction: 'Anillo mágico con 12 pa en rosa antiguo. Cerrar con punto deslizado.',
        stitchCount: 12,
      },
      {
        id: 'gr-2',
        roundLabel: 'Vuelta 2',
        instruction: 'En cada espacio: grupo piña de 3 pa cerrados juntos + 2 cad.',
        stitchCount: 36,
      },
      {
        id: 'gr-3',
        roundLabel: 'Vuelta 3 (Cuadrado)',
        instruction: 'Convertir círculo en cuadrado: esquinas de (3 pa, 2 cad, 3 pa) y lados con 3 mpa.',
        stitchCount: 48,
      },
    ],
    diagramGrid: grannyGrid(),
    notes: 'Unir 36 cuadros con punto deslizado por el revés para una manta de sofá.',
    createdAt: '2026-11-12',
  },
  {
    id: 'pat-osito-algodon',
    title: 'Osito Amigurumi de Algodón',
    category: 'Amigurumi',
    difficulty: 'Intermedio',
    hookSizeMm: '2.5 mm',
    yarnWeight: 'Sport / Algodón Peinado',
    estimatedHours: 6,
    materialsSummary: '80g algodón avena, 10g chocolate para nariz, relleno siliconado, ojos 8mm',
    currentRound: 1,
    steps: [
      {
        id: 'os-1',
        roundLabel: 'Cabeza V1-V6',
        instruction: 'Anillo mágico de 6 pb. Aumentar 6 pb por vuelta hasta alcanzar 36 pb.',
        stitchCount: 36,
      },
      {
        id: 'os-2',
        roundLabel: 'Cabeza V7-V12',
        instruction: 'Tejer 36 pb sin aumentos (6 vueltas). Colocar ojos de seguridad entre V9 y V10.',
        stitchCount: 36,
      },
      {
        id: 'os-3',
        roundLabel: 'Cierre',
        instruction: 'Disminuir 6 pb por vuelta rellenando firmemente antes de cerrar con aguja lanera.',
        stitchCount: 6,
      },
    ],
    diagramGrid: ositoGrid(),
    notes: 'Añadir un lazo de puntilla crochet alrededor del cuello.',
    createdAt: '2026-11-14',
  },
];

export const INITIAL_MATERIALS: MaterialItem[] = [
  {
    id: 'mat-1',
    name: 'Algodón Mercerizado Crudo',
    brand: 'Katia Panama',
    kind: 'Lana / Hilo',
    colorHex: '#E5CEAA',
    colorName: 'Crema Natural',
    fiberOrMaterial: '100% Algodón Mercerizado',
    weightOrSize: 'Fino · 2.0–2.5 mm',
    quantity: 5,
    unit: 'ovillos (50g)',
    locationNote: 'Cesta de mimbre superior',
  },
  {
    id: 'mat-2',
    name: 'Hilo Borgoña Profundo',
    brand: 'DMC Natura Just Cotton',
    kind: 'Lana / Hilo',
    colorHex: '#7A202A',
    colorName: 'Vino Borgoña',
    fiberOrMaterial: '100% Algodón Mate',
    weightOrSize: 'Fino · 2.25 mm',
    quantity: 3,
    unit: 'ovillos (50g)',
    locationNote: 'Cesta de mimbre superior',
  },
  {
    id: 'mat-3',
    name: 'Merino Rosa Empolvado',
    brand: 'Drops Baby Merino',
    kind: 'Lana / Hilo',
    colorHex: '#C76D73',
    colorName: 'Rosa Antiguo',
    fiberOrMaterial: '100% Lana Merino Extra Fina',
    weightOrSize: 'Sport · 3.0 mm',
    quantity: 4,
    unit: 'ovillos (50g)',
    locationNote: 'Caja de madera · Cajón 2',
  },
  {
    id: 'mat-4',
    name: 'Ganchillo Mango de Nogal 2.25 mm',
    brand: 'Tulip Etimo / Artesanal',
    kind: 'Ganchillo',
    colorHex: '#9C6234',
    colorName: 'Madera Nogal y Acero',
    fiberOrMaterial: 'Acero pulido y madera torneada',
    weightOrSize: '2.25 mm',
    quantity: 1,
    unit: 'unidad',
    locationNote: 'Estuche de cuero lateral',
  },
  {
    id: 'mat-5',
    name: 'Ganchillo Bambú 3.5 mm',
    brand: 'Clover Takumi',
    kind: 'Ganchillo',
    colorHex: '#D8B17E',
    colorName: 'Bambú Dorado',
    fiberOrMaterial: 'Bambú japonés pulido',
    weightOrSize: '3.5 mm',
    quantity: 1,
    unit: 'unidad',
    locationNote: 'Estuche de cuero lateral',
  },
  {
    id: 'mat-6',
    name: 'Tijeras Cigüeña y Marcadores',
    brand: 'Mercería Clásica',
    kind: 'Accesorio',
    colorHex: '#D1A04B',
    colorName: 'Latón Envejecido',
    fiberOrMaterial: 'Acero chapado en latón',
    weightOrSize: '9 cm + 20 marcadores',
    quantity: 1,
    unit: 'set',
    locationNote: 'Bolsillo frontal del cuaderno',
  },
];

export const INITIAL_PROJECTS: FinishedProject[] = [
  {
    id: 'proj-1',
    title: 'Tapete Mandala de la Portada',
    status: 'Terminado',
    patternId: 'pat-mandala-borgona',
    patternTitle: 'Mandala Encaje Borgoña',
    materialsUsed: 'Katia Panama Crudo + DMC Borgoña',
    hookSizeMm: '2.25 mm',
    hoursSpent: 9.5,
    completedDate: '2026-11-08',
    recipient: 'Mesa del taller',
    photoDataUrl: '/assets/aistudio/image_e6ae2ac2.png',
    notes: 'Bloqueado con almidón suave durante 24 horas. El contraste del borgoña resalta los abanicos.',
  },
  {
    id: 'proj-2',
    title: 'Colección Cuaderno y Flores de Crochet',
    status: 'Terminado',
    patternId: 'pat-granny-floral',
    patternTitle: 'Granny Square Roseta Vintage',
    materialsUsed: 'Merino Rosa Empolvado + Algodón Crema + Perlas nacaradas',
    hookSizeMm: '2.5 mm',
    hoursSpent: 4.0,
    completedDate: '2026-11-15',
    recipient: 'Encuadernación del Cuaderno',
    photoDataUrl: '/assets/aistudio/image_d9b77ad0.png',
    notes: 'Aplicaciones florales cosidas a las esquinas del pergamino y borde de cuero.',
  },
];

export const INITIAL_DESK_NOTES: DeskNoteItem[] = [
  {
    id: 'desk-note-1',
    text: 'Cada puntada cuenta una historia tejida con paciencia y cariño.',
    x: 6,
    y: 12,
    rotation: -6,
    tone: 'cream',
  },
  {
    id: 'desk-note-2',
    text: 'Tus manos crean magia, un punto a la vez.',
    x: 31,
    y: 16,
    rotation: 5,
    tone: 'ochre',
  },
  {
    id: 'desk-note-3',
    text: 'Respira, suelta la tensión y disfruta cada vuelta.',
    x: 18,
    y: 43,
    rotation: -3.5,
    tone: 'sage',
  },
  {
    id: 'desk-note-4',
    text: 'El crochet transforma hilos simples en abrazos eternos.',
    x: 7,
    y: 71,
    rotation: 4.5,
    tone: 'rose',
  },
  {
    id: 'desk-note-5',
    text: 'Los pequeños avances diarios tejen grandes obras maestras.',
    x: 33,
    y: 67,
    rotation: -5,
    tone: 'linen',
  },
];

export const DEFAULT_WORKSPACE: NotebookWorkspaceData = {
  spreads: INITIAL_SPREADS,
  patterns: INITIAL_PATTERNS,
  materials: INITIAL_MATERIALS,
  projects: INITIAL_PROJECTS,
  recentColors: ['#4E2712', '#7A202A', '#C76D73', '#E5CEAA', '#3366CC', '#2E5A44', '#D4A25C', '#1C130E'],
  selectedFont: 'lora',
  sfxEnabled: true,
  deskNotes: INITIAL_DESK_NOTES,
  mannequinsSeededV1: true,
  wardrobeSeededV1: true,
};
