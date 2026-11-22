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
    aspectRatio: 0.76,
    defaultAnimation: 'pendulum',
    defaultAnimated: true,
    defaultTint: '#f3e5cf',
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
    aspectRatio: 1.24,
    defaultAnimation: 'none',
    defaultAnimated: false,
    defaultTint: '#e2b14a',
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

/** Hand-crafted Macramé Curtain SVG with turned walnut dowel, diamond knots & hanging fringes */
const MacrameCurtainArt: React.FC<{ tint?: string }> = ({ tint = '#f3e5cf' }) => (
  <svg viewBox="0 0 180 236" fill="none" className="w-full h-full drop-shadow-[0_8px_14px_rgba(68,34,14,0.28)]">
    <defs>
      <linearGradient id="macWood" x1="0" y1="0" x2="180" y2="0">
        <stop offset="0%" stopColor="#6a3a1e" />
        <stop offset="50%" stopColor="#9b5f35" />
        <stop offset="100%" stopColor="#5e3218" />
      </linearGradient>
    </defs>
    {/* Hanging twine */}
    <path d="M90 4 L28 24 M90 4 L152 24" stroke="#b58d63" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="90" cy="5" r="3.5" fill="#7c4523" stroke="#e9c896" strokeWidth="1.2" />
    {/* Turned wooden dowel */}
    <rect x="10" y="21" width="160" height="9" rx="4.5" fill="url(#macWood)" stroke="#4c2510" strokeWidth="1.2" />
    <circle cx="11" cy="25.5" r="5.5" fill="#7c4724" stroke="#4c2510" strokeWidth="1" />
    <circle cx="169" cy="25.5" r="5.5" fill="#7c4724" stroke="#4c2510" strokeWidth="1" />
    {/* Top lark's head knots */}
    {Array.from({ length: 11 }).map((_, i) => (
      <rect
        key={`k-${i}`}
        x={22 + i * 13}
        y="27"
        width="7"
        height="11"
        rx="3.5"
        fill={tint}
        stroke="#b89b79"
        strokeWidth="1"
      />
    ))}
    {/* Woven diamond lattice */}
    <g stroke={tint} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 38 L52 72 L78 38 L104 72 L130 38 L156 72" />
      <path d="M26 72 L52 38 L78 72 L104 38 L130 72 L156 38" />
      <path d="M39 72 L65 112 L91 72 L117 112 L143 72" />
      <path d="M39 112 L65 72 L91 112 L117 72 L143 112" />
      <path d="M52 112 L90 158 L128 112" />
      <path d="M65 112 L90 144 L115 112" />
    </g>
    {/* Subtle braid shadow lines */}
    <g stroke="#b79670" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round">
      <path d="M26 38 L52 72 L78 38 L104 72 L130 38 L156 72" />
      <path d="M39 72 L65 112 L91 72 L117 112 L143 72" />
      <path d="M52 112 L90 158 L128 112" />
    </g>
    {/* Wooden macramé accent beads */}
    {[
      [52, 72],
      [104, 72],
      [65, 112],
      [117, 112],
      [90, 158],
    ].map(([cx, cy], idx) => (
      <circle key={`b-${idx}`} cx={cx} cy={cy} r="5.5" fill="#b97843" stroke="#6c3b19" strokeWidth="1.2" />
    ))}
    {/* Cascading soft fringe tassels */}
    {[
      [26, 74, 152],
      [39, 114, 174],
      [52, 114, 190],
      [65, 114, 204],
      [78, 134, 218],
      [90, 162, 228],
      [102, 134, 218],
      [115, 114, 204],
      [128, 114, 190],
      [141, 114, 174],
      [154, 74, 152],
    ].map(([x, y1, y2], idx) => (
      <g key={`f-${idx}`}>
        <path d={`M${x} ${y1} Q${x + (idx % 2 === 0 ? -2 : 2)} ${(y1 + y2) / 2} ${x} ${y2}`} stroke={tint} strokeWidth="3.4" strokeLinecap="round" />
        <path d={`M${x} ${y1} Q${x + (idx % 2 === 0 ? -2 : 2)} ${(y1 + y2) / 2} ${x} ${y2}`} stroke="#bfa07c" strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round" />
      </g>
    ))}
  </svg>
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

/** Classic Vintage Cast-Iron & Gold Filigree Sewing Machine SVG */
const VintageSewingMachineArt: React.FC<{ tint?: string }> = ({ tint = '#e2b14a' }) => (
  <svg viewBox="0 0 220 176" fill="none" className="w-full h-full drop-shadow-[0_10px_14px_rgba(52,24,10,0.34)]">
    <defs>
      <linearGradient id="sewWood" x1="0" y1="130" x2="220" y2="170">
        <stop offset="0%" stopColor="#94582e" />
        <stop offset="55%" stopColor="#6c3a1a" />
        <stop offset="100%" stopColor="#46220c" />
      </linearGradient>
      <linearGradient id="sewIron" x1="20" y1="20" x2="180" y2="140">
        <stop offset="0%" stopColor="#3c3430" />
        <stop offset="45%" stopColor="#1e1917" />
        <stop offset="100%" stopColor="#0f0c0b" />
      </linearGradient>
    </defs>
    {/* Carved walnut base */}
    <rect x="14" y="138" width="192" height="26" rx="7" fill="url(#sewWood)" stroke="#3f1e0a" strokeWidth="2" />
    <rect x="24" y="145" width="172" height="10" rx="3" fill="#4f2811" opacity="0.55" />
    {/* Cast-iron machine bed */}
    <rect x="26" y="124" width="166" height="16" rx="5" fill="url(#sewIron)" stroke={tint} strokeWidth="1.2" />
    {/* Machine neck, arm & needle head */}
    <path
      d="M168 124 V60 C168 38, 152 30, 128 30 H62 C46 30, 38 40, 38 56 V88 H62 V66 C62 56, 68 52, 82 52 H124 C134 52, 138 58, 138 72 V124 Z"
      fill="url(#sewIron)"
      stroke="#493f39"
      strokeWidth="1.4"
    />
    {/* Gold filigree accents */}
    <path d="M74 41 H134" stroke={tint} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="8 4 2 4" />
    <circle cx="152" cy="90" r="10" stroke={tint} strokeWidth="1.8" />
    <circle cx="152" cy="90" r="4" fill={tint} />
    {/* Hand wheel on right */}
    <circle cx="182" cy="70" r="22" stroke="#241e1c" strokeWidth="6" />
    <circle cx="182" cy="70" r="17" stroke="#d5cfc6" strokeWidth="2.4" />
    <path d="M182 52 V88 M164 70 H200" stroke="#bab2a8" strokeWidth="2" />
    <circle cx="182" cy="70" r="5" fill={tint} />
    {/* Thread spool on top */}
    <rect x="128" y="14" width="14" height="16" rx="2" fill="#c7435f" stroke="#7c1d34" strokeWidth="1.2" />
    <rect x="125" y="12" width="20" height="3.5" rx="1.5" fill="#9c6030" />
    <rect x="125" y="28" width="20" height="3.5" rx="1.5" fill="#9c6030" />
    {/* Presser foot & needle */}
    <path d="M50 88 V122" stroke="#ded9d2" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M44 121 H58" stroke="#cfc8be" strokeWidth="2.8" strokeLinecap="round" />
    {/* Flowing golden thread */}
    <path d="M128 19 C104 14, 72 22, 50 42 V88" stroke="#f7cf68" strokeWidth="1.3" strokeDasharray="3 2" />
  </svg>
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
        return <MacrameCurtainArt tint={item.tintColor} />;
      case 'dreamcatcher':
        return <DreamcatcherArt tint={item.tintColor} />;
      case 'sewing-machine':
        return <VintageSewingMachineArt tint={item.tintColor} />;
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
