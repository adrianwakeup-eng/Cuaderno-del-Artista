import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Check, Edit3, Plus, Trash2, Volume2, VolumeX } from 'lucide-react';
import crochetArtistDeskImg from '../assets/images/crochet_artist_desk_1795001462818.jpg';
import type { DeskNoteItem } from '../types/crochet';
import { audioEngine } from '../utils/audioEngine';
import { PWAInstallButton } from './WindowsDesktopControls';

interface CoverScreenProps {
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  deskNotes: DeskNoteItem[];
  onChangeDeskNotes: (notes: DeskNoteItem[]) => void;
  onOpenBook: () => void;
}

const NOTE_TONE_STYLES: Record<
  DeskNoteItem['tone'],
  { paper: string; border: string; ink: string; tape: string }
> = {
  cream: {
    paper: 'bg-[#fbf1d8] shadow-[0_8px_18px_rgba(0,0,0,0.52)]',
    border: 'border-[#d6b67c]/85',
    ink: 'text-[#3e200e]',
    tape: 'bg-[#e7c98f]/80 border-[#b9914e]/60',
  },
  ochre: {
    paper: 'bg-[#f5dfa9] shadow-[0_8px_18px_rgba(0,0,0,0.52)]',
    border: 'border-[#c89645]/85',
    ink: 'text-[#3b1d0a]',
    tape: 'bg-[#d9b26f]/80 border-[#9f7432]/60',
  },
  sage: {
    paper: 'bg-[#e4ecd8] shadow-[0_8px_18px_rgba(0,0,0,0.52)]',
    border: 'border-[#9fb387]/85',
    ink: 'text-[#28361f]',
    tape: 'bg-[#c5d4b0]/80 border-[#7d9266]/60',
  },
  rose: {
    paper: 'bg-[#f6dfe0] shadow-[0_8px_18px_rgba(0,0,0,0.52)]',
    border: 'border-[#cf979c]/85',
    ink: 'text-[#491b22]',
    tape: 'bg-[#e5b8bc]/80 border-[#ac7176]/60',
  },
  linen: {
    paper: 'bg-[#efe4cf] shadow-[0_8px_18px_rgba(0,0,0,0.52)]',
    border: 'border-[#c6aa7f]/85',
    ink: 'text-[#3a2211]',
    tape: 'bg-[#d7c09b]/80 border-[#9b7c4e]/60',
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
  const [dragProgress, setDragProgress] = useState(0);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const dragStartX = useRef<number | null>(null);
  const stageRef = useRef<HTMLElement>(null);
  const draggingNoteRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
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

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (draggingNoteRef.current && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const dxPct = ((e.clientX - draggingNoteRef.current.startX) / rect.width) * 100;
      const dyPct = ((e.clientY - draggingNoteRef.current.startY) / rect.height) * 100;
      if (Math.abs(dxPct) > 0.6 || Math.abs(dyPct) > 0.6) {
        draggingNoteRef.current.moved = true;
      }
      const nextX = Math.max(2, Math.min(43, draggingNoteRef.current.origX + dxPct));
      const nextY = Math.max(5, Math.min(82, draggingNoteRef.current.origY + dyPct));
      const targetId = draggingNoteRef.current.id;
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
      draggingNoteRef.current = null;
    }
    if (!isOpening) {
      setDragProgress(0);
    }
  };

  const startEditingNote = (note: DeskNoteItem) => {
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
    const randomX = 6 + ((deskNotes.length * 11) % 33);
    const randomY = 14 + ((deskNotes.length * 19) % 62);
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
      className="relative min-h-screen w-full overflow-hidden bg-[#1a0f08] flex flex-col items-center justify-center p-3 sm:p-5"
      onPointerMove={handleStagePointerMove}
      onPointerUp={handleStagePointerUp}
      onPointerCancel={handleStagePointerUp}
    >
      {/* Ambient background wood & leather glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 65% 50%, rgba(196, 128, 62, 0.38), transparent 55%), radial-gradient(circle at 30% 50%, rgba(145, 48, 56, 0.25), transparent 50%)',
        }}
      />

      {/* Top Desktop Studio Bar on Cover (only SFX & note creation, zero music) */}
      <header className="relative z-20 w-full max-w-[1320px] flex items-center justify-between gap-3 px-4 py-2 mb-1.5 rounded-t-xl leather-surface border border-[#d6a25e]/35">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#7c2029] border border-[#e3b978]/60 shadow shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-[#f7e2b9]" />
          </span>
          <span className="font-display text-sm sm:text-base tracking-wide text-[#f6e2be] truncate">
            Cuaderno del Artista · Estudio de Crochet
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton variant="header" />

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
        className="relative z-10 w-full max-w-[1320px] aspect-[16/9] max-h-[84vh] rounded-b-xl overflow-hidden border border-t-0 border-[#d6a25e]/40 shadow-[0_30px_70px_rgba(0,0,0,0.75)] book-stage"
      >
        {/* Crochet Artist Desk Background Photo */}
        <img
          src={crochetArtistDeskImg}
          alt="Escritorio de artista del crochet con ovillos, agujas, tijeras y cuaderno de cuero"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none"
          draggable={false}
        />

        {/* Subtle warm vignette & floating golden yarn dust motes */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#160b05]/45 via-transparent to-[#160b05]/15" />
        {[
          { left: '18%', top: '26%', delay: '0s' },
          { left: '34%', top: '62%', delay: '1.6s' },
          { left: '48%', top: '34%', delay: '3.1s' },
          { left: '72%', top: '22%', delay: '2.2s' },
          { left: '84%', top: '68%', delay: '0.8s' },
        ].map((mote, i) => (
          <span
            key={i}
            style={{ left: mote.left, top: mote.top, animationDelay: mote.delay }}
            className="pointer-events-none absolute w-2 h-2 rounded-full bg-[#ffe3aa]/70 blur-[1px] animate-mote"
          />
        ))}

        {/* Small Scattered Editable Motivational Notes on the Left Desk */}
        <div className="absolute inset-y-0 left-0 w-[53%] z-20 pointer-events-none">
          {deskNotes.map((note) => {
            const style = NOTE_TONE_STYLES[note.tone] || NOTE_TONE_STYLES.cream;
            const isEditing = editingNoteId === note.id;

            return (
              <div
                key={note.id}
                style={{
                  left: `${note.x}%`,
                  top: `${note.y}%`,
                  transform: isEditing ? 'rotate(0deg) scale(1.06)' : `rotate(${note.rotation}deg)`,
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={`pointer-events-auto absolute w-[142px] sm:w-[172px] rounded-md border px-2.5 pt-3 pb-2 transition-transform duration-150 ${
                  isEditing ? 'z-40 ring-2 ring-[#f3c66f]' : 'z-20 hover:z-30 hover:scale-[1.03]'
                } ${style.paper} ${style.border}`}
              >
                {/* Craft paper masking-tape / drag handle */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    draggingNoteRef.current = {
                      id: note.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      origX: note.x,
                      origY: note.y,
                      moved: false,
                    };
                  }}
                  title="Arrastra para mover la nota por el escritorio"
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3.5 rounded-xs border cursor-grab active:cursor-grabbing ${style.tape}`}
                />

                {isEditing ? (
                  <div className="space-y-1.5">
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
                    title="Clic para editar y reescribir esta nota"
                    className={`group w-full text-left cursor-text focus:outline-none ${style.ink}`}
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

        {/* Interactive 3D Book Flap Overlay aligned over the right-hand leather book (book left completely unchanged) */}
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
          className="absolute right-[8%] top-[4%] bottom-[4%] w-[36%] z-30 cursor-pointer preserve-3d group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f2cd86] rounded-r-xl"
        >
          {/* Subtle shimmer outline around the embossed book cover */}
          <div className="absolute inset-0 rounded-r-xl border border-[#f5d493]/0 group-hover:border-[#f5d493]/55 group-hover:shadow-[0_0_38px_rgba(245,205,130,0.32)] transition-all duration-300" />

          {/* Animated crochet thread highlight on hover */}
          <svg
            viewBox="0 0 220 340"
            className="pointer-events-none absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            fill="none"
          >
            <rect
              x="8"
              y="8"
              width="204"
              height="324"
              rx="10"
              stroke="#f5d598"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
          </svg>

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
      </main>
    </div>
  );
};
