import React from 'react';
import {
  Download,
  Upload,
  Volume2,
  Monitor,
  Check,
  ImagePlus,
  X,
  RotateCcw,
  Search,
} from 'lucide-react';
import { CROCHET_STICKERS } from '../data/seedData';
import type { BrushSettings, FontChoice } from '../types/crochet';
import type { StickerCategory } from '../data/seedData';
import { CrochetStickerSvg } from './CrochetDecorations';
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
  onUploadImageToNotebook: () => void;
}> = ({ onInsertSticker, onUploadImageToNotebook }) => {
  const [activeCategory, setActiveCategory] = React.useState<'Todos' | StickerCategory>('Todos');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [visibleLimit, setVisibleLimit] = React.useState(80);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

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
              Stickers de Crochet, Flores, Perlas y Cuentas ({filteredStickers.length})
            </h2>
            <p className="text-xs text-[#d6b688]">
              Haz clic en cualquier adorno artesanal para pegarlo directamente en la hoja abierta del cuaderno
            </p>
          </div>

          <button
            type="button"
            onClick={onUploadImageToNotebook}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer shadow"
          >
            <ImagePlus className="w-4 h-4" />
            <span>Insertar Imagen Propia</span>
          </button>
        </div>

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
      </div>
    </div>
  );
};

/* ---------- 2. Fuentes (Typography Studio) ---------- */
export const FontsView: React.FC<{
  selectedFont: FontChoice;
  onSelectFont: (font: FontChoice) => void;
}> = ({ selectedFont, onSelectFont }) => {
  const fonts: Array<{
    id: FontChoice;
    name: string;
    sample: string;
    className: string;
    desc: string;
  }> = [
    {
      id: 'lora',
      name: 'Lora Clásica',
      sample: 'Anillo mágico de 6 puntos bajos, cerrar con punto deslizado.',
      className: 'font-body',
      desc: 'Caligrafía editorial cálida y muy legible para explicaciones largas.',
    },
    {
      id: 'cormorant',
      name: 'Cormorant Grabada',
      sample: 'Mandala Encaje Borgoña · Colección Otoño',
      className: 'font-editorial font-semibold',
      desc: 'Estilo libro de artista europeo para encabezados y portadillas.',
    },
    {
      id: 'caveat',
      name: 'Manuscrita de Taller',
      sample: '¡Recordar cambiar a ganchillo 2.25 mm en la vuelta 5!',
      className: 'font-hand text-2xl',
      desc: 'Letra cursiva espontánea ideal para anotaciones al margen.',
    },
    {
      id: 'cinzel',
      name: 'Cinzel Dorada',
      sample: 'CUADERNO DEL ARTISTA',
      className: 'font-display',
      desc: 'Tipografía monumental inspirada en el lomo repujado de cuero.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto studio-scroll p-4 sm:p-6 bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]">
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-xl text-[#f7e2b9] mb-1">
          Tipografías para tus Notas del Cuaderno
        </h2>
        <p className="text-xs text-[#d6b688] mb-5">
          Elige la fuente activa para los nuevos textos que añadas con la herramienta Texto
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fonts.map((f) => {
            const active = selectedFont === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFont(f.id)}
                className={`p-5 rounded-2xl parchment-page border-2 text-left transition-all cursor-pointer text-[#3e210e] ${
                  active
                    ? 'border-[#7a202a] ring-2 ring-[#ebbc6e]/70 shadow-xl'
                    : 'border-[#a87842]/60 hover:border-[#8e4c2a]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-sm font-bold text-[#5a2b12]">
                    {f.name}
                  </span>
                  {active && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7a202a]">
                      <Check className="w-3.5 h-3.5" /> Activa
                    </span>
                  )}
                </div>
                <p className={`${f.className} text-lg text-[#45220e] my-3 leading-snug`}>
                  {f.sample}
                </p>
                <p className="text-xs text-[#734a27]">{f.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ---------- 3. Difuminados y Pinceles Hiperrealistas Quick Studio ---------- */
export const BrushesQuickView: React.FC<{
  brush: BrushSettings;
  onChangeBrush: (patch: Partial<BrushSettings>) => void;
  onActivateDrawMode: () => void;
}> = ({ brush, onChangeBrush, onActivateDrawMode }) => (
  <div className="flex-1 overflow-y-auto studio-scroll p-4 sm:p-6 bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]">
    <div className="max-w-3xl mx-auto rounded-2xl leather-panel p-6 text-[#f6e4c4]">
      <h2 className="font-display text-xl text-[#ffebc2] mb-1">
        Estudio de Difuminados y Pinceles Hiperrealistas
      </h2>
      <p className="text-xs text-[#d6b688] mb-5">
        Difumina y armoniza trazos con precisión, o pinta con brochas de texturas hiperrealistas (pelo, arena, piel, plumas, roca, tela y más)
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { id: 'difuminado-seda', cat: 'difuminados', name: 'Difuminado Seda', desc: 'Arrastra y funde los pigmentos con suavidad para unir colores sin cortes', size: 26, opacity: 68, softness: 88 },
          { id: 'difuminado-suavizar', cat: 'difuminados', name: 'Suavizador Preciso', desc: 'Difumina bordes y hace los colores más homogéneos y suaves', size: 28, opacity: 65, softness: 92 },
          { id: 'difuminado-armonizar', cat: 'difuminados', name: 'Armonizador de Color', desc: 'Unifica tonos desiguales equilibrando el lienzo con tu color activo', size: 30, opacity: 58, softness: 90 },
          { id: 'pelo-animal', cat: 'pinceles', name: 'Pelo de Animal', desc: 'Hebras cónicas direccionales con subpelo oscuro y brillo natural', size: 18, opacity: 88, softness: 30 },
          { id: 'arena-fina', cat: 'pinceles', name: 'Arena Fina', desc: 'Microgranos minerales con destellos de cuarzo y sombras granuladas', size: 22, opacity: 84, softness: 45 },
          { id: 'piel-poros', cat: 'pinceles', name: 'Piel y Poros', desc: 'Microtextura dérmica orgánica pensada para retratos hiperrealistas', size: 20, opacity: 55, softness: 65 },
        ].map((item) => {
          const active = brush.preset === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChangeBrush({
                  category: item.cat as BrushSettings['category'],
                  preset: item.id as BrushSettings['preset'],
                  size: item.size,
                  opacity: item.opacity,
                  softness: item.softness,
                });
                onActivateDrawMode();
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                active
                  ? 'bg-[#693a1b] border-[#ecc074] text-white'
                  : 'bg-[#221208] border-[#b98241]/35 hover:border-[#dfaf62]'
              }`}
            >
              <p className="font-editorial text-base font-bold text-[#ffebc2]">{item.name}</p>
              <p className="text-xs text-[#d6b688] mt-1">{item.desc}</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onActivateDrawMode}
        className="px-5 py-2.5 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer"
      >
        Ir al Cuaderno y Dibujar Ahora
      </button>
    </div>
  </div>
);

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
