import React from 'react';

export const CrochetLaceTrim: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 240 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Scalloped crochet lace loops */}
    {[0, 40, 80, 120, 160, 200].map((x) => (
      <g key={x} transform={`translate(${x}, 0)`}>
        <path
          d="M2 6 C10 20, 30 20, 38 6"
          stroke="#e8c896"
          strokeWidth="1.8"
          strokeDasharray="2.5 2"
        />
        <circle cx="20" cy="21" r="9.5" stroke="#d8b077" strokeWidth="1.6" strokeDasharray="3 2" />
        <circle cx="20" cy="21" r="4" stroke="#f0d7ad" strokeWidth="1.4" />
        <path
          d="M8 29 Q20 42 32 29"
          stroke="#e8c896"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="20" cy="36" r="2.2" fill="#f3dfc0" />
      </g>
    ))}
  </svg>
);

export const CornerCrochetFlower: React.FC<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}> = ({ position, className = '' }) => {
  const rotation =
    position === 'top-left'
      ? 'rotate-0'
      : position === 'top-right'
        ? 'rotate-90'
        : position === 'bottom-right'
          ? 'rotate-180'
          : '-rotate-90';

  return (
    <svg
      viewBox="0 0 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${rotation} ${className} pointer-events-none select-none`}
      aria-hidden="true"
    >
      {/* Golden scroll vines */}
      <path
        d="M12 88 C14 54, 18 32, 34 18 C48 6, 72 10, 92 14"
        stroke="#b8843e"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M18 68 C26 52, 40 44, 52 24"
        stroke="#c9964e"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Cream lace doily behind flower */}
      <circle cx="34" cy="34" r="22" stroke="#e2caa0" strokeWidth="2.4" strokeDasharray="3 3" />
      <circle cx="34" cy="34" r="16" stroke="#c89e64" strokeWidth="1.2" strokeDasharray="2 2" />
      {/* 6 crochet petals in vintage rose / burgundy */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 34 34)`}>
          <ellipse
            cx="34"
            cy="20"
            rx="6.2"
            ry="9.5"
            fill="#c7686b"
            stroke="#7d2b32"
            strokeWidth="1.1"
          />
          <ellipse cx="34" cy="21" rx="3.2" ry="5.5" stroke="#f0b6b3" strokeWidth="0.9" strokeDasharray="1.8 1.4" />
        </g>
      ))}
      {/* Pearl cluster center */}
      <circle cx="34" cy="34" r="5.5" fill="#7d2b32" />
      <circle cx="34" cy="34" r="3" fill="#fff5df" />
      <circle cx="32.5" cy="32.5" r="1" fill="#ffffff" />
      {/* Small secondary blossom */}
      <g transform="translate(56, 18)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="0"
            cy="-7"
            rx="3.5"
            ry="5"
            transform={`rotate(${deg})`}
            fill="#e9cfa4"
            stroke="#9b6c37"
            strokeWidth="0.9"
          />
        ))}
        <circle cx="0" cy="0" r="2.6" fill="#9a4448" />
      </g>
    </svg>
  );
};

export const BrassBinderRings: React.FC = () => (
  <div
    className="pointer-events-none absolute inset-y-6 left-1/2 -translate-x-1/2 z-20 flex flex-col justify-between py-6"
    aria-hidden="true"
  >
    {[0, 1, 2, 3, 4, 5].map((idx) => (
      <div key={idx} className="relative flex items-center justify-center">
        {/* Left hole punch */}
        <span className="w-2.5 h-2.5 rounded-full bg-[#3a2010] shadow-inner -mr-1 border border-[#966a35]/50" />
        {/* Brass ring */}
        <div
          className="w-10 h-3.5 rounded-full border-[2.5px] border-[#e7bc6c] shadow-[0_3px_5px_rgba(0,0,0,0.45)]"
          style={{
            background:
              'linear-gradient(180deg, #fff1ba 0%, #c7903d 48%, #704919 100%)',
          }}
        />
        {/* Right hole punch */}
        <span className="w-2.5 h-2.5 rounded-full bg-[#3a2010] shadow-inner -ml-1 border border-[#966a35]/50" />
      </div>
    ))}
  </div>
);

export const CrochetStickerSvg: React.FC<{ id: string; className?: string }> = ({
  id,
  className = 'w-20 h-20',
}) => {
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
};
