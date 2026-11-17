import React, { useEffect, useRef, useState } from 'react';
import { Check, Crop, RotateCcw, X } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  title?: string;
  onCancel: () => void;
  onApplyCrop: (croppedDataUrl: string) => void;
}

interface CropRect {
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  w: number; // percentage 10..100
  h: number; // percentage 10..100
}

type AspectPreset = 'free' | '1:1' | '4:3' | '3:4' | '16:9';

type DragMode =
  | 'move'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | null;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  title,
  onCancel,
  onApplyCrop,
}) => {
  const [crop, setCrop] = useState<CropRect>({ x: 10, y: 10, w: 80, h: 80 });
  const [aspect, setAspect] = useState<AspectPreset>('free');
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 800, h: 600 });
  const [applying, setApplying] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    orig: CropRect;
  } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth || 800, h: img.naturalHeight || 600 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const applyAspectPreset = (preset: AspectPreset) => {
    setAspect(preset);
    if (preset === 'free') return;

    const imgRatio = naturalSize.w / Math.max(1, naturalSize.h);
    const targetRatio =
      preset === '1:1'
        ? 1
        : preset === '4:3'
          ? 4 / 3
          : preset === '3:4'
            ? 3 / 4
            : 16 / 9;

    // In percentage coordinates: (w * natW) / (h * natH) = targetRatio => hPct = wPct * (imgRatio / targetRatio)
    let w = 74;
    let h = w * (imgRatio / targetRatio);
    if (h > 84) {
      h = 84;
      w = h * (targetRatio / imgRatio);
    }
    setCrop({
      x: Math.max(2, (100 - w) / 2),
      y: Math.max(2, (100 - h) / 2),
      w,
      h,
    });
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current || !stageRef.current) return;
      const { mode, startX, startY, orig } = dragRef.current;
      const rect = stageRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const dx = ((e.clientX - startX) / rect.width) * 100;
      const dy = ((e.clientY - startY) / rect.height) * 100;
      const minSize = 10;

      if (mode === 'move') {
        setCrop({
          ...orig,
          x: Math.max(0, Math.min(100 - orig.w, orig.x + dx)),
          y: Math.max(0, Math.min(100 - orig.h, orig.y + dy)),
        });
        return;
      }

      let { x, y, w, h } = orig;
      if (mode === 'se') {
        w = Math.max(minSize, Math.min(100 - orig.x, orig.w + dx));
        h = Math.max(minSize, Math.min(100 - orig.y, orig.h + dy));
      } else if (mode === 'sw') {
        const nextX = Math.max(0, Math.min(orig.x + orig.w - minSize, orig.x + dx));
        w = orig.w + (orig.x - nextX);
        x = nextX;
        h = Math.max(minSize, Math.min(100 - orig.y, orig.h + dy));
      } else if (mode === 'ne') {
        const nextY = Math.max(0, Math.min(orig.y + orig.h - minSize, orig.y + dy));
        h = orig.h + (orig.y - nextY);
        y = nextY;
        w = Math.max(minSize, Math.min(100 - orig.x, orig.w + dx));
      } else if (mode === 'nw') {
        const nextX = Math.max(0, Math.min(orig.x + orig.w - minSize, orig.x + dx));
        const nextY = Math.max(0, Math.min(orig.y + orig.h - minSize, orig.y + dy));
        w = orig.w + (orig.x - nextX);
        h = orig.h + (orig.y - nextY);
        x = nextX;
        y = nextY;
      }

      setCrop({ x, y, w, h });
    };

    const onUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  const startDrag = (mode: DragMode, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...crop },
    };
  };

  const handleConfirm = () => {
    setApplying(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const sx = Math.round((crop.x / 100) * img.naturalWidth);
      const sy = Math.round((crop.y / 100) * img.naturalHeight);
      const sw = Math.max(16, Math.round((crop.w / 100) * img.naturalWidth));
      const sh = Math.max(16, Math.round((crop.h / 100) * img.naturalHeight));

      const maxDim = 900;
      const scale = Math.min(1, maxDim / Math.max(sw, sh));
      const dw = Math.max(16, Math.round(sw * scale));
      const dh = Math.max(16, Math.round(sh * scale));

      const canvas = document.createElement('canvas');
      canvas.width = dw;
      canvas.height = dh;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
        const webp = canvas.toDataURL('image/webp', 0.86);
        const result = webp.startsWith('data:image/webp')
          ? webp
          : canvas.toDataURL('image/jpeg', 0.86);
        setApplying(false);
        onApplyCrop(result);
      } else {
        setApplying(false);
      }
    };
    img.onerror = () => {
      setApplying(false);
    };
    img.src = imageSrc;
  };

  const outW = Math.round((crop.w / 100) * naturalSize.w);
  const outH = Math.round((crop.h / 100) * naturalSize.h);

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl leather-panel p-4 sm:p-5 text-[#f6e4c4] flex flex-col gap-3"
      >
        <div className="flex items-center justify-between border-b border-[#b98241]/30 pb-2.5">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-[#f0c77c]" />
            <h3 className="font-display text-base text-[#ffebc2]">
              Recortar Imagen {title ? `· ${title}` : ''}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded hover:bg-[#5c361d]/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aspect ratio presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'free', label: 'Libre' },
                { id: '1:1', label: '1:1 Cuadrado' },
                { id: '4:3', label: '4:3' },
                { id: '3:4', label: '3:4' },
                { id: '16:9', label: '16:9' },
              ] as Array<{ id: AspectPreset; label: string }>
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyAspectPreset(item.id)}
                className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  aspect === item.id
                    ? 'bg-[#8d5422] border-[#f2c879] text-white font-medium'
                    : 'bg-[#221209] border-[#b98241]/35 text-[#dec39c] hover:bg-[#492813]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="font-mono-tab text-[11px] text-[#d8b888]">
            {outW} × {outH} px
          </span>
        </div>

        {/* Interactive Crop Stage */}
        <div className="flex items-center justify-center bg-[#140a05] rounded-xl p-3 border border-[#b98241]/25 overflow-hidden">
          <div
            ref={stageRef}
            className="relative inline-block max-w-full max-h-[55vh] overflow-hidden"
          >
            {/* Dimmed base image */}
            <img
              src={imageSrc}
              alt="Vista previa de recorte"
              className="block max-w-full max-h-[52vh] object-contain pointer-events-none select-none opacity-35"
              draggable={false}
            />

            {/* Crisp bright cropped preview clipped strictly to crop box */}
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              style={{
                clipPath: `inset(${crop.y}% ${100 - crop.x - crop.w}% ${100 - crop.y - crop.h}% ${crop.x}%)`,
              }}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />

            {/* Highlighted interactive crop box */}
            <div
              onPointerDown={(e) => startDrag('move', e)}
              style={{
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.w}%`,
                height: `${crop.h}%`,
              }}
              className="absolute border-2 border-[#f7d488] shadow-[0_0_16px_rgba(0,0,0,0.65)] cursor-move"
            >
              {/* Rule-of-thirds grid */}
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div key={idx} className="border border-white/25" />
                ))}
              </div>

              {/* 4 Corner Handles */}
              <button
                type="button"
                aria-label="Esquina superior izquierda"
                onPointerDown={(e) => startDrag('nw', e)}
                className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-[#f7d488] border-2 border-[#2a1509] cursor-nwse-resize"
              />
              <button
                type="button"
                aria-label="Esquina superior derecha"
                onPointerDown={(e) => startDrag('ne', e)}
                className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#f7d488] border-2 border-[#2a1509] cursor-nesw-resize"
              />
              <button
                type="button"
                aria-label="Esquina inferior izquierda"
                onPointerDown={(e) => startDrag('sw', e)}
                className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-[#f7d488] border-2 border-[#2a1509] cursor-nesw-resize"
              />
              <button
                type="button"
                aria-label="Esquina inferior derecha"
                onPointerDown={(e) => startDrag('se', e)}
                className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-[#f7d488] border-2 border-[#2a1509] cursor-nwse-resize"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => {
              setAspect('free');
              setCrop({ x: 5, y: 5, w: 90, h: 90 });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a160b] border border-[#b98241]/40 text-xs text-[#e8cfab] hover:bg-[#492915] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer área</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg bg-[#2a160b] border border-[#b98241]/35 text-xs text-[#e8cfab] hover:bg-[#492915] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={applying}
              onClick={handleConfirm}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer shadow disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{applying ? 'Recortando…' : 'Aplicar recorte'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
