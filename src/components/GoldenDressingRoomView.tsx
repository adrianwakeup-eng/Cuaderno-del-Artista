import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Download,
  Eye,
  Focus,
  Gauge,
  History,
  Layers,
  Maximize2,
  Minimize2,
  Palette,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Sun,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  DressingRoomCategory,
  DressingRoomGarment,
  FinishedProject,
  VestidorDecorElement,
  VestidorHistoryEntry,
  VestidorPreferences,
  VestidorSpinSpeed,
} from '../types/crochet';
import { YARN_BALL_COLORS, type YarnBallColorOption } from '../data/glbAssetManifest';
import { COLECCION_FUENTES_NAZCO_DESIGNS } from '../data/coleccionFuentesNazco';
import {
  STUDIO_LIGHT_ORDER,
  STUDIO_LIGHT_PRESETS,
  type BodyMeasurements,
  type GraphicsQualityLevel,
  type StudioLightPresetId,
} from '../utils/atelierMannequin3D';
import {
  isPosePhotographedForSelection,
  loadVestidorManifests,
  OFFICIAL_MODEL_MANIFEST,
  OUTFIT_PHOTO_MANIFESTS,
  PHOTO_POSES,
  type VestidorManifestBundle,
} from '../data/vestidorPhotoManifest';
import { VitruvianMan3D, type VitruvianMan3DHandle } from './VitruvianMan3D';
import {
  ArtisanCrochetCornerDecor,
  ArtisanYarnBallSwatch,
  ArtisanYarnHooksEmblem,
} from './ArtisanCrochetDecorations';
import { DesignEditorModal, NEW_CATALOG_CATEGORIES } from './DesignEditorModal';
import {
  CatalogDesignCard,
  CatalogFilterBar,
  type CatalogSortMode,
} from './CatalogPanelWidgets';
import { OutfitComparisonModal } from './OutfitComparisonModal';
import { DetailInspectorModal } from './DetailInspectorModal';
import { CatalogHistoryDrawer } from './CatalogHistoryDrawer';
import { VestidorSettingsDrawer } from './VestidorSettingsDrawer';
import { VestidorDecorCanvas } from './VestidorDecorCanvas';
import { createDefaultStageDecorations } from './VestidorDecorAssets';
import { useSystemReducedMotion } from '../hooks/useReducedMotion';
import { audioEngine } from '../utils/audioEngine';
import {
  compressImageFile,
  loadVestidorCatalog,
  loadVestidorDecorations,
  loadVestidorPreferences,
  loadVestidorTrash,
  saveVestidorCatalog,
  saveVestidorDecorations,
  saveVestidorPreferences,
  saveVestidorTrash,
} from '../utils/storage';

type LeftCrochetTool = 'prendas' | 'colores' | 'poses' | 'girar' | 'zoom' | 'foto';

const DEFAULT_MEASUREMENTS: BodyMeasurements = {
  chest: 1.0,
  shoulders: 1.0,
  waist: 1.0,
  height: 1.0,
};

const EMPTY_CATALOG_MESSAGE =
  '🧶 Nuestra nueva colección está en preparación. ¡Pronto añadiremos nuevos diseños!';

const SPIN_SPEED_ORDER: VestidorSpinSpeed[] = ['lento', 'normal', 'rapido'];
const SPIN_SPEED_SHORT: Record<VestidorSpinSpeed, string> = {
  lento: '0.5×',
  normal: '1×',
  rapido: '2×',
};

const OFFICIAL_TURNAROUND_TILES = [
  {
    id: 'front',
    label: 'Frente',
    angleDeg: 0,
    src: '/vestidor/modelo-oficial/frente.png',
  },
  {
    id: 'profile-left',
    label: 'Perfil Izq.',
    angleDeg: 90,
    src: '/vestidor/modelo-oficial/perfil-izquierdo.png',
  },
  {
    id: 'back',
    label: 'Espalda',
    angleDeg: 180,
    src: '/vestidor/modelo-oficial/espalda.png',
  },
  {
    id: 'profile-right',
    label: 'Perfil Der.',
    angleDeg: 270,
    src: '/vestidor/modelo-oficial/perfil-derecho.png',
  },
] as const;

/* Reusable high-resolution 9-slice crochet & wood material styles */
const WOOD_PLAQUE_STYLE: React.CSSProperties = {
  borderStyle: 'solid',
  borderWidth: '14px 26px',
  borderImageSource: "url('/vestidor/artisan/wood-plaque.png')",
  borderImageSlice: '145 250 145 250 fill',
  borderImageWidth: '16px 30px',
  borderImageRepeat: 'stretch',
  filter: 'drop-shadow(0 7px 14px rgba(56, 24, 8, 0.42))',
};

const MINT_PANEL_STYLE: React.CSSProperties = {
  borderStyle: 'solid',
  borderWidth: '18px 16px',
  borderImageSource: "url('/vestidor/artisan/mint-panel.png')",
  borderImageSlice: '126 126 126 126 fill',
  borderImageWidth: '20px 18px',
  borderImageRepeat: 'round',
  filter: 'drop-shadow(0 10px 20px rgba(48, 30, 16, 0.34))',
};

const CREAM_ROPE_FRAME_STYLE: React.CSSProperties = {
  borderStyle: 'solid',
  borderWidth: '11px',
  borderImageSource: "url('/vestidor/artisan/cream-rope-frame.png')",
  borderImageSlice: '110 110 110 110 fill',
  borderImageWidth: '12px',
  borderImageRepeat: 'round',
  filter: 'drop-shadow(0 8px 16px rgba(68, 34, 16, 0.24))',
};

const PINK_PANEL_STYLE: React.CSSProperties = {
  borderStyle: 'solid',
  borderWidth: '24px',
  borderImageSource: "url('/vestidor/artisan/pink-panel.png')",
  borderImageSlice: '142 142 142 142 fill',
  borderImageWidth: '26px',
  borderImageRepeat: 'round',
  filter: 'drop-shadow(0 12px 24px rgba(72, 30, 20, 0.32))',
};

const CREAM_BUTTON_STYLE: React.CSSProperties = {
  borderStyle: 'solid',
  borderWidth: '10px 11px',
  borderImageSource: "url('/vestidor/artisan/cream-button.png')",
  borderImageSlice: '108 112 108 112 fill',
  borderImageWidth: '12px 13px',
  borderImageRepeat: 'stretch',
  filter: 'drop-shadow(0 4px 7px rgba(46, 36, 18, 0.28))',
};

const GOLD_PILL_BUTTON_STYLE: React.CSSProperties = {
  borderStyle: 'solid',
  borderWidth: '10px 16px',
  borderImageSource: "url('/vestidor/artisan/gold-pill.png')",
  borderImageSlice: '122 175 122 175 fill',
  borderImageWidth: '12px 18px',
  borderImageRepeat: 'stretch',
  filter: 'drop-shadow(0 5px 10px rgba(112, 62, 8, 0.42))',
};

const GOLD_TILE_ACTIVE_STYLE: React.CSSProperties = {
  borderStyle: 'solid',
  borderWidth: '9px 10px',
  borderImageSource: "url('/vestidor/artisan/gold-pill.png')",
  borderImageSlice: '120 165 120 165 fill',
  borderImageWidth: '10px 11px',
  borderImageRepeat: 'stretch',
  filter: 'drop-shadow(0 4px 8px rgba(98, 52, 8, 0.38))',
};

const WALNUT_WOOD_BG_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, rgba(84,32,26,0.68) 0%, rgba(56,20,18,0.78) 100%), url('/vestidor/artisan/walnut-wood.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

const WOOD_ARROW_BTN_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, rgba(118,66,32,0.55) 0%, rgba(64,30,12,0.72) 100%), url('/vestidor/artisan/walnut-wood.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  boxShadow:
    'inset 0 1px 0 rgba(255,222,172,0.45), inset 0 -2px 4px rgba(32,12,4,0.6), 0 6px 14px rgba(62,28,12,0.4)',
};

/** Crisp garment category icons matching the wooden burgundy-and-gold category tabs */
const CategoryGarmentIcon: React.FC<{ category: DressingRoomCategory; active: boolean }> = ({
  category,
  active,
}) => {
  const stroke = active ? '#4a2208' : '#fdf0de';
  switch (category) {
    case 'Camisas':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5L4.5 9L7.5 13L9.5 11.5V23H18.5V11.5L20.5 13L23.5 9L19 5L16.5 7.5H11.5L9 5Z" />
          <path d="M14 7.5V13.5" />
        </svg>
      );
    case 'Suéteres':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 5.5C11 7 17 7 18.5 5.5L23.5 9.5L22 22H18.5V12V23H9.5V12V22H6L4.5 9.5L9.5 5.5Z" />
          <path d="M10.5 12.5H17.5M10.5 16H17.5" strokeDasharray="2 2" />
        </svg>
      );
    case 'Cárdigans':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 5L4 9.5L6.5 22H9.5V11.5V23H18.5V11.5V22H21.5L24 9.5L18.5 5L14 11.5L9.5 5Z" />
          <path d="M14 11.5V23" />
        </svg>
      );
    case 'Chalecos':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5L6.5 8.5C8 10.5 8 13 6.5 14.5L7.5 23L14 20.5L20.5 23L21.5 14.5C20 13 20 10.5 21.5 8.5L19 5L14 12.5L9 5Z" />
          <path d="M14 12.5V20.5" />
        </svg>
      );
    case 'Shorts':
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 6.5H21.5L23 21.5H15.8L14 14.5L12.2 21.5H5L6.5 6.5Z" />
          <path d="M6.5 10H21.5" />
        </svg>
      );
    case 'Pantalones':
    default:
      return (
        <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 5H20L21.5 23.5H16L14 13L12 23.5H6.5L8 5Z" />
          <path d="M8 8.5H20" />
        </svg>
      );
  }
};

interface GoldenDressingRoomViewProps {
  customGarments: DressingRoomGarment[];
  finishedProjects: FinishedProject[];
  onAddCustomGarment: (garment: DressingRoomGarment) => void;
  onDeleteCustomGarment: (id: string) => void;
  onSelectBrushColor: (hex: string) => void;
  onPinGarmentToNotebook: (garment: DressingRoomGarment) => void;
  onBackToNotebook: () => void;
  onNotify: (msg: string) => void;
}

export const GoldenDressingRoomView: React.FC<GoldenDressingRoomViewProps> = ({
  onSelectBrushColor,
  onPinGarmentToNotebook,
  onBackToNotebook,
  onNotify,
}) => {
  const rootStageRef = useRef<HTMLDivElement>(null);
  const viewer3DRef = useRef<VitruvianMan3DHandle>(null);
  const yarnScrollRef = useRef<HTMLDivElement>(null);
  const uploadStudioPhotoRef = useRef<HTMLInputElement>(null);
  const systemReducedMotion = useSystemReducedMotion();

  // Persistent user preferences (sound OFF by default!)
  const [preferences, setPreferences] = useState<VestidorPreferences>(() =>
    loadVestidorPreferences()
  );

  // Persistent catalog seeded with the 24 real Crochet Fuentes Nazco designs (user edits/deletes are preserved)
  const [catalogDesigns, setCatalogDesigns] = useState<DressingRoomGarment[]>(
    () => COLECCION_FUENTES_NAZCO_DESIGNS
  );
  const [trashDesigns, setTrashDesigns] = useState<DressingRoomGarment[]>([]);
  const [historyEntries, setHistoryEntries] = useState<VestidorHistoryEntry[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Official 2.5D photographic male model manifest
  const [manifestBundle, setManifestBundle] = useState<VestidorManifestBundle>(() => ({
    model: OFFICIAL_MODEL_MANIFEST,
    poses: PHOTO_POSES,
    outfits: OUTFIT_PHOTO_MANIFESTS,
  }));

  const [activeCategory, setActiveCategory] = useState<DressingRoomCategory>('Camisas');
  const [activeLeftTool, setActiveLeftTool] = useState<LeftCrochetTool>('prendas');

  // Catalog search, filter, sort & drag-reorder state
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<CatalogSortMode>('manual');
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragTargetCardId, setDragTargetCardId] = useState<string | null>(null);
  const [catalogFileDragOver, setCatalogFileDragOver] = useState<boolean>(false);

  // Active worn selection: opens showcasing flagship crochet shirt (click "Quitar ropa" anytime for base 4-view model)
  const [selectedTopId, setSelectedTopId] = useState<string | null>(
    'fn-col-camisa-guayabera-terracota'
  );
  const [selectedBottomId, setSelectedBottomId] = useState<string | null>(null);
  const [showClothing, setShowClothing] = useState<boolean>(true);

  const [activeYarnColorId, setActiveYarnColorId] = useState<string>('crema');
  const [topColorOverride, setTopColorOverride] = useState<string[] | null>(null);
  const [bottomColorOverride, setBottomColorOverride] = useState<string[] | null>(null);

  const [poseIndex, setPoseIndex] = useState<number>(0);
  const [isSpinning360, setIsSpinning360] = useState<boolean>(false);
  const [isAnimatingPose, setIsAnimatingPose] = useState<boolean>(false);
  const [knitRelief, setKnitRelief] = useState<boolean>(true);
  const [lightPreset, setLightPreset] = useState<StudioLightPresetId>('vestidor_lujo');
  const [qualityLevel, setQualityLevel] = useState<GraphicsQualityLevel>('alto');
  const [measurements, setMeasurements] = useState<BodyMeasurements>(DEFAULT_MEASUREMENTS);
  const [yawDeg, setYawDeg] = useState<number>(0);
  const [viewerZoom, setViewerZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [cleanPhotoMode, setCleanPhotoMode] = useState<boolean>(false);

  // Modals & Drawers
  const [editorModalOpen, setEditorModalOpen] = useState<boolean>(false);
  const [editingGarment, setEditingGarment] = useState<DressingRoomGarment | null>(null);
  const [poseDrawerOpen, setPoseDrawerOpen] = useState<boolean>(false);
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState<boolean>(false);
  const [comparisonOpen, setComparisonOpen] = useState<boolean>(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState<boolean>(false);
  const [detailInspectorGarment, setDetailInspectorGarment] = useState<DressingRoomGarment | null>(
    null
  );
  const [detailInspectorOpen, setDetailInspectorOpen] = useState<boolean>(false);
  const [customStudioPhotoName, setCustomStudioPhotoName] = useState<string | null>(null);

  // Visual Decoration Edit Mode (copy, paste, duplicate, move, resize, rotate, lock, hide & organize decor)
  const [decorEditMode, setDecorEditMode] = useState<boolean>(false);
  const [decorItems, setDecorItems] = useState<VestidorDecorElement[]>(() =>
    createDefaultStageDecorations()
  );
  // Framing Golden Macramé Curtains & Animated Background Vintage Sewing Machine
  const [curtainsOpen, setCurtainsOpen] = useState<boolean>(true);
  const [sewingPaused, setSewingPaused] = useState<boolean>(false);

  const effectiveReducedMotion =
    systemReducedMotion || preferences.reduceMotion || preferences.performanceMode === 'ahorro';
  const effectiveQuality: GraphicsQualityLevel =
    preferences.performanceMode === 'ahorro'
      ? 'medio'
      : preferences.performanceMode === 'alto'
        ? 'ultra'
        : qualityLevel;

  // Optional Vestidor sound helper (STRICTLY SILENT unless preferences.soundEnabled === true!)
  const playSfx = useCallback(
    (kind: 'click' | 'pluck' | 'save' | 'toggleOn' | 'toggleOff' | 'doorClose') => {
      if (!preferences.soundEnabled) return;
      if (kind === 'pluck') audioEngine.playYarnPluck(3);
      else if (kind === 'save') audioEngine.playSaveChime();
      else if (kind === 'toggleOn') audioEngine.playToggleChime(true);
      else if (kind === 'toggleOff') audioEngine.playToggleChime(false);
      else if (kind === 'doorClose') audioEngine.playWardrobeDoor(false);
      else audioEngine.playStitchClick();
    },
    [preferences.soundEnabled]
  );

  const updatePreferences = useCallback((patch: Partial<VestidorPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...patch };
      saveVestidorPreferences(next);
      return next;
    });
  }, []);

  useEffect(() => {
    let alive = true;
    const SEED_FLAG = 'vestidor_coleccion_fuentes_nazco_seeded_v1';
    void Promise.all([loadVestidorCatalog(), loadVestidorTrash(), loadVestidorDecorations()])
      .then(([items, trashed, savedDecor]) => {
        if (!alive) return;
        let finalCatalog = items;
        let alreadySeeded = false;
        try {
          alreadySeeded = localStorage.getItem(SEED_FLAG) === '1';
        } catch {
          alreadySeeded = false;
        }

        if (!alreadySeeded || items.length === 0) {
          const existingIds = new Set(items.map((d) => d.id));
          const trashedIds = new Set(trashed.map((d) => d.id));
          const missingSeed = COLECCION_FUENTES_NAZCO_DESIGNS.filter(
            (d) => !existingIds.has(d.id) && !trashedIds.has(d.id)
          );
          if (missingSeed.length > 0) {
            finalCatalog = [...items, ...missingSeed];
            void saveVestidorCatalog(finalCatalog);
          }
          try {
            localStorage.setItem(SEED_FLAG, '1');
          } catch {
            // ignore storage errors
          }
        }

        setCatalogDesigns(finalCatalog);
        setTrashDesigns(trashed);
        if (savedDecor !== null) {
          setDecorItems(savedDecor);
        }
        setCatalogLoaded(true);
      })
      .catch(() => {
        if (alive) setCatalogLoaded(true);
      });

    void loadVestidorManifests()
      .then((loaded) => {
        if (alive) setManifestBundle(loaded);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ESC exits Clean Photo Mode cleanly
  useEffect(() => {
    if (!cleanPhotoMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCleanPhotoMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cleanPhotoMode]);

  const commitCatalogChange = useCallback(
    (nextItems: DressingRoomGarment[], historyLabel?: string) => {
      if (historyLabel) {
        setHistoryEntries((prev) => [
          {
            id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            label: historyLabel,
            timestamp: new Date().toISOString(),
            snapshot: catalogDesigns,
          },
          ...prev.slice(0, 19),
        ]);
      }
      setCatalogDesigns(nextItems);
      if (preferences.autoSaveEnabled) {
        void saveVestidorCatalog(nextItems);
        setHasUnsavedChanges(false);
        updatePreferences({ lastSavedAt: new Date().toISOString() });
      } else {
        setHasUnsavedChanges(true);
      }
    },
    [catalogDesigns, preferences.autoSaveEnabled, updatePreferences]
  );

  const handleUpdateDecorItems = useCallback(
    (next: VestidorDecorElement[]) => {
      setDecorItems(next);
      void saveVestidorDecorations(next);
    },
    []
  );

  const handleManualSaveNow = useCallback(() => {
    void saveVestidorCatalog(catalogDesigns);
    void saveVestidorTrash(trashDesigns);
    void saveVestidorDecorations(decorItems);
    setHasUnsavedChanges(false);
    updatePreferences({ lastSavedAt: new Date().toISOString() });
    playSfx('save');
    onNotify('Catálogo y decoraciones guardados localmente');
  }, [catalogDesigns, trashDesigns, decorItems, updatePreferences, playSfx, onNotify]);

  // All tags present across designs in active category
  const availableCategoryTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of catalogDesigns) {
      if (item.category !== activeCategory) continue;
      for (const t of item.tags ?? []) set.add(t);
    }
    return Array.from(set);
  }, [catalogDesigns, activeCategory]);

  // Filtered & sorted designs for active category
  const categoryDesigns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = catalogDesigns.filter((item) => {
      if (item.category !== activeCategory) return false;
      if (onlyFavorites && !item.favorite) return false;
      if (activeTag && !(item.tags ?? []).includes(activeTag)) return false;
      if (q) {
        const hay = [
          item.name,
          item.subtitle,
          item.fiber,
          item.stitchNote,
          ...(item.tags ?? []),
          item.techSheet?.stitchType,
          item.techSheet?.materials,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortMode === 'alpha') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }
    if (sortMode === 'recent') {
      return [...list].sort((a, b) =>
        (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')
      );
    }
    if (sortMode === 'favorites') {
      return [...list].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)));
    }
    return [...list].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
  }, [catalogDesigns, activeCategory, onlyFavorites, activeTag, searchQuery, sortMode]);

  const rawCategoryCount = useMemo(
    () => catalogDesigns.filter((item) => item.category === activeCategory).length,
    [catalogDesigns, activeCategory]
  );

  const selectedTop = useMemo(
    () => (selectedTopId ? catalogDesigns.find((g) => g.id === selectedTopId) ?? null : null),
    [catalogDesigns, selectedTopId]
  );

  const selectedBottom = useMemo(
    () =>
      selectedBottomId ? catalogDesigns.find((g) => g.id === selectedBottomId) ?? null : null,
    [catalogDesigns, selectedBottomId]
  );

  const activeTurnaroundId = useMemo(() => {
    const a = ((yawDeg % 360) + 360) % 360;
    if (a < 45 || a >= 315) return 'front';
    if (a >= 45 && a < 135) return 'profile-left';
    if (a >= 135 && a < 225) return 'back';
    return 'profile-right';
  }, [yawDeg]);

  const handleOpenAddDesign = () => {
    playSfx('click');
    setEditingGarment(null);
    setEditorModalOpen(true);
  };

  const handleOpenEditDesign = (garment: DressingRoomGarment) => {
    playSfx('click');
    setEditingGarment(garment);
    setEditorModalOpen(true);
  };

  const handleSaveDesign = (saved: DressingRoomGarment) => {
    const exists = catalogDesigns.some((item) => item.id === saved.id);
    const next = exists
      ? catalogDesigns.map((item) => (item.id === saved.id ? saved : item))
      : [{ ...saved, sortOrder: 0 }, ...catalogDesigns.map((d, i) => ({ ...d, sortOrder: i + 1 }))];

    commitCatalogChange(
      next,
      exists ? `Editado: ${saved.name}` : `Añadido: ${saved.name}`
    );
    setActiveCategory(saved.category);
    setEditorModalOpen(false);
    setEditingGarment(null);

    setShowClothing(true);
    if (saved.garmentSlot === 'bottom') {
      setSelectedBottomId(saved.id);
      setBottomColorOverride(null);
    } else {
      setSelectedTopId(saved.id);
      setTopColorOverride(null);
    }
    if (saved.availableColorIds?.[0]) {
      setActiveYarnColorId(saved.availableColorIds[0]);
    }
    onNotify(
      exists
        ? `Diseño actualizado: ${saved.name}`
        : `Diseño guardado en ${saved.category}: ${saved.name}`
    );
  };

  /** Soft-delete to persistent Trash for instant recovery */
  const handleDeleteDesign = (garmentId: string) => {
    const target = catalogDesigns.find((g) => g.id === garmentId);
    if (!target) return;
    const next = catalogDesigns.filter((item) => item.id !== garmentId);
    commitCatalogChange(next, `Eliminado: ${target.name}`);

    const nextTrash = [{ ...target, deletedAt: new Date().toISOString() }, ...trashDesigns];
    setTrashDesigns(nextTrash);
    void saveVestidorTrash(nextTrash);

    if (selectedTopId === garmentId) {
      setSelectedTopId(null);
      setTopColorOverride(null);
    }
    if (selectedBottomId === garmentId) {
      setSelectedBottomId(null);
      setBottomColorOverride(null);
    }
    if (editingGarment?.id === garmentId) {
      setEditorModalOpen(false);
      setEditingGarment(null);
    }
    playSfx('click');
    onNotify(`Movido a papelera: ${target.name} (puedes recuperarlo en Historial)`);
  };

  const handleDuplicateDesign = (garment: DressingRoomGarment) => {
    const now = new Date().toISOString();
    const copy: DressingRoomGarment = {
      ...garment,
      id: `design-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${garment.name} (copia)`,
      garmentViews: garment.garmentViews ? { ...garment.garmentViews } : undefined,
      modelViews: garment.modelViews ? { ...garment.modelViews } : undefined,
      photoCrops: garment.photoCrops ? { ...garment.photoCrops } : undefined,
      tags: garment.tags ? [...garment.tags] : undefined,
      techSheet: garment.techSheet ? { ...garment.techSheet } : undefined,
      createdAt: now,
      updatedAt: now,
      sortOrder: 0,
    };
    const next = [copy, ...catalogDesigns.map((d, i) => ({ ...d, sortOrder: i + 1 }))];
    commitCatalogChange(next, `Duplicado: ${garment.name}`);
    playSfx('save');
    onNotify(`Diseño duplicado: ${copy.name}`);
  };

  const handleToggleFavorite = (garmentId: string) => {
    const target = catalogDesigns.find((g) => g.id === garmentId);
    if (!target) return;
    const next = catalogDesigns.map((g) =>
      g.id === garmentId ? { ...g, favorite: !g.favorite, updatedAt: new Date().toISOString() } : g
    );
    commitCatalogChange(next, `${target.favorite ? 'Quitado de' : 'Añadido a'} favoritos: ${target.name}`);
    playSfx('click');
  };

  /** Reorder designs via drag-and-drop or arrow buttons */
  const handleReorderCategoryDesigns = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const orderedIds = categoryDesigns.map((d) => d.id);
    const fromIdx = orderedIds.indexOf(sourceId);
    const toIdx = orderedIds.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...orderedIds];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const orderMap = new Map<string, number>();
    reordered.forEach((id, idx) => orderMap.set(id, idx));

    const next = catalogDesigns.map((item) =>
      orderMap.has(item.id) ? { ...item, sortOrder: orderMap.get(item.id) } : item
    );
    setSortMode('manual');
    commitCatalogChange(next, `Reordenado en ${activeCategory}`);
    playSfx('click');
  };

  const handleMoveCardStep = (garmentId: string, direction: -1 | 1) => {
    const idx = categoryDesigns.findIndex((d) => d.id === garmentId);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= categoryDesigns.length) return;
    handleReorderCategoryDesigns(garmentId, categoryDesigns[targetIdx].id);
  };

  /** Batch multi-upload / drag-and-drop image files directly into the active category */
  const handleBatchCreateFromFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const catMeta =
      NEW_CATALOG_CATEGORIES.find((c) => c.id === activeCategory) ?? NEW_CATALOG_CATEGORIES[0];
    const created: DressingRoomGarment[] = [];

    for (const file of imageFiles) {
      try {
        const dataUrl = await compressImageFile(file, 1440, true);
        const cleanTitle =
          file.name
            .replace(/\.[^.]+$/, '')
            .replace(/[_-]+/g, ' ')
            .trim() || `${catMeta.label} Artesanal`;
        const now = new Date().toISOString();
        created.push({
          id: `design-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: cleanTitle.slice(0, 48),
          category: catMeta.id,
          garmentSlot: catMeta.slot,
          eyebrow: 'COLECCIÓN FUENTES NAZCO',
          subtitle: `Diseño artesanal de crochet · ${catMeta.label}.`,
          fiber: '100% Algodón Peinado Crochet',
          hookSizeMm: '3.25 mm',
          stitchNote: 'Subido al catálogo de El Vestidor Dorado.',
          palette: ['#F0DEC1'],
          accentColor: '#F0DEC1',
          photoDataUrl: dataUrl,
          garmentViews: { front: dataUrl },
          modelViews: {},
          availableColorIds: ['crema'],
          createdAt: now,
          updatedAt: now,
          isCustom: true,
        });
      } catch {
        // skip unreadable image
      }
    }

    if (created.length === 0) {
      onNotify('No se pudieron importar las fotografías seleccionadas');
      return;
    }

    const next = [...created, ...catalogDesigns].map((d, i) => ({ ...d, sortOrder: i }));
    commitCatalogChange(
      next,
      created.length === 1
        ? `Subido: ${created[0].name}`
        : `Subida múltiple (${created.length} diseños)`
    );
    playSfx('save');
    onNotify(
      created.length === 1
        ? `Diseño añadido en ${catMeta.label}: ${created[0].name}`
        : `${created.length} diseños añadidos en ${catMeta.label}`
    );
  };

  const handleRestoreHistory = (entry: VestidorHistoryEntry) => {
    commitCatalogChange(entry.snapshot, `Restaurado historial (${entry.label})`);
    setHistoryDrawerOpen(false);
    playSfx('save');
    onNotify('Estado anterior del catálogo restaurado');
  };

  const handleRestoreTrashed = (garmentId: string) => {
    const found = trashDesigns.find((t) => t.id === garmentId);
    if (!found) return;
    const restored: DressingRoomGarment = { ...found, deletedAt: undefined, sortOrder: 0 };
    const nextCatalog = [
      restored,
      ...catalogDesigns.map((d, i) => ({ ...d, sortOrder: i + 1 })),
    ];
    const nextTrash = trashDesigns.filter((t) => t.id !== garmentId);
    setTrashDesigns(nextTrash);
    void saveVestidorTrash(nextTrash);
    commitCatalogChange(nextCatalog, `Recuperado: ${found.name}`);
    setActiveCategory(found.category);
    playSfx('save');
    onNotify(`Diseño recuperado: ${found.name}`);
  };

  const handlePurgeTrashed = (garmentId: string) => {
    const nextTrash = trashDesigns.filter((t) => t.id !== garmentId);
    setTrashDesigns(nextTrash);
    void saveVestidorTrash(nextTrash);
    playSfx('click');
    onNotify('Diseño eliminado definitivamente');
  };

  const handleEmptyTrash = () => {
    setTrashDesigns([]);
    void saveVestidorTrash([]);
    playSfx('click');
    onNotify('Papelera vaciada');
  };

  const handleExportCatalogJson = () => {
    const payload = JSON.stringify(
      { version: 2, exportedAt: new Date().toISOString(), designs: catalogDesigns },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `El-Vestidor-Dorado-Catalogo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSfx('save');
    onNotify('Copia de seguridad del catálogo descargada en JSON');
  };

  const handleImportCatalogJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const incoming: DressingRoomGarment[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.designs)
            ? parsed.designs
            : [];
        if (incoming.length === 0) {
          onNotify('El archivo JSON no contiene diseños válidos');
          return;
        }
        const existingIds = new Set(catalogDesigns.map((d) => d.id));
        const merged = [
          ...incoming.filter((d) => d && d.id && d.name && !existingIds.has(d.id)),
          ...catalogDesigns,
        ].map((d, i) => ({ ...d, sortOrder: i }));
        commitCatalogChange(merged, `Importados ${incoming.length} diseños`);
        playSfx('save');
        onNotify(`Importación completada (${merged.length} diseños totales)`);
      } catch {
        onNotify('No se pudo leer el archivo JSON de respaldo');
      }
    };
    reader.readAsText(file);
  };

  const handleWearGarment = (garment: DressingRoomGarment) => {
    playSfx('click');
    setShowClothing(true);
    setCustomStudioPhotoName(null);
    viewer3DRef.current?.clearCustomPhoto();
    const hasPhotographedModelView = Boolean(
      garment.modelViews && Object.values(garment.modelViews).some(Boolean)
    );
    if (garment.garmentSlot === 'bottom') {
      setBottomColorOverride(null);
      const nextId = selectedBottomId === garment.id ? null : garment.id;
      setSelectedBottomId(nextId);
      if (nextId && hasPhotographedModelView) {
        setSelectedTopId(null);
        setTopColorOverride(null);
      }
    } else {
      setTopColorOverride(null);
      const nextId = selectedTopId === garment.id ? null : garment.id;
      setSelectedTopId(nextId);
      if (nextId && hasPhotographedModelView) {
        setSelectedBottomId(null);
        setBottomColorOverride(null);
      }
    }
  };

  const handleSelectYarnBall = (option: YarnBallColorOption) => {
    playSfx('pluck');
    setActiveYarnColorId(option.id);
    onSelectBrushColor(option.hex);

    const activeGarment = selectedTop ?? selectedBottom;
    if (!activeGarment) {
      onNotify(`Color seleccionado: ${option.name}`);
      return;
    }

    const isDefaultColor =
      activeGarment.availableColorIds && activeGarment.availableColorIds[0] === option.id;

    if (isDefaultColor) {
      setTopColorOverride(null);
      setBottomColorOverride(null);
      onNotify(`Tono original activo: ${option.name}`);
      return;
    }

    const nextPalette = [option.hex, option.trimHex, option.accentHex];
    if (selectedTop) setTopColorOverride(nextPalette);
    else if (selectedBottom) setBottomColorOverride(nextPalette);
    onNotify(`Color consultado: ${option.name}`);
  };

  const handleResetYarnColors = () => {
    playSfx('click');
    setTopColorOverride(null);
    setBottomColorOverride(null);
    onNotify('Tono original restaurado');
  };

  const handleCycleLight = () => {
    playSfx('toggleOn');
    const nextIdx = (STUDIO_LIGHT_ORDER.indexOf(lightPreset) + 1) % STUDIO_LIGHT_ORDER.length;
    const nextId = STUDIO_LIGHT_ORDER[nextIdx];
    setLightPreset(nextId);
    onNotify(`Iluminación: ${STUDIO_LIGHT_PRESETS[nextId].label}`);
  };

  const handleCaptureAndSavePhoto = (cleanOnly = false) => {
    playSfx('save');
    const snapshotDataUrl = viewer3DRef.current?.captureSnapshot({ clean: cleanOnly });
    if (!snapshotDataUrl) {
      onNotify('No se pudo capturar la fotografía del estudio');
      return;
    }

    if (!cleanOnly) {
      const outfitNames = [selectedTop?.name, selectedBottom?.name].filter(Boolean).join(' + ');
      const garmentForNotebook: DressingRoomGarment = {
        id: `vestidor-foto-${Date.now()}`,
        name: outfitNames
          ? `El Vestidor Dorado: ${outfitNames}`
          : 'Modelo Oficial · El Vestidor Dorado',
        category: selectedTop?.category || selectedBottom?.category || 'Camisas',
        subtitle: 'Fotografía de estudio capturada desde El Vestidor Dorado 2.5D.',
        fiber:
          [selectedTop?.fiber, selectedBottom?.fiber].filter(Boolean).join(' · ') ||
          'Modelo Fotográfico Oficial',
        hookSizeMm: selectedTop?.hookSizeMm || selectedBottom?.hookSizeMm || '3.25 mm',
        stitchNote:
          [selectedTop?.stitchNote, selectedBottom?.stitchNote].filter(Boolean).join(' ') ||
          'Captura de alta resolución sobre la alfombra de crochet.',
        palette:
          selectedTop?.palette || selectedBottom?.palette || ['#F0DEC1', '#E3A91C', '#28572A'],
        accentColor: selectedTop?.accentColor || selectedBottom?.accentColor || '#F0DEC1',
        photoDataUrl: snapshotDataUrl,
      };
      onPinGarmentToNotebook(garmentForNotebook);
    }

    const a = document.createElement('a');
    a.href = snapshotDataUrl;
    a.download = cleanOnly
      ? 'El-Vestidor-Dorado-Sin-Interfaz.png'
      : 'El-Vestidor-Dorado-Crochet.png';
    a.click();
    onNotify(
      cleanOnly
        ? 'Fotografía limpia sin interfaz descargada en PNG'
        : 'Fotografía guardada en el Cuaderno y descargada en PNG'
    );
  };

  const handleLoadCustomStudioPhoto = async (file: File) => {
    try {
      const dataUrl = await compressImageFile(file, 1440, true);
      viewer3DRef.current?.loadCustomPhoto(dataUrl, file.name);
      setCustomStudioPhotoName(file.name);
      playSfx('save');
      onNotify(`Vista de estudio cargada: ${file.name}`);
    } catch {
      onNotify('No se pudo leer la imagen seleccionada');
    }
  };

  const handleToggleFullscreen = () => {
    const el = rootStageRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.().catch(() => {});
    } else {
      void document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleResetAllView = () => {
    playSfx('click');
    setIsSpinning360(false);
    viewer3DRef.current?.resetCamera();
    setMeasurements(DEFAULT_MEASUREMENTS);
    onNotify('Vista restablecida al frente (100%)');
  };

  const handleLeftToolClick = (tool: LeftCrochetTool) => {
    playSfx('click');
    setActiveLeftTool(tool);

    switch (tool) {
      case 'prendas':
        setPoseDrawerOpen(false);
        setSettingsDrawerOpen(false);
        break;
      case 'colores':
        setPoseDrawerOpen(false);
        setSettingsDrawerOpen(false);
        yarnScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        break;
      case 'poses':
        setSettingsDrawerOpen(false);
        setPoseDrawerOpen((prev) => !prev);
        break;
      case 'girar':
        setIsSpinning360((prev) => !prev);
        break;
      case 'zoom':
        if (viewerZoom > 1.08) {
          viewer3DRef.current?.resetCamera();
        } else {
          viewer3DRef.current?.zoomBy(-2.0);
        }
        break;
      case 'foto':
        handleCaptureAndSavePhoto(false);
        break;
    }
  };

  const isZoomedIn = viewerZoom > 1.08;

  const leftCrochetButtons: Array<{
    id: LeftCrochetTool;
    label: string;
    icon: React.ReactNode;
    active: boolean;
  }> = [
    {
      id: 'prendas',
      label: 'Prendas',
      icon: <Shirt className="w-6 h-6" strokeWidth={2.2} />,
      active: activeLeftTool === 'prendas' && !poseDrawerOpen,
    },
    {
      id: 'colores',
      label: 'Colores',
      icon: <Palette className="w-6 h-6" strokeWidth={2.2} />,
      active: activeLeftTool === 'colores',
    },
    {
      id: 'poses',
      label: 'Poses',
      icon: <User className="w-6 h-6" strokeWidth={2.2} />,
      active: poseDrawerOpen,
    },
    {
      id: 'girar',
      label: 'Girar 360°',
      icon: (
        <RefreshCw
          className={`w-6 h-6 ${isSpinning360 && !effectiveReducedMotion ? 'animate-spin' : ''}`}
          strokeWidth={2.2}
        />
      ),
      active: isSpinning360,
    },
    {
      id: 'zoom',
      label: 'Zoom',
      icon: <ZoomIn className="w-6 h-6" strokeWidth={2.2} />,
      active: isZoomedIn,
    },
    {
      id: 'foto',
      label: 'Foto',
      icon: <Camera className="w-6 h-6" strokeWidth={2.2} />,
      active: false,
    },
  ];

  const wornGarment = selectedTop ?? selectedBottom;
  const availableColorSet = useMemo(() => {
    if (!wornGarment?.availableColorIds?.length) return null;
    return new Set(wornGarment.availableColorIds);
  }, [wornGarment]);

  const currentFrameInfo = viewer3DRef.current?.getCurrentFrameInfo() ?? {
    src: '/vestidor/modelo-oficial/frente.png',
    label: 'Frente (0°)',
    angleDeg: yawDeg,
  };

  return (
    <motion.div
      ref={rootStageRef}
      initial={effectiveReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={effectiveReducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: effectiveReducedMotion ? 0 : 0.25 }}
      className={`relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden text-[#4c2610] ${
        effectiveReducedMotion ? 'vestidor-reduced-motion' : ''
      }`}
      style={{
        backgroundImage: "url('/vestidor/artisan/studio-backdrop.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: '36% 72%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Hidden File Input for Optional Studio Test Photograph */}
      <input
        ref={uploadStudioPhotoRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleLoadCustomStudioPhoto(f);
          e.target.value = '';
        }}
      />

      {/* Photorealistic 3D Artisan Crochet Corner Decorations (hidden in Clean Photo Mode) */}
      {!cleanPhotoMode && (
        <ArtisanCrochetCornerDecor animateDecorations={!effectiveReducedMotion} />
      )}

      {/* =====================================================================
          TOP CARVED WALNUT WOOD HEADER (hidden in Clean Photo Mode)
      ===================================================================== */}
      {!cleanPhotoMode && (
        <header className="relative z-30 flex items-center justify-between gap-2 px-3 sm:px-5 lg:px-6 pt-1.5 pb-1 shrink-0">
          {/* Left Carved Wood Plaque: Back to Cuaderno del Artista Crochet */}
          <button
            type="button"
            onClick={() => {
              playSfx('doorClose');
              onBackToNotebook();
            }}
            title="Volver al Cuaderno del Artista"
            style={WOOD_PLAQUE_STYLE}
            className="group relative flex items-center gap-2 px-2 sm:px-3 py-0.5 cursor-pointer transition-transform hover:scale-[1.02] focus:outline-none sm:ml-10 lg:ml-12 shrink-0"
          >
            <span className="w-5 h-5 rounded-full bg-[#361808]/75 group-hover:bg-[#8a4d24] border border-[#f5d28c]/75 flex items-center justify-center text-[#ffe9b4] shrink-0 transition-colors">
              <ArrowLeft className="w-3 h-3" />
            </span>
            <div className="leading-tight text-left">
              <p className="font-editorial italic text-xs sm:text-sm lg:text-[15px] font-bold text-[#fff4dc] group-hover:text-white whitespace-nowrap drop-shadow-[0_2px_4px_rgba(20,8,2,0.85)]">
                Cuaderno del Artista
              </p>
              <p className="font-editorial italic text-[11px] sm:text-xs text-[#f7dbb0] -mt-0.5 text-center drop-shadow-[0_1px_3px_rgba(20,8,2,0.85)]">
                Crochet
              </p>
            </div>
          </button>

          {/* Center Carved Wood Plaque: El Vestidor Dorado / Colección Crochet Fuentes Nazco */}
          <div
            style={WOOD_PLAQUE_STYLE}
            className="relative flex items-center gap-2.5 sm:gap-3.5 px-3 sm:px-6 py-0.5 mx-auto"
          >
            <ArtisanYarnHooksEmblem className="w-9 h-9 sm:w-11 sm:h-11" />
            <div className="text-center sm:text-left leading-none">
              <h1
                className="font-display text-lg sm:text-2xl lg:text-[31px] font-extrabold tracking-[0.03em] bg-clip-text text-transparent drop-shadow-[0_2px_5px_rgba(18,7,2,0.85)] whitespace-nowrap"
                style={{
                  backgroundImage:
                    'linear-gradient(180deg, #fff7c8 0%, #ffda66 50%, #df981c 100%)',
                }}
              >
                El Vestidor Dorado
              </h1>
              <p className="mt-0.5 font-editorial italic text-[11px] sm:text-xs lg:text-[14px] text-[#f9e7ca] tracking-wide whitespace-nowrap drop-shadow-[0_1px_3px_rgba(18,7,2,0.85)]">
                Colección Crochet Fuentes Nazco
              </p>
            </div>
          </div>

          {/* Compact Right Studio Utility Controls (kept completely clear of top-right 3D flowers) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 md:mr-44 lg:mr-56 xl:mr-64">
            <button
              type="button"
              onClick={() => {
                playSfx(curtainsOpen ? 'toggleOff' : 'toggleOn');
                setCurtainsOpen((prev) => !prev);
                onNotify(
                  curtainsOpen
                    ? 'Cortinas doradas de macramé cerradas parcialmente'
                    : 'Cortinas doradas de macramé abiertas'
                );
              }}
              title={
                curtainsOpen
                  ? 'Cerrar ligeramente cortinas de macramé'
                  : 'Abrir cortinas de macramé'
              }
              aria-label="Abrir o cerrar cortinas de macramé"
              className={`hidden md:flex w-8 h-8 rounded-full border-2 items-center justify-center shadow-md cursor-pointer transition-colors ${
                !curtainsOpen
                  ? 'bg-[#f8c432] border-[#9c6108] text-[#421f07]'
                  : 'bg-[#fff5e4]/92 hover:bg-white border-[#c8945e] text-[#683718]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx(sewingPaused ? 'toggleOn' : 'toggleOff');
                setSewingPaused((prev) => !prev);
                onNotify(
                  sewingPaused
                    ? 'Máquina de coser vintage activada'
                    : 'Máquina de coser vintage en pausa'
                );
              }}
              title={
                sewingPaused
                  ? 'Reanudar animación de la máquina de coser'
                  : 'Pausar animación de la máquina de coser'
              }
              aria-label={
                sewingPaused
                  ? 'Reanudar máquina de coser'
                  : 'Pausar máquina de coser'
              }
              className={`hidden md:flex w-8 h-8 rounded-full border-2 items-center justify-center shadow-md cursor-pointer transition-colors ${
                sewingPaused
                  ? 'bg-[#e8d2b2] border-[#a87545] text-[#6b3f1e]'
                  : 'bg-[#fff5e4]/92 hover:bg-white border-[#c8945e] text-[#683718]'
              }`}
            >
              {sewingPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('click');
                setPoseDrawerOpen(false);
                setSettingsDrawerOpen(false);
                setDecorEditMode((prev) => !prev);
              }}
              title={
                decorEditMode
                  ? 'Finalizar edición de decoraciones'
                  : 'Editar y duplicar decoraciones del vestidor'
              }
              aria-label="Editar y duplicar decoraciones del vestidor"
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-md cursor-pointer transition-colors ${
                decorEditMode
                  ? 'bg-[#f8c432] border-[#9c6108] text-[#421f07] ring-2 ring-[#ffe99e]'
                  : 'bg-[#fff5e4]/92 hover:bg-white border-[#c8945e] text-[#683718]'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('click');
                setComparisonOpen(true);
              }}
              title="Comparar conjuntos"
              aria-label="Comparar conjuntos"
              className="hidden sm:flex w-8 h-8 rounded-full bg-[#fff5e4]/92 hover:bg-white border-2 border-[#c8945e] text-[#683718] items-center justify-center shadow-md cursor-pointer transition-colors"
            >
              <Columns2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('click');
                setDetailInspectorGarment(wornGarment);
                setDetailInspectorOpen(true);
              }}
              title="Vista de detalles y ficha técnica"
              aria-label="Vista de detalles y ficha técnica"
              className="hidden sm:flex w-8 h-8 rounded-full bg-[#fff5e4]/92 hover:bg-white border-2 border-[#c8945e] text-[#683718] items-center justify-center shadow-md cursor-pointer transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('click');
                setPoseDrawerOpen(false);
                setSettingsDrawerOpen(false);
                setDecorEditMode(false);
                setCleanPhotoMode(true);
              }}
              title="Modo fotografía sin interfaz"
              aria-label="Modo fotografía sin interfaz"
              className="hidden sm:flex w-8 h-8 rounded-full bg-[#fff5e4]/92 hover:bg-white border-2 border-[#c8945e] text-[#683718] items-center justify-center shadow-md cursor-pointer transition-colors"
            >
              <Focus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCycleLight}
              title={`Cambiar iluminación (${STUDIO_LIGHT_PRESETS[lightPreset].label})`}
              aria-label="Cambiar iluminación"
              className="hidden sm:flex w-8 h-8 rounded-full bg-[#fff5e4]/92 hover:bg-white border-2 border-[#c8945e] text-[#683718] items-center justify-center shadow-md cursor-pointer transition-colors"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                playSfx('click');
                setPoseDrawerOpen(false);
                setSettingsDrawerOpen((prev) => !prev);
              }}
              title="Ajustes del visor 2.5D"
              aria-label="Ajustes del visor 2.5D"
              className={`hidden sm:flex w-8 h-8 rounded-full border-2 items-center justify-center shadow-md cursor-pointer transition-colors ${
                settingsDrawerOpen
                  ? 'bg-[#f8c432] border-[#9c6108] text-[#421f07]'
                  : 'bg-[#fff5e4]/92 hover:bg-white border-[#c8945e] text-[#683718]'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="hidden sm:flex w-8 h-8 rounded-full bg-[#fff5e4]/92 hover:bg-white border-2 border-[#c8945e] text-[#683718] items-center justify-center shadow-md cursor-pointer transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </header>
      )}

      {/* =====================================================================
          CLEAN PHOTO MODE FLOATING ACTION BAR (Sin interfaz — photo capture & exit)
      ===================================================================== */}
      {cleanPhotoMode && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCaptureAndSavePhoto(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-b from-[#ffe26b] to-[#e09814] border-2 border-[#9e6108] text-[#3d1b05] text-xs font-extrabold shadow-lg cursor-pointer hover:brightness-105"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PNG sin interfaz</span>
          </button>
          <button
            type="button"
            onClick={() => setCleanPhotoMode(false)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#5a3118]/92 hover:bg-[#733f20] border border-[#e3b56c] text-[#ffe9be] text-xs font-bold shadow-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Mostrar interfaz</span>
          </button>
        </div>
      )}

      {/* =====================================================================
          MAIN RESPONSIVE ARTISAN CROCHET WORKSPACE
      ===================================================================== */}
      <div className="relative z-20 flex-1 flex flex-col lg:flex-row gap-2.5 lg:gap-3 px-2.5 sm:px-4 lg:px-5 pb-2.5 pt-0.5 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* 1. LEFT CHUNKY 3D MINT-GREEN CROCHET VERTICAL PANEL */}
        {!cleanPhotoMode && (
          <nav
            aria-label="Controles de El Vestidor Dorado"
            style={MINT_PANEL_STYLE}
            className="relative flex lg:flex-col items-center justify-between gap-1.5 sm:gap-2 p-1 shrink-0 overflow-x-auto lg:overflow-y-auto studio-scroll lg:w-[138px] xl:w-[152px]"
          >
            {leftCrochetButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleLeftToolClick(btn.id)}
                style={btn.active ? GOLD_TILE_ACTIVE_STYLE : CREAM_BUTTON_STYLE}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-2.5 py-1.5 lg:w-full lg:flex-1 lg:px-1 lg:py-1 rounded-[18px] overflow-hidden transition-transform duration-150 cursor-pointer shrink-0 hover:scale-[1.03] active:scale-[0.97] ${
                  btn.active ? 'text-[#3c1a04] scale-[1.02]' : 'text-[#441e0b]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[10px]"
                  style={{
                    background: btn.active
                      ? 'radial-gradient(ellipse at 50% 42%, rgba(255,228,108,0.88) 0%, rgba(248,195,48,0.72) 78%, rgba(226,158,18,0.38) 100%)'
                      : 'radial-gradient(ellipse at 50% 42%, rgba(255,248,236,0.82) 0%, rgba(247,232,210,0.62) 78%, rgba(235,212,182,0.28) 100%)',
                  }}
                />
                <span className={`relative z-10 ${btn.active ? 'text-[#6a300c]' : 'text-[#a11e4a]'}`}>
                  {btn.icon}
                </span>
                <span className="relative z-10 text-[11.5px] sm:text-[13px] font-extrabold leading-tight tracking-tight whitespace-nowrap drop-shadow-[0_1px_0_rgba(255,252,240,0.85)]">
                  {btn.label}
                </span>
              </button>
            ))}
          </nav>
        )}

        {/* 2. LEFT 4-VIEW BRAIDED-CREAM CROCHET ROPE COLUMN */}
        {!cleanPhotoMode && (
          <aside
            aria-label="Cuatro vistas del modelo oficial"
            style={CREAM_ROPE_FRAME_STYLE}
            className="hidden md:flex flex-col gap-1.5 p-1 w-[104px] xl:w-[116px] shrink-0 min-h-0"
          >
            {OFFICIAL_TURNAROUND_TILES.map((tile) => {
              const isActive = !isSpinning360 && activeTurnaroundId === tile.id;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => {
                    playSfx('click');
                    setIsSpinning360(false);
                    viewer3DRef.current?.setTargetAngleDeg(tile.angleDeg);
                  }}
                  title={`Ver ${tile.label} (${tile.angleDeg}°)`}
                  className={`group relative flex-1 min-h-0 rounded-xl overflow-hidden transition-all cursor-pointer flex items-center justify-center p-1 ${
                    isActive
                      ? 'bg-[#fae8de] ring-[3px] ring-[#f2b322] shadow-[0_4px_12px_rgba(204,132,16,0.4)]'
                      : 'bg-[#f4dfd4]/90 border border-[#d6ab84] hover:border-[#b97744] opacity-95 hover:opacity-100'
                  }`}
                >
                  <img
                    src={tile.src}
                    alt={tile.label}
                    draggable={false}
                    className="w-full h-full object-contain object-center"
                  />
                  <span className="absolute inset-x-0 bottom-0 py-0.5 bg-[#5c3118]/85 text-[#fff1d4] text-[9px] font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {tile.label}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        {/* 3. LARGE CENTRAL 2.5D PHOTOGRAPHIC MALE MODEL ON PHOTOREALISTIC CIRCULAR CROCHET RUG */}
        <main className="relative flex-1 flex flex-col min-w-0 min-h-[440px] lg:min-h-0 overflow-hidden">
          <VitruvianMan3D
            ref={viewer3DRef}
            selectedTop={selectedTop}
            selectedBottom={selectedBottom}
            overrideTopPalette={topColorOverride}
            overrideBottomPalette={bottomColorOverride}
            showClothing={showClothing}
            knitRelief={knitRelief}
            poseIndex={poseIndex}
            isSpinning360={isSpinning360}
            spinSpeed={preferences.spinSpeed}
            isAnimatingPose={isAnimatingPose}
            lightPreset={lightPreset}
            qualityLevel={effectiveQuality}
            measurements={measurements}
            manifestBundle={manifestBundle}
            hideBottomSpinBadge={true}
            hideDefaultFloorBasket={true}
            cleanStageMode={cleanPhotoMode || decorEditMode}
            reducedMotion={effectiveReducedMotion}
            soundEnabled={preferences.soundEnabled}
            curtainsOpen={curtainsOpen}
            sewingPaused={sewingPaused}
            onToggleSewingPaused={() => {
              playSfx(sewingPaused ? 'toggleOn' : 'toggleOff');
              setSewingPaused((prev) => !prev);
            }}
            onToggleSpin360={() => {
              playSfx(isSpinning360 ? 'toggleOff' : 'toggleOn');
              setIsSpinning360((prev) => !prev);
            }}
            onStopSpin360={() => setIsSpinning360(false)}
            onYawChange={setYawDeg}
            onZoomChange={setViewerZoom}
            onClearTop={() => {
              setSelectedTopId(null);
              setTopColorOverride(null);
            }}
            onClearBottom={() => {
              setSelectedBottomId(null);
              setBottomColorOverride(null);
            }}
            onResetColors={handleResetYarnColors}
            onRequestNaturalPose={() => setPoseIndex(0)}
            onEditActiveGarment={() => {
              const target = selectedTop ?? selectedBottom;
              if (target) handleOpenEditDesign(target);
            }}
          />

          {/* Editable Studio Decorations Layer (strictly behind model & pointer-events-none when not editing) */}
          <VestidorDecorCanvas
            items={decorItems}
            editMode={decorEditMode && !cleanPhotoMode}
            reducedMotion={effectiveReducedMotion}
            shortcutsDisabled={
              editorModalOpen ||
              comparisonOpen ||
              detailInspectorOpen ||
              historyDrawerOpen ||
              settingsDrawerOpen ||
              poseDrawerOpen
            }
            onChangeItems={handleUpdateDecorItems}
            onExitEditMode={() => setDecorEditMode(false)}
            onNotify={onNotify}
            onPlaySfx={(kind) => playSfx(kind)}
          />
        </main>

        {/* 4. RIGHT CHUNKY 3D PASTEL-PINK CROCHET WARDROBE PANEL + BOTTOM LARGE GOLDEN GIRAR 360° */}
        {!cleanPhotoMode && (
          <section className="flex flex-col lg:w-[465px] xl:w-[535px] 2xl:w-[585px] shrink-0 min-h-0 gap-2">
            <div
              style={PINK_PANEL_STYLE}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes('Files')) {
                  e.preventDefault();
                  setCatalogFileDragOver(true);
                }
              }}
              onDragLeave={() => setCatalogFileDragOver(false)}
              onDrop={(e) => {
                if (e.dataTransfer.files?.length) {
                  e.preventDefault();
                  setCatalogFileDragOver(false);
                  void handleBatchCreateFromFiles(e.dataTransfer.files);
                }
              }}
              className="flex-1 flex flex-col min-h-0 p-1.5 sm:p-2 overflow-hidden"
            >
              {/* TOP CARVED WALNUT-BURGUNDY 6-CATEGORY BAR */}
              <div
                style={WALNUT_WOOD_BG_STYLE}
                className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1.5 rounded-2xl border-2 border-[#a87058]/60 shadow-[inset_0_2px_8px_rgba(24,8,4,0.55),0_3px_8px_rgba(72,30,18,0.3)] shrink-0"
              >
                {NEW_CATALOG_CATEGORIES.map((cat) => {
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        playSfx('click');
                        setActiveCategory(cat.id);
                        setActiveTag(null);
                        setActiveLeftTool('prendas');
                      }}
                      style={active ? GOLD_TILE_ACTIVE_STYLE : undefined}
                      className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl overflow-hidden transition-all cursor-pointer ${
                        active
                          ? 'text-[#3c1a04] font-extrabold'
                          : 'text-[#fdf0de] hover:bg-white/10 font-semibold border border-white/10'
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-lg"
                          style={{
                            background:
                              'radial-gradient(ellipse at 50% 45%, rgba(255,226,104,0.88) 0%, rgba(246,192,42,0.74) 80%, rgba(224,154,18,0.38) 100%)',
                          }}
                        />
                      )}
                      <span className="relative z-10">
                        <CategoryGarmentIcon category={cat.id} active={active} />
                      </span>
                      <span className="relative z-10 text-[10px] leading-none tracking-tight whitespace-nowrap">
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CLEAN CATALOG HEADER BAR (+ Añadir diseño, subtle filter/history triggers) */}
              <div className="flex items-center justify-between gap-2 mt-2 mb-1.5 px-1 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="font-display text-sm sm:text-base font-extrabold text-[#4d2510] truncate drop-shadow-[0_1px_0_rgba(255,248,236,0.7)]">
                    {activeCategory}
                  </h2>
                  <span className="text-xs font-extrabold text-[#6c3d1e] font-mono-tab">
                    ({rawCategoryCount})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      setShowFilters((prev) => !prev);
                    }}
                    title="Buscar, filtrar, ordenar o subir varias fotos"
                    aria-label="Buscar y filtrar catálogo"
                    className={`w-7 h-7 rounded-xl border flex items-center justify-center shadow-sm cursor-pointer transition-colors ${
                      showFilters || searchQuery || onlyFavorites || activeTag
                        ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                        : 'bg-[#fff4e2]/92 hover:bg-white border-[#c89b6a] text-[#5e3116]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      setHistoryDrawerOpen(true);
                    }}
                    title="Historial y papelera de recuperación"
                    aria-label="Historial y papelera"
                    className="relative w-7 h-7 rounded-xl bg-[#fff4e2]/92 hover:bg-white border border-[#c89b6a] text-[#5e3116] flex items-center justify-center shadow-sm cursor-pointer transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    {trashDesigns.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#b32645] text-white text-[8.5px] font-bold flex items-center justify-center">
                        {trashDesigns.length}
                      </span>
                    )}
                  </button>

                  {(selectedTop || selectedBottom) && (
                    <button
                      type="button"
                      onClick={() => {
                        playSfx('click');
                        setSelectedTopId(null);
                        setSelectedBottomId(null);
                        setTopColorOverride(null);
                        setBottomColorOverride(null);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[#fff4e2]/92 hover:bg-white border border-[#c89b6a] text-[#5e3116] text-[11px] font-bold shadow-sm cursor-pointer transition-colors"
                    >
                      Quitar ropa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenAddDesign}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gradient-to-b from-[#ffe26b] via-[#f6be2a] to-[#df9710] hover:brightness-105 border-2 border-[#a86a08] text-[#421f07] text-[11.5px] font-extrabold shadow-sm cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={2.8} />
                    <span>Añadir diseño</span>
                  </button>
                </div>
              </div>

              {/* DISCREET SEARCH / FILTER / SORT / BATCH BAR (auto-visible on demand or when searching) */}
              {(showFilters || rawCategoryCount > 0) && (
                <CatalogFilterBar
                  searchQuery={searchQuery}
                  onlyFavorites={onlyFavorites}
                  activeTag={activeTag}
                  availableTags={availableCategoryTags}
                  sortMode={sortMode}
                  trashCount={trashDesigns.length}
                  historyCount={historyEntries.length}
                  onSearchChange={setSearchQuery}
                  onToggleFavorites={() => {
                    playSfx('click');
                    setOnlyFavorites((v) => !v);
                  }}
                  onSelectTag={(tag) => {
                    playSfx('click');
                    setActiveTag(tag);
                  }}
                  onChangeSort={(m) => {
                    playSfx('click');
                    setSortMode(m);
                  }}
                  onBatchUploadFiles={(files) => void handleBatchCreateFromFiles(files)}
                  onOpenHistory={() => {
                    playSfx('click');
                    setHistoryDrawerOpen(true);
                  }}
                />
              )}

              {/* CATALOG GRID OR CLEAN EMPTY-COLLECTION STATE ON REAL WOVEN LINEN */}
              <div className="flex-1 min-h-[185px] overflow-y-auto studio-scroll px-0.5">
                {!catalogLoaded ? (
                  <div className="h-full flex items-center justify-center text-xs font-bold text-[#6e3d1e]">
                    Cargando catálogo...
                  </div>
                ) : rawCategoryCount === 0 ? (
                  <div
                    className={`h-full min-h-[195px] flex flex-col items-center justify-center text-center px-5 py-5 rounded-2xl border-2 border-dashed backdrop-blur-[1px] shadow-inner transition-colors ${
                      catalogFileDragOver
                        ? 'border-[#d48b1b] bg-[#fff3cc]/85'
                        : 'border-[#ba8b5e]/80 bg-[#fff8ec]/64'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#fff3cf] to-[#f2cf96] border-2 border-[#cf9448] flex items-center justify-center text-[#91521b] shadow-sm mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <p className="font-editorial text-sm sm:text-[15.5px] font-bold text-[#4a240e] leading-snug max-w-[300px]">
                      {EMPTY_CATALOG_MESSAGE}
                    </p>
                    <p className="mt-1.5 text-[11px] text-[#754626] max-w-[285px]">
                      Añade tus propios diseños reales de «{activeCategory}» o arrastra varias fotografías directamente aquí.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddDesign}
                      style={GOLD_PILL_BUTTON_STYLE}
                      className="relative mt-4 inline-flex items-center justify-center rounded-full overflow-hidden text-[#3d1b05] text-xs font-extrabold cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{
                          background:
                            'radial-gradient(ellipse at 50% 45%, rgba(255,228,108,0.88) 0%, rgba(246,192,42,0.72) 78%, rgba(224,154,18,0.34) 100%)',
                        }}
                      />
                      <span className="relative z-10 inline-flex items-center gap-1.5 px-3 py-0.5 drop-shadow-[0_1px_0_rgba(255,250,220,0.85)]">
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.8} />
                        <span>Añadir diseño</span>
                      </span>
                    </button>
                  </div>
                ) : categoryDesigns.length === 0 ? (
                  <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center px-5 py-5 rounded-2xl border-2 border-dashed border-[#ba8b5e]/70 bg-[#fff8ec]/64">
                    <p className="text-xs font-bold text-[#5a2f16]">
                      No hay diseños en «{activeCategory}» que coincidan con el filtro actual.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setOnlyFavorites(false);
                        setActiveTag(null);
                      }}
                      className="mt-2.5 px-3 py-1 rounded-xl bg-[#f3dfc0] hover:bg-[#e8cba0] border border-[#cfa574] text-xs font-bold text-[#4d2510] cursor-pointer"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 pb-1">
                    {categoryDesigns.map((garment, idx) => {
                      const isWorn =
                        showClothing &&
                        (selectedTopId === garment.id || selectedBottomId === garment.id);
                      return (
                        <CatalogDesignCard
                          key={garment.id}
                          garment={garment}
                          isWorn={isWorn}
                          canMoveLeft={idx > 0}
                          canMoveRight={idx < categoryDesigns.length - 1}
                          isDragTarget={dragTargetCardId === garment.id && draggingCardId !== garment.id}
                          onWear={() => handleWearGarment(garment)}
                          onEdit={() => handleOpenEditDesign(garment)}
                          onInspect={() => {
                            playSfx('click');
                            setDetailInspectorGarment(garment);
                            setDetailInspectorOpen(true);
                          }}
                          onDuplicate={() => handleDuplicateDesign(garment)}
                          onToggleFavorite={() => handleToggleFavorite(garment.id)}
                          onPin={() => {
                            playSfx('save');
                            onPinGarmentToNotebook(garment);
                            onNotify(`Enviado al cuaderno: ${garment.name}`);
                          }}
                          onDelete={() => handleDeleteDesign(garment.id)}
                          onMove={(dir) => handleMoveCardStep(garment.id, dir)}
                          onDragStart={() => setDraggingCardId(garment.id)}
                          onDragOver={(e) => {
                            if (draggingCardId && draggingCardId !== garment.id) {
                              e.preventDefault();
                              setDragTargetCardId(garment.id);
                            }
                          }}
                          onDrop={() => {
                            if (draggingCardId && draggingCardId !== garment.id) {
                              handleReorderCategoryDesigns(draggingCardId, garment.id);
                            }
                            setDraggingCardId(null);
                            setDragTargetCardId(null);
                          }}
                          onDragEnd={() => {
                            setDraggingCardId(null);
                            setDragTargetCardId(null);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* BOTTOM PHOTOREALISTIC BRAIDED CROCHET «COLORES DISPONIBLES» TRAY */}
              <div className="relative mt-2 pt-3 shrink-0">
                <div className="absolute -top-0.5 inset-x-0 flex justify-center z-20 pointer-events-none">
                  <span className="px-4 py-0.5 rounded-full bg-[#fdf3e3] border-2 border-[#d4a570] text-[11.5px] font-extrabold text-[#532910] shadow-sm">
                    Colores disponibles
                  </span>
                </div>

                <div className="relative flex items-center gap-1 px-5 sm:px-6 py-4 sm:py-5">
                  <img
                    src="/vestidor/artisan/colors-tray.png"
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="pointer-events-none select-none absolute inset-0 w-full h-full object-fill drop-shadow-[0_6px_12px_rgba(74,38,14,0.28)]"
                  />

                  <button
                    type="button"
                    aria-label="Desplazar ovillos a la izquierda"
                    onClick={() => {
                      playSfx('click');
                      yarnScrollRef.current?.scrollBy({ left: -170, behavior: 'smooth' });
                    }}
                    className="relative z-10 w-7 h-7 rounded-full hover:bg-[#e5be84]/75 text-[#5a2f12] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" strokeWidth={2.8} />
                  </button>

                  <div
                    ref={yarnScrollRef}
                    className="relative z-10 flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-1"
                  >
                    {YARN_BALL_COLORS.map((color) => (
                      <ArtisanYarnBallSwatch
                        key={color.id}
                        color={color}
                        selected={activeYarnColorId === color.id}
                        available={!availableColorSet || availableColorSet.has(color.id)}
                        onClick={() => handleSelectYarnBall(color)}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    aria-label="Desplazar ovillos a la derecha"
                    onClick={() => {
                      playSfx('click');
                      yarnScrollRef.current?.scrollBy({ left: 170, behavior: 'smooth' });
                    }}
                    className="relative z-10 w-7 h-7 rounded-full hover:bg-[#e5be84]/75 text-[#5a2f12] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" strokeWidth={2.8} />
                  </button>
                </div>
              </div>
            </div>

            {/* BOTTOM LARGE GOLDEN CROCHET «GIRAR 360°» BUTTON FLANKED BY CARVED WALNUT WOOD ARROWS */}
            <div className="flex items-center justify-center gap-2 sm:gap-2.5 px-2 shrink-0 xl:pr-24">
              <button
                type="button"
                onClick={() => {
                  playSfx('click');
                  setIsSpinning360(false);
                  viewer3DRef.current?.stepAngle(-1);
                }}
                title="Girar a la vista anterior"
                aria-label="Girar a la izquierda"
                style={WOOD_ARROW_BTN_STYLE}
                className="w-11 h-11 rounded-2xl border-2 border-[#c8965d] text-[#ffefd0] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.6} />
              </button>

              <button
                type="button"
                onClick={() => {
                  playSfx(isSpinning360 ? 'toggleOff' : 'toggleOn');
                  setIsSpinning360((prev) => !prev);
                }}
                style={GOLD_PILL_BUTTON_STYLE}
                className="relative flex-1 max-w-[245px] py-1.5 px-4 rounded-full overflow-hidden text-[#3c1904] font-extrabold text-base sm:text-lg tracking-tight flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background:
                      'radial-gradient(ellipse at 50% 44%, rgba(255,228,108,0.9) 0%, rgba(246,192,42,0.75) 78%, rgba(224,154,18,0.34) 100%)',
                  }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  {isSpinning360 ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <RefreshCw className="w-5 h-5" strokeWidth={2.7} />
                  )}
                  <span className="drop-shadow-[0_1px_0_rgba(255,248,210,0.9)] whitespace-nowrap">
                    {isSpinning360 ? 'Pausar 360°' : 'Girar 360°'}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSfx('click');
                  setIsSpinning360(false);
                  viewer3DRef.current?.stepAngle(1);
                }}
                title="Girar a la siguiente vista"
                aria-label="Girar a la derecha"
                style={WOOD_ARROW_BTN_STYLE}
                className="w-11 h-11 rounded-2xl border-2 border-[#c8965d] text-[#ffefd0] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
              >
                <ArrowRight className="w-5 h-5" strokeWidth={2.6} />
              </button>

              {/* Compact Speed + Zoom - / + + Reset Controls */}
              <div className="hidden sm:flex items-center gap-1 ml-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playSfx('click');
                    const nextIdx =
                      (SPIN_SPEED_ORDER.indexOf(preferences.spinSpeed) + 1) %
                      SPIN_SPEED_ORDER.length;
                    const nextSpeed = SPIN_SPEED_ORDER[nextIdx];
                    updatePreferences({ spinSpeed: nextSpeed });
                    onNotify(`Velocidad de giro: ${nextSpeed}`);
                  }}
                  title={`Velocidad de giro: ${preferences.spinSpeed} (pulsa para cambiar)`}
                  aria-label="Cambiar velocidad de giro"
                  className="h-9 px-2 rounded-xl bg-[#fff5e4]/92 hover:bg-white border-2 border-[#c8945e] text-[#5e3116] text-[11px] font-extrabold font-mono-tab flex items-center gap-1 shadow cursor-pointer"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  <span>{SPIN_SPEED_SHORT[preferences.spinSpeed]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('click');
                    viewer3DRef.current?.zoomBy(1.1);
                  }}
                  title="Alejar"
                  aria-label="Alejar zoom"
                  className="w-9 h-9 rounded-xl bg-[#fff5e4]/92 hover:bg-white border-2 border-[#c8945e] text-[#5e3116] flex items-center justify-center shadow cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('click');
                    viewer3DRef.current?.zoomBy(-1.1);
                  }}
                  title="Acercar"
                  aria-label="Acercar zoom"
                  className="w-9 h-9 rounded-xl bg-[#fff5e4]/92 hover:bg-white border-2 border-[#c8945e] text-[#5e3116] flex items-center justify-center shadow cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetAllView}
                  title="Restablecer vista"
                  aria-label="Restablecer vista"
                  className="w-9 h-9 rounded-xl bg-[#fff5e4]/92 hover:bg-white border-2 border-[#c8945e] text-[#5e3116] flex items-center justify-center shadow cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* =====================================================================
          FLOATING POSE SELECTOR DRAWER (7 Official Poses)
      ===================================================================== */}
      {poseDrawerOpen && !cleanPhotoMode && (
        <div className="fixed inset-x-3 bottom-4 sm:inset-auto sm:left-[164px] sm:bottom-5 z-40 sm:w-[340px] rounded-[24px] border-[4px] border-[#e4a6ad] bg-[#fbf0df]/98 text-[#4c2610] shadow-[0_18px_44px_rgba(62,28,12,0.38)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#63361c] text-[#ffe8ba]">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#ffd96b]" />
              <h3 className="font-display text-sm font-bold">Poses del Modelo</h3>
            </div>
            <button
              type="button"
              onClick={() => setPoseDrawerOpen(false)}
              className="w-6 h-6 rounded-full hover:bg-white/15 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2.5 space-y-1.5 max-h-[340px] overflow-y-auto studio-scroll">
            {manifestBundle.poses.map((pose, idx) => {
              const availability = isPosePhotographedForSelection(
                pose.id,
                selectedTop,
                selectedBottom,
                showClothing,
                manifestBundle
              );
              const isSelected = poseIndex === idx;
              return (
                <button
                  key={pose.id}
                  type="button"
                  onClick={() => {
                    playSfx('click');
                    setPoseIndex(idx);
                    setIsSpinning360(false);
                    viewer3DRef.current?.setTargetAngleDeg(pose.recommendedAngleDeg);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#ffe699] border-[#c2800c] text-[#421f07] font-bold shadow-sm'
                      : 'bg-[#fff9ef] border-[#e2c49c] hover:border-[#c8965d] text-[#592f16]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold truncate">
                      {pose.code} · {pose.title}
                    </p>
                    <p className="text-[10px] text-[#7c5030] truncate">{pose.subtitle}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[9.5px] font-bold font-mono-tab ${
                      availability.available
                        ? 'bg-[#dff4e7] text-[#22613e] border border-[#96cfa9]'
                        : 'bg-[#f4e4d0] text-[#8c5e3c] border border-[#d6b38b]'
                    }`}
                  >
                    {availability.available ? `${availability.frameCount}v` : 'Sin foto'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODULAR STUDIO SETTINGS DRAWER */}
      <VestidorSettingsDrawer
        isOpen={settingsDrawerOpen && !cleanPhotoMode}
        preferences={preferences}
        systemReducedMotion={systemReducedMotion}
        qualityLevel={qualityLevel}
        isAnimatingPose={isAnimatingPose}
        knitRelief={knitRelief}
        measurements={measurements}
        lightPreset={lightPreset}
        customStudioPhotoName={customStudioPhotoName}
        hasUnsavedChanges={hasUnsavedChanges}
        onClose={() => setSettingsDrawerOpen(false)}
        onUpdatePreferences={(patch) => {
          playSfx('click');
          updatePreferences(patch);
        }}
        onChangeQuality={(q) => {
          playSfx('click');
          setQualityLevel(q);
        }}
        onToggleAnimatingPose={() => {
          playSfx(isAnimatingPose ? 'toggleOff' : 'toggleOn');
          setIsAnimatingPose((prev) => !prev);
        }}
        onToggleKnitRelief={() => {
          playSfx(knitRelief ? 'toggleOff' : 'toggleOn');
          setKnitRelief((prev) => !prev);
        }}
        onChangeHeight={(h) => setMeasurements((prev) => ({ ...prev, height: h }))}
        onChangeLight={(id) => {
          playSfx('click');
          setLightPreset(id);
        }}
        onTriggerStudioPhotoUpload={() => uploadStudioPhotoRef.current?.click()}
        onManualSaveNow={handleManualSaveNow}
        onExportCatalogJson={handleExportCatalogJson}
        onImportCatalogJson={handleImportCatalogJson}
        onResetView={handleResetAllView}
      />

      {/* OUTFIT COMPARISON MODAL */}
      <OutfitComparisonModal
        isOpen={comparisonOpen}
        catalogDesigns={catalogDesigns}
        activeTop={selectedTop}
        activeBottom={selectedBottom}
        initialAngleDeg={yawDeg}
        onClose={() => setComparisonOpen(false)}
        onNotify={onNotify}
      />

      {/* DETAIL LOUPE & CROCHET TECH SHEET INSPECTOR MODAL */}
      <DetailInspectorModal
        isOpen={detailInspectorOpen}
        garment={detailInspectorGarment}
        currentModelImageSrc={currentFrameInfo.src}
        currentAngleLabel={currentFrameInfo.label}
        onClose={() => setDetailInspectorOpen(false)}
        onEditGarment={(g) => handleOpenEditDesign(g)}
      />

      {/* HISTORY & TRASH RECOVERY DRAWER */}
      <CatalogHistoryDrawer
        isOpen={historyDrawerOpen}
        history={historyEntries}
        trashItems={trashDesigns}
        onClose={() => setHistoryDrawerOpen(false)}
        onRestoreHistory={handleRestoreHistory}
        onRestoreTrashed={handleRestoreTrashed}
        onPurgeTrashed={handlePurgeTrashed}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* ADD / EDIT DESIGN MODAL (+ Añadir diseño) */}
      <DesignEditorModal
        isOpen={editorModalOpen}
        defaultCategory={activeCategory}
        editingGarment={editingGarment}
        soundEnabled={preferences.soundEnabled}
        onClose={() => {
          setEditorModalOpen(false);
          setEditingGarment(null);
        }}
        onSave={handleSaveDesign}
        onDelete={handleDeleteDesign}
      />
    </motion.div>
  );
};
