import React from 'react';
import type { YarnBallColorOption } from '../data/glbAssetManifest';

/**
 * Tactile pink-coral crochet yarn ball with crossed crochet hooks emblem
 * positioned inside the carved walnut wood header plaque of "El Vestidor Dorado".
 */
export const ArtisanYarnHooksEmblem: React.FC<{ className?: string }> = ({
  className = 'w-11 h-11',
}) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    className={`${className} shrink-0 drop-shadow-[0_3px_8px_rgba(32,12,4,0.6)]`}
  >
    <defs>
      <radialGradient id="coralYarnGrad" cx="34%" cy="28%" r="70%">
        <stop offset="0%" stopColor="#ffcac2" />
        <stop offset="45%" stopColor="#e86f72" />
        <stop offset="100%" stopColor="#8a2632" />
      </radialGradient>
      <linearGradient id="hookPink" x1="0" y1="0" x2="64" y2="64">
        <stop offset="0%" stopColor="#ffe1dc" />
        <stop offset="55%" stopColor="#eb8e94" />
        <stop offset="100%" stopColor="#9c3c47" />
      </linearGradient>
    </defs>
    <path d="M11 12 L52 53" stroke="url(#hookPink)" strokeWidth="4.4" strokeLinecap="round" />
    <path d="M11 12 C9 9, 13 6, 16 9" stroke="#ffe7e2" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M53 12 L12 53" stroke="url(#hookPink)" strokeWidth="4.4" strokeLinecap="round" />
    <path d="M53 12 C55 9, 51 6, 48 9" stroke="#ffe7e2" strokeWidth="3.2" strokeLinecap="round" />
    <circle cx="32" cy="33" r="18" fill="url(#coralYarnGrad)" stroke="#ffd6cf" strokeWidth="1.2" />
    <g stroke="#6c1822" strokeOpacity="0.5" strokeWidth="2.2" strokeLinecap="round">
      <path d="M18 26 C26 19, 39 19, 47 26" />
      <path d="M16 33 C25 26, 40 26, 49 33" />
      <path d="M19 41 C27 34, 39 35, 46 41" />
      <path d="M23 18 C20 28, 22 40, 30 49" />
      <path d="M31 16 C28 27, 30 40, 39 49" />
    </g>
    <g stroke="#ffe6e2" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round">
      <path d="M19 25 C27 18, 39 18, 46 25" />
      <path d="M17 32 C26 25, 40 25, 48 32" />
    </g>
    <path d="M14 48 C8 50, 9 57, 17 55" stroke="#e86f72" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M49 48 C56 50, 56 56, 48 56" stroke="#f59a94" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/**
 * Photorealistic 3D artisan crochet decorations matching the exact corners of the reference:
 * - Top-left miniature wicker basket with yarn balls & knitted green leaves
 * - Top-right 3D crochet flower cluster (cream, berry-magenta with yellow center, pastel pink + knitted leaves)
 * - Bottom-left 3D golden crochet sunflower with olive leaves
 * - Bottom-right 3D cream amigurumi crochet teddy bear with burgundy knitted scarf
 * All strictly pointer-events-none so zero controls are ever obstructed.
 */
export const ArtisanCrochetCornerDecor: React.FC<{ animateDecorations?: boolean }> = ({
  animateDecorations = true,
}) => (
  <>
    {/* Top-Left Miniature Wicker Basket of Yarn Balls & Leaves */}
    <img
      src="/vestidor/artisan/top-basket.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pointer-events-none select-none hidden sm:block absolute top-1 left-2 lg:left-3 w-[82px] lg:w-[98px] xl:w-[110px] h-auto z-40 drop-shadow-[0_8px_14px_rgba(62,28,12,0.38)] ${
        animateDecorations ? 'animate-crochet-basket' : ''
      }`}
    />

    {/* Top-Right 3D Photorealistic Crocheted Flower Cluster */}
    <img
      src="/vestidor/artisan/flowers-top.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pointer-events-none select-none hidden md:block absolute -top-2 -right-2 w-[200px] lg:w-[255px] xl:w-[295px] h-auto z-40 drop-shadow-[0_10px_18px_rgba(62,24,14,0.36)] ${
        animateDecorations ? 'animate-crochet-flower' : ''
      }`}
    />

    {/* Bottom-Left 3D Crocheted Golden Sunflower + Knitted Olive Leaves */}
    <img
      src="/vestidor/artisan/crochet-sunflower.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`pointer-events-none select-none hidden lg:block absolute -bottom-2 left-[128px] xl:left-[152px] w-[132px] xl:w-[154px] h-auto z-30 drop-shadow-[0_8px_14px_rgba(58,28,10,0.38)] ${
        animateDecorations ? 'animate-crochet-sunflower' : ''
      }`}
    />

    {/* Bottom-Right 3D Cream Amigurumi Crochet Teddy Bear with Burgundy Scarf */}
    <img
      src="/vestidor/artisan/crochet-teddy.png"
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none select-none hidden xl:block absolute bottom-0 right-1 w-[116px] 2xl:w-[134px] h-auto z-40 drop-shadow-[0_10px_18px_rgba(58,26,12,0.4)]"
    />
  </>
);

/**
 * Photorealistic 3D circular hand-crocheted concentric rug placed flat beneath the official
 * photographic male model's feet, using pure radial-gradient grounding shadows (zero CSS filter
 * drop-shadow / blur so Safari & WebKit never clip the raster layer inside transformed stages).
 */
export const CircularCrochetRug: React.FC<{
  angleDeg: number;
  showAngleMarker?: boolean;
}> = ({ angleDeg, showAngleMarker = true }) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const markerLeftPct = 50 + Math.cos(rad) * 44;
  const markerTopPct = 50 - Math.sin(rad) * 38;

  return (
    <div className="relative w-full h-full select-none pointer-events-none">
      {/* Grounded floor shadow beneath the thick wool rug (pure radial-gradient, Safari-safe) */}
      <div
        aria-hidden="true"
        className="absolute -inset-x-[3%] top-[14%] -bottom-[10%] rounded-full"
        style={{
          background:
            'radial-gradient(ellipse 50% 48% at 50% 54%, rgba(62,30,12,0.44) 0%, rgba(62,30,12,0.22) 56%, rgba(62,30,12,0.06) 76%, transparent 94%)',
        }}
      />

      {/* High-resolution photorealistic hand-crocheted circular concentric rug */}
      <img
        src="/vestidor/artisan/crochet-rug.webp"
        alt=""
        aria-hidden="true"
        width={1100}
        height={490}
        draggable={false}
        decoding="async"
        className="relative block w-full h-full object-fill select-none pointer-events-none"
      />

      {/* Soft grounded ambient contact shadow right on the rug center medallion beneath the shoes */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[56%] h-[28%] rounded-full"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(48,20,8,0.42) 0%, rgba(48,20,8,0.18) 54%, rgba(48,20,8,0) 84%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[42%] h-[15%] rounded-full"
        style={{
          background:
            'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(36,14,4,0.44) 0%, rgba(36,14,4,0.12) 62%, rgba(36,14,4,0) 86%)',
        }}
      />

      {/* Subtle golden stitch marker bead along perimeter (only shown in 360° turntable mode) */}
      {showAngleMarker && (
        <span
          aria-hidden="true"
          className="absolute w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full bg-[#fff7d4] border-2 border-[#b76e14] shadow-[0_0_8px_rgba(255,214,102,0.85)] transition-all duration-300"
          style={{
            left: `${markerLeftPct}%`,
            top: `${markerTopPct}%`,
          }}
        />
      )}
    </div>
  );
};

/**
 * Photorealistic wound wool yarn ball swatch rendered from our macro yarn-ball photograph
 * dyed cleanly to each wool color so real twisted yarn fibers & soft highlights are preserved.
 */
export const ArtisanYarnBallSwatch: React.FC<{
  color: YarnBallColorOption;
  selected: boolean;
  available?: boolean;
  onClick: () => void;
}> = ({ color, selected, available = true, onClick }) => {
  const isNaturalCream = color.id === 'crema';

  return (
    <button
      type="button"
      onClick={onClick}
      title={available ? color.name : `${color.name} (sin fotografía aún)`}
      aria-label={`Ovillo de hilo ${color.name}`}
      className={`relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-150 cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c4318] ${
        selected
          ? 'scale-110 ring-[3px] ring-[#f7b924] shadow-[0_5px_14px_rgba(148,78,12,0.52)]'
          : available
            ? 'hover:scale-105 shadow-[0_4px_8px_rgba(74,38,14,0.34)]'
            : 'opacity-65 hover:opacity-95 shadow-sm'
      }`}
    >
      <span className="relative w-full h-full rounded-full overflow-hidden block">
        {isNaturalCream ? (
          <img
            src="/vestidor/artisan/yarn-ball-base.png"
            alt=""
            draggable={false}
            className="w-full h-full object-cover scale-[1.03]"
          />
        ) : (
          <>
            {/* Solid wool dye base */}
            <span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: color.hex }}
            />
            {/* Real macro wound wool fiber shading multiplied onto dye color */}
            <img
              src="/vestidor/artisan/yarn-ball-gray.png"
              alt=""
              draggable={false}
              className="relative w-full h-full object-cover scale-[1.03] mix-blend-multiply"
            />
            {/* Soft fiber sheen highlight so dark wool balls keep crisp tactile strands */}
            <img
              src="/vestidor/artisan/yarn-ball-gray.png"
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 w-full h-full object-cover scale-[1.03] mix-blend-screen opacity-22"
            />
          </>
        )}
        {/* Subtle spherical studio shading */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 45%, rgba(28,12,4,0.34) 100%)',
          }}
        />
      </span>
    </button>
  );
};
