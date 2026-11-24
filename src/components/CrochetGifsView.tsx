import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Copy,
  Download,
  Maximize2,
  Search,
  X,
} from 'lucide-react';
import {
  CROCHET_GIFS,
  type CrochetGifCategory,
  type CrochetGifDef,
} from '../data/crochetGifs';
import { renderCrochetGifFrame } from '../utils/crochetGifScenes';
import { copyPngBlobToClipboard } from '../utils/garmentRunwayRenderer';
import { audioEngine } from '../utils/audioEngine';

const STILL_HERO_PROGRESS = 0.25;

const STICKER_CATEGORIES: Array<'Todos' | CrochetGifCategory> = [
  'Todos',
  'Prendas y Accesorios',
  'Boho y Macramé',
  'Puntos y Ganchillo',
  'Mandalas de Taller',
  'Granny y Tapetes',
  'Flores Tejidas',
  'Amigurumi',
  'Notas del Cuaderno',
];

const stillPngCache = new Map<string, string>();

function renderStillStickerDataUrl(gif: CrochetGifDef, size = 512): string {
  const key = `${gif.id}:${size}`;
  const cached = stillPngCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    renderCrochetGifFrame(
      {
        scene: gif.scene,
        colors: gif.colors,
        variant: gif.variant ?? 0,
        progress: STILL_HERO_PROGRESS,
        size,
        transparentBg: true,
      },
      ctx
    );
  }
  const dataUrl = canvas.toDataURL('image/png');
  if (stillPngCache.size > 160) {
    const first = stillPngCache.keys().next().value;
    if (first) stillPngCache.delete(first);
  }
  stillPngCache.set(key, dataUrl);
  return dataUrl;
}

function renderStillStickerBlob(gif: CrochetGifDef, size = 512): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  renderCrochetGifFrame(
    {
      scene: gif.scene,
      colors: gif.colors,
      variant: gif.variant ?? 0,
      progress: STILL_HERO_PROGRESS,
      size,
      transparentBg: true,
    },
    ctx
  );
  return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

const StillStickerCanvas: React.FC<{
  gif: CrochetGifDef;
  size?: number;
  className?: string;
}> = memo(({ gif, size = 140, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const backingSize = size * 2; // Crisp Retina / 4K still sticker rendering

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCrochetGifFrame(
      {
        scene: gif.scene,
        colors: gif.colors,
        variant: gif.variant ?? 0,
        progress: STILL_HERO_PROGRESS,
        size: backingSize,
        transparentBg: true,
      },
      ctx
    );
  }, [gif, backingSize]);

  return (
    <canvas
      ref={canvasRef}
      width={backingSize}
      height={backingSize}
      className={className}
      aria-label={gif.name}
    />
  );
});
StillStickerCanvas.displayName = 'StillStickerCanvas';

const StickerGridCard = memo<{
  gif: CrochetGifDef;
  isCopied: boolean;
  onInsert: (gif: CrochetGifDef) => void;
  onCopy: (gif: CrochetGifDef) => void;
  onDownload: (gif: CrochetGifDef) => void;
  onPreview: (gif: CrochetGifDef) => void;
}>(({ gif, isCopied, onInsert, onCopy, onDownload, onPreview }) => (
  <article className="group rounded-2xl parchment-page border-2 border-[#a87842]/65 hover:border-[#7a202a] transition-all shadow-lg text-[#4a220d] flex flex-col overflow-hidden">
    <div className="relative flex items-center justify-center pt-3 px-3">
      <button
        type="button"
        onClick={() => onInsert(gif)}
        title={`Pegar sticker "${gif.name}" en el cuaderno`}
        className="relative w-28 h-28 flex items-center justify-center rounded-xl bg-[#fbf2de]/75 border border-[#c79d63]/40 hover:scale-[1.04] transition-transform cursor-pointer"
      >
        <StillStickerCanvas gif={gif} size={112} className="w-24 h-24" />
      </button>
      <button
        type="button"
        onClick={() => onPreview(gif)}
        title="Ver sticker en grande"
        aria-label={`Ampliar ${gif.name}`}
        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-[#381d0e]/85 hover:bg-[#5c3118] text-[#ffebc2] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer shadow"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>

    <div className="px-3 pt-2.5 pb-2 flex-1 flex flex-col">
      <h3 className="font-editorial text-sm font-bold leading-snug text-[#45200b] truncate">
        {gif.name}
      </h3>
      <p className="text-[11px] text-[#7c4d27] mt-0.5 truncate">
        {gif.category} · {gif.subtitle}
      </p>
    </div>

    <div className="px-2.5 pb-2.5 pt-1 border-t border-[#b8894c]/25 grid grid-cols-3 gap-1">
      <button
        type="button"
        onClick={() => onInsert(gif)}
        className="inline-flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-105 text-[11px] font-medium text-white cursor-pointer shadow-sm"
        title="Pegar sticker HD en el cuaderno"
      >
        <ClipboardPaste className="w-3 h-3 shrink-0" />
        <span>Pegar</span>
      </button>
      <button
        type="button"
        onClick={() => onCopy(gif)}
        className="inline-flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg bg-[#efe0bf] hover:bg-[#e5cf9f] border border-[#b58449]/45 text-[11px] font-medium text-[#4a220d] cursor-pointer"
        title="Copiar sticker PNG sin fondo"
      >
        {isCopied ? (
          <>
            <Check className="w-3 h-3 text-[#1e6f43] shrink-0" />
            <span>Listo</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3 shrink-0" />
            <span>Copiar</span>
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => onDownload(gif)}
        className="inline-flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg bg-[#efe0bf] hover:bg-[#e5cf9f] border border-[#b58449]/45 text-[11px] font-medium text-[#4a220d] cursor-pointer"
        title="Descargar sticker PNG HD sin fondo"
      >
        <Download className="w-3 h-3 shrink-0" />
        <span>.PNG</span>
      </button>
    </div>
  </article>
));
StickerGridCard.displayName = 'StickerGridCard';

export const CrochetGifsView: React.FC<{
  onInsertGif: (dataUrl: string, title: string) => void;
  onNotify?: (msg: string) => void;
  onReturnToNotebook?: () => void;
}> = ({ onInsertGif, onNotify, onReturnToNotebook }) => {
  const [activeCategory, setActiveCategory] = useState<'Todos' | CrochetGifCategory>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(48);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewGif, setPreviewGif] = useState<CrochetGifDef | null>(null);
  const [previewPngUrl, setPreviewPngUrl] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { Todos: CROCHET_GIFS.length };
    for (const g of CROCHET_GIFS) {
      map[g.category] = (map[g.category] || 0) + 1;
    }
    return map;
  }, []);

  const filteredGifs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CROCHET_GIFS.filter((g) => {
      if (activeCategory !== 'Todos' && g.category !== activeCategory) return false;
      if (
        q &&
        !g.name.toLowerCase().includes(q) &&
        !g.subtitle.toLowerCase().includes(q) &&
        !g.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    setVisibleLimit(48);
  }, [activeCategory, searchQuery]);

  const displayedGifs = useMemo(
    () => filteredGifs.slice(0, visibleLimit),
    [filteredGifs, visibleLimit]
  );
  const hasMore = displayedGifs.length < filteredGifs.length;

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleLimit((prev) => Math.min(filteredGifs.length, prev + 48));
        }
      },
      { rootMargin: '320px' }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, filteredGifs.length]);

  useEffect(() => {
    if (!previewGif) {
      setPreviewPngUrl(null);
      return;
    }
    setPreviewPngUrl(renderStillStickerDataUrl(previewGif, 512));
  }, [previewGif]);

  const handleInsert = useCallback(
    (gif: CrochetGifDef) => {
      audioEngine.playYarnPluck(4);
      const dataUrl = renderStillStickerDataUrl(gif, 512);
      onInsertGif(dataUrl, gif.name);
    },
    [onInsertGif]
  );

  const handleCopy = useCallback(
    async (gif: CrochetGifDef) => {
      audioEngine.playStitchClick();
      const dataUrl = renderStillStickerDataUrl(gif, 512);
      const copied = await copyPngBlobToClipboard(renderStillStickerBlob(gif, 512), dataUrl);

      if (!copied) {
        try {
          await navigator.clipboard?.writeText(dataUrl);
        } catch {
          // Ignore clipboard restrictions
        }
      }

      setCopiedId(gif.id);
      window.setTimeout(() => {
        setCopiedId((cur) => (cur === gif.id ? null : cur));
      }, 1600);
      onNotify?.(`Sticker copiado: ${gif.name}`);
    },
    [onNotify]
  );

  const handleDownload = useCallback(
    async (gif: CrochetGifDef) => {
      audioEngine.playSaveChime();
      const blob = await renderStillStickerBlob(gif, 512);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = gif.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      a.download = `${slug || gif.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      onNotify?.(`Descargando sticker ${a.download}`);
    },
    [onNotify]
  );

  return (
    <div className="flex-1 overflow-y-auto studio-scroll p-4 sm:p-6 bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl text-[#f7e2b9]">
              Stickers Ilustrados HD de Crochet ({filteredGifs.length})
            </h2>
            <p className="text-xs text-[#d6b688]">
              Stickers fijos en alta definición sin movimiento y fondo transparente. Haz clic en cualquiera para pegarlo en tu cuaderno, copiarlo o descargarlo en .PNG
            </p>
          </div>

          {onReturnToNotebook && (
            <button
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                onReturnToNotebook();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b2110] hover:bg-[#522d17] border border-[#b98241]/45 text-xs font-medium text-[#ffebc2] cursor-pointer shadow"
            >
              <span>Volver al Cuaderno</span>
            </button>
          )}
        </div>

        {/* Category Tabs + Search */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-5">
          <div className="flex flex-wrap items-center gap-1.5">
            {STICKER_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat] ?? 0;
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    audioEngine.playRetroPop(1);
                    setActiveCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer whitespace-nowrap ${
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
              placeholder="Buscar suéter, macramé, mandala, flor..."
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

        {filteredGifs.length === 0 ? (
          <div className="p-8 rounded-2xl border border-[#b98241]/30 bg-[#2a160b]/70 text-center text-sm text-[#dfc49b]">
            No hay stickers que coincidan con “{searchQuery}”.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {displayedGifs.map((gif) => (
                <StickerGridCard
                  key={gif.id}
                  gif={gif}
                  isCopied={copiedId === gif.id}
                  onInsert={handleInsert}
                  onCopy={(g) => void handleCopy(g)}
                  onDownload={(g) => void handleDownload(g)}
                  onPreview={(g) => {
                    audioEngine.playRetroPop(2);
                    setPreviewGif(g);
                  }}
                />
              ))}
            </div>

            {hasMore && (
              <div ref={sentinelRef} className="mt-6 flex flex-col items-center gap-2 py-2">
                <button
                  type="button"
                  onClick={() => setVisibleLimit(filteredGifs.length)}
                  className="px-4 py-2 rounded-lg bg-[#381e0f] border border-[#b98241]/50 hover:bg-[#522d17] text-xs text-[#f4d8ab] cursor-pointer transition-colors shadow"
                >
                  Mostrar los {filteredGifs.length - displayedGifs.length} stickers restantes
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Large Still HD Sticker Modal Preview */}
      {previewGif && (
        <div
          onClick={() => setPreviewGif(null)}
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl leather-panel bg-[#221208] p-4 space-y-3 text-[#f6e4c4] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#b98241]/30 pb-2">
              <div className="min-w-0">
                <h3 className="font-editorial text-lg font-bold text-[#ffebc2] truncate">
                  {previewGif.name}
                </h3>
                <p className="text-xs text-[#d6b688] truncate">
                  {previewGif.category} · {previewGif.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewGif(null)}
                aria-label="Cerrar vista previa"
                className="p-1.5 rounded-lg bg-[#6e212a] hover:bg-[#8c2d34] text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center rounded-xl parchment-page p-6 border border-[#a87842]/60">
              {previewPngUrl ? (
                <img
                  src={previewPngUrl}
                  alt={previewGif.name}
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <StillStickerCanvas gif={previewGif} size={192} className="w-48 h-48" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  handleInsert(previewGif);
                  setPreviewGif(null);
                }}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer shadow"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Pegar</span>
              </button>
              <button
                type="button"
                onClick={() => void handleCopy(previewGif)}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#3b2110] hover:bg-[#522e17] border border-[#b98241]/45 text-xs font-medium text-[#ffebc2] cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </button>
              <button
                type="button"
                onClick={() => void handleDownload(previewGif)}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#3b2110] hover:bg-[#522e17] border border-[#b98241]/45 text-xs font-medium text-[#ffebc2] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
