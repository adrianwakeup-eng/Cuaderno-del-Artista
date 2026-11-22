import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Eye,
  Heart,
  Palette,
  Pause,
  Pin,
  Play,
  Plus,
  RefreshCw,
  Scissors,
  Shirt,
  Sparkles,
  Trash2,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  DressingRoomCategory,
  DressingRoomGarment,
  FinishedProject,
} from '../types/crochet';
import { audioEngine } from '../utils/audioEngine';
import {
  ATELIER_YARN_COLORS,
  ArtisanCrochetFloralCluster,
  ArtisanYarnBallSwatch,
  HeaderMiniBasket,
  HeaderYarnHooksEmblem,
  MacrameCurtainWing,
} from './vestidor/AtelierDecorProps';
import {
  AtelierEditableStageProps,
  AtelierEditorToolbar,
  useAtelierVisualEditor,
} from './vestidor/AtelierVisualEditor';
import {
  AddEditDesignModal,
  GarmentDetailModal,
  VESTIDOR_CATEGORIES,
} from './vestidor/GarmentStudioModals';

type ModelViewId = 'front' | 'right' | 'back' | 'left';
type LeftRailMode = 'prendas' | 'colores' | 'poses' | 'girar' | 'zoom' | 'foto';

interface OfficialModelView {
  id: ModelViewId;
  label: string;
  shortLabel: string;
  srcWebp: string;
  srcPng: string;
}

/**
 * The 4 strictly official photographic views extracted faithfully from the original
 * reference photograph without altering face, body, or proportions.
 */
const OFFICIAL_MODEL_VIEWS: OfficialModelView[] = [
  {
    id: 'front',
    label: 'Frente',
    shortLabel: 'Frente',
    srcWebp: '/assets/vestidor/model-front.webp',
    srcPng: '/assets/vestidor/model-front.png',
  },
  {
    id: 'right',
    label: 'Perfil derecho',
    shortLabel: 'Perfil Der.',
    srcWebp: '/assets/vestidor/model-right.webp',
    srcPng: '/assets/vestidor/model-right.png',
  },
  {
    id: 'back',
    label: 'Espalda',
    shortLabel: 'Espalda',
    srcWebp: '/assets/vestidor/model-back.webp',
    srcPng: '/assets/vestidor/model-back.png',
  },
  {
    id: 'left',
    label: 'Perfil izquierdo',
    shortLabel: 'Perfil Izq.',
    srcWebp: '/assets/vestidor/model-left.webp',
    srcPng: '/assets/vestidor/model-left.png',
  },
];

/* Embroidered minimal line icons for the 5 carved wooden category tabs */
const CategoryTabIcon: React.FC<{ category: DressingRoomCategory; active: boolean }> = ({
  category,
  active,
}) => {
  const stroke = active ? '#4a290b' : '#f7e4c2';
  switch (category) {
    case 'Camisas':
      return (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
          <path
            d="M11 6L6 9L3 15L8 17L9 13V26H23V13L24 17L29 15L26 9L21 6L18.5 9.5H13.5L11 6Z"
            stroke={stroke}
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <line x1="16" y1="10" x2="16" y2="26" stroke={stroke} strokeWidth="1.4" strokeDasharray="2 2" />
        </svg>
      );
    case 'Suéteres':
      return (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
          <path
            d="M11 6C12.5 8.5 19.5 8.5 21 6L26 9L29 22L24 23L22 14V26H10V14L8 23L3 22L6 9L11 6Z"
            stroke={stroke}
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <line x1="10" y1="22.5" x2="22" y2="22.5" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    case 'Chalecos':
      return (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
          <path
            d="M11 6L8 7.5V13C8 15 9.5 16 10 16V26H22V16C22.5 16 24 15 24 13V7.5L21 6L16 14L11 6Z"
            stroke={stroke}
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <line x1="16" y1="14" x2="16" y2="26" stroke={stroke} strokeWidth="1.4" strokeDasharray="2 2.2" />
        </svg>
      );
    case 'Shorts':
      return (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
          <path
            d="M7 7H25L27 24H18.5L16 16.5L13.5 24H5L7 7Z"
            stroke={stroke}
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <line x1="7" y1="11" x2="25" y2="11" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    case 'Pantalones':
    default:
      return (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" aria-hidden="true">
          <path
            d="M8 6H24L25.5 26H19L16 14.5L13 26H6.5L8 6Z"
            stroke={stroke}
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <line x1="8" y1="10" x2="24" y2="10" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
  }
};

interface GoldenDressingRoomViewProps {
  customGarments: DressingRoomGarment[];
  finishedProjects?: FinishedProject[];
  onAddCustomGarment: (garment: DressingRoomGarment) => void;
  onUpdateCustomGarment?: (garment: DressingRoomGarment) => void;
  onDeleteCustomGarment: (id: string) => void;
  onSelectBrushColor: (hex: string) => void;
  onPinGarmentToNotebook: (garment: DressingRoomGarment) => void;
  onBackToNotebook: () => void;
  onNotify: (msg: string) => void;
}

export const GoldenDressingRoomView: React.FC<GoldenDressingRoomViewProps> = ({
  customGarments,
  onAddCustomGarment,
  onUpdateCustomGarment,
  onDeleteCustomGarment,
  onSelectBrushColor,
  onPinGarmentToNotebook,
  onBackToNotebook,
  onNotify,
}) => {
  // Active 4-view photographic state (0: Frente, 1: Perfil derecho, 2: Espalda, 3: Perfil izquierdo)
  const [viewIndex, setViewIndex] = useState<number>(0);
  const [turnDirection, setTurnDirection] = useState<1 | -1>(1);
  const [autoRotating, setAutoRotating] = useState<boolean>(false);

  // Left sage-green rail active tool & stage interactive controls
  const [activeRail, setActiveRail] = useState<LeftRailMode>('prendas');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [zoomPanY, setZoomPanY] = useState<number>(0);
  const [curtainsOpen, setCurtainsOpen] = useState<boolean>(true);
  const [sewingPaused, setSewingPaused] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState<boolean>(false);

  // Catalog state — KEPT EMPTY BY DEFAULT until real designs are added (Section 9)
  const [activeCategory, setActiveCategory] = useState<DressingRoomCategory>('Camisas');
  const [filterByCategory, setFilterByCategory] = useState<boolean>(false);
  const [selectedYarnHex, setSelectedYarnHex] = useState<string | null>(null);
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);
  const [selectedBottomId, setSelectedBottomId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Modals: Add/Edit Design, Garment Detail Lookbook, and Snapshot Photo Preview
  const [designModalOpen, setDesignModalOpen] = useState<boolean>(false);
  const [editingGarment, setEditingGarment] = useState<DressingRoomGarment | null>(null);
  const [detailGarment, setDetailGarment] = useState<DressingRoomGarment | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const colorTrayRef = useRef<HTMLDivElement>(null);
  const stageDragStartX = useRef<number | null>(null);

  // Visual Editor Controller (controls shown STRICTLY when editMode === true)
  const editor = useAtelierVisualEditor(editMode, onNotify);

  const currentView = OFFICIAL_MODEL_VIEWS[viewIndex];

  // Auto-rotation across the 4 official photographic views (never invents intermediate angles)
  useEffect(() => {
    if (!autoRotating) return;
    const interval = window.setInterval(() => {
      setTurnDirection(1);
      setViewIndex((prev) => (prev + 1) % OFFICIAL_MODEL_VIEWS.length);
    }, 1500);
    return () => window.clearInterval(interval);
  }, [autoRotating]);

  const stepView = useCallback((delta: 1 | -1) => {
    audioEngine.playStitchClick();
    setAutoRotating(false);
    setTurnDirection(delta);
    setViewIndex((prev) => (prev + delta + OFFICIAL_MODEL_VIEWS.length) % OFFICIAL_MODEL_VIEWS.length);
  }, []);

  const jumpToView = useCallback(
    (idx: number) => {
      if (idx === viewIndex) return;
      audioEngine.playStitchClick();
      setAutoRotating(false);
      setTurnDirection(idx > viewIndex ? 1 : -1);
      setViewIndex(idx);
    },
    [viewIndex]
  );

  // Keyboard arrow navigation between the 4 official views (outside modals & inputs)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (designModalOpen || detailGarment || capturedPhotoUrl || editMode) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepView(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepView(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [designModalOpen, detailGarment, capturedPhotoUrl, editMode, stepView]);

  // Catalog uses strictly real user-added designs (never loads old fake catalog!)
  const realDesigns = useMemo<DressingRoomGarment[]>(() => {
    return customGarments.filter((g) => Boolean(g));
  }, [customGarments]);

  const filteredDesigns = useMemo(() => {
    return realDesigns.filter((g) => {
      if (filterByCategory && g.category !== activeCategory) return false;
      if (selectedYarnHex) {
        const matchColor =
          g.accentColor?.toUpperCase() === selectedYarnHex.toUpperCase() ||
          g.palette?.some((p) => p.toUpperCase() === selectedYarnHex.toUpperCase());
        if (!matchColor) return false;
      }
      return true;
    });
  }, [realDesigns, filterByCategory, activeCategory, selectedYarnHex]);

  const wornTop = useMemo(
    () => (selectedTopId ? realDesigns.find((g) => g.id === selectedTopId) ?? null : null),
    [realDesigns, selectedTopId]
  );

  const wornBottom = useMemo(
    () => (selectedBottomId ? realDesigns.find((g) => g.id === selectedBottomId) ?? null : null),
    [realDesigns, selectedBottomId]
  );

  const handleWearToggle = (garment: DressingRoomGarment) => {
    audioEngine.playStitchClick();
    const isBottom =
      garment.garmentSlot === 'bottom' ||
      garment.category === 'Shorts' ||
      garment.category === 'Pantalones' ||
      garment.category === 'Bermudas';
    if (isBottom) {
      setSelectedBottomId((prev) => (prev === garment.id ? null : garment.id));
    } else {
      setSelectedTopId((prev) => (prev === garment.id ? null : garment.id));
    }
  };

  const handleSaveDesign = (garment: DressingRoomGarment, isEdit: boolean) => {
    if (isEdit && onUpdateCustomGarment) {
      onUpdateCustomGarment(garment);
      onNotify(`Diseño actualizado: ${garment.name}`);
    } else if (isEdit) {
      onDeleteCustomGarment(garment.id);
      onAddCustomGarment(garment);
      onNotify(`Diseño actualizado: ${garment.name}`);
    } else {
      onAddCustomGarment(garment);
      onNotify(`Diseño añadido al vestidor: ${garment.name}`);
    }
    setActiveCategory(
      VESTIDOR_CATEGORIES.includes(garment.category) ? garment.category : 'Camisas'
    );
  };

  const handleDeleteDesign = (id: string) => {
    audioEngine.playEraseBrush();
    onDeleteCustomGarment(id);
    if (selectedTopId === id) setSelectedTopId(null);
    if (selectedBottomId === id) setSelectedBottomId(null);
    if (detailGarment?.id === id) setDetailGarment(null);
  };

  const handlePickYarnSwatch = (hex: string, name: string) => {
    audioEngine.playYarnPluck(3);
    onSelectBrushColor(hex);
    setSelectedYarnHex((prev) => (prev === hex ? null : hex));
    onNotify(
      selectedYarnHex === hex
        ? 'Filtro de color quitado'
        : `Ovillo seleccionado: ${name} (${hex})`
    );
  };

  const scrollColorTray = (dir: -1 | 1) => {
    audioEngine.playStitchClick();
    colorTrayRef.current?.scrollBy({ left: dir * 160, behavior: 'smooth' });
  };

  // Real high-DPI composite studio photo capture (backdrop + crochet rug + official model + worn garment)
  const handleCaptureAtelierPhoto = async () => {
    audioEngine.playSaveChime();
    setActiveRail('foto');
    try {
      const W = 1080;
      const H = 1350;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => resolve(im);
          im.onerror = reject;
          im.src = src;
        });

      const [backdrop, rug, modelImg] = await Promise.all([
        loadImg('/assets/vestidor/atelier-backdrop.webp'),
        loadImg('/assets/vestidor/crochet-rug.webp'),
        loadImg(currentView.srcPng),
      ]);

      // Cover-crop warm sunlit backdrop
      const bScale = Math.max(W / backdrop.width, H / backdrop.height);
      const bw = backdrop.width * bScale;
      const bh = backdrop.height * bScale;
      ctx.drawImage(backdrop, (W - bw) / 2, (H - bh) / 2, bw, bh);

      // Draw braided circular crochet rug centered at floor
      const rugW = W * 0.72;
      const rugH = rugW * (rug.height / rug.width);
      ctx.save();
      ctx.shadowColor = 'rgba(72, 42, 16, 0.25)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.drawImage(rug, (W - rugW) / 2, H * 0.795, rugW, rugH);
      ctx.restore();

      // Natural grounded contact shadow directly under model's feet
      const footShadow = ctx.createRadialGradient(W / 2, H * 0.895, 10, W / 2, H * 0.895, 165);
      footShadow.addColorStop(0, 'rgba(68, 38, 16, 0.34)');
      footShadow.addColorStop(1, 'rgba(68, 38, 16, 0)');
      ctx.fillStyle = footShadow;
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.895, 170, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      // Full-body high-res official photographic model aligned precisely to rug
      const modH = H * 0.82;
      const modW = modH * (modelImg.width / modelImg.height);
      const modX = (W - modW) / 2;
      const modY = H * 0.92 - modH;
      ctx.drawImage(modelImg, modX, modY, modW, modH);

      // Composite worn top or bottom photo if user has added & worn real designs
      const drawWornOverlay = async (garment: DressingRoomGarment, isBottom: boolean) => {
        const photoSrc =
          currentView.id === 'back' && garment.backPhotoDataUrl
            ? garment.backPhotoDataUrl
            : garment.photoDataUrl;
        if (!photoSrc) return;
        const gImg = await loadImg(photoSrc);
        const scaleFactor = (garment.overlayScale ?? 100) / 100;
        const offsetYPct = (garment.overlayOffsetY ?? 0) / 100;
        const targetW = modW * (isBottom ? 0.54 : 0.76) * scaleFactor;
        const targetH = targetW * (gImg.height / gImg.width);
        const gx = W / 2 - targetW / 2;
        const gy =
          modY + modH * ((isBottom ? 0.44 : 0.17) + offsetYPct);
        ctx.drawImage(gImg, gx, gy, targetW, targetH);
      };
      if (wornBottom) await drawWornOverlay(wornBottom, true);
      if (wornTop) await drawWornOverlay(wornTop, false);

      // Subtle luxury atelier signature watermark along lower-right floor
      ctx.fillStyle = 'rgba(94, 58, 28, 0.78)';
      ctx.font = '600 22px "Cinzel", Georgia, serif';
      ctx.textAlign = 'right';
      ctx.fillText(`El Vestidor Dorado · ${currentView.label}`, W - 36, H - 28);

      setCapturedPhotoUrl(canvas.toDataURL('image/png'));
      onNotify(`Fotografía de estudio capturada (${currentView.label})`);
    } catch {
      onNotify('No se pudo capturar la fotografía del vestidor');
    }
  };

  // Drag horizontally on the stage to rotate between the 4 official views
  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (editMode) {
      editor.selectItem(null);
      return;
    }
    stageDragStartX.current = e.clientX;
  };

  const handleStagePointerUp = (e: React.PointerEvent) => {
    if (editMode || stageDragStartX.current === null) return;
    const dx = e.clientX - stageDragStartX.current;
    stageDragStartX.current = null;
    if (Math.abs(dx) > 48) {
      stepView(dx > 0 ? 1 : -1);
    }
  };

  const handleLeftRailClick = (mode: LeftRailMode) => {
    audioEngine.playStitchClick();
    setActiveRail(mode);
    if (mode === 'prendas') {
      if (window.innerWidth < 1024) setMobileCatalogOpen(true);
    } else if (mode === 'colores') {
      if (window.innerWidth < 1024) setMobileCatalogOpen(true);
      window.setTimeout(() => {
        colorTrayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 120);
    } else if (mode === 'girar') {
      setAutoRotating((v) => !v);
    } else if (mode === 'zoom') {
      setZoomLevel((z) => {
        const next = z === 100 ? 128 : z === 128 ? 156 : 100;
        if (next === 100) setZoomPanY(0);
        return next;
      });
    } else if (mode === 'foto') {
      void handleCaptureAtelierPhoto();
    }
  };

  const renderWornGarmentLayer = (garment: DressingRoomGarment, isBottom: boolean) => {
    if (currentView.id === 'left' || currentView.id === 'right') return null;
    const src =
      currentView.id === 'back' && garment.backPhotoDataUrl
        ? garment.backPhotoDataUrl
        : garment.photoDataUrl;
    if (!src) return null;
    const scale = (garment.overlayScale ?? 100) / 100;
    const offsetY = garment.overlayOffsetY ?? 0;
    return (
      <img
        src={src}
        alt={garment.name}
        draggable={false}
        style={{
          top: `${(isBottom ? 44 : 17.5) + offsetY}%`,
          width: `${(isBottom ? 50 : 72) * scale}%`,
        }}
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 object-contain drop-shadow-[0_6px_12px_rgba(46,24,10,0.28)]"
      />
    );
  };

  /* Shared Pink Crocheted Catalog Panel Content (Desktop Right Column + Mobile Drawer) */
  const renderCatalogPanel = () => (
    <div className="flex flex-col h-full min-h-0">
      {/* Dusty-Rose Thick Crocheted Outer Frame */}
      <div className="relative flex-1 min-h-0 rounded-[26px] atelier-crochet-rose-frame p-2.5 sm:p-3 flex flex-col">
        {/* Warm Woven Cream Interior Surface */}
        <div className="flex-1 min-h-0 rounded-[20px] atelier-crochet-cream-surface border-2 border-[#c69d75]/80 p-2.5 sm:p-3 flex flex-col gap-2.5 overflow-hidden">
          {/* 5 Carved Walnut-Wood Category Tabs */}
          <div className="grid grid-cols-5 gap-1.5 shrink-0">
            {VESTIDOR_CATEGORIES.map((cat) => {
              const isSelected = filterByCategory && activeCategory === cat;
              const isDefaultHighlight = !filterByCategory && activeCategory === cat;
              const activeVisual = isSelected || isDefaultHighlight;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    audioEngine.playStitchClick();
                    if (filterByCategory && activeCategory === cat) {
                      setFilterByCategory(false);
                    } else {
                      setActiveCategory(cat);
                      setFilterByCategory(true);
                    }
                  }}
                  title={
                    filterByCategory && activeCategory === cat
                      ? `Mostrando ${cat} (clic para ver todas)`
                      : `Filtrar por ${cat}`
                  }
                  className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c98b24] ${
                    activeVisual
                      ? 'atelier-knit-btn-active text-[#3c2008] scale-[1.02]'
                      : 'atelier-wood-btn text-[#fff4de]'
                  }`}
                >
                  <CategoryTabIcon category={cat} active={activeVisual} />
                  <span className="text-[10.5px] sm:text-[11px] font-bold leading-tight truncate max-w-full">
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Collection Action Bar: Category Count + Prominent "Añadir diseño" Button */}
          <div className="flex items-center justify-between gap-2 px-0.5 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11.5px] font-bold text-[#5a3518] truncate">
                {filterByCategory ? activeCategory : 'Catálogo Artesanal'}
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#e9d3b1] border border-[#c69c65] font-mono-tab text-[10px] font-bold text-[#5b3516]">
                {filteredDesigns.length}
              </span>
              {(filterByCategory || selectedYarnHex) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterByCategory(false);
                    setSelectedYarnHex(null);
                  }}
                  className="text-[10.5px] font-semibold text-[#8c4f1d] underline hover:text-[#4e2608] cursor-pointer"
                >
                  Ver todo
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                setEditingGarment(null);
                setDesignModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl atelier-gold-pill-btn text-[11.5px] font-bold text-[#3b1f07] cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Añadir diseño</span>
            </button>
          </div>

          {/* Garment Cards Area — EMPTY BY DEFAULT (Zero fake/old catalog items) */}
          <div className="flex-1 min-h-0 overflow-y-auto studio-scroll pr-0.5">
            {filteredDesigns.length === 0 ? (
              <div className="h-full min-h-[210px] rounded-2xl border-2 border-dashed border-[#c79d70]/85 bg-[#fff9ef]/70 p-4 sm:p-5 flex flex-col items-center justify-center text-center gap-3 atelier-stitch-inset">
                <div className="w-14 h-14 rounded-full atelier-crochet-cream-surface border-2 border-[#d8b56a] shadow-inner flex items-center justify-center text-[#8a5d32]">
                  <Shirt className="w-7 h-7 stroke-[1.7]" />
                </div>
                <div className="space-y-1 max-w-[290px]">
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#4b2910]">
                    {realDesigns.length === 0
                      ? 'Tu colección real comienza aquí'
                      : 'Sin diseños con este filtro'}
                  </h3>
                  <p className="font-editorial italic text-[13px] leading-snug text-[#6d4726]">
                    {realDesigns.length === 0
                      ? 'Este catálogo permanece vacío y listo para tus fotografías reales de ropa artesanal en crochet.'
                      : 'Prueba quitando el filtro de categoría o color, o añade un nuevo diseño real.'}
                  </p>
                </div>

                {/* Subtle empty boutique lookbook slot preview indicators */}
                <div className="grid grid-cols-4 gap-2 w-full max-w-[280px] opacity-55 pointer-events-none">
                  {[0, 1, 2, 3].map((slot) => (
                    <div
                      key={slot}
                      className="aspect-[3/4] rounded-xl border border-dashed border-[#bfa07a] bg-[#f8ecd9]/80 flex items-center justify-center"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#c29758]" />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playStitchClick();
                    setEditingGarment(null);
                    setDesignModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl atelier-wood-btn text-xs font-bold text-[#fff5e0] cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#f5d07a]" />
                  <span>Añadir primer diseño</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 pb-1">
                {filteredDesigns.map((garment) => {
                  const isWorn = garment.id === selectedTopId || garment.id === selectedBottomId;
                  const isFav = Boolean(favorites[garment.id]);
                  return (
                    <div
                      key={garment.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleWearToggle(garment)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleWearToggle(garment);
                        }
                      }}
                      className={`group relative rounded-2xl p-1.5 flex flex-col transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#c68a24] hover:-translate-y-0.5 ${
                        isWorn
                          ? 'bg-[#fff8ea] border-2 border-[#d19a32] shadow-[0_8px_18px_rgba(128,82,18,0.28),0_0_0_2px_rgba(244,210,124,0.65)]'
                          : 'bg-[#fff9ef]/92 border-2 border-[#d4b38a] hover:border-[#b98332] shadow-[0_5px_12px_rgba(88,52,22,0.14)]'
                      }`}
                    >
                      {/* High-Definition Garment Photo Frame */}
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-b from-[#faf1e2] to-[#efe0c6] border border-[#dfc098]/75">
                        {garment.photoDataUrl ? (
                          <img
                            src={garment.photoDataUrl}
                            alt={garment.name}
                            loading="lazy"
                            draggable={false}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-[#7d552c]">
                            <Shirt className="w-7 h-7 opacity-45" />
                            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">
                              {garment.category}
                            </span>
                          </div>
                        )}

                        {/* Selected/Worn Golden Check Badge */}
                        {isWorn && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#e6ae2e] border-2 border-[#fff8ed] text-[#3a1f08] shadow flex items-center justify-center text-[11px] font-black">
                            ✓
                          </span>
                        )}

                        {/* Top-Left Favorite Heart */}
                        <button
                          type="button"
                          aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                          onClick={(e) => {
                            e.stopPropagation();
                            audioEngine.playToggleChime(!isFav);
                            setFavorites((prev) => ({ ...prev, [garment.id]: !prev[garment.id] }));
                          }}
                          className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[#fffaf0]/95 shadow flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isFav ? 'fill-[#a2243c] text-[#a2243c]' : 'text-[#6c4522]'
                            }`}
                          />
                        </button>

                        {/* Hover Quick Actions Bar: Details, Edit, Pin, Delete */}
                        <div className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            type="button"
                            title="Ver detalles"
                            onClick={(e) => {
                              e.stopPropagation();
                              audioEngine.playStitchClick();
                              setDetailGarment(garment);
                            }}
                            className="w-6 h-6 rounded-full bg-[#4a2b16]/90 hover:bg-[#6e4120] text-[#fff2d6] flex items-center justify-center shadow cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Editar diseño"
                            onClick={(e) => {
                              e.stopPropagation();
                              audioEngine.playStitchClick();
                              setEditingGarment(garment);
                              setDesignModalOpen(true);
                            }}
                            className="w-6 h-6 rounded-full bg-[#4a2b16]/90 hover:bg-[#6e4120] text-[#fff2d6] flex items-center justify-center shadow cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Llevar al Cuaderno"
                            onClick={(e) => {
                              e.stopPropagation();
                              audioEngine.playYarnPluck(4);
                              onPinGarmentToNotebook(garment);
                            }}
                            className="w-6 h-6 rounded-full bg-[#4a2b16]/90 hover:bg-[#6e4120] text-[#fff2d6] flex items-center justify-center shadow cursor-pointer"
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Eliminar diseño"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDesign(garment.id);
                            }}
                            className="w-6 h-6 rounded-full bg-[#871f32]/90 hover:bg-[#a8263e] text-[#fff0f2] flex items-center justify-center shadow cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Card Title + Hook & Palette Swatches */}
                      <div className="mt-1.5 px-1 text-center">
                        <p className="font-body font-bold text-[11.5px] leading-tight text-[#3d210b] line-clamp-1">
                          {garment.name}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-1">
                          <span className="font-mono-tab text-[10px] font-semibold text-[#774f28]">
                            {garment.hookSizeMm}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {garment.palette.slice(0, 3).map((hex) => (
                              <span
                                key={hex}
                                style={{ backgroundColor: hex }}
                                className="w-2.5 h-2.5 rounded-full border border-[#6a4420]/50"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Cream Knitted "Colores disponibles" Ovillos Tray */}
          <div className="shrink-0 pt-0.5">
            <div className="relative rounded-full atelier-knit-btn px-2 py-2 flex items-center gap-1.5">
              {/* Floating Cream Label Pill matching the approved design */}
              <span className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#f8ecd8] border border-[#c8a274] shadow-xs text-[11px] font-bold text-[#4a2a10] whitespace-nowrap">
                Colores disponibles
              </span>

              <button
                type="button"
                aria-label="Desplazar colores a la izquierda"
                onClick={() => scrollColorTray(-1)}
                className="w-7 h-7 rounded-full hover:bg-[#e7d1ae] text-[#5e3818] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div
                ref={colorTrayRef}
                className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-0.5"
                style={{ scrollbarWidth: 'none' }}
              >
                {ATELIER_YARN_COLORS.map((yarn) => (
                  <ArtisanYarnBallSwatch
                    key={yarn.id}
                    color={yarn}
                    size={40}
                    selected={selectedYarnHex === yarn.hex}
                    onClick={() => handlePickYarnSwatch(yarn.hex, yarn.name)}
                  />
                ))}
              </div>

              <button
                type="button"
                aria-label="Desplazar colores a la derecha"
                onClick={() => scrollColorTray(1)}
                className="w-7 h-7 rounded-full hover:bg-[#e7d1ae] text-[#5e3818] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Signature 360° Rotation Controls (Wooden ← | Golden Girar 360° | Wooden →) */}
      <div className="mt-2.5 flex items-center justify-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => stepView(-1)}
          aria-label="Girar vista anterior"
          title="Vista anterior (←)"
          className="w-11 h-10 rounded-xl atelier-wood-btn flex items-center justify-center text-[#fff2d6] cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => {
            audioEngine.playStitchClick();
            setAutoRotating((v) => !v);
          }}
          aria-pressed={autoRotating}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full atelier-gold-pill-btn text-sm font-bold text-[#3d2007] cursor-pointer ${
            autoRotating ? 'ring-2 ring-[#fff6d6]' : ''
          }`}
        >
          <RefreshCw className={`w-4 h-4 stroke-[2.4] ${autoRotating ? 'animate-spin' : ''}`} />
          <span>{autoRotating ? 'Detener giro' : 'Girar 360°'}</span>
        </button>

        <button
          type="button"
          onClick={() => stepView(1)}
          aria-label="Girar vista siguiente"
          title="Vista siguiente (→)"
          className="w-11 h-10 rounded-xl atelier-wood-btn flex items-center justify-center text-[#fff2d6] cursor-pointer"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden select-none text-[#3d210b]"
      style={{
        backgroundColor: '#ebd4be',
        backgroundImage: "url('/assets/vestidor/atelier-backdrop.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
      }}
    >
      {/* Warm sunlit atmospheric vignette to unify lighting across wall, wood, and fabrics */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 44% 38%, rgba(255, 248, 234, 0.22) 0%, rgba(164, 112, 72, 0.08) 65%, rgba(78, 44, 22, 0.24) 100%)',
        }}
      />

      {/* ========================================================================
          TOP NATURAL WOOD HEADER (Approved Layout + Artisan Utility Switches)
      ======================================================================== */}
      <header className="relative z-40 px-2.5 sm:px-5 pt-2 pb-1.5 flex items-center justify-between gap-2 shrink-0">
        {/* Left Wooden Plaque: Return to Cuaderno del Artista Crochet */}
        <div className="relative flex items-center shrink-0">
          <HeaderMiniBasket className="hidden sm:block absolute -left-2 -top-2 w-12 h-10 z-20 pointer-events-none" />
          <button
            type="button"
            onClick={() => {
              audioEngine.playWardrobeDoor(false);
              onBackToNotebook();
            }}
            title="Volver al Cuaderno del Artista"
            className="atelier-wood-plaque rounded-full pl-3.5 sm:pl-10 pr-4 py-1.5 flex items-center gap-2 text-left hover:brightness-110 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#f5d17c] shrink-0" />
            <div className="leading-tight">
              <span className="block font-editorial font-bold text-[12px] sm:text-[14px] text-[#fff6e4] whitespace-nowrap">
                Cuaderno del Artista
              </span>
              <span className="block font-editorial italic text-[11px] text-[#e7c784] -mt-0.5">
                Crochet
              </span>
            </div>
          </button>
        </div>

        {/* Center Hero Walnut Plaque: El Vestidor Dorado · Colección Crochet Fuentes Nazco */}
        <div className="atelier-wood-plaque rounded-[28px] px-4 sm:px-7 py-1.5 flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <HeaderYarnHooksEmblem className="hidden xs:block sm:block w-9 h-9 sm:w-11 sm:h-11" />
          <div className="text-center min-w-0">
            <h1
              className="font-display text-base sm:text-2xl lg:text-[26px] font-bold tracking-[0.04em] leading-none truncate"
              style={{
                color: '#f4cf73',
                textShadow: '0 2px 4px rgba(24, 10, 3, 0.85), 0 0 12px rgba(235, 188, 86, 0.35)',
              }}
            >
              El Vestidor Dorado
            </h1>
            <p className="mt-0.5 font-editorial italic text-[11.5px] sm:text-[14px] text-[#fff4de] tracking-wide truncate">
              Colección Crochet Fuentes Nazco
            </p>
          </div>
        </div>

        {/* Right: Tactile Wooden Switches (Curtains, Sewing Machine, Edit Mode) + Lush 3D Flowers */}
        <div className="relative flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              audioEngine.playToggleChime(!curtainsOpen);
              setCurtainsOpen((v) => !v);
            }}
            title={curtainsOpen ? 'Cerrar cortinas de macramé' : 'Abrir cortinas de macramé'}
            className="atelier-wood-btn rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-[#fff3da] hidden md:inline-flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f2cb72]" />
            <span>{curtainsOpen ? 'Cortinas' : 'Abrir'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioEngine.playToggleChime(sewingPaused);
              setSewingPaused((v) => !v);
            }}
            title={sewingPaused ? 'Reanudar máquina de coser' : 'Pausar máquina de coser'}
            className="atelier-wood-btn rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-[#fff3da] hidden md:inline-flex items-center gap-1 cursor-pointer"
          >
            {sewingPaused ? (
              <Play className="w-3.5 h-3.5 text-[#f2cb72]" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-[#f2cb72]" />
            )}
            <span className="hidden xl:inline">{sewingPaused ? 'Coser' : 'Máquina'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioEngine.playToggleChime(!editMode);
              setEditMode((v) => !v);
              onNotify(
                !editMode
                  ? 'Modo Editor Visual activado — selecciona elementos del atelier'
                  : 'Modo Editor cerrado'
              );
            }}
            aria-pressed={editMode}
            title="Activar o desactivar el Modo Editor Visual"
            className={`rounded-xl px-2.5 py-1.5 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all ${
              editMode
                ? 'atelier-gold-pill-btn text-[#3d2007]'
                : 'atelier-wood-btn text-[#fff3da]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{editMode ? 'Salir Editor' : 'Editar'}</span>
          </button>

          {/* Mobile/Tablet Catalog Drawer Trigger */}
          <button
            type="button"
            onClick={() => {
              audioEngine.playStitchClick();
              setMobileCatalogOpen(true);
            }}
            className="lg:hidden rounded-xl px-2.5 py-1.5 atelier-gold-pill-btn text-[11px] font-bold text-[#3d2007] inline-flex items-center gap-1 cursor-pointer"
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Catálogo</span>
          </button>

          {/* Signature Top-Right Crocheted Floral Cluster */}
          <ArtisanCrochetFloralCluster className="hidden xl:block w-36 h-20 -mr-3 -my-4 pointer-events-none" />
        </div>
      </header>

      {/* Visual Editor Floating Toolbar — STRICTLY visible ONLY in Edit Mode (Section 8) */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 pb-1"
          >
            <AtelierEditorToolbar editor={editor} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================
          MAIN ATELIER WORKSPACE (Left Sage Rail + 4 Views + Center Stage + Right Pink Catalog)
      ======================================================================== */}
      <div className="relative z-20 flex-1 min-h-0 flex gap-2 sm:gap-3 px-2 sm:px-4 pb-2.5 pt-0.5 overflow-hidden">
        {/* 1. LEFT SAGE-GREEN CROCHETED MENU RAIL (Desktop & Tablet Vertical) */}
        <aside className="hidden sm:flex flex-col justify-between w-[86px] md:w-[96px] shrink-0 rounded-[28px] atelier-crochet-sage-rail p-2 gap-1.5 z-30">
          {(
            [
              { id: 'prendas', label: 'Prendas', icon: Shirt, color: '#6b3e19' },
              { id: 'colores', label: 'Colores', icon: Palette, color: '#b42958' },
              { id: 'poses', label: 'Poses', icon: User, color: '#9c253d' },
              { id: 'girar', label: 'Girar 360°', icon: RefreshCw, color: '#8f2238' },
              { id: 'zoom', label: 'Zoom', icon: ZoomIn, color: '#9c253d' },
              { id: 'foto', label: 'Foto', icon: Camera, color: '#9e2144' },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const isActive =
              activeRail === item.id ||
              (item.id === 'girar' && autoRotating) ||
              (item.id === 'zoom' && zoomLevel > 100);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLeftRailClick(item.id)}
                className={`flex-1 min-h-[52px] rounded-2xl px-1.5 py-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fff4d4] ${
                  isActive ? 'atelier-knit-btn-active' : 'atelier-knit-btn'
                }`}
              >
                <Icon
                  className={`w-5 h-5 md:w-6 md:h-6 shrink-0 ${
                    item.id === 'girar' && autoRotating ? 'animate-spin' : ''
                  }`}
                  style={{ color: isActive ? '#5a2d0a' : item.color }}
                  strokeWidth={2.2}
                />
                <span className="font-body text-[11px] font-bold leading-none text-[#3d2109] text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </aside>

        {/* 2. VERTICAL 4-VIEW OFFICIAL PHOTOGRAPHIC STRIP (Desktop/Tablet) */}
        <nav
          aria-label="Cuatro vistas oficiales del modelo"
          className="hidden md:flex flex-col justify-between w-[84px] xl:w-[96px] shrink-0 rounded-[22px] atelier-crochet-cream-surface border-[3px] border-[#d3b286] p-1.5 gap-1.5 shadow-[0_12px_26px_rgba(68,40,18,0.22)] z-30"
        >
          {OFFICIAL_MODEL_VIEWS.map((view, idx) => {
            const selected = idx === viewIndex;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => jumpToView(idx)}
                aria-label={`Ver modelo: ${view.label}`}
                aria-current={selected ? 'true' : undefined}
                className={`group relative flex-1 min-h-0 rounded-xl overflow-hidden transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c98a22] ${
                  selected
                    ? 'bg-gradient-to-b from-[#f8e7ce] to-[#ecd2ae] border-2 border-[#c88c24] shadow-[0_0_0_2px_rgba(244,210,126,0.55)]'
                    : 'bg-gradient-to-b from-[#f3e3cd] to-[#e6cdb0] border border-[#cfb089] hover:border-[#b78436] opacity-90 hover:opacity-100'
                }`}
              >
                <picture>
                  <source srcSet={view.srcWebp} type="image/webp" />
                  <img
                    src={view.srcPng}
                    alt={view.label}
                    draggable={false}
                    className="w-full h-full object-contain object-bottom pt-1 transition-transform duration-200 group-hover:scale-[1.03]"
                  />
                </picture>
                <span
                  className={`absolute inset-x-0 bottom-0 py-0.5 text-[9px] font-bold tracking-wide text-center ${
                    selected
                      ? 'bg-[#6b421c]/90 text-[#fff4d8]'
                      : 'bg-[#4b2d15]/65 text-[#fff6e5]'
                  }`}
                >
                  {view.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>

        {/* 3. CENTRAL SUNLIT ATELIER STAGE (Curtains + Sewing Machine + Rug + Full-Body Model + Editable Props) */}
        <section
          ref={stageRef}
          onPointerDown={handleStagePointerDown}
          onPointerUp={handleStagePointerUp}
          className="relative flex-1 min-w-0 min-h-0 rounded-[24px] overflow-hidden flex items-end justify-center"
        >
          {/* Left & Right Golden Macramé Curtains with Suspended Oscillating Dreamcatchers */}
          <MacrameCurtainWing
            side="left"
            isOpen={curtainsOpen}
            className="absolute left-0 top-0 h-[84%] w-[28%] max-w-[235px] min-w-[100px] z-20"
          />
          <MacrameCurtainWing
            side="right"
            isOpen={curtainsOpen}
            className="absolute right-0 top-0 h-[84%] w-[28%] max-w-[235px] min-w-[100px] z-20"
          />

          {/* Editable Atelier Stage Props (Vintage Sewing Machine, Plant, Yarn Basket, Sunflower, Teddy Bear) */}
          <AtelierEditableStageProps
            editor={editor}
            editMode={editMode}
            sewingPaused={sewingPaused}
            onToggleSewing={() => {
              audioEngine.playToggleChime(sewingPaused);
              setSewingPaused((v) => !v);
            }}
            stageRef={stageRef}
          />

          {/* Concentric Circular Braided Crochet Rug aligned naturally on the wooden floor */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[2.2%] w-[78%] max-w-[490px] min-w-[240px] z-10"
          >
            <div className="relative w-full">
              <div className="absolute inset-x-[6%] bottom-[-6%] h-[32%] rounded-full bg-[#4a2b12]/30 blur-[10px]" />
              <img
                src="/assets/vestidor/crochet-rug.webp"
                alt="Alfombra circular artesanal de crochet"
                draggable={false}
                className="relative w-full h-auto block drop-shadow-[0_6px_12px_rgba(74,42,16,0.22)]"
              />
            </div>
          </div>

          {/* HERO PHOTOGRAPHIC 2.5D MODEL — Full Body Visible, Feet Grounded on Crochet Rug */}
          <div
            className="relative z-20 h-[92%] max-h-[820px] aspect-[640/1440] flex items-end justify-center mb-[5.2%] transition-transform duration-300 ease-out"
            style={{
              transform: `scale(${zoomLevel / 100}) translateY(${zoomPanY}%)`,
              transformOrigin: '50% 62%',
            }}
          >
            {/* Soft natural floor contact shadow directly beneath the model's bare feet */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[2.2%] left-1/2 -translate-x-1/2 w-[56%] h-[3.6%] rounded-full bg-[#3f230e]/42 blur-[6px]"
            />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentView.id}
                initial={{ opacity: 0.25, scale: 0.985, x: turnDirection * 12 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0.25, scale: 0.985, x: turnDirection * -12 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full h-full flex items-end justify-center"
              >
                <picture className="w-full h-full flex items-end justify-center">
                  <source srcSet={currentView.srcWebp} type="image/webp" />
                  <img
                    src={currentView.srcPng}
                    alt={`Modelo oficial — vista ${currentView.label}`}
                    draggable={false}
                    decoding="async"
                    className="w-full h-full object-contain object-bottom drop-shadow-[0_14px_20px_rgba(68,38,16,0.2)]"
                  />
                </picture>

                {/* Optional Worn Real Garment Layers (only when user adds & puts on real garments) */}
                {wornBottom && renderWornGarmentLayer(wornBottom, true)}
                {wornTop && renderWornGarmentLayer(wornTop, false)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Discreet Top-Center View & Zoom Pill (Interactive when Poses or Zoom rail active) */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 flex-wrap justify-center">
            <div className="px-3 py-1 rounded-full bg-[#4b2d18]/80 backdrop-blur-[2px] border border-[#d8b56a]/75 text-[11px] font-semibold text-[#fff4dc] shadow flex items-center gap-2">
              <span>Vista: {currentView.label}</span>
              {(wornTop || wornBottom) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopId(null);
                    setSelectedBottomId(null);
                  }}
                  className="underline text-[#f4cf73] hover:text-white cursor-pointer"
                >
                  Quitar prendas
                </button>
              )}
            </div>

            {/* Interactive Zoom Slider Pill when zoomed or Zoom tool selected */}
            {(activeRail === 'zoom' || zoomLevel > 100) && (
              <div className="px-2.5 py-1 rounded-full atelier-crochet-cream-surface border border-[#b98b4e] shadow flex items-center gap-1.5 text-[#4a290d]">
                <button
                  type="button"
                  aria-label="Alejar"
                  onClick={() => {
                    const next = Math.max(100, zoomLevel - 15);
                    setZoomLevel(next);
                    if (next === 100) setZoomPanY(0);
                  }}
                  className="p-0.5 rounded hover:bg-[#e5cba3] cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono-tab text-[11px] font-bold w-10 text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  aria-label="Acercar"
                  onClick={() => setZoomLevel((z) => Math.min(175, z + 15))}
                  className="p-0.5 rounded hover:bg-[#e5cba3] cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {zoomLevel > 100 && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoomLevel(100);
                      setZoomPanY(0);
                    }}
                    className="text-[10px] font-bold underline text-[#8b4f14] cursor-pointer ml-0.5"
                  >
                    Cuerpo completo
                  </button>
                )}
              </div>
            )}

            {/* Quick 4-view pill strip when Poses rail is active */}
            {activeRail === 'poses' && (
              <div className="px-2 py-0.5 rounded-full atelier-crochet-cream-surface border border-[#b98b4e] shadow flex items-center gap-1">
                {OFFICIAL_MODEL_VIEWS.map((v, idx) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => jumpToView(idx)}
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold cursor-pointer ${
                      idx === viewIndex
                        ? 'bg-[#c98c24] text-[#fffaf0]'
                        : 'text-[#5b3516] hover:bg-[#ead4b0]'
                    }`}
                  >
                    {v.shortLabel}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile / Tablet Compact 4-View + Action Strip pinned cleanly at stage bottom */}
          <div className="md:hidden absolute bottom-2 inset-x-2 z-30 flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-2xl atelier-crochet-cream-surface border-2 border-[#c8a274] shadow-lg">
            <div className="flex items-center gap-1">
              {OFFICIAL_MODEL_VIEWS.map((v, idx) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => jumpToView(idx)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                    idx === viewIndex
                      ? 'atelier-knit-btn-active text-[#3c2008]'
                      : 'bg-[#f4e4cb] text-[#5c3618]'
                  }`}
                >
                  {v.shortLabel}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Girar 360"
                onClick={() => setAutoRotating((v) => !v)}
                className={`p-1.5 rounded-lg cursor-pointer ${
                  autoRotating ? 'atelier-knit-btn-active' : 'atelier-wood-btn text-[#fff2d6]'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoRotating ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                aria-label="Capturar foto"
                onClick={() => void handleCaptureAtelierPhoto()}
                className="p-1.5 rounded-lg atelier-wood-btn text-[#fff2d6] cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* 4. RIGHT DUSTY-ROSE CROCHETED CATALOG PANEL (Desktop Inline) */}
        <aside className="hidden lg:flex flex-col w-[390px] xl:w-[450px] 2xl:w-[495px] shrink-0 min-h-0 z-30">
          {renderCatalogPanel()}
        </aside>
      </div>

      {/* ========================================================================
          MOBILE / TABLET SLIDE-OVER CATALOG DRAWER (< lg)
      ======================================================================== */}
      <AnimatePresence>
        {mobileCatalogOpen && (
          <div className="lg:hidden fixed inset-0 z-[75] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileCatalogOpen(false)}
              className="absolute inset-0 bg-[#1f1006]/60 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative z-10 w-[92vw] max-w-[440px] h-full p-2.5 flex flex-col bg-[#ebd5be]/95"
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-display text-sm font-bold text-[#4a280e]">
                  Catálogo Artesanal
                </span>
                <button
                  type="button"
                  onClick={() => setMobileCatalogOpen(false)}
                  className="w-8 h-8 rounded-full atelier-wood-btn text-[#fff2d6] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">{renderCatalogPanel()}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================
          HANDCRAFTED MODALS: ADD/EDIT DESIGN, DETAIL VIEW, PHOTO SNAPSHOT
      ======================================================================== */}
      <AddEditDesignModal
        isOpen={designModalOpen}
        initialGarment={editingGarment}
        defaultCategory={activeCategory}
        onClose={() => {
          setDesignModalOpen(false);
          setEditingGarment(null);
        }}
        onSave={handleSaveDesign}
      />

      <GarmentDetailModal
        garment={detailGarment}
        isWorn={
          Boolean(detailGarment) &&
          (detailGarment?.id === selectedTopId || detailGarment?.id === selectedBottomId)
        }
        isFav={Boolean(detailGarment && favorites[detailGarment.id])}
        onClose={() => setDetailGarment(null)}
        onWear={() => {
          if (detailGarment) handleWearToggle(detailGarment);
        }}
        onEdit={() => {
          if (!detailGarment) return;
          setEditingGarment(detailGarment);
          setDetailGarment(null);
          setDesignModalOpen(true);
        }}
        onToggleFav={() => {
          if (!detailGarment) return;
          audioEngine.playToggleChime(!favorites[detailGarment.id]);
          setFavorites((prev) => ({
            ...prev,
            [detailGarment.id]: !prev[detailGarment.id],
          }));
        }}
        onPinToNotebook={() => {
          if (!detailGarment) return;
          audioEngine.playYarnPluck(4);
          onPinGarmentToNotebook(detailGarment);
          setDetailGarment(null);
        }}
        onPickColor={(hex) => {
          audioEngine.playYarnPluck(2);
          onSelectBrushColor(hex);
          onNotify(`Color cargado al pincel: ${hex}`);
        }}
        onDelete={() => {
          if (detailGarment) handleDeleteDesign(detailGarment.id);
        }}
      />

      {/* Captured Studio Photo Preview Modal */}
      {capturedPhotoUrl && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-[#231208]/75 backdrop-blur-[3px] p-4"
          onClick={() => setCapturedPhotoUrl(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[26px] atelier-crochet-rose-frame p-2.5 shadow-2xl"
          >
            <div className="rounded-[20px] atelier-crochet-cream-surface border-2 border-[#cfa97a] overflow-hidden">
              <div className="atelier-wood-plaque border-0 border-b-2 border-[#d8b56a] rounded-none px-4 py-2.5 flex items-center justify-between">
                <span className="font-display text-sm font-bold text-[#f7da92]">
                  Fotografía del Atelier · {currentView.label}
                </span>
                <button
                  type="button"
                  onClick={() => setCapturedPhotoUrl(null)}
                  className="w-7 h-7 rounded-full bg-[#3a1f0f] text-[#fff0cf] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 space-y-3">
                <img
                  src={capturedPhotoUrl}
                  alt="Captura de El Vestidor Dorado"
                  className="w-full max-h-[58vh] object-contain rounded-xl border border-[#cfa97a] shadow"
                />
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={capturedPhotoUrl}
                    download={`vestidor-dorado-${currentView.id}.png`}
                    className="py-2 rounded-xl atelier-gold-pill-btn text-xs font-bold text-[#3b1f07] flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PNG</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const outfit = [wornTop?.name, wornBottom?.name].filter(Boolean).join(' + ');
                      onPinGarmentToNotebook({
                        id: `atelier-photo-${Date.now()}`,
                        name: outfit ? `Estudio: ${outfit}` : `El Vestidor Dorado (${currentView.label})`,
                        category: wornTop?.category || wornBottom?.category || 'Camisas',
                        subtitle: 'Fotografía oficial capturada en El Vestidor Dorado.',
                        fiber: wornTop?.fiber || wornBottom?.fiber || 'Crochet Fuentes Nazco',
                        hookSizeMm: wornTop?.hookSizeMm || wornBottom?.hookSizeMm || '3.5 mm',
                        stitchNote:
                          wornTop?.stitchNote ||
                          wornBottom?.stitchNote ||
                          `Vista ${currentView.label} capturada en el atelier.`,
                        palette: wornTop?.palette || wornBottom?.palette || ['#D8B56A', '#F5E8D3', '#8FA68A'],
                        accentColor: '#D8B56A',
                        photoDataUrl: capturedPhotoUrl,
                      });
                      setCapturedPhotoUrl(null);
                    }}
                    className="py-2 rounded-xl atelier-wood-btn text-xs font-bold text-[#fff4dc] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5 text-[#f4cf73]" />
                    <span>Llevar al Cuaderno</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
