import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Check,
  Edit3,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import crochetArtistDeskImg from '../assets/images/desk_turntable_clean.jpg';
import type { DeskNoteItem } from '../types/crochet';
import { audioEngine } from '../utils/audioEngine';
import { fairyMusicPlayer } from '../utils/fairyMusicPlayer';
import { PWAInstallButton } from './WindowsDesktopControls';
import { ButterflyWingsIcon, CoverMagicFairy } from './CoverMagicFairy';
import { CoverTurntable } from './CoverTurntable';

interface CoverScreenProps {
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  deskNotes: DeskNoteItem[];
  onChangeDeskNotes: (notes: DeskNoteItem[]) => void;
  onOpenBook: () => void;
}

const NOTE_TONE_STYLES: Record<
  DeskNoteItem['tone'],
  { bg: string; border: string; ink: string; tape: string }
> = {
  cream: {
    bg: 'linear-gradient(145deg, #fffaf0 0%, #f8ebd0 58%, #eedab4 100%)',
    border: 'border-[#c89f5c]',
    ink: 'text-[#3a1d0c]',
    tape: 'bg-[#e6c588]/85 border-[#b1853e]/65',
  },
  ochre: {
    bg: 'linear-gradient(145deg, #fff6df 0%, #f6dfaa 58%, #e9c983 100%)',
    border: 'border-[#be8c3b]',
    ink: 'text-[#391b09]',
    tape: 'bg-[#d9b06a]/85 border-[#9c6f2c]/65',
  },
  sage: {
    bg: 'linear-gradient(145deg, #f5f9ef 0%, #e4eed8 58%, #d1dfc0 100%)',
    border: 'border-[#8fa576]',
    ink: 'text-[#23331a]',
    tape: 'bg-[#c4d5ae]/85 border-[#768c5e]/65',
  },
  rose: {
    bg: 'linear-gradient(145deg, #fff5f6 0%, #f8dfe2 58%, #ecc6cb 100%)',
    border: 'border-[#c6888e]',
    ink: 'text-[#481820]',
    tape: 'bg-[#e4b3b8]/85 border-[#a86a70]/65',
  },
  linen: {
    bg: 'linear-gradient(145deg, #fbf6ec 0%, #efe3cc 58%, #e2cfb0 100%)',
    border: 'border-[#bd9f71]',
    ink: 'text-[#382010]',
    tape: 'bg-[#d8c098]/85 border-[#987849]/65',
  },
};

export const CoverScreen: React.FC<CoverScreenProps> = ({
  sfxEnabled,
  onToggleSfx,
  deskNotes,
  onChangeDeskNotes,
  onOpenBook,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [magicActive, setMagicActive] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const dragStartX = useRef<number | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  const notesZoneRef = useRef<HTMLDivElement>(null);
  const suppressEditClickRef = useRef(false);
  const draggingNoteRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    noteWidth: number;
    noteHeight: number;
    moved: boolean;
  } | null>(null);

  const triggerOpen = () => {
    if (isOpening || editingNoteId) return;
    setIsOpening(true);
    onOpenBook();
  };

  const handleBookPointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
  };

  const beginNoteDrag = (
    e: React.PointerEvent,
    note: DeskNoteItem,
    cardEl: HTMLElement | null
  ) => {
    if (editingNoteId === note.id) return;
    e.stopPropagation();
    const cardRect = cardEl?.getBoundingClientRect();
    suppressEditClickRef.current = false;
    draggingNoteRef.current = {
      id: note.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: note.x,
      origY: note.y,
      noteWidth: cardRect?.width ?? 172,
      noteHeight: cardRect?.height ?? 96,
      moved: false,
    };
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (draggingNoteRef.current && notesZoneRef.current) {
      const drag = draggingNoteRef.current;
      const dxPx = e.clientX - drag.startX;
      const dyPx = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dxPx, dyPx) > 4) {
        drag.moved = true;
        suppressEditClickRef.current = true;
        setDraggingNoteId(drag.id);
      }
      if (!drag.moved) return;

      const zoneRect = notesZoneRef.current.getBoundingClientRect();
      const dxPct = (dxPx / Math.max(1, zoneRect.width)) * 100;
      const dyPct = (dyPx / Math.max(1, zoneRect.height)) * 100;

      const padXPct = (6 / Math.max(1, zoneRect.width)) * 100;
      const padTopPct = (12 / Math.max(1, zoneRect.height)) * 100;
      const padBotPct = (8 / Math.max(1, zoneRect.height)) * 100;
      const noteWPct = (drag.noteWidth / Math.max(1, zoneRect.width)) * 100;
      const noteHPct = (drag.noteHeight / Math.max(1, zoneRect.height)) * 100;

      const maxX = Math.max(padXPct, 100 - noteWPct - padXPct);
      const maxY = Math.max(padTopPct, 100 - noteHPct - padBotPct);

      const nextX = Math.max(padXPct, Math.min(maxX, drag.origX + dxPct));
      const nextY = Math.max(padTopPct, Math.min(maxY, drag.origY + dyPct));
      const targetId = drag.id;

      onChangeDeskNotes(
        deskNotes.map((n) => (n.id === targetId ? { ...n, x: nextX, y: nextY } : n))
      );
      return;
    }

    if (dragStartX.current === null || isOpening) return;
    const deltaX = dragStartX.current - e.clientX;
    if (deltaX > 0) {
      const progress = Math.min(1, deltaX / 180);
      setDragProgress(progress);
      if (progress >= 0.72) {
        dragStartX.current = null;
        triggerOpen();
      }
    }
  };

  const handleStagePointerUp = () => {
    dragStartX.current = null;
    if (draggingNoteRef.current) {
      const wasMoved = draggingNoteRef.current.moved;
      draggingNoteRef.current = null;
      setDraggingNoteId(null);
      if (wasMoved) {
        window.setTimeout(() => {
          suppressEditClickRef.current = false;
        }, 0);
      }
    }
    if (!isOpening) {
      setDragProgress(0);
    }
  };

  const startEditingNote = (note: DeskNoteItem) => {
    if (suppressEditClickRef.current) return;
    audioEngine.playStitchClick();
    setEditingNoteId(note.id);
    setDraftText(note.text);
  };

  const saveEditingNote = (noteId: string) => {
    const trimmed = draftText.trim();
    if (trimmed) {
      audioEngine.playSaveChime();
      onChangeDeskNotes(
        deskNotes.map((n) => (n.id === noteId ? { ...n, text: trimmed } : n))
      );
    }
    setEditingNoteId(null);
  };

  const handleAddDeskNote = () => {
    audioEngine.playRetroPop(2);
    const tones: DeskNoteItem['tone'][] = ['cream', 'ochre', 'sage', 'rose', 'linen'];
    const newId = `desk-note-${Date.now()}`;
    const randomX = 4 + ((deskNotes.length * 19) % 62);
    const randomY = 8 + ((deskNotes.length * 17) % 68);
    const randomRot = ((deskNotes.length % 5) - 2) * 3;
    const newNote: DeskNoteItem = {
      id: newId,
      text: 'Escribe aquí tu frase motivadora...',
      x: randomX,
      y: randomY,
      rotation: randomRot,
      tone: tones[deskNotes.length % tones.length],
    };
    onChangeDeskNotes([...deskNotes, newNote]);
    setEditingNoteId(newId);
    setDraftText(newNote.text);
  };

  const handleDeleteDeskNote = (id: string) => {
    audioEngine.playEraseBrush();
    if (editingNoteId === id) setEditingNoteId(null);
    onChangeDeskNotes(deskNotes.filter((n) => n.id !== id));
  };

  const coverRotateY = isOpening ? -160 : -dragProgress * 55;

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#1a0f08] flex flex-col"
      onPointerMove={handleStagePointerMove}
      onPointerUp={handleStagePointerUp}
      onPointerCancel={handleStagePointerUp}
    >
      {/* Top Studio Bar on Cover (safe-area aware for Galaxy Note 9 & mobile screens) */}
      <header className="relative z-20 w-full shrink-0 flex items-center justify-between gap-2 px-2.5 sm:px-4 py-2 safe-top leather-surface border-b border-[#d6a25e]/35">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7c2029] border border-[#e3b978]/60 shadow shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-[#f7e2b9]" />
          </span>
          <span className="font-display text-xs sm:text-base tracking-wide text-[#f6e2be] truncate">
            Cuaderno del Artista
            <span className="hidden sm:inline"> · Estudio de Crochet</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PWAInstallButton variant="header" />

          <button
            type="button"
            onClick={() => {
              const next = !magicActive;
              setMagicActive(next);
              audioEngine.playMagicChime(next);
              // Start/stop uploaded MP3 directly inside the click gesture for guaranteed playback
              if (next) {
                fairyMusicPlayer.start(!sfxEnabled);
              } else {
                fairyMusicPlayer.stop();
              }
            }}
            aria-pressed={magicActive}
            title={
              magicActive
                ? 'Detener vuelo mágico y música'
                : 'Activar vuelo mágico y música del arpa'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
              magicActive
                ? 'border-[#8dffb0]/85 bg-gradient-to-b from-[#236b3c] to-[#134224] text-[#eaffef] shadow-[0_0_16px_rgba(92,240,140,0.45)]'
                : 'border-[#7ec991]/55 bg-[#1b3622]/90 hover:bg-[#244a2e] text-[#d6f7df]'
            }`}
          >
            <ButterflyWingsIcon
              className={`w-4 h-4 ${magicActive ? 'text-[#a2ffbf]' : 'text-[#84e39e]'}`}
            />
            <span>MAGIA</span>
          </button>

          <button
            type="button"
            onClick={handleAddDeskNote}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d6a25e]/45 bg-[#2d180c]/90 hover:bg-[#412312] text-xs font-medium text-[#f4dfb9] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-[#eab86a]" />
            <span>Nueva Nota</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!sfxEnabled) {
                window.setTimeout(() => audioEngine.playToggleChime(true), 20);
              }
              onToggleSfx();
            }}
            title={
              sfxEnabled
                ? 'Efectos de sonido para botones activos'
                : 'Efectos de sonido silenciados'
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d6a25e]/45 bg-[#2d180c]/90 hover:bg-[#412312] text-xs font-medium text-[#f4dfb9] transition-colors cursor-pointer whitespace-nowrap"
          >
            {sfxEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#eab86a]" />
                <span className="hidden sm:inline">Sonidos: Activos</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#b8976c]" />
                <span className="hidden sm:inline">Sonidos: Silencio</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Cover Stage: Crochet Artist Workshop Desk + Unchanged Leather Book */}
      <main
        ref={stageRef}
        className="relative z-10 flex-1 min-h-0 w-full overflow-hidden book-stage"
      >
        {/* Crochet Artist Desk Background Photo — centered on leather book in phone portrait, full desk on landscape/desktop */}
        <img
          src={crochetArtistDeskImg}
          alt="Escritorio de artista del crochet con ovillos, agujas, tijeras, tocadiscos dorado lujoso y cuaderno de cuero"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-[78%_50%] md:object-center select-none"
          draggable={false}
        />

        {/* Luxury 24k Gold Interactive Turntable + Classical Sheet Music Voice-Notes & MP3 Player */}
        <CoverTurntable stageRef={stageRef} />

        {/* Living Atelier Atmosphere: Warm Brass Lamp Radiance, Volumetric Sunbeams & Drifting Golden Dust */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 42% 38% at 28% 4%, rgba(255, 224, 148, 0.28) 0%, rgba(255, 198, 98, 0.09) 48%, rgba(0, 0, 0, 0) 78%)',
          }}
        />
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.32, 0.56, 0.32] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-[8%] left-[12%] w-[46%] h-[58%] rounded-full blur-3xl mix-blend-screen"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 218, 132, 0.34) 0%, rgba(244, 178, 72, 0.12) 48%, rgba(0, 0, 0, 0) 76%)',
          }}
        />
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.14, 0.28, 0.14], x: ['-2%', '2%', '-2%'] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{
            background:
              'linear-gradient(122deg, rgba(255, 232, 168, 0.16) 0%, rgba(255, 220, 140, 0.04) 26%, transparent 45%, rgba(255, 226, 152, 0.11) 64%, transparent 82%)',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#160b05]/45 via-transparent to-[#160b05]/14" />
        {[
          { left: '14%', top: '22%', size: 'w-2 h-2', delay: '0s' },
          { left: '26%', top: '44%', size: 'w-1.5 h-1.5', delay: '1.1s' },
          { left: '34%', top: '62%', size: 'w-2.5 h-2.5', delay: '1.8s' },
          { left: '46%', top: '28%', size: 'w-1.5 h-1.5', delay: '3.1s' },
          { left: '53%', top: '50%', size: 'w-2 h-2', delay: '2.5s' },
          { left: '66%', top: '18%', size: 'w-2 h-2', delay: '0.6s' },
          { left: '74%', top: '36%', size: 'w-1.5 h-1.5', delay: '2.2s' },
          { left: '84%', top: '64%', size: 'w-2.5 h-2.5', delay: '0.9s' },
          { left: '91%', top: '26%', size: 'w-1.5 h-1.5', delay: '3.7s' },
        ].map((mote, i) => (
          <span
            key={i}
            style={{ left: mote.left, top: mote.top, animationDelay: mote.delay }}
            className={`pointer-events-none absolute ${mote.size} rounded-full bg-[#ffebb5]/80 shadow-[0_0_8px_rgba(255,220,126,0.75)] blur-[0.6px] animate-mote`}
          />
        ))}

        {/* Free-Drag Editable Motivational Notes across the Left Desk Area (desktop/landscape) */}
        <div
          ref={notesZoneRef}
          className="hidden md:block absolute inset-y-0 left-0 w-[56.5%] z-20 pointer-events-none"
        >
          {deskNotes.map((note) => {
            const style = NOTE_TONE_STYLES[note.tone] || NOTE_TONE_STYLES.cream;
            const isEditing = editingNoteId === note.id;
            const isDragging = draggingNoteId === note.id;

            return (
              <div
                key={note.id}
                style={{
                  left: `${note.x}%`,
                  top: `${note.y}%`,
                  background: style.bg,
                  colorScheme: 'light',
                  boxShadow: isDragging
                    ? '0 18px 34px rgba(10,4,1,0.72), inset 0 1px 0 rgba(255,255,255,0.65)'
                    : '0 10px 22px rgba(12,5,2,0.58), inset 0 1px 0 rgba(255,255,255,0.6)',
                  transform: isEditing
                    ? 'rotate(0deg) scale(1.06)'
                    : isDragging
                      ? `rotate(${note.rotation * 0.5}deg) scale(1.04)`
                      : `rotate(${note.rotation}deg)`,
                }}
                onPointerDown={(e) => {
                  beginNoteDrag(e, note, e.currentTarget);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={`pointer-events-auto absolute w-[148px] sm:w-[178px] rounded-md border px-2.5 pt-3 pb-2 select-none touch-none ${
                  isDragging
                    ? 'z-40 cursor-grabbing ring-1 ring-[#f3c66f]/85'
                    : isEditing
                      ? 'z-40 ring-2 ring-[#f3c66f] transition-transform duration-150'
                      : 'z-20 cursor-grab hover:z-30 hover:scale-[1.03] transition-transform duration-150'
                } ${style.border}`}
              >
                {/* Craft paper masking-tape / visual drag handle */}
                <div
                  title="Arrastra para mover la nota libremente por el escritorio"
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3.5 rounded-xs border cursor-grab active:cursor-grabbing ${style.tape}`}
                />

                {isEditing ? (
                  <div className="space-y-1.5" onPointerDown={(e) => e.stopPropagation()}>
                    <textarea
                      autoFocus
                      rows={3}
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setEditingNoteId(null);
                        } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          saveEditingNote(note.id);
                        }
                      }}
                      className={`w-full resize-none rounded bg-white/60 border border-[#b98d4b]/45 px-1.5 py-1 font-hand text-sm sm:text-base leading-snug focus:outline-none focus:border-[#7a202a] ${style.ink}`}
                    />
                    <div className="flex items-center justify-between gap-1">
                      {deskNotes.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteDeskNote(note.id)}
                          title="Eliminar nota"
                          className="p-1 rounded text-[#7a202a] hover:bg-[#7a202a]/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => saveEditingNote(note.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#6b3a1c] hover:bg-[#824722] text-[11px] font-medium text-[#fff6e3] cursor-pointer shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Guardar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditingNote(note)}
                    title="Arrastra para mover o haz clic para editar esta nota"
                    className={`group w-full text-left focus:outline-none ${
                      isDragging ? 'cursor-grabbing' : 'cursor-grab'
                    } ${style.ink}`}
                  >
                    <p className="font-hand text-sm sm:text-[15px] leading-snug break-words">
                      “{note.text}”
                    </p>
                    <span className="mt-1 flex items-center justify-end gap-1 text-[9px] font-sans uppercase tracking-wider opacity-0 group-hover:opacity-75 transition-opacity">
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Editar</span>
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile / Galaxy Note 9 Portrait Swipeable Notes Strip + Tap-to-Open Book CTA */}
        <div className="md:hidden absolute inset-x-0 top-2.5 z-30 px-2.5 flex gap-2 overflow-x-auto no-scrollbar">
          {deskNotes.map((note) => {
            const style = NOTE_TONE_STYLES[note.tone] || NOTE_TONE_STYLES.cream;
            const isEditing = editingNoteId === note.id;
            return (
              <div
                key={`mob-${note.id}`}
                style={{ background: style.bg, colorScheme: 'light' }}
                onClick={(e) => e.stopPropagation()}
                className={`shrink-0 w-[168px] rounded-lg border px-2.5 py-2 shadow-lg ${style.border} ${style.ink}`}
              >
                {isEditing ? (
                  <div className="space-y-1">
                    <textarea
                      autoFocus
                      rows={2}
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      className="w-full resize-none rounded bg-white/75 border border-[#b98d4b]/50 px-1.5 py-1 font-hand text-sm leading-tight"
                    />
                    <div className="flex items-center justify-between">
                      {deskNotes.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteDeskNote(note.id)}
                          className="p-1 text-[#7a202a]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => saveEditingNote(note.id)}
                        className="px-2 py-0.5 rounded bg-[#6b3a1c] text-[10px] font-semibold text-[#fff6e3]"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditingNote(note)}
                    className="w-full text-left"
                  >
                    <p className="font-hand text-xs leading-snug line-clamp-3">“{note.text}”</p>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile / Note 9 Prominent Tap-to-Open Book Pill in bottom-right beside the Gold Turntable */}
        <button
          type="button"
          onClick={triggerOpen}
          className="md:hidden absolute right-4 bottom-6 z-30 inline-flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-[#f5d07a] bg-gradient-to-b from-[#7a3f16]/95 to-[#3d1c08]/95 text-[#fff4d6] font-display text-xs font-bold tracking-wider shadow-[0_12px_28px_rgba(0,0,0,0.75)] active:scale-95 transition-transform"
        >
          <BookOpen className="w-4 h-4 text-[#ffd978]" />
          <span>ABRIR CUADERNO</span>
        </button>

        {/* Interactive 3D Book Flap Overlay aligned over the leather book */}
        <motion.div
          animate={{ rotateY: coverRotateY }}
          transition={{ duration: isOpening ? 0.95 : 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left center' }}
          onPointerDown={handleBookPointerDown}
          onClick={triggerOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerOpen();
            }
          }}
          aria-label="Abrir Cuaderno del Artista"
          className="absolute right-[6%] left-[12%] md:left-auto md:right-[8%] top-[16%] bottom-[22%] md:top-[4%] md:bottom-[4%] md:w-[36%] z-20 md:z-30 cursor-pointer preserve-3d group focus:outline-none rounded-r-xl"
        >
          {/* Circular Crochet_Fuentes-Nazco Logo Medallion below the yarn ball */}
          <div className="pointer-events-none absolute left-[54%] -translate-x-1/2 bottom-[11%] w-[44%] aspect-square flex items-center justify-center">
            <div className="relative w-full h-full rounded-full overflow-hidden border-[2.5px] border-[#d9a75c]/80 ring-2 ring-[#2a1408]/80 shadow-[0_10px_26px_rgba(0,0,0,0.75),inset_0_0_10px_rgba(0,0,0,0.45)] group-hover:scale-[1.03] group-hover:border-[#f5d598] transition-all duration-300">
              <img
                src="/assets/aistudio/Crochet_Fuentes-Nazco_logo_62cf79df.jpg"
                alt="Logo Crochet Fuentes-Nazco"
                referrerPolicy="no-referrer"
                draggable={false}
                className="w-full h-full object-cover scale-[1.13] select-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Male Forest Fairy on the Cover Screen */}
        <CoverMagicFairy isFlying={magicActive} sfxEnabled={sfxEnabled} />
      </main>
    </div>
  );
};
