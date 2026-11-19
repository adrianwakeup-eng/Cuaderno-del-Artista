export type StudioSection =
  | 'cuaderno'
  | 'patrones'
  | 'materiales'
  | 'proyectos'
  | 'stickers'
  | 'gifs'
  | 'fuentes'
  | 'pinceles'
  | 'vestidor'
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
  mandalaId?: string;
  imagePath?: string;
  diagramGrid?: StitchSymbol[][];
}

export interface PageElement {
  id: string;
  side: 'left' | 'right';
  type: 'text' | 'sticker' | 'image' | 'shape' | 'pattern-note' | 'mannequin' | 'wardrobe';
  x: number; // percentage 0..100 of single page width
  y: number; // percentage 0..100 of single page height
  width: number; // px relative to base page
  height?: number;
  content: string; // text body, sticker id, image dataUrl, shape id, 'front' | 'back', or 'closed' | 'open'
  originalContent?: string;
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

export interface DeskNoteItem {
  id: string;
  text: string;
  x: number; // percentage across cover stage (left desk area)
  y: number; // percentage down cover stage
  rotation: number; // degrees
  tone: 'cream' | 'ochre' | 'sage' | 'rose' | 'linen';
}

export type DressingRoomCategory =
  | 'Suéteres'
  | 'Chalecos'
  | 'Cardigans'
  | 'Chaquetas'
  | 'Accesorios'
  | 'Pantalones'
  | 'Bermudas';

export type GarmentSilhouetteKind =
  | 'sweater'
  | 'cardigan'
  | 'vest'
  | 'jacket'
  | 'hoodie'
  | 'polo'
  | 'coat'
  | 'scarf'
  | 'trousers'
  | 'joggers'
  | 'tailored-pants'
  | 'shorts';

export type GarmentStitchPattern =
  | 'cable'
  | 'jacquard'
  | 'herringbone'
  | 'ribbed'
  | 'waffle'
  | 'honeycomb'
  | 'striped'
  | 'heraldic'
  | 'chevron'
  | 'argyle';

export interface DressingRoomGarment {
  id: string;
  name: string;
  category: DressingRoomCategory;
  garmentSlot?: 'top' | 'bottom';
  silhouetteKind?: GarmentSilhouetteKind;
  stitchPattern?: GarmentStitchPattern;
  baseTemplateId?: string;
  eyebrow?: string;
  subtitle: string;
  fiber: string;
  fiberDetail?: string;
  hookSizeMm: string;
  stitchNote: string;
  palette: string[];
  accentColor: string;
  photoDataUrl?: string;
  backPhotoDataUrl?: string;
  isCustom?: boolean;
}

export interface NotebookWorkspaceData {
  spreads: NotebookSpread[];
  patterns: CrochetPattern[];
  materials: MaterialItem[];
  projects: FinishedProject[];
  recentColors: string[];
  selectedFont: FontChoice;
  sfxEnabled: boolean;
  deskNotes?: DeskNoteItem[];
  mannequinsSeededV1?: boolean;
  wardrobeSeededV1?: boolean;
  wardrobeItems?: DressingRoomGarment[];
  musicEnabled?: boolean;
  musicVolume?: number;
  ambientWarmth?: boolean;
}
