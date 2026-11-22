import React, { useMemo, useState } from 'react';
import { BookOpen, Eye, Image as ImageIcon, Pencil, Search, X } from 'lucide-react';
import type { DressingRoomGarment } from '../types/crochet';

interface DetailInspectorModalProps {
  isOpen: boolean;
  garment: DressingRoomGarment | null;
  currentModelImageSrc: string;
  currentAngleLabel: string;
  onClose: () => void;
  onEditGarment?: (garment: DressingRoomGarment) => void;
}

export const DetailInspectorModal: React.FC<DetailInspectorModalProps> = ({
  isOpen,
  garment,
  currentModelImageSrc,
  currentAngleLabel,
  onClose,
  onEditGarment,
}) => {
  const [activeTab, setActiveTab] = useState<'lupa' | 'ficha' | 'adjuntos'>('lupa');
  const [selectedSrc, setSelectedSrc] = useState<string | null>(null);
  const [loupeEnabled, setLoupeEnabled] = useState<boolean>(true);
  const [loupeZoom, setLoupeZoom] = useState<number>(2.4);
  const [pointer, setPointer] = useState<{ active: boolean; xPct: number; yPct: number }>({
    active: false,
    xPct: 50,
    yPct: 50,
  });

  const availableImages = useMemo(() => {
    const list: Array<{ id: string; label: string; src: string }> = [
      { id: 'stage', label: `Vista actual · ${currentAngleLabel}`, src: currentModelImageSrc },
    ];
    if (garment?.garmentViews?.front) {
      list.push({ id: 'g-front', label: 'Prenda · Frente', src: garment.garmentViews.front });
    }
    if (garment?.garmentViews?.back) {
      list.push({ id: 'g-back', label: 'Prenda · Espalda', src: garment.garmentViews.back });
    }
    if (garment?.modelViews?.front && garment.modelViews.front !== currentModelImageSrc) {
      list.push({ id: 'm-front', label: 'Modelo · Frente', src: garment.modelViews.front });
    }
    for (const p of garment?.techSheet?.detailPhotos ?? []) {
      list.push({ id: `det-${p.id}`, label: `Detalle · ${p.label}`, src: p.dataUrl });
    }
    for (const p of garment?.techSheet?.patternPhotos ?? []) {
      list.push({ id: `pat-${p.id}`, label: `Patrón · ${p.label}`, src: p.dataUrl });
    }
    return list;
  }, [garment, currentModelImageSrc, currentAngleLabel]);

  if (!isOpen) return null;

  const activePhotoSrc =
    selectedSrc && availableImages.some((i) => i.src === selectedSrc)
      ? selectedSrc
      : availableImages[0]?.src || currentModelImageSrc;

  const tech = garment?.techSheet;
  const detailPhotos = tech?.detailPhotos ?? [];
  const patternPhotos = tech?.patternPhotos ?? [];
  const hasTechData = Boolean(
    tech?.stitchType ||
      tech?.yarnWeight ||
      tech?.materials ||
      tech?.hookSize ||
      tech?.measurementsText ||
      tech?.seamDetails ||
      tech?.craftingNotes
  );

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setPointer({ active: true, xPct, yPct });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vista de detalles y ficha técnica de crochet"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2a140a]/68 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[26px] border-[4px] border-[#d9a66c] bg-[#fbf0df] text-[#452412] shadow-[0_24px_64px_rgba(36,16,6,0.5)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-[#5c3118] text-[#ffe8ba] border-b border-[#d4a367] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Eye className="w-4 h-4 text-[#ffd96b] shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold truncate">
                {garment ? `Detalles · ${garment.name}` : 'Vista de Detalles · Modelo Oficial'}
              </h2>
              <p className="text-[11px] text-[#f5dec1] truncate">
                Lupa fotográfica en resolución real, ficha técnica de crochet y galería de patrones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {garment && onEditGarment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditGarment(garment);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4be32] hover:brightness-105 border border-[#a96b08] text-xs font-extrabold text-[#3f1e07] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar ficha</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar vista de detalles"
              className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#f4e4cd] border-b border-[#dfc098] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('lupa')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              activeTab === 'lupa'
                ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224] hover:border-[#b98249]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Lupa de detalle</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ficha')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              activeTab === 'ficha'
                ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224] hover:border-[#b98249]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ficha técnica crochet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('adjuntos')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
              activeTab === 'adjuntos'
                ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224] hover:border-[#b98249]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>
              Detalles y patrones ({detailPhotos.length + patternPhotos.length})
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto studio-scroll p-4">
          {activeTab === 'lupa' && (
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Interactive Loupe Viewport */}
              <div className="flex-1 flex flex-col items-center">
                <div
                  onPointerMove={handleMove}
                  onPointerEnter={handleMove}
                  onPointerLeave={() => setPointer((p) => ({ ...p, active: false }))}
                  className="relative w-full max-w-[460px] aspect-[3/3.6] rounded-2xl border-2 border-[#d8b484] bg-gradient-to-b from-[#f6e3d8] to-[#dfc0a6] overflow-hidden cursor-crosshair select-none touch-none"
                >
                  <img
                    src={activePhotoSrc}
                    alt="Inspección de detalle"
                    draggable={false}
                    className="w-full h-full object-contain p-3"
                  />

                  {/* High-res circular magnifier loupe (zero distortion!) */}
                  {loupeEnabled && pointer.active && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute w-40 h-40 -ml-20 -mt-20 rounded-full border-[3px] border-[#ffe078] shadow-[0_10px_28px_rgba(32,12,4,0.45)] overflow-hidden bg-[#f5dfd4]"
                      style={{
                        left: `${pointer.xPct}%`,
                        top: `${pointer.yPct}%`,
                      }}
                    >
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url("${activePhotoSrc}")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: `${loupeZoom * 100}%`,
                          backgroundPosition: `${pointer.xPct}% ${pointer.yPct}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Loupe Controls */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-[#633619]">
                  <button
                    type="button"
                    onClick={() => setLoupeEnabled((v) => !v)}
                    className={`px-3 py-1 rounded-xl border cursor-pointer ${
                      loupeEnabled
                        ? 'bg-[#dff4e7] border-[#4b946a] text-[#1f5637]'
                        : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
                    }`}
                  >
                    Lupa: {loupeEnabled ? 'Activa' : 'Desactivada'}
                  </button>
                  <label className="inline-flex items-center gap-2">
                    <span>Aumento {loupeZoom.toFixed(1)}×</span>
                    <input
                      type="range"
                      min={1.6}
                      max={3.8}
                      step={0.2}
                      value={loupeZoom}
                      onChange={(e) => setLoupeZoom(Number(e.target.value))}
                      className="w-28 accent-[#d48b1b] cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Thumbnail Picker */}
              <div className="lg:w-[210px] shrink-0 space-y-2">
                <p className="text-xs font-extrabold text-[#633619]">
                  Imágenes disponibles ({availableImages.length})
                </p>
                <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
                  {availableImages.map((img) => {
                    const active = img.src === activePhotoSrc;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedSrc(img.src)}
                        className={`rounded-xl border-2 p-1 bg-[#fffaf1] cursor-pointer transition-all text-left ${
                          active
                            ? 'border-[#e09a16] ring-2 ring-[#ffe078]'
                            : 'border-[#dfc098] hover:border-[#b97d42]'
                        }`}
                      >
                        <img
                          src={img.src}
                          alt={img.label}
                          className="w-full aspect-square object-contain rounded-lg bg-[#f6ead9]"
                        />
                        <p className="mt-1 text-[10px] font-bold text-[#5a2f16] truncate text-center">
                          {img.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ficha' && (
            <div className="space-y-4">
              {!garment ? (
                <div className="rounded-2xl border-2 border-dashed border-[#cfa574] bg-[#fff9ef] p-6 text-center text-xs text-[#734526]">
                  Selecciona o añade un diseño del catálogo para consultar y completar su ficha técnica de crochet.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {[
                      { label: 'Tipo de punto', value: tech?.stitchType || garment.stitchNote },
                      { label: 'Grosor de hilo', value: tech?.yarnWeight || 'Sin especificar' },
                      { label: 'Materiales / Fibra', value: tech?.materials || garment.fiber },
                      { label: 'Agujas / Ganchillo', value: tech?.hookSize || garment.hookSizeMm },
                      { label: 'Medidas', value: tech?.measurementsText || 'Sin especificar' },
                      { label: 'Detalles de costura', value: tech?.seamDetails || 'Sin especificar' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="rounded-xl border border-[#dfc098] bg-[#fffaf1] px-3.5 py-2.5"
                      >
                        <p className="text-[10.5px] font-extrabold text-[#82512e]">{row.label}</p>
                        <p className="mt-0.5 text-xs font-semibold text-[#3f1f0d]">{row.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-[#dfc098] bg-[#fffaf1] px-3.5 py-3">
                    <p className="text-[10.5px] font-extrabold text-[#82512e]">
                      Notas de confección
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#4b2712] whitespace-pre-wrap">
                      {tech?.craftingNotes ||
                        (hasTechData
                          ? 'Sin notas adicionales de confección.'
                          : 'Aún no has rellenado la ficha técnica extendida de este diseño. Pulsa «Editar ficha» para añadir puntos, grosor, medidas y notas.')}
                    </p>
                  </div>

                  {garment.tags && garment.tags.length > 0 && (
                    <div className="text-xs text-[#6d4022]">
                      <span className="font-extrabold">Etiquetas: </span>
                      <span>{garment.tags.join(' · ')}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'adjuntos' && (
            <div className="space-y-4">
              {detailPhotos.length === 0 && patternPhotos.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[#cfa574] bg-[#fff9ef] p-6 text-center text-xs text-[#734526]">
                  No hay fotografías de detalles ni patrones adjuntos todavía. Puedes adjuntarlos desde el formulario del diseño.
                </div>
              ) : (
                <>
                  {detailPhotos.length > 0 && (
                    <div>
                      <h3 className="text-xs font-extrabold text-[#5e3116] mb-2">
                        Fotografías de detalles ({detailPhotos.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {detailPhotos.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedSrc(p.dataUrl);
                              setActiveTab('lupa');
                            }}
                            className="rounded-xl border border-[#dfc098] bg-[#fffaf1] p-1.5 hover:border-[#b9773f] cursor-pointer text-left"
                          >
                            <img
                              src={p.dataUrl}
                              alt={p.label}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <p className="mt-1 text-[10.5px] font-bold text-[#4f2812] truncate">
                              {p.label}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {patternPhotos.length > 0 && (
                    <div>
                      <h3 className="text-xs font-extrabold text-[#5e3116] mb-2">
                        Patrones y gráficos ({patternPhotos.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {patternPhotos.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedSrc(p.dataUrl);
                              setActiveTab('lupa');
                            }}
                            className="rounded-xl border border-[#dfc098] bg-[#fffaf1] p-1.5 hover:border-[#b9773f] cursor-pointer text-left"
                          >
                            <img
                              src={p.dataUrl}
                              alt={p.label}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                            <p className="mt-1 text-[10.5px] font-bold text-[#4f2812] truncate">
                              {p.label}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
