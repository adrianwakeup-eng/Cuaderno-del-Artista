import React from 'react';
import type { YarnBallColorOption } from '../data/glbAssetManifest';

/**
 * Embossed metallic champagne-gold yarn ball icon placed beside "El Vestidor Dorado"
 */
export const GoldYarnEmblem: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    className={`${className} shrink-0 drop-shadow-[0_4px_12px_rgba(235,176,62,0.5)]`}
  >
    <defs>
      <radialGradient id="goldYarnSphere" cx="38%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#fff4c4" />
        <stop offset="35%" stopColor="#e8b44c" />
        <stop offset="75%" stopColor="#a96d1a" />
        <stop offset="100%" stopColor="#5b3408" />
      </radialGradient>
      <linearGradient id="goldStrand" x1="0" y1="0" x2="64" y2="64">
        <stop offset="0%" stopColor="#fff7d6" />
        <stop offset="50%" stopColor="#e0a93c" />
        <stop offset="100%" stopColor="#7a480b" />
      </linearGradient>
    </defs>
    {/* Loose trailing yarn tail */}
    <path
      d="M8 50C14 50 18 46 21 44M43 52C50 53 56 49 60 51"
      stroke="url(#goldStrand)"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <circle cx="32" cy="31" r="21" fill="url(#goldYarnSphere)" stroke="#ffe8a6" strokeWidth="1.2" />
    {/* Sculpted overlapping yarn bands */}
    <path
      d="M15 24C22 16 39 14 49 23M13 30C22 22 41 21 51 30M15 38C25 30 42 30 50 38"
      stroke="#5d3507"
      strokeOpacity="0.55"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M16 22C23 14 40 12 48 21M14 28C23 20 42 19 50 28M16 36C25 28 42 28 49 36"
      stroke="#fff2c2"
      strokeOpacity="0.72"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M20 15C16 25 18 40 28 50M27 12C23 24 26 40 36 51M35 12C33 24 36 39 44 48"
      stroke="#663a08"
      strokeOpacity="0.5"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M22 14C18 24 20 39 29 49M29 11C25 23 28 39 38 50"
      stroke="#ffefc0"
      strokeOpacity="0.65"
      strokeWidth="1.35"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Top scalloped champagne-gold arch contour + corner botanical vines & cream crochet lace
 */
export const LuxuryHeaderFrameDecor: React.FC = () => (
  <>
    {/* Luminous scalloped golden hairline framing the top header */}
    <svg
      viewBox="0 0 1440 92"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute top-0 inset-x-0 w-full h-[84px] z-20"
    >
      <defs>
        <linearGradient id="headerGoldLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#d9a54c" stopOpacity="0.35" />
          <stop offset="22%" stopColor="#ffe7aa" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#fff4cf" stopOpacity="0.9" />
          <stop offset="78%" stopColor="#ffe7aa" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#d9a54c" stopOpacity="0.35" />
        </linearGradient>
        <filter id="goldSoftGlow" x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M 48 0 C 70 46, 95 72, 165 74 L 315 74 C 365 74, 385 28, 425 2 L 1015 2 C 1055 28, 1075 74, 1125 74 L 1275 74 C 1345 72, 1370 46, 1392 0"
        fill="none"
        stroke="url(#headerGoldLine)"
        strokeWidth="2.2"
        filter="url(#goldSoftGlow)"
      />
    </svg>

    {/* Top-Left Botanical Olive Leaves */}
    <svg
      viewBox="0 0 140 160"
      aria-hidden="true"
      className="pointer-events-none hidden sm:block absolute top-0 left-0 w-24 lg:w-32 h-auto z-30 opacity-90 drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
    >
      <path d="M-6 -4 C 16 26, 22 62, 6 122" stroke="#364a1c" strokeWidth="3" fill="none" />
      <ellipse cx="26" cy="24" rx="22" ry="9" transform="rotate(-25 26 24)" fill="#547a27" />
      <ellipse cx="38" cy="48" rx="19" ry="8" transform="rotate(14 38 48)" fill="#6f9735" />
      <ellipse cx="18" cy="68" rx="21" ry="8.5" transform="rotate(-48 18 68)" fill="#43651e" />
      <ellipse cx="28" cy="95" rx="17" ry="7.5" transform="rotate(24 28 95)" fill="#78a03c" />
      <ellipse cx="10" cy="118" rx="15" ry="6.5" transform="rotate(-18 10 118)" fill="#4d7023" />
    </svg>

    {/* Top-Right Cream Crochet Lace & Golden Sunflower Blossom */}
    <svg
      viewBox="0 0 220 140"
      aria-hidden="true"
      className="pointer-events-none hidden md:block absolute top-0 right-0 w-44 lg:w-56 h-auto z-30 opacity-95 drop-shadow-[0_8px_16px_rgba(12,6,2,0.5)]"
    >
      {/* Cream crochet scalloped lace edge */}
      <g fill="none" stroke="#efe0c6" strokeWidth="2.6" strokeLinecap="round">
        <path d="M 10 -4 C 36 32, 86 48, 134 40 C 168 34, 194 46, 224 70" strokeWidth="3.2" />
        {[28, 56, 86, 116, 146, 174].map((x, idx) => (
          <circle
            key={`lace-loop-${idx}`}
            cx={x}
            cy={16 + idx * 4.5}
            r="12"
            stroke="#e8d4b3"
            strokeDasharray="4 3"
          />
        ))}
        {[40, 72, 102, 132, 160].map((x, idx) => (
          <circle key={`lace-dot-${idx}`} cx={x} cy={6 + idx * 3} r="5.5" stroke="#fff3db" />
        ))}
      </g>
      {/* Crochet Sunflower Bloom in corner */}
      <g transform="translate(194, 42)">
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse
            key={`petal-tr-${i}`}
            cx="0"
            cy="-20"
            rx="6"
            ry="11"
            fill={i % 2 === 0 ? '#f0b62b' : '#d99316'}
            stroke="#6f4109"
            strokeWidth="1"
            transform={`rotate(${i * 30})`}
          />
        ))}
        <circle cx="0" cy="0" r="11" fill="#4f2d11" stroke="#c88d2c" strokeWidth="2" />
        <circle cx="0" cy="0" r="5" fill="#2d1706" />
      </g>
    </svg>
  </>
);

/**
 * Bottom corner luxury crochet yarn skein + hook + sunflower (bottom-left) & lace + leaves (bottom-right)
 */
export const LuxuryFooterCornerDecor: React.FC = () => (
  <>
    {/* Bottom-Left Cream Yarn Ball, Brass Hook & Crochet Sunflower */}
    <svg
      viewBox="0 0 210 155"
      aria-hidden="true"
      className="pointer-events-none hidden xl:block absolute bottom-0 left-0 w-44 2xl:w-52 h-auto z-30 opacity-95 drop-shadow-[0_10px_20px_rgba(0,0,0,0.55)]"
    >
      <defs>
        <radialGradient id="creamBall" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff6e6" />
          <stop offset="60%" stopColor="#dbc3a0" />
          <stop offset="100%" stopColor="#8f7250" />
        </radialGradient>
        <linearGradient id="brassHook" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8a5614" />
          <stop offset="50%" stopColor="#f2c464" />
          <stop offset="100%" stopColor="#fff0be" />
        </linearGradient>
      </defs>
      {/* Cream skein */}
      <circle cx="48" cy="112" r="54" fill="url(#creamBall)" stroke="#f6e9d4" strokeWidth="1.5" />
      <g stroke="#7a5e3f" strokeOpacity="0.48" strokeWidth="3" fill="none">
        <path d="M 4 98 C 28 74, 72 72, 98 98" />
        <path d="M 2 114 C 30 92, 74 92, 100 116" />
        <path d="M 10 130 C 36 112, 72 114, 92 136" />
        <path d="M 26 62 C 20 90, 26 128, 46 156" />
        <path d="M 46 58 C 42 90, 48 128, 68 156" />
        <path d="M 68 66 C 68 94, 72 126, 86 150" />
      </g>
      {/* Golden crochet hook leaning across yarn ball */}
      <path
        d="M 46 154 L 136 52 C 139 48, 143 49, 140 54 C 138 57, 134 56, 133 54"
        stroke="url(#brassHook)"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Botanical green leaves tucked behind sunflower */}
      <ellipse cx="145" cy="138" rx="22" ry="9" transform="rotate(-12 145 138)" fill="#527826" />
      <ellipse cx="152" cy="122" rx="18" ry="8" transform="rotate(-38 152 122)" fill="#6e9634" />
      {/* Crochet sunflower appliqué */}
      <g transform="translate(122, 128)">
        {Array.from({ length: 12 }).map((_, i) => (
          <ellipse
            key={`bl-petal-${i}`}
            cx="0"
            cy="-19"
            rx="5.5"
            ry="10.5"
            fill={i % 2 === 0 ? '#f3bd2d' : '#d69214'}
            stroke="#6a3d08"
            strokeWidth="1"
            transform={`rotate(${i * 30})`}
          />
        ))}
        <circle cx="0" cy="0" r="10.5" fill="#4f2d11" stroke="#c98e2b" strokeWidth="2" />
      </g>
    </svg>

    {/* Bottom-Right Cream Crochet Lace & Botanical Leaves */}
    <svg
      viewBox="0 0 210 120"
      aria-hidden="true"
      className="pointer-events-none hidden xl:block absolute bottom-0 right-0 w-44 2xl:w-52 h-auto z-30 opacity-95 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]"
    >
      <g fill="none" stroke="#f0dfc2" strokeWidth="2.8" strokeLinecap="round">
        {[24, 52, 82, 112, 142, 172].map((x, idx) => (
          <circle
            key={`br-lace-${idx}`}
            cx={x}
            cy={116 - idx * 8}
            r="14"
            strokeDasharray="4 3"
          />
        ))}
      </g>
      <ellipse cx="176" cy="84" rx="22" ry="9" transform="rotate(-34 176 84)" fill="#527a26" />
      <ellipse cx="192" cy="58" rx="19" ry="8" transform="rotate(-62 192 58)" fill="#749c39" />
      <ellipse cx="146" cy="100" rx="18" ry="7.5" transform="rotate(-14 146 100)" fill="#456920" />
    </svg>
  </>
);

/**
 * Tall luminous champagne-gold studio arch framing the central 3D avatar
 */
export const StudioArchHalo: React.FC = () => (
  <svg
    viewBox="0 0 420 560"
    preserveAspectRatio="none"
    aria-hidden="true"
    className="pointer-events-none absolute inset-x-3 sm:inset-x-6 top-1 bottom-12 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] h-[calc(100%-3.2rem)] z-10"
  >
    <defs>
      <linearGradient id="archRimGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fff3cd" stopOpacity="0.92" />
        <stop offset="35%" stopColor="#e5b867" stopOpacity="0.72" />
        <stop offset="85%" stopColor="#d8a24a" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#d8a24a" stopOpacity="0.02" />
      </linearGradient>
      <radialGradient id="archInnerLight" cx="50%" cy="32%" r="60%">
        <stop offset="0%" stopColor="#ffe7b8" stopOpacity="0.22" />
        <stop offset="55%" stopColor="#c49464" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#3c281b" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Soft architectural niche illumination */}
    <path
      d="M 24 552 L 24 210 A 186 186 0 0 1 396 210 L 396 552 Z"
      fill="url(#archInnerLight)"
    />
    {/* Crisp champagne-gold arch contour */}
    <path
      d="M 24 548 L 24 210 A 186 186 0 0 1 396 210 L 396 548"
      fill="none"
      stroke="url(#archRimGold)"
      strokeWidth="2.2"
    />
    {/* Delicate diamond specular sparkles matching the reference arch */}
    <g fill="#fff8dd">
      <circle cx="24" cy="212" r="3" opacity="0.95" />
      <path d="M24 202 L25.4 210.6 L34 212 L25.4 213.4 L24 222 L22.6 213.4 L14 212 L22.6 210.6 Z" opacity="0.85" />
      <circle cx="396" cy="212" r="3" opacity="0.95" />
      <path d="M396 202 L397.4 210.6 L406 212 L397.4 213.4 L396 222 L394.6 213.4 L386 212 L394.6 210.6 Z" opacity="0.85" />
    </g>
  </svg>
);

/**
 * Glowing 360° curved double-arrow badge mounted visually across the front of the circular turntable
 */
export const Platform360Badge: React.FC<{
  isSpinning: boolean;
  yawDeg: number;
  onToggleSpin: () => void;
}> = ({ isSpinning, yawDeg, onToggleSpin }) => (
  <button
    type="button"
    onClick={onToggleSpin}
    title={isSpinning ? 'Pausar rotación 360°' : 'Activar rotación 360°'}
    className="group relative flex flex-col items-center justify-center px-6 py-1 cursor-pointer select-none focus:outline-none"
  >
    <span
      className={`font-display text-sm sm:text-base font-bold tracking-[0.14em] transition-colors drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)] ${
        isSpinning ? 'text-[#fff5cc]' : 'text-[#f8dfb0] group-hover:text-[#fff5cc]'
      }`}
    >
      {isSpinning ? `${yawDeg}°` : '360°'}
    </span>
    <svg
      viewBox="0 0 180 28"
      aria-hidden="true"
      className="w-32 sm:w-40 h-5 -mt-1 drop-shadow-[0_2px_8px_rgba(244,193,92,0.65)]"
    >
      <defs>
        <linearGradient id="spinGoldArrow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffe7a8" />
          <stop offset="50%" stopColor="#f3bd54" />
          <stop offset="100%" stopColor="#ffe7a8" />
        </linearGradient>
      </defs>
      <path
        d="M 22 6 C 48 22, 132 22, 158 6"
        fill="none"
        stroke="url(#spinGoldArrow)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M 28 3 L 16 7 L 26 14"
        fill="none"
        stroke="#fff3cc"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 152 3 L 164 7 L 154 14"
        fill="none"
        stroke="#fff3cc"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

/**
 * Photorealistic wound crochet yarn ball (ovillo) swatch button matching "Colores disponibles"
 */
export const YarnBallSwatch: React.FC<{
  color: YarnBallColorOption;
  selected: boolean;
  onClick: () => void;
}> = ({ color, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={color.name}
    aria-label={`Color de hilo ${color.name}`}
    className={`relative shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
      selected
        ? 'scale-110 ring-2 ring-[#ffe39c] shadow-[0_0_16px_rgba(248,200,96,0.85)]'
        : 'hover:scale-105 opacity-92 hover:opacity-100 ring-1 ring-[#d6a95a]/40'
    }`}
  >
    <svg viewBox="0 0 48 48" className="w-full h-full rounded-full overflow-visible">
      <defs>
        <radialGradient id={`yarn-grad-${color.id}`} cx="34%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.48" />
          <stop offset="38%" stopColor={color.hex} stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0e0703" stopOpacity="0.72" />
        </radialGradient>
        <clipPath id={`yarn-clip-${color.id}`}>
          <circle cx="24" cy="24" r="21" />
        </clipPath>
      </defs>
      {/* Solid yarn base */}
      <circle cx="24" cy="24" r="21" fill={color.hex} />
      {/* Tactile wound yarn strand grooves */}
      <g clipPath={`url(#yarn-clip-${color.id})`} fill="none" strokeLinecap="round">
        {/* Diagonal band 1 */}
        {[-12, -6, 0, 6, 12].map((off, i) => (
          <path
            key={`a-${i}`}
            d={`M ${2 + off} 4 C ${14 + off} 18, ${22 + off} 32, ${36 + off} 46`}
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="2.4"
          />
        ))}
        {[-11, -5, 1, 7, 13].map((off, i) => (
          <path
            key={`ah-${i}`}
            d={`M ${2 + off} 4 C ${14 + off} 18, ${22 + off} 32, ${36 + off} 46`}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.1"
          />
        ))}
        {/* Crossing yarn wrap band 2 */}
        {[-8, -2, 4, 10].map((off, i) => (
          <path
            key={`b-${i}`}
            d={`M 2 ${28 + off} C 16 ${20 + off}, 30 ${16 + off}, 46 ${22 + off}`}
            stroke="rgba(0,0,0,0.26)"
            strokeWidth="2.3"
          />
        ))}
        {[-7, -1, 5, 11].map((off, i) => (
          <path
            key={`bh-${i}`}
            d={`M 2 ${27 + off} C 16 ${19 + off}, 30 ${15 + off}, 46 ${21 + off}`}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />
        ))}
      </g>
      {/* 3D spherical lighting overlay */}
      <circle cx="24" cy="24" r="21" fill={`url(#yarn-grad-${color.id})`} />
      <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,236,192,0.35)" strokeWidth="1" />
    </svg>
  </button>
);
