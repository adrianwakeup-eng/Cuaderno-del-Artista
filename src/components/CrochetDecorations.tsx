import React from 'react';
import { STICKER_RECIPE_MAP } from '../data/crochetStickersCatalog';
import { ParametricCrochetSticker } from './StickerSvgEngine';

export const YarnBall3D: React.FC<{
  tone?: 'gold' | 'rose';
  className?: string;
}> = ({ tone = 'gold', className = 'w-11 h-11' }) => {
  const isGold = tone === 'gold';
  const baseLight = isGold ? '#f7d27a' : '#f18c94';
  const baseMid = isGold ? '#d69732' : '#c64758';
  const baseDark = isGold ? '#7f4c10' : '#6d1828';
  const highlight = isGold ? '#fff2be' : '#ffd2d5';
  const uid = isGold ? 'yb-gold' : 'yb-rose';

  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} pointer-events-none select-none drop-shadow-[0_6px_8px_rgba(0,0,0,0.65)]`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${uid}-grad`} cx="36%" cy="32%" r="68%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="32%" stopColor={baseLight} />
          <stop offset="72%" stopColor={baseMid} />
          <stop offset="100%" stopColor={baseDark} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="40" fill={`url(#${uid}-grad)`} stroke={baseDark} strokeWidth="2.2" />
      {/* Layered wrapped yarn strands */}
      <path d="M16 36 C34 54, 68 50, 86 30" stroke={baseDark} strokeWidth="2.5" strokeOpacity="0.65" />
      <path d="M14 43 C34 62, 68 58, 88 38" stroke={highlight} strokeWidth="2.2" strokeOpacity="0.72" />
      <path d="M13 53 C36 72, 68 68, 88 49" stroke={baseDark} strokeWidth="2.4" strokeOpacity="0.6" />
      <path d="M18 66 C40 80, 68 76, 84 62" stroke={highlight} strokeWidth="1.9" strokeOpacity="0.58" />
      <path d="M32 15 C52 38, 46 68, 28 83" stroke={highlight} strokeWidth="2.3" strokeOpacity="0.7" />
      <path d="M40 12 C60 36, 56 68, 38 87" stroke={baseDark} strokeWidth="2.4" strokeOpacity="0.62" />
      <path d="M64 14 C46 38, 52 68, 70 84" stroke={highlight} strokeWidth="2" strokeOpacity="0.6" />
      <path d="M72 20 C56 44, 60 68, 76 78" stroke={baseDark} strokeWidth="2.2" strokeOpacity="0.55" />
      {/* Rim shadow */}
      <circle cx="50" cy="50" r="39" stroke="rgba(255,244,210,0.22)" strokeWidth="1.5" />
    </svg>
  );
};

export const CrochetLaceTrim: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 280 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} drop-shadow-[0_4px_5px_rgba(0,0,0,0.68)]`}
    aria-hidden="true"
  >
    {[0, 46, 92, 138, 184, 230].map((x) => (
      <g key={x} transform={`translate(${x}, 2)`}>
        <path
          d="M2 8 C12 24, 34 24, 44 8"
          stroke="#f5e1ba"
          strokeWidth="2.6"
          strokeDasharray="3.2 2.2"
          strokeLinecap="round"
        />
        <circle cx="23" cy="24" r="12" stroke="#ecd1a2" strokeWidth="2.4" strokeDasharray="3.6 2.2" />
        <circle cx="23" cy="24" r="6" fill="#2d1509" fillOpacity="0.45" stroke="#faebd0" strokeWidth="1.8" />
        <path
          d="M6 34 Q23 50 40 34"
          stroke="#f7e5c4"
          strokeWidth="2.4"
          strokeDasharray="3 2"
          strokeLinecap="round"
        />
        <circle cx="23" cy="44" r="3.2" fill="#faebd0" stroke="#a6783c" strokeWidth="0.9" />
      </g>
    ))}
  </svg>
);

export const OuterFrameCrochetCorner: React.FC<{
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ corner }) => {
  if (corner === 'top-left') {
    return (
      <div className="pointer-events-none absolute top-0 left-0 z-20 select-none">
        <CrochetLaceTrim className="w-52 h-10 -translate-x-3 -translate-y-1 opacity-90" />
        <svg
          viewBox="0 0 120 120"
          className="absolute top-0.5 left-0.5 w-16 h-16 drop-shadow-[0_6px_10px_rgba(0,0,0,0.75)]"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="oc-rose-tl" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffc5cb" />
              <stop offset="48%" stopColor="#e67382" />
              <stop offset="100%" stopColor="#8e2334" />
            </radialGradient>
          </defs>
          {/* Green crochet leaves */}
          <ellipse cx="78" cy="24" rx="14" ry="7" transform="rotate(-18 78 24)" fill="#7d9646" stroke="#3c4c1c" strokeWidth="1.5" />
          <ellipse cx="22" cy="78" rx="7" ry="14" transform="rotate(-22 22 78)" fill="#6e873c" stroke="#3c4c1c" strokeWidth="1.5" />
          <ellipse cx="66" cy="70" rx="13" ry="6.5" transform="rotate(38 66 70)" fill="#89a250" stroke="#3c4c1c" strokeWidth="1.4" />
          {/* Cream lace doily behind flower */}
          <circle cx="44" cy="44" r="30" fill="#f7e7c8" fillOpacity="0.22" stroke="#faebd0" strokeWidth="3" strokeDasharray="4 3" />
          {/* 6 sculpted crochet petals */}
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <g key={d} transform={`rotate(${d} 44 44)`}>
              <ellipse cx="44" cy="23" rx="10.5" ry="15" fill="url(#oc-rose-tl)" stroke="#681421" strokeWidth="1.4" />
              <ellipse cx="44" cy="24" rx="5.5" ry="9" stroke="#ffdce0" strokeWidth="1.1" strokeDasharray="2 1.8" />
            </g>
          ))}
          {/* Pearl cluster */}
          <circle cx="44" cy="44" r="9.5" fill="#701725" />
          <circle cx="44" cy="44" r="5.5" fill="#fff7e8" stroke="#d1b285" strokeWidth="1" />
          <circle cx="42" cy="42" r="2" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  if (corner === 'top-right') {
    return (
      <div className="pointer-events-none absolute top-0 right-0 z-20 select-none overflow-hidden">
        <CrochetLaceTrim className="w-72 h-12 translate-x-6 -translate-y-1 opacity-90" />
      </div>
    );
  }

  if (corner === 'bottom-left') {
    return (
      <div className="pointer-events-none absolute bottom-0 left-0 z-20 select-none">
        <CrochetLaceTrim className="w-52 h-10 -translate-x-2 translate-y-2 rotate-180 opacity-90" />
        <svg
          viewBox="0 0 110 110"
          className="absolute bottom-0.5 left-0.5 w-14 h-14 drop-shadow-[0_5px_9px_rgba(0,0,0,0.78)]"
          fill="none"
          aria-hidden="true"
        >
          <ellipse cx="64" cy="78" rx="12" ry="6" transform="rotate(14 64 78)" fill="#7d9646" stroke="#3c4c1c" strokeWidth="1.4" />
          <ellipse cx="32" cy="42" rx="6" ry="12" transform="rotate(-18 32 42)" fill="#6e873c" stroke="#3c4c1c" strokeWidth="1.4" />
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <ellipse
              key={d}
              cx="42"
              cy="48"
              rx="8.5"
              ry="12.5"
              transform={`rotate(${d} 42 66)`}
              fill="#cf5262"
              stroke="#681421"
              strokeWidth="1.3"
            />
          ))}
          <circle cx="42" cy="66" r="6" fill="#fff3d6" stroke="#b98e4c" strokeWidth="1.2" />
          <circle cx="40.5" cy="64.5" r="1.8" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute bottom-0 right-0 z-30 select-none flex items-end justify-end">
      <CrochetLaceTrim className="w-64 h-12 translate-x-4 translate-y-2 rotate-180 opacity-95" />
      {/* Steel & wood crochet hook + golden yarn ball at bottom right */}
      <svg
        viewBox="0 0 140 110"
        className="absolute bottom-0 right-0 w-28 h-24 drop-shadow-[0_6px_10px_rgba(0,0,0,0.8)]"
        fill="none"
        aria-hidden="true"
      >
        <g transform="rotate(38 66 56)">
          <rect x="61" y="28" width="10" height="58" rx="5" fill="#9a5324" stroke="#451f08" strokeWidth="1.6" />
          <rect x="63.2" y="8" width="5.5" height="24" rx="2.5" fill="#e8e1d8" stroke="#6c6258" strokeWidth="1.2" />
          <path d="M68.7 10 C71 6, 65 4, 64 10" stroke="#6c6258" strokeWidth="2.1" strokeLinecap="round" />
          <rect x="61" y="42" width="10" height="5" fill="#eab95a" />
        </g>
        {/* Small pink accent crochet flower */}
        <g transform="translate(52, 86)">
          {[0, 72, 144, 216, 288].map((d) => (
            <ellipse
              key={d}
              cx="0"
              cy="-8"
              rx="4.8"
              ry="7"
              transform={`rotate(${d})`}
              fill="#e77382"
              stroke="#771b29"
              strokeWidth="1"
            />
          ))}
          <circle cx="0" cy="0" r="3.6" fill="#fff5df" />
        </g>
      </svg>
      <YarnBall3D tone="gold" className="relative w-14 h-14 mr-1 mb-0.5" />
    </div>
  );
};

export const CornerCrochetFlower: React.FC<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  showYarnOrnament?: boolean;
}> = ({ position, className = '', showYarnOrnament = false }) => {
  const uid = `ccf-${position}`;

  const rotation =
    position === 'top-left'
      ? 'rotate-0'
      : position === 'top-right'
        ? 'rotate-90'
        : position === 'bottom-right'
          ? 'rotate-180'
          : '-rotate-90';

  if (showYarnOrnament && position === 'bottom-left') {
    return (
      <svg
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} pointer-events-none select-none drop-shadow-[0_4px_6px_rgba(62,30,12,0.35)]`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="bl-rose-yarn" cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#ffc5cd" />
            <stop offset="40%" stopColor="#d96775" />
            <stop offset="80%" stopColor="#9e3040" />
            <stop offset="100%" stopColor="#5d1621" />
          </radialGradient>
        </defs>
        {/* Golden Baroque filigree corner frame */}
        <path d="M12 14 C12 68, 16 122, 42 134 C72 142, 112 138, 140 134" stroke="#bd8539" strokeWidth="2.1" strokeLinecap="round" />
        <path d="M18 38 C24 72, 34 106, 86 126" stroke="#d19d4e" strokeWidth="1.4" strokeLinecap="round" />
        {/* Olive leaves */}
        <ellipse cx="48" cy="64" rx="8" ry="18" transform="rotate(-18 48 64)" fill="#8ea44c" stroke="#4d5e20" strokeWidth="1.3" />
        <ellipse cx="64" cy="76" rx="7.5" ry="16" transform="rotate(24 64 76)" fill="#a5b85c" stroke="#4d5e20" strokeWidth="1.2" />
        {/* Cream lace flower with pearl */}
        <g transform="translate(88, 108)">
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <g key={d} transform={`rotate(${d})`}>
              <ellipse cx="0" cy="-14" rx="7.5" ry="11" fill="#faeed2" stroke="#b3884d" strokeWidth="1.2" />
              <ellipse cx="0" cy="-14" rx="4" ry="6.5" stroke="#fffaf0" strokeWidth="1" strokeDasharray="1.8 1.5" />
            </g>
          ))}
          <circle cx="0" cy="0" r="6" fill="#fff7e6" stroke="#b88d4e" strokeWidth="1.1" />
          <circle cx="-1.5" cy="-1.5" r="1.8" fill="#ffffff" />
        </g>
        {/* 3D Rose Yarn Ball */}
        <circle cx="42" cy="108" r="28" fill="url(#bl-rose-yarn)" stroke="#5c1622" strokeWidth="1.6" />
        <path d="M18 98 C34 112, 54 108, 68 94" stroke="#5c1622" strokeWidth="1.8" strokeOpacity="0.65" />
        <path d="M16 108 C34 122, 54 118, 70 105" stroke="#ffd3d8" strokeWidth="1.6" strokeOpacity="0.7" />
        <path d="M28 84 C44 102, 42 120, 28 132" stroke="#ffd3d8" strokeWidth="1.6" strokeOpacity="0.68" />
        <path d="M46 82 C54 102, 50 120, 38 134" stroke="#5c1622" strokeWidth="1.7" strokeOpacity="0.58" />
      </svg>
    );
  }

  if (showYarnOrnament && position === 'bottom-right') {
    return (
      <svg
        viewBox="0 0 150 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} pointer-events-none select-none drop-shadow-[0_4px_6px_rgba(62,30,12,0.35)]`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="br-rose-yarn" cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#ffc5cd" />
            <stop offset="40%" stopColor="#d96775" />
            <stop offset="80%" stopColor="#9e3040" />
            <stop offset="100%" stopColor="#5d1621" />
          </radialGradient>
        </defs>
        {/* Golden scroll */}
        <path d="M138 18 C138 74, 134 122, 108 134 C78 142, 36 138, 12 134" stroke="#bd8539" strokeWidth="2.1" strokeLinecap="round" />
        {/* Olive leaves */}
        <ellipse cx="96" cy="76" rx="7.5" ry="15" transform="rotate(24 96 76)" fill="#8ea44c" stroke="#4d5e20" strokeWidth="1.2" />
        <ellipse cx="78" cy="86" rx="7" ry="14" transform="rotate(-24 78 86)" fill="#a5b85c" stroke="#4d5e20" strokeWidth="1.1" />
        {/* Cream crochet flower */}
        <g transform="translate(64, 114)">
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <ellipse
              key={d}
              cx="0"
              cy="-13"
              rx="6.8"
              ry="10"
              transform={`rotate(${d})`}
              fill="#faeed2"
              stroke="#b3884d"
              strokeWidth="1.1"
            />
          ))}
          <circle cx="0" cy="0" r="5" fill="#fff7e6" stroke="#b88d4e" strokeWidth="1" />
        </g>
        {/* 3D Rose Yarn Ball */}
        <circle cx="108" cy="112" r="24" fill="url(#br-rose-yarn)" stroke="#5c1622" strokeWidth="1.5" />
        <path d="M88 104 C100 116, 118 112, 130 100" stroke="#5c1622" strokeWidth="1.6" strokeOpacity="0.65" />
        <path d="M86 114 C100 124, 118 122, 130 110" stroke="#ffd3d8" strokeWidth="1.5" strokeOpacity="0.7" />
        <path d="M100 90 C114 106, 112 122, 100 132" stroke="#ffd3d8" strokeWidth="1.5" strokeOpacity="0.65" />
        {/* Steel crochet hook resting diagonally */}
        <g transform="rotate(36 86 98)">
          <rect x="83" y="42" width="5.5" height="92" rx="2.75" fill="#e9e2d8" stroke="#6f6356" strokeWidth="1.2" />
          <path d="M88.5 44 C91 39, 85 37, 84 44" stroke="#6f6356" strokeWidth="1.9" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 130 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${rotation} ${className} pointer-events-none select-none drop-shadow-[0_4px_6px_rgba(62,30,12,0.34)]`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${uid}-petal`} cx="35%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#ffd1d6" />
          <stop offset="45%" stopColor="#d95f70" />
          <stop offset="100%" stopColor="#7a1b2b" />
        </radialGradient>
      </defs>
      {/* Golden Baroque scroll filigree */}
      <path
        d="M12 114 C12 68, 18 36, 38 20 C56 6, 86 10, 116 14"
        stroke="#c08738"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M20 82 C28 60, 44 48, 60 26"
        stroke="#d49e4b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="96" cy="18" r="3" fill="#e5b864" />
      <circle cx="16" cy="96" r="3" fill="#e5b864" />

      {/* Sculpted Olive Leaves */}
      <ellipse cx="64" cy="46" rx="12" ry="6" transform="rotate(-18 64 46)" fill="#8ca349" stroke="#4d5e20" strokeWidth="1.2" />
      <ellipse cx="44" cy="68" rx="6" ry="12" transform="rotate(-22 44 68)" fill="#7a913d" stroke="#4d5e20" strokeWidth="1.2" />

      {/* Cream lace doily halo behind flower */}
      <circle cx="40" cy="40" r="26" fill="#faeed2" fillOpacity="0.35" stroke="#e4c58e" strokeWidth="2.6" strokeDasharray="3.5 2.5" />
      <circle cx="40" cy="40" r="19" stroke="#c89e64" strokeWidth="1.3" strokeDasharray="2 2" />

      {/* 6 3D Crochet Petals in Vintage Coral / Burgundy */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 40 40)`}>
          <ellipse
            cx="40"
            cy="22"
            rx="8.5"
            ry="13"
            fill={`url(#${uid}-petal)`}
            stroke="#6a1826"
            strokeWidth="1.2"
          />
          <ellipse
            cx="40"
            cy="23"
            rx="4.4"
            ry="7.5"
            stroke="#ffdfe2"
            strokeWidth="1"
            strokeDasharray="1.8 1.5"
          />
        </g>
      ))}
      {/* Luminous Pearl Center */}
      <circle cx="40" cy="40" r="7.5" fill="#701725" />
      <circle cx="40" cy="40" r="4.8" fill="#fff7e8" stroke="#cba974" strokeWidth="1" />
      <circle cx="38.2" cy="38.2" r="1.6" fill="#ffffff" />

      {/* Small Secondary Cream Crochet Blossoms */}
      <g transform="translate(68, 22)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-8.5"
            rx="4.4"
            ry="6.5"
            transform={`rotate(${deg})`}
            fill="#faeed2"
            stroke="#a8793e"
            strokeWidth="1"
          />
        ))}
        <circle cx="0" cy="0" r="3.4" fill="#9a3a46" />
        <circle cx="-1" cy="-1" r="1.2" fill="#fff5df" />
      </g>
      <g transform="translate(22, 68)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-7"
            rx="3.8"
            ry="5.5"
            transform={`rotate(${deg})`}
            fill="#faeed2"
            stroke="#a8793e"
            strokeWidth="0.9"
          />
        ))}
        <circle cx="0" cy="0" r="2.8" fill="#9a3a46" />
      </g>
    </svg>
  );
};

export const BrassBinderRings: React.FC = () => (
  <div
    className="pointer-events-none absolute inset-y-4 left-1/2 -translate-x-1/2 z-20 flex flex-col justify-between py-7"
    aria-hidden="true"
  >
    {/* Recessed leather stitched spine groove behind rings */}
    <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-5 bg-gradient-to-r from-[#5a3418]/25 via-[#2a1306]/70 to-[#5a3418]/25 border-x border-dashed border-[#8d5a2b]/55" />
    {[0, 1, 2, 3, 4, 5].map((idx) => (
      <div key={idx} className="relative z-10 flex items-center justify-center">
        {/* Left hole punch with dark bevel */}
        <span className="w-3 h-3 rounded-full bg-[#241207] shadow-[inset_0_2px_3px_rgba(0,0,0,0.85)] -mr-1.5 border border-[#b38042]/65" />
        {/* 3D Brass Ring */}
        <div
          className="w-12 h-4 rounded-full border-[2px] border-[#f4cb77] shadow-[0_5px_8px_rgba(0,0,0,0.65),inset_0_1px_2px_rgba(255,250,218,0.85)]"
          style={{
            background:
              'linear-gradient(180deg, #fff5c8 0%, #eab95c 38%, #a66d20 72%, #573409 100%)',
          }}
        />
        {/* Right hole punch with dark bevel */}
        <span className="w-3 h-3 rounded-full bg-[#241207] shadow-[inset_0_2px_3px_rgba(0,0,0,0.85)] -ml-1.5 border border-[#b38042]/65" />
      </div>
    ))}
  </div>
);


export const CrochetStickerSvg: React.FC<{ id: string; className?: string }> = React.memo(({
  id,
  className = 'w-20 h-20',
}) => {
  const recipe = STICKER_RECIPE_MAP.get(id);
  if (recipe) {
    return <ParametricCrochetSticker recipe={recipe} className={className} />;
  }

  switch (id) {
    case 'flor-borgona':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="50" r="42" stroke="#e4c89a" strokeWidth="4" strokeDasharray="5 4" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <ellipse
              key={d}
              cx="50"
              cy="24"
              rx="11"
              ry="18"
              transform={`rotate(${d} 50 50)`}
              fill="#7c1f28"
              stroke="#4f1017"
              strokeWidth="1.5"
            />
          ))}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <ellipse
              key={`in-${d}`}
              cx="50"
              cy="28"
              rx="6"
              ry="10"
              transform={`rotate(${d} 50 50)`}
              stroke="#dfaa9a"
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
          ))}
          <circle cx="50" cy="50" r="11" fill="#e8c88f" />
          <circle cx="50" cy="50" r="6" fill="#fff7e6" />
          <circle cx="48" cy="48" r="2" fill="#ffffff" />
        </svg>
      );
    case 'flor-rosa':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <circle
              key={d}
              cx="50"
              cy="25"
              r="16"
              transform={`rotate(${d} 50 50)`}
              fill="#cf7074"
              stroke="#8d3f44"
              strokeWidth="1.5"
            />
          ))}
          <circle cx="50" cy="50" r="14" fill="#f3d4b2" stroke="#b68550" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="6" fill="#8b3b40" />
        </svg>
      );
    case 'ovillo-crema':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path d="M16 74 C28 92, 68 88, 86 78" stroke="#c89f68" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="48" r="32" fill="#e7cfa6" stroke="#9e7442" strokeWidth="2" />
          <path d="M22 36 Q50 54 78 34" stroke="#b78a53" strokeWidth="2.5" />
          <path d="M20 50 Q50 68 80 48" stroke="#b78a53" strokeWidth="2.5" />
          <path d="M32 22 Q56 48 40 78" stroke="#c99e68" strokeWidth="2.4" />
          <path d="M58 18 Q42 50 64 76" stroke="#9b6e3c" strokeWidth="2.2" />
        </svg>
      );
    case 'ovillo-terracota':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path d="M12 72 C24 90, 72 88, 88 70" stroke="#9a4346" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="48" r="32" fill="#c36163" stroke="#75282c" strokeWidth="2" />
          <path d="M22 36 Q50 54 78 34" stroke="#8b3438" strokeWidth="2.4" />
          <path d="M20 50 Q50 68 80 48" stroke="#e49b99" strokeWidth="2.2" />
          <path d="M34 20 Q56 48 40 78" stroke="#8b3438" strokeWidth="2.4" />
          <path d="M58 18 Q42 50 64 76" stroke="#eab0ad" strokeWidth="2" />
        </svg>
      );
    case 'ganchillo-madera':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <g transform="rotate(-42 50 50)">
            <rect x="44" y="28" width="12" height="58" rx="6" fill="#8b5328" stroke="#4f2b11" strokeWidth="1.8" />
            <rect x="46.5" y="10" width="7" height="22" rx="3" fill="#d8cfc4" stroke="#7d7267" strokeWidth="1.2" />
            <path d="M53.5 12 C56 8, 49 6, 48 12" stroke="#7d7267" strokeWidth="2.2" strokeLinecap="round" />
            <rect x="44" y="42" width="12" height="6" fill="#d9ad5b" />
          </g>
        </svg>
      );
    case 'tijeras-vintage':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="32" cy="72" r="12" stroke="#c8943e" strokeWidth="4.5" />
          <circle cx="68" cy="72" r="12" stroke="#c8943e" strokeWidth="4.5" />
          <path d="M38 62 L58 16" stroke="#d9b061" strokeWidth="5" strokeLinecap="round" />
          <path d="M62 62 L42 16" stroke="#b9832f" strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="42" r="3.5" fill="#fff0c9" stroke="#7c5218" strokeWidth="1.5" />
        </svg>
      );
    case 'granny-square':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <rect x="10" y="10" width="80" height="80" rx="8" fill="#f3dfbc" stroke="#b6874b" strokeWidth="3" strokeDasharray="4 3" />
          <rect x="22" y="22" width="56" height="56" rx="6" fill="#cb7576" stroke="#85373a" strokeWidth="2.5" strokeDasharray="4 2" />
          <circle cx="50" cy="50" r="16" fill="#7c9678" stroke="#475c43" strokeWidth="2" />
          <circle cx="50" cy="50" r="7" fill="#f2cf7c" />
        </svg>
      );
    case 'flor-margarita':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="50" r="42" stroke="#dcc08d" strokeWidth="2.5" strokeDasharray="3 3" />
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((d) => (
            <g key={d} transform={`rotate(${d} 50 50)`}>
              <ellipse cx="50" cy="23" rx="7" ry="18" fill="#fff7e5" stroke="#c3a474" strokeWidth="1.3" />
              <line x1="50" y1="12" x2="50" y2="33" stroke="#e4cfa6" strokeWidth="1.1" strokeDasharray="2 2" />
            </g>
          ))}
          <circle cx="50" cy="50" r="13" fill="#d99a32" stroke="#8d5c14" strokeWidth="1.6" />
          <circle cx="46" cy="47" r="2.2" fill="#f7da88" />
          <circle cx="54" cy="48" r="2" fill="#f7da88" />
          <circle cx="50" cy="54" r="2.2" fill="#f7da88" />
        </svg>
      );
    case 'flor-lavanda':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          {[40, 140, 220, 320].map((d) => (
            <ellipse
              key={d}
              cx="50"
              cy="19"
              rx="6"
              ry="13"
              transform={`rotate(${d} 50 50)`}
              fill="#6f8d68"
              stroke="#445c3f"
              strokeWidth="1.2"
            />
          ))}
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <g key={d} transform={`rotate(${d} 50 50)`}>
              <ellipse cx="50" cy="25" rx="11" ry="16" fill="#8b6ca8" stroke="#533770" strokeWidth="1.5" />
              <ellipse cx="50" cy="27" rx="6" ry="9" stroke="#d9c6eb" strokeWidth="1.1" strokeDasharray="2 2" />
            </g>
          ))}
          <circle cx="50" cy="50" r="10" fill="#e9c883" stroke="#996b27" strokeWidth="1.4" />
          <circle cx="50" cy="50" r="4.5" fill="#fff6e6" />
          <circle cx="48.5" cy="48.5" r="1.5" fill="#ffffff" />
        </svg>
      );
    case 'flor-girasol':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => (
            <ellipse
              key={d}
              cx="50"
              cy="20"
              rx="7.5"
              ry="16"
              transform={`rotate(${d} 50 50)`}
              fill={d % 60 === 0 ? '#e3a62e' : '#f1be46'}
              stroke="#9e6714"
              strokeWidth="1.2"
            />
          ))}
          <circle cx="50" cy="50" r="18" fill="#593218" stroke="#341a09" strokeWidth="1.8" />
          <circle cx="50" cy="50" r="13" stroke="#8d572e" strokeWidth="1.5" strokeDasharray="2 3" />
          <circle cx="50" cy="50" r="6" stroke="#b37846" strokeWidth="1.3" strokeDasharray="1.8 2" />
        </svg>
      );
    case 'flor-encaje-perla':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="50" r="43" stroke="#e4cda3" strokeWidth="3" strokeDasharray="4 3" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <g key={d} transform={`rotate(${d} 50 50)`}>
              <ellipse cx="50" cy="23" rx="10" ry="16" fill="#f7ebd2" stroke="#b98f58" strokeWidth="1.4" />
              <circle cx="50" cy="13" r="3.4" fill="#fff9ee" stroke="#bfa172" strokeWidth="0.9" />
              <circle cx="49" cy="12" r="1.1" fill="#ffffff" />
            </g>
          ))}
          <circle cx="50" cy="50" r="13" fill="#e2be84" stroke="#966a35" strokeWidth="1.4" />
          <circle cx="50" cy="50" r="8" fill="#fff7e8" stroke="#c7ab7c" strokeWidth="1" />
          <circle cx="47.5" cy="47.5" r="2.5" fill="#ffffff" />
        </svg>
      );
    case 'flor-cerezo':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          {[0, 72, 144, 216, 288].map((d) => (
            <g key={d} transform={`rotate(${d} 50 50)`}>
              <path
                d="M50 48 C34 38, 33 15, 46 13 L50 18 L54 13 C67 15, 66 38, 50 48 Z"
                fill="#f0b6bd"
                stroke="#b45a68"
                strokeWidth="1.5"
              />
              <line x1="50" y1="30" x2="50" y2="44" stroke="#c96b78" strokeWidth="1.3" strokeLinecap="round" />
            </g>
          ))}
          <circle cx="50" cy="50" r="9" fill="#9a3a4b" />
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <circle
              key={`st-${d}`}
              cx={50 + Math.cos((d * Math.PI) / 180) * 6.5}
              cy={50 + Math.sin((d * Math.PI) / 180) * 6.5}
              r="2.2"
              fill="#fff7e2"
            />
          ))}
          <circle cx="50" cy="50" r="3" fill="#f6d27a" />
        </svg>
      );
    case 'hoja-crochet':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path d="M22 80 Q50 52 78 20" stroke="#5b784e" strokeWidth="3.2" strokeLinecap="round" />
          <g transform="translate(36, 62) rotate(-32)">
            <ellipse cx="0" cy="-12" rx="9" ry="16" fill="#7c9f6b" stroke="#456138" strokeWidth="1.4" />
            <line x1="0" y1="0" x2="0" y2="-22" stroke="#bfd6b2" strokeWidth="1.2" strokeDasharray="2 2" />
          </g>
          <g transform="translate(55, 48) rotate(48)">
            <ellipse cx="0" cy="-12" rx="9" ry="16" fill="#6b8f5b" stroke="#415b35" strokeWidth="1.4" />
            <line x1="0" y1="0" x2="0" y2="-22" stroke="#bfd6b2" strokeWidth="1.2" strokeDasharray="2 2" />
          </g>
          <g transform="translate(65, 32) rotate(12)">
            <ellipse cx="0" cy="-10" rx="7" ry="12" fill="#8eb07c" stroke="#456138" strokeWidth="1.3" />
          </g>
          <circle cx="44" cy="56" r="4" fill="#fff7e4" stroke="#b99c6d" strokeWidth="1" />
          <circle cx="42.8" cy="54.8" r="1.3" fill="#ffffff" />
        </svg>
      );
    case 'perla-clasica':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="15" r="5.5" stroke="#d8a74d" strokeWidth="2.8" />
          <circle cx="50" cy="55" r="30" fill="#e5d4bb" stroke="#b8986b" strokeWidth="1.8" />
          <circle cx="47" cy="52" r="24" fill="#f7efe2" />
          <circle cx="43" cy="46" r="14" fill="#fffbf4" />
          <ellipse cx="38" cy="39" rx="6" ry="3.5" transform="rotate(-28 38 39)" fill="#ffffff" />
          <circle cx="62" cy="68" r="3.5" fill="#d3bd9f" opacity="0.6" />
        </svg>
      );
    case 'racimo-perlas':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="50" r="38" fill="#f4e6cb" stroke="#b78c52" strokeWidth="2" strokeDasharray="4 3" />
          <circle cx="50" cy="50" r="28" stroke="#c99f67" strokeWidth="1.2" strokeDasharray="2 2" />
          <circle cx="38" cy="58" r="14" fill="#efe2ce" stroke="#b4956c" strokeWidth="1.4" />
          <ellipse cx="34" cy="52" rx="4" ry="2.4" transform="rotate(-25 34 52)" fill="#ffffff" />
          <circle cx="62" cy="58" r="14" fill="#f4ead9" stroke="#b4956c" strokeWidth="1.4" />
          <ellipse cx="58" cy="52" rx="4" ry="2.4" transform="rotate(-25 58 52)" fill="#ffffff" />
          <circle cx="50" cy="38" r="16" fill="#fcf5ea" stroke="#b4956c" strokeWidth="1.5" />
          <ellipse cx="45" cy="31" rx="4.5" ry="2.6" transform="rotate(-25 45 31)" fill="#ffffff" />
        </svg>
      );
    case 'tira-perlas':
      return (
        <svg viewBox="0 0 120 70" className={className} fill="none">
          <path d="M10 38 Q60 12 110 38" stroke="#c79545" strokeWidth="2.4" strokeLinecap="round" />
          {[
            { x: 18, y: 34, r: 7.5 },
            { x: 38, y: 26, r: 9 },
            { x: 60, y: 23, r: 10.5 },
            { x: 82, y: 26, r: 9 },
            { x: 102, y: 34, r: 7.5 },
          ].map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r={p.r} fill="#f7eee0" stroke="#b39264" strokeWidth="1.3" />
              <circle cx={p.x - p.r * 0.3} cy={p.y - p.r * 0.3} r={p.r * 0.28} fill="#ffffff" />
            </g>
          ))}
          {[28, 49, 71, 92].map((gx, i) => (
            <circle key={i} cx={gx} cy={27} r="2.4" fill="#e6b75e" stroke="#996c23" strokeWidth="0.8" />
          ))}
        </svg>
      );
    case 'perla-rosa':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <circle
              key={d}
              cx={50 + Math.cos((d * Math.PI) / 180) * 34}
              cy={50 + Math.sin((d * Math.PI) / 180) * 34}
              r="7"
              fill="#d4a04a"
              stroke="#8b5d1c"
              strokeWidth="1.2"
            />
          ))}
          <circle cx="50" cy="50" r="29" fill="#f0c8ca" stroke="#b37176" strokeWidth="2" />
          <circle cx="47" cy="47" r="21" fill="#fae1e2" />
          <ellipse cx="40" cy="38" rx="6.5" ry="3.6" transform="rotate(-30 40 38)" fill="#ffffff" />
        </svg>
      );
    case 'broche-perla':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="50" r="40" fill="#b78238" stroke="#6f4712" strokeWidth="2" />
          <circle cx="50" cy="50" r="33" stroke="#f6d99a" strokeWidth="2" strokeDasharray="3 3" />
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((d) => (
            <circle
              key={d}
              cx={50 + Math.cos((d * Math.PI) / 180) * 26}
              cy={50 + Math.sin((d * Math.PI) / 180) * 26}
              r="3.2"
              fill="#fff4db"
              stroke="#996d2f"
              strokeWidth="0.8"
            />
          ))}
          <circle cx="50" cy="50" r="18" fill="#faf1e1" stroke="#a6814c" strokeWidth="1.5" />
          <ellipse cx="44" cy="43" rx="5.5" ry="3" transform="rotate(-30 44 43)" fill="#ffffff" />
        </svg>
      );
    case 'cuentas-arcoiris':
      return (
        <svg viewBox="0 0 110 90" className={className} fill="none">
          <path d="M12 48 Q55 76 98 48" stroke="#8b5d33" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="4 2" />
          {[
            { x: 20, y: 50, fill: '#d65d5b', stroke: '#872927' },
            { x: 37, y: 58, fill: '#eab24b', stroke: '#9b6b19' },
            { x: 55, y: 61, fill: '#6ca47e', stroke: '#346344' },
            { x: 73, y: 58, fill: '#578fc4', stroke: '#27537d' },
            { x: 90, y: 50, fill: '#9f6ab0', stroke: '#5d326b' },
          ].map((b, i) => (
            <g key={i}>
              <circle cx={b.x} cy={b.y} r="10.5" fill={b.fill} stroke={b.stroke} strokeWidth="1.6" />
              <circle cx={b.x - 3.2} cy={b.y - 3.2} r="2.6" fill="#ffffff" opacity="0.65" />
            </g>
          ))}
        </svg>
      );
    case 'cuentas-turquesa':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="50" r="34" stroke="#a67c4c" strokeWidth="2.8" strokeDasharray="3 2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d, i) => {
            const cx = 50 + Math.cos((d * Math.PI) / 180) * 34;
            const cy = 50 + Math.sin((d * Math.PI) / 180) * 34;
            const isTurq = i % 2 === 0;
            return (
              <g key={d}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isTurq ? 9.5 : 7.5}
                  fill={isTurq ? '#4ba8a6' : '#d66d5c'}
                  stroke={isTurq ? '#206362' : '#853226'}
                  strokeWidth="1.5"
                />
                <circle cx={cx - 2.5} cy={cy - 2.5} r="2.2" fill="#ffffff" opacity="0.7" />
              </g>
            );
          })}
          <circle cx="50" cy="50" r="11" fill="#e8c373" stroke="#966c22" strokeWidth="1.5" />
        </svg>
      );
    case 'cuenta-cristal':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <line x1="50" y1="8" x2="50" y2="92" stroke="#d19d47" strokeWidth="2.5" />
          {/* Top gold bead */}
          <circle cx="50" cy="22" r="7" fill="#e6b85e" stroke="#8e6019" strokeWidth="1.4" />
          {/* Faceted ruby diamond bead */}
          <polygon points="50,29 73,50 50,71 27,50" fill="#b4293d" stroke="#5e0d19" strokeWidth="1.8" />
          <polygon points="50,35 64,50 50,65 36,50" fill="#dc4e62" />
          <polygon points="50,35 64,50 50,50" fill="#f7a6b2" opacity="0.7" />
          {/* Bottom amber bead */}
          <circle cx="50" cy="79" r="8" fill="#e39d3b" stroke="#8a5211" strokeWidth="1.4" />
          <circle cx="47.5" cy="76.5" r="2.2" fill="#fff4cf" />
        </svg>
      );
    case 'cuentas-pastel':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="50" r="30" stroke="#cfb892" strokeWidth="2.2" />
          {[
            { deg: 0, fill: '#a6d8c5', stroke: '#55917a' },
            { deg: 60, fill: '#f4c2c7', stroke: '#ad6870' },
            { deg: 120, fill: '#f6df96', stroke: '#b2933b' },
            { deg: 180, fill: '#c8bae8', stroke: '#7664a3' },
            { deg: 240, fill: '#a9d2ed', stroke: '#5082a3' },
            { deg: 300, fill: '#f5ccb0', stroke: '#ae764f' },
          ].map((item) => {
            const cx = 50 + Math.cos((item.deg * Math.PI) / 180) * 30;
            const cy = 50 + Math.sin((item.deg * Math.PI) / 180) * 30;
            return (
              <g key={item.deg}>
                <circle cx={cx} cy={cy} r="10.5" fill={item.fill} stroke={item.stroke} strokeWidth="1.4" />
                <circle cx={cx - 3} cy={cy - 3} r="2.7" fill="#ffffff" opacity="0.8" />
              </g>
            );
          })}
        </svg>
      );
    case 'cascabel-dorado':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="14" r="5" stroke="#c8953e" strokeWidth="2.5" />
          <circle cx="50" cy="34" r="14" fill="#e2b45a" stroke="#8e5e18" strokeWidth="1.8" />
          <circle cx="45" cy="29" r="3.5" fill="#fff5cf" />
          <rect x="44" y="48" width="12" height="5" rx="2" fill="#8b3b40" />
          {[-10, -5, 0, 5, 10].map((dx) => (
            <line
              key={dx}
              x1={50 + dx * 0.5}
              y1="53"
              x2={50 + dx * 1.4}
              y2="88"
              stroke="#b55259"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          ))}
        </svg>
      );
    case 'marcapuntos-cuentas':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path
            d="M36 24 C36 10, 64 10, 64 24 C64 38, 48 44, 48 54"
            stroke="#d4a24c"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="48" cy="56" r="8" fill="#c75966" stroke="#78222d" strokeWidth="1.5" />
          <circle cx="48" cy="72" r="9.5" fill="#4f9b98" stroke="#225e5c" strokeWidth="1.5" />
          <circle cx="48" cy="88" r="6" fill="#f3e5cc" stroke="#a68a5c" strokeWidth="1.4" />
          <circle cx="45.5" cy="69.5" r="2.4" fill="#ffffff" opacity="0.7" />
        </svg>
      );
    case 'ovillo-salvia':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path d="M16 74 C30 92, 68 88, 86 76" stroke="#6d8d67" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="48" r="32" fill="#8fb088" stroke="#4f6e49" strokeWidth="2" />
          <path d="M22 36 Q50 54 78 34" stroke="#62825b" strokeWidth="2.4" />
          <path d="M20 50 Q50 68 80 48" stroke="#b6d1af" strokeWidth="2.2" />
          <path d="M32 22 Q56 48 40 78" stroke="#62825b" strokeWidth="2.4" />
          <path d="M58 18 Q42 50 64 76" stroke="#c3dec0" strokeWidth="2" />
        </svg>
      );
    case 'corazon-tejido':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path
            d="M50 84 C50 84 15 62 15 35 C15 21 26 14 37 14 C44 14 48 18 50 23 C52 18 56 14 63 14 C74 14 85 21 85 35 C85 62 50 84 50 84 Z"
            fill="#b64852"
            stroke="#6e1e26"
            strokeWidth="2.2"
          />
          <path
            d="M50 76 C50 76 22 57 22 36 C22 26 29 21 37 21 C43 21 48 25 50 30 C52 25 57 21 63 21 C71 21 78 26 78 36 C78 57 50 76 50 76 Z"
            stroke="#f4d9c0"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
        </svg>
      );
    case 'boton-madera':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="50" r="36" fill="#b57d46" stroke="#693e18" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="28" stroke="#855225" strokeWidth="2" />
          <circle cx="40" cy="40" r="4" fill="#3b2009" />
          <circle cx="60" cy="40" r="4" fill="#3b2009" />
          <circle cx="40" cy="60" r="4" fill="#3b2009" />
          <circle cx="60" cy="60" r="4" fill="#3b2009" />
          <line x1="40" y1="40" x2="60" y2="60" stroke="#f7ebd2" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="60" y1="40" x2="40" y2="60" stroke="#f7ebd2" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      );
    case 'etiqueta-hecho-a-mano':
    default:
      return (
        <svg viewBox="0 0 140 70" className={className} fill="none">
          <rect x="4" y="8" width="132" height="54" rx="10" fill="#efe0c2" stroke="#8a5a2b" strokeWidth="2" strokeDasharray="5 3" />
          <circle cx="18" cy="35" r="4" fill="#8a5a2b" />
          <circle cx="122" cy="35" r="4" fill="#8a5a2b" />
          <text
            x="70"
            y="32"
            textAnchor="middle"
            fill="#562c13"
            fontSize="12"
            fontFamily="Cormorant Garamond, serif"
            fontWeight="700"
          >
            HECHO A MANO
          </text>
          <text
            x="70"
            y="48"
            textAnchor="middle"
            fill="#8b3b40"
            fontSize="10"
            fontFamily="Caveat, cursive"
          >
            con hilo y paciencia
          </text>
        </svg>
      );
  }
});
