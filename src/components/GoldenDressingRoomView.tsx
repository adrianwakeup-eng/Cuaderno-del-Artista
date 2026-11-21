import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Camera,
  Heart,
  Pin,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type {
  DressingRoomCategory,
  DressingRoomGarment,
  FinishedProject,
} from '../types/crochet';
import {
  FULL_MENSWEAR_CATALOG,
  loadStudioPhotoPack,
  renderPhotorealisticGarmentCard,
  type StudioPhotoPack,
} from '../data/menswearCrochetCatalog';
import { VitruvianMan3D } from './VitruvianMan3D';
import { ProfessionalAvatarViewer } from './ProfessionalAvatarViewer';
import { audioEngine } from '../utils/audioEngine';
import { compressImageFile } from '../utils/storage';

const BaroqueTitleFlourish: React.FC<{ flip?: boolean }> = ({ flip = false }) => (
  <svg
    viewBox="0 0 110 48"
    fill="none"
    aria-hidden="true"
    className={`hidden md:block w-20 lg:w-24 h-auto shrink-0 select-none ${flip ? '-scale-x-100' : ''}`}
  >
    <defs>
      <linearGradient id="vestidorGoldGrad" x1="0" y1="0" x2="110" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#945b12" />
        <stop offset="45%" stopColor="#e8bd5e" />
        <stop offset="75%" stopColor="#c78a22" />
        <stop offset="100%" stopColor="#7a490c" />
      </linearGradient>
    </defs>
    <path
      d="M104 24C88 24 79 10 62 10C47 10 42 22 30 22C20 22 14 14 20 8C25 3 34 7 33 14"
      stroke="url(#vestidorGoldGrad)"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <path
      d="M104 24C86 24 76 38 58 38C42 38 35 28 21 28C11 28 6 35 12 41C17 45 27 42 26 35"
      stroke="url(#vestidorGoldGrad)"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <path
      d="M78 24C67 24 60 19 52 24C60 29 67 24 78 24Z"
      fill="url(#vestidorGoldGrad)"
    />
    <circle cx="96" cy="24" r="3.4" fill="#d99f36" />
    <circle cx="44" cy="24" r="2.2" fill="#b97d1d" />
  </svg>
);

type SlotFilter = 'all' | 'top' | 'bottom';

interface GarmentCardItemProps {
  garment: DressingRoomGarment;
  studioPack: StudioPhotoPack | null;
  isWorn: boolean;
  isFav: boolean;
  onWear: () => void;
  onToggleFav: () => void;
  onPin: (photoUrl: string) => void;
  onPickSwatch: (hex: string) => void;
  onDelete?: () => void;
}

const GarmentCardItem: React.FC<GarmentCardItemProps> = React.memo(
  ({
    garment,
    studioPack,
    isWorn,
    isFav,
    onWear,
    onToggleFav,
    onPin,
    onPickSwatch,
    onDelete,
  }) => {
    const resolvedPhoto = useMemo(() => {
      if (garment.photoDataUrl) return garment.photoDataUrl;
      if (!studioPack) return '';
      return renderPhotorealisticGarmentCard(garment, studioPack);
    }, [garment, studioPack]);

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onWear}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onWear();
          }
        }}
        className={`group relative flex flex-col rounded-2xl p-2 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#b87d21] hover:-translate-y-0.5 ${
          isWorn
            ? 'bg-gradient-to-b from-[#fcf3e2] to-[#f2dec0] border-2 border-[#c28828] shadow-[0_10px_22px_rgba(110,66,12,0.26),0_0_0_2px_rgba(248,217,138,0.55)]'
            : 'bg-gradient-to-b from-[#f8ebd6] to-[#eed7b8] border border-[#d1a869]/85 hover:border-[#b98126] shadow-[0_6px_14px_rgba(88,52,14,0.14)]'
        }`}
      >
        {/* Stylized Atelier Lookbook Plate */}
        <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#f7eedb] border border-[#dfc08d]/60 shadow-inner">
          {resolvedPhoto ? (
            <img
              src={resolvedPhoto}
              alt={garment.name}
              referrerPolicy="no-referrer"
              loading="lazy"
              draggable={false}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-[#faf2e2] to-[#ecd9b8] text-[#6d4517]">
              <span className="font-display text-xs font-bold tracking-wider uppercase opacity-75">
                {garment.category}
              </span>
              <span className="mt-1 font-body text-[11px] opacity-65">{garment.name}</span>
            </div>
          )}

          {/* Subtle Slot Tag (Encima / Debajo) + Quick Pin Button */}
          <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
            <button
              type="button"
              title="Llevar prenda y ficha al cuaderno"
              onClick={(e) => {
                e.stopPropagation();
                onPin(resolvedPhoto);
              }}
              className="w-6 h-6 rounded-full bg-[#3d2108]/85 hover:bg-[#946016] text-[#ffe8b5] shadow flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
            >
              <Pin className="w-3 h-3" />
            </button>
            {isWorn && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#986216]/95 text-[#fff8e6] text-[9.5px] font-bold tracking-wide shadow">
                Puesto
              </span>
            )}
          </div>

          {/* Top-Right Favorite Heart & Custom Delete */}
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
            {onDelete && (
              <button
                type="button"
                aria-label="Retirar prenda personalizada"
                title="Retirar del vestidor"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-6 h-6 rounded-full bg-white/95 hover:bg-[#fde8e8] text-[#8d1d2c] shadow flex items-center justify-center cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFav();
              }}
              className="w-7 h-7 rounded-full bg-white/95 hover:bg-white shadow-[0_2px_6px_rgba(28,12,2,0.35)] flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
            >
              <Heart
                className={`w-3.5 h-3.5 transition-colors ${
                  isFav
                    ? 'fill-[#8d1d2c] text-[#8d1d2c]'
                    : 'text-[#5b3410] fill-transparent'
                }`}
                strokeWidth={2.1}
              />
            </button>
          </div>
        </div>

        {/* Title & Hook/Palette Row */}
        <div className="mt-1.5 px-1 text-center flex-1 flex flex-col justify-between">
          <h3 className="font-body font-bold text-[12px] sm:text-[12.5px] leading-snug text-[#351b06] min-h-[2.2em] flex items-center justify-center">
            {garment.name}
          </h3>

          <div className="mt-1 pt-0.5 flex items-center justify-between gap-1">
            <span className="font-mono-tab text-[11px] font-medium text-[#5e3813]">
              {garment.hookSizeMm}
            </span>
            <div className="flex items-center gap-1">
              {garment.palette.slice(0, 3).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={`Usar tono ${hex} en el pincel`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPickSwatch(hex);
                  }}
                  style={{ backgroundColor: hex }}
                  className="w-3 h-3 rounded-full border border-[#6e4618]/55 shadow-sm hover:scale-125 transition-transform cursor-pointer"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
GarmentCardItem.displayName = 'GarmentCardItem';

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
  customGarments,
  finishedProjects,
  onAddCustomGarment,
  onDeleteCustomGarment,
  onSelectBrushColor,
  onPinGarmentToNotebook,
  onBackToNotebook,
  onNotify,
}) => {
  const [studioPack, setStudioPack] = useState<StudioPhotoPack | null>(null);
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all');
  const [professionalViewer, setProfessionalViewer] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(27);
  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);
  const [selectedBottomId, setSelectedBottomId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    'tunica-vitruvio-lino': true,
    'pantalon-sastre-marino': true,
  });
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const galleryScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    void loadStudioPhotoPack()
      .then((pack) => {
        if (active) setStudioPack(pack);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Reset pagination when switching slot or search
  useEffect(() => {
    setVisibleCount(27);
    if (galleryScrollRef.current) galleryScrollRef.current.scrollTop = 0;
  }, [slotFilter, searchQuery]);

  const allGarments = useMemo<DressingRoomGarment[]>(() => {
    const validCategories: DressingRoomCategory[] = [
      'Suéteres',
      'Chalecos',
      'Cardigans',
      'Chaquetas',
      'Accesorios',
      'Pantalones',
      'Bermudas',
    ];
    const normalizedCustom = customGarments.map((g) => ({
      ...g,
      category: validCategories.includes(g.category) ? g.category : 'Cardigans',
      garmentSlot:
        g.garmentSlot ||
        (g.category === 'Pantalones' || g.category === 'Bermudas' ? 'bottom' : 'top'),
      isCustom: true,
    }));

    const extraProjects: DressingRoomGarment[] = finishedProjects
      .filter((p) => p.id !== 'proj-1' && p.id !== 'proj-2')
      .map((p) => ({
        id: `proj-${p.id}`,
        name: p.title,
        category: 'Accesorios',
        garmentSlot: 'top',
        eyebrow: 'MIS PROYECTOS',
        subtitle: p.patternTitle || 'Creación personal tejida a crochet.',
        fiber: p.materialsUsed || 'Algodón seleccionado',
        fiberDetail: 'Hecho a mano',
        hookSizeMm: p.hookSizeMm || '3.0 mm',
        stitchNote: p.notes || 'Pieza terminada del cuaderno del artista.',
        palette: ['#DEC098', '#1E2E4A', '#6E1624', '#5A6232', '#C68B28'],
        accentColor: '#DEC098',
        photoDataUrl: p.photoDataUrl,
      }));

    return [...normalizedCustom, ...FULL_MENSWEAR_CATALOG, ...extraProjects];
  }, [customGarments, finishedProjects]);

  const topCount = useMemo(
    () => allGarments.filter((g) => g.garmentSlot !== 'bottom').length,
    [allGarments]
  );
  const bottomCount = useMemo(
    () => allGarments.filter((g) => g.garmentSlot === 'bottom').length,
    [allGarments]
  );

  const filteredGarments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allGarments.filter((g) => {
      const slot = g.garmentSlot === 'bottom' ? 'bottom' : 'top';
      if (slotFilter !== 'all' && slot !== slotFilter) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        g.fiber.toLowerCase().includes(q) ||
        g.stitchNote.toLowerCase().includes(q)
      );
    });
  }, [allGarments, slotFilter, searchQuery]);

  const visibleGarments = useMemo(
    () => filteredGarments.slice(0, visibleCount),
    [filteredGarments, visibleCount]
  );

  const selectedTop = useMemo(
    () => (selectedTopId ? allGarments.find((g) => g.id === selectedTopId) ?? null : null),
    [allGarments, selectedTopId]
  );
  const selectedBottom = useMemo(
    () =>
      selectedBottomId ? allGarments.find((g) => g.id === selectedBottomId) ?? null : null,
    [allGarments, selectedBottomId]
  );

  const handleWearGarment = (garment: DressingRoomGarment) => {
    audioEngine.playStitchClick();
    if (garment.garmentSlot === 'bottom') {
      setSelectedBottomId((prev) => (prev === garment.id ? null : garment.id));
    } else {
      setSelectedTopId((prev) => (prev === garment.id ? null : garment.id));
    }
  };

  const handleGalleryScroll = (e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 360) {
      if (visibleCount < filteredGarments.length) {
        setVisibleCount((c) => Math.min(filteredGarments.length, c + 27));
      }
    }
  };

  const handleUploadGarmentPhoto = async (file: File) => {
    try {
      const dataUrl = await compressImageFile(file, 960);
      const cleanName = file.name.replace(/\.[^/.]+$/, '') || 'Prenda de Crochet';
      const isBottom = slotFilter === 'bottom';
      const newGarment: DressingRoomGarment = {
        id: `custom-garment-${Date.now()}`,
        name: cleanName,
        category: isBottom ? 'Pantalones' : 'Cardigans',
        garmentSlot: isBottom ? 'bottom' : 'top',
        silhouetteKind: isBottom ? 'trousers' : 'cardigan',
        stitchPattern: 'cable',
        eyebrow: 'COLECCIÓN PERSONAL',
        subtitle: 'Prenda personalizada añadida a tu vestidor dorado.',
        fiber: '100% Hilo Artesanal',
        fiberDetail: 'Tejido a mano',
        hookSizeMm: '3.25 mm',
        stitchNote: 'Guardada en tu galería privada y lista para probar en el Vitruvio 3D.',
        palette: ['#DEC098', '#1E2E4A', '#6E1624', '#5A6232', '#C68B28'],
        accentColor: '#DEC098',
        photoDataUrl: dataUrl,
        isCustom: true,
      };
      onAddCustomGarment(newGarment);
      if (isBottom) setSelectedBottomId(newGarment.id);
      else setSelectedTopId(newGarment.id);
      audioEngine.playSaveChime();
      onNotify(`Prenda añadida al vestidor: ${cleanName}`);
    } catch {
      onNotify('No se pudo cargar la fotografía de la prenda');
    }
  };

  const handlePickSwatch = (hex: string) => {
    audioEngine.playYarnPluck(2);
    onSelectBrushColor(hex);
    onNotify(`Color de hilo cargado al pincel: ${hex}`);
  };

  const toggleFavorite = (id: string) => {
    audioEngine.playToggleChime(!favorites[id]);
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCaptureVitruvianToNotebook = (snapshotDataUrl: string) => {
    const outfitNames = [selectedTop?.name, selectedBottom?.name].filter(Boolean).join(' + ');
    const garmentForNotebook: DressingRoomGarment = {
      id: `vitruvio-outfit-${Date.now()}`,
      name: outfitNames ? `Conjunto Vitruvio: ${outfitNames}` : 'Modelo Vitruvio 3D',
      category: selectedTop?.category || selectedBottom?.category || 'Suéteres',
      subtitle: 'Previsualización 3D sobre el modelo Vitruvio articulado.',
      fiber:
        [selectedTop?.fiber, selectedBottom?.fiber].filter(Boolean).join(' · ') ||
        'Maniquí Articulado',
      hookSizeMm: selectedTop?.hookSizeMm || selectedBottom?.hookSizeMm || '3.25 mm',
      stitchNote:
        [selectedTop?.stitchNote, selectedBottom?.stitchNote].filter(Boolean).join(' ') ||
        'Referencia anatómica capturada desde El Vestidor Dorado.',
      palette: selectedTop?.palette || selectedBottom?.palette || ['#DEC098', '#1E2E4A', '#C68B28'],
      accentColor: selectedTop?.accentColor || '#DEC098',
      photoDataUrl: snapshotDataUrl,
    };
    onPinGarmentToNotebook(garmentForNotebook);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden text-[#3b2008]"
      style={{
        background:
          'radial-gradient(ellipse at 50% 8%, #fffaf0 0%, #f4e6ce 38%, #e7d1b0 76%, #d6b687 100%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 rounded-2xl border border-[#cfa158]/55 z-10"
      />

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleUploadGarmentPhoto(f);
          e.target.value = '';
        }}
      />

      {/* CLEAN TOP BAROQUE HEADER */}
      <header className="relative z-30 flex items-center justify-between gap-3 px-5 sm:px-8 pt-3.5 pb-2.5 shrink-0 border-b border-[#cfa158]/45">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            audioEngine.playWardrobeDoor(false);
            onBackToNotebook();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-b from-[#fff8e8] via-[#f4e0b8] to-[#e4c283] border-2 border-[#b98229] shadow-[0_4px_12px_rgba(92,53,12,0.2),inset_0_1px_0_rgba(255,255,255,0.85)] text-[#422307] hover:brightness-[1.03] cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#6d3e10] shrink-0" />
          <span className="font-body text-[13px] font-semibold whitespace-nowrap">
            Volver al Cuaderno
          </span>
        </motion.button>

        <div className="flex flex-col items-center text-center min-w-0 px-2">
          <div className="flex items-center justify-center gap-3">
            <BaroqueTitleFlourish />
            <div className="leading-none">
              <p className="font-display text-xs sm:text-sm font-bold tracking-[0.2em] text-[#845314]">
                EL VESTIDOR
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-[0.1em] text-[#6b3e0b] -mt-0.5">
                DORADO
              </h1>
            </div>
            <BaroqueTitleFlourish flip />
          </div>
          <p className="mt-0.5 font-editorial italic text-[13px] sm:text-[14.5px] text-[#5e3810]">
            Colección crochet de{' '}
            <span className="font-semibold text-[#452406]">prendas masculinas</span> adaptables al
            Vitruvio · {allGarments.length} diseños
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            audioEngine.playStitchClick();
            uploadInputRef.current?.click();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-b from-[#b57d24] via-[#905c14] to-[#6f430b] border-2 border-[#e9bf6a] shadow-[0_4px_14px_rgba(78,43,8,0.3),inset_0_1px_0_rgba(255,236,178,0.6)] text-[#fff8e6] hover:brightness-110 cursor-pointer shrink-0"
        >
          <Camera className="w-4 h-4 text-[#ffe3a3] shrink-0" />
          <span className="font-body text-[13px] font-semibold whitespace-nowrap">
            Añadir prenda
          </span>
        </motion.button>
      </header>

      {/* MAIN TWO-COLUMN STAGE */}
      <div className="relative z-20 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 px-5 sm:px-8 py-3 min-h-0 overflow-hidden">
        {/* LEFT COLUMN (7 cols): Slim Encima / Debajo Switcher + 273+ Menswear Crochet Cards */}
        <div className="lg:col-span-7 flex flex-col gap-2.5 min-h-0">
          {/* Ultra-Compact Top / Bottom Switcher + Quick Search */}
          <div className="flex items-center justify-between gap-2 flex-wrap shrink-0">
            <div className="inline-flex items-center p-0.5 rounded-xl bg-[#ead4b0]/90 border border-[#cfa158] shadow-inner">
              <button
                type="button"
                onClick={() => {
                  audioEngine.playStitchClick();
                  setSlotFilter('all');
                }}
                className={`px-3 py-1 rounded-lg text-[11.5px] font-semibold transition-colors cursor-pointer ${
                  slotFilter === 'all'
                    ? 'bg-[#946016] text-[#fff8e6] shadow-sm'
                    : 'text-[#4c2a0a] hover:bg-[#f6e8cf]'
                }`}
              >
                Todo ({allGarments.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playStitchClick();
                  setSlotFilter('top');
                }}
                className={`px-3 py-1 rounded-lg text-[11.5px] font-semibold transition-colors cursor-pointer ${
                  slotFilter === 'top'
                    ? 'bg-[#946016] text-[#fff8e6] shadow-sm'
                    : 'text-[#4c2a0a] hover:bg-[#f6e8cf]'
                }`}
              >
                Encima ({topCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playStitchClick();
                  setSlotFilter('bottom');
                }}
                className={`px-3 py-1 rounded-lg text-[11.5px] font-semibold transition-colors cursor-pointer ${
                  slotFilter === 'bottom'
                    ? 'bg-[#946016] text-[#fff8e6] shadow-sm'
                    : 'text-[#4c2a0a] hover:bg-[#f6e8cf]'
                }`}
              >
                Debajo ({bottomCount})
              </button>
            </div>

            {/* Compact Search */}
            <div className="flex items-center gap-2 h-9 px-3 flex-1 min-w-[160px] max-w-[240px] rounded-xl bg-[#fbf1df] border border-[#cfa158] focus-within:border-[#9c6516]">
              <Search className="w-3.5 h-3.5 text-[#7c5019] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar diseño o color..."
                className="flex-1 min-w-0 h-full bg-transparent border-0 p-0 font-sans text-[12px] text-[#3a1d06] placeholder:text-[#8b6434] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#7c5019] hover:text-[#3a1d06] cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Spacious Lazy-Scrolling Gallery */}
          <section
            ref={galleryScrollRef}
            onScroll={handleGalleryScroll}
            className="flex-1 min-h-0 overflow-y-auto studio-scroll pr-1"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4">
              {visibleGarments.map((garment) => {
                const isWorn =
                  garment.id === selectedTopId || garment.id === selectedBottomId;
                return (
                  <GarmentCardItem
                    key={garment.id}
                    garment={garment}
                    studioPack={studioPack}
                    isWorn={isWorn}
                    isFav={Boolean(favorites[garment.id])}
                    onWear={() => handleWearGarment(garment)}
                    onToggleFav={() => toggleFavorite(garment.id)}
                    onPin={(photoUrl) => {
                      audioEngine.playYarnPluck(4);
                      onPinGarmentToNotebook({ ...garment, photoDataUrl: photoUrl });
                    }}
                    onPickSwatch={handlePickSwatch}
                    onDelete={
                      garment.isCustom
                        ? () => {
                            audioEngine.playEraseBrush();
                            onDeleteCustomGarment(garment.id);
                            if (selectedTopId === garment.id) setSelectedTopId(null);
                            if (selectedBottomId === garment.id) setSelectedBottomId(null);
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>

            {visibleCount < filteredGarments.length && (
              <div className="flex justify-center pb-5">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((c) => Math.min(filteredGarments.length, c + 36))
                  }
                  className="px-4 py-1.5 rounded-xl bg-[#f5e4c6] hover:bg-[#ebd1a5] border border-[#c68d2e] text-xs font-semibold text-[#4a2809] shadow-sm cursor-pointer"
                >
                  Mostrar más diseños ({filteredGarments.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN (5 cols): Full-Height Interactive 3D Vitruvian Model Dressed Live with Selected Top & Bottom */}
        <aside className="lg:col-span-5 flex flex-col min-h-[520px] h-full relative">
          <button type="button" onClick={() => setProfessionalViewer(true)} className="absolute z-40 right-3 top-12 rounded-lg border border-[#e6bc6a] bg-[#734a16] px-3 py-1.5 text-xs font-bold text-[#fff4d8] shadow-lg">✦ Avatar GLB Pro</button>
          {professionalViewer && <ProfessionalAvatarViewer onClose={() => setProfessionalViewer(false)} />}
          <VitruvianMan3D
            selectedTop={selectedTop}
            selectedBottom={selectedBottom}
            onClearTop={() => setSelectedTopId(null)}
            onClearBottom={() => setSelectedBottomId(null)}
            onUndressAll={() => {
              setSelectedTopId(null);
              setSelectedBottomId(null);
            }}
            onCaptureToNotebook={handleCaptureVitruvianToNotebook}
          />
        </aside>
      </div>
    </motion.div>
  );
};
