import React, { useRef, useState } from 'react';
import { Check, Crop, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { NonDestructiveCrop } from '../types/crochet';

export const DEFAULT_NON_DESTRUCTIVE_CROP: NonDestructiveCrop = {
  x: 0.5,
  y: 0.5,
  zoom: 1,
  rotationDeg: 0,
};

/**
 * Computes pure CSS framing styles for a non-destructive crop record so the
 * original full-resolution photograph is never overwritten or degraded.
 */
export function getNonDestructiveCropStyle(
  crop?: NonDestructiveCrop | null
): React.CSSProperties {
  if (!crop) return {};
  const zoom = Math.max(1, Math.min(2.5, crop.zoom || 1));
  const rot = crop.rotationDeg ?? 0;
  const tx = (0.5 - (crop.x ?? 0.5)) * 100 * (zoom - 1 + 0.35);
  const ty = (0.5 - (crop.y ?? 0.5)) * 100 * (zoom - 1 + 0.35);
  if (zoom === 1 && rot === 0 && Math.abs(crop.x - 0.5) < 0.005 && Math.abs(crop.y - 0.5) < 0.005) {
    return {};
  }
  return {
    transform: `translate3d(${tx.toFixed(2)}%, ${ty.toFixed(2)}%, 0) scale(${zoom.toFixed(3)}) rotate(${rot}deg)`,
    transformOrigin: '50% 50%',
  };
}

interface NonDestructiveCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  slotLabel: string;
  aspectClass?: string;
  initialCrop?: NonDestructiveCrop;
  onClose: () => void;
  onApply: (crop: NonDestructiveCrop | undefined) => void;
}

export const NonDestructiveCropModal: React.FC<NonDestructiveCropModalProps> = ({
  isOpen,
  imageSrc,
  slotLabel,
  aspectClass = 'aspect-[3/3.6]',
  initialCrop,
  onClose,
  onApply,
}) => {
  const [crop, setCrop] = useState<NonDestructiveCrop>(() => ({
    ...DEFAULT_NON_DESTRUCTIVE_CROP,
    ...(initialCrop ?? {}),
  }));
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  if (!isOpen) return null;

  const isDefault =
    Math.abs(crop.x - 0.5) < 0.005 &&
    Math.abs(crop.y - 0.5) < 0.005 &&
    Math.abs(crop.zoom - 1) < 0.01 &&
    (crop.rotationDeg ?? 0) === 0;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    const sensitivity = 0.0032 / Math.max(1, crop.zoom * 0.65);
    setCrop((prev) => ({
      ...prev,
      x: Math.max(0.05, Math.min(0.95, Number((prev.x - dx * sensitivity).toFixed(4)))),
      y: Math.max(0.05, Math.min(0.95, Number((prev.y - dy * sensitivity).toFixed(4)))),
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Encuadre no destructivo — ${slotLabel}`}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-[#2a150a]/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[24px] border-[4px] border-[#d9a66c] bg-[#fbf0df] text-[#452412] shadow-[0_24px_60px_rgba(32,14,4,0.52)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-[#5c3118] text-[#ffe8ba] border-b border-[#d4a367]">
          <div className="flex items-center gap-2 min-w-0">
            <Crop className="w-4 h-4 text-[#ffd96b] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold truncate">
                Recorte no destructivo · {slotLabel}
              </h3>
              <p className="text-[10.5px] text-[#f4dcb9] truncate">
                La fotografía original se conserva íntegra y reversible
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar recorte"
            className="w-7 h-7 rounded-full hover:bg-white/15 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Interactive framing stage */}
          <div className="flex justify-center">
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`relative w-[220px] ${aspectClass} rounded-2xl border-2 border-[#b98249] bg-[#f4e4cd] overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none shadow-inner`}
            >
              <img
                src={imageSrc}
                alt={slotLabel}
                draggable={false}
                className="w-full h-full object-contain pointer-events-none"
                style={getNonDestructiveCropStyle(crop)}
              />
              {/* Rule-of-thirds subtle framing guide */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"
              >
                {Array.from({ length: 9 }).map((_, idx) => (
                  <span key={idx} className="border border-[#7c4820]/15" />
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-center text-[#7c4e2d]">
            Arrastra sobre la imagen para encuadrar · Ajusta el zoom o rotación sin perder calidad
          </p>

          {/* Zoom slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#633619]">
              <span className="inline-flex items-center gap-1">
                <ZoomIn className="w-3.5 h-3.5" /> Acercamiento
              </span>
              <span className="font-mono-tab">{Math.round(crop.zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCrop((p) => ({ ...p, zoom: Math.max(1, Number((p.zoom - 0.15).toFixed(2))) }))
                }
                aria-label="Alejar recorte"
                className="w-7 h-7 rounded-lg bg-[#f2dfc3] hover:bg-[#e7cba1] border border-[#cfa574] flex items-center justify-center cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min={1}
                max={2.4}
                step={0.05}
                value={crop.zoom}
                onChange={(e) => setCrop((p) => ({ ...p, zoom: Number(e.target.value) }))}
                className="flex-1 accent-[#d48b1b] cursor-pointer"
              />
              <button
                type="button"
                onClick={() =>
                  setCrop((p) => ({ ...p, zoom: Math.min(2.4, Number((p.zoom + 0.15).toFixed(2))) }))
                }
                aria-label="Acercar recorte"
                className="w-7 h-7 rounded-lg bg-[#f2dfc3] hover:bg-[#e7cba1] border border-[#cfa574] flex items-center justify-center cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Rotation & Reset */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() =>
                setCrop((p) => ({ ...p, rotationDeg: ((p.rotationDeg ?? 0) + 90) % 360 }))
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fff8ec] hover:bg-white border border-[#cfa574] text-xs font-bold text-[#5a2f16] cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotar 90° ({crop.rotationDeg ?? 0}°)</span>
            </button>

            <button
              type="button"
              onClick={() => setCrop({ ...DEFAULT_NON_DESTRUCTIVE_CROP })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f3dfc0] hover:bg-[#e8cba0] border border-[#cfa574] text-xs font-bold text-[#5a2f16] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Original</span>
            </button>
          </div>

          {/* Action footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2c297]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#f1dec1] hover:bg-[#e6cda7] border border-[#cfa874] text-xs font-bold text-[#5c3318] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onApply(isDefault ? undefined : crop)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-b from-[#ffe074] via-[#f2b824] to-[#da920c] hover:brightness-105 border-2 border-[#a86908] text-[#3f1e07] text-xs font-extrabold shadow cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2.8} />
              <span>Aplicar encuadre</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
