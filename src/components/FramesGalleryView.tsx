import React, { useRef, useState } from 'react';
import { Frame, ImagePlus, Plus, Sparkles } from 'lucide-react';
import {
  MUSEUM_FRAMES,
  MUSEUM_FRAME_CATEGORIES,
  type MuseumFrameCategory,
  type MuseumFrameMeta,
} from '../data/museumFrames';
import { audioEngine } from '../utils/audioEngine';

interface FramesGalleryViewProps {
  onInsertStandaloneFrame: (frame: MuseumFrameMeta) => void;
  onInsertFramedPhotoFile: (file: File, frame: MuseumFrameMeta) => void | Promise<void>;
  onReturnToNotebook: () => void;
}

export const FramesGalleryView: React.FC<FramesGalleryViewProps> = ({
  onInsertStandaloneFrame,
  onInsertFramedPhotoFile,
  onReturnToNotebook,
}) => {
  const [activeCategory, setActiveCategory] = useState<'todos' | MuseumFrameCategory>('todos');
  const [pendingFrameForPhoto, setPendingFrameForPhoto] = useState<MuseumFrameMeta | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered =
    activeCategory === 'todos'
      ? MUSEUM_FRAMES
      : MUSEUM_FRAMES.filter((f) => f.category === activeCategory);

  const handleRequestPhotoForFrame = (frame: MuseumFrameMeta) => {
    audioEngine.playStitchClick();
    setPendingFrameForPhoto(frame);
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-1 overflow-y-auto studio-scroll p-4 sm:p-6 bg-[radial-gradient(circle_at_center,rgba(68,36,16,0.48)_0%,rgba(20,10,4,0.97)_85%)]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && pendingFrameForPhoto) {
            void onInsertFramedPhotoFile(file, pendingFrameForPhoto);
          }
          e.target.value = '';
          setPendingFrameForPhoto(null);
        }}
      />

      <div className="max-w-6xl mx-auto space-y-4">
        {/* Luxury Museum Header */}
        <div className="rounded-2xl leather-panel p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Frame className="w-5 h-5 text-[#f5cb73]" />
                <h2 className="font-display text-xl sm:text-2xl text-[#ffebc2] tracking-wide">
                  Galería de Marcos de Museo, Madera, Naturaleza y Puntillas
                </h2>
              </div>
              <p className="text-xs text-[#dfc397] mt-1">
                Coloca un marco transparente sobre dibujos, caligrafías o patrones, o sube una
                fotografía para enmarcarla en Ultra-HD 8K como obra de exhibición.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                onReturnToNotebook();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-b from-[#e0a344] to-[#a06118] border border-[#ffe29b]/65 text-xs font-bold text-[#fffaf0] cursor-pointer shrink-0 shadow hover:brightness-110"
            >
              Volver al Cuaderno
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {MUSEUM_FRAME_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'todos'
                  ? MUSEUM_FRAMES.length
                  : MUSEUM_FRAMES.filter((f) => f.category === cat.id).length;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    audioEngine.playYarnPluck(2);
                    setActiveCategory(cat.id);
                  }}
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
          </div>
        </div>

        {/* Photorealistic Frames Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((frame) => (
            <div
              key={frame.id}
              className="relative rounded-2xl bg-gradient-to-br from-[#2a160a] via-[#1e0f06] to-[#140903] border border-[#c89347]/50 hover:border-[#f2c472]/85 shadow-[0_12px_28px_rgba(0,0,0,0.58)] overflow-hidden flex flex-col transition-all"
            >
              <span className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#e6b85c]/75" />
              <span className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#e6b85c]/75" />

              {/* Frame Preview over Forest-Green Cutting Mat */}
              <div className="relative h-64 sm:h-72 cutting-mat-page cutting-mat-grid flex items-center justify-center p-4 overflow-hidden border-b border-[#b98241]/30">
                <span className="absolute top-2.5 left-3 px-2 py-0.5 rounded-full bg-[#160a04]/85 border border-[#d6a253]/50 text-[10px] font-semibold text-[#ffe3a3] inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#ffd84d]" />
                  <span>{frame.categoryLabel}</span>
                </span>
                <img
                  src={frame.imagePath}
                  alt={frame.name}
                  draggable={false}
                  loading="lazy"
                  className="max-w-full max-h-full object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.55)] transition-transform duration-300 hover:scale-[1.03]"
                />
              </div>

              {/* Info & 1-Click Actions */}
              <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#ffebc2]">{frame.name}</h3>
                  <p className="text-[11px] leading-snug text-[#dfc397] mt-1">{frame.desc}</p>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playSaveChime();
                      onInsertStandaloneFrame(frame);
                    }}
                    title="Colocar este marco transparente en la hoja para rodear dibujos, textos o patrones"
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gradient-to-b from-[#d89b3c] to-[#9b5e16] hover:brightness-110 border border-[#ffe29b]/60 text-[11px] font-bold text-[#fffaf0] cursor-pointer shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Colocar marco</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestPhotoForFrame(frame)}
                    title="Subir una foto y enmarcarla directamente dentro de este marco en Ultra-HD"
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#244434] hover:bg-[#2f5843] border border-[#8ce0b8]/45 text-[11px] font-semibold text-[#eafff2] cursor-pointer shadow"
                  >
                    <ImagePlus className="w-3.5 h-3.5 text-[#9ef0c8]" />
                    <span>Enmarcar foto</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
