import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  FilePlus2,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Type,
  Shapes,
  ImagePlus,
  Flower2,
  Brush,
  MousePointer,
  Settings,
  Volume2,
  VolumeX,
  HelpCircle,
  BookMarked,
  BookOpen,
  ScrollText,
  CaseSensitive,
  ChevronDown,
  Download,
  Minus,
  Square,
  X,
  Eraser,
  Circle,
  ArrowRight,
  Heart,
  Cloud,
} from 'lucide-react';
import type { ActiveCanvasTool, BrushSettings, ShapeKind, StudioSection } from '../types/crochet';
import { BrushStudioPanel, ColorPalettePanel, EraserStudioPanel } from './RightToolPanels';

interface TopStudioBarProps {
  activeSection: StudioSection;
  patternCount: number;
  activeTool: ActiveCanvasTool;
  selectedShapeKind: ShapeKind;
  onSelectShapeKind: (kind: ShapeKind) => void;
  brush: BrushSettings;
  recentColors: string[];
  onChangeBrush: (patch: Partial<BrushSettings>) => void;
  onSelectColor: (hex: string) => void;
  onSelectTool: (tool: ActiveCanvasTool) => void;
  onClearPageStrokes: () => void;
  onNewPage: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onSaveNow: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenImageUpload: () => void;
  onGoToSection: (section: StudioSection) => void;
  musicPlaying: boolean;
  onToggleMusic: () => void;
  onOpenHelp: () => void;
  onReturnToCover: () => void;
  onOpenDrive: (tab?: 'backups' | 'images' | 'all') => void;
  driveConnected: boolean;
  savedToast: string | null;
}

type PopupKey = 'archivo' | 'insertar' | 'brocha' | 'goma' | 'color' | null;

export const TopStudioBar: React.FC<TopStudioBarProps> = ({
  activeSection,
  patternCount,
  activeTool,
  selectedShapeKind,
  onSelectShapeKind,
  brush,
  recentColors,
  onChangeBrush,
  onSelectColor,
  onSelectTool,
  onClearPageStrokes,
  onNewPage,
  onExportBackup,
  onImportBackup,
  onSaveNow,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenImageUpload,
  onGoToSection,
  musicPlaying,
  onToggleMusic,
  onOpenHelp,
  onReturnToCover,
  onOpenDrive,
  driveConnected,
  savedToast,
}) => {
  const [openPopup, setOpenPopup] = useState<PopupKey>(null);
  const barRef = useRef<HTMLElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenPopup(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPopup(null);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleElectronAction = (action: 'minimize' | 'maximize' | 'close') => {
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

  const togglePopup = (key: Exclude<PopupKey, null>) => {
    setOpenPopup((prev) => (prev === key ? null : key));
  };

  return (
    <header
      ref={barRef}
      className="relative z-40 w-full shrink-0 leather-surface border-b border-[#d49e58]/40 select-none"
    >
      {/* Hidden backup import input */}
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

      {/* Single Unified Top Studio Bar (no wrapping — right controls stay pinned top-right) */}
      <div className="flex flex-nowrap items-center justify-between gap-2 px-3 py-1.5 bg-gradient-to-r from-[#2c170b] via-[#3b2010] to-[#261409]">
        {/* Left: Brand + Cuaderno & Patrones */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#cf6c6e] to-[#7d2228] border border-[#f2d098]/60 flex items-center justify-center shadow shrink-0">
              <span className="w-3 h-3 rounded-full border border-dashed border-[#f7e1b5]" />
            </div>
            <h1 className="font-display text-sm tracking-wide text-[#f6e2be] whitespace-nowrap">
              Cuaderno del Artista
            </h1>
          </div>

          <div className="h-5 w-px bg-[#b88443]/35 hidden sm:block" />

          <nav className="flex items-center gap-1" aria-label="Secciones principales">
            <button
              type="button"
              onClick={() => {
                setOpenPopup(null);
                onGoToSection('cuaderno');
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeSection === 'cuaderno'
                  ? 'bg-gradient-to-b from-[#d49b50] to-[#9b6126] text-[#fff8eb] font-medium border border-[#f5d292]/60 shadow'
                  : 'text-[#e8cfab] hover:bg-[#5c361d]/60 hover:text-[#fff2dc]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cuaderno</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOpenPopup(null);
                onGoToSection('patrones');
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeSection === 'patrones'
                  ? 'bg-gradient-to-b from-[#d49b50] to-[#9b6126] text-[#fff8eb] font-medium border border-[#f5d292]/60 shadow'
                  : 'text-[#e8cfab] hover:bg-[#5c361d]/60 hover:text-[#fff2dc]'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Patrones</span>
              <span className="font-mono-tab text-[11px] opacity-80">({patternCount})</span>
            </button>
          </nav>
        </div>

        {/* Center: Organized Tools & Pop-up Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Archivo Pop-up */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopup('archivo')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer whitespace-nowrap ${
                openPopup === 'archivo'
                  ? 'bg-[#6b3d1e] border-[#ebb96a]/70 text-white'
                  : 'bg-[#2a160b]/80 border-[#b98241]/35 text-[#e8cfab] hover:bg-[#4b2a15]'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#f0c77c]" />
              <span>Archivo</span>
              <ChevronDown className="w-3 h-3 opacity-75" />
            </button>

            <AnimatePresence>
              {openPopup === 'archivo' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full mt-2 w-52 rounded-xl leather-panel bg-[#221208] p-1.5 z-50 flex flex-col gap-0.5 shadow-[0_20px_45px_rgba(0,0,0,0.88)] origin-top-left"
                >
                  <PopupMenuItem
                    icon={<FilePlus2 className="w-4 h-4 text-[#f0c77c]" />}
                    label="Nueva hoja"
                    onClick={() => {
                      onNewPage();
                      setOpenPopup(null);
                    }}
                  />
                  <PopupMenuItem
                    icon={<Save className="w-4 h-4 text-[#f0c77c]" />}
                    label="Guardar cuaderno"
                    onClick={() => {
                      onSaveNow();
                      setOpenPopup(null);
                    }}
                  />
                  <PopupMenuItem
                    icon={<FolderOpen className="w-4 h-4 text-[#f0c77c]" />}
                    label="Abrir respaldo (.json)"
                    onClick={() => {
                      importInputRef.current?.click();
                      setOpenPopup(null);
                    }}
                  />
                  <PopupMenuItem
                    icon={<Download className="w-4 h-4 text-[#f0c77c]" />}
                    label="Exportar respaldo"
                    onClick={() => {
                      onExportBackup();
                      setOpenPopup(null);
                    }}
                  />
                  <div className="my-1 border-t border-[#b98241]/25" />
                  <PopupMenuItem
                    icon={<Cloud className="w-4 h-4 text-[#f3cf8a]" />}
                    label="Google Drive (Nube)"
                    onClick={() => {
                      onOpenDrive('backups');
                      setOpenPopup(null);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Deshacer / Rehacer */}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer"
            className="p-1.5 rounded-lg text-[#e9c891] hover:bg-[#5c361d]/60 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Rehacer"
            className="p-1.5 rounded-lg text-[#e9c891] hover:bg-[#5c361d]/60 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-[#b88443]/30 mx-0.5" />

          {/* Mover / Seleccionar */}
          <button
            type="button"
            onClick={() => {
              setOpenPopup(null);
              onGoToSection('cuaderno');
              onSelectTool('select');
            }}
            title="Mover y editar elementos"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer whitespace-nowrap ${
              activeSection === 'cuaderno' && activeTool === 'select'
                ? 'bg-[#6b3d1e] border-[#ebb96a]/70 text-white'
                : 'border-transparent text-[#e8cfab] hover:bg-[#5c361d]/60'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5 text-[#f0c77c]" />
            <span className="hidden md:inline">Mover</span>
          </button>

          {/* Insertar Pop-up (Texto, Fuentes, Figura, Imagen, Sticker) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopup('insertar')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer whitespace-nowrap ${
                openPopup === 'insertar' ||
                activeTool === 'text' ||
                activeTool === 'shape' ||
                activeSection === 'stickers' ||
                activeSection === 'fuentes'
                  ? 'bg-[#6b3d1e] border-[#ebb96a]/70 text-white'
                  : 'bg-[#2a160b]/80 border-[#b98241]/35 text-[#e8cfab] hover:bg-[#4b2a15]'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-[#f3cf8a]" />
              <span>Insertar</span>
              <ChevronDown className="w-3 h-3 opacity-75" />
            </button>

            <AnimatePresence>
              {openPopup === 'insertar' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-full mt-2 w-60 rounded-xl leather-panel bg-[#221208] p-2 z-50 flex flex-col gap-1 shadow-[0_20px_45px_rgba(0,0,0,0.88)] origin-top-left"
                >
                  <PopupMenuItem
                    icon={<Type className="w-4 h-4 text-[#f3cf8a]" />}
                    label="Cuadro de Texto (Word)"
                    onClick={() => {
                      onGoToSection('cuaderno');
                      onSelectTool('text');
                      setOpenPopup(null);
                    }}
                  />
                  <PopupMenuItem
                    icon={<CaseSensitive className="w-4 h-4 text-[#f3cf8a]" />}
                    label="Elegir Fuente"
                    onClick={() => {
                      onGoToSection('fuentes');
                      setOpenPopup(null);
                    }}
                  />
                  <div className="my-1 pt-1.5 border-t border-[#b98241]/25">
                    <p className="px-2 pb-1 text-[10px] uppercase tracking-wider text-[#d9ba8b]">
                      Figuras (Paint &amp; Crochet)
                    </p>
                    <div className="grid grid-cols-3 gap-1 px-1">
                      {(
                        [
                          { id: 'crochet-ring', label: 'Anillo', icon: <Shapes className="w-3.5 h-3.5" /> },
                          { id: 'circle', label: 'Círculo', icon: <Circle className="w-3.5 h-3.5" /> },
                          { id: 'square', label: 'Cuadro', icon: <Square className="w-3.5 h-3.5" /> },
                          { id: 'arrow', label: 'Flecha', icon: <ArrowRight className="w-3.5 h-3.5" /> },
                          { id: 'line', label: 'Línea', icon: <Minus className="w-3.5 h-3.5" /> },
                          { id: 'heart', label: 'Corazón', icon: <Heart className="w-3.5 h-3.5" /> },
                        ] as Array<{ id: ShapeKind; label: string; icon: React.ReactNode }>
                      ).map((sh) => (
                        <button
                          key={sh.id}
                          type="button"
                          onClick={() => {
                            onSelectShapeKind(sh.id);
                            onGoToSection('cuaderno');
                            onSelectTool('shape');
                            setOpenPopup(null);
                          }}
                          className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg text-[10px] border cursor-pointer transition-colors ${
                            activeTool === 'shape' && selectedShapeKind === sh.id
                              ? 'bg-[#6b3e1f] border-[#ebb86c] text-white'
                              : 'bg-[#2c180c] border-[#8b5d31]/30 text-[#e8cfab] hover:bg-[#492915]'
                          }`}
                        >
                          {sh.icon}
                          <span>{sh.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-1 border-t border-[#b98241]/25 flex flex-col gap-0.5">
                    <PopupMenuItem
                      icon={<ImagePlus className="w-4 h-4 text-[#f3cf8a]" />}
                      label="Subir Imagen"
                      onClick={() => {
                        onOpenImageUpload();
                        setOpenPopup(null);
                      }}
                    />
                    <PopupMenuItem
                      icon={<Cloud className="w-4 h-4 text-[#9fd3a6]" />}
                      label="Foto desde Google Drive"
                      onClick={() => {
                        onOpenDrive('images');
                        setOpenPopup(null);
                      }}
                    />
                    <PopupMenuItem
                      icon={<Flower2 className="w-4 h-4 text-[#eb9b9a]" />}
                      label="Stickers Crochet"
                      onClick={() => {
                        onGoToSection('stickers');
                        setOpenPopup(null);
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Brocha Pop-up (Pinceles y Tizas + sliders) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopup('brocha')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer whitespace-nowrap ${
                openPopup === 'brocha' ||
                (activeSection === 'cuaderno' && activeTool === 'draw')
                  ? 'bg-[#6b3d1e] border-[#ebb96a]/70 text-white'
                  : 'bg-[#2a160b]/80 border-[#b98241]/35 text-[#e8cfab] hover:bg-[#4b2a15]'
              }`}
            >
              <Brush className="w-3.5 h-3.5 text-[#f3cf8a]" />
              <span>Brocha</span>
              <ChevronDown className="w-3 h-3 opacity-75" />
            </button>

            <AnimatePresence>
              {openPopup === 'brocha' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 sm:left-0 top-full mt-2 rounded-xl leather-panel bg-[#221208] p-0.5 z-50 shadow-[0_22px_50px_rgba(0,0,0,0.9)] origin-top"
                >
                  <BrushStudioPanel
                    brush={brush}
                    onChangeBrush={(patch) => {
                      onChangeBrush(patch);
                      onGoToSection('cuaderno');
                      onSelectTool('draw');
                    }}
                    onSelectEraser={() => {
                      onGoToSection('cuaderno');
                      onSelectTool('eraser');
                      setOpenPopup('goma');
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Goma de Borrar Pop-up */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                onGoToSection('cuaderno');
                onSelectTool('eraser');
                togglePopup('goma');
              }}
              title="Goma de borrar trazos"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer whitespace-nowrap ${
                openPopup === 'goma' ||
                (activeSection === 'cuaderno' && activeTool === 'eraser')
                  ? 'bg-[#6b3d1e] border-[#ebb96a]/70 text-white'
                  : 'bg-[#2a160b]/80 border-[#b98241]/35 text-[#e8cfab] hover:bg-[#4b2a15]'
              }`}
            >
              <Eraser className="w-3.5 h-3.5 text-[#f3cf8a]" />
              <span className="hidden lg:inline">Goma</span>
              <ChevronDown className="w-3 h-3 opacity-75" />
            </button>

            <AnimatePresence>
              {openPopup === 'goma' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 sm:left-0 top-full mt-2 rounded-xl leather-panel bg-[#221208] p-0.5 z-50 shadow-[0_22px_50px_rgba(0,0,0,0.9)] origin-top"
                >
                  <EraserStudioPanel
                    brush={brush}
                    onChangeBrush={(patch) => {
                      onChangeBrush(patch);
                      onGoToSection('cuaderno');
                      onSelectTool('eraser');
                    }}
                    onClearPageStrokes={() => {
                      onClearPageStrokes();
                      setOpenPopup(null);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Paleta de Colores Pop-up */}
          <div className="relative">
            <button
              type="button"
              onClick={() => togglePopup('color')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer whitespace-nowrap ${
                openPopup === 'color' || activeTool === 'eyedropper'
                  ? 'bg-[#6b3d1e] border-[#ebb96a]/70 text-white'
                  : 'bg-[#2a160b]/80 border-[#b98241]/35 text-[#e8cfab] hover:bg-[#4b2a15]'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-[#fff2d2]/80 shadow-inner shrink-0"
                style={{ backgroundColor: brush.color }}
              />
              <span>Color</span>
              <ChevronDown className="w-3 h-3 opacity-75" />
            </button>

            <AnimatePresence>
              {openPopup === 'color' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full mt-2 rounded-xl leather-panel bg-[#221208] p-0.5 z-50 shadow-[0_22px_50px_rgba(0,0,0,0.9)] origin-top-right"
                >
                  <ColorPalettePanel
                    color={brush.color}
                    recentColors={recentColors}
                    onSelectColor={(hex) => {
                      onSelectColor(hex);
                    }}
                    onActivateEyedropper={() => {
                      onGoToSection('cuaderno');
                      onSelectTool('eyedropper');
                      setOpenPopup(null);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Drive, Audio, Config, Help, Cerrar Libro, Window Controls (pinned top-right) */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setOpenPopup(null);
              onOpenDrive('backups');
            }}
            title={
              driveConnected
                ? 'Google Drive conectado · Respaldos y Fotos'
                : 'Conectar con Google Drive'
            }
            className={`relative inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors cursor-pointer whitespace-nowrap ${
              driveConnected
                ? 'bg-[#2a3f2d] border-[#84c78d]/50 text-[#e4f7e6] hover:bg-[#36523a]'
                : 'bg-[#2a160b]/80 border-[#b98241]/35 text-[#e8cfab] hover:bg-[#4b2a15]'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-[#f3cf8a]" />
            <span className="hidden lg:inline">Drive</span>
            {driveConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#6fe381]" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleMusic}
            title={musicPlaying ? 'Silenciar música relajante' : 'Reproducir música relajante'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              musicPlaying
                ? 'bg-[#6f3d1d] text-[#ffdfa3] border border-[#e6b86a]/50'
                : 'text-[#e7ca9c] hover:bg-[#5c361d]/60 hover:text-white'
            }`}
          >
            {musicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setOpenPopup(null);
              onGoToSection('configuracion');
            }}
            title="Configuración y Windows .exe"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSection === 'configuracion'
                ? 'bg-[#6f3d1d] text-[#ffdfa3] border border-[#e6b86a]/50'
                : 'text-[#e7ca9c] hover:bg-[#5c361d]/60 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            title="Guía rápida"
            className="p-1.5 rounded-lg text-[#e7ca9c] hover:bg-[#5c361d]/60 hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onReturnToCover}
            title="Cerrar Libro y volver a la portada"
            className="ml-0.5 inline-flex items-center gap-1.5 px-2 py-1 rounded border border-[#d49e58]/40 bg-[#2f1a0d] hover:bg-[#492915] text-xs text-[#f0d9b3] transition-colors cursor-pointer whitespace-nowrap"
          >
            <BookMarked className="w-3.5 h-3.5 text-[#e6b668]" />
            <span className="hidden xl:inline">Cerrar Libro</span>
          </button>

          <div className="flex items-center gap-0.5 ml-0.5 bg-[#1e1007]/80 border border-[#b98241]/35 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => handleElectronAction('minimize')}
              title="Minimizar"
              className="p-1 text-[#d7ba90] hover:text-white hover:bg-[#4b2b16] rounded cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleElectronAction('maximize')}
              title="Pantalla completa"
              className="p-1 text-[#d7ba90] hover:text-white hover:bg-[#4b2b16] rounded cursor-pointer"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleElectronAction('close')}
              title="Volver a la portada"
              className="p-1 text-[#d7ba90] hover:text-white hover:bg-[#8c2d34] rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute right-4 top-full mt-2 z-50 text-xs text-[#ffebc2] bg-[#361e0f]/95 border border-[#d6a25e]/50 px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
          >
            {savedToast}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const PopupMenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-[#f2dec0] hover:bg-[#5c361d]/75 hover:text-white transition-colors text-left cursor-pointer whitespace-nowrap"
  >
    {icon}
    <span>{label}</span>
  </button>
);
