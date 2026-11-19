import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Circle,
  Cloud,
  DoorOpen,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FilePlus2,
  Flower2,
  FolderOpen,
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
  onToggleLayerVisibility: (layer: keyof LayerVisibility) => void;
  onCyclePaperStyle: () => void;
  onLayerAction: (action: LayerAction) => void;
  onNewPage: () => void;
  onImportBackup: (file: File) => void;
  onSaveNow: () => void;
  onExportBackup: () => void;
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

const TIZA_PRESETS: Array<{
  id: BrushPresetId;
  label: string;
  tint: string;
}> = [
  { id: 'tiza-pastel', label: 'Tiza rosa', tint: '#E88DA1' },
  { id: 'carboncillo', label: 'Carboncillo', tint: '#A6A4A0' },
  { id: 'difuminador', label: 'Difuminador', tint: '#D8C2E6' },
  { id: 'tiza-suave', label: 'Tiza suave', tint: '#EBC299' },
  { id: 'tiza-gruesa', label: 'Tiza gruesa', tint: '#B7CE8F' },
  { id: 'hilo-crochet', label: 'Hilo crema', tint: '#F5E8CF' },
];

const PINCEL_PRESETS: Array<{
  id: BrushPresetId;
  label: string;
  tint: string;
}> = [
  { id: 'pluma-fina', label: 'Pluma fina', tint: '#4E2712' },
  { id: 'hilo-crochet', label: 'Hilo crochet', tint: '#9D3B44' },
  { id: 'acuarela', label: 'Acuarela', tint: '#5B88A8' },
  { id: 'tiza-suave', label: 'Tiza suave', tint: '#D49B50' },
  { id: 'tiza-pastel', label: 'Pastel', tint: '#D8746A' },
  { id: 'carboncillo', label: 'Carboncillo', tint: '#332C28' },
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
const ChalkBrushSwatch: React.FC<{ color: string; isDashed?: boolean }> = ({
  color,
  isDashed,
}) => (
  <svg viewBox="0 0 80 28" className="w-full h-full" fill="none">
    {isDashed ? (
      <path
        d="M8 16 Q26 8, 42 15 T72 13"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray="6 5"
      />
    ) : (
      <>
        <path
          d="M7 18 C20 11, 34 21, 52 12 C62 8, 70 11, 74 14"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        <path
          d="M10 16 C22 10, 36 18, 54 11 C64 8, 69 10, 72 12"
          stroke={color}
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeOpacity="0.92"
        />
        <path
          d="M15 15 C28 13, 44 15, 66 11"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />
      </>
    )}
  </svg>
);

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
  onToggleLayerVisibility,
  onCyclePaperStyle,
  onLayerAction,
  onNewPage,
  onImportBackup,
  onSaveNow,
  onExportBackup,
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
  const [chalkMode, setChalkMode] = useState<'tizas' | 'pinceles' | 'goma'>(
    activeTool === 'eraser' ? 'goma' : brush.category === 'pinceles' ? 'pinceles' : 'tizas'
  );
  const [openDrawer, setOpenDrawer] = useState<'abrir' | 'figuras' | 'imagen' | 'rotar' | null>(null);
  const [paletteFocus, setPaletteFocus] = useState<'todo' | 'color' | 'tizas' | 'capas'>('todo');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTool === 'eraser') setChalkMode('goma');
    else if (brush.category === 'pinceles') setChalkMode('pinceles');
    else setChalkMode('tizas');
  }, [activeTool, brush.category]);

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

  const swatchList = chalkMode === 'pinceles' ? PINCEL_PRESETS : TIZA_PRESETS;
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

        {/* Merged Navigation Strip (formerly on far-right rail) */}
        <div className="grid grid-cols-5 gap-1 pt-0.5 border-t border-[#b98241]/25">
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
            onClick={() => {
              setOpenDrawer(null);
              audioEngine.playSaveChime();
              onExportBackup();
            }}
          />
        </div>

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
        <div className="grid grid-cols-4 gap-1">
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
            icon={<CrochetGifIcon className="w-3.5 h-3.5" />}
            label="GIFs"
            active={activeSection === 'gifs'}
            onClick={() => {
              audioEngine.playRetroPop(2);
              onGoToSection('gifs');
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
                  <span>Maniquí Frente</span>
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
                  <span>Maniquí Espalda</span>
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
                  onChangeZoom(-10);
                }}
                aria-label="Alejar"
                className="p-0.5 rounded text-[#f3dcb3] hover:bg-[#593319] cursor-pointer"
              >
                <ZoomOut className="w-2.5 h-2.5" />
              </button>
              <span className="font-mono-tab text-[10px] text-[#f8e6c4] w-7 text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playStitchClick();
                  onChangeZoom(10);
                }}
                aria-label="Acercar"
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

      {/* 5. ANIMATED PALETTE SECTION SWITCHER (Todo | Color | Tizas | Capas) */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#160a04]/90 border border-[#b98241]/40 text-[10px] shrink-0">
        {(
          [
            { id: 'todo', label: 'Todo' },
            { id: 'color', label: 'Color' },
            { id: 'tizas', label: 'Tizas' },
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
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono-tab text-[#e4c698]">{brush.color}</span>
                  <span
                    className="w-4 h-4 rounded border border-[#f5d599]/80 shadow-inner"
                    style={{ backgroundColor: brush.color }}
                    title={`Color activo: ${brush.color}`}
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

          {(paletteFocus === 'todo' || paletteFocus === 'tizas') && (
            <DockSectionCard
              key="dock-brushes"
              title={
                chalkMode === 'goma' ? 'Goma' : chalkMode === 'pinceles' ? 'Pinceles' : 'Tizas'
              }
              headerRight={
                <div className="flex items-center gap-0.5 rounded-md bg-[#160a04]/80 border border-[#b98241]/35 p-0.5 text-[10px]">
                  {(
                    [
                      { id: 'tizas', label: 'Tizas' },
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
                          onSelectTool('eraser');
                        } else {
                          audioEngine.playYarnPluck(tab.id === 'pinceles' ? 4 : 1);
                          onChangeBrush({
                            category: tab.id,
                            preset: tab.id === 'pinceles' ? 'pluma-fina' : 'tiza-suave',
                          });
                          onSelectTool('draw');
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                        chalkMode === tab.id
                          ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white font-medium'
                          : 'text-[#d9bd94] hover:text-white'
                      }`}
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
                        onChangeBrush({ softness: 75, opacity: 65 });
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
                <div className="grid grid-cols-3 gap-1 mb-1.5">
                  {swatchList.map((preset, idx) => {
                    const active = brush.preset === preset.id && activeTool === 'draw';
                    return (
                      <motion.button
                        key={preset.id}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => {
                          audioEngine.playYarnPluck(idx);
                          onChangeBrush({
                            category: chalkMode,
                            preset: preset.id,
                          });
                          onSelectTool('draw');
                        }}
                        title={preset.label}
                        className={`h-6 rounded-md px-1 border transition-colors cursor-pointer flex items-center justify-center ${
                          active
                            ? 'bg-[#4f2b14] border-[#ffd88a] ring-1 ring-[#eab860] shadow-[0_0_10px_rgba(234,184,96,0.35)]'
                            : 'bg-[#160a04]/85 border-[#8b5d31]/40 hover:border-[#cfa158]'
                        }`}
                      >
                        <ChalkBrushSwatch
                          color={preset.tint}
                          isDashed={preset.id === 'hilo-crochet'}
                        />
                      </motion.button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-1 text-[11px]">
                <SliderRow
                  label="Tamaño"
                  value={brush.size}
                  min={2}
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
            </DockSectionCard>
          )}

          {(paletteFocus === 'todo' || paletteFocus === 'capas') && (() => {
            const derivedLayer: StackableLayerId =
              selectedLayer ||
              (activeTool === 'text'
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
  const activeList = brush.category === 'tizas' ? TIZA_PRESETS : PINCEL_PRESETS;

  return (
    <div className="w-68 p-3.5 flex flex-col gap-3 select-none bg-[#221208] rounded-xl text-[#f5e4c4]">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm text-[#f7e1b5] tracking-wide">Pinceles y Tizas</h3>
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
        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[#160b05] border border-[#b98241]/35 mb-2.5 text-xs">
          {(['pinceles', 'tizas'] as BrushCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                const defaultPreset = cat === 'pinceles' ? 'pluma-fina' : 'tiza-suave';
                onChangeBrush({ category: cat, preset: defaultPreset });
              }}
              className={`py-1.5 rounded-md capitalize transition-colors cursor-pointer ${
                brush.category === cat
                  ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-[#fff8e8] font-medium shadow'
                  : 'text-[#d9bd94] hover:text-white'
              }`}
            >
              {cat === 'pinceles' ? 'Pinceles' : 'Tizas'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {activeList.map((preset) => {
            const active = brush.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChangeBrush({ preset: preset.id })}
                title={preset.label}
                className={`h-9 rounded-lg px-1 transition-colors cursor-pointer border flex items-center justify-center ${
                  active
                    ? 'bg-[#6b3e1f] border-[#ebb86c] text-[#fff6e3] shadow-sm'
                    : 'bg-[#160a04] border-[#8b5d31]/35 hover:border-[#b98241]/60'
                }`}
              >
                <ChalkBrushSwatch
                  color={preset.tint}
                  isDashed={preset.id === 'hilo-crochet'}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pt-2.5 border-t border-[#b98241]/30 text-xs">
        <SliderRow
          label="Tamaño"
          value={brush.size}
          min={2}
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
        onClick={() => onChangeBrush({ softness: 75, opacity: 65 })}
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
