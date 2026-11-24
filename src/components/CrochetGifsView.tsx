import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Copy,
  Download,
  Maximize2,
  Search,
  Sparkles,
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

export interface PhotoRealSticker {
  id: string;
  name: string;
  subtitle: string;
  category: 'Fotográficos Reales' | 'Atrapasueños' | 'Granny y Tapetes';
  src: string;
}

/** Genuine high-definition photographed crochet, macramé, dreamcatcher & lace transparent cutouts */
export const PHOTO_REAL_CROCHET_STICKERS: PhotoRealSticker[] = [
  {
    id: 'photo-sunflower',
    name: 'Girasol de Crochet Real',
    subtitle: 'Fotografía HD tejida a mano',
    category: 'Fotográficos Reales',
    src: '/vestidor/artisan/crochet-sunflower.png',
  },
  {
    id: 'photo-dreamcatcher-macrame',
    name: 'Atrapasueños y Macramé Oro',
    subtitle: 'Encaje artesanal con atrapasueños',
    category: 'Atrapasueños',
    src: '/vestidor/artisan/macrame-curtain-gold.webp',
  },
  {
    id: 'photo-crochet-rug',
    name: 'Tapete Mandala de Crochet',
    subtitle: 'Granny circular tejido real HD',
    category: 'Granny y Tapetes',
    src: '/vestidor/artisan/crochet-rug.png',
  },
  {
    id: 'photo-flowers-bouquet',
    name: 'Flores Tejidas en Relieve',
    subtitle: 'Ramo artesanal de crochet HD',
    category: 'Fotográficos Reales',
    src: '/vestidor/artisan/flowers-top.png',
  },
  {
    id: 'photo-teddy',
    name: 'Osito Amigurumi Artesanal',
    subtitle: 'Muñeco de lana tejido HD',
    category: 'Fotográficos Reales',
    src: '/vestidor/artisan/crochet-teddy.png',
  },
  {
    id: 'photo-yarn-basket',
    name: 'Canasta de Ovillos Natural',
    subtitle: 'Cesta de mimbre y lanas HD',
    category: 'Fotográficos Reales',
    src: '/vestidor/artisan/top-basket.png',
  },
  {
    id: 'photo-floor-basket',
    name: 'Cesta de Estambres de Taller',
    subtitle: 'Ovillos de algodón peinado HD',
    category: 'Fotográficos Reales',
    src: '/vestidor/artisan/floor-yarn-basket.png',
  },
  {
    id: 'photo-sewing-machine',
    name: 'Máquina de Coser Vintage',
    subtitle: 'Reliquia dorada de atelier HD',
    category: 'Fotográficos Reales',
    src: '/vestidor/artisan/sewing-machine-vintage.webp',
  },
  {
    id: 'photo-yarn-ball',
    name: 'Ovillo de Algodón Natural',
    subtitle: 'Textura macro de fibra real HD',
    category: 'Fotográficos Reales',
    src: '/vestidor/artisan/yarn-ball-base.png',
  },
  {
    id: 'photo-macrame-artisan',
    name: 'Atrapasueños Macramé Crudo',
    subtitle: 'Nudos y borlas artesanales HD',
    category: 'Atrapasueños',
    src: '/vestidor/cortinas/macrame-artesanal.webp',
  },
  {
    id: 'photo-crochet-lace',
    name: 'Encaje Crochet Floral',
    subtitle: 'Calado artesanal de algodón HD',
    category: 'Granny y Tapetes',
    src: '/vestidor/cortinas/crochet-floral.webp',
  },
  {
    id: 'photo-gold-lace',
    name: 'Puntilla Dorada de Alta Costura',
    subtitle: 'Encaje barroco con hilo de oro',
    category: 'Granny y Tapetes',
    src: '/vestidor/cortinas/puntilla-dorada.webp',
  },
];

type UnifiedStickerFilter =
  | 'Todos'
  | 'Fotográficos Reales'
  | 'Boho y Macramé'
  | 'Granny y Tapetes'
  | 'Prendas y Accesorios'
  | 'Puntos y Ganchillo'
  | 'Mandalas de Taller'
  | 'Flores Tejidas'
  | 'Amigurumi'
  | 'Notas del Cuaderno';

const STICKER_CATEGORIES: UnifiedStickerFilter[] = [
  'Todos',
  'Fotográficos Reales',
  'Boho y Macramé',
  'Granny y Tapetes',
  'Prendas y Accesorios',
  'Puntos y Ganchillo',
  'Mandalas de Taller',
  'Flores Tejidas',
  'Amigurumi',
  'Notas del Cuaderno',
];

let cachedYarnPatternCanvas: HTMLCanvasElement | null = null;

/** Generates a subtle woven cotton/wool yarn fiber micro-texture tile for realistic tactile depth. */
function getYarnFiberPatternCanvas(): HTMLCanvasElement {
  if (cachedYarnPatternCanvas) return cachedYarnPatternCanvas;
  const c = document.createElement('canvas');
  c.width = 24;
  c.height = 24;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 24, 24);
    // Subtle diagonal twisted crochet fiber highlights & shadow grooves
    ctx.strokeStyle = 'rgba(255,250,235,0.16)';
    ctx.lineWidth = 1.2;
    for (let i = -24; i <= 48; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 24, 24);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(42,20,6,0.11)';
    ctx.lineWidth = 1.1;
    for (let i = -24; i <= 48; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i + 24, 0);
      ctx.lineTo(i, 24);
      ctx.stroke();
    }
  }
  cachedYarnPatternCanvas = c;
  return c;
}

/**
 * Renders any illustrated crochet/dreamcatcher/granny sticker with realistic textile yarn-fiber
 * micro-texture, warm top-left studio lighting highlight, and soft 3D artisanal shadow depth.
 */
function renderRealisticEmbossedSticker(
  gif: CrochetGifDef,
  size: number,
  targetCtx: CanvasRenderingContext2D
) {
  const work = document.createElement('canvas');
  work.width = size;
  work.height = size;
  const wCtx = work.getContext('2d');
  if (!wCtx) return;

  renderCrochetGifFrame(
    {
      scene: gif.scene,
      colors: gif.colors,
      variant: gif.variant ?? 0,
      progress: STILL_HERO_PROGRESS,
      size,
      transparentBg: true,
    },
    wCtx
  );

  // 1. Apply tactile woven yarn fiber texture strictly inside the sticker silhouette
  wCtx.save();
  wCtx.globalCompositeOperation = 'source-atop';
  const pat = wCtx.createPattern(getYarnFiberPatternCanvas(), 'repeat');
  if (pat) {
    wCtx.fillStyle = pat;
    wCtx.fillRect(0, 0, size, size);
  }
  // 2. Warm studio directional bevel lighting (subtle sunlit top-left sheen + bottom-right warmth)
  const lightGrad = wCtx.createLinearGradient(0, 0, size, size);
  lightGrad.addColorStop(0, 'rgba(255,248,225,0.20)');
  lightGrad.addColorStop(0.48, 'rgba(255,255,255,0)');
  lightGrad.addColorStop(1, 'rgba(45,20,6,0.18)');
  wCtx.fillStyle = lightGrad;
  wCtx.fillRect(0, 0, size, size);
  wCtx.restore();

  // 3. Composite onto target with crisp artisanal drop-shadow depth
  targetCtx.clearRect(0, 0, size, size);
  targetCtx.save();
  targetCtx.shadowColor = 'rgba(38, 18, 6, 0.28)';
  targetCtx.shadowBlur = Math.max(2, size * 0.025);
  targetCtx.shadowOffsetX = Math.max(1, size * 0.008);
  targetCtx.shadowOffsetY = Math.max(1.5, size * 0.014);
  targetCtx.drawImage(work, 0, 0);
  targetCtx.restore();
}

const stillPngCache = new Map<string, string>();

function renderStillStickerDataUrl(gif: CrochetGifDef, size = 512): string {
  const key = `real:${gif.id}:${size}`;
  const cached = stillPngCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    renderRealisticEmbossedSticker(gif, size, ctx);
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
  renderRealisticEmbossedSticker(gif, size, ctx);
  return new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

async function renderPhotoStickerPng(src: string, size = 640): Promise<{ dataUrl: string; blob: Blob | null }> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
  const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
  const w = aspect >= 1 ? size : Math.round(size * aspect);
  const h = aspect >= 1 ? Math.round(size / aspect) : size;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, w);
  canvas.height = Math.max(1, h);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  return { dataUrl, blob };
}

const StillStickerCanvas: React.FC<{
  gif: CrochetGifDef;
  size?: number;
  className?: string;
}> = memo(({ gif, size = 140, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const backingSize = size * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderRealisticEmbossedSticker(gif, backingSize, ctx);
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
        title="Pegar sticker realista HD en el cuaderno"
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

const PhotoRealStickerCard = memo<{
  item: PhotoRealSticker;
  isCopied: boolean;
  onInsert: (item: PhotoRealSticker) => void;
  onCopy: (item: PhotoRealSticker) => void;
  onDownload: (item: PhotoRealSticker) => void;
}>(({ item, isCopied, onInsert, onCopy, onDownload }) => (
  <article className="group rounded-2xl parchment-page border-2 border-[#c8913a]/80 hover:border-[#7a202a] transition-all shadow-lg text-[#4a220d] flex flex-col overflow-hidden">
    <div className="relative flex items-center justify-center pt-3 px-3">
      <button
        type="button"
        onClick={() => onInsert(item)}
        title={`Pegar sticker fotográfico "${item.name}" en el cuaderno`}
        className="relative w-28 h-28 flex items-center justify-center rounded-xl bg-[#fbf2de]/85 border border-[#c79d63]/50 hover:scale-[1.05] transition-transform cursor-pointer p-1.5"
      >
        <img
          src={item.src}
          alt={item.name}
          loading="lazy"
          draggable={false}
          className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(38,18,6,0.3)]"
        />
      </button>
      <span className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#3a1c0a]/90 border border-[#f5cb75]/75 text-[8.5px] font-semibold text-[#ffe8b0]">
        <Sparkles className="w-2.5 h-2.5" />
        Real HD
      </span>
    </div>

    <div className="px-3 pt-2.5 pb-2 flex-1 flex flex-col">
      <h3 className="font-editorial text-sm font-bold leading-snug text-[#45200b] truncate">
        {item.name}
      </h3>
      <p className="text-[11px] text-[#7c4d27] mt-0.5 truncate">{item.subtitle}</p>
    </div>

    <div className="px-2.5 pb-2.5 pt-1 border-t border-[#b8894c]/25 grid grid-cols-3 gap-1">
      <button
        type="button"
        onClick={() => onInsert(item)}
        className="inline-flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-105 text-[11px] font-medium text-white cursor-pointer shadow-sm"
      >
        <ClipboardPaste className="w-3 h-3 shrink-0" />
        <span>Pegar</span>
      </button>
      <button
        type="button"
        onClick={() => onCopy(item)}
        className="inline-flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg bg-[#efe0bf] hover:bg-[#e5cf9f] border border-[#b58449]/45 text-[11px] font-medium text-[#4a220d] cursor-pointer"
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
        onClick={() => onDownload(item)}
        className="inline-flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg bg-[#efe0bf] hover:bg-[#e5cf9f] border border-[#b58449]/45 text-[11px] font-medium text-[#4a220d] cursor-pointer"
      >
        <Download className="w-3 h-3 shrink-0" />
        <span>.PNG</span>
      </button>
    </div>
  </article>
));
PhotoRealStickerCard.displayName = 'PhotoRealStickerCard';

export const CrochetGifsView: React.FC<{
  onInsertGif: (dataUrl: string, title: string) => void;
  onNotify?: (msg: string) => void;
  onReturnToNotebook?: () => void;
  embedded?: boolean;
}> = ({ onInsertGif, onNotify, onReturnToNotebook, embedded = false }) => {
  const [activeCategory, setActiveCategory] = useState<UnifiedStickerFilter>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(48);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewGif, setPreviewGif] = useState<CrochetGifDef | null>(null);
  const [previewPngUrl, setPreviewPngUrl] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {
      Todos: CROCHET_GIFS.length + PHOTO_REAL_CROCHET_STICKERS.length,
      'Fotográficos Reales': PHOTO_REAL_CROCHET_STICKERS.length,
    };
    for (const g of CROCHET_GIFS) {
      map[g.category] = (map[g.category] || 0) + 1;
    }
    return map;
  }, []);

  const filteredPhotoStickers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PHOTO_REAL_CROCHET_STICKERS.filter((p) => {
      if (
        activeCategory !== 'Todos' &&
        activeCategory !== 'Fotográficos Reales' &&
        !(activeCategory === 'Boho y Macramé' && p.category === 'Atrapasueños') &&
        !(activeCategory === 'Granny y Tapetes' && p.category === 'Granny y Tapetes')
      ) {
        return false;
      }
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.subtitle.toLowerCase().includes(q) &&
        !p.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  const filteredGifs = useMemo(() => {
    if (activeCategory === 'Fotográficos Reales') return [];
    const q = searchQuery.trim().toLowerCase();
    return CROCHET_GIFS.filter((g) => {
      if (activeCategory !== 'Todos' && g.category !== (activeCategory as CrochetGifCategory)) {
        return false;
      }
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

  const handleInsertPhoto = useCallback(
    async (item: PhotoRealSticker) => {
      audioEngine.playYarnPluck(5);
      try {
        const { dataUrl } = await renderPhotoStickerPng(item.src, 720);
        onInsertGif(dataUrl, item.name);
      } catch {
        onInsertGif(item.src, item.name);
      }
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

  const handleCopyPhoto = useCallback(
    async (item: PhotoRealSticker) => {
      audioEngine.playStitchClick();
      try {
        const { dataUrl, blob } = await renderPhotoStickerPng(item.src, 720);
        if (blob) {
          await copyPngBlobToClipboard(blob, dataUrl);
        }
      } catch {
        // ignore
      }
      setCopiedId(item.id);
      window.setTimeout(() => {
        setCopiedId((cur) => (cur === item.id ? null : cur));
      }, 1600);
      onNotify?.(`Sticker real HD copiado: ${item.name}`);
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

  const handleDownloadPhoto = useCallback(
    async (item: PhotoRealSticker) => {
      audioEngine.playSaveChime();
      try {
        const { blob } = await renderPhotoStickerPng(item.src, 960);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.id}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        onNotify?.(`Descargando sticker ${a.download}`);
      } catch {
        // ignore
      }
    },
    [onNotify]
  );

  const totalMatches = filteredPhotoStickers.length + filteredGifs.length;

  return (
    <div
      className={
        embedded
          ? 'w-full'
          : 'flex-1 overflow-y-auto studio-scroll p-4 sm:p-6 bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]'
      }
    >
      <div className={embedded ? '' : 'max-w-5xl mx-auto'}>
        {!embedded && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-xl text-[#f7e2b9]">
                Stickers Realistas de Crochet, Atrapasueños y Granny ({totalMatches})
              </h2>
              <p className="text-xs text-[#d6b688]">
                Stickers fijos en alta definición con textura artesanal de hilo y fondo transparente.
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
        )}

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
              placeholder="Buscar atrapasueños, granny, crochet..."
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

        {totalMatches === 0 ? (
          <div className="p-8 rounded-2xl border border-[#b98241]/30 bg-[#2a160b]/70 text-center text-sm text-[#dfc49b]">
            No hay stickers que coincidan con “{searchQuery}”.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredPhotoStickers.map((item) => (
                <PhotoRealStickerCard
                  key={item.id}
                  item={item}
                  isCopied={copiedId === item.id}
                  onInsert={(p) => void handleInsertPhoto(p)}
                  onCopy={(p) => void handleCopyPhoto(p)}
                  onDownload={(p) => void handleDownloadPhoto(p)}
                />
              ))}

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
