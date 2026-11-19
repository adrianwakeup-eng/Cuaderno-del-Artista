import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  BookMarked,
  Circle,
  Cloud,
  Download,
  FilePlus2,
  Flower2,
  FolderOpen,
  Heart,
  HelpCircle,
  ImagePlus,
  Layers,
  Minus,
  MousePointer,
  PenTool,
  Redo2,
  Save,
  Settings,
  Shapes,
  Square,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import type { ActiveCanvasTool, BrushSettings, ShapeKind, StudioSection } from '../types/crochet';
import { YarnBall3D } from './CrochetDecorations';

interface TopStudioBarProps {
  activeSection: StudioSection;
  patternCount: number;
  activeTool: ActiveCanvasTool;
  selectedShapeKind: ShapeKind;
  onSelectShapeKind: (kind: ShapeKind) => void;
  brush?: BrushSettings;
  recentColors?: string[];
  onChangeBrush?: (patch: Partial<BrushSettings>) => void;
  onSelectColor?: (hex: string) => void;
  onSelectTool: (tool: ActiveCanvasTool) => void;
  onClearPageStrokes?: () => void;
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
  onOpenHelp: () => void;
  onReturnToCover: () => void;
  onOpenDrive: (tab?: 'backups' | 'images' | 'all') => void;
  driveConnected: boolean;
  showRightDock: boolean;
  onToggleRightDock: () => void;
  savedToast: string | null;
}

type PopupKey = 'abrir' | 'figuras' | 'imagen' | null;

export const TopStudioBar: React.FC<TopStudioBarProps> = ({
  activeSection,
  activeTool,
  selectedShapeKind,
  onSelectShapeKind,
  onSelectTool,
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
  onOpenHelp,
  onReturnToCover,
  onOpenDrive,
  driveConnected,
  showRightDock,
  onToggleRightDock,
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
    <header ref={barRef} className="relative z-40 w-full shrink-0 select-none">
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

      {/* Row 1: Embossed Golden Studio Title + Window Controls */}
      <div className="relative flex items-center justify-between px-4 sm:px-6 pt-1.5 pb-1">
        {/* Spacer left for 3D lace corner ornament */}
        <div className="w-24 sm:w-44 shrink-0" />

        {/* Centered 3D Yarn Ball + Title matching uploaded photo */}
        <div className="flex items-center justify-center gap-2.5 min-w-0">
          <YarnBall3D tone="gold" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 -my-1" />
          <h1 className="font-editorial italic font-bold text-lg sm:text-2xl tracking-wide gold-embossed-title truncate">
            Cuaderno del Artista – Fuentes-Nazco
          </h1>
        </div>

        {/* Right: Drive, Help, Portada & 3D Brass Window Controls */}
        <div className="flex items-center justify-end gap-1.5 w-24 sm:w-44 shrink-0">
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
            className={`relative hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer whitespace-nowrap ${
              driveConnected
                ? 'bg-[#253b28]/90 border-[#84c78d]/60 text-[#e4f7e6] hover:bg-[#325136]'
                : 'bg-[#2a1509]/85 border-[#c99552]/45 text-[#e8cfab] hover:bg-[#492713]'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-[#f3cf8a]" />
            <span className="hidden xl:inline">Drive</span>
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            title="Guía rápida"
            className="hidden md:inline-flex p-1 rounded-lg bg-[#2a1509]/80 border border-[#c99552]/35 text-[#f0cf93] hover:bg-[#492713] cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onReturnToCover}
            title="Volver a la portada"
            className="hidden md:inline-flex p-1 rounded-lg bg-[#2a1509]/80 border border-[#c99552]/35 text-[#f0cf93] hover:bg-[#492713] cursor-pointer"
          >
            <BookMarked className="w-3.5 h-3.5" />
          </button>

          {/* 3D Brass Window Controls (-, □, ×) matching uploaded photo */}
          <div className="carved-bar-3d flex items-center gap-0.5 rounded-lg px-1 py-0.5 mr-7">
            <button
              type="button"
              onClick={() => handleElectronAction('minimize')}
              title="Minimizar"
              className="p-1 text-[#f3d49a] hover:text-white hover:bg-[#5b3319] rounded cursor-pointer"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleElectronAction('maximize')}
              title="Maximizar / Pantalla completa"
              className="p-1 text-[#f3d49a] hover:text-white hover:bg-[#5b3319] rounded cursor-pointer"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => handleElectronAction('close')}
              title="Cerrar / Volver a la portada"
              className="p-1 text-[#f3d49a] hover:text-white hover:bg-[#8c2d34] rounded cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Carved 3D Brass Horizontal Icon-Above-Label Toolbar */}
      <div className="flex justify-center px-3 sm:px-6 pb-1">
        <div className="carved-bar-3d rounded-2xl px-2 sm:px-3 py-1 flex items-center gap-0.5 sm:gap-1 max-w-full overflow-visible">
          <ToolbarIconBtn
            icon={<FilePlus2 className="w-4 h-4" />}
            label="Nuevo"
            onClick={() => {
              setOpenPopup(null);
              onNewPage();
            }}
          />

          {/* Abrir Pop-up */}
          <div className="relative">
            <ToolbarIconBtn
              icon={<FolderOpen className="w-4 h-4" />}
              label="Abrir"
              active={openPopup === 'abrir'}
              onClick={() => togglePopup('abrir')}
            />
            <AnimatePresence>
              {openPopup === 'abrir' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-52 rounded-xl leather-panel bg-[#221208] p-1.5 z-50 flex flex-col gap-0.5 shadow-[0_20px_45px_rgba(0,0,0,0.9)]"
                >
                  <PopupMenuItem
                    icon={<FolderOpen className="w-4 h-4 text-[#f0c77c]" />}
                    label="Abrir respaldo (.json)"
                    onClick={() => {
                      importInputRef.current?.click();
                      setOpenPopup(null);
                    }}
                  />
                  <PopupMenuItem
                    icon={<Cloud className="w-4 h-4 text-[#f3cf8a]" />}
                    label="Abrir desde Google Drive"
                    onClick={() => {
                      onOpenDrive('backups');
                      setOpenPopup(null);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ToolbarIconBtn
            icon={<Save className="w-4 h-4" />}
            label="Guardar"
            onClick={() => {
              setOpenPopup(null);
              onSaveNow();
            }}
          />

          <ToolbarIconBtn
            icon={<Undo2 className="w-4 h-4" />}
            label="Deshacer"
            disabled={!canUndo}
            onClick={onUndo}
          />

          <ToolbarIconBtn
            icon={<Redo2 className="w-4 h-4" />}
            label="Rehacer"
            disabled={!canRedo}
            onClick={onRedo}
          />

          <div className="h-7 w-px bg-[#b88443]/30 mx-0.5 hidden sm:block" />

          <ToolbarIconBtn
            icon={<MousePointer className="w-4 h-4" />}
            label="Mover"
            active={activeSection === 'cuaderno' && activeTool === 'select'}
            onClick={() => {
              setOpenPopup(null);
              onGoToSection('cuaderno');
              onSelectTool('select');
            }}
          />

          <ToolbarIconBtn
            icon={<Type className="w-4 h-4" />}
            label="Texto"
            active={activeSection === 'cuaderno' && activeTool === 'text'}
            onClick={() => {
              setOpenPopup(null);
              onGoToSection('cuaderno');
              onSelectTool('text');
            }}
          />

          <ToolbarIconBtn
            icon={<PenTool className="w-4 h-4" />}
            label="Dibujo"
            active={activeSection === 'cuaderno' && activeTool === 'draw'}
            onClick={() => {
              setOpenPopup(null);
              onGoToSection('cuaderno');
              onSelectTool('draw');
            }}
          />

          {/* Figuras */}
          <div className="relative">
            <ToolbarIconBtn
              icon={<Shapes className="w-4 h-4" />}
              label="Figuras"
              active={openPopup === 'figuras' || activeTool === 'shape'}
              onClick={() => togglePopup('figuras')}
            />
            <AnimatePresence>
              {openPopup === 'figuras' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 rounded-xl leather-panel bg-[#221208] p-2.5 z-50 shadow-[0_22px_50px_rgba(0,0,0,0.92)]"
                >
                  <p className="px-1 pb-1.5 text-[10px] uppercase tracking-wider text-[#d9ba8b]">
                    Figuras (Paint &amp; Crochet)
                  </p>
                  <div className="grid grid-cols-3 gap-1">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Imagen */}
          <div className="relative">
            <ToolbarIconBtn
              icon={<ImagePlus className="w-4 h-4" />}
              label="Imagen"
              active={openPopup === 'imagen'}
              onClick={() => togglePopup('imagen')}
            />
            <AnimatePresence>
              {openPopup === 'imagen' && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl leather-panel bg-[#221208] p-1.5 z-50 flex flex-col gap-0.5 shadow-[0_22px_50px_rgba(0,0,0,0.92)]"
                >
                  <PopupMenuItem
                    icon={<ImagePlus className="w-4 h-4 text-[#f3cf8a]" />}
                    label="Subir foto desde equipo"
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <ToolbarIconBtn
            icon={<Flower2 className="w-4 h-4" />}
            label="Sticker"
            active={activeSection === 'stickers'}
            onClick={() => {
              setOpenPopup(null);
              onGoToSection('stickers');
            }}
          />

          <ToolbarIconBtn
            icon={<Layers className="w-4 h-4" />}
            label="Capa"
            active={showRightDock}
            onClick={() => {
              setOpenPopup(null);
              onGoToSection('cuaderno');
              onToggleRightDock();
            }}
          />

          <ToolbarIconBtn
            icon={<Download className="w-4 h-4" />}
            label="Exportar"
            onClick={() => {
              setOpenPopup(null);
              onExportBackup();
            }}
          />

          <ToolbarIconBtn
            icon={<Settings className="w-4 h-4" />}
            label="Ajustes"
            active={activeSection === 'configuracion'}
            onClick={() => {
              setOpenPopup(null);
              onGoToSection('configuracion');
            }}
          />
        </div>
      </div>

      {/* Floating Saved / Feedback Toast */}
      <AnimatePresence>
        {savedToast && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute right-6 top-full mt-1 z-50 text-xs text-[#ffebc2] bg-[#361e0f]/95 border border-[#d6a25e]/60 px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap"
          >
            {savedToast}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const ToolbarIconBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, label, active = false, disabled = false, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-0.5 px-2 sm:px-2.5 py-1 rounded-xl transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed shrink-0 ${
      active
        ? 'bg-gradient-to-b from-[#d49644]/85 to-[#8a511b]/90 text-[#fff8e8] shadow-[inset_0_1px_0_rgba(255,244,200,0.45),0_0_10px_rgba(235,181,86,0.4)] border border-[#f5d290]/75'
        : 'text-[#f2d093] hover:bg-[#522c14]/75 hover:text-[#fff6e0] border border-transparent'
    }`}
  >
    <span className="flex items-center justify-center">{icon}</span>
    <span className="text-[10px] leading-none font-medium tracking-tight whitespace-nowrap">
      {label}
    </span>
  </button>
);

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
