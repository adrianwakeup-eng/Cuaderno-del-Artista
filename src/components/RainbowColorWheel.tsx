import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Check, Copy, Maximize2, X } from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';

export interface RainbowColorWheelProps {
  color: string;
  onChange: (hex: string) => void;
  onCopyHex?: () => void;
  copiedHex?: boolean;
}

type WheelMode = 'itten' | 'copic' | 'hsl';

interface IttenHue {
  label: string;
  short: string;
  hex: string;
  angleDeg: number; // 0 = top (Yellow, matching reference wheel!)
}

// 12-hue classic Itten Artist Rainbow Wheel starting with YELLOW at 12 o'clock (exact match to reference!)
const ITTEN_HUES: IttenHue[] = [
  { label: 'Amarillo', short: 'Y', hex: '#FFF000', angleDeg: 0 },
  { label: 'Amarillo-Verde', short: 'YG', hex: '#88C425', angleDeg: 30 },
  { label: 'Verde', short: 'G', hex: '#009E49', angleDeg: 60 },
  { label: 'Verde-Azul', short: 'BG', hex: '#007C84', angleDeg: 90 },
  { label: 'Azul', short: 'B', hex: '#0056A7', angleDeg: 120 },
  { label: 'Azul-Violeta', short: 'BV', hex: '#5451A2', angleDeg: 150 },
  { label: 'Violeta', short: 'V', hex: '#662D91', angleDeg: 180 },
  { label: 'Rojo-Violeta', short: 'RV', hex: '#9E1F63', angleDeg: 210 },
  { label: 'Rojo', short: 'R', hex: '#E31E24', angleDeg: 240 },
  { label: 'Rojo-Naranja', short: 'RO', hex: '#F15A24', angleDeg: 270 },
  { label: 'Naranja', short: 'O', hex: '#F7941D', angleDeg: 300 },
  { label: 'Naranja-Amarillo', short: 'OY', hex: '#FDB913', angleDeg: 330 },
];

// Authentic Copic-inspired multi-ring radial families (5 concentric tint -> vivid -> deep levels + N0..N10 neutral ring!)
interface CopicFamily {
  prefix: string;
  name: string;
  // [outermost pale 000/02, pastel 04, vivid 07, rich 17, deep 29]
  swatches: Array<{ code: string; hex: string }>;
}

const COPIC_FAMILIES: CopicFamily[] = [
  {
    prefix: 'Y',
    name: 'Amarillo',
    swatches: [
      { code: 'Y00', hex: '#FFFDE0' },
      { code: 'Y02', hex: '#FFF799' },
      { code: 'Y06', hex: '#FFF200' },
      { code: 'Y18', hex: '#F5C400' },
      { code: 'Y28', hex: '#B3861B' },
    ],
  },
  {
    prefix: 'YG',
    name: 'Amarillo-Verde',
    swatches: [
      { code: 'YG00', hex: '#EEF8D5' },
      { code: 'YG03', hex: '#D3EA8B' },
      { code: 'YG07', hex: '#97CF42' },
      { code: 'YG17', hex: '#5E9F2E' },
      { code: 'YG67', hex: '#3D6A2F' },
    ],
  },
  {
    prefix: 'G',
    name: 'Verde',
    swatches: [
      { code: 'G00', hex: '#E3F7ED' },
      { code: 'G02', hex: '#A8E3C6' },
      { code: 'G05', hex: '#3EC182' },
      { code: 'G17', hex: '#148B56' },
      { code: 'G29', hex: '#18543A' },
    ],
  },
  {
    prefix: 'BG',
    name: 'Verde-Azul',
    swatches: [
      { code: 'BG00', hex: '#E0F7FA' },
      { code: 'BG02', hex: '#90E4EC' },
      { code: 'BG05', hex: '#28C0D0' },
      { code: 'BG09', hex: '#008A9B' },
      { code: 'BG18', hex: '#0F5C68' },
    ],
  },
  {
    prefix: 'B',
    name: 'Azul',
    swatches: [
      { code: 'B00', hex: '#E2F2FE' },
      { code: 'B02', hex: '#91CCF8' },
      { code: 'B06', hex: '#2A95E8' },
      { code: 'B26', hex: '#1A5EB8' },
      { code: 'B39', hex: '#193574' },
    ],
  },
  {
    prefix: 'BV',
    name: 'Azul-Violeta',
    swatches: [
      { code: 'BV00', hex: '#ECE8FB' },
      { code: 'BV02', hex: '#BDB4EE' },
      { code: 'BV04', hex: '#867AD6' },
      { code: 'BV08', hex: '#5A4CB0' },
      { code: 'BV29', hex: '#342A69' },
    ],
  },
  {
    prefix: 'V',
    name: 'Violeta',
    swatches: [
      { code: 'V00', hex: '#F6E8FA' },
      { code: 'V04', hex: '#DBA6EB' },
      { code: 'V06', hex: '#B463D4' },
      { code: 'V09', hex: '#7D2EA8' },
      { code: 'V17', hex: '#4F1B70' },
    ],
  },
  {
    prefix: 'RV',
    name: 'Rojo-Violeta',
    swatches: [
      { code: 'RV00', hex: '#FCE7F2' },
      { code: 'RV02', hex: '#F8B5D8' },
      { code: 'RV06', hex: '#EC64A8' },
      { code: 'RV17', hex: '#BF2873' },
      { code: 'RV29', hex: '#7F154B' },
    ],
  },
  {
    prefix: 'R',
    name: 'Rojo',
    swatches: [
      { code: 'R00', hex: '#FDE9E6' },
      { code: 'R02', hex: '#FBB5AC' },
      { code: 'R24', hex: '#F05A5B' },
      { code: 'R27', hex: '#D8232A' },
      { code: 'R59', hex: '#8A1727' },
    ],
  },
  {
    prefix: 'YR',
    name: 'Naranja',
    swatches: [
      { code: 'YR00', hex: '#FFF0E0' },
      { code: 'YR02', hex: '#FCC89B' },
      { code: 'YR04', hex: '#FB923C' },
      { code: 'YR07', hex: '#EA580C' },
      { code: 'YR18', hex: '#9A3412' },
    ],
  },
  {
    prefix: 'E',
    name: 'Tierra y Piel',
    swatches: [
      { code: 'E00', hex: '#FBECE2' },
      { code: 'E11', hex: '#ECC3A6' },
      { code: 'E21', hex: '#D49A71' },
      { code: 'E37', hex: '#A5643A' },
      { code: 'E49', hex: '#5A321C' },
    ],
  },
  {
    prefix: 'FY',
    name: 'Oro y Miel',
    swatches: [
      { code: 'FY0', hex: '#FFF9D6' },
      { code: 'FY1', hex: '#FDE68A' },
      { code: 'FY2', hex: '#FBBF24' },
      { code: 'FY3', hex: '#D97706' },
      { code: 'FY4', hex: '#92400E' },
    ],
  },
];

const NEUTRAL_RING: Array<{ code: string; hex: string }> = [
  { code: '0', hex: '#FFFFFF' },
  { code: 'N0', hex: '#ECEEEF' },
  { code: 'N1', hex: '#D8DCDF' },
  { code: 'N2', hex: '#C2C7CB' },
  { code: 'N3', hex: '#AAB0B5' },
  { code: 'N4', hex: '#90979D' },
  { code: 'N5', hex: '#777E85' },
  { code: 'N6', hex: '#5E656B' },
  { code: 'N7', hex: '#474D53' },
  { code: 'N8', hex: '#32373C' },
  { code: 'N9', hex: '#1F2327' },
  { code: 'N10', hex: '#0E1012' },
];

export const COPIC_SEARCH_ENTRIES: Array<{ name: string; hex: string }> = [
  ...COPIC_FAMILIES.flatMap((fam) =>
    fam.swatches.map((sw) => ({ name: `${sw.code} · ${fam.name}`, hex: sw.hex }))
  ),
  ...NEUTRAL_RING.map((n) => ({ name: `${n.code} · Neutro`, hex: n.hex })),
];

function polarToCartesian(cx: number, cy: number, r: number, angleDegFromTop: number) {
  const rad = ((angleDegFromTop - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function annularSectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number
): string {
  const p1 = polarToCartesian(cx, cy, rOuter, startDeg);
  const p2 = polarToCartesian(cx, cy, rOuter, endDeg);
  const p3 = polarToCartesian(cx, cy, rInner, endDeg);
  const p4 = polarToCartesian(cx, cy, rInner, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const hn = ((h % 360) + 360) % 360;
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hn < 60) [r, g, b] = [c, x, 0];
  else if (hn < 120) [r, g, b] = [x, c, 0];
  else if (hn < 180) [r, g, b] = [0, c, x];
  else if (hn < 240) [r, g, b] = [0, x, c];
  else if (hn < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgbString(hex: string): string {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  return `RGB(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

/** Interactive Itten Classic Rainbow Wheel with Central Primary/Secondary Star Hexagon */
const IttenRainbowWheelSvg: React.FC<{
  color: string;
  onSelect: (hex: string, label?: string) => void;
  large?: boolean;
}> = ({ color, onSelect, large = false }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const cx = 160;
  const cy = 160;

  // Classic Itten center star-hexagon vertices (matching uploaded reference image 1!)
  const pTop = polarToCartesian(cx, cy, 80, 0);        // Yellow tip
  const pTR = polarToCartesian(cx, cy, 80, 60);        // Green outer
  const pBR = polarToCartesian(cx, cy, 80, 120);       // Blue bottom-right
  const pBot = polarToCartesian(cx, cy, 80, 180);      // Purple tip
  const pBL = polarToCartesian(cx, cy, 80, 240);       // Red bottom-left
  const pTL = polarToCartesian(cx, cy, 80, 300);       // Orange outer

  // Midpoints along inner primary triangle edges for the 3-way split around center
  const mLeft = { x: (pTop.x + pBL.x) / 2, y: (pTop.y + pBL.y) / 2 };
  const mRight = { x: (pTop.x + pBR.x) / 2, y: (pTop.y + pBR.y) / 2 };
  const mBot = { x: (pBL.x + pBR.x) / 2, y: (pBL.y + pBR.y) / 2 };

  const pt = (p: { x: number; y: number }) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  const activeUpper = color.toUpperCase();

  return (
    <div className="relative flex flex-col items-center">
      <svg
        viewBox="0 0 320 320"
        className={`w-full select-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)] ${
          large ? 'max-w-[390px]' : 'max-w-[206px]'
        }`}
        role="img"
        aria-label="Rueda de Color Arcoíris Clásica"
      >
        {/* Outer classic light rim ring */}
        <circle cx={cx} cy={cy} r={154} fill="#e9e4da" stroke="#c89e5a" strokeWidth="2.5" />
        <circle cx={cx} cy={cy} r={130} fill="#ffffff" />

        {/* 12 Rainbow Hues Ring */}
        {ITTEN_HUES.map((hue, i) => {
          const start = hue.angleDeg - 15;
          const end = hue.angleDeg + 15;
          const selected = activeUpper === hue.hex.toUpperCase();
          const labelPos = polarToCartesian(cx, cy, 142, hue.angleDeg);
          const rot = hue.angleDeg > 90 && hue.angleDeg < 270 ? hue.angleDeg + 180 : hue.angleDeg;
          return (
            <g
              key={hue.short}
              className="cursor-pointer"
              onClick={() => {
                audioEngine.playYarnPluck(i);
                onSelect(hue.hex, hue.label);
              }}
              onMouseEnter={() => setHovered(`${hue.label} · ${hue.hex}`)}
              onMouseLeave={() => setHovered(null)}
            >
              <path
                d={annularSectorPath(cx, cy, 94, 130, start + 0.6, end - 0.6)}
                fill={hue.hex}
                stroke={selected ? '#ffffff' : '#f7f2e8'}
                strokeWidth={selected ? 3.2 : 1.4}
                className="transition-opacity hover:opacity-90"
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${rot}, ${labelPos.x}, ${labelPos.y})`}
                fill="#24160b"
                fontSize={large ? '8.2' : '7.4'}
                fontWeight="700"
                letterSpacing="0.03em"
              >
                {large ? hue.label.toUpperCase() : hue.short}
              </text>
            </g>
          );
        })}

        {/* Inner white circle framing the geometric Primary/Secondary Star Hexagon */}
        <circle cx={cx} cy={cy} r={92} fill="#fdfaf2" stroke="#d8c39b" strokeWidth="1.2" />

        {/* Secondary outer triangles: Orange (left), Green (right), Purple (bottom) */}
        {[
          { name: 'Naranja (Secundario)', hex: '#F7941D', pts: `${pt(pTop)} ${pt(pTL)} ${pt(pBL)}` },
          { name: 'Verde (Secundario)', hex: '#009E49', pts: `${pt(pTop)} ${pt(pTR)} ${pt(pBR)}` },
          { name: 'Violeta (Secundario)', hex: '#662D91', pts: `${pt(pBL)} ${pt(pBot)} ${pt(pBR)}` },
        ].map((sec, idx) => (
          <polygon
            key={sec.name}
            points={sec.pts}
            fill={sec.hex}
            stroke={activeUpper === sec.hex ? '#ffffff' : '#fdfaf2'}
            strokeWidth={activeUpper === sec.hex ? 3 : 1.4}
            className="cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => {
              audioEngine.playYarnPluck(idx + 2);
              onSelect(sec.hex, sec.name);
            }}
            onMouseEnter={() => setHovered(`${sec.name} · ${sec.hex}`)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Primary inner triangle split into Yellow (top), Red (bottom-left), Blue (bottom-right) */}
        {[
          {
            name: 'Amarillo (Primario)',
            hex: '#FFF000',
            pts: `${pt(pTop)} ${pt(mRight)} ${cx},${cy} ${pt(mLeft)}`,
          },
          {
            name: 'Rojo (Primario)',
            hex: '#E31E24',
            pts: `${pt(mLeft)} ${cx},${cy} ${pt(mBot)} ${pt(pBL)}`,
          },
          {
            name: 'Azul (Primario)',
            hex: '#0056A7',
            pts: `${pt(mRight)} ${pt(pBR)} ${pt(mBot)} ${cx},${cy}`,
          },
        ].map((pri, idx) => (
          <polygon
            key={pri.name}
            points={pri.pts}
            fill={pri.hex}
            stroke={activeUpper === pri.hex ? '#ffffff' : '#fdfaf2'}
            strokeWidth={activeUpper === pri.hex ? 3 : 1.2}
            className="cursor-pointer transition-opacity hover:opacity-90"
            onClick={() => {
              audioEngine.playYarnPluck(idx);
              onSelect(pri.hex, pri.name);
            }}
            onMouseEnter={() => setHovered(`${pri.name} · ${pri.hex}`)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>

      {hovered && (
        <span className="mt-1 px-2 py-0.5 rounded-full bg-[#1a0d05]/90 border border-[#c8964f]/45 text-[9.5px] text-[#fae7c2] font-mono-tab">
          {hovered}
        </span>
      )}
    </div>
  );
};

/** Interactive Copic-Style Concentric Multi-Ring Artist Wheel + N0-N10 Grayscale Ring */
const CopicConcentricWheelSvg: React.FC<{
  color: string;
  onSelect: (hex: string, label?: string) => void;
  large?: boolean;
}> = ({ color, onSelect, large = false }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const cx = 180;
  const cy = 180;
  const activeUpper = color.toUpperCase();

  // 5 radial tint/shade rings from innermost vivid/deep to outermost pastel
  const ringRadii: Array<[number, number]> = [
    [146, 174], // 00 outermost pale pastel
    [122, 146], // 02 pastel
    [98, 122],  // 05 vivid pure
    [76, 98],   // 17 rich saturated
    [56, 76],   // 29 deep shadow
  ];

  return (
    <div className="relative flex flex-col items-center">
      <svg
        viewBox="0 0 360 360"
        className={`w-full select-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)] ${
          large ? 'max-w-[430px]' : 'max-w-[208px]'
        }`}
        role="img"
        aria-label="Rueda de Color Copic Multinivel"
      >
        {/* Subtle parchment ring backing */}
        <circle cx={cx} cy={cy} r={176} fill="#1f1108" stroke="#c89e5a" strokeWidth="2" />

        {/* 12 Families × 5 Concentric Swatch Rings */}
        {COPIC_FAMILIES.map((fam, fIdx) => {
          const startDeg = fIdx * 30 - 15;
          const endDeg = startDeg + 30;
          const midDeg = fIdx * 30;
          return fam.swatches.map((sw, rIdx) => {
            const [rIn, rOut] = ringRadii[rIdx];
            const selected = activeUpper === sw.hex.toUpperCase();
            const labelPos = polarToCartesian(cx, cy, (rIn + rOut) / 2, midDeg);
            const rot = midDeg > 90 && midDeg < 270 ? midDeg + 180 : midDeg;
            const darkText = rIdx <= 1;
            return (
              <g
                key={sw.code}
                className="cursor-pointer"
                onClick={() => {
                  audioEngine.playYarnPluck((fIdx + rIdx) % 6);
                  onSelect(sw.hex, `${sw.code} · ${fam.name}`);
                }}
                onMouseEnter={() => setHovered(`${sw.code} (${fam.name}) · ${sw.hex}`)}
                onMouseLeave={() => setHovered(null)}
              >
                <path
                  d={annularSectorPath(cx, cy, rIn, rOut, startDeg + 0.45, endDeg - 0.45)}
                  fill={sw.hex}
                  stroke={selected ? '#ffffff' : 'rgba(25,13,5,0.45)'}
                  strokeWidth={selected ? 2.6 : 0.7}
                  className="transition-opacity hover:opacity-85"
                />
                {large && (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${rot}, ${labelPos.x}, ${labelPos.y})`}
                    fill={darkText ? '#1e130a' : '#fffdf7'}
                    fontSize="6.8"
                    fontWeight="700"
                    className="pointer-events-none"
                  >
                    {sw.code}
                  </text>
                )}
              </g>
            );
          });
        })}

        {/* Inner Neutral Grayscale Ring N0..N10 (matching Copic reference!) */}
        {NEUTRAL_RING.map((n, idx) => {
          const startDeg = idx * 30 - 15;
          const endDeg = startDeg + 30;
          const midDeg = idx * 30;
          const selected = activeUpper === n.hex.toUpperCase();
          const labelPos = polarToCartesian(cx, cy, 43, midDeg);
          return (
            <g
              key={n.code}
              className="cursor-pointer"
              onClick={() => {
                audioEngine.playYarnPluck(idx % 6);
                onSelect(n.hex, `${n.code} · Gris Neutro`);
              }}
              onMouseEnter={() => setHovered(`${n.code} (Neutro) · ${n.hex}`)}
              onMouseLeave={() => setHovered(null)}
            >
              <path
                d={annularSectorPath(cx, cy, 32, 54, startDeg + 0.5, endDeg - 0.5)}
                fill={n.hex}
                stroke={selected ? '#f7cf73' : 'rgba(20,10,4,0.45)'}
                strokeWidth={selected ? 2.4 : 0.7}
              />
              {large && (
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={idx <= 4 ? '#1d140c' : '#f7f1e3'}
                  fontSize="6.5"
                  fontWeight="700"
                  className="pointer-events-none"
                >
                  {n.code}
                </text>
              )}
            </g>
          );
        })}

        {/* Center active color jewel */}
        <circle cx={cx} cy={cy} r={28} fill={color} stroke="#f5d599" strokeWidth="2.5" />
      </svg>

      {hovered && (
        <span className="mt-1 px-2 py-0.5 rounded-full bg-[#1a0d05]/90 border border-[#c8964f]/45 text-[9.5px] text-[#fae7c2] font-mono-tab">
          {hovered}
        </span>
      )}
    </div>
  );
};

/** Continuous 360° Rainbow HSL Wheel with interactive Hue Ring + S/L Square */
const HslContinuousWheel: React.FC<{
  color: string;
  onChange: (hex: string) => void;
  large?: boolean;
}> = ({ color, onChange, large = false }) => {
  const [h, s, l] = useMemo(() => hexToHsl(color), [color]);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const pickFromRing = useCallback(
    (clientX: number, clientY: number) => {
      const el = ringRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      const nextH = ((angle % 360) + 360) % 360;
      onChange(hslToHex(nextH, Math.max(s, 65), Math.min(Math.max(l, 22), 78)));
    },
    [onChange, s, l]
  );

  const sizePx = large ? 280 : 186;
  const ringThickness = large ? 32 : 24;
  const knobRadius = sizePx / 2 - ringThickness / 2;
  const knobRad = ((h - 90) * Math.PI) / 180;
  const knobX = sizePx / 2 + knobRadius * Math.cos(knobRad);
  const knobY = sizePx / 2 + knobRadius * Math.sin(knobRad);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ringRef}
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          pickFromRing(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) pickFromRing(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        style={{
          width: sizePx,
          height: sizePx,
          background:
            'conic-gradient(from 0deg, #ff0000, #ff9900, #ffee00, #33cc33, #00cccc, #0066ff, #7733ff, #ee00aa, #ff0000)',
        }}
        className="relative rounded-full cursor-crosshair shadow-[0_6px_16px_rgba(0,0,0,0.45)] border-2 border-[#e6be74]/70"
      >
        {/* Inner dark mask & live active swatch + sliders */}
        <div
          style={{ inset: ringThickness }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute rounded-full bg-[#1b0e06] border border-[#c8964f]/55 flex flex-col items-center justify-center p-3 gap-1.5"
        >
          <span
            className="w-9 h-9 rounded-full border-2 border-[#ffe8b5] shadow-md"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] font-mono-tab text-[#f7e2bc] font-semibold">
            {color.toUpperCase()}
          </span>
          <span className="text-[8.5px] text-[#cfa770]">
            H:{h}° · S:{s}% · L:{l}%
          </span>
        </div>

        {/* Hue indicator knob */}
        <span
          style={{
            left: knobX - 7,
            top: knobY - 7,
            backgroundColor: hslToHex(h, 100, 50),
          }}
          className="pointer-events-none absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_6px_rgba(0,0,0,0.85)]"
        />
      </div>

      {/* Saturation & Lightness precision sliders */}
      <div className="w-full space-y-1 px-1">
        <div className="flex items-center gap-1.5 text-[9.5px] text-[#dfbe8f]">
          <span className="w-9 shrink-0">Satur.</span>
          <input
            type="range"
            min={0}
            max={100}
            value={s}
            onChange={(e) => onChange(hslToHex(h, Number(e.target.value), l))}
            className="flex-1 h-1.5 accent-[#e5b258] cursor-pointer"
          />
          <span className="w-7 text-right font-mono-tab">{s}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9.5px] text-[#dfbe8f]">
          <span className="w-9 shrink-0">Luz</span>
          <input
            type="range"
            min={4}
            max={96}
            value={l}
            onChange={(e) => onChange(hslToHex(h, s, Number(e.target.value)))}
            className="flex-1 h-1.5 accent-[#e5b258] cursor-pointer"
          />
          <span className="w-7 text-right font-mono-tab">{l}%</span>
        </div>
      </div>
    </div>
  );
};

export const RainbowColorWheel: React.FC<RainbowColorWheelProps> = ({
  color,
  onChange,
  onCopyHex,
  copiedHex = false,
}) => {
  const [mode, setMode] = useState<WheelMode>('itten');
  const [expanded, setExpanded] = useState(false);
  const [lastPickedLabel, setLastPickedLabel] = useState<string | null>(null);

  const [h, s, l] = useMemo(() => hexToHsl(color), [color]);

  const handleSelect = useCallback(
    (hex: string, label?: string) => {
      onChange(hex);
      if (label) setLastPickedLabel(label);
    },
    [onChange]
  );

  // Dynamic 7-step tint -> pure -> shade strip derived from the active wheel hue!
  const activeRamp = useMemo(
    () => [92, 78, 64, 50, 38, 26, 14].map((lum) => hslToHex(h, Math.max(s, 62), lum)),
    [h, s]
  );

  return (
    <div className="space-y-2">
      {/* Mode Switcher: Rueda Clásica (Itten) · Copic · HSL + Expand Button */}
      <div className="flex items-center gap-1">
        <div className="flex-1 grid grid-cols-3 gap-0.5 p-0.5 rounded-lg bg-[#140903] border border-[#b98241]/40 text-[9.5px]">
          {(
            [
              { id: 'itten', label: 'Arcoíris' },
              { id: 'copic', label: 'Copic' },
              { id: 'hsl', label: 'HSL' },
            ] as Array<{ id: WheelMode; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                setMode(tab.id);
              }}
              className={`py-0.5 px-1 rounded-md transition-colors cursor-pointer font-medium ${
                mode === tab.id
                  ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white shadow'
                  : 'text-[#d9bd94] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            audioEngine.playRetroPop(2);
            setExpanded(true);
          }}
          title="Ampliar Rueda de Color Arcoíris y Copic"
          aria-label="Ampliar rueda de color"
          className="p-1.5 rounded-lg bg-[#231208] hover:bg-[#412210] border border-[#c8964f]/45 text-[#f3cf8a] cursor-pointer transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>

      {/* Main Interactive Rainbow Wheel */}
      <div className="flex justify-center py-0.5">
        {mode === 'itten' && <IttenRainbowWheelSvg color={color} onSelect={handleSelect} />}
        {mode === 'copic' && <CopicConcentricWheelSvg color={color} onSelect={handleSelect} />}
        {mode === 'hsl' && <HslContinuousWheel color={color} onChange={onChange} />}
      </div>

      {/* Live 7-step Tint-to-Shade Strip for the Selected Wheel Hue */}
      {mode !== 'hsl' && (
        <div className="space-y-1">
          <div className="grid grid-cols-7 gap-1">
            {activeRamp.map((hex, i) => {
              const selected = color.toUpperCase() === hex.toUpperCase();
              return (
                <button
                  key={hex + i}
                  type="button"
                  onClick={() => {
                    audioEngine.playYarnPluck(i);
                    onChange(hex);
                  }}
                  title={`Matiz ${hex}`}
                  className={`h-4 rounded-[3px] border cursor-pointer transition-transform hover:scale-110 ${
                    selected ? 'border-white ring-1 ring-[#f4ca76] scale-110 z-10' : 'border-[#180c05]'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
          </div>
          {lastPickedLabel && (
            <p className="text-[9px] text-center text-[#d8b786] truncate">{lastPickedLabel}</p>
          )}
        </div>
      )}

      {/* Expanded Full-Size Artist Rainbow + Copic Wheel Modal */}
      {expanded && (
        <div
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl leather-panel bg-[#211108] border-2 border-[#d49d4b]/70 p-4 sm:p-5 text-[#f8e6c6] shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#b98241]/35 pb-2.5">
              <div>
                <h3 className="font-display text-lg text-[#ffebc2]">
                  Rueda de Color Arcoíris & Copic Pro
                </h3>
                <p className="text-[11px] text-[#d6b688]">
                  Selecciona tonos puros, primarios/secundarios, códigos Copic y neutros N0–N10
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Cerrar rueda ampliada"
                className="p-1.5 rounded-lg bg-[#6e212a] hover:bg-[#8c2d34] text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="inline-flex p-0.5 rounded-lg bg-[#140903] border border-[#b98241]/45 text-xs">
                {(
                  [
                    { id: 'itten', label: 'Arcoíris Clásico' },
                    { id: 'copic', label: 'Copic Códigos + N0–N10' },
                    { id: 'hsl', label: 'HSL Continuo' },
                  ] as Array<{ id: WheelMode; label: string }>
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      audioEngine.playStitchClick();
                      setMode(tab.id);
                    }}
                    className={`px-3 py-1 rounded-md cursor-pointer transition-colors ${
                      mode === tab.id
                        ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white font-semibold shadow'
                        : 'text-[#dec299] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-lg border-2 border-[#ffe6ad] shadow"
                  style={{ backgroundColor: color }}
                />
                <div className="text-[10.5px] leading-tight font-mono-tab">
                  <div className="text-[#ffebc2] font-bold">{color.toUpperCase()}</div>
                  <div className="text-[#cfa56d]">{hexToRgbString(color)}</div>
                </div>
                {onCopyHex && (
                  <button
                    type="button"
                    onClick={onCopyHex}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#351c0d] hover:bg-[#4e2a14] border border-[#c8964f]/50 text-[11px] text-[#ffebc2] cursor-pointer"
                  >
                    {copiedHex ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#9ef08c]" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#f0c06c]" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-center py-1">
              {mode === 'itten' && <IttenRainbowWheelSvg color={color} onSelect={handleSelect} large />}
              {mode === 'copic' && <CopicConcentricWheelSvg color={color} onSelect={handleSelect} large />}
              {mode === 'hsl' && <HslContinuousWheel color={color} onChange={onChange} large />}
            </div>

            {/* Active 7-step ramp in modal */}
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {activeRamp.map((hex, i) => (
                <button
                  key={hex + i}
                  type="button"
                  onClick={() => {
                    audioEngine.playYarnPluck(i);
                    onChange(hex);
                  }}
                  className={`h-7 rounded-md border flex items-end justify-center pb-0.5 text-[8.5px] font-mono-tab cursor-pointer transition-transform hover:scale-105 ${
                    color.toUpperCase() === hex.toUpperCase()
                      ? 'border-white ring-2 ring-[#f4ca76]'
                      : 'border-[#180c05]'
                  }`}
                  style={{
                    backgroundColor: hex,
                    color: i <= 2 ? '#1e130a' : '#fff8e8',
                  }}
                >
                  {hex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
