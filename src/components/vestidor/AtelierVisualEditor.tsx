import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Clipboard,
  Copy,
  Eye,
  EyeOff,
  Layers,
  Lock,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Scissors,
  Trash2,
  Undo2,
  Unlock,
} from 'lucide-react';
import {
  ArtisanCrochetFloralCluster,
  ArtisanCrochetTeddy,
  ArtisanPottedPlant,
  ArtisanWickerYarnBasket,
  ArtisanYellowSunflower,
  VintageSewingMachine,
} from './AtelierDecorProps';
import { audioEngine } from '../../utils/audioEngine';

export type AtelierPropKind =
  | 'sewing-machine'
  | 'potted-plant'
  | 'yarn-basket'
  | 'yellow-sunflower'
  | 'crochet-teddy'
  | 'floral-cluster'
  | 'dreamcatcher';

export interface AtelierSceneItem {
  id: string;
  kind: AtelierPropKind;
  label: string;
  /** Center X in stage percentage (0..100) */
  x: number;
  /** Center Y in stage percentage (0..100) */
  y: number;
  /** Width in stage percentage (4..45) */
  widthPct: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  hidden: boolean;
}

const STORAGE_KEY = 'cuaderno-vestidor-scene-items-v1';

export const DEFAULT_ATELIER_SCENE_ITEMS: AtelierSceneItem[] = [
  {
    id: 'prop-sewing-machine',
    kind: 'sewing-machine',
    label: 'Máquina de coser vintage',
    x: 20,
    y: 66,
    widthPct: 26,
    rotation: 0,
    zIndex: 12,
    locked: false,
    hidden: false,
  },
  {
    id: 'prop-potted-plant',
    kind: 'potted-plant',
    label: 'Planta en cesta tejida',
    x: 22,
    y: 79,
    widthPct: 16,
    rotation: 0,
    zIndex: 16,
    locked: false,
    hidden: false,
  },
  {
    id: 'prop-yarn-basket',
    kind: 'yarn-basket',
    label: 'Cesta de ovillos',
    x: 80,
    y: 80,
    widthPct: 20,
    rotation: 0,
    zIndex: 16,
    locked: false,
    hidden: false,
  },
  {
    id: 'prop-sunflower',
    kind: 'yellow-sunflower',
    label: 'Girasol de crochet',
    x: 11,
    y: 92,
    widthPct: 15,
    rotation: -4,
    zIndex: 28,
    locked: false,
    hidden: false,
  },
  {
    id: 'prop-teddy',
    kind: 'crochet-teddy',
    label: 'Osito amigurumi',
    x: 91,
    y: 91,
    widthPct: 14,
    rotation: 2,
    zIndex: 28,
    locked: false,
    hidden: false,
  },
];

export const PROP_ADD_CATALOG: Array<{ kind: AtelierPropKind; label: string; widthPct: number }> = [
  { kind: 'yellow-sunflower', label: 'Girasol tejido', widthPct: 14 },
  { kind: 'floral-cluster', label: 'Ramo de flores', widthPct: 22 },
  { kind: 'yarn-basket', label: 'Cesta de ovillos', widthPct: 18 },
  { kind: 'potted-plant', label: 'Planta mimbre', widthPct: 15 },
  { kind: 'crochet-teddy', label: 'Osito crochet', widthPct: 13 },
  { kind: 'dreamcatcher', label: 'Atrapasueños', widthPct: 11 },
  { kind: 'sewing-machine', label: 'Máquina coser', widthPct: 24 },
];

export function loadSavedAtelierItems(): AtelierSceneItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ATELIER_SCENE_ITEMS;
    const parsed = JSON.parse(raw) as AtelierSceneItem[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fallback to defaults
  }
  return DEFAULT_ATELIER_SCENE_ITEMS;
}

export function saveAtelierItems(items: AtelierSceneItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage quota error
  }
}

const FloatingDreamcatcherProp: React.FC = () => (
  <div className="atelier-anim-dreamcatcher w-full">
    <svg viewBox="0 0 90 190" className="w-full h-auto drop-shadow-[0_6px_10px_rgba(72,40,14,0.34)]" fill="none" aria-hidden="true">
      <line x1="45" y1="0" x2="45" y2="34" stroke="#c89a4a" strokeWidth="2.4" strokeDasharray="3 1.5" />
      <circle cx="45" cy="18" r="4.5" fill="#8b5a34" stroke="#4f2d14" strokeWidth="1" />
      <circle cx="45" cy="62" r="26" stroke="#b9863c" strokeWidth="4.2" />
      <circle cx="45" cy="62" r="26" stroke="#f5dfa6" strokeWidth="1.2" strokeDasharray="4 3" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1="45"
            y1="62"
            x2={45 + Math.cos(rad) * 24}
            y2={62 + Math.sin(rad) * 24}
            stroke="#f4e2bd"
            strokeWidth="1.15"
          />
        );
      })}
      <polygon points="45,42 59,48 65,62 59,76 45,82 31,76 25,62 31,48" stroke="#e9c882" strokeWidth="1.1" />
      <circle cx="45" cy="62" r="5" fill="#d8a8af" stroke="#8f545e" strokeWidth="0.9" />
      <circle cx="45" cy="62" r="2.2" fill="#fff8ed" />
      <g className="atelier-anim-fringe">
        {[26, 35, 45, 55, 64].map((x, i) => {
          const len = i === 2 ? 92 : i === 1 || i === 3 ? 80 : 66;
          return (
            <g key={x}>
              <line x1={x} y1={85} x2={x} y2={85 + len} stroke={i % 2 === 0 ? '#d8b56a' : '#f5e8d3'} strokeWidth="2.1" strokeLinecap="round" />
              <circle cx={x} cy={104 + (i % 2) * 10} r="3.2" fill="#7c4e2a" />
            </g>
          );
        })}
      </g>
    </svg>
  </div>
);

export const AtelierPropRenderer: React.FC<{
  kind: AtelierPropKind;
  sewingPaused: boolean;
  onToggleSewing?: () => void;
  editMode: boolean;
}> = ({ kind, sewingPaused, onToggleSewing, editMode }) => {
  switch (kind) {
    case 'sewing-machine':
      return (
        <VintageSewingMachine
          paused={sewingPaused}
          onTogglePause={editMode ? undefined : onToggleSewing}
          showInlineControl={!editMode}
          className="w-full"
        />
      );
    case 'potted-plant':
      return <ArtisanPottedPlant className="w-full h-auto" />;
    case 'yarn-basket':
      return <ArtisanWickerYarnBasket className="w-full h-auto" />;
    case 'yellow-sunflower':
      return <ArtisanYellowSunflower className="w-full h-auto" />;
    case 'crochet-teddy':
      return <ArtisanCrochetTeddy className="w-full h-auto" />;
    case 'floral-cluster':
      return <ArtisanCrochetFloralCluster className="w-full h-auto" />;
    case 'dreamcatcher':
      return <FloatingDreamcatcherProp />;
    default:
      return null;
  }
};

export interface AtelierEditorController {
  items: AtelierSceneItem[];
  selectedId: string | null;
  selectedItem: AtelierSceneItem | null;
  clipboard: AtelierSceneItem | null;
  canUndo: boolean;
  canRedo: boolean;
  autoSavedAt: string | null;
  selectItem: (id: string | null) => void;
  updateItem: (id: string, patch: Partial<AtelierSceneItem>, recordHistory?: boolean) => void;
  commitSnapshot: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
  toggleLockSelected: () => void;
  toggleHideItem: (id: string) => void;
  stepLayer: (id: string, dir: 'up' | 'down') => void;
  rotateSelected: (deltaDeg: number) => void;
  resizeSelected: (deltaPct: number) => void;
  addProp: (kind: AtelierPropKind, label: string, widthPct: number) => void;
  undo: () => void;
  redo: () => void;
  resetAll: () => void;
}

export function useAtelierVisualEditor(
  editMode: boolean,
  onNotify: (msg: string) => void
): AtelierEditorController {
  const [items, setItems] = useState<AtelierSceneItem[]>(() => loadSavedAtelierItems());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<AtelierSceneItem | null>(null);
  const [undoStack, setUndoStack] = useState<AtelierSceneItem[][]>([]);
  const [redoStack, setRedoStack] = useState<AtelierSceneItem[][]>([]);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Auto-save whenever items change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveAtelierItems(items);
      const now = new Date();
      setAutoSavedAt(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    }, 350);
    return () => window.clearTimeout(timer);
  }, [items]);

  // Clear selection when leaving edit mode
  useEffect(() => {
    if (!editMode) setSelectedId(null);
  }, [editMode]);

  const pushHistory = useCallback((snapshot: AtelierSceneItem[]) => {
    setUndoStack((prev) => [...prev.slice(-39), snapshot]);
    setRedoStack([]);
  }, []);

  const commitSnapshot = useCallback(() => {
    pushHistory(itemsRef.current);
  }, [pushHistory]);

  const updateItem = useCallback(
    (id: string, patch: Partial<AtelierSceneItem>, recordHistory = false) => {
      setItems((prev) => {
        if (recordHistory) pushHistory(prev);
        return prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      });
    },
    [pushHistory]
  );

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;

  const copySelected = useCallback(() => {
    const item = itemsRef.current.find((i) => i.id === selectedId);
    if (!item) return;
    audioEngine.playStitchClick();
    setClipboard({ ...item });
    onNotify(`Elemento copiado: ${item.label}`);
  }, [selectedId, onNotify]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard) return;
    audioEngine.playYarnPluck(3);
    const maxZ = itemsRef.current.reduce((m, i) => Math.max(m, i.zIndex), 10);
    const pasted: AtelierSceneItem = {
      ...clipboard,
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x: Math.min(92, clipboard.x + 4),
      y: Math.min(92, clipboard.y + 4),
      zIndex: maxZ + 1,
      locked: false,
      hidden: false,
    };
    setItems((prev) => {
      pushHistory(prev);
      return [...prev, pasted];
    });
    setSelectedId(pasted.id);
    onNotify(`Elemento pegado: ${pasted.label}`);
  }, [clipboard, pushHistory, onNotify]);

  const duplicateSelected = useCallback(() => {
    const item = itemsRef.current.find((i) => i.id === selectedId);
    if (!item) return;
    audioEngine.playYarnPluck(4);
    const maxZ = itemsRef.current.reduce((m, i) => Math.max(m, i.zIndex), 10);
    const copy: AtelierSceneItem = {
      ...item,
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x: Math.min(92, item.x + 5),
      y: Math.max(10, item.y - 3),
      zIndex: maxZ + 1,
      locked: false,
      hidden: false,
    };
    setItems((prev) => {
      pushHistory(prev);
      return [...prev, copy];
    });
    setSelectedId(copy.id);
    onNotify(`Duplicado con calidad y animación: ${copy.label}`);
  }, [selectedId, pushHistory, onNotify]);

  const deleteSelected = useCallback(() => {
    const item = itemsRef.current.find((i) => i.id === selectedId);
    if (!item) return;
    if (item.locked) {
      onNotify('Desbloquea el elemento antes de eliminarlo');
      return;
    }
    audioEngine.playEraseBrush();
    setItems((prev) => {
      pushHistory(prev);
      return prev.filter((i) => i.id !== item.id);
    });
    setSelectedId(null);
    onNotify(`Elemento eliminado: ${item.label}`);
  }, [selectedId, pushHistory, onNotify]);

  const toggleLockSelected = useCallback(() => {
    const item = itemsRef.current.find((i) => i.id === selectedId);
    if (!item) return;
    audioEngine.playToggleChime(!item.locked);
    updateItem(item.id, { locked: !item.locked }, true);
    onNotify(item.locked ? `Desbloqueado: ${item.label}` : `Bloqueado: ${item.label}`);
  }, [selectedId, updateItem, onNotify]);

  const toggleHideItem = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id);
      if (!item) return;
      audioEngine.playToggleChime(item.hidden);
      updateItem(id, { hidden: !item.hidden }, true);
      if (!item.hidden && selectedId === id) setSelectedId(null);
    },
    [selectedId, updateItem]
  );

  const stepLayer = useCallback(
    (id: string, dir: 'up' | 'down') => {
      const item = itemsRef.current.find((i) => i.id === id);
      if (!item) return;
      audioEngine.playStitchClick();
      const nextZ = dir === 'up' ? Math.min(48, item.zIndex + 2) : Math.max(6, item.zIndex - 2);
      updateItem(id, { zIndex: nextZ }, true);
    },
    [updateItem]
  );

  const rotateSelected = useCallback(
    (deltaDeg: number) => {
      const item = itemsRef.current.find((i) => i.id === selectedId);
      if (!item || item.locked) return;
      audioEngine.playStitchClick();
      updateItem(item.id, { rotation: (item.rotation + deltaDeg) % 360 }, true);
    },
    [selectedId, updateItem]
  );

  const resizeSelected = useCallback(
    (deltaPct: number) => {
      const item = itemsRef.current.find((i) => i.id === selectedId);
      if (!item || item.locked) return;
      audioEngine.playStitchClick();
      const nextW = Math.max(6, Math.min(42, item.widthPct + deltaPct));
      updateItem(item.id, { widthPct: nextW }, true);
    },
    [selectedId, updateItem]
  );

  const addProp = useCallback(
    (kind: AtelierPropKind, label: string, widthPct: number) => {
      audioEngine.playSaveChime();
      const maxZ = itemsRef.current.reduce((m, i) => Math.max(m, i.zIndex), 14);
      const newItem: AtelierSceneItem = {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        kind,
        label,
        x: 50 + ((itemsRef.current.length * 7) % 24) - 12,
        y: 72 + ((itemsRef.current.length * 5) % 16) - 8,
        widthPct,
        rotation: 0,
        zIndex: maxZ + 1,
        locked: false,
        hidden: false,
      };
      setItems((prev) => {
        pushHistory(prev);
        return [...prev, newItem];
      });
      setSelectedId(newItem.id);
      onNotify(`Añadido al atelier: ${label}`);
    },
    [pushHistory, onNotify]
  );

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      audioEngine.playUndoRedo(false);
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, itemsRef.current]);
      setItems(last);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      audioEngine.playUndoRedo(true);
      const next = prev[prev.length - 1];
      setUndoStack((u) => [...u, itemsRef.current]);
      setItems(next);
      return prev.slice(0, -1);
    });
  }, []);

  const resetAll = useCallback(() => {
    audioEngine.playSaveChime();
    setItems((prev) => {
      pushHistory(prev);
      return DEFAULT_ATELIER_SCENE_ITEMS;
    });
    setSelectedId(null);
    onNotify('Escenario restaurado a la composición artesanal original');
  }, [pushHistory, onNotify]);

  // Keyboard shortcuts strictly in Edit Mode
  useEffect(() => {
    if (!editMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (meta && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelected();
      } else if (meta && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteClipboard();
      } else if (meta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editMode, selectedId, undo, redo, copySelected, pasteClipboard, duplicateSelected, deleteSelected]);

  return {
    items,
    selectedId,
    selectedItem,
    clipboard,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    autoSavedAt,
    selectItem: setSelectedId,
    updateItem,
    commitSnapshot,
    copySelected,
    pasteClipboard,
    duplicateSelected,
    deleteSelected,
    toggleLockSelected,
    toggleHideItem,
    stepLayer,
    rotateSelected,
    resizeSelected,
    addProp,
    undo,
    redo,
    resetAll,
  };
}

/**
 * Interactive Stage Overlay for Atelier Scene Props
 * In normal mode: pure seamless decorations with animations.
 * In Edit Mode: selectable, draggable, rotatable, resizable with brass stitched handles.
 */
export const AtelierEditableStageProps: React.FC<{
  editor: AtelierEditorController;
  editMode: boolean;
  sewingPaused: boolean;
  onToggleSewing: () => void;
  stageRef: React.RefObject<HTMLDivElement | null>;
}> = ({ editor, editMode, sewingPaused, onToggleSewing, stageRef }) => {
  const dragStateRef = useRef<{
    id: string;
    mode: 'move' | 'resize' | 'rotate';
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    origWidthPct: number;
    origRotation: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  const handlePointerDownItem = (
    e: React.PointerEvent,
    item: AtelierSceneItem,
    mode: 'move' | 'resize' | 'rotate'
  ) => {
    if (!editMode) return;
    e.stopPropagation();
    editor.selectItem(item.id);
    if (item.locked) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    editor.commitSnapshot();
    dragStateRef.current = {
      id: item.id,
      mode,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: item.x,
      origY: item.y,
      origWidthPct: item.widthPct,
      origRotation: item.rotation,
      centerX: rect.left + (item.x / 100) * rect.width,
      centerY: rect.top + (item.y / 100) * rect.height,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveItem = (e: React.PointerEvent) => {
    const st = dragStateRef.current;
    const stage = stageRef.current;
    if (!st || !stage) return;
    const rect = stage.getBoundingClientRect();
    if (st.mode === 'move') {
      const dxPct = ((e.clientX - st.startClientX) / rect.width) * 100;
      const dyPct = ((e.clientY - st.startClientY) / rect.height) * 100;
      editor.updateItem(st.id, {
        x: Math.max(4, Math.min(96, st.origX + dxPct)),
        y: Math.max(6, Math.min(96, st.origY + dyPct)),
      });
    } else if (st.mode === 'resize') {
      const dxPct = ((e.clientX - st.startClientX) / rect.width) * 100;
      editor.updateItem(st.id, {
        widthPct: Math.max(6, Math.min(44, st.origWidthPct + dxPct * 1.4)),
      });
    } else if (st.mode === 'rotate') {
      const ang =
        (Math.atan2(e.clientY - st.centerY, e.clientX - st.centerX) * 180) / Math.PI + 90;
      editor.updateItem(st.id, { rotation: Math.round(ang) });
    }
  };

  const handlePointerUpItem = () => {
    dragStateRef.current = null;
  };

  return (
    <>
      {editor.items
        .filter((it) => !it.hidden)
        .map((item) => {
          const isSelected = editMode && editor.selectedId === item.id;
          return (
            <div
              key={item.id}
              onPointerDown={(e) => handlePointerDownItem(e, item, 'move')}
              onPointerMove={handlePointerMoveItem}
              onPointerUp={handlePointerUpItem}
              onPointerCancel={handlePointerUpItem}
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: `${item.widthPct}%`,
                zIndex: item.zIndex,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
              }}
              className={`absolute transition-shadow ${
                editMode
                  ? item.locked
                    ? 'cursor-not-allowed pointer-events-auto'
                    : 'cursor-grab active:cursor-grabbing pointer-events-auto'
                  : item.kind === 'sewing-machine'
                    ? 'pointer-events-auto'
                    : 'pointer-events-none'
              } ${
                isSelected
                  ? 'ring-2 ring-[#d8b56a] ring-offset-2 ring-offset-[#fff8ed]/50 rounded-xl bg-[#fff8ed]/15'
                  : editMode
                    ? 'hover:ring-1 hover:ring-dashed hover:ring-[#b6822a]/80 rounded-xl'
                    : ''
              }`}
            >
              <AtelierPropRenderer
                kind={item.kind}
                sewingPaused={sewingPaused}
                onToggleSewing={onToggleSewing}
                editMode={editMode}
              />

              {/* Visual Editor Handles (visible ONLY in Edit Mode on selected element) */}
              {isSelected && (
                <>
                  {/* Label + Lock Pill */}
                  <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#4b2d18]/95 border border-[#d8b56a] px-2 py-0.5 text-[10px] font-semibold text-[#fff4dc] shadow">
                    {item.locked ? '🔒 ' : ''}
                    {item.label} · {Math.round(item.rotation)}°
                  </div>

                  {!item.locked && (
                    <>
                      {/* Rotation Handle */}
                      <button
                        type="button"
                        title="Arrastra para girar"
                        onPointerDown={(e) => handlePointerDownItem(e, item, 'rotate')}
                        onPointerMove={handlePointerMoveItem}
                        onPointerUp={handlePointerUpItem}
                        className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#f4d482] border-2 border-[#6b4012] text-[#4b2809] shadow-md flex items-center justify-center cursor-ew-resize"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>

                      {/* Resize Corner Handle */}
                      <button
                        type="button"
                        title="Arrastra para redimensionar"
                        onPointerDown={(e) => handlePointerDownItem(e, item, 'resize')}
                        onPointerMove={handlePointerMoveItem}
                        onPointerUp={handlePointerUpItem}
                        className="absolute -bottom-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#fff8ed] border-2 border-[#a86c1c] shadow-md flex items-center justify-center cursor-nwse-resize"
                      >
                        <span className="w-2 h-2 rounded-xs bg-[#a86c1c]" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
    </>
  );
};

/**
 * Floating Artisan Visual Editor Toolbar — Rendered STRICTLY when editMode === true
 */
export const AtelierEditorToolbar: React.FC<{
  editor: AtelierEditorController;
}> = ({ editor }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showHiddenDrawer, setShowHiddenDrawer] = useState(false);
  const hiddenItems = editor.items.filter((i) => i.hidden);
  const sel = editor.selectedItem;

  return (
    <div className="relative z-40 mx-auto w-full max-w-[1220px] px-2 sm:px-4">
      <div className="atelier-wood-plaque rounded-2xl px-2.5 py-1.5 flex flex-wrap items-center justify-between gap-1.5 text-[#fff4de]">
        {/* Left: History & Add Prop */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#d8b56a]/20 border border-[#d8b56a]/55 text-[11px] font-bold text-[#f7da92]">
            <Scissors className="w-3 h-3" />
            Editor Visual
          </span>

          <button
            type="button"
            disabled={!editor.canUndo}
            onClick={editor.undo}
            title="Deshacer (Ctrl+Z)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-40 border border-[#d8b56a]/45 text-[11px] cursor-pointer disabled:cursor-not-allowed"
          >
            <Undo2 className="w-3.5 h-3.5 text-[#f3cf7c]" />
            <span className="hidden md:inline">Deshacer</span>
          </button>

          <button
            type="button"
            disabled={!editor.canRedo}
            onClick={editor.redo}
            title="Rehacer (Ctrl+Shift+Z)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-40 border border-[#d8b56a]/45 text-[11px] cursor-pointer disabled:cursor-not-allowed"
          >
            <Redo2 className="w-3.5 h-3.5 text-[#f3cf7c]" />
            <span className="hidden md:inline">Rehacer</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddMenu((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d8b56a] hover:bg-[#e8c87e] text-[#3a1f0a] font-bold text-[11px] shadow cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Elemento</span>
            </button>

            {showAddMenu && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-48 rounded-xl atelier-crochet-cream-surface border-2 border-[#a87b46] p-1.5 shadow-2xl text-[#3b200a]">
                {PROP_ADD_CATALOG.map((p) => (
                  <button
                    key={p.kind}
                    type="button"
                    onClick={() => {
                      editor.addProp(p.kind, p.label, p.widthPct);
                      setShowAddMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#e8cfa8] text-xs font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <span>{p.label}</span>
                    <Plus className="w-3 h-3 text-[#7a4b16]" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Selected Item Actions */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            disabled={!sel}
            onClick={editor.copySelected}
            title="Copiar (Ctrl+C)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-35 border border-[#d8b56a]/45 text-[11px] cursor-pointer disabled:cursor-not-allowed"
          >
            <Copy className="w-3.5 h-3.5 text-[#f3cf7c]" />
            <span className="hidden xl:inline">Copiar</span>
          </button>

          <button
            type="button"
            disabled={!editor.clipboard}
            onClick={editor.pasteClipboard}
            title="Pegar (Ctrl+V)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-35 border border-[#d8b56a]/45 text-[11px] cursor-pointer disabled:cursor-not-allowed"
          >
            <Clipboard className="w-3.5 h-3.5 text-[#f3cf7c]" />
            <span className="hidden xl:inline">Pegar</span>
          </button>

          <button
            type="button"
            disabled={!sel}
            onClick={editor.duplicateSelected}
            title="Duplicar elemento (Ctrl+D)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-35 border border-[#d8b56a]/45 text-[11px] cursor-pointer disabled:cursor-not-allowed"
          >
            <Layers className="w-3.5 h-3.5 text-[#f3cf7c]" />
            <span className="hidden lg:inline">Duplicar</span>
          </button>

          <button
            type="button"
            disabled={!sel || sel.locked}
            onClick={() => editor.rotateSelected(-15)}
            title="Girar -15°"
            className="p-1.5 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-35 border border-[#d8b56a]/45 cursor-pointer disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#f3cf7c]" />
          </button>

          <button
            type="button"
            disabled={!sel || sel.locked}
            onClick={() => editor.rotateSelected(15)}
            title="Girar +15°"
            className="p-1.5 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-35 border border-[#d8b56a]/45 cursor-pointer disabled:cursor-not-allowed"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#f3cf7c]" />
          </button>

          <button
            type="button"
            disabled={!sel || sel.locked}
            onClick={() => editor.resizeSelected(-2)}
            title="Reducir tamaño"
            className="px-2 py-1 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-35 border border-[#d8b56a]/45 text-[11px] font-bold cursor-pointer disabled:cursor-not-allowed"
          >
            A-
          </button>

          <button
            type="button"
            disabled={!sel || sel.locked}
            onClick={() => editor.resizeSelected(2)}
            title="Aumentar tamaño"
            className="px-2 py-1 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-35 border border-[#d8b56a]/45 text-[11px] font-bold cursor-pointer disabled:cursor-not-allowed"
          >
            A+
          </button>

          <button
            type="button"
            disabled={!sel}
            onClick={() => sel && editor.stepLayer(sel.id, 'up')}
            title="Traer hacia delante"
            className="p-1.5 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-35 border border-[#d8b56a]/45 cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowUp className="w-3.5 h-3.5 text-[#f3cf7c]" />
          </button>

          <button
            type="button"
            disabled={!sel}
            onClick={() => sel && editor.stepLayer(sel.id, 'down')}
            title="Enviar hacia atrás"
            className="p-1.5 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-35 border border-[#d8b56a]/45 cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowDown className="w-3.5 h-3.5 text-[#f3cf7c]" />
          </button>

          <button
            type="button"
            disabled={!sel}
            onClick={editor.toggleLockSelected}
            title={sel?.locked ? 'Desbloquear' : 'Bloquear'}
            className={`p-1.5 rounded-lg border cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
              sel?.locked
                ? 'bg-[#d8b56a] text-[#3a1f0a] border-[#fff0c4]'
                : 'bg-[#3b2110]/85 hover:bg-[#5c361d] border-[#d8b56a]/45 text-[#f3cf7c]'
            }`}
          >
            {sel?.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            disabled={!sel}
            onClick={() => sel && editor.toggleHideItem(sel.id)}
            title="Ocultar elemento"
            className="p-1.5 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] disabled:opacity-35 border border-[#d8b56a]/45 text-[#f3cf7c] cursor-pointer disabled:cursor-not-allowed"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={!sel || sel.locked}
            onClick={editor.deleteSelected}
            title="Eliminar (Supr)"
            className="p-1.5 rounded-lg bg-[#6b1e28]/90 hover:bg-[#8c2734] disabled:opacity-35 border border-[#e29aa4]/55 text-[#ffe6e9] cursor-pointer disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Hidden restore, Reset, Auto-save badge */}
        <div className="flex items-center gap-1.5">
          {hiddenItems.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHiddenDrawer((v) => !v)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#4c2e19] hover:bg-[#653d22] border border-[#d8b56a]/55 text-[11px] cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#f3cf7c]" />
                <span>Ocultos ({hiddenItems.length})</span>
              </button>
              {showHiddenDrawer && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl atelier-crochet-cream-surface border-2 border-[#a87b46] p-1.5 shadow-2xl text-[#3b200a]">
                  {hiddenItems.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => editor.toggleHideItem(h.id)}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#e8cfa8] text-xs font-semibold flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{h.label}</span>
                      <Eye className="w-3.5 h-3.5 text-[#6b4418] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={editor.resetAll}
            title="Restaurar elementos originales"
            className="px-2 py-1 rounded-lg bg-[#3b2110]/85 hover:bg-[#5c361d] border border-[#d8b56a]/45 text-[11px] cursor-pointer"
          >
            Restaurar
          </button>

          {editor.autoSavedAt && (
            <span className="hidden sm:inline text-[10px] text-[#e7cda0]/85 font-mono-tab">
              Auto-guardado {editor.autoSavedAt}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
