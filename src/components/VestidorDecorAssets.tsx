import React from 'react';
import type {
  VestidorDecorAnimation,
  VestidorDecorElement,
  VestidorDecorKind,
} from '../types/crochet';

export interface DecorTemplateDefinition {
  kind: VestidorDecorKind;
  label: string;
  categoryLabel: string;
  defaultWidthPct: number;
  aspectRatio: number;
  defaultAnimation: VestidorDecorAnimation;
  defaultAnimated: boolean;
  defaultTint?: string;
}

export const DECOR_TEMPLATES: DecorTemplateDefinition[] = [
  {
    kind: 'macrame-curtain',
    label: 'Cortina de macramé',
    categoryLabel: 'Macramé',
    defaultWidthPct: 24,
    aspectRatio: 0.44,
    defaultAnimation: 'pendulum',
    defaultAnimated: true,
    defaultTint: '#d8b56a',
  },
  {
    kind: 'dreamcatcher',
    label: 'Atrapasueños',
    categoryLabel: 'Macramé',
    defaultWidthPct: 18,
    aspectRatio: 0.56,
    defaultAnimation: 'pendulum',
    defaultAnimated: true,
    defaultTint: '#e9c89c',
  },
  {
    kind: 'crochet-flowers',
    label: 'Flores de crochet',
    categoryLabel: 'Flores',
    defaultWidthPct: 26,
    aspectRatio: 1.48,
    defaultAnimation: 'sway',
    defaultAnimated: true,
  },
  {
    kind: 'crochet-sunflower',
    label: 'Girasol de crochet',
    categoryLabel: 'Flores',
    defaultWidthPct: 20,
    aspectRatio: 1.25,
    defaultAnimation: 'nod',
    defaultAnimated: true,
  },
  {
    kind: 'yarn-basket',
    label: 'Cesta de ovillos',
    categoryLabel: 'Lana',
    defaultWidthPct: 25,
    aspectRatio: 1.15,
    defaultAnimation: 'basket',
    defaultAnimated: false,
  },
  {
    kind: 'yarn-mini-basket',
    label: 'Cestita de lana',
    categoryLabel: 'Lana',
    defaultWidthPct: 17,
    aspectRatio: 1.05,
    defaultAnimation: 'basket',
    defaultAnimated: true,
  },
  {
    kind: 'yarn-ball',
    label: 'Ovillo de lana',
    categoryLabel: 'Lana',
    defaultWidthPct: 13,
    aspectRatio: 1.0,
    defaultAnimation: 'float',
    defaultAnimated: false,
    defaultTint: '#f2e2c6',
  },
  {
    kind: 'sewing-machine',
    label: 'Máquina de coser',
    categoryLabel: 'Taller',
    defaultWidthPct: 26,
    aspectRatio: 1.05,
    defaultAnimation: 'none',
    defaultAnimated: true,
    defaultTint: '#d8b56a',
  },
  {
    kind: 'potted-plant',
    label: 'Planta en cesta',
    categoryLabel: 'Estudio',
    defaultWidthPct: 22,
    aspectRatio: 0.78,
    defaultAnimation: 'sway',
    defaultAnimated: true,
  },
  {
    kind: 'crochet-rug',
    label: 'Alfombra de crochet',
    categoryLabel: 'Estudio',
    defaultWidthPct: 36,
    aspectRatio: 2.32,
    defaultAnimation: 'none',
    defaultAnimated: false,
  },
  {
    kind: 'crochet-teddy',
    label: 'Osito amigurumi',
    categoryLabel: 'Adornos',
    defaultWidthPct: 17,
    aspectRatio: 0.78,
    defaultAnimation: 'nod',
    defaultAnimated: true,
  },
];

let decorIdCounter = 1;

export function createUniqueDecorId(prefix = 'decor'): string {
  decorIdCounter += 1;
  return `${prefix}-${Date.now()}-${decorIdCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Default initial stage decoration matching the approved El Vestidor Dorado composition
 * (the right-side woven floor yarn basket), so the initial visual stays 100% identical
 * while immediately offering a real selectable/duplicable studio element in Edit Mode.
 */
export function createDefaultStageDecorations(): VestidorDecorElement[] {
  return [
    {
      id: 'decor-origin-floor-basket',
      kind: 'yarn-basket',
      label: 'Cesta de ovillos',
      xPct: 84,
      yPct: 75,
      widthPct: 27,
      zIndex: 2,
      rotationDeg: 0,
      flipX: false,
      animated: false,
      animationKind: 'basket',
      opacity: 1,
      aspectRatio: 1.15,
    },
  ];
}

export function getDecorAnimationClass(
  animationKind: VestidorDecorAnimation,
  animated: boolean,
  reducedMotion: boolean
): string {
  if (!animated || reducedMotion || animationKind === 'none') return '';
  switch (animationKind) {
    case 'pendulum':
      return 'animate-decor-pendulum';
    case 'sway':
      return 'animate-crochet-flower';
    case 'nod':
      return 'animate-crochet-sunflower';
    case 'basket':
      return 'animate-crochet-basket';
    case 'float':
      return 'animate-decor-float';
    default:
      return '';
  }
}

/**
 * Photorealistic Golden-Champagne Macramé Curtain with real knots, wooden beads,
 * woven flowers, swaying fringes & independently oscillating suspended dreamcatcher.
 */
const MacrameCurtainArt: React.FC<{
  tint?: string;
  animated?: boolean;
  reducedMotion?: boolean;
  mirrored?: boolean;
}> = ({ animated = true, reducedMotion = false, mirrored = false }) => (
  <div
    className={`relative w-full h-full select-none ${
      !animated || reducedMotion ? 'atelier-sewing-paused' : ''
    }`}
  >
    <div className="relative w-full h-full atelier-anim-curtain">
      <img
        src="/vestidor/artisan/macrame-curtain-gold.webp"
        alt="Cortina dorada artesanal de macramé"
        draggable={false}
        className={`w-full h-full object-contain object-top drop-shadow-[0_10px_18px_rgba(72,40,16,0.28)] ${
          mirrored ? '-scale-x-100' : ''
        }`}
      />
      {/* Independently oscillating hanging dreamcatcher accent */}
      <div
        className={`pointer-events-none absolute top-[45%] ${
          mirrored ? 'left-[7%]' : 'right-[7%]'
        } w-[34%] max-w-[66px] atelier-anim-dreamcatcher`}
        style={{ animationDelay: mirrored ? '0.95s' : '0.15s' }}
      >
        <svg
          viewBox="0 0 90 190"
          className="w-full h-auto drop-shadow-[0_5px_8px_rgba(74,42,14,0.32)]"
          fill="none"
          aria-hidden="true"
        >
          <line x1="45" y1="0" x2="45" y2="34" stroke="#c89a4a" strokeWidth="2.4" strokeDasharray="3 1.5" />
          <circle cx="45" cy="18" r="4.5" fill="#8b5a34" stroke="#4f2d14" strokeWidth="1" />
          <circle cx="45" cy="62" r="25" stroke="#b9863c" strokeWidth="4" />
          <circle cx="45" cy="62" r="25" stroke="#f5dfa6" strokeWidth="1.2" strokeDasharray="4 3" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1="45"
                y1="62"
                x2={45 + Math.cos(rad) * 23}
                y2={62 + Math.sin(rad) * 23}
                stroke="#f4e2bd"
                strokeWidth="1.15"
                strokeOpacity="0.9"
              />
            );
          })}
          <polygon
            points="45,42 59,48 65,62 59,76 45,82 31,76 25,62 31,48"
            stroke="#e9c882"
            strokeWidth="1.1"
            fill="none"
          />
          <circle cx="45" cy="62" r="5" fill="#d8a8af" stroke="#8f545e" strokeWidth="0.9" />
          <circle cx="45" cy="62" r="2.1" fill="#fff8ed" />
          <g className="atelier-anim-fringe" style={{ animationDelay: mirrored ? '0.6s' : '0s' }}>
            {[
              { x: 27, len: 66, beadY: 102 },
              { x: 36, len: 80, beadY: 112 },
              { x: 45, len: 92, beadY: 120 },
              { x: 54, len: 80, beadY: 112 },
              { x: 63, len: 66, beadY: 102 },
            ].map((t, i) => (
              <g key={i}>
                <line
                  x1={t.x}
                  y1={84 + (i === 2 ? 4 : i === 1 || i === 3 ? 2 : -1)}
                  x2={t.x}
                  y2={84 + t.len}
                  stroke={i % 2 === 0 ? '#d8b56a' : '#f5e8d3'}
                  strokeWidth="2.1"
                  strokeLinecap="round"
                />
                <circle cx={t.x} cy={t.beadY} r="3.1" fill="#7c4e2a" stroke="#452710" strokeWidth="0.8" />
                <path
                  d={`M ${t.x} ${82 + t.len - 10} L ${t.x - 3.8} ${86 + t.len} M ${t.x} ${82 + t.len - 10} L ${t.x + 3.8} ${86 + t.len}`}
                  stroke="#c6933d"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  </div>
);

/**
 * Framing Golden Macramé Curtain Pair for El Vestidor Dorado stage
 * Frames both edges gracefully without ever obstructing the central photographic model.
 */
export const StageMacrameCurtains: React.FC<{
  isOpen: boolean;
  reducedMotion: boolean;
}> = ({ isOpen, reducedMotion }) => (
  <>
    <div
      aria-hidden="true"
      className="pointer-events-none select-none hidden sm:block absolute left-0 top-0 h-[82%] w-[26%] max-w-[186px] min-w-[92px] z-[12] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        transform: isOpen ? 'translateX(-10%)' : 'translateX(10%) scaleX(1.12)',
        transformOrigin: 'top left',
      }}
    >
      <MacrameCurtainArt animated={!reducedMotion} reducedMotion={reducedMotion} mirrored={false} />
    </div>
    <div
      aria-hidden="true"
      className="pointer-events-none select-none hidden sm:block absolute right-0 top-0 h-[82%] w-[26%] max-w-[186px] min-w-[92px] z-[12] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{
        transform: isOpen ? 'translateX(10%)' : 'translateX(-10%) scaleX(1.12)',
        transformOrigin: 'top right',
      }}
    >
      <MacrameCurtainArt animated={!reducedMotion} reducedMotion={reducedMotion} mirrored={true} />
    </div>
  </>
);

/** Hand-crafted Crochet Mandala Dreamcatcher SVG with wooden hoop, beads & hanging woven feathers */
const DreamcatcherArt: React.FC<{ tint?: string }> = ({ tint = '#f4e3c7' }) => (
  <svg viewBox="0 0 150 268" fill="none" className="w-full h-full drop-shadow-[0_8px_14px_rgba(68,34,14,0.28)]">
    {/* Top suspension loop */}
    <path d="M75 4 V26" stroke="#b98a5b" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="75" cy="7" r="3.5" fill="#8b5128" stroke="#f2d6a6" strokeWidth="1.2" />
    {/* Outer wrapped crochet hoop */}
    <circle cx="75" cy="82" r="54" stroke="#9e6234" strokeWidth="7" />
    <circle cx="75" cy="82" r="54" stroke="#dfba85" strokeWidth="2.2" strokeDasharray="4 4" />
    {/* Intricate crochet web inside hoop */}
    <g stroke={tint} strokeWidth="2" strokeLinejoin="round">
      <polygon points="75,30 112,46 127,82 112,118 75,134 38,118 23,82 38,46" />
      <polygon points="75,44 102,55 113,82 102,109 75,120 48,109 37,82 48,55" />
      <polygon points="75,58 92,65 99,82 92,99 75,106 58,99 51,82 58,65" />
      <circle cx="75" cy="82" r="10" fill="#e5b35c" stroke="#7c4720" strokeWidth="1.5" />
    </g>
    {/* Hanging braided cords & feathers */}
    {[
      { x: 40, startY: 124, endY: 224, featherColor: '#e9c89d' },
      { x: 75, startY: 136, endY: 256, featherColor: '#d98a93' },
      { x: 110, startY: 124, endY: 224, featherColor: '#e9c89d' },
    ].map((strand, i) => (
      <g key={`st-${i}`}>
        <path d={`M${strand.x} ${strand.startY} V${strand.endY - 38}`} stroke={tint} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx={strand.x} cy={strand.startY + 18} r="4.5" fill="#9c5b2d" stroke="#f5dbb0" strokeWidth="1" />
        <circle cx={strand.x} cy={strand.endY - 40} r="4" fill="#d8a245" stroke="#6d3a15" strokeWidth="1" />
        {/* Woven macramé feather */}
        <path
          d={`M${strand.x} ${strand.endY - 36} C${strand.x - 14} ${strand.endY - 22}, ${strand.x - 13} ${strand.endY - 6}, ${strand.x} ${strand.endY} C${strand.x + 13} ${strand.endY - 6}, ${strand.x + 14} ${strand.endY - 22}, ${strand.x} ${strand.endY - 36} Z`}
          fill={strand.featherColor}
          stroke="#9d6d48"
          strokeWidth="1.2"
        />
        <path d={`M${strand.x} ${strand.endY - 34} V${strand.endY - 2}`} stroke="#fff4df" strokeWidth="1.3" />
      </g>
    ))}
  </svg>
);

/**
 * Photorealistic Vintage Ivory-Cream & Gold Sewing Machine on Carved Walnut Table
 * with animated spoked flywheel, reciprocating needle, gliding crochet lace & golden thread.
 */
const VintageSewingMachineArt: React.FC<{
  tint?: string;
  animated?: boolean;
  reducedMotion?: boolean;
  onTogglePause?: () => void;
  showInlineControl?: boolean;
}> = ({
  animated = true,
  reducedMotion = false,
  onTogglePause,
  showInlineControl = false,
}) => {
  const isPaused = !animated || reducedMotion;
  return (
    <div className={`relative w-full h-full select-none ${isPaused ? 'atelier-sewing-paused' : ''}`}>
      {/* Grounded contact shadow beneath carved walnut table legs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[10%] right-[10%] bottom-[-2%] h-[11%] rounded-full bg-[#4a2b14]/34 blur-[6px]"
      />
      <img
        src="/vestidor/artisan/sewing-machine-vintage.webp"
        alt="Máquina de coser vintage crema y oro sobre mesa de madera de nogal"
        draggable={false}
        className="relative z-10 w-full h-full object-contain drop-shadow-[0_10px_16px_rgba(62,34,14,0.28)]"
      />
      {/* Precision-aligned animated mechanical SVG overlay (wheel, needle, lace feed, golden thread) */}
      <svg
        viewBox="0 0 862 820"
        className="pointer-events-none absolute inset-0 z-20 w-full h-full"
        fill="none"
        aria-hidden="true"
      >
        <g className="atelier-anim-thread">
          <path
            d="M 556 122 L 246 168 L 210 198 L 218 408"
            stroke="#f5cf74"
            strokeWidth="2.4"
            strokeOpacity="0.9"
            strokeLinecap="round"
          />
          <circle cx="246" cy="168" r="3" fill="#fff4cf" />
        </g>
        <g className="atelier-anim-needle">
          <rect x="218" y="346" width="5.5" height="62" rx="2" fill="#d9d5cc" stroke="#6c6258" strokeWidth="1.2" />
          <line x1="220.8" y1="406" x2="220.8" y2="444" stroke="#f7f4ee" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="220.8" cy="436" r="2.2" fill="#ffe49c" />
        </g>
        <g className="atelier-anim-fabric">
          <path
            d="M 168 456 Q 212 446 258 454 Q 302 462 344 452"
            stroke="#fff7e6"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />
          <path
            d="M 182 465 Q 222 458 262 465"
            stroke="#d8b56a"
            strokeWidth="1.8"
            strokeDasharray="4 4"
            strokeOpacity="0.7"
          />
        </g>
        <g transform="translate(744, 240)">
          <g className="atelier-anim-wheel">
            <g transform="scale(0.54, 1)">
              <circle cx="0" cy="0" r="88" stroke="#e9cb85" strokeWidth="5.5" strokeOpacity="0.68" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="0"
                  x2={Math.cos((deg * Math.PI) / 180) * 82}
                  y2={Math.sin((deg * Math.PI) / 180) * 82}
                  stroke="#f4dea4"
                  strokeWidth="6"
                  strokeOpacity="0.62"
                  strokeLinecap="round"
                />
              ))}
              <circle cx="0" cy="0" r="14" fill="#d8b56a" fillOpacity="0.8" stroke="#6c4516" strokeWidth="2.5" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

/**
 * Background-depth Animated Vintage Sewing Machine seated naturally on the atelier floor
 */
export const StageVintageSewingMachine: React.FC<{
  paused: boolean;
  reducedMotion: boolean;
  onTogglePause?: () => void;
}> = ({ paused, reducedMotion }) => (
  <div className="hidden md:block absolute left-[2%] xl:left-[3.5%] bottom-[17.5%] w-[124px] lg:w-[144px] xl:w-[164px] aspect-[1.05/1] z-[11] pointer-events-none opacity-95">
    <VintageSewingMachineArt
      animated={!paused}
      reducedMotion={reducedMotion}
    />
  </div>
);

/** Warm Botanical Broadleaf Plant in Woven Wicker Basket SVG */
const PottedPlantArt: React.FC = () => (
  <svg viewBox="0 0 170 218" fill="none" className="w-full h-full drop-shadow-[0_10px_14px_rgba(58,32,14,0.28)]">
    {/* Foliage leaves */}
    <path d="M85 138 C82 96, 56 68, 22 66 C28 96, 54 114, 85 128 Z" fill="#5b8832" stroke="#3c5e1e" strokeWidth="1.4" />
    <path d="M85 138 C88 94, 118 68, 148 70 C140 102, 114 116, 85 128 Z" fill="#6d9c3d" stroke="#3c5e1e" strokeWidth="1.4" />
    <path d="M85 132 C76 80, 56 42, 46 18 C72 32, 92 66, 89 124 Z" fill="#7cad46" stroke="#456b22" strokeWidth="1.4" />
    <path d="M86 132 C98 76, 122 38, 134 20 C106 32, 84 70, 84 126 Z" fill="#4f7b2a" stroke="#325218" strokeWidth="1.4" />
    <path d="M85 134 C83 78, 84 42, 88 12 C102 36, 104 78, 88 130 Z" fill="#89ba51" stroke="#4c7426" strokeWidth="1.4" />
    {/* Leaf center veins */}
    <g stroke="#b7db81" strokeOpacity="0.6" strokeWidth="1.3" strokeLinecap="round">
      <path d="M85 126 Q55 96 29 72" />
      <path d="M85 126 Q116 96 141 75" />
      <path d="M86 122 Q68 68 51 26" />
      <path d="M86 124 Q88 64 88 22" />
    </g>
    {/* Woven wicker basket */}
    <path
      d="M42 134 H128 L120 202 C119 208, 112 212, 102 212 H68 C58 212, 51 208, 50 202 Z"
      fill="#ba8248"
      stroke="#6d431e"
      strokeWidth="2"
    />
    {/* Wicker braid ribs */}
    {[146, 158, 170, 182, 194, 205].map((y, idx) => (
      <path
        key={`w-${idx}`}
        d={`M${44 + idx * 1.1} ${y} Q85 ${y + 5} ${126 - idx * 1.1} ${y}`}
        stroke="#7b4b22"
        strokeWidth="2"
        strokeDasharray="7 4"
      />
    ))}
    <ellipse cx="85" cy="134" rx="43" ry="8" fill="#8c5a2c" stroke="#5f3716" strokeWidth="1.8" />
  </svg>
);

export const VestidorDecorVisual: React.FC<{
  item: VestidorDecorElement;
  reducedMotion: boolean;
}> = ({ item, reducedMotion }) => {
  const animClass = getDecorAnimationClass(item.animationKind, item.animated, reducedMotion);

  const renderContent = () => {
    switch (item.kind) {
      case 'macrame-curtain':
        return (
          <MacrameCurtainArt
            tint={item.tintColor}
            animated={item.animated}
            reducedMotion={reducedMotion}
          />
        );
      case 'dreamcatcher':
        return <DreamcatcherArt tint={item.tintColor} />;
      case 'sewing-machine':
        return (
          <VintageSewingMachineArt
            tint={item.tintColor}
            animated={item.animated}
            reducedMotion={reducedMotion}
          />
        );
      case 'potted-plant':
        return <PottedPlantArt />;
      case 'crochet-flowers':
        return (
          <img
            src="/vestidor/artisan/flowers-top.png"
            alt={item.label}
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_8px_14px_rgba(62,24,14,0.32)]"
          />
        );
      case 'crochet-sunflower':
        return (
          <img
            src="/vestidor/artisan/crochet-sunflower.png"
            alt={item.label}
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_8px_12px_rgba(58,28,10,0.34)]"
          />
        );
      case 'yarn-basket':
        return (
          <img
            src="/vestidor/artisan/floor-yarn-basket.png"
            alt={item.label}
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_10px_16px_rgba(64,32,12,0.32)]"
          />
        );
      case 'yarn-mini-basket':
        return (
          <img
            src="/vestidor/artisan/top-basket.png"
            alt={item.label}
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_8px_14px_rgba(64,32,12,0.34)]"
          />
        );
      case 'yarn-ball':
        return (
          <div className="relative w-full h-full rounded-full overflow-hidden drop-shadow-[0_6px_12px_rgba(64,32,12,0.32)]">
            {item.tintColor && item.tintColor !== '#f2e2c6' ? (
              <>
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: item.tintColor }}
                />
                <img
                  src="/vestidor/artisan/yarn-ball-gray.png"
                  alt={item.label}
                  draggable={false}
                  className="relative w-full h-full object-cover mix-blend-multiply"
                />
                <img
                  src="/vestidor/artisan/yarn-ball-gray.png"
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="pointer-events-none absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-20"
                />
              </>
            ) : (
              <img
                src="/vestidor/artisan/yarn-ball-base.png"
                alt={item.label}
                draggable={false}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        );
      case 'crochet-rug':
        return (
          <img
            src="/vestidor/artisan/crochet-rug.png"
            alt={item.label}
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_8px_12px_rgba(68,34,14,0.28)]"
          />
        );
      case 'crochet-teddy':
        return (
          <img
            src="/vestidor/artisan/crochet-teddy.png"
            alt={item.label}
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_8px_14px_rgba(58,26,12,0.35)]"
          />
        );
      case 'custom-image':
      default:
        return item.customDataUrl ? (
          <img
            src={item.customDataUrl}
            alt={item.label}
            draggable={false}
            className="w-full h-full object-contain drop-shadow-[0_8px_14px_rgba(64,32,12,0.28)]"
          />
        ) : null;
    }
  };

  return (
    <div
      className={`w-full h-full ${animClass}`}
      style={{
        opacity: item.opacity ?? 1,
      }}
    >
      <div
        className="w-full h-full"
        style={{
          transform: item.flipX ? 'scaleX(-1)' : undefined,
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
};
