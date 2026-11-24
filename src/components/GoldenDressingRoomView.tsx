import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Layers,
  Pause,
  Play,
  Plus,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import type {
  DressingRoomCategory,
  DressingRoomGarment,
  FinishedProject,
  VestidorDecorElement,
  VestidorHistoryEntry,
  VestidorPreferences,
  WardrobeSeasonId,
} from '../types/crochet';
import {
  WARDROBE_SEASONS,
  WARDROBE_SEASON_BY_ID,
  resolveGarmentSeason,
} from '../utils/wardrobeSeasons';
import {
  ATELIER_CURTAIN_DESIGNS,
  MODEL_SKIN_TONES,
  YARN_BALL_COLORS,
  type YarnBallColorOption,
} from '../data/glbAssetManifest';
import {
  PASARELAS_ALTA_MODA_CATALOG,
  RUNWAY_HOUSE_EDITIONS,
  RUNWAY_MODEL_POSES,
} from '../data/pasarelasAltaModaCatalog';
import {
  composeTransparentCurtainImage,
  copyPngBlobToClipboard,
} from '../utils/garmentRunwayRenderer';
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
import { CatalogDesignCard } from './CatalogPanelWidgets';
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

const DEFAULT_MEASUREMENTS: BodyMeasurements = {
  chest: 1.0,
  shoulders: 1.0,
  waist: 1.0,
  height: 1.0,
};

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

const PINK_PANEL_STYLE: React.CSSProperties = {
  borderStyle: 'solid',
  borderWidth: '24px',
  borderImageSource: "url('/vestidor/artisan/pink-panel.png')",
  borderImageSlice: '142 142 142 142 fill',
  borderImageWidth: '26px',
  borderImageRepeat: 'round',
  filter: 'drop-shadow(0 12px 24px rgba(72, 30, 20, 0.32))',
};

interface GoldenDressingRoomViewProps {
  activeSeason?: WardrobeSeasonId;
  onChangeSeason?: (season: WardrobeSeasonId) => void;
  customGarments: DressingRoomGarment[];
  finishedProjects: FinishedProject[];
  onAddCustomGarment: (garment: DressingRoomGarment) => void;
  onDeleteCustomGarment: (id: string) => void;
  onSelectBrushColor: (hex: string) => void;
  onPinGarmentToNotebook: (garment: DressingRoomGarment) => void;
  onBackToNotebook: () => void;
  onBackToWardrobe?: () => void;
  onNotify: (msg: string) => void;
}

export const GoldenDressingRoomView: React.FC<GoldenDressingRoomViewProps> = ({
  activeSeason = 'primavera',
  onChangeSeason,
  onSelectBrushColor,
  onPinGarmentToNotebook,
  onBackToNotebook,
  onBackToWardrobe,
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

  // Persistent catalog seeded with 276 high-fashion runway crochet designs (user edits/deletes preserved)
  const [catalogDesigns, setCatalogDesigns] = useState<DressingRoomGarment[]>(
    () => PASARELAS_ALTA_MODA_CATALOG
  );
  const [trashDesigns, setTrashDesigns] = useState<DressingRoomGarment[]>([]);
  const [historyEntries, setHistoryEntries] = useState<VestidorHistoryEntry[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Official 2D photographic male model manifest
  const [manifestBundle, setManifestBundle] = useState<VestidorManifestBundle>(() => ({
    model: OFFICIAL_MODEL_MANIFEST,
    poses: PHOTO_POSES,
    outfits: OUTFIT_PHOTO_MANIFESTS,
  }));

  const [rightPanelTab, setRightPanelTab] = useState<'prendas' | 'poses'>('prendas');
  const [seasonFilter, setSeasonFilter] = useState<WardrobeSeasonId | 'todas'>(activeSeason);
  const [activeCategory, setActiveCategory] = useState<DressingRoomCategory | 'Todas'>('Todas');
  const [activeRunwayId, setActiveRunwayId] = useState<string>('todas');

  useEffect(() => {
    setSeasonFilter(activeSeason);
  }, [activeSeason]);

  const activeSeasonMeta =
    seasonFilter === 'todas' ? null : WARDROBE_SEASON_BY_ID[seasonFilter];

  const seasonCounts = useMemo(() => {
    const counts: Record<WardrobeSeasonId, number> = {
      primavera: 0,
      verano: 0,
      otono: 0,
      invierno: 0,
    };
    for (const item of catalogDesigns) {
      counts[resolveGarmentSeason(item)]++;
    }
    return counts;
  }, [catalogDesigns]);
  const [visibleCount, setVisibleCount] = useState<number>(160);
  const [activePose2DId, setActivePose2DId] = useState<string>('frontal-pasarela');
  const [modelScale, setModelScale] = useState<number>(1.0);
  const [copyingTransparent, setCopyingTransparent] = useState<boolean>(false);
  const [justCopiedTransparent, setJustCopiedTransparent] = useState<boolean>(false);

  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragTargetCardId, setDragTargetCardId] = useState<string | null>(null);
  const [catalogFileDragOver, setCatalogFileDragOver] = useState<boolean>(false);

  // Atelier starts cleanly with the underwear base model across all seasons (click any garment to dress him!)
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);
  const [selectedBottomId, setSelectedBottomId] = useState<string | null>(null);
  const [showClothing, setShowClothing] = useState<boolean>(true);
  const [activeSkinToneId, setActiveSkinToneId] = useState<string>('natural');

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
  // Framing Luxury Haute-Couture Crochet/Lace/Macramé Curtains & Animated Vintage Sewing Machine
  const [curtainsOpen, setCurtainsOpen] = useState<boolean>(true);
  const [activeCurtainId, setActiveCurtainId] = useState<string>(ATELIER_CURTAIN_DESIGNS[0].id);
  const [curtainPickerOpen, setCurtainPickerOpen] = useState<boolean>(false);
  const [copyingCurtain, setCopyingCurtain] = useState<boolean>(false);
  const [sewingPaused, setSewingPaused] = useState<boolean>(false);

  const activeSkinTone = useMemo(
    () => MODEL_SKIN_TONES.find((t) => t.id === activeSkinToneId) ?? MODEL_SKIN_TONES[0],
    [activeSkinToneId]
  );
  const activeCurtain = useMemo(
    () => ATELIER_CURTAIN_DESIGNS.find((c) => c.id === activeCurtainId) ?? ATELIER_CURTAIN_DESIGNS[0],
    [activeCurtainId]
  );

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
    const SEED_FLAG = 'vestidor_pasarelas_uhd_clean_v3';
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
          const customUserItems = items.filter((d) => d.isCustom);
          const trashedIds = new Set(trashed.map((d) => d.id));
          const seedItems = PASARELAS_ALTA_MODA_CATALOG.filter((d) => !trashedIds.has(d.id));
          finalCatalog = [...customUserItems, ...seedItems];
          void saveVestidorCatalog(finalCatalog);
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

  const activePose2D = useMemo(
    () => RUNWAY_MODEL_POSES.find((p) => p.id === activePose2DId) ?? RUNWAY_MODEL_POSES[0],
    [activePose2DId]
  );

  // Filtered designs by season, category & runway house
  const categoryDesigns = useMemo(() => {
    return catalogDesigns
      .filter((item) => {
        if (seasonFilter !== 'todas' && resolveGarmentSeason(item) !== seasonFilter) {
          return false;
        }
        if (activeCategory !== 'Todas') {
          if (activeCategory === 'Pulóveres') {
            if (item.category !== 'Pulóveres' && item.category !== 'Suéteres') return false;
          } else if (item.category !== activeCategory) {
            return false;
          }
        }
        if (activeRunwayId !== 'todas') {
          const itemRunway = item.runwayHouseId ?? 'original';
          if (itemRunway !== activeRunwayId) return false;
        }
        return true;
      })
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
  }, [catalogDesigns, seasonFilter, activeCategory, activeRunwayId]);

  const rawCategoryCount = categoryDesigns.length;
  const displayedDesigns = useMemo(
    () => categoryDesigns.slice(0, visibleCount),
    [categoryDesigns, visibleCount]
  );

  // Reset pagination cleanly when changing season, category or runway
  useEffect(() => {
    setVisibleCount(160);
  }, [seasonFilter, activeCategory, activeRunwayId]);

  const handleCopyTransparentModelWithRug = useCallback(async () => {
    if (copyingTransparent) return;
    const viewer = viewer3DRef.current;
    if (!viewer) {
      onNotify('El visor del modelo aún se está cargando.');
      return;
    }
    setCopyingTransparent(true);
    try {
      // Kick off render synchronously inside the click gesture so Safari/Chrome ClipboardItem stays authorized
      const renderPromise = viewer.exportTransparentModelWithRug({ resolution: '4k' });
      const copied = await copyPngBlobToClipboard(
        renderPromise.then((r) => r?.blob ?? null)
      );
      const res = await renderPromise;
      if (!res) {
        onNotify('No se pudo generar el recorte transparente del modelo');
        return;
      }
      playSfx('save');
      if (copied) {
        setJustCopiedTransparent(true);
        window.setTimeout(() => setJustCopiedTransparent(false), 2200);
        onNotify('¡Copiado en Ultra-HD! Figura + alfombra en PNG transparente listo para pegar (Ctrl+V)');
      } else {
        const a = document.createElement('a');
        a.href = res.dataUrl;
        a.download = 'Modelo-Alfombra-UltraHD-Transparente.png';
        a.click();
        onNotify('PNG Ultra-HD transparente descargado');
      }
    } finally {
      setCopyingTransparent(false);
    }
  }, [copyingTransparent, playSfx, onNotify]);

  const handleCopyActiveCurtain = useCallback(async () => {
    if (copyingCurtain) return;
    setCopyingCurtain(true);
    try {
      const renderPromise = composeTransparentCurtainImage(activeCurtain.src);
      const copied = await copyPngBlobToClipboard(
        renderPromise.then((r) => r?.blob ?? null)
      );
      const res = await renderPromise;
      if (!res) {
        onNotify('No se pudo generar la imagen de la cortina.');
        return;
      }
      playSfx('save');
      if (copied) {
        onNotify(`¡Cortina «${activeCurtain.name}» copiada en PNG transparente!`);
      } else {
        const a = document.createElement('a');
        a.href = res.dataUrl;
        a.download = `Cortina-${activeCurtain.id}-AltaCostura.png`;
        a.click();
        onNotify(`Cortina «${activeCurtain.name}» descargada en PNG transparente`);
      }
    } finally {
      setCopyingCurtain(false);
    }
  }, [copyingCurtain, activeCurtain, playSfx, onNotify]);

  const selectedTop = useMemo(
    () => (selectedTopId ? catalogDesigns.find((g) => g.id === selectedTopId) ?? null : null),
    [catalogDesigns, selectedTopId]
  );

  const selectedBottom = useMemo(
    () =>
      selectedBottomId ? catalogDesigns.find((g) => g.id === selectedBottomId) ?? null : null,
    [catalogDesigns, selectedBottomId]
  );

  const handleDownloadTransparentModelWithRug = useCallback(async () => {
    if (copyingTransparent) return;
    setCopyingTransparent(true);
    try {
      const res = await viewer3DRef.current?.exportTransparentModelWithRug({ resolution: '8k' });
      if (!res) {
        onNotify('No se pudo exportar el PNG 8K transparente');
        return;
      }
      const a = document.createElement('a');
      a.href = res.dataUrl;
      const slug = (selectedTop?.name || selectedBottom?.name || 'Modelo-Oficial')
        .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ-]+/g, '-')
        .slice(0, 42);
      a.download = `${slug}-8K-Transparente.png`;
      a.click();
      window.setTimeout(() => {
        if (res.dataUrl.startsWith('blob:')) URL.revokeObjectURL(res.dataUrl);
      }, 4000);
      playSfx('save');
      onNotify('PNG 8K Ultra-HD (solo figura + alfombra sin pixelar) descargado');
    } finally {
      setCopyingTransparent(false);
    }
  }, [copyingTransparent, selectedTop?.name, selectedBottom?.name, playSfx, onNotify]);

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
    const taggedSaved: DressingRoomGarment = {
      ...saved,
      season: saved.season ?? (seasonFilter !== 'todas' ? seasonFilter : activeSeason),
    };
    const exists = catalogDesigns.some((item) => item.id === taggedSaved.id);
    const next = exists
      ? catalogDesigns.map((item) => (item.id === taggedSaved.id ? taggedSaved : item))
      : [{ ...taggedSaved, sortOrder: 0 }, ...catalogDesigns.map((d, i) => ({ ...d, sortOrder: i + 1 }))];

    commitCatalogChange(
      next,
      exists ? `Editado: ${taggedSaved.name}` : `Añadido: ${taggedSaved.name}`
    );
    setActiveCategory(taggedSaved.category);
    setEditorModalOpen(false);
    setEditingGarment(null);

    setShowClothing(true);
    if (taggedSaved.garmentSlot === 'bottom') {
      setSelectedBottomId(taggedSaved.id);
      setBottomColorOverride(null);
    } else {
      setSelectedTopId(taggedSaved.id);
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
          season: seasonFilter !== 'todas' ? seasonFilter : activeSeason,
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
    // Ensure selecting any garment immediately shows it (reset single-photo base poses automatically)
    if (
      activePose2DId === 'perfil-izquierdo' ||
      activePose2DId === 'perfil-derecho' ||
      activePose2DId === 'espalda-editorial' ||
      activePose2DId === 'manos-bolsillos'
    ) {
      setActivePose2DId('frontal-pasarela');
    }
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
    setActivePose2DId('frontal-pasarela');
    viewer3DRef.current?.resetCamera();
    setMeasurements(DEFAULT_MEASUREMENTS);
    onNotify('Vista restablecida');
  };

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
          {/* Left Carved Wood Plaque: Back to Cuaderno & Royal 4-Season Wardrobe */}
          <div className="flex items-center gap-1.5 sm:ml-10 lg:ml-12 shrink-0">
            <button
              type="button"
              onClick={() => {
                playSfx('doorClose');
                onBackToNotebook();
              }}
              title="Volver al Cuaderno del Artista"
              style={WOOD_PLAQUE_STYLE}
              className="group relative flex items-center gap-2 px-2 sm:px-3 py-0.5 cursor-pointer transition-transform hover:scale-[1.02] focus:outline-none shrink-0"
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

            {onBackToWardrobe && (
              <button
                type="button"
                onClick={() => {
                  playSfx('doorClose');
                  onBackToWardrobe();
                }}
                title="Volver al Armario Real de las Cuatro Estaciones"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border-2 border-[#c8945e] bg-[#4a2611]/92 hover:bg-[#623318] text-[#ffecc2] text-[11px] font-bold shadow-md cursor-pointer transition-colors whitespace-nowrap"
              >
                <span>Armario</span>
              </button>
            )}
          </div>

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
                {activeSeasonMeta
                  ? `Atelier · ${activeSeasonMeta.label}`
                  : 'El Vestidor Dorado'}
              </h1>
              <p className="mt-0.5 font-editorial italic text-[11px] sm:text-xs lg:text-[14px] text-[#f9e7ca] tracking-wide whitespace-nowrap drop-shadow-[0_1px_3px_rgba(18,7,2,0.85)]">
                {activeSeasonMeta
                  ? `Puerta ${activeSeasonMeta.roman} · ${activeSeasonMeta.fibersNote}`
                  : 'Colección Crochet Fuentes Nazco'}
              </p>
            </div>
          </div>

          {/* Clean Studio Controls: Luxury Curtains (Open/Close, Designs, Copy), Sewing & Add */}
          <div className="relative flex items-center gap-1.5 shrink-0 md:mr-44 lg:mr-56 xl:mr-64">
            <button
              type="button"
              onClick={() => {
                playSfx(curtainsOpen ? 'toggleOff' : 'toggleOn');
                setCurtainsOpen((prev) => !prev);
                onNotify(
                  curtainsOpen
                    ? `Cortina «${activeCurtain.name}» cerrada`
                    : `Cortina «${activeCurtain.name}» abierta`
                );
              }}
              title={curtainsOpen ? 'Cerrar cortinas del atelier' : 'Abrir cortinas del atelier'}
              className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-full border-2 text-[11px] font-bold shadow-md cursor-pointer transition-colors whitespace-nowrap ${
                !curtainsOpen
                  ? 'bg-[#f8c432] border-[#9c6108] text-[#421f07]'
                  : 'bg-[#fff5e4]/95 hover:bg-white border-[#c8945e] text-[#5c2f12]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {curtainsOpen ? 'Cerrar cortina' : 'Abrir cortina'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                playSfx('click');
                setCurtainPickerOpen((v) => !v);
              }}
              title="Cambiar diseño de cortinas de encaje, crochet y macramé"
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border-2 text-[11px] font-bold shadow-md cursor-pointer transition-colors whitespace-nowrap ${
                curtainPickerOpen
                  ? 'bg-[#6b3416] border-[#f4c76b] text-[#fff4d4]'
                  : 'bg-[#fff5e4]/95 hover:bg-white border-[#c8945e] text-[#5c2f12]'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-[#6e4218]/60 shrink-0"
                style={{ backgroundColor: activeCurtain.swatchHex }}
              />
              <span className="hidden md:inline">Cortinas ({ATELIER_CURTAIN_DESIGNS.length})</span>
            </button>

            <button
              type="button"
              disabled={copyingCurtain}
              onClick={() => void handleCopyActiveCurtain()}
              title={`Copiar imagen transparente de la cortina «${activeCurtain.name}»`}
              className="hidden sm:inline-flex items-center gap-1 h-8 px-2.5 rounded-full border-2 bg-[#fff5e4]/95 hover:bg-white border-[#c8945e] text-[#5c2f12] text-[11px] font-bold shadow-md cursor-pointer transition-colors whitespace-nowrap disabled:opacity-60"
            >
              <Copy className="w-3 h-3 shrink-0" />
              <span className="hidden lg:inline">Copiar cortina</span>
            </button>

            {curtainPickerOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-10 z-50 w-[300px] sm:w-[340px] rounded-2xl border-2 border-[#d49e52] bg-[#2a1509]/96 text-[#fae7c2] p-3 shadow-[0_18px_42px_rgba(0,0,0,0.72)] backdrop-blur-md space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#b98241]/40 pb-1.5">
                  <div>
                    <p className="font-display text-xs font-bold text-[#ffebc2]">
                      Cortinas de Encaje y Crochet Alta Costura
                    </p>
                    <p className="text-[10px] text-[#d9b885]">
                      Selecciona un diseño o copia la cortina en PNG transparente
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurtainPickerOpen(false)}
                    className="p-1 rounded hover:bg-white/10 text-[#e7c587] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ATELIER_CURTAIN_DESIGNS.map((curtain) => {
                    const selected = curtain.id === activeCurtain.id;
                    return (
                      <button
                        key={curtain.id}
                        type="button"
                        onClick={() => {
                          playSfx('click');
                          setActiveCurtainId(curtain.id);
                          onNotify(`Cortina cambiada a «${curtain.name}»`);
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'border-[#ffd978] bg-[#522911] ring-1 ring-[#f2c464]'
                            : 'border-[#9e6f38]/45 bg-[#1b0d05]/85 hover:bg-[#381c0c]'
                        }`}
                      >
                        <img
                          src={curtain.src}
                          alt={curtain.name}
                          className="w-9 h-12 rounded-md object-cover object-top bg-[#f5e6d2]/20 border border-[#d6a25e]/45 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10.5px] font-bold text-[#fff2d2] leading-tight truncate">
                            {curtain.name}
                          </p>
                          <p className="text-[9px] text-[#d5b27e] leading-snug line-clamp-2 mt-0.5">
                            {curtain.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#b98241]/35">
                  <button
                    type="button"
                    onClick={() => {
                      playSfx(curtainsOpen ? 'toggleOff' : 'toggleOn');
                      setCurtainsOpen((v) => !v);
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#4a2611] hover:bg-[#613318] border border-[#d6a25e]/55 text-[11px] font-semibold text-[#ffebc2] cursor-pointer"
                  >
                    {curtainsOpen ? 'Cerrar cortinas' : 'Abrir cortinas'}
                  </button>
                  <button
                    type="button"
                    disabled={copyingCurtain}
                    onClick={() => void handleCopyActiveCurtain()}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-gradient-to-b from-[#e0a83e] to-[#a66d14] hover:brightness-105 border border-[#ffe39a]/75 text-[11px] font-extrabold text-[#2b1204] inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copyingCurtain ? 'Copiando...' : 'Copiar imagen'}</span>
                  </button>
                </div>
              </div>
            )}
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
                  : 'Editar decoraciones del vestidor'
              }
              aria-label="Editar decoraciones del vestidor"
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
              onClick={handleOpenAddDesign}
              title="Subir prenda personalizada"
              aria-label="Añadir diseño propio"
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full bg-gradient-to-b from-[#ffe26b] via-[#f6be2a] to-[#df9710] hover:brightness-105 border-2 border-[#a86a08] text-[#421f07] text-[11px] font-extrabold shadow-md cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.8} />
              <span className="hidden sm:inline">Añadir</span>
            </button>
          </div>
        </header>
      )}

      {/* =====================================================================
          CLEAN PHOTO MODE FLOATING ACTION BAR (Sin interfaz)
      ===================================================================== */}
      {cleanPhotoMode && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleDownloadTransparentModelWithRug()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-b from-[#ffe26b] to-[#e09814] border-2 border-[#9e6108] text-[#3d1b05] text-xs font-extrabold shadow-lg cursor-pointer hover:brightness-105"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PNG transparente</span>
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
          INTUITIVE 2-COLUMN STATIC 2D ATELIER WORKSPACE
          Left/Center: Static 2D Model + Crochet Rug + 1-Click Transparent Copy
          Right: Clean High-Fashion Runway Catalog (Prendas & Poses)
      ===================================================================== */}
      <div className="relative z-20 flex-1 flex flex-col lg:flex-row gap-3 px-2.5 sm:px-4 lg:px-6 pb-3 pt-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* 1. CENTRAL STATIC 2D MODEL STAGE + TRANSPARENT CUTOUT ACTION BAR */}
        <main className="relative flex-1 flex flex-col min-w-0 min-h-[460px] lg:min-h-0 overflow-hidden">
          <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
            <VitruvianMan3D
              ref={viewer3DRef}
              selectedTop={selectedTop}
              selectedBottom={selectedBottom}
              overrideTopPalette={topColorOverride}
              overrideBottomPalette={bottomColorOverride}
              showClothing={showClothing}
              knitRelief={knitRelief}
              poseIndex={poseIndex}
              isSpinning360={false}
              spinSpeed={preferences.spinSpeed}
              isAnimatingPose={false}
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
              curtainSrc={activeCurtain.src}
              curtainShowDreamcatcher={Boolean(activeCurtain.showDreamcatcher)}
              skinTone={activeSkinTone}
              sewingPaused={sewingPaused}
              static2DMode={true}
              activePose2D={activePose2D}
              modelScale={modelScale}
              onChangeModelScale={setModelScale}
              onToggleSewingPaused={() => {
                playSfx(sewingPaused ? 'toggleOn' : 'toggleOff');
                setSewingPaused((prev) => !prev);
              }}
              onToggleSpin360={() => {}}
              onStopSpin360={() => {}}
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
              onRequestNaturalPose={() => setActivePose2DId('frontal-pasarela')}
              onEditActiveGarment={() => {
                const target = selectedTop ?? selectedBottom;
                if (target) handleOpenEditDesign(target);
              }}
            />

            {/* Editable Studio Decorations Layer (ONLY interactive in Edit Mode) */}
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
          </div>

          {/* 1-CLICK SKIN TONE PALETTE + TRANSPARENT FIGURE + RUG COPY / DOWNLOAD + FREE MODEL RESIZE BAR */}
          {!cleanPhotoMode && (
            <div className="relative z-30 flex flex-col items-center gap-1.5 pt-1 pb-0.5 shrink-0">
              {/* Hyperrealistic Skin Tone Palette Selector */}
              <div
                title="Cambiar tono de piel hiperrealista del modelo"
                className="inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-[#fff7ea]/95 border border-[#cfa16a] text-[#4f260e] shadow-sm"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e3a19] mr-0.5">
                  Tono de piel:
                </span>
                {MODEL_SKIN_TONES.map((tone) => {
                  const selected = tone.id === activeSkinTone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => {
                        playSfx('click');
                        setActiveSkinToneId(tone.id);
                      }}
                      title={`Piel: ${tone.name}`}
                      aria-label={`Tono de piel ${tone.name}`}
                      className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                        selected
                          ? 'scale-115 border-[#5a2b0d] ring-2 ring-[#f3be4e] shadow'
                          : 'border-[#8a5b36]/55 hover:scale-110'
                      }`}
                      style={{
                        background: `radial-gradient(circle at 35% 30%, #ffffff55 0%, ${tone.swatchHex} 58%, #00000028 100%)`,
                      }}
                    />
                  );
                })}
                <span className="text-[10px] font-semibold text-[#75401d] ml-0.5">
                  {activeSkinTone.name}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Free Model Resize Control (55% - 220%) */}
              <div
                title="Redimensiona el modelo libremente (también puedes usar la rueda del ratón o arrastrar la manija ⤢)"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#fff6e6]/95 border-2 border-[#cfa16a] text-[#4f260e] shadow-sm"
              >
                <button
                  type="button"
                  aria-label="Reducir tamaño del modelo"
                  onClick={() => setModelScale((s) => Math.max(0.55, Number((s - 0.1).toFixed(2))))}
                  className="w-5 h-5 rounded-full bg-[#f3dfc2] hover:bg-[#e7c697] text-[#4f260e] text-xs font-extrabold flex items-center justify-center cursor-pointer"
                >
                  −
                </button>
                <input
                  type="range"
                  min={55}
                  max={220}
                  step={5}
                  value={Math.round(modelScale * 100)}
                  onChange={(e) => setModelScale(Number(e.target.value) / 100)}
                  aria-label="Tamaño del modelo"
                  className="w-20 sm:w-24 accent-[#c78016] cursor-pointer h-1.5"
                />
                <button
                  type="button"
                  aria-label="Aumentar tamaño del modelo"
                  onClick={() => setModelScale((s) => Math.min(2.2, Number((s + 0.1).toFixed(2))))}
                  className="w-5 h-5 rounded-full bg-[#f3dfc2] hover:bg-[#e7c697] text-[#4f260e] text-xs font-extrabold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModelScale(1.0);
                    viewer3DRef.current?.resetCamera();
                  }}
                  title="Restablecer tamaño al 100%"
                  className="text-[10.5px] font-extrabold font-mono-tab px-1.5 py-0.5 rounded-full hover:bg-[#f3dfc2] cursor-pointer"
                >
                  {Math.round(modelScale * 100)}%
                </button>
              </div>

              <button
                type="button"
                disabled={copyingTransparent}
                onClick={() => void handleCopyTransparentModelWithRug()}
                title="Copia SOLO el modelo y la alfombra a sus pies con fondo 100% transparente (PNG 2K)"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 text-xs sm:text-[13px] font-extrabold shadow-md cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 ${
                  justCopiedTransparent
                    ? 'bg-[#2c7a4b] border-[#a5e3be] text-white'
                    : 'bg-gradient-to-b from-[#ffe478] via-[#f5bd2c] to-[#dc9410] border-[#9e6208] text-[#3d1b05]'
                }`}
              >
                {justCopiedTransparent ? (
                  <Check className="w-4 h-4" strokeWidth={2.8} />
                ) : (
                  <Copy className="w-4 h-4" strokeWidth={2.4} />
                )}
                <span>
                  {justCopiedTransparent
                    ? '¡Copiado Ultra-HD!'
                    : copyingTransparent
                      ? 'Renderizando 8K...'
                      : 'Copiar figura + alfombra (sin fondo)'}
                </span>
              </button>

              <button
                type="button"
                disabled={copyingTransparent}
                onClick={() => void handleDownloadTransparentModelWithRug()}
                title="Descargar PNG 8K Ultra-HD super-renderizado con fondo transparente (solo el modelo y la alfombra)"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#fff6e6]/95 hover:bg-white border-2 border-[#cfa16a] text-[#4f260e] text-xs font-bold shadow-sm cursor-pointer transition-colors disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar 8K</span>
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
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#fff6e6]/88 hover:bg-white border border-[#d6ac7a] text-[#6a3a1a] text-xs font-bold shadow-sm cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Modelo base</span>
                </button>
              )}
              </div>
            </div>
          )}
        </main>

        {/* 2. RIGHT INTUITIVE HIGH-FASHION RUNWAY & POSES PANEL */}
        {!cleanPhotoMode && (
          <section className="flex flex-col lg:w-[490px] xl:w-[565px] 2xl:w-[620px] shrink-0 min-h-0">
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
              className="flex-1 flex flex-col min-h-0 p-2 sm:p-2.5 overflow-hidden"
            >
              {/* 4-SEASON GREEK WARDROBE DOORS SWITCHER (Primavera · Verano · Otoño · Invierno) */}
              <div className="mb-2 shrink-0 space-y-1.5">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  {WARDROBE_SEASONS.map((s) => {
                    const active = seasonFilter === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          playSfx('click');
                          setSeasonFilter(s.id);
                          onChangeSeason?.(s.id);
                        }}
                        style={active ? { background: s.pillBg } : undefined}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap border transition-all cursor-pointer shrink-0 ${
                          active
                            ? 'text-[#fff7e2] border-[#ffe3a3] shadow-sm'
                            : 'bg-[#fff7ea]/85 hover:bg-white text-[#5d3015] border-[#d7ae7d]'
                        }`}
                      >
                        <img
                          src={s.doorImage}
                          alt=""
                          className="w-4 h-5 rounded-t-full object-cover object-top border border-[#e6be6c]/70 shrink-0"
                        />
                        <span>
                          {s.roman} · {s.label}
                        </span>
                        <span className="text-[9.5px] opacity-80 font-mono-tab">
                          ({seasonCounts[s.id]})
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      setSeasonFilter('todas');
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer shrink-0 ${
                      seasonFilter === 'todas'
                        ? 'bg-[#5c2e14] text-[#fff3d6] border-[#f0c77c] shadow-sm'
                        : 'bg-[#fff7ea]/75 hover:bg-white text-[#673718] border-[#d7ae7d]'
                    }`}
                  >
                    Todas ({catalogDesigns.length})
                  </button>
                </div>

                {activeSeasonMeta && (
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-xl bg-[#fff8ec]/80 border border-[#d6ab77]/75 text-[10.5px] text-[#592d14]">
                    <span className="truncate font-medium">
                      <strong className="font-display text-[#3c1b07]">
                        Apartado {activeSeasonMeta.label}:
                      </strong>{' '}
                      {activeSeasonMeta.subtitle}
                    </span>
                  </div>
                )}
              </div>

              {/* CLEAN TOP SWITCH: PRENDAS DE PASARELA vs POSES DEL MODELO */}
              <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
                <div className="inline-flex items-center p-1 rounded-2xl bg-[#f4e0c8]/90 border border-[#d2a574] shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      setRightPanelTab('prendas');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      rightPanelTab === 'prendas'
                        ? 'bg-gradient-to-b from-[#ffe273] to-[#e69e18] text-[#3d1b05] shadow-sm'
                        : 'text-[#673718] hover:text-[#3d1b05]'
                    }`}
                  >
                    Prendas ({catalogDesigns.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      setRightPanelTab('poses');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      rightPanelTab === 'poses'
                        ? 'bg-gradient-to-b from-[#ffe273] to-[#e69e18] text-[#3d1b05] shadow-sm'
                        : 'text-[#673718] hover:text-[#3d1b05]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Poses ({RUNWAY_MODEL_POSES.length})</span>
                  </button>
                </div>

                {rightPanelTab === 'prendas' && (
                  <span className="text-[11px] font-bold text-[#6e3d1d] font-mono-tab pr-1">
                    {rawCategoryCount} diseños
                  </span>
                )}
              </div>

              {rightPanelTab === 'prendas' ? (
                <>
                  {/* CLEAN INTUITIVE CATEGORY PILLS (no clunky wood strip, no white borders) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1.5 shrink-0">
                    {(['Todas', ...NEW_CATALOG_CATEGORIES.map((c) => c.id)] as const).map(
                      (catId) => {
                        const active = activeCategory === catId;
                        return (
                          <button
                            key={catId}
                            type="button"
                            onClick={() => {
                              playSfx('click');
                              setActiveCategory(catId);
                            }}
                            className={`px-3 py-1 rounded-full text-[11.5px] font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                              active
                                ? 'bg-[#5c2e14] text-[#fff3d6] shadow-sm'
                                : 'bg-[#fff7ea]/85 hover:bg-white text-[#5d3015] border border-[#d7ae7d]'
                            }`}
                          >
                            {catId}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* HIGH-FASHION RUNWAY HOUSES PILLS (Milán, París, Amalfi, Florencia, NY, Montecarlo...) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playSfx('click');
                        setActiveRunwayId('todas');
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        activeRunwayId === 'todas'
                          ? 'bg-[#c57d18] text-white shadow-sm'
                          : 'bg-[#f8ead6]/80 hover:bg-[#fff7ea] text-[#6d3d1d] border border-[#dcb686]/80'
                      }`}
                    >
                      Todas las pasarelas
                    </button>
                    {RUNWAY_HOUSE_EDITIONS.map((edition) => {
                      const active = activeRunwayId === edition.id;
                      return (
                        <button
                          key={edition.id}
                          type="button"
                          title={`${edition.houseName} — ${edition.inspiration}`}
                          onClick={() => {
                            playSfx('click');
                            setActiveRunwayId(edition.id);
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                            active
                              ? 'bg-[#3e210e] text-[#ffefc8] shadow-sm ring-1 ring-[#f2c14e]'
                              : 'bg-[#f8ead6]/80 hover:bg-[#fff7ea] text-[#643618] border border-[#dcb686]/80'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full border border-black/15 shrink-0"
                            style={{ backgroundColor: edition.swatchHex }}
                          />
                          <span>{edition.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* CLEAN GARMENT GRID */}
                  <div className="flex-1 min-h-[185px] overflow-y-auto studio-scroll px-0.5">
                    {!catalogLoaded ? (
                      <div className="h-full flex items-center justify-center text-xs font-bold text-[#6e3d1e]">
                        Cargando colección de pasarelas...
                      </div>
                    ) : categoryDesigns.length === 0 ? (
                      <div
                        className={`h-full min-h-[180px] flex flex-col items-center justify-center text-center px-5 py-5 rounded-2xl border-2 border-dashed ${
                          catalogFileDragOver
                            ? 'border-[#d48b1b] bg-[#fff3cc]/85'
                            : 'border-[#ba8b5e]/75 bg-[#fff8ec]/64'
                        }`}
                      >
                        <p className="text-xs font-bold text-[#5a2f16]">
                          No hay prendas en esta combinación de categoría y pasarela.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCategory('Todas');
                            setActiveRunwayId('todas');
                          }}
                          className="mt-2.5 px-3.5 py-1.5 rounded-full bg-[#5c2e14] text-[#fff2d4] text-xs font-bold cursor-pointer"
                        >
                          Ver toda la colección
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
                          {displayedDesigns.map((garment, idx) => {
                            const isWorn =
                              showClothing &&
                              (selectedTopId === garment.id || selectedBottomId === garment.id);
                            return (
                              <CatalogDesignCard
                                key={garment.id}
                                garment={garment}
                                isWorn={isWorn}
                                canMoveLeft={idx > 0}
                                canMoveRight={idx < displayedDesigns.length - 1}
                                isDragTarget={
                                  dragTargetCardId === garment.id && draggingCardId !== garment.id
                                }
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

                        {visibleCount < categoryDesigns.length && (
                          <div className="flex justify-center pt-1 pb-2">
                            <button
                              type="button"
                              onClick={() => setVisibleCount((prev) => prev + 36)}
                              className="px-4 py-1.5 rounded-full bg-[#fff6e6] hover:bg-white border-2 border-[#d1a26c] text-[#4f260e] text-xs font-extrabold shadow-sm cursor-pointer transition-colors"
                            >
                              Ver más diseños ({categoryDesigns.length - visibleCount} restantes)
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* CLEAN 2D POSES VISUAL GALLERY */
                <div className="flex-1 min-h-[200px] overflow-y-auto studio-scroll px-0.5">
                  <div className="grid grid-cols-2 gap-2.5 pb-2">
                    {RUNWAY_MODEL_POSES.map((pose) => {
                      const active = activePose2DId === pose.id;
                      return (
                        <button
                          key={pose.id}
                          type="button"
                          onClick={() => {
                            playSfx('click');
                            setActivePose2DId(pose.id);
                            onNotify(`Pose 2D aplicada: ${pose.title}`);
                          }}
                          className={`group relative rounded-2xl overflow-hidden text-left transition-all cursor-pointer p-2 flex flex-col ${
                            active
                              ? 'bg-[#fff9ed] ring-[3px] ring-[#f7b924] shadow-md'
                              : 'bg-[#fcf2e3]/95 border-2 border-[#d4ad82] hover:border-[#b9773f]'
                          }`}
                        >
                          <div className="relative w-full aspect-[3/3.4] rounded-xl bg-[#f5e5d0]/75 overflow-hidden flex items-end justify-center p-1.5">
                            <img
                              src={pose.previewSrc}
                              alt={pose.title}
                              loading="lazy"
                              draggable={false}
                              className="w-full h-full object-contain object-bottom transition-transform duration-200 group-hover:scale-[1.03]"
                              style={{
                                transform: pose.flipX
                                  ? 'scaleX(-1)'
                                  : pose.framing === 'mid'
                                    ? 'scale(1.3) translateY(14%)'
                                    : undefined,
                              }}
                            />
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#4a2610]/85 text-[#ffefc8] text-[9px] font-bold">
                              {pose.badge}
                            </span>
                            {active && (
                              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#f5b924] text-[#3e1d05] flex items-center justify-center shadow">
                                <Check className="w-3 h-3" strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 px-0.5">
                            <p className="text-xs font-extrabold text-[#49230e] leading-tight">
                              {pose.title}
                            </p>
                            <p className="text-[10px] text-[#784826] leading-snug mt-0.5 line-clamp-2">
                              {pose.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
        defaultCategory={activeCategory === 'Todas' ? 'Camisas' : activeCategory}
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
