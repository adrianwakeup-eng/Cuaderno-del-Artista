import React, { memo } from 'react';
import { CROCHET_MANDALAS, type CrochetMandalaDef } from '../data/crochetMandalas';

const MANDALA_MAP = new Map<string, CrochetMandalaDef>(
  CROCHET_MANDALAS.map((m) => [m.id, m])
);

export const MandalaNavIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="2.2" />
    <circle cx="12" cy="12" r="5.6" strokeDasharray="2 1.6" />
    <circle cx="12" cy="12" r="9.6" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
      <g key={deg} transform={`rotate(${deg} 12 12)`}>
        <path d="M12 6.4 C10.7 4.4, 10.9 2.7, 12 1.9 C13.1 2.7, 13.3 4.4, 12 6.4 Z" />
        <circle cx="12" cy="8.2" r="0.55" fill="currentColor" stroke="none" />
      </g>
    ))}
  </svg>
);

export const CrochetMandalaSvg: React.FC<{
  mandalaId: string;
  color?: string;
  className?: string;
}> = memo(({ mandalaId, color, className = 'w-full h-full' }) => {
  const def = MANDALA_MAP.get(mandalaId) ?? CROCHET_MANDALAS[0];
  const [c1, c2, c3, c4, c5, c6] = color
    ? [color, color, color, color, color, color]
    : def.palette;

  const step = 360 / def.petals;
  const halfStep = step / 2;
  const angles = Array.from({ length: def.petals }, (_, i) => i * step);
  const subAngles = Array.from({ length: def.petals * 2 }, (_, i) => i * halfStep);

  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Subtle warm yarn halo behind the sample */}
      <circle cx="100" cy="100" r="88" fill={c4} fillOpacity="0.06" />
      <circle
        cx="100"
        cy="100"
        r="86"
        stroke={c5}
        strokeWidth="1.2"
        strokeOpacity="0.35"
        strokeDasharray="3 2.5"
      />
      <circle
        cx="100"
        cy="100"
        r="69"
        stroke={c4}
        strokeWidth="1.4"
        strokeOpacity="0.45"
        strokeDasharray="2.5 2"
      />
      <circle
        cx="100"
        cy="100"
        r="41"
        stroke={c2}
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
      <circle
        cx="100"
        cy="100"
        r="22"
        stroke={c1}
        strokeWidth="1.6"
        strokeOpacity="0.7"
      />

      {/* ROUND 5: Outer Crochet Edging (r = 72..96) */}
      {angles.map((deg) => {
        if (def.outerBorder === 'lotus') {
          return (
            <g key={`ob-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M84 28 C89 10, 111 10, 116 28 C108 24, 92 24, 84 28 Z"
                fill={c5}
                fillOpacity="0.32"
                stroke={c5}
                strokeWidth="2.1"
                strokeLinejoin="round"
              />
              <path
                d="M91 25 C95 14, 105 14, 109 25"
                stroke={c6}
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <circle cx="100" cy="10" r="3" fill={c6} stroke={c5} strokeWidth="1.3" />
              <circle cx="85" cy="26" r="1.8" fill={c4} />
            </g>
          );
        }
        if (def.outerBorder === 'crown') {
          return (
            <g key={`ob-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M84 29 L91 14 L100 22 L109 14 L116 29 Z"
                fill={c5}
                fillOpacity="0.28"
                stroke={c5}
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle cx="91" cy="12.5" r="2.2" fill={c6} />
              <circle cx="109" cy="12.5" r="2.2" fill={c6} />
              <circle cx="100" cy="9.5" r="2.8" fill={c1} stroke={c6} strokeWidth="1.2" />
            </g>
          );
        }
        if (def.outerBorder === 'triple-picot') {
          return (
            <g key={`ob-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M83 28 Q100 14 117 28"
                stroke={c5}
                strokeWidth="2.2"
                fill={c5}
                fillOpacity="0.16"
                strokeLinecap="round"
              />
              <circle cx="91" cy="16" r="2.6" fill={c6} fillOpacity="0.35" stroke={c5} strokeWidth="1.5" />
              <circle cx="100" cy="10.5" r="3.2" fill={c6} fillOpacity="0.55" stroke={c5} strokeWidth="1.6" />
              <circle cx="109" cy="16" r="2.6" fill={c6} fillOpacity="0.35" stroke={c5} strokeWidth="1.5" />
            </g>
          );
        }
        if (def.outerBorder === 'picot') {
          return (
            <g key={`ob-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M84 28 Q100 12 116 28"
                stroke={c5}
                strokeWidth="2.2"
                fill={c6}
                fillOpacity="0.18"
                strokeLinecap="round"
              />
              <circle cx="100" cy="11.5" r="3.4" stroke={c5} strokeWidth="1.8" fill={c6} fillOpacity="0.45" />
              <circle cx="84" cy="28" r="2" fill={c4} />
            </g>
          );
        }
        if (def.outerBorder === 'scallop') {
          return (
            <g key={`ob-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M82 30 C88 10, 112 10, 118 30"
                stroke={c5}
                strokeWidth="2.3"
                strokeLinecap="round"
                fill={c5}
                fillOpacity="0.22"
              />
              <path
                d="M88 28 C93 17, 107 17, 112 28"
                stroke={c6}
                strokeWidth="1.6"
                strokeDasharray="2.5 1.8"
              />
              <circle cx="100" cy="14" r="2.2" fill={c6} />
            </g>
          );
        }
        if (def.outerBorder === 'pointed') {
          return (
            <g key={`ob-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M84 31 L100 8 L116 31 Z"
                stroke={c5}
                strokeWidth="2.1"
                fill={c5}
                fillOpacity="0.2"
                strokeLinejoin="round"
              />
              <line x1="100" y1="12" x2="100" y2="30" stroke={c6} strokeWidth="1.6" />
              <circle cx="100" cy="7" r="2.5" fill={c6} stroke={c5} strokeWidth="1.1" />
            </g>
          );
        }
        if (def.outerBorder === 'fan') {
          return (
            <g key={`ob-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M83 30 Q100 7 117 30 Z"
                stroke={c5}
                strokeWidth="2"
                fill={c5}
                fillOpacity="0.2"
              />
              <line x1="100" y1="33" x2="91" y2="17" stroke={c5} strokeWidth="1.5" strokeLinecap="round" />
              <line x1="100" y1="33" x2="100" y2="13" stroke={c6} strokeWidth="1.8" strokeLinecap="round" />
              <line x1="100" y1="33" x2="109" y2="17" stroke={c5} strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="100" cy="12" r="2" fill={c6} />
            </g>
          );
        }
        // 'beaded'
        return (
          <g key={`ob-${deg}`} transform={`rotate(${deg} 100 100)`}>
            <path
              d="M83 29 Q100 16 117 29"
              stroke={c5}
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <circle cx="100" cy="14" r="4.2" fill={c6} fillOpacity="0.4" stroke={c5} strokeWidth="1.8" />
            <circle cx="100" cy="14" r="1.7" fill={c1} />
          </g>
        );
      })}

      {/* ROUND 4: Crochet Lace Transition Band (r = 62..74) */}
      {subAngles.map((deg, idx) => {
        const useAlt = idx % 2 === 0;
        if (def.ring4Style === 'double-arch') {
          return (
            <g key={`r4-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M91 36 Q100 24 109 36"
                stroke={useAlt ? c4 : c5}
                strokeWidth="1.8"
                fill={c4}
                fillOpacity="0.14"
              />
            </g>
          );
        }
        if (def.ring4Style === 'v-stitch') {
          return (
            <g key={`r4-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M94 37 L100 27 L106 37"
                stroke={useAlt ? c4 : c6}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="100" cy="26" r="1.5" fill={c5} />
            </g>
          );
        }
        if (def.ring4Style === 'spikes') {
          return (
            <g key={`r4-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <line
                x1="100"
                y1="40"
                x2="100"
                y2="25"
                stroke={useAlt ? c4 : c6}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="100" cy="24" r="1.8" fill={c5} />
            </g>
          );
        }
        if (def.ring4Style === 'waves') {
          return (
            <g key={`r4-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M90 34 C94 26, 106 26, 110 34"
                stroke={useAlt ? c4 : c6}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          );
        }
        if (def.ring4Style === 'beads') {
          return (
            <g key={`r4-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <circle
                cx="100"
                cy="31"
                r="2.8"
                fill={useAlt ? c4 : c6}
                fillOpacity="0.45"
                stroke={c4}
                strokeWidth="1.3"
              />
            </g>
          );
        }
        // 'chain-lace'
        return (
          <g key={`r4-${deg}`} transform={`rotate(${deg} 100 100)`}>
            <ellipse
              cx="100"
              cy="31"
              rx="3.8"
              ry="2.1"
              stroke={useAlt ? c4 : c5}
              strokeWidth="1.5"
              fill={c6}
              fillOpacity="0.16"
            />
          </g>
        );
      })}

      {/* ROUND 3: Main Mid-Layer Crochet Motifs (r = 38..66) */}
      {angles.map((deg) => {
        if (def.midLayer === 'pineapples') {
          return (
            <g key={`mid-${deg}`} transform={`rotate(${deg + halfStep} 100 100)`}>
              <path
                d="M100 66 C87 56, 88 37, 100 32 C112 37, 113 56, 100 66 Z"
                fill={c3}
                fillOpacity="0.28"
                stroke={c3}
                strokeWidth="2"
              />
              <path
                d="M93 52 L107 43 M93 43 L107 52"
                stroke={c4}
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="36" r="2.2" fill={c6} />
            </g>
          );
        }
        if (def.midLayer === 'fans') {
          return (
            <g key={`mid-${deg}`} transform={`rotate(${deg + halfStep} 100 100)`}>
              <path
                d="M100 66 L85 41 Q100 29 115 41 Z"
                fill={c3}
                fillOpacity="0.26"
                stroke={c3}
                strokeWidth="1.9"
                strokeLinejoin="round"
              />
              <line x1="100" y1="64" x2="93" y2="39" stroke={c4} strokeWidth="1.3" />
              <line x1="100" y1="64" x2="100" y2="36" stroke={c6} strokeWidth="1.6" />
              <line x1="100" y1="64" x2="107" y2="39" stroke={c4} strokeWidth="1.3" />
            </g>
          );
        }
        if (def.midLayer === 'arches') {
          return (
            <g key={`mid-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M82 58 Q100 29 118 58"
                stroke={c3}
                strokeWidth="2.4"
                fill={c3}
                fillOpacity="0.16"
                strokeLinecap="round"
              />
              <path
                d="M88 60 Q100 40 112 60"
                stroke={c4}
                strokeWidth="1.8"
                strokeDasharray="2.5 1.8"
              />
            </g>
          );
        }
        if (def.midLayer === 'shells') {
          return (
            <g key={`mid-${deg}`} transform={`rotate(${deg + halfStep} 100 100)`}>
              <path
                d="M100 66 C85 53, 86 33, 100 33 C114 33, 115 53, 100 66 Z"
                stroke={c3}
                strokeWidth="2.1"
                fill={c3}
                fillOpacity="0.28"
              />
              <path
                d="M100 62 C92 52, 92 39, 100 39 C108 39, 108 52, 100 62 Z"
                stroke={c4}
                strokeWidth="1.4"
                fill={c6}
                fillOpacity="0.25"
              />
              <line x1="100" y1="60" x2="100" y2="36" stroke={c2} strokeWidth="1.4" />
            </g>
          );
        }
        if (def.midLayer === 'diamonds') {
          return (
            <g key={`mid-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M100 31 L111 48 L100 65 L89 48 Z"
                stroke={c3}
                strokeWidth="2"
                fill={c3}
                fillOpacity="0.26"
                strokeLinejoin="round"
              />
              <path
                d="M100 39 L105.5 48 L100 57 L94.5 48 Z"
                fill={c6}
                fillOpacity="0.45"
                stroke={c4}
                strokeWidth="1.2"
              />
            </g>
          );
        }
        if (def.midLayer === 'leaves') {
          return (
            <g key={`mid-${deg}`} transform={`rotate(${deg + halfStep} 100 100)`}>
              <path
                d="M100 66 Q88 49 100 31 Q112 49 100 66 Z"
                stroke={c3}
                strokeWidth="2.1"
                fill={c3}
                fillOpacity="0.3"
              />
              <line x1="100" y1="63" x2="100" y2="35" stroke={c6} strokeWidth="1.5" strokeLinecap="round" />
              <path d="M100 52 L94 46 M100 46 L106 41" stroke={c4} strokeWidth="1.2" strokeLinecap="round" />
            </g>
          );
        }
        if (def.midLayer === 'popcorns') {
          return (
            <g key={`mid-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <line x1="100" y1="66" x2="100" y2="46" stroke={c4} strokeWidth="2" />
              <ellipse
                cx="100"
                cy="42"
                rx="7.2"
                ry="9.2"
                fill={c3}
                fillOpacity="0.38"
                stroke={c3}
                strokeWidth="2"
              />
              <ellipse cx="100" cy="42" rx="3.4" ry="4.5" fill={c6} fillOpacity="0.6" />
              <path d="M96 38 L104 46 M104 38 L96 46" stroke={c1} strokeWidth="1.3" strokeLinecap="round" />
            </g>
          );
        }
        // 'lattice'
        return (
          <g key={`mid-${deg}`} transform={`rotate(${deg} 100 100)`}>
            <line x1="100" y1="66" x2="89" y2="37" stroke={c3} strokeWidth="1.8" strokeLinecap="round" />
            <line x1="100" y1="66" x2="111" y2="37" stroke={c3} strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="100" cy="44" r="4" fill={c6} fillOpacity="0.4" stroke={c4} strokeWidth="1.6" />
          </g>
        );
      })}

      {/* ROUND 2: Inner Crochet Corona (r = 21..41) */}
      {angles.map((deg) => {
        if (def.ring2Style === 'tulips') {
          return (
            <g key={`r2-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M94 76 C93 66, 97 60, 100 64 C103 60, 107 66, 106 76 Z"
                fill={c2}
                fillOpacity="0.38"
                stroke={c2}
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="100" cy="61" r="1.8" fill={c6} />
            </g>
          );
        }
        if (def.ring2Style === 'spokes') {
          return (
            <g key={`r2-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <line x1="100" y1="79" x2="100" y2="60" stroke={c2} strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="100" cy="60" r="2.8" fill={c6} stroke={c2} strokeWidth="1.3" />
            </g>
          );
        }
        if (def.ring2Style === 'chevron') {
          return (
            <g key={`r2-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <path
                d="M91 75 L100 60 L109 75"
                stroke={c2}
                strokeWidth="2.1"
                fill={c2}
                fillOpacity="0.2"
                strokeLinejoin="round"
              />
            </g>
          );
        }
        if (def.ring2Style === 'braid') {
          return (
            <g key={`r2-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <ellipse
                cx="100"
                cy="69"
                rx="4.6"
                ry="8.5"
                transform="rotate(14 100 69)"
                fill={c2}
                fillOpacity="0.3"
                stroke={c2}
                strokeWidth="1.7"
              />
            </g>
          );
        }
        if (def.ring2Style === 'clusters') {
          return (
            <g key={`r2-${deg}`} transform={`rotate(${deg} 100 100)`}>
              <circle cx="96.5" cy="68" r="3.4" fill={c2} fillOpacity="0.38" stroke={c2} strokeWidth="1.5" />
              <circle cx="103.5" cy="68" r="3.4" fill={c6} fillOpacity="0.45" stroke={c2} strokeWidth="1.5" />
              <circle cx="100" cy="62.5" r="3.4" fill={c2} fillOpacity="0.52" stroke={c2} strokeWidth="1.5" />
            </g>
          );
        }
        // 'petals'
        return (
          <g key={`r2-${deg}`} transform={`rotate(${deg} 100 100)`}>
            <path
              d="M100 79 C91 71, 93 59, 100 59 C107 59, 109 71, 100 79 Z"
              fill={c2}
              fillOpacity="0.35"
              stroke={c2}
              strokeWidth="1.8"
            />
          </g>
        );
      })}

      {/* ROUND 1: Center Magic Ring & Rosette (r = 0..22) */}
      {def.centerStyle === 'puff-flower' && (
        <g>
          {angles.map((deg) => (
            <ellipse
              key={`c-${deg}`}
              cx="100"
              cy="84"
              rx="4.8"
              ry="9.5"
              transform={`rotate(${deg} 100 100)`}
              fill={c1}
              fillOpacity="0.45"
              stroke={c1}
              strokeWidth="1.8"
            />
          ))}
          <circle cx="100" cy="100" r="8.5" fill={c6} fillOpacity="0.7" stroke={c1} strokeWidth="2.1" />
          <circle cx="100" cy="100" r="3.6" fill={c1} />
        </g>
      )}

      {def.centerStyle === 'flower' && (
        <g>
          {angles.map((deg) => (
            <ellipse
              key={`c-${deg}`}
              cx="100"
              cy="83"
              rx="5.4"
              ry="10.5"
              transform={`rotate(${deg} 100 100)`}
              stroke={c1}
              strokeWidth="1.9"
              fill={c1}
              fillOpacity="0.34"
            />
          ))}
          <circle cx="100" cy="100" r="9" fill={c6} fillOpacity="0.55" stroke={c1} strokeWidth="2.2" />
          <circle cx="100" cy="100" r="4" fill={c1} />
        </g>
      )}

      {def.centerStyle === 'star' && (
        <g>
          {angles.map((deg) => (
            <path
              key={`c-${deg}`}
              d="M95.5 92 L100 74 L104.5 92"
              transform={`rotate(${deg} 100 100)`}
              stroke={c1}
              strokeWidth="2"
              fill={c6}
              fillOpacity="0.42"
              strokeLinejoin="round"
            />
          ))}
          <circle cx="100" cy="100" r="8" stroke={c1} strokeWidth="2" fill={c1} fillOpacity="0.35" />
          <circle cx="100" cy="100" r="3.4" fill={c6} />
        </g>
      )}

      {def.centerStyle === 'ring' && (
        <g>
          <circle cx="100" cy="100" r="21" stroke={c1} strokeWidth="2.1" strokeDasharray="3.2 2" />
          <circle cx="100" cy="100" r="13.5" stroke={c1} strokeWidth="2.2" fill={c6} fillOpacity="0.25" />
          {angles.map((deg) => (
            <line
              key={`c-${deg}`}
              x1="100"
              y1="86.5"
              x2="100"
              y2="78"
              transform={`rotate(${deg} 100 100)`}
              stroke={c1}
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          ))}
          <circle cx="100" cy="100" r="5" fill={c1} />
        </g>
      )}

      {def.centerStyle === 'sun' && (
        <g>
          <circle cx="100" cy="100" r="14" fill={c6} fillOpacity="0.42" stroke={c1} strokeWidth="2.2" />
          {angles.map((deg) => (
            <path
              key={`c-${deg}`}
              d="M96.5 86 L100 72.5 L103.5 86"
              transform={`rotate(${deg} 100 100)`}
              stroke={c1}
              strokeWidth="1.9"
              fill={c1}
              fillOpacity="0.28"
              strokeLinejoin="round"
            />
          ))}
          <circle cx="100" cy="100" r="6.5" stroke={c1} strokeWidth="1.8" strokeDasharray="2.2 1.6" />
          <circle cx="100" cy="100" r="3" fill={c1} />
        </g>
      )}

      {def.centerStyle === 'spiral' && (
        <g>
          <circle cx="100" cy="100" r="20" stroke={c6} strokeWidth="1.8" strokeDasharray="3 2" fill={c1} fillOpacity="0.12" />
          <path
            d="M100 100 C104 100, 105 95, 101 92.5 C95 90, 90 96, 92.5 102.5 C96 110, 107 110, 111 101 C115 90, 103 80, 92.5 84.5 C82 89.5, 81 106, 91 113.5"
            stroke={c1}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="3.4" fill={c6} stroke={c1} strokeWidth="1.4" />
        </g>
      )}
    </svg>
  );
});
CrochetMandalaSvg.displayName = 'CrochetMandalaSvg';
