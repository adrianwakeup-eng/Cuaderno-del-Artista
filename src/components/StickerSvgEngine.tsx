import React from 'react';
import type { StickerRecipe } from '../data/crochetStickersCatalog';

function angleList(count: number): number[] {
  return Array.from({ length: count }, (_, idx) => (idx * 360) / count);
}

export const ParametricCrochetSticker: React.FC<{
  recipe: StickerRecipe;
  className?: string;
}> = React.memo(({ recipe, className = 'w-20 h-20' }) => {
  switch (recipe.kind) {
    case 'rosette': {
      const angles = angleList(recipe.petals);
      const rx = recipe.petals >= 10 ? 9 : recipe.petals === 8 ? 10.5 : 13;
      const ry = recipe.petals >= 10 ? 17 : 18;
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          {recipe.laceRing && (
            <circle
              cx="50"
              cy="50"
              r="43"
              stroke={recipe.laceRing}
              strokeWidth="3.2"
              strokeDasharray="4 3"
            />
          )}
          {angles.map((d) => (
            <ellipse
              key={d}
              cx="50"
              cy="24"
              rx={rx}
              ry={ry}
              transform={`rotate(${d} 50 50)`}
              fill={recipe.petalFill}
              stroke={recipe.petalStroke}
              strokeWidth="1.5"
            />
          ))}
          {angles.map((d) => (
            <ellipse
              key={`in-${d}`}
              cx="50"
              cy="28"
              rx={rx * 0.54}
              ry={ry * 0.56}
              transform={`rotate(${d} 50 50)`}
              stroke={recipe.stitchColor}
              strokeWidth="1.2"
              strokeDasharray="2 2"
            />
          ))}
          <circle
            cx="50"
            cy="50"
            r="12"
            fill={recipe.centerFill}
            stroke={recipe.petalStroke}
            strokeWidth="1.4"
          />
          <circle cx="50" cy="50" r="6.5" fill={recipe.centerCore} />
          <circle cx="48" cy="48" r="2" fill="#ffffff" />
        </svg>
      );
    }

    case 'mandala-flower': {
      const outer = angleList(12);
      const inner = angleList(6);
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke={recipe.innerColor}
            strokeWidth="2.5"
            strokeDasharray="3 3"
          />
          {outer.map((d) => (
            <ellipse
              key={`out-${d}`}
              cx="50"
              cy="20"
              rx="8"
              ry="16"
              transform={`rotate(${d} 50 50)`}
              fill={recipe.outerColor}
              stroke={recipe.outerStroke}
              strokeWidth="1.3"
            />
          ))}
          {inner.map((d) => (
            <g key={`in-${d}`} transform={`rotate(${d + 15} 50 50)`}>
              <ellipse
                cx="50"
                cy="30"
                rx="9.5"
                ry="13"
                fill={recipe.innerColor}
                stroke={recipe.innerStroke}
                strokeWidth="1.4"
              />
              <ellipse
                cx="50"
                cy="32"
                rx="4.8"
                ry="7"
                stroke={recipe.stitchColor}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          ))}
          <circle
            cx="50"
            cy="50"
            r="12"
            fill={recipe.centerFill}
            stroke={recipe.outerStroke}
            strokeWidth="1.5"
          />
          {recipe.pearlCenter ? (
            <>
              <circle cx="50" cy="50" r="6.5" fill="#fff7e8" stroke="#bfa172" strokeWidth="1" />
              <circle cx="48" cy="48" r="2" fill="#ffffff" />
            </>
          ) : (
            <circle cx="50" cy="50" r="5" fill={recipe.stitchColor} />
          )}
        </svg>
      );
    }

    case 'dahlia': {
      const angles = angleList(recipe.petals);
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          {recipe.leafColor &&
            [35, 145, 215, 325].map((d) => (
              <ellipse
                key={`lf-${d}`}
                cx="50"
                cy="16"
                rx="6.5"
                ry="13"
                transform={`rotate(${d} 50 50)`}
                fill={recipe.leafColor}
                stroke="#354d2b"
                strokeWidth="1.2"
              />
            ))}
          {angles.map((d) => (
            <g key={d} transform={`rotate(${d} 50 50)`}>
              <path
                d="M50 48 C41 34, 42 15, 50 9 C58 15, 59 34, 50 48 Z"
                fill={recipe.petalColor}
                stroke={recipe.petalStroke}
                strokeWidth="1.3"
              />
              <path
                d="M50 32 C46 22, 47 14, 50 11 C53 14, 54 22, 50 32 Z"
                fill={recipe.petalTip}
                opacity="0.82"
              />
            </g>
          ))}
          <circle
            cx="50"
            cy="50"
            r="13.5"
            fill={recipe.centerFill}
            stroke={recipe.petalStroke}
            strokeWidth="1.5"
          />
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <circle
              key={`dot-${d}`}
              cx={50 + Math.cos((d * Math.PI) / 180) * 6.5}
              cy={50 + Math.sin((d * Math.PI) / 180) * 6.5}
              r="1.9"
              fill={recipe.centerDots}
            />
          ))}
          <circle cx="50" cy="50" r="2.4" fill={recipe.centerDots} />
        </svg>
      );
    }

    case 'granny': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <g transform={recipe.diamond ? 'rotate(45 50 50) scale(0.76) translate(15.5 15.5)' : undefined}>
            <rect
              x="10"
              y="10"
              width="80"
              height="80"
              rx="10"
              fill={recipe.outerFill}
              stroke={recipe.outerStroke}
              strokeWidth="3"
              strokeDasharray="4 3"
            />
            <rect
              x="21"
              y="21"
              width="58"
              height="58"
              rx="7"
              fill={recipe.midFill}
              stroke={recipe.midStroke}
              strokeWidth="2.4"
              strokeDasharray="4 2"
            />
            <circle
              cx="50"
              cy="50"
              r="17"
              fill={recipe.innerFill}
              stroke={recipe.innerStroke}
              strokeWidth="2"
            />
            <circle cx="50" cy="50" r="8" fill={recipe.coreFill} />
            <circle cx="48" cy="48" r="2.2" fill="#ffffff" opacity="0.8" />
            {recipe.cornerPearls &&
              [
                [19, 19],
                [81, 19],
                [19, 81],
                [81, 81],
              ].map(([cx, cy], idx) => (
                <g key={idx}>
                  <circle cx={cx} cy={cy} r="4.2" fill="#fff8ec" stroke="#b39262" strokeWidth="1" />
                  <circle cx={cx - 1.2} cy={cy - 1.2} r="1.2" fill="#ffffff" />
                </g>
              ))}
          </g>
        </svg>
      );
    }

    case 'botanical': {
      if (recipe.variant === 'clover') {
        return (
          <svg viewBox="0 0 100 100" className={className} fill="none">
            <path d="M50 52 Q52 74 44 89" stroke={recipe.stemColor} strokeWidth="3.5" strokeLinecap="round" />
            {[0, 90, 180, 270].map((d) => (
              <g key={d} transform={`rotate(${d} 50 48)`}>
                <circle cx="44" cy="27" r="11" fill={d % 180 === 0 ? recipe.leafMain : recipe.leafAlt} stroke={recipe.leafStroke} strokeWidth="1.4" />
                <circle cx="56" cy="27" r="11" fill={d % 180 === 0 ? recipe.leafMain : recipe.leafAlt} stroke={recipe.leafStroke} strokeWidth="1.4" />
                <polygon points="40,34 60,34 50,48" fill={d % 180 === 0 ? recipe.leafMain : recipe.leafAlt} />
                <line x1="50" y1="24" x2="50" y2="43" stroke={recipe.accentColor} strokeWidth="1.2" strokeDasharray="2 2" />
              </g>
            ))}
            <circle cx="50" cy="48" r="5" fill={recipe.accentColor} stroke={recipe.leafStroke} strokeWidth="1.2" />
          </svg>
        );
      }
      if (recipe.variant === 'lavender-stalk') {
        return (
          <svg viewBox="0 0 100 100" className={className} fill="none">
            <path d="M24 84 Q50 56 76 16" stroke={recipe.stemColor} strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="34" cy="70" rx="6" ry="14" transform="rotate(-35 34 70)" fill={recipe.leafMain} stroke={recipe.leafStroke} strokeWidth="1.3" />
            <ellipse cx="44" cy="75" rx="6" ry="14" transform="rotate(62 44 75)" fill={recipe.leafAlt} stroke={recipe.leafStroke} strokeWidth="1.3" />
            {[
              [74, 20],
              [67, 26],
              [73, 30],
              [61, 34],
              [68, 38],
              [55, 42],
              [62, 46],
              [49, 51],
              [56, 55],
            ].map(([cx, cy], idx) => (
              <g key={idx}>
                <ellipse
                  cx={cx}
                  cy={cy}
                  rx="5.5"
                  ry="7.5"
                  transform={`rotate(28 ${cx} ${cy})`}
                  fill={recipe.accentColor}
                  stroke={recipe.leafStroke}
                  strokeWidth="1.1"
                />
                <circle cx={cx - 1.5} cy={cy - 2} r="1.4" fill="#ffffff" opacity="0.55" />
              </g>
            ))}
          </svg>
        );
      }
      if (recipe.variant === 'berry-twig') {
        return (
          <svg viewBox="0 0 100 100" className={className} fill="none">
            <path d="M20 82 Q50 56 80 22" stroke={recipe.stemColor} strokeWidth="3.2" strokeLinecap="round" />
            <ellipse cx="38" cy="56" rx="9" ry="17" transform="rotate(-35 38 56)" fill={recipe.leafMain} stroke={recipe.leafStroke} strokeWidth="1.4" />
            <ellipse cx="62" cy="50" rx="9" ry="17" transform="rotate(42 62 50)" fill={recipe.leafAlt} stroke={recipe.leafStroke} strokeWidth="1.4" />
            <ellipse cx="64" cy="30" rx="8" ry="14" transform="rotate(14 64 30)" fill={recipe.leafMain} stroke={recipe.leafStroke} strokeWidth="1.3" />
            {[
              [48, 52, 6.5],
              [54, 62, 7],
              [41, 65, 6],
              [72, 34, 5.5],
            ].map(([cx, cy, r], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r} fill={recipe.accentColor} stroke="#3b161b" strokeWidth="1.2" />
                <circle cx={cx - 2} cy={cy - 2} r="1.8" fill="#ffffff" opacity="0.7" />
              </g>
            ))}
          </svg>
        );
      }
      if (recipe.variant === 'eucalyptus') {
        return (
          <svg viewBox="0 0 100 100" className={className} fill="none">
            <path d="M26 86 Q50 52 72 16" stroke={recipe.stemColor} strokeWidth="2.8" strokeLinecap="round" />
            {[
              [34, 68, -28, 10],
              [47, 70, 48, 10],
              [44, 51, -24, 9.5],
              [58, 53, 46, 9.5],
              [54, 35, -20, 8.5],
              [67, 36, 44, 8.5],
              [70, 20, 12, 7.5],
            ].map(([cx, cy, rot, r], i) => (
              <g key={i} transform={`rotate(${rot} ${cx} ${cy})`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill={i % 2 === 0 ? recipe.leafMain : recipe.leafAlt}
                  stroke={recipe.leafStroke}
                  strokeWidth="1.3"
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={r * 0.6}
                  stroke={recipe.accentColor}
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              </g>
            ))}
          </svg>
        );
      }
      // sprig default
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path d="M20 82 Q50 54 78 20" stroke={recipe.stemColor} strokeWidth="3.2" strokeLinecap="round" />
          {[
            [35, 62, -32, 9, 16],
            [54, 49, 48, 9, 16],
            [47, 42, -26, 8, 14],
            [66, 31, 20, 7.5, 13],
          ].map(([cx, cy, rot, rx, ry], i) => (
            <g key={i} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
              <ellipse
                cx="0"
                cy="-10"
                rx={rx}
                ry={ry}
                fill={i % 2 === 0 ? recipe.leafMain : recipe.leafAlt}
                stroke={recipe.leafStroke}
                strokeWidth="1.3"
              />
              <line x1="0" y1="0" x2="0" y2="-19" stroke="#e4eedc" strokeWidth="1.1" strokeDasharray="2 2" />
            </g>
          ))}
          <circle cx="46" cy="56" r="4.5" fill={recipe.accentColor} stroke={recipe.leafStroke} strokeWidth="1" />
          <circle cx="44.7" cy="54.7" r="1.4" fill="#ffffff" />
        </svg>
      );
    }

    case 'pearl-drop': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          {recipe.haloColor && (
            <circle cx="50" cy="56" r="36" stroke={recipe.haloColor} strokeWidth="3" strokeDasharray="4 3" />
          )}
          <circle cx="50" cy="14" r="5" stroke={recipe.metalColor} strokeWidth="2.6" />
          <path d="M44 21 L56 21 L53 28 L47 28 Z" fill={recipe.metalColor} stroke={recipe.metalDark} strokeWidth="1.2" />
          {recipe.shape === 'teardrop' ? (
            <>
              <path
                d="M50 26 C64 42, 76 54, 76 66 C76 80, 64 90, 50 90 C36 90, 24 80, 24 66 C24 54, 36 42, 50 26 Z"
                fill={recipe.pearlBase}
                stroke={recipe.pearlRim}
                strokeWidth="1.8"
              />
              <ellipse cx="46" cy="60" rx="16" ry="20" fill={recipe.pearlLight} opacity="0.7" />
              <ellipse cx="40" cy="52" rx="5.5" ry="9" transform="rotate(-18 40 52)" fill="#ffffff" />
            </>
          ) : recipe.shape === 'oval' ? (
            <>
              <ellipse cx="50" cy="58" rx="24" ry="30" fill={recipe.pearlBase} stroke={recipe.pearlRim} strokeWidth="1.8" />
              <ellipse cx="46" cy="53" rx="17" ry="22" fill={recipe.pearlLight} opacity="0.82" />
              <ellipse cx="39" cy="43" rx="5.5" ry="3.6" transform="rotate(-32 39 43)" fill="#ffffff" />
            </>
          ) : (
            <>
              <circle cx="50" cy="56" r="29" fill={recipe.pearlBase} stroke={recipe.pearlRim} strokeWidth="1.8" />
              <circle cx="46" cy="52" r="21" fill={recipe.pearlLight} opacity="0.85" />
              <ellipse cx="38" cy="41" rx="6" ry="3.5" transform="rotate(-28 38 41)" fill="#ffffff" />
            </>
          )}
        </svg>
      );
    }

    case 'pearl-cluster': {
      const outerCount = recipe.count === 3 ? 2 : recipe.count === 5 ? 4 : 6;
      const angles = angleList(outerCount);
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill={recipe.doilyFill}
            stroke={recipe.doilyStroke}
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />
          <circle cx="50" cy="50" r="30" stroke={recipe.doilyStroke} strokeWidth="1.2" strokeDasharray="2 2" />
          {angles.map((d) => {
            const rad = (d * Math.PI) / 180;
            const cx = 50 + Math.cos(rad) * 19;
            const cy = 50 + Math.sin(rad) * 19;
            return (
              <g key={d}>
                <circle cx={cx} cy={cy} r="10.5" fill={recipe.pearlFill} stroke={recipe.pearlRim} strokeWidth="1.3" />
                <ellipse cx={cx - 3.2} cy={cy - 3.2} rx="3" ry="1.8" transform={`rotate(-25 ${cx - 3.2} ${cy - 3.2})`} fill="#ffffff" />
                <circle
                  cx={50 + Math.cos(rad + Math.PI / outerCount) * 28}
                  cy={50 + Math.sin(rad + Math.PI / outerCount) * 28}
                  r="2.8"
                  fill={recipe.seedBead}
                />
              </g>
            );
          })}
          <circle cx="50" cy="50" r="13.5" fill={recipe.pearlFill} stroke={recipe.pearlRim} strokeWidth="1.5" />
          <ellipse cx="45.5" cy="44.5" rx="4" ry="2.4" transform="rotate(-25 45.5 44.5)" fill="#ffffff" />
        </svg>
      );
    }

    case 'pearl-garland': {
      return (
        <svg viewBox="0 0 120 70" className={className} fill="none">
          <path
            d={recipe.style === 'scallop' ? 'M8 24 Q35 52 60 28 Q85 52 112 24' : 'M10 42 Q60 12 110 42'}
            stroke={recipe.cordColor}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {recipe.style === 'double-arc' && (
            <path d="M14 48 Q60 32 106 48" stroke={recipe.cordColor} strokeWidth="2" strokeLinecap="round" />
          )}
          {[
            { x: 18, y: recipe.style === 'scallop' ? 31 : 36, r: 7 },
            { x: 38, y: recipe.style === 'scallop' ? 40 : 27, r: 8.5 },
            { x: 60, y: recipe.style === 'scallop' ? 28 : 24, r: 10 },
            { x: 82, y: recipe.style === 'scallop' ? 40 : 27, r: 8.5 },
            { x: 102, y: recipe.style === 'scallop' ? 31 : 36, r: 7 },
          ].map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r={p.r} fill={recipe.pearlFill} stroke={recipe.pearlRim} strokeWidth="1.3" />
              <circle cx={p.x - p.r * 0.3} cy={p.y - p.r * 0.3} r={p.r * 0.28} fill="#ffffff" />
            </g>
          ))}
          {recipe.style === 'double-arc' &&
            [30, 48, 60, 72, 90].map((px, i) => (
              <g key={`d-${i}`}>
                <circle cx={px} cy={42} r="5.5" fill={recipe.pearlFill} stroke={recipe.pearlRim} strokeWidth="1.1" />
                <circle cx={px - 1.5} cy={40.5} r="1.5" fill="#ffffff" />
              </g>
            ))}
          {[28, 49, 71, 92].map((gx, i) => (
            <circle key={`sp-${i}`} cx={gx} cy={recipe.style === 'scallop' ? 35 : 30} r="2.2" fill={recipe.spacerColor} />
          ))}
        </svg>
      );
    }

    case 'pearl-brooch': {
      const pearlCount = 12;
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          {recipe.shape === 'oval' ? (
            <>
              <ellipse cx="50" cy="50" rx="34" ry="43" fill={recipe.frameFill} stroke={recipe.frameStroke} strokeWidth="2" />
              <ellipse cx="50" cy="50" rx="28" ry="37" stroke={recipe.trimColor} strokeWidth="1.5" strokeDasharray="3 2" />
              <ellipse cx="50" cy="50" rx="21" ry="29" fill={recipe.enamelFill} stroke={recipe.frameStroke} strokeWidth="1.5" />
            </>
          ) : recipe.shape === 'octa' ? (
            <>
              <polygon
                points="34,10 66,10 90,34 90,66 66,90 34,90 10,66 10,34"
                fill={recipe.frameFill}
                stroke={recipe.frameStroke}
                strokeWidth="2"
              />
              <circle cx="50" cy="50" r="28" fill={recipe.enamelFill} stroke={recipe.trimColor} strokeWidth="2" strokeDasharray="3 3" />
            </>
          ) : (
            <>
              <circle cx="50" cy="50" r="41" fill={recipe.frameFill} stroke={recipe.frameStroke} strokeWidth="2" />
              <circle cx="50" cy="50" r="34" stroke={recipe.trimColor} strokeWidth="1.8" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="25" fill={recipe.enamelFill} />
            </>
          )}
          {angleList(pearlCount).map((d) => {
            const rx = recipe.shape === 'oval' ? 25 : 30;
            const ry = recipe.shape === 'oval' ? 34 : 30;
            const cx = 50 + Math.cos((d * Math.PI) / 180) * rx;
            const cy = 50 + Math.sin((d * Math.PI) / 180) * ry;
            return (
              <circle key={d} cx={cx} cy={cy} r="3" fill={recipe.pearlFill} stroke={recipe.pearlRim} strokeWidth="0.8" />
            );
          })}
          <circle cx="50" cy="50" r="15.5" fill={recipe.pearlFill} stroke={recipe.pearlRim} strokeWidth="1.4" />
          <ellipse cx="45" cy="44" rx="4.5" ry="2.6" transform="rotate(-28 45 44)" fill="#ffffff" />
        </svg>
      );
    }

    case 'bead-arc': {
      const xs = [20, 37, 55, 73, 90];
      const ys = recipe.curvedUp ? [52, 42, 38, 42, 52] : [48, 57, 61, 57, 48];
      return (
        <svg viewBox="0 0 110 90" className={className} fill="none">
          <path
            d={recipe.curvedUp ? 'M10 54 Q55 24 100 54' : 'M10 45 Q55 76 100 45'}
            stroke={recipe.cordColor}
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeDasharray="4 2"
          />
          {recipe.beads.map((b, i) => {
            const x = xs[i] ?? 55;
            const y = ys[i] ?? 50;
            const r = b.r ?? 10;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r={r} fill={b.fill} stroke={b.stroke} strokeWidth="1.6" />
                <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.26} fill="#ffffff" opacity="0.7" />
              </g>
            );
          })}
        </svg>
      );
    }

    case 'bead-ring': {
      const angles = angleList(8);
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="50" r="33" stroke={recipe.cordColor} strokeWidth="2.8" strokeDasharray="3 2" />
          {angles.map((d, i) => {
            const rad = (d * Math.PI) / 180;
            const cx = 50 + Math.cos(rad) * 33;
            const cy = 50 + Math.sin(rad) * 33;
            const pair = recipe.colors[i % recipe.colors.length];
            const sx = 50 + Math.cos(rad + Math.PI / 8) * 33;
            const sy = 50 + Math.sin(rad + Math.PI / 8) * 33;
            return (
              <g key={d}>
                <circle cx={sx} cy={sy} r="3" fill={recipe.spacerFill} />
                <circle cx={cx} cy={cy} r={i % 2 === 0 ? 9.5 : 8} fill={pair.fill} stroke={pair.stroke} strokeWidth="1.4" />
                <circle cx={cx - 2.5} cy={cy - 2.5} r="2.2" fill="#ffffff" opacity="0.72" />
              </g>
            );
          })}
          {recipe.centerBead && (
            <>
              <circle cx="50" cy="50" r="11.5" fill={recipe.centerBead.fill} stroke={recipe.centerBead.stroke} strokeWidth="1.5" />
              <circle cx="46.5" cy="46.5" r="3" fill="#ffffff" opacity="0.7" />
            </>
          )}
        </svg>
      );
    }

    case 'crystal-drop': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <line x1="50" y1="8" x2="50" y2="92" stroke={recipe.metalColor} strokeWidth="2.4" />
          <circle cx="50" cy="20" r="6.5" fill={recipe.topBead} stroke={recipe.gemDark} strokeWidth="1.3" />
          {recipe.cut === 'hex' ? (
            <>
              <polygon points="50,27 71,39 71,61 50,73 29,61 29,39" fill={recipe.gemDark} stroke={recipe.gemDark} strokeWidth="1.5" />
              <polygon points="50,33 64,42 64,58 50,67 36,58 36,42" fill={recipe.gemMid} />
              <polygon points="50,33 64,42 50,50 36,42" fill={recipe.gemLight} opacity="0.78" />
            </>
          ) : recipe.cut === 'teardrop' ? (
            <>
              <path
                d="M50 27 C62 40, 72 52, 72 60 C72 70, 62 75, 50 75 C38 75, 28 70, 28 60 C28 52, 38 40, 50 27 Z"
                fill={recipe.gemDark}
                stroke={recipe.gemDark}
                strokeWidth="1.6"
              />
              <path
                d="M50 33 C59 43, 65 52, 65 59 C65 66, 58 70, 50 70 C42 70, 35 66, 35 59 C35 52, 41 43, 50 33 Z"
                fill={recipe.gemMid}
              />
              <polygon points="50,35 59,51 50,55 43,48" fill={recipe.gemLight} opacity="0.75" />
            </>
          ) : recipe.cut === 'bicone' ? (
            <>
              <polygon points="50,28 74,47 50,72 26,47" fill={recipe.gemDark} stroke={recipe.gemDark} strokeWidth="1.6" />
              <polygon points="50,28 63,47 50,72 37,47" fill={recipe.gemMid} />
              <polygon points="50,28 63,47 37,47" fill={recipe.gemLight} opacity="0.72" />
            </>
          ) : (
            <>
              <polygon points="50,28 73,50 50,72 27,50" fill={recipe.gemDark} stroke={recipe.gemDark} strokeWidth="1.8" />
              <polygon points="50,34 64,50 50,66 36,50" fill={recipe.gemMid} />
              <polygon points="50,34 64,50 50,50" fill={recipe.gemLight} opacity="0.75" />
            </>
          )}
          <circle cx="50" cy="81" r="7.5" fill={recipe.bottomBead} stroke={recipe.gemDark} strokeWidth="1.3" />
          <circle cx="47.5" cy="78.5" r="2.2" fill="#ffffff" opacity="0.8" />
        </svg>
      );
    }

    case 'tassel': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="12" r="5" stroke={recipe.capFill} strokeWidth="2.4" />
          <circle cx="50" cy="27" r="10.5" fill={recipe.topBeadFill} stroke={recipe.topBeadStroke} strokeWidth="1.5" />
          <circle cx="46.8" cy="23.8" r="2.5" fill="#ffffff" opacity="0.7" />
          <path d="M40 39 L60 39 L63 48 L37 48 Z" fill={recipe.capFill} stroke={recipe.capStroke} strokeWidth="1.5" />
          <rect x="42" y="48" width="16" height="5" rx="2" fill={recipe.wrapColor} stroke={recipe.capStroke} strokeWidth="1" />
          {[-12, -8, -4, 0, 4, 8, 12].map((dx, i) => (
            <line
              key={dx}
              x1={50 + dx * 0.55}
              y1="53"
              x2={50 + dx * 1.45}
              y2="89"
              stroke={i % 2 === 0 ? recipe.fringeColor : recipe.fringeAlt}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          ))}
        </svg>
      );
    }

    case 'stitch-marker': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path
            d="M36 23 C36 10, 64 10, 64 23 C64 36, 50 40, 50 49"
            stroke={recipe.claspColor}
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          {recipe.beads.map((b, i) => {
            const cy = 53 + i * 15;
            return (
              <g key={i}>
                <circle cx="50" cy={cy} r={b.r} fill={b.fill} stroke={b.stroke} strokeWidth="1.4" />
                <circle cx={50 - b.r * 0.3} cy={cy - b.r * 0.3} r={b.r * 0.28} fill="#ffffff" opacity="0.72" />
              </g>
            );
          })}
          {recipe.charm === 'heart' ? (
            <path
              d="M50 92 C50 92 40 85 40 79 C40 75 43 73 46 73 C48 73 49.5 74.5 50 76 C50.5 74.5 52 73 54 73 C57 73 60 75 60 79 C60 85 50 92 50 92 Z"
              fill={recipe.charmColor}
              stroke="#4a1d1f"
              strokeWidth="1.2"
            />
          ) : recipe.charm === 'star' ? (
            <polygon
              points="50,74 53,81 60,81 54.5,85 56.5,92 50,88 43.5,92 45.5,85 40,81 47,81"
              fill={recipe.charmColor}
              stroke="#785212"
              strokeWidth="1.2"
            />
          ) : recipe.charm === 'gem' ? (
            <polygon points="50,74 59,83 50,92 41,83" fill={recipe.charmColor} stroke="#2e241b" strokeWidth="1.3" />
          ) : (
            <>
              <circle cx="50" cy="83" r="8" fill={recipe.charmColor} stroke="#9c7e54" strokeWidth="1.3" />
              <circle cx="47.5" cy="80.5" r="2.2" fill="#ffffff" />
            </>
          )}
        </svg>
      );
    }

    case 'yarn-ball': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path d="M14 74 C28 92, 68 88, 86 76" stroke={recipe.tailColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="48" r="32" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="2" />
          <path d="M22 36 Q50 54 78 34" stroke={recipe.stripeDark} strokeWidth="2.4" />
          <path d="M20 50 Q50 68 80 48" stroke={recipe.stripeLight} strokeWidth="2.2" />
          <path d="M32 22 Q56 48 40 78" stroke={recipe.stripeDark} strokeWidth="2.4" />
          <path d="M58 18 Q42 50 64 76" stroke={recipe.stripeLight} strokeWidth="2" />
          {recipe.hasSparkle && (
            <>
              <circle cx="38" cy="36" r="2" fill="#fff8dc" />
              <circle cx="62" cy="54" r="1.8" fill="#fff8dc" />
            </>
          )}
        </svg>
      );
    }

    case 'yarn-skein': {
      return (
        <svg viewBox="0 0 120 80" className={className} fill="none">
          <path
            d="M16 40 C16 20, 38 14, 60 22 C82 30, 104 20, 104 40 C104 60, 82 66, 60 58 C38 50, 16 60, 16 40 Z"
            fill={recipe.yarnFill}
            stroke={recipe.yarnDark}
            strokeWidth="2.2"
          />
          <path d="M22 36 C42 22, 76 34, 98 34" stroke={recipe.yarnLight} strokeWidth="2" />
          <path d="M22 45 C44 40, 76 54, 98 44" stroke={recipe.yarnDark} strokeWidth="2" />
          <rect x="44" y="18" width="32" height="44" rx="5" fill={recipe.bandFill} stroke={recipe.bandStroke} strokeWidth="1.8" />
          <text
            x="60"
            y="43"
            textAnchor="middle"
            fill={recipe.bandStroke}
            fontSize="7.2"
            fontFamily="Cinzel, serif"
            fontWeight="700"
          >
            {recipe.bandText}
          </text>
        </svg>
      );
    }

    case 'wooden-bobbin': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <rect x="26" y="24" width="48" height="52" rx="4" fill={recipe.threadFill} stroke={recipe.threadDark} strokeWidth="1.8" />
          {[32, 40, 48, 56, 64].map((y, idx) => (
            <line
              key={y}
              x1="28"
              y1={y}
              x2="72"
              y2={y + 2}
              stroke={idx % 2 === 0 ? recipe.threadLight : recipe.threadDark}
              strokeWidth="2"
              opacity="0.7"
            />
          ))}
          <rect x="18" y="14" width="64" height="12" rx="5" fill={recipe.woodFill} stroke={recipe.woodDark} strokeWidth="1.8" />
          <rect x="18" y="74" width="64" height="12" rx="5" fill={recipe.woodFill} stroke={recipe.woodDark} strokeWidth="1.8" />
          <circle cx="50" cy="20" r="3" fill={recipe.woodDark} />
          <path d="M74 62 C88 64, 90 78, 82 86" stroke={recipe.threadFill} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    }

    case 'crochet-hook': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <g transform="rotate(-42 50 50)">
            <rect x="43.5" y="28" width="13" height="58" rx="6.5" fill={recipe.handleFill} stroke={recipe.handleStroke} strokeWidth="1.8" />
            {recipe.stripeColor && (
              <rect x="46" y="38" width="8" height="36" rx="4" fill={recipe.stripeColor} opacity="0.45" />
            )}
            <rect x="46.5" y="10" width="7" height="22" rx="3" fill={recipe.shaftFill} stroke={recipe.shaftStroke} strokeWidth="1.3" />
            <path d="M53.5 12 C56 8, 49 6, 48 12" stroke={recipe.shaftStroke} strokeWidth="2.2" strokeLinecap="round" />
            <rect x="43.5" y="40" width="13" height="7" fill={recipe.collarFill} />
            <text
              x="50"
              y="66"
              textAnchor="middle"
              fill={recipe.handleStroke}
              fontSize="7"
              fontWeight="700"
              fontFamily="monospace"
            >
              {recipe.sizeLabel}
            </text>
          </g>
        </svg>
      );
    }

    case 'scissors': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="32" cy="72" r="12" stroke={recipe.metalFill} strokeWidth="4.5" />
          <circle cx="68" cy="72" r="12" stroke={recipe.metalFill} strokeWidth="4.5" />
          <circle cx="32" cy="72" r="12" stroke={recipe.metalStroke} strokeWidth="1" />
          <circle cx="68" cy="72" r="12" stroke={recipe.metalStroke} strokeWidth="1" />
          <path d="M38 62 L58 15" stroke={recipe.bladeFill} strokeWidth="5.2" strokeLinecap="round" />
          <path d="M62 62 L42 15" stroke={recipe.metalFill} strokeWidth="5.2" strokeLinecap="round" />
          {recipe.storkStyle && (
            <path d="M44 42 Q50 32 56 42" stroke={recipe.metalStroke} strokeWidth="1.6" />
          )}
          <circle cx="50" cy="43" r="3.5" fill="#fff3d4" stroke={recipe.metalStroke} strokeWidth="1.4" />
          {recipe.ribbonColor && (
            <path d="M64 82 C72 90, 84 86, 80 76 C76 72, 68 76, 64 82 Z" fill={recipe.ribbonColor} stroke={recipe.metalStroke} strokeWidth="1.1" />
          )}
        </svg>
      );
    }

    case 'needle-cushion': {
      if (recipe.variant === 'needle') {
        return (
          <svg viewBox="0 0 100 100" className={className} fill="none">
            <path d="M16 74 C36 90, 62 56, 82 78" stroke={recipe.threadColor} strokeWidth="3.2" strokeLinecap="round" />
            <g transform="rotate(38 50 48)">
              <path d="M47 14 L53 14 L50 86 Z" fill={recipe.primary} stroke={recipe.stroke} strokeWidth="1.5" />
              <ellipse cx="50" cy="22" rx="1.6" ry="5" fill="#fffaf0" stroke={recipe.stroke} strokeWidth="1" />
            </g>
            <circle cx="24" cy="72" r="4" fill={recipe.pinColor} stroke={recipe.stroke} strokeWidth="1" />
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <ellipse cx="50" cy="64" rx="34" ry="22" fill={recipe.primary} stroke={recipe.stroke} strokeWidth="2" />
          <path d="M22 60 Q50 76 78 60" stroke={recipe.secondary} strokeWidth="2" strokeDasharray="3 3" />
          <line x1="50" y1="42" x2="50" y2="86" stroke={recipe.secondary} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="34" y1="48" x2="26" y2="26" stroke="#c8c2b8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="25" cy="24" r="4.5" fill={recipe.pinColor} stroke={recipe.stroke} strokeWidth="1.2" />
          <line x1="50" y1="44" x2="50" y2="18" stroke="#c8c2b8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="16" r="5" fill={recipe.threadColor} stroke={recipe.stroke} strokeWidth="1.2" />
          <line x1="66" y1="48" x2="74" y2="27" stroke="#c8c2b8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="75" cy="25" r="4.5" fill={recipe.pinColor} stroke={recipe.stroke} strokeWidth="1.2" />
        </svg>
      );
    }

    case 'measure-tool': {
      if (recipe.variant === 'tape') {
        return (
          <svg viewBox="0 0 100 100" className={className} fill="none">
            <circle cx="48" cy="48" r="28" fill={recipe.bodyFill} stroke={recipe.bodyStroke} strokeWidth="2.2" />
            <circle cx="48" cy="48" r="18" fill={recipe.accentFill} stroke={recipe.bodyStroke} strokeWidth="1.6" />
            <circle cx="48" cy="48" r="8" fill={recipe.bodyFill} stroke={recipe.bodyStroke} strokeWidth="1.4" />
            <path d="M56 72 L88 72 L88 86 L46 86" fill={recipe.bodyFill} stroke={recipe.bodyStroke} strokeWidth="1.8" />
            {[54, 62, 70, 78, 84].map((x) => (
              <line key={x} x1={x} y1="72" x2={x} y2="79" stroke={recipe.markColor} strokeWidth="1.4" />
            ))}
          </svg>
        );
      }
      if (recipe.variant === 'ruler') {
        return (
          <svg viewBox="0 0 120 70" className={className} fill="none">
            <rect x="8" y="16" width="104" height="38" rx="6" fill={recipe.bodyFill} stroke={recipe.bodyStroke} strokeWidth="2" />
            {[20, 32, 44, 56, 68, 80, 92, 102].map((x, i) => (
              <line key={x} x1={x} y1="16" x2={x} y2={i % 2 === 0 ? 30 : 24} stroke={recipe.markColor} strokeWidth="1.6" />
            ))}
            <circle cx="28" cy="40" r="5" fill={recipe.accentFill} stroke={recipe.bodyStroke} strokeWidth="1.3" />
            <circle cx="46" cy="40" r="6.5" fill={recipe.accentFill} stroke={recipe.bodyStroke} strokeWidth="1.3" />
            <text x="86" y="45" textAnchor="middle" fill={recipe.markColor} fontSize="12" fontWeight="700" fontFamily="monospace">
              {recipe.label ?? 'cm'}
            </text>
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <rect x="26" y="18" width="48" height="64" rx="14" fill={recipe.bodyFill} stroke={recipe.bodyStroke} strokeWidth="2.2" />
          <rect x="34" y="34" width="32" height="24" rx="4" fill={recipe.accentFill} stroke={recipe.bodyStroke} strokeWidth="1.6" />
          <text
            x="50"
            y="51"
            textAnchor="middle"
            fill={recipe.markColor}
            fontSize="16"
            fontWeight="700"
            fontFamily="monospace"
          >
            {recipe.label ?? '12'}
          </text>
          <circle cx="50" cy="70" r="5" fill={recipe.accentFill} stroke={recipe.bodyStroke} strokeWidth="1.4" />
        </svg>
      );
    }

    case 'stitched-heart': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <path
            d="M50 84 C50 84 15 62 15 35 C15 21 26 14 37 14 C44 14 48 18 50 23 C52 18 56 14 63 14 C74 14 85 21 85 35 C85 62 50 84 50 84 Z"
            fill={recipe.fill}
            stroke={recipe.stroke}
            strokeWidth="2.2"
          />
          <path
            d="M50 76 C50 76 22 57 22 36 C22 26 29 21 37 21 C43 21 48 25 50 30 C52 25 57 21 63 21 C71 21 78 26 78 36 C78 57 50 76 50 76 Z"
            stroke={recipe.stitchColor}
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          {recipe.doubleHeart && (
            <path
              d="M50 61 C50 61 36 51 36 41 C36 36 40 33 44 33 C47 33 49 35 50 38 C51 35 53 33 56 33 C60 33 64 36 64 41 C64 51 50 61 50 61 Z"
              fill={recipe.stitchColor}
              opacity="0.85"
            />
          )}
          {recipe.centerPearl && (
            <>
              <circle cx="50" cy="47" r="6.5" fill="#fff7e8" stroke="#b39264" strokeWidth="1.2" />
              <circle cx="48" cy="45" r="2" fill="#ffffff" />
            </>
          )}
        </svg>
      );
    }

    case 'craft-button': {
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          {recipe.scalloped && (
            <circle
              cx="50"
              cy="50"
              r="41"
              stroke={recipe.stroke}
              strokeWidth="4"
              strokeDasharray="6 4"
            />
          )}
          <circle cx="50" cy="50" r="36" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="2.4" />
          <circle cx="50" cy="50" r="28" stroke={recipe.rimColor} strokeWidth="2" />
          {recipe.holes === 4 ? (
            <>
              <circle cx="40" cy="40" r="4" fill="#3b2009" />
              <circle cx="60" cy="40" r="4" fill="#3b2009" />
              <circle cx="40" cy="60" r="4" fill="#3b2009" />
              <circle cx="60" cy="60" r="4" fill="#3b2009" />
              <line x1="40" y1="40" x2="60" y2="60" stroke={recipe.threadColor} strokeWidth="3.2" strokeLinecap="round" />
              <line x1="60" y1="40" x2="40" y2="60" stroke={recipe.threadColor} strokeWidth="3.2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="39" cy="50" r="4.5" fill="#3b2009" />
              <circle cx="61" cy="50" r="4.5" fill="#3b2009" />
              <line x1="39" y1="50" x2="61" y2="50" stroke={recipe.threadColor} strokeWidth="4" strokeLinecap="round" />
            </>
          )}
        </svg>
      );
    }

    case 'woven-label': {
      return (
        <svg viewBox="0 0 140 70" className={className} fill="none">
          {recipe.scalloped && (
            <rect x="2" y="6" width="136" height="58" rx="14" stroke={recipe.borderColor} strokeWidth="1.5" strokeDasharray="3 3" />
          )}
          <rect
            x="6"
            y="10"
            width="128"
            height="50"
            rx="9"
            fill={recipe.bgFill}
            stroke={recipe.borderColor}
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          <circle cx="17" cy="35" r="3.6" fill={recipe.rivetColor} />
          <circle cx="123" cy="35" r="3.6" fill={recipe.rivetColor} />
          <text
            x="70"
            y="32"
            textAnchor="middle"
            fill={recipe.textColor}
            fontSize="10.2"
            fontFamily="Cormorant Garamond, serif"
            fontWeight="700"
          >
            {recipe.title}
          </text>
          <text
            x="70"
            y="47"
            textAnchor="middle"
            fill={recipe.subColor}
            fontSize="9.5"
            fontFamily="Caveat, cursive"
          >
            {recipe.subtitle}
          </text>
        </svg>
      );
    }

    case 'crochet-charm': {
      if (recipe.motif === 'bow') {
        return (
          <svg viewBox="0 0 110 80" className={className} fill="none">
            <path d="M52 42 L34 68 L45 64 L52 46 Z" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="1.5" />
            <path d="M58 42 L76 68 L65 64 L58 46 Z" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="1.5" />
            <path d="M55 38 C32 14, 14 22, 16 38 C18 54, 38 52, 55 40 Z" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="1.8" />
            <path d="M55 38 C78 14, 96 22, 94 38 C92 54, 72 52, 55 40 Z" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="1.8" />
            <path d="M24 37 C24 27, 36 25, 48 37" stroke={recipe.stitchColor} strokeWidth="1.5" strokeDasharray="3 2" />
            <path d="M86 37 C86 27, 74 25, 62 37" stroke={recipe.stitchColor} strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="55" cy="39" r="8" fill={recipe.accentFill} stroke={recipe.stroke} strokeWidth="1.6" />
          </svg>
        );
      }
      if (recipe.motif === 'star') {
        return (
          <svg viewBox="0 0 100 100" className={className} fill="none">
            <polygon
              points="50,12 61,36 88,39 68,57 73,84 50,71 27,84 32,57 12,39 39,36"
              fill={recipe.fill}
              stroke={recipe.stroke}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <polygon
              points="50,21 58,39 78,41 63,55 67,75 50,65 33,75 37,55 22,41 42,39"
              stroke={recipe.stitchColor}
              strokeWidth="1.6"
              strokeDasharray="3 3"
            />
            <circle cx="50" cy="51" r="5" fill={recipe.accentFill} />
          </svg>
        );
      }
      if (recipe.motif === 'moon') {
        return (
          <svg viewBox="0 0 100 100" className={className} fill="none">
            <path
              d="M62 16 C38 18, 22 36, 24 58 C26 78, 46 88, 68 82 C50 78, 42 64, 42 48 C42 32, 50 22, 62 16 Z"
              fill={recipe.fill}
              stroke={recipe.stroke}
              strokeWidth="2"
            />
            <path
              d="M52 24 C38 30, 32 42, 33 56 C34 68, 42 75, 54 78"
              stroke={recipe.stitchColor}
              strokeWidth="1.6"
              strokeDasharray="3 3"
            />
            <polygon points="72,34 75,40 81,41 76,45 77,51 72,48 67,51 68,45 63,41 69,40" fill={recipe.accentFill} />
          </svg>
        );
      }
      if (recipe.motif === 'butterfly') {
        return (
          <svg viewBox="0 0 100 100" className={className} fill="none">
            <ellipse cx="32" cy="36" rx="18" ry="15" transform="rotate(-24 32 36)" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="1.8" />
            <ellipse cx="68" cy="36" rx="18" ry="15" transform="rotate(24 68 36)" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="1.8" />
            <ellipse cx="35" cy="64" rx="14" ry="12" transform="rotate(20 35 64)" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="1.8" />
            <ellipse cx="65" cy="64" rx="14" ry="12" transform="rotate(-20 65 64)" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="1.8" />
            <circle cx="31" cy="35" r="7" stroke={recipe.stitchColor} strokeWidth="1.4" strokeDasharray="2 2" />
            <circle cx="69" cy="35" r="7" stroke={recipe.stitchColor} strokeWidth="1.4" strokeDasharray="2 2" />
            <rect x="47" y="28" width="6" height="44" rx="3" fill={recipe.stroke} />
            <circle cx="50" cy="24" r="4" fill={recipe.accentFill} />
          </svg>
        );
      }
      if (recipe.motif === 'crown') {
        return (
          <svg viewBox="0 0 100 100" className={className} fill="none">
            <path d="M16 70 L20 32 L38 50 L50 24 L62 50 L80 32 L84 70 Z" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="2" strokeLinejoin="round" />
            <rect x="16" y="70" width="68" height="10" rx="4" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="1.8" />
            <circle cx="20" cy="29" r="4" fill={recipe.accentFill} stroke={recipe.stroke} strokeWidth="1.2" />
            <circle cx="50" cy="21" r="5" fill={recipe.accentFill} stroke={recipe.stroke} strokeWidth="1.2" />
            <circle cx="80" cy="29" r="4" fill={recipe.accentFill} stroke={recipe.stroke} strokeWidth="1.2" />
            <line x1="22" y1="64" x2="78" y2="64" stroke={recipe.stitchColor} strokeWidth="1.6" strokeDasharray="3 3" />
          </svg>
        );
      }
      // pompom
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none">
          <circle cx="50" cy="52" r="31" fill={recipe.fill} stroke={recipe.stroke} strokeWidth="2" strokeDasharray="4 2" />
          {angleList(12).map((d) => (
            <line
              key={d}
              x1="50"
              y1="52"
              x2={50 + Math.cos((d * Math.PI) / 180) * 28}
              y2={52 + Math.sin((d * Math.PI) / 180) * 28}
              stroke={recipe.accentFill}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ))}
          <circle cx="50" cy="52" r="14" fill={recipe.stitchColor} opacity="0.65" />
          <circle cx="50" cy="14" r="5" stroke={recipe.stroke} strokeWidth="2" />
        </svg>
      );
    }
  }
});

ParametricCrochetSticker.displayName = 'ParametricCrochetSticker';
