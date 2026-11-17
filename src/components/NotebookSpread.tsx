import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Trash2,
  RotateCw,
  Eraser,
  Crop,
  SlidersHorizontal,
  FlipHorizontal2,
  FlipVertical2,
  Copy,
  ClipboardPaste,
  CopyPlus,
  ArrowUpToLine,
  ArrowDownToLine,
  Frame,
  BookOpenCheck,
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
  RotateCcw,
  PaintBucket,
  Pipette,
  Scissors,
  X,
} from 'lucide-react';
import type {
  ActiveCanvasTool,
  BrushSettings,
  CopiedPatternData,
  CrochetPattern,
  FontChoice,
  ImageFilters,
  ImageFrameStyle,
  NotebookSpread as SpreadType,
  PageElement,
  PaperStyle,
  ShapeKind,
} from '../types/crochet';
import { CROCHET_ALPHABET } from '../data/crochetAlphabet';
import {
  BrassBinderRings,
  CornerCrochetFlower,
  CrochetStickerSvg,
} from './CrochetDecorations';
import { DiagramGridSvg, StitchSymbolSvg } from './StitchSymbolSvg';
import { ImageCropModal } from './ImageCropModal';

interface NotebookSpreadProps {
  spreads: SpreadType[];
  patterns: CrochetPattern[];
  currentSpreadIndex: number;
  onChangeSpreadIndex: (index: number) => void;
  onAddSpread: () => void;
  onUpdateSpread: (spread: SpreadType) => void;
  activeTool: ActiveCanvasTool;
  onSelectTool: (tool: ActiveCanvasTool) => void;
  selectedShapeKind: ShapeKind;
  brush: BrushSettings;
  onPickColorFromCanvas: (hex: string) => void;
  selectedFont: FontChoice;
  copiedPattern: CopiedPatternData | null;
  onCopyPattern: (pat: CopiedPatternData) => void;
  onPastePatternOnSpread: (spreadId: string, side?: 'left' | 'right') => void;
  onPlayPageFlip: () => void;
  onNotify?: (msg: string) => void;
}

const FONT_CLASS_MAP: Record<FontChoice, string> = {
  lora: 'font-body',
  cormorant: 'font-editorial',
  caveat: 'font-hand',
  cinzel: 'font-display',
};

const DEFAULT_FILTERS: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  sepia: 0,
  blur: 0,
};

const PAGE_W = 460;
const PAGE_H = 600;
const PATTERNS_PER_CATALOG_PAGE = 4; // 4 left + 4 right = 8 patterns per spread

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
  onAddSpread,
  onUpdateSpread,
  activeTool,
  onSelectTool,
  selectedShapeKind,
  brush,
  onPickColorFromCanvas,
  selectedFont,
  copiedPattern,
  onCopyPattern,
  onPastePatternOnSpread,
  onPlayPageFlip,
  onNotify,
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
    return chunks;
  }, [patterns]);

  const catalogCount = catalogSpreads.length;
  const totalBookSpreads = catalogCount + spreads.length;
  const safeIndex = Math.max(0, Math.min(totalBookSpreads - 1, currentSpreadIndex));
  const isCatalogSpread = safeIndex < catalogCount;
  const activeCatalogSpread = isCatalogSpread ? catalogSpreads[safeIndex] : null;
  const activeUserSpread = !isCatalogSpread
    ? spreads[safeIndex - catalogCount] ?? spreads[0]
    : null;

  const [zoom, setZoom] = useState(100);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedCatalogPattern, setSelectedCatalogPattern] = useState<CopiedPatternData | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [showOverview, setShowOverview] = useState(false);

  // Photo, Word, Paint & Rotation popups / modal state
  const [editorSubPanel, setEditorSubPanel] = useState<
    | 'adjust'
    | 'opacity'
    | 'symbol-color'
    | 'text-color'
    | 'shape-color'
    | 'rotate'
    | 'rotate-all'
    | null
  >(null);
  const [allRotateAngle, setAllRotateAngle] = useState(0);
  const [croppingElement, setCroppingElement] = useState<PageElement | null>(null);
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

  const bookContainerRef = useRef<HTMLDivElement>(null);

  const canPrev = safeIndex > 0;
  const canNext = safeIndex < totalBookSpreads - 1;

  // Clear element-only subpanels when selection changes
  useEffect(() => {
    setEditorSubPanel(null);
  }, [selectedElementId, safeIndex]);

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
        onChangeSpreadIndex(dir === 'next' ? safeIndex + 1 : safeIndex - 1);
        setIsAnimatingFlip(false);
        setFlipDir(null);
        setFlipAngle(0);
      }, 460);
    },
    [isAnimatingFlip, canNext, canPrev, onPlayPageFlip, onChangeSpreadIndex, safeIndex]
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
          onChangeSpreadIndex(dir === 'next' ? safeIndex + 1 : safeIndex - 1);
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
  }, [flipAngle, safeIndex, onChangeSpreadIndex, onPlayPageFlip]);

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
    (id: string) => {
      if (!activeUserSpread) return;
      onUpdateSpread({
        ...activeUserSpread,
        elements: activeUserSpread.elements.filter((el) => el.id !== id),
        updatedAt: new Date().toISOString(),
      });
      if (selectedElementId === id) setSelectedElementId(null);
      if (editingTextId === id) setEditingTextId(null);
    },
    [activeUserSpread, onUpdateSpread, selectedElementId, editingTextId]
  );

  const copySelectedElement = useCallback(
    (el: PageElement) => {
      const { id: _ignored, ...rest } = el;
      setCopiedElement({ ...rest });
      setClipboardMode('element');
      pasteCountRef.current = 0;
      if (el.type === 'pattern-note' && el.patternData) {
        skipNextPatternSyncRef.current = true;
        onCopyPattern(el.patternData);
      } else {
        onNotify?.('Objeto copiado (Ctrl+V para pegar)');
      }
    },
    [onCopyPattern, onNotify]
  );

  const cutSelectedElement = useCallback(
    (el: PageElement) => {
      if (!activeUserSpread) return;
      const { id: _ignored, ...rest } = el;
      setCopiedElement({ ...rest });
      setClipboardMode('element');
      pasteCountRef.current = 0;
      if (el.type === 'pattern-note' && el.patternData) {
        skipNextPatternSyncRef.current = true;
        onCopyPattern(el.patternData);
      }
      deleteElement(el.id);
      onNotify?.('Objeto cortado (Ctrl+V para pegar)');
    },
    [activeUserSpread, deleteElement, onCopyPattern, onNotify]
  );

  const pasteCopiedElement = useCallback(() => {
    if (!activeUserSpread || !copiedElement) return;
    pasteCountRef.current += 1;
    const step = ((pasteCountRef.current - 1) % 5 + 1) * 4;
    const newEl: PageElement = {
      ...copiedElement,
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
    onNotify?.('Objeto pegado');
  }, [activeUserSpread, copiedElement, onUpdateSpread, onSelectTool, onNotify]);

  // Keyboard Ctrl+C / Ctrl+X / Ctrl+V and Delete shortcuts for all objects & patterns
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
        if (isCatalogSpread && selectedCatalogPattern) {
          e.preventDefault();
          onCopyPattern(selectedCatalogPattern);
        } else if (!isCatalogSpread && activeUserSpread && selectedElementId) {
          const sel = activeUserSpread.elements.find((el) => el.id === selectedElementId);
          if (sel) {
            e.preventDefault();
            copySelectedElement(sel);
          }
        }
      } else if (mod && key === 'x') {
        if (!isCatalogSpread && activeUserSpread && selectedElementId) {
          const sel = activeUserSpread.elements.find((el) => el.id === selectedElementId);
          if (sel) {
            e.preventDefault();
            cutSelectedElement(sel);
          }
        }
      } else if (mod && key === 'v') {
        if (!isCatalogSpread && activeUserSpread) {
          if (clipboardMode === 'element' && copiedElement) {
            e.preventDefault();
            pasteCopiedElement();
          } else if (copiedPattern) {
            e.preventDefault();
            onPastePatternOnSpread(activeUserSpread.id, 'left');
          } else if (copiedElement) {
            e.preventDefault();
            pasteCopiedElement();
          }
        }
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !mod) {
        if (!isCatalogSpread && activeUserSpread && selectedElementId && !editingTextId) {
          e.preventDefault();
          deleteElement(selectedElementId);
          onNotify?.('Objeto eliminado');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isCatalogSpread,
    selectedCatalogPattern,
    activeUserSpread,
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
    onNotify,
  ]);

  const handlePlaceElement = useCallback(
    (side: 'left' | 'right', xPct: number, yPct: number) => {
      if (!activeUserSpread) return;
      if (activeTool === 'text') {
        const newEl: PageElement = {
          id: `el-${Date.now()}`,
          side,
          type: 'text',
          x: Math.max(6, Math.min(68, xPct)),
          y: Math.max(8, Math.min(82, yPct)),
          width: 215,
          content: 'Escribe aquí tu nota o punto…',
          color: brush.color,
          fontSize: selectedFont === 'caveat' ? 22 : 17,
          fontFamily: selectedFont,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          backgroundColor: 'transparent',
        };
        onUpdateSpread({
          ...activeUserSpread,
          elements: [...activeUserSpread.elements, newEl],
          updatedAt: new Date().toISOString(),
        });
        setSelectedElementId(newEl.id);
        setEditingTextId(newEl.id);
        onSelectTool('select');
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
      selectedFont,
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

  const cyclePaperStyle = () => {
    if (!activeUserSpread) return;
    const order: PaperStyle[] = ['grid', 'dots', 'plain'];
    const next = order[(order.indexOf(activeUserSpread.paperStyle) + 1) % order.length];
    onUpdateSpread({ ...activeUserSpread, paperStyle: next });
  };

  const cycleFrameStyle = (el: PageElement) => {
    const order: ImageFrameStyle[] = ['polaroid', 'gold', 'rounded', 'minimal'];
    const curr = el.frameStyle || 'polaroid';
    const next = order[(order.indexOf(curr) + 1) % order.length];
    updateElement(el.id, { frameStyle: next });
  };

  const rotateAllElements = useCallback(
    (mode: 'set' | 'delta' | 'reset', value: number) => {
      if (!activeUserSpread || activeUserSpread.elements.length === 0) return;
      const normalize = (deg: number) => ((Math.round(deg) % 360) + 360) % 360;
      const nextElements = activeUserSpread.elements.map((el) => {
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

  const activeTitle = isCatalogSpread
    ? activeCatalogSpread?.title || 'Catálogo de Patrones'
    : activeUserSpread?.title || 'Mi Hoja';

  return (
    <div className="relative flex-1 flex flex-col items-center justify-between px-2 py-1.5 sm:px-4 sm:py-2 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]">
      {/* Contextual Animated Floating Paint + Word + Photo Editor Toolbar (only visible when actively needed) */}
      <AnimatePresence>
        {(selectedElement ||
          (isCatalogSpread && selectedCatalogPattern) ||
          (!isCatalogSpread && (copiedPattern || copiedElement)) ||
          (!isCatalogSpread &&
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

            {/* Catalog Pattern Selected -> Copy ONLY the pattern */}
            {isCatalogSpread && selectedCatalogPattern && (
              <>
                <span className="text-xs text-[#f6e3c2] px-2 font-medium truncate max-w-[200px]">
                  Patrón: <strong className="text-[#ffdfa3]">{selectedCatalogPattern.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onCopyPattern(selectedCatalogPattern)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar símbolo</span>
                </button>
                {copiedPattern && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetSpread = spreads[0];
                      onChangeSpreadIndex(catalogCount);
                      if (targetSpread) {
                        onPastePatternOnSpread(targetSpread.id, 'left');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#3c2110] border border-[#eab86a]/55 text-xs text-[#ffebc2] hover:bg-[#573119] cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Pegar en Mis Hojas</span>
                  </button>
                )}
              </>
            )}

            {/* Copied Object or Symbol Paste Bar on User Editable Pages */}
            {!isCatalogSpread && activeUserSpread && (clipboardMode === 'element' ? copiedElement : copiedPattern || copiedElement) && (
              <button
                type="button"
                onClick={() => {
                  if (clipboardMode === 'element' && copiedElement) {
                    pasteCopiedElement();
                  } else if (copiedPattern) {
                    onPastePatternOnSpread(activeUserSpread.id, 'left');
                  } else if (copiedElement) {
                    pasteCopiedElement();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer shadow"
                title="Pegar en esta hoja (Ctrl+V)"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>
                  {clipboardMode === 'element' && copiedElement
                    ? 'Pegar objeto (Ctrl+V)'
                    : copiedPattern
                      ? `Pegar símbolo: ${copiedPattern.abbreviation || copiedPattern.name}`
                      : 'Pegar objeto (Ctrl+V)'}
                </span>
              </button>
            )}

            {/* Selected Element Paint + Word + Photo Editor Controls */}
          {!isCatalogSpread && selectedElement && (
            <>
              {selectedElement.type === 'image' && (
                <>
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

                  <button
                    type="button"
                    onClick={() => cycleFrameStyle(selectedElement)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                    title="Cambiar estilo de marco"
                  >
                    <Frame className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">
                      Marco: {selectedElement.frameStyle || 'polaroid'}
                    </span>
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
                  <button
                    type="button"
                    onClick={() => setEditingTextId(selectedElement.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <select
                    value={selectedElement.fontFamily || 'lora'}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        fontFamily: e.target.value as FontChoice,
                      })
                    }
                    aria-label="Tipografía"
                    className="px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] focus:outline-none cursor-pointer"
                  >
                    <option value="lora">Lora</option>
                    <option value="cormorant">Cormorant</option>
                    <option value="caveat">Caligrafía</option>
                    <option value="cinzel">Clásica</option>
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
                        fontSize: Math.max(11, (selectedElement.fontSize || 17) - 2),
                      })
                    }
                    className="px-2 py-1 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-xs text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                    title="Reducir letra"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        fontSize: Math.min(44, (selectedElement.fontSize || 17) + 2),
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
                onClick={() => copySelectedElement(selectedElement)}
                className="p-1.5 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                title="Copiar objeto (Ctrl+C)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => cutSelectedElement(selectedElement)}
                className="p-1.5 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                title="Cortar objeto (Ctrl+X)"
              >
                <Scissors className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => duplicateElement(selectedElement)}
                className="p-1.5 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                title="Duplicar elemento"
              >
                <CopyPlus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteElement(selectedElement.id);
                  onNotify?.('Objeto eliminado');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#7a202a] border border-[#f29aa2]/50 text-xs font-medium text-[#ffecee] hover:bg-[#992a36] cursor-pointer shadow-sm"
                title="Eliminar objeto seleccionado (Supr)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
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
                editorSubPanel === 'shape-color') && (
                <ColorSwatchPopover
                  title={
                    editorSubPanel === 'text-color'
                      ? 'Color del Texto'
                      : editorSubPanel === 'shape-color'
                        ? 'Color de Figura'
                        : 'Color del Símbolo'
                  }
                  color={selectedElement.color || '#3E1E0C'}
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
        <div className="w-full max-w-[1120px] flex-1 overflow-y-auto studio-scroll p-4 rounded-2xl leather-panel bg-[#221208]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-[#f7e2b9]">
              Índice Visual del Libro ({totalBookSpreads} pliegos)
            </h3>
            <button
              type="button"
              onClick={() => setShowOverview(false)}
              className="px-3 py-1.5 rounded-lg bg-[#9a6127] text-xs font-medium text-white cursor-pointer"
            >
              Volver al Cuaderno
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogSpreads.map((cs, idx) => (
              <button
                key={cs.id}
                type="button"
                onClick={() => {
                  onChangeSpreadIndex(idx);
                  setShowOverview(false);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  idx === safeIndex
                    ? 'border-[#f0c577] bg-[#4a2a15]'
                    : 'border-[#b98241]/35 bg-[#2a170c] hover:border-[#dfaf62]'
                }`}
              >
                <div className="h-24 rounded-lg parchment-page parchment-grid border border-[#966a35]/50 mb-2 flex flex-col items-center justify-center text-[#5c361d] font-editorial italic text-sm px-3 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-[#7a202a] font-sans font-semibold not-italic">
                    Catálogo A–Z
                  </span>
                  <span>{cs.title}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#e7cc9f]">
                  <span>Pliego {idx + 1}</span>
                  <span>{cs.leftItems.length + cs.rightItems.length} patrones</span>
                </div>
              </button>
            ))}

            {spreads.map((sp, idx) => {
              const globalIdx = catalogCount + idx;
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => {
                    onChangeSpreadIndex(globalIdx);
                    setShowOverview(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    globalIdx === safeIndex
                      ? 'border-[#f0c577] bg-[#4a2a15]'
                      : 'border-[#b98241]/35 bg-[#2a170c] hover:border-[#dfaf62]'
                  }`}
                >
                  <div className="h-24 rounded-lg parchment-page parchment-grid border border-[#966a35]/50 mb-2 flex items-center justify-center text-[#5c361d] font-editorial italic text-sm px-3 text-center">
                    {sp.title}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#e7cc9f]">
                    <span>Pliego {globalIdx + 1} · Editable</span>
                    <span>{sp.elements.length} elementos</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Open Book 3D Stage */
        <div className="flex-1 w-full flex items-center justify-center overflow-auto studio-scroll py-1">
          <div
            ref={bookContainerRef}
            onPointerDownCapture={(e) => {
              if (activeTool !== 'eyedropper') return;
              e.stopPropagation();
              e.preventDefault();
              const picked = sampleColorAtScreenPoint(e.clientX, e.clientY);
              onPickColorFromCanvas(picked);
            }}
            style={{
              transform: zoom === 100 ? undefined : `scale(${zoom / 100})`,
              transformOrigin: 'center center',
            }}
            className={`relative book-stage transition-transform duration-200 select-none ${
              activeTool === 'eyedropper' ? 'cursor-crosshair' : ''
            }`}
          >
            {/* Outer Leather Book Cover Frame */}
            <div className="relative flex rounded-2xl p-2 sm:p-3 leather-surface border-2 border-[#b47c3e]/65 shadow-[0_26px_60px_rgba(0,0,0,0.78)]">
              {/* Left & Right Parchment Pages */}
              <div className="relative flex rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.55)] border border-[#7c5328]/70">
                {isCatalogSpread && activeCatalogSpread ? (
                  <>
                    <PatternCatalogPage
                      side="left"
                      spreadNumber={safeIndex + 1}
                      items={activeCatalogSpread.leftItems}
                      selectedPatternId={selectedCatalogPattern?.id || null}
                      copiedPatternId={copiedPattern?.id || null}
                      onSelectPattern={setSelectedCatalogPattern}
                      onCopyPattern={onCopyPattern}
                    />
                    <div className="w-[3px] bg-gradient-to-r from-[#8b6236]/55 via-[#3f220e]/80 to-[#8b6236]/55 shrink-0" />
                    <PatternCatalogPage
                      side="right"
                      spreadNumber={safeIndex + 1}
                      items={activeCatalogSpread.rightItems}
                      selectedPatternId={selectedCatalogPattern?.id || null}
                      copiedPatternId={copiedPattern?.id || null}
                      onSelectPattern={setSelectedCatalogPattern}
                      onCopyPattern={onCopyPattern}
                    />
                  </>
                ) : activeUserSpread ? (
                  <>
                    <SingleNotebookPage
                      side="left"
                      spreadId={activeUserSpread.id}
                      paperStyle={activeUserSpread.paperStyle}
                      drawingDataUrl={activeUserSpread.leftDrawingDataUrl}
                      onSaveDrawing={(url) =>
                        onUpdateSpread({ ...activeUserSpread, leftDrawingDataUrl: url })
                      }
                      activeTool={activeTool}
                      brush={brush}
                      onPickColor={onPickColorFromCanvas}
                      elements={activeUserSpread.elements.filter((e) => e.side === 'left')}
                      selectedElementId={selectedElementId}
                      editingTextId={editingTextId}
                      onSelectElement={setSelectedElementId}
                      onEditText={setEditingTextId}
                      onUpdateElement={updateElement}
                      onDeleteElement={(id) => {
                        deleteElement(id);
                        onNotify?.('Objeto eliminado');
                      }}
                      onPlaceElement={(x, y) => handlePlaceElement('left', x, y)}
                    />

                    <div className="w-[3px] bg-gradient-to-r from-[#8b6236]/55 via-[#3f220e]/80 to-[#8b6236]/55 shrink-0" />

                    <SingleNotebookPage
                      side="right"
                      spreadId={activeUserSpread.id}
                      paperStyle={activeUserSpread.paperStyle}
                      drawingDataUrl={activeUserSpread.rightDrawingDataUrl}
                      onSaveDrawing={(url) =>
                        onUpdateSpread({ ...activeUserSpread, rightDrawingDataUrl: url })
                      }
                      activeTool={activeTool}
                      brush={brush}
                      onPickColor={onPickColorFromCanvas}
                      elements={activeUserSpread.elements.filter((e) => e.side === 'right')}
                      selectedElementId={selectedElementId}
                      editingTextId={editingTextId}
                      onSelectElement={setSelectedElementId}
                      onEditText={setEditingTextId}
                      onUpdateElement={updateElement}
                      onDeleteElement={(id) => {
                        deleteElement(id);
                        onNotify?.('Objeto eliminado');
                      }}
                      onPlaceElement={(x, y) => handlePlaceElement('right', x, y)}
                    />
                  </>
                ) : null}

                {/* Central Brass Binder Rings */}
                <BrassBinderRings />

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

                {/* 3D Turning Page Leaf Overlay */}
                {flipDir && (
                  <div
                    style={{
                      transformOrigin: flipDir === 'next' ? 'left center' : 'right center',
                      transform: `rotateY(${flipAngle}deg)`,
                      transition: isAnimatingFlip
                        ? 'transform 0.44s cubic-bezier(0.22, 1, 0.36, 1)'
                        : 'none',
                    }}
                    className={`pointer-events-none absolute inset-y-0 w-1/2 z-40 preserve-3d ${
                      flipDir === 'next' ? 'right-0' : 'left-0'
                    }`}
                  >
                    <div className="absolute inset-0 backface-hidden parchment-page parchment-grid border-l border-[#a37846]/50 shadow-[inset_18px_0_32px_rgba(72,42,18,0.22),-10px_0_24px_rgba(0,0,0,0.3)] flex items-center justify-center">
                      <span className="font-editorial italic text-[#7a522c]/45 text-lg">
                        Pasando página…
                      </span>
                    </div>
                    <div
                      style={{ transform: 'rotateY(180deg)' }}
                      className="absolute inset-0 backface-hidden parchment-page parchment-grid border-r border-[#a37846]/50 shadow-[inset_-18px_0_32px_rgba(72,42,18,0.22)]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Pagination, Section Jump & Zoom Bar */}
      <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 select-none">
        {isCatalogSpread ? (
          <div className="hidden md:flex items-center gap-1.5 bg-[#241309]/90 border border-[#b98241]/40 rounded-xl px-3 py-1.5 text-xs text-[#f4dfb9]">
            <BookOpenCheck className="w-3.5 h-3.5 text-[#f0c77c]" />
            <span className="truncate max-w-[200px]">{activeTitle}</span>
          </div>
        ) : (
          <input
            type="text"
            value={activeUserSpread?.title || ''}
            onChange={(e) => {
              if (activeUserSpread) {
                onUpdateSpread({ ...activeUserSpread, title: e.target.value });
              }
            }}
            aria-label="Título de la página"
            className="hidden md:block bg-[#241309]/85 border border-[#b98241]/35 focus:border-[#ebbc6e] rounded-xl font-editorial italic text-sm text-[#f4dfb9] px-3 py-1.5 focus:outline-none truncate w-48"
          />
        )}

        {/* Quick jump between First Pages (Patrones) and Editable Sheets */}
        <div className="flex items-center gap-1 p-1 rounded-xl leather-panel bg-[#221208] text-xs">
          <button
            type="button"
            onClick={() => onChangeSpreadIndex(0)}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              isCatalogSpread
                ? 'bg-[#8c5422] text-white font-medium'
                : 'text-[#dec39c] hover:text-white'
            }`}
          >
            Patrones (1–{catalogCount})
          </button>
          <button
            type="button"
            onClick={() => onChangeSpreadIndex(catalogCount)}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              !isCatalogSpread
                ? 'bg-[#8c5422] text-white font-medium'
                : 'text-[#dec39c] hover:text-white'
            }`}
          >
            Mis Hojas ({catalogCount + 1}+)
          </button>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded-xl leather-panel bg-[#221208]">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => commitPageTurn('prev')}
            aria-label="Página anterior"
            className="p-1.5 rounded-lg text-[#f3dcb3] hover:bg-[#593319] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs sm:text-sm font-editorial text-[#f8e6c4] whitespace-nowrap font-mono-tab">
            Pliego {safeIndex + 1} de {totalBookSpreads}
          </span>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => commitPageTurn('next')}
            aria-label="Página siguiente"
            className="p-1.5 rounded-lg text-[#f3dcb3] hover:bg-[#593319] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onAddSpread}
            title="Añadir nueva hoja editable al cuaderno"
            className="ml-1 p-1.5 rounded-lg bg-[#8c5422] hover:bg-[#ab6a2e] text-[#fff6e3] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded-xl leather-panel bg-[#221208]">
          <button
            type="button"
            onClick={() => setShowOverview((v) => !v)}
            title="Vista general de hojas"
            className="p-1.5 rounded-lg text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          {!isCatalogSpread && activeUserSpread && (
            <>
              <button
                type="button"
                onClick={cyclePaperStyle}
                title={`Cambiar papel (actual: ${activeUserSpread.paperStyle})`}
                className="px-2 py-1 rounded-lg text-xs text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
              >
                {activeUserSpread.paperStyle === 'grid'
                  ? 'Cuadrícula'
                  : activeUserSpread.paperStyle === 'dots'
                    ? 'Puntos'
                    : 'Pergamino'}
              </button>

              {activeUserSpread.elements.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setEditorSubPanel((p) => (p === 'rotate-all' ? null : 'rotate-all'))
                    }
                    title="Rotar libremente todos los objetos de esta hoja"
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                      editorSubPanel === 'rotate-all'
                        ? 'bg-[#6b3d1e] text-white'
                        : 'text-[#f3dcb3] hover:bg-[#593319]'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#f0c77c]" />
                    <span className="hidden sm:inline">Rotar todo</span>
                  </button>

                  <AnimatePresence>
                    {editorSubPanel === 'rotate-all' && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 bottom-full mb-2 w-64 rounded-xl leather-panel bg-[#221208] p-3 z-50 shadow-[0_22px_50px_rgba(0,0,0,0.92)] text-xs text-[#f5e4c4] space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-[#b98241]/25 pb-1.5">
                          <span className="font-display text-[#ffebc2]">
                            Rotar Todos los Objetos
                          </span>
                          <button
                            type="button"
                            onClick={() => rotateAllElements('reset', 0)}
                            className="text-[10px] text-[#e6be7a] hover:text-white cursor-pointer"
                          >
                            0° Restablecer
                          </button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-[#dec49d]">Ángulo libre</span>
                            <span className="font-mono-tab text-[#ffebc2]">{allRotateAngle}°</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={359}
                            value={allRotateAngle}
                            onChange={(e) => rotateAllElements('set', Number(e.target.value))}
                            className="w-full accent-[#d69c50] h-1.5 bg-[#140a04] rounded cursor-pointer"
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-[11px]">
                          {[
                            { label: '-45°', delta: -45 },
                            { label: '-15°', delta: -15 },
                            { label: '+15°', delta: 15 },
                            { label: '+90°', delta: 90 },
                          ].map((btn) => (
                            <button
                              key={btn.label}
                              type="button"
                              onClick={() => rotateAllElements('delta', btn.delta)}
                              className="py-1 rounded bg-[#361d0e] hover:bg-[#5b331a] border border-[#b98241]/30 text-[#f3dcb3] cursor-pointer font-mono-tab"
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
          <div className="h-4 w-px bg-[#b98241]/30 mx-0.5" />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(70, z - 10))}
            aria-label="Alejar"
            className="p-1.5 rounded-lg text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono-tab text-[#f8e6c4] w-10 text-center">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(130, z + 10))}
            aria-label="Acercar"
            className="p-1.5 rounded-lg text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            title="Restaurar zoom 100%"
            className="p-1.5 rounded-lg text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
  selectedPatternId: string | null;
  copiedPatternId: string | null;
  onSelectPattern: (pat: CopiedPatternData) => void;
  onCopyPattern: (pat: CopiedPatternData) => void;
}> = memo(
  ({
    side,
    spreadNumber,
    items,
    selectedPatternId,
    copiedPatternId,
    onSelectPattern,
    onCopyPattern,
  }) => {
    const pageNum = (spreadNumber - 1) * 2 + (side === 'left' ? 1 : 2);
    return (
      <div className="relative notebook-page-maximized parchment-page parchment-grid overflow-hidden flex flex-col px-6 py-4">
        {side === 'left' ? (
          <>
            <CornerCrochetFlower position="top-left" className="absolute top-1 left-1 w-20 h-20 opacity-85" />
            <CornerCrochetFlower position="bottom-left" className="absolute bottom-1 left-1 w-20 h-20 opacity-85" />
          </>
        ) : (
          <>
            <CornerCrochetFlower position="top-right" className="absolute top-1 right-3 w-16 h-16 opacity-85" />
            <CornerCrochetFlower position="bottom-right" className="absolute bottom-1 right-3 w-16 h-16 opacity-85" />
          </>
        )}

        {/* Header */}
        <div className="relative z-10 flex items-baseline justify-between border-b border-[#8e6233]/35 pb-1.5 mb-2.5 pl-8 pr-6">
          <div>
            <h2 className="font-editorial text-lg sm:text-xl font-bold text-[#4a220d]">
              {side === 'left' ? 'Índice de Patrones Crochet' : 'Alfabeto y Diagramas'}
            </h2>
            <p className="text-[11px] text-[#6d4521]">
              Selecciona y copia solo el símbolo como si fuese una letra para pegarlo en tus hojas
            </p>
          </div>
          <span className="font-mono-tab text-[11px] text-[#7c552d]">Pág. {pageNum}</span>
        </div>

        {/* Pattern Cards Grid */}
        <div className="relative z-10 flex-1 grid grid-cols-1 gap-2.5 overflow-y-auto studio-scroll pr-1">
          {items.map((item) => {
            const isSelected = selectedPatternId === item.id;
            const isCopied = copiedPatternId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onSelectPattern(item)}
                className={`group rounded-xl border p-2.5 transition-all cursor-pointer flex items-center gap-3 ${
                  isSelected
                    ? 'bg-[#fff9eb] border-[#7a202a] ring-2 ring-[#d49a4c]/70 shadow-md'
                    : 'bg-[#fffcf4]/85 border-[#a87842]/50 hover:border-[#7a202a]/75 hover:bg-[#fffaf0]'
                }`}
              >
                {/* Symbol preview box */}
                <div className="w-14 h-14 rounded-lg bg-[#f6e8cb] border border-[#b48449]/60 flex items-center justify-center shrink-0 p-1 overflow-hidden">
                  {item.diagramGrid ? (
                    <DiagramGridSvg grid={item.diagramGrid} className="w-12 h-12" />
                  ) : (
                    <StitchSymbolSvg stitchKey={item.stitchKey} className="w-11 h-11" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.letter && (
                      <span className="px-1.5 py-0.5 rounded bg-[#7a202a] text-[#fff6e5] font-display text-[10px]">
                        {item.letter}
                      </span>
                    )}
                    <h3 className="font-editorial text-base font-bold text-[#3f1c09] truncate">
                      {item.name}
                    </h3>
                    <span className="font-mono-tab text-[10px] px-1.5 py-0.5 rounded bg-[#ecd8b4] text-[#5b3318]">
                      {item.abbreviation}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5e391e] line-clamp-2 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>

                {/* Copy Pattern Action */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPattern(item);
                    onCopyPattern(item);
                  }}
                  title="Copiar solo este patrón"
                  className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    isCopied
                      ? 'bg-[#2e5a44] text-white'
                      : 'bg-[#8d5422] hover:bg-[#7a202a] text-white'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-xs italic text-[#7a542f]">
              Final del catálogo de patrones
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

/* ---------- Memoized Page Element Item (Fast Drag, Resize & Free Rotate) ---------- */

const PageElementItem = memo<{
  el: PageElement;
  isSelected: boolean;
  isEditing: boolean;
  isDrawLocked: boolean;
  liveOverride?: { x: number; y: number; width: number; rotation?: number };
  onStartDrag: (el: PageElement, e: React.PointerEvent) => void;
  onStartResize: (el: PageElement, e: React.PointerEvent) => void;
  onStartRotate: (el: PageElement, e: React.PointerEvent) => void;
  onDoubleClick: (el: PageElement, e: React.MouseEvent) => void;
  onUpdateElement: (id: string, patch: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  onEditTextDone: () => void;
}>(
  ({
    el,
    isSelected,
    isEditing,
    isDrawLocked,
    liveOverride,
    onStartDrag,
    onStartResize,
    onStartRotate,
    onDoubleClick,
    onUpdateElement,
    onDeleteElement,
    onEditTextDone,
  }) => {
    const x = liveOverride ? liveOverride.x : el.x;
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

    const frameClasses =
      el.frameStyle === 'minimal'
        ? 'p-0 bg-transparent border-0 shadow-md'
        : el.frameStyle === 'gold'
          ? 'p-1.5 bg-[#2d180b] border-2 border-[#e0af5a] rounded-lg shadow-lg'
          : el.frameStyle === 'rounded'
            ? 'p-1 bg-[#fffdf7] border border-[#b98a50]/60 rounded-2xl overflow-hidden shadow-md'
            : 'p-1.5 bg-[#fffdf7] border border-[#b98a50]/65 rounded shadow-md';

    const hasTextBg = Boolean(el.backgroundColor && el.backgroundColor !== 'transparent');

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
        onPointerDown={(e) => onStartDrag(el, e)}
        onDoubleClick={(e) => onDoubleClick(el, e)}
        className={`absolute pointer-events-auto ${
          isDrawLocked ? 'pointer-events-none' : 'cursor-move'
        } ${
          isSelected
            ? 'ring-2 ring-[#b95b37] ring-offset-2 ring-offset-[#fbf2de]/70 rounded-lg'
            : ''
        }`}
      >
        {/* Top-Center Free Rotation Handle when selected */}
        {isSelected && !isEditing && (
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

        {/* Top-Right Direct Delete Button for ALL selected objects */}
        {isSelected && !isEditing && (
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

        {el.type === 'text' &&
          (isEditing ? (
            <textarea
              autoFocus
              value={el.content}
              onChange={(e) => onUpdateElement(el.id, { content: e.target.value })}
              onBlur={onEditTextDone}
              rows={4}
              style={{
                color: el.color || '#4e2712',
                fontSize: el.fontSize || 17,
                fontWeight: el.fontWeight || 'normal',
                fontStyle: el.fontStyle || 'normal',
                textDecoration: el.textDecoration || 'none',
                textAlign: el.textAlign || 'left',
                backgroundColor: hasTextBg ? el.backgroundColor : 'rgba(255,250,240,0.95)',
              }}
              className={`w-full border border-[#b98241] rounded p-1.5 leading-snug focus:outline-none ${
                FONT_CLASS_MAP[el.fontFamily || 'lora']
              }`}
            />
          ) : (
            <p
              style={{
                color: el.color || '#4e2712',
                fontSize: el.fontSize || 17,
                fontWeight: el.fontWeight || 'normal',
                fontStyle: el.fontStyle || 'normal',
                textDecoration: el.textDecoration || 'none',
                textAlign: el.textAlign || 'left',
                backgroundColor: hasTextBg ? el.backgroundColor : undefined,
                padding: hasTextBg ? '4px 8px' : undefined,
                borderRadius: hasTextBg ? '6px' : undefined,
              }}
              className={`whitespace-pre-wrap leading-snug ${
                FONT_CLASS_MAP[el.fontFamily || 'lora']
              }`}
            >
              {el.content}
            </p>
          ))}

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

        {el.type === 'image' && (
          <div className={frameClasses}>
            <img
              src={el.content}
              alt={el.title || 'Foto de proyecto'}
              referrerPolicy="no-referrer"
              decoding="async"
              style={{ filter: cssFilter }}
              className={`w-full h-auto object-cover max-h-56 ${
                el.frameStyle === 'rounded' ? 'rounded-xl' : 'rounded'
              }`}
              draggable={false}
            />
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
        )}

        {el.type === 'pattern-note' && el.patternData && (
          <div
            title={el.patternData.name}
            className="w-full aspect-square flex items-center justify-center select-none"
          >
            {el.patternData.diagramGrid ? (
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

        {/* Corner Resize Handle when selected */}
        {isSelected && !isEditing && (
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
  side: 'left' | 'right';
  spreadId: string;
  paperStyle: PaperStyle;
  drawingDataUrl?: string;
  onSaveDrawing: (dataUrl: string) => void;
  activeTool: ActiveCanvasTool;
  brush: BrushSettings;
  onPickColor: (hex: string) => void;
  elements: PageElement[];
  selectedElementId: string | null;
  editingTextId: string | null;
  onSelectElement: (id: string | null) => void;
  onEditText: (id: string | null) => void;
  onUpdateElement: (id: string, patch: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  onPlaceElement: (xPct: number, yPct: number) => void;
}

const SingleNotebookPage: React.FC<SinglePageProps> = memo(
  ({
    side,
    spreadId,
    paperStyle,
    drawingDataUrl,
    onSaveDrawing,
    activeTool,
    brush,
    onPickColor,
    elements,
    selectedElementId,
    editingTextId,
    onSelectElement,
    onEditText,
    onUpdateElement,
    onDeleteElement,
    onPlaceElement,
  }) => {
    const pageRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastCommittedUrlRef = useRef<string | undefined>(undefined);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

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

    const [eraserCursor, setEraserCursor] = useState<{ x: number; y: number } | null>(null);

    const dragElRef = useRef<{
      mode: 'drag' | 'resize' | 'rotate';
      id: string;
      startX: number;
      startY: number;
      origXPct: number;
      origYPct: number;
      origWidth: number;
      centerX?: number;
      centerY?: number;
    } | null>(null);

    // Sync canvas image ONLY when spread switches or external undo/clear changed drawingDataUrl
    useEffect(() => {
      if (
        drawingDataUrl !== undefined &&
        drawingDataUrl === lastCommittedUrlRef.current
      ) {
        return;
      }
      lastCommittedUrlRef.current = drawingDataUrl;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!drawingDataUrl) {
        ctx.clearRect(0, 0, PAGE_W, PAGE_H);
        return;
      }

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, PAGE_W, PAGE_H);
        ctx.drawImage(img, 0, 0, PAGE_W, PAGE_H);
      };
      img.src = drawingDataUrl;
    }, [spreadId, drawingDataUrl]);

    const getCanvasPoint = (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * PAGE_W,
        y: ((e.clientY - rect.top) / rect.height) * PAGE_H,
      };
    };

    const drawSegment = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      isErasing: boolean
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const alpha = brush.opacity / 100;
      const size = Math.max(1.5, brush.size * 0.45);
      ctx.save();

      if (isErasing || brush.preset === 'borrador-suave') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (brush.softness > 35) {
          // Fast soft-edge erase using two concentric passes (no slow shadowBlur!)
          ctx.globalAlpha = alpha * 0.45;
          ctx.lineWidth = size * 1.9;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        ctx.globalAlpha = alpha;
        ctx.lineWidth = size * 1.35;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
        return;
      }

      if (brush.preset === 'difuminador') {
        ctx.fillStyle = brush.color;
        ctx.globalAlpha = alpha * 0.12;
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, size * 1.05, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha * 0.22;
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      const isChalk =
        brush.preset === 'tiza-suave' ||
        brush.preset === 'tiza-pastel' ||
        brush.preset === 'tiza-gruesa' ||
        brush.preset === 'carboncillo';

      if (isChalk) {
        const grainColor = brush.preset === 'carboncillo' ? '#2c2825' : brush.color;
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const steps = Math.max(1, Math.min(12, Math.ceil(dist / 3.5)));
        const spreadRadius =
          brush.preset === 'tiza-gruesa' ? size * 0.72 : size * 0.52;
        ctx.fillStyle = grainColor;
        const particles = brush.preset === 'tiza-gruesa' ? 8 : 5;

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const cx = p1.x + (p2.x - p1.x) * t;
          const cy = p1.y + (p2.y - p1.y) * t;
          for (let k = 0; k < particles; k++) {
            const rx = (Math.random() - 0.5) * spreadRadius * 2;
            const ry = (Math.random() - 0.5) * spreadRadius * 2;
            ctx.globalAlpha = alpha * (0.22 + Math.random() * 0.35);
            ctx.fillRect(cx + rx, cy + ry, 2, 2);
          }
        }
        ctx.restore();
        return;
      }

      // Smooth pen / crochet stitch dashed / watercolor (fast multi-pass without shadowBlur)
      ctx.strokeStyle = brush.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const baseWidth =
        brush.preset === 'pluma-fina' ? Math.max(1.5, size * 0.35) : size;

      if (brush.preset === 'hilo-crochet') {
        ctx.setLineDash([size * 1.4, size * 0.9]);
      }

      if (brush.softness > 30) {
        ctx.globalAlpha = (brush.preset === 'acuarela' ? alpha * 0.25 : alpha * 0.28);
        ctx.lineWidth = baseWidth + (brush.softness / 100) * 6;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      ctx.globalAlpha = brush.preset === 'acuarela' ? alpha * 0.42 : alpha;
      ctx.lineWidth = baseWidth;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
    };

    const handleCanvasPointerDown = (e: React.PointerEvent) => {
      if (activeTool === 'eyedropper') {
        e.stopPropagation();
        const picked = sampleColorAtScreenPoint(e.clientX, e.clientY);
        onPickColor(picked);
        return;
      }

      if (activeTool === 'draw' || activeTool === 'eraser') {
        e.stopPropagation();
        isDrawingRef.current = true;
        const pt = getCanvasPoint(e);
        lastPosRef.current = pt;
        drawSegment(pt, pt, activeTool === 'eraser');
        (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
      } else if (activeTool === 'text' || activeTool === 'shape') {
        const rect = pageRef.current?.getBoundingClientRect();
        if (!rect) return;
        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
        const yPct = ((e.clientY - rect.top) / rect.height) * 100;
        onPlaceElement(xPct, yPct);
      } else {
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
          const rawXPct = origXPct + ((clientX - startX) / rect.width) * 100;
          const minX = side === 'right' ? -96 : 2;
          const maxX = side === 'left' ? 184 : 84;
          nextTransform = {
            id,
            x: Math.max(minX, Math.min(maxX, rawXPct)),
            y: Math.max(2, Math.min(88, origYPct + ((clientY - startY) / rect.height) * 100)),
            width: origWidth,
          };
        } else {
          nextTransform = {
            id,
            x: origXPct,
            y: origYPct,
            width: Math.max(22, Math.min(400, Math.round(origWidth + (clientX - startX)))),
          };
        }
        liveTransformRef.current = nextTransform;
        setLiveTransform(nextTransform);
      },
      [side]
    );

    const handleCanvasPointerMove = (e: React.PointerEvent) => {
      if (activeTool === 'eraser' && pageRef.current) {
        const rect = pageRef.current.getBoundingClientRect();
        setEraserCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else if (eraserCursor) {
        setEraserCursor(null);
      }

      if (
        isDrawingRef.current &&
        lastPosRef.current &&
        (activeTool === 'draw' || activeTool === 'eraser')
      ) {
        const pt = getCanvasPoint(e);
        drawSegment(lastPosRef.current, pt, activeTool === 'eraser');
        lastPosRef.current = pt;
      } else if (dragElRef.current) {
        updateDraggedTransform(e.clientX, e.clientY, e.shiftKey);
      }
    };

    const commitPointerEnd = useCallback(() => {
      if (isDrawingRef.current && canvasRef.current) {
        isDrawingRef.current = false;
        lastPosRef.current = null;
        const webp = canvasRef.current.toDataURL('image/webp', 0.9);
        const dataUrl = webp.startsWith('data:image/webp')
          ? webp
          : canvasRef.current.toDataURL('image/png');
        lastCommittedUrlRef.current = dataUrl;
        onSaveDrawing(dataUrl);
      }
      const pending = liveTransformRef.current;
      const activeDrag = dragElRef.current;
      if (activeDrag && pending) {
        if (activeDrag.mode === 'drag' && pageRef.current) {
          const originRect = pageRef.current.getBoundingClientRect();
          const siblingSide: 'left' | 'right' = side === 'left' ? 'right' : 'left';
          const siblingEl = pageRef.current.parentElement?.querySelector(
            `[data-page-side="${siblingSide}"]`
          ) as HTMLElement | null;

          let finalSide: 'left' | 'right' = side;
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
    }, [onSaveDrawing, onUpdateElement, side]);

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
      };
    }, [updateDraggedTransform, commitPointerEnd]);

    const handleCanvasPointerUp = commitPointerEnd;

    const handleStartDragElement = useCallback(
      (el: PageElement, e: React.PointerEvent) => {
        if (activeTool === 'draw' || activeTool === 'eraser' || activeTool === 'eyedropper') {
          return;
        }
        e.stopPropagation();
        onSelectElement(el.id);
        if (editingTextId !== el.id) {
          dragElRef.current = {
            mode: 'drag',
            id: el.id,
            startX: e.clientX,
            startY: e.clientY,
            origXPct: el.x,
            origYPct: el.y,
            origWidth: el.width,
          };
        }
      },
      [activeTool, onSelectElement, editingTextId]
    );

    const handleStartResizeElement = useCallback(
      (el: PageElement, e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelectElement(el.id);
        dragElRef.current = {
          mode: 'resize',
          id: el.id,
          startX: e.clientX,
          startY: e.clientY,
          origXPct: el.x,
          origYPct: el.y,
          origWidth: el.width,
        };
      },
      [onSelectElement]
    );

    const handleStartRotateElement = useCallback(
      (el: PageElement, e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelectElement(el.id);
        const box = (e.currentTarget as HTMLElement)
          .closest('[data-element-box="true"]')
          ?.getBoundingClientRect();
        const centerX = box ? box.left + box.width / 2 : e.clientX;
        const centerY = box ? box.top + box.height / 2 : e.clientY + 40;
        dragElRef.current = {
          mode: 'rotate',
          id: el.id,
          startX: e.clientX,
          startY: e.clientY,
          origXPct: el.x,
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
          onEditText(el.id);
        }
      },
      [onEditText]
    );

    const handleEditTextDone = useCallback(() => {
      onEditText(null);
    }, [onEditText]);

    const paperBgClass =
      paperStyle === 'grid'
        ? 'parchment-grid'
        : paperStyle === 'dots'
          ? 'parchment-dots'
          : '';

    const isDrawLocked = activeTool === 'draw' || activeTool === 'eraser';

    return (
      <div
        ref={pageRef}
        data-page-side={side}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={() => setEraserCursor(null)}
        className={`relative notebook-page-maximized parchment-page ${paperBgClass} overflow-visible ${
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
        {/* Clipped Paper Decorations & Ruler */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Corner Crochet Flowers & Filigree */}
          {side === 'left' ? (
            <>
              <CornerCrochetFlower position="top-left" className="absolute top-1 left-1 w-24 h-24" />
              <CornerCrochetFlower position="bottom-left" className="absolute bottom-1 left-1 w-24 h-24" />
            </>
          ) : (
            <>
              <CornerCrochetFlower position="top-right" className="absolute top-1 right-3 w-20 h-20" />
              <CornerCrochetFlower position="bottom-right" className="absolute bottom-1 right-3 w-20 h-20" />
              <div
                className="pointer-events-none absolute inset-y-3 right-0 w-7 border-l border-[#a37846]/35 flex flex-col justify-between py-2 pr-1 text-right"
                aria-hidden="true"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((cm) => (
                  <div key={cm} className="flex items-center justify-end gap-1 leading-none">
                    <span className="w-1.5 h-px bg-[#7c552d]/60" />
                    <span className="text-[8px] font-mono-tab text-[#6e4a26]/80">{cm}</span>
                  </div>
                ))}
                <span className="text-[8px] font-mono-tab text-[#6e4a26] pr-0.5">cm</span>
              </div>
            </>
          )}
        </div>

        {/* Drawing Canvas Layer */}
        <canvas
          ref={canvasRef}
          width={PAGE_W}
          height={PAGE_H}
          onPointerDown={handleCanvasPointerDown}
          className="absolute inset-0 w-full h-full z-10 touch-none"
        />

        {/* Visual Eraser Ring Cursor */}
        {activeTool === 'eraser' && eraserCursor && (
          <div
            style={{
              left: eraserCursor.x,
              top: eraserCursor.y,
              width: Math.max(10, brush.size * 0.72),
              height: Math.max(10, brush.size * 0.72),
              transform: 'translate(-50%, -50%)',
            }}
            className="pointer-events-none absolute z-30 rounded-full border-2 border-[#7a202a] bg-white/35 shadow"
          />
        )}

        {/* Interactive Page Elements (overflow-visible allows cross-page dragging) */}
        <div className={`absolute inset-0 pointer-events-none ${liveTransform ? 'z-30' : 'z-20'}`}>
          {elements.map((el) => (
            <PageElementItem
              key={el.id}
              el={el}
              isSelected={el.id === selectedElementId}
              isEditing={el.id === editingTextId}
              isDrawLocked={isDrawLocked}
              liveOverride={liveTransform?.id === el.id ? liveTransform : undefined}
              onStartDrag={handleStartDragElement}
              onStartResize={handleStartResizeElement}
              onStartRotate={handleStartRotateElement}
              onDoubleClick={handleDoubleClickElement}
              onUpdateElement={onUpdateElement}
              onDeleteElement={onDeleteElement}
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
  // Blend translucent fills/strokes against warm parchment (#FBF2DE)
  if (alpha < 0.99) {
    return toHexColor(
      r * alpha + 251 * (1 - alpha),
      g * alpha + 242 * (1 - alpha),
      b * alpha + 222 * (1 - alpha)
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
