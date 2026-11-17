import React from 'react';
import type { StitchSymbol } from '../types/crochet';

interface StitchSymbolSvgProps {
  stitchKey: string;
  className?: string;
  color?: string;
}

/**
 * Renders the authentic vector crochet symbol matching the user's 7 reference sheets.
 */
export const StitchSymbolSvg: React.FC<StitchSymbolSvgProps> = ({
  stitchKey,
  className = 'w-12 h-12',
  color,
}) => {
  const stroke = color || '#3e1e0c';
  const accent = color || '#7a202a';

  switch (stitchKey) {
    case 'cad':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <ellipse cx="32" cy="32" rx="18" ry="10" stroke={stroke} strokeWidth="3.2" />
        </svg>
      );
    case 'pd':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <ellipse cx="32" cy="32" rx="18" ry="10" fill={stroke} />
        </svg>
      );
    case 'pb':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="18" y1="18" x2="46" y2="46" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="46" y1="18" x2="18" y2="46" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      );
    case 'pb-canale':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="18" y1="16" x2="46" y2="44" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="46" y1="16" x2="18" y2="44" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M16 49 H48" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'mpa':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="14" x2="48" y2="14" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="32" y1="14" x2="32" y2="52" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      );
    case 'pa':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="12" x2="48" y2="12" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="32" y1="12" x2="32" y2="54" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="22" y1="30" x2="42" y2="24" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      );
    case 'pad':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="12" x2="48" y2="12" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="32" y1="12" x2="32" y2="54" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="22" y1="27" x2="42" y2="21" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
          <line x1="22" y1="36" x2="42" y2="30" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );
    case 'pat':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="10" x2="48" y2="10" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="32" y1="10" x2="32" y2="56" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="22" y1="22" x2="42" y2="17" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="30" x2="42" y2="25" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="22" y1="38" x2="42" y2="33" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'pac':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="10" x2="48" y2="10" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          <line x1="32" y1="10" x2="32" y2="56" stroke={stroke} strokeWidth="3.2" strokeLinecap="round" />
          {[19, 26, 33, 40].map((y) => (
            <line key={y} x1="22" y1={y} x2="42" y2={y - 4} stroke={stroke} strokeWidth="2.3" strokeLinecap="round" />
          ))}
        </svg>
      );
    case 'mpa-cruz':
    case 'vc':
    case 'doble-vc':
    case 'doble-vcd':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="14" x2="28" y2="14" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
          <line x1="36" y1="14" x2="48" y2="14" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
          <line x1="22" y1="14" x2="44" y2="52" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
          <line x1="42" y1="14" x2="20" y2="52" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
          {(stitchKey === 'vc' || stitchKey === 'doble-vc' || stitchKey === 'doble-vcd') && (
            <>
              <line x1="21" y1="30" x2="31" y2="26" stroke={accent} strokeWidth="2.4" />
              <line x1="34" y1="26" x2="44" y2="30" stroke={accent} strokeWidth="2.4" />
            </>
          )}
          {(stitchKey === 'doble-vc' || stitchKey === 'doble-vcd') && (
            <>
              <line x1="24" y1="36" x2="34" y2="32" stroke={accent} strokeWidth="2.4" />
              <line x1="31" y1="32" x2="41" y2="36" stroke={accent} strokeWidth="2.4" />
            </>
          )}
        </svg>
      );
    case 'mpa-delante':
    case 'mpa-detras':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="20" y1="12" x2="44" y2="12" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="12" x2="32" y2="40" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path
            d={stitchKey === 'mpa-delante' ? 'M32 40 C32 52, 18 52, 18 42' : 'M32 40 C32 52, 46 52, 46 42'}
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'aum-2-pb':
    case 'aum-3-pb':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M16 14 L32 50 L48 14" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {stitchKey === 'aum-3-pb' && <line x1="32" y1="12" x2="32" y2="50" stroke={stroke} strokeWidth="2.6" />}
          <line x1="26" y1="16" x2="38" y2="28" stroke={accent} strokeWidth="2.4" />
          <line x1="38" y1="16" x2="26" y2="28" stroke={accent} strokeWidth="2.4" />
        </svg>
      );
    case 'aum-2-mpa':
    case 'aum-3-mpa':
    case 'aum-2-pa':
    case 'aum-3-pa':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="12" y1="14" x2="52" y2="14" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M16 14 L32 52 L48 14" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          {(stitchKey === 'aum-3-mpa' || stitchKey === 'aum-3-pa') && (
            <line x1="32" y1="14" x2="32" y2="52" stroke={stroke} strokeWidth="2.6" />
          )}
          {(stitchKey === 'aum-2-pa' || stitchKey === 'aum-3-pa') && (
            <>
              <line x1="17" y1="30" x2="27" y2="26" stroke={accent} strokeWidth="2.4" />
              <line x1="37" y1="26" x2="47" y2="30" stroke={accent} strokeWidth="2.4" />
            </>
          )}
        </svg>
      );
    case 'dism-2-pb':
    case 'dism-3-pb':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M16 50 L32 14 L48 50" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {stitchKey === 'dism-3-pb' && <line x1="32" y1="14" x2="32" y2="50" stroke={stroke} strokeWidth="2.6" />}
          <line x1="26" y1="34" x2="38" y2="46" stroke={accent} strokeWidth="2.4" />
          <line x1="38" y1="34" x2="26" y2="46" stroke={accent} strokeWidth="2.4" />
        </svg>
      );
    case 'dism-2-mpa':
    case 'dism-3-mpa':
    case 'dism-3-pa':
    case 'dism-4-pa':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="14" x2="48" y2="14" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M14 52 L32 14 L50 52" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          {(stitchKey === 'dism-3-mpa' || stitchKey === 'dism-3-pa') && (
            <line x1="32" y1="14" x2="32" y2="52" stroke={stroke} strokeWidth="2.6" />
          )}
          {stitchKey === 'dism-4-pa' && (
            <>
              <line x1="25" y1="14" x2="25" y2="52" stroke={stroke} strokeWidth="2.4" />
              <line x1="39" y1="14" x2="39" y2="52" stroke={stroke} strokeWidth="2.4" />
            </>
          )}
          {(stitchKey === 'dism-3-pa' || stitchKey === 'dism-4-pa') && (
            <line x1="16" y1="34" x2="48" y2="28" stroke={accent} strokeWidth="2.4" />
          )}
        </svg>
      );
    case 'pina-3-mpa':
    case 'pina-3-mpa-cad':
    case 'pina-3-pa':
    case 'pina-5-pad':
    case 'pop-5-mpa':
    case 'pop-5-pa':
    case 'pop-6-pad':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="12" x2="48" y2="12" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" />
          <ellipse cx="32" cy="34" rx="16" ry="20" stroke={stroke} strokeWidth="2.6" />
          <path d="M32 14 C23 24, 23 44, 32 54" stroke={stroke} strokeWidth="2.2" />
          <path d="M32 14 C41 24, 41 44, 32 54" stroke={stroke} strokeWidth="2.2" />
          {(stitchKey.includes('pa') || stitchKey.includes('pad')) && (
            <line x1="14" y1="34" x2="50" y2="34" stroke={accent} strokeWidth="2.2" />
          )}
          {stitchKey.includes('pad') && (
            <line x1="16" y1="42" x2="48" y2="42" stroke={accent} strokeWidth="2" />
          )}
          {stitchKey === 'pina-3-mpa-cad' && (
            <circle cx="32" cy="8" r="4" stroke={accent} strokeWidth="2" />
          )}
        </svg>
      );
    case 'abanico-5':
    case 'abanico-212':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M10 24 L32 52 L54 24" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
          <line x1="21" y1="18" x2="32" y2="52" stroke={stroke} strokeWidth="2.4" />
          <line x1="43" y1="18" x2="32" y2="52" stroke={stroke} strokeWidth="2.4" />
          {stitchKey === 'abanico-5' ? (
            <line x1="32" y1="14" x2="32" y2="52" stroke={stroke} strokeWidth="2.4" />
          ) : (
            <ellipse cx="32" cy="18" rx="5" ry="3.5" stroke={accent} strokeWidth="2.2" />
          )}
          <line x1="12" y1="28" x2="52" y2="28" stroke={accent} strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      );
    case 'arco-5':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M12 46 C18 16, 46 16, 52 46" stroke={stroke} strokeWidth="2.8" strokeDasharray="5 3" strokeLinecap="round" />
          <line x1="8" y1="44" x2="16" y2="52" stroke={accent} strokeWidth="2.4" />
          <line x1="16" y1="44" x2="8" y2="52" stroke={accent} strokeWidth="2.4" />
          <line x1="48" y1="44" x2="56" y2="52" stroke={accent} strokeWidth="2.4" />
          <line x1="56" y1="44" x2="48" y2="52" stroke={accent} strokeWidth="2.4" />
        </svg>
      );
    case 'x-pa':
    case 'x-pad':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <ellipse cx="24" cy="14" rx="6" ry="3.5" stroke={accent} strokeWidth="2.2" />
          <ellipse cx="40" cy="14" rx="6" ry="3.5" stroke={accent} strokeWidth="2.2" />
          <line x1="18" y1="18" x2="46" y2="52" stroke={stroke} strokeWidth="2.8" />
          <line x1="46" y1="18" x2="18" y2="52" stroke={stroke} strokeWidth="2.8" />
        </svg>
      );
    case 'y-pa':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <ellipse cx="32" cy="14" rx="7" ry="4" stroke={accent} strokeWidth="2.2" />
          <path d="M18 18 L32 34 L46 18" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="34" x2="32" y2="54" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'y-inv':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="20" y1="12" x2="44" y2="12" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="12" x2="32" y2="34" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <path d="M16 52 L32 34 L48 52" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="24" y1="24" x2="40" y2="20" stroke={accent} strokeWidth="2.4" />
        </svg>
      );
    case 'picot-cerrado':
    case 'picot-abierto':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <ellipse cx="32" cy="20" rx="10" ry="6" stroke={accent} strokeWidth="2.6" />
          <ellipse cx="18" cy="36" rx="6" ry="11" transform="rotate(-24 18 36)" stroke={stroke} strokeWidth="2.6" />
          <ellipse cx="46" cy="36" rx="6" ry="11" transform="rotate(24 46 36)" stroke={stroke} strokeWidth="2.6" />
        </svg>
      );
    case 'gusano':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="18" y1="12" x2="46" y2="12" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <line x1="32" y1="12" x2="32" y2="54" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="32" cy="34" rx="12" ry="7" stroke={accent} strokeWidth="2.4" />
          <ellipse cx="32" cy="34" rx="9" ry="12" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case 'filet':
    default:
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="14" y1="16" x2="14" y2="52" stroke={stroke} strokeWidth="2.8" />
          <line x1="50" y1="16" x2="50" y2="52" stroke={stroke} strokeWidth="2.8" />
          <ellipse cx="26" cy="16" rx="6" ry="4" stroke={accent} strokeWidth="2.2" />
          <ellipse cx="38" cy="16" rx="6" ry="4" stroke={accent} strokeWidth="2.2" />
        </svg>
      );
  }
};

export const DiagramGridSvg: React.FC<{
  grid: StitchSymbol[][];
  className?: string;
  color?: string;
}> = ({ grid, className = 'w-12 h-12', color }) => {
  const stroke = color || '#3e1e0c';
  const accent = color || '#7a202a';

  let minR = grid.length;
  let maxR = -1;
  let minC = grid[0]?.length || 0;
  let maxC = -1;

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      if (row[c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  if (maxR < 0 || maxC < 0) {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none">
        <circle cx="50" cy="50" r="24" stroke={stroke} strokeWidth="3.2" strokeDasharray="6 4" />
        <circle cx="50" cy="50" r="10" stroke={accent} strokeWidth="3" />
      </svg>
    );
  }

  const rowsCount = grid.length;
  const colsCount = grid[0]?.length || rowsCount;
  const rawSpan = Math.max(maxR - minR + 1, maxC - minC + 1, 3);
  const span = Math.min(rowsCount, colsCount, rawSpan);
  const startR = Math.max(
    0,
    Math.min(rowsCount - span, Math.floor((minR + maxR + 1 - span) / 2))
  );
  const startC = Math.max(
    0,
    Math.min(colsCount - span, Math.floor((minC + maxC + 1 - span) / 2))
  );

  const pad = 4;
  const inner = 100 - pad * 2;
  const cell = inner / span;
  const u = cell * 0.34;
  const sw = Math.max(1.5, Math.min(2.8, cell * 0.14));

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      {/* Subtle square chart grid */}
      {Array.from({ length: span + 1 }, (_, i) => {
        const pos = pad + i * cell;
        return (
          <g key={`grid-${i}`}>
            <line
              x1={pad}
              y1={pos}
              x2={100 - pad}
              y2={pos}
              stroke="#b48449"
              strokeWidth="0.7"
              strokeOpacity="0.28"
            />
            <line
              x1={pos}
              y1={pad}
              x2={pos}
              y2={100 - pad}
              stroke="#b48449"
              strokeWidth="0.7"
              strokeOpacity="0.28"
            />
          </g>
        );
      })}

      {/* Centered stitch vector symbols */}
      {Array.from({ length: span }, (_, dr) =>
        Array.from({ length: span }, (_, dc) => {
          const sym = grid[startR + dr]?.[startC + dc] || '';
          if (!sym) return null;
          const cx = pad + (dc + 0.5) * cell;
          const cy = pad + (dr + 0.5) * cell;
          const key = `s-${dr}-${dc}`;

          switch (sym) {
            case '○':
              return (
                <ellipse
                  key={key}
                  cx={cx}
                  cy={cy}
                  rx={u * 1.02}
                  ry={u * 0.62}
                  stroke={stroke}
                  strokeWidth={sw}
                />
              );
            case '●':
              return (
                <ellipse
                  key={key}
                  cx={cx}
                  cy={cy}
                  rx={u * 0.88}
                  ry={u * 0.56}
                  fill={accent}
                />
              );
            case '×':
              return (
                <path
                  key={key}
                  d={`M${cx - u} ${cy - u} L${cx + u} ${cy + u} M${cx + u} ${cy - u} L${cx - u} ${cy + u}`}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeLinecap="round"
                />
              );
            case 'T':
              return (
                <path
                  key={key}
                  d={`M${cx - u} ${cy - u} L${cx + u} ${cy - u} M${cx} ${cy - u} L${cx} ${cy + u}`}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeLinecap="round"
                />
              );
            case 'Ŧ':
              return (
                <path
                  key={key}
                  d={`M${cx - u} ${cy - u} L${cx + u} ${cy - u} M${cx} ${cy - u} L${cx} ${cy + u} M${cx - u * 0.65} ${cy + u * 0.16} L${cx + u * 0.65} ${cy - u * 0.16}`}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeLinecap="round"
                />
              );
            case 'V':
              return (
                <path
                  key={key}
                  d={`M${cx - u} ${cy - u} L${cx} ${cy + u} L${cx + u} ${cy - u}`}
                  stroke={accent}
                  strokeWidth={sw}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            case 'Λ':
              return (
                <path
                  key={key}
                  d={`M${cx - u} ${cy + u} L${cx} ${cy - u} L${cx + u} ${cy + u}`}
                  stroke={accent}
                  strokeWidth={sw}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            case '✿':
              return (
                <g key={key}>
                  <circle cx={cx} cy={cy} r={u * 0.55} stroke={accent} strokeWidth={sw} />
                  {[0, 60, 120, 180, 240, 300].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <circle
                        key={deg}
                        cx={cx + Math.cos(rad) * u * 0.92}
                        cy={cy + Math.sin(rad) * u * 0.92}
                        r={Math.max(0.9, u * 0.28)}
                        fill={accent}
                      />
                    );
                  })}
                </g>
              );
            default:
              return null;
          }
        })
      )}
    </svg>
  );
};

