import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookMarked,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Cloud,
  Copy,
  DoorOpen,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FilePlus2,
  Flower2,
  FolderOpen,
  Frame,
  Grid3X3,
  Heart,
  HelpCircle,
  ImagePlus,
  Library,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer,
  PenTool,
  Pipette,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shapes,
  Sparkles,
  Square,
  Trash2,
  Type,
  Undo2,
  User,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  ActiveCanvasTool,
  BrushCategory,
  BrushPresetId,
  BrushSettings,
  PaperStyle,
  ShapeKind,
  StudioSection,
} from '../types/crochet';
import { audioEngine } from '../utils/audioEngine';
import {
  CATALOG_BRUSHES_BY_FAMILY,
  CATALOG_TEXTURE_BRUSHES,
  DIFUMINADO_PRESETS,
  HYPERREAL_PINCEL_PRESETS,
  LUZ_MAGICA_PRESETS,
  MAGIC_LIGHT_COLORS,
  TEXTURE_FAMILIES,
  TOTAL_TEXTURE_BRUSH_COUNT,
  getBrushPresetMeta,
  type BrushPresetMeta,
  type TextureFamilyId,
} from '../utils/hyperrealBrushEngine';
import { LiveTexturePreview, useFavoriteBrushes } from './TextureBrushSwatch';
import { YarnBall3D } from './CrochetDecorations';
import { MandalaNavIcon } from './CrochetMandalaSvg';

const CrochetGifIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <rect
      x="2.5"
      y="4"
      width="19"
      height="16"
      rx="3.2"
      stroke="currentColor"
      strokeWidth="1.9"
    />
    <path
      d="M7 4v2.5M12 4v2.5M17 4v2.5M7 17.5V20M12 17.5V20M17 17.5V20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <text
      x="12"
      y="14.2"
      textAnchor="middle"
      fill="currentColor"
      fontSize="7.4"
      fontWeight="800"
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      letterSpacing="0.4"
    >
      GIF
    </text>
  </svg>
);

export interface LayerVisibility {
  notes: boolean;
  drawing: boolean;
  images: boolean;
  background: boolean;
}

export type StackableLayerId = 'notes' | 'drawing' | 'images';

export type LayerAction =
  | { type: 'select-layer'; layer: StackableLayerId }
  | { type: 'add-note' }
  | { type: 'delete-active' }
  | { type: 'bring-front' }
  | { type: 'send-back' };

interface ColorPalettePanelProps {
  color: string;
  recentColors: string[];
  onSelectColor: (hex: string) => void;
  onActivateEyedropper?: () => void;
}

interface BrushStudioPanelProps {
  brush: BrushSettings;
  onChangeBrush: (patch: Partial<BrushSettings>) => void;
  onSelectEraser?: () => void;
}

interface EraserStudioPanelProps {
  brush: BrushSettings;
  onChangeBrush: (patch: Partial<BrushSettings>) => void;
  onClearPageStrokes: () => void;
}

export interface RightStudioDockProps {
  activeSection: StudioSection;
  activeTool: ActiveCanvasTool;
  selectedShapeKind: ShapeKind;
  brush: BrushSettings;
  recentColors: string[];
  paperStyle: PaperStyle;
  isCatalogSpread: boolean;
  activeSpreadTitle: string;
  currentSpreadIndex: number;
  totalBookSpreads: number;
  catalogCount: number;
  zoom: number;
  showOverview: boolean;
  hasSelectedElement: boolean;
  hasDrawings: boolean;
  hasElements: boolean;
  allRotateAngle: number;
  layerVisibility: LayerVisibility;
  layerOrder?: StackableLayerId[];
  selectedLayer?: StackableLayerId;
  canUndo: boolean;
  canRedo: boolean;
  driveConnected: boolean;
  sfxEnabled: boolean;
  focusMode: boolean;
  savedToast: string | null;
  onSelectColor: (hex: string) => void;
  onChangeBrush: (patch: Partial<BrushSettings>) => void;
  onSelectTool: (tool: ActiveCanvasTool) => void;
  onSelectShapeKind: (kind: ShapeKind) => void;
  onGoToSection: (section: StudioSection) => void;
  notebookMode?: 'book' | 'mandalas';
  onOpenMandalasSection?: () => void;
  onOpenBookSection?: () => void;
  onOpenVestidor?: () => void;
  onToggleLayerVisibility: (layer: keyof LayerVisibility) => void;
  onCyclePaperStyle: () => void;
  onLayerAction: (action: LayerAction) => void;
  onNewPage: () => void;
  onDeletePage?: () => void;
  canDeleteCurrentSpread?: boolean;
  onImportBackup: (file: File) => void;
  onSaveNow: () => void;
  onExportBackup: () => void;
  onExportImage8K?: () => void;
  onExportVectorSvg?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenImageUpload: () => void;
  onInsertMannequin: (view: 'front' | 'back') => void;
  onInsertWardrobe?: () => void;
  onOpenDrive: (tab?: 'backups' | 'images' | 'all') => void;
  onOpenHelp: () => void;
  onReturnToCover: () => void;
  onToggleSfx: () => void;
  onToggleFocusMode: () => void;
  onChangeSpreadIndex: (index: number) => void;
  onTurnPage: (dir: 'prev' | 'next') => void;
  onChangeZoom: (delta: number) => void;
  onToggleOverview: () => void;
  onUpdateSpreadTitle: (title: string) => void;
  onRotateAllElements: (mode: 'set' | 'delta' | 'reset', value: number) => void;
  onClearPageStrokes: () => void;
  onCloseMobileDrawer?: () => void;
}

const BASIC_COLORS = [
  '#F5E856', '#F4BA3C', '#E46A2E', '#D1262D', '#52B44B', '#FFFFFF',
  '#4AE040', '#2ED18E', '#3ABAF0', '#2B6EE8', '#4A36D1', '#C4C9D4',
  '#8C44F5', '#D63CE8', '#EB38A0', '#E85E79', '#253978', '#3B4254',
  '#F4DFB6', '#F2C0D0', '#CBE8B4', '#BFE3F7', '#D6C8F2', '#1C130E',
];

/* ---------- Color Conversion Helpers ---------- */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [78, 39, 18];
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [Number.isNaN(r) ? 78 : r, Number.isNaN(g) ? 39 : g, Number.isNaN(b) ? 18 : b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  ).toUpperCase();
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  const s = max === 0 ? 0 : d / max;
  return [h * 360, s, max];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const hn = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hn < 60) [rp, gp, bp] = [c, x, 0];
  else if (hn < 120) [rp, gp, bp] = [x, c, 0];
  else if (hn < 180) [rp, gp, bp] = [0, c, x];
  else if (hn < 240) [rp, gp, bp] = [0, x, c];
  else if (hn < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return [(rp + m) * 255, (gp + m) * 255, (bp + m) * 255];
}

/* ---------- 3D Bolted Dock Card Chrome ---------- */
const DockSectionCard: React.FC<{
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, headerRight, children }) => (
  <motion.section
    layout
    initial={{ opacity: 0, y: 8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -6, scale: 0.97 }}
    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    className="relative dock-card-3d rounded-xl overflow-hidden text-[#f7e5c3]"
  >
    <span className="pointer-events-none absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-[#e6b85c] shadow" />
    <span className="pointer-events-none absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#e6b85c] shadow" />
    <span className="pointer-events-none absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-[#b47e2f] shadow" />
    <span className="pointer-events-none absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-[#b47e2f] shadow" />

    <div className="dock-header-3d px-2 py-1 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-[#f5cb73] fill-[#f5cb73]/30 shrink-0" />
        <h3 className="font-editorial text-[12px] font-bold tracking-wide text-[#ffebc2]">
          {title}
        </h3>
      </div>
      {headerRight}
    </div>
    <div className="p-1.5">{children}</div>
  </motion.section>
);

/* ---------- Interactive Hue Wheel + SV Square ---------- */
const ColorWheelPicker: React.FC<{
  color: string;
  onChange: (hex: string) => void;
}> = ({ color, onChange }) => {
  const [r, g, b] = hexToRgb(color);
  const [hue, sat, val] = rgbToHsv(r, g, b);
  const wheelRef = useRef<HTMLDivElement>(null);
  const dragModeRef = useRef<'ring' | 'square' | null>(null);
  const lastSoundTimeRef = useRef(0);

  const size = 74;
  const center = size / 2;
  const outerR = size / 2;
  const innerR = 24;
  const sqSize = 33;
  const sqHalf = sqSize / 2;

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number, mode: 'ring' | 'square') => {
      const el = wheelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;

      const now = performance.now();
      if (now - lastSoundTimeRef.current > 95) {
        lastSoundTimeRef.current = now;
        audioEngine.playYarnPluck(Math.round(Math.abs(x + y)));
      }

      if (mode === 'ring') {
        const angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
        const nextHue = ((angle % 360) + 360) % 360;
        const [nr, ng, nb] = hsvToRgb(nextHue, Math.max(0.1, sat), Math.max(0.15, val));
        onChange(rgbToHex(nr, ng, nb));
      } else {
        const sx = Math.max(0, Math.min(1, (x + sqHalf) / sqSize));
        const sy = Math.max(0, Math.min(1, (y + sqHalf) / sqSize));
        const nextSat = sx;
        const nextVal = 1 - sy;
        const [nr, ng, nb] = hsvToRgb(hue, nextSat, nextVal);
        onChange(rgbToHex(nr, ng, nb));
      }
    },
    [hue, sat, val, onChange]
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragModeRef.current) return;
      updateFromPointer(e.clientX, e.clientY, dragModeRef.current);
    };
    const onUp = () => {
      dragModeRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [updateFromPointer]);

  const pureHueHex = (() => {
    const [hr, hg, hb] = hsvToRgb(hue, 1, 1);
    return rgbToHex(hr, hg, hb);
  })();

  const hueRad = ((hue - 90) * Math.PI) / 180;
  const ringMidR = (outerR + innerR) / 2;
  const ringThumbX = center + Math.cos(hueRad) * ringMidR;
  const ringThumbY = center + Math.sin(hueRad) * ringMidR;

  const sqThumbX = center - sqHalf + sat * sqSize;
  const sqThumbY = center - sqHalf + (1 - val) * sqSize;

  return (
    <div
      ref={wheelRef}
      style={{ width: size, height: size }}
      onPointerDown={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const mode = Math.abs(x) <= sqHalf && Math.abs(y) <= sqHalf ? 'square' : 'ring';
        dragModeRef.current = mode;
        updateFromPointer(e.clientX, e.clientY, mode);
      }}
      className="relative shrink-0 rounded-full cursor-crosshair select-none shadow-[0_3px_10px_rgba(0,0,0,0.85)]"
      title="Rueda cromática y selector de tono"
    >
      <div
        className="absolute inset-0 rounded-full border border-[#cfa158]/60"
        style={{
          background:
            'conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
        }}
      />
      <div
        className="absolute rounded-full bg-[#1a0d05] border border-[#cfa158]/50 shadow-inner"
        style={{
          inset: outerR - innerR,
        }}
      />
      <div
        className="absolute rounded-[3px] overflow-hidden border border-[#f5d599]/50"
        style={{
          width: sqSize,
          height: sqSize,
          left: center - sqHalf,
          top: center - sqHalf,
          backgroundColor: pureHueHex,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000000 100%)',
          }}
        />
      </div>

      <span
        style={{ left: ringThumbX, top: ringThumbY, transform: 'translate(-50%, -50%)' }}
        className="pointer-events-none absolute w-3 h-3 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.9)]"
      />
      <span
        style={{ left: sqThumbX, top: sqThumbY, transform: 'translate(-50%, -50%)' }}
        className="pointer-events-none absolute w-2.5 h-2.5 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.95)]"
      />
    </div>
  );
};

/* ---------- Tactile Textured Chalk/Brush Stroke Swatch ---------- */
const HyperrealBrushSwatch: React.FC<{
  presetId: BrushPresetId;
  color: string;
}> = ({ presetId, color }) => {
  const uid = `sw-${presetId}`;
  return (
    <svg viewBox="0 0 80 24" className="w-full h-[18px]" fill="none">
      {presetId === 'pelo-animal' ? (
        <g strokeLinecap="round">
          <path d="M10 17 Q26 10 42 13 T70 10" stroke={color} strokeWidth="2.8" strokeOpacity="0.22" />
          {[
            'M9 17 Q17 12 24 11', 'M14 19 Q23 13 31 12', 'M20 16 Q29 9 38 11',
            'M26 18 Q35 12 45 12', 'M33 15 Q42 9 52 11', 'M40 17 Q50 11 60 10',
            'M48 15 Q58 9 68 9', 'M54 17 Q63 12 72 11',
          ].map((d, i) => (
            <path
              key={i}
              d={d}
              stroke={i % 3 === 0 ? '#FFF3DE' : color}
              strokeWidth={i % 3 === 0 ? '0.9' : '1.3'}
              strokeOpacity={i % 3 === 0 ? '0.85' : '0.92'}
            />
          ))}
        </g>
      ) : presetId === 'cabello-seda' ? (
        <g strokeLinecap="round">
          {[-4, -2.2, -0.6, 1, 2.6, 4.2].map((dy, i) => (
            <path
              key={i}
              d={`M8 ${15 + dy} C24 ${8 + dy}, 42 ${18 + dy}, 72 ${10 + dy}`}
              stroke={i === 2 ? '#FFF5E4' : color}
              strokeWidth={i === 2 ? '1.05' : '1.25'}
              strokeOpacity={i === 2 ? '0.88' : '0.82'}
            />
          ))}
        </g>
      ) : presetId === 'arena-fina' ? (
        <g>
          <path d="M12 13 Q40 10 68 13" stroke={color} strokeWidth="9" strokeLinecap="round" strokeOpacity="0.16" />
          {[
            [14,13,1.2],[19,10,0.9],[23,15,1.3],[27,11,1.0],[31,14,1.4],[35,9,0.9],
            [39,13,1.2],[43,16,1.1],[47,11,1.3],[51,14,1.0],[55,10,1.2],[59,15,1.3],
            [63,11,0.9],[67,13,1.1],[21,12,0.8],[37,15,0.9],[49,13,1.1],[61,13,0.9],
          ].map(([cx, cy, r], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill={i % 4 === 0 ? '#FFF6E0' : i % 3 === 0 ? '#6E4A25' : color}
              fillOpacity={0.9}
            />
          ))}
        </g>
      ) : presetId === 'piel-poros' ? (
        <g>
          <ellipse cx="40" cy="12" rx="30" ry="7.5" fill={color} fillOpacity="0.28" />
          {[
            [18,12],[24,10],[29,14],[35,11],[41,13],[47,10],[53,14],[59,11],[64,13],[32,9],[45,15],[56,12],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="1.0" fill="#5D331E" fillOpacity="0.55" />
              <circle cx={cx - 0.8} cy={cy - 0.7} r="0.65" fill="#FFF2E6" fillOpacity="0.65" />
            </g>
          ))}
        </g>
      ) : presetId === 'plumas-finas' ? (
        <g strokeLinecap="round">
          <path d="M10 15 Q40 10 70 11" stroke="#FFF6E6" strokeWidth="1.2" strokeOpacity="0.88" />
          {[16, 22, 28, 34, 40, 46, 52, 58, 64].map((x, i) => (
            <g key={i} stroke={color} strokeWidth="1.05" strokeOpacity="0.86">
              <line x1={x} y1={13 - i * 0.22} x2={x - 5} y2={6} />
              <line x1={x} y1={13 - i * 0.22} x2={x - 4} y2={20} />
            </g>
          ))}
        </g>
      ) : presetId === 'hierba-follaje' ? (
        <g strokeLinecap="round">
          {[14, 21, 28, 35, 42, 49, 56, 63].map((x, i) => (
            <path
              key={i}
              d={`M${x} 20 Q${x + (i % 2 === 0 ? -3 : 4)} 12 ${x + (i % 2 === 0 ? -5 : 6)} ${5 + (i % 3)}`}
              stroke={i % 3 === 0 ? '#B7E292' : color}
              strokeWidth="1.45"
            />
          ))}
        </g>
      ) : presetId === 'roca-piedra' ? (
        <g>
          <polygon points="11,17 18,7 31,9 26,18" fill={color} fillOpacity="0.78" />
          <polygon points="29,18 35,6 50,8 46,19" fill="#6B625A" fillOpacity="0.72" />
          <polygon points="48,17 56,7 70,11 64,19" fill={color} fillOpacity="0.86" />
          <path d="M16 14 L27 11 L39 15 L54 10 L65 14" stroke="#2D241E" strokeWidth="1.1" strokeOpacity="0.7" />
          <path d="M17 13 L27 10 L39 14" stroke="#F4ECE2" strokeWidth="0.8" strokeOpacity="0.55" />
        </g>
      ) : presetId === 'tela-tejido' ? (
        <g strokeLinecap="round">
          {[6, 10, 14, 18].map((y) => (
            <line key={`h-${y}`} x1="12" y1={y} x2="68" y2={y} stroke={color} strokeWidth="1.4" strokeOpacity="0.78" />
          ))}
          {[16, 23, 30, 37, 44, 51, 58, 65].map((x) => (
            <line key={`v-${x}`} x1={x} y1="5" x2={x} y2="19" stroke="#F4DEC0" strokeWidth="1.2" strokeOpacity="0.58" />
          ))}
        </g>
      ) : presetId === 'agua-destellos' ? (
        <g>
          <path d="M10 14 Q28 8 44 14 T70 11" stroke={color} strokeWidth="5.5" strokeLinecap="round" strokeOpacity="0.28" />
          {[
            [20, 13, 3.6], [36, 11, 4.4], [52, 14, 3.8], [64, 10, 2.8],
          ].map(([cx, cy, r], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity="0.45" stroke="#E0F7FF" strokeWidth="0.8" />
              <circle cx={cx - r * 0.32} cy={cy - r * 0.34} r={r * 0.28} fill="#FFFFFF" fillOpacity="0.92" />
            </g>
          ))}
        </g>
      ) : presetId === 'oleo-cerdas' ? (
        <g strokeLinecap="round">
          <path d="M10 14 C24 8, 44 18, 70 10" stroke={color} strokeWidth="8.5" strokeOpacity="0.42" />
          {[-2.8, -1.2, 0.4, 2.0].map((dy, i) => (
            <path
              key={i}
              d={`M10 ${14 + dy} C24 ${8 + dy}, 44 ${18 + dy}, 70 ${10 + dy}`}
              stroke={i === 1 ? '#FFE4D0' : color}
              strokeWidth="1.5"
              strokeOpacity={i === 1 ? '0.62' : '0.92'}
            />
          ))}
        </g>
      ) : presetId === 'grafito-hiper' ? (
        <g strokeLinecap="round">
          <path d="M10 16 C25 10, 44 17, 70 9" stroke={color} strokeWidth="2.6" strokeOpacity="0.35" strokeDasharray="1.5 1.2" />
          <path d="M10 16 C25 10, 44 17, 70 9" stroke="#E8DFD2" strokeWidth="1.35" strokeOpacity="0.92" />
        </g>
      ) : presetId === 'brillo-estelar' ? (
        <g>
          {[
            [18, 13, 4.2], [35, 9, 5.2], [50, 14, 4.6], [64, 10, 3.6],
          ].map(([cx, cy, r], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r * 0.7} fill={color} fillOpacity="0.35" />
              <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#FFFFFF" strokeWidth="1.0" />
              <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#FFFFFF" strokeWidth="1.0" />
              <circle cx={cx} cy={cy} r="1.2" fill="#FFFFFF" />
            </g>
          ))}
        </g>
      ) : presetId.startsWith('luz-') ? (
        /* Radiant Luminescent Magic Light & Fairy-Dust Swatches */
        <g>
          <defs>
            <linearGradient id={`${uid}-beam`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.08" />
              <stop offset="50%" stopColor="#FFFDF2" stopOpacity="0.96" />
              <stop offset="100%" stopColor={color} stopOpacity="0.12" />
            </linearGradient>
            <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="38%" stopColor={color} stopOpacity="0.72" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>
          {presetId === 'luz-halo-etereo' ? (
            <>
              <ellipse cx="40" cy="12" rx="31" ry="8.5" fill={`url(#${uid}-glow)`} />
              <ellipse cx="40" cy="12" rx="18" ry="4.2" fill="#FFFDF4" fillOpacity="0.55" />
            </>
          ) : presetId === 'luz-rayo-solar' ? (
            <>
              <path
                d="M7 16 Q40 8 73 11"
                stroke={color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeOpacity="0.28"
              />
              <path
                d="M9 15 Q40 8.5 71 11.5"
                stroke={`url(#${uid}-beam)`}
                strokeWidth="5.2"
                strokeLinecap="round"
                strokeOpacity="0.88"
              />
              {[
                [20, 12, 1.3],
                [35, 9, 1.1],
                [52, 13, 1.4],
                [63, 10, 1.0],
              ].map(([cx, cy, r], i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill="#FFFFFF" fillOpacity="0.92" />
              ))}
            </>
          ) : presetId === 'luz-estela-magica' ? (
            <>
              <path
                d="M8 15 C22 7, 42 18, 72 9"
                stroke={color}
                strokeWidth="8.5"
                strokeLinecap="round"
                strokeOpacity="0.34"
              />
              <path
                d="M8 15 C22 7, 42 18, 72 9"
                stroke={color}
                strokeWidth="3.8"
                strokeLinecap="round"
                strokeOpacity="0.82"
              />
              <path
                d="M9 15 C22 7.2, 42 17.8, 71 9.2"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeOpacity="0.98"
              />
              {[
                [18, 9, 3.2],
                [46, 15, 3.6],
                [64, 8, 3.0],
              ].map(([cx, cy, r], i) => (
                <g key={i}>
                  <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#FFFFFF" strokeWidth="0.9" />
                  <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#FFFFFF" strokeWidth="0.9" />
                  <circle cx={cx} cy={cy} r="1.1" fill="#FFFFFF" />
                </g>
              ))}
            </>
          ) : presetId === 'luz-lluvia-estrellas' ? (
            <>
              <ellipse cx="40" cy="12" rx="28" ry="6.5" fill={color} fillOpacity="0.16" />
              {[
                [14, 14, 3.6],
                [27, 8, 4.8],
                [41, 14, 4.2],
                [54, 8, 5.0],
                [67, 13, 3.4],
              ].map(([cx, cy, r], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r={r * 0.65} fill={color} fillOpacity="0.4" />
                  <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#FFFDF4" strokeWidth="0.95" />
                  <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#FFFDF4" strokeWidth="0.95" />
                  <circle cx={cx} cy={cy} r="1.15" fill="#FFFFFF" />
                </g>
              ))}
            </>
          ) : (
            /* Polvo de Hada Solar (Principal) & Polvo Prisma Solar */
            <>
              <path
                d="M8 15 C22 8, 40 17, 72 9"
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeOpacity="0.28"
              />
              <path
                d="M10 14.5 C23 8.5, 40 16.5, 70 9.5"
                stroke={`url(#${uid}-beam)`}
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeOpacity="0.92"
              />
              {[
                [16, 11, 3.4, color],
                [32, 14, 4.4, presetId === 'luz-prisma-iris' ? '#FF8AD4' : color],
                [48, 9, 4.8, presetId === 'luz-prisma-iris' ? '#6BE0FF' : color],
                [64, 13, 3.6, presetId === 'luz-prisma-iris' ? '#64FFB0' : color],
              ].map(([cx, cy, r, c], i) => (
                <g key={i}>
                  <circle cx={cx as number} cy={cy as number} r={(r as number) * 0.72} fill={c as string} fillOpacity="0.45" />
                  <line
                    x1={(cx as number) - (r as number)}
                    y1={cy as number}
                    x2={(cx as number) + (r as number)}
                    y2={cy as number}
                    stroke="#FFFFFF"
                    strokeWidth="0.95"
                  />
                  <line
                    x1={cx as number}
                    y1={(cy as number) - (r as number)}
                    x2={cx as number}
                    y2={(cy as number) + (r as number)}
                    stroke="#FFFFFF"
                    strokeWidth="0.95"
                  />
                  <circle cx={cx as number} cy={cy as number} r="1.15" fill="#FFFFFF" />
                </g>
              ))}
              {[
                [23, 8, 1.0],
                [39, 17, 1.1],
                [56, 15, 0.95],
                [25, 16, 0.85],
                [58, 7, 1.05],
              ].map(([cx, cy, r], i) => (
                <circle key={`m-${i}`} cx={cx} cy={cy} r={r} fill="#FFFDF4" fillOpacity="0.95" />
              ))}
            </>
          )}
        </g>
      ) : (
        /* Silky Difuminados Smooth Gradient Swatch */
        <>
          <defs>
            <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.15" />
              <stop offset="48%" stopColor={color} stopOpacity="0.92" />
              <stop offset="100%" stopColor="#FFF7E8" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <path
            d="M8 15 C22 8, 36 18, 54 10 C64 6, 70 9, 74 12"
            stroke={`url(#${uid})`}
            strokeWidth={presetId === 'difuminado-esfumino' ? '5.5' : '11.5'}
            strokeLinecap="round"
            strokeOpacity="0.28"
          />
          <path
            d="M9 15 C22 8.5, 36 17.5, 54 10.5 C64 6.8, 69 9.5, 73 12"
            stroke={`url(#${uid})`}
            strokeWidth={presetId === 'difuminado-esfumino' ? '2.8' : '6.2'}
            strokeLinecap="round"
            strokeOpacity="0.58"
          />
          <path
            d="M11 14.5 C23 9, 36 17, 54 10.5 C64 7.5, 69 10, 72 11.8"
            stroke={color}
            strokeWidth={presetId === 'difuminado-esfumino' ? '1.5' : '2.8'}
            strokeLinecap="round"
            strokeOpacity="0.88"
          />
        </>
      )}
    </svg>
  );
};

const COLOR_CODE_CATALOG: Array<{ name: string; hex: string; tags: string }> = [
  // Oros, Metales & Luz
  { name: 'Oro Solar 24k', hex: '#FFD84D', tags: 'dorado oro luz sol amarillo' },
  { name: 'Oro Antiguo', hex: '#C89B3C', tags: 'dorado bronce museo marco' },
  { name: 'Oro Champán', hex: '#F3DFB1', tags: 'champan crema dorado claro' },
  { name: 'Bronce Imperial', hex: '#8C6239', tags: 'bronce cobre cafe madera' },
  { name: 'Cobre Bruñido', hex: '#B86B43', tags: 'cobre terracota naranja' },
  { name: 'Plata Lunar', hex: '#D8DEE6', tags: 'plata gris metalico luz' },
  // Pieles & Retrato Hiperrealista
  { name: 'Piel Porcelana', hex: '#FCE6D8', tags: 'piel rostro retrato claro' },
  { name: 'Piel Marfil Cálido', hex: '#F3CFAF', tags: 'piel rostro durazno retrato' },
  { name: 'Piel Miel Dorada', hex: '#DFA579', tags: 'piel bronceado retrato calido' },
  { name: 'Piel Canela', hex: '#B9784F', tags: 'piel morena retrato sombra' },
  { name: 'Piel Cacao Profundo', hex: '#6E3F26', tags: 'piel oscura sombra retrato' },
  { name: 'Rubor Rosado', hex: '#E5989B', tags: 'piel mejilla labio rosa' },
  { name: 'Labio Carmín', hex: '#A4303F', tags: 'labios rojo carmin vino' },
  { name: 'Sombra Ocular Sepia', hex: '#4E2712', tags: 'sombra piel ojo sepia cafe' },
  // Verdes Botánicos & Bosque
  { name: 'Verde Hoja Atelier', hex: '#1F4E3D', tags: 'verde bosque hoja cuaderno' },
  { name: 'Verde Esmeralda', hex: '#1E824C', tags: 'esmeralda hada joya verde' },
  { name: 'Verde Salvia', hex: '#8DA47E', tags: 'salvia pastel crochet hoja' },
  { name: 'Verde Oliva Antiguo', hex: '#6B7B3F', tags: 'oliva musgo naturaleza' },
  { name: 'Menta Luminosa', hex: '#8CE2B2', tags: 'menta verde claro pastel' },
  { name: 'Verde Ciprés', hex: '#26432F', tags: 'bosque pino oscuro sombra' },
  // Rojos, Rosas & Flores
  { name: 'Rojo Burdeos', hex: '#6E1423', tags: 'vino burdeos rojo oscuro' },
  { name: 'Rojo Carmesí', hex: '#C1121F', tags: 'rojo intenso sangre flor' },
  { name: 'Terracota Artesanal', hex: '#C95B3C', tags: 'terracota arcilla barro naranja' },
  { name: 'Coral Atardecer', hex: '#F2846B', tags: 'coral salmon rosa naranja' },
  { name: 'Rosa Antiguo', hex: '#C87D87', tags: 'rosa viejo vintage crochet' },
  { name: 'Rosa Pétalo', hex: '#F6C6CF', tags: 'rosa pastel flor suave' },
  { name: 'Magenta Real', hex: '#B8336A', tags: 'fucsia magenta flor' },
  // Azules, Cielos & Aguas
  { name: 'Azul Medianoche', hex: '#14213D', tags: 'azul oscuro noche marino' },
  { name: 'Azul Marino Clásico', hex: '#1D3557', tags: 'marino jean denim crochet' },
  { name: 'Azul Cobalto', hex: '#2B59C3', tags: 'azul rey cobalto intenso' },
  { name: 'Azul Cerúleo', hex: '#4A90D9', tags: 'cielo agua azul brillante' },
  { name: 'Azul Hielo', hex: '#CBE4F9', tags: 'celeste hielo invierno claro' },
  { name: 'Turquesa Egeo', hex: '#2A9D8F', tags: 'turquesa mar grecia agua' },
  // Violetas & Lavandas
  { name: 'Púrpura Imperial', hex: '#5A189A', tags: 'morado violeta realeza' },
  { name: 'Amatista', hex: '#8E54B5', tags: 'violeta amatista lila' },
  { name: 'Lavanda Suave', hex: '#C8B6E2', tags: 'lavanda lila pastel' },
  // Tierras, Maderas & Neutros
  { name: 'Blanco Puro', hex: '#FFFFFF', tags: 'blanco brillo ojo luz' },
  { name: 'Marfil Pergamino', hex: '#F7EFE0', tags: 'marfil crema papel hilo' },
  { name: 'Arena Natural', hex: '#DFC7A7', tags: 'arena beige lino crochet' },
  { name: 'Ocre Dorado', hex: '#CC8B3C', tags: 'ocre mostaza tierra' },
  { name: 'Siena Tostada', hex: '#8F4324', tags: 'siena madera ladrillo' },
  { name: 'Nogal Oscuro', hex: '#3E2516', tags: 'nogal madera chocolate cafe' },
  { name: 'Gris Grafito', hex: '#4A4E54', tags: 'gris lapiz sombra grafito' },
  { name: 'Gris Perla', hex: '#B8BDC4', tags: 'gris claro nube plata' },
  { name: 'Negro Azabache', hex: '#0B0B0D', tags: 'negro pupila carbon sombra' },
];

function parseColorQueryToHex(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const hexFull = s.match(/^#?([0-9a-fA-F]{6})$/);
  if (hexFull) {
    return `#${hexFull[1].toUpperCase()}`;
  }
  const hexShort = s.match(/^#?([0-9a-fA-F]{3})$/);
  if (hexShort) {
    const [r, g, b] = hexShort[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const rgbMatch = s.match(
    /^(?:rgba?\s*\(\s*)?(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})(?:\s*(?:,\s*[\d.]+\s*)?\))?$/i
  );
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, Number(rgbMatch[1])));
    const g = Math.min(255, Math.max(0, Number(rgbMatch[2])));
    const b = Math.min(255, Math.max(0, Number(rgbMatch[3])));
    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  return null;
}

function hexToRgbLabel(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '';
  return `rgb(${r}, ${g}, ${b})`;
}

/* ---------- Complete Animated Right Studio Command Dock ---------- */
export const RightStudioDock: React.FC<RightStudioDockProps> = ({
  activeSection,
  activeTool,
  selectedShapeKind,
  brush,
  recentColors,
  paperStyle,
  isCatalogSpread,
  activeSpreadTitle,
  currentSpreadIndex,
  totalBookSpreads,
  catalogCount,
  zoom,
  showOverview,
  hasSelectedElement,
  hasDrawings,
  hasElements,
  allRotateAngle,
  layerVisibility,
  layerOrder = ['notes', 'drawing', 'images'],
  selectedLayer,
  canUndo,
  canRedo,
  driveConnected,
  sfxEnabled,
  focusMode,
  savedToast,
  onSelectColor,
  onChangeBrush,
  onSelectTool,
  onSelectShapeKind,
  onGoToSection,
  notebookMode = 'book',
  onOpenMandalasSection,
  onOpenBookSection,
  onOpenVestidor,
  onToggleLayerVisibility,
  onCyclePaperStyle,
  onLayerAction,
  onNewPage,
  onDeletePage,
  canDeleteCurrentSpread = false,
  onImportBackup,
  onSaveNow,
  onExportBackup,
  onExportImage8K,
  onExportVectorSvg,
  onUndo,
  onRedo,
  onOpenImageUpload,
  onInsertMannequin,
  onInsertWardrobe,
  onOpenDrive,
  onOpenHelp,
  onReturnToCover,
  onToggleSfx,
  onToggleFocusMode,
  onChangeSpreadIndex,
  onTurnPage,
  onChangeZoom,
  onToggleOverview,
  onUpdateSpreadTitle,
  onRotateAllElements,
  onClearPageStrokes,
  onCloseMobileDrawer,
}) => {
  const [chalkMode, setChalkMode] = useState<'difuminados' | 'luz' | 'pinceles' | 'goma'>(
    activeTool === 'eraser'
      ? 'goma'
      : brush.category === 'luz'
        ? 'luz'
        : brush.category === 'pinceles'
          ? 'pinceles'
          : 'difuminados'
  );
  const [openDrawer, setOpenDrawer] = useState<'abrir' | 'exportar' | 'figuras' | 'imagen' | 'rotar' | null>(null);
  const [paletteFocus, setPaletteFocus] = useState<'todo' | 'color' | 'difuminados' | 'capas'>('todo');
  const [textureFamilyFilter, setTextureFamilyFilter] = useState<
    'destacados' | 'favoritos' | TextureFamilyId
  >('destacados');
  const [textureSearch, setTextureSearch] = useState('');
  const [visibleTextureCount, setVisibleTextureCount] = useState(24);
  const [colorQuery, setColorQuery] = useState('');
  const [copiedColorCode, setCopiedColorCode] = useState(false);
  const { favoriteSet, toggleFavorite } = useFavoriteBrushes();
  const importInputRef = useRef<HTMLInputElement>(null);

  const parsedDirectHex = useMemo(() => parseColorQueryToHex(colorQuery), [colorQuery]);
  const matchedColorSwatches = useMemo(() => {
    const q = colorQuery.trim().toLowerCase();
    if (!q) return [];
    const qNoHash = q.replace(/^#/, '');
    return COLOR_CODE_CATALOG.filter(
      (c) =>
        c.hex.toLowerCase().includes(qNoHash) ||
        c.name.toLowerCase().includes(q) ||
        c.tags.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [colorQuery]);

  const handleCopyActiveColor = async () => {
    const code = brush.color.toUpperCase();
    audioEngine.playSaveChime();
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        // ignore
      }
    }
    setCopiedColorCode(true);
    window.setTimeout(() => setCopiedColorCode(false), 1800);
  };

  useEffect(() => {
    if (activeTool === 'eraser') setChalkMode('goma');
    else if (brush.category === 'luz') setChalkMode('luz');
    else if (brush.category === 'pinceles') setChalkMode('pinceles');
    else setChalkMode('difuminados');
  }, [activeTool, brush.category]);

  useEffect(() => {
    setVisibleTextureCount(24);
  }, [textureFamilyFilter, textureSearch]);

  const handleElectronAction = (action: 'minimize' | 'maximize' | 'close') => {
    audioEngine.playStitchClick();
    const win = window as unknown as {
      electronAPI?: {
        minimize?: () => void;
        maximize?: () => void;
        close?: () => void;
      };
    };
    if (win.electronAPI?.[action]) {
      win.electronAPI[action]?.();
    } else if (action === 'close') {
      onReturnToCover();
    } else if (action === 'maximize') {
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        void document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  const toggleDrawer = (drawer: Exclude<typeof openDrawer, null>) => {
    audioEngine.playRetroPop(openDrawer === drawer ? -1 : 2);
    setOpenDrawer((prev) => (prev === drawer ? null : drawer));
  };

  const filteredPincelPresets: BrushPresetMeta[] = useMemo(() => {
    const q = textureSearch.trim().toLowerCase();
    if (q) {
      const matches: BrushPresetMeta[] = [];
      for (const p of HYPERREAL_PINCEL_PRESETS) {
        if (
          p.label.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        ) {
          matches.push(p);
        }
      }
      for (const c of CATALOG_TEXTURE_BRUSHES) {
        if (
          c.label.toLowerCase().includes(q) ||
          c.familyLabel.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        ) {
          matches.push(c);
        }
      }
      return matches;
    }
    if (textureFamilyFilter === 'destacados') return HYPERREAL_PINCEL_PRESETS;
    if (textureFamilyFilter === 'favoritos') {
      const favs: BrushPresetMeta[] = [];
      for (const p of HYPERREAL_PINCEL_PRESETS) {
        if (favoriteSet.has(p.id)) favs.push(p);
      }
      for (const c of CATALOG_TEXTURE_BRUSHES) {
        if (favoriteSet.has(c.id)) favs.push(c);
      }
      return favs;
    }
    return CATALOG_BRUSHES_BY_FAMILY[textureFamilyFilter] || [];
  }, [textureFamilyFilter, textureSearch, favoriteSet]);

  const swatchList =
    chalkMode === 'pinceles'
      ? filteredPincelPresets.slice(0, visibleTextureCount)
      : chalkMode === 'luz'
        ? LUZ_MAGICA_PRESETS
        : DIFUMINADO_PRESETS;
  const totalPincelCatalogCount = TOTAL_TEXTURE_BRUSH_COUNT + HYPERREAL_PINCEL_PRESETS.length;
  const activeBrushMeta = getBrushPresetMeta(brush.preset);
  const canPrev = currentSpreadIndex > 0;
  const canNext = currentSpreadIndex < totalBookSpreads - 1;

  return (
    <motion.aside
      aria-label="Barra principal unificada de herramientas, secciones y paletas"
      initial={{ opacity: 0, x: 26 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 26 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-30 flex flex-col gap-1 w-[282px] sm:w-[290px] xl:w-[298px] h-full py-1 pr-1 pl-0.5 shrink-0 select-none overflow-y-auto studio-scroll"
    >
      <input
        ref={importInputRef}
        type="file"
        accept=".json,.cuaderno.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportBackup(file);
          e.target.value = '';
        }}
      />

      {/* 1. UNIFIED STUDIO HEADER + MERGED NAVIGATION BAR */}
      <div className="carved-bar-3d rounded-xl p-1.5 shrink-0 space-y-1">
        {/* Title Row + Quick System Controls */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            <YarnBall3D tone="gold" className="w-5 h-5 shrink-0" />
            <h1 className="font-editorial italic font-bold text-[11.5px] sm:text-[12px] tracking-tight leading-tight gold-embossed-title whitespace-nowrap">
              Cuaderno del Artista
            </h1>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                if (!sfxEnabled) {
                  window.setTimeout(() => audioEngine.playToggleChime(true), 20);
                }
                onToggleSfx();
              }}
              title={sfxEnabled ? 'Efectos de sonido: Activos' : 'Efectos de sonido: Silencio'}
              className="p-[3px] rounded-md bg-[#2a1509]/85 border border-[#c99552]/35 text-[#f0cf93] hover:bg-[#492713] cursor-pointer"
            >
              {sfxEnabled ? (
                <Volume2 className="w-3 h-3" />
              ) : (
                <VolumeX className="w-3 h-3 opacity-60" />
              )}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                audioEngine.playStitchClick();
                onOpenHelp();
              }}
              title="Guía rápida"
              className="p-[3px] rounded-md bg-[#2a1509]/85 border border-[#c99552]/35 text-[#f0cf93] hover:bg-[#492713] cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onReturnToCover}
              title="Volver a la portada"
              className="p-[3px] rounded-md bg-[#2a1509]/85 border border-[#c99552]/35 text-[#f0cf93] hover:bg-[#492713] cursor-pointer"
            >
              <BookMarked className="w-3 h-3" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                audioEngine.playToggleChime(!focusMode);
                onToggleFocusMode();
              }}
              title="Modo concentración (expandir libro al máximo)"
              className="p-[3px] rounded-md bg-[#2a1509]/85 border border-[#c99552]/35 text-[#f0cf93] hover:bg-[#492713] cursor-pointer"
            >
              {focusMode ? (
                <Minimize2 className="w-3 h-3" />
              ) : (
                <Maximize2 className="w-3 h-3" />
              )}
            </motion.button>

            {onCloseMobileDrawer ? (
              <button
                type="button"
                onClick={onCloseMobileDrawer}
                title="Cerrar panel"
                className="p-1 rounded-md bg-[#6e212a] border border-[#e38b8f]/45 text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-0.5 rounded-md bg-[#1c0d06]/90 border border-[#b98241]/35 px-0.5 py-0.5">
                <button
                  type="button"
                  onClick={() => handleElectronAction('minimize')}
                  title="Minimizar"
                  className="p-0.5 text-[#f3d49a] hover:text-white hover:bg-[#5b3319] rounded cursor-pointer"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleElectronAction('maximize')}
                  title="Pantalla completa"
                  className="p-0.5 text-[#f3d49a] hover:text-white hover:bg-[#5b3319] rounded cursor-pointer"
                >
                  <Square className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleElectronAction('close')}
                  title="Cerrar / Portada"
                  className="p-0.5 text-[#f3d49a] hover:text-white hover:bg-[#8c2d34] rounded cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Merged Navigation Strip (Libro + Vestidor Real + Patrones + Fuentes + Mandala + Ajustes) */}
        <div className="grid grid-cols-6 gap-0.5 pt-0.5 border-t border-[#b98241]/25">
          <StudioToolTile
            pillId="studio-nav-pill"
            icon={<BookOpen className="w-3.5 h-3.5" />}
            label="Libro"
            active={activeSection === 'cuaderno' && notebookMode !== 'mandalas'}
            onClick={() => {
              audioEngine.playStitchClick();
              onOpenBookSection?.();
              onGoToSection('cuaderno');
            }}
          />
          <StudioToolTile
            pillId="studio-nav-pill"
            icon={<DoorOpen className="w-3.5 h-3.5 text-[#ffd878]" />}
            label="Vestidor"
            active={activeSection === 'armario' || activeSection === 'vestidor'}
            onClick={() => {
              if (onOpenVestidor) {
                onOpenVestidor();
              } else {
                audioEngine.playWardrobeDoor(true);
                onGoToSection('armario');
              }
            }}
          />
          <StudioToolTile
            pillId="studio-nav-pill"
            icon={<Library className="w-3.5 h-3.5" />}
            label="Patron."
            active={activeSection === 'patrones'}
            onClick={() => {
              audioEngine.playRetroPop(1);
              onGoToSection('patrones');
            }}
          />
          <StudioToolTile
            pillId="studio-nav-pill"
            icon={<span className="font-editorial font-bold text-[12px] leading-none">Aa</span>}
            label="Fuentes"
            active={activeSection === 'fuentes'}
            onClick={() => {
              audioEngine.playRetroPop(3);
              onGoToSection('fuentes');
            }}
          />
          <StudioToolTile
            pillId="studio-nav-pill"
            icon={<MandalaNavIcon className="w-3.5 h-3.5" />}
            label="Mandala"
            active={activeSection === 'cuaderno' && notebookMode === 'mandalas'}
            onClick={() => {
              audioEngine.playRetroPop(2);
              onOpenMandalasSection?.();
            }}
          />
          <StudioToolTile
            pillId="studio-nav-pill"
            icon={<Settings className="w-3.5 h-3.5" />}
            label="Ajustes"
            active={activeSection === 'configuracion'}
            onClick={() => {
              audioEngine.playStitchClick();
              onGoToSection('configuracion');
            }}
          />
        </div>
      </div>

      {/* Inline animated Toast inside the right panel so it never covers the book */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className="shrink-0 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#ffebc2] bg-gradient-to-r from-[#5a3217] via-[#7a4520] to-[#5a3217] border border-[#f0c577]/70 px-2.5 py-1 rounded-lg shadow-md"
          >
            <Sparkles className="w-3 h-3 text-[#ffe08c]" />
            <span className="truncate">{savedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ARCHIVO & HISTORIAL CARVED STRIP */}
      <div className="carved-bar-3d rounded-xl p-1 shrink-0">
        <div className="grid grid-cols-6 gap-1">
          <StudioActionTile
            icon={<FilePlus2 className="w-3 h-3" />}
            label="Nuevo"
            onClick={() => {
              setOpenDrawer(null);
              onNewPage();
            }}
          />
          <StudioActionTile
            icon={<FolderOpen className="w-3 h-3" />}
            label="Abrir"
            active={openDrawer === 'abrir'}
            onClick={() => toggleDrawer('abrir')}
          />
          <StudioActionTile
            icon={<Save className="w-3 h-3" />}
            label="Guard."
            onClick={() => {
              setOpenDrawer(null);
              audioEngine.playSaveChime();
              onSaveNow();
            }}
          />
          <StudioActionTile
            icon={<Undo2 className="w-3 h-3" />}
            label="Atrás"
            disabled={!canUndo}
            onClick={onUndo}
          />
          <StudioActionTile
            icon={<Redo2 className="w-3 h-3" />}
            label="Adel."
            disabled={!canRedo}
            onClick={onRedo}
          />
          <StudioActionTile
            icon={<Download className="w-3 h-3" />}
            label="Export."
            active={openDrawer === 'exportar'}
            onClick={() => toggleDrawer('exportar')}
          />
        </div>

        {/* Inline Animated Drawer: Exportar 8K PNG / Vector SVG / Respaldo .json */}
        <AnimatePresence initial={false}>
          {openDrawer === 'exportar' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 pt-1.5 border-t border-[#b98241]/30 space-y-1">
                {onExportImage8K && (
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playSaveChime();
                      onExportImage8K();
                      setOpenDrawer(null);
                    }}
                    title="Guardar la hoja actual super-renderizada en 8K PNG (7680×5008 px) sin pixelación"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-gradient-to-b from-[#d89b38] to-[#9b5f12] hover:brightness-110 border border-[#ffe18c]/55 text-[11px] font-semibold text-[#fff9e8] cursor-pointer shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#fff2b8]" />
                    <span>Guardar Imagen 8K PNG</span>
                  </button>
                )}
                <div className="grid grid-cols-2 gap-1">
                  {onExportVectorSvg && (
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playSaveChime();
                        onExportVectorSvg();
                        setOpenDrawer(null);
                      }}
                      title="Exportar hoja en formato vectorial SVG de nitidez infinita"
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#234334] hover:bg-[#2d5844] border border-[#8ce0b8]/45 text-[10.5px] font-medium text-[#e6fff2] cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-[#9cf0c8]" />
                      <span>Vector SVG</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playSaveChime();
                      onExportBackup();
                      setOpenDrawer(null);
                    }}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#2b160a] hover:bg-[#4e2a14] border border-[#c99552]/40 text-[10.5px] text-[#f5dfba] cursor-pointer ${
                      onExportVectorSvg ? '' : 'col-span-2'
                    }`}
                  >
                    <Download className="w-3 h-3 text-[#f0c77c]" />
                    <span>Respaldo .json</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline Animated Drawer: Abrir respaldo / Drive */}
        <AnimatePresence initial={false}>
          {openDrawer === 'abrir' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 pt-1.5 border-t border-[#b98241]/30 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playStitchClick();
                    importInputRef.current?.click();
                    setOpenDrawer(null);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#2b160a] hover:bg-[#4e2a14] border border-[#c99552]/40 text-[11px] text-[#f5dfba] cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-[#f0c77c]" />
                  <span>Archivo .json</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playRetroPop(2);
                    onOpenDrive('backups');
                    setOpenDrawer(null);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#253b28]/70 hover:bg-[#325136] border border-[#84c78d]/45 text-[11px] text-[#e4f7e6] cursor-pointer"
                >
                  <Cloud
                    className={`w-3.5 h-3.5 ${driveConnected ? 'text-[#7fe0aa]' : 'text-[#9fd3a6]'}`}
                  />
                  <span>Google Drive</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. HERRAMIENTAS DE CREACIÓN (GRID ANIMADA) */}
      <div className="carved-bar-3d rounded-xl p-1.5 shrink-0">
        <div className="grid grid-cols-3 gap-1">
          <StudioToolTile
            icon={<MousePointer className="w-3.5 h-3.5" />}
            label="Mover"
            active={activeSection === 'cuaderno' && activeTool === 'select'}
            onClick={() => {
              audioEngine.playRetroPop(0);
              onGoToSection('cuaderno');
              onSelectTool('select');
              setOpenDrawer(null);
            }}
          />
          <StudioToolTile
            icon={<Type className="w-3.5 h-3.5" />}
            label="Texto"
            active={activeSection === 'cuaderno' && activeTool === 'text'}
            onClick={() => {
              audioEngine.playRetroPop(1);
              onGoToSection('cuaderno');
              onSelectTool('text');
              setOpenDrawer(null);
              onCloseMobileDrawer?.();
            }}
          />
          <StudioToolTile
            icon={<Volume2 className="w-3.5 h-3.5" />}
            label="Leer"
            active={activeSection === 'cuaderno' && activeTool === 'read'}
            onClick={() => {
              audioEngine.playToggleChime(activeTool !== 'read');
              onGoToSection('cuaderno');
              onSelectTool(activeTool === 'read' ? 'select' : 'read');
              setOpenDrawer(null);
              onCloseMobileDrawer?.();
            }}
          />
          <StudioToolTile
            icon={<PenTool className="w-3.5 h-3.5" />}
            label="Dibujo"
            active={activeSection === 'cuaderno' && activeTool === 'draw'}
            onClick={() => {
              audioEngine.playYarnPluck(1);
              onGoToSection('cuaderno');
              onSelectTool('draw');
              setOpenDrawer(null);
            }}
          />
          <StudioToolTile
            icon={<Pipette className="w-3.5 h-3.5" />}
            label="Gotero"
            active={activeSection === 'cuaderno' && activeTool === 'eyedropper'}
            onClick={() => {
              audioEngine.playYarnPluck(3);
              onGoToSection('cuaderno');
              onSelectTool(activeTool === 'eyedropper' ? 'draw' : 'eyedropper');
              setOpenDrawer(null);
            }}
          />
          <StudioToolTile
            icon={<Shapes className="w-3.5 h-3.5" />}
            label="Figuras"
            active={openDrawer === 'figuras' || (activeSection === 'cuaderno' && activeTool === 'shape')}
            onClick={() => toggleDrawer('figuras')}
          />
          <StudioToolTile
            icon={<ImagePlus className="w-3.5 h-3.5" />}
            label="Imagen"
            active={openDrawer === 'imagen'}
            onClick={() => toggleDrawer('imagen')}
          />
          <StudioToolTile
            icon={<Flower2 className="w-3.5 h-3.5" />}
            label="Stickers"
            active={activeSection === 'stickers'}
            onClick={() => {
              audioEngine.playYarnPluck(5);
              onGoToSection('stickers');
              setOpenDrawer(null);
            }}
          />
          <StudioToolTile
            icon={<CrochetGifIcon className="w-3.5 h-3.5" />}
            label="Stickers HD"
            active={activeSection === 'gifs'}
            onClick={() => {
              audioEngine.playRetroPop(2);
              onGoToSection('gifs');
              setOpenDrawer(null);
            }}
          />
          <button
            type="button"
            onClick={() => {
              audioEngine.playToggleChime(true);
              onGoToSection('marcos');
              setOpenDrawer(null);
              onCloseMobileDrawer?.();
            }}
            title="Galería de Marcos de Museo: Oro, Madera, Naturaleza y Puntillas Tejidas"
            className={`col-span-3 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${
              activeSection === 'marcos'
                ? 'bg-gradient-to-b from-[#d99d45] to-[#985c1d] border-[#ffe3a3] text-white font-semibold shadow-[0_0_12px_rgba(243,191,85,0.45)]'
                : 'bg-[#211107]/90 hover:bg-[#361c0c] border-[#b98241]/45 hover:border-[#e6b868] text-[#f5dfb8]'
            }`}
          >
            <Frame className="w-3.5 h-3.5 text-[#f6cc74]" />
            <span className="text-[11px] font-medium tracking-wide">
              Marcos · Oro, Madera y Puntillas
            </span>
          </button>
        </div>

        {/* Inline Animated Drawer: Figuras */}
        <AnimatePresence initial={false}>
          {openDrawer === 'figuras' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 pt-1.5 border-t border-[#b98241]/30 grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'crochet-ring', label: 'Anillo', icon: <Shapes className="w-3.5 h-3.5" /> },
                    { id: 'circle', label: 'Círculo', icon: <Circle className="w-3.5 h-3.5" /> },
                    { id: 'square', label: 'Cuadro', icon: <Square className="w-3.5 h-3.5" /> },
                    { id: 'arrow', label: 'Flecha', icon: <ArrowRight className="w-3.5 h-3.5" /> },
                    { id: 'line', label: 'Línea', icon: <Minus className="w-3.5 h-3.5" /> },
                    { id: 'heart', label: 'Corazón', icon: <Heart className="w-3.5 h-3.5" /> },
                  ] as Array<{ id: ShapeKind; label: string; icon: React.ReactNode }>
                ).map((sh, i) => (
                  <motion.button
                    key={sh.id}
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      audioEngine.playYarnPluck(i);
                      onSelectShapeKind(sh.id);
                      onGoToSection('cuaderno');
                      onSelectTool('shape');
                    }}
                    className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-[10px] border cursor-pointer transition-colors ${
                      activeTool === 'shape' && selectedShapeKind === sh.id
                        ? 'bg-[#8d5222] border-[#ffe3a3] text-white font-medium shadow'
                        : 'bg-[#211007] border-[#8b5d31]/40 text-[#e8cfab] hover:bg-[#492915]'
                    }`}
                  >
                    {sh.icon}
                    <span>{sh.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline Animated Drawer: Imagen & Maniquíes */}
        <AnimatePresence initial={false}>
          {openDrawer === 'imagen' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 pt-1.5 border-t border-[#b98241]/30 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playStitchClick();
                    onOpenImageUpload();
                    setOpenDrawer(null);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#2b160a] hover:bg-[#4e2a14] border border-[#c99552]/40 text-[11px] text-[#f5dfba] cursor-pointer"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-[#f3cf8a]" />
                  <span>Desde equipo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playRetroPop(2);
                    onOpenDrive('images');
                    setOpenDrawer(null);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#253b28]/70 hover:bg-[#325136] border border-[#84c78d]/45 text-[11px] text-[#e4f7e6] cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5 text-[#9fd3a6]" />
                  <span>Google Drive</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playYarnPluck(2);
                    onInsertMannequin('front');
                    setOpenDrawer(null);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#381d0e] hover:bg-[#592f17] border border-[#d69f56]/45 text-[11px] text-[#f7e2bc] cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#f3cf8a]" />
                  <span>Maniquí Hombre</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playYarnPluck(4);
                    onInsertMannequin('back');
                    setOpenDrawer(null);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-[#381d0e] hover:bg-[#592f17] border border-[#d69f56]/45 text-[11px] text-[#f7e2bc] cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#f3cf8a]" />
                  <span>Maniquí Mujer</span>
                </button>
                {onInsertWardrobe && (
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playWardrobeDoor(true);
                      onInsertWardrobe();
                      setOpenDrawer(null);
                    }}
                    className="col-span-2 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-gradient-to-b from-[#6a3b19] to-[#45230c] hover:from-[#7f4920] hover:to-[#562c10] border border-[#e6b462]/60 text-[11px] font-medium text-[#ffebc2] cursor-pointer shadow"
                  >
                    <DoorOpen className="w-3.5 h-3.5 text-[#ffd98a]" />
                    <span>Armario 3D de Crochet</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. NAVEGACIÓN DE PÁGINAS, PAPEL & ZOOM DEL LIBRO */}
      {activeSection === 'cuaderno' && (
        <div className="carved-bar-3d rounded-xl p-1.5 shrink-0 space-y-1">
          {/* Quick switch Patrones vs Mis Hojas + Spread Title */}
          <div className="flex items-center gap-1">
            <div className="flex-1 grid grid-cols-2 gap-0.5 p-0.5 rounded-lg bg-[#160a04]/85 border border-[#b98241]/35 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  audioEngine.playPageFlip();
                  onOpenBookSection?.();
                  onGoToSection('cuaderno');
                  onChangeSpreadIndex(0);
                }}
                className={`py-0.5 px-1.5 rounded-md transition-colors cursor-pointer truncate ${
                  notebookMode !== 'mandalas' && isCatalogSpread
                    ? 'bg-gradient-to-b from-[#d1974c] to-[#8c5422] text-white font-medium shadow'
                    : 'text-[#dec39c] hover:text-white'
                }`}
              >
                Patrones (1–{catalogCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playPageFlip();
                  onOpenBookSection?.();
                  onGoToSection('cuaderno');
                  onChangeSpreadIndex(catalogCount);
                }}
                className={`py-0.5 px-1.5 rounded-md transition-colors cursor-pointer truncate ${
                  notebookMode !== 'mandalas' && !isCatalogSpread
                    ? 'bg-gradient-to-b from-[#d1974c] to-[#8c5422] text-white font-medium shadow'
                    : 'text-[#dec39c] hover:text-white'
                }`}
              >
                Mis Hojas ({catalogCount + 1}+)
              </button>
            </div>
          </div>

          {/* Editable Sheet Title (when on editable sheet) */}
          {!isCatalogSpread ? (
            <input
              type="text"
              value={activeSpreadTitle}
              onChange={(e) => onUpdateSpreadTitle(e.target.value)}
              aria-label="Título de la hoja"
              placeholder="Título de la hoja…"
              className="w-full h-7 rounded-lg bg-[#180c05]/90 border border-[#b98241]/35 font-body text-[11px] leading-[1.35] text-[#f8e4bd] px-2 py-0.5 focus:outline-none focus:border-[#f0c577]"
            />
          ) : (
            <div className="px-2 py-0.5 text-[11px] font-editorial italic text-[#e4c490] truncate">
              {activeSpreadTitle}
            </div>
          )}

          {/* ← Página X / Y → + Nueva hoja */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5 rounded-lg bg-[#180c05]/90 border border-[#b98241]/35 px-1 py-0.5 flex-1 justify-between">
              <motion.button
                type="button"
                whileHover={canPrev ? { scale: 1.12 } : undefined}
                whileTap={canPrev ? { scale: 0.9 } : undefined}
                disabled={!canPrev}
                onClick={() => onTurnPage('prev')}
                aria-label="Página anterior"
                className="p-0.5 rounded text-[#f3dcb3] hover:bg-[#593319] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </motion.button>
              <span className="text-[11px] font-mono-tab text-[#f8e6c4]">
                Pág {currentSpreadIndex + 1} / {totalBookSpreads}
              </span>
              <motion.button
                type="button"
                whileHover={canNext ? { scale: 1.12 } : undefined}
                whileTap={canNext ? { scale: 0.9 } : undefined}
                disabled={!canNext}
                onClick={() => onTurnPage('next')}
                aria-label="Página siguiente"
                className="p-0.5 rounded text-[#f3dcb3] hover:bg-[#593319] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.92 }}
              onClick={onNewPage}
              title="Añadir nueva hoja editable"
              className="px-2 py-1 rounded-lg bg-gradient-to-b from-[#c9883e] to-[#874d1b] border border-[#f5d290]/65 text-[11px] font-medium text-white flex items-center gap-1 cursor-pointer shadow"
            >
              <Plus className="w-3 h-3" />
              <span>Hoja</span>
            </motion.button>

            {onDeletePage && !isCatalogSpread && notebookMode === 'book' && (
              <motion.button
                type="button"
                whileHover={canDeleteCurrentSpread ? { scale: 1.07 } : undefined}
                whileTap={canDeleteCurrentSpread ? { scale: 0.92 } : undefined}
                disabled={!canDeleteCurrentSpread}
                onClick={onDeletePage}
                aria-label="Eliminar estas dos páginas"
                title={
                  canDeleteCurrentSpread
                    ? 'Eliminar estas dos páginas'
                    : 'Debe quedar al menos una hoja editable'
                }
                className="p-1.5 rounded-lg bg-[#3b1512] hover:bg-[#5c1e19] border border-[#d66d5e]/55 text-[#ffcfc5] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed shadow"
              >
                <Trash2 className="w-3 h-3" />
              </motion.button>
            )}
          </div>

          {/* Vista + Papel + Rotar + Zoom */}
          <div className="flex items-center justify-between gap-1 text-[10px]">
            <motion.button
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => {
                audioEngine.playRetroPop(1);
                onToggleOverview();
              }}
              title="Vista general de hojas"
              className={`px-1.5 py-0.5 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${
                showOverview
                  ? 'bg-[#8d5222] border-[#ffe3a3] text-white'
                  : 'bg-[#1c0d06] border-[#b98241]/35 text-[#f3dcb3] hover:bg-[#4b2914]'
              }`}
            >
              <Grid3X3 className="w-3 h-3" />
              <span>Índice</span>
            </motion.button>

            {!isCatalogSpread && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  audioEngine.playToggleChime(true);
                  onCyclePaperStyle();
                }}
                title={`Estilo de papel: ${
                  paperStyle === 'grid'
                    ? 'Cuadrícula'
                    : paperStyle === 'dots'
                      ? 'Puntos'
                      : 'Pergamino'
                }`}
                className="px-1.5 py-0.5 rounded-lg bg-[#1c0d06] hover:bg-[#4b2914] border border-[#b98241]/35 text-[#f3dcb3] cursor-pointer shrink-0"
              >
                {paperStyle === 'grid'
                  ? 'Cuadr.'
                  : paperStyle === 'dots'
                    ? 'Puntos'
                    : 'Liso'}
              </motion.button>
            )}

            {!isCatalogSpread && hasElements && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => toggleDrawer('rotar')}
                title="Rotar todos los objetos"
                className={`px-1.5 py-0.5 rounded-lg border flex items-center gap-0.5 cursor-pointer transition-colors shrink-0 ${
                  openDrawer === 'rotar'
                    ? 'bg-[#8d5222] border-[#ffe3a3] text-white'
                    : 'bg-[#1c0d06] border-[#b98241]/35 text-[#f3dcb3] hover:bg-[#4b2914]'
                }`}
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Rotar</span>
              </motion.button>
            )}

            <div className="flex items-center gap-0.5 rounded-lg bg-[#180c05]/90 border border-[#b98241]/35 px-1 py-0.5 ml-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  audioEngine.playStitchClick();
                  onChangeZoom(-20);
                }}
                aria-label="Alejar"
                title="Alejar (Ctrl -)"
                className="p-0.5 rounded text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
              >
                <ZoomOut className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playStitchClick();
                  onChangeZoom(100 - zoom);
                }}
                title="Restablecer zoom al 100% (Ctrl 0)"
                className="font-mono-tab text-[10px] text-[#f8e6c4] hover:text-[#ffe39f] w-9 text-center cursor-pointer"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playStitchClick();
                  onChangeZoom(20);
                }}
                aria-label="Acercar"
                title="Acercar (Ctrl +)"
                className="p-0.5 rounded text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
              >
                <ZoomIn className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Inline Animated Drawer: Rotar Todos */}
          <AnimatePresence initial={false}>
            {openDrawer === 'rotar' && !isCatalogSpread && hasElements && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-1.5 border-t border-[#b98241]/30 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#dec49d]">Rotar todos ({allRotateAngle}°)</span>
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playStitchClick();
                        onRotateAllElements('reset', 0);
                      }}
                      className="text-[10px] text-[#f0c77c] hover:text-white cursor-pointer"
                    >
                      0° Restablecer
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={359}
                    value={allRotateAngle}
                    onChange={(e) => onRotateAllElements('set', Number(e.target.value))}
                    className="brass-slider w-full"
                  />
                  <div className="grid grid-cols-4 gap-1 text-[10px]">
                    {[
                      { label: '-45°', delta: -45 },
                      { label: '-15°', delta: -15 },
                      { label: '+15°', delta: 15 },
                      { label: '+90°', delta: 90 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => {
                          audioEngine.playStitchClick();
                          onRotateAllElements('delta', btn.delta);
                        }}
                        className="py-1 rounded bg-[#2b160a] hover:bg-[#5b331a] border border-[#b98241]/30 text-[#f3dcb3] cursor-pointer font-mono-tab"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 5. ANIMATED PALETTE SECTION SWITCHER (Todo | Color | Difuminados | Capas) */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#160a04]/90 border border-[#b98241]/40 text-[10px] shrink-0">
        {(
          [
            { id: 'todo', label: 'Todo' },
            { id: 'color', label: 'Color' },
            { id: 'difuminados', label: 'Difum.' },
            { id: 'capas', label: 'Capas' },
          ] as const
        ).map((tab) => {
          const active = paletteFocus === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audioEngine.playStitchClick();
                setPaletteFocus(tab.id);
              }}
              className={`relative py-1 rounded-lg transition-colors cursor-pointer font-medium ${
                active ? 'text-white' : 'text-[#d9bd94] hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="palette-focus-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  className="absolute inset-0 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] shadow"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 6. COLOR, TIZAS/GOMA Y CAPAS CARDS */}
      <div className="flex flex-col gap-2 pb-1">
        <AnimatePresence mode="popLayout">
          {(paletteFocus === 'todo' || paletteFocus === 'color') && (
            <DockSectionCard
              key="dock-color"
              title="Color"
              headerRight={
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void handleCopyActiveColor()}
                    title={`Copiar código ${brush.color.toUpperCase()} (${hexToRgbLabel(brush.color)})`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#180c05]/90 hover:bg-[#3a1f0e] border border-[#c8964f]/45 text-[10px] font-mono-tab text-[#f5ddb2] transition-colors cursor-pointer"
                  >
                    <span>{copiedColorCode ? '¡Copiado!' : brush.color.toUpperCase()}</span>
                    {copiedColorCode ? (
                      <Check className="w-2.5 h-2.5 text-[#9ef08c]" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-[#e4b86a]" />
                    )}
                  </button>
                  <span
                    className="w-4 h-4 rounded border border-[#f5d599]/80 shadow-inner shrink-0"
                    style={{ backgroundColor: brush.color }}
                    title={`Color activo: ${brush.color.toUpperCase()} · ${hexToRgbLabel(brush.color)}`}
                  />
                </div>
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="grid grid-cols-6 gap-1 flex-1">
                  {BASIC_COLORS.map((c, idx) => {
                    const selected = brush.color.toUpperCase() === c.toUpperCase();
                    return (
                      <motion.button
                        key={c}
                        type="button"
                        whileHover={{ scale: 1.14 }}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => {
                          audioEngine.playYarnPluck(idx);
                          onSelectColor(c);
                        }}
                        aria-label={`Color ${c}`}
                        title={`Seleccionar ${c}`}
                        className={`w-full aspect-square rounded-[3px] border cursor-pointer ${
                          selected
                            ? 'border-white scale-110 ring-1 ring-[#f4ca76] z-10'
                            : 'border-[#180c05]'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    );
                  })}
                </div>

                <ColorWheelPicker color={brush.color} onChange={onSelectColor} />
              </div>

              {/* Search or Paste Color Code (#HEX, RGB, or Spanish pigment name) */}
              <div className="mt-2 pt-1.5 border-t border-[#b98241]/25 space-y-1.5">
                <div className="flex items-center gap-1">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3 h-3 text-[#c89d60] absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={colorQuery}
                      onChange={(e) => setColorQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (parsedDirectHex) {
                            audioEngine.playYarnPluck(4);
                            onSelectColor(parsedDirectHex);
                            setColorQuery('');
                          } else if (matchedColorSwatches.length > 0) {
                            audioEngine.playYarnPluck(4);
                            onSelectColor(matchedColorSwatches[0].hex);
                            setColorQuery('');
                          }
                        }
                      }}
                      placeholder="Buscar #HEX, RGB o color (oro, piel)..."
                      aria-label="Buscar color por código HEX, RGB o nombre"
                      className="w-full pl-5 pr-5 py-1 rounded-md bg-[#140903] border border-[#b98241]/45 text-[10px] font-mono-tab text-[#fae8c7] placeholder:font-sans placeholder:text-[#9c784d] focus:outline-none focus:border-[#f0c06c]"
                    />
                    {colorQuery && (
                      <button
                        type="button"
                        onClick={() => setColorQuery('')}
                        aria-label="Limpiar búsqueda de color"
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-[#cfa467] hover:text-white cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  {parsedDirectHex && (
                    <button
                      type="button"
                      onClick={() => {
                        audioEngine.playYarnPluck(4);
                        onSelectColor(parsedDirectHex);
                        setColorQuery('');
                      }}
                      title={`Aplicar código ${parsedDirectHex} (${hexToRgbLabel(parsedDirectHex)})`}
                      className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md bg-gradient-to-b from-[#c78b36] to-[#8a5517] border border-[#ffe29a]/75 text-[9.5px] font-semibold text-white shrink-0 cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/80"
                        style={{ backgroundColor: parsedDirectHex }}
                      />
                      <span>Usar</span>
                    </button>
                  )}
                </div>

                {matchedColorSwatches.length > 0 && (
                  <div className="grid grid-cols-2 gap-1 max-h-[112px] overflow-y-auto studio-scroll pr-0.5">
                    {matchedColorSwatches.map((item) => (
                      <button
                        key={item.hex + item.name}
                        type="button"
                        onClick={() => {
                          audioEngine.playYarnPluck(3);
                          onSelectColor(item.hex);
                        }}
                        title={`${item.name} · ${item.hex} · ${hexToRgbLabel(item.hex)}`}
                        className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-[#180c05]/90 hover:bg-[#381d0c] border border-[#b98241]/35 text-left transition-colors cursor-pointer min-w-0"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-xs border border-[#f5d599]/70 shrink-0"
                          style={{ backgroundColor: item.hex }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-medium text-[#f8e4be] truncate leading-tight">
                            {item.name}
                          </p>
                          <p className="text-[8px] font-mono-tab text-[#c59b62] leading-none">
                            {item.hex}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Colors + Gotero */}
              <div className="mt-2 pt-1.5 border-t border-[#b98241]/25 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1 overflow-hidden">
                  {recentColors.slice(0, 6).map((c, i) => (
                    <motion.button
                      key={c}
                      type="button"
                      whileHover={{ scale: 1.18 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        audioEngine.playYarnPluck(i + 2);
                        onSelectColor(c);
                      }}
                      title={`Reciente: ${c}`}
                      className="w-4 h-4 rounded-full border border-[#f5d599]/60 cursor-pointer shrink-0"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    audioEngine.playRetroPop(2);
                    onSelectTool(activeTool === 'eyedropper' ? 'draw' : 'eyedropper');
                  }}
                  title="Gotero: capturar color de la página o foto"
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] cursor-pointer transition-colors shrink-0 ${
                    activeTool === 'eyedropper'
                      ? 'bg-[#b37328] border-[#ffe3a3] text-white shadow'
                      : 'bg-[#2a1509] border-[#c8964f]/50 text-[#f2d29b] hover:bg-[#492713]'
                  }`}
                >
                  <Pipette className="w-3 h-3" />
                  <span>Gotero</span>
                </motion.button>
              </div>
            </DockSectionCard>
          )}

          {(paletteFocus === 'todo' || paletteFocus === 'difuminados') && (
            <DockSectionCard
              key="dock-brushes"
              title={
                chalkMode === 'goma'
                  ? 'Goma'
                  : chalkMode === 'luz'
                    ? 'Luz Mágica'
                    : chalkMode === 'pinceles'
                      ? 'Pincel'
                      : 'Difuminados'
              }
              headerRight={
                <div className="flex items-center gap-0.5 rounded-md bg-[#160a04]/80 border border-[#b98241]/35 p-0.5 text-[9.5px] shrink-0">
                  {(
                    [
                      { id: 'difuminados', label: 'Difum.' },
                      { id: 'luz', label: '✦ Luz' },
                      { id: 'pinceles', label: 'Pincel' },
                      { id: 'goma', label: 'Goma' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setChalkMode(tab.id);
                        if (tab.id === 'goma') {
                          audioEngine.playEraseBrush();
                          onGoToSection('cuaderno');
                          onChangeBrush({ softness: 10, opacity: 100 });
                          onSelectTool('eraser');
                        } else if (tab.id === 'luz') {
                          audioEngine.playToggleChime(true);
                          onGoToSection('cuaderno');
                          const firstLuz = LUZ_MAGICA_PRESETS[0];
                          const isAlreadyLightColor = MAGIC_LIGHT_COLORS.some(
                            (c) => c.hex.toUpperCase() === brush.color.toUpperCase()
                          );
                          const primaryGold = MAGIC_LIGHT_COLORS[0].hex;
                          const nextColor = isAlreadyLightColor ? brush.color : primaryGold;
                          onSelectColor(nextColor);
                          onChangeBrush({
                            category: 'luz',
                            preset: firstLuz.id,
                            color: nextColor,
                            size: firstLuz.defaultSize,
                            opacity: firstLuz.defaultOpacity,
                            softness: firstLuz.defaultSoftness,
                          });
                          onSelectTool('draw');
                        } else {
                          audioEngine.playYarnPluck(tab.id === 'pinceles' ? 4 : 1);
                          onGoToSection('cuaderno');
                          if (tab.id === 'pinceles') {
                            const firstPincel = HYPERREAL_PINCEL_PRESETS[0];
                            onChangeBrush({
                              category: 'pinceles',
                              preset: firstPincel.id,
                              size: firstPincel.defaultSize,
                              opacity: firstPincel.defaultOpacity,
                              softness: firstPincel.defaultSoftness,
                            });
                          } else {
                            const firstDif = DIFUMINADO_PRESETS[0];
                            onChangeBrush({
                              category: 'difuminados',
                              preset: firstDif.id,
                              size: firstDif.defaultSize,
                              opacity: firstDif.defaultOpacity,
                              softness: firstDif.defaultSoftness,
                            });
                          }
                          onSelectTool('draw');
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer whitespace-nowrap ${
                        chalkMode === tab.id
                          ? tab.id === 'luz'
                            ? 'bg-gradient-to-b from-[#ffe785] via-[#eab238] to-[#b57012] text-[#2a1204] font-bold shadow-[0_0_10px_rgba(255,216,77,0.58)]'
                            : 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white font-medium'
                          : tab.id === 'luz'
                            ? 'text-[#ffe082] hover:text-[#fff6cc]'
                            : 'text-[#d9bd94] hover:text-white'
                      }`}
                      title={
                        tab.id === 'difuminados'
                          ? 'Difuminados suaves y precisos'
                          : tab.id === 'luz'
                            ? 'Pincel mágico de luz luminiscente y polvo de hada solar'
                            : tab.id === 'pinceles'
                              ? 'Pinceles de texturas hiperrealistas'
                              : 'Borrador'
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              }
            >
              {chalkMode === 'goma' ? (
                <div className="space-y-2 mb-2 text-[11px]">
                  <div className="grid grid-cols-2 gap-1.5">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        audioEngine.playEraseBrush();
                        onGoToSection('cuaderno');
                        onChangeBrush({ softness: 10, opacity: 100 });
                        onSelectTool('eraser');
                      }}
                      className={`py-1.5 px-2 rounded-lg border cursor-pointer transition-colors ${
                        brush.softness <= 35
                          ? 'bg-[#6b3e1f] border-[#ebb86c] text-white font-medium'
                          : 'bg-[#1a0d05] border-[#8b5d31]/35 text-[#dec39c] hover:border-[#b98241]/70'
                      }`}
                    >
                      Goma precisa
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => {
                        audioEngine.playEraseBrush();
                        onGoToSection('cuaderno');
                        onChangeBrush({ softness: 70, opacity: 90 });
                        onSelectTool('eraser');
                      }}
                      className={`py-1.5 px-2 rounded-lg border cursor-pointer transition-colors ${
                        brush.softness > 35
                          ? 'bg-[#6b3e1f] border-[#ebb86c] text-white font-medium'
                          : 'bg-[#1a0d05] border-[#8b5d31]/35 text-[#dec39c] hover:border-[#b98241]/70'
                      }`}
                    >
                      Goma suave
                    </motion.button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playEraseBrush();
                      onClearPageStrokes();
                    }}
                    className="w-full py-1.5 rounded-lg bg-[#5c1e24]/90 hover:bg-[#772730] border border-[#d67a7e]/45 text-[11px] text-[#ffe3e3] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Limpiar trazos de la hoja</span>
                  </button>
                </div>
              ) : (
                <>
                  {chalkMode === 'luz' && (
                    <div className="mb-1.5 rounded-lg bg-gradient-to-b from-[#2b1707]/95 to-[#160a03]/95 border border-[#f5c85c]/45 px-1.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,236,164,0.18)]">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-semibold tracking-wide text-[#ffe494] flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-[#ffd84d]" />
                          <span>Color de luz</span>
                        </span>
                        <span className="text-[8.5px] text-[#e7ca88] truncate">
                          {MAGIC_LIGHT_COLORS.find(
                            (c) => c.hex.toUpperCase() === brush.color.toUpperCase()
                          )?.label ?? `Personalizado (${brush.color})`}
                        </span>
                      </div>
                      <div className="grid grid-cols-8 gap-1">
                        {MAGIC_LIGHT_COLORS.map((lightOpt) => {
                          const isSelectedColor =
                            brush.color.toUpperCase() === lightOpt.hex.toUpperCase();
                          return (
                            <button
                              key={lightOpt.id}
                              type="button"
                              onClick={() => {
                                audioEngine.playYarnPluck(lightOpt.primary ? 5 : 3);
                                onSelectColor(lightOpt.hex);
                                onChangeBrush({
                                  category: 'luz',
                                  color: lightOpt.hex,
                                });
                                onSelectTool('draw');
                              }}
                              title={lightOpt.label}
                              aria-label={lightOpt.label}
                              className={`relative h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                                isSelectedColor
                                  ? 'scale-110 ring-2 ring-[#fff6cc] shadow-[0_0_10px_rgba(255,224,102,0.85)]'
                                  : 'hover:scale-110 opacity-90 hover:opacity-100'
                              }`}
                              style={{
                                background: `radial-gradient(circle at 38% 34%, ${lightOpt.coreHex} 0%, ${lightOpt.hex} 48%, ${lightOpt.glowHex} 100%)`,
                                boxShadow: isSelectedColor
                                  ? `0 0 10px ${lightOpt.hex}`
                                  : `0 0 5px ${lightOpt.glowHex}88`,
                              }}
                            >
                              {lightOpt.primary && (
                                <span
                                  aria-hidden="true"
                                  className="text-[8px] leading-none text-[#5c3200] font-bold drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]"
                                >
                                  ✦
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {chalkMode === 'pinceles' && (
                    <div className="space-y-1.5 mb-1.5">
                      {/* Search + Full 2,412 Library Button */}
                      <div className="flex items-center gap-1">
                        <div className="relative flex-1 min-w-0">
                          <Search className="w-3 h-3 text-[#c89d60] absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={textureSearch}
                            onChange={(e) => setTextureSearch(e.target.value)}
                            placeholder={`Buscar (${totalPincelCatalogCount.toLocaleString('es-ES')})...`}
                            className="w-full pl-5 pr-5 py-1 rounded-md bg-[#140903] border border-[#b98241]/40 text-[10px] text-[#f9e7c6] placeholder:text-[#9c784d] focus:outline-none focus:border-[#f0c06c]"
                          />
                          {textureSearch && (
                            <button
                              type="button"
                              onClick={() => setTextureSearch('')}
                              aria-label="Limpiar búsqueda"
                              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-[#cfa467] hover:text-white cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            audioEngine.playRetroPop(2);
                            onGoToSection('pinceles');
                          }}
                          title={`Abrir biblioteca completa con ${totalPincelCatalogCount.toLocaleString('es-ES')} texturas hiperrealistas`}
                          className="px-1.5 py-1 rounded-md bg-gradient-to-b from-[#b4742d] to-[#7c4516] border border-[#f2c87a]/55 text-[9.5px] font-medium text-[#fff5df] hover:brightness-110 flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{totalPincelCatalogCount.toLocaleString('es-ES')}</span>
                        </button>
                      </div>

                      {/* Horizontal Family Filter Chips */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 studio-scroll">
                        <button
                          type="button"
                          onClick={() => {
                            setTextureSearch('');
                            setTextureFamilyFilter('destacados');
                          }}
                          className={`px-1.5 py-0.5 rounded-full text-[9.5px] border shrink-0 transition-colors cursor-pointer ${
                            !textureSearch && textureFamilyFilter === 'destacados'
                              ? 'bg-[#8d5222] border-[#ffe3a3] text-white font-medium'
                              : 'bg-[#1a0d05] border-[#8b5d31]/40 text-[#dec299] hover:border-[#cfa158]'
                          }`}
                        >
                          ★ Top (12)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTextureSearch('');
                            setTextureFamilyFilter('favoritos');
                          }}
                          className={`px-1.5 py-0.5 rounded-full text-[9.5px] border shrink-0 transition-colors cursor-pointer inline-flex items-center gap-0.5 ${
                            !textureSearch && textureFamilyFilter === 'favoritos'
                              ? 'bg-[#8d3340] border-[#ffb8c2] text-white font-medium'
                              : 'bg-[#1a0d05] border-[#8b5d31]/40 text-[#dec299] hover:border-[#cfa158]'
                          }`}
                        >
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          <span>{favoriteSet.size}</span>
                        </button>
                        {TEXTURE_FAMILIES.map((fam) => {
                          const activeFam = !textureSearch && textureFamilyFilter === fam.id;
                          return (
                            <button
                              key={fam.id}
                              type="button"
                              onClick={() => {
                                setTextureSearch('');
                                setTextureFamilyFilter(fam.id);
                              }}
                              title={`${fam.label} (${fam.count} texturas)`}
                              className={`px-1.5 py-0.5 rounded-full text-[9.5px] border shrink-0 transition-colors cursor-pointer inline-flex items-center gap-1 ${
                                activeFam
                                  ? 'bg-[#8d5222] border-[#ffe3a3] text-white font-medium'
                                  : 'bg-[#1a0d05] border-[#8b5d31]/40 text-[#dec299] hover:border-[#cfa158]'
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: fam.tint }}
                              />
                              <span>{fam.shortLabel}</span>
                              <span className="text-[8px] opacity-75">{fam.count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {chalkMode === 'pinceles' && swatchList.length === 0 ? (
                    <div className="mb-1.5 py-4 px-2 rounded-lg bg-[#160a04]/75 border border-[#8b5d31]/30 text-center text-[10px] text-[#cda97a]">
                      {textureFamilyFilter === 'favoritos' && !textureSearch
                        ? 'Aún no tienes pinceles favoritos. Toca ♥ en cualquier textura para guardarla aquí.'
                        : 'No se encontraron texturas con ese nombre.'}
                    </div>
                  ) : (
                    <div
                      className={`grid grid-cols-3 gap-1 mb-1.5 ${
                        chalkMode === 'pinceles'
                          ? 'max-h-[214px] overflow-y-auto studio-scroll pr-0.5'
                          : ''
                      }`}
                    >
                      {swatchList.map((preset, idx) => {
                        const active = brush.preset === preset.id && activeTool === 'draw';
                        const isCatalog = preset.id.startsWith('tex-');
                        const isFav = favoriteSet.has(preset.id);
                        const parts = isCatalog ? preset.label.split(' · ') : null;
                        const mainTitle = parts ? parts[0] : preset.shortLabel;
                        const subTag = parts && parts[1] ? parts[1] : null;
                        return (
                          <div key={preset.id} className="relative group">
                            <button
                              type="button"
                              onClick={() => {
                                audioEngine.playYarnPluck(idx % 6);
                                onChangeBrush({
                                  category: chalkMode,
                                  preset: preset.id,
                                  size: preset.defaultSize,
                                  opacity: preset.defaultOpacity,
                                  softness: preset.defaultSoftness,
                                });
                                onSelectTool('draw');
                              }}
                              title={`${preset.label} — ${preset.description}`}
                              className={`w-full rounded-md px-1 py-1 border transition-colors cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                                active
                                  ? 'bg-[#4f2b14] border-[#ffd88a] ring-1 ring-[#eab860] shadow-[0_0_10px_rgba(234,184,96,0.35)]'
                                  : 'bg-[#160a04]/85 border-[#8b5d31]/40 hover:border-[#cfa158]'
                              }`}
                            >
                              {isCatalog ? (
                                <LiveTexturePreview
                                  presetId={preset.id}
                                  color={preset.tint}
                                  heightClass="h-[18px]"
                                />
                              ) : (
                                <HyperrealBrushSwatch
                                  presetId={preset.id}
                                  color={chalkMode === 'luz' ? brush.color : preset.tint}
                                />
                              )}
                              <span
                                className={`text-[8.5px] leading-tight truncate w-full text-center ${
                                  active ? 'text-[#fff4da] font-semibold' : 'text-[#e2c9a2]'
                                }`}
                              >
                                {mainTitle}
                              </span>
                              {subTag && (
                                <span className="text-[7.5px] leading-none truncate w-full text-center text-[#b78f5c]">
                                  {subTag}
                                </span>
                              )}
                            </button>
                            {chalkMode === 'pinceles' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(preset.id);
                                }}
                                aria-label={
                                  isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'
                                }
                                title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                                className={`absolute top-0.5 right-0.5 p-0.5 rounded-full transition-opacity cursor-pointer ${
                                  isFav
                                    ? 'opacity-100 text-[#ff8fa3]'
                                    : 'opacity-0 group-hover:opacity-90 text-[#c9a370] hover:text-[#ff8fa3]'
                                }`}
                              >
                                <Heart
                                  className={`w-2.5 h-2.5 ${isFav ? 'fill-current' : ''}`}
                                />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {chalkMode === 'pinceles' &&
                        filteredPincelPresets.length > visibleTextureCount && (
                          <button
                            type="button"
                            onClick={() => setVisibleTextureCount((n) => n + 24)}
                            className="col-span-3 py-1 rounded-md bg-[#2a1509] hover:bg-[#422310] border border-[#b98241]/45 text-[9.5px] text-[#f6dca8] cursor-pointer transition-colors"
                          >
                            Mostrar +24 más ({filteredPincelPresets.length - visibleTextureCount}{' '}
                            restantes)
                          </button>
                        )}
                    </div>
                  )}

                  {activeBrushMeta && (
                    <div className="mb-1.5 px-2 py-1 rounded-md bg-[#160a04]/75 border border-[#b98241]/25 text-[9.5px] leading-tight text-[#e7cda4]">
                      <span className="font-semibold text-[#ffdfa3]">
                        {activeBrushMeta.label}:
                      </span>{' '}
                      {activeBrushMeta.description}
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col gap-1 text-[11px]">
                <SliderRow
                  label="Tamaño"
                  value={brush.size}
                  min={1}
                  max={120}
                  unit="px"
                  onChange={(size) => onChangeBrush({ size })}
                />
                <SliderRow
                  label="Opacidad"
                  value={brush.opacity}
                  min={1}
                  max={100}
                  unit="%"
                  onChange={(opacity) => onChangeBrush({ opacity })}
                />
                <SliderRow
                  label="Suavidad"
                  value={brush.softness}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(softness) => onChangeBrush({ softness })}
                />
              </div>
            </DockSectionCard>
          )}

          {(paletteFocus === 'todo' || paletteFocus === 'capas') && (() => {
            const derivedLayer: StackableLayerId =
              selectedLayer ||
              (activeTool === 'text' || activeTool === 'read'
                ? 'notes'
                : activeTool === 'draw' || activeTool === 'eraser'
                  ? 'drawing'
                  : 'images');
            const activeLayerIdx = layerOrder.indexOf(derivedLayer);
            const canMoveUp =
              !isCatalogSpread &&
              (hasSelectedElement || activeLayerIdx > 0);
            const canMoveDown =
              !isCatalogSpread &&
              (hasSelectedElement || (activeLayerIdx >= 0 && activeLayerIdx < layerOrder.length - 1));

            return (
              <DockSectionCard key="dock-layers" title="Capas">
                <div className="flex flex-col gap-1">
                  {layerOrder.map((layerId) => {
                    if (layerId === 'notes') {
                      return (
                        <LayerRow
                          key="notes"
                          label="Notas"
                          thumb="notes"
                          active={derivedLayer === 'notes'}
                          visible={layerVisibility.notes}
                          onSelect={() => {
                            audioEngine.playStitchClick();
                            onSelectTool('text');
                            onLayerAction({ type: 'select-layer', layer: 'notes' });
                          }}
                          onToggleVisible={() => {
                            audioEngine.playToggleChime(!layerVisibility.notes);
                            onToggleLayerVisibility('notes');
                          }}
                        />
                      );
                    }
                    if (layerId === 'drawing') {
                      return (
                        <LayerRow
                          key="drawing"
                          label="Dibujo"
                          thumb="drawing"
                          active={derivedLayer === 'drawing'}
                          visible={layerVisibility.drawing}
                          onSelect={() => {
                            audioEngine.playStitchClick();
                            onSelectTool('draw');
                            onLayerAction({ type: 'select-layer', layer: 'drawing' });
                          }}
                          onToggleVisible={() => {
                            audioEngine.playToggleChime(!layerVisibility.drawing);
                            onToggleLayerVisibility('drawing');
                          }}
                        />
                      );
                    }
                    return (
                      <LayerRow
                        key="images"
                        label="Imágenes"
                        thumb="images"
                        active={derivedLayer === 'images'}
                        visible={layerVisibility.images}
                        onSelect={() => {
                          audioEngine.playStitchClick();
                          onSelectTool('select');
                          onLayerAction({ type: 'select-layer', layer: 'images' });
                        }}
                        onToggleVisible={() => {
                          audioEngine.playToggleChime(!layerVisibility.images);
                          onToggleLayerVisibility('images');
                        }}
                      />
                    );
                  })}
                  <LayerRow
                    label={
                      paperStyle === 'grid'
                        ? 'Fondo · Cuadrícula'
                        : paperStyle === 'dots'
                          ? 'Fondo · Puntos'
                          : 'Fondo · Pergamino'
                    }
                    thumb="background"
                    active={false}
                    visible={layerVisibility.background}
                    onSelect={() => {
                      audioEngine.playToggleChime(true);
                      onCyclePaperStyle();
                    }}
                    onToggleVisible={() => {
                      audioEngine.playToggleChime(!layerVisibility.background);
                      onToggleLayerVisibility('background');
                    }}
                  />
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#b98241]/30 grid grid-cols-4 gap-1">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      audioEngine.playRetroPop(2);
                      onLayerAction({ type: 'add-note' });
                    }}
                    title="Añadir nota de texto"
                    className="py-1.5 rounded-lg bg-[#2b160a] hover:bg-[#4e2a14] border border-[#b98241]/35 flex items-center justify-center text-[#f3d49a] cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    disabled={isCatalogSpread || (!hasSelectedElement && !hasDrawings)}
                    onClick={() => {
                      audioEngine.playEraseBrush();
                      onLayerAction({ type: 'delete-active' });
                    }}
                    title={
                      hasSelectedElement
                        ? 'Eliminar objeto seleccionado'
                        : 'Limpiar trazos de la página'
                    }
                    className="py-1.5 rounded-lg bg-[#2b160a] hover:bg-[#6e212a] border border-[#b98241]/35 flex items-center justify-center text-[#f3d49a] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={canMoveUp ? { scale: 0.9 } : undefined}
                    disabled={!canMoveUp}
                    onClick={() => {
                      audioEngine.playStitchClick();
                      onLayerAction({ type: 'bring-front' });
                    }}
                    title={
                      hasSelectedElement
                        ? 'Traer objeto al frente'
                        : 'Subir capa seleccionada'
                    }
                    className="py-1.5 rounded-lg bg-[#2b160a] hover:bg-[#4e2a14] border border-[#b98241]/35 flex items-center justify-center text-[#f3d49a] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={canMoveDown ? { scale: 0.9 } : undefined}
                    disabled={!canMoveDown}
                    onClick={() => {
                      audioEngine.playStitchClick();
                      onLayerAction({ type: 'send-back' });
                    }}
                    title={
                      hasSelectedElement
                        ? 'Enviar objeto atrás'
                        : 'Bajar capa seleccionada'
                    }
                    className="py-1.5 rounded-lg bg-[#2b160a] hover:bg-[#4e2a14] border border-[#b98241]/35 flex items-center justify-center text-[#f3d49a] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </DockSectionCard>
            );
          })()}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};

const StudioActionTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, label, active = false, disabled = false, onClick }) => (
  <motion.button
    type="button"
    disabled={disabled}
    whileHover={disabled ? undefined : { scale: 1.05, y: -1 }}
    whileTap={disabled ? undefined : { scale: 0.92 }}
    transition={{ type: 'spring', stiffness: 450, damping: 24 }}
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-lg border text-[9px] leading-none cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-colors ${
      active
        ? 'bg-gradient-to-b from-[#d49644]/90 to-[#8a511b]/95 border-[#f5d290]/80 text-white shadow'
        : 'bg-[#211007]/85 border-[#8b5d31]/35 text-[#f2d093] hover:bg-[#4c2913] hover:text-white'
    }`}
  >
    {icon}
    <span className="truncate max-w-full">{label}</span>
  </motion.button>
);

const StudioToolTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  pillId?: string;
  onClick: () => void;
}> = ({ icon, label, active, pillId = 'studio-active-tool-pill', onClick }) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.05, y: -1 }}
    whileTap={{ scale: 0.92 }}
    transition={{ type: 'spring', stiffness: 440, damping: 24 }}
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-lg border text-[9.5px] leading-none cursor-pointer transition-colors ${
      active
        ? 'border-[#ffe3a3] text-white font-medium shadow-[0_0_12px_rgba(235,181,86,0.35)]'
        : 'bg-[#211007]/85 border-[#8b5d31]/35 text-[#f2d093] hover:bg-[#4c2913] hover:text-white'
    }`}
  >
    {active && (
      <motion.span
        layoutId={pillId}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="absolute inset-0 rounded-lg bg-gradient-to-b from-[#d49644]/95 to-[#8a511b]/95 -z-0"
      />
    )}
    <span className="relative z-10">{icon}</span>
    <span className="relative z-10 truncate max-w-full">{label}</span>
  </motion.button>
);

const LayerRow: React.FC<{
  label: string;
  thumb: 'notes' | 'drawing' | 'images' | 'background';
  active: boolean;
  visible: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
}> = ({ label, thumb, active, visible, onSelect, onToggleVisible }) => (
  <div
    className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded-lg border transition-colors ${
      active
        ? 'bg-gradient-to-r from-[#b4742a]/85 to-[#6e3f16]/85 border-[#ffd586] text-[#fff8e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
        : 'bg-[#190c05]/75 border-[#7a4f25]/40 text-[#e8cfab] hover:bg-[#2f180b]'
    }`}
  >
    <button
      type="button"
      onClick={onSelect}
      className="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer"
    >
      <span className="w-8 h-5 rounded-[3px] border border-[#cfa05b]/65 bg-[#f4e4c2] shrink-0 overflow-hidden flex items-center justify-center">
        {thumb === 'notes' && (
          <svg viewBox="0 0 32 20" className="w-full h-full" fill="none">
            <line x1="4" y1="6" x2="28" y2="6" stroke="#6d4320" strokeWidth="1.6" />
            <line x1="4" y1="10" x2="22" y2="10" stroke="#8a5a30" strokeWidth="1.4" />
            <line x1="4" y1="14" x2="26" y2="14" stroke="#8a5a30" strokeWidth="1.4" />
          </svg>
        )}
        {thumb === 'drawing' && (
          <svg viewBox="0 0 32 20" className="w-full h-full" fill="none">
            <path d="M4 14 Q11 4, 17 12 T28 7" stroke="#7a202a" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {thumb === 'images' && (
          <svg viewBox="0 0 32 20" className="w-full h-full" fill="none">
            <rect width="32" height="20" fill="#e6cfa3" />
            <circle cx="10" cy="7" r="2.5" fill="#d4893b" />
            <path d="M3 18 L12 10 L19 15 L24 11 L30 18 Z" fill="#7c502b" />
          </svg>
        )}
        {thumb === 'background' && (
          <svg viewBox="0 0 32 20" className="w-full h-full" fill="none">
            <rect width="32" height="20" fill="#fbf2de" />
            <path d="M8 0 V20 M16 0 V20 M24 0 V20 M0 7 H32 M0 14 H32" stroke="#b9935a" strokeWidth="0.7" />
          </svg>
        )}
      </span>
      <span className="text-[11px] font-medium truncate">{label}</span>
    </button>

    <button
      type="button"
      onClick={onToggleVisible}
      title={visible ? `Ocultar ${label}` : `Mostrar ${label}`}
      className="p-1 rounded hover:bg-black/25 text-[#f2cb77] cursor-pointer shrink-0"
    >
      {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-55" />}
    </button>
  </div>
);

/* ---------- Auxiliary Exported Panels (kept clean for reuse) ---------- */
export const ColorPalettePanel: React.FC<ColorPalettePanelProps> = ({
  color,
  recentColors,
  onSelectColor,
  onActivateEyedropper,
}) => {
  const [colorTab, setColorTab] = useState<'basicos' | 'personalizado' | 'recientes'>('basicos');
  const [hexDraft, setHexDraft] = useState(color);

  useEffect(() => {
    setHexDraft(color);
  }, [color]);

  return (
    <div className="w-64 p-3.5 select-none bg-[#221208] rounded-xl text-[#f5e4c4]">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-display text-sm text-[#f7e1b5] tracking-wide">Paleta de Color</h3>
        <div className="flex items-center gap-1.5">
          {onActivateEyedropper && (
            <button
              type="button"
              onClick={onActivateEyedropper}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#3c2110] border border-[#c99552]/45 text-[11px] text-[#f5dfba] hover:bg-[#573119] cursor-pointer"
            >
              <Pipette className="w-3 h-3 text-[#f0c77c]" />
              <span>Gotero</span>
            </button>
          )}
          <span
            className="w-5 h-5 rounded border border-[#f5d599]/75 shadow-inner"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#160b05] border border-[#b98241]/35 mb-2.5 text-[11px]">
        {[
          { id: 'basicos', label: 'Básicos' },
          { id: 'personalizado', label: 'Rueda' },
          { id: 'recientes', label: 'Recientes' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setColorTab(tab.id as typeof colorTab)}
            className={`py-1 px-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              colorTab === tab.id
                ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-[#fff8e8] font-medium'
                : 'text-[#d9bd94] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {colorTab === 'basicos' && (
        <div className="grid grid-cols-6 gap-1.5 mb-2.5">
          {BASIC_COLORS.map((c, idx) => {
            const selected = color.toUpperCase() === c.toUpperCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => {
                  audioEngine.playYarnPluck(idx);
                  onSelectColor(c);
                }}
                aria-label={`Color ${c}`}
                className={`w-full aspect-square rounded border transition-transform cursor-pointer ${
                  selected
                    ? 'border-[#fff2cc] scale-110 ring-2 ring-[#e7b96b]/60'
                    : 'border-[#3a2010] hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            );
          })}
        </div>
      )}

      {colorTab === 'personalizado' && (
        <div className="flex flex-col items-center gap-2 mb-2.5">
          <ColorWheelPicker color={color} onChange={onSelectColor} />
        </div>
      )}

      {colorTab === 'recientes' && (
        <div className="grid grid-cols-4 gap-2 mb-2.5">
          {recentColors.map((c, idx) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                audioEngine.playYarnPluck(idx);
                onSelectColor(c);
              }}
              className="h-8 rounded border border-[#d6a25e]/45 cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-[#b98241]/25">
        <span className="text-[11px] text-[#cba777] font-mono-tab">HEX</span>
        <input
          type="text"
          value={hexDraft}
          onChange={(e) => {
            const val = e.target.value;
            setHexDraft(val);
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
              onSelectColor(val);
            }
          }}
          maxLength={7}
          className="flex-1 min-w-0 bg-[#150b05] border border-[#b98241]/40 rounded px-2 py-1 text-xs font-mono-tab text-[#f6e3c2] focus:outline-none focus:border-[#ebbc6e]"
        />
      </div>
    </div>
  );
};

export const BrushStudioPanel: React.FC<BrushStudioPanelProps> = ({
  brush,
  onChangeBrush,
  onSelectEraser,
}) => {
  const isLuz = brush.category === 'luz';
  const isDif = brush.category === 'difuminados' || brush.category === 'tizas';
  const activeList = isLuz
    ? LUZ_MAGICA_PRESETS
    : isDif
      ? DIFUMINADO_PRESETS
      : HYPERREAL_PINCEL_PRESETS;

  return (
    <div className="w-68 p-3.5 flex flex-col gap-3 select-none bg-[#221208] rounded-xl text-[#f5e4c4]">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm text-[#f7e1b5] tracking-wide">
          Difuminados, Luz y Pinceles
        </h3>
        {onSelectEraser && (
          <button
            type="button"
            onClick={onSelectEraser}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#3c2110] border border-[#c99552]/45 text-[11px] text-[#f5dfba] hover:bg-[#573119] cursor-pointer"
          >
            <Eraser className="w-3 h-3 text-[#f0c77c]" />
            <span>Goma</span>
          </button>
        )}
      </div>

      <div>
        <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#160b05] border border-[#b98241]/35 mb-2.5 text-xs">
          {(['difuminados', 'luz', 'pinceles'] as BrushCategory[]).map((cat) => {
            const activeTab =
              cat === 'difuminados'
                ? isDif
                : cat === 'luz'
                  ? isLuz
                  : brush.category === 'pinceles';
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  if (cat === 'pinceles') {
                    const p0 = HYPERREAL_PINCEL_PRESETS[0];
                    onChangeBrush({
                      category: 'pinceles',
                      preset: p0.id,
                      size: p0.defaultSize,
                      opacity: p0.defaultOpacity,
                      softness: p0.defaultSoftness,
                    });
                  } else if (cat === 'luz') {
                    const l0 = LUZ_MAGICA_PRESETS[0];
                    onChangeBrush({
                      category: 'luz',
                      preset: l0.id,
                      color: MAGIC_LIGHT_COLORS[0].hex,
                      size: l0.defaultSize,
                      opacity: l0.defaultOpacity,
                      softness: l0.defaultSoftness,
                    });
                  } else {
                    const d0 = DIFUMINADO_PRESETS[0];
                    onChangeBrush({
                      category: 'difuminados',
                      preset: d0.id,
                      size: d0.defaultSize,
                      opacity: d0.defaultOpacity,
                      softness: d0.defaultSoftness,
                    });
                  }
                }}
                className={`py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeTab
                    ? cat === 'luz'
                      ? 'bg-gradient-to-b from-[#ffe785] via-[#eab238] to-[#b57012] text-[#2a1204] font-bold shadow'
                      : 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-[#fff8e8] font-medium shadow'
                    : 'text-[#d9bd94] hover:text-white'
                }`}
              >
                {cat === 'pinceles' ? 'Pincel' : cat === 'luz' ? '✦ Luz' : 'Difum.'}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {activeList.map((preset) => {
            const active = brush.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  onChangeBrush({
                    category: isLuz ? 'luz' : isDif ? 'difuminados' : 'pinceles',
                    preset: preset.id,
                    size: preset.defaultSize,
                    opacity: preset.defaultOpacity,
                    softness: preset.defaultSoftness,
                  })
                }
                title={`${preset.label} — ${preset.description}`}
                className={`rounded-lg px-1 py-1.5 transition-colors cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                  active
                    ? 'bg-[#6b3e1f] border-[#ebb86c] text-[#fff6e3] shadow-sm'
                    : 'bg-[#160a04] border-[#8b5d31]/35 hover:border-[#b98241]/60'
                }`}
              >
                <HyperrealBrushSwatch
                  presetId={preset.id}
                  color={isLuz ? brush.color : preset.tint}
                />
                <span className="text-[9px] leading-none truncate w-full text-center text-[#ebd2aa]">
                  {preset.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pt-2.5 border-t border-[#b98241]/30 text-xs">
        <SliderRow
          label="Tamaño"
          value={brush.size}
          min={1}
          max={60}
          unit="px"
          onChange={(size) => onChangeBrush({ size })}
        />
        <SliderRow
          label="Opacidad"
          value={brush.opacity}
          min={10}
          max={100}
          unit="%"
          onChange={(opacity) => onChangeBrush({ opacity })}
        />
        <SliderRow
          label="Suavidad"
          value={brush.softness}
          min={0}
          max={100}
          unit="%"
          onChange={(softness) => onChangeBrush({ softness })}
        />
      </div>
    </div>
  );
};

export const EraserStudioPanel: React.FC<EraserStudioPanelProps> = ({
  brush,
  onChangeBrush,
  onClearPageStrokes,
}) => (
  <div className="w-64 p-3.5 flex flex-col gap-3 select-none bg-[#221208] rounded-xl text-[#f5e4c4]">
    <div className="flex items-center justify-between">
      <h3 className="font-display text-sm text-[#f7e1b5] tracking-wide">Goma de Borrar</h3>
      <span className="text-[11px] font-mono-tab text-[#dec49d]">{brush.size} px</span>
    </div>

    <div className="grid grid-cols-2 gap-1.5 text-xs">
      <button
        type="button"
        onClick={() => onChangeBrush({ softness: 10, opacity: 100 })}
        className={`py-2 px-2 rounded-lg border cursor-pointer transition-colors ${
          brush.softness <= 35
            ? 'bg-[#6b3e1f] border-[#ebb86c] text-white font-medium'
            : 'bg-[#2c180c] border-[#8b5d31]/30 text-[#dec39c] hover:border-[#b98241]/60'
        }`}
      >
        Goma precisa
      </button>
      <button
        type="button"
        onClick={() => onChangeBrush({ softness: 70, opacity: 90 })}
        className={`py-2 px-2 rounded-lg border cursor-pointer transition-colors ${
          brush.softness > 35
            ? 'bg-[#6b3e1f] border-[#ebb86c] text-white font-medium'
            : 'bg-[#2c180c] border-[#8b5d31]/30 text-[#dec39c] hover:border-[#b98241]/60'
        }`}
      >
        Goma suave
      </button>
    </div>

    <div className="flex flex-col gap-2.5 pt-2 border-t border-[#b98241]/25">
      <SliderRow
        label="Tamaño de goma"
        value={brush.size}
        min={4}
        max={80}
        unit="px"
        onChange={(size) => onChangeBrush({ size })}
      />
      <SliderRow
        label="Fuerza de borrado"
        value={brush.opacity}
        min={20}
        max={100}
        unit="%"
        onChange={(opacity) => onChangeBrush({ opacity })}
      />
    </div>

    <button
      type="button"
      onClick={onClearPageStrokes}
      className="mt-1 inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#5c1e24] hover:bg-[#772730] border border-[#d67a7e]/45 text-xs text-[#ffe3e3] cursor-pointer transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>Limpiar trazos de la página</span>
    </button>
  </div>
);

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, unit, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-[#dec49d] w-14 shrink-0">{label}</span>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="brass-slider flex-1 min-w-0"
    />
    <span className="font-mono-tab text-[10px] text-[#f5dfba] w-9 text-right shrink-0">
      {value}
      {unit}
    </span>
  </div>
);
