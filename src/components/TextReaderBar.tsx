import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Pause, Play, RotateCcw, Volume2, X } from 'lucide-react';
import {
  formatReaderTime,
  textReaderEngine,
  type TextReaderState,
} from '../utils/textReaderEngine';

const RATE_STEPS = [0.85, 1.0, 1.15, 1.3];

export const TextReaderBar: React.FC<{
  readerState: TextReaderState;
}> = ({ readerState }) => {
  const isPlaying = readerState.status === 'playing';
  const pct = Math.max(0, Math.min(100, readerState.progress * 100));

  const cycleRate = () => {
    const idx = RATE_STEPS.findIndex((r) => Math.abs(r - readerState.rate) < 0.04);
    const next = RATE_STEPS[(idx + 1) % RATE_STEPS.length];
    textReaderEngine.setRate(next);
  };

  return (
    <AnimatePresence>
      {readerState.active && (
        <motion.div
          key="text-reader-bar"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(94vw,540px)] rounded-2xl leather-panel bg-[#221208]/96 border border-[#e7b86a]/65 shadow-[0_18px_46px_rgba(0,0,0,0.82)] px-3.5 py-2.5 text-[#f9e7c6] select-none backdrop-blur-md"
        >
          {/* Top metadata strip: Voice + Excerpt + Speed + Close */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#3d210f] border border-[#e5b566]/50 text-[#f5ca79] shrink-0">
                <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[#ffebc2] truncate leading-tight">
                  {readerState.excerpt || 'Lectura de texto'}
                </p>
                <p className="text-[9.5px] text-[#cfa874] truncate leading-tight">
                  Voz masculina neutral · {readerState.voiceName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {readerState.availableVoices.length > 1 && (
                <select
                  value={readerState.voiceURI}
                  onChange={(e) => textReaderEngine.selectVoiceByURI(e.target.value)}
                  aria-label="Seleccionar voz masculina"
                  title="Cambiar voz masculina"
                  className="max-w-[132px] px-1.5 py-0.5 rounded-md bg-[#341b0c] hover:bg-[#4e2a14] border border-[#c99552]/40 text-[10px] text-[#f5dca8] focus:outline-none focus:border-[#f0c06c] cursor-pointer truncate"
                >
                  {readerState.availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI} className="bg-[#221208] text-[#ffebc2]">
                      {v.label}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={cycleRate}
                title="Cambiar velocidad de lectura"
                className="px-1.5 py-0.5 rounded-md bg-[#341b0c] hover:bg-[#4e2a14] border border-[#c99552]/40 text-[10px] font-mono-tab text-[#f5dca8] cursor-pointer transition-colors"
              >
                {readerState.rate === 1 ? '1x' : `${readerState.rate}x`}
              </button>
              <button
                type="button"
                onClick={() => textReaderEngine.restart()}
                title="Reiniciar desde el principio"
                aria-label="Reiniciar lectura"
                className="p-1 rounded-md bg-[#341b0c] hover:bg-[#4e2a14] border border-[#c99552]/40 text-[#f3d49a] hover:text-white cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => textReaderEngine.stop()}
                title="Detener y cerrar lector"
                aria-label="Cerrar lector"
                className="p-1 rounded-md bg-[#4d1a1f] hover:bg-[#6e242b] border border-[#e08b8f]/45 text-[#ffe1e1] cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main Playback Row: Play/Pause + Time Scrubber Bar + Elapsed / Total */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => textReaderEngine.togglePlayPause()}
              aria-label={isPlaying ? 'Pausar lectura' : 'Reproducir lectura'}
              title={isPlaying ? 'Pausar' : 'Reproducir'}
              className="w-9 h-9 rounded-full bg-gradient-to-b from-[#e4ad5c] to-[#a16424] hover:brightness-110 active:scale-95 border border-[#ffe4a8] text-[#1f0e04] flex items-center justify-center shadow-[0_4px_14px_rgba(232,174,88,0.45)] cursor-pointer transition-all shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <span className="text-[11px] font-mono-tab text-[#f7e2b8] w-9 text-right shrink-0">
              {formatReaderTime(readerState.currentTime)}
            </span>

            <div className="relative flex-1 flex items-center h-5">
              {/* Custom styled track background + golden filled progress */}
              <div className="w-full h-1.5 rounded-full bg-[#120803] border border-[#b98241]/35 overflow-hidden pointer-events-none">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#c88636] via-[#ebb760] to-[#ffe19c] transition-[width] duration-100"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={1000}
                step={1}
                value={Math.round(pct * 10)}
                onChange={(e) => {
                  const val = Number(e.target.value) / 1000;
                  textReaderEngine.seekToProgress(val);
                }}
                aria-label="Control de tiempo de lectura"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {/* Visible golden scrubber thumb */}
              <span
                className="pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-gradient-to-b from-[#fff2c9] to-[#d99944] border border-[#5e310c] shadow-[0_1px_5px_rgba(0,0,0,0.75)] transition-[left] duration-100"
                style={{ left: `${pct}%` }}
              />
            </div>

            <span className="text-[11px] font-mono-tab text-[#cfa974] w-9 shrink-0">
              {formatReaderTime(readerState.duration)}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
