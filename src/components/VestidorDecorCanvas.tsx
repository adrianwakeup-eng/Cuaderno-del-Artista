import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ClipboardPaste,
  Copy,
  FlipHorizontal2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import type { VestidorDecorElement } from '../types/crochet';
import { compressImageFile } from '../utils/storage';
import {
  createDefaultStageDecorations,
  createUniqueDecorId,
  DECOR_TEMPLATES,
  VestidorDecorVisual,
  type DecorTemplateDefinition,
} from './VestidorDecorAssets';

interface VestidorDecorCanvasProps {
  items: VestidorDecorElement[];
  editMode: boolean;
  reducedMotion: boolean;
  shortcutsDisabled?: boolean;
  onChangeItems: (next: VestidorDecorElement[]) => void;
  onExitEditMode: () => void;
  onNotify: (msg: string) => void;
  onPlaySfx?: (kind: 'click' | 'save') => void;
}

const DECOR_TINT_SWATCHES = [
  { hex: '#f3e5cf', label: 'Crema' },
  { hex: '#e9c89c', label: 'Arena dorada' },
  { hex: '#d98a93', label: 'Rosa empolvado' },
  { hex: '#5f8b67', label: 'Verde salvia' },
  { hex: '#e2b14a', label: 'Oro antiguo' },
  { hex: '#486ca8', label: 'Azul cobalto' },
];

const MAX_UNDO_HISTORY = 40;

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return Boolean(el.closest('[contenteditable="true"]'));
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export const VestidorDecorCanvas: React.FC<VestidorDecorCanvasProps> = ({
  items,
  editMode,
  reducedMotion,
  shortcutsDisabled = false,
  onChangeItems,
  onExitEditMode,
  onNotify,
  onPlaySfx,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pasteStepRef = useRef<number>(0);
  const itemsRef = useRef<VestidorDecorElement[]>(items);
  itemsRef.current = items;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<VestidorDecorElement | null>(null);
  const [past, setPast] = useState<VestidorDecorElement[][]>([]);
  const [future, setFuture] = useState<VestidorDecorElement[][]>([]);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{
    itemId: string;
    x: number;
    y: number;
  } | null>(null);

  const dragStateRef = useRef<{
    active: boolean;
    mode: 'move' | 'resize';
    itemId: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    origXPct: number;
    origYPct: number;
    origWidthPct: number;
    snapshotBeforeDrag: VestidorDecorElement[];
    didMutate: boolean;
  } | null>(null);

  // Clear edit-only UI state when exiting edit mode
  useEffect(() => {
    if (!editMode) {
      setSelectedId(null);
      setPaletteOpen(false);
      setContextMenu(null);
    }
  }, [editMode]);

  // Clear selection if selected item no longer exists
  useEffect(() => {
    if (selectedId && !items.some((i) => i.id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  const selectedItem = useMemo(
    () => (selectedId ? items.find((i) => i.id === selectedId) ?? null : null),
    [items, selectedId]
  );

  const commitChange = useCallback(
    (next: VestidorDecorElement[], recordUndo = true) => {
      if (recordUndo) {
        setPast((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), items]);
        setFuture([]);
      }
      onChangeItems(next);
    },
    [items, onChangeItems]
  );

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [items, ...prev.slice(0, MAX_UNDO_HISTORY - 1)]);
    onChangeItems(previous);
    setContextMenu(null);
    onPlaySfx?.('click');
    onNotify('Cambio de decoración deshecho');
  }, [past, items, onChangeItems, onPlaySfx, onNotify]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const currentIds = new Set(items.map((el) => el.id));
    const restoredItem = next.find((el) => !currentIds.has(el.id));
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), items]);
    onChangeItems(next);
    if (restoredItem) {
      setSelectedId(restoredItem.id);
    }
    setContextMenu(null);
    onPlaySfx?.('click');
    onNotify('Cambio de decoración rehecho');
  }, [future, items, onChangeItems, onPlaySfx, onNotify]);

  const getMaxZ = useCallback(
    (list: VestidorDecorElement[]) =>
      list.reduce((acc, el) => Math.max(acc, el.zIndex), 1),
    []
  );

  const buildDuplicatedCopy = useCallback(
    (source: VestidorDecorElement, stepMultiplier = 1): VestidorDecorElement => {
      const offsetX = 5.5 * stepMultiplier;
      const offsetY = 4.2 * stepMultiplier;
      let nextX = source.xPct + offsetX;
      let nextY = source.yPct + offsetY;
      // Keep the copy comfortably inside the editable stage area
      if (nextX > 88) nextX = clamp(source.xPct - offsetX, 12, 88);
      if (nextY > 88) nextY = clamp(source.yPct - offsetY, 14, 88);
      return {
        ...source,
        id: createUniqueDecorId('decor-copy'),
        xPct: Number(clamp(nextX, 10, 90).toFixed(2)),
        yPct: Number(clamp(nextY, 12, 90).toFixed(2)),
        zIndex: getMaxZ(items) + 1,
      };
    },
    [items, getMaxZ]
  );

  const handleDuplicateItem = useCallback(
    (targetId: string) => {
      const source = items.find((i) => i.id === targetId);
      if (!source) return;
      const copy = buildDuplicatedCopy(source, 1);
      commitChange([...items, copy], true);
      setSelectedId(copy.id);
      setContextMenu(null);
      onPlaySfx?.('save');
      onNotify(`Elemento duplicado: ${source.label}`);
    },
    [items, buildDuplicatedCopy, commitChange, onPlaySfx, onNotify]
  );

  const handleCopyItem = useCallback(
    (targetId: string) => {
      const source = items.find((i) => i.id === targetId);
      if (!source) return;
      setClipboard({ ...source });
      pasteStepRef.current = 0;
      setContextMenu(null);
      onPlaySfx?.('click');
      onNotify(`Copiado al portapapeles del vestidor: ${source.label}`);
    },
    [items, onPlaySfx, onNotify]
  );

  const handlePasteItem = useCallback(() => {
    if (!clipboard) return;
    pasteStepRef.current = (pasteStepRef.current % 5) + 1;
    const copy = buildDuplicatedCopy(clipboard, pasteStepRef.current);
    commitChange([...items, copy], true);
    setSelectedId(copy.id);
    setContextMenu(null);
    onPlaySfx?.('save');
    onNotify(`Elemento pegado: ${clipboard.label}`);
  }, [clipboard, buildDuplicatedCopy, items, commitChange, onPlaySfx, onNotify]);

  const handleDeleteItem = useCallback(
    (targetId: string) => {
      const target = items.find((i) => i.id === targetId);
      if (!target) return;
      commitChange(
        items.filter((i) => i.id !== targetId),
        true
      );
      if (selectedId === targetId) setSelectedId(null);
      setContextMenu(null);
      onPlaySfx?.('click');
      onNotify(`Eliminado: ${target.label}`);
    },
    [items, selectedId, commitChange, onPlaySfx, onNotify]
  );

  const handleShiftLayer = useCallback(
    (targetId: string, direction: 'forward' | 'backward') => {
      const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((i) => i.id === targetId);
      if (idx === -1) return;
      const swapIdx = direction === 'forward' ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      const reordered = [...sorted];
      const [moved] = reordered.splice(idx, 1);
      reordered.splice(swapIdx, 0, moved);
      const normalized = reordered.map((el, i) => ({ ...el, zIndex: i + 1 }));
      commitChange(normalized, true);
      setContextMenu(null);
      onPlaySfx?.('click');
    },
    [items, commitChange, onPlaySfx]
  );

  const handleToggleAnimation = useCallback(
    (targetId: string) => {
      const target = items.find((i) => i.id === targetId);
      if (!target) return;
      const nextAnimated = !target.animated;
      const nextKind =
        nextAnimated && target.animationKind === 'none' ? 'float' : target.animationKind;
      const next = items.map((el) =>
        el.id === targetId
          ? { ...el, animated: nextAnimated, animationKind: nextKind }
          : el
      );
      commitChange(next, true);
      setContextMenu(null);
      onPlaySfx?.('click');
      onNotify(
        nextAnimated
          ? `Animación activada en ${target.label}`
          : `Animación pausada en ${target.label}`
      );
    },
    [items, commitChange, onPlaySfx, onNotify]
  );

  const handleToggleFlip = useCallback(
    (targetId: string) => {
      const next = items.map((el) =>
        el.id === targetId ? { ...el, flipX: !el.flipX } : el
      );
      commitChange(next, true);
      setContextMenu(null);
      onPlaySfx?.('click');
    },
    [items, commitChange, onPlaySfx]
  );

  const handleSetTint = useCallback(
    (targetId: string, hex: string) => {
      const next = items.map((el) =>
        el.id === targetId ? { ...el, tintColor: hex } : el
      );
      commitChange(next, true);
      onPlaySfx?.('click');
    },
    [items, commitChange, onPlaySfx]
  );

  const handleAddTemplate = useCallback(
    (tpl: DecorTemplateDefinition) => {
      // Place gently along the left or right studio edge so it complements the central model
      const isLeftSide = items.length % 2 === 0;
      const isHanging = tpl.kind === 'macrame-curtain' || tpl.kind === 'dreamcatcher';
      const newItem: VestidorDecorElement = {
        id: createUniqueDecorId('decor'),
        kind: tpl.kind,
        label: tpl.label,
        xPct: isLeftSide ? 20 : 80,
        yPct: isHanging ? 26 : 66,
        widthPct: tpl.defaultWidthPct,
        zIndex: getMaxZ(items) + 1,
        rotationDeg: 0,
        flipX: false,
        animated: tpl.defaultAnimated,
        animationKind: tpl.defaultAnimation,
        tintColor: tpl.defaultTint,
        opacity: 1,
        aspectRatio: tpl.aspectRatio,
      };
      commitChange([...items, newItem], true);
      setSelectedId(newItem.id);
      setPaletteOpen(false);
      onPlaySfx?.('save');
      onNotify(`Añadido al vestidor: ${tpl.label}`);
    },
    [items, getMaxZ, commitChange, onPlaySfx, onNotify]
  );

  const handleUploadCustomDecor = useCallback(
    async (file: File) => {
      try {
        const dataUrl = await compressImageFile(file, 960, true);
        // Detect natural aspect ratio cleanly
        const aspect = await new Promise<number>((resolve) => {
          const img = new Image();
          img.onload = () =>
            resolve(img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1);
          img.onerror = () => resolve(1);
          img.src = dataUrl;
        });
        const cleanLabel =
          file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Adorno propio';
        const newItem: VestidorDecorElement = {
          id: createUniqueDecorId('decor-custom'),
          kind: 'custom-image',
          label: cleanLabel.slice(0, 32),
          xPct: 24,
          yPct: 48,
          widthPct: 22,
          zIndex: getMaxZ(items) + 1,
          rotationDeg: 0,
          flipX: false,
          animated: false,
          animationKind: 'float',
          opacity: 1,
          customDataUrl: dataUrl,
          aspectRatio: clamp(aspect, 0.35, 2.8),
        };
        commitChange([...items, newItem], true);
        setSelectedId(newItem.id);
        setPaletteOpen(false);
        onPlaySfx?.('save');
        onNotify(`Adorno personalizado añadido: ${newItem.label}`);
      } catch {
        onNotify('No se pudo cargar la imagen decorativa');
      }
    },
    [items, getMaxZ, commitChange, onPlaySfx, onNotify]
  );

  const handleResetDecorations = useCallback(() => {
    const defaults = createDefaultStageDecorations();
    commitChange(defaults, true);
    setSelectedId(null);
    setContextMenu(null);
    onPlaySfx?.('click');
    onNotify('Decoraciones del vestidor restablecidas');
  }, [commitChange, onPlaySfx, onNotify]);

  // Global keyboard shortcuts (Windows Ctrl + Mac Cmd) strictly respecting inputs & modals
  useEffect(() => {
    if (!editMode || shortcutsDisabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableKeyboardTarget(e.target) || isEditableKeyboardTarget(document.activeElement)) {
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'c' && selectedId) {
        e.preventDefault();
        handleCopyItem(selectedId);
        return;
      }
      if (mod && key === 'v' && clipboard) {
        e.preventDefault();
        handlePasteItem();
        return;
      }
      if (mod && key === 'd' && selectedId) {
        e.preventDefault();
        handleDuplicateItem(selectedId);
        return;
      }
      if (mod && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((mod && key === 'y') || (mod && e.shiftKey && key === 'z')) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        handleDeleteItem(selectedId);
        return;
      }
      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
        } else if (paletteOpen) {
          setPaletteOpen(false);
        } else if (selectedId) {
          setSelectedId(null);
        } else {
          onExitEditMode();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    editMode,
    shortcutsDisabled,
    selectedId,
    clipboard,
    contextMenu,
    paletteOpen,
    handleCopyItem,
    handlePasteItem,
    handleDuplicateItem,
    handleUndo,
    handleRedo,
    handleDeleteItem,
    onExitEditMode,
  ]);

  // Pointer drag (move) & corner resize handlers (Windows, Mac & touch compatible)
  const startPointerInteraction = (
    e: React.PointerEvent<HTMLElement>,
    item: VestidorDecorElement,
    mode: 'move' | 'resize'
  ) => {
    if (!editMode) return;
    if (e.button === 2) return; // Right-click handled by onContextMenu
    e.stopPropagation();
    setSelectedId(item.id);
    setContextMenu(null);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      mode,
      itemId: item.id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origXPct: item.xPct,
      origYPct: item.yPct,
      origWidthPct: item.widthPct,
      snapshotBeforeDrag: items,
      didMutate: false,
    };
  };

  const handlePointerMoveItem = (e: React.PointerEvent<HTMLElement>) => {
    const st = dragStateRef.current;
    if (!st || !st.active || st.pointerId !== e.pointerId) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    e.stopPropagation();
    const dx = e.clientX - st.startClientX;
    const dy = e.clientY - st.startClientY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      st.didMutate = true;
    }

    if (st.mode === 'move') {
      const nextX = clamp(st.origXPct + (dx / rect.width) * 100, 6, 94);
      const nextY = clamp(st.origYPct + (dy / rect.height) * 100, 8, 94);
      onChangeItems(
        itemsRef.current.map((el) =>
          el.id === st.itemId
            ? { ...el, xPct: Number(nextX.toFixed(2)), yPct: Number(nextY.toFixed(2)) }
            : el
        )
      );
    } else {
      const deltaPct = ((dx + dy * 0.5) / rect.width) * 100;
      const nextWidth = clamp(st.origWidthPct + deltaPct, 8, 56);
      onChangeItems(
        itemsRef.current.map((el) =>
          el.id === st.itemId ? { ...el, widthPct: Number(nextWidth.toFixed(2)) } : el
        )
      );
    }
  };

  const handlePointerUpItem = (e: React.PointerEvent<HTMLElement>) => {
    const st = dragStateRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (st.didMutate) {
      setPast((prev) => [...prev.slice(-(MAX_UNDO_HISTORY - 1)), st.snapshotBeforeDrag]);
      setFuture([]);
    }
    dragStateRef.current = null;
  };

  const handleOpenContextMenu = (
    e: React.MouseEvent,
    item: VestidorDecorElement
  ) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = clamp(e.clientX - rect.left, 12, Math.max(12, rect.width - 196));
    const relY = clamp(e.clientY - rect.top, 48, Math.max(48, rect.height - 250));
    setSelectedId(item.id);
    setContextMenu({ itemId: item.id, x: relX, y: relY });
  };

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.zIndex - b.zIndex),
    [items]
  );

  const contextItem = contextMenu
    ? items.find((i) => i.id === contextMenu.itemId) ?? null
    : null;

  const isTintable = (kind: VestidorDecorElement['kind']) =>
    kind === 'yarn-ball' ||
    kind === 'macrame-curtain' ||
    kind === 'dreamcatcher' ||
    kind === 'sewing-machine';

  return (
    <div
      ref={containerRef}
      aria-label={editMode ? 'Área editable de decoraciones del vestidor' : undefined}
      onClick={() => {
        if (!editMode) return;
        setSelectedId(null);
        setContextMenu(null);
        setPaletteOpen(false);
      }}
      className={`absolute inset-0 overflow-hidden ${
        editMode
          ? 'z-[26] pointer-events-auto ring-2 ring-inset ring-[#e8b654]/70 rounded-2xl'
          : 'z-[14] pointer-events-none'
      }`}
    >
      {/* Subtle Edit Mode Top Toolbar (Strictly inside central stage, never covers header/catalog) */}
      {editMode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto absolute top-2 inset-x-2 z-40 flex flex-wrap items-center justify-center gap-1.5"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#542c16]/94 backdrop-blur-md border-2 border-[#e3b56a] text-[#fff1d4] shadow-[0_10px_24px_rgba(38,16,6,0.45)]">
            <button
              type="button"
              onClick={() => {
                onPlaySfx?.('click');
                setPaletteOpen((v) => !v);
                setContextMenu(null);
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold cursor-pointer transition-colors ${
                paletteOpen
                  ? 'bg-[#ffd862] text-[#3f1c05]'
                  : 'bg-[#733f20] hover:bg-[#8a4d28] text-[#ffefc8] border border-[#d6a25c]/60'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir adorno</span>
            </button>

            <button
              type="button"
              disabled={!selectedItem}
              onClick={() => selectedItem && handleDuplicateItem(selectedItem.id)}
              title="Duplicar elemento seleccionado (Ctrl/Cmd+D)"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-[#733f20] hover:bg-[#8a4d28] disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-[#ffefc8] border border-[#d6a25c]/50 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Duplicar</span>
            </button>

            <button
              type="button"
              disabled={!clipboard}
              onClick={handlePasteItem}
              title="Pegar elemento copiado (Ctrl/Cmd+V)"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-[#733f20] hover:bg-[#8a4d28] disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-[#ffefc8] border border-[#d6a25c]/50 cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pegar</span>
            </button>

            <div className="flex items-center gap-0.5 pl-0.5 border-l border-[#e3b56a]/30">
              <button
                type="button"
                disabled={past.length === 0}
                onClick={handleUndo}
                title="Deshacer (Ctrl/Cmd+Z)"
                aria-label="Deshacer decoración"
                className="w-7 h-7 rounded-lg hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={future.length === 0}
                onClick={handleRedo}
                title="Rehacer (Ctrl/Cmd+Y)"
                aria-label="Rehacer decoración"
                className="w-7 h-7 rounded-lg hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetDecorations}
                title="Restablecer decoraciones iniciales"
                aria-label="Restablecer decoraciones iniciales"
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onPlaySfx?.('click');
                onExitEditMode();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-b from-[#ffe26b] to-[#df9712] text-[#3d1a04] text-[11px] font-extrabold shadow cursor-pointer hover:brightness-105"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2.8} />
              <span>Listo</span>
            </button>
          </div>

          {/* Compatible Decoration Picker Popover */}
          {paletteOpen && (
            <div className="w-full max-w-[440px] rounded-2xl border-2 border-[#d9a66c] bg-[#fbf0df]/98 backdrop-blur-md text-[#462310] shadow-[0_18px_42px_rgba(38,16,6,0.42)] p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#c07410]" />
                  <span className="text-xs font-extrabold">Decoraciones compatibles del vestidor</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaletteOpen(false)}
                  aria-label="Cerrar selector de adornos"
                  className="w-6 h-6 rounded-full hover:bg-[#e8d2b2] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto studio-scroll pr-0.5">
                {DECOR_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.kind}
                    type="button"
                    onClick={() => handleAddTemplate(tpl)}
                    className="flex flex-col items-center justify-between gap-1 rounded-xl border border-[#dfc098] bg-[#fff9ef] hover:border-[#c67f12] hover:bg-[#fff2d6] p-1.5 text-center transition-all cursor-pointer"
                  >
                    <div className="w-11 h-11 flex items-center justify-center">
                      <VestidorDecorVisual
                        reducedMotion={true}
                        item={{
                          id: `preview-${tpl.kind}`,
                          kind: tpl.kind,
                          label: tpl.label,
                          xPct: 50,
                          yPct: 50,
                          widthPct: 100,
                          zIndex: 1,
                          rotationDeg: 0,
                          animated: false,
                          animationKind: 'none',
                          tintColor: tpl.defaultTint,
                          aspectRatio: tpl.aspectRatio,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold leading-tight text-[#4c2610] line-clamp-2">
                      {tpl.label}
                    </span>
                  </button>
                ))}

                {/* Extensible: Upload custom transparent PNG/WebP decoration */}
                <label className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#c89860] bg-[#f7e7cf] hover:bg-[#f2dbb9] p-1.5 text-center cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-[#7a4522]" />
                  <span className="text-[10px] font-extrabold leading-tight text-[#5a2f14]">
                    Subir PNG propio
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/webp,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleUploadCustomDecor(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <p className="mt-2 text-[10px] text-[#7a4c2a] text-center">
                Pulsa un adorno para seleccionarlo · Arrastra para mover · Atajos: Ctrl/Cmd+C, V, D, Z
              </p>
            </div>
          )}
        </div>
      )}

      {/* Render All Editable Decorations */}
      {sortedItems.map((item, idx) => {
        const isSelected = editMode && selectedId === item.id;
        const toolbarBelow = item.yPct < 38;
        const canBringForward = idx < sortedItems.length - 1;
        const canSendBackward = idx > 0;

        return (
          <div
            key={item.id}
            data-decor-id={item.id}
            data-decor-kind={item.kind}
            role={editMode ? 'button' : undefined}
            tabIndex={editMode ? 0 : undefined}
            aria-label={editMode ? `${item.label} (decoración editable)` : undefined}
            onPointerDown={(e) => startPointerInteraction(e, item, 'move')}
            onPointerMove={handlePointerMoveItem}
            onPointerUp={handlePointerUpItem}
            onPointerCancel={handlePointerUpItem}
            onContextMenu={(e) => handleOpenContextMenu(e, item)}
            onClick={(e) => {
              if (!editMode) return;
              e.stopPropagation();
              setSelectedId(item.id);
              setContextMenu(null);
            }}
            style={{
              left: `${item.xPct}%`,
              top: `${item.yPct}%`,
              width: `${item.widthPct}%`,
              aspectRatio: `${item.aspectRatio}`,
              zIndex: item.zIndex,
              transform: `translate(-50%, -50%) rotate(${item.rotationDeg}deg)`,
            }}
            className={`absolute select-none touch-none ${
              editMode
                ? isSelected
                  ? 'pointer-events-auto cursor-grab active:cursor-grabbing ring-2 ring-[#f4b825] bg-[#fff5d4]/18 rounded-xl shadow-[0_0_0_2px_rgba(90,44,18,0.4)]'
                  : 'pointer-events-auto cursor-pointer hover:ring-2 hover:ring-dashed hover:ring-[#e8b654]/85 rounded-xl'
                : 'pointer-events-none'
            }`}
          >
            <VestidorDecorVisual item={item} reducedMotion={reducedMotion} />

            {/* Floating Selection Controls with Prominent Copy (Two Overlapping Squares) Button */}
            {isSelected && (
              <>
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute ${
                    item.xPct < 26
                      ? 'left-0 items-start'
                      : item.xPct > 74
                      ? 'right-0 items-end'
                      : 'left-1/2 -translate-x-1/2 items-center'
                  } ${
                    toolbarBelow ? 'top-[calc(100%+8px)]' : 'bottom-[calc(100%+8px)]'
                  } z-50 flex flex-col gap-1`}
                >
                  <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl bg-[#4d2611]/95 border border-[#e7ba70] text-[#fff1d4] shadow-[0_8px_20px_rgba(32,12,4,0.5)] whitespace-nowrap">
                    {/* Prominent Duplicate Button (Two Overlapping Squares Icon) */}
                    <button
                      type="button"
                      data-testid="decor-duplicate-btn"
                      onClick={() => handleDuplicateItem(item.id)}
                      title="Duplicar elemento (Ctrl/Cmd+D)"
                      aria-label={`Duplicar ${item.label}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-b from-[#ffe26b] to-[#e09814] text-[#3d1b05] text-[10.5px] font-extrabold shadow-sm cursor-pointer hover:brightness-105"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicar</span>
                    </button>

                    {/* Independent Animation Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAnimation(item.id)}
                      title={
                        item.animated
                          ? 'Desactivar animación de esta copia'
                          : 'Activar animación de esta copia'
                      }
                      aria-label={
                        item.animated ? 'Desactivar animación' : 'Activar animación'
                      }
                      className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                        item.animated
                          ? 'bg-[#3b6e49] text-[#e8fff0] hover:bg-[#498459]'
                          : 'hover:bg-white/15 text-[#f2d5a7]'
                      }`}
                    >
                      {item.animated ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </button>

                    {/* Layer Ordering Controls */}
                    <button
                      type="button"
                      disabled={!canBringForward}
                      onClick={() => handleShiftLayer(item.id, 'forward')}
                      title="Traer adelante"
                      aria-label="Traer adelante"
                      className="w-6 h-6 rounded-lg hover:bg-white/15 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={!canSendBackward}
                      onClick={() => handleShiftLayer(item.id, 'backward')}
                      title="Enviar atrás"
                      aria-label="Enviar atrás"
                      className="w-6 h-6 rounded-lg hover:bg-white/15 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>

                    {/* Horizontal Flip */}
                    <button
                      type="button"
                      onClick={() => handleToggleFlip(item.id)}
                      title="Voltear horizontalmente"
                      aria-label="Voltear horizontalmente"
                      className="w-6 h-6 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
                    >
                      <FlipHorizontal2 className="w-3 h-3" />
                    </button>

                    {/* Touch-friendly Context Menu Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const relX = clamp(
                          (item.xPct / 100) * rect.width,
                          12,
                          Math.max(12, rect.width - 196)
                        );
                        const relY = clamp(
                          (item.yPct / 100) * rect.height,
                          48,
                          Math.max(48, rect.height - 250)
                        );
                        setContextMenu({ itemId: item.id, x: relX, y: relY });
                      }}
                      title="Más opciones"
                      aria-label="Más opciones"
                      className="w-6 h-6 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete ONLY this selected copy */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Eliminar solo este elemento (Supr)"
                      aria-label={`Eliminar ${item.label}`}
                      className="w-6 h-6 rounded-lg bg-[#942235] hover:bg-[#b52a41] text-white flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtle Color Tint Row for Tintable Elements (preserved on copy/duplicate!) */}
                  {isTintable(item.kind) && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#4d2611]/90 border border-[#e3b56a]/70 shadow">
                      {DECOR_TINT_SWATCHES.map((sw) => (
                        <button
                          key={sw.hex}
                          type="button"
                          onClick={() => handleSetTint(item.id, sw.hex)}
                          title={`Color: ${sw.label}`}
                          aria-label={`Color ${sw.label}`}
                          className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition-transform ${
                            item.tintColor === sw.hex
                              ? 'scale-125 border-[#ffe26b] ring-1 ring-[#ffe26b]'
                              : 'border-white/60 hover:scale-110'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Proportional Resize Handle (Bottom-Right Corner — Mouse & Touch) */}
                <button
                  type="button"
                  onPointerDown={(e) => startPointerInteraction(e, item, 'resize')}
                  onPointerMove={handlePointerMoveItem}
                  onPointerUp={handlePointerUpItem}
                  onPointerCancel={handlePointerUpItem}
                  onClick={(e) => e.stopPropagation()}
                  title="Arrastra para cambiar tamaño"
                  aria-label={`Cambiar tamaño de ${item.label}`}
                  className="absolute bottom-0.5 right-0.5 z-50 w-5 h-5 rounded-full bg-[#ffd862] hover:bg-[#ffea96] border-2 border-[#5a2c12] shadow cursor-nwse-resize flex items-center justify-center"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5a2c12]" />
                </button>
              </>
            )}
          </div>
        );
      })}

      {/* Right-Click / Touch Context Menu */}
      {editMode && contextMenu && contextItem && (
        <div
          role="menu"
          aria-label="Menú de elemento decorativo"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          className="pointer-events-auto absolute z-50 w-48 rounded-2xl border-2 border-[#d9a66c] bg-[#fbf0df] text-[#452310] shadow-[0_14px_34px_rgba(38,16,6,0.45)] p-1.5 text-xs"
        >
          <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#8c5933] truncate border-b border-[#e5c8a2] mb-1">
            {contextItem.label}
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDuplicateItem(contextItem.id)}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f3dfc0] font-bold cursor-pointer text-left"
          >
            <span className="inline-flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-[#a15a14]" />
              <span>Duplicar</span>
            </span>
            <span className="text-[10px] text-[#8d5c37] font-mono-tab">Ctrl+D</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleCopyItem(contextItem.id)}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f3dfc0] font-semibold cursor-pointer text-left"
          >
            <span>Copiar</span>
            <span className="text-[10px] text-[#8d5c37] font-mono-tab">Ctrl+C</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!clipboard}
            onClick={handlePasteItem}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f3dfc0] disabled:opacity-40 font-semibold cursor-pointer text-left"
          >
            <span>Pegar</span>
            <span className="text-[10px] text-[#8d5c37] font-mono-tab">Ctrl+V</span>
          </button>
          <div className="my-1 border-t border-[#e5c8a2]" />
          <button
            type="button"
            role="menuitem"
            onClick={() => handleShiftLayer(contextItem.id, 'forward')}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[#f3dfc0] font-semibold cursor-pointer text-left"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[#7a4a24]" />
            <span>Traer adelante</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleShiftLayer(contextItem.id, 'backward')}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[#f3dfc0] font-semibold cursor-pointer text-left"
          >
            <ArrowDown className="w-3.5 h-3.5 text-[#7a4a24]" />
            <span>Enviar atrás</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleToggleAnimation(contextItem.id)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[#f3dfc0] font-semibold cursor-pointer text-left"
          >
            {contextItem.animated ? (
              <Pause className="w-3.5 h-3.5 text-[#2d6a45]" />
            ) : (
              <Play className="w-3.5 h-3.5 text-[#7a4a24]" />
            )}
            <span>{contextItem.animated ? 'Desactivar animación' : 'Activar animación'}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleToggleFlip(contextItem.id)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[#f3dfc0] font-semibold cursor-pointer text-left"
          >
            <FlipHorizontal2 className="w-3.5 h-3.5 text-[#7a4a24]" />
            <span>Voltear horizontal</span>
          </button>
          <div className="my-1 border-t border-[#e5c8a2]" />
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDeleteItem(contextItem.id)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-[#fae0e4] text-[#942235] font-bold cursor-pointer text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar copia</span>
          </button>
        </div>
      )}
    </div>
  );
};
