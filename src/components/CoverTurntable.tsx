import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Disc3,
  Mic,
  Music,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Square,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import {
  formatAudioTime,
  turntableAudioPlayer,
  type TurntablePlayerSnapshot,
} from '../utils/turntableAudioPlayer';

const DESK_NAT_W = 1376;
const DESK_NAT_H = 768;
// Exact coordinates of the replaced antique button box on desk_turntable_clean.jpg
const TURNTABLE_IMG_CX = 602;
const TURNTABLE_IMG_CY = 577;
const TURNTABLE_IMG_SIZE = 362;

interface CoverTurntableProps {
  stageRef: React.RefObject<HTMLElement | null>;
}

export const CoverTurntable: React.FC<CoverTurntableProps> = ({ stageRef }) => {
  const [snap, setSnap] = useState<TurntablePlayerSnapshot>(() =>
    turntableAudioPlayer.getSnapshot()
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [boxRect, setBoxRect] = useState<{ left: number; top: number; size: number } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const discImgRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef({
    angleDeg: 0,
    angularVel: 0, // deg/sec (33.3 RPM = 200 deg/sec; visual luxury 33 RPM ~ 135 deg/sec for crisp groove legibility)
  });

  // Subscribe to persistent background audio player
  useEffect(() => {
    return turntableAudioPlayer.subscribe(setSnap);
  }, []);

  // Lock turntable position strictly to the object-cover desk background image coordinates
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;

    const updateRect = () => {
      const sw = stageEl.clientWidth;
      const sh = stageEl.clientHeight;
      if (sw <= 0 || sh <= 0) return;

      const imgAspect = DESK_NAT_W / DESK_NAT_H;
      const stageAspect = sw / sh;
      let renderedW = sw;
      let renderedH = sh;
      let offsetX = 0;
      let offsetY = 0;

      if (stageAspect > imgAspect) {
        renderedH = sw / imgAspect;
        offsetY = (sh - renderedH) / 2;
      } else {
        renderedW = sh * imgAspect;
        offsetX = (sw - renderedW) / 2;
      }

      const scaleX = renderedW / DESK_NAT_W;
      const scaleY = renderedH / DESK_NAT_H;
      const size = TURNTABLE_IMG_SIZE * scaleX;
      const cx = offsetX + TURNTABLE_IMG_CX * scaleX;
      const cy = offsetY + TURNTABLE_IMG_CY * scaleY;

      setBoxRect({
        left: cx - size / 2,
        top: cy - size / 2,
        size,
      });
    };

    updateRect();
    const ro = new ResizeObserver(updateRect);
    ro.observe(stageEl);
    window.addEventListener('resize', updateRect);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateRect);
    };
  }, [stageRef]);

  // Smooth physical vinyl motor spin-up & inertial coast-down (360° circular rotation while playing)
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      const targetVel = snap.isPlaying ? 132 : 0; // smooth 33 RPM aesthetic circular rotation
      const inertiaRate = snap.isPlaying ? 4.2 : 2.6;
      spinRef.current.angularVel +=
        (targetVel - spinRef.current.angularVel) * (1 - Math.exp(-dt * inertiaRate));

      if (Math.abs(spinRef.current.angularVel) > 0.15) {
        spinRef.current.angleDeg =
          (spinRef.current.angleDeg + spinRef.current.angularVel * dt) % 360;
        if (discImgRef.current) {
          discImgRef.current.style.transform = `translate(-50%, -50%) rotate(${spinRef.current.angleDeg.toFixed(
            2
          )}deg)`;
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [snap.isPlaying]);

  const currentTrack = snap.tracks.find((t) => t.id === snap.currentTrackId) || null;
  const progressRatio =
    snap.duration > 0 ? Math.max(0, Math.min(1, snap.currentTime / snap.duration)) : 0;
  // Tonearm gracefully tracks inward across the record grooves as the track plays
  const tonearmDeg = snap.isPlaying ? 21 + progressRatio * 11 : 0;

  const handleTurntableClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playStitchClick();
    setSheetOpen((prev) => !prev);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      void turntableAudioPlayer.addAudioFiles(files);
    }
    e.target.value = '';
  };

  return (
    <>
      {/* Hidden Audio File Picker (MP3, WAV, M4A, OGG) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/*,.mp3,.wav,.m4a,.ogg"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Interactive Photorealistic 24k Gold Luxury Turntable Locked to the Wooden Desk */}
      {boxRect && (
        <div
          style={{
            left: `${boxRect.left.toFixed(1)}px`,
            top: `${boxRect.top.toFixed(1)}px`,
            width: `${boxRect.size.toFixed(1)}px`,
            height: `${boxRect.size.toFixed(1)}px`,
          }}
          className="absolute z-[24] select-none"
        >
          <button
            type="button"
            onClick={handleTurntableClick}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Abrir partitura del tocadiscos dorado y notas de voz"
            title={
              snap.isPlaying && currentTrack
                ? `Reproduciendo: ${currentTrack.name} · Clic para abrir la partitura`
                : 'Tocadiscos Dorado · Clic para abrir la partitura, grabar notas de voz o añadir MP3'
            }
            className="group relative w-full h-full cursor-pointer focus:outline-none transition-transform duration-300 hover:scale-[1.022]"
          >
            {/* Subtle luminous golden halo while playing or hovered */}
            <div
              className={`pointer-events-none absolute inset-[4%] rounded-2xl transition-opacity duration-500 ${
                snap.isPlaying
                  ? 'opacity-85 shadow-[0_0_28px_rgba(246,196,86,0.45)]'
                  : 'opacity-0 group-hover:opacity-70 shadow-[0_0_24px_rgba(246,196,86,0.38)]'
              }`}
            />

            {/* Layer 1: Burnished 24k Gold Luxury Turntable Plinth */}
            <img
              src="/tocadiscos/turntable-base.webp"
              alt="Tocadiscos dorado lujoso"
              draggable={false}
              className="pointer-events-none absolute inset-0 w-full h-full object-contain select-none"
            />

            {/* Layer 2: Spinning Obsidian & 24k Gold Classical Vinyl Disc */}
            <div
              ref={discImgRef}
              style={{
                left: '42.8%',
                top: '50.5%',
                width: '67.4%',
                height: '67.4%',
                transform: 'translate(-50%, -50%) rotate(0deg)',
                willChange: 'transform',
              }}
              className="pointer-events-none absolute"
            >
              <img
                src="/tocadiscos/vinyl-disc.webp"
                alt=""
                draggable={false}
                className="w-full h-full object-contain select-none"
              />
            </div>

            {/* Stationary Warm Desk-Lamp Specular Sheen over the Spinning Record */}
            <div
              style={{
                left: '42.8%',
                top: '50.5%',
                width: '64.5%',
                height: '64.5%',
                transform: 'translate(-50%, -50%)',
                background:
                  'conic-gradient(from 28deg, rgba(255,235,176,0.16) 0deg, rgba(255,235,176,0) 48deg, rgba(255,235,176,0) 152deg, rgba(255,235,176,0.14) 196deg, rgba(255,235,176,0) 244deg, rgba(255,235,176,0) 360deg)',
              }}
              className="pointer-events-none absolute rounded-full mix-blend-screen"
            />

            {/* Glowing Ruby Power Jewel Indicator when playing or recording */}
            <span
              style={{ left: '75.2%', top: '84.8%' }}
              className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-[3.6%] h-[3.6%] rounded-full transition-all duration-300 ${
                snap.isRecording
                  ? 'bg-[#ff3b3b] shadow-[0_0_12px_3px_rgba(255,59,59,0.95)] animate-pulse'
                  : snap.isPlaying
                    ? 'bg-[#ff9c42] shadow-[0_0_11px_3px_rgba(255,188,82,0.9)]'
                    : 'bg-[#a42828]/50'
              }`}
            />

            {/* Layer 3: Pivoting Machined 24k Gold S-Shaped Tonearm */}
            <img
              src="/tocadiscos/tonearm.webp"
              alt=""
              draggable={false}
              style={{
                transformOrigin: '83.2% 21.5%',
                transform: `rotate(${tonearmDeg.toFixed(1)}deg)`,
              }}
              className="pointer-events-none absolute inset-0 w-full h-full object-contain select-none transition-transform duration-700 ease-out"
            />

            {/* Subtle floating golden musical notes rising from the spinning turntable */}
            {snap.isPlaying && (
              <div className="pointer-events-none absolute inset-0 overflow-visible">
                <span
                  style={{ animationDuration: '2.6s' }}
                  className="absolute left-[34%] top-[16%] text-base text-[#ffe59c] drop-shadow-[0_0_6px_rgba(255,204,76,0.9)] animate-bounce"
                >
                  ♪
                </span>
                <span
                  style={{ animationDuration: '3.2s', animationDelay: '0.6s' }}
                  className="absolute left-[54%] top-[10%] text-sm text-[#ffd56b] drop-shadow-[0_0_6px_rgba(255,204,76,0.85)] animate-bounce"
                >
                  ♫
                </span>
              </div>
            )}

            {/* Discreet gilded tooltip pill on hover or active playback */}
            <span
              className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-2.5 px-2.5 py-0.5 rounded-full border border-[#e3b96e]/70 bg-[#231208]/92 text-[10px] font-medium tracking-wide text-[#fae7c0] shadow-[0_6px_14px_rgba(0,0,0,0.65)] whitespace-nowrap transition-opacity duration-200 ${
                snap.isPlaying || snap.isRecording
                  ? 'opacity-95'
                  : 'opacity-0 group-hover:opacity-95'
              }`}
            >
              {snap.isRecording
                ? `● Grabando ${formatAudioTime(snap.recordingSec)}`
                : snap.isPlaying && currentTrack
                  ? `♫ ${currentTrack.name.slice(0, 22)}${currentTrack.name.length > 22 ? '…' : ''}`
                  : '𝄞 Partitura y Notas de Voz'}
            </span>
          </button>
        </div>
      )}

      {/* Compact Antique Parchment Sheet Music Popover ("Partitura Pequeña") */}
      <AnimatePresence>
        {sheetOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-3 sm:left-6 bottom-3 sm:bottom-5 z-[48] w-[min(92vw,386px)] max-h-[calc(100%-24px)] flex flex-col rounded-xl border-2 border-[#c89a4e] bg-gradient-to-b from-[#fbf1d6] via-[#f5e6c0] to-[#ebd4a0] text-[#351b0b] shadow-[0_24px_60px_rgba(0,0,0,0.78),0_0_0_1px_rgba(255,235,178,0.65)_inset] overflow-hidden"
          >
            {/* Subtle etched antique 5-line musical staves behind the parchment */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(to bottom, transparent 0px, transparent 22px, #6e451d 22px, #6e451d 23px, transparent 23px, transparent 28px, #6e451d 28px, #6e451d 29px, transparent 29px, transparent 34px, #6e451d 34px, #6e451d 35px, transparent 35px, transparent 40px, #6e451d 40px, #6e451d 41px, transparent 41px, transparent 46px, #6e451d 46px, #6e451d 47px, transparent 47px, transparent 74px)',
              }}
            />

            {/* Header Bar of the Miniature Musical Score */}
            <div className="relative z-10 flex items-center justify-between gap-2 px-3.5 py-2 border-b border-[#b98a42]/50 bg-gradient-to-r from-[#2c1509] via-[#40200e] to-[#2c1509] text-[#f9e5ba]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg leading-none text-[#f4c96b]">𝄞</span>
                <div className="min-w-0">
                  <h3 className="font-display text-xs sm:text-sm tracking-wide text-[#fae8c2] truncate">
                    Partitura del Tocadiscos
                  </h3>
                  <p className="text-[10px] text-[#d9ba84] truncate">
                    Notas de voz y música MP3 en segundo plano
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                title="Cerrar partitura (la música sigue sonando en el fondo)"
                className="p-1 rounded-md text-[#e7c587] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Parchment Body */}
            <div className="relative z-10 flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5">
              {/* Classical Painting Centerpiece: Handsome Classical Men Making Music & Art */}
              <div className="relative rounded-lg overflow-hidden border-2 border-[#b9873b]/80 shadow-[0_6px_18px_rgba(45,22,6,0.38)] bg-[#1f1007]">
                <img
                  src="/tocadiscos/greco-musicos.webp"
                  alt="Pintura clásica estilo El Greco de jóvenes músicos tocando instrumentos y haciendo arte"
                  className="w-full h-[142px] sm:h-[156px] object-cover object-[50%_28%] select-none"
                  draggable={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1b0d05]/85 via-transparent to-[#1b0d05]/20" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 px-2.5 py-1.5 flex items-end justify-between gap-2">
                  <div>
                    <p className="font-serif italic text-[11px] leading-tight text-[#fce9be] drop-shadow">
                      Armonía y Arte Clásico
                    </p>
                    <p className="text-[9px] text-[#dfb97a]/90 tracking-wide">
                      Óleo clásico · Músicos y partituras del taller
                    </p>
                  </div>
                  {snap.isPlaying && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#241106]/85 border border-[#e7b863]/70 text-[9px] font-semibold text-[#ffe39a]">
                      <Disc3 className="w-3 h-3 animate-spin" />
                      Girando
                    </span>
                  )}
                </div>
              </div>

              {/* Primary Actions: Grabar nota de voz & Añadir MP3 */}
              <div className="grid grid-cols-2 gap-2">
                {snap.isRecording ? (
                  <button
                    type="button"
                    onClick={() => turntableAudioPlayer.stopVoiceRecording()}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-[#b72828] bg-gradient-to-b from-[#9c1d22] to-[#721216] text-[#fff2e6] text-xs font-semibold shadow-sm cursor-pointer animate-pulse"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Detener ({formatAudioTime(snap.recordingSec)})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void turntableAudioPlayer.startVoiceRecording()}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-[#9d6d2b] bg-gradient-to-b from-[#7a232a] to-[#58161b] hover:from-[#8d2931] hover:to-[#691a20] text-[#fff2d9] text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#f7ce7c]" />
                    <span>Grabar nota de voz</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg border border-[#a97831] bg-gradient-to-b from-[#5e3315] to-[#3f200c] hover:from-[#703d1a] hover:to-[#4f2810] text-[#fce8c2] text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#f4c66a]" />
                  <span>Añadir MP3</span>
                </button>
              </div>

              {snap.statusMessage && (
                <p className="text-[11px] font-medium text-[#6b3410] bg-[#f8e6b8]/90 border border-[#c79849]/60 rounded-md px-2.5 py-1 text-center">
                  {snap.statusMessage}
                </p>
              )}

              {/* Active Background Playback Deck */}
              {currentTrack && (
                <div className="rounded-lg border border-[#ba8a3f]/75 bg-[#2d170b]/95 text-[#f9e5be] px-3 py-2.5 shadow-inner space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#e3b868]/65 bg-[#4a2612] shrink-0 ${
                          snap.isPlaying ? 'animate-spin' : ''
                        }`}
                        style={{ animationDuration: '3.2s' }}
                      >
                        <Disc3 className="w-3.5 h-3.5 text-[#f7ce78]" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#fff1d0] truncate">
                          {currentTrack.name}
                        </p>
                        <p className="text-[10px] text-[#d5b37c]">
                          {currentTrack.kind === 'voice' ? 'Nota de voz' : 'Archivo MP3'} · Suena en el fondo
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => turntableAudioPlayer.toggleLoop()}
                      title={snap.isLooping ? 'Repetición activa' : 'Activar repetición'}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        snap.isLooping
                          ? 'text-[#ffd873] bg-[#ffd873]/15'
                          : 'text-[#b59362] hover:text-[#f5ddb0]'
                      }`}
                    >
                      <Repeat className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Interactive Musical Seek Bar */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#dfc08d]">
                    <span className="w-8 text-right">{formatAudioTime(snap.currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(1, snap.duration)}
                      step={0.1}
                      value={Math.min(snap.currentTime, Math.max(1, snap.duration))}
                      onChange={(e) => turntableAudioPlayer.seek(Number(e.target.value))}
                      aria-label="Progreso de reproducción"
                      className="flex-1 h-1.5 accent-[#eab95d] cursor-pointer"
                    />
                    <span className="w-8">{formatAudioTime(snap.duration)}</span>
                  </div>

                  {/* Transport & Volume Controls */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => turntableAudioPlayer.prevTrack()}
                        disabled={snap.tracks.length < 2}
                        title="Anterior"
                        className="p-1.5 rounded-full text-[#e8ca94] hover:bg-white/10 disabled:opacity-35 cursor-pointer"
                      >
                        <SkipBack className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => turntableAudioPlayer.togglePlayPause()}
                        title={snap.isPlaying ? 'Pausar' : 'Reproducir en el fondo'}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#f5d083] bg-gradient-to-b from-[#d89f3f] to-[#9b6719] hover:from-[#e6ae4c] hover:to-[#ad731d] text-[#221005] shadow cursor-pointer"
                      >
                        {snap.isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current translate-x-[1px]" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => turntableAudioPlayer.nextTrack()}
                        disabled={snap.tracks.length < 2}
                        title="Siguiente"
                        className="p-1.5 rounded-full text-[#e8ca94] hover:bg-white/10 disabled:opacity-35 cursor-pointer"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 w-24">
                      <Volume2 className="w-3.5 h-3.5 text-[#dfb56b] shrink-0" />
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={snap.volume}
                        onChange={(e) => turntableAudioPlayer.setVolume(Number(e.target.value))}
                        aria-label="Volumen del tocadiscos"
                        className="w-full h-1 accent-[#eab95d] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sheet Music Tracklist (Voice Notes & MP3s) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6f441a]">
                    ♩ Notas y Pistas ({snap.tracks.length})
                  </span>
                  <span className="text-[10px] italic text-[#7a4f23]">
                    Reproducción continua en fondo
                  </span>
                </div>

                {snap.tracks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#b68842]/70 bg-[#fff8e4]/65 px-3 py-3 text-center">
                    <p className="font-serif italic text-xs text-[#5d3614]">
                      Tu partitura está lista para guardar tus notas de voz o canciones MP3 favoritas.
                    </p>
                    <p className="mt-1 text-[10px] text-[#7c5227]">
                      Al reproducir, el disco dorado girará y la música seguirá sonando en el fondo.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1 max-h-[150px] overflow-y-auto pr-0.5">
                    {snap.tracks.map((track) => {
                      const isActive = track.id === snap.currentTrackId;
                      const isTrackPlaying = isActive && snap.isPlaying;
                      return (
                        <li
                          key={track.id}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border transition-colors ${
                            isActive
                              ? 'border-[#b9822c] bg-[#f4d898]/90 shadow-xs'
                              : 'border-[#cca566]/55 bg-[#fff8e5]/75 hover:bg-[#faeac2]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (isTrackPlaying) {
                                turntableAudioPlayer.pause();
                              } else {
                                void turntableAudioPlayer.playTrack(track.id);
                              }
                            }}
                            className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${
                                isTrackPlaying
                                  ? 'bg-[#7b1f27] text-[#ffe5a3]'
                                  : 'bg-[#4b2811]/12 text-[#5c3012]'
                              }`}
                            >
                              {isTrackPlaying ? (
                                <Pause className="w-3 h-3 fill-current" />
                              ) : track.kind === 'voice' ? (
                                <Mic className="w-3 h-3" />
                              ) : (
                                <Music className="w-3 h-3" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#331808] truncate">
                                {track.name}
                              </p>
                              <p className="text-[10px] text-[#784b20]">
                                {track.kind === 'voice' ? 'Nota de voz' : 'MP3'}
                                {track.durationSec > 0
                                  ? ` · ${formatAudioTime(track.durationSec)}`
                                  : ''}
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => void turntableAudioPlayer.deleteTrack(track.id)}
                            title="Eliminar pista"
                            className="p-1 rounded text-[#8a3525]/75 hover:text-[#8a1c1c] hover:bg-[#8a1c1c]/10 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * Discreet floating mini-player badge shown inside the open studio ONLY when a
 * turntable MP3 or voice note is actively playing in the background.
 */
export const BackgroundTurntablePill: React.FC = () => {
  const [snap, setSnap] = useState<TurntablePlayerSnapshot>(() =>
    turntableAudioPlayer.getSnapshot()
  );

  useEffect(() => {
    return turntableAudioPlayer.subscribe(setSnap);
  }, []);

  const currentTrack = snap.tracks.find((t) => t.id === snap.currentTrackId);
  if (!snap.isPlaying || !currentTrack) return null;

  return (
    <div className="fixed left-3 bottom-3 z-[45] flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-[#dfa956]/75 bg-[#241208]/92 text-[#fae7c0] shadow-[0_10px_28px_rgba(0,0,0,0.65)] backdrop-blur-xs">
      <Disc3
        className="w-4 h-4 text-[#f5c869] animate-spin shrink-0"
        style={{ animationDuration: '2.8s' }}
      />
      <span className="text-[11px] font-medium max-w-[148px] truncate">
        {currentTrack.name}
      </span>
      <button
        type="button"
        onClick={() => turntableAudioPlayer.togglePlayPause()}
        title="Pausar reproducción de fondo"
        className="p-1 rounded-full bg-[#e3b155]/20 hover:bg-[#e3b155]/35 text-[#ffe4a0] transition-colors cursor-pointer"
      >
        <Pause className="w-3 h-3 fill-current" />
      </button>
    </div>
  );
};
