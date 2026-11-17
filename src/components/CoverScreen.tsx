import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Music, VolumeX, Sparkles } from 'lucide-react';

interface CoverScreenProps {
  musicPlaying: boolean;
  onToggleMusic: () => void;
  onOpenBook: () => void;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({
  musicPlaying,
  onToggleMusic,
  onOpenBook,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const dragStartX = useRef<number | null>(null);

  const triggerOpen = () => {
    if (isOpening) return;
    setIsOpening(true);
    onOpenBook();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartX.current === null || isOpening) return;
    const deltaX = dragStartX.current - e.clientX; // drag right-to-left like opening a book cover
    if (deltaX > 0) {
      const progress = Math.min(1, deltaX / 180);
      setDragProgress(progress);
      if (progress >= 0.72) {
        dragStartX.current = null;
        triggerOpen();
      }
    }
  };

  const handlePointerUp = () => {
    dragStartX.current = null;
    if (!isOpening) {
      setDragProgress(0);
    }
  };

  const coverRotateY = isOpening ? -160 : -dragProgress * 55;

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#1a0f08] flex flex-col items-center justify-center p-3 sm:p-6"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Ambient background wood & leather glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 65% 50%, rgba(196, 128, 62, 0.38), transparent 55%), radial-gradient(circle at 30% 50%, rgba(145, 48, 56, 0.25), transparent 50%)',
        }}
      />

      {/* Top Desktop Studio Bar on Cover */}
      <header className="relative z-20 w-full max-w-[1320px] flex items-center justify-between gap-4 px-4 py-2.5 mb-2 rounded-t-xl leather-surface border border-[#d6a25e]/35">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7c2029] border border-[#e3b978]/60 shadow">
            <BookOpen className="w-3.5 h-3.5 text-[#f7e2b9]" />
          </span>
          <span className="font-display text-sm sm:text-base tracking-wide text-[#f6e2be]">
            Cuaderno del Artista · Estudio de Crochet
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMusic}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#d6a25e]/45 bg-[#2d180c]/90 hover:bg-[#412312] text-xs font-medium text-[#f4dfb9] transition-colors cursor-pointer whitespace-nowrap"
          >
            {musicPlaying ? (
              <>
                <Music className="w-3.5 h-3.5 text-[#eab86a]" />
                <span>Música Relajante: Activa</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#b8976c]" />
                <span>Activar Música Crochet</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Cover Stage using the exact 1st photo */}
      <main className="relative z-10 w-full max-w-[1320px] aspect-[16/9] max-h-[82vh] rounded-b-xl overflow-hidden border border-t-0 border-[#d6a25e]/40 shadow-[0_30px_70px_rgba(0,0,0,0.75)] book-stage">
        {/* Base Cover Photo (1st attached image) */}
        <img
          src="/assets/aistudio/image_e6ae2ac2.png"
          alt="Cuaderno del Artista sobre mesa de madera con tapete de crochet borgoña y crema"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none"
          draggable={false}
        />

        {/* Subtle warm vignette & floating golden yarn dust motes */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#160b05]/65 via-transparent to-[#160b05]/20" />
        {[
          { left: '18%', top: '26%', delay: '0s' },
          { left: '34%', top: '62%', delay: '1.6s' },
          { left: '48%', top: '34%', delay: '3.1s' },
          { left: '72%', top: '22%', delay: '2.2s' },
          { left: '84%', top: '68%', delay: '0.8s' },
        ].map((mote, i) => (
          <span
            key={i}
            style={{ left: mote.left, top: mote.top, animationDelay: mote.delay }}
            className="pointer-events-none absolute w-2 h-2 rounded-full bg-[#ffe3aa]/70 blur-[1px] animate-mote"
          />
        ))}

        {/* Interactive 3D Book Flap Overlay aligned over the right-hand leather book */}
        <motion.div
          animate={{ rotateY: coverRotateY }}
          transition={{ duration: isOpening ? 0.95 : 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left center' }}
          onPointerDown={handlePointerDown}
          onClick={triggerOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerOpen();
            }
          }}
          aria-label="Abrir Cuaderno del Artista"
          className="absolute right-[8%] top-[4%] bottom-[4%] w-[36%] cursor-grab active:cursor-grabbing preserve-3d group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cd86] rounded-r-xl"
        >
          {/* Subtle shimmer outline around the embossed book cover */}
          <div className="absolute inset-0 rounded-r-xl border border-[#f5d493]/0 group-hover:border-[#f5d493]/55 group-hover:shadow-[0_0_38px_rgba(245,205,130,0.32)] transition-all duration-300" />

          {/* Animated crochet thread highlight on hover */}
          <svg
            viewBox="0 0 220 340"
            className="pointer-events-none absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            fill="none"
          >
            <rect
              x="8"
              y="8"
              width="204"
              height="324"
              rx="10"
              stroke="#f5d598"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          </svg>

          {/* Floating tactile prompt badge at bottom of the book */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] flex flex-col items-center gap-2 pointer-events-none">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#271409]/90 border border-[#e7be77]/65 text-[#f9e6c1] font-editorial text-base sm:text-lg shadow-[0_8px_22px_rgba(0,0,0,0.65)] group-hover:bg-[#3a1e0e] transition-colors whitespace-nowrap">
              <Sparkles className="w-4 h-4 text-[#ebbd6c]" />
              <span>Abrir Cuaderno</span>
            </span>
            <span className="text-[11px] sm:text-xs text-[#f2dbb3]/85 bg-[#1b0e06]/75 px-3 py-0.5 rounded">
              Haz clic o desliza hacia la izquierda para pasar la portada
            </span>
          </div>
        </motion.div>

        {/* Bottom Left Studio Summary Strip */}
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 max-w-md pointer-events-none">
          <div className="px-4 py-3 rounded-xl bg-[#1b0e06]/82 border border-[#d6a25e]/35 backdrop-blur-sm shadow-lg">
            <p className="font-display text-sm sm:text-base text-[#f6e1bc]">
              Patrones · Materiales · Proyectos Terminados
            </p>
            <p className="mt-0.5 text-xs sm:text-sm text-[#dec296]/90 leading-snug">
              Organiza tus diagramas de puntos, inventario de lanas y galería de piezas tejidas en un cuaderno artesanal táctil.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
