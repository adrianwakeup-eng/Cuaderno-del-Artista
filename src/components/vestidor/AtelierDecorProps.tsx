import React from 'react';
import { Pause, Play } from 'lucide-react';

/* ============================================================================
   LUXURY HANDCRAFTED ATELIER PROPS & ANIMATED STAGE ELEMENTS
   - Photographic macramé curtains with oscillating dreamcatchers & swaying fringes
   - Photographic vintage cream-and-gold sewing machine with animated wheel, needle,
     fabric feed, vibrating thread, and pause/play switch
   - 3D tactile yarn-ball swatches (ovillos) for the color selector
   - Handcrafted crochet flowers, wicker yarn basket, potted wicker plant,
     knitted amigurumi teddy bear, and wooden-header accents
============================================================================ */

export interface AtelierYarnColor {
  id: string;
  name: string;
  hex: string;
  light: string;
  dark: string;
}

export const ATELIER_YARN_COLORS: AtelierYarnColor[] = [
  { id: 'crema', name: 'Crema Marfil', hex: '#F3DFC1', light: '#FFF9EC', dark: '#B69367' },
  { id: 'bosque', name: 'Verde Bosque', hex: '#2D6A35', light: '#66A86E', dark: '#163B1B' },
  { id: 'girasol', name: 'Oro Girasol', hex: '#F1B92B', light: '#FFE488', dark: '#9B6B0C' },
  { id: 'cobalto', name: 'Azul Cobalto', hex: '#2A63C9', light: '#6FA1F5', dark: '#153470' },
  { id: 'terracota', name: 'Terracota Canela', hex: '#C66B2B', light: '#EB9F64', dark: '#733811' },
  { id: 'burdeos', name: 'Rosa Burdeos', hex: '#A8264A', light: '#DF6586', dark: '#5A0E24' },
  { id: 'lavanda', name: 'Gris Lavanda', hex: '#88889E', light: '#C0C0D4', dark: '#4B4B5F' },
  { id: 'salvia', name: 'Verde Salvia', hex: '#8FA68A', light: '#C0D3BB', dark: '#4D6149' },
  { id: 'rosa', name: 'Rosa Empolvado', hex: '#D8A8AF', light: '#F4D4D9', dark: '#8C5962' },
  { id: 'nogal', name: 'Marrón Nogal', hex: '#76543D', light: '#A88267', dark: '#3E2819' },
];

/**
 * Photorealistic 3D multi-strand wound cotton yarn ball (ovillo) swatch
 */
export const ArtisanYarnBallSwatch: React.FC<{
  color: AtelierYarnColor;
  selected?: boolean;
  size?: number;
  onClick?: () => void;
  title?: string;
}> = ({ color, selected = false, size = 44, onClick, title }) => {
  const uid = `ovillo-${color.id}-${size}`;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? `${color.name} (${color.hex})`}
      aria-label={`Color de hilo ${color.name}`}
      aria-pressed={selected}
      className={`group relative shrink-0 rounded-full p-0.5 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a86c1c] ${
        selected
          ? 'scale-110 ring-[3px] ring-[#c98b24] shadow-[0_6px_14px_rgba(92,52,12,0.42)]'
          : 'hover:scale-108 hover:-translate-y-0.5'
      }`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_4px_5px_rgba(46,24,8,0.42)] atelier-anim-yarn"
        style={{ animationDuration: '7.5s' }}
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${uid}-body`} cx="34%" cy="28%" r="72%">
            <stop offset="0%" stopColor={color.light} />
            <stop offset="44%" stopColor={color.hex} />
            <stop offset="100%" stopColor={color.dark} />
          </radialGradient>
          <clipPath id={`${uid}-clip`}>
            <circle cx="50" cy="50" r="44" />
          </clipPath>
        </defs>

        <circle
          cx="50"
          cy="50"
          r="44"
          fill={`url(#${uid}-body)`}
          stroke={color.dark}
          strokeWidth="2.5"
        />

        {/* Realistic layered twisted cotton yarn wraps */}
        <g clipPath={`url(#${uid}-clip)`}>
          {[-26, -17, -8, 1, 10, 19, 28].map((offset, idx) => (
            <path
              key={`a-${idx}`}
              d={`M ${-8 + offset} 18 C ${26 + offset} 44, ${56 + offset} 58, ${98 + offset} 22`}
              stroke={idx % 2 === 0 ? color.dark : color.light}
              strokeOpacity={idx % 2 === 0 ? 0.5 : 0.62}
              strokeWidth={idx % 2 === 0 ? 3.2 : 2.3}
              strokeLinecap="round"
            />
          ))}
          {[-24, -15, -6, 3, 12, 21, 30].map((offset, idx) => (
            <path
              key={`b-${idx}`}
              d={`M ${14 + offset} -6 C ${44 + offset} 34, ${42 + offset} 66, ${12 + offset} 106`}
              stroke={idx % 2 === 0 ? color.light : color.dark}
              strokeOpacity={idx % 2 === 0 ? 0.56 : 0.48}
              strokeWidth={idx % 2 === 0 ? 2.4 : 3}
              strokeLinecap="round"
            />
          ))}
          {[-18, -8, 2, 12, 22].map((offset, idx) => (
            <path
              key={`c-${idx}`}
              d={`M ${88 + offset} 8 C ${58 + offset} 38, ${54 + offset} 72, ${82 + offset} 104`}
              stroke={idx % 2 === 0 ? color.dark : color.light}
              strokeOpacity={0.42}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
          {/* Subtle top specular wool sheen */}
          <ellipse cx="36" cy="28" rx="18" ry="11" fill="#ffffff" fillOpacity="0.18" transform="rotate(-24 36 28)" />
        </g>

        <circle cx="50" cy="50" r="43" stroke="rgba(255,248,232,0.34)" strokeWidth="1.4" />
      </svg>

      {selected && (
        <span className="pointer-events-none absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#fff8ed] border-2 border-[#a86c1c] flex items-center justify-center shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a86c1c]" />
        </span>
      )}
    </button>
  );
};

/**
 * Golden Macramé Curtain Wing with Photographic Knots, Wooden Beads,
 * Woven Flowers, Swaying Fringes & Suspended Oscillating Dreamcatcher
 */
export const MacrameCurtainWing: React.FC<{
  side: 'left' | 'right';
  isOpen: boolean;
  className?: string;
}> = ({ side, isOpen, className = '' }) => {
  const isRight = side === 'right';
  // Open: frames outer edges generously without ever covering model; Closed: drapes softly inward while still respecting model clarity
  const shiftX = isOpen
    ? isRight
      ? 'translateX(6%)'
      : 'translateX(-6%)'
    : isRight
      ? 'translateX(-14%) scaleX(1.12)'
      : 'translateX(14%) scaleX(1.12)';

  return (
    <div
      className={`pointer-events-none select-none transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
      style={{
        transform: shiftX,
        transformOrigin: isRight ? 'top right' : 'top left',
      }}
    >
      <div
        className="relative w-full h-full atelier-anim-curtain"
        style={{ animationDelay: isRight ? '1.3s' : '0s' }}
      >
        {/* Real photographic golden-champagne macramé curtain panel */}
        <img
          src="/assets/vestidor/macrame-curtain.webp"
          alt={isRight ? 'Cortina derecha dorada de macramé' : 'Cortina izquierda dorada de macramé'}
          draggable={false}
          className={`w-full h-full object-contain object-top drop-shadow-[0_10px_18px_rgba(74,44,18,0.28)] ${
            isRight ? '-scale-x-100' : ''
          }`}
        />

        {/* Independently animated hanging wooden-hoop dreamcatcher accent */}
        <div
          className={`absolute top-[46%] ${isRight ? 'left-[8%]' : 'right-[8%]'} w-[34%] max-w-[68px] atelier-anim-dreamcatcher`}
          style={{ animationDelay: isRight ? '0.9s' : '0.2s' }}
        >
          <svg
            viewBox="0 0 90 190"
            className="w-full h-auto drop-shadow-[0_5px_8px_rgba(78,46,16,0.34)]"
            fill="none"
            aria-hidden="true"
          >
            {/* Hanging braided champagne cord + wooden bead */}
            <line x1="45" y1="0" x2="45" y2="34" stroke="#c89a4a" strokeWidth="2.4" strokeDasharray="3 1.5" />
            <circle cx="45" cy="18" r="4.5" fill="#8b5a34" stroke="#4f2d14" strokeWidth="1" />
            <circle cx="43.8" cy="16.8" r="1.3" fill="#e6be92" />

            {/* Outer decorative wooden & gold-wrapped hoop */}
            <circle cx="45" cy="62" r="26" stroke="#b9863c" strokeWidth="4.2" />
            <circle cx="45" cy="62" r="26" stroke="#f5dfa6" strokeWidth="1.2" strokeDasharray="4 3" />

            {/* Intricate laced crochet web inside dreamcatcher */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const x2 = 45 + Math.cos(rad) * 24;
              const y2 = 62 + Math.sin(rad) * 24;
              return (
                <line
                  key={deg}
                  x1="45"
                  y1="62"
                  x2={x2}
                  y2={y2}
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
            <polygon
              points="45,50 54,54 57,62 54,70 45,74 36,70 33,62 36,54"
              stroke="#fff4d6"
              strokeWidth="1"
              fill="none"
            />
            {/* Center tiny crochet rose & pearl */}
            <circle cx="45" cy="62" r="5" fill="#d8a8af" stroke="#8f545e" strokeWidth="0.9" />
            <circle cx="45" cy="62" r="2.2" fill="#fff8ed" />

            {/* Individual swaying golden fringes with wooden beads */}
            <g className="atelier-anim-fringe" style={{ animationDelay: isRight ? '0.6s' : '0s' }}>
              {[
                { x: 26, len: 68, beadY: 102 },
                { x: 35, len: 82, beadY: 112 },
                { x: 45, len: 94, beadY: 120 },
                { x: 55, len: 82, beadY: 112 },
                { x: 64, len: 68, beadY: 102 },
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
                  <circle cx={t.x} cy={t.beadY} r="3.2" fill="#7c4e2a" stroke="#452710" strokeWidth="0.8" />
                  {/* Tassel bundle */}
                  <path
                    d={`M ${t.x} ${82 + t.len - 10} L ${t.x - 4} ${86 + t.len} M ${t.x} ${82 + t.len - 10} L ${t.x + 4} ${86 + t.len}`}
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
};

/**
 * Vintage Cream & Gold Animated Sewing Machine on Carved Walnut Table
 * Integrated naturally into the atelier background depth, with pause/play control.
 */
export const VintageSewingMachine: React.FC<{
  paused: boolean;
  onTogglePause?: () => void;
  showInlineControl?: boolean;
  className?: string;
}> = ({ paused, onTogglePause, showInlineControl = true, className = '' }) => {
  return (
    <div
      className={`relative select-none ${paused ? 'atelier-paused' : ''} ${className}`}
      title={paused ? 'Máquina de coser en pausa — clic para activar' : 'Máquina de coser trabajando — clic para pausar'}
    >
      {/* Natural grounded floor shadow under walnut console legs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[8%] right-[8%] -bottom-[3%] h-[11%] rounded-full bg-[#4a2b14]/35 blur-[7px]"
      />

      {/* Base photorealistic vintage cream-and-gold sewing machine on walnut table */}
      <img
        src="/assets/vestidor/sewing-machine.webp"
        alt="Máquina de coser vintage crema y oro sobre mesa de madera de nogal"
        draggable={false}
        className="relative z-10 w-full h-auto block drop-shadow-[0_10px_18px_rgba(62,36,16,0.28)]"
      />

      {/* Precision-aligned animated mechanical SVG overlay (flywheel, needle, lace fabric motion, golden thread) */}
      <svg
        viewBox="0 0 862 820"
        className="pointer-events-none absolute inset-0 z-20 w-full h-full"
        fill="none"
        aria-hidden="true"
      >
        {/* 1. Taut golden thread quivering from top spool to needle eye */}
        <g className="atelier-anim-thread">
          <path
            d="M 556 122 L 246 168 L 210 198 L 218 408"
            stroke="#f5cf74"
            strokeWidth="2.4"
            strokeOpacity="0.88"
            strokeLinecap="round"
          />
          <circle cx="246" cy="168" r="3" fill="#fff4cf" />
        </g>

        {/* 2. Reciprocating steel needle bar & gleaming needle plunging into crochet lace */}
        <g className="atelier-anim-needle">
          <rect x="218" y="346" width="5.5" height="62" rx="2" fill="#d9d5cc" stroke="#6c6258" strokeWidth="1.2" />
          <line x1="220.8" y1="406" x2="220.8" y2="444" stroke="#f7f4ee" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="220.8" y1="406" x2="220.8" y2="444" stroke="#5d534a" strokeWidth="0.9" strokeDasharray="3 3" />
          {/* Tiny needle-eye golden glint */}
          <circle cx="220.8" cy="436" r="2.2" fill="#ffe49c" />
        </g>

        {/* 3. Subtle gliding crochet lace accent under presser foot */}
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

        {/* 4. Spinning vintage spoked handwheel (volante) on the right side of the cream body */}
        <g transform="translate(744, 240)">
          <g className="atelier-anim-wheel">
            {/* Subtle elliptical perspective wrapper for authentic depth */}
            <g transform="scale(0.54, 1)">
              <circle cx="0" cy="0" r="88" stroke="#e9cb85" strokeWidth="5.5" strokeOpacity="0.65" />
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <line
                  key={deg}
                  x1="0"
                  y1="0"
                  x2={Math.cos((deg * Math.PI) / 180) * 82}
                  y2={Math.sin((deg * Math.PI) / 180) * 82}
                  stroke="#f4dea4"
                  strokeWidth="6"
                  strokeOpacity="0.6"
                  strokeLinecap="round"
                />
              ))}
              <circle cx="0" cy="0" r="14" fill="#d8b56a" fillOpacity="0.78" stroke="#6c4516" strokeWidth="2.5" />
            </g>
          </g>
        </g>
      </svg>

      {/* Discreet wooden Pause/Play button right beneath/over corner when hovered */}
      {showInlineControl && onTogglePause && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePause();
          }}
          aria-label={paused ? 'Reanudar máquina de coser' : 'Pausar máquina de coser'}
          title={paused ? 'Reanudar máquina de coser' : 'Pausar máquina de coser'}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-1 px-2 py-0.5 rounded-full atelier-wood-btn text-[10px] font-semibold text-[#fff4dc] shadow-md cursor-pointer opacity-85 hover:opacity-100 whitespace-nowrap"
        >
          {paused ? <Play className="w-2.5 h-2.5 text-[#f3cf7c]" /> : <Pause className="w-2.5 h-2.5 text-[#f3cf7c]" />}
          <span>{paused ? 'Coser' : 'Pausar'}</span>
        </button>
      )}
    </div>
  );
};

/**
 * Handcrafted Top-Right 3D Crocheted Floral Cluster (berry rose, ivory daisy, dusty rose, sage leaves)
 */
export const ArtisanCrochetFloralCluster: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 260 150"
    className={`select-none drop-shadow-[0_8px_14px_rgba(58,28,14,0.36)] atelier-anim-flower ${className}`}
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="afc-berry" cx="35%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#f07294" />
        <stop offset="52%" stopColor="#b92954" />
        <stop offset="100%" stopColor="#651029" />
      </radialGradient>
      <radialGradient id="afc-cream" cx="35%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#fffaf0" />
        <stop offset="60%" stopColor="#edd6b0" />
        <stop offset="100%" stopColor="#b89363" />
      </radialGradient>
      <radialGradient id="afc-rose" cx="35%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#f9d8dc" />
        <stop offset="55%" stopColor="#d89aa5" />
        <stop offset="100%" stopColor="#8d4c59" />
      </radialGradient>
      <radialGradient id="afc-gold" cx="38%" cy="32%" r="70%">
        <stop offset="0%" stopColor="#fff0a6" />
        <stop offset="52%" stopColor="#eab32a" />
        <stop offset="100%" stopColor="#8a560b" />
      </radialGradient>
    </defs>

    {/* Layered crocheted sage & forest leaves */}
    {[
      { cx: 52, cy: 38, rx: 32, ry: 13, rot: -22, fill: '#6c8754' },
      { cx: 224, cy: 48, rx: 30, ry: 12, rot: 26, fill: '#577342' },
      { cx: 214, cy: 102, rx: 28, ry: 11, rot: 48, fill: '#7c9762' },
      { cx: 118, cy: 30, rx: 24, ry: 10, rot: -10, fill: '#8fa68a' },
      { cx: 146, cy: 112, rx: 26, ry: 10, rot: 14, fill: '#67824f' },
    ].map((leaf, i) => (
      <g key={i} transform={`rotate(${leaf.rot} ${leaf.cx} ${leaf.cy})`}>
        <ellipse cx={leaf.cx} cy={leaf.cy} rx={leaf.rx} ry={leaf.ry} fill={leaf.fill} stroke="#364a27" strokeWidth="2" />
        <ellipse
          cx={leaf.cx}
          cy={leaf.cy}
          rx={leaf.rx * 0.72}
          ry={leaf.ry * 0.45}
          stroke="#d4e4c1"
          strokeWidth="1.2"
          strokeDasharray="3 2.5"
        />
      </g>
    ))}

    {/* Left Cream Crochet Daisy */}
    <g transform="translate(82, 68)">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <ellipse cx="0" cy="-24" rx="11.5" ry="18" fill="url(#afc-cream)" stroke="#9e7a4e" strokeWidth="1.7" />
          <ellipse cx="0" cy="-24" rx="6.5" ry="11.5" stroke="#fff9eb" strokeWidth="1.3" strokeDasharray="3 2" />
        </g>
      ))}
      <circle cx="0" cy="0" r="13.5" fill="url(#afc-gold)" stroke="#7f4f0e" strokeWidth="1.8" />
      <circle cx="0" cy="0" r="7.5" stroke="#fff1b0" strokeWidth="1.3" strokeDasharray="2.4 2" />
    </g>

    {/* Hero Berry-Rose Crochet Flower */}
    <g transform="translate(168, 62)">
      {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <ellipse cx="0" cy="-31" rx="13" ry="22" fill="url(#afc-berry)" stroke="#5b0f26" strokeWidth="1.8" />
          <ellipse cx="0" cy="-31" rx="7.5" ry="14" stroke="#f79bb5" strokeWidth="1.3" strokeDasharray="3.2 2.2" />
        </g>
      ))}
      {[18, 90, 162, 234, 306].map((deg) => (
        <g key={`in-${deg}`} transform={`rotate(${deg})`}>
          <ellipse cx="0" cy="-18" rx="9" ry="12" fill="#d94670" stroke="#6d122e" strokeWidth="1.4" />
        </g>
      ))}
      <circle cx="0" cy="0" r="16" fill="url(#afc-gold)" stroke="#7c4b09" strokeWidth="2" />
      <circle cx="0" cy="0" r="10" stroke="#fff2b5" strokeWidth="1.5" strokeDasharray="2.5 2.2" />
    </g>

    {/* Small Dusty-Rose Blossom on Lower Right */}
    <g transform="translate(216, 114)">
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <ellipse cx="0" cy="-16" rx="8.5" ry="13" fill="url(#afc-rose)" stroke="#7c4450" strokeWidth="1.5" />
          <ellipse cx="0" cy="-16" rx="4.5" ry="7.5" stroke="#fff2f4" strokeWidth="1.1" strokeDasharray="2 1.8" />
        </g>
      ))}
      <circle cx="0" cy="0" r="7.5" fill="url(#afc-gold)" stroke="#7e4f11" strokeWidth="1.3" />
    </g>
  </svg>
);

/**
 * Handcrafted Bottom-Left Crocheted Yellow Sunflower with Sage Leaves
 */
export const ArtisanYellowSunflower: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 180 150"
    className={`select-none drop-shadow-[0_8px_14px_rgba(64,38,14,0.34)] atelier-anim-flower ${className}`}
    style={{ animationDelay: '0.8s' }}
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="ays-petal" cx="35%" cy="25%" r="75%">
        <stop offset="0%" stopColor="#fff099" />
        <stop offset="52%" stopColor="#f2be2e" />
        <stop offset="100%" stopColor="#b07210" />
      </radialGradient>
      <radialGradient id="ays-center" cx="38%" cy="32%" r="70%">
        <stop offset="0%" stopColor="#7a6835" />
        <stop offset="55%" stopColor="#4f431f" />
        <stop offset="100%" stopColor="#2a220e" />
      </radialGradient>
    </defs>

    {/* Crocheted Leaves */}
    <g transform="rotate(-24 38 112)">
      <ellipse cx="38" cy="112" rx="30" ry="12" fill="#6f8b49" stroke="#364a1f" strokeWidth="2" />
      <ellipse cx="38" cy="112" rx="20" ry="5" stroke="#c8dc9e" strokeWidth="1.2" strokeDasharray="3 2" />
    </g>
    <g transform="rotate(18 140 112)">
      <ellipse cx="140" cy="112" rx="32" ry="12" fill="#5e793c" stroke="#2f4219" strokeWidth="2" />
      <ellipse cx="140" cy="112" rx="22" ry="5" stroke="#bfd494" strokeWidth="1.2" strokeDasharray="3 2" />
    </g>

    {/* Chunky 3D Knitted Sunflower Petals */}
    <g transform="translate(90, 74)">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <ellipse cx="0" cy="-37" rx="12" ry="23" fill="url(#ays-petal)" stroke="#8e5a0e" strokeWidth="1.7" />
          <ellipse cx="0" cy="-37" rx="6.5" ry="14.5" stroke="#fff6c2" strokeWidth="1.3" strokeDasharray="3 2" />
        </g>
      ))}
      {/* Textured knitted seed dome */}
      <circle cx="0" cy="0" r="22" fill="url(#ays-center)" stroke="#241c0a" strokeWidth="2.2" />
      <circle cx="0" cy="0" r="15" stroke="#9e8747" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="0" cy="0" r="8" stroke="#c5ad63" strokeWidth="1.6" strokeDasharray="2 2.4" />
    </g>
  </svg>
);

/**
 * Handcrafted Wicker Basket overflowing with Chunky Natural Cotton Yarn Balls
 */
export const ArtisanWickerYarnBasket: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 210 170"
    className={`select-none drop-shadow-[0_10px_16px_rgba(68,38,16,0.34)] ${className}`}
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="awb-wicker" x1="0" y1="70" x2="210" y2="160" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#d49e60" />
        <stop offset="50%" stopColor="#a96f37" />
        <stop offset="100%" stopColor="#6c421c" />
      </linearGradient>
    </defs>

    {/* Ground shadow */}
    <ellipse cx="105" cy="156" rx="76" ry="10" fill="#4f2d14" fillOpacity="0.28" />

    {/* Overflowing yarn balls (back row & front row) */}
    {[
      { cx: 66, cy: 62, r: 30, main: '#3c6e3b', hi: '#7db078', dk: '#1e3e1e' },
      { cx: 112, cy: 48, r: 34, main: '#5b7e48', hi: '#9ec088', dk: '#2c4720' },
      { cx: 152, cy: 68, r: 28, main: '#f0b829', hi: '#ffe280', dk: '#98690c' },
      { cx: 88, cy: 76, r: 29, main: '#f3e1c3', hi: '#fffaf0', dk: '#b39064' },
      { cx: 132, cy: 82, r: 27, main: '#d8a8af', hi: '#f7d8dd', dk: '#8a545e' },
    ].map((b, idx) => (
      <g key={idx}>
        <circle cx={b.cx} cy={b.cy} r={b.r} fill={b.main} stroke={b.dk} strokeWidth="2" />
        <path
          d={`M ${b.cx - b.r * 0.72} ${b.cy - b.r * 0.2} C ${b.cx - 4} ${b.cy + 12}, ${b.cx + 12} ${b.cy + 8}, ${b.cx + b.r * 0.76} ${b.cy - b.r * 0.3}`}
          stroke={b.hi}
          strokeWidth="2.4"
          strokeOpacity="0.72"
        />
        <path
          d={`M ${b.cx - b.r * 0.65} ${b.cy + b.r * 0.25} C ${b.cx} ${b.cy + 18}, ${b.cx + 16} ${b.cy + 14}, ${b.cx + b.r * 0.68} ${b.cy + b.r * 0.1}`}
          stroke={b.dk}
          strokeWidth="2.2"
          strokeOpacity="0.55"
        />
        <path
          d={`M ${b.cx - b.r * 0.28} ${b.cy - b.r * 0.8} C ${b.cx + 10} ${b.cy - 6}, ${b.cx + 4} ${b.cy + 12}, ${b.cx - b.r * 0.22} ${b.cy + b.r * 0.76}`}
          stroke={b.hi}
          strokeWidth="2"
          strokeOpacity="0.6"
        />
      </g>
    ))}

    {/* Braided Wicker Basket Body */}
    <path
      d="M 28 84 L 182 84 L 166 148 C 162 156, 48 156, 44 148 Z"
      fill="url(#awb-wicker)"
      stroke="#5b3616"
      strokeWidth="2.5"
    />
    {/* Wicker horizontal braided rows */}
    {[96, 108, 120, 132, 144].map((y, idx) => (
      <path
        key={y}
        d={`M ${31 + idx * 3} ${y} Q 105 ${y + 8} ${179 - idx * 3} ${y}`}
        stroke={idx % 2 === 0 ? '#f0c48a' : '#5f3715'}
        strokeWidth="3.2"
        strokeDasharray="10 5"
        strokeLinecap="round"
        strokeOpacity="0.82"
      />
    ))}
    {/* Thick braided wicker top rim */}
    <rect x="22" y="76" width="166" height="14" rx="7" fill="#c98e50" stroke="#5b3616" strokeWidth="2.4" />
    <path d="M 30 83 L 180 83" stroke="#f6d29f" strokeWidth="3" strokeDasharray="8 6" strokeLinecap="round" />
  </svg>
);

/**
 * Handcrafted Potted Green Leafy Houseplant in a Woven Natural Wicker Planter
 */
export const ArtisanPottedPlant: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 180 260"
    className={`select-none drop-shadow-[0_12px_18px_rgba(64,38,16,0.3)] atelier-anim-flower ${className}`}
    style={{ animationDuration: '8.2s' }}
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="app-leaf1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8bb854" />
        <stop offset="55%" stopColor="#4f7c2b" />
        <stop offset="100%" stopColor="#2c4b17" />
      </linearGradient>
      <linearGradient id="app-leaf2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#a0ca66" />
        <stop offset="60%" stopColor="#5d8a35" />
        <stop offset="100%" stopColor="#35581c" />
      </linearGradient>
      <linearGradient id="app-pot" x1="36" y1="154" x2="144" y2="246" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#d8a366" />
        <stop offset="52%" stopColor="#aa6f36" />
        <stop offset="100%" stopColor="#6a3e19" />
      </linearGradient>
    </defs>

    {/* Floor shadow */}
    <ellipse cx="90" cy="248" rx="52" ry="8" fill="#4f2d14" fillOpacity="0.28" />

    {/* Stems */}
    <path d="M 90 162 Q 86 112 94 42" stroke="#3c6120" strokeWidth="4" strokeLinecap="round" />
    <path d="M 88 162 Q 66 118 42 78" stroke="#3c6120" strokeWidth="3.6" strokeLinecap="round" />
    <path d="M 92 162 Q 118 122 142 82" stroke="#3c6120" strokeWidth="3.6" strokeLinecap="round" />

    {/* Organic lush botanical leaves */}
    {[
      { d: 'M 92 98 C 68 62, 74 22, 96 14 C 118 24, 120 66, 92 98 Z', fill: 'url(#app-leaf2)' },
      { d: 'M 82 126 C 42 110, 16 74, 24 54 C 48 52, 78 82, 82 126 Z', fill: 'url(#app-leaf1)' },
      { d: 'M 96 122 C 122 86, 152 60, 164 68 C 166 90, 134 118, 96 122 Z', fill: 'url(#app-leaf2)' },
      { d: 'M 84 152 C 44 148, 18 124, 16 106 C 42 102, 72 122, 84 152 Z', fill: 'url(#app-leaf2)' },
      { d: 'M 94 148 C 124 128, 154 118, 166 130 C 156 150, 126 160, 94 148 Z', fill: 'url(#app-leaf1)' },
      { d: 'M 88 144 C 72 102, 84 64, 114 54 C 122 84, 108 118, 88 144 Z', fill: 'url(#app-leaf1)' },
    ].map((leaf, i) => (
      <path key={i} d={leaf.d} fill={leaf.fill} stroke="#284614" strokeWidth="1.8" strokeLinejoin="round" />
    ))}

    {/* Woven Wicker Planter Basket */}
    <path
      d="M 42 158 L 138 158 L 128 242 C 125 248, 55 248, 52 242 Z"
      fill="url(#app-pot)"
      stroke="#583416"
      strokeWidth="2.4"
    />
    {[172, 186, 200, 214, 228].map((y, idx) => (
      <path
        key={y}
        d={`M ${44 + idx * 1.6} ${y} Q 90 ${y + 6} ${136 - idx * 1.6} ${y}`}
        stroke={idx % 2 === 0 ? '#f0c58c' : '#5e3716'}
        strokeWidth="3"
        strokeDasharray="8 4.5"
        strokeLinecap="round"
        strokeOpacity="0.82"
      />
    ))}
    <rect x="38" y="152" width="104" height="12" rx="6" fill="#c98e50" stroke="#583416" strokeWidth="2.2" />
  </svg>
);

/**
 * Handcrafted Amigurumi Crocheted Teddy Bear with Burgundy Bow & Sage Leaves
 */
export const ArtisanCrochetTeddy: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 180 210"
    className={`select-none drop-shadow-[0_10px_16px_rgba(62,36,16,0.34)] ${className}`}
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="act-yarn" cx="35%" cy="28%" r="74%">
        <stop offset="0%" stopColor="#fff3dc" />
        <stop offset="56%" stopColor="#e3c095" />
        <stop offset="100%" stopColor="#9f754a" />
      </radialGradient>
      <radialGradient id="act-muzzle" cx="40%" cy="32%" r="70%">
        <stop offset="0%" stopColor="#fffaf0" />
        <stop offset="100%" stopColor="#e8cca5" />
      </radialGradient>
    </defs>

    {/* Ground shadow */}
    <ellipse cx="92" cy="196" rx="58" ry="9" fill="#4f2d14" fillOpacity="0.28" />

    {/* Little crocheted sage leaves beside feet */}
    <g transform="rotate(-18 28 182)">
      <ellipse cx="28" cy="182" rx="22" ry="9" fill="#6f8b49" stroke="#364a1f" strokeWidth="1.6" />
    </g>
    <g transform="rotate(-38 44 170)">
      <ellipse cx="44" cy="170" rx="18" ry="7.5" fill="#8fa68a" stroke="#3d5438" strokeWidth="1.5" />
    </g>

    {/* Ears */}
    <circle cx="56" cy="40" r="18" fill="url(#act-yarn)" stroke="#7a5330" strokeWidth="2.2" />
    <circle cx="56" cy="40" r="10" fill="#d3a57a" stroke="#8e623a" strokeWidth="1.3" strokeDasharray="3 2" />
    <circle cx="124" cy="40" r="18" fill="url(#act-yarn)" stroke="#7a5330" strokeWidth="2.2" />
    <circle cx="124" cy="40" r="10" fill="#d3a57a" stroke="#8e623a" strokeWidth="1.3" strokeDasharray="3 2" />

    {/* Seated Plump Crochet Body */}
    <ellipse cx="90" cy="144" rx="44" ry="46" fill="url(#act-yarn)" stroke="#7a5330" strokeWidth="2.4" />
    <ellipse cx="90" cy="146" rx="34" ry="36" stroke="#fff2d8" strokeWidth="1.6" strokeDasharray="4 3.5" strokeOpacity="0.7" />

    {/* Arms */}
    <ellipse cx="48" cy="134" rx="15" ry="26" transform="rotate(24 48 134)" fill="url(#act-yarn)" stroke="#7a5330" strokeWidth="2.2" />
    <ellipse cx="132" cy="134" rx="15" ry="26" transform="rotate(-24 132 134)" fill="url(#act-yarn)" stroke="#7a5330" strokeWidth="2.2" />

    {/* Seated Feet with stitched pads */}
    <ellipse cx="62" cy="180" rx="20" ry="15" transform="rotate(-12 62 180)" fill="url(#act-yarn)" stroke="#7a5330" strokeWidth="2.2" />
    <ellipse cx="62" cy="180" rx="11" ry="8" fill="#c7996e" stroke="#855a36" strokeWidth="1.2" strokeDasharray="2.5 2" />
    <ellipse cx="118" cy="180" rx="20" ry="15" transform="rotate(12 118 180)" fill="url(#act-yarn)" stroke="#7a5330" strokeWidth="2.2" />
    <ellipse cx="118" cy="180" rx="11" ry="8" fill="#c7996e" stroke="#855a36" strokeWidth="1.2" strokeDasharray="2.5 2" />

    {/* Burgundy Knitted Neck Ribbon Bow */}
    <path d="M 62 104 Q 90 116 118 104" stroke="#8e2138" strokeWidth="9" strokeLinecap="round" />
    <path d="M 88 112 L 74 134 M 92 112 L 106 132" stroke="#8e2138" strokeWidth="7" strokeLinecap="round" />
    <ellipse cx="76" cy="112" rx="12" ry="7" transform="rotate(-16 76 112)" fill="#a82a45" stroke="#5c1020" strokeWidth="1.6" />
    <ellipse cx="104" cy="112" rx="12" ry="7" transform="rotate(16 104 112)" fill="#a82a45" stroke="#5c1020" strokeWidth="1.6" />
    <circle cx="90" cy="112" r="6" fill="#7c192e" stroke="#f095a8" strokeWidth="1.2" />

    {/* Crochet Head */}
    <circle cx="90" cy="68" r="38" fill="url(#act-yarn)" stroke="#7a5330" strokeWidth="2.4" />
    <circle cx="90" cy="68" r="31" stroke="#fff3db" strokeWidth="1.5" strokeDasharray="3.8 3.2" strokeOpacity="0.65" />

    {/* Muzzle, Button Eyes & Stitched Smile */}
    <ellipse cx="90" cy="80" rx="16" ry="12" fill="url(#act-muzzle)" stroke="#9a724a" strokeWidth="1.4" />
    <circle cx="76" cy="64" r="4.3" fill="#23140b" />
    <circle cx="74.6" cy="62.6" r="1.4" fill="#ffffff" />
    <circle cx="104" cy="64" r="4.3" fill="#23140b" />
    <circle cx="102.6" cy="62.6" r="1.4" fill="#ffffff" />
    <ellipse cx="90" cy="76" rx="5.5" ry="4" fill="#462511" />
    <path d="M 90 80 L 90 85 M 84 85 Q 90 90 96 85" stroke="#462511" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * Header Centerpiece Yarn Ball + Crossed Crochet Hooks Emblem
 */
export const HeaderYarnHooksEmblem: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg viewBox="0 0 100 100" className={`shrink-0 drop-shadow-[0_4px_8px_rgba(32,14,4,0.65)] ${className}`} fill="none" aria-hidden="true">
    <defs>
      <radialGradient id="hyhe-ball" cx="35%" cy="30%" r="72%">
        <stop offset="0%" stopColor="#f5a2ad" />
        <stop offset="52%" stopColor="#c74a60" />
        <stop offset="100%" stopColor="#6c182a" />
      </radialGradient>
    </defs>
    {/* Crossed wooden/gold crochet hooks */}
    <line x1="16" y1="84" x2="84" y2="16" stroke="#e9c47b" strokeWidth="5.5" strokeLinecap="round" />
    <circle cx="85" cy="15" r="4.5" fill="#d8a64d" stroke="#5f3710" strokeWidth="1.4" />
    <line x1="84" y1="84" x2="16" y2="16" stroke="#d8a454" strokeWidth="5.5" strokeLinecap="round" />
    <path d="M 16 16 C 12 12, 18 7, 23 13" stroke="#f5dfa4" strokeWidth="3.5" strokeLinecap="round" />
    {/* Rose cotton yarn ball */}
    <circle cx="50" cy="52" r="28" fill="url(#hyhe-ball)" stroke="#5b1222" strokeWidth="2.2" />
    <path d="M 27 42 C 42 54, 62 52, 74 38" stroke="#ffd2d8" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M 24 52 C 42 66, 62 64, 76 50" stroke="#5b1222" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M 38 26 C 50 44, 48 64, 34 76" stroke="#ffd2d8" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M 56 26 C 46 46, 50 64, 64 76" stroke="#5b1222" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/**
 * Top-Left Mini Wicker Yarn Basket Ornament
 */
export const HeaderMiniBasket: React.FC<{ className?: string }> = ({ className = 'w-14 h-12' }) => (
  <svg viewBox="0 0 110 92" className={`select-none drop-shadow-[0_6px_10px_rgba(44,22,8,0.5)] ${className}`} fill="none" aria-hidden="true">
    <path d="M 22 44 C 24 10, 86 10, 88 44" stroke="#8f5b2c" strokeWidth="5.5" strokeLinecap="round" />
    <circle cx="42" cy="40" r="14" fill="#d8a8af" stroke="#7d4450" strokeWidth="1.6" />
    <circle cx="62" cy="36" r="15" fill="#f1bc33" stroke="#92640c" strokeWidth="1.6" />
    <circle cx="74" cy="44" r="12" fill="#8fa68a" stroke="#475c43" strokeWidth="1.6" />
    <path d="M 16 44 L 94 44 L 84 82 C 80 86, 30 86, 26 82 Z" fill="#b97d42" stroke="#583415" strokeWidth="2.2" />
    <path d="M 20 56 Q 55 62 90 56 M 24 68 Q 55 74 86 68" stroke="#f0c78e" strokeWidth="2.6" strokeDasharray="7 4" strokeLinecap="round" />
    <rect x="13" y="40" width="84" height="9" rx="4.5" fill="#d09454" stroke="#583415" strokeWidth="2" />
  </svg>
);
