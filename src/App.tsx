import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { User } from 'firebase/auth';
import { CoverScreen } from './components/CoverScreen';
import { CrochetTransition } from './components/CrochetTransition';
import { TopStudioBar } from './components/TopStudioBar';
import { NotebookSpread } from './components/NotebookSpread';
import { PatternsView } from './components/PatternsView';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import {
  BrushesQuickView,
  FontsView,
  HelpModal,
  SettingsView,
  StickersAndImagesView,
} from './components/StudioUtilityViews';
import { DEFAULT_WORKSPACE } from './data/seedData';
import { CROCHET_ALPHABET } from './data/crochetAlphabet';
import type {
  ActiveCanvasTool,
  BrushSettings,
  CopiedPatternData,
  CrochetPattern,
  FontChoice,
  NotebookSpread as SpreadType,
  NotebookWorkspaceData,
  PageElement,
  ShapeKind,
  StudioSection,
} from './types/crochet';
import { audioEngine } from './utils/audioEngine';
import {
  compressImageFile,
  exportWorkspaceJson,
  loadWorkspace,
  saveWorkspace,
} from './utils/storage';
import { getDriveAccessToken, initDriveAuth } from './utils/googleDrive';

export default function App() {
  const [workspace, setWorkspace] = useState<NotebookWorkspaceData>(DEFAULT_WORKSPACE);
  const [loaded, setLoaded] = useState(false);

  // View state: 'cover' -> 'transitioning' -> 'studio'
  const [bookState, setBookState] = useState<'cover' | 'transitioning' | 'studio'>('cover');
  const [activeSection, setActiveSection] = useState<StudioSection>('cuaderno');
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<ActiveCanvasTool>('select');
  const [selectedShapeKind, setSelectedShapeKind] = useState<ShapeKind>('crochet-ring');

  const [brush, setBrush] = useState<BrushSettings>({
    category: 'tizas',
    preset: 'tiza-suave',
    color: '#4E2712',
    size: 16,
    opacity: 85,
    softness: 65,
  });

  // Undo / Redo stacks for notebook spreads
  const [undoStack, setUndoStack] = useState<SpreadType[][]>([]);
  const [redoStack, setRedoStack] = useState<SpreadType[][]>([]);
  const [copiedPattern, setCopiedPattern] = useState<CopiedPatternData | null>(null);

  const [musicPlaying, setMusicPlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // Google Drive Auth & Modal state (in-memory token only)
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveNeedsAuth, setDriveNeedsAuth] = useState(true);
  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [driveInitialTab, setDriveInitialTab] = useState<'backups' | 'images' | 'all'>('backups');

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (u) => {
        setDriveUser(u);
        setDriveNeedsAuth(!getDriveAccessToken());
      },
      () => {
        setDriveNeedsAuth(true);
      }
    );
    return unsubscribe;
  }, []);

  const catalogSpreadCount = Math.ceil((CROCHET_ALPHABET.length + workspace.patterns.length) / 8);

  // Initial load from IndexedDB
  useEffect(() => {
    void loadWorkspace().then((data) => {
      setWorkspace(data);
      audioEngine.setMusicVolume(data.musicVolume);
      audioEngine.setSfxEnabled(data.sfxEnabled);
      audioEngine.setAmbientWarmth(data.ambientWarmth);
      setLoaded(true);
    });
  }, []);

  // Auto-persist workspace changes (debounced 900ms for smooth performance)
  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      void saveWorkspace(workspace);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [workspace, loaded]);

  const showToast = useCallback((msg: string) => {
    setSavedToast(msg);
    window.setTimeout(() => setSavedToast(null), 2200);
  }, []);

  const handleToggleMusic = () => {
    const next = audioEngine.toggleMusic();
    setMusicPlaying(next);
    setWorkspace((prev) => ({ ...prev, musicEnabled: next }));
  };

  const handleOpenBook = () => {
    audioEngine.playBookOpen();
    if (!audioEngine.getIsPlaying()) {
      audioEngine.startMusic();
      setMusicPlaying(true);
    }
    setBookState('transitioning');
    window.setTimeout(() => {
      setBookState('studio');
    }, 1350);
  };

  const handleReturnToCover = () => {
    audioEngine.playPageFlip();
    setBookState('cover');
  };

  // Spread update with bounded undo tracking
  const updateCurrentSpread = useCallback((updated: SpreadType) => {
    setWorkspace((prev) => {
      setUndoStack((u) => [...u.slice(-11), prev.spreads]);
      setRedoStack([]);
      return {
        ...prev,
        spreads: prev.spreads.map((sp) => (sp.id === updated.id ? updated : sp)),
      };
    });
  }, []);

  const handleAddSpread = () => {
    audioEngine.playPageFlip();
    setUndoStack((prev) => [...prev.slice(-11), workspace.spreads]);
    setRedoStack([]);
    const newSpread: SpreadType = {
      id: `spread-${Date.now()}`,
      title: `Hoja ${workspace.spreads.length + 1} · Bocetos y Puntos`,
      paperStyle: 'grid',
      elements: [],
      updatedAt: new Date().toISOString(),
    };
    setWorkspace((prev) => {
      const nextSpreads = [...prev.spreads, newSpread];
      setCurrentSpreadIndex(catalogSpreadCount + nextSpreads.length - 1);
      return { ...prev, spreads: nextSpreads };
    });
    setActiveSection('cuaderno');
    showToast('Nueva hoja añadida');
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, workspace.spreads]);
    setUndoStack((u) => u.slice(0, -1));
    setWorkspace((prev) => ({ ...prev, spreads: previous }));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, workspace.spreads]);
    setRedoStack((r) => r.slice(0, -1));
    setWorkspace((prev) => ({ ...prev, spreads: next }));
  };

  const handleSelectColor = (hex: string) => {
    setBrush((prev) => ({ ...prev, color: hex }));
    setWorkspace((prev) => ({
      ...prev,
      recentColors: [
        hex,
        ...prev.recentColors.filter((c) => c.toUpperCase() !== hex.toUpperCase()),
      ].slice(0, 8),
    }));
  };

  const getActiveEditableSpread = (): SpreadType | null => {
    if (currentSpreadIndex >= catalogSpreadCount) {
      return workspace.spreads[currentSpreadIndex - catalogSpreadCount] ?? workspace.spreads[0] ?? null;
    }
    return workspace.spreads[0] ?? null;
  };

  const insertElementOnCurrentSpread = (el: Omit<PageElement, 'id'>) => {
    const target = getActiveEditableSpread();
    if (!target) return;
    if (currentSpreadIndex < catalogSpreadCount) {
      setCurrentSpreadIndex(catalogSpreadCount);
    }
    const newEl: PageElement = { ...el, id: `el-${Date.now()}` };
    updateCurrentSpread({
      ...target,
      elements: [...target.elements, newEl],
      updatedAt: new Date().toISOString(),
    });
    setActiveSection('cuaderno');
    setActiveTool('select');
  };

  const handleNotebookImageFile = async (file: File) => {
    const dataUrl = await compressImageFile(file, 900);
    insertElementOnCurrentSpread({
      side: 'right',
      type: 'image',
      x: 16,
      y: 22,
      width: 210,
      content: dataUrl,
      title: file.name.replace(/\.[^/.]+$/, ''),
      rotation: -1,
      frameStyle: 'polaroid',
    });
    showToast('Imagen añadida al cuaderno');
  };

  const handleCopyPattern = useCallback(
    (pat: CopiedPatternData) => {
      audioEngine.playStitchClick();
      setCopiedPattern(pat);
      showToast(`Símbolo copiado: ${pat.name}`);
    },
    [showToast]
  );

  const handlePastePatternOnSpread = useCallback(
    (spreadId: string, side: 'left' | 'right' = 'left') => {
      if (!copiedPattern) return;
      const target = workspace.spreads.find((sp) => sp.id === spreadId) ?? workspace.spreads[0];
      if (!target) return;
      const existingSymbols = target.elements.filter(
        (e) => e.side === side && e.type === 'pattern-note'
      ).length;
      const cols = 8;
      const col = existingSymbols % cols;
      const row = Math.floor(existingSymbols / cols) % 7;
      const offsetX = 10 + col * 9.5;
      const offsetY = 14 + row * 10;

      const newEl: PageElement = {
        id: `el-${Date.now()}`,
        side,
        type: 'pattern-note',
        x: offsetX,
        y: offsetY,
        width: 44,
        content: copiedPattern.stitchKey,
        color: brush.color,
        patternData: { ...copiedPattern },
      };

      updateCurrentSpread({
        ...target,
        elements: [...target.elements, newEl],
        updatedAt: new Date().toISOString(),
      });
      setActiveTool('select');
      showToast(`Símbolo pegado: ${copiedPattern.abbreviation || copiedPattern.name}`);
    },
    [copiedPattern, workspace.spreads, brush.color, updateCurrentSpread, showToast]
  );

  const handleClearPageStrokes = () => {
    if (currentSpreadIndex < catalogSpreadCount) {
      showToast('El catálogo inicial no tiene trazos; ve a Mis Hojas para dibujar');
      return;
    }
    const target = getActiveEditableSpread();
    if (!target) return;
    updateCurrentSpread({
      ...target,
      leftDrawingDataUrl: undefined,
      rightDrawingDataUrl: undefined,
    });
    showToast('Trazos de la página limpiados');
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as NotebookWorkspaceData;
        if (parsed.spreads && parsed.patterns && parsed.materials) {
          setWorkspace({ ...DEFAULT_WORKSPACE, ...parsed });
          setCurrentSpreadIndex(0);
          showToast('Cuaderno restaurado');
        }
      } catch {
        showToast('Archivo de respaldo inválido');
      }
    };
    reader.readAsText(file);
  };

  // Pattern CRUD
  const handleSavePattern = (pat: CrochetPattern) => {
    setWorkspace((prev) => {
      const exists = prev.patterns.some((p) => p.id === pat.id);
      return {
        ...prev,
        patterns: exists
          ? prev.patterns.map((p) => (p.id === pat.id ? pat : p))
          : [pat, ...prev.patterns],
      };
    });
  };

  const handleDeletePattern = (id: string) => {
    setWorkspace((prev) => ({
      ...prev,
      patterns: prev.patterns.filter((p) => p.id !== id),
    }));
  };

  return (
    <div className="min-h-screen w-full bg-[#1a0f08] text-[#f5e7cf] overflow-hidden">
      {/* Hidden global image input for inserting directly into notebook */}
      <input
        ref={imageUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleNotebookImageFile(f);
          e.target.value = '';
        }}
      />

      {/* Beautiful Crochet Lace Transition Overlay */}
      <AnimatePresence>
        {bookState === 'transitioning' && <CrochetTransition active />}
      </AnimatePresence>

      {/* Cover Screen (1st photo) */}
      {bookState !== 'studio' && (
        <CoverScreen
          musicPlaying={musicPlaying}
          onToggleMusic={handleToggleMusic}
          onOpenBook={handleOpenBook}
        />
      )}

      {/* Open Studio Workspace (2nd photo aesthetic & full crochet details) */}
      {bookState === 'studio' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="h-screen w-screen flex flex-col overflow-hidden"
        >
          <TopStudioBar
            activeSection={activeSection}
            patternCount={workspace.patterns.length}
            activeTool={activeTool}
            selectedShapeKind={selectedShapeKind}
            onSelectShapeKind={setSelectedShapeKind}
            brush={brush}
            recentColors={workspace.recentColors}
            onChangeBrush={(patch) => setBrush((prev) => ({ ...prev, ...patch }))}
            onSelectColor={handleSelectColor}
            onSelectTool={setActiveTool}
            onClearPageStrokes={handleClearPageStrokes}
            onNewPage={handleAddSpread}
            onExportBackup={() => {
              exportWorkspaceJson(workspace);
              showToast('Respaldo exportado');
            }}
            onImportBackup={handleImportBackup}
            onSaveNow={() => {
              void saveWorkspace(workspace);
              showToast('Cuaderno guardado');
            }}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onOpenImageUpload={() => imageUploadRef.current?.click()}
            onGoToSection={(sec) => {
              audioEngine.playStitchClick();
              setActiveSection(sec);
            }}
            musicPlaying={musicPlaying}
            onToggleMusic={handleToggleMusic}
            onOpenHelp={() => setShowHelp(true)}
            onReturnToCover={handleReturnToCover}
            onOpenDrive={(tab = 'backups') => {
              setDriveInitialTab(tab);
              setDriveModalOpen(true);
            }}
            driveConnected={!driveNeedsAuth && driveUser !== null}
            savedToast={savedToast}
          />

          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Main Center Stage */}
            <main className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
              {activeSection === 'cuaderno' && (
                <NotebookSpread
                  spreads={workspace.spreads}
                  patterns={workspace.patterns}
                  currentSpreadIndex={currentSpreadIndex}
                  onChangeSpreadIndex={setCurrentSpreadIndex}
                  onAddSpread={handleAddSpread}
                  onUpdateSpread={updateCurrentSpread}
                  activeTool={activeTool}
                  onSelectTool={setActiveTool}
                  selectedShapeKind={selectedShapeKind}
                  brush={brush}
                  onPickColorFromCanvas={(hex) => {
                    handleSelectColor(hex);
                    setActiveTool('draw');
                    showToast(`Color capturado: ${hex}`);
                  }}
                  selectedFont={workspace.selectedFont}
                  copiedPattern={copiedPattern}
                  onCopyPattern={handleCopyPattern}
                  onPastePatternOnSpread={handlePastePatternOnSpread}
                  onPlayPageFlip={() => audioEngine.playPageFlip()}
                  onNotify={showToast}
                />
              )}

              {activeSection === 'patrones' && (
                <PatternsView
                  patterns={workspace.patterns}
                  onSavePattern={handleSavePattern}
                  onDeletePattern={handleDeletePattern}
                  onPlayStitchClick={() => audioEngine.playStitchClick()}
                  onPinStitchToNotebook={(entry) => {
                    const target = getActiveEditableSpread();
                    const count = target
                      ? target.elements.filter((e) => e.side === 'left' && e.type === 'pattern-note').length
                      : 0;
                    const col = count % 8;
                    const row = Math.floor(count / 8) % 7;
                    insertElementOnCurrentSpread({
                      side: 'left',
                      type: 'pattern-note',
                      x: 10 + col * 9.5,
                      y: 14 + row * 10,
                      width: 44,
                      content: entry.stitchKey,
                      color: brush.color,
                      patternData: {
                        id: entry.id,
                        stitchKey: entry.stitchKey,
                        name: entry.name,
                        abbreviation: entry.abbreviation,
                        description: entry.description,
                        letter: entry.letter,
                        group: entry.group,
                      },
                    });
                    showToast('Símbolo pegado en el cuaderno');
                  }}
                  onPinPatternToNotebook={(pat) => {
                    insertElementOnCurrentSpread({
                      side: 'left',
                      type: 'pattern-note',
                      x: 10,
                      y: 16,
                      width: 260,
                      content: pat.title,
                      patternData: {
                        id: pat.id,
                        stitchKey: 'custom',
                        name: pat.title,
                        abbreviation: pat.hookSizeMm,
                        description: `${pat.materialsSummary} · Vuelta ${pat.currentRound}/${pat.steps.length}`,
                        diagramGrid: pat.diagramGrid,
                      },
                    });
                    showToast('Patrón pegado en el cuaderno');
                  }}
                />
              )}

              {activeSection === 'stickers' && (
                <StickersAndImagesView
                  onInsertSticker={(stickerId) => {
                    const target = getActiveEditableSpread();
                    const stickerCount = target
                      ? target.elements.filter((e) => e.type === 'sticker').length
                      : 0;
                    const side = stickerCount % 2 === 0 ? 'left' : 'right';
                    const offsetX = 16 + ((stickerCount * 13) % 52);
                    const offsetY = 18 + ((stickerCount * 15) % 54);
                    insertElementOnCurrentSpread({
                      side,
                      type: 'sticker',
                      x: offsetX,
                      y: offsetY,
                      width: 108,
                      content: stickerId,
                      rotation: (stickerCount % 3 - 1) * 5,
                    });
                    showToast('Sticker añadido al cuaderno');
                  }}
                  onUploadImageToNotebook={() => imageUploadRef.current?.click()}
                />
              )}

              {activeSection === 'fuentes' && (
                <FontsView
                  selectedFont={workspace.selectedFont}
                  onSelectFont={(font: FontChoice) =>
                    setWorkspace((prev) => ({ ...prev, selectedFont: font }))
                  }
                />
              )}

              {activeSection === 'pinceles' && (
                <BrushesQuickView
                  brush={brush}
                  onChangeBrush={(patch) => setBrush((prev) => ({ ...prev, ...patch }))}
                  onActivateDrawMode={() => {
                    setActiveTool('draw');
                    setActiveSection('cuaderno');
                  }}
                />
              )}

              {activeSection === 'configuracion' && (
                <SettingsView
                  musicPlaying={musicPlaying}
                  musicVolume={workspace.musicVolume}
                  sfxEnabled={workspace.sfxEnabled}
                  ambientWarmth={workspace.ambientWarmth}
                  onToggleMusic={handleToggleMusic}
                  onChangeVolume={(vol) => {
                    audioEngine.setMusicVolume(vol);
                    setWorkspace((prev) => ({ ...prev, musicVolume: vol }));
                  }}
                  onToggleSfx={() => {
                    const next = !workspace.sfxEnabled;
                    audioEngine.setSfxEnabled(next);
                    setWorkspace((prev) => ({ ...prev, sfxEnabled: next }));
                  }}
                  onToggleWarmth={() => {
                    const next = !workspace.ambientWarmth;
                    audioEngine.setAmbientWarmth(next);
                    setWorkspace((prev) => ({ ...prev, ambientWarmth: next }));
                  }}
                  onExportBackup={() => {
                    exportWorkspaceJson(workspace);
                    showToast('Respaldo exportado');
                  }}
                  onImportBackup={handleImportBackup}
                  onResetDemoData={() => {
                    setWorkspace(DEFAULT_WORKSPACE);
                    setCurrentSpreadIndex(0);
                    showToast('Cuaderno inicial restaurado');
                  }}
                />
              )}
            </main>
          </div>
        </motion.div>
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <GoogleDriveModal
        isOpen={driveModalOpen}
        initialTab={driveInitialTab}
        onClose={() => setDriveModalOpen(false)}
        workspace={workspace}
        needsAuth={driveNeedsAuth}
        user={driveUser}
        onAuthChanged={(u, needs) => {
          setDriveUser(u);
          setDriveNeedsAuth(needs);
        }}
        onRestoreWorkspace={(data) => {
          setWorkspace({ ...DEFAULT_WORKSPACE, ...data });
          setCurrentSpreadIndex(0);
          setActiveSection('cuaderno');
        }}
        onInsertDriveImage={handleNotebookImageFile}
        onNotify={showToast}
      />
    </div>
  );
}
