import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ZoomIn,
  ZoomOut,
  Trash2,
  RotateCw,
  Eraser,
  Crop,
  SlidersHorizontal,
  FlipHorizontal2,
  FlipVertical2,
  Copy,
  CopyPlus,
  ArrowUpToLine,
  ArrowDownToLine,
  Frame,
  Check,
  Edit3,
  Sparkles,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  PaintBucket,
  Pipette,
  Scissors,
  X,
  Minimize2,
  Wand2,
  Loader2,
  RotateCcw,
  Type,
  Palette,
  Lock,
  Unlock,
  GripVertical,
  Volume2,
  Play,
  Pause,
  Download,
} from 'lucide-react';
import type {
  ActiveCanvasTool,
  BrushSettings,
  CopiedPatternData,
  CrochetPattern,
  ElementEraseStroke,
  ExtractedMandalaRecord,
  FontChoice,
  ImageFilters,
  ImageFrameStyle,
  NotebookSpread as SpreadType,
  PageElement,
  PaperStyle,
  ShapeKind,
  WardrobeSeasonId,
} from '../types/crochet';
import { CROCHET_ALPHABET } from '../data/crochetAlphabet';
import {
  CALLIGRAPHY_CATEGORIES,
  CALLIGRAPHY_FONTS,
  getFontMeta,
} from '../data/calligraphyFonts';
import { MUSEUM_FRAMES, getMuseumFrameById } from '../data/museumFrames';
import {
  ensureCalligraphyFontLoaded,
  ensureCalligraphyFontsLoaded,
} from '../utils/calligraphyFontLoader';
import { CrochetStickerSvg } from './CrochetDecorations';
import { DiagramGridSvg, StitchSymbolSvg } from './StitchSymbolSvg';
import { CrochetMandalaSvg } from './CrochetMandalaSvg';
import { CROCHET_MANDALAS } from '../data/crochetMandalas';
import { MANDALA_GALLERY_PHOTOS } from '../data/mandalaGalleryPhotos';
import { textReaderEngine, type TextReaderState } from '../utils/textReaderEngine';
import { TextReaderBar } from './TextReaderBar';
import { MannequinSvg } from './MannequinSvg';
import {
  getYawAngleLabel,
  normalizeYawDeg,
  renderMannequinPngBlob,
} from '../utils/mannequin3DWoodRenderer';
import { CrochetWardrobe3D } from './CrochetWardrobe3D';
import { ImageCropModal } from './ImageCropModal';
import { MandalaColorStudioModal } from './MandalaColorStudioModal';
import { audioEngine } from '../utils/audioEngine';
import { extractFigureMatting } from '../utils/aiImageMatting';
import {
  downloadImageAsVectorSvg,
  enhanceUploadedImageToUltraHD,
  exportImageAt8K,
} from '../utils/ultraHdImageEngine';
import {
  createStrokeState,
  drawHyperrealStrokeSegment,
  type HyperrealStrokeState,
} from '../utils/hyperrealBrushEngine';
import type { LayerAction, LayerVisibility, StackableLayerId } from './RightToolPanels';
import {
  CatalogSpreadMiniature,
  EditableSpreadMiniature,
  MandalaSpreadMiniature,
} from './SpreadMiniaturePreview';

interface NotebookSpreadProps {
  spreads: SpreadType[];
  patterns: CrochetPattern[];
  currentSpreadIndex: number;
  onChangeSpreadIndex: (index: number) => void;
  notebookMode?: 'book' | 'mandalas';
  onChangeNotebookMode?: (mode: 'book' | 'mandalas') => void;
  mandalaSpreadIndex?: number;
  onChangeMandalaSpreadIndex?: (index: number) => void;
  onAddSpread: () => void;
  onDeleteSpread?: (spreadId: string) => void;
  onReorderSpreads?: (fromIndex: number, toIndex: number) => void;
  hiddenCatalogSpreadIds?: string[];
  hiddenMandalaSpreadIds?: string[];
  onDeleteCatalogSpread?: (catalogSpreadId: string, visibleIdx: number) => void;
  onDeleteMandalaSpread?: (
    mandalaSpreadId: string,
    visibleIdx: number,
    totalVisible: number
  ) => void;
  onRestoreHiddenPages?: () => void;
  onUpdateSpread: (spread: SpreadType) => void;
  activeTool: ActiveCanvasTool;
  onSelectTool: (tool: ActiveCanvasTool) => void;
  selectedShapeKind: ShapeKind;
  brush: BrushSettings;
  onPickColorFromCanvas: (hex: string) => void;
  selectedFont: FontChoice;
  extractedMandalas?: Record<string, ExtractedMandalaRecord>;
  onSaveExtractedMandala?: (mandalaId: string, record: ExtractedMandalaRecord) => void;
  onRestoreExtractedMandala?: (mandalaId: string) => void;
  copiedPattern: CopiedPatternData | null;
  onCopyPattern: (pat: CopiedPatternData) => void;
  onPastePatternOnSpread: (
    spreadId: string,
    side?: 'left' | 'right',
    patternOverride?: CopiedPatternData
  ) => void;
  onPasteExternalImage?: (file: File) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onPlayPageFlip: () => void;
  onEnterDressingRoom?: (season?: WardrobeSeasonId) => void;
  onNotify?: (msg: string) => void;
  dockedMode?: boolean;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  layerVisibility?: LayerVisibility;
  layerOrder?: StackableLayerId[];
  onStepLayerOrder?: (layer: StackableLayerId, dir: 'up' | 'down') => void;
  layerActionSignal?: { id: number; action: LayerAction } | null;
  cyclePaperSignal?: number;
  turnPageSignal?: { id: number; dir: 'prev' | 'next' } | null;
  toggleOverviewSignal?: number;
  addTextSignal?: number;
  onConsumeAddTextSignal?: () => void;
  rotateAllSignal?: {
    id: number;
    mode: 'set' | 'delta' | 'reset';
    value: number;
  } | null;
  zoom?: number;
  onChangeZoom?: (zoom: number) => void;
  onSpreadMetaChange?: (meta: {
    isCatalog: boolean;
    paperStyle: PaperStyle;
    hasSelected: boolean;
    hasDrawings: boolean;
    hasElements: boolean;
    title: string;
    totalBookSpreads: number;
    catalogCount: number;
    showOverview: boolean;
    allRotateAngle: number;
  }) => void;
}

const DEFAULT_FILTERS: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  sepia: 0,
  blur: 0,
};

const PAGE_W = 1280;
const PAGE_H = 1670;
const PATTERNS_PER_CATALOG_PAGE = 4; // 4 left + 4 right = 8 patterns per spread
const MANDALAS_PER_PAGE = 6; // 6 left + 6 right = 12 mandalas per spread

interface CatalogSpreadDef {
  id: string;
  title: string;
  leftItems: CopiedPatternData[];
  rightItems: CopiedPatternData[];
}

export const NotebookSpread: React.FC<NotebookSpreadProps> = ({
  spreads,
  patterns,
  currentSpreadIndex,
  onChangeSpreadIndex,
  notebookMode = 'book',
  onChangeNotebookMode,
  mandalaSpreadIndex = 0,
  onChangeMandalaSpreadIndex,
  onAddSpread,
  onDeleteSpread,
  onReorderSpreads,
  hiddenCatalogSpreadIds,
  hiddenMandalaSpreadIds,
  onDeleteCatalogSpread,
  onDeleteMandalaSpread,
  onRestoreHiddenPages,
  onUpdateSpread,
  activeTool,
  onSelectTool,
  selectedShapeKind,
  brush,
  onPickColorFromCanvas,
  selectedFont,
  extractedMandalas,
  onSaveExtractedMandala,
  onRestoreExtractedMandala,
  copiedPattern,
  onCopyPattern,
  onPastePatternOnSpread,
  onPasteExternalImage,
  onUndo,
  onRedo,
  onPlayPageFlip,
  onEnterDressingRoom,
  onNotify,
  dockedMode = false,
  focusMode = false,
  onToggleFocusMode,
  layerVisibility = { notes: true, drawing: true, images: true, background: true },
  layerOrder = ['notes', 'drawing', 'images'],
  onStepLayerOrder,
  layerActionSignal = null,
  cyclePaperSignal = 0,
  turnPageSignal = null,
  toggleOverviewSignal = 0,
  addTextSignal = 0,
  onConsumeAddTextSignal,
  rotateAllSignal = null,
  zoom: controlledZoom,
  onChangeZoom,
  onSpreadMetaChange,
}) => {
  // Build the initial Pattern Catalog spreads shown on the FIRST pages of the book
  const catalogSpreads = useMemo<CatalogSpreadDef[]>(() => {
    const alphabetItems: CopiedPatternData[] = [...CROCHET_ALPHABET]
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map((entry) => ({
        id: entry.id,
        stitchKey: entry.stitchKey,
        name: entry.name,
        abbreviation: entry.abbreviation,
        description: entry.description,
        letter: entry.letter,
        group: entry.group,
      }));

    const customItems: CopiedPatternData[] = patterns.map((p) => ({
      id: p.id,
      stitchKey: 'custom',
      name: p.title,
      abbreviation: p.hookSizeMm,
      description: `${p.materialsSummary} · ${p.steps.length} vueltas`,
      letter: p.title.charAt(0).toUpperCase() || 'P',
      group: p.category,
      diagramGrid: p.diagramGrid,
    }));

    const allItems = [...customItems, ...alphabetItems];
    const perSpread = PATTERNS_PER_CATALOG_PAGE * 2;
    const chunks: CatalogSpreadDef[] = [];

    for (let i = 0; i < allItems.length; i += perSpread) {
      const slice = allItems.slice(i, i + perSpread);
      const spreadNum = chunks.length + 1;
      chunks.push({
        id: `catalog-spread-${spreadNum}`,
        title: `Catálogo de Patrones · Pliego ${spreadNum}`,
        leftItems: slice.slice(0, PATTERNS_PER_CATALOG_PAGE),
        rightItems: slice.slice(PATTERNS_PER_CATALOG_PAGE, perSpread),
      });
    }
    const hiddenCat = new Set(hiddenCatalogSpreadIds ?? []);
    return chunks.filter((c) => !hiddenCat.has(c.id));
  }, [patterns, hiddenCatalogSpreadIds]);

  const allMandalaItems = useMemo<CopiedPatternData[]>(() => {
    const photoItems: CopiedPatternData[] = MANDALA_GALLERY_PHOTOS.map((p) => ({
      id: p.id,
      stitchKey: 'mandala',
      name: p.name,
      abbreviation: p.badge,
      description: p.category,
      group: p.category,
      imagePath: p.imagePath,
    }));
    const vectorItems: CopiedPatternData[] = CROCHET_MANDALAS.map((m) => ({
      id: m.id,
      stitchKey: 'mandala',
      name: m.name,
      abbreviation: `${m.rounds}v · ${m.hookMm}`,
      description: m.yarnNote,
      group: 'Mandala Vectorial',
      mandalaId: m.id,
    }));
    return [...photoItems, ...vectorItems];
  }, []);

  const mandalaSpreads = useMemo<CatalogSpreadDef[]>(() => {
    const perSpread = MANDALAS_PER_PAGE * 2;
    const chunks: CatalogSpreadDef[] = [];
    for (let i = 0; i < allMandalaItems.length; i += perSpread) {
      const slice = allMandalaItems.slice(i, i + perSpread);
      const spreadNum = chunks.length + 1;
      const firstGroup = slice[0]?.group || 'Mandalas';
      chunks.push({
        id: `mandala-spread-${spreadNum}`,
        title: `Mandalas · ${firstGroup} (Pliego ${spreadNum})`,
        leftItems: slice.slice(0, MANDALAS_PER_PAGE),
        rightItems: slice.slice(MANDALAS_PER_PAGE, perSpread),
      });
    }
    const hiddenMandala = new Set(hiddenMandalaSpreadIds ?? []);
    return chunks.filter((c) => !hiddenMandala.has(c.id));
  }, [allMandalaItems, hiddenMandalaSpreadIds]);

  const isMandalaMode = notebookMode === 'mandalas';
  const catalogCount = catalogSpreads.length;
  const totalBookSpreads = catalogCount + spreads.length;
  const safeIndex = Math.max(0, Math.min(totalBookSpreads - 1, currentSpreadIndex));
  const safeMandalaIndex = Math.max(0, Math.min(mandalaSpreads.length - 1, mandalaSpreadIndex));
  const activeTotalSpreads = isMandalaMode ? mandalaSpreads.length : totalBookSpreads;
  const activeSafeIndex = isMandalaMode ? safeMandalaIndex : safeIndex;

  const isCatalogSpread = !isMandalaMode && safeIndex < catalogCount;
  const isCatalogView = isMandalaMode || isCatalogSpread;
  const activeMandalaSpread = isMandalaMode ? mandalaSpreads[safeMandalaIndex] : null;
  const activeCatalogSpread = isCatalogSpread ? catalogSpreads[safeIndex] : null;
  const activeUserSpread =
    !isMandalaMode && !isCatalogSpread ? spreads[safeIndex - catalogCount] ?? spreads[0] : null;

  const [internalZoom, setInternalZoom] = useState(100);
  const zoom = controlledZoom ?? internalZoom;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const setZoom = useCallback(
    (updater: number | ((z: number) => number)) => {
      const current = zoomRef.current;
      const rawNext = typeof updater === 'function' ? updater(current) : updater;
      const next = Math.max(25, Math.min(800, Math.round(rawNext)));
      zoomRef.current = next;
      if (onChangeZoom) onChangeZoom(next);
      else setInternalZoom(next);
    },
    [onChangeZoom]
  );
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedCatalogPattern, setSelectedCatalogPattern] = useState<CopiedPatternData | null>(null);
  const [previewMandala, setPreviewMandala] = useState<CopiedPatternData | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [dragSpreadIdx, setDragSpreadIdx] = useState<number | null>(null);
  const [dropTargetSpreadIdx, setDropTargetSpreadIdx] = useState<number | null>(null);

  // Photo, Word, Paint & Rotation popups / modal state
  const [editorSubPanel, setEditorSubPanel] = useState<
    | 'adjust'
    | 'frame'
    | 'opacity'
    | 'symbol-color'
    | 'text-color'
    | 'shape-color'
    | 'mannequin-color'
    | 'mannequin-yaw'
    | 'rotate'
    | 'rotate-all'
    | null
  >(null);
  const [allRotateAngle, setAllRotateAngle] = useState(0);
  const [croppingElement, setCroppingElement] = useState<PageElement | null>(null);
  const [mattingElementId, setMattingElementId] = useState<string | null>(null);
  const [mattingProgress, setMattingProgress] = useState<number>(0);
  const [mattingMandalaId, setMattingMandalaId] = useState<string | null>(null);
  const mattedMandalaMap = useMemo<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    if (extractedMandalas) {
      for (const [id, rec] of Object.entries(extractedMandalas)) {
        out[id] = rec.coloredDataUrl || rec.baseDataUrl;
      }
    }
    return out;
  }, [extractedMandalas]);
  const mattedBaseMandalaMap = useMemo<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    if (extractedMandalas) {
      for (const [id, rec] of Object.entries(extractedMandalas)) {
        out[id] = rec.baseDataUrl;
      }
    }
    return out;
  }, [extractedMandalas]);
  const extractedElementBaseRef = useRef<Record<string, string>>({});
  const [colorStudioTarget, setColorStudioTarget] = useState<
    | { kind: 'mandala'; item: CopiedPatternData; baseImageSrc: string }
    | { kind: 'element'; elementId: string; title: string; baseImageSrc: string }
    | null
  >(null);
  const [copiedElement, setCopiedElement] = useState<Omit<PageElement, 'id'> | null>(null);
  const [clipboardMode, setClipboardMode] = useState<'element' | 'pattern' | null>(null);
  const pasteCountRef = useRef(0);
  const skipNextPatternSyncRef = useRef(false);

  // Tactile 3D Page-Turn State
  const [flipDir, setFlipDir] = useState<'next' | 'prev' | null>(null);
  const [flipAngle, setFlipAngle] = useState(0);
  const [isAnimatingFlip, setIsAnimatingFlip] = useState(false);
  const dragFlipRef = useRef<{
    dir: 'next' | 'prev';
    startX: number;
    width: number;
  } | null>(null);

  const bookViewportRef = useRef<HTMLDivElement>(null);
  const bookContainerRef = useRef<HTMLDivElement>(null);
  const bookContentRef = useRef<HTMLDivElement>(null);
  const lastActiveSideRef = useRef<'left' | 'right'>('right');
  const [bookBaseSize, setBookBaseSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const skipAutoCenterZoomRef = useRef(false);
  const prevZoomForCenterRef = useRef(zoom);
  const zoomAnchorRef = useRef<{
    bookX: number;
    bookY: number;
    anchorX: number;
    anchorY: number;
  } | null>(null);

  // Measure unscaled intrinsic book size (w-max inner cover) so zooming 25%-500% has ZERO feedback loop
  useEffect(() => {
    const node = bookContentRef.current;
    if (!node) return;
    const updateSize = () => {
      const w = node.offsetWidth;
      const h = node.offsetHeight;
      if (w > 0 && h > 0) {
        setBookBaseSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(node);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [showOverview, isMandalaMode, isCatalogSpread, dockedMode, focusMode]);

  // Synchronously keep scroll anchored to the exact viewport center or cursor point BEFORE paint (zero jump/drift)
  useLayoutEffect(() => {
    const prevZoom = prevZoomForCenterRef.current;
    prevZoomForCenterRef.current = zoom;
    if (prevZoom === zoom) return;
    if (skipAutoCenterZoomRef.current) {
      skipAutoCenterZoomRef.current = false;
      zoomAnchorRef.current = null;
      return;
    }
    const viewport = bookViewportRef.current;
    if (!viewport || bookBaseSize.w <= 0 || bookBaseSize.h <= 0) {
      zoomAnchorRef.current = null;
      return;
    }

    const nextScale = zoom / 100;
    const nextScaledW = bookBaseSize.w * nextScale;
    const nextScaledH = bookBaseSize.h * nextScale;
    const nextOffsetX = Math.max(0, (viewport.clientWidth - nextScaledW) / 2);
    const nextOffsetY = Math.max(0, (viewport.clientHeight - nextScaledH) / 2);

    const customAnchor = zoomAnchorRef.current;
    zoomAnchorRef.current = null;

    let bookX: number;
    let bookY: number;
    let anchorX: number;
    let anchorY: number;

    if (customAnchor) {
      bookX = customAnchor.bookX;
      bookY = customAnchor.bookY;
      anchorX = customAnchor.anchorX;
      anchorY = customAnchor.anchorY;
    } else {
      const prevScale = prevZoom / 100;
      const prevScaledW = bookBaseSize.w * prevScale;
      const prevScaledH = bookBaseSize.h * prevScale;
      const prevOffsetX = Math.max(0, (viewport.clientWidth - prevScaledW) / 2);
      const prevOffsetY = Math.max(0, (viewport.clientHeight - prevScaledH) / 2);
      anchorX = viewport.clientWidth / 2;
      anchorY = viewport.clientHeight / 2;
      bookX = (viewport.scrollLeft + anchorX - prevOffsetX) / prevScale;
      bookY = (viewport.scrollTop + anchorY - prevOffsetY) / prevScale;
    }

    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    viewport.scrollLeft = Math.max(0, Math.min(maxScrollLeft, bookX * nextScale + nextOffsetX - anchorX));
    viewport.scrollTop = Math.max(0, Math.min(maxScrollTop, bookY * nextScale + nextOffsetY - anchorY));
  }, [zoom, bookBaseSize.w, bookBaseSize.h]);

  // Space-key pan mode + Middle-mouse pan + 2-Finger Touch Pinch-to-Zoom + Trackpad/Ctrl+Wheel Zoom (25%-500%)
  useEffect(() => {
    const onSpaceDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      setIsSpacePanning(true);
    };
    const onSpaceUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePanning(false);
    };
    const onBlur = () => setIsSpacePanning(false);
    window.addEventListener('keydown', onSpaceDown);
    window.addEventListener('keyup', onSpaceUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onSpaceDown);
      window.removeEventListener('keyup', onSpaceUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    const viewport = bookViewportRef.current;
    if (!viewport || showOverview) return;

    let pinchState: {
      startDist: number;
      startZoom: number;
      bookX: number;
      bookY: number;
    } | null = null;

    let panState: {
      startX: number;
      startY: number;
      scrollLeft: number;
      scrollTop: number;
    } | null = null;

    const getTouchDist = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const getBookOffset = (scale: number) => {
      const baseW = bookContentRef.current?.offsetWidth || bookBaseSize.w || viewport.clientWidth;
      const baseH = bookContentRef.current?.offsetHeight || bookBaseSize.h || viewport.clientHeight;
      return {
        offsetX: Math.max(0, (viewport.clientWidth - baseW * scale) / 2),
        offsetY: Math.max(0, (viewport.clientHeight - baseH * scale) / 2),
      };
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.max(12, getTouchDist(t1, t2));
        const rect = viewport.getBoundingClientRect();
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
        const startZoom = zoomRef.current;
        const startScale = startZoom / 100;
        const { offsetX, offsetY } = getBookOffset(startScale);
        pinchState = {
          startDist: dist,
          startZoom,
          bookX: (viewport.scrollLeft + midX - offsetX) / startScale,
          bookY: (viewport.scrollTop + midY - offsetY) / startScale,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchState) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.max(12, getTouchDist(t1, t2));
        const nextZoom = Math.max(
          25,
          Math.min(800, Math.round(pinchState.startZoom * (dist / pinchState.startDist)))
        );
        const rect = viewport.getBoundingClientRect();
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
        zoomAnchorRef.current = {
          bookX: pinchState.bookX,
          bookY: pinchState.bookY,
          anchorX: midX,
          anchorY: midY,
        };
        setZoom(nextZoom);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && pinchState) {
        pinchState = null;
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const prevZoom = zoomRef.current;
      const clampedDelta = Math.max(-120, Math.min(120, e.deltaY));
      const factor = Math.exp(-clampedDelta * 0.0028);
      let nextZoom = Math.max(25, Math.min(800, Math.round(prevZoom * factor)));
      if (nextZoom === prevZoom && clampedDelta !== 0) {
        nextZoom = Math.max(25, Math.min(800, prevZoom + (clampedDelta < 0 ? 2 : -2)));
      }
      if (nextZoom === prevZoom) return;
      const rect = viewport.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const prevScale = prevZoom / 100;
      const { offsetX, offsetY } = getBookOffset(prevScale);
      zoomAnchorRef.current = {
        bookX: (viewport.scrollLeft + cursorX - offsetX) / prevScale,
        bookY: (viewport.scrollTop + cursorY - offsetY) / prevScale,
        anchorX: cursorX,
        anchorY: cursorY,
      };
      setZoom(nextZoom);
    };

    const onPointerDownPan = (e: PointerEvent) => {
      if (e.button === 1 || (e.button === 0 && isSpacePanning)) {
        e.preventDefault();
        e.stopPropagation();
        panState = {
          startX: e.clientX,
          startY: e.clientY,
          scrollLeft: viewport.scrollLeft,
          scrollTop: viewport.scrollTop,
        };
      }
    };

    const onPointerMovePan = (e: PointerEvent) => {
      if (!panState) return;
      viewport.scrollLeft = Math.max(0, panState.scrollLeft - (e.clientX - panState.startX));
      viewport.scrollTop = Math.max(0, panState.scrollTop - (e.clientY - panState.startY));
    };

    const onPointerUpPan = () => {
      if (panState) {
        panState = null;
      }
    };

    viewport.addEventListener('touchstart', onTouchStart, { passive: false });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd);
    viewport.addEventListener('touchcancel', onTouchEnd);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('pointerdown', onPointerDownPan, { capture: true });
    window.addEventListener('pointermove', onPointerMovePan);
    window.addEventListener('pointerup', onPointerUpPan);

    return () => {
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
      viewport.removeEventListener('touchcancel', onTouchEnd);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('pointerdown', onPointerDownPan, { capture: true });
      window.removeEventListener('pointermove', onPointerMovePan);
      window.removeEventListener('pointerup', onPointerUpPan);
    };
  }, [showOverview, setZoom, isSpacePanning, bookBaseSize.w, bookBaseSize.h]);

  // Smoothly zoom and center directly on any selected object, image, mandala, or text box
  const zoomToElement = useCallback(
    (el: PageElement) => {
      const viewport = bookViewportRef.current;
      if (!viewport || bookBaseSize.w <= 0 || bookBaseSize.h <= 0) return;
      const targetZoom = zoomRef.current >= 220 ? 100 : 240;
      const halfW = bookBaseSize.w / 2;
      const elCenterXBase =
        (el.side === 'right' ? halfW : 0) + (el.x / 100) * halfW + Math.min(el.width, halfW) * 0.45;
      const elCenterYBase = (el.y / 100) * bookBaseSize.h + 60;
      zoomAnchorRef.current = {
        bookX: elCenterXBase,
        bookY: elCenterYBase,
        anchorX: viewport.clientWidth / 2,
        anchorY: viewport.clientHeight / 2,
      };
      setZoom(targetZoom);
    },
    [bookBaseSize, setZoom]
  );

  const canPrev = activeSafeIndex > 0;
  const canNext = activeSafeIndex < activeTotalSpreads - 1;

  // Clear element-only subpanels when selection changes
  useEffect(() => {
    setEditorSubPanel(null);
  }, [selectedElementId, activeSafeIndex, isMandalaMode]);

  const commitPageTurn = useCallback(
    (dir: 'next' | 'prev') => {
      if (isAnimatingFlip) return;
      if (dir === 'next' && !canNext) return;
      if (dir === 'prev' && !canPrev) return;

      onPlayPageFlip();
      setSelectedElementId(null);
      setEditingTextId(null);
      setFlipDir(dir);
      setIsAnimatingFlip(true);
      setFlipAngle(dir === 'next' ? -180 : 180);

      window.setTimeout(() => {
        const nextIdx = dir === 'next' ? activeSafeIndex + 1 : activeSafeIndex - 1;
        if (isMandalaMode) {
          onChangeMandalaSpreadIndex?.(nextIdx);
        } else {
          onChangeSpreadIndex(nextIdx);
        }
        setIsAnimatingFlip(false);
        setFlipDir(null);
        setFlipAngle(0);
      }, 460);
    },
    [
      isAnimatingFlip,
      canNext,
      canPrev,
      onPlayPageFlip,
      activeSafeIndex,
      isMandalaMode,
      onChangeMandalaSpreadIndex,
      onChangeSpreadIndex,
    ]
  );

  // Edge drag handlers for tactile page flipping
  const startEdgeDrag = (dir: 'next' | 'prev', clientX: number) => {
    if (isAnimatingFlip) return;
    if (dir === 'next' && !canNext) return;
    if (dir === 'prev' && !canPrev) return;
    const width = bookContainerRef.current?.clientWidth || 900;
    dragFlipRef.current = { dir, startX: clientX, width: width / 2 };
    setFlipDir(dir);
    setFlipAngle(0);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragFlipRef.current) return;
      const { dir, startX, width } = dragFlipRef.current;
      const dx = e.clientX - startX;
      if (dir === 'next') {
        const progress = Math.max(0, Math.min(1, -dx / Math.max(200, width)));
        setFlipAngle(-progress * 180);
      } else {
        const progress = Math.max(0, Math.min(1, dx / Math.max(200, width)));
        setFlipAngle(progress * 180);
      }
    };

    const onUp = () => {
      if (!dragFlipRef.current) return;
      const { dir } = dragFlipRef.current;
      dragFlipRef.current = null;

      if (Math.abs(flipAngle) > 48) {
        onPlayPageFlip();
        setIsAnimatingFlip(true);
        setFlipAngle(dir === 'next' ? -180 : 180);
        window.setTimeout(() => {
          const nextIdx = dir === 'next' ? activeSafeIndex + 1 : activeSafeIndex - 1;
          if (isMandalaMode) {
            onChangeMandalaSpreadIndex?.(nextIdx);
          } else {
            onChangeSpreadIndex(nextIdx);
          }
          setIsAnimatingFlip(false);
          setFlipDir(null);
          setFlipAngle(0);
        }, 360);
      } else {
        setIsAnimatingFlip(true);
        setFlipAngle(0);
        window.setTimeout(() => {
          setIsAnimatingFlip(false);
          setFlipDir(null);
        }, 230);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [
    flipAngle,
    activeSafeIndex,
    isMandalaMode,
    onChangeMandalaSpreadIndex,
    onChangeSpreadIndex,
    onPlayPageFlip,
  ]);

  useEffect(() => {
    if (skipNextPatternSyncRef.current) {
      skipNextPatternSyncRef.current = false;
      return;
    }
    if (copiedPattern) {
      setClipboardMode('pattern');
    }
  }, [copiedPattern]);

  const deleteElement = useCallback(
    (id: string): boolean => {
      if (!activeUserSpread) return false;
      const target = activeUserSpread.elements.find((el) => el.id === id);
      if (!target) return false;
      if (isPermanentElement(target)) {
        onNotify?.('Este maniquí es permanente en esta página y no se puede eliminar');
        return false;
      }
      if (target.locked) {
        onNotify?.('Objeto bloqueado — desbloquéalo para eliminarlo');
        return false;
      }
      audioEngine.playEraseBrush();
      onUpdateSpread({
        ...activeUserSpread,
        elements: activeUserSpread.elements.filter((el) => el.id !== id),
        updatedAt: new Date().toISOString(),
      });
      if (selectedElementId === id) setSelectedElementId(null);
      if (editingTextId === id) setEditingTextId(null);
      return true;
    },
    [activeUserSpread, onUpdateSpread, selectedElementId, editingTextId, onNotify]
  );

  const toggleElementLock = useCallback(
    (el: PageElement) => {
      if (!activeUserSpread) return;
      const nextLocked = !el.locked;
      audioEngine.playStitchClick();
      onUpdateSpread({
        ...activeUserSpread,
        elements: activeUserSpread.elements.map((item) =>
          item.id === el.id ? { ...item, locked: nextLocked } : item
        ),
        updatedAt: new Date().toISOString(),
      });
      if (nextLocked && editingTextId === el.id) {
        setEditingTextId(null);
      }
      onNotify?.(
        nextLocked
          ? 'Objeto bloqueado (no se puede mover ni eliminar)'
          : 'Objeto desbloqueado'
      );
    },
    [activeUserSpread, onUpdateSpread, editingTextId, onNotify]
  );

  const copySelectedElement = useCallback(
    (el: PageElement) => {
      const { id: _ignored, permanent: _perm, locked: _lock, ...rest } = el;
      setCopiedElement({ ...rest });
      setClipboardMode('element');
      pasteCountRef.current = 0;
      if (el.type === 'pattern-note' && el.patternData) {
        skipNextPatternSyncRef.current = true;
        onCopyPattern(el.patternData);
      } else if (el.type === 'mannequin') {
        const genderLabel =
          (el.mannequinGender ?? (el.id.includes('back') ? 'female' : 'male')) === 'female'
            ? 'Mujer'
            : 'Hombre';
        const yaw = normalizeYawDeg(
          el.mannequinYawDeg ?? (el.content === 'back' ? 180 : 0)
        );
        onNotify?.(
          `Maniquí ${genderLabel} (${yaw}°) copiado — Ctrl+V para pegar en esta posición`
        );
      } else {
        onNotify?.('Objeto copiado (Ctrl+V para pegar)');
      }
    },
    [onCopyPattern, onNotify]
  );

  const copyMannequinPngInPosition = useCallback(
    async (el: PageElement) => {
      if (el.type !== 'mannequin') return;
      const gender = el.mannequinGender ?? (el.id.includes('back') ? 'female' : 'male');
      const yaw = normalizeYawDeg(
        el.mannequinYawDeg ?? (el.content === 'back' ? 180 : 0)
      );
      const genderLabel = gender === 'female' ? 'Mujer' : 'Hombre';
      const blob = await renderMannequinPngBlob({
        gender,
        yawDeg: yaw,
        color: el.color,
      });
      if (!blob) {
        onNotify?.('No se pudo generar el PNG del maniquí');
        return;
      }
      try {
        if (
          typeof navigator !== 'undefined' &&
          navigator.clipboard &&
          typeof ClipboardItem !== 'undefined'
        ) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          audioEngine.playYarnPluck(3);
          onNotify?.(
            `PNG transparente copiado: Maniquí ${genderLabel} (${yaw}° · ${getYawAngleLabel(yaw)})`
          );
          return;
        }
      } catch {
        // Fallback to direct transparent PNG download
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maniqui-${gender}-${yaw}deg.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      audioEngine.playYarnPluck(3);
      onNotify?.(
        `PNG transparente descargado: Maniquí ${genderLabel} (${yaw}°)`
      );
    },
    [onNotify]
  );

  const cutSelectedElement = useCallback(
    (el: PageElement) => {
      if (!activeUserSpread) return;
      if (isPermanentElement(el)) {
        onNotify?.('Este maniquí es permanente en esta página y no se puede cortar');
        return;
      }
      if (el.locked) {
        onNotify?.('Objeto bloqueado — desbloquéalo primero');
        return;
      }
      const { id: _ignored, permanent: _perm, locked: _lock, ...rest } = el;
      setCopiedElement({ ...rest });
      setClipboardMode('element');
      pasteCountRef.current = 0;
      if (el.type === 'pattern-note' && el.patternData) {
        skipNextPatternSyncRef.current = true;
        onCopyPattern(el.patternData);
      }
      if (deleteElement(el.id)) {
        onNotify?.('Objeto cortado (Ctrl+V para pegar)');
      }
    },
    [activeUserSpread, deleteElement, onCopyPattern, onNotify]
  );

  const pasteCopiedElement = useCallback(() => {
    if (!activeUserSpread || !copiedElement) return;
    pasteCountRef.current += 1;
    const step = ((pasteCountRef.current - 1) % 5 + 1) * 4;
    const newEl: PageElement = {
      ...copiedElement,
      permanent: undefined,
      locked: undefined,
      id: `el-${Date.now()}-${pasteCountRef.current}`,
      x: Math.min(78, copiedElement.x + step),
      y: Math.min(84, copiedElement.y + step),
    };
    onUpdateSpread({
      ...activeUserSpread,
      elements: [...activeUserSpread.elements, newEl],
      updatedAt: new Date().toISOString(),
    });
    setSelectedElementId(newEl.id);
    onSelectTool('select');
    audioEngine.playYarnPluck(2);
    onNotify?.('Objeto pegado');
  }, [activeUserSpread, copiedElement, onUpdateSpread, onSelectTool, onNotify]);

  // Keyboard Ctrl+C / Ctrl+X / Ctrl+V / Ctrl+Z / Ctrl+Y / Zoom / Delete shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'c') {
        if (isCatalogView && selectedCatalogPattern) {
          e.preventDefault();
          onCopyPattern(selectedCatalogPattern);
        } else if (!isCatalogView && activeUserSpread && selectedElementId) {
          const sel = activeUserSpread.elements.find((el) => el.id === selectedElementId);
          if (sel) {
            e.preventDefault();
            copySelectedElement(sel);
          }
        }
      } else if (mod && key === 'x') {
        if (!isCatalogView && activeUserSpread && selectedElementId) {
          const sel = activeUserSpread.elements.find((el) => el.id === selectedElementId);
          if (sel) {
            e.preventDefault();
            cutSelectedElement(sel);
          }
        }
      } else if (mod && key === 'v') {
        if (!isCatalogView && activeUserSpread) {
          if (clipboardMode === 'element' && copiedElement) {
            e.preventDefault();
            pasteCopiedElement();
          } else if (copiedPattern) {
            e.preventDefault();
            onPastePatternOnSpread(activeUserSpread.id, lastActiveSideRef.current);
          } else if (copiedElement) {
            e.preventDefault();
            pasteCopiedElement();
          }
        } else if (isCatalogView && copiedPattern) {
          // Pressing Ctrl+V while browsing catalog pastes straight onto active editable spread
          const targetSpread = spreads[0];
          if (targetSpread) {
            e.preventDefault();
            onChangeNotebookMode?.('book');
            onChangeSpreadIndex(catalogCount);
            onPastePatternOnSpread(targetSpread.id, lastActiveSideRef.current, copiedPattern);
          }
        }
      } else if (mod && key === 'z' && !e.shiftKey) {
        if (onUndo) {
          e.preventDefault();
          onUndo();
        }
      } else if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) {
        if (onRedo) {
          e.preventDefault();
          onRedo();
        }
      } else if (
        mod &&
        (key === '=' || key === '+' || e.code === 'Equal' || e.code === 'NumpadAdd')
      ) {
        e.preventDefault();
        setZoom((z) => z + 20);
      } else if (
        mod &&
        (key === '-' || key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract')
      ) {
        e.preventDefault();
        setZoom((z) => z - 20);
      } else if (mod && (key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault();
        setZoom(100);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !mod) {
        if (!isCatalogView && activeUserSpread && selectedElementId && !editingTextId) {
          e.preventDefault();
          if (deleteElement(selectedElementId)) {
            onNotify?.('Objeto eliminado');
          }
        }
      } else if (
        !mod &&
        !e.altKey &&
        !editingTextId &&
        !croppingElement &&
        !colorStudioTarget &&
        !previewMandala &&
        !showOverview
      ) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setZoom((z) => z + 20);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setZoom((z) => z - 20);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          commitPageTurn('prev');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          commitPageTurn('next');
        }
      }
    };

    const onSystemPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!onPasteExternalImage || isCatalogView || !activeUserSpread) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            onPasteExternalImage(file);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onSystemPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onSystemPaste);
    };
  }, [
    isCatalogView,
    selectedCatalogPattern,
    activeUserSpread,
    spreads,
    catalogCount,
    selectedElementId,
    editingTextId,
    clipboardMode,
    copiedElement,
    copiedPattern,
    copySelectedElement,
    cutSelectedElement,
    pasteCopiedElement,
    deleteElement,
    onCopyPattern,
    onPastePatternOnSpread,
    onPasteExternalImage,
    onChangeNotebookMode,
    onChangeSpreadIndex,
    onUndo,
    onRedo,
    setZoom,
    commitPageTurn,
    croppingElement,
    colorStudioTarget,
    previewMandala,
    showOverview,
    onNotify,
  ]);

  const finishEditingText = useCallback(() => {
    if (editingTextId && activeUserSpread) {
      const targetEl = activeUserSpread.elements.find((el) => el.id === editingTextId);
      if (targetEl && targetEl.type === 'text' && targetEl.content.trim() === '') {
        onUpdateSpread({
          ...activeUserSpread,
          elements: activeUserSpread.elements.filter((el) => el.id !== editingTextId),
          updatedAt: new Date().toISOString(),
        });
        setSelectedElementId((prev) => (prev === editingTextId ? null : prev));
      }
    }
    setEditingTextId(null);
  }, [editingTextId, activeUserSpread, onUpdateSpread]);

  const insertPresetText = useCallback(
    (preset: 'title' | 'note' | 'card', customSide?: 'left' | 'right', xPct?: number, yPct?: number) => {
      if (!activeUserSpread) return;
      let side: 'left' | 'right' = customSide ?? lastActiveSideRef.current;
      if (!customSide && xPct === undefined) {
        const otherSide: 'left' | 'right' = side === 'left' ? 'right' : 'left';
        const sideHasWardrobe = activeUserSpread.elements.some(
          (e) => e.side === side && e.type === 'wardrobe'
        );
        const otherHasWardrobe = activeUserSpread.elements.some(
          (e) => e.side === otherSide && e.type === 'wardrobe'
        );
        if (sideHasWardrobe && !otherHasWardrobe) {
          side = otherSide;
          lastActiveSideRef.current = side;
        }
      }

      const cleanedElements = activeUserSpread.elements.filter(
        (e) => !(e.type === 'text' && e.content.trim() === '')
      );
      const existingOnSide = cleanedElements.filter(
        (e) => e.side === side && e.type === 'text'
      ).length;
      const defaultX = xPct ?? (preset === 'title' ? 10 : 12 + (existingOnSide % 3) * 6);
      const defaultY = yPct ?? (preset === 'title' ? 8 : 14 + (existingOnSide % 5) * 13);

      const isCard = preset === 'card';
      const defaultInk = isCard
        ? '#4e2712'
        : brush.color.toLowerCase() === '#4e2712' || brush.color.toLowerCase() === '#1c130e'
          ? '#F7EED8'
          : brush.color;
      const activeFontMeta = getFontMeta(selectedFont);
      ensureCalligraphyFontLoaded(activeFontMeta.id);
      const newEl: PageElement = {
        id: `el-${Date.now()}`,
        side,
        type: 'text',
        x: Math.max(5, Math.min(68, defaultX)),
        y: Math.max(6, Math.min(82, defaultY)),
        width: preset === 'title' ? 320 : isCard ? 250 : activeFontMeta.defaultSizePx >= 28 ? 290 : 230,
        content: '',
        color: defaultInk,
        fontSize:
          preset === 'title'
            ? Math.max(28, activeFontMeta.defaultSizePx)
            : preset === 'card'
              ? Math.max(18, Math.round(activeFontMeta.defaultSizePx * 0.82))
              : activeFontMeta.defaultSizePx,
        fontFamily: preset === 'title' && selectedFont === 'lora' ? 'pinyon' : selectedFont,
        fontWeight: preset === 'title' && !activeFontMeta.isScript ? 'bold' : 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: preset === 'title' ? 'center' : 'left',
        backgroundColor: preset === 'card' ? 'rgba(251, 236, 206, 0.92)' : 'transparent',
      };
      onUpdateSpread({
        ...activeUserSpread,
        elements: [...cleanedElements, newEl],
        updatedAt: new Date().toISOString(),
      });
      setSelectedElementId(newEl.id);
      setEditingTextId(newEl.id);
      onSelectTool('select');
      audioEngine.playStitchClick();
    },
    [activeUserSpread, brush.color, selectedFont, onUpdateSpread, onSelectTool]
  );

  // Dynamically load any of the 235+ calligraphy fonts used on the active sheet or selected font
  useEffect(() => {
    const usedIds: Array<string | undefined> = [selectedFont];
    if (activeUserSpread) {
      for (const el of activeUserSpread.elements) {
        if (el.type === 'text' && el.fontFamily) usedIds.push(el.fontFamily);
      }
    }
    ensureCalligraphyFontsLoaded(usedIds);
  }, [selectedFont, activeUserSpread]);

  const handlePlaceElement = useCallback(
    (side: 'left' | 'right', xPct: number, yPct: number) => {
      if (!activeUserSpread) return;
      lastActiveSideRef.current = side;
      if (activeTool === 'text') {
        insertPresetText('note', side, xPct, yPct);
      } else if (activeTool === 'shape') {
        const newEl: PageElement = {
          id: `el-${Date.now()}`,
          side,
          type: 'shape',
          x: Math.max(6, Math.min(72, xPct - 8)),
          y: Math.max(8, Math.min(75, yPct - 8)),
          width: 110,
          content: selectedShapeKind,
          shapeKind: selectedShapeKind,
          color: brush.color,
          fillColor: 'transparent',
        };
        onUpdateSpread({
          ...activeUserSpread,
          elements: [...activeUserSpread.elements, newEl],
          updatedAt: new Date().toISOString(),
        });
        setSelectedElementId(newEl.id);
        onSelectTool('select');
      }
    },
    [
      activeUserSpread,
      activeTool,
      selectedShapeKind,
      brush.color,
      insertPresetText,
      onUpdateSpread,
      onSelectTool,
    ]
  );

  const updateElement = useCallback(
    (id: string, patch: Partial<PageElement>) => {
      if (!activeUserSpread) return;
      onUpdateSpread({
        ...activeUserSpread,
        elements: activeUserSpread.elements.map((el) =>
          el.id === id ? { ...el, ...patch } : el
        ),
        updatedAt: new Date().toISOString(),
      });
    },
    [activeUserSpread, onUpdateSpread]
  );

  const duplicateElement = (el: PageElement) => {
    if (!activeUserSpread) return;
    const copy: PageElement = {
      ...el,
      permanent: undefined,
      locked: undefined,
      id: `el-${Date.now()}`,
      x: Math.min(76, el.x + 5),
      y: Math.min(82, el.y + 5),
    };
    onUpdateSpread({
      ...activeUserSpread,
      elements: [...activeUserSpread.elements, copy],
      updatedAt: new Date().toISOString(),
    });
    setSelectedElementId(copy.id);
  };

  const reorderElement = (id: string, dir: 'front' | 'back') => {
    if (!activeUserSpread) return;
    const target = activeUserSpread.elements.find((e) => e.id === id);
    if (!target) return;
    const others = activeUserSpread.elements.filter((e) => e.id !== id);
    const next = dir === 'front' ? [...others, target] : [target, ...others];
    onUpdateSpread({
      ...activeUserSpread,
      elements: next,
      updatedAt: new Date().toISOString(),
    });
  };


  const cycleFrameStyle = (el: PageElement) => {
    const order: ImageFrameStyle[] = ['polaroid', 'gold', 'rounded', 'minimal'];
    const curr = el.frameStyle || 'polaroid';
    const next = order[(order.indexOf(curr) + 1) % order.length];
    updateElement(el.id, { frameStyle: next });
  };

  const handleExtractElementFigure = useCallback(
    async (el: PageElement) => {
      if (el.type !== 'image' || mattingElementId) return;
      const existingExtracted =
        el.extractedBaseContent ||
        extractedElementBaseRef.current[el.id] ||
        (el.originalContent && el.content !== el.originalContent ? el.content : null);
      if (existingExtracted) {
        setSelectedElementId(el.id);
        setColorStudioTarget({
          kind: 'element',
          elementId: el.id,
          title: el.title || 'Figura extraída',
          baseImageSrc: existingExtracted,
        });
        return;
      }
      const sourceToMat = el.originalContent || el.content;
      setSelectedElementId(el.id);
      setMattingElementId(el.id);
      setMattingProgress(5);
      audioEngine.playStitchClick();
      try {
        const extractedUrl = await extractFigureMatting(sourceToMat, (pct) => {
          setMattingProgress(pct);
        });
        extractedElementBaseRef.current[el.id] = extractedUrl;
        updateElement(el.id, {
          originalContent: sourceToMat,
          extractedBaseContent: extractedUrl,
          content: extractedUrl,
          frameStyle: 'minimal',
        });
        audioEngine.playSaveChime();
        setColorStudioTarget({
          kind: 'element',
          elementId: el.id,
          title: el.title || 'Figura extraída',
          baseImageSrc: extractedUrl,
        });
      } catch {
        onNotify?.('No se pudo extraer la figura de esta imagen');
      } finally {
        setMattingElementId(null);
        setMattingProgress(0);
      }
    },
    [mattingElementId, updateElement, onNotify]
  );

  const handleRestoreElementFigure = useCallback(
    (el: PageElement) => {
      if (!el.originalContent) return;
      audioEngine.playUndoRedo(false);
      delete extractedElementBaseRef.current[el.id];
      updateElement(el.id, {
        content: el.originalContent,
        originalContent: undefined,
        extractedBaseContent: undefined,
      });
      onNotify?.('Imagen original restaurada');
    },
    [updateElement, onNotify]
  );

  const [uhdBusyElementId, setUhdBusyElementId] = useState<string | null>(null);

  const handleEnhanceElementUltraHD = useCallback(
    async (el: PageElement) => {
      if (el.type !== 'image' || !el.content || uhdBusyElementId) return;
      setUhdBusyElementId(el.id);
      audioEngine.playStitchClick();
      try {
        const res = await enhanceUploadedImageToUltraHD(el.content, {
          minLongEdge: 3200,
          maxLongEdge: 3840,
          preserveAlpha: true,
          sharpness: 0.92,
          clarity: 0.1,
          vibrance: 0.08,
        });
        updateElement(el.id, {
          originalContent: el.originalContent || el.content,
          content: res.dataUrl,
        });
        audioEngine.playSaveChime();
        onNotify?.(
          `Imagen mejorada en Ultra-HD (${res.outputWidth}×${res.outputHeight} px, mayor detalle y nitidez)`
        );
      } catch {
        onNotify?.('No se pudo mejorar esta imagen');
      } finally {
        setUhdBusyElementId(null);
      }
    },
    [uhdBusyElementId, updateElement, onNotify]
  );

  const handleSaveElement8K = useCallback(
    async (el: PageElement) => {
      if (el.type !== 'image' || !el.content || uhdBusyElementId) return;
      setUhdBusyElementId(el.id);
      audioEngine.playStitchClick();
      try {
        const out = await exportImageAt8K(el.content, el.title || 'Imagen-Cuaderno');
        audioEngine.playSaveChime();
        onNotify?.(`Imagen guardada en 8K Ultra-HD (${out.width}×${out.height} px, sin pixelar)`);
      } catch {
        onNotify?.('No se pudo guardar la imagen en 8K');
      } finally {
        setUhdBusyElementId(null);
      }
    },
    [uhdBusyElementId, onNotify]
  );

  const handleExportElementVectorSvg = useCallback(
    async (el: PageElement) => {
      if (el.type !== 'image' || !el.content || uhdBusyElementId) return;
      setUhdBusyElementId(el.id);
      audioEngine.playStitchClick();
      try {
        await downloadImageAsVectorSvg(el.content, el.title || 'Imagen-Cuaderno');
        audioEngine.playSaveChime();
        onNotify?.('Imagen exportada en formato Vectorial SVG Ultra-HD');
      } catch {
        onNotify?.('No se pudo vectorizar la imagen');
      } finally {
        setUhdBusyElementId(null);
      }
    },
    [uhdBusyElementId, onNotify]
  );

  const handleExtractMandalaFigure = useCallback(
    async (item: CopiedPatternData) => {
      const sourceUrl = item.imagePath;
      if (!sourceUrl || mattingMandalaId) return;
      const cachedBase = mattedBaseMandalaMap[item.id];
      if (cachedBase) {
        audioEngine.playStitchClick();
        setColorStudioTarget({
          kind: 'mandala',
          item,
          baseImageSrc: cachedBase,
        });
        return;
      }
      setMattingMandalaId(item.id);
      setMattingProgress(5);
      audioEngine.playStitchClick();
      try {
        const extractedUrl = await extractFigureMatting(sourceUrl, (pct) => {
          setMattingProgress(pct);
        });
        onSaveExtractedMandala?.(item.id, {
          baseDataUrl: extractedUrl,
          coloredDataUrl: extractedUrl,
          updatedAt: new Date().toISOString(),
        });
        const extractedPattern: CopiedPatternData = {
          ...item,
          imagePath: extractedUrl,
        };
        setSelectedCatalogPattern(extractedPattern);
        onCopyPattern(extractedPattern);
        setPreviewMandala((prev) =>
          prev && prev.id === item.id ? { ...prev, imagePath: extractedUrl } : prev
        );
        audioEngine.playSaveChime();
        onNotify?.(`Figura extraída y guardada: ${item.name}`);
        setColorStudioTarget({
          kind: 'mandala',
          item,
          baseImageSrc: extractedUrl,
        });
      } catch {
        onNotify?.('No se pudo extraer la figura de este diseño');
      } finally {
        setMattingMandalaId(null);
        setMattingProgress(0);
      }
    },
    [mattingMandalaId, mattedBaseMandalaMap, onSaveExtractedMandala, onCopyPattern, onNotify]
  );

  const rotateAllElements = useCallback(
    (mode: 'set' | 'delta' | 'reset', value: number) => {
      if (!activeUserSpread || activeUserSpread.elements.length === 0) return;
      const normalize = (deg: number) => ((Math.round(deg) % 360) + 360) % 360;
      const nextElements = activeUserSpread.elements.map((el) => {
        if (el.locked || el.type === 'wardrobe') return el;
        if (mode === 'reset') return { ...el, rotation: 0 };
        if (mode === 'set') return { ...el, rotation: normalize(value) };
        return { ...el, rotation: normalize((el.rotation || 0) + value) };
      });
      if (mode === 'reset') {
        setAllRotateAngle(0);
      } else if (mode === 'set') {
        setAllRotateAngle(normalize(value));
      }
      onUpdateSpread({
        ...activeUserSpread,
        elements: nextElements,
        updatedAt: new Date().toISOString(),
      });
    },
    [activeUserSpread, onUpdateSpread]
  );

  const cycleTextHighlight = (el: PageElement) => {
    const palette = ['transparent', '#f7e8c6', '#fff9eb', '#f7d8d8', '#dce8dc'];
    const curr = el.backgroundColor || 'transparent';
    const idx = palette.indexOf(curr);
    const next = palette[(idx + 1) % palette.length];
    updateElement(el.id, { backgroundColor: next });
  };

  const selectedElement =
    activeUserSpread?.elements.find((e) => e.id === selectedElementId) || null;

  /* ---------- Neutral Masculine Text Reader State & Actions ---------- */
  const [readerState, setReaderState] = useState<TextReaderState>(() =>
    textReaderEngine.getState()
  );

  useEffect(() => {
    const unsub = textReaderEngine.subscribe(setReaderState);
    return () => {
      unsub();
      textReaderEngine.stop();
    };
  }, []);

  const handleReadTextElement = useCallback(
    (el: PageElement) => {
      const clean = (el.content || '').trim();
      if (!clean) {
        onNotify?.('Este cuadro de texto está vacío');
        return;
      }
      if (!textReaderEngine.getState().supported) {
        onNotify?.('Tu navegador no admite lectura por voz');
        return;
      }
      textReaderEngine.playElement(el.id, clean);
    },
    [onNotify]
  );

  const spreadTextElements = useMemo(() => {
    if (!activeUserSpread) return [];
    return activeUserSpread.elements
      .filter((e) => e.type === 'text' && e.content.trim().length > 0)
      .sort((a, b) => {
        if (a.side !== b.side) return a.side === 'left' ? -1 : 1;
        return a.y - b.y;
      });
  }, [activeUserSpread]);

  const handleReadAllSpreadText = useCallback(() => {
    if (!spreadTextElements.length) {
      onNotify?.('No hay cuadros de texto con contenido en esta hoja');
      return;
    }
    const combined = spreadTextElements.map((e) => e.content.trim()).join('. ');
    textReaderEngine.playElement(`spread-${activeUserSpread?.id || 'all'}`, combined);
  }, [spreadTextElements, activeUserSpread, onNotify]);

  // When the user clicks the "Leer" button in the toolbar, immediately read the selected
  // text box (or the only text box on the page), or highlight all text boxes for 1-click reading.
  const prevToolForReadRef = useRef<ActiveCanvasTool>(activeTool);
  useEffect(() => {
    const prev = prevToolForReadRef.current;
    prevToolForReadRef.current = activeTool;
    if (activeTool === 'read' && prev !== 'read') {
      if (selectedElement && selectedElement.type === 'text' && selectedElement.content.trim()) {
        handleReadTextElement(selectedElement);
      } else if (spreadTextElements.length === 1) {
        handleReadTextElement(spreadTextElements[0]);
      } else if (spreadTextElements.length > 1) {
        onNotify?.('Modo Leer activo · Toca cualquier cuadro de texto para escucharlo');
      } else {
        onNotify?.('Añade un cuadro de texto en la hoja para escucharlo');
      }
    }
  }, [activeTool, selectedElement, spreadTextElements, handleReadTextElement, onNotify]);

  const activeTitle = isMandalaMode
    ? activeMandalaSpread?.title || 'Apartado de Mandalas'
    : isCatalogSpread
      ? activeCatalogSpread?.title || 'Catálogo de Patrones'
      : activeUserSpread?.title || 'Mi Hoja';

  const pageSizeClass =
    dockedMode && !focusMode ? 'notebook-page-docked' : 'notebook-page-maximized';
  const sheetSizeClass =
    dockedMode && !focusMode ? 'notebook-sheet-docked' : 'notebook-sheet-maximized';

  // Sync metadata with RightStudioDock
  useEffect(() => {
    onSpreadMetaChange?.({
      isCatalog: isCatalogView,
      paperStyle: activeUserSpread?.paperStyle || 'grid',
      hasSelected: Boolean(selectedElement),
      hasDrawings: Boolean(
        activeUserSpread?.leftDrawingDataUrl || activeUserSpread?.rightDrawingDataUrl
      ),
      hasElements: Boolean(activeUserSpread && activeUserSpread.elements.length > 0),
      title: activeTitle,
      totalBookSpreads: activeTotalSpreads,
      catalogCount,
      showOverview,
      allRotateAngle,
    });
  }, [
    isCatalogView,
    activeUserSpread,
    selectedElement,
    activeTitle,
    activeTotalSpreads,
    catalogCount,
    showOverview,
    allRotateAngle,
    onSpreadMetaChange,
  ]);

  // Respond to paper style cycle signal from RightStudioDock
  const prevCycleSignalRef = useRef(cyclePaperSignal);
  useEffect(() => {
    if (cyclePaperSignal === prevCycleSignalRef.current) return;
    prevCycleSignalRef.current = cyclePaperSignal;
    if (!isCatalogSpread && activeUserSpread) {
      const order: PaperStyle[] = ['grid', 'dots', 'plain'];
      const next = order[(order.indexOf(activeUserSpread.paperStyle) + 1) % order.length];
      onUpdateSpread({ ...activeUserSpread, paperStyle: next });
    }
  }, [cyclePaperSignal, isCatalogSpread, activeUserSpread, onUpdateSpread]);

  // Respond to page turn signal from RightStudioDock
  const prevTurnSignalIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!turnPageSignal || turnPageSignal.id === prevTurnSignalIdRef.current) return;
    prevTurnSignalIdRef.current = turnPageSignal.id;
    commitPageTurn(turnPageSignal.dir);
  }, [turnPageSignal, commitPageTurn]);

  // Respond to overview toggle signal from RightStudioDock
  const prevOverviewSignalRef = useRef(toggleOverviewSignal);
  useEffect(() => {
    if (toggleOverviewSignal === prevOverviewSignalRef.current) return;
    prevOverviewSignalRef.current = toggleOverviewSignal;
    setShowOverview((v) => !v);
  }, [toggleOverviewSignal]);

  // Clicking the "Texto" button opens a writable text box immediately on the page
  const lastHandledAddTextRef = useRef(0);
  useEffect(() => {
    if (!addTextSignal || addTextSignal === lastHandledAddTextRef.current) return;
    if (isCatalogView || !activeUserSpread) return;
    lastHandledAddTextRef.current = addTextSignal;
    setShowOverview(false);
    insertPresetText('note');
    onConsumeAddTextSignal?.();
  }, [addTextSignal, isCatalogView, activeUserSpread, insertPresetText, onConsumeAddTextSignal]);

  // Respond to Rotate All signal from RightStudioDock
  const prevRotateAllSignalIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!rotateAllSignal || rotateAllSignal.id === prevRotateAllSignalIdRef.current) return;
    prevRotateAllSignalIdRef.current = rotateAllSignal.id;
    rotateAllElements(rotateAllSignal.mode, rotateAllSignal.value);
  }, [rotateAllSignal, rotateAllElements]);

  // Respond to Capas dock action buttons (+, Trash, Up, Down)
  const prevLayerActionIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!layerActionSignal || layerActionSignal.id === prevLayerActionIdRef.current) return;
    prevLayerActionIdRef.current = layerActionSignal.id;
    const { action } = layerActionSignal;

    if (action.type === 'add-note') {
      if (isCatalogSpread) {
        onChangeSpreadIndex(catalogCount);
      }
      const target = spreads[0];
      if (!isCatalogSpread && activeUserSpread) {
        insertPresetText('note', lastActiveSideRef.current);
      } else if (target) {
        onSelectTool('text');
      }
    } else if (action.type === 'delete-active' && !isCatalogSpread && activeUserSpread) {
      if (selectedElementId) {
        if (deleteElement(selectedElementId)) {
          onNotify?.('Objeto eliminado');
        }
      } else if (activeUserSpread.leftDrawingDataUrl || activeUserSpread.rightDrawingDataUrl) {
        onUpdateSpread({
          ...activeUserSpread,
          leftDrawingDataUrl: undefined,
          rightDrawingDataUrl: undefined,
        });
        onNotify?.('Trazos de la página limpiados');
      }
    } else if (action.type === 'bring-front' && selectedElementId && !isCatalogSpread && activeUserSpread) {
      const target = activeUserSpread.elements.find((e) => e.id === selectedElementId);
      if (target) {
        const targetLayer: StackableLayerId =
          target.type === 'text' || target.type === 'pattern-note' ? 'notes' : 'images';
        const sameLayerEls = activeUserSpread.elements.filter((e) =>
          targetLayer === 'notes'
            ? e.type === 'text' || e.type === 'pattern-note'
            : e.type !== 'text' && e.type !== 'pattern-note'
        );
        const isAlreadyTopInLayer =
          sameLayerEls.length <= 1 || sameLayerEls[sameLayerEls.length - 1]?.id === target.id;
        if (!isAlreadyTopInLayer) {
          const others = activeUserSpread.elements.filter((e) => e.id !== selectedElementId);
          onUpdateSpread({ ...activeUserSpread, elements: [...others, target], updatedAt: new Date().toISOString() });
          onNotify?.('Traído al frente');
        } else {
          onStepLayerOrder?.(targetLayer, 'up');
        }
      }
    } else if (action.type === 'send-back' && selectedElementId && !isCatalogSpread && activeUserSpread) {
      const target = activeUserSpread.elements.find((e) => e.id === selectedElementId);
      if (target) {
        const targetLayer: StackableLayerId =
          target.type === 'text' || target.type === 'pattern-note' ? 'notes' : 'images';
        const sameLayerEls = activeUserSpread.elements.filter((e) =>
          targetLayer === 'notes'
            ? e.type === 'text' || e.type === 'pattern-note'
            : e.type !== 'text' && e.type !== 'pattern-note'
        );
        const isAlreadyBottomInLayer =
          sameLayerEls.length <= 1 || sameLayerEls[0]?.id === target.id;
        if (!isAlreadyBottomInLayer) {
          const others = activeUserSpread.elements.filter((e) => e.id !== selectedElementId);
          onUpdateSpread({ ...activeUserSpread, elements: [target, ...others], updatedAt: new Date().toISOString() });
          onNotify?.('Enviado atrás');
        } else {
          onStepLayerOrder?.(targetLayer, 'down');
        }
      }
    }
  }, [
    layerActionSignal,
    isCatalogSpread,
    catalogCount,
    spreads,
    activeUserSpread,
    selectedElementId,
    brush.color,
    selectedFont,
    onChangeSpreadIndex,
    onUpdateSpread,
    onSelectTool,
    onStepLayerOrder,
    deleteElement,
    onNotify,
  ]);

  const commitPageEraseResults = useCallback(
    (
      side: 'left' | 'right' | 'unified',
      drawingDataUrl: string | undefined,
      elementStrokeUpdates: Record<string, ElementEraseStroke[]>,
      fullyErasedIds: string[]
    ) => {
      if (!activeUserSpread) return;
      const erasedSet = new Set(fullyErasedIds);
      const hasElementChanges =
        Object.keys(elementStrokeUpdates).length > 0 || erasedSet.size > 0;
      const nextElements = hasElementChanges
        ? activeUserSpread.elements
            .filter((el) => {
              if (el.locked || isPermanentElement(el)) return true;
              return !erasedSet.has(el.id);
            })
            .map((el) => {
              if (el.locked || isPermanentElement(el)) return el;
              return elementStrokeUpdates[el.id]
                ? { ...el, eraseStrokes: elementStrokeUpdates[el.id] }
                : el;
            })
        : activeUserSpread.elements;

      if (
        selectedElementId &&
        erasedSet.has(selectedElementId) &&
        !nextElements.some((el) => el.id === selectedElementId)
      ) {
        setSelectedElementId(null);
        setEditingTextId(null);
      }

      onUpdateSpread({
        ...activeUserSpread,
        ...(side === 'unified'
          ? { leftDrawingDataUrl: drawingDataUrl, rightDrawingDataUrl: undefined }
          : side === 'left'
            ? { leftDrawingDataUrl: drawingDataUrl }
            : { rightDrawingDataUrl: drawingDataUrl }),
        elements: nextElements,
        updatedAt: new Date().toISOString(),
      });
    },
    [activeUserSpread, onUpdateSpread, selectedElementId]
  );

  return (
    <div className="relative flex-1 min-h-0 min-w-0 w-full h-full flex flex-col overflow-hidden bg-transparent">
      {/* Contextual Animated Floating Editor Toolbar (never pops up on copy; shows for active selection, Texto mode, Eyedropper, or Draw clear) */}
      <AnimatePresence>
        {(selectedElement ||
          (!isCatalogView && (activeTool === 'text' || activeTool === 'read')) ||
          (!isCatalogView &&
            activeUserSpread &&
            (activeUserSpread.leftDrawingDataUrl || activeUserSpread.rightDrawingDataUrl) &&
            (activeTool === 'draw' || activeTool === 'eraser')) ||
          activeTool === 'eyedropper') && (
          <motion.div
            key="contextual-editor-bar"
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onMouseDown={(e) => {
              // Keep active textarea focus when clicking typography controls
              const target = e.target as HTMLElement | null;
              if (target && target.tagName !== 'SELECT' && target.tagName !== 'OPTION' && target.tagName !== 'INPUT') {
                e.preventDefault();
              }
            }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl leather-panel bg-[#221208]/95 backdrop-blur-md shadow-[0_14px_34px_rgba(0,0,0,0.85)] max-w-[96vw]"
          >
            {activeTool === 'eyedropper' && (
              <div className="flex items-center gap-2 px-1.5">
                <Pipette className="w-3.5 h-3.5 text-[#f0c77c]" />
                <span className="text-xs text-[#ffdfa3] font-medium">
                  Haz clic en cualquier foto, sticker, trazo o texto del libro para tomar su color
                </span>
                <button
                  type="button"
                  onClick={() => onSelectTool('select')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#4b2914] hover:bg-[#6a3a1d] text-[11px] text-[#ffe8be] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}

            {/* Modo Leer Quick Bar */}
            {!isCatalogView && activeTool === 'read' && !selectedElement && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 px-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#f0c77c]" />
                <span className="text-xs text-[#ffdfa3] font-medium">
                  Modo Leer · Toca cualquier cuadro de texto para escucharlo
                </span>
                {spreadTextElements.length > 0 && (
                  <button
                    type="button"
                    onClick={handleReadAllSpreadText}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-110 text-xs font-semibold text-white cursor-pointer shadow"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>
                      {spreadTextElements.length > 1 ? 'Leer toda la hoja' : 'Leer texto'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectTool('select')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3b2010] hover:bg-[#573119] border border-[#c99552]/40 text-xs text-[#ffe8be] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>
            )}

            {/* Intuitive Text Placement Quick Bar when Texto tool is active */}
            {!isCatalogView && activeTool === 'text' && !selectedElement && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 px-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-[#ffdfa3] font-medium pr-1">
                  <Type className="w-3.5 h-3.5 text-[#f0c77c]" />
                  <span>Toca en la hoja para escribir o añade:</span>
                </span>
                <button
                  type="button"
                  onClick={() => insertPresetText('title')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-110 text-xs font-semibold text-white cursor-pointer shadow"
                >
                  <Plus className="w-3 h-3" />
                  <span>Título</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertPresetText('note')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3b2110] hover:bg-[#522e17] border border-[#c99552]/55 text-xs font-medium text-[#ffebc2] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nota libre</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertPresetText('card')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#3b2110] hover:bg-[#522e17] border border-[#c99552]/55 text-xs font-medium text-[#ffebc2] cursor-pointer"
                >
                  <Highlighter className="w-3 h-3 text-[#f0c77c]" />
                  <span>Tarjeta</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTool('select')}
                  aria-label="Salir de modo texto"
                  className="p-1 rounded-lg bg-[#4b2914] hover:bg-[#6a3a1d] text-[#ffe8be] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Selected Element Paint + Word + Photo Editor Controls */}
          {!isCatalogView && selectedElement && (
            <>
              {selectedElement.type === 'image' && (
                <>
                  <button
                    type="button"
                    disabled={Boolean(mattingElementId)}
                    onClick={() => void handleExtractElementFigure(selectedElement)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#3d7c6b] to-[#265448] hover:brightness-110 border border-[#8ce0c5]/45 text-xs font-medium text-white cursor-pointer shadow disabled:opacity-60"
                    title="AI Image Matting: extraer la figura con fondo transparente"
                  >
                    {mattingElementId === selectedElement.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {mattingElementId === selectedElement.id
                        ? `Extrayendo ${mattingProgress}%`
                        : 'Extraer figura'}
                    </span>
                  </button>

                  {(selectedElement.extractedBaseContent ||
                    (selectedElement.originalContent &&
                      selectedElement.content !== selectedElement.originalContent)) && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setColorStudioTarget({
                              kind: 'element',
                              elementId: selectedElement.id,
                              title: selectedElement.title || 'Figura extraída',
                              baseImageSrc:
                                selectedElement.extractedBaseContent ||
                                extractedElementBaseRef.current[selectedElement.id] ||
                                selectedElement.content,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#9c5a2b] to-[#6d3816] hover:brightness-110 border border-[#f2c478]/55 text-xs font-medium text-[#fff4de] cursor-pointer shadow"
                          title="Cambiar colores y tonos de la figura extraída"
                        >
                          <Palette className="w-3.5 h-3.5" />
                          <span>Colores y tonos</span>
                        </button>
                        {selectedElement.originalContent &&
                          selectedElement.content !== selectedElement.originalContent && (
                            <button
                              type="button"
                              onClick={() => handleRestoreElementFigure(selectedElement)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                              title="Restaurar imagen original"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span className="hidden md:inline">Original</span>
                            </button>
                          )}
                      </>
                    )}

                  <button
                    type="button"
                    onClick={() => setCroppingElement(selectedElement)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer shadow"
                    title="Recortar imagen"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Recortar</span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setEditorSubPanel((p) => (p === 'adjust' ? null : 'adjust'))
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                        editorSubPanel === 'adjust'
                          ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                          : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                      }`}
                      title="Ajustes de foto: brillo, contraste, color"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Ajustes</span>
                    </button>

                    {editorSubPanel === 'adjust' && (
                      <ImageAdjustmentsPopover
                        filters={selectedElement.filters || DEFAULT_FILTERS}
                        opacity={selectedElement.opacity ?? 1}
                        onChangeFilters={(filters) =>
                          updateElement(selectedElement.id, { filters })
                        }
                        onChangeOpacity={(opacity) =>
                          updateElement(selectedElement.id, { opacity })
                        }
                      />
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setEditorSubPanel((p) => (p === 'frame' ? null : 'frame'))
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                        editorSubPanel === 'frame' || selectedElement.museumFrameId
                          ? 'bg-[#6b3d1e] border-[#ebb96a] text-white font-medium'
                          : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                      }`}
                      title="Elegir marco de museo (oro, madera, naturaleza, puntillas) o estilo clásico"
                    >
                      <Frame className="w-3.5 h-3.5 text-[#f5cb73]" />
                      <span className="hidden md:inline">
                        {selectedElement.museumFrameId
                          ? getMuseumFrameById(selectedElement.museumFrameId)?.shortLabel || 'Marco'
                          : `Marco: ${selectedElement.frameStyle || 'polaroid'}`}
                      </span>
                    </button>

                    {editorSubPanel === 'frame' && (
                      <div
                        onPointerDown={(e) => e.stopPropagation()}
                        className="absolute top-full left-0 mt-1.5 z-50 w-[300px] sm:w-[340px] rounded-xl leather-panel p-2.5 shadow-2xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-[11px] font-bold text-[#ffebc2]">
                            Marcos de Museo y Puntillas
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditorSubPanel(null)}
                            className="p-0.5 text-[#d6b688] hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Classic Simple Frame Styles */}
                        <div className="grid grid-cols-4 gap-1">
                          {(
                            [
                              { id: 'minimal', label: 'Sin marco' },
                              { id: 'polaroid', label: 'Polaroid' },
                              { id: 'gold', label: 'Oro fino' },
                              { id: 'rounded', label: 'Suave' },
                            ] as const
                          ).map((st) => {
                            const active =
                              !selectedElement.museumFrameId &&
                              (selectedElement.frameStyle || 'polaroid') === st.id;
                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                  audioEngine.playStitchClick();
                                  updateElement(selectedElement.id, {
                                    frameStyle: st.id,
                                    museumFrameId: undefined,
                                  });
                                }}
                                className={`py-1 px-1 rounded-md border text-[10px] cursor-pointer transition-colors ${
                                  active
                                    ? 'bg-[#6b3d1e] border-[#ffe08a] text-white font-semibold'
                                    : 'bg-[#1a0c04] border-[#b98241]/35 text-[#e6cba0] hover:border-[#e6b868]'
                                }`}
                              >
                                {st.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* 12 Photorealistic Museum / Wood / Nature / Crochet Lace Frames */}
                        <div className="grid grid-cols-3 gap-1.5 max-h-[260px] overflow-y-auto studio-scroll pr-0.5">
                          {MUSEUM_FRAMES.map((mf) => {
                            const active = selectedElement.museumFrameId === mf.id;
                            return (
                              <button
                                key={mf.id}
                                type="button"
                                onClick={() => {
                                  audioEngine.playSaveChime();
                                  updateElement(selectedElement.id, {
                                    museumFrameId: mf.id,
                                    frameStyle: 'minimal',
                                  });
                                }}
                                title={`${mf.name} — ${mf.categoryLabel}`}
                                className={`p-1 rounded-lg border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                  active
                                    ? 'bg-[#5c3214] border-[#ffe08a] ring-1 ring-[#f3bf55]'
                                    : 'bg-[#170b04] border-[#b98241]/35 hover:border-[#e6b868]'
                                }`}
                              >
                                <div className="w-full h-14 rounded cutting-mat-page flex items-center justify-center p-1 overflow-hidden">
                                  <img
                                    src={mf.imagePath}
                                    alt={mf.shortLabel}
                                    draggable={false}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                                <span className="text-[9px] leading-tight text-[#f7e2bc] truncate w-full text-center">
                                  {mf.shortLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(uhdBusyElementId)}
                    onClick={() => void handleEnhanceElementUltraHD(selectedElement)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#d99b38] to-[#9c6112] hover:brightness-110 border border-[#ffe08a]/55 text-xs font-semibold text-[#fff9e8] cursor-pointer shadow disabled:opacity-60"
                    title="Transformar a mayor resolución, nitidez y detalle Ultra-HD"
                  >
                    {uhdBusyElementId === selectedElement.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Mejorar HD</span>
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(uhdBusyElementId)}
                    onClick={() => void handleSaveElement8K(selectedElement)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2c4f3d] hover:bg-[#38654e] border border-[#8ce0b8]/45 text-xs font-semibold text-[#eafff2] cursor-pointer shadow disabled:opacity-60"
                    title="Guardar esta imagen super-renderizada en 8K PNG (7680 px) sin pixelar"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>8K PNG</span>
                  </button>

                  <button
                    type="button"
                    disabled={Boolean(uhdBusyElementId)}
                    onClick={() => void handleExportElementVectorSvg(selectedElement)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/45 text-xs text-[#f8dfb2] hover:bg-[#522f18] cursor-pointer disabled:opacity-60"
                    title="Exportar imagen vectorizada en formato SVG sin pixelación"
                  >
                    <span>SVG</span>
                  </button>
                </>
              )}

              {selectedElement.type === 'pattern-note' && selectedElement.patternData && (
                <>
                  <button
                    type="button"
                    onClick={() => onCopyPattern(selectedElement.patternData!)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                    title="Copiar solo este símbolo"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar símbolo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditorSubPanel((p) =>
                        p === 'symbol-color' ? null : 'symbol-color'
                      )
                    }
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                      editorSubPanel === 'symbol-color'
                        ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                        : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                    }`}
                    title="Cambiar color del símbolo"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/60"
                      style={{ backgroundColor: selectedElement.color || brush.color }}
                    />
                    <span>Color</span>
                  </button>
                </>
              )}

              {/* Word Typography Toolbar when Text is Selected */}
              {selectedElement.type === 'text' && (
                <>
                  {editingTextId === selectedElement.id ? (
                    <button
                      type="button"
                      onClick={() => finishEditingText()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#3d7c6b] to-[#265448] border border-[#8ce0c5]/45 text-xs font-semibold text-white cursor-pointer shadow"
                      title="Terminar de escribir (Esc)"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Listo</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingTextId(selectedElement.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer shadow"
                      title="Editar texto (o haz doble clic sobre el texto)"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Escribir</span>
                    </button>
                  )}

                  <select
                    value={selectedElement.fontFamily || 'lora'}
                    onChange={(e) => {
                      const nextFont = e.target.value as FontChoice;
                      const nextMeta = getFontMeta(nextFont);
                      ensureCalligraphyFontLoaded(nextFont);
                      const currSize = selectedElement.fontSize || 18;
                      const shouldBoostSize = currSize <= 20 && nextMeta.defaultSizePx >= 28;
                      updateElement(selectedElement.id, {
                        fontFamily: nextFont,
                        ...(shouldBoostSize ? { fontSize: nextMeta.defaultSizePx } : {}),
                      });
                    }}
                    aria-label="Caligrafía y tipografía"
                    title={`Elegir entre ${CALLIGRAPHY_FONTS.length} caligrafías reales, románticas, de poeta y letra corrida`}
                    style={{ fontFamily: getFontMeta(selectedElement.fontFamily || 'lora').cssFamily }}
                    className="px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/50 text-xs text-[#ffebc2] focus:outline-none cursor-pointer max-w-[175px]"
                  >
                    {CALLIGRAPHY_CATEGORIES.filter(
                      (c) => c.id !== 'todas' && c.id !== 'favoritas'
                    ).map((cat) => (
                      <optgroup
                        key={cat.id}
                        label={`${cat.badge} ${cat.label}`}
                        className="bg-[#241207] text-[#f5d8a4]"
                      >
                        {CALLIGRAPHY_FONTS.filter((f) => f.category === cat.id).map((font) => (
                          <option
                            key={font.id}
                            value={font.id}
                            className="bg-[#241207] text-[#fff2d6]"
                          >
                            {font.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        fontWeight:
                          selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                      })
                    }
                    className={`p-1.5 rounded-lg border cursor-pointer ${
                      selectedElement.fontWeight === 'bold'
                        ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                        : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                    }`}
                    title="Negrita"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        fontStyle:
                          selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                      })
                    }
                    className={`p-1.5 rounded-lg border cursor-pointer ${
                      selectedElement.fontStyle === 'italic'
                        ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                        : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                    }`}
                    title="Cursiva"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        textDecoration:
                          selectedElement.textDecoration === 'underline'
                            ? 'none'
                            : 'underline',
                      })
                    }
                    className={`p-1.5 rounded-lg border cursor-pointer ${
                      selectedElement.textDecoration === 'underline'
                        ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                        : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                    }`}
                    title="Subrayado"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const order: Array<'left' | 'center' | 'right'> = [
                        'left',
                        'center',
                        'right',
                      ];
                      const next =
                        order[(order.indexOf(selectedElement.textAlign || 'left') + 1) % 3];
                      updateElement(selectedElement.id, { textAlign: next });
                    }}
                    className="p-1.5 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                    title="Cambiar alineación"
                  >
                    {selectedElement.textAlign === 'center' ? (
                      <AlignCenter className="w-3.5 h-3.5" />
                    ) : selectedElement.textAlign === 'right' ? (
                      <AlignRight className="w-3.5 h-3.5" />
                    ) : (
                      <AlignLeft className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        fontSize: Math.max(10, (selectedElement.fontSize || 17) - 2),
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                    title="Reducir letra"
                  >
                    A-
                  </button>
                  <span className="text-[11px] font-mono-tab text-[#f3dcb3] px-1">
                    {selectedElement.fontSize || 17}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        fontSize: Math.min(72, (selectedElement.fontSize || 17) + 2),
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                    title="Aumentar letra"
                  >
                    A+
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditorSubPanel((p) => (p === 'text-color' ? null : 'text-color'))
                    }
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                      editorSubPanel === 'text-color'
                        ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                        : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                    }`}
                    title="Color de letra"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/60"
                      style={{ color: '#fff', backgroundColor: selectedElement.color || '#4e2712' }}
                    />
                    <span className="hidden md:inline">Color</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cycleTextHighlight(selectedElement)}
                    className={`p-1.5 rounded-lg border cursor-pointer ${
                      selectedElement.backgroundColor &&
                      selectedElement.backgroundColor !== 'transparent'
                        ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                        : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                    }`}
                    title="Resaltado / Tarjeta de texto"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReadTextElement(selectedElement)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      readerState.active &&
                      readerState.elementId === selectedElement.id &&
                      readerState.status === 'playing'
                        ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] border-[#ffe3a3] text-white shadow'
                        : 'bg-[#361d0e] border-[#c99552]/45 text-[#ffebc2] hover:bg-[#522f18]'
                    }`}
                    title="Leer este cuadro de texto con voz masculina neutral"
                  >
                    {readerState.active &&
                    readerState.elementId === selectedElement.id &&
                    readerState.status === 'playing' ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-[#f3c674]" />
                    )}
                    <span>
                      {readerState.active &&
                      readerState.elementId === selectedElement.id &&
                      readerState.status === 'playing'
                        ? 'Pausar'
                        : 'Leer'}
                    </span>
                  </button>
                </>
              )}

              {/* Paint Shape Toolbar when Shape is Selected */}
              {selectedElement.type === 'shape' && (
                <>
                  <select
                    value={
                      selectedElement.shapeKind ||
                      (selectedElement.content as ShapeKind) ||
                      'crochet-ring'
                    }
                    onChange={(e) => {
                      const kind = e.target.value as ShapeKind;
                      updateElement(selectedElement.id, {
                        shapeKind: kind,
                        content: kind,
                      });
                    }}
                    aria-label="Tipo de figura"
                    className="px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] focus:outline-none cursor-pointer"
                  >
                    <option value="crochet-ring">Anillo Crochet</option>
                    <option value="circle">Círculo</option>
                    <option value="square">Cuadro</option>
                    <option value="arrow">Flecha</option>
                    <option value="line">Línea</option>
                    <option value="heart">Corazón</option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      setEditorSubPanel((p) => (p === 'shape-color' ? null : 'shape-color'))
                    }
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                      editorSubPanel === 'shape-color'
                        ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                        : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                    }`}
                    title="Color de trazo de la figura"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-white/60"
                      style={{ backgroundColor: selectedElement.color || '#6b2229' }}
                    />
                    <span>Trazo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const hasFill =
                        selectedElement.fillColor &&
                        selectedElement.fillColor !== 'transparent';
                      const base = selectedElement.color || '#6b2229';
                      updateElement(selectedElement.id, {
                        fillColor: hasFill ? 'transparent' : `${base}33`,
                      });
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                      selectedElement.fillColor &&
                      selectedElement.fillColor !== 'transparent'
                        ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                        : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                    }`}
                    title="Alternar relleno Paint"
                  >
                    <PaintBucket className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Relleno</span>
                  </button>
                </>
              )}

              {/* Mannequin 360° Full-Body Controls (Hombre/Mujer, 360° Yaw, Copy in Exact Position & PNG, Color) */}
              {selectedElement.type === 'mannequin' && (() => {
                const currentGender =
                  selectedElement.mannequinGender ??
                  (selectedElement.id.includes('back') ? 'female' : 'male');
                const currentYaw = normalizeYawDeg(
                  selectedElement.mannequinYawDeg ??
                    (selectedElement.content === 'back' ? 180 : 0)
                );
                const setMannequinYaw = (nextRaw: number) => {
                  const nextYaw = normalizeYawDeg(nextRaw);
                  const isBackish = nextYaw > 90 && nextYaw < 270;
                  updateElement(selectedElement.id, {
                    mannequinYawDeg: nextYaw,
                    content: isBackish ? 'back' : 'front',
                  });
                };

                return (
                  <>
                    {/* Gender Toggle (Hombre / Mujer) */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextGender = currentGender === 'female' ? 'male' : 'female';
                        updateElement(selectedElement.id, {
                          mannequinGender: nextGender,
                          title:
                            nextGender === 'female'
                              ? 'Maniquí Mujer 360°'
                              : 'Maniquí Hombre 360°',
                        });
                        audioEngine.playStitchClick();
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/45 text-xs text-[#ffebc2] hover:bg-[#522f18] cursor-pointer"
                      title="Cambiar entre maniquí Hombre y Mujer"
                    >
                      <span>{currentGender === 'female' ? '♀ Mujer' : '♂ Hombre'}</span>
                    </button>

                    {/* 360° Rotation Popover Trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setEditorSubPanel((p) =>
                            p === 'mannequin-yaw' ? null : 'mannequin-yaw'
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                          editorSubPanel === 'mannequin-yaw'
                            ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                            : 'bg-[#462511] border-[#e6b35e]/55 text-[#ffebc2] hover:bg-[#5d3318]'
                        }`}
                        title="Girar maniquí en 360° (también puedes arrastrar el control 360° debajo del maniquí)"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-[#f6cb75]" />
                        <span className="font-mono-tab">360° · {currentYaw}°</span>
                      </button>

                      <AnimatePresence>
                        {editorSubPanel === 'mannequin-yaw' && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 top-full mt-2 w-72 rounded-xl leather-panel bg-[#221208] p-3 z-50 shadow-[0_22px_50px_rgba(0,0,0,0.94)] text-xs text-[#f5e4c4] space-y-2.5"
                          >
                            <div className="flex items-center justify-between border-b border-[#b98241]/25 pb-1.5">
                              <span className="font-display text-[#ffebc2]">
                                Girar 360° ({getYawAngleLabel(currentYaw)})
                              </span>
                              <span className="font-mono-tab text-[11px] text-[#f5ca79]">
                                {currentYaw}°
                              </span>
                            </div>

                            <div className="space-y-1">
                              <input
                                type="range"
                                min={0}
                                max={359}
                                value={currentYaw}
                                onChange={(e) => setMannequinYaw(Number(e.target.value))}
                                className="w-full accent-[#e6b35e] h-1.5 bg-[#140a04] rounded cursor-pointer"
                              />
                              <div className="flex justify-between text-[10px] text-[#c7a57b] font-mono-tab">
                                <span>0° Frente</span>
                                <span>90°</span>
                                <span>180° Espalda</span>
                                <span>270°</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-1 text-[11px]">
                              {[
                                { deg: 0, label: '0° Frente' },
                                { deg: 45, label: '45° ¾' },
                                { deg: 90, label: '90° Perfil' },
                                { deg: 135, label: '135° ¾' },
                                { deg: 180, label: '180° Atrás' },
                                { deg: 225, label: '225° ¾' },
                                { deg: 270, label: '270° Perfil' },
                                { deg: 315, label: '315° ¾' },
                              ].map((preset) => (
                                <button
                                  key={preset.deg}
                                  type="button"
                                  onClick={() => setMannequinYaw(preset.deg)}
                                  className={`py-1 px-1 rounded border text-[10px] cursor-pointer transition-colors ${
                                    Math.abs(currentYaw - preset.deg) <= 5
                                      ? 'bg-[#73411d] border-[#f3c46c] text-white font-semibold'
                                      : 'bg-[#361d0e] hover:bg-[#5b331a] border-[#b98241]/30 text-[#f3dcb3]'
                                  }`}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>

                            <div className="flex gap-1.5 pt-1 border-t border-[#b98241]/20">
                              <button
                                type="button"
                                onClick={() => setMannequinYaw(currentYaw - 15)}
                                className="flex-1 py-1 rounded bg-[#361d0e] hover:bg-[#5b331a] border border-[#b98241]/30 text-[11px] font-mono-tab text-[#f3dcb3] cursor-pointer"
                              >
                                -15°
                              </button>
                              <button
                                type="button"
                                onClick={() => setMannequinYaw(currentYaw + 15)}
                                className="flex-1 py-1 rounded bg-[#361d0e] hover:bg-[#5b331a] border border-[#b98241]/30 text-[11px] font-mono-tab text-[#f3dcb3] cursor-pointer"
                              >
                                +15°
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Copy / Duplicate Mannequin in Exact Current 360° Position */}
                    <button
                      type="button"
                      onClick={() => {
                        copySelectedElement(selectedElement);
                        duplicateElement(selectedElement);
                        audioEngine.playYarnPluck(2);
                        onNotify?.(
                          `Copiado en ${currentYaw}° (${getYawAngleLabel(currentYaw)}) — también listo en Ctrl+V`
                        );
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#522e15] hover:bg-[#6e3e1c] border border-[#e6b35e]/55 text-xs text-[#fff0cc] cursor-pointer"
                      title="Copiar y duplicar el maniquí en esta posición exacta de 360° (y guardarlo en Ctrl+V para otras hojas)"
                    >
                      <CopyPlus className="w-3.5 h-3.5 text-[#f7ce7a]" />
                      <span className="hidden sm:inline">Copiar posición</span>
                    </button>

                    {/* Copy Transparent PNG in Exact Current 360° Position */}
                    <button
                      type="button"
                      onClick={() => void copyMannequinPngInPosition(selectedElement)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#2e4228] hover:bg-[#3d5835] border border-[#9fd498]/50 text-xs text-[#e9fae7] cursor-pointer"
                      title="Copiar imagen PNG transparente del maniquí en esta posición exacta"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#b7edb0]" />
                      <span className="hidden md:inline">PNG</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateElement(selectedElement.id, {
                          color: selectedElement.color === 'wood' ? 'natural' : 'wood',
                        })
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                      title="Alternar entre Mármol Griego y Madera Tallada"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-white/60"
                        style={{
                          backgroundColor:
                            selectedElement.color === 'wood' ? '#D99658' : '#EDE4D5',
                        }}
                      />
                      <span>{selectedElement.color === 'wood' ? 'Madera' : 'Mármol'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditorSubPanel((p) =>
                          p === 'mannequin-color' ? null : 'mannequin-color'
                        )
                      }
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                        editorSubPanel === 'mannequin-color'
                          ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                          : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                      }`}
                      title="Teñir la estatua con un color personalizado"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-white/60"
                        style={{
                          backgroundColor:
                            selectedElement.color &&
                            selectedElement.color !== 'natural' &&
                            selectedElement.color !== 'wood'
                              ? selectedElement.color
                              : '#EDE4D5',
                        }}
                      />
                      <span>Color</span>
                    </button>
                  </>
                );
              })()}

              {/* Common Transform, Free Rotation & Layer Tools */}
              <button
                type="button"
                onClick={() =>
                  updateElement(selectedElement.id, {
                    width: Math.max(
                      selectedElement.type === 'pattern-note' ? 22 : 70,
                      selectedElement.width - (selectedElement.type === 'pattern-note' ? 10 : 22)
                    ),
                  })
                }
                className="px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                title="Reducir tamaño"
              >
                -
              </button>
              <button
                type="button"
                onClick={() =>
                  updateElement(selectedElement.id, {
                    width: Math.min(
                      390,
                      selectedElement.width + (selectedElement.type === 'pattern-note' ? 10 : 22)
                    ),
                  })
                }
                className="px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                title="Aumentar tamaño"
              >
                +
              </button>

              {/* Free Rotation Popover Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setEditorSubPanel((p) => (p === 'rotate' ? null : 'rotate'))
                  }
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs cursor-pointer ${
                    editorSubPanel === 'rotate'
                      ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                      : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                  }`}
                  title="Rotar libremente este objeto (o arrastra el círculo superior)"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="font-mono-tab">
                    {Math.round(selectedElement.rotation || 0)}°
                  </span>
                </button>

                <AnimatePresence>
                  {editorSubPanel === 'rotate' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-60 rounded-xl leather-panel bg-[#221208] p-3 z-50 shadow-[0_22px_50px_rgba(0,0,0,0.92)] text-xs text-[#f5e4c4] space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-[#b98241]/25 pb-1.5">
                        <span className="font-display text-[#ffebc2]">Rotación Libre</span>
                        <button
                          type="button"
                          onClick={() => updateElement(selectedElement.id, { rotation: 0 })}
                          className="text-[10px] text-[#e6be7a] hover:text-white cursor-pointer"
                        >
                          0°
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#dec49d]">Ángulo</span>
                          <span className="font-mono-tab text-[#ffebc2]">
                            {Math.round(selectedElement.rotation || 0)}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={359}
                          value={((Math.round(selectedElement.rotation || 0) % 360) + 360) % 360}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              rotation: Number(e.target.value),
                            })
                          }
                          className="w-full accent-[#d69c50] h-1.5 bg-[#140a04] rounded cursor-pointer"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[11px]">
                        {[-45, -15, 15, 90].map((delta) => (
                          <button
                            key={delta}
                            type="button"
                            onClick={() =>
                              updateElement(selectedElement.id, {
                                rotation:
                                  ((((selectedElement.rotation || 0) + delta) % 360) + 360) % 360,
                              })
                            }
                            className="py-1 rounded bg-[#361d0e] hover:bg-[#5b331a] border border-[#b98241]/30 text-[#f3dcb3] cursor-pointer font-mono-tab"
                          >
                            {delta > 0 ? `+${delta}°` : `${delta}°`}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          rotateAllElements('set', selectedElement.rotation || 0)
                        }
                        className="w-full py-1.5 rounded-lg bg-[#5b331a] hover:bg-[#754222] border border-[#e0ab5c]/40 text-[11px] text-[#ffebc2] cursor-pointer"
                      >
                        Aplicar a todos en la página
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() =>
                  updateElement(selectedElement.id, { flipX: !selectedElement.flipX })
                }
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  selectedElement.flipX
                    ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                    : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                }`}
                title="Voltear horizontalmente"
              >
                <FlipHorizontal2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  updateElement(selectedElement.id, { flipY: !selectedElement.flipY })
                }
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  selectedElement.flipY
                    ? 'bg-[#6b3d1e] border-[#ebb96a] text-white'
                    : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                }`}
                title="Voltear verticalmente"
              >
                <FlipVertical2 className="w-3.5 h-3.5" />
              </button>

              {selectedElement.type !== 'image' && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setEditorSubPanel((p) => (p === 'opacity' ? null : 'opacity'))
                    }
                    className="px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                    title="Opacidad"
                  >
                    {Math.round((selectedElement.opacity ?? 1) * 100)}%
                  </button>
                  <AnimatePresence>
                    {editorSubPanel === 'opacity' && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 p-3 rounded-xl leather-panel bg-[#221208] z-50"
                      >
                        <label className="text-[11px] text-[#dec49d] block mb-1">
                          Opacidad ({Math.round((selectedElement.opacity ?? 1) * 100)}%)
                        </label>
                        <input
                          type="range"
                          min={15}
                          max={100}
                          value={Math.round((selectedElement.opacity ?? 1) * 100)}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              opacity: Number(e.target.value) / 100,
                            })
                          }
                          className="w-full accent-[#d69c50] cursor-pointer"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {selectedElement.eraseStrokes && selectedElement.eraseStrokes.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    updateElement(selectedElement.id, { eraseStrokes: undefined });
                    onNotify?.('Borrados del objeto restaurados');
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#ffdfa3] hover:bg-[#522f18] cursor-pointer"
                  title="Restaurar trazos borrados de este objeto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Restaurar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => zoomToElement(selectedElement)}
                className="p-1.5 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                title={zoom >= 220 ? 'Volver a vista general (100%)' : 'Hacer zoom directo a este objeto'}
              >
                {zoom >= 220 ? (
                  <ZoomOut className="w-3.5 h-3.5" />
                ) : (
                  <ZoomIn className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => reorderElement(selectedElement.id, 'front')}
                className="p-1.5 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                title="Traer al frente"
              >
                <ArrowUpToLine className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => reorderElement(selectedElement.id, 'back')}
                className="p-1.5 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                title="Enviar atrás"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => toggleElementLock(selectedElement)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                  selectedElement.locked
                    ? 'bg-[#7a4b17] border-[#f6cb75] text-[#fff6e0] shadow-sm'
                    : 'bg-[#361d0e] border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18]'
                }`}
                title={
                  selectedElement.locked
                    ? 'Desbloquear objeto para poder moverlo o eliminarlo'
                    : 'Bloquear objeto para que no se pueda mover ni eliminar'
                }
              >
                {selectedElement.locked ? (
                  <Lock className="w-3.5 h-3.5 text-[#ffe19e]" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {selectedElement.locked ? 'Bloqueado' : 'Bloquear'}
                </span>
              </button>

              {isPermanentElement(selectedElement) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#2d1a0c] border border-[#d69f56]/45 text-[11px] text-[#f3d49b]">
                  Permanente
                </span>
              )}

              <button
                type="button"
                onClick={() => copySelectedElement(selectedElement)}
                className="p-1.5 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                title="Copiar objeto (Ctrl+C)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {!selectedElement.locked && !isPermanentElement(selectedElement) && (
                <button
                  type="button"
                  onClick={() => cutSelectedElement(selectedElement)}
                  className="p-1.5 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                  title="Cortar objeto (Ctrl+X)"
                >
                  <Scissors className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => duplicateElement(selectedElement)}
                className="p-1.5 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                title="Duplicar elemento"
              >
                <CopyPlus className="w-3.5 h-3.5" />
              </button>

              {!selectedElement.locked && !isPermanentElement(selectedElement) && (
                <button
                  type="button"
                  onClick={() => {
                    if (deleteElement(selectedElement.id)) {
                      onNotify?.('Objeto eliminado');
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#7a202a] border border-[#f29aa2]/50 text-xs font-medium text-[#ffecee] hover:bg-[#992a36] cursor-pointer shadow-sm"
                  title="Eliminar objeto seleccionado (Supr)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              )}
            </>
          )}

          {!isCatalogSpread &&
            activeUserSpread &&
            (activeUserSpread.leftDrawingDataUrl || activeUserSpread.rightDrawingDataUrl) &&
            (activeTool === 'draw' || activeTool === 'eraser') && (
              <button
                type="button"
                onClick={() =>
                  onUpdateSpread({
                    ...activeUserSpread,
                    leftDrawingDataUrl: undefined,
                    rightDrawingDataUrl: undefined,
                  })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Limpiar trazos</span>
              </button>
            )}

          <AnimatePresence>
            {!isCatalogSpread &&
              selectedElement &&
              (editorSubPanel === 'symbol-color' ||
                editorSubPanel === 'text-color' ||
                editorSubPanel === 'shape-color' ||
                editorSubPanel === 'mannequin-color') && (
                <ColorSwatchPopover
                  title={
                    editorSubPanel === 'text-color'
                      ? 'Color del Texto'
                      : editorSubPanel === 'shape-color'
                        ? 'Color de Figura'
                        : editorSubPanel === 'mannequin-color'
                          ? 'Color del Maniquí'
                          : 'Color del Símbolo'
                  }
                  color={
                    selectedElement.color && selectedElement.color !== 'natural'
                      ? selectedElement.color
                      : '#3E1E0C'
                  }
                  onChange={(hex) => updateElement(selectedElement.id, { color: hex })}
                  onClose={() => setEditorSubPanel(null)}
                />
              )}
          </AnimatePresence>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Overview Grid Modal Overlay */}
      {showOverview ? (
        <div className="w-full max-w-[1200px] flex-1 overflow-y-auto studio-scroll p-4 sm:p-5 rounded-2xl leather-panel bg-[#221208]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-[#b98241]/25">
            <div>
              <h3 className="font-display text-lg text-[#f7e2b9]">
                {isMandalaMode
                  ? `Índice de Mandalas (${mandalaSpreads.length} pliegos · ${allMandalaItems.length} diseños)`
                  : `Índice Visual del Libro (${totalBookSpreads} pliegos)`}
              </h3>
              <p className="text-xs text-[#e7cc9f]/70 mt-0.5">
                Haz clic en cualquier miniatura para abrir esas dos páginas o usa la papelera para eliminarlas
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onRestoreHiddenPages &&
                ((hiddenCatalogSpreadIds?.length ?? 0) > 0 ||
                  (hiddenMandalaSpreadIds?.length ?? 0) > 0) && (
                  <button
                    type="button"
                    onClick={onRestoreHiddenPages}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2e1a0d] hover:bg-[#492914] border border-[#b98241]/45 text-xs font-medium text-[#f1d39f] cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar catálogo</span>
                  </button>
                )}
              <button
                type="button"
                onClick={() => {
                  onAddSpread();
                  setShowOverview(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#523017] hover:bg-[#6e4120] border border-[#d6a25e]/45 text-xs font-medium text-[#ffebc2] cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva hoja</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOverview(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#9a6127] hover:bg-[#b2712f] text-xs font-medium text-white cursor-pointer whitespace-nowrap"
              >
                Volver al Cuaderno
              </button>
            </div>
          </div>

          {isMandalaMode && mandalaSpreads.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-editorial text-sm font-semibold text-[#f0c77c]">
                  Apartado Mandalas · {mandalaSpreads.length} pliegos
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {mandalaSpreads.map((ms, idx) => (
                  <div
                    key={ms.id}
                    className={`group rounded-xl border p-3 transition-colors ${
                      idx === safeMandalaIndex
                        ? 'border-[#f0c577] bg-[#4a2a15]/90'
                        : 'border-[#b98241]/35 bg-[#2a170c] hover:border-[#dfaf62]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChangeNotebookMode?.('mandalas');
                        onChangeMandalaSpreadIndex?.(idx);
                        setShowOverview(false);
                      }}
                      className="w-full text-left cursor-pointer block transition-transform duration-150 group-hover:scale-[1.01]"
                    >
                      <MandalaSpreadMiniature
                        leftItems={ms.leftItems}
                        rightItems={ms.rightItems}
                        mattedMap={mattedMandalaMap}
                      />
                    </button>
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onChangeNotebookMode?.('mandalas');
                          onChangeMandalaSpreadIndex?.(idx);
                          setShowOverview(false);
                        }}
                        className="min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div className="text-xs font-medium text-[#ffebc2] truncate">{ms.title}</div>
                        <div className="text-[11px] font-mono-tab text-[#e7cc9f]/75 mt-0.5">
                          Pliego {idx + 1} · {ms.leftItems.length + ms.rightItems.length} mandalas
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteMandalaSpread?.(ms.id, idx, mandalaSpreads.length)
                        }
                        aria-label={`Eliminar ${ms.title}`}
                        title="Eliminar estas dos páginas"
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#3b1512] hover:bg-[#6e211b] border border-[#e07a68]/55 text-[11px] font-medium text-[#ffd5cc] cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Book Spreads (Editable + Catalog + Mandalas) */}
          <div className="space-y-6">
            {/* Editable Notebook Pages first or in book order? Keep exact book order: Catalog -> Editable -> Mandalas */}
            {catalogSpreads.length > 0 && (
              <div>
                <h4 className="font-editorial text-sm font-semibold text-[#f0c77c] mb-3">
                  Catálogo de Patrones A–Z · {catalogSpreads.length} pliegos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {catalogSpreads.map((cs, idx) => (
                    <div
                      key={cs.id}
                      className={`group rounded-xl border p-3 transition-colors ${
                        !isMandalaMode && idx === safeIndex
                          ? 'border-[#f0c577] bg-[#4a2a15]/90'
                          : 'border-[#b98241]/35 bg-[#2a170c] hover:border-[#dfaf62]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChangeNotebookMode?.('book');
                          onChangeSpreadIndex(idx);
                          setShowOverview(false);
                        }}
                        className="w-full text-left cursor-pointer block transition-transform duration-150 group-hover:scale-[1.01]"
                      >
                        <CatalogSpreadMiniature
                          leftItems={cs.leftItems}
                          rightItems={cs.rightItems}
                        />
                      </button>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onChangeNotebookMode?.('book');
                            onChangeSpreadIndex(idx);
                            setShowOverview(false);
                          }}
                          className="min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div className="text-xs font-medium text-[#ffebc2] truncate">
                            {cs.title}
                          </div>
                          <div className="text-[11px] font-mono-tab text-[#e7cc9f]/75 mt-0.5">
                            Pliego {idx + 1} · {cs.leftItems.length + cs.rightItems.length} patrones
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCatalogSpread?.(cs.id, idx)}
                          aria-label={`Eliminar ${cs.title}`}
                          title="Eliminar estas dos páginas"
                          className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#3b1512] hover:bg-[#6e211b] border border-[#e07a68]/55 text-[11px] font-medium text-[#ffd5cc] cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                <h4 className="font-editorial text-sm font-semibold text-[#f0c77c]">
                  Hojas del Cuaderno · {spreads.length} pliegos editables
                </h4>
                {onReorderSpreads && spreads.length > 1 && (
                  <span className="text-[11px] text-[#e7cc9f]/80">
                    Arrastra una hoja o usa las flechas ← / → para cambiar el orden
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {spreads.map((sp, idx) => {
                  const globalIdx = catalogCount + idx;
                  const canDeleteThis = Boolean(onDeleteSpread) && spreads.length > 1;
                  const canReorder = Boolean(onReorderSpreads) && spreads.length > 1;
                  const isBeingDragged = dragSpreadIdx === idx;
                  const isDropTarget =
                    dropTargetSpreadIdx === idx &&
                    dragSpreadIdx !== null &&
                    dragSpreadIdx !== idx;
                  return (
                    <div
                      key={sp.id}
                      draggable={canReorder}
                      onDragStart={(e) => {
                        if (!canReorder) return;
                        setDragSpreadIdx(idx);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(idx));
                      }}
                      onDragOver={(e) => {
                        if (!canReorder || dragSpreadIdx === null || dragSpreadIdx === idx) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDropTargetSpreadIdx(idx);
                      }}
                      onDragLeave={() => {
                        if (dropTargetSpreadIdx === idx) {
                          setDropTargetSpreadIdx(null);
                        }
                      }}
                      onDrop={(e) => {
                        if (!canReorder) return;
                        e.preventDefault();
                        const from =
                          dragSpreadIdx !== null
                            ? dragSpreadIdx
                            : Number(e.dataTransfer.getData('text/plain'));
                        if (!Number.isNaN(from) && from !== idx) {
                          onReorderSpreads?.(from, idx);
                        }
                        setDragSpreadIdx(null);
                        setDropTargetSpreadIdx(null);
                      }}
                      onDragEnd={() => {
                        setDragSpreadIdx(null);
                        setDropTargetSpreadIdx(null);
                      }}
                      className={`group relative rounded-xl border p-3 transition-all ${
                        isBeingDragged
                          ? 'opacity-45 scale-[0.98] border-[#f0c577] bg-[#3a2010]'
                          : isDropTarget
                            ? 'ring-2 ring-[#ffe08a] border-[#ffe08a] bg-[#5a341a] scale-[1.02] shadow-[0_0_20px_rgba(255,214,102,0.35)]'
                            : !isMandalaMode && globalIdx === safeIndex
                              ? 'border-[#f0c577] bg-[#4a2a15]/90'
                              : 'border-[#b98241]/35 bg-[#2a170c] hover:border-[#dfaf62]'
                      }`}
                    >
                      {canReorder && (
                        <div
                          title="Arrastra para mover esta hoja de lugar"
                          className="absolute top-2 left-2 z-10 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#1d0f07]/85 border border-[#c9954c]/55 text-[10px] font-mono-tab text-[#f3d398] cursor-grab active:cursor-grabbing shadow-sm"
                        >
                          <GripVertical className="w-3 h-3" />
                          <span>#{idx + 1}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onChangeNotebookMode?.('book');
                          onChangeSpreadIndex(globalIdx);
                          setShowOverview(false);
                        }}
                        className="w-full text-left cursor-pointer block transition-transform duration-150 group-hover:scale-[1.01]"
                      >
                        <EditableSpreadMiniature spread={sp} />
                      </button>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onChangeNotebookMode?.('book');
                            onChangeSpreadIndex(globalIdx);
                            setShowOverview(false);
                          }}
                          className="min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div className="text-xs font-medium text-[#ffebc2] truncate">
                            {sp.title}
                          </div>
                          <div className="text-[11px] font-mono-tab text-[#e7cc9f]/75 mt-0.5">
                            Pliego {globalIdx + 1} · {sp.elements.length} elementos
                          </div>
                        </button>
                        <div className="shrink-0 flex items-center gap-1">
                          {canReorder && (
                            <>
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => onReorderSpreads?.(idx, idx - 1)}
                                aria-label={`Mover ${sp.title} una posición antes`}
                                title="Mover antes"
                                className="p-1.5 rounded-lg bg-[#3c2212] hover:bg-[#5c361c] border border-[#c9954c]/45 text-[#ffebc2] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === spreads.length - 1}
                                onClick={() => onReorderSpreads?.(idx, idx + 1)}
                                aria-label={`Mover ${sp.title} una posición después`}
                                title="Mover después"
                                className="p-1.5 rounded-lg bg-[#3c2212] hover:bg-[#5c361c] border border-[#c9954c]/45 text-[#ffebc2] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-colors"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            disabled={!canDeleteThis}
                            onClick={() => onDeleteSpread?.(sp.id)}
                            aria-label={`Eliminar ${sp.title}`}
                            title={
                              canDeleteThis
                                ? 'Eliminar estas dos páginas'
                                : 'Debe quedar al menos una hoja editable'
                            }
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#3b1512] hover:bg-[#6e211b] border border-[#e07a68]/55 text-[11px] font-medium text-[#ffd5cc] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!isMandalaMode && mandalaSpreads.length > 0 && (
              <div>
                <h4 className="font-editorial text-sm font-semibold text-[#f0c77c] mb-3">
                  Apartado Mandalas · {mandalaSpreads.length} pliegos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {mandalaSpreads.map((ms, idx) => (
                    <div
                      key={ms.id}
                      className="group rounded-xl border border-[#b98241]/35 bg-[#2a170c] hover:border-[#dfaf62] p-3 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChangeNotebookMode?.('mandalas');
                          onChangeMandalaSpreadIndex?.(idx);
                          setShowOverview(false);
                        }}
                        className="w-full text-left cursor-pointer block transition-transform duration-150 group-hover:scale-[1.01]"
                      >
                        <MandalaSpreadMiniature
                          leftItems={ms.leftItems}
                          rightItems={ms.rightItems}
                          mattedMap={mattedMandalaMap}
                        />
                      </button>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onChangeNotebookMode?.('mandalas');
                            onChangeMandalaSpreadIndex?.(idx);
                            setShowOverview(false);
                          }}
                          className="min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div className="text-xs font-medium text-[#ffebc2] truncate">
                            {ms.title}
                          </div>
                          <div className="text-[11px] font-mono-tab text-[#e7cc9f]/75 mt-0.5">
                            Mandalas {idx + 1} · {ms.leftItems.length + ms.rightItems.length} diseños
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onDeleteMandalaSpread?.(ms.id, idx, mandalaSpreads.length)
                          }
                          aria-label={`Eliminar ${ms.title}`}
                          title="Eliminar estas dos páginas"
                          className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#3b1512] hover:bg-[#6e211b] border border-[#e07a68]/55 text-[11px] font-medium text-[#ffd5cc] cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Open Book Stage with crisp 25%-500% whole-sheet zoom, 2-finger pinch & Space/Middle-click pan */
        <div
          ref={bookViewportRef}
          className={`flex-1 min-h-0 min-w-0 w-full h-full flex overflow-auto studio-scroll p-1 sm:p-2 ${
            isSpacePanning ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          style={{ touchAction: 'pan-x pan-y' }}
        >
          <div
            style={
              bookBaseSize.w > 0
                ? {
                    width: Math.round(bookBaseSize.w * (zoom / 100)),
                    height: Math.round(bookBaseSize.h * (zoom / 100)),
                    margin: 'auto',
                    flexShrink: 0,
                    position: 'relative',
                  }
                : {
                    margin: 'auto',
                    flexShrink: 0,
                    position: 'relative',
                  }
            }
          >
          <div
            ref={bookContainerRef}
            onPointerDownCapture={(e) => {
              if (activeTool !== 'eyedropper') return;
              e.stopPropagation();
              e.preventDefault();
              const picked = sampleColorAtScreenPoint(e.clientX, e.clientY);
              audioEngine.playYarnPluck(6);
              onPickColorFromCanvas(picked);
            }}
            style={{
              position: bookBaseSize.w > 0 ? 'absolute' : 'relative',
              top: 0,
              left: 0,
              width: bookBaseSize.w > 0 ? bookBaseSize.w : undefined,
              height: bookBaseSize.h > 0 ? bookBaseSize.h : undefined,
              transform: zoom === 100 ? undefined : `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }}
            className={`select-none ${
              isAnimatingFlip || flipDir ? 'book-stage' : ''
            } ${activeTool === 'eyedropper' ? 'cursor-crosshair' : ''}`}
          >
            {/* Outer 3D Leather Book Cover Frame (intrinsic w-max measured by ResizeObserver) */}
            <div ref={bookContentRef} className="relative flex w-max rounded-2xl p-1.5 sm:p-2 book-cover-3d">
              {/* Stitched Leather Inner Trim */}
              <div className="pointer-events-none absolute inset-1 rounded-[14px] border border-dashed border-[#d6a25e]/45" />

              {/* 3D Stacked Paper Thickness Shell */}
              <div className="relative flex items-stretch rounded-xl p-[3px] book-page-bottom-stack-3d shadow-[0_14px_30px_rgba(0,0,0,0.68)]">
                {/* Left Stacked Paper Thickness */}
                <div className="w-1.5 sm:w-2 rounded-l-lg book-page-stack-3d border-r border-[#8d6131]/55 shrink-0" />

                {/* Left & Right Parchment Pages */}
                <div className="relative flex rounded-md overflow-hidden border border-[#7c5328]/75 shadow-[inset_0_0_24px_rgba(88,52,20,0.22)]">
                {isMandalaMode && activeMandalaSpread ? (
                  <>
                    <MandalaCatalogPage
                      side="left"
                      spreadNumber={safeMandalaIndex + 1}
                      items={activeMandalaSpread.leftItems}
                      pageSizeClass={pageSizeClass}
                      selectedPatternId={selectedCatalogPattern?.id || null}
                      copiedPatternId={copiedPattern?.id || null}
                      mattedMap={mattedMandalaMap}
                      mattingId={mattingMandalaId}
                      mattingProgress={mattingProgress}
                      onSelectPattern={setSelectedCatalogPattern}
                      onCopyPattern={onCopyPattern}
                      onPreviewPattern={setPreviewMandala}
                      onExtractFigure={(item) => void handleExtractMandalaFigure(item)}
                    />
                    <MandalaCatalogPage
                      side="right"
                      spreadNumber={safeMandalaIndex + 1}
                      items={activeMandalaSpread.rightItems}
                      pageSizeClass={pageSizeClass}
                      selectedPatternId={selectedCatalogPattern?.id || null}
                      copiedPatternId={copiedPattern?.id || null}
                      mattedMap={mattedMandalaMap}
                      mattingId={mattingMandalaId}
                      mattingProgress={mattingProgress}
                      onSelectPattern={setSelectedCatalogPattern}
                      onCopyPattern={onCopyPattern}
                      onPreviewPattern={setPreviewMandala}
                      onExtractFigure={(item) => void handleExtractMandalaFigure(item)}
                    />
                  </>
                ) : isCatalogSpread && activeCatalogSpread ? (
                  <>
                    <PatternCatalogPage
                      side="left"
                      spreadNumber={safeIndex + 1}
                      items={activeCatalogSpread.leftItems}
                      pageSizeClass={pageSizeClass}
                      selectedPatternId={selectedCatalogPattern?.id || null}
                      copiedPatternId={copiedPattern?.id || null}
                      onSelectPattern={setSelectedCatalogPattern}
                      onCopyPattern={onCopyPattern}
                    />
                    <PatternCatalogPage
                      side="right"
                      spreadNumber={safeIndex + 1}
                      items={activeCatalogSpread.rightItems}
                      pageSizeClass={pageSizeClass}
                      selectedPatternId={selectedCatalogPattern?.id || null}
                      copiedPatternId={copiedPattern?.id || null}
                      onSelectPattern={setSelectedCatalogPattern}
                      onCopyPattern={onCopyPattern}
                    />
                  </>
                ) : activeUserSpread ? (
                  <SingleNotebookPage
                    side="unified"
                    spreadId={activeUserSpread.id}
                    paperStyle={activeUserSpread.paperStyle}
                    pageSizeClass={sheetSizeClass}
                    layerVisibility={layerVisibility}
                    layerOrder={layerOrder}
                    drawingDataUrl={activeUserSpread.leftDrawingDataUrl}
                    legacyRightDrawingDataUrl={activeUserSpread.rightDrawingDataUrl}
                    onSaveDrawing={(url) =>
                      onUpdateSpread({
                        ...activeUserSpread,
                        leftDrawingDataUrl: url,
                        rightDrawingDataUrl: undefined,
                      })
                    }
                    onCommitEraseResults={(url, elUpdates, removedIds) =>
                      commitPageEraseResults('unified', url, elUpdates, removedIds)
                    }
                    activeTool={activeTool}
                    brush={brush}
                    onPickColor={onPickColorFromCanvas}
                    elements={activeUserSpread.elements}
                    selectedElementId={selectedElementId}
                    editingTextId={editingTextId}
                    mattingElementId={mattingElementId}
                    mattingProgress={mattingProgress}
                    onSelectElement={(id) => {
                      const found = activeUserSpread.elements.find((e) => e.id === id);
                      if (found) lastActiveSideRef.current = found.side;
                      setSelectedElementId(id);
                    }}
                    onEditText={(id) => {
                      if (id === null) finishEditingText();
                      else setEditingTextId(id);
                    }}
                    onUpdateElement={updateElement}
                    onDeleteElement={(id) => {
                      if (deleteElement(id)) {
                        onNotify?.('Objeto eliminado');
                      }
                    }}
                    onToggleLockElement={toggleElementLock}
                    onExtractElementFigure={(el) => void handleExtractElementFigure(el)}
                    onRestoreElementFigure={handleRestoreElementFigure}
                    onEnterDressingRoom={onEnterDressingRoom}
                    readerElementId={readerState.active ? readerState.elementId : null}
                    readerIsPlaying={readerState.active && readerState.status === 'playing'}
                    onReadElement={handleReadTextElement}
                    onPlaceElement={(sheetXPct, y) => {
                      const targetSide: 'left' | 'right' = sheetXPct < 50 ? 'left' : 'right';
                      const localX = targetSide === 'left' ? sheetXPct * 2 : (sheetXPct - 50) * 2;
                      handlePlaceElement(targetSide, localX, y);
                    }}
                  />
                ) : null}

                {/* Tactile Page-Turn Edge Hotspots */}
                {canPrev && (
                  <div
                    onPointerDown={(e) => startEdgeDrag('prev', e.clientX)}
                    title="Arrastra hacia la derecha para volver a la página anterior"
                    className="absolute inset-y-0 left-0 w-7 z-30 cursor-grab active:cursor-grabbing hover:bg-gradient-to-r hover:from-[#a87842]/20 hover:to-transparent transition-colors"
                  />
                )}
                {canNext && (
                  <div
                    onPointerDown={(e) => startEdgeDrag('next', e.clientX)}
                    title="Arrastra hacia la izquierda para pasar a la página siguiente"
                    className="absolute inset-y-0 right-0 w-7 z-30 cursor-grab active:cursor-grabbing hover:bg-gradient-to-l hover:from-[#a87842]/20 hover:to-transparent transition-colors"
                  />
                )}

                {/* 3D Turning Single-Sheet Leaf Overlay */}
                {flipDir && (
                  <div
                    style={{
                      transformOrigin: flipDir === 'next' ? 'left center' : 'right center',
                      transform: `rotateY(${flipAngle}deg)`,
                      transition: isAnimatingFlip
                        ? 'transform 0.44s cubic-bezier(0.22, 1, 0.36, 1)'
                        : 'none',
                    }}
                    className="pointer-events-none absolute inset-0 z-40 preserve-3d"
                  >
                    <div className="absolute inset-0 backface-hidden cutting-mat-page cutting-mat-grid border-l border-[#a7d6ba]/40 shadow-[inset_18px_0_32px_rgba(8,24,18,0.35),-10px_0_24px_rgba(0,0,0,0.35)] flex items-center justify-center">
                      <span className="font-editorial italic text-[#dcf2e4]/65 text-lg">
                        Pasando hoja…
                      </span>
                    </div>
                    <div
                      style={{ transform: 'rotateY(180deg)' }}
                      className="absolute inset-0 backface-hidden cutting-mat-page cutting-mat-grid border-r border-[#a7d6ba]/40 shadow-[inset_-18px_0_32px_rgba(8,24,18,0.35)]"
                    />
                  </div>
                )}
                </div>

                {/* Right Stacked Paper Thickness */}
                <div className="w-1.5 sm:w-2 rounded-r-lg book-page-stack-3d border-l border-[#8d6131]/55 shrink-0" />
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Floating Masculine Neutral Voice Reader Bar (appears automatically on playback) */}
      <TextReaderBar readerState={readerState} />

      {/* Focus-Mode Minimal Floating Pill (only visible when right studio panels are hidden in Focus Mode) */}
      <AnimatePresence>
        {focusMode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-3 right-3 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-full carved-bar-3d shadow-2xl select-none"
          >
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => commitPageTurn('prev')}
              aria-label="Página anterior"
              title="Página anterior (←)"
              className="p-1 rounded-full text-[#f3dcb3] hover:bg-[#593319] disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-1.5 text-xs font-mono-tab text-[#f8e6c4]">
              {activeSafeIndex + 1} / {activeTotalSpreads}
            </span>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => commitPageTurn('next')}
              aria-label="Página siguiente"
              title="Página siguiente (→)"
              className="p-1 rounded-full text-[#f3dcb3] hover:bg-[#593319] disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[#b88443]/40 mx-0.5" />
            <button
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                setZoom((z) => Math.max(25, z - 20));
              }}
              aria-label="Alejar"
              title="Alejar (↓)"
              className="p-1 rounded-full text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                setZoom(100);
              }}
              title="Restablecer zoom al 100%"
              className="text-[11px] font-mono-tab text-[#f8e6c4] hover:text-[#ffe39f] w-10 text-center cursor-pointer"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                setZoom((z) => Math.min(800, z + 20));
              }}
              aria-label="Acercar"
              title="Acercar (↑)"
              className="p-1 rounded-full text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {onDeleteSpread &&
              activeUserSpread &&
              !isCatalogView &&
              spreads.length > 1 && (
                <>
                  <div className="w-px h-4 bg-[#b88443]/40 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => onDeleteSpread(activeUserSpread.id)}
                    aria-label="Eliminar estas dos páginas"
                    title="Eliminar estas dos páginas"
                    className="p-1 rounded-full bg-[#4e1a15] text-[#ffd4cb] hover:bg-[#73231c] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            {onToggleFocusMode && (
              <button
                type="button"
                onClick={() => {
                  audioEngine.playToggleChime(true);
                  onToggleFocusMode();
                }}
                title="Mostrar herramientas"
                className="p-1 rounded-full bg-[#8c5422] text-white hover:bg-[#a6662c] cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick on-canvas Zoom Pill when zoomed in/out in docked mode */}
      <AnimatePresence>
        {!focusMode && !showOverview && zoom !== 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-2.5 right-2.5 z-40 flex items-center gap-1 px-2 py-1 rounded-full carved-bar-3d shadow-xl select-none"
          >
            <button
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                setZoom((z) => Math.max(25, z - 20));
              }}
              aria-label="Alejar"
              title="Alejar (↓ / Ctrl -)"
              className="p-1 rounded-full text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                setZoom(100);
              }}
              title="Restablecer zoom al 100% (Ctrl 0)"
              className="text-[11px] font-mono-tab text-[#f8e6c4] hover:text-[#ffe39f] w-10 text-center cursor-pointer"
            >
              {zoom}%
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                setZoom((z) => Math.min(800, z + 20));
              }}
              aria-label="Acercar"
              title="Acercar (↑ / Ctrl +)"
              className="p-1 rounded-full text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandala Full-Size Lightbox Preview Modal */}
      <AnimatePresence>
        {previewMandala && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewMandala(null)}
            className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full max-h-[92vh] rounded-2xl leather-panel bg-[#221208] p-3 sm:p-4 flex flex-col gap-3 shadow-[0_28px_70px_rgba(0,0,0,0.95)]"
            >
              <div className="flex items-center justify-between gap-2 border-b border-[#b98241]/30 pb-2">
                <div className="min-w-0">
                  <h3 className="font-editorial text-lg font-bold text-[#ffebc2] truncate">
                    {previewMandala.name}
                  </h3>
                  <p className="text-xs text-[#e2c697] truncate">
                    {previewMandala.description} · {previewMandala.abbreviation}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {previewMandala.imagePath && (
                    <button
                      type="button"
                      disabled={Boolean(mattingMandalaId)}
                      onClick={() => void handleExtractMandalaFigure(previewMandala)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#3d7c6b] to-[#265448] hover:brightness-110 border border-[#8ce0c5]/45 text-xs font-medium text-white cursor-pointer shadow disabled:opacity-60"
                      title={
                        mattedBaseMandalaMap[previewMandala.id]
                          ? 'Cambiar colores y tonos de la figura extraída'
                          : 'Extraer la figura sin fondo y personalizar sus colores y tonos'
                      }
                    >
                      {mattingMandalaId === previewMandala.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : mattedBaseMandalaMap[previewMandala.id] ? (
                        <Palette className="w-3.5 h-3.5" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {mattingMandalaId === previewMandala.id
                          ? `Extrayendo ${mattingProgress}%`
                          : mattedBaseMandalaMap[previewMandala.id]
                            ? 'Colores y tonos'
                            : 'Extraer figura'}
                      </span>
                    </button>
                  )}
                  {previewMandala.imagePath && mattedBaseMandalaMap[previewMandala.id] && (
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playUndoRedo(false);
                        onRestoreExtractedMandala?.(previewMandala.id);
                        const originalItem = allMandalaItems.find((m) => m.id === previewMandala.id);
                        if (originalItem) {
                          setPreviewMandala(originalItem);
                        }
                        onNotify?.('Mandala restaurado a su imagen original');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3c2110] hover:bg-[#5b3319] border border-[#d69f56]/45 text-xs font-medium text-[#ffebc2] cursor-pointer"
                      title="Restaurar imagen original sin extraer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Original</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const effective = mattedMandalaMap[previewMandala.id]
                        ? { ...previewMandala, imagePath: mattedMandalaMap[previewMandala.id] }
                        : previewMandala;
                      setSelectedCatalogPattern(effective);
                      onCopyPattern(effective);
                      setPreviewMandala(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3c2110] hover:bg-[#5b3319] border border-[#d69f56]/50 text-xs font-medium text-[#ffebc2] cursor-pointer"
                    title="Copiar al portapapeles (Ctrl+V para pegar en tus hojas)"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar (Ctrl+V)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMandala(null)}
                    aria-label="Cerrar vista ampliada"
                    className="p-1.5 rounded-lg bg-[#6e212a] hover:bg-[#8c2d34] text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="relative flex-1 min-h-0 flex items-center justify-center bg-[#f6ecd7] rounded-xl p-3 overflow-auto studio-scroll">
                {previewMandala.imagePath ? (
                  <img
                    src={mattedMandalaMap[previewMandala.id] || previewMandala.imagePath}
                    alt={previewMandala.name}
                    className="max-h-[70vh] w-auto max-w-full object-contain select-none"
                  />
                ) : (
                  <CrochetMandalaSvg
                    mandalaId={previewMandala.mandalaId || previewMandala.id}
                    className="w-72 h-72"
                  />
                )}
              </div>

              {(() => {
                const idx = allMandalaItems.findIndex((m) => m.id === previewMandala.id);
                const prevItem = idx > 0 ? allMandalaItems[idx - 1] : null;
                const nextItem =
                  idx >= 0 && idx < allMandalaItems.length - 1
                    ? allMandalaItems[idx + 1]
                    : null;
                return (
                  <div className="flex items-center justify-between text-xs text-[#e2c697]">
                    <button
                      type="button"
                      disabled={!prevItem}
                      onClick={() => prevItem && setPreviewMandala(prevItem)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#361d0e] hover:bg-[#522f18] border border-[#c99552]/40 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Anterior</span>
                    </button>
                    <span className="font-mono-tab text-[11px]">
                      {idx + 1} / {allMandalaItems.length}
                    </span>
                    <button
                      type="button"
                      disabled={!nextItem}
                      onClick={() => nextItem && setPreviewMandala(nextItem)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#361d0e] hover:bg-[#522f18] border border-[#c99552]/40 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mandala & Extracted Figure Color & Tone Studio Modal */}
      <AnimatePresence>
        {colorStudioTarget && (
          <MandalaColorStudioModal
            title={
              colorStudioTarget.kind === 'mandala'
                ? colorStudioTarget.item.name
                : colorStudioTarget.title
            }
            baseImageSrc={colorStudioTarget.baseImageSrc}
            initialColor={brush.color}
            applyLabel={
              colorStudioTarget.kind === 'mandala'
                ? 'Aplicar color y copiar (Ctrl+V)'
                : 'Aplicar colores en la hoja'
            }
            onApply={(recoloredDataUrl) => {
              if (colorStudioTarget.kind === 'mandala') {
                const { item, baseImageSrc } = colorStudioTarget;
                onSaveExtractedMandala?.(item.id, {
                  baseDataUrl: baseImageSrc,
                  coloredDataUrl: recoloredDataUrl,
                  updatedAt: new Date().toISOString(),
                });
                const coloredPattern: CopiedPatternData = {
                  ...item,
                  imagePath: recoloredDataUrl,
                };
                setSelectedCatalogPattern(coloredPattern);
                onCopyPattern(coloredPattern);
                setPreviewMandala((prev) =>
                  prev && prev.id === item.id ? { ...prev, imagePath: recoloredDataUrl } : prev
                );
                onNotify?.(`Color guardado y copiado: ${item.name}`);
              } else {
                extractedElementBaseRef.current[colorStudioTarget.elementId] =
                  colorStudioTarget.baseImageSrc;
                updateElement(colorStudioTarget.elementId, {
                  extractedBaseContent: colorStudioTarget.baseImageSrc,
                  content: recoloredDataUrl,
                  frameStyle: 'minimal',
                });
                onNotify?.('Colores y tonos guardados en la hoja');
              }
              setColorStudioTarget(null);
            }}
            onClose={() => setColorStudioTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Image Crop Modal */}
      {croppingElement && (
        <ImageCropModal
          imageSrc={croppingElement.content}
          title={croppingElement.title}
          onCancel={() => setCroppingElement(null)}
          onApplyCrop={(croppedDataUrl) => {
            updateElement(croppingElement.id, { content: croppedDataUrl });
            setCroppingElement(null);
          }}
        />
      )}
    </div>
  );
};

/* ---------- First Pages: Interactive Crochet Pattern Catalog Page ---------- */

const PatternCatalogPage: React.FC<{
  side: 'left' | 'right';
  spreadNumber: number;
  items: CopiedPatternData[];
  pageSizeClass: string;
  selectedPatternId: string | null;
  copiedPatternId: string | null;
  onSelectPattern: (pat: CopiedPatternData) => void;
  onCopyPattern: (pat: CopiedPatternData) => void;
}> = memo(
  ({
    side,
    spreadNumber,
    items,
    pageSizeClass,
    selectedPatternId,
    copiedPatternId,
    onSelectPattern,
    onCopyPattern,
  }) => {
    const pageNum = (spreadNumber - 1) * 2 + (side === 'left' ? 1 : 2);
    return (
      <div className={`relative ${pageSizeClass} cutting-mat-page cutting-mat-grid overflow-hidden flex flex-col px-6 py-4`}>
        {/* Header */}
        <div className="relative z-10 flex items-baseline justify-between border-b border-[#b2dfc4]/35 pb-1.5 mb-2.5">
          <div>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#f7eed8]">
              {side === 'left' ? 'Índice de Patrones Crochet' : 'Alfabeto y Diagramas'}
            </h2>
            <p className="text-[11px] text-[#cce6d6]">
              Haz clic encima de cualquier patrón o punto para copiarlo automáticamente
            </p>
          </div>
          <span className="font-mono-tab text-[11px] text-[#d5ecde]">Pág. {pageNum}</span>
        </div>

        {/* Pattern Cards Grid — Transparent & Click-to-Auto-Copy */}
        <div className="relative z-10 flex-1 grid grid-cols-1 gap-2.5 overflow-y-auto studio-scroll pr-1">
          {items.map((item) => {
            const isSelected = selectedPatternId === item.id;
            const isCopied = copiedPatternId === item.id;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                title={`Clic para copiar automáticamente: ${item.name}`}
                onClick={() => {
                  onSelectPattern(item);
                  onCopyPattern(item);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPattern(item);
                    onCopyPattern(item);
                  }
                }}
                className={`group relative rounded-2xl border p-2.5 transition-all duration-200 cursor-pointer flex items-center gap-3.5 select-none ${
                  isSelected || isCopied
                    ? 'bg-[#14372a]/85 border-[#f0c77c] ring-1 ring-[#f0c77c]/60 shadow-[0_6px_18px_rgba(8,24,18,0.35)]'
                    : 'bg-[#163b2d]/62 border-[#a7d6ba]/35 hover:bg-[#1a4736]/85 hover:border-[#e6bc70]/75 hover:-translate-y-0.5 active:scale-[0.99]'
                }`}
              >
                {/* Delicate stitched inner corner accents */}
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-[#b8e0c9]/45 rounded-tr-sm" />
                <span className="pointer-events-none absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-[#b8e0c9]/45 rounded-bl-sm" />

                {/* Symbol / Pattern Preview Box with soft ivory backing for dark stitch ink */}
                <div className="w-14 h-14 rounded-xl bg-[#f7efdc]/95 border border-dashed border-[#c7a169]/65 group-hover:border-[#f0c77c] flex items-center justify-center shrink-0 p-1 overflow-hidden transition-colors shadow-sm">
                  {item.diagramGrid ? (
                    <DiagramGridSvg
                      grid={item.diagramGrid}
                      className="w-12 h-12 drop-shadow-[0_1px_2px_rgba(62,30,12,0.18)]"
                    />
                  ) : (
                    <StitchSymbolSvg
                      stitchKey={item.stitchKey}
                      className="w-11 h-11 drop-shadow-[0_1px_2px_rgba(62,30,12,0.18)]"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      {item.letter && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#7a202a]/90 text-[#fff6e5] border border-[#e3b868]/45 font-display text-[10px] shadow-xs">
                          {item.letter}
                        </span>
                      )}
                      <h3 className="font-editorial text-base font-bold text-[#fff4dc] truncate">
                        {item.name}
                      </h3>
                      <span className="font-mono-tab text-[10px] px-1.5 py-0.5 rounded bg-[#275c48]/80 border border-[#a7d6ba]/40 text-[#e4f5ea]">
                        {item.abbreviation}
                      </span>
                    </div>

                    {isCopied ? (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2f6e55] border border-[#b4e4c7]/60 text-[10px] font-medium text-[#effbf3]">
                        <Check className="w-3 h-3" />
                        <span>Copiado</span>
                      </span>
                    ) : (
                      <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] italic text-[#f2cf8c]">
                        Clic para copiar
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#d4eadc]/90 line-clamp-2 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-xs italic text-[#cce6d6]">
              Final del catálogo de patrones
            </div>
          )}
        </div>
      </div>
    );
  }
);

/* ---------- Mandala Gallery Pages Inside the Notebook (Click-to-Auto-Copy) ---------- */

const MandalaCatalogPage: React.FC<{
  side: 'left' | 'right';
  spreadNumber: number;
  items: CopiedPatternData[];
  pageSizeClass: string;
  selectedPatternId: string | null;
  copiedPatternId: string | null;
  mattedMap: Record<string, string>;
  mattingId: string | null;
  mattingProgress: number;
  onSelectPattern: (pat: CopiedPatternData) => void;
  onCopyPattern: (pat: CopiedPatternData) => void;
  onPreviewPattern: (pat: CopiedPatternData) => void;
  onExtractFigure: (pat: CopiedPatternData) => void;
}> = memo(
  ({
    side,
    spreadNumber,
    items,
    pageSizeClass,
    selectedPatternId,
    copiedPatternId,
    mattedMap,
    mattingId,
    mattingProgress,
    onSelectPattern,
    onCopyPattern,
    onPreviewPattern,
    onExtractFigure,
  }) => {
    const pageNum = (spreadNumber - 1) * 2 + (side === 'left' ? 1 : 2);
    const hasPhotos = items.some((it) => Boolean(it.imagePath));
    return (
      <div className={`relative ${pageSizeClass} cutting-mat-page cutting-mat-grid overflow-hidden flex flex-col px-5 py-3.5`}>
        {/* Header */}
        <div className="relative z-10 flex items-baseline justify-between border-b border-[#b2dfc4]/35 pb-1.5 mb-2">
          <div>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#f7eed8]">
              {side === 'left'
                ? 'Apartado de Mandalas'
                : hasPhotos
                  ? 'Galería de Diagramas'
                  : 'Encaje y Rosetones'}
            </h2>
            <p className="text-[10.5px] text-[#cce6d6]">
              Clic en cualquier foto para copiar · Lupa para ampliar diagrama
            </p>
          </div>
          <span className="font-mono-tab text-[11px] text-[#d5ecde]">Pág. {pageNum}</span>
        </div>

        {/* Multi-Mandala Grid — Arranged Photos & Vector Mandalas with Click-to-Auto-Copy */}
        <div className="relative z-10 flex-1 grid grid-cols-2 grid-rows-3 gap-2 min-h-0">
          {items.map((item) => {
            const isSelected = selectedPatternId === item.id;
            const isCopied = copiedPatternId === item.id;
            const isPhoto = Boolean(item.imagePath);
            const displayImage = mattedMap[item.id] || item.imagePath;
            const effectiveItem = mattedMap[item.id]
              ? { ...item, imagePath: mattedMap[item.id] }
              : item;
            const isMatting = mattingId === item.id;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                title={`Clic para copiar: ${item.name} (${item.description})`}
                onClick={() => {
                  onSelectPattern(effectiveItem);
                  onCopyPattern(effectiveItem);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPattern(effectiveItem);
                    onCopyPattern(effectiveItem);
                  }
                }}
                className={`group relative rounded-xl border p-1.5 transition-all duration-200 cursor-pointer flex flex-col items-center justify-between text-center select-none min-h-0 overflow-hidden ${
                  isSelected || isCopied
                    ? 'bg-[#14372a]/85 border-[#f0c77c] ring-2 ring-[#f0c77c]/75 shadow-[0_6px_16px_rgba(8,24,18,0.35)]'
                    : 'bg-[#163b2d]/62 border-[#a7d6ba]/35 hover:bg-[#1a4736]/85 hover:border-[#e6bc70]/75 hover:-translate-y-0.5 active:scale-[0.98]'
                }`}
              >
                {/* Zoom / Preview button in top-left */}
                <button
                  type="button"
                  aria-label={`Ampliar ${item.name}`}
                  title="Ampliar diagrama"
                  onClick={(e) => {
                    e.stopPropagation();
                    audioEngine.playStitchClick();
                    onPreviewPattern(effectiveItem);
                  }}
                  className="absolute top-1.5 left-1.5 z-20 p-1 rounded-md bg-[#2a1509]/80 hover:bg-[#7a202a] text-[#ffebc2] opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>

                {isPhoto && (
                  <button
                    type="button"
                    disabled={Boolean(mattingId)}
                    title={
                      mattedMap[item.id]
                        ? 'Cambiar colores y tonos de la figura extraída'
                        : 'Extraer figura sin fondo y cambiar colores y tonos'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onExtractFigure(item);
                    }}
                    className={`absolute bottom-7 right-1.5 z-20 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-medium text-white shadow transition-opacity cursor-pointer disabled:opacity-60 ${
                      mattedMap[item.id]
                        ? 'bg-[#8c4b1e]/95 hover:bg-[#ad5e26] border-[#f2c478]/65'
                        : 'bg-[#265448]/92 hover:bg-[#327060] border-[#8ce0c5]/50'
                    } ${
                      isMatting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {isMatting ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : mattedMap[item.id] ? (
                      <Palette className="w-2.5 h-2.5" />
                    ) : (
                      <Wand2 className="w-2.5 h-2.5" />
                    )}
                    <span>
                      {isMatting
                        ? `${mattingProgress}%`
                        : mattedMap[item.id]
                          ? 'Colores y tonos'
                          : 'Extraer figura'}
                    </span>
                  </button>
                )}

                {isCopied ? (
                  <span className="absolute top-1.5 right-1.5 z-20 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#2e5a44] text-white text-[9px] font-medium shadow">
                    <Check className="w-2.5 h-2.5" />
                    <span>Copiado</span>
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded bg-[#f5e7cf]/95 border border-[#b48449]/40 text-[9px] font-medium text-[#5a3015]">
                    Copiar
                  </span>
                )}

                {isPhoto ? (
                  <div className="flex-1 w-full min-h-0 rounded-lg bg-[#f7efdc]/94 overflow-hidden flex items-center justify-center p-0.5">
                    <img
                      src={displayImage}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className={`w-full h-full object-contain transition-transform duration-200 group-hover:scale-[1.03] ${
                        mattedMap[item.id] ? '' : 'mix-blend-multiply'
                      }`}
                    />
                  </div>
                ) : (
                  <div className="flex-1 w-full rounded-lg bg-[#f7efdc]/92 flex items-center justify-center min-h-0 py-0.5">
                    <CrochetMandalaSvg
                      mandalaId={item.mandalaId || item.id}
                      className="w-[74px] h-[74px] sm:w-[88px] sm:h-[88px] drop-shadow-[0_1px_2px_rgba(62,30,12,0.16)] transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="w-full min-w-0 pt-1 flex items-center justify-between gap-1 px-0.5">
                  <h3 className="font-editorial text-[11px] font-bold text-[#fff4dc] truncate leading-tight">
                    {item.name}
                  </h3>
                  <span className="shrink-0 font-mono-tab text-[8.5px] px-1 py-0.2 rounded bg-[#275c48]/80 text-[#dcf2e4] leading-tight">
                    {item.abbreviation}
                  </span>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="col-span-2 row-span-3 flex items-center justify-center text-xs italic text-[#7a542f]">
              Final del apartado de mandalas
            </div>
          )}
        </div>
      </div>
    );
  }
);

/* ---------- Photo Adjustments Popover ---------- */

const ImageAdjustmentsPopover: React.FC<{
  filters: ImageFilters;
  opacity: number;
  onChangeFilters: (next: ImageFilters) => void;
  onChangeOpacity: (next: number) => void;
}> = ({ filters, opacity, onChangeFilters, onChangeOpacity }) => {
  const applyPreset = (preset: 'original' | 'vintage' | 'bw' | 'vivid') => {
    if (preset === 'original') {
      onChangeFilters({ ...DEFAULT_FILTERS });
      onChangeOpacity(1);
    } else if (preset === 'vintage') {
      onChangeFilters({ brightness: 105, contrast: 95, saturate: 85, sepia: 45, blur: 0 });
    } else if (preset === 'bw') {
      onChangeFilters({ brightness: 105, contrast: 118, saturate: 0, sepia: 0, blur: 0 });
    } else {
      onChangeFilters({ brightness: 104, contrast: 114, saturate: 140, sepia: 0, blur: 0 });
    }
  };

  return (
    <div className="absolute left-0 top-full mt-2 w-64 rounded-xl leather-panel bg-[#221208] p-3.5 z-50 text-xs text-[#f5e4c4] space-y-2.5 shadow-[0_22px_50px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between border-b border-[#b98241]/25 pb-1.5">
        <span className="font-display text-[#ffebc2] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#f0c77c]" />
          Edición de Foto
        </span>
        <button
          type="button"
          onClick={() => applyPreset('original')}
          className="text-[10px] text-[#e6be7a] hover:text-white cursor-pointer"
        >
          Restablecer
        </button>
      </div>

      {/* Quick Filter Presets */}
      <div className="grid grid-cols-4 gap-1 text-[10px]">
        {[
          { id: 'original', label: 'Original' },
          { id: 'vintage', label: 'Vintage' },
          { id: 'bw', label: 'B / N' },
          { id: 'vivid', label: 'Vívido' },
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.id as 'original' | 'vintage' | 'bw' | 'vivid')}
            className="py-1 rounded bg-[#361d0e] hover:bg-[#5b331a] border border-[#b98241]/30 text-[#f3dcb3] cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      <FilterSlider
        label="Brillo"
        value={filters.brightness}
        min={50}
        max={150}
        unit="%"
        onChange={(brightness) => onChangeFilters({ ...filters, brightness })}
      />
      <FilterSlider
        label="Contraste"
        value={filters.contrast}
        min={50}
        max={150}
        unit="%"
        onChange={(contrast) => onChangeFilters({ ...filters, contrast })}
      />
      <FilterSlider
        label="Saturación"
        value={filters.saturate}
        min={0}
        max={200}
        unit="%"
        onChange={(saturate) => onChangeFilters({ ...filters, saturate })}
      />
      <FilterSlider
        label="Calidez Sepia"
        value={filters.sepia}
        min={0}
        max={100}
        unit="%"
        onChange={(sepia) => onChangeFilters({ ...filters, sepia })}
      />
      <FilterSlider
        label="Desenfoque"
        value={filters.blur}
        min={0}
        max={6}
        unit="px"
        onChange={(blur) => onChangeFilters({ ...filters, blur })}
      />
      <FilterSlider
        label="Opacidad"
        value={Math.round(opacity * 100)}
        min={20}
        max={100}
        unit="%"
        onChange={(val) => onChangeOpacity(val / 100)}
      />
    </div>
  );
};

const FilterSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, unit, onChange }) => (
  <div className="space-y-0.5">
    <div className="flex justify-between text-[11px]">
      <span className="text-[#dec49d]">{label}</span>
      <span className="font-mono-tab text-[#ffebc2]">
        {value}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[#d69c50] h-1.5 bg-[#140a04] rounded cursor-pointer"
    />
  </div>
);

/* ---------- Shared Color Swatch Popover (Symbols, Word Text, Paint Shapes) ---------- */

const ColorSwatchPopover: React.FC<{
  title: string;
  color: string;
  onChange: (hex: string) => void;
  onClose: () => void;
}> = ({ title, color, onChange, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -6, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -6, scale: 0.96 }}
    transition={{ duration: 0.15 }}
    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-60 rounded-xl leather-panel bg-[#221208] p-3 z-50 shadow-[0_22px_50px_rgba(0,0,0,0.92)]"
  >
    <div className="flex items-center justify-between mb-2 text-xs">
      <span className="font-display text-[#ffebc2]">{title}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-[11px] text-[#e6be7a] hover:text-white cursor-pointer"
      >
        Cerrar
      </button>
    </div>
    <div className="grid grid-cols-6 gap-1.5 mb-2.5">
      {[
        '#3E1E0C',
        '#7A202A',
        '#B5383E',
        '#C9822B',
        '#2E5A44',
        '#3366CC',
        '#5A396B',
        '#C76D73',
        '#1C130E',
        '#7D5836',
        '#5B7DA6',
        '#FFFFFF',
      ].map((hex) => {
        const active = color.toUpperCase() === hex.toUpperCase();
        return (
          <button
            key={hex}
            type="button"
            onClick={() => onChange(hex)}
            aria-label={`Color ${hex}`}
            style={{ backgroundColor: hex }}
            className={`w-full aspect-square rounded border cursor-pointer transition-transform ${
              active
                ? 'border-[#fff2cc] scale-110 ring-2 ring-[#e7b96b]/70'
                : 'border-[#3a2010] hover:scale-105'
            }`}
          />
        );
      })}
    </div>
    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#b98241]/25 text-[11px] text-[#dec49d]">
      <span>Personalizado</span>
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-6 rounded bg-[#140a04] border border-[#d6a25e]/45 cursor-pointer"
      />
    </div>
  </motion.div>
);

/* ---------- Paint + Crochet Shape Renderer ---------- */

const ShapeSvg: React.FC<{
  kind: ShapeKind;
  stroke: string;
  fill: string;
}> = ({ kind, stroke, fill }) => {
  const effectiveFill = fill && fill !== 'transparent' ? fill : 'none';

  if (kind === 'circle') {
    return (
      <svg viewBox="0 0 120 120" className="w-full h-auto" fill="none">
        <circle cx="60" cy="60" r="46" stroke={stroke} strokeWidth="3.5" fill={effectiveFill} />
      </svg>
    );
  }
  if (kind === 'square') {
    return (
      <svg viewBox="0 0 120 120" className="w-full h-auto" fill="none">
        <rect
          x="16"
          y="16"
          width="88"
          height="88"
          rx="10"
          stroke={stroke}
          strokeWidth="3.5"
          fill={effectiveFill}
        />
      </svg>
    );
  }
  if (kind === 'arrow') {
    return (
      <svg viewBox="0 0 120 120" className="w-full h-auto" fill="none">
        <path
          d="M16 60 H94 M68 34 L98 60 L68 86"
          stroke={stroke}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === 'line') {
    return (
      <svg viewBox="0 0 120 40" className="w-full h-auto" fill="none">
        <line
          x1="8"
          y1="20"
          x2="112"
          y2="20"
          stroke={stroke}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === 'heart') {
    return (
      <svg viewBox="0 0 120 120" className="w-full h-auto" fill="none">
        <path
          d="M60 100 C60 100 18 73 18 42 C18 26 30 16 44 16 C53 16 60 22 60 28 C60 22 67 16 76 16 C90 16 102 26 102 42 C102 73 60 100 60 100 Z"
          stroke={stroke}
          strokeWidth="3.5"
          strokeLinejoin="round"
          fill={effectiveFill}
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className="w-full h-auto" fill="none">
      <circle
        cx="60"
        cy="60"
        r="48"
        stroke={stroke}
        strokeWidth="2.2"
        strokeDasharray="5 4"
        fill={effectiveFill}
      />
      <circle
        cx="60"
        cy="60"
        r="30"
        stroke={stroke}
        strokeWidth="1.8"
        strokeDasharray="3 3"
      />
      <circle cx="60" cy="60" r="10" stroke={stroke} strokeWidth="2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="60"
          y1="20"
          x2="60"
          y2="34"
          transform={`rotate(${deg} 60 60)`}
          stroke={stroke}
          strokeWidth="1.8"
        />
      ))}
    </svg>
  );
};

/* ---------- Per-Object Stroke Eraser Mask Helpers ---------- */

function buildEraseMaskDataUri(strokes?: ElementEraseStroke[]): string | undefined {
  if (!strokes || strokes.length === 0) return undefined;
  const vbH = Math.max(10, strokes[strokes.length - 1]?.vbH || 100);
  const hasSoft = strokes.some((s) => s.soft);
  const shapes: string[] = [];

  for (const stroke of strokes) {
    if (!stroke.points.length) continue;
    const scaleY = vbH / Math.max(10, stroke.vbH || vbH);
    const w = Math.max(1.2, stroke.width);
    const filterAttr = stroke.soft ? ' filter="url(#f)"' : '';
    if (stroke.points.length === 1) {
      const [px, py] = stroke.points[0];
      shapes.push(
        `<circle cx="${px.toFixed(1)}" cy="${(py * scaleY).toFixed(1)}" r="${(w / 2).toFixed(1)}" fill="black"${filterAttr}/>`
      );
    } else {
      const d = stroke.points
        .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${(py * scaleY).toFixed(1)}`)
        .join(' ');
      shapes.push(
        `<path d="${d}" stroke="black" stroke-width="${w.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" fill="none"${filterAttr}/>`
      );
    }
  }

  if (shapes.length === 0) return undefined;
  const filterDef = hasSoft
    ? `<filter id="f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter>`
    : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 ${vbH.toFixed(1)}" preserveAspectRatio="none"><defs>${filterDef}<mask id="m"><rect x="0" y="0" width="100" height="${vbH.toFixed(1)}" fill="white"/>${shapes.join('')}</mask></defs><rect x="0" y="0" width="100" height="${vbH.toFixed(1)}" fill="white" mask="url(#m)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function distSqToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 0.0001) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy);
}

function isElementFullyErased(strokes: ElementEraseStroke[]): boolean {
  if (strokes.length === 0) return false;
  const vbH = Math.max(10, strokes[strokes.length - 1]?.vbH || 100);
  const cols = 6;
  const rows = 6;
  let covered = 0;
  const total = cols * rows;

  for (let r = 0; r < rows; r++) {
    const sy = ((r + 0.5) / rows) * vbH * 0.84 + vbH * 0.08;
    for (let c = 0; c < cols; c++) {
      const sx = ((c + 0.5) / cols) * 84 + 8;
      let hit = false;
      for (const stroke of strokes) {
        const scaleY = vbH / Math.max(10, stroke.vbH || vbH);
        const radSq = (stroke.width * 0.52) * (stroke.width * 0.52);
        const pts = stroke.points;
        if (pts.length === 1) {
          const dx = sx - pts[0][0];
          const dy = sy - pts[0][1] * scaleY;
          if (dx * dx + dy * dy <= radSq) {
            hit = true;
            break;
          }
        } else {
          for (let i = 1; i < pts.length; i++) {
            if (
              distSqToSegment(
                sx,
                sy,
                pts[i - 1][0],
                pts[i - 1][1] * scaleY,
                pts[i][0],
                pts[i][1] * scaleY
              ) <= radSq
            ) {
              hit = true;
              break;
            }
          }
          if (hit) break;
        }
      }
      if (hit) covered++;
    }
  }
  return covered / total >= 0.94;
}

function isPermanentElement(el: PageElement): boolean {
  return Boolean(el.permanent || el.type === 'wardrobe');
}

/* ---------- Memoized Page Element Item (Fast Drag, Resize & Free Rotate) ---------- */

const PageElementItem = memo<{
  el: PageElement;
  isSelected: boolean;
  isEditing: boolean;
  isDrawLocked: boolean;
  unifiedSheet?: boolean;
  isReadMode?: boolean;
  isReadingThis?: boolean;
  isReadingPlaying?: boolean;
  isMatting?: boolean;
  mattingProgress?: number;
  liveOverride?: { x: number; y: number; width: number; rotation?: number };
  liveEraseStrokes?: ElementEraseStroke[];
  onStartDrag: (el: PageElement, e: React.PointerEvent) => void;
  onStartResize: (el: PageElement, e: React.PointerEvent) => void;
  onStartRotate: (el: PageElement, e: React.PointerEvent) => void;
  onDoubleClick: (el: PageElement, e: React.MouseEvent) => void;
  onUpdateElement: (id: string, patch: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  onToggleLockElement: (el: PageElement) => void;
  onExtractFigure?: (el: PageElement) => void;
  onRestoreFigure?: (el: PageElement) => void;
  onEnterDressingRoom?: (season?: WardrobeSeasonId) => void;
  onReadElement?: (el: PageElement) => void;
  onEditTextDone: () => void;
}>(
  ({
    el,
    isSelected,
    isEditing,
    isDrawLocked,
    unifiedSheet = false,
    isReadMode = false,
    isReadingThis = false,
    isReadingPlaying = false,
    isMatting = false,
    mattingProgress = 0,
    liveOverride,
    liveEraseStrokes,
    onStartDrag,
    onStartResize,
    onStartRotate,
    onDoubleClick,
    onUpdateElement,
    onDeleteElement,
    onToggleLockElement,
    onExtractFigure,
    onRestoreFigure,
    onEnterDressingRoom,
    onReadElement,
    onEditTextDone,
  }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [liveMannequinYaw, setLiveMannequinYaw] = useState<number | null>(null);
    const yawDragRef = useRef<{ startX: number; startYaw: number } | null>(null);
    const isLocked = Boolean(el.locked);
    const isPermanent = isPermanentElement(el);
    const mannequinGender =
      el.mannequinGender ?? (el.id.includes('back') ? 'female' : 'male');
    const committedMannequinYaw = normalizeYawDeg(
      el.mannequinYawDeg ?? (el.content === 'back' ? 180 : 0)
    );
    const activeMannequinYaw = liveMannequinYaw ?? committedMannequinYaw;
    const activeEraseStrokes = liveEraseStrokes ?? el.eraseStrokes;
    const eraseMaskUri = useMemo(
      () => buildEraseMaskDataUri(activeEraseStrokes),
      [activeEraseStrokes]
    );

    useEffect(() => {
      if (isEditing && el.type === 'text') {
        const raf = requestAnimationFrame(() => {
          const ta = textareaRef.current;
          if (ta) {
            ta.focus();
            ta.style.height = 'auto';
            ta.style.height = `${ta.scrollHeight}px`;
            const len = ta.value.length;
            ta.setSelectionRange(len, len);
          }
        });
        return () => cancelAnimationFrame(raf);
      }
    }, [isEditing, el.type]);

    const baseX = unifiedSheet
      ? el.side === 'right'
        ? 50 + el.x * 0.5
        : el.x * 0.5
      : el.x;
    const x = liveOverride ? liveOverride.x : baseX;
    const y = liveOverride ? liveOverride.y : el.y;
    const width = liveOverride ? liveOverride.width : el.width;
    const rotation =
      liveOverride?.rotation !== undefined ? liveOverride.rotation : el.rotation || 0;

    const flipScale = `${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1}`;
    const transformParts: string[] = [];
    if (rotation) transformParts.push(`rotate(${rotation}deg)`);
    if (el.flipX || el.flipY) transformParts.push(`scale(${flipScale})`);

    const cssFilter = el.filters
      ? `brightness(${el.filters.brightness}%) contrast(${el.filters.contrast}%) saturate(${el.filters.saturate}%) sepia(${el.filters.sepia}%) blur(${el.filters.blur}px)`
      : undefined;

    const isMattedCutout = Boolean(
      el.extractedBaseContent || (el.originalContent && el.content !== el.originalContent)
    );
    const isMinimalPngCutout =
      el.frameStyle === 'minimal' && el.content.startsWith('data:image/png');
    const isMinimalAssetDiagram =
      el.frameStyle === 'minimal' && el.content.startsWith('/assets/aistudio/');

    const frameClasses =
      el.frameStyle === 'minimal'
        ? isMinimalAssetDiagram || isMattedCutout || isMinimalPngCutout
          ? 'p-0 bg-transparent border-0'
          : 'p-0 bg-transparent border-0 shadow-md'
        : el.frameStyle === 'gold'
          ? 'p-1.5 bg-[#2d180b] border-2 border-[#e0af5a] rounded-lg shadow-lg'
          : el.frameStyle === 'rounded'
            ? 'p-1 bg-[#fffdf7] border border-[#b98a50]/60 rounded-2xl overflow-hidden shadow-md'
            : 'p-1.5 bg-[#fffdf7] border border-[#b98a50]/65 rounded shadow-md';

    const hasTextBg = Boolean(el.backgroundColor && el.backgroundColor !== 'transparent');

    // Full-width 4-door Neoclassical Greek Wardrobe spanning the entire sheet width cleanly inside the cm rulers
    if (el.type === 'wardrobe') {
      return (
        <div
          data-element-box="true"
          style={
            unifiedSheet
              ? {
                  left: '3.4%',
                  right: '3.4%',
                  top: '4.4%',
                  bottom: '4.6%',
                  opacity: el.opacity ?? 1,
                }
              : {
                  left: '4.5%',
                  right: '6.5%',
                  top: '5%',
                  bottom: '5.5%',
                  opacity: el.opacity ?? 1,
                }
          }
          className={`absolute flex items-center justify-center ${
            isDrawLocked ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        >
          <CrochetWardrobe3D
            disabled={isDrawLocked}
            onEnterDressingRoom={onEnterDressingRoom}
          />
        </div>
      );
    }

    return (
      <div
        data-element-box="true"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width,
          opacity: el.opacity ?? 1,
          transform: transformParts.length ? transformParts.join(' ') : undefined,
        }}
        onPointerDown={(e) => {
          if (isReadMode && el.type === 'text' && !isEditing && onReadElement) {
            e.stopPropagation();
            onReadElement(el);
            return;
          }
          onStartDrag(el, e);
        }}
        onDoubleClick={(e) => onDoubleClick(el, e)}
        className={`group absolute ${
          isDrawLocked
            ? 'pointer-events-none'
            : isReadMode && el.type === 'text' && !isEditing
              ? 'pointer-events-auto cursor-pointer'
              : isLocked
                ? 'pointer-events-auto cursor-default'
                : 'pointer-events-auto cursor-move'
        } ${
          isReadingThis && el.type === 'text'
            ? 'ring-2 ring-[#e8b454] ring-offset-2 ring-offset-[#fbf2de]/80 rounded-lg shadow-[0_0_16px_rgba(232,180,84,0.38)]'
            : isSelected && !isDrawLocked
              ? isLocked
                ? 'ring-2 ring-[#d99f44] ring-offset-2 ring-offset-[#fbf2de]/70 rounded-lg'
                : 'ring-2 ring-[#b95b37] ring-offset-2 ring-offset-[#fbf2de]/70 rounded-lg'
              : isReadMode && el.type === 'text' && !isEditing
                ? 'ring-1 ring-dashed ring-[#c88f3d]/75 rounded-lg'
                : ''
        }`}
      >
        {/* Top-Left Direct Lock / Unlock Button on EVERY object */}
        {!isEditing && !isDrawLocked && (isSelected || isLocked) && (
          <button
            type="button"
            aria-label={isLocked ? 'Desbloquear objeto' : 'Bloquear objeto'}
            title={
              isLocked
                ? 'Desbloquear objeto (permitir mover y editar)'
                : 'Bloquear objeto (no se podrá mover ni eliminar)'
            }
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLockElement(el);
            }}
            className={`absolute -top-3 -left-3 z-30 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-md transition-all hover:scale-110 cursor-pointer ${
              isLocked
                ? isSelected
                  ? 'bg-[#8c5416] hover:bg-[#a8661d] border-[#ffe3a3] text-[#fff6dc]'
                  : 'bg-[#3a200d]/85 hover:bg-[#8c5416] border-[#e6b35e]/80 text-[#f7d894] opacity-85 hover:opacity-100'
                : 'bg-[#361d0e] hover:bg-[#5a3217] border-[#f2c672] text-[#ffebc2]'
            }`}
          >
            {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        )}

        {/* Top-Center Free Rotation Handle when selected and unlocked */}
        {isSelected && !isEditing && !isDrawLocked && !isLocked && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-30">
            <button
              type="button"
              aria-label="Rotar libremente"
              title="Arrastra para rotar libremente (Shift libera el ajuste a 90°)"
              onPointerDown={(e) => onStartRotate(el, e)}
              className="w-5 h-5 rounded-full bg-[#3a1f0e] hover:bg-[#5c3217] border-2 border-[#f2c672] text-[#ffebc2] flex items-center justify-center shadow cursor-grab active:cursor-grabbing"
            >
              <RotateCw className="w-2.5 h-2.5" />
            </button>
            <div className="w-px h-2 bg-[#b95b37]" />
            {liveOverride?.rotation !== undefined && (
              <span className="absolute -top-6 px-1.5 py-0.5 rounded bg-[#221208] border border-[#d69f56]/60 text-[10px] font-mono-tab text-[#ffebc2] shadow whitespace-nowrap">
                {Math.round(rotation)}°
              </span>
            )}
          </div>
        )}

        {/* Top-Right Direct Delete Button (hidden when locked or permanent) */}
        {isSelected && !isEditing && !isDrawLocked && !isLocked && !isPermanent && (
          <button
            type="button"
            aria-label="Eliminar objeto"
            title="Eliminar objeto (Supr)"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteElement(el.id);
            }}
            className="absolute -top-3 -right-3 z-30 w-6 h-6 rounded-full bg-[#8b222b] hover:bg-[#ad2b36] border-2 border-[#fff1dc] text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}

        {/* Erasable Visual Content Wrapper (supports true stroke-based erasing on images, text, stickers, mandalas, shapes & mannequins) */}
        <div
          data-erasable-content={el.id}
          style={
            eraseMaskUri
              ? {
                  maskImage: eraseMaskUri,
                  WebkitMaskImage: eraseMaskUri,
                  maskSize: '100% 100%',
                  WebkitMaskSize: '100% 100%',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                }
              : undefined
          }
          className="w-full"
        >
        {el.type === 'text' &&
          (isEditing ? (
            <textarea
              ref={textareaRef}
              autoFocus
              value={el.content}
              placeholder="Escribe aquí..."
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
                  e.preventDefault();
                  onEditTextDone();
                }
              }}
              onChange={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                onUpdateElement(el.id, { content: e.target.value });
              }}
              onFocus={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
              onBlur={onEditTextDone}
              rows={2}
              style={{
                fontFamily: getFontMeta(el.fontFamily || 'lora').cssFamily,
                color:
                  !hasTextBg &&
                  (!el.color || el.color.toLowerCase() === '#4e2712')
                    ? '#F7EED8'
                    : el.color || '#F7EED8',
                fontSize: el.fontSize || 17,
                fontWeight: el.fontWeight || 'normal',
                fontStyle: el.fontStyle || 'normal',
                textDecoration: el.textDecoration || 'none',
                textAlign: el.textAlign || 'left',
                backgroundColor: hasTextBg ? el.backgroundColor : 'rgba(18, 49, 38, 0.92)',
              }}
              className="w-full min-h-[2.2em] resize-none overflow-hidden border-2 border-dashed border-[#e5ba6c] rounded-lg px-2 py-1.5 leading-snug focus:outline-none placeholder:text-[#c7e3d2]/60 placeholder:italic shadow-sm"
            />
          ) : (
            <p
              style={{
                fontFamily: getFontMeta(el.fontFamily || 'lora').cssFamily,
                color:
                  !hasTextBg &&
                  (!el.color || el.color.toLowerCase() === '#4e2712')
                    ? '#F7EED8'
                    : el.color || '#F7EED8',
                fontSize: el.fontSize || 17,
                fontWeight: el.fontWeight || 'normal',
                fontStyle: el.fontStyle || 'normal',
                textDecoration: el.textDecoration || 'none',
                textAlign: el.textAlign || 'left',
                backgroundColor: hasTextBg ? el.backgroundColor : undefined,
                padding: hasTextBg ? '6px 10px' : '2px 4px',
                borderRadius: hasTextBg ? '8px' : undefined,
              }}
              className="whitespace-pre-wrap leading-snug break-words"
            >
              {el.content || (
                <span className="italic opacity-55">Doble clic para escribir…</span>
              )}
            </p>
          ))}

        {/* Direct per-textbox "Leer" button (visible in Leer mode, when selected/reading, or on hover) */}
        {el.type === 'text' && !isEditing && !isDrawLocked && onReadElement && el.content.trim().length > 0 && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className={`absolute -bottom-7 left-0 z-30 transition-opacity duration-150 ${
              isReadMode || isReadingThis || isSelected
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReadElement(el);
              }}
              title={
                isReadingPlaying
                  ? 'Pausar lectura'
                  : 'Leer este cuadro de texto con voz masculina neutral'
              }
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10.5px] font-medium shadow-md cursor-pointer transition-all hover:scale-105 ${
                isReadingPlaying
                  ? 'bg-gradient-to-b from-[#d89d4e] to-[#9b6022] border-[#ffe4a8] text-[#1f0e04]'
                  : 'bg-[#2a1509]/95 hover:bg-[#492713] border-[#e7b86a]/70 text-[#ffebc2]'
              }`}
            >
              {isReadingPlaying ? (
                <Pause className="w-2.5 h-2.5 fill-current" />
              ) : (
                <Volume2 className="w-3 h-3 text-[#f4c672]" />
              )}
              <span>{isReadingPlaying ? 'Pausar' : 'Leer'}</span>
            </button>
          </div>
        )}

        {el.type === 'sticker' && (
          <CrochetStickerSvg id={el.content} className="w-full h-auto drop-shadow" />
        )}

        {el.type === 'shape' && (
          <ShapeSvg
            kind={el.shapeKind || (el.content as ShapeKind) || 'crochet-ring'}
            stroke={el.color || '#6b2229'}
            fill={el.fillColor || 'transparent'}
          />
        )}

        {el.type === 'image' && (() => {
          const museumFrame = getMuseumFrameById(el.museumFrameId);
          if (museumFrame) {
            const frameAspect = `${museumFrame.naturalWidth} / ${museumFrame.naturalHeight}`;
            return (
              <div
                className="relative w-full select-none"
                style={{ aspectRatio: frameAspect }}
              >
                {/* Photo nestled cleanly behind the realistic museum frame opening */}
                <div
                  className={`absolute overflow-hidden ${museumFrame.isOval ? 'rounded-[50%]' : 'rounded-[2px]'}`}
                  style={{
                    top: `${museumFrame.insets.top}%`,
                    right: `${museumFrame.insets.right}%`,
                    bottom: `${museumFrame.insets.bottom}%`,
                    left: `${museumFrame.insets.left}%`,
                  }}
                >
                  <img
                    src={el.content}
                    alt={el.title || 'Obra enmarcada'}
                    referrerPolicy="no-referrer"
                    decoding="async"
                    style={{ filter: cssFilter }}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                {/* Photorealistic 3D Museum / Wood / Nature / Crochet Lace Frame Overlay */}
                <img
                  src={museumFrame.imagePath}
                  alt={museumFrame.name}
                  decoding="async"
                  draggable={false}
                  className="pointer-events-none relative z-10 block w-full h-full object-fill drop-shadow-[0_10px_20px_rgba(0,0,0,0.48)]"
                />
              </div>
            );
          }

          return (
          <div className={`relative ${frameClasses}`}>
            <img
              src={el.content}
              alt={el.title || 'Foto de proyecto'}
              referrerPolicy="no-referrer"
              decoding="async"
              style={{ filter: cssFilter }}
              className={`w-full h-auto object-contain ${
                el.frameStyle === 'rounded' ? 'rounded-xl' : 'rounded'
              } ${isMinimalAssetDiagram ? 'mix-blend-multiply' : ''} ${
                isMattedCutout || isMinimalPngCutout
                  ? 'drop-shadow-[0_4px_10px_rgba(45,22,8,0.28)]'
                  : ''
              }`}
              draggable={false}
            />

            {/* Direct per-image AI Image Matting ("Extraer figura") button */}
            {!isDrawLocked && onExtractFigure && !el.content.startsWith('/marcos/') && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className={`absolute bottom-1.5 left-1.5 z-20 flex items-center gap-1 transition-opacity duration-150 ${
                  isMatting || isSelected
                    ? 'opacity-100'
                    : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <button
                  type="button"
                  disabled={isMatting}
                  onClick={(e) => {
                    e.stopPropagation();
                    onExtractFigure(el);
                  }}
                  title={
                    isMattedCutout
                      ? 'Cambiar colores y tonos de la figura extraída'
                      : 'Extraer la figura sin fondo y cambiar colores y tonos'
                  }
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium text-white shadow-md cursor-pointer disabled:opacity-75 ${
                    isMattedCutout
                      ? 'bg-[#8c4b1e]/95 hover:bg-[#ad5e26] border-[#f2c478]/65'
                      : 'bg-[#244e43]/92 hover:bg-[#2f695a] border-[#8ce0c5]/60'
                  }`}
                >
                  {isMatting ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : isMattedCutout ? (
                    <Palette className="w-2.5 h-2.5" />
                  ) : (
                    <Wand2 className="w-2.5 h-2.5" />
                  )}
                  <span>
                    {isMatting
                      ? `${mattingProgress}%`
                      : isMattedCutout
                        ? 'Colores y tonos'
                        : 'Extraer figura'}
                  </span>
                </button>

                {isMattedCutout && el.originalContent && onRestoreFigure && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreFigure(el);
                    }}
                    title="Restaurar imagen original"
                    className="p-1 rounded-full bg-[#2b160a]/90 hover:bg-[#4e2a14] border border-[#d69f56]/55 text-[#ffebc2] shadow-md cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )}

            {el.title && el.frameStyle !== 'minimal' && (
              <p
                className={`mt-1 text-center font-hand text-sm truncate ${
                  el.frameStyle === 'gold' ? 'text-[#f6e2be]' : 'text-[#5c361d]'
                }`}
              >
                {el.title}
              </p>
            )}
          </div>
          );
        })()}

        {el.type === 'pattern-note' && el.patternData && (
          <div
            title={el.patternData.name}
            className="w-full aspect-square bg-transparent flex items-center justify-center select-none drop-shadow-[0_1px_2px_rgba(62,30,12,0.16)]"
          >
            {el.patternData.mandalaId ? (
              <CrochetMandalaSvg
                mandalaId={el.patternData.mandalaId}
                color={el.color}
                className="w-full h-full"
              />
            ) : el.patternData.diagramGrid ? (
              <DiagramGridSvg
                grid={el.patternData.diagramGrid}
                color={el.color || '#3e1e0c'}
                className="w-full h-full"
              />
            ) : (
              <StitchSymbolSvg
                stitchKey={el.patternData.stitchKey}
                color={el.color}
                className="w-full h-full"
              />
            )}
          </div>
        )}

        {el.type === 'mannequin' && (
          <MannequinSvg
            view={el.content === 'back' ? 'back' : 'front'}
            gender={mannequinGender}
            yawDeg={activeMannequinYaw}
            color={el.color}
            className="w-full h-auto drop-shadow-[0_4px_10px_rgba(64,33,12,0.22)] select-none"
          />
        )}
        </div>

        {/* Direct On-Mannequin 360° Drag-to-Spin Control Pill */}
        {el.type === 'mannequin' && isSelected && !isEditing && !isDrawLocked && (
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              yawDragRef.current = {
                startX: e.clientX,
                startYaw: activeMannequinYaw,
              };
              setLiveMannequinYaw(activeMannequinYaw);
            }}
            onPointerMove={(e) => {
              const drag = yawDragRef.current;
              if (!drag) return;
              e.stopPropagation();
              const dx = e.clientX - drag.startX;
              const nextYaw = normalizeYawDeg(drag.startYaw + dx * 1.5);
              setLiveMannequinYaw(nextYaw);
            }}
            onPointerUp={(e) => {
              const drag = yawDragRef.current;
              if (!drag) return;
              e.stopPropagation();
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                // ignore if pointer already released
              }
              const dx = e.clientX - drag.startX;
              const finalYaw = normalizeYawDeg(drag.startYaw + dx * 1.5);
              yawDragRef.current = null;
              setLiveMannequinYaw(null);
              const isBackish = finalYaw > 90 && finalYaw < 270;
              onUpdateElement(el.id, {
                mannequinYawDeg: finalYaw,
                content: isBackish ? 'back' : 'front',
              });
            }}
            onPointerCancel={() => {
              yawDragRef.current = null;
              setLiveMannequinYaw(null);
            }}
            title="Arrastra hacia izquierda o derecha para girar el maniquí 360°"
            className="absolute -bottom-7 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2b160a]/95 hover:bg-[#492510] border border-[#f0c06c]/80 text-[10px] font-mono-tab text-[#ffebc2] shadow-[0_4px_12px_rgba(0,0,0,0.55)] cursor-ew-resize select-none whitespace-nowrap touch-none"
          >
            <RotateCw className="w-2.5 h-2.5 text-[#f7ce78]" />
            <span>
              {mannequinGender === 'female' ? '♀' : '♂'} {activeMannequinYaw}° ·{' '}
              {getYawAngleLabel(activeMannequinYaw)}
            </span>
          </div>
        )}

        {/* Corner Resize Handle when selected and unlocked */}
        {isSelected && !isEditing && !isDrawLocked && !isLocked && (
          <button
            type="button"
            aria-label="Cambiar tamaño"
            onPointerDown={(e) => onStartResize(el, e)}
            className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-[#e6b35e] border-2 border-[#2a1509] shadow cursor-nwse-resize"
          />
        )}
      </div>
    );
  }
);

/* ---------- Single Interactive Page with Fast Canvas + Elements ---------- */

interface SinglePageProps {
  side: 'left' | 'right' | 'unified';
  spreadId: string;
  paperStyle: PaperStyle;
  pageSizeClass: string;
  layerVisibility: LayerVisibility;
  layerOrder: StackableLayerId[];
  drawingDataUrl?: string;
  legacyRightDrawingDataUrl?: string;
  onSaveDrawing: (dataUrl: string) => void;
  onCommitEraseResults: (
    drawingDataUrl: string | undefined,
    elementStrokeUpdates: Record<string, ElementEraseStroke[]>,
    fullyErasedIds: string[]
  ) => void;
  activeTool: ActiveCanvasTool;
  brush: BrushSettings;
  onPickColor: (hex: string) => void;
  elements: PageElement[];
  selectedElementId: string | null;
  editingTextId: string | null;
  mattingElementId?: string | null;
  mattingProgress?: number;
  onSelectElement: (id: string | null) => void;
  onEditText: (id: string | null) => void;
  onUpdateElement: (id: string, patch: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  onToggleLockElement: (el: PageElement) => void;
  onExtractElementFigure?: (el: PageElement) => void;
  onRestoreElementFigure?: (el: PageElement) => void;
  onEnterDressingRoom?: (season?: WardrobeSeasonId) => void;
  readerElementId?: string | null;
  readerIsPlaying?: boolean;
  onReadElement?: (el: PageElement) => void;
  onPlaceElement: (xPct: number, yPct: number) => void;
}

const SingleNotebookPage: React.FC<SinglePageProps> = memo(
  ({
    side,
    spreadId,
    paperStyle,
    pageSizeClass,
    layerVisibility,
    layerOrder,
    drawingDataUrl,
    legacyRightDrawingDataUrl,
    onSaveDrawing,
    onCommitEraseResults,
    activeTool,
    brush,
    onPickColor,
    elements,
    selectedElementId,
    editingTextId,
    mattingElementId = null,
    mattingProgress = 0,
    onSelectElement,
    onEditText,
    onUpdateElement,
    onDeleteElement,
    onToggleLockElement,
    onExtractElementFigure,
    onRestoreElementFigure,
    onEnterDressingRoom,
    readerElementId = null,
    readerIsPlaying = false,
    onReadElement,
    onPlaceElement,
  }) => {
    const pageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastCommittedUrlRef = useRef<string | undefined>(undefined);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);
    const prevMidRef = useRef<{ x: number; y: number } | null>(null);
    const lastStrokeTimeRef = useRef<number>(0);
    const hyperrealStrokeRef = useRef<HyperrealStrokeState | null>(null);
    const lastClientPosRef = useRef<{ x: number; y: number } | null>(null);
    const liveEraseRef = useRef<Record<string, ElementEraseStroke[]>>({});
    const activeEraseIndexRef = useRef<Record<string, number>>({});
    const eraseDirtyRef = useRef(false);
    const eraseRafRef = useRef<number | null>(null);
    const [liveEraseMap, setLiveEraseMap] = useState<Record<string, ElementEraseStroke[]>>({});

    // Lightweight transient drag/resize/rotate state (avoids mutating React workspace & undoStack on every mousemove!)
    const [liveTransform, setLiveTransform] = useState<{
      id: string;
      x: number;
      y: number;
      width: number;
      rotation?: number;
    } | null>(null);
    const liveTransformRef = useRef<{
      id: string;
      x: number;
      y: number;
      width: number;
      rotation?: number;
    } | null>(null);

    const eraserCursorRef = useRef<HTMLDivElement>(null);

    const dragElRef = useRef<{
      mode: 'drag' | 'resize' | 'rotate';
      id: string;
      elementType?: PageElement['type'];
      startX: number;
      startY: number;
      origXPct: number;
      origYPct: number;
      origWidth: number;
      centerX?: number;
      centerY?: number;
      hasMoved?: boolean;
    } | null>(null);

    const isUnified = side === 'unified';
    const canvasW = isUnified ? PAGE_W * 2 : PAGE_W;
    const canvasH = PAGE_H;

    // Sync canvas image ONLY when spread switches or external undo/clear changed drawingDataUrl
    useEffect(() => {
      const compositeKey = `${drawingDataUrl || ''}|${legacyRightDrawingDataUrl || ''}`;
      if (
        (drawingDataUrl !== undefined || legacyRightDrawingDataUrl !== undefined) &&
        compositeKey === lastCommittedUrlRef.current
      ) {
        return;
      }
      lastCommittedUrlRef.current = compositeKey;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (!drawingDataUrl && !legacyRightDrawingDataUrl) {
        ctx.clearRect(0, 0, canvasW, canvasH);
        return;
      }

      let cancelled = false;
      ctx.clearRect(0, 0, canvasW, canvasH);

      if (isUnified) {
        // Support both new unified full-sheet drawings AND legacy left/right split drawings
        if (drawingDataUrl) {
          const leftImg = new Image();
          leftImg.onload = () => {
            if (cancelled) return;
            const isLegacyHalf =
              Boolean(legacyRightDrawingDataUrl) || leftImg.width <= leftImg.height * 1.15;
            if (isLegacyHalf) {
              ctx.drawImage(leftImg, 0, 0, canvasW / 2, canvasH);
            } else {
              ctx.drawImage(leftImg, 0, 0, canvasW, canvasH);
            }
          };
          leftImg.src = drawingDataUrl;
        }
        if (legacyRightDrawingDataUrl) {
          const rightImg = new Image();
          rightImg.onload = () => {
            if (cancelled) return;
            ctx.drawImage(rightImg, canvasW / 2, 0, canvasW / 2, canvasH);
          };
          rightImg.src = legacyRightDrawingDataUrl;
        }
      } else if (drawingDataUrl) {
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          ctx.clearRect(0, 0, canvasW, canvasH);
          ctx.drawImage(img, 0, 0, canvasW, canvasH);
        };
        img.src = drawingDataUrl;
      }
      return () => {
        cancelled = true;
      };
    }, [spreadId, drawingDataUrl, legacyRightDrawingDataUrl, isUnified, canvasW, canvasH]);

    const getCanvasPoint = (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvasW,
        y: ((e.clientY - rect.top) / rect.height) * canvasH,
      };
    };

    const scheduleErasePreviewFlush = useCallback(() => {
      if (eraseRafRef.current !== null) return;
      eraseRafRef.current = requestAnimationFrame(() => {
        eraseRafRef.current = null;
        setLiveEraseMap({ ...liveEraseRef.current });
      });
    }, []);

    const eraseElementsAlongSegment = useCallback(
      (x1: number, y1: number, x2: number, y2: number) => {
        const pageNode = pageRef.current;
        if (!pageNode) return;
        const pageRect = pageNode.getBoundingClientRect();
        const baseW = pageNode.offsetWidth || pageRect.width || 1;
        const zoomScale = pageRect.width / baseW || 1;
        const resScale = PAGE_W / 460;
        const eraseRadiusCanvas = Math.max(
          4 * resScale,
          Math.max(1.5, brush.size * 0.9) * resScale * 0.72
        );
        const eraserDiameterPagePx = Math.max(10, eraseRadiusCanvas * 2 * (baseW / canvasW));
        const eraserDiameterScreenPx = eraserDiameterPagePx * zoomScale;
        const isSoft = brush.softness > 35;

        const distScreen = Math.hypot(x2 - x1, y2 - y1);
        const stepPx = Math.max(3, eraserDiameterScreenPx * 0.35);
        const steps = Math.max(1, Math.min(48, Math.ceil(distScreen / stepPx)));

        // Protect all UI buttons, toolbars, option menus, and wardrobes from ever being erased!
        const isPointOverUiControl = (cx: number, cy: number): boolean => {
          if (typeof document === 'undefined' || !document.elementsFromPoint) return false;
          const stack = document.elementsFromPoint(cx, cy);
          for (const node of stack) {
            if (!(node instanceof HTMLElement)) continue;
            if (
              node.closest(
                'button, input, textarea, select, [role="button"], [data-ui-control="true"], [data-studio-dock="true"]'
              )
            ) {
              return true;
            }
          }
          return false;
        };
        if (isPointOverUiControl(x1, y1) || isPointOverUiControl(x2, y2)) {
          return;
        }

        let touchedAny = false;

        for (const el of elements) {
          if (el.locked || isPermanentElement(el) || el.type === 'wardrobe') continue;
          const isNoteEl = el.type === 'text' || el.type === 'pattern-note';
          if (isNoteEl && !layerVisibility.notes) continue;
          if (!isNoteEl && !layerVisibility.images) continue;

          const contentNode = pageNode.querySelector(
            `[data-erasable-content="${el.id}"]`
          ) as HTMLElement | null;
          if (!contentNode) continue;

          const rect = contentNode.getBoundingClientRect();
          const pad = eraserDiameterScreenPx * 0.65;
          const segMinX = Math.min(x1, x2) - pad;
          const segMaxX = Math.max(x1, x2) + pad;
          const segMinY = Math.min(y1, y2) - pad;
          const segMaxY = Math.max(y1, y2) + pad;
          if (
            segMaxX < rect.left ||
            segMinX > rect.right ||
            segMaxY < rect.top ||
            segMinY > rect.bottom
          ) {
            continue;
          }

          const unrotW = Math.max(8, (contentNode.offsetWidth || el.width || 60) * zoomScale);
          const unrotH = Math.max(8, (contentNode.offsetHeight || 40) * zoomScale);
          const vbH = Math.max(12, Math.round((unrotH / unrotW) * 1000) / 10);
          const cx = (rect.left + rect.right) / 2;
          const cy = (rect.top + rect.bottom) / 2;
          const rotRad = -((el.rotation || 0) * Math.PI) / 180;
          const cosR = Math.cos(rotRad);
          const sinR = Math.sin(rotRad);
          const strokeWidthLocal = Math.max(3, (eraserDiameterScreenPx / unrotW) * 100);
          const margin = strokeWidthLocal * 0.6;

          for (let s = 0; s <= steps; s++) {
            const t = steps === 0 ? 1 : s / steps;
            const px = x1 + (x2 - x1) * t;
            const py = y1 + (y2 - y1) * t;
            const dx = px - cx;
            const dy = py - cy;
            let rx = dx * cosR - dy * sinR;
            let ry = dx * sinR + dy * cosR;
            if (el.flipX) rx = -rx;
            if (el.flipY) ry = -ry;

            const u = (rx / unrotW + 0.5) * 100;
            const v = (ry / unrotH + 0.5) * vbH;

            if (u < -margin || u > 100 + margin || v < -margin || v > vbH + margin) {
              continue;
            }

            let list = liveEraseRef.current[el.id];
            if (!list) {
              list = [...(el.eraseStrokes || [])];
              liveEraseRef.current[el.id] = list;
            }

            let strokeIdx = activeEraseIndexRef.current[el.id];
            if (strokeIdx === undefined || !list[strokeIdx]) {
              const newStroke: ElementEraseStroke = {
                points: [[Math.round(u * 10) / 10, Math.round(v * 10) / 10]],
                vbH,
                width: Math.round(strokeWidthLocal * 10) / 10,
                soft: isSoft,
              };
              list = [...list, newStroke];
              liveEraseRef.current[el.id] = list;
              activeEraseIndexRef.current[el.id] = list.length - 1;
              touchedAny = true;
            } else {
              const currStroke = list[strokeIdx];
              const lastPt = currStroke.points[currStroke.points.length - 1];
              const du = u - lastPt[0];
              const dv = v - lastPt[1];
              if (du * du + dv * dv >= 0.64) {
                const updatedStroke: ElementEraseStroke = {
                  ...currStroke,
                  points: [
                    ...currStroke.points,
                    [Math.round(u * 10) / 10, Math.round(v * 10) / 10],
                  ],
                };
                const nextList = list.slice();
                nextList[strokeIdx] = updatedStroke;
                liveEraseRef.current[el.id] = nextList;
                touchedAny = true;
              }
            }
          }
        }

        if (touchedAny) {
          eraseDirtyRef.current = true;
          scheduleErasePreviewFlush();
        }
      },
      [elements, brush.size, brush.softness, layerVisibility.images, layerVisibility.notes, scheduleErasePreviewFlush]
    );

    const drawSegment = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      isErasing: boolean,
      stylusPressure?: number
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // True Samsung Galaxy Note 9 S Pen 4096-level pressure dynamics
      const hasPenPressure =
        typeof stylusPressure === 'number' && Number.isFinite(stylusPressure) && stylusPressure > 0;
      const penP = hasPenPressure ? Math.max(0.05, Math.min(1, stylusPressure)) : 1;
      const effectiveBrush = hasPenPressure
        ? {
            ...brush,
            size: Math.max(1, brush.size * (0.38 + penP * 0.98)),
            opacity: Math.max(6, Math.min(100, Math.round(brush.opacity * (0.55 + penP * 0.50)))),
          }
        : brush;

      const resScale = PAGE_W / 460;
      const alpha = Math.max(0.05, Math.min(1, effectiveBrush.opacity / 100));
      const size = Math.max(1.5, effectiveBrush.size * 0.9) * resScale;
      ctx.save();

      if (isErasing || brush.preset === 'borrador-suave') {
        if (!layerVisibility.drawing) {
          ctx.restore();
          return;
        }
        ctx.globalCompositeOperation = 'destination-out';
        ctx.setLineDash([]);
        const radius = Math.max(4 * resScale, size * 0.72);
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const stepSize = Math.max(1.5 * resScale, radius * 0.28);
        const steps = Math.max(1, Math.ceil(dist / stepSize));
        const isSoft = brush.softness > 35;

        for (let s = 0; s <= steps; s++) {
          const t = steps === 0 ? 1 : s / steps;
          const cx = p1.x + (p2.x - p1.x) * t;
          const cy = p1.y + (p2.y - p1.y) * t;

          if (isSoft) {
            const innerR = radius * 0.35;
            const outerR = radius * 1.15;
            const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
            grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
            grad.addColorStop(0.65, `rgba(0,0,0,${alpha * 0.55})`);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        return;
      }

      // Hyperrealistic Fine-Art Texture Brushes (Pincel) & Pixel-Aware Blenders (Difuminados)
      const now = performance.now();
      const dt = Math.max(4, now - (lastStrokeTimeRef.current || now));
      lastStrokeTimeRef.current = now;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const velocity = dist / dt;
      if (!hyperrealStrokeRef.current) {
        hyperrealStrokeRef.current = createStrokeState();
      }
      const fromPt = prevMidRef.current || p1;
      const { nextMid } = drawHyperrealStrokeSegment(
        ctx,
        canvas,
        p1,
        p2,
        fromPt,
        effectiveBrush,
        resScale,
        velocity,
        hyperrealStrokeRef.current
      );
      prevMidRef.current = nextMid;
      ctx.restore();
    };

    const handleCanvasPointerDown = (e: React.PointerEvent) => {
      if (!e.isPrimary || e.button === 1) return;
      // Samsung Galaxy Note 9 Palm Rejection: ignore wide palm touch contacts on the canvas
      if (e.pointerType === 'touch' && (e.width > 26 || e.height > 26)) return;
      const isPen = e.pointerType === 'pen';
      const isPenBarrelEraser = isPen && ((e.buttons & 32) !== 0 || e.button === 5);
      const effectiveErasing = activeTool === 'eraser' || isPenBarrelEraser;

      if (activeTool === 'draw' || activeTool === 'eraser' || isPenBarrelEraser) {
        // Never allow the eraser or brush to intercept clicks on buttons, toolbars, or interactive option controls
        if (typeof document !== 'undefined' && document.elementsFromPoint) {
          const hitStack = document.elementsFromPoint(e.clientX, e.clientY);
          const overControl = hitStack.some(
            (n) =>
              n instanceof HTMLElement &&
              Boolean(
                n.closest(
                  'button, input, textarea, select, [role="button"], [data-ui-control="true"], [data-studio-dock="true"]'
                )
              )
          );
          if (overControl) return;
        }
        e.stopPropagation();
        isDrawingRef.current = true;
        const pt = getCanvasPoint(e);
        lastPosRef.current = pt;
        prevMidRef.current = pt;
        lastStrokeTimeRef.current = performance.now();
        hyperrealStrokeRef.current = createStrokeState();
        lastClientPosRef.current = { x: e.clientX, y: e.clientY };

        if (effectiveErasing) {
          activeEraseIndexRef.current = {};
          eraseElementsAlongSegment(e.clientX, e.clientY, e.clientX, e.clientY);
        }
        drawSegment(pt, pt, effectiveErasing, isPen ? e.pressure : undefined);
        try {
          (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
        } catch {
          // ignore pointer capture issues on synthetic pointers
        }
      }
    };

    const handlePagePointerDown = (e: React.PointerEvent) => {
      if (activeTool === 'eyedropper') {
        e.stopPropagation();
        const picked = sampleColorAtScreenPoint(e.clientX, e.clientY);
        onPickColor(picked);
      } else if (activeTool === 'text' || activeTool === 'shape') {
        const rect = pageRef.current?.getBoundingClientRect();
        if (!rect) return;
        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
        const yPct = ((e.clientY - rect.top) / rect.height) * 100;
        onPlaceElement(xPct, yPct);
      } else if (activeTool !== 'draw' && activeTool !== 'eraser') {
        onSelectElement(null);
        onEditText(null);
      }
    };

    const updateDraggedTransform = useCallback(
      (clientX: number, clientY: number, shiftKey: boolean) => {
        if (!dragElRef.current || !pageRef.current) return;
        const {
          mode,
          id,
          startX,
          startY,
          origXPct,
          origYPct,
          origWidth,
          centerX,
          centerY,
        } = dragElRef.current;
        const rect = pageRef.current.getBoundingClientRect();

        let nextTransform: {
          id: string;
          x: number;
          y: number;
          width: number;
          rotation?: number;
        };

        if (mode === 'rotate' && centerX !== undefined && centerY !== undefined) {
          const rawDeg =
            Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI) + 90;
          let deg = ((Math.round(rawDeg) % 360) + 360) % 360;
          if (!shiftKey) {
            for (const snap of [0, 90, 180, 270]) {
              if (Math.abs(deg - snap) <= 3 || Math.abs(deg - 360 - snap) <= 3) {
                deg = snap;
                break;
              }
            }
          }
          nextTransform = {
            id,
            x: origXPct,
            y: origYPct,
            width: origWidth,
            rotation: deg,
          };
        } else if (mode === 'drag') {
          if (!dragElRef.current.hasMoved) {
            if (Math.hypot(clientX - startX, clientY - startY) < 6) {
              return;
            }
            dragElRef.current.hasMoved = true;
            if (dragElRef.current.elementType === 'wardrobe') {
              onSelectElement(id);
            }
          }
          const rawXPct = origXPct + ((clientX - startX) / rect.width) * 100;
          const minX = isUnified ? 1 : side === 'right' ? -96 : 2;
          const maxX = isUnified ? 95 : side === 'left' ? 184 : 84;
          nextTransform = {
            id,
            x: Math.max(minX, Math.min(maxX, rawXPct)),
            y: Math.max(2, Math.min(88, origYPct + ((clientY - startY) / rect.height) * 100)),
            width: origWidth,
          };
        } else {
          const maxResizeW = 700;
          const zoomScale = rect.width / (pageRef.current.offsetWidth || rect.width) || 1;
          nextTransform = {
            id,
            x: origXPct,
            y: origYPct,
            width: Math.max(
              24,
              Math.min(maxResizeW, Math.round(origWidth + (clientX - startX) / zoomScale))
            ),
          };
        }
        liveTransformRef.current = nextTransform;
        setLiveTransform(nextTransform);
      },
      [side, onSelectElement]
    );

    const handleCanvasPointerMove = (e: React.PointerEvent) => {
      if (activeTool === 'eraser' && pageRef.current && eraserCursorRef.current) {
        const rect = pageRef.current.getBoundingClientRect();
        const baseW = pageRef.current.offsetWidth || rect.width || 1;
        const zoomScale = rect.width / baseW || 1;
        const x = (e.clientX - rect.left) / zoomScale;
        const y = (e.clientY - rect.top) / zoomScale;
        const resScale = PAGE_W / 460;
        const eraseRadiusCanvas = Math.max(
          4 * resScale,
          Math.max(1.5, brush.size * 0.9) * resScale * 0.72
        );
        const diameterPagePx = Math.max(10, eraseRadiusCanvas * 2 * (baseW / canvasW));
        const node = eraserCursorRef.current;
        node.style.display = 'block';
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        node.style.width = `${diameterPagePx}px`;
        node.style.height = `${diameterPagePx}px`;
      } else if (eraserCursorRef.current) {
        eraserCursorRef.current.style.display = 'none';
      }

      if (
        e.isPrimary &&
        isDrawingRef.current &&
        lastPosRef.current &&
        (activeTool === 'draw' || activeTool === 'eraser' || e.pointerType === 'pen')
      ) {
        const isPen = e.pointerType === 'pen';
        const isPenBarrelEraser = isPen && ((e.buttons & 32) !== 0 || e.button === 5);
        const effectiveErasing = activeTool === 'eraser' || isPenBarrelEraser;
        if (effectiveErasing) {
          const prevClient = lastClientPosRef.current || { x: e.clientX, y: e.clientY };
          eraseElementsAlongSegment(prevClient.x, prevClient.y, e.clientX, e.clientY);
          lastClientPosRef.current = { x: e.clientX, y: e.clientY };
        }
        const pt = getCanvasPoint(e);
        drawSegment(lastPosRef.current, pt, effectiveErasing, isPen ? e.pressure : undefined);
        lastPosRef.current = pt;
      } else if (dragElRef.current) {
        updateDraggedTransform(e.clientX, e.clientY, e.shiftKey);
      }
    };

    const commitPointerEnd = useCallback(() => {
      if (isDrawingRef.current && canvasRef.current) {
        isDrawingRef.current = false;
        lastPosRef.current = null;
        prevMidRef.current = null;
        hyperrealStrokeRef.current = null;
        lastClientPosRef.current = null;

        if (eraseRafRef.current !== null) {
          cancelAnimationFrame(eraseRafRef.current);
          eraseRafRef.current = null;
        }

        const dataUrl = canvasRef.current.toDataURL('image/png');
        lastCommittedUrlRef.current = `${dataUrl}|`;

        if (eraseDirtyRef.current) {
          eraseDirtyRef.current = false;
          const updates: Record<string, ElementEraseStroke[]> = {};
          const fullyErasedIds: string[] = [];
          for (const [elId, strokes] of Object.entries(liveEraseRef.current)) {
            if (isElementFullyErased(strokes)) {
              fullyErasedIds.push(elId);
            } else {
              updates[elId] = strokes;
            }
          }
          liveEraseRef.current = {};
          activeEraseIndexRef.current = {};
          setLiveEraseMap({});
          onCommitEraseResults(dataUrl, updates, fullyErasedIds);
        } else {
          liveEraseRef.current = {};
          activeEraseIndexRef.current = {};
          onSaveDrawing(dataUrl);
        }
      }
      const pending = liveTransformRef.current;
      const activeDrag = dragElRef.current;
      if (activeDrag && pending) {
        if (isUnified) {
          if (activeDrag.mode === 'drag') {
            const clampedX = Math.max(1, Math.min(95, pending.x));
            const finalSide: 'left' | 'right' = clampedX < 50 ? 'left' : 'right';
            const finalX = finalSide === 'left' ? clampedX * 2 : (clampedX - 50) * 2;
            onUpdateElement(pending.id, {
              side: finalSide,
              x: finalX,
              y: pending.y,
              width: pending.width,
            });
          } else {
            onUpdateElement(pending.id, {
              y: pending.y,
              width: pending.width,
              ...(pending.rotation !== undefined ? { rotation: pending.rotation } : {}),
            });
          }
        } else if (activeDrag.mode === 'drag' && pageRef.current) {
          const originRect = pageRef.current.getBoundingClientRect();
          const siblingSide: 'left' | 'right' = side === 'left' ? 'right' : 'left';
          const siblingEl = pageRef.current.parentElement?.querySelector(
            `[data-page-side="${siblingSide}"]`
          ) as HTMLElement | null;

          let finalSide: 'left' | 'right' = side === 'right' ? 'right' : 'left';
          let finalX = Math.max(2, Math.min(84, pending.x));

          if (siblingEl) {
            const siblingRect = siblingEl.getBoundingClientRect();
            const scaleX = originRect.width / (pageRef.current.offsetWidth || originRect.width);
            const elLeftPx = originRect.left + (pending.x / 100) * originRect.width;
            const elCenterPx = elLeftPx + (pending.width * scaleX) / 2;
            const spineX =
              side === 'left'
                ? (originRect.right + siblingRect.left) / 2
                : (siblingRect.right + originRect.left) / 2;

            if (side === 'left' && elCenterPx > spineX) {
              finalSide = 'right';
              const relPct = ((elLeftPx - siblingRect.left) / siblingRect.width) * 100;
              finalX = Math.max(2, Math.min(84, relPct));
            } else if (side === 'right' && elCenterPx < spineX) {
              finalSide = 'left';
              const relPct = ((elLeftPx - siblingRect.left) / siblingRect.width) * 100;
              finalX = Math.max(2, Math.min(84, relPct));
            }
          }

          onUpdateElement(pending.id, {
            side: finalSide,
            x: finalX,
            y: pending.y,
            width: pending.width,
          });
        } else {
          onUpdateElement(pending.id, {
            x: pending.x,
            y: pending.y,
            width: pending.width,
            ...(pending.rotation !== undefined ? { rotation: pending.rotation } : {}),
          });
        }
      }
      dragElRef.current = null;
      liveTransformRef.current = null;
      setLiveTransform(null);
    }, [onSaveDrawing, onCommitEraseResults, onUpdateElement, side, isUnified]);

    useEffect(() => {
      const onWindowMove = (e: PointerEvent) => {
        if (!dragElRef.current) return;
        updateDraggedTransform(e.clientX, e.clientY, e.shiftKey);
      };
      window.addEventListener('pointermove', onWindowMove);
      window.addEventListener('pointerup', commitPointerEnd);
      return () => {
        window.removeEventListener('pointermove', onWindowMove);
        window.removeEventListener('pointerup', commitPointerEnd);
        if (eraseRafRef.current !== null) {
          cancelAnimationFrame(eraseRafRef.current);
          eraseRafRef.current = null;
        }
      };
    }, [updateDraggedTransform, commitPointerEnd]);

    const handleCanvasPointerUp = commitPointerEnd;

    const handleStartDragElement = useCallback(
      (el: PageElement, e: React.PointerEvent) => {
        if (
          el.type === 'wardrobe' ||
          activeTool === 'draw' ||
          activeTool === 'eraser' ||
          activeTool === 'eyedropper'
        ) {
          return;
        }
        e.stopPropagation();
        onSelectElement(el.id);
        if (el.locked) return;
        if (editingTextId !== el.id) {
          const startXPct = isUnified
            ? el.side === 'right'
              ? 50 + el.x * 0.5
              : el.x * 0.5
            : el.x;
          dragElRef.current = {
            mode: 'drag',
            id: el.id,
            elementType: el.type,
            startX: e.clientX,
            startY: e.clientY,
            origXPct: startXPct,
            origYPct: el.y,
            origWidth: el.width,
            hasMoved: false,
          };
        }
      },
      [activeTool, onSelectElement, editingTextId, isUnified]
    );

    const handleStartResizeElement = useCallback(
      (el: PageElement, e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelectElement(el.id);
        if (el.locked) return;
        const startXPct = isUnified
          ? el.side === 'right'
            ? 50 + el.x * 0.5
            : el.x * 0.5
          : el.x;
        dragElRef.current = {
          mode: 'resize',
          id: el.id,
          elementType: el.type,
          startX: e.clientX,
          startY: e.clientY,
          origXPct: startXPct,
          origYPct: el.y,
          origWidth: el.width,
        };
      },
      [onSelectElement, isUnified]
    );

    const handleStartRotateElement = useCallback(
      (el: PageElement, e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelectElement(el.id);
        if (el.locked) return;
        const box = (e.currentTarget as HTMLElement)
          .closest('[data-element-box="true"]')
          ?.getBoundingClientRect();
        const centerX = box ? box.left + box.width / 2 : e.clientX;
        const centerY = box ? box.top + box.height / 2 : e.clientY + 40;
        const startXPct = isUnified
          ? el.side === 'right'
            ? 50 + el.x * 0.5
            : el.x * 0.5
          : el.x;
        dragElRef.current = {
          mode: 'rotate',
          id: el.id,
          elementType: el.type,
          startX: e.clientX,
          startY: e.clientY,
          origXPct: startXPct,
          origYPct: el.y,
          origWidth: el.width,
          centerX,
          centerY,
        };
      },
      [onSelectElement]
    );

    const handleDoubleClickElement = useCallback(
      (el: PageElement, e: React.MouseEvent) => {
        if (el.type === 'text') {
          e.stopPropagation();
          if (el.locked) return;
          onEditText(el.id);
        } else if (el.type === 'wardrobe') {
          e.stopPropagation();
          onSelectElement(el.id);
        }
      },
      [onEditText, onSelectElement]
    );

    const handleEditTextDone = useCallback(() => {
      onEditText(null);
    }, [onEditText]);

    const paperBgClass = !layerVisibility.background
      ? ''
      : paperStyle === 'grid'
        ? 'cutting-mat-grid'
        : paperStyle === 'dots'
          ? 'cutting-mat-dots'
          : '';

    const visibleElements = elements.filter((el) => {
      if (el.type === 'text' || el.type === 'pattern-note') return layerVisibility.notes;
      return layerVisibility.images;
    });
    const notesElements = visibleElements.filter(
      (el) => el.type === 'text' || el.type === 'pattern-note'
    );
    const imagesElements = visibleElements.filter(
      (el) => el.type !== 'text' && el.type !== 'pattern-note'
    );

    const isDrawLocked = activeTool === 'draw' || activeTool === 'eraser';
    const getLayerZ = (layer: StackableLayerId) => {
      const idx = layerOrder.indexOf(layer);
      return idx === 0 ? 24 : idx === 1 ? 18 : 12;
    };
    const draggingInNotes =
      liveTransform !== null && notesElements.some((m) => m.id === liveTransform.id);
    const draggingInImages =
      liveTransform !== null && imagesElements.some((m) => m.id === liveTransform.id);

    return (
      <div
        ref={pageRef}
        data-page-side={side}
        onPointerDown={handlePagePointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        onTouchStart={(e) => {
          if (e.touches.length >= 2 && isDrawingRef.current) {
            isDrawingRef.current = false;
            lastPosRef.current = null;
            prevMidRef.current = null;
            lastClientPosRef.current = null;
            eraseDirtyRef.current = false;
            liveEraseRef.current = {};
            activeEraseIndexRef.current = {};
            setLiveEraseMap({});
          }
        }}
        onPointerLeave={() => {
          if (eraserCursorRef.current) {
            eraserCursorRef.current.style.display = 'none';
          }
        }}
        className={`relative ${pageSizeClass} cutting-mat-page ${paperBgClass} overflow-visible ${
          liveTransform ? 'z-30' : ''
        } ${
          activeTool === 'draw' || activeTool === 'eyedropper'
            ? 'cursor-crosshair'
            : activeTool === 'eraser'
              ? 'cursor-none'
              : activeTool === 'text' || activeTool === 'shape'
                ? 'cursor-copy'
                : 'cursor-default'
        }`}
      >
        {/* Clipped Paper Decorations & Full-Perimeter cm Rulers (Continuous 40cm Horizontal + 25cm Vertical on Unified Sheet) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {isUnified ? (
            <>
              {/* All 4 Corner Caps */}
              <div className="pointer-events-none absolute top-0 left-0 w-7 h-6 border-r border-b border-[#a7d6ba]/40 bg-[#15382b]/75 flex items-center justify-center">
                <span className="text-[7.5px] font-mono-tab font-semibold text-[#def4e6]">cm</span>
              </div>
              <div className="pointer-events-none absolute top-0 right-0 w-7 h-6 border-l border-b border-[#a7d6ba]/40 bg-[#15382b]/75 flex items-center justify-center">
                <span className="text-[7.5px] font-mono-tab font-semibold text-[#def4e6]">cm</span>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 w-7 h-6 border-r border-t border-[#a7d6ba]/40 bg-[#15382b]/75 flex items-center justify-center">
                <span className="text-[7.5px] font-mono-tab font-semibold text-[#def4e6]">cm</span>
              </div>
              <div className="pointer-events-none absolute bottom-0 right-0 w-7 h-6 border-l border-t border-[#a7d6ba]/40 bg-[#15382b]/75 flex items-center justify-center">
                <span className="text-[7.5px] font-mono-tab font-semibold text-[#def4e6]">cm</span>
              </div>

              {/* Continuous Top Horizontal 40cm Ruler */}
              <div className="pointer-events-none absolute top-0 left-7 right-7 h-6 border-b border-[#a7d6ba]/40 bg-[#15382b]/65 flex items-end justify-between px-2">
                {Array.from({ length: 40 }, (_, i) => i + 1).map((cm) => (
                  <div key={cm} className="flex flex-col items-center justify-end gap-0.5 leading-none">
                    <span className="text-[7px] font-mono-tab text-[#def4e6]/90">{cm}</span>
                    <span className="w-px h-1.5 bg-[#bfe5ce]/70" />
                  </div>
                ))}
              </div>

              {/* Continuous Bottom Horizontal 40cm Ruler */}
              <div className="pointer-events-none absolute bottom-0 left-7 right-7 h-6 border-t border-[#a7d6ba]/40 bg-[#15382b]/65 flex items-start justify-between px-2">
                {Array.from({ length: 40 }, (_, i) => i + 1).map((cm) => (
                  <div key={cm} className="flex flex-col items-center justify-start gap-0.5 leading-none">
                    <span className="w-px h-1.5 bg-[#bfe5ce]/70" />
                    <span className="text-[7px] font-mono-tab text-[#def4e6]/90">{cm}</span>
                  </div>
                ))}
              </div>

              {/* Left & Right Vertical 25cm Rulers */}
              <div className="pointer-events-none absolute top-6 bottom-6 left-0 w-7 border-r border-[#a7d6ba]/40 flex flex-col justify-between py-2 pl-1 text-left bg-[#15382b]/65">
                {Array.from({ length: 25 }, (_, i) => i + 1).map((cm) => (
                  <div key={cm} className="flex items-center justify-start gap-1 leading-none">
                    <span className="text-[7.5px] font-mono-tab text-[#def4e6]/90">{cm}</span>
                    <span className="w-1.5 h-px bg-[#bfe5ce]/70" />
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute top-6 bottom-6 right-0 w-7 border-l border-[#a7d6ba]/40 flex flex-col justify-between py-2 pr-1 text-right bg-[#15382b]/65">
                {Array.from({ length: 25 }, (_, i) => i + 1).map((cm) => (
                  <div key={cm} className="flex items-center justify-end gap-1 leading-none">
                    <span className="w-1.5 h-px bg-[#bfe5ce]/70" />
                    <span className="text-[7.5px] font-mono-tab text-[#def4e6]/90">{cm}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Outer Top & Bottom Corner Caps joining vertical & horizontal rulers */}
              <div
                className={`pointer-events-none absolute top-0 ${
                  side === 'left' ? 'left-0 border-r' : 'right-0 border-l'
                } w-7 h-6 border-b border-[#a7d6ba]/40 bg-[#15382b]/75 flex items-center justify-center`}
              >
                <span className="text-[7.5px] font-mono-tab font-semibold text-[#def4e6]">cm</span>
              </div>
              <div
                className={`pointer-events-none absolute bottom-0 ${
                  side === 'left' ? 'left-0 border-r' : 'right-0 border-l'
                } w-7 h-6 border-t border-[#a7d6ba]/40 bg-[#15382b]/75 flex items-center justify-center`}
              >
                <span className="text-[7.5px] font-mono-tab font-semibold text-[#def4e6]">cm</span>
              </div>

              {/* Top Horizontal 20cm Ruler */}
              <div
                className={`pointer-events-none absolute top-0 ${
                  side === 'left' ? 'left-7 right-0' : 'left-0 right-7'
                } h-6 border-b border-[#a7d6ba]/40 bg-[#15382b]/65 flex items-end justify-between px-2`}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((cm) => (
                  <div key={cm} className="flex flex-col items-center justify-end gap-0.5 leading-none">
                    <span className="text-[7.5px] font-mono-tab text-[#def4e6]/90">{cm}</span>
                    <span className="w-px h-1.5 bg-[#bfe5ce]/70" />
                  </div>
                ))}
              </div>

              {/* Bottom Horizontal 20cm Ruler */}
              <div
                className={`pointer-events-none absolute bottom-0 ${
                  side === 'left' ? 'left-7 right-0' : 'left-0 right-7'
                } h-6 border-t border-[#a7d6ba]/40 bg-[#15382b]/65 flex items-start justify-between px-2`}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((cm) => (
                  <div key={cm} className="flex flex-col items-center justify-start gap-0.5 leading-none">
                    <span className="w-px h-1.5 bg-[#bfe5ce]/70" />
                    <span className="text-[7.5px] font-mono-tab text-[#def4e6]/90">{cm}</span>
                  </div>
                ))}
              </div>

              {/* Outer Vertical 25cm Ruler */}
              {side === 'left' ? (
                <div className="pointer-events-none absolute top-6 bottom-6 left-0 w-7 border-r border-[#a7d6ba]/40 flex flex-col justify-between py-2 pl-1 text-left bg-[#15382b]/65">
                  {Array.from({ length: 25 }, (_, i) => i + 1).map((cm) => (
                    <div key={cm} className="flex items-center justify-start gap-1 leading-none">
                      <span className="text-[7.5px] font-mono-tab text-[#def4e6]/90">{cm}</span>
                      <span className="w-1.5 h-px bg-[#bfe5ce]/70" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pointer-events-none absolute top-6 bottom-6 right-0 w-7 border-l border-[#a7d6ba]/40 flex flex-col justify-between py-2 pr-1 text-right bg-[#15382b]/65">
                  {Array.from({ length: 25 }, (_, i) => i + 1).map((cm) => (
                    <div key={cm} className="flex items-center justify-end gap-1 leading-none">
                      <span className="w-1.5 h-px bg-[#bfe5ce]/70" />
                      <span className="text-[7.5px] font-mono-tab text-[#def4e6]/90">{cm}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Imágenes / Maniquíes / Stickers / Figuras Layer */}
        <div
          style={{ zIndex: draggingInImages ? 29 : getLayerZ('images') }}
          className="absolute inset-0 pointer-events-none"
        >
          {imagesElements.map((el) => (
            <PageElementItem
              key={el.id}
              el={el}
              isSelected={el.id === selectedElementId}
              isEditing={el.id === editingTextId}
              isDrawLocked={isDrawLocked}
              unifiedSheet={isUnified}
              isMatting={mattingElementId === el.id}
              mattingProgress={mattingElementId === el.id ? mattingProgress : 0}
              liveOverride={liveTransform?.id === el.id ? liveTransform : undefined}
              liveEraseStrokes={liveEraseMap[el.id]}
              onStartDrag={handleStartDragElement}
              onStartResize={handleStartResizeElement}
              onStartRotate={handleStartRotateElement}
              onDoubleClick={handleDoubleClickElement}
              onUpdateElement={onUpdateElement}
              onDeleteElement={onDeleteElement}
              onToggleLockElement={onToggleLockElement}
              onExtractFigure={onExtractElementFigure}
              onRestoreFigure={onRestoreElementFigure}
              onEnterDressingRoom={onEnterDressingRoom}
              onEditTextDone={handleEditTextDone}
            />
          ))}
        </div>

        {/* Drawing Canvas Layer */}
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          onPointerDown={handleCanvasPointerDown}
          style={{ zIndex: getLayerZ('drawing') }}
          className={`absolute inset-0 w-full h-full touch-none transition-opacity ${
            isDrawLocked ? '' : 'pointer-events-none'
          } ${
            layerVisibility.drawing
              ? 'opacity-100'
              : activeTool === 'eraser'
                ? 'opacity-0'
                : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Zero-rerender Visual Eraser Ring Cursor (exact match to erased diameter) */}
        <div
          ref={eraserCursorRef}
          style={{
            display: 'none',
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none absolute z-30 rounded-full border-2 border-[#7a202a] bg-white/35 shadow"
        />

        {/* Notas y Patrones Layer */}
        <div
          style={{ zIndex: draggingInNotes ? 29 : getLayerZ('notes') }}
          className="absolute inset-0 pointer-events-none"
        >
          {notesElements.map((el) => (
            <PageElementItem
              key={el.id}
              el={el}
              isSelected={el.id === selectedElementId}
              isEditing={el.id === editingTextId}
              isDrawLocked={isDrawLocked}
              unifiedSheet={isUnified}
              isReadMode={activeTool === 'read'}
              isReadingThis={readerElementId === el.id}
              isReadingPlaying={readerElementId === el.id && readerIsPlaying}
              liveOverride={liveTransform?.id === el.id ? liveTransform : undefined}
              liveEraseStrokes={liveEraseMap[el.id]}
              onStartDrag={handleStartDragElement}
              onStartResize={handleStartResizeElement}
              onStartRotate={handleStartRotateElement}
              onDoubleClick={handleDoubleClickElement}
              onUpdateElement={onUpdateElement}
              onDeleteElement={onDeleteElement}
              onToggleLockElement={onToggleLockElement}
              onReadElement={onReadElement}
              onEditTextDone={handleEditTextDone}
            />
          ))}
        </div>
      </div>
    );
  }
);

/* ---------- Accurate DOM + Canvas + Photo Eyedropper Sampler ---------- */

function toHexColor(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  ).toUpperCase();
}

function parseRgbToHex(cssColor: string | null | undefined): string | null {
  if (!cssColor || cssColor === 'none' || cssColor === 'transparent') return null;
  const m = cssColor.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/i);
  if (!m) return null;
  const alpha = m[4] !== undefined ? parseFloat(m[4]) : 1;
  if (alpha <= 0.05) return null;
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  // Blend translucent fills/strokes against forest cutting-mat sheet (#1F4E3D)
  if (alpha < 0.99) {
    return toHexColor(
      r * alpha + 31 * (1 - alpha),
      g * alpha + 78 * (1 - alpha),
      b * alpha + 61 * (1 - alpha)
    );
  }
  return toHexColor(r, g, b);
}

function sampleImagePixel(img: HTMLImageElement, clientX: number, clientY: number): string | null {
  try {
    const r = img.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0 || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
      return null;
    }
    const relX = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const relY = Math.max(0, Math.min(1, (clientY - r.top) / r.height));

    // Handle object-fit: cover mapping accurately
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const renderRatio = r.width / r.height;
    let sxRatio = relX;
    let syRatio = relY;
    if (getComputedStyle(img).objectFit === 'cover') {
      if (naturalRatio > renderRatio) {
        const visibleW = renderRatio / naturalRatio;
        sxRatio = (1 - visibleW) / 2 + relX * visibleW;
      } else {
        const visibleH = naturalRatio / renderRatio;
        syRatio = (1 - visibleH) / 2 + relY * visibleH;
      }
    }

    const sx = Math.max(0, Math.min(img.naturalWidth - 1, Math.floor(sxRatio * img.naturalWidth)));
    const sy = Math.max(0, Math.min(img.naturalHeight - 1, Math.floor(syRatio * img.naturalHeight)));

    const off = document.createElement('canvas');
    off.width = 1;
    off.height = 1;
    const ctx = off.getContext('2d');
    if (!ctx) return null;
    const filter = getComputedStyle(img).filter;
    if (filter && filter !== 'none') ctx.filter = filter;
    ctx.drawImage(img, sx, sy, 1, 1, 0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    if (data[3] <= 15) return null;
    return toHexColor(data[0], data[1], data[2]);
  } catch {
    return null;
  }
}

function sampleColorAtScreenPoint(clientX: number, clientY: number): string {
  const hits = document.elementsFromPoint(clientX, clientY);
  const svgTags = new Set(['PATH', 'CIRCLE', 'ELLIPSE', 'RECT', 'POLYGON', 'POLYLINE', 'LINE']);

  for (const node of hits) {
    const tag = node.tagName.toUpperCase();

    if (tag === 'IMG') {
      const hex = sampleImagePixel(node as HTMLImageElement, clientX, clientY);
      if (hex) return hex;
    }

    if (svgTags.has(tag)) {
      const cs = getComputedStyle(node);
      const fillHex = parseRgbToHex(cs.fill);
      if (fillHex) return fillHex;
      const strokeHex = parseRgbToHex(cs.stroke);
      if (strokeHex) return strokeHex;
    }

    if (tag === 'CANVAS') {
      const canvas = node as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx && rect.width > 0 && rect.height > 0) {
        const px = Math.max(
          0,
          Math.min(canvas.width - 1, Math.round(((clientX - rect.left) / rect.width) * canvas.width))
        );
        const py = Math.max(
          0,
          Math.min(canvas.height - 1, Math.round(((clientY - rect.top) / rect.height) * canvas.height))
        );
        const d = ctx.getImageData(px, py, 1, 1).data;
        if (d[3] > 20) {
          const a = d[3] / 255;
          return toHexColor(
            d[0] * a + 251 * (1 - a),
            d[1] * a + 242 * (1 - a),
            d[2] * a + 222 * (1 - a)
          );
        }
      }
    }

    if ((tag === 'P' || tag === 'SPAN' || tag === 'H2' || tag === 'H3') && node.closest('[data-element-box="true"]')) {
      const cs = getComputedStyle(node);
      const textHex = parseRgbToHex(cs.color);
      if (textHex) return textHex;
      const bgHex = parseRgbToHex(cs.backgroundColor);
      if (bgHex) return bgHex;
    }
  }

  return '#F3DFBA';
}
