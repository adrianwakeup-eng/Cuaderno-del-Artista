import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Minimize2, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { CoverScreen } from './components/CoverScreen';
import { CrochetTransition } from './components/CrochetTransition';
import {
  RightStudioDock,
  type LayerAction,
  type LayerVisibility,
  type StackableLayerId,
} from './components/RightToolPanels';
import { NotebookSpread } from './components/NotebookSpread';
import { PatternsView } from './components/PatternsView';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import {
  BrushesQuickView,
  FontsView,
  HelpModal,
  SettingsView,
  StickersAndImagesView,
} from './components/StudioUtilityViews';
import { CrochetGifsView } from './components/CrochetGifsView';
import { GoldenDressingRoomView } from './components/GoldenDressingRoomView';
import { ElectronTitleBar, OfflineIndicator } from './components/WindowsDesktopControls';
import { DEFAULT_WORKSPACE, INITIAL_DESK_NOTES } from './data/seedData';
import { CROCHET_ALPHABET } from './data/crochetAlphabet';
import type {
  ActiveCanvasTool,
  BrushSettings,
  CopiedPatternData,
  CrochetPattern,
  DeskNoteItem,
  DressingRoomGarment,
  ExtractedMandalaRecord,
  FontChoice,
  NotebookSpread as SpreadType,
  NotebookWorkspaceData,
  PageElement,
  PaperStyle,
  ShapeKind,
  StudioSection,
  WardrobeSeasonId,
} from './types/crochet';
import { audioEngine } from './utils/audioEngine';
import {
  compressImageFile,
  exportWorkspaceJson,
  loadWorkspace,
  saveExtractedMandalas,
  saveWorkspace,
} from './utils/storage';
import { getDriveAccessToken, initDriveAuth } from './utils/googleDrive';

export default function App() {
  const [workspace, setWorkspace] = useState<NotebookWorkspaceData>(DEFAULT_WORKSPACE);
  const [loaded, setLoaded] = useState(false);

  // View state: 'cover' -> 'studio' with full-screen yarn-burst transition overlay
  const [bookState, setBookState] = useState<'cover' | 'transitioning' | 'studio'>('cover');
  const [bookOpeningTransition, setBookOpeningTransition] = useState(false);
  const [activeSection, setActiveSection] = useState<StudioSection>('cuaderno');
  const [vestidorSeason, setVestidorSeason] = useState<WardrobeSeasonId>('primavera');
  const [notebookMode, setNotebookMode] = useState<'book' | 'mandalas'>('book');
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(() =>
    Math.ceil((CROCHET_ALPHABET.length + DEFAULT_WORKSPACE.patterns.length) / 8)
  );
  const [mandalaSpreadIndex, setMandalaSpreadIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<ActiveCanvasTool>('select');
  const [selectedShapeKind, setSelectedShapeKind] = useState<ShapeKind>('crochet-ring');

  const [brush, setBrush] = useState<BrushSettings>({
    category: 'difuminados',
    preset: 'difuminado-seda',
    color: '#4E2712',
    size: 26,
    opacity: 68,
    softness: 88,
  });

  // Undo / Redo stacks for notebook spreads and removed catalog/mandala pages
  const [undoStack, setUndoStack] = useState<
    Array<{
      spreads: SpreadType[];
      hiddenCatalogSpreadIds?: string[];
      hiddenMandalaSpreadIds?: string[];
    }>
  >([]);
  const [redoStack, setRedoStack] = useState<
    Array<{
      spreads: SpreadType[];
      hiddenCatalogSpreadIds?: string[];
      hiddenMandalaSpreadIds?: string[];
    }>
  >([]);
  const [copiedPattern, setCopiedPattern] = useState<CopiedPatternData | null>(null);

  const [showHelp, setShowHelp] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [showMobileDock, setShowMobileDock] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    notes: true,
    drawing: true,
    images: true,
    background: true,
  });
  const [layerOrder, setLayerOrder] = useState<StackableLayerId[]>([
    'notes',
    'drawing',
    'images',
  ]);
  const [selectedLayer, setSelectedLayer] = useState<StackableLayerId>('images');
  const [spreadMeta, setSpreadMeta] = useState<{
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
  }>({
    isCatalog: true,
    paperStyle: 'grid',
    hasSelected: false,
    hasDrawings: false,
    hasElements: false,
    title: 'Catálogo de Patrones',
    totalBookSpreads: 1,
    catalogCount: 1,
    showOverview: false,
    allRotateAngle: 0,
  });
  const [layerActionSignal, setLayerActionSignal] = useState<{
    id: number;
    action: LayerAction;
  } | null>(null);
  const [cyclePaperSignal, setCyclePaperSignal] = useState(0);
  const [bookZoom, setBookZoom] = useState(100);
  const [turnPageSignal, setTurnPageSignal] = useState<{
    id: number;
    dir: 'prev' | 'next';
  } | null>(null);
  const [toggleOverviewSignal, setToggleOverviewSignal] = useState(0);
  const [addTextSignal, setAddTextSignal] = useState(0);
  const [rotateAllSignal, setRotateAllSignal] = useState<{
    id: number;
    mode: 'set' | 'delta' | 'reset';
    value: number;
  } | null>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const layerLabels: Record<StackableLayerId, string> = {
    notes: 'Notas',
    drawing: 'Dibujo',
    images: 'Imágenes',
  };

  const handleStepLayerOrder = (layer: StackableLayerId, dir: 'up' | 'down') => {
    setLayerOrder((prev) => {
      const idx = prev.indexOf(layer);
      if (idx === -1) return prev;
      const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
    showToast(
      dir === 'up'
        ? `Capa "${layerLabels[layer]}" subida`
        : `Capa "${layerLabels[layer]}" bajada`
    );
  };

  const handleDockLayerAction = (action: LayerAction) => {
    if (action.type === 'select-layer') {
      setSelectedLayer(action.layer);
      return;
    }
    if ((action.type === 'bring-front' || action.type === 'send-back') && !spreadMeta.hasSelected) {
      handleStepLayerOrder(selectedLayer, action.type === 'bring-front' ? 'up' : 'down');
      return;
    }
    setLayerActionSignal({ id: Date.now(), action });
  };

  // Google Drive Auth & Modal state (in-memory token only)
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveNeedsAuth, setDriveNeedsAuth] = useState(true);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [driveInitialTab, setDriveInitialTab] = useState<'backups' | 'images' | 'all'>('backups');

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (u) => {
        setDriveUser(u);
        setDriveNeedsAuth(!getDriveAccessToken());
      },
      () => {
        setDriveNeedsAuth(true);
      }
    );
    return unsubscribe;
  }, []);

  const totalRawCatalogSpreads = Math.ceil(
    (CROCHET_ALPHABET.length + workspace.patterns.length) / 8
  );
  const catalogSpreadCount = useMemo(() => {
    const hidden = new Set(workspace.hiddenCatalogSpreadIds ?? []);
    let count = 0;
    for (let i = 1; i <= totalRawCatalogSpreads; i++) {
      if (!hidden.has(`catalog-spread-${i}`)) count += 1;
    }
    return count;
  }, [totalRawCatalogSpreads, workspace.hiddenCatalogSpreadIds]);

  // Initial load from IndexedDB
  useEffect(() => {
    void loadWorkspace().then((data) => {
      setWorkspace(data);
      const rawCatCount = Math.ceil((CROCHET_ALPHABET.length + data.patterns.length) / 8);
      const hiddenCat = new Set(data.hiddenCatalogSpreadIds ?? []);
      let visibleCat = 0;
      for (let i = 1; i <= rawCatCount; i++) {
        if (!hiddenCat.has(`catalog-spread-${i}`)) visibleCat += 1;
      }
      setCurrentSpreadIndex(visibleCat);
      audioEngine.setSfxEnabled(data.sfxEnabled);
      setLoaded(true);
    });
  }, []);

  // Auto-persist workspace changes (debounced 900ms for smooth performance)
  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      void saveWorkspace(workspace);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [workspace, loaded]);

  const showToast = useCallback((msg: string) => {
    setSavedToast(msg);
    window.setTimeout(() => setSavedToast(null), 2200);
  }, []);

  const handleToggleSfx = () => {
    const next = !workspace.sfxEnabled;
    audioEngine.setSfxEnabled(next);
    setWorkspace((prev) => ({ ...prev, sfxEnabled: next }));
  };

  const handleOpenBook = useCallback(() => {
    if (bookOpeningTransition) return;
    audioEngine.playBookOpen();
    setBookState('transitioning');
    setBookOpeningTransition(true);
  }, [bookOpeningTransition]);

  const handleBookTransitionMidpoint = useCallback(() => {
    setBookState('studio');
  }, []);

  const handleBookTransitionComplete = useCallback(() => {
    setBookOpeningTransition(false);
  }, []);

  const handleReturnToCover = () => {
    audioEngine.playPageFlip();
    setBookOpeningTransition(false);
    setBookState('cover');
  };

  // Spread update with bounded undo tracking
  const updateCurrentSpread = useCallback((updated: SpreadType) => {
    setWorkspace((prev) => {
      setUndoStack((u) => [
        ...u.slice(-11),
        {
          spreads: prev.spreads,
          hiddenCatalogSpreadIds: prev.hiddenCatalogSpreadIds,
          hiddenMandalaSpreadIds: prev.hiddenMandalaSpreadIds,
        },
      ]);
      setRedoStack([]);
      return {
        ...prev,
        spreads: prev.spreads.map((sp) => (sp.id === updated.id ? updated : sp)),
      };
    });
  }, []);

  const handleAddSpread = () => {
    audioEngine.playSaveChime();
    setUndoStack((prev) => [
      ...prev.slice(-11),
      {
        spreads: workspace.spreads,
        hiddenCatalogSpreadIds: workspace.hiddenCatalogSpreadIds,
        hiddenMandalaSpreadIds: workspace.hiddenMandalaSpreadIds,
      },
    ]);
    setRedoStack([]);
    const newSpread: SpreadType = {
      id: `spread-${Date.now()}`,
      title: `Hoja ${workspace.spreads.length + 1} · Bocetos y Puntos`,
      paperStyle: 'grid',
      elements: [],
      updatedAt: new Date().toISOString(),
    };
    setWorkspace((prev) => {
      const nextSpreads = [...prev.spreads, newSpread];
      setCurrentSpreadIndex(catalogSpreadCount + nextSpreads.length - 1);
      return { ...prev, spreads: nextSpreads };
    });
    setNotebookMode('book');
    setActiveSection('cuaderno');
    showToast('Nueva hoja añadida');
  };

  const handleReorderSpreads = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= workspace.spreads.length ||
        toIndex >= workspace.spreads.length
      ) {
        return;
      }
      audioEngine.playPageFlip();
      setUndoStack((prev) => [
        ...prev.slice(-11),
        {
          spreads: workspace.spreads,
          hiddenCatalogSpreadIds: workspace.hiddenCatalogSpreadIds,
          hiddenMandalaSpreadIds: workspace.hiddenMandalaSpreadIds,
        },
      ]);
      setRedoStack([]);

      const activeEditableIdx =
        notebookMode === 'book' && currentSpreadIndex >= catalogSpreadCount
          ? currentSpreadIndex - catalogSpreadCount
          : -1;
      const activeSpreadId =
        activeEditableIdx >= 0 ? workspace.spreads[activeEditableIdx]?.id ?? null : null;

      const nextSpreads = [...workspace.spreads];
      const [moved] = nextSpreads.splice(fromIndex, 1);
      nextSpreads.splice(toIndex, 0, moved);

      setWorkspace((prev) => ({
        ...prev,
        spreads: nextSpreads,
      }));

      if (activeSpreadId) {
        const nextActiveIdx = nextSpreads.findIndex((sp) => sp.id === activeSpreadId);
        if (nextActiveIdx >= 0) {
          setCurrentSpreadIndex(catalogSpreadCount + nextActiveIdx);
        }
      }

      showToast(
        `«${moved.title}» movida a la posición ${toIndex + 1} (Ctrl+Z para deshacer)`
      );
    },
    [
      workspace.spreads,
      workspace.hiddenCatalogSpreadIds,
      workspace.hiddenMandalaSpreadIds,
      notebookMode,
      currentSpreadIndex,
      catalogSpreadCount,
      showToast,
    ]
  );

  const handleDeleteSpread = useCallback(
    (spreadId?: string) => {
      const target = spreadId
        ? workspace.spreads.find((sp) => sp.id === spreadId) ?? null
        : notebookMode === 'book' && currentSpreadIndex >= catalogSpreadCount
          ? workspace.spreads[currentSpreadIndex - catalogSpreadCount] ?? null
          : null;
      if (!target) {
        showToast('Selecciona un pliego para eliminar');
        return;
      }
      if (workspace.spreads.length <= 1) {
        audioEngine.playToggleChime(false);
        showToast('Debe quedar al menos una hoja editable en el cuaderno');
        return;
      }
      audioEngine.playPageFlip();
      setUndoStack((prev) => [
        ...prev.slice(-11),
        {
          spreads: workspace.spreads,
          hiddenCatalogSpreadIds: workspace.hiddenCatalogSpreadIds,
          hiddenMandalaSpreadIds: workspace.hiddenMandalaSpreadIds,
        },
      ]);
      setRedoStack([]);
      const targetIndexInSpreads = workspace.spreads.findIndex((sp) => sp.id === target.id);
      const nextSpreads = workspace.spreads.filter((sp) => sp.id !== target.id);
      setWorkspace((prev) => ({
        ...prev,
        spreads: prev.spreads.filter((sp) => sp.id !== target.id),
      }));
      const targetGlobalIdx = catalogSpreadCount + targetIndexInSpreads;
      setCurrentSpreadIndex((prevIdx) => {
        const maxAllowed = catalogSpreadCount + nextSpreads.length - 1;
        if (prevIdx > targetGlobalIdx) return Math.max(0, prevIdx - 1);
        return Math.min(prevIdx, maxAllowed);
      });
      showToast('Páginas eliminadas (Ctrl+Z para deshacer)');
    },
    [
      workspace.spreads,
      workspace.hiddenCatalogSpreadIds,
      workspace.hiddenMandalaSpreadIds,
      notebookMode,
      currentSpreadIndex,
      catalogSpreadCount,
      showToast,
    ]
  );

  const handleDeleteCatalogSpread = useCallback(
    (catalogSpreadId: string, visibleIdx: number) => {
      audioEngine.playPageFlip();
      setUndoStack((prev) => [
        ...prev.slice(-11),
        {
          spreads: workspace.spreads,
          hiddenCatalogSpreadIds: workspace.hiddenCatalogSpreadIds,
          hiddenMandalaSpreadIds: workspace.hiddenMandalaSpreadIds,
        },
      ]);
      setRedoStack([]);
      setWorkspace((prev) => {
        const existing = prev.hiddenCatalogSpreadIds ?? [];
        if (existing.includes(catalogSpreadId)) return prev;
        return {
          ...prev,
          hiddenCatalogSpreadIds: [...existing, catalogSpreadId],
        };
      });
      setCurrentSpreadIndex((prevIdx) => {
        const nextTotal = Math.max(1, catalogSpreadCount - 1 + workspace.spreads.length);
        if (prevIdx > visibleIdx) return Math.max(0, prevIdx - 1);
        return Math.min(prevIdx, nextTotal - 1);
      });
      showToast('Pliego de catálogo eliminado (Ctrl+Z para deshacer)');
    },
    [
      workspace.spreads,
      workspace.hiddenCatalogSpreadIds,
      workspace.hiddenMandalaSpreadIds,
      catalogSpreadCount,
      showToast,
    ]
  );

  const handleDeleteMandalaSpread = useCallback(
    (mandalaSpreadId: string, visibleIdx: number, currentTotalMandalaSpreads: number) => {
      audioEngine.playPageFlip();
      setUndoStack((prev) => [
        ...prev.slice(-11),
        {
          spreads: workspace.spreads,
          hiddenCatalogSpreadIds: workspace.hiddenCatalogSpreadIds,
          hiddenMandalaSpreadIds: workspace.hiddenMandalaSpreadIds,
        },
      ]);
      setRedoStack([]);
      setWorkspace((prev) => {
        const existing = prev.hiddenMandalaSpreadIds ?? [];
        if (existing.includes(mandalaSpreadId)) return prev;
        return {
          ...prev,
          hiddenMandalaSpreadIds: [...existing, mandalaSpreadId],
        };
      });
      const remaining = currentTotalMandalaSpreads - 1;
      if (remaining <= 0) {
        setNotebookMode('book');
        setMandalaSpreadIndex(0);
      } else {
        setMandalaSpreadIndex((prevIdx) => {
          if (prevIdx > visibleIdx) return Math.max(0, prevIdx - 1);
          return Math.min(prevIdx, remaining - 1);
        });
      }
      showToast('Pliego de mandalas eliminado (Ctrl+Z para deshacer)');
    },
    [
      workspace.spreads,
      workspace.hiddenCatalogSpreadIds,
      workspace.hiddenMandalaSpreadIds,
      showToast,
    ]
  );

  const handleRestoreHiddenPages = useCallback(() => {
    audioEngine.playSaveChime();
    setUndoStack((prev) => [
      ...prev.slice(-11),
      {
        spreads: workspace.spreads,
        hiddenCatalogSpreadIds: workspace.hiddenCatalogSpreadIds,
        hiddenMandalaSpreadIds: workspace.hiddenMandalaSpreadIds,
      },
    ]);
    setRedoStack([]);
    setWorkspace((prev) => ({
      ...prev,
      hiddenCatalogSpreadIds: [],
      hiddenMandalaSpreadIds: [],
    }));
    showToast('Páginas de catálogo y mandalas restauradas');
  }, [
    workspace.spreads,
    workspace.hiddenCatalogSpreadIds,
    workspace.hiddenMandalaSpreadIds,
    showToast,
  ]);

  const activeEditableSpread =
    notebookMode === 'book' && currentSpreadIndex >= catalogSpreadCount
      ? workspace.spreads[currentSpreadIndex - catalogSpreadCount] ?? null
      : null;
  const canDeleteCurrentSpread = Boolean(activeEditableSpread && workspace.spreads.length > 1);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    audioEngine.playUndoRedo(false);
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((r) => [
      ...r,
      {
        spreads: workspace.spreads,
        hiddenCatalogSpreadIds: workspace.hiddenCatalogSpreadIds,
        hiddenMandalaSpreadIds: workspace.hiddenMandalaSpreadIds,
      },
    ]);
    setUndoStack((u) => u.slice(0, -1));
    setWorkspace((prev) => ({
      ...prev,
      spreads: previous.spreads,
      hiddenCatalogSpreadIds: previous.hiddenCatalogSpreadIds,
      hiddenMandalaSpreadIds: previous.hiddenMandalaSpreadIds,
    }));
  }, [
    undoStack,
    workspace.spreads,
    workspace.hiddenCatalogSpreadIds,
    workspace.hiddenMandalaSpreadIds,
  ]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    audioEngine.playUndoRedo(true);
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [
      ...u,
      {
        spreads: workspace.spreads,
        hiddenCatalogSpreadIds: workspace.hiddenCatalogSpreadIds,
        hiddenMandalaSpreadIds: workspace.hiddenMandalaSpreadIds,
      },
    ]);
    setRedoStack((r) => r.slice(0, -1));
    setWorkspace((prev) => ({
      ...prev,
      spreads: next.spreads,
      hiddenCatalogSpreadIds: next.hiddenCatalogSpreadIds,
      hiddenMandalaSpreadIds: next.hiddenMandalaSpreadIds,
    }));
  }, [
    redoStack,
    workspace.spreads,
    workspace.hiddenCatalogSpreadIds,
    workspace.hiddenMandalaSpreadIds,
  ]);

  const handleSelectToolSmart = useCallback(
    (tool: ActiveCanvasTool) => {
      if (tool === 'text') {
        setActiveSection('cuaderno');
        if (notebookMode === 'mandalas') {
          setNotebookMode('book');
        }
        if (currentSpreadIndex < catalogSpreadCount) {
          setCurrentSpreadIndex(catalogSpreadCount);
        }
        setActiveTool('select');
        setAddTextSignal(Date.now());
        return;
      }
      setActiveTool(tool);
    },
    [notebookMode, currentSpreadIndex, catalogSpreadCount]
  );

  // Global Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z notebook undo-redo shortcuts
  useEffect(() => {
    if (bookState !== 'studio' || activeSection !== 'cuaderno') return;
    const onGlobalKeyDown = (e: KeyboardEvent) => {
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
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [bookState, activeSection, handleUndo, handleRedo]);

  const handleSelectColor = (hex: string) => {
    setBrush((prev) => ({ ...prev, color: hex }));
    setWorkspace((prev) => ({
      ...prev,
      recentColors: [
        hex,
        ...prev.recentColors.filter((c) => c.toUpperCase() !== hex.toUpperCase()),
      ].slice(0, 8),
    }));
  };

  const getActiveEditableSpread = (): SpreadType | null => {
    if (currentSpreadIndex >= catalogSpreadCount) {
      return workspace.spreads[currentSpreadIndex - catalogSpreadCount] ?? workspace.spreads[0] ?? null;
    }
    return workspace.spreads[0] ?? null;
  };

  const insertElementOnCurrentSpread = (el: Omit<PageElement, 'id'>) => {
    const target = getActiveEditableSpread();
    if (!target) return;
    setNotebookMode('book');
    if (currentSpreadIndex < catalogSpreadCount) {
      setCurrentSpreadIndex(catalogSpreadCount);
    }
    const newEl: PageElement = { ...el, id: `el-${Date.now()}` };
    updateCurrentSpread({
      ...target,
      elements: [...target.elements, newEl],
      updatedAt: new Date().toISOString(),
    });
    setActiveSection('cuaderno');
    setActiveTool('select');
  };

  const handleNotebookImageFile = async (file: File) => {
    const dataUrl = await compressImageFile(file, 900);
    insertElementOnCurrentSpread({
      side: 'right',
      type: 'image',
      x: 16,
      y: 22,
      width: 210,
      content: dataUrl,
      title: file.name.replace(/\.[^/.]+$/, ''),
      rotation: -1,
      frameStyle: 'polaroid',
    });
    showToast('Imagen añadida al cuaderno');
  };

  const handleCopyPattern = useCallback(
    (pat: CopiedPatternData) => {
      audioEngine.playStitchClick();
      setCopiedPattern(pat);
      if (pat.mandalaId || pat.imagePath) {
        try {
          void navigator.clipboard
            ?.writeText(`${pat.name} (${pat.abbreviation}) — ${pat.description}`)
            .catch(() => {});
        } catch {
          // ignore clipboard errors inside iframe
        }
        showToast(`Mandala copiado: ${pat.name}`);
      } else {
        showToast(`Símbolo copiado: ${pat.name}`);
      }
    },
    [showToast]
  );

  const handlePastePatternOnSpread = useCallback(
    (
      spreadId: string,
      side: 'left' | 'right' = 'left',
      patternOverride?: CopiedPatternData
    ) => {
      const patToPaste = patternOverride ?? copiedPattern;
      if (!patToPaste) return;
      const target = workspace.spreads.find((sp) => sp.id === spreadId) ?? workspace.spreads[0];
      if (!target) return;

      if (patToPaste.imagePath) {
        const savedExtracted = workspace.extractedMandalas?.[patToPaste.id];
        const existingImages = target.elements.filter(
          (e) => e.side === side && e.type === 'image'
        ).length;
        const col = existingImages % 2;
        const row = Math.floor(existingImages / 2) % 2;
        const newEl: PageElement = {
          id: `el-${Date.now()}`,
          side,
          type: 'image',
          x: 8 + col * 36,
          y: 14 + row * 34,
          width: 210,
          content: savedExtracted
            ? savedExtracted.coloredDataUrl || savedExtracted.baseDataUrl
            : patToPaste.imagePath,
          extractedBaseContent: savedExtracted?.baseDataUrl,
          title: patToPaste.name,
          rotation: 0,
          frameStyle: 'minimal',
        };
        updateCurrentSpread({
          ...target,
          elements: [...target.elements, newEl],
          updatedAt: new Date().toISOString(),
        });
        setNotebookMode('book');
        setActiveTool('select');
        showToast(`Mandala pegado: ${patToPaste.name}`);
        return;
      }

      const isMandala = Boolean(patToPaste.mandalaId);
      const existingSymbols = target.elements.filter(
        (e) => e.side === side && e.type === 'pattern-note'
      ).length;

      let offsetX: number;
      let offsetY: number;
      if (isMandala) {
        const col = existingSymbols % 2;
        const row = Math.floor(existingSymbols / 2) % 3;
        offsetX = 10 + col * 40;
        offsetY = 12 + row * 28;
      } else {
        const cols = 8;
        const col = existingSymbols % cols;
        const row = Math.floor(existingSymbols / cols) % 7;
        offsetX = 10 + col * 9.5;
        offsetY = 14 + row * 10;
      }

      const newEl: PageElement = {
        id: `el-${Date.now()}`,
        side,
        type: 'pattern-note',
        x: offsetX,
        y: offsetY,
        width: isMandala ? 148 : 44,
        content: patToPaste.stitchKey,
        ...(isMandala ? {} : { color: brush.color }),
        patternData: { ...patToPaste },
      };

      updateCurrentSpread({
        ...target,
        elements: [...target.elements, newEl],
        updatedAt: new Date().toISOString(),
      });
      setNotebookMode('book');
      setActiveTool('select');
      showToast(
        isMandala
          ? `Mandala pegado: ${patToPaste.name}`
          : `Símbolo pegado: ${patToPaste.abbreviation || patToPaste.name}`
      );
    },
    [copiedPattern, workspace.spreads, workspace.extractedMandalas, brush.color, updateCurrentSpread, showToast]
  );

  const handleClearPageStrokes = () => {
    if (currentSpreadIndex < catalogSpreadCount) {
      showToast('El catálogo inicial no tiene trazos; ve a Mis Hojas para dibujar');
      return;
    }
    const target = getActiveEditableSpread();
    if (!target) return;
    audioEngine.playEraseBrush();
    updateCurrentSpread({
      ...target,
      leftDrawingDataUrl: undefined,
      rightDrawingDataUrl: undefined,
    });
    showToast('Trazos de la página limpiados');
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as NotebookWorkspaceData;
        if (parsed.spreads && parsed.patterns && parsed.materials) {
          setWorkspace({ ...DEFAULT_WORKSPACE, ...parsed });
          setCurrentSpreadIndex(0);
          showToast('Cuaderno restaurado');
        }
      } catch {
        showToast('Archivo de respaldo inválido');
      }
    };
    reader.readAsText(file);
  };

  // Pattern CRUD
  const handleSavePattern = (pat: CrochetPattern) => {
    setWorkspace((prev) => {
      const exists = prev.patterns.some((p) => p.id === pat.id);
      return {
        ...prev,
        patterns: exists
          ? prev.patterns.map((p) => (p.id === pat.id ? pat : p))
          : [pat, ...prev.patterns],
      };
    });
  };

  const handleDeletePattern = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      patterns: prev.patterns.filter((p) => p.id !== id),
    }));
  };

  const handleSaveExtractedMandala = useCallback(
    (mandalaId: string, record: ExtractedMandalaRecord) => {
      setWorkspace((prev) => {
        const nextMap: Record<string, ExtractedMandalaRecord> = {
          ...(prev.extractedMandalas ?? {}),
          [mandalaId]: record,
        };
        void saveExtractedMandalas(nextMap);
        return {
          ...prev,
          extractedMandalas: nextMap,
        };
      });
    },
    []
  );

  const handleRestoreExtractedMandala = useCallback((mandalaId: string) => {
    setWorkspace((prev) => {
      if (!prev.extractedMandalas || !prev.extractedMandalas[mandalaId]) return prev;
      const nextMap = { ...prev.extractedMandalas };
      delete nextMap[mandalaId];
      void saveExtractedMandalas(nextMap);
      return {
        ...prev,
        extractedMandalas: nextMap,
      };
    });
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1a0f08] text-[#f5e7cf] overflow-hidden">
      {/* Native Windows Title Bar (visible only inside the Windows Electron .exe app) */}
      <ElectronTitleBar />

      {/* Hidden global image input for inserting directly into notebook */}
      <input
        ref={imageUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleNotebookImageFile(f);
          e.target.value = '';
        }}
      />

      {/* Cinematic Book-Opening Yarn Balls & Threads Transition into the Notebook */}
      {bookOpeningTransition && (
        <CrochetTransition
          active
          onMidpointSwitch={handleBookTransitionMidpoint}
          onComplete={handleBookTransitionComplete}
        />
      )}

      {/* Cover Screen */}
      {(bookState === 'cover' || bookState === 'transitioning') && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <CoverScreen
            sfxEnabled={workspace.sfxEnabled}
            onToggleSfx={handleToggleSfx}
            deskNotes={workspace.deskNotes ?? INITIAL_DESK_NOTES}
            onChangeDeskNotes={(deskNotes: DeskNoteItem[]) =>
              setWorkspace((prev) => ({ ...prev, deskNotes }))
            }
            onOpenBook={handleOpenBook}
          />
        </div>
      )}

      {/* Open Studio Workspace: Maximized Book on the LEFT, All Toolbars & Palettes on the RIGHT */}
      {bookState === 'studio' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex-1 min-h-0 w-full flex overflow-hidden leather-studio-bg"
        >
          {/* Focus mode quick exit button */}
          {focusMode && activeSection === 'cuaderno' && (
            <button
              type="button"
              onClick={() => {
                audioEngine.playToggleChime(true);
                setFocusMode(false);
              }}
              aria-label="Mostrar herramientas"
              title="Mostrar herramientas"
              className="fixed top-2 right-2 z-[70] rounded-lg border border-[#d49e58]/70 bg-[#291509]/95 p-1.5 text-[#f8dcaa] shadow-lg hover:bg-[#543016] cursor-pointer"
            >
              <Minimize2 size={16} />
            </button>
          )}

          {/* LEFT MAIN STAGE: Huge Open Notebook or Utility Section */}
          <main className="relative z-10 flex-1 flex min-w-0 min-h-0 overflow-hidden">
            {activeSection === 'cuaderno' && (
              <NotebookSpread
                spreads={workspace.spreads}
                patterns={workspace.patterns}
                currentSpreadIndex={currentSpreadIndex}
                onChangeSpreadIndex={setCurrentSpreadIndex}
                notebookMode={notebookMode}
                onChangeNotebookMode={setNotebookMode}
                mandalaSpreadIndex={mandalaSpreadIndex}
                onChangeMandalaSpreadIndex={setMandalaSpreadIndex}
                onAddSpread={handleAddSpread}
                onDeleteSpread={handleDeleteSpread}
                onReorderSpreads={handleReorderSpreads}
                hiddenCatalogSpreadIds={workspace.hiddenCatalogSpreadIds}
                hiddenMandalaSpreadIds={workspace.hiddenMandalaSpreadIds}
                onDeleteCatalogSpread={handleDeleteCatalogSpread}
                onDeleteMandalaSpread={handleDeleteMandalaSpread}
                onRestoreHiddenPages={handleRestoreHiddenPages}
                onUpdateSpread={updateCurrentSpread}
                activeTool={activeTool}
                onSelectTool={handleSelectToolSmart}
                selectedShapeKind={selectedShapeKind}
                brush={brush}
                onPickColorFromCanvas={(hex) => {
                  handleSelectColor(hex);
                  setActiveTool('draw');
                  showToast(`Color capturado: ${hex}`);
                }}
                selectedFont={workspace.selectedFont}
                extractedMandalas={workspace.extractedMandalas}
                onSaveExtractedMandala={handleSaveExtractedMandala}
                onRestoreExtractedMandala={handleRestoreExtractedMandala}
                copiedPattern={copiedPattern}
                onCopyPattern={handleCopyPattern}
                onPastePatternOnSpread={handlePastePatternOnSpread}
                onPasteExternalImage={(file) => void handleNotebookImageFile(file)}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onPlayPageFlip={() => audioEngine.playPageFlip()}
                onEnterDressingRoom={(season) => {
                  if (season) setVestidorSeason(season);
                  setActiveSection('vestidor');
                }}
                onNotify={showToast}
                dockedMode={!focusMode}
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode((v) => !v)}
                layerVisibility={layerVisibility}
                layerOrder={layerOrder}
                onStepLayerOrder={handleStepLayerOrder}
                layerActionSignal={layerActionSignal}
                cyclePaperSignal={cyclePaperSignal}
                turnPageSignal={turnPageSignal}
                toggleOverviewSignal={toggleOverviewSignal}
                addTextSignal={addTextSignal}
                onConsumeAddTextSignal={() => setAddTextSignal(0)}
                rotateAllSignal={rotateAllSignal}
                zoom={bookZoom}
                onChangeZoom={(next) =>
                  setBookZoom(Math.max(25, Math.min(500, Math.round(next))))
                }
                onSpreadMetaChange={setSpreadMeta}
              />
            )}

            {activeSection === 'patrones' && (
              <PatternsView
                patterns={workspace.patterns}
                onSavePattern={handleSavePattern}
                onDeletePattern={handleDeletePattern}
                onPlayStitchClick={() => audioEngine.playStitchClick()}
                onPinStitchToNotebook={(entry) => {
                  const target = getActiveEditableSpread();
                  const count = target
                    ? target.elements.filter((e) => e.side === 'left' && e.type === 'pattern-note').length
                    : 0;
                  const col = count % 8;
                  const row = Math.floor(count / 8) % 7;
                  insertElementOnCurrentSpread({
                    side: 'left',
                    type: 'pattern-note',
                    x: 10 + col * 9.5,
                    y: 14 + row * 10,
                    width: 44,
                    content: entry.stitchKey,
                    color: brush.color,
                    patternData: {
                      id: entry.id,
                      stitchKey: entry.stitchKey,
                      name: entry.name,
                      abbreviation: entry.abbreviation,
                      description: entry.description,
                      letter: entry.letter,
                      group: entry.group,
                    },
                  });
                  audioEngine.playYarnPluck(3);
                  showToast('Símbolo pegado en el cuaderno');
                }}
                onPinPatternToNotebook={(pat) => {
                  insertElementOnCurrentSpread({
                    side: 'left',
                    type: 'pattern-note',
                    x: 10,
                    y: 16,
                    width: 260,
                    content: pat.title,
                    patternData: {
                      id: pat.id,
                      stitchKey: 'custom',
                      name: pat.title,
                      abbreviation: pat.hookSizeMm,
                      description: `${pat.materialsSummary} · Vuelta ${pat.currentRound}/${pat.steps.length}`,
                      diagramGrid: pat.diagramGrid,
                    },
                  });
                  audioEngine.playYarnPluck(5);
                  showToast('Patrón pegado en el cuaderno');
                }}
              />
            )}

            {activeSection === 'stickers' && (
              <StickersAndImagesView
                onInsertSticker={(stickerId) => {
                  const target = getActiveEditableSpread();
                  const stickerCount = target
                    ? target.elements.filter((e) => e.type === 'sticker').length
                    : 0;
                  const side = stickerCount % 2 === 0 ? 'left' : 'right';
                  const offsetX = 16 + ((stickerCount * 13) % 52);
                  const offsetY = 18 + ((stickerCount * 15) % 54);
                  insertElementOnCurrentSpread({
                    side,
                    type: 'sticker',
                    x: offsetX,
                    y: offsetY,
                    width: 108,
                    content: stickerId,
                    rotation: (stickerCount % 3 - 1) * 5,
                  });
                  audioEngine.playYarnPluck(stickerCount);
                  showToast('Sticker añadido al cuaderno');
                }}
                onUploadImageToNotebook={() => imageUploadRef.current?.click()}
              />
            )}

            {activeSection === 'gifs' && (
              <CrochetGifsView
                onInsertGif={(dataUrl, title) => {
                  const target = getActiveEditableSpread();
                  const imgCount = target
                    ? target.elements.filter((e) => e.type === 'image').length
                    : 0;
                  const side = imgCount % 2 === 0 ? 'right' : 'left';
                  const offsetX = 14 + ((imgCount * 15) % 46);
                  const offsetY = 16 + ((imgCount * 17) % 48);
                  insertElementOnCurrentSpread({
                    side,
                    type: 'image',
                    x: offsetX,
                    y: offsetY,
                    width: 148,
                    content: dataUrl,
                    title,
                    rotation: 0,
                    frameStyle: 'minimal',
                  });
                  showToast(`GIF animado pegado: ${title}`);
                }}
                onNotify={showToast}
                onReturnToNotebook={() => setActiveSection('cuaderno')}
              />
            )}

            {activeSection === 'fuentes' && (
              <FontsView
                selectedFont={workspace.selectedFont}
                onSelectFont={(font: FontChoice) =>
                  setWorkspace((prev) => ({ ...prev, selectedFont: font }))
                }
              />
            )}

            {activeSection === 'pinceles' && (
              <BrushesQuickView
                brush={brush}
                onChangeBrush={(patch) => setBrush((prev) => ({ ...prev, ...patch }))}
                onActivateDrawMode={() => {
                  setActiveTool('draw');
                  setActiveSection('cuaderno');
                }}
              />
            )}

            {activeSection === 'vestidor' && (
              <GoldenDressingRoomView
                activeSeason={vestidorSeason}
                onChangeSeason={setVestidorSeason}
                customGarments={workspace.wardrobeItems ?? []}
                finishedProjects={workspace.projects}
                onAddCustomGarment={(garment: DressingRoomGarment) => {
                  setWorkspace((prev) => ({
                    ...prev,
                    wardrobeItems: [garment, ...(prev.wardrobeItems ?? [])],
                  }));
                }}
                onDeleteCustomGarment={(id: string) => {
                  setWorkspace((prev) => ({
                    ...prev,
                    wardrobeItems: (prev.wardrobeItems ?? []).filter((g) => g.id !== id),
                  }));
                  showToast('Prenda retirada del vestidor');
                }}
                onSelectBrushColor={(hex) => {
                  handleSelectColor(hex);
                }}
                onPinGarmentToNotebook={(garment) => {
                  const target = getActiveEditableSpread();
                  if (target) {
                    setNotebookMode('book');
                    if (currentSpreadIndex < catalogSpreadCount) {
                      setCurrentSpreadIndex(catalogSpreadCount);
                    }
                    const ts = Date.now();
                    const newElements: PageElement[] = [];
                    if (garment.photoDataUrl) {
                      newElements.push({
                        id: `el-${ts}-img`,
                        side: 'right',
                        type: 'image',
                        x: 10,
                        y: 10,
                        width: 195,
                        content: garment.photoDataUrl,
                        title: garment.name,
                        frameStyle: 'gold',
                      });
                    }
                    newElements.push({
                      id: `el-${ts}-spec`,
                      side: 'right',
                      type: 'text',
                      x: 10,
                      y: garment.photoDataUrl ? 56 : 14,
                      width: 265,
                      content: `${garment.name}\n• Fibra: ${garment.fiber}${garment.fiberDetail ? ` (${garment.fiberDetail})` : ''}\n• Ganchillo: ${garment.hookSizeMm}\n• Puntada: ${garment.stitchNote}`,
                      color: '#4c290a',
                      fontSize: 16,
                      fontFamily: 'cormorant',
                      backgroundColor: 'rgba(251, 236, 212, 0.92)',
                    });
                    updateCurrentSpread({
                      ...target,
                      elements: [...target.elements, ...newElements],
                      updatedAt: new Date().toISOString(),
                    });
                    setActiveTool('select');
                  }
                  setActiveSection('cuaderno');
                  showToast(`Prenda y ficha llevadas al cuaderno: ${garment.name}`);
                }}
                onBackToNotebook={() => setActiveSection('cuaderno')}
                onNotify={showToast}
              />
            )}

            {activeSection === 'configuracion' && (
              <SettingsView
                sfxEnabled={workspace.sfxEnabled}
                onToggleSfx={handleToggleSfx}
                onExportBackup={() => {
                  exportWorkspaceJson(workspace);
                  showToast('Respaldo exportado');
                }}
                onImportBackup={handleImportBackup}
                onResetDemoData={() => {
                  setWorkspace(DEFAULT_WORKSPACE);
                  setCurrentSpreadIndex(0);
                  showToast('Cuaderno inicial restaurado');
                }}
              />
            )}
          </main>

          {/* UNIFIED RIGHT STUDIO DOCK (Desktop inline + Mobile slide drawer — hidden in Vestidor Dorado) */}
          {!focusMode && activeSection !== 'vestidor' && (
            <>
              {/* Desktop Unified Right Studio Dock */}
              <div className="relative z-30 hidden lg:flex h-full shrink-0">
                <RightStudioDock
                  activeSection={activeSection}
                  activeTool={activeTool}
                  selectedShapeKind={selectedShapeKind}
                  brush={brush}
                  recentColors={workspace.recentColors}
                  paperStyle={spreadMeta.paperStyle}
                  isCatalogSpread={spreadMeta.isCatalog}
                  activeSpreadTitle={spreadMeta.title}
                  currentSpreadIndex={
                    notebookMode === 'mandalas' ? mandalaSpreadIndex : currentSpreadIndex
                  }
                  totalBookSpreads={spreadMeta.totalBookSpreads}
                  catalogCount={spreadMeta.catalogCount}
                  zoom={bookZoom}
                  showOverview={spreadMeta.showOverview}
                  hasSelectedElement={spreadMeta.hasSelected}
                  hasDrawings={spreadMeta.hasDrawings}
                  hasElements={spreadMeta.hasElements}
                  allRotateAngle={spreadMeta.allRotateAngle}
                  layerVisibility={layerVisibility}
                  layerOrder={layerOrder}
                  selectedLayer={selectedLayer}
                  canUndo={undoStack.length > 0}
                  canRedo={redoStack.length > 0}
                  driveConnected={!driveNeedsAuth && driveUser !== null}
                  sfxEnabled={workspace.sfxEnabled}
                  focusMode={focusMode}
                  savedToast={savedToast}
                  onSelectColor={handleSelectColor}
                  onChangeBrush={(patch) => setBrush((prev) => ({ ...prev, ...patch }))}
                  onSelectTool={handleSelectToolSmart}
                  onSelectShapeKind={setSelectedShapeKind}
                  onGoToSection={(sec) => setActiveSection(sec)}
                  notebookMode={notebookMode}
                  onOpenMandalasSection={() => {
                    setActiveSection('cuaderno');
                    setNotebookMode('mandalas');
                  }}
                  onOpenBookSection={() => {
                    setActiveSection('cuaderno');
                    setNotebookMode('book');
                  }}
                  onToggleLayerVisibility={(layer) =>
                    setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }))
                  }
                  onCyclePaperStyle={() => setCyclePaperSignal((c) => c + 1)}
                  onLayerAction={handleDockLayerAction}
                  onNewPage={handleAddSpread}
                  onDeletePage={() => handleDeleteSpread()}
                  canDeleteCurrentSpread={canDeleteCurrentSpread}
                  onImportBackup={handleImportBackup}
                  onSaveNow={() => {
                    void saveWorkspace(workspace);
                    showToast('Cuaderno guardado');
                  }}
                  onExportBackup={() => {
                    exportWorkspaceJson(workspace);
                    showToast('Respaldo exportado');
                  }}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onOpenImageUpload={() => imageUploadRef.current?.click()}
                  onInsertMannequin={(view) => {
                    const gender = view === 'back' ? 'female' : 'male';
                    insertElementOnCurrentSpread({
                      side: gender === 'male' ? 'left' : 'right',
                      type: 'mannequin',
                      x: gender === 'male' ? 6 : 50,
                      y: 9,
                      width: 192,
                      content: 'front',
                      mannequinGender: gender,
                      mannequinYawDeg: 0,
                      color: 'natural',
                      opacity: 1,
                      title: gender === 'male' ? 'Maniquí Hombre 360°' : 'Maniquí Mujer 360°',
                    });
                    setActiveSection('cuaderno');
                    setActiveTool('select');
                    showToast(
                      gender === 'male'
                        ? 'Maniquí Hombre 360° añadido'
                        : 'Maniquí Mujer 360° añadido'
                    );
                  }}
                  onInsertWardrobe={() => {
                    insertElementOnCurrentSpread({
                      side: 'left',
                      type: 'wardrobe',
                      x: 7,
                      y: 9,
                      width: 390,
                      content: 'closed',
                      opacity: 1,
                      title: 'Armario Barroco de Crochet',
                    });
                    setActiveSection('cuaderno');
                    setActiveTool('select');
                    showToast('Armario 3D añadido a la hoja izquierda');
                  }}
                  onOpenDrive={(tab = 'backups') => {
                    setDriveInitialTab(tab);
                    setDriveModalOpen(true);
                  }}
                  onOpenHelp={() => setShowHelp(true)}
                  onReturnToCover={handleReturnToCover}
                  onToggleSfx={handleToggleSfx}
                  onToggleFocusMode={() => setFocusMode((v) => !v)}
                  onChangeSpreadIndex={setCurrentSpreadIndex}
                  onTurnPage={(dir) => setTurnPageSignal({ id: Date.now(), dir })}
                  onChangeZoom={(delta) =>
                    setBookZoom((z) => Math.max(25, Math.min(500, z + delta)))
                  }
                  onToggleOverview={() => setToggleOverviewSignal((c) => c + 1)}
                  onUpdateSpreadTitle={(title) => {
                    const target = getActiveEditableSpread();
                    if (target) {
                      updateCurrentSpread({ ...target, title });
                    }
                  }}
                  onRotateAllElements={(mode, value) =>
                    setRotateAllSignal({ id: Date.now(), mode, value })
                  }
                  onClearPageStrokes={handleClearPageStrokes}
                />
              </div>

              {/* Mobile / Tablet Compact Drawer Trigger & Slide-Over Dock (< lg) */}
              {!showMobileDock && (
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playStitchClick();
                    setShowMobileDock(true);
                  }}
                  aria-label="Abrir herramientas"
                  title="Abrir herramientas"
                  className="lg:hidden fixed top-2 right-2 z-40 rounded-lg border border-[#d49e58]/70 bg-[#291509]/95 p-2 text-[#f8dcaa] shadow-lg hover:bg-[#543016] cursor-pointer"
                >
                  <SlidersHorizontal size={16} />
                </button>
              )}

              <AnimatePresence>
                {showMobileDock && (
                  <div className="lg:hidden">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowMobileDock(false)}
                      className="fixed inset-0 bg-black/45 z-40"
                    />
                    <div className="fixed right-1.5 top-1 bottom-1 z-50 flex">
                      <RightStudioDock
                        activeSection={activeSection}
                        activeTool={activeTool}
                        selectedShapeKind={selectedShapeKind}
                        brush={brush}
                        recentColors={workspace.recentColors}
                        paperStyle={spreadMeta.paperStyle}
                        isCatalogSpread={spreadMeta.isCatalog}
                        activeSpreadTitle={spreadMeta.title}
                        currentSpreadIndex={
                          notebookMode === 'mandalas' ? mandalaSpreadIndex : currentSpreadIndex
                        }
                        totalBookSpreads={spreadMeta.totalBookSpreads}
                        catalogCount={spreadMeta.catalogCount}
                        zoom={bookZoom}
                        showOverview={spreadMeta.showOverview}
                        hasSelectedElement={spreadMeta.hasSelected}
                        hasDrawings={spreadMeta.hasDrawings}
                        hasElements={spreadMeta.hasElements}
                        allRotateAngle={spreadMeta.allRotateAngle}
                        layerVisibility={layerVisibility}
                        layerOrder={layerOrder}
                        selectedLayer={selectedLayer}
                        canUndo={undoStack.length > 0}
                        canRedo={redoStack.length > 0}
                        driveConnected={!driveNeedsAuth && driveUser !== null}
                        sfxEnabled={workspace.sfxEnabled}
                        focusMode={focusMode}
                        savedToast={savedToast}
                        onSelectColor={handleSelectColor}
                        onChangeBrush={(patch) => setBrush((prev) => ({ ...prev, ...patch }))}
                        onSelectTool={handleSelectToolSmart}
                        onSelectShapeKind={setSelectedShapeKind}
                        onGoToSection={(sec) => {
                          setActiveSection(sec);
                          if (sec !== 'cuaderno') setShowMobileDock(false);
                        }}
                        notebookMode={notebookMode}
                        onOpenMandalasSection={() => {
                          setActiveSection('cuaderno');
                          setNotebookMode('mandalas');
                          setShowMobileDock(false);
                        }}
                        onOpenBookSection={() => {
                          setActiveSection('cuaderno');
                          setNotebookMode('book');
                        }}
                        onToggleLayerVisibility={(layer) =>
                          setLayerVisibility((prev) => ({ ...prev, [layer]: !prev[layer] }))
                        }
                        onCyclePaperStyle={() => setCyclePaperSignal((c) => c + 1)}
                        onLayerAction={handleDockLayerAction}
                        onNewPage={handleAddSpread}
                        onDeletePage={() => handleDeleteSpread()}
                        canDeleteCurrentSpread={canDeleteCurrentSpread}
                        onImportBackup={handleImportBackup}
                        onSaveNow={() => {
                          void saveWorkspace(workspace);
                          showToast('Cuaderno guardado');
                        }}
                        onExportBackup={() => {
                          exportWorkspaceJson(workspace);
                          showToast('Respaldo exportado');
                        }}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        onOpenImageUpload={() => imageUploadRef.current?.click()}
                        onInsertMannequin={(view) => {
                          const gender = view === 'back' ? 'female' : 'male';
                          insertElementOnCurrentSpread({
                            side: gender === 'male' ? 'left' : 'right',
                            type: 'mannequin',
                            x: gender === 'male' ? 6 : 50,
                            y: 9,
                            width: 192,
                            content: 'front',
                            mannequinGender: gender,
                            mannequinYawDeg: 0,
                            color: 'natural',
                            opacity: 1,
                            title: gender === 'male' ? 'Maniquí Hombre 360°' : 'Maniquí Mujer 360°',
                          });
                          setActiveSection('cuaderno');
                          setActiveTool('select');
                          setShowMobileDock(false);
                          showToast(
                            gender === 'male'
                              ? 'Maniquí Hombre 360° añadido'
                              : 'Maniquí Mujer 360° añadido'
                          );
                        }}
                        onInsertWardrobe={() => {
                          insertElementOnCurrentSpread({
                            side: 'left',
                            type: 'wardrobe',
                            x: 7,
                            y: 9,
                            width: 390,
                            content: 'closed',
                            opacity: 1,
                            title: 'Armario Barroco de Crochet',
                          });
                          setActiveSection('cuaderno');
                          setActiveTool('select');
                          setShowMobileDock(false);
                          showToast('Armario 3D añadido a la hoja izquierda');
                        }}
                        onOpenDrive={(tab = 'backups') => {
                          setDriveInitialTab(tab);
                          setDriveModalOpen(true);
                        }}
                        onOpenHelp={() => setShowHelp(true)}
                        onReturnToCover={handleReturnToCover}
                        onToggleSfx={handleToggleSfx}
                        onToggleFocusMode={() => setFocusMode((v) => !v)}
                        onChangeSpreadIndex={setCurrentSpreadIndex}
                        onTurnPage={(dir) => setTurnPageSignal({ id: Date.now(), dir })}
                        onChangeZoom={(delta) =>
                          setBookZoom((z) => Math.max(25, Math.min(500, z + delta)))
                        }
                        onToggleOverview={() => setToggleOverviewSignal((c) => c + 1)}
                        onUpdateSpreadTitle={(title) => {
                          const target = getActiveEditableSpread();
                          if (target) {
                            updateCurrentSpread({ ...target, title });
                          }
                        }}
                        onRotateAllElements={(mode, value) =>
                          setRotateAllSignal({ id: Date.now(), mode, value })
                        }
                        onClearPageStrokes={handleClearPageStrokes}
                        onCloseMobileDrawer={() => setShowMobileDock(false)}
                      />
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <GoogleDriveModal
        isOpen={driveModalOpen}
        initialTab={driveInitialTab}
        onClose={() => setDriveModalOpen(false)}
        workspace={workspace}
        needsAuth={driveNeedsAuth}
        user={driveUser}
        onAuthChanged={(u, needs) => {
          setDriveUser(u);
          setDriveNeedsAuth(needs);
        }}
        onRestoreWorkspace={(data) => {
          setWorkspace({ ...DEFAULT_WORKSPACE, ...data });
          setCurrentSpreadIndex(0);
          setActiveSection('cuaderno');
        }}
        onInsertDriveImage={handleNotebookImageFile}
        onNotify={showToast}
      />

      <OfflineIndicator />
    </div>
  );
}
