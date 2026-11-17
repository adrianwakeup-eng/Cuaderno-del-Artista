import React from 'react';
import { motion } from 'motion/react';

interface CrochetTransitionProps {
  active: boolean;
}

export const CrochetTransition: React.FC<CrochetTransitionProps> = ({ active }) => {
  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden bg-[#1a0f08]/85 backdrop-blur-sm"
    >
      {/* Left & Right Crochet Lace Curtains parting smoothly */}
      <motion.div
        initial={{ x: 0, opacity: 0.95 }}
        animate={{ x: '-105%', opacity: 0 }}
        transition={{ duration: 1.25, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 left-0 w-1/2 border-r-2 border-[#e3bf82]/40 bg-gradient-to-r from-[#2c190d] via-[#3d2312]/95 to-[#2b170b]"
      />
      <motion.div
        initial={{ x: 0, opacity: 0.95 }}
        animate={{ x: '105%', opacity: 0 }}
        transition={{ duration: 1.25, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 right-0 w-1/2 border-l-2 border-[#e3bf82]/40 bg-gradient-to-l from-[#2c190d] via-[#3d2312]/95 to-[#2b170b]"
      />

      {/* Unfurling Crochet Mandala SVG */}
      <motion.div
        initial={{ scale: 0.55, rotate: -25, opacity: 0 }}
        animate={{ scale: [0.55, 1.08, 1.35], rotate: [0, 18, 36], opacity: [0, 1, 0] }}
        transition={{ duration: 1.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[420px] h-[420px] flex items-center justify-center"
      >
        <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-[0_0_24px_rgba(244,207,138,0.45)]" fill="none">
          {/* Outer scalloped crochet loops */}
          {Array.from({ length: 16 }).map((_, idx) => {
            const angle = (idx * 360) / 16;
            return (
              <g key={idx} transform={`rotate(${angle} 150 150)`}>
                <path
                  d="M132 28 C142 8, 158 8, 168 28"
                  stroke="#f2d59d"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  className="animate-stitch-draw"
                />
                <circle cx="150" cy="40" r="8" stroke="#b94f56" strokeWidth="2.2" strokeDasharray="3 2" />
                <path
                  d="M150 50 L150 96"
                  stroke="#e5bd7b"
                  strokeWidth="1.4"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}
          {/* Inner woven rings */}
          <circle cx="150" cy="150" r="105" stroke="#f0d399" strokeWidth="2.2" strokeDasharray="6 4" className="animate-stitch-draw" />
          <circle cx="150" cy="150" r="78" stroke="#c86b6e" strokeWidth="2.4" strokeDasharray="4 3" className="animate-stitch-draw" />
          <circle cx="150" cy="150" r="48" stroke="#f7e2b9" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="150" cy="150" r="18" fill="#8b2a33" stroke="#f7dfb3" strokeWidth="2.5" />
          <circle cx="150" cy="150" r="6" fill="#fff6e2" />
        </svg>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0, 1, 0], y: [12, 0, -10] }}
          transition={{ duration: 1.35 }}
          className="absolute bottom-6 font-editorial italic text-xl tracking-wide text-[#f6deb4] drop-shadow"
        >
          Abriendo tu Cuaderno del Artista…
        </motion.p>
      </motion.div>
    </motion.div>
  );
};
