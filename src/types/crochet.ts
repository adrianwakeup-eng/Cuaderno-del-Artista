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
  | 'tiza-velo'
  | 'carboncillo'
  | 'difuminador'
  | 'borrador-suave'
  | 'pluma-fina'
  | 'acrilico-fino'
  | 'acrilico-satinado'
  | 'acrilico-detalle'
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

export interface ElementEraseStroke {
  points: Array<[number, number]>;
  vbH: number;
  width: number;
  soft?: boolean;
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
  extractedBaseContent?: string;
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
  eraseStrokes?: ElementEraseStroke[];
  locked?: boolean;
  permanent?: boolean;
  mannequinGender?: 'male' | 'female';
  mannequinYawDeg?: number;
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
  | 'Camisas'
  | 'Pulóveres'
  | 'Enguatadas'
  | 'Suéteres'
  | 'Cárdigans'
  | 'Chalecos'
  | 'Shorts'
  | 'Pantalones'
  | 'Cardigans'
  | 'Chaquetas'
  | 'Accesorios'
  | 'Bermudas';

export interface RunwayColorGrade {
  hueDeg?: number;
  satScale?: number;
  lightScale?: number;
  contrastScale?: number;
  tintHex?: string;
  tintStrength?: number; // 0..0.65
}

export interface GarmentAnglePhotos {
  front?: string;
  profileLeft?: string;
  back?: string;
  profileRight?: string;
}

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

export interface NonDestructiveCrop {
  /** Normalized focal & zoom framing (0..1) — original photo stays untouched */
  x: number; // 0..1 focal X (default 0.5)
  y: number; // 0..1 focal Y (default 0.5)
  zoom: number; // 1..2.5 (default 1)
  rotationDeg?: number; // 0 | 90 | 180 | 270
}

export interface CrochetAttachmentPhoto {
  id: string;
  label: string;
  dataUrl: string;
  addedAt: string;
}

export interface CrochetTechSheet {
  stitchType?: string;
  yarnWeight?: string;
  materials?: string;
  hookSize?: string;
  measurementsText?: string;
  seamDetails?: string;
  craftingNotes?: string;
  detailPhotos?: CrochetAttachmentPhoto[];
  patternPhotos?: CrochetAttachmentPhoto[];
}

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
  garmentViews?: GarmentAnglePhotos;
  modelViews?: GarmentAnglePhotos;
  /** Optional grayscale mask (0=skin/face/shoes, 255=garment yarn) for skin-safe runway colorways */
  garmentMaskUrl?: string;
  /** High-fashion runway house / atelier edition metadata */
  runwayHouseId?: string;
  runwayHouseName?: string;
  runwayColorGrade?: RunwayColorGrade;
  /** Non-destructive per-slot framing/crop keyed by e.g. 'garment-front' | 'model-front' */
  photoCrops?: Record<string, NonDestructiveCrop>;
  availableColorIds?: string[];
  favorite?: boolean;
  tags?: string[];
  sortOrder?: number;
  techSheet?: CrochetTechSheet;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isCustom?: boolean;
}

export type VestidorSpinSpeed = 'lento' | 'normal' | 'rapido';
export type VestidorPerformanceMode = 'ahorro' | 'equilibrado' | 'alto';

export interface VestidorPreferences {
  soundEnabled: boolean; // OFF by default per user spec
  spinSpeed: VestidorSpinSpeed;
  performanceMode: VestidorPerformanceMode;
  reduceMotion: boolean;
  autoSaveEnabled: boolean;
  lastSavedAt?: string;
}

export interface VestidorHistoryEntry {
  id: string;
  label: string;
  timestamp: string;
  snapshot: DressingRoomGarment[];
}

export type VestidorDecorKind =
  | 'macrame-curtain'
  | 'dreamcatcher'
  | 'crochet-flowers'
  | 'crochet-sunflower'
  | 'yarn-basket'
  | 'yarn-mini-basket'
  | 'yarn-ball'
  | 'sewing-machine'
  | 'potted-plant'
  | 'crochet-rug'
  | 'crochet-teddy'
  | 'custom-image';

export type VestidorDecorAnimation =
  | 'none'
  | 'sway'
  | 'pendulum'
  | 'nod'
  | 'float'
  | 'basket';

export interface VestidorDecorElement {
  id: string;
  kind: VestidorDecorKind;
  label: string;
  /** Position as percentage (0..100) of the editable stage area for responsive layout */
  xPct: number;
  yPct: number;
  /** Width as percentage (6..60) of the editable stage width; height preserves natural aspect ratio */
  widthPct: number;
  /** Layer ordering within the decoration container */
  zIndex: number;
  /** Rotation in degrees (-180..180) */
  rotationDeg: number;
  /** Horizontal flip */
  flipX?: boolean;
  /** Lock element against dragging, resizing, rotation, or deletion */
  locked?: boolean;
  /** Hide element temporarily from stage (restorable in Visual Editor) */
  hidden?: boolean;
  /** Independent per-element animation toggle */
  animated: boolean;
  /** Inherited CSS compositor animation style */
  animationKind: VestidorDecorAnimation;
  /** Optional accent/tint color (used by yarn balls, macramé ribbons, etc.) */
  tintColor?: string;
  /** Optional texture/opacity config preserved across copies */
  opacity?: number;
  /** Optional custom uploaded transparent image data URL */
  customDataUrl?: string;
  /** Intrinsic aspect ratio (width / height) to preserve proportions during resize */
  aspectRatio: number;
}

export interface ExtractedMandalaRecord {
  baseDataUrl: string;
  coloredDataUrl: string;
  updatedAt: string;
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
  mannequinsFullBody360V1?: boolean;
  wardrobeSeededV1?: boolean;
  wardrobeItems?: DressingRoomGarment[];
  extractedMandalas?: Record<string, ExtractedMandalaRecord>;
  hiddenCatalogSpreadIds?: string[];
  hiddenMandalaSpreadIds?: string[];
  musicEnabled?: boolean;
  musicVolume?: number;
  ambientWarmth?: boolean;
}
