import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import type { WardrobeSeasonId } from '../types/crochet';
import { audioEngine } from '../utils/audioEngine';
import { CrochetWardrobe3D } from './CrochetWardrobe3D';

interface RoyalWardrobeRoomViewProps {
  onSelectSeason: (season: WardrobeSeasonId) => void;
  onBackToNotebook: () => void;
}

/**
 * Full-Screen Baroque Sanctuary housing the Royal 4-Season Greek Wardrobe.
 * Reached via the magical Crochet & Stitching transition from the "Vestidor" button.
 */
export const RoyalWardrobeRoomView: React.FC<RoyalWardrobeRoomViewProps> = ({
  onSelectSeason,
  onBackToNotebook,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full h-full flex flex-col overflow-hidden select-none"
      style={{
        background:
          'radial-gradient(ellipse 85% 68% at 50% 24%, #2e2014 0%, #1c120a 52%, #100904 100%)',
      }}
    >
      {/* Warm Museum Gallery Chandelier Spotlights illuminating the 4 Baroque Doors */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 56% 42% at 50% 8%, rgba(255, 224, 146, 0.24) 0%, rgba(224, 168, 68, 0.08) 46%, rgba(0, 0, 0, 0) 78%)',
        }}
      />

      {/* Subtle Palace Hardwood Floor Reflection under the Wardrobe Feet */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%]"
        style={{
          background:
            'linear-gradient(180deg, rgba(24, 12, 5, 0) 0%, rgba(42, 22, 10, 0.65) 45%, rgba(18, 9, 4, 0.92) 100%)',
        }}
      />

      {/* Subtle Drifting Golden Atelier Dust Motes */}
      {[
        { left: '12%', top: '24%', delay: '0s' },
        { left: '28%', top: '16%', delay: '1.3s' },
        { left: '52%', top: '14%', delay: '2.4s' },
        { left: '74%', top: '20%', delay: '0.8s' },
        { left: '88%', top: '30%', delay: '1.9s' },
      ].map((m, i) => (
        <span
          key={i}
          style={{ left: m.left, top: m.top, animationDelay: m.delay }}
          className="pointer-events-none absolute w-2 h-2 rounded-full bg-[#ffe6a4]/70 blur-[0.8px] animate-mote"
        />
      ))}

      {/* Discreet Palace Top Bar (safe-top for Android status bar / Galaxy Note 9) */}
      <header className="relative z-20 shrink-0 flex items-center justify-between gap-2 px-3 sm:px-6 pt-2.5 sm:pt-3 pb-1.5 safe-top">
        <button
          type="button"
          onClick={() => {
            audioEngine.playStitchClick();
            onBackToNotebook();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#e3b868]/65 bg-[#2a1509]/90 hover:bg-[#3f200e] text-xs font-semibold text-[#fae6bf] shadow-md transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#f4c668]" />
          <span>Volver al Cuaderno</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 px-4 py-1 rounded-full border border-[#d6a352]/45 bg-[#241207]/80 text-[#f5dfb4] shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-[#ffd978]" />
          <span className="font-editorial italic text-xs tracking-wide">
            Elige una puerta para entrar al Atelier de esa estación
          </span>
        </div>

        <span className="text-[11px] font-display tracking-[0.2em] uppercase text-[#d8b16a]/85 hidden md:inline">
          Vestidor Real
        </span>
      </header>

      {/* FULL-SCREEN BAROQUE 4-SEASON ROYAL WARDROBE */}
      <main className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center px-3 sm:px-6 lg:px-10 pb-4 pt-1">
        <div className="w-full max-w-[1440px] h-full max-h-[860px] flex items-stretch justify-center">
          <CrochetWardrobe3D
            onEnterDressingRoom={(season) => onSelectSeason(season ?? 'primavera')}
            className="w-full h-full"
          />
        </div>
      </main>
    </motion.div>
  );
};
