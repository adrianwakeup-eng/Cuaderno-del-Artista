import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Flower2,
  ImagePlus,
  Library,
  PanelRightClose,
  PanelRightOpen,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { StudioSection } from '../types/crochet';
import { audioEngine } from '../utils/audioEngine';

interface RightStudioRailProps {
  activeSection: StudioSection;
  showRightDock: boolean;
  sfxEnabled: boolean;
  onGoToSection: (section: StudioSection) => void;
  onOpenImageUpload: () => void;
  onToggleRightDock: () => void;
  onToggleSfx: () => void;
}

export const RightStudioRail: React.FC<RightStudioRailProps> = ({
  activeSection,
  showRightDock,
  sfxEnabled,
  onGoToSection,
  onOpenImageUpload,
  onToggleRightDock,
  onToggleSfx,
}) => {
  return (
    <aside
      aria-label="Barra lateral derecha de navegación"
      className="relative z-30 flex flex-col items-center justify-center pr-1 sm:pr-1.5 pl-0.5 py-1 shrink-0 select-none"
    >
      <motion.div
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="carved-bar-3d rounded-2xl p-1.5 flex flex-col items-center gap-1.5 shadow-[0_14px_34px_rgba(0,0,0,0.75)]"
      >
        <RailButton
          active={activeSection === 'cuaderno'}
          title="Cuaderno abierto"
          onClick={() => {
            audioEngine.playStitchClick();
            onGoToSection('cuaderno');
          }}
        >
          <BookOpen className="w-5 h-5" />
        </RailButton>

        <RailButton
          active={activeSection === 'patrones'}
          title="Biblioteca de Patrones"
          onClick={() => {
            audioEngine.playRetroPop(1);
            onGoToSection('patrones');
          }}
        >
          <Library className="w-5 h-5" />
        </RailButton>

        <RailButton
          active={activeSection === 'pinceles'}
          title="Estudio de Difuminados y Pinceles Hiperrealistas"
          onClick={() => {
            audioEngine.playYarnPluck(2);
            onGoToSection('pinceles');
          }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M5.5 9.5 C10 13, 15 12, 19.5 8.5" />
            <path d="M4.5 13 C10 16.5, 15 15.5, 19.5 12" />
            <path d="M9.5 4.2 C13 9, 12 15, 8.5 19.5" />
            <path d="M14 4.5 C16.5 9.5, 15.5 15, 12.5 19.8" />
          </svg>
        </RailButton>

        <RailButton
          active={false}
          title="Insertar Imagen rápida"
          onClick={() => {
            audioEngine.playRetroPop(2);
            onOpenImageUpload();
          }}
        >
          <ImagePlus className="w-5 h-5" />
        </RailButton>

        <RailButton
          active={activeSection === 'stickers'}
          title="Stickers de Crochet, Flores y Perlas"
          onClick={() => {
            audioEngine.playYarnPluck(4);
            onGoToSection('stickers');
          }}
        >
          <Flower2 className="w-5 h-5" />
        </RailButton>

        <RailButton
          active={activeSection === 'fuentes'}
          title="Tipografías (Aa)"
          onClick={() => {
            audioEngine.playRetroPop(3);
            onGoToSection('fuentes');
          }}
        >
          <span className="font-editorial font-bold text-base leading-none tracking-tight">
            Aa
          </span>
        </RailButton>

        <div className="w-6 h-px bg-[#b88443]/35 my-0.5" />

        <RailButton
          active={showRightDock}
          title={
            showRightDock
              ? 'Ocultar panel de herramientas (hacer el libro más grande)'
              : 'Mostrar panel de herramientas y paletas'
          }
          onClick={() => {
            audioEngine.playToggleChime(!showRightDock);
            onToggleRightDock();
          }}
        >
          {showRightDock ? (
            <PanelRightClose className="w-5 h-5" />
          ) : (
            <PanelRightOpen className="w-5 h-5" />
          )}
        </RailButton>

        <RailButton
          active={sfxEnabled}
          title={sfxEnabled ? 'Efectos de sonido: Activos' : 'Efectos de sonido: Silenciados'}
          onClick={() => {
            if (!sfxEnabled) {
              // Play preview right after enabling
              window.setTimeout(() => audioEngine.playToggleChime(true), 20);
            }
            onToggleSfx();
          }}
        >
          {sfxEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-60" />}
        </RailButton>

        <RailButton
          active={activeSection === 'configuracion'}
          title="Ajustes y Respaldos"
          onClick={() => {
            audioEngine.playStitchClick();
            onGoToSection('configuracion');
          }}
        >
          <Settings className="w-5 h-5" />
        </RailButton>
      </motion.div>
    </aside>
  );
};

export const LeftStudioRail = RightStudioRail;

const RailButton: React.FC<{
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, title, onClick, children }) => (
  <motion.button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    whileHover={{ scale: 1.09, x: -2 }}
    whileTap={{ scale: 0.91 }}
    transition={{ type: 'spring', stiffness: 450, damping: 24 }}
    className={`group relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer border transition-colors ${
      active
        ? 'border-[#ffe3a3] text-[#fff8e8] shadow-[0_0_16px_rgba(236,176,82,0.5)]'
        : 'bg-transparent border-transparent text-[#e2bc7d] hover:bg-[#532d14]/75 hover:border-[#b98241]/45 hover:text-[#fff1d4]'
    }`}
  >
    {active && (
      <motion.span
        layoutId="right-rail-active-pill"
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#e4a64b] to-[#98591c] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] -z-0"
      />
    )}
    <span className="relative z-10 flex items-center justify-center">{children}</span>

    {/* Left-opening tactile craft tooltip */}
    <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-full mr-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[#241208]/95 border border-[#d6a25e]/60 text-[11px] font-medium text-[#ffebc2] whitespace-nowrap shadow-xl z-50">
      {title}
    </span>
  </motion.button>
);
