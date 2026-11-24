import React, { useMemo, useState } from 'react';
import { Columns2, Download, SlidersHorizontal, X } from 'lucide-react';
import type { DressingRoomGarment, GarmentAnglePhotos } from '../types/crochet';

type CompareAngleKey = keyof GarmentAnglePhotos;

const COMPARE_ANGLES: Array<{
  key: CompareAngleKey;
  label: string;
  officialSrc: string;
}> = [
  { key: 'front', label: 'Frente (0°)', officialSrc: '/vestidor/modelo-oficial/frente.png?v=hd4' },
  {
    key: 'profileLeft',
    label: 'Perfil Izq. (90°)',
    officialSrc: '/vestidor/modelo-oficial/perfil-izquierdo.png?v=hd4',
  },
  { key: 'back', label: 'Espalda (180°)', officialSrc: '/vestidor/modelo-oficial/espalda.png?v=hd4' },
  {
    key: 'profileRight',
    label: 'Perfil Der. (270°)',
    officialSrc: '/vestidor/modelo-oficial/perfil-derecho.png?v=hd4',
  },
];

import { fitSafeCanvasSize, superRenderImageToCanvas, triggerBlobDownload } from '../utils/ultraHdImageEngine';

interface OutfitComparisonModalProps {
  isOpen: boolean;
  catalogDesigns: DressingRoomGarment[];
  activeTop: DressingRoomGarment | null;
  activeBottom: DressingRoomGarment | null;
  initialAngleDeg: number;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

function degToAngleKey(deg: number): CompareAngleKey {
  const a = ((deg % 360) + 360) % 360;
  if (a < 45 || a >= 315) return 'front';
  if (a >= 45 && a < 135) return 'profileLeft';
  if (a >= 135 && a < 225) return 'back';
  return 'profileRight';
}

function resolveOptionImage(
  optionId: string,
  angle: CompareAngleKey,
  catalogDesigns: DressingRoomGarment[]
): { src: string; label: string; isFallback: boolean } {
  const official = COMPARE_ANGLES.find((a) => a.key === angle) ?? COMPARE_ANGLES[0];
  if (optionId === 'official-base') {
    return {
      src: official.officialSrc,
      label: 'Modelo Oficial Base',
      isFallback: false,
    };
  }
  const design = catalogDesigns.find((d) => d.id === optionId);
  if (!design) {
    return {
      src: official.officialSrc,
      label: 'Modelo Oficial Base',
      isFallback: false,
    };
  }
  const modelPhoto = design.modelViews?.[angle];
  if (modelPhoto) {
    return { src: modelPhoto, label: design.name, isFallback: false };
  }
  const garmentPhoto = design.garmentViews?.[angle] || design.photoDataUrl;
  if (garmentPhoto) {
    return {
      src: garmentPhoto,
      label: `${design.name} (prenda)`,
      isFallback: true,
    };
  }
  return {
    src: official.officialSrc,
    label: `${design.name} (sin foto en este ángulo)`,
    isFallback: true,
  };
}

export const OutfitComparisonModal: React.FC<OutfitComparisonModalProps> = ({
  isOpen,
  catalogDesigns,
  activeTop,
  activeBottom,
  initialAngleDeg,
  onClose,
  onNotify,
}) => {
  const defaultRightId = activeTop?.id || activeBottom?.id || catalogDesigns[0]?.id || 'official-base';
  const [leftId, setLeftId] = useState<string>('official-base');
  const [rightId, setRightId] = useState<string>(defaultRightId);
  const [angle, setAngle] = useState<CompareAngleKey>(() => degToAngleKey(initialAngleDeg));
  const [mode, setMode] = useState<'side-by-side' | 'split'>('side-by-side');
  const [splitPct, setSplitPct] = useState<number>(50);

  const leftResolved = useMemo(
    () => resolveOptionImage(leftId, angle, catalogDesigns),
    [leftId, angle, catalogDesigns]
  );
  const rightResolved = useMemo(
    () => resolveOptionImage(rightId, angle, catalogDesigns),
    [rightId, angle, catalogDesigns]
  );

  if (!isOpen) return null;

  const handleExportComparisonPng = async () => {
    try {
      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => resolve(im);
          im.onerror = reject;
          im.src = src;
        });

      const [imgA, imgB] = await Promise.all([
        loadImg(leftResolved.src),
        loadImg(rightResolved.src),
      ]);

      const safe = fitSafeCanvasSize(7680, 5760);
      const W = safe.width;
      const H = safe.height;
      const unit = W / 1280;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#f3d8cc');
      bg.addColorStop(1, '#d8b090');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const drawHalf = (img: HTMLImageElement, xStart: number, label: string) => {
        const boxW = W / 2 - 48 * unit;
        const boxH = H - 140 * unit;
        const scale = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
        const dw = Math.round(img.naturalWidth * scale);
        const dh = Math.round(img.naturalHeight * scale);
        const dx = xStart + (W / 2 - dw) / 2;
        const dy = 70 * unit + (boxH - dh);
        const superImg = superRenderImageToCanvas(img, dw, dh, {
          sharpness: 0.82,
          clarity: 0.06,
          vibrance: 0.04,
        });
        ctx.drawImage(superImg, dx, dy, dw, dh);
        ctx.fillStyle = '#4c2610';
        ctx.font = `bold ${Math.round(20 * unit)}px Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.fillText(label, xStart + W / 4, H - 30 * unit);
      };

      drawHalf(imgA, 0, `A · ${leftResolved.label}`);
      drawHalf(imgB, W / 2, `B · ${rightResolved.label}`);

      ctx.strokeStyle = 'rgba(128, 74, 34, 0.35)';
      ctx.lineWidth = 2 * unit;
      ctx.beginPath();
      ctx.moveTo(W / 2, 48 * unit);
      ctx.lineTo(W / 2, H - 64 * unit);
      ctx.stroke();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (blob) {
        triggerBlobDownload(blob, `El-Vestidor-Dorado-Comparacion-8K-${W}x${H}.png`);
      } else {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `El-Vestidor-Dorado-Comparacion-8K-${W}x${H}.png`;
        a.click();
      }
      onNotify(`Comparación exportada en 8K (${W}×${H} px)`);
    } catch {
      onNotify('No se pudo exportar la comparación en PNG');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comparar conjuntos del Vestidor Dorado"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2a140a]/68 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[26px] border-[4px] border-[#d9a66c] bg-[#fbf0df] text-[#452412] shadow-[0_24px_64px_rgba(36,16,6,0.5)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-[#5c3118] text-[#ffe8ba] border-b border-[#d4a367] shrink-0">
          <div className="flex items-center gap-2.5">
            <Columns2 className="w-4 h-4 text-[#ffd96b]" />
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold leading-tight">
                Comparar Conjuntos
              </h2>
              <p className="text-[11px] text-[#f5dec1]">
                Compara el modelo oficial o tus diseños guardados manteniendo escala y ángulo reales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMode(mode === 'side-by-side' ? 'split' : 'side-by-side')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7c4624] hover:bg-[#93542d] border border-[#e3b56c] text-xs font-bold text-[#ffefd0] cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{mode === 'side-by-side' ? 'Vista cortina' : 'Lado a lado'}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleExportComparisonPng()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4be32] hover:brightness-105 border border-[#a96b08] text-xs font-extrabold text-[#3f1e07] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar comparador"
              className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selectors + Synchronized Angle Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 px-4 py-3 bg-[#f5e5cd] border-b border-[#dfc098] shrink-0">
          <div>
            <label className="block text-[10.5px] font-extrabold text-[#6b3c1e] mb-1">
              Vista A (Izquierda)
            </label>
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="w-full rounded-xl border border-[#cfa574] bg-[#fffaf1] px-2.5 py-1.5 text-xs font-bold text-[#44220f] focus:outline-none focus:border-[#b9773f]"
            >
              <option value="official-base">Modelo Oficial Base</option>
              {catalogDesigns.map((d) => (
                <option key={`left-${d.id}`} value={d.id}>
                  {d.name} ({d.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <span className="block text-[10.5px] font-extrabold text-[#6b3c1e] mb-1 text-center">
              Ángulo sincronizado
            </span>
            <div className="grid grid-cols-4 gap-1">
              {COMPARE_ANGLES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setAngle(item.key)}
                  className={`py-1.5 px-1 rounded-lg text-[10.5px] font-bold border cursor-pointer transition-colors ${
                    angle === item.key
                      ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                      : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224] hover:border-[#b98249]'
                  }`}
                >
                  {item.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-extrabold text-[#6b3c1e] mb-1">
              Vista B (Derecha)
            </label>
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="w-full rounded-xl border border-[#cfa574] bg-[#fffaf1] px-2.5 py-1.5 text-xs font-bold text-[#44220f] focus:outline-none focus:border-[#b9773f]"
            >
              <option value="official-base">Modelo Oficial Base</option>
              {catalogDesigns.map((d) => (
                <option key={`right-${d.id}`} value={d.id}>
                  {d.name} ({d.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Viewport */}
        <div className="flex-1 min-h-[380px] p-4 overflow-y-auto studio-scroll">
          {mode === 'side-by-side' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              {[
                { tag: 'A', item: leftResolved },
                { tag: 'B', item: rightResolved },
              ].map(({ tag, item }) => (
                <div
                  key={tag}
                  className="relative rounded-2xl border-2 border-[#d8b484] bg-gradient-to-b from-[#f5dfd4] via-[#edd1c2] to-[#d9b292] flex flex-col items-center justify-end p-4 min-h-[360px] overflow-hidden"
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    draggable={false}
                    className="max-h-[410px] w-auto object-contain drop-shadow-[0_12px_18px_rgba(62,28,12,0.28)]"
                  />
                  <div className="mt-2 text-center text-xs font-bold text-[#4c2610]">
                    <span>{tag}</span>
                    <span className="mx-1.5 opacity-50">·</span>
                    <span>{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-full max-w-[440px] aspect-[2/2.8] rounded-2xl border-2 border-[#d8b484] bg-gradient-to-b from-[#f5dfd4] via-[#edd1c2] to-[#d9b292] overflow-hidden select-none">
                {/* Base Layer B */}
                <img
                  src={rightResolved.src}
                  alt={rightResolved.label}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-contain p-3"
                />
                {/* Clipped Layer A */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
                >
                  <img
                    src={leftResolved.src}
                    alt={leftResolved.label}
                    draggable={false}
                    className="w-full h-full object-contain p-3"
                  />
                </div>
                {/* Vertical Split Divider */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-0.5 bg-[#ffe078] shadow-[0_0_8px_rgba(64,28,8,0.8)]"
                  style={{ left: `${splitPct}%` }}
                />
                <div className="pointer-events-none absolute bottom-2 inset-x-3 flex items-center justify-between text-[11px] font-bold text-[#4c2610]">
                  <span className="bg-[#fff7ea]/90 px-2 py-0.5 rounded-md">
                    A · {leftResolved.label}
                  </span>
                  <span className="bg-[#fff7ea]/90 px-2 py-0.5 rounded-md">
                    B · {rightResolved.label}
                  </span>
                </div>
              </div>

              <div className="w-full max-w-[440px] flex items-center gap-3 text-xs font-bold text-[#663619]">
                <span>A</span>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={splitPct}
                  onChange={(e) => setSplitPct(Number(e.target.value))}
                  aria-label="Deslizar cortina de comparación"
                  className="flex-1 accent-[#d48b1b] cursor-pointer"
                />
                <span>B</span>
              </div>
            </div>
          )}

          {catalogDesigns.length === 0 && (
            <p className="mt-3 text-center text-xs text-[#7d4f2e]">
              Cuando añadas diseños a tu catálogo aparecerán aquí automáticamente para compararlos con el modelo oficial o entre sí.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
