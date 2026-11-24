import React from 'react';
import {
  Download,
  Upload,
  Volume2,
  Monitor,
  Check,
  Heart,
  ImagePlus,
  X,
  RotateCcw,
  Search,
  Sparkles,
} from 'lucide-react';
import { CROCHET_STICKERS } from '../data/seedData';
import {
  CALLIGRAPHY_CATEGORIES,
  CALLIGRAPHY_FONTS,
  type CalligraphyCategory,
  type CalligraphyFontMeta,
} from '../data/calligraphyFonts';
import {
  ensureCalligraphyFontLoaded,
  ensureCalligraphyFontsLoaded,
} from '../utils/calligraphyFontLoader';
import type { BrushSettings, FontChoice } from '../types/crochet';
import type { StickerCategory } from '../data/seedData';
import {
  CATALOG_BRUSHES_BY_FAMILY,
  CATALOG_TEXTURE_BRUSHES,
  DIFUMINADO_PRESETS,
  HYPERREAL_PINCEL_PRESETS,
  LUZ_MAGICA_PRESETS,
  MAGIC_LIGHT_COLORS,
  TEXTURE_FAMILIES,
  TOTAL_TEXTURE_BRUSH_COUNT,
  type BrushPresetMeta,
  type TextureFamilyId,
} from '../utils/hyperrealBrushEngine';
import { CrochetStickerSvg } from './CrochetDecorations';
import { CrochetGifsView, PHOTO_REAL_CROCHET_STICKERS } from './CrochetGifsView';
import { CROCHET_GIFS } from '../data/crochetGifs';
import { LiveTexturePreview, useFavoriteBrushes } from './TextureBrushSwatch';
import { PWAInstallButton } from './WindowsDesktopControls';

/* ---------- 1. Imágenes y Stickers View ---------- */
const STICKER_CATEGORIES: Array<'Todos' | StickerCategory> = [
  'Todos',
  'Flores',
  'Perlas',
  'Cuentas',
  'Hilos',
  'Herramientas',
  'Etiquetas',
];

const StickerGridCard = React.memo<{
  sticker: { id: string; name: string; category: StickerCategory };
  onInsert: (id: string) => void;
}>(({ sticker, onInsert }) => (
  <button
    type="button"
    onClick={() => onInsert(sticker.id)}
    className="p-3.5 rounded-2xl parchment-page border-2 border-[#a87842]/65 hover:border-[#7a202a] hover:scale-[1.03] transition-all flex flex-col items-center gap-2.5 cursor-pointer shadow-lg text-[#4a220d]"
  >
    <CrochetStickerSvg id={sticker.id} className="w-20 h-20 drop-shadow" />
    <div className="text-center">
      <p className="font-editorial text-sm font-bold leading-tight">{sticker.name}</p>
      <p className="text-[11px] text-[#7c4d27] mt-0.5">{sticker.category} · Pegar</p>
    </div>
  </button>
));
StickerGridCard.displayName = 'StickerGridCard';

export const StickersAndImagesView: React.FC<{
  onInsertSticker: (stickerId: string) => void;
  onInsertImageSticker?: (dataUrl: string, title: string) => void;
  onUploadImageToNotebook: () => void;
  onNotify?: (msg: string) => void;
  onReturnToNotebook?: () => void;
}> = ({
  onInsertSticker,
  onInsertImageSticker,
  onUploadImageToNotebook,
  onNotify,
  onReturnToNotebook,
}) => {
  const [collectionTab, setCollectionTab] = React.useState<'crochet-hd' | 'clasicos'>('crochet-hd');
  const [activeCategory, setActiveCategory] = React.useState<'Todos' | StickerCategory>('Todos');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [visibleLimit, setVisibleLimit] = React.useState(80);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const hdCount = CROCHET_GIFS.length + PHOTO_REAL_CROCHET_STICKERS.length;

  const categoryCounts = React.useMemo(() => {
    const map: Record<string, number> = { Todos: CROCHET_STICKERS.length };
    for (const s of CROCHET_STICKERS) {
      map[s.category] = (map[s.category] || 0) + 1;
    }
    return map;
  }, []);

  const filteredStickers = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CROCHET_STICKERS.filter((s) => {
      if (activeCategory !== 'Todos' && s.category !== activeCategory) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  React.useEffect(() => {
    setVisibleLimit(80);
  }, [activeCategory, searchQuery]);

  const displayedStickers = React.useMemo(
    () => filteredStickers.slice(0, visibleLimit),
    [filteredStickers, visibleLimit],
  );
  const hasMore = displayedStickers.length < filteredStickers.length;

  React.useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleLimit((prev) => Math.min(filteredStickers.length, prev + 80));
        }
      },
      { rootMargin: '300px' },
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, filteredStickers.length]);

  return (
    <div className="flex-1 overflow-y-auto studio-scroll p-4 sm:p-6 bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl text-[#f7e2b9]">
              Stickers Artesanales de Crochet, Atrapasueños y Granny ({hdCount + CROCHET_STICKERS.length})
            </h2>
            <p className="text-xs text-[#d6b688]">
              Todos tus stickers reunidos en alta definición sin fondo: fotografías reales, atrapasueños, granny squares, flores, perlas y cuentas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUploadImageToNotebook}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer shadow"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Insertar Imagen Propia</span>
            </button>
            {onReturnToNotebook && (
              <button
                type="button"
                onClick={onReturnToNotebook}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#3b2110] hover:bg-[#522d17] border border-[#b98241]/45 text-xs font-medium text-[#ffebc2] cursor-pointer shadow"
              >
                <span>Volver</span>
              </button>
            )}
          </div>
        </div>

        {/* Unified Collection Switcher */}
        <div className="inline-flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#1b0d05]/90 border border-[#c8964f]/45 mb-4">
          <button
            type="button"
            onClick={() => setCollectionTab('crochet-hd')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              collectionTab === 'crochet-hd'
                ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white shadow'
                : 'text-[#e8cfab] hover:text-white'
            }`}
          >
            ✦ Crochet Realista · Atrapasueños & Granny ({hdCount})
          </button>
          <button
            type="button"
            onClick={() => setCollectionTab('clasicos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              collectionTab === 'clasicos'
                ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white shadow'
                : 'text-[#e8cfab] hover:text-white'
            }`}
          >
            Flores, Perlas, Hilos y Cuentas ({CROCHET_STICKERS.length})
          </button>
        </div>

        {collectionTab === 'crochet-hd' && onInsertImageSticker ? (
          <CrochetGifsView
            embedded
            onInsertGif={onInsertImageSticker}
            onNotify={onNotify}
          />
        ) : (
          <>
            {/* Category Filter Tabs + Search */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-5">
              <div className="flex flex-wrap items-center gap-1.5">
                {STICKER_CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat] ?? 0;
                  const active = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                        active
                          ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] border-[#f4cf8e]/70 text-white font-medium shadow'
                          : 'bg-[#2a160b]/85 border-[#b98241]/35 text-[#e8cfab] hover:bg-[#4b2a15]'
                      }`}
                    >
                      {cat} <span className="opacity-80 font-mono-tab">({count})</span>
                    </button>
                  );
                })}
              </div>

              <div className="relative min-w-[210px] sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#cfa56a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar flor, perla, ovillo..."
                  className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-[#231208]/90 border border-[#b98241]/40 text-xs text-[#f7e7c8] placeholder:text-[#a8865b] focus:outline-none focus:border-[#ebbc6e]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#cfa56a] hover:text-white cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredStickers.length === 0 ? (
              <div className="p-8 rounded-2xl border border-[#b98241]/30 bg-[#2a160b]/70 text-center text-sm text-[#dfc49b]">
                No hay stickers que coincidan con “{searchQuery}”.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {displayedStickers.map((st) => (
                    <StickerGridCard key={st.id} sticker={st} onInsert={onInsertSticker} />
                  ))}
                </div>

                {hasMore && (
                  <div ref={sentinelRef} className="mt-6 flex flex-col items-center gap-2 py-2">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit(filteredStickers.length)}
                      className="px-4 py-2 rounded-lg bg-[#381e0f] border border-[#b98241]/50 hover:bg-[#522d17] text-xs text-[#f4d8ab] cursor-pointer transition-colors shadow"
                    >
                      Mostrar los {filteredStickers.length - displayedStickers.length} stickers restantes
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ---------- 2. Fuentes y Caligrafías Antiguas (235+ Royal, Romantic & Cursive Fonts) ---------- */
const FAV_FONTS_KEY = 'cuaderno_fav_fonts_v1';

const CalligraphyCard: React.FC<{
  font: CalligraphyFontMeta;
  active: boolean;
  isFav: boolean;
  previewText: string;
  onSelect: () => void;
  onToggleFav: () => void;
}> = React.memo(({ font, active, isFav, previewText, onSelect, onToggleFav }) => {
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      ensureCalligraphyFontLoaded(font.id);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          ensureCalligraphyFontLoaded(font.id);
          observer.disconnect();
        }
      },
      { rootMargin: '260px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [font.id]);

  const sampleSizePx = font.isScript
    ? Math.max(28, Math.min(44, Math.round(font.defaultSizePx * 1.08)))
    : Math.max(20, Math.min(28, font.defaultSizePx));

  return (
    <div
      ref={cardRef}
      className={`relative group rounded-2xl border transition-all overflow-hidden ${
        active
          ? 'bg-gradient-to-br from-[#472510] via-[#32190a] to-[#200f05] border-[#ffe08a] ring-2 ring-[#f3bf55]/75 shadow-[0_0_24px_rgba(243,191,85,0.28)]'
          : 'bg-gradient-to-br from-[#2a160a] via-[#1e0f06] to-[#140903] border-[#c89347]/45 hover:border-[#f0c06c]/85 hover:from-[#361c0d] hover:to-[#1a0c04] shadow-[0_10px_24px_rgba(0,0,0,0.55)]'
      }`}
    >
      {/* Subtle corner gold rivets matching the studio leather aesthetic */}
      <span className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#e6b85c]/75" />
      <span className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#e6b85c]/75" />

      <button
        type="button"
        onClick={() => {
          ensureCalligraphyFontLoaded(font.id);
          onSelect();
        }}
        className="w-full h-full p-4 sm:p-5 text-left cursor-pointer flex flex-col justify-between gap-2.5"
      >
        <div className="flex items-center justify-between gap-2 pr-7">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display text-xs sm:text-[13px] font-bold tracking-wide text-[#ffdfa3] truncate">
              {font.name}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#4e2a12] border border-[#d6a253]/45 text-[10px] font-medium text-[#f9e1b3] shrink-0">
              {font.categoryLabel}
            </span>
          </div>
          {active && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f5c451]/20 border border-[#ffe08a]/70 text-[10px] font-bold text-[#ffe9a8] shrink-0">
              <Check className="w-3 h-3" /> Activa
            </span>
          )}
        </div>

        {/* High-contrast Luminous Ivory-Gold Calligraphy Specimen */}
        <div className="min-h-[68px] flex items-center py-1.5 px-2.5 rounded-xl bg-[#110702]/70 border border-[#b98241]/25">
          <p
            style={{
              fontFamily: font.cssFamily,
              fontSize: `${sampleSizePx}px`,
              lineHeight: font.isScript ? 1.24 : 1.32,
            }}
            className="text-[#fff9ea] drop-shadow-[0_1px_8px_rgba(255,214,122,0.22)] break-words w-full"
          >
            {previewText || font.sample}
          </p>
        </div>

        <p className="text-[11px] leading-snug text-[#dfc397]">{font.desc}</p>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav();
        }}
        aria-label={isFav ? 'Quitar de favoritas' : 'Guardar en favoritas'}
        title={isFav ? 'Quitar de favoritas' : 'Guardar en favoritas'}
        className={`absolute top-3 right-3 p-1.5 rounded-full border transition-colors cursor-pointer ${
          isFav
            ? 'bg-[#6b1d2b] border-[#ff9fb0] text-[#ffb0be]'
            : 'bg-[#1a0c04]/85 border-[#b98241]/35 text-[#c8a06d] hover:text-[#ff9fb0] hover:border-[#ff9fb0]/60'
        }`}
      >
        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
});
CalligraphyCard.displayName = 'CalligraphyCard';

export const FontsView: React.FC<{
  selectedFont: FontChoice;
  onSelectFont: (font: FontChoice) => void;
  onWriteInNotebook?: () => void;
}> = ({ selectedFont, onSelectFont, onWriteInNotebook }) => {
  const [category, setCategory] = React.useState<'todas' | 'favoritas' | CalligraphyCategory>(
    'todas'
  );
  const [search, setSearch] = React.useState('');
  const [livePreviewText, setLivePreviewText] = React.useState('');
  const [visibleCount, setVisibleCount] = React.useState(36);
  const [favFontIds, setFavFontIds] = React.useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(FAV_FONTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });

  const favSet = React.useMemo(() => new Set(favFontIds), [favFontIds]);

  const toggleFavFont = React.useCallback((id: string) => {
    setFavFontIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      try {
        window.localStorage.setItem(FAV_FONTS_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  React.useEffect(() => {
    setVisibleCount(36);
  }, [category, search]);

  const filteredFonts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = CALLIGRAPHY_FONTS;
    if (category === 'favoritas') {
      list = list.filter((f) => favSet.has(f.id));
    } else if (category !== 'todas') {
      list = list.filter((f) => f.category === category);
    }
    if (q) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.googleFamily.toLowerCase().includes(q) ||
          f.categoryLabel.toLowerCase().includes(q) ||
          f.desc.toLowerCase().includes(q)
      );
    }
    return list;
  }, [category, search, favSet]);

  const displayedFonts = filteredFonts.slice(0, visibleCount);

  // Immediately load the active font + the first visible batch so fonts render crisply right away
  React.useEffect(() => {
    ensureCalligraphyFontsLoaded([
      selectedFont,
      ...displayedFonts.slice(0, 24).map((f) => f.id),
    ]);
  }, [selectedFont, displayedFonts]);

  return (
    <div className="flex-1 overflow-y-auto studio-scroll p-4 sm:p-6 bg-[radial-gradient(circle_at_center,rgba(68,36,16,0.48)_0%,rgba(20,10,4,0.97)_85%)]">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header + Controls Card */}
        <div className="rounded-2xl leather-panel p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-display text-xl sm:text-2xl text-[#ffebc2] tracking-wide">
                ✦ {CALLIGRAPHY_FONTS.length} Caligrafías Elegantes, Reales y de Letra Corrida
              </h2>
              <p className="text-xs text-[#dfc397] mt-0.5">
                Caligrafías reales, románticas, de poeta antiguo y cientos de letras corridas listas
                para escribir en tu cuaderno y exportar en 8K / Vector SVG.
              </p>
            </div>
            {onWriteInNotebook && (
              <button
                type="button"
                onClick={onWriteInNotebook}
                className="px-4 py-2 rounded-xl bg-gradient-to-b from-[#e0a344] to-[#a06118] border border-[#ffe29b]/65 text-xs font-bold text-[#fffaf0] cursor-pointer shrink-0 shadow hover:brightness-110"
              >
                Escribir en el cuaderno
              </button>
            )}
          </div>

          {/* Search + Live Verse Tester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#d6aa66] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar entre ${CALLIGRAPHY_FONTS.length} caligrafías (ej: Pinyon, Paris, Love, Royal, Script...)`}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#140903] border border-[#c99552]/50 text-xs text-[#fff4dc] placeholder:text-[#a88255] focus:outline-none focus:border-[#f5cb73]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#cfa467] hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="relative">
              <Sparkles className="w-3.5 h-3.5 text-[#f5cb73] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={livePreviewText}
                onChange={(e) => setLivePreviewText(e.target.value)}
                placeholder="Escribe un verso o tu nombre para verlo en todas..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#140903] border border-[#c99552]/50 text-xs text-[#fff4dc] placeholder:text-[#a88255] focus:outline-none focus:border-[#f5cb73]"
              />
              {livePreviewText && (
                <button
                  type="button"
                  onClick={() => setLivePreviewText('')}
                  aria-label="Limpiar frase de prueba"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#cfa467] hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CALLIGRAPHY_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'todas'
                  ? CALLIGRAPHY_FONTS.length
                  : cat.id === 'favoritas'
                    ? favSet.size
                    : CALLIGRAPHY_FONTS.filter((f) => f.category === cat.id).length;
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-b from-[#d89c46] to-[#985c1d] border-[#ffe3a3] text-white font-semibold shadow'
                      : 'bg-[#1a0d05] border-[#b98241]/40 text-[#ebcfa2] hover:border-[#e6b868]'
                  }`}
                >
                  <span>{cat.badge}</span>
                  <span>{cat.label}</span>
                  <span className="opacity-80 text-[10px]">({count})</span>
                </button>
              );
            })}
            <span className="ml-auto text-[11px] font-mono-tab text-[#d6b688]">
              Mostrando {displayedFonts.length} de {filteredFonts.length}
            </span>
          </div>
        </div>

        {/* High-Contrast Luxury Calligraphy Cards Grid */}
        {displayedFonts.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl bg-[#1c0e06] border border-[#b98241]/35 text-center text-sm text-[#dfc397]">
            {category === 'favoritas'
              ? 'Todavía no tienes caligrafías favoritas. Toca ♥ en cualquier fuente para guardarla aquí.'
              : 'No se encontraron caligrafías con ese nombre. Prueba con "Script", "Royal", "Love" o "Paris".'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedFonts.map((f) => (
                <CalligraphyCard
                  key={f.id}
                  font={f}
                  active={selectedFont === f.id}
                  isFav={favSet.has(f.id)}
                  previewText={livePreviewText.trim()}
                  onSelect={() => onSelectFont(f.id)}
                  onToggleFav={() => toggleFavFont(f.id)}
                />
              ))}
            </div>

            {filteredFonts.length > visibleCount && (
              <div className="flex justify-center pt-2 pb-4">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + 36)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-b from-[#4e2a13] to-[#2e1709] hover:from-[#643719] hover:to-[#3b1e0c] border border-[#e0b164]/60 text-xs font-semibold text-[#ffefc8] cursor-pointer shadow-lg transition-all"
                >
                  Mostrar +36 caligrafías más ({filteredFonts.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ---------- 3. Biblioteca de 2,400+ Texturas Hiperrealistas, Luz Mágica y Difuminados ---------- */
type LibraryTab = 'destacados' | 'luz' | 'difuminados' | 'favoritos' | TextureFamilyId;

export const BrushesQuickView: React.FC<{
  brush: BrushSettings;
  onChangeBrush: (patch: Partial<BrushSettings>) => void;
  onActivateDrawMode: () => void;
}> = ({ brush, onChangeBrush, onActivateDrawMode }) => {
  const [activeTab, setActiveTab] = React.useState<LibraryTab>('destacados');
  const [search, setSearch] = React.useState('');
  const [visibleCount, setVisibleCount] = React.useState(36);
  const { favoriteSet, toggleFavorite } = useFavoriteBrushes();

  React.useEffect(() => {
    setVisibleCount(36);
  }, [activeTab, search]);

  const totalTextures = TOTAL_TEXTURE_BRUSH_COUNT + HYPERREAL_PINCEL_PRESETS.length;

  const items: Array<{ meta: BrushPresetMeta; category: 'difuminados' | 'luz' | 'pinceles' }> =
    React.useMemo(() => {
      const q = search.trim().toLowerCase();
      if (q) {
        const res: Array<{ meta: BrushPresetMeta; category: 'difuminados' | 'luz' | 'pinceles' }> =
          [];
        for (const l of LUZ_MAGICA_PRESETS) {
          if (l.label.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)) {
            res.push({ meta: l, category: 'luz' });
          }
        }
        for (const d of DIFUMINADO_PRESETS) {
          if (d.label.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)) {
            res.push({ meta: d, category: 'difuminados' });
          }
        }
        for (const p of HYPERREAL_PINCEL_PRESETS) {
          if (p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
            res.push({ meta: p, category: 'pinceles' });
          }
        }
        for (const c of CATALOG_TEXTURE_BRUSHES) {
          if (
            c.label.toLowerCase().includes(q) ||
            c.familyLabel.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
          ) {
            res.push({ meta: c, category: 'pinceles' });
          }
        }
        return res;
      }

      if (activeTab === 'luz') {
        return LUZ_MAGICA_PRESETS.map((meta) => ({ meta, category: 'luz' as const }));
      }
      if (activeTab === 'difuminados') {
        return DIFUMINADO_PRESETS.map((meta) => ({ meta, category: 'difuminados' as const }));
      }
      if (activeTab === 'destacados') {
        return [
          ...LUZ_MAGICA_PRESETS.map((meta) => ({ meta, category: 'luz' as const })),
          ...HYPERREAL_PINCEL_PRESETS.map((meta) => ({ meta, category: 'pinceles' as const })),
          ...DIFUMINADO_PRESETS.map((meta) => ({ meta, category: 'difuminados' as const })),
        ];
      }
      if (activeTab === 'favoritos') {
        const favs: Array<{ meta: BrushPresetMeta; category: 'difuminados' | 'luz' | 'pinceles' }> =
          [];
        for (const l of LUZ_MAGICA_PRESETS) {
          if (favoriteSet.has(l.id)) favs.push({ meta: l, category: 'luz' });
        }
        for (const d of DIFUMINADO_PRESETS) {
          if (favoriteSet.has(d.id)) favs.push({ meta: d, category: 'difuminados' });
        }
        for (const p of HYPERREAL_PINCEL_PRESETS) {
          if (favoriteSet.has(p.id)) favs.push({ meta: p, category: 'pinceles' });
        }
        for (const c of CATALOG_TEXTURE_BRUSHES) {
          if (favoriteSet.has(c.id)) favs.push({ meta: c, category: 'pinceles' });
        }
        return favs;
      }
      return (CATALOG_BRUSHES_BY_FAMILY[activeTab] || []).map((meta) => ({
        meta,
        category: 'pinceles' as const,
      }));
    }, [activeTab, search, favoriteSet]);

  const displayed = items.slice(0, visibleCount);

  return (
    <div className="flex-1 overflow-y-auto studio-scroll p-4 sm:p-6 bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]">
      <div className="max-w-6xl mx-auto rounded-2xl leather-panel p-5 sm:p-6 text-[#f6e4c4] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#b98241]/30 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#f0c77c]" />
              <h2 className="font-display text-xl text-[#ffebc2]">
                Biblioteca de {totalTextures.toLocaleString('es-ES')} Texturas Hiperrealistas
              </h2>
            </div>
            <p className="text-xs text-[#d6b688] mt-1">
              Explora {TEXTURE_FAMILIES.length} colecciones de texturas hiperrealistas ({TOTAL_TEXTURE_BRUSH_COUNT.toLocaleString('es-ES')} brochas paramétricas + 12 destacadas) y 6 difuminados suaves de precisión. Toca cualquier pincel para pintar de inmediato.
            </p>
          </div>
          <button
            type="button"
            onClick={onActivateDrawMode}
            className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] border border-[#f5d290]/55 text-xs font-medium text-white cursor-pointer shrink-0 shadow"
          >
            Volver al Cuaderno
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#c89d60] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar entre ${totalTextures.toLocaleString('es-ES')} texturas (ej: zorro, arena, piel, seda, mármol, oro, escamas, agua, nubes, encaje, perlas...)`}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#160a04] border border-[#b98241]/45 text-xs text-[#fff0d2] placeholder:text-[#a88255] focus:outline-none focus:border-[#f0c06c]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#cfa467] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-xs text-[#dfc397] font-mono-tab shrink-0">
            {items.length.toLocaleString('es-ES')} pinceles
          </div>
        </div>

        {/* Family Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              {
                id: 'destacados',
                label: '★ Destacados',
                count:
                  LUZ_MAGICA_PRESETS.length +
                  HYPERREAL_PINCEL_PRESETS.length +
                  DIFUMINADO_PRESETS.length,
              },
              { id: 'luz', label: '✦ Luz Mágica', count: LUZ_MAGICA_PRESETS.length },
              { id: 'difuminados', label: 'Difuminados', count: DIFUMINADO_PRESETS.length },
              { id: 'favoritos', label: '♥ Favoritos', count: favoriteSet.size },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSearch('');
                setActiveTab(tab.id);
              }}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer ${
                !search && activeTab === tab.id
                  ? 'bg-gradient-to-b from-[#c9883e] to-[#874d1b] border-[#ffe3a3] text-white font-medium shadow'
                  : 'bg-[#1f1007] border-[#b98241]/35 text-[#e4c89c] hover:border-[#dfaf62]'
              }`}
            >
              {tab.label} <span className="opacity-75 text-[10px]">({tab.count})</span>
            </button>
          ))}

          {TEXTURE_FAMILIES.map((fam) => {
            const active = !search && activeTab === fam.id;
            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveTab(fam.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  active
                    ? 'bg-gradient-to-b from-[#c9883e] to-[#874d1b] border-[#ffe3a3] text-white font-medium shadow'
                    : 'bg-[#1f1007] border-[#b98241]/35 text-[#e4c89c] hover:border-[#dfaf62]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: fam.tint }}
                />
                <span>{fam.shortLabel}</span>
                <span className="opacity-75 text-[10px]">({fam.count})</span>
              </button>
            );
          })}
        </div>

        {/* Grid of Live Procedural Texture Cards */}
        {displayed.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#cfa878] bg-[#190c05]/70 rounded-xl border border-[#b98241]/25">
            {activeTab === 'favoritos' && !search
              ? 'Todavía no has guardado pinceles favoritos. Haz clic en ♥ en cualquier textura para tenerla a mano.'
              : 'No se encontraron texturas para esa búsqueda. Prueba con "pelo", "arena", "piel", "escamas", "oro" o "encaje".'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {displayed.map(({ meta, category }) => {
              const active = brush.preset === meta.id;
              const isFav = favoriteSet.has(meta.id);
              const isDif = category === 'difuminados';
              const isLuz = category === 'luz';
              return (
                <div key={meta.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeBrush({
                        category,
                        preset: meta.id,
                        ...(isLuz ? { color: MAGIC_LIGHT_COLORS[0].hex } : {}),
                        size: meta.defaultSize,
                        opacity: meta.defaultOpacity,
                        softness: meta.defaultSoftness,
                      });
                      onActivateDrawMode();
                    }}
                    className={`w-full h-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      active
                        ? 'bg-[#693a1b] border-[#ecc074] text-white ring-1 ring-[#f2ca7e]'
                        : 'bg-[#221208] border-[#b98241]/35 hover:border-[#dfaf62] hover:bg-[#2c170b]'
                    }`}
                  >
                    {isLuz ? (
                      <div className="relative w-full h-7 rounded bg-[#120803] flex items-center justify-center px-2 overflow-hidden">
                        <div
                          className="w-full h-3 rounded-full"
                          style={{
                            background: `radial-gradient(ellipse at center, #FFFDF4 0%, ${meta.tint} 45%, transparent 82%)`,
                            boxShadow: `0 0 12px ${meta.tint}99`,
                          }}
                        />
                        <span
                          aria-hidden="true"
                          className="absolute text-[11px] text-[#fffef4] drop-shadow-[0_0_6px_#ffd84d]"
                        >
                          ✦ · ✦
                        </span>
                      </div>
                    ) : isDif ? (
                      <div className="w-full h-7 rounded bg-[#140903] flex items-center justify-center px-2">
                        <div
                          className="w-full h-2.5 rounded-full blur-[2px] opacity-85"
                          style={{
                            background: `linear-gradient(90deg, transparent, ${meta.tint}, #fff7e6, transparent)`,
                          }}
                        />
                      </div>
                    ) : (
                      <LiveTexturePreview
                        presetId={meta.id}
                        color={meta.tint}
                        heightClass="h-7"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-editorial text-xs font-bold text-[#ffebc2] leading-snug truncate pr-4">
                        {meta.label}
                      </p>
                      <p className="text-[10px] text-[#d6b688] mt-0.5 line-clamp-2 leading-tight">
                        {meta.description}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(meta.id);
                    }}
                    aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    className={`absolute top-2 right-2 p-1 rounded-full bg-[#1a0d05]/80 transition-opacity cursor-pointer ${
                      isFav
                        ? 'opacity-100 text-[#ff8fa3]'
                        : 'opacity-0 group-hover:opacity-100 text-[#cfa467] hover:text-[#ff8fa3]'
                    }`}
                  >
                    <Heart className={`w-3 h-3 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {items.length > visibleCount && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + 36)}
              className="px-5 py-2 rounded-xl bg-[#341c0d] hover:bg-[#4b2914] border border-[#cfa158]/55 text-xs font-medium text-[#ffebc2] cursor-pointer transition-colors"
            >
              Cargar +36 texturas más ({(items.length - visibleCount).toLocaleString('es-ES')}{' '}
              restantes)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- 4. Configuración + Windows .exe Guide ---------- */
export const SettingsView: React.FC<{
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetDemoData: () => void;
}> = ({
  sfxEnabled,
  onToggleSfx,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
}) => {
  const fileRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 overflow-y-auto studio-scroll p-4 sm:p-6 bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Button & Option Sound Effects */}
        <section className="rounded-2xl leather-panel p-5 text-[#f6e4c4] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#b98241]/30 pb-2.5">
            <Volume2 className="w-5 h-5 text-[#eab86a]" />
            <h2 className="font-display text-lg text-[#ffebc2]">
              Efectos de Sonido
            </h2>
          </div>

          <p className="text-xs text-[#d6b688] leading-relaxed">
            Reproduce sonidos táctiles suaves al pulsar botones, cambiar opciones, abrir herramientas, copiar puntos o pasar las páginas del cuaderno.
          </p>

          <label className="flex items-center justify-between gap-3 rounded-xl bg-[#2a1509]/80 border border-[#b98241]/35 px-3.5 py-3 text-xs cursor-pointer">
            <span>Activar efectos de sonido en botones y opciones</span>
            <input
              type="checkbox"
              checked={sfxEnabled}
              onChange={onToggleSfx}
              className="w-4 h-4 accent-[#d69c50]"
            />
          </label>
        </section>

        {/* Backup & Storage */}
        <section className="rounded-2xl leather-panel p-5 text-[#f6e4c4] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#b98241]/30 pb-2.5">
            <Download className="w-5 h-5 text-[#eab86a]" />
            <h2 className="font-display text-lg text-[#ffebc2]">
              Copia de Seguridad del Cuaderno
            </h2>
          </div>

          <p className="text-xs text-[#d6b688] leading-relaxed">
            Todos tus patrones, materiales, hojas dibujadas y fotos de proyectos se guardan localmente de forma automática en la base de datos privada de tu equipo (sin necesidad de internet).
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar .cuaderno.json</span>
            </button>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b2110] border border-[#b98241]/45 text-xs text-[#f4dfb9] hover:bg-[#522e17] cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Respaldo</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.cuaderno.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportBackup(f);
                e.target.value = '';
              }}
            />
          </div>

          <div className="pt-3 border-t border-[#b98241]/20">
            <button
              type="button"
              onClick={onResetDemoData}
              className="inline-flex items-center gap-1.5 text-xs text-[#e09d9a] hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar cuaderno de ejemplo inicial</span>
            </button>
          </div>
        </section>

        {/* Windows Desktop App & .exe Packaging */}
        <section className="lg:col-span-2 rounded-2xl parchment-page border-2 border-[#a87842]/75 p-5 text-[#3e210e] shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#9d6f3d]/30 pb-2.5">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[#7a202a]" />
              <h2 className="font-editorial text-2xl font-bold text-[#4a220d]">
                Aplicación de Escritorio para Windows 10 / 11 (.exe y PWA)
              </h2>
            </div>
            <PWAInstallButton variant="card" />
          </div>

          <p className="text-sm text-[#4f2d16] leading-relaxed">
            Puedes instalar <strong>Cuaderno del Artista</strong> al instante en Windows con un clic (acceso directo en Escritorio, Menú Inicio y modo offline), o compilar el instalador nativo <code className="font-mono-tab bg-[#ecd8b4] px-1.5 py-0.5 rounded">Instalador.exe</code> y la versión <code className="font-mono-tab bg-[#ecd8b4] px-1.5 py-0.5 rounded">Portable.exe</code> usando los archivos listos en <code className="font-mono-tab bg-[#ecd8b4] px-1.5 py-0.5 rounded">electron/</code>, <code className="font-mono-tab bg-[#ecd8b4] px-1.5 py-0.5 rounded">electron-builder.json</code> y <code className="font-mono-tab bg-[#ecd8b4] px-1.5 py-0.5 rounded">construir-windows.bat</code>:
          </p>

          <div className="rounded-xl bg-[#241309] text-[#f7e2b9] p-4 font-mono-tab text-xs space-y-1.5 overflow-x-auto">
            <div>1. Descarga el proyecto e instala Node.js 20 LTS o superior en tu PC Windows.</div>
            <div>2. Haz doble clic en <span className="text-[#f4c675]">construir-windows.bat</span> (o ejecuta en PowerShell):</div>
            <div className="text-[#f4c675] select-all">
              npm install && npm install --no-save electron electron-builder && npm run build:win
            </div>
            <div>
              3. Al terminar encontrarás el instalador en español y el ejecutable portable en{' '}
              <span className="text-[#a8e09e]">release/Cuaderno-del-Artista-Instalador-*.exe</span> y{' '}
              <span className="text-[#a8e09e]">release/Cuaderno-del-Artista-Portable-*.exe</span>.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

/* ---------- 5. Quick Help Modal ---------- */
export const HelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div
    onClick={onClose}
    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-lg rounded-2xl leather-panel p-5 text-[#f6e4c4] space-y-3"
    >
      <div className="flex items-center justify-between border-b border-[#b98241]/30 pb-2">
        <h3 className="font-display text-lg text-[#ffebc2]">
          Guía Rápida del Cuaderno del Artista
        </h3>
        <button type="button" onClick={onClose} className="p-1 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>
      <ul className="text-xs sm:text-sm space-y-2 text-[#e8cfab] leading-relaxed">
        <li>
          <strong className="text-[#ffebc2]">Pasar páginas de forma táctil:</strong> Arrastra desde el borde izquierdo o derecho de las hojas abiertas (o usa las flechas inferiores) para doblar y voltear las páginas en 3D.
        </li>
        <li>
          <strong className="text-[#ffebc2]">Dibujar y anotar:</strong> Elige <em>Difuminados</em> o <em>Pincel</em> (con texturas hiperrealistas) en el panel derecho para dibujar sobre la cuadrícula, o usa <em>Texto</em> y <em>Stickers</em> para decorar con flores de crochet.
        </li>
        <li>
          <strong className="text-[#ffebc2]">Organizar Patrones y Materiales:</strong> Usa las pestañas de la barra lateral izquierda para llevar tu contador de vueltas, diagrama de puntos, reserva de ovillos y álbum de fotos terminadas.
        </li>
        <li>
          <strong className="text-[#ffebc2]">Programa Windows (.exe):</strong> Ve a <em>Configuración</em> para consultar los comandos listos de empaquetado con Electron.
        </li>
      </ul>
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-[#9d6328] text-xs font-medium text-white cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </div>
  </div>
);
