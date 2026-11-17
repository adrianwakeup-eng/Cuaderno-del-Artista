export type StudioSection =
  | 'cuaderno'
  | 'patrones'
  | 'materiales'
  | 'proyectos'
  | 'stickers'
  | 'fuentes'
  | 'pinceles'
  | 'configuracion';

export type PaperStyle = 'grid' | 'dots' | 'plain';

export type FontChoice = 'lora' | 'cormorant' | 'caveat' | 'cinzel';

export type BrushCategory = 'pinceles' | 'tizas';

export type BrushPresetId =
  | 'tiza-suave'
  | 'tiza-pastel'
  | 'tiza-gruesa'
  | 'carboncillo'
  | 'difuminador'
  | 'borrador-suave'
  | 'pluma-fina'
  | 'hilo-crochet'
  | 'acuarela';

export type ActiveCanvasTool =
  | 'select'
  | 'draw'
  | 'eraser'
  | 'eyedropper'
  | 'text'
  | 'shape'
  | 'image'
  | 'sticker';

export interface BrushSettings {
  category: BrushCategory;
  preset: BrushPresetId;
  color: string;
  size: number; // 1 - 100
  opacity: number; // 5 - 100
  softness: number; // 0 - 100
}

export interface ImageFilters {
  brightness: number; // 50..150, default 100
  contrast: number; // 50..150, default 100
  saturate: number; // 0..200, default 100
  sepia: number; // 0..100, default 0
  blur: number; // 0..8, default 0
}

export type ImageFrameStyle = 'polaroid' | 'gold' | 'rounded' | 'minimal';

export type ShapeKind =
  | 'crochet-ring'
  | 'circle'
  | 'square'
  | 'arrow'
  | 'line'
  | 'heart';

export interface CopiedPatternData {
  id: string;
  stitchKey: string;
  name: string;
  abbreviation: string;
  description: string;
  letter?: string;
  group?: string;
  diagramGrid?: StitchSymbol[][];
}

export interface PageElement {
  id: string;
  side: 'left' | 'right';
  type: 'text' | 'sticker' | 'image' | 'shape' | 'pattern-note';
  x: number; // percentage 0..100 of single page width
  y: number; // percentage 0..100 of single page height
  width: number; // px relative to base page
  height?: number;
  content: string; // text body, sticker id, image dataUrl, or shape id
  color?: string;
  fontSize?: number;
  fontFamily?: FontChoice;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  fillColor?: string;
  shapeKind?: ShapeKind;
  rotation?: number;
  title?: string;
  flipX?: boolean;
  flipY?: boolean;
  opacity?: number; // 0.15..1
  frameStyle?: ImageFrameStyle;
  filters?: ImageFilters;
  patternData?: CopiedPatternData;
}

export interface NotebookSpread {
  id: string;
  title: string;
  paperStyle: PaperStyle;
  leftDrawingDataUrl?: string;
  rightDrawingDataUrl?: string;
  elements: PageElement[];
  updatedAt: string;
}

export type StitchSymbol = '' | '○' | '×' | 'T' | 'Ŧ' | 'V' | 'Λ' | '●' | '✿';

export interface PatternStep {
  id: string;
  roundLabel: string;
  instruction: string;
  stitchCount: number;
}

export interface CrochetPattern {
  id: string;
  title: string;
  category: 'Amigurumi' | 'Tapetes y Mandalas' | 'Mantas' | 'Prendas' | 'Accesorios';
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  hookSizeMm: string;
  yarnWeight: string;
  estimatedHours: number;
  materialsSummary: string;
  currentRound: number;
  steps: PatternStep[];
  diagramGrid: StitchSymbol[][]; // 10x10 stitch chart
  notes: string;
  createdAt: string;
}

export type MaterialKind = 'Lana / Hilo' | 'Ganchillo' | 'Accesorio';

export interface MaterialItem {
  id: string;
  name: string;
  brand: string;
  kind: MaterialKind;
  colorHex: string;
  colorName: string;
  fiberOrMaterial: string;
  weightOrSize: string; // e.g., "Sport / 2.5 mm" or "3.5 mm"
  quantity: number;
  unit: string; // e.g., "ovillos", "g", "unidades"
  locationNote: string;
}

export interface FinishedProject {
  id: string;
  title: string;
  status: 'Terminado' | 'En progreso';
  patternId?: string;
  patternTitle: string;
  materialsUsed: string;
  hookSizeMm: string;
  hoursSpent: number;
  completedDate: string;
  recipient: string;
  photoDataUrl: string;
  notes: string;
}

export interface NotebookWorkspaceData {
  spreads: NotebookSpread[];
  patterns: CrochetPattern[];
  materials: MaterialItem[];
  projects: FinishedProject[];
  recentColors: string[];
  selectedFont: FontChoice;
  musicEnabled: boolean;
  musicVolume: number;
  sfxEnabled: boolean;
  ambientWarmth: boolean;
}
