import React, { useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface CrochetVestidorTransitionProps {
  active: boolean;
  onRevealWardrobe: () => void;
  onComplete: () => void;
}

const SPARKLES = [
  { x: '16%', y: '22%', size: 8, delay: 0.1 },
  { x: '32%', y: '34%', size: 11, delay: 0.22 },
  { x: '48%', y: '18%', size: 9, delay: 0.15 },
  { x: '66%', y: '28%', size: 12, delay: 0.28 },
  { x: '82%', y: '24%', size: 8, delay: 0.18 },
  { x: '22%', y: '72%', size: 10, delay: 0.3 },
  { x: '42%', y: '78%', size: 12, delay: 0.24 },
  { x: '58%', y: '68%', size: 9, delay: 0.34 },
  { x: '76%', y: '74%', size: 11, delay: 0.26 },
  { x: '50%', y: '50%', size: 15, delay: 0.36 },
];

/**
 * Magical full-screen crochet, stitching, needles & golden yarn transition
 * leading from the Notebook into the full-screen Royal 4-Season Wardrobe.
 */
export const CrochetVestidorTransition: React.FC<CrochetVestidorTransitionProps> = ({
  active,
  onRevealWardrobe,
  onComplete,
}) => {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!active) return;
    const revealMs = reducedMotion ? 160 : 680;
    const doneMs = reducedMotion ? 320 : 1220;

    const t1 = window.setTimeout(onRevealWardrobe, revealMs);
    const t2 = window.setTimeout(onComplete, doneMs);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [active, reducedMotion, onRevealWardrobe, onComplete]);

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        duration: reducedMotion ? 0.32 : 1.22,
        times: [0, 0.16, 0.68, 1],
        ease: 'easeInOut',
      }}
      className="fixed inset-0 z-[130] pointer-events-auto overflow-hidden flex items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at 50% 45%, rgba(62, 30, 10, 0.96) 0%, rgba(28, 13, 5, 0.98) 55%, rgba(12, 6, 2, 0.99) 100%)',
      }}
      aria-live="polite"
    >
      {/* Golden Ambient Spotlight Bloom */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.25, 1.55], opacity: [0, 0.72, 0] }}
        transition={{ duration: 1.15, ease: 'easeOut' }}
        className="pointer-events-none absolute w-[68vw] max-w-[780px] aspect-square rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255, 224, 132, 0.55) 0%, rgba(214, 152, 46, 0.24) 45%, rgba(0, 0, 0, 0) 75%)',
        }}
      />

      {/* Living Golden Stitches, Woven Yarn Ribbons & Gliding Crochet Hooks / Needles */}
      <svg
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 w-full h-full"
        fill="none"
      >
        <defs>
          <linearGradient id="vestidor-yarn-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8f5912" />
            <stop offset="35%" stopColor="#ffe8a2" />
            <stop offset="65%" stopColor="#eab342" />
            <stop offset="100%" stopColor="#fff4cb" />
          </linearGradient>
          <linearGradient id="vestidor-yarn-emerald" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#286446" />
            <stop offset="50%" stopColor="#72c998" />
            <stop offset="100%" stopColor="#f5da88" />
          </linearGradient>
          <filter id="yarn-glow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Perimeter Haute-Couture Golden Stitching Seam */}
        <motion.rect
          x="26"
          y="26"
          width="1148"
          height="668"
          rx="22"
          stroke="url(#vestidor-yarn-gold)"
          strokeWidth="3"
          strokeDasharray="14 9"
          initial={{ pathLength: 0, opacity: 0.2 }}
          animate={{ pathLength: 1, opacity: [0.2, 0.95, 0.4] }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Sweeping Golden Crochet Yarn Thread 1 (Upper Wave) */}
        <motion.path
          d="M -40 490 C 180 280, 340 540, 560 340 C 740 180, 930 430, 1240 210"
          stroke="url(#vestidor-yarn-gold)"
          strokeWidth="5.5"
          strokeLinecap="round"
          filter="url(#yarn-glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 0.9, 0] }}
          transition={{ duration: 0.98, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Sweeping Golden Crochet Chain-Stitch Overlay 1 */}
        <motion.path
          d="M -40 490 C 180 280, 340 540, 560 340 C 740 180, 930 430, 1240 210"
          stroke="#fff7d6"
          strokeWidth="2.4"
          strokeDasharray="8 10"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.95, 0.6, 0] }}
          transition={{ duration: 0.92, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Sweeping Emerald-Gold Silk Thread 2 (Lower Counter-Wave) */}
        <motion.path
          d="M 1240 510 C 980 320, 810 560, 610 370 C 420 190, 220 420, -40 230"
          stroke="url(#vestidor-yarn-emerald)"
          strokeWidth="4.5"
          strokeLinecap="round"
          filter="url(#yarn-glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.92, 0.85, 0] }}
          transition={{ duration: 1.0, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Delicate Stitched Counter-Loop */}
        <motion.path
          d="M 1240 510 C 980 320, 810 560, 610 370 C 420 190, 220 420, -40 230"
          stroke="#ffe9a6"
          strokeWidth="2"
          strokeDasharray="6 10"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.9, 0.4, 0] }}
          transition={{ duration: 0.96, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Gliding Golden Crochet Hook sweeping across the scene */}
        <motion.g
          initial={{ x: -240, y: 210, rotate: -28, opacity: 0 }}
          animate={{ x: 960, y: -160, rotate: -14, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.96, ease: [0.22, 1, 0.36, 1] }}
          filter="url(#yarn-glow)"
        >
          {/* Hook handle & shaft */}
          <path
            d="M 120 380 L 340 260"
            stroke="url(#vestidor-yarn-gold)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 145 366 L 330 266"
            stroke="#fff7d8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Sculpted Crochet Hook Tip */}
          <path
            d="M 340 260 C 358 250, 368 232, 355 224 C 344 218, 336 230, 344 238"
            stroke="#ffe69a"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>

        {/* Gliding Antique Golden Embroidery Needle sweeping counter-diagonal */}
        <motion.g
          initial={{ x: 260, y: 190, rotate: 24, opacity: 0 }}
          animate={{ x: -920, y: -150, rotate: 12, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.98, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          filter="url(#yarn-glow)"
        >
          <path
            d="M 1060 390 L 820 260"
            stroke="#fff3c4"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {/* Golden Needle Eye */}
          <ellipse
            cx="1046"
            cy="382"
            rx="11"
            ry="4"
            transform="rotate(28 1046 382)"
            stroke="#f5c65c"
            strokeWidth="3"
            fill="#281204"
          />
        </motion.g>
      </svg>

      {/* Expanding Rotating Golden Crochet Mandala Rosette in Center */}
      <motion.div
        initial={{ scale: 0.2, rotate: -40, opacity: 0 }}
        animate={{ scale: [0.2, 1.05, 1.32], rotate: [-40, 22, 58], opacity: [0, 0.95, 0] }}
        transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none relative flex flex-col items-center justify-center"
      >
        <svg viewBox="0 0 260 260" className="w-[220px] sm:w-[290px] h-auto drop-shadow-[0_0_24px_rgba(255,214,104,0.65)]" fill="none">
          <circle cx="130" cy="130" r="112" stroke="#f7d57e" strokeWidth="2.2" strokeDasharray="8 6" />
          <circle cx="130" cy="130" r="88" stroke="#ffeab0" strokeWidth="2" strokeDasharray="5 5" />
          <circle cx="130" cy="130" r="56" stroke="#e4ab42" strokeWidth="2.4" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 130 130)`}>
              <path
                d="M130 74 C144 46, 144 26, 130 18 C116 26, 116 46, 130 74 Z"
                stroke="#ffeba8"
                strokeWidth="1.9"
                fill="rgba(255, 224, 132, 0.14)"
              />
              <circle cx="130" cy="24" r="3" fill="#fff6d4" />
            </g>
          ))}
          <circle cx="130" cy="130" r="22" fill="rgba(255, 232, 156, 0.25)" stroke="#fff4cc" strokeWidth="2" />
        </svg>

        <div className="mt-2 text-center">
          <p className="font-display text-sm sm:text-base tracking-[0.26em] uppercase text-[#fff1c7] drop-shadow-[0_2px_10px_rgba(255,204,88,0.75)]">
            Vestidor Real
          </p>
          <p className="font-editorial italic text-xs sm:text-sm text-[#e8c684] mt-0.5">
            Armario de las Cuatro Estaciones
          </p>
        </div>
      </motion.div>

      {/* Twinkling Golden Yarn Stardust Sparks */}
      {SPARKLES.map((sp, idx) => (
        <motion.span
          key={idx}
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{ scale: [0, 1.35, 0], opacity: [0, 1, 0], rotate: [0, 90] }}
          transition={{ duration: 0.85, delay: sp.delay, ease: 'easeOut' }}
          style={{ left: sp.x, top: sp.y, width: sp.size, height: sp.size }}
          className="pointer-events-none absolute rounded-full bg-[#fff3c2] shadow-[0_0_16px_4px_rgba(255,214,102,0.92)]"
        />
      ))}
    </motion.div>
  );
};
