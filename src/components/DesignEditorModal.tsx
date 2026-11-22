import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Crop,
  FileImage,
  Heart,
  ImagePlus,
  Plus,
  Save,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import type {
  CrochetAttachmentPhoto,
  CrochetTechSheet,
  DressingRoomCategory,
  DressingRoomGarment,
  GarmentAnglePhotos,
  NonDestructiveCrop,
} from '../types/crochet';
import { YARN_BALL_COLORS } from '../data/glbAssetManifest';
import { ArtisanYarnBallSwatch } from './ArtisanCrochetDecorations';
import {
  getNonDestructiveCropStyle,
  NonDestructiveCropModal,
} from './NonDestructiveCropModal';
import { compressImageFile } from '../utils/storage';
import { audioEngine } from '../utils/audioEngine';

export const NEW_CATALOG_CATEGORIES: Array<{
  id: DressingRoomCategory;
  label: string;
  slot: 'top' | 'bottom';
}> = [
  { id: 'Camisas', label: 'Camisas', slot: 'top' },
  { id: 'Pulóveres', label: 'Pulóveres', slot: 'top' },
  { id: 'Enguatadas', label: 'Enguatadas', slot: 'top' },
  { id: 'Cárdigans', label: 'Cárdigans', slot: 'top' },
  { id: 'Chalecos', label: 'Chalecos', slot: 'top' },
  { id: 'Shorts', label: 'Shorts', slot: 'bottom' },
  { id: 'Pantalones', label: 'Pantalones', slot: 'bottom' },
];

type AngleKey = keyof GarmentAnglePhotos;

const ANGLE_SLOTS: Array<{ key: AngleKey; label: string; angleLabel: string }> = [
  { key: 'front', label: 'Frente', angleLabel: '0°' },
  { key: 'profileLeft', label: 'Perfil Izq.', angleLabel: '90°' },
  { key: 'back', label: 'Espalda', angleLabel: '180°' },
  { key: 'profileRight', label: 'Perfil Der.', angleLabel: '270°' },
];

function guessAngleFromFilename(fileName: string): AngleKey | null {
  const n = fileName.toLowerCase();
  if (/espalda|back|tras|rear|180/.test(n)) return 'back';
  if (/izq|left|90/.test(n)) return 'profileLeft';
  if (/der|right|270/.test(n)) return 'profileRight';
  if (/frente|front|delant|0/.test(n)) return 'front';
  return null;
}

interface DesignEditorModalProps {
  isOpen: boolean;
  defaultCategory: DressingRoomCategory;
  editingGarment: DressingRoomGarment | null;
  soundEnabled?: boolean;
  onClose: () => void;
  onSave: (garment: DressingRoomGarment) => void;
  onDelete?: (garmentId: string) => void;
}

export const DesignEditorModal: React.FC<DesignEditorModalProps> = ({
  isOpen,
  defaultCategory,
  editingGarment,
  soundEnabled = false,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DressingRoomCategory>(defaultCategory);
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>(['crema']);
  const [fiber, setFiber] = useState('100% Algodón Peinado Crochet');
  const [hookSizeMm, setHookSizeMm] = useState('3.25 mm');
  const [subtitle, setSubtitle] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');

  const [garmentViews, setGarmentViews] = useState<GarmentAnglePhotos>({});
  const [modelViews, setModelViews] = useState<GarmentAnglePhotos>({});
  const [photoCrops, setPhotoCrops] = useState<Record<string, NonDestructiveCrop>>({});
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Discreet collapsible Crochet Tech Sheet state
  const [techSheetOpen, setTechSheetOpen] = useState(false);
  const [stitchType, setStitchType] = useState('');
  const [yarnWeight, setYarnWeight] = useState('');
  const [materials, setMaterials] = useState('');
  const [measurementsText, setMeasurementsText] = useState('');
  const [seamDetails, setSeamDetails] = useState('');
  const [craftingNotes, setCraftingNotes] = useState('');
  const [detailPhotos, setDetailPhotos] = useState<CrochetAttachmentPhoto[]>([]);
  const [patternPhotos, setPatternPhotos] = useState<CrochetAttachmentPhoto[]>([]);

  // Active non-destructive crop modal state
  const [cropTarget, setCropTarget] = useState<{
    key: string;
    src: string;
    label: string;
    aspectClass: string;
  } | null>(null);

  const playSfx = (kind: 'click' | 'pluck' | 'save') => {
    if (!soundEnabled) return;
    if (kind === 'pluck') audioEngine.playYarnPluck(3);
    else if (kind === 'save') audioEngine.playSaveChime();
    else audioEngine.playStitchClick();
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setTagDraft('');
    setCropTarget(null);

    if (editingGarment) {
      setName(editingGarment.name || '');
      const validCat = NEW_CATALOG_CATEGORIES.some((c) => c.id === editingGarment.category)
        ? editingGarment.category
        : defaultCategory;
      setCategory(validCat);
      setSelectedColorIds(
        editingGarment.availableColorIds && editingGarment.availableColorIds.length > 0
          ? editingGarment.availableColorIds
          : ['crema']
      );
      setFiber(editingGarment.fiber || '100% Algodón Peinado Crochet');
      setHookSizeMm(editingGarment.hookSizeMm || '3.25 mm');
      setSubtitle(editingGarment.subtitle || '');
      setFavorite(Boolean(editingGarment.favorite));
      setTags(editingGarment.tags ? [...editingGarment.tags] : []);
      setGarmentViews({
        front: editingGarment.garmentViews?.front || editingGarment.photoDataUrl,
        profileLeft: editingGarment.garmentViews?.profileLeft,
        back: editingGarment.garmentViews?.back || editingGarment.backPhotoDataUrl,
        profileRight: editingGarment.garmentViews?.profileRight,
      });
      setModelViews({ ...(editingGarment.modelViews ?? {}) });
      setPhotoCrops({ ...(editingGarment.photoCrops ?? {}) });

      const ts = editingGarment.techSheet;
      setStitchType(ts?.stitchType || '');
      setYarnWeight(ts?.yarnWeight || '');
      setMaterials(ts?.materials || '');
      setMeasurementsText(ts?.measurementsText || '');
      setSeamDetails(ts?.seamDetails || '');
      setCraftingNotes(ts?.craftingNotes || '');
      setDetailPhotos(ts?.detailPhotos ? [...ts.detailPhotos] : []);
      setPatternPhotos(ts?.patternPhotos ? [...ts.patternPhotos] : []);
      setTechSheetOpen(
        Boolean(
          ts?.stitchType ||
            ts?.yarnWeight ||
            ts?.materials ||
            ts?.measurementsText ||
            ts?.seamDetails ||
            ts?.craftingNotes ||
            (ts?.detailPhotos && ts.detailPhotos.length > 0) ||
            (ts?.patternPhotos && ts.patternPhotos.length > 0)
        )
      );
    } else {
      setName('');
      setCategory(defaultCategory);
      setSelectedColorIds(['crema']);
      setFiber('100% Algodón Peinado Crochet');
      setHookSizeMm('3.25 mm');
      setSubtitle('');
      setFavorite(false);
      setTags([]);
      setGarmentViews({});
      setModelViews({});
      setPhotoCrops({});
      setStitchType('');
      setYarnWeight('');
      setMaterials('');
      setMeasurementsText('');
      setSeamDetails('');
      setCraftingNotes('');
      setDetailPhotos([]);
      setPatternPhotos([]);
      setTechSheetOpen(false);
    }
  }, [isOpen, editingGarment, defaultCategory]);

  if (!isOpen) return null;

  const toggleColor = (colorId: string) => {
    playSfx('pluck');
    setSelectedColorIds((prev) => {
      if (prev.includes(colorId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== colorId);
      }
      return [...prev, colorId];
    });
  };

  const handleAddTag = () => {
    const clean = tagDraft.trim().replace(/^#/, '');
    if (!clean) return;
    if (!tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      setTags((prev) => [...prev, clean]);
    }
    setTagDraft('');
  };

  const handlePhotoUpload = async (
    target: 'garment' | 'model',
    angle: AngleKey,
    file: File
  ) => {
    const slotKey = `${target}-${angle}`;
    setUploadingSlot(slotKey);
    setErrorMsg(null);
    try {
      const maxDim = target === 'model' ? 1440 : 1200;
      const dataUrl = await compressImageFile(file, maxDim, true);
      playSfx('click');
      if (target === 'garment') {
        setGarmentViews((prev) => ({ ...prev, [angle]: dataUrl }));
      } else {
        setModelViews((prev) => ({ ...prev, [angle]: dataUrl }));
      }
    } catch {
      setErrorMsg('No se pudo procesar la imagen seleccionada. Prueba con PNG, JPG o WEBP.');
    } finally {
      setUploadingSlot(null);
    }
  };

  /** Batch multi-file upload into garment or model views (auto-assigns angle by filename or next empty slot) */
  const handleBatchAngleUpload = async (target: 'garment' | 'model', files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setUploadingSlot(`${target}-batch`);
    setErrorMsg(null);
    try {
      const maxDim = target === 'model' ? 1440 : 1200;
      const current = target === 'garment' ? { ...garmentViews } : { ...modelViews };
      const allKeys: AngleKey[] = ['front', 'profileLeft', 'back', 'profileRight'];

      for (const file of imageFiles) {
        const guessed = guessAngleFromFilename(file.name);
        let slot: AngleKey | undefined = guessed && !current[guessed] ? guessed : undefined;
        if (!slot) {
          slot = allKeys.find((k) => !current[k]) ?? guessed ?? 'front';
        }
        const dataUrl = await compressImageFile(file, maxDim, true);
        current[slot] = dataUrl;
      }

      if (target === 'garment') setGarmentViews(current);
      else setModelViews(current);
      playSfx('click');
    } catch {
      setErrorMsg('Algunas imágenes no pudieron procesarse. Comprueba el formato PNG, JPG o WEBP.');
    } finally {
      setUploadingSlot(null);
    }
  };

  /** Multi-file upload for crochet detail photos or pattern charts */
  const handleTechAttachmentUpload = async (
    kind: 'detail' | 'pattern',
    files: FileList | File[]
  ) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    setUploadingSlot(`tech-${kind}`);
    try {
      const additions: CrochetAttachmentPhoto[] = [];
      for (const f of imageFiles) {
        const dataUrl = await compressImageFile(f, 1440, true);
        additions.push({
          id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          label: f.name.replace(/\.[^.]+$/, '').slice(0, 36) || (kind === 'detail' ? 'Detalle' : 'Patrón'),
          dataUrl,
          addedAt: new Date().toISOString(),
        });
      }
      if (kind === 'detail') setDetailPhotos((prev) => [...prev, ...additions]);
      else setPatternPhotos((prev) => [...prev, ...additions]);
      playSfx('click');
    } catch {
      setErrorMsg('No se pudieron adjuntar las fotografías de ficha técnica.');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleRemovePhoto = (target: 'garment' | 'model', angle: AngleKey) => {
    playSfx('click');
    const cropKey = `${target}-${angle}`;
    setPhotoCrops((prev) => {
      const next = { ...prev };
      delete next[cropKey];
      return next;
    });
    if (target === 'garment') {
      setGarmentViews((prev) => {
        const next = { ...prev };
        delete next[angle];
        return next;
      });
    } else {
      setModelViews((prev) => {
        const next = { ...prev };
        delete next[angle];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Por favor escribe un nombre para tu diseño.');
      return;
    }

    const primaryGarmentPhoto =
      garmentViews.front ||
      garmentViews.profileLeft ||
      garmentViews.back ||
      garmentViews.profileRight ||
      modelViews.front;

    const chosenColorOptions = selectedColorIds
      .map((id) => YARN_BALL_COLORS.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    const palette =
      chosenColorOptions.length > 0 ? chosenColorOptions.map((c) => c.hex) : ['#F0DEC1'];

    const catMeta =
      NEW_CATALOG_CATEGORIES.find((c) => c.id === category) ?? NEW_CATALOG_CATEGORIES[0];

    const hasTechSheet = Boolean(
      stitchType.trim() ||
        yarnWeight.trim() ||
        materials.trim() ||
        measurementsText.trim() ||
        seamDetails.trim() ||
        craftingNotes.trim() ||
        detailPhotos.length > 0 ||
        patternPhotos.length > 0
    );

    const techSheet: CrochetTechSheet | undefined = hasTechSheet
      ? {
          stitchType: stitchType.trim() || undefined,
          yarnWeight: yarnWeight.trim() || undefined,
          materials: materials.trim() || undefined,
          hookSize: hookSizeMm.trim() || undefined,
          measurementsText: measurementsText.trim() || undefined,
          seamDetails: seamDetails.trim() || undefined,
          craftingNotes: craftingNotes.trim() || undefined,
          detailPhotos: detailPhotos.length > 0 ? detailPhotos : undefined,
          patternPhotos: patternPhotos.length > 0 ? patternPhotos : undefined,
        }
      : undefined;

    const now = new Date().toISOString();
    const savedGarment: DressingRoomGarment = {
      id: editingGarment?.id || `design-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmedName,
      category: catMeta.id,
      garmentSlot: catMeta.slot,
      eyebrow: 'COLECCIÓN FUENTES NAZCO',
      subtitle: subtitle.trim() || `Diseño artesanal de crochet · ${catMeta.label}.`,
      fiber: fiber.trim() || '100% Algodón Peinado Crochet',
      hookSizeMm: hookSizeMm.trim() || '3.25 mm',
      stitchNote:
        stitchType.trim() ||
        subtitle.trim() ||
        'Guardado en tu catálogo de El Vestidor Dorado.',
      palette,
      accentColor: palette[0],
      photoDataUrl: primaryGarmentPhoto,
      backPhotoDataUrl: garmentViews.back,
      garmentViews: { ...garmentViews },
      modelViews: { ...modelViews },
      photoCrops: Object.keys(photoCrops).length > 0 ? { ...photoCrops } : undefined,
      availableColorIds: [...selectedColorIds],
      favorite,
      tags: tags.length > 0 ? [...tags] : undefined,
      sortOrder: editingGarment?.sortOrder,
      techSheet,
      createdAt: editingGarment?.createdAt || now,
      updatedAt: now,
      isCustom: true,
    };

    playSfx('save');
    onSave(savedGarment);
  };

  const garmentPhotoCount = Object.values(garmentViews).filter(Boolean).length;
  const modelPhotoCount = Object.values(modelViews).filter(Boolean).length;
  const techAttachmentCount = detailPhotos.length + patternPhotos.length;

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editingGarment ? 'Editar diseño de crochet' : 'Añadir nuevo diseño'}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#321b0f]/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[26px] border-[5px] border-[#e7a6ad] bg-[#fbf0df] text-[#452412] shadow-[0_24px_60px_rgba(48,20,8,0.45)] overflow-hidden"
        >
          {/* Warm Carved Wood Header */}
          <div
            className="flex items-center justify-between gap-3 px-5 py-3.5 border-b-2 border-[#d4a367] shrink-0"
            style={{
              background:
                'linear-gradient(180deg, #744425 0%, #593118 52%, #472511 100%)',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-full bg-gradient-to-b from-[#ffe283] to-[#e49d1b] border-2 border-[#fff3cb] text-[#45220a] flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#ffdf7f] leading-tight truncate">
                  {editingGarment ? 'Editar diseño' : 'Añadir nuevo diseño'}
                </h2>
                <p className="text-[11px] text-[#f5dec1] truncate">
                  Subida múltiple, arrastrar y soltar, recorte no destructivo y ficha técnica opcional
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playSfx('click');
                  setFavorite((f) => !f);
                }}
                title={favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold cursor-pointer transition-colors ${
                  favorite
                    ? 'bg-[#b32645] border-[#ffbcc9] text-white'
                    : 'bg-[#381c0c]/75 border-[#e3b56c] text-[#ffe9bf] hover:bg-[#7d4420]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${favorite ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Favorito</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar editor"
                className="w-8 h-8 rounded-full bg-[#381c0c]/80 hover:bg-[#8d4c24] border border-[#e3b56c] text-[#ffe9bf] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto studio-scroll p-4 sm:p-5 space-y-4"
          >
            {errorMsg && (
              <div className="rounded-xl bg-[#fde6e8] border border-[#d66674] px-3.5 py-2 text-xs font-semibold text-[#8c1d2c]">
                {errorMsg}
              </div>
            )}

            {/* 1. Basic Info: Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="design-name-input"
                  className="block text-xs font-bold text-[#6b3c1e] mb-1.5"
                >
                  Nombre del diseño *
                </label>
                <input
                  id="design-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Camisa Crochet Girasol Crema"
                  className="w-full rounded-xl border-2 border-[#d8b484] bg-[#fff9ef] px-3.5 py-2.5 text-sm font-medium text-[#3b1e0e] placeholder:text-[#a6835c] focus:border-[#d6838b] focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6b3c1e] mb-1.5">
                  Categoría *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {NEW_CATALOG_CATEGORIES.map((cat) => {
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          playSfx('click');
                          setCategory(cat.id);
                        }}
                        className={`px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                          active
                            ? 'bg-gradient-to-b from-[#ffe078] to-[#ebb024] border-[#b7740c] text-[#402008] shadow-sm'
                            : 'bg-[#fff9ef] border-[#dec198] text-[#6d4224] hover:border-[#c99658]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tags & Quick Craft Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#7c4d2b] mb-1">
                  Etiquetas (verano, algodón, evento…)
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#9a6740] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tagDraft}
                      onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Añadir etiqueta y pulsar Enter"
                      className="w-full rounded-xl border border-[#d8b484] bg-[#fff9ef] pl-8 pr-3 py-1.5 text-xs text-[#3b1e0e] focus:border-[#d6838b] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-2.5 py-1.5 rounded-xl bg-[#f3dfc0] hover:bg-[#e8cba0] border border-[#cfa574] text-xs font-bold text-[#5a2f16] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#f3e1c7] border border-[#d4ae80] text-[10.5px] font-bold text-[#5a2f16]"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                          className="hover:text-[#9c2032] cursor-pointer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#7c4d2b] mb-1">
                    Hilo / Fibra
                  </label>
                  <input
                    type="text"
                    value={fiber}
                    onChange={(e) => setFiber(e.target.value)}
                    placeholder="Algodón peinado..."
                    className="w-full rounded-xl border border-[#d8b484] bg-[#fff9ef] px-2.5 py-1.5 text-xs text-[#3b1e0e] focus:border-[#d6838b] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#7c4d2b] mb-1">
                    Ganchillo
                  </label>
                  <input
                    type="text"
                    value={hookSizeMm}
                    onChange={(e) => setHookSizeMm(e.target.value)}
                    placeholder="3.25 mm"
                    className="w-full rounded-xl border border-[#d8b484] bg-[#fff9ef] px-2.5 py-1.5 text-xs text-[#3b1e0e] focus:border-[#d6838b] focus:outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Descripción corta o puntada principal..."
                    className="w-full rounded-xl border border-[#d8b484] bg-[#fff9ef] px-2.5 py-1.5 text-xs text-[#3b1e0e] focus:border-[#d6838b] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Available Yarn Colors Multi-Selector */}
            <div className="rounded-2xl border-2 border-dashed border-[#d9b37f] bg-[#f7e7ce]/75 p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-bold text-[#6b3c1e]">
                  Colores disponibles ({selectedColorIds.length})
                </span>
                <span className="text-[11px] text-[#885a36]">
                  Pulsa los ovillos disponibles para este diseño
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {YARN_BALL_COLORS.map((c) => {
                  const isSelected = selectedColorIds.includes(c.id);
                  return (
                    <div key={c.id} className="relative">
                      <ArtisanYarnBallSwatch
                        color={c}
                        selected={isSelected}
                        available={true}
                        onClick={() => toggleColor(c.id)}
                      />
                      {isSelected && (
                        <span className="pointer-events-none absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#3f6f2e] text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Garment Photographs (Multi-Upload, Drag & Drop, Non-Destructive Crop) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverZone('garment-section');
              }}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverZone(null);
                if (e.dataTransfer.files?.length) {
                  void handleBatchAngleUpload('garment', e.dataTransfer.files);
                }
              }}
              className={`rounded-2xl border-2 p-3.5 transition-colors ${
                dragOverZone === 'garment-section'
                  ? 'border-[#d48b1b] bg-[#fff5db]'
                  : 'border-[#e4c298] bg-[#fffaf1]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-[#b3495d]" />
                  <h3 className="text-xs font-bold text-[#5e3116]">
                    Fotografías de la prenda ({garmentPhotoCount}/4)
                  </h3>
                </div>
                <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f3dfc0] hover:bg-[#e8cba0] border border-[#cfa574] text-[11px] font-bold text-[#5a2f16] cursor-pointer">
                  <Upload className="w-3 h-3" />
                  <span>
                    {uploadingSlot === 'garment-batch' ? 'Subiendo...' : 'Subir varias'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) void handleBatchAngleUpload('garment', e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ANGLE_SLOTS.map((slot) => {
                  const src = garmentViews[slot.key];
                  const cropKey = `garment-${slot.key}`;
                  const hasCrop = Boolean(photoCrops[cropKey]);
                  const isLoading = uploadingSlot === cropKey;
                  return (
                    <div
                      key={cropKey}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverZone(cropKey);
                      }}
                      onDragLeave={() => setDragOverZone(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverZone(null);
                        const f = e.dataTransfer.files?.[0];
                        if (f) void handlePhotoUpload('garment', slot.key, f);
                      }}
                      className={`relative rounded-xl border-2 border-dashed overflow-hidden aspect-[3/3.6] flex flex-col items-center justify-center transition-colors ${
                        dragOverZone === cropKey
                          ? 'border-[#d48b1b] bg-[#fff1c9]'
                          : 'border-[#d8b484] bg-[#fbf0df]'
                      }`}
                    >
                      {src ? (
                        <>
                          <img
                            src={src}
                            alt={`Prenda ${slot.label}`}
                            className="w-full h-full object-contain p-1.5"
                            style={getNonDestructiveCropStyle(photoCrops[cropKey])}
                          />
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setCropTarget({
                                  key: cropKey,
                                  src,
                                  label: `Prenda · ${slot.label}`,
                                  aspectClass: 'aspect-[3/3.6]',
                                })
                              }
                              title="Recorte no destructivo"
                              className={`w-6 h-6 rounded-full flex items-center justify-center shadow cursor-pointer ${
                                hasCrop
                                  ? 'bg-[#e39b18] text-[#3a1905]'
                                  : 'bg-[#5c3118]/90 hover:bg-[#7d4420] text-[#ffe9bf]'
                              }`}
                            >
                              <Crop className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto('garment', slot.key)}
                              title="Quitar fotografía"
                              className="w-6 h-6 rounded-full bg-[#7c1f2e]/90 hover:bg-[#a6263a] text-white flex items-center justify-center shadow cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-[#f5e3c6] transition-colors">
                          <Upload className="w-5 h-5 text-[#9a6338] mb-1" />
                          <span className="text-[11px] font-bold text-[#5c3016]">
                            {isLoading ? 'Cargando...' : slot.label}
                          </span>
                          <span className="text-[10px] text-[#926540]">
                            Arrastra o pulsa
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handlePhotoUpload('garment', slot.key, f);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 py-0.5 bg-[#5a3118]/85 text-[#ffe9be] text-[10px] font-semibold text-center">
                        {slot.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Official Male Model Wearing This Design (Multi-Upload, Drag & Drop, Non-Destructive Crop) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverZone('model-section');
              }}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverZone(null);
                if (e.dataTransfer.files?.length) {
                  void handleBatchAngleUpload('model', e.dataTransfer.files);
                }
              }}
              className={`rounded-2xl border-2 p-3.5 transition-colors ${
                dragOverZone === 'model-section'
                  ? 'border-[#3a8a5c] bg-[#e2f5e9]'
                  : 'border-[#a7ccb7] bg-[#eff8f2]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#2c6e49]" />
                  <h3 className="text-xs font-bold text-[#245439]">
                    Fotografías del modelo vistiendo esta prenda ({modelPhotoCount}/4)
                  </h3>
                </div>
                <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d7efe0] hover:bg-[#c2e5cf] border border-[#7bb592] text-[11px] font-bold text-[#204c33] cursor-pointer">
                  <Camera className="w-3 h-3" />
                  <span>
                    {uploadingSlot === 'model-batch' ? 'Subiendo...' : 'Subir vistas'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) void handleBatchAngleUpload('model', e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <p className="text-[11px] text-[#456d56] mb-3">
                Arrastra o sube las vistas reales del modelo oficial (Frente 0°, Perfil Izq. 90°, Espalda 180°, Perfil Der. 270°). Nunca se deforman imágenes para simular ángulos inexistentes.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ANGLE_SLOTS.map((slot) => {
                  const src = modelViews[slot.key];
                  const cropKey = `model-${slot.key}`;
                  const hasCrop = Boolean(photoCrops[cropKey]);
                  const isLoading = uploadingSlot === cropKey;
                  return (
                    <div
                      key={cropKey}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverZone(cropKey);
                      }}
                      onDragLeave={() => setDragOverZone(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverZone(null);
                        const f = e.dataTransfer.files?.[0];
                        if (f) void handlePhotoUpload('model', slot.key, f);
                      }}
                      className={`relative rounded-xl border-2 border-dashed overflow-hidden aspect-[3/4.2] flex flex-col items-center justify-center transition-colors ${
                        dragOverZone === cropKey
                          ? 'border-[#2c6e49] bg-[#d8f1e1]'
                          : 'border-[#8ebf9f] bg-white/80'
                      }`}
                    >
                      {src ? (
                        <>
                          <img
                            src={src}
                            alt={`Modelo ${slot.label}`}
                            className="w-full h-full object-contain object-bottom p-1"
                            style={getNonDestructiveCropStyle(photoCrops[cropKey])}
                          />
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setCropTarget({
                                  key: cropKey,
                                  src,
                                  label: `Modelo · ${slot.label}`,
                                  aspectClass: 'aspect-[2/3]',
                                })
                              }
                              title="Recorte no destructivo"
                              className={`w-6 h-6 rounded-full flex items-center justify-center shadow cursor-pointer ${
                                hasCrop
                                  ? 'bg-[#e39b18] text-[#3a1905]'
                                  : 'bg-[#29593e]/90 hover:bg-[#3a7554] text-white'
                              }`}
                            >
                              <Crop className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto('model', slot.key)}
                              title="Quitar vista del modelo"
                              className="w-6 h-6 rounded-full bg-[#7c1f2e]/90 hover:bg-[#a6263a] text-white flex items-center justify-center shadow cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:bg-[#e1f1e7] transition-colors">
                          <Camera className="w-5 h-5 text-[#367552] mb-1" />
                          <span className="text-[11px] font-bold text-[#245439]">
                            {isLoading ? 'Cargando...' : slot.label}
                          </span>
                          <span className="text-[10px] text-[#4e7f63]">{slot.angleLabel}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void handlePhotoUpload('model', slot.key, f);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 py-0.5 bg-[#29593e]/88 text-[#ecfff3] text-[10px] font-semibold text-center">
                        Modelo · {slot.angleLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Discreet Collapsible Optional Crochet Technical Sheet & Pattern/Detail Attachments */}
            <div className="rounded-2xl border-2 border-[#dfc098] bg-[#fff8ec] overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  playSfx('click');
                  setTechSheetOpen((prev) => !prev);
                }}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-[#f5e3c6]/80 hover:bg-[#f1d9b3] text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-4 h-4 text-[#8c4b1e] shrink-0" />
                  <span className="text-xs font-extrabold text-[#5a2f16] truncate">
                    Ficha técnica de crochet y patrones (opcional)
                  </span>
                  {techAttachmentCount > 0 && (
                    <span className="text-[10.5px] font-bold text-[#7c4d2b]">
                      · {techAttachmentCount} adjuntos
                    </span>
                  )}
                </div>
                {techSheetOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#7c4d2b] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#7c4d2b] shrink-0" />
                )}
              </button>

              {techSheetOpen && (
                <div className="p-3.5 space-y-3.5 border-t border-[#e4c69e]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#6e3f1f] mb-1">
                        Tipo de punto
                      </label>
                      <input
                        type="text"
                        value={stitchType}
                        onChange={(e) => setStitchType(e.target.value)}
                        placeholder="Ej. Granny square, punto alto, punto jazmín..."
                        className="w-full rounded-xl border border-[#d8b484] bg-white px-3 py-1.5 text-xs text-[#3b1e0e] focus:border-[#b9773f] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6e3f1f] mb-1">
                        Grosor de hilo
                      </label>
                      <input
                        type="text"
                        value={yarnWeight}
                        onChange={(e) => setYarnWeight(e.target.value)}
                        placeholder="Ej. Fingering / Sport / DK (n.º 3)"
                        className="w-full rounded-xl border border-[#d8b484] bg-white px-3 py-1.5 text-xs text-[#3b1e0e] focus:border-[#b9773f] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6e3f1f] mb-1">
                        Materiales y cantidad
                      </label>
                      <input
                        type="text"
                        value={materials}
                        onChange={(e) => setMaterials(e.target.value)}
                        placeholder="Ej. 450g algodón mercerizado, 5 botones de madera"
                        className="w-full rounded-xl border border-[#d8b484] bg-white px-3 py-1.5 text-xs text-[#3b1e0e] focus:border-[#b9773f] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#6e3f1f] mb-1">
                        Medidas
                      </label>
                      <input
                        type="text"
                        value={measurementsText}
                        onChange={(e) => setMeasurementsText(e.target.value)}
                        placeholder="Ej. Pecho 104 cm · Largo 66 cm · Manga 24 cm"
                        className="w-full rounded-xl border border-[#d8b484] bg-white px-3 py-1.5 text-xs text-[#3b1e0e] focus:border-[#b9773f] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-[#6e3f1f] mb-1">
                        Detalles de costura y acabados
                      </label>
                      <input
                        type="text"
                        value={seamDetails}
                        onChange={(e) => setSeamDetails(e.target.value)}
                        placeholder="Ej. Unión invisible en hombros, remate en punto cangrejo..."
                        className="w-full rounded-xl border border-[#d8b484] bg-white px-3 py-1.5 text-xs text-[#3b1e0e] focus:border-[#b9773f] focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-[#6e3f1f] mb-1">
                        Notas de confección
                      </label>
                      <textarea
                        rows={2}
                        value={craftingNotes}
                        onChange={(e) => setCraftingNotes(e.target.value)}
                        placeholder="Tensión de muestra, bloqueo en húmedo, orden de montaje..."
                        className="w-full rounded-xl border border-[#d8b484] bg-white px-3 py-1.5 text-xs text-[#3b1e0e] focus:border-[#b9773f] focus:outline-none resize-y"
                      />
                    </div>
                  </div>

                  {/* Detail & Pattern Attachment Galleries */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Detail Photos */}
                    <div className="rounded-xl border border-[#dfc098] bg-[#fffcf7] p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-extrabold text-[#5a2f16] inline-flex items-center gap-1">
                          <FileImage className="w-3.5 h-3.5 text-[#a45222]" />
                          Fotos de detalles ({detailPhotos.length})
                        </span>
                        <label className="px-2 py-0.5 rounded-lg bg-[#f3dfc0] hover:bg-[#e8cba0] border border-[#cfa574] text-[10.5px] font-bold text-[#5a2f16] cursor-pointer">
                          + Adjuntar
                          <input
                            type="file"
                            multiple
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.length) {
                                void handleTechAttachmentUpload('detail', e.target.files);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      {detailPhotos.length === 0 ? (
                        <p className="text-[10.5px] text-[#926846] text-center py-2">
                          Macro de puntos, botones o bordes
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5">
                          {detailPhotos.map((p) => (
                            <div key={p.id} className="relative rounded-lg overflow-hidden border border-[#dfc098] aspect-square bg-[#f5e7d2]">
                              <img src={p.dataUrl} alt={p.label} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setDetailPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#7c1f2e]/90 text-white flex items-center justify-center cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pattern Photos */}
                    <div className="rounded-xl border border-[#dfc098] bg-[#fffcf7] p-2.5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-extrabold text-[#5a2f16] inline-flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#a45222]" />
                          Fotos de patrones ({patternPhotos.length})
                        </span>
                        <label className="px-2 py-0.5 rounded-lg bg-[#f3dfc0] hover:bg-[#e8cba0] border border-[#cfa574] text-[10.5px] font-bold text-[#5a2f16] cursor-pointer">
                          + Adjuntar
                          <input
                            type="file"
                            multiple
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.length) {
                                void handleTechAttachmentUpload('pattern', e.target.files);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      {patternPhotos.length === 0 ? (
                        <p className="text-[10.5px] text-[#926846] text-center py-2">
                          Diagramas, esquemas o gráficos
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5">
                          {patternPhotos.map((p) => (
                            <div key={p.id} className="relative rounded-lg overflow-hidden border border-[#dfc098] aspect-square bg-[#f5e7d2]">
                              <img src={p.dataUrl} alt={p.label} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setPatternPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#7c1f2e]/90 text-white flex items-center justify-center cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#e2c297]">
              <div>
                {editingGarment && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      onDelete(editingGarment.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#fbe2e5] hover:bg-[#f6c9cf] border border-[#d67b87] text-[#8d1d2d] text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Mover a papelera</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#f1dec1] hover:bg-[#e6cda7] border border-[#cfa874] text-[#5c3318] text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-b from-[#ffe074] via-[#f2b824] to-[#da920c] hover:brightness-105 border-2 border-[#a86908] text-[#3f1e07] text-xs font-extrabold shadow-md cursor-pointer transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingGarment ? 'Guardar cambios' : 'Guardar diseño'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Non-Destructive Crop Sub-Modal */}
      {cropTarget && (
        <NonDestructiveCropModal
          isOpen={true}
          imageSrc={cropTarget.src}
          slotLabel={cropTarget.label}
          aspectClass={cropTarget.aspectClass}
          initialCrop={photoCrops[cropTarget.key]}
          onClose={() => setCropTarget(null)}
          onApply={(nextCrop) => {
            setPhotoCrops((prev) => {
              const updated = { ...prev };
              if (nextCrop) updated[cropTarget.key] = nextCrop;
              else delete updated[cropTarget.key];
              return updated;
            });
            setCropTarget(null);
          }}
        />
      )}
    </>
  );
};
