import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { WardrobeSeasonId } from '../types/crochet';
import { audioEngine } from '../utils/audioEngine';
import { WARDROBE_SEASONS, type WardrobeSeasonMeta } from '../utils/wardrobeSeasons';

export const WARDROBE_SPRITE_SRC = '/vestidor/greek-wardrobe/door-primavera.jpg';

export interface CrochetWardrobe3DProps {
  onEnterDressingRoom?: (season?: WardrobeSeasonId) => void;
  disabled?: boolean;
  className?: string;
}

/** Fluted Corinthian Gilded Column separating the 4 Greek seasonal doors */
const CorinthianColumn: React.FC<{ edge?: boolean }> = ({ edge = false }) => (
  <div
    aria-hidden="true"
    className={`relative h-full shrink-0 flex flex-col items-center justify-between select-none ${
      edge ? 'w-[22px] sm:w-[28px]' : 'w-[14px] sm:w-[18px]'
    }`}
  >
    {/* Corinthian Capital */}
    <div
      className="w-full h-5 sm:h-6 rounded-t-sm border border-[#6e4510] shadow-[0_2px_4px_rgba(0,0,0,0.65)] relative overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #fff0ba 0%, #e0ab4a 35%, #9c6518 75%, #5f3808 100%)',
      }}
    >
      <div className="absolute inset-x-0.5 top-1 h-[2px] bg-[#fff6d2]/75 rounded-full" />
      <div className="absolute inset-x-1 bottom-1 h-[2px] bg-[#502d06]/70 rounded-full" />
    </div>

    {/* Fluted Metallic Shaft */}
    <div
      className="w-[82%] flex-1 border-x border-[#5d3709]/85 relative overflow-hidden"
      style={{
        background:
          'repeating-linear-gradient(90deg, #744710 0px, #c99237 2px, #fae39c 3.5px, #b87e26 5px, #683e0c 6.5px)',
        boxShadow:
          'inset 2px 0 4px rgba(42,20,4,0.55), inset -2px 0 4px rgba(42,20,4,0.55)',
      }}
    />

    {/* Molded Attic Column Base */}
    <div
      className="w-full h-4 sm:h-5 rounded-b-sm border border-[#6e4510] shadow-[0_-1px_3px_rgba(0,0,0,0.5)] relative"
      style={{
        background:
          'linear-gradient(180deg, #6b3f0c 0%, #c99237 38%, #ffeab0 62%, #8e5a14 100%)',
      }}
    />
  </div>
);

/** Reusable Classical Greek Key (Meandro Griego) Frieze Band */
const GreekKeyFrieze: React.FC<{ className?: string }> = ({ className = 'h-3.5 sm:h-4' }) => (
  <div
    aria-hidden="true"
    className={`w-full overflow-hidden border-y border-[#ffe8a8]/55 shadow-inner ${className}`}
    style={{
      background: 'linear-gradient(180deg, #5d360a 0%, #3a2005 55%, #583208 100%)',
    }}
  >
    <svg
      viewBox="0 0 800 24"
      preserveAspectRatio="none"
      className="w-full h-full opacity-90"
      fill="none"
    >
      <defs>
        <pattern id="greek-meander-tile" width="32" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M0 20 H26 V4 H10 V14 H18 V10 H14 M26 20 H32"
            stroke="#f5ce74"
            strokeWidth="2.4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </pattern>
      </defs>
      <rect width="800" height="24" fill="url(#greek-meander-tile)" />
    </svg>
  </div>
);

interface SeasonalDoorProps {
  season: WardrobeSeasonMeta;
  hingeSide: 'left' | 'right';
  isOpening: boolean;
  isAnyOpening: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  onSelect: (season: WardrobeSeasonMeta) => void;
}

const SeasonalGreekDoor: React.FC<SeasonalDoorProps> = ({
  season,
  hingeSide,
  isOpening,
  isAnyOpening,
  disabled,
  reducedMotion,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const openAngle = hingeSide === 'left' ? -108 : 108;
  const hoverPeekAngle = hingeSide === 'left' ? -8 : 8;
  const targetAngle = isOpening ? openAngle : hovered && !disabled && !isAnyOpening ? hoverPeekAngle : 0;

  return (
    <div
      className="relative flex-1 min-w-0 h-full overflow-visible"
      style={{ perspective: '1600px' }}
    >
      {/* Recessed Luminous Seasonal Closet Interior (revealed behind swinging 3D door) */}
      <div
        className="absolute inset-0 rounded-[4px] overflow-hidden border border-[#5d3709]/80 shadow-[inset_0_8px_22px_rgba(12,6,2,0.85)]"
        style={{ background: season.interiorGradient }}
      >
        {/* Inner golden closet bar & subtle hanging crochet garment silhouettes */}
        <div className="absolute inset-x-2 top-[13%] h-[3px] rounded-full bg-gradient-to-r from-[#875818] via-[#ffe6a0] to-[#875818] shadow" />
        <svg
          viewBox="0 0 120 220"
          className="absolute inset-0 w-full h-full opacity-50 pointer-events-none"
          fill="none"
        >
          {/* Hanger hooks & classic draped silhouettes inside alcove */}
          {[32, 60, 88].map((cx, i) => (
            <g key={cx} opacity={i === 1 ? 0.85 : 0.55}>
              <path
                d={`M${cx} 28 Q${cx} 38 ${cx - 14} 46 L${cx + 14} 46 Q${cx} 38 ${cx} 28`}
                stroke="#ffe9b0"
                strokeWidth="1.5"
              />
              <path
                d={`M${cx - 16} 47 L${cx + 16} 47 L${cx + 22} 152 L${cx - 22} 152 Z`}
                fill={season.accentHex}
                fillOpacity="0.28"
                stroke="#fff0c6"
                strokeOpacity="0.4"
                strokeWidth="1"
              />
            </g>
          ))}
        </svg>

        {/* Radiant opening light bloom */}
        <motion.div
          animate={{ opacity: isOpening ? 0.95 : hovered ? 0.45 : 0.2 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 42%, ${season.glowRgba} 0%, transparent 72%)`,
          }}
        />

        {/* Interior seasonal crest label visible when door swings open */}
        <div className="absolute inset-x-1 bottom-4 text-center pointer-events-none">
          <p className="font-display text-[10px] sm:text-xs font-bold tracking-[0.14em] text-[#fff4d4] drop-shadow">
            {season.label.toUpperCase()}
          </p>
          <p className="text-[8.5px] text-[#f5dfb2]/90 italic px-1 leading-tight mt-0.5">
            Entrando al atelier…
          </p>
        </div>
      </div>

      {/* 3D Hinged Painted Greek Door Leaf */}
      <motion.button
        type="button"
        disabled={disabled || isAnyOpening}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled || isAnyOpening) return;
          onSelect(season);
        }}
        aria-label={`Puerta ${season.doorNumber}: ${season.label} — Entrar al apartado de diseño de ${season.label}`}
        title={`Puerta ${season.doorNumber} · ${season.label}: ${season.subtitle}`}
        animate={{ rotateY: reducedMotion ? 0 : targetAngle }}
        transition={{
          duration: isOpening ? 0.78 : 0.28,
          ease: isOpening ? [0.22, 1, 0.36, 1] : [0.16, 1, 0.3, 1],
        }}
        style={{
          transformOrigin: hingeSide === 'left' ? 'left center' : 'right center',
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full cursor-pointer disabled:cursor-default focus:outline-none group"
      >
        {/* FRONT FACE OF DOOR: Gilded Neoclassical Frame + Classical Greek Male Oil Painting */}
        <div
          className="absolute inset-0 backface-hidden rounded-[4px] p-[5px] sm:p-[7px] flex flex-col overflow-hidden transition-shadow duration-300"
          style={{
            background:
              'linear-gradient(145deg, #f7d683 0%, #c88d32 22%, #8e5914 52%, #e6b85c 80%, #7d4c10 100%)',
            boxShadow: hovered
              ? `inset 0 1px 2px rgba(255,248,214,0.85), inset 0 -2px 5px rgba(52,26,4,0.75), 0 0 22px ${season.glowRgba}`
              : 'inset 0 1px 2px rgba(255,248,214,0.72), inset 0 -2px 5px rgba(52,26,4,0.75), 0 4px 10px rgba(0,0,0,0.45)',
          }}
        >
          {/* Inner Carved Dark Walnut & Gold Recessed Panel */}
          <div className="relative flex-1 w-full rounded-[3px] bg-[#2a1608] p-[3px] sm:p-[4px] border border-[#5d360a] flex flex-col overflow-hidden">
            {/* Arched Classical Oil Painting Viewport */}
            <div className="relative flex-1 w-full overflow-hidden rounded-t-[46%] rounded-b-[4px] border-[2px] border-[#e7bc62]/90 shadow-[inset_0_0_16px_rgba(18,8,2,0.55)] bg-[#1f1208]">
              <img
                src={season.doorImage}
                alt={`Pintura clásica griega — ${season.label}`}
                draggable={false}
                className="w-full h-full object-cover object-top select-none transition-transform duration-500 group-hover:scale-[1.035]"
              />

              {/* Subtle warm gallery oil-painting varnish & arch shadow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 25%, rgba(255,244,210,0.08) 0%, rgba(28,14,4,0.12) 68%, rgba(16,8,2,0.42) 100%)',
                }}
              />

              {/* Hover "Entrar" translucent golden badge */}
              <div
                className={`pointer-events-none absolute inset-x-1.5 bottom-2 flex justify-center transition-all duration-200 ${
                  hovered && !isOpening ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                }`}
              >
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold text-[#fff7e2] border border-[#ffe6a8]/75 shadow-md whitespace-nowrap"
                  style={{ background: season.pillBg }}
                >
                  Abrir · {season.label}
                </span>
              </div>
            </div>

            {/* Embossed Antique-Gold Seasonal Medallion Plaque at Base of Door */}
            <div
              className="mt-1 py-1 px-1 rounded-[3px] border border-[#f5d282]/75 text-center shrink-0 relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(180deg, #4b290c 0%, #2b1405 55%, #46250a 100%)',
              }}
            >
              <div className="flex items-center justify-center gap-1 leading-none">
                <span className="font-display text-[8px] sm:text-[9px] text-[#f4c96d] opacity-85">
                  {season.roman}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#e6b355]/75" />
                <span className="font-display text-[9px] sm:text-[10.5px] font-bold tracking-[0.09em] text-[#fff1cb] truncate">
                  {season.label.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Decorative Gilded Corner Spandrel Accents above the Arch */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full border border-[#f5d07a]/70 bg-[radial-gradient(circle,#fff2c2_0%,#b87e22_100%)] shadow-xs"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-[#f5d07a]/70 bg-[radial-gradient(circle,#fff2c2_0%,#b87e22_100%)] shadow-xs"
            />
          </div>

          {/* Sculpted Antique Brass Door Pull Handle (positioned on meeting edge) */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-[52%] -translate-y-1/2 z-20 flex flex-col items-center ${
              hingeSide === 'left' ? 'right-[2px] sm:right-[3px]' : 'left-[2px] sm:left-[3px]'
            }`}
          >
            <div className="w-2 sm:w-2.5 h-7 sm:h-9 rounded-full border border-[#4f2c07] bg-gradient-to-b from-[#fff2c2] via-[#e2aa44] to-[#7c4b10] shadow-[0_2px_6px_rgba(0,0,0,0.75)] flex items-center justify-center">
              <div className="w-[3px] h-4 sm:h-5 rounded-full bg-[#fff8dc]/65" />
            </div>
          </div>

          {/* Brass Hinges on outer pivot edge */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-[14%] w-1.5 h-5 rounded-sm bg-gradient-to-b from-[#ffe8a6] via-[#c78b2e] to-[#683e0c] border border-[#4a2806]/80 ${
              hingeSide === 'left' ? 'left-0' : 'right-0'
            }`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-[16%] w-1.5 h-5 rounded-sm bg-gradient-to-b from-[#ffe8a6] via-[#c78b2e] to-[#683e0c] border border-[#4a2806]/80 ${
              hingeSide === 'left' ? 'left-0' : 'right-0'
            }`}
          />
        </div>

        {/* BACK FACE OF DOOR (visible as the door swings past 90° in 3D!) */}
        <div
          style={{ transform: 'rotateY(180deg)' }}
          className="absolute inset-0 backface-hidden rounded-[4px] p-1.5 border-2 border-[#b7802c] bg-gradient-to-b from-[#49270d] via-[#2f1707] to-[#231004] shadow-inner flex flex-col justify-between"
        >
          <div className="flex-1 rounded border border-[#d69f48]/45 bg-[radial-gradient(circle_at_50%_40%,rgba(220,168,78,0.12),transparent_70%)] flex items-center justify-center">
            <span className="font-display text-xs tracking-[0.2em] text-[#e7bd6d]/70">
              {season.roman}
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
};

export const CrochetWardrobe3D: React.FC<CrochetWardrobe3DProps> = ({
  onEnterDressingRoom,
  disabled = false,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [openingSeason, setOpeningSeason] = useState<WardrobeSeasonId | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelectDoor = (season: WardrobeSeasonMeta) => {
    if (disabled || openingSeason) return;
    setOpeningSeason(season.id);
    audioEngine.playWardrobeDoor(true);
    window.setTimeout(() => audioEngine.playToggleChime(true), 160);

    const delayMs = prefersReducedMotion ? 180 : 720;
    timerRef.current = window.setTimeout(() => {
      setOpeningSeason(null);
      onEnterDressingRoom?.(season.id);
    }, delayMs);
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between select-none ${className}`}
      style={{
        filter: 'drop-shadow(0 18px 28px rgba(8, 22, 16, 0.58))',
      }}
    >
      {/* 1. CROWNING NEOCLASSICAL GREEK PEDIMENT & LAUREL CORNICE */}
      <div className="relative w-full shrink-0 px-1 sm:px-2">
        <svg
          viewBox="0 0 1200 108"
          preserveAspectRatio="none"
          className="w-full h-[50px] sm:h-[64px] md:h-[76px] block overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="greek-gold-pediment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff3c4" />
              <stop offset="32%" stopColor="#e5b34f" />
              <stop offset="72%" stopColor="#a76f1c" />
              <stop offset="100%" stopColor="#5e3809" />
            </linearGradient>
            <linearGradient id="greek-tympanum-bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#46250b" />
              <stop offset="100%" stopColor="#261204" />
            </linearGradient>
            <radialGradient id="greek-sun-rosette" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff9dc" />
              <stop offset="45%" stopColor="#f0bd56" />
              <stop offset="100%" stopColor="#8a5510" />
            </radialGradient>
          </defs>

          {/* Outer Sculpted Triangular Pediment */}
          <path
            d="M12 96 L600 8 L1188 96 L1196 106 L4 106 Z"
            fill="url(#greek-gold-pediment)"
            stroke="#593307"
            strokeWidth="3"
          />

          {/* Recessed Dark Walnut Tympanum Inside Pediment */}
          <path
            d="M108 90 L600 24 L1092 90 Z"
            fill="url(#greek-tympanum-bg)"
            stroke="#f5d17d"
            strokeWidth="2.5"
          />

          {/* Classical Laurel Branches Flanking the Center Emblem */}
          <path
            d="M526 68 Q430 62 340 78 M522 72 Q436 82 355 83"
            stroke="#f3ca6e"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M674 68 Q770 62 860 78 M678 72 Q764 82 845 83"
            stroke="#f3ca6e"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
          />
          {[395, 435, 475, 510].map((lx) => (
            <g key={lx} fill="#f7d582">
              <ellipse cx={lx} cy={64} rx="9" ry="4" transform={`rotate(-18 ${lx} 64)`} />
              <ellipse cx={1200 - lx} cy={64} rx="9" ry="4" transform={`rotate(18 ${1200 - lx} 64)`} />
            </g>
          ))}

          {/* Central Classical Greek Medallion Crest */}
          <circle
            cx="600"
            cy="64"
            r="24"
            fill="url(#greek-sun-rosette)"
            stroke="#5c3508"
            strokeWidth="2.5"
          />
          <circle cx="600" cy="64" r="16" fill="none" stroke="#fff4c9" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="600" cy="64" r="7" fill="#fff7d6" />

          {/* Corner & Apex Palmette Finials (Acroteria) */}
          <circle cx="600" cy="9" r="9" fill="url(#greek-sun-rosette)" stroke="#5c3508" strokeWidth="2" />
          <circle cx="18" cy="94" r="7" fill="url(#greek-sun-rosette)" stroke="#5c3508" strokeWidth="2" />
          <circle cx="1182" cy="94" r="7" fill="url(#greek-sun-rosette)" stroke="#5c3508" strokeWidth="2" />
        </svg>

        {/* Inscribed Golden Entablature Cornice Bar */}
        <div
          className="w-full py-1 px-3 border-x-2 border-t border-[#5f3708] flex items-center justify-between shadow-md"
          style={{
            background:
              'linear-gradient(180deg, #f8d886 0%, #c88d31 45%, #845011 100%)',
          }}
        >
          <span className="hidden sm:inline font-display text-[8.5px] tracking-[0.22em] text-[#331a04] font-bold">
            ATELIER HELÉNICO
          </span>
          <span className="mx-auto font-display text-[10px] sm:text-xs font-extrabold tracking-[0.18em] text-[#2c1503] drop-shadow-[0_1px_0_rgba(255,244,205,0.65)]">
            ARMARIO DE LAS CUATRO ESTACIONES
          </span>
          <span className="hidden sm:inline font-display text-[8.5px] tracking-[0.22em] text-[#331a04] font-bold">
            I · II · III · IV
          </span>
        </div>

        <GreekKeyFrieze />
      </div>

      {/* 2. MAIN 4-DOOR COLONNADE BODY (Spans Full Width of Sheet!) */}
      <div
        className="relative flex-1 min-h-0 mx-1.5 sm:mx-2.5 px-1.5 sm:px-2 py-2 flex items-stretch gap-1 sm:gap-1.5 border-x-[3px] border-[#6b3f0c] shadow-[inset_0_0_24px_rgba(14,7,2,0.85)]"
        style={{
          background:
            'linear-gradient(180deg, #3c210b 0%, #261305 50%, #1d0e03 100%)',
        }}
      >
        <CorinthianColumn edge />

        {WARDROBE_SEASONS.map((season, idx) => (
          <React.Fragment key={season.id}>
            <SeasonalGreekDoor
              season={season}
              hingeSide={idx % 2 === 0 ? 'left' : 'right'}
              isOpening={openingSeason === season.id}
              isAnyOpening={openingSeason !== null}
              disabled={disabled}
              reducedMotion={Boolean(prefersReducedMotion)}
              onSelect={handleSelectDoor}
            />
            {idx < WARDROBE_SEASONS.length - 1 && (
              <CorinthianColumn edge={idx === 1} />
            )}
          </React.Fragment>
        ))}

        <CorinthianColumn edge />
      </div>

      {/* 3. SCULPTED GREEK PLINTH & GILDED BASE FEET */}
      <div className="relative w-full shrink-0 px-1 sm:px-2">
        <GreekKeyFrieze className="h-2.5 sm:h-3" />
        <div
          className="w-full h-3.5 sm:h-4 rounded-b-md border-x-2 border-b-2 border-[#593307] shadow-[0_6px_14px_rgba(0,0,0,0.65)]"
          style={{
            background:
              'linear-gradient(180deg, #f3cd74 0%, #c0852a 42%, #74440c 100%)',
          }}
        />
        {/* 5 Carved Gilded Pedestal Feet */}
        <div className="flex items-start justify-between px-3 sm:px-6 -mt-0.5">
          {[0, 1, 2, 3, 4].map((foot) => (
            <div
              key={foot}
              className="w-6 sm:w-9 h-2.5 sm:h-3 rounded-b-lg border border-[#4f2c07] shadow-[0_4px_8px_rgba(0,0,0,0.7)]"
              style={{
                background:
                  'linear-gradient(180deg, #d69c3e 0%, #9b6416 55%, #553107 100%)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
