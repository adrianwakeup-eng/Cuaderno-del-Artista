import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  Edit3,
  Heart,
  ImagePlus,
  Pin,
  Shirt,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { DressingRoomCategory, DressingRoomGarment } from '../../types/crochet';
import { ATELIER_YARN_COLORS, ArtisanYarnBallSwatch } from './AtelierDecorProps';
import { compressImageFile } from '../../utils/storage';
import { audioEngine } from '../../utils/audioEngine';

export const VESTIDOR_CATEGORIES: DressingRoomCategory[] = [
  'Camisas',
  'Suéteres',
  'Chalecos',
  'Shorts',
  'Pantalones',
];

interface AddEditDesignModalProps {
  isOpen: boolean;
  initialGarment: DressingRoomGarment | null;
  defaultCategory: DressingRoomCategory;
  onClose: () => void;
  onSave: (garment: DressingRoomGarment, isEdit: boolean) => void;
}

export const AddEditDesignModal: React.FC<AddEditDesignModalProps> = ({
  isOpen,
  initialGarment,
  defaultCategory,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DressingRoomCategory>(defaultCategory);
  const [fiber, setFiber] = useState('100% Algodón Peinado Artesanal');
  const [hookSizeMm, setHookSizeMm] = useState('3.5 mm');
  const [stitchNote, setStitchNote] = useState('');
  const [selectedPalette, setSelectedPalette] = useState<string[]>(['#F3DFC1', '#2D6A35', '#F1B92B']);
  const [frontPhoto, setFrontPhoto] = useState<string>('');
  const [backPhoto, setBackPhoto] = useState<string>('');
  const [overlayScale, setOverlayScale] = useState<number>(100);
  const [overlayOffsetY, setOverlayOffsetY] = useState<number>(0);
  const [isLoadingImg, setIsLoadingImg] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialGarment) {
      setName(initialGarment.name);
      setCategory(
        VESTIDOR_CATEGORIES.includes(initialGarment.category)
          ? initialGarment.category
          : defaultCategory
      );
      setFiber(initialGarment.fiber || '100% Algodón Peinado Artesanal');
      setHookSizeMm(initialGarment.hookSizeMm || '3.5 mm');
      setStitchNote(initialGarment.stitchNote || '');
      setSelectedPalette(
        initialGarment.palette?.length ? initialGarment.palette : ['#F3DFC1', '#2D6A35']
      );
      setFrontPhoto(initialGarment.photoDataUrl || '');
      setBackPhoto(initialGarment.backPhotoDataUrl || '');
      setOverlayScale(initialGarment.overlayScale ?? 100);
      setOverlayOffsetY(initialGarment.overlayOffsetY ?? 0);
    } else {
      setName('');
      setCategory(defaultCategory);
      setFiber('100% Algodón Peinado Artesanal');
      setHookSizeMm('3.5 mm');
      setStitchNote('');
      setSelectedPalette(['#F3DFC1', '#2D6A35', '#F1B92B']);
      setFrontPhoto('');
      setBackPhoto('');
      setOverlayScale(100);
      setOverlayOffsetY(0);
    }
  }, [isOpen, initialGarment, defaultCategory]);

  if (!isOpen) return null;

  const handleFilePick = async (file: File, side: 'front' | 'back') => {
    setIsLoadingImg(true);
    try {
      // Preserve crisp high-DPI photograph resolution (up to 1400px) without degrading details
      const dataUrl = await compressImageFile(file, 1400);
      if (side === 'front') {
        setFrontPhoto(dataUrl);
        if (!name.trim()) {
          setName(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
        }
      } else {
        setBackPhoto(dataUrl);
      }
      audioEngine.playSaveChime();
    } finally {
      setIsLoadingImg(false);
    }
  };

  const toggleColorHex = (hex: string) => {
    audioEngine.playYarnPluck(2);
    setSelectedPalette((prev) => {
      if (prev.includes(hex)) {
        return prev.length > 1 ? prev.filter((c) => c !== hex) : prev;
      }
      return [...prev.slice(-4), hex];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || `Diseño ${category} Artesanal`;
    const isBottom = category === 'Shorts' || category === 'Pantalones';
    const garment: DressingRoomGarment = {
      id: initialGarment?.id || `design-${Date.now()}`,
      name: cleanName,
      category,
      garmentSlot: isBottom ? 'bottom' : 'top',
      eyebrow: 'COLECCIÓN FUENTES NAZCO',
      subtitle: `${category} tejido a mano · ${fiber}`,
      fiber: fiber.trim() || 'Algodón artesanal',
      fiberDetail: 'Tejido a crochet',
      hookSizeMm: hookSizeMm.trim() || '3.5 mm',
      stitchNote:
        stitchNote.trim() ||
        'Diseño artesanal registrado en El Vestidor Dorado — Colección Crochet Fuentes Nazco.',
      palette: selectedPalette,
      accentColor: selectedPalette[0] || '#D8B56A',
      photoDataUrl: frontPhoto || undefined,
      backPhotoDataUrl: backPhoto || undefined,
      isCustom: true,
      overlayScale,
      overlayOffsetY,
      createdAt: initialGarment?.createdAt || new Date().toISOString(),
    };
    audioEngine.playSaveChime();
    onSave(garment, Boolean(initialGarment));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#231208]/72 backdrop-blur-[3px] p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-[26px] atelier-crochet-rose-frame p-2.5 sm:p-3 shadow-[0_28px_70px_rgba(24,10,4,0.68)] my-auto"
      >
        <div className="rounded-[20px] atelier-crochet-cream-surface border-2 border-[#c8a278] overflow-hidden text-[#3c210e]">
          {/* Wooden Modal Header */}
          <div className="atelier-wood-plaque border-0 border-b-2 border-[#d8b56a] rounded-none px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#f4cf7a]" />
              <div>
                <h2 className="font-display text-lg font-bold tracking-wide text-[#f7db93]">
                  {initialGarment ? 'Editar Diseño Artesanal' : 'Añadir Nuevo Diseño'}
                </h2>
                <p className="text-[11px] font-editorial italic text-[#f2dfbe]">
                  Colección Crochet Fuentes Nazco · Fotografía en alta definición
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="w-8 h-8 rounded-full bg-[#3a1f0f]/90 hover:bg-[#5c3318] border border-[#d8b56a]/65 text-[#fff0cf] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[78vh] overflow-y-auto studio-scroll">
            {/* High-Resolution Photo Upload Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Front Photo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6d4522]">
                  Fotografía principal (Frente)
                </label>
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFilePick(f, 'front');
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => frontInputRef.current?.click()}
                  className="group relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#b98d59] bg-[#fff8ed]/85 hover:bg-[#fffaf2] overflow-hidden flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {frontPhoto ? (
                    <>
                      <img
                        src={frontPhoto}
                        alt="Vista frontal de la prenda"
                        className="w-full h-full object-contain p-2"
                      />
                      <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full atelier-wood-btn text-[10.5px] font-semibold text-[#fff4de]">
                        Cambiar foto
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-full bg-[#f2dfc1] border border-[#cfa162] flex items-center justify-center text-[#76543d] group-hover:scale-105 transition-transform">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-[#523015]">
                        {isLoadingImg ? 'Procesando imagen...' : 'Subir fotografía de prenda'}
                      </span>
                      <span className="text-[10.5px] text-[#855e3b]">
                        PNG transparente o JPG en alta resolución
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Back Photo (Optional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6d4522]">
                  Fotografía espalda (Opcional)
                </label>
                <input
                  ref={backInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFilePick(f, 'back');
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => backInputRef.current?.click()}
                  className="group relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#b98d59]/80 bg-[#fff8ed]/65 hover:bg-[#fffaf2] overflow-hidden flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {backPhoto ? (
                    <>
                      <img
                        src={backPhoto}
                        alt="Vista trasera de la prenda"
                        className="w-full h-full object-contain p-2"
                      />
                      <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full atelier-wood-btn text-[10.5px] font-semibold text-[#fff4de]">
                        Cambiar espalda
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-[#f2dfc1]/80 border border-[#cfa162] flex items-center justify-center text-[#76543d]">
                        <ImagePlus className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#5a371a]">
                        Añadir vista de espalda
                      </span>
                      <span className="text-[10.5px] text-[#855e3b]">
                        Se mostrará al girar el modelo a Espalda
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6d4522]">
                  Nombre del diseño
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Camisa Girasoles Crochet Crema"
                  className="w-full rounded-xl bg-[#fffaf0] border-2 border-[#cfa97a] focus:border-[#9e6619] px-3 py-2 text-sm text-[#351b08] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6d4522]">
                  Categoría
                </label>
                <div className="flex flex-wrap gap-1">
                  {VESTIDOR_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        audioEngine.playStitchClick();
                        setCategory(cat);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        category === cat
                          ? 'atelier-knit-btn-active text-[#3c2008]'
                          : 'bg-[#efe0c6] hover:bg-[#e5cfac] text-[#5e391b] border border-[#cca878]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Yarn Colors Selector (Ovillos) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6d4522]">
                Ovillos de color del tejido
              </label>
              <div className="rounded-2xl bg-[#fff8ed]/80 border border-[#cfa97a] p-2.5 flex items-center gap-2 flex-wrap">
                {ATELIER_YARN_COLORS.map((yarn) => (
                  <ArtisanYarnBallSwatch
                    key={yarn.id}
                    color={yarn}
                    size={38}
                    selected={selectedPalette.includes(yarn.hex)}
                    onClick={() => toggleColorHex(yarn.hex)}
                  />
                ))}
              </div>
            </div>

            {/* Technical Crochet Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6d4522]">
                  Fibra / Hilo
                </label>
                <input
                  type="text"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  placeholder="Algodón mercerizado, lino..."
                  className="w-full rounded-xl bg-[#fffaf0] border-2 border-[#cfa97a] focus:border-[#9e6619] px-3 py-1.5 text-sm text-[#351b08] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6d4522]">
                  Aguja / Ganchillo
                </label>
                <input
                  type="text"
                  value={hookSizeMm}
                  onChange={(e) => setHookSizeMm(e.target.value)}
                  placeholder="3.5 mm"
                  className="w-full rounded-xl bg-[#fffaf0] border-2 border-[#cfa97a] focus:border-[#9e6619] px-3 py-1.5 text-sm font-mono-tab text-[#351b08] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6d4522]">
                Notas de puntada y confección
              </label>
              <textarea
                rows={2}
                value={stitchNote}
                onChange={(e) => setStitchNote(e.target.value)}
                placeholder="Granny squares de girasol, remate en punto bajo verde bosque..."
                className="w-full rounded-xl bg-[#fffaf0] border-2 border-[#cfa97a] focus:border-[#9e6619] px-3 py-2 text-sm text-[#351b08] focus:outline-none resize-none"
              />
            </div>

            {/* Optional Fit Calibration for Model Preview */}
            {frontPhoto && (
              <div className="rounded-2xl bg-[#f4e4c9]/80 border border-[#cfa97a] p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-[#5e391b]">
                    <span>Escala sobre modelo</span>
                    <span className="font-mono-tab">{overlayScale}%</span>
                  </div>
                  <input
                    type="range"
                    min={65}
                    max={135}
                    value={overlayScale}
                    onChange={(e) => setOverlayScale(Number(e.target.value))}
                    className="w-full accent-[#b87b22]"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-[#5e391b]">
                    <span>Ajuste vertical</span>
                    <span className="font-mono-tab">{overlayOffsetY > 0 ? `+${overlayOffsetY}%` : `${overlayOffsetY}%`}</span>
                  </div>
                  <input
                    type="range"
                    min={-15}
                    max={15}
                    value={overlayOffsetY}
                    onChange={(e) => setOverlayOffsetY(Number(e.target.value))}
                    className="w-full accent-[#b87b22]"
                  />
                </div>
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#d8b88d]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl atelier-knit-btn text-xs font-bold text-[#563315] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl atelier-gold-pill-btn text-xs font-bold text-[#3d2108] cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{initialGarment ? 'Guardar cambios' : 'Guardar en el Vestidor'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface GarmentDetailModalProps {
  garment: DressingRoomGarment | null;
  isWorn: boolean;
  isFav: boolean;
  onClose: () => void;
  onWear: () => void;
  onEdit: () => void;
  onToggleFav: () => void;
  onPinToNotebook: () => void;
  onPickColor: (hex: string) => void;
  onDelete: () => void;
}

export const GarmentDetailModal: React.FC<GarmentDetailModalProps> = ({
  garment,
  isWorn,
  isFav,
  onClose,
  onWear,
  onEdit,
  onToggleFav,
  onPinToNotebook,
  onPickColor,
  onDelete,
}) => {
  const [photoSide, setPhotoSide] = useState<'front' | 'back'>('front');

  useEffect(() => {
    setPhotoSide('front');
  }, [garment?.id]);

  if (!garment) return null;

  const activePhoto =
    photoSide === 'back' && garment.backPhotoDataUrl
      ? garment.backPhotoDataUrl
      : garment.photoDataUrl;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#231208]/74 backdrop-blur-[3px] p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-[26px] atelier-crochet-rose-frame p-2.5 sm:p-3 shadow-[0_28px_72px_rgba(22,10,4,0.7)]"
      >
        <div className="rounded-[20px] atelier-crochet-cream-surface border-2 border-[#cfa97a] overflow-hidden text-[#3c210e]">
          <div className="atelier-wood-plaque border-0 border-b-2 border-[#d8b56a] rounded-none px-5 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e7c47a]">
                {garment.category} · Ficha de Atelier
              </span>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#fff3d6] truncate">
                {garment.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle"
              className="w-8 h-8 rounded-full bg-[#3a1f0f]/90 hover:bg-[#5c3318] border border-[#d8b56a]/65 text-[#fff0cf] flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 sm:p-5 max-h-[78vh] overflow-y-auto studio-scroll">
            {/* High-Resolution Photograph Frame */}
            <div className="md:col-span-6 flex flex-col gap-2">
              <div className="relative aspect-[3/4] rounded-2xl bg-[#fffaf1] border-2 border-[#d1ae7e] shadow-inner overflow-hidden flex items-center justify-center p-3">
                {activePhoto ? (
                  <img
                    src={activePhoto}
                    alt={garment.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-[#7c5633] p-6">
                    <Shirt className="w-12 h-12 mx-auto opacity-45 mb-2" />
                    <p className="font-editorial italic text-sm">Sin fotografía adjunta aún</p>
                  </div>
                )}

                {garment.backPhotoDataUrl && (
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 inline-flex p-0.5 rounded-full bg-[#4b2d18]/90 border border-[#d8b56a]">
                    <button
                      type="button"
                      onClick={() => setPhotoSide('front')}
                      className={`px-3 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${
                        photoSide === 'front' ? 'bg-[#d8b56a] text-[#3a1e09]' : 'text-[#f6e3be]'
                      }`}
                    >
                      Frente
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoSide('back')}
                      className={`px-3 py-0.5 rounded-full text-[11px] font-bold cursor-pointer ${
                        photoSide === 'back' ? 'bg-[#d8b56a] text-[#3a1e09]' : 'text-[#f6e3be]'
                      }`}
                    >
                      Espalda
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Artisan Technical Specifications */}
            <div className="md:col-span-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="rounded-2xl bg-[#fff8ed]/90 border border-[#d4b080] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#7e542a]">
                      Detalles del Tejido
                    </span>
                    <button
                      type="button"
                      onClick={onToggleFav}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f6e7ce] border border-[#cfa46a] text-xs font-semibold text-[#5a3210] cursor-pointer"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isFav ? 'fill-[#9c243a] text-[#9c243a]' : 'text-[#6c421e]'
                        }`}
                      />
                      <span>{isFav ? 'Favorito' : 'Guardar'}</span>
                    </button>
                  </div>

                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-[#f5e7d0] px-2.5 py-1.5">
                      <dt className="text-[10px] uppercase text-[#825932]">Fibra</dt>
                      <dd className="font-bold text-[#3f220d]">{garment.fiber}</dd>
                    </div>
                    <div className="rounded-xl bg-[#f5e7d0] px-2.5 py-1.5">
                      <dt className="text-[10px] uppercase text-[#825932]">Ganchillo</dt>
                      <dd className="font-mono-tab font-bold text-[#3f220d]">
                        {garment.hookSizeMm}
                      </dd>
                    </div>
                  </dl>

                  <p className="text-xs leading-relaxed text-[#4f2e15]">{garment.stitchNote}</p>
                </div>

                {/* Color Palette Swatches */}
                <div className="rounded-2xl bg-[#fff8ed]/90 border border-[#d4b080] p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#7e542a] mb-2">
                    Paleta de hilos (clic para usar en el pincel)
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {garment.palette.map((hex) => {
                      const match = ATELIER_YARN_COLORS.find(
                        (c) => c.hex.toUpperCase() === hex.toUpperCase()
                      ) || {
                        id: hex.replace('#', ''),
                        name: hex,
                        hex,
                        light: '#fff8ed',
                        dark: '#4e2f16',
                      };
                      return (
                        <ArtisanYarnBallSwatch
                          key={hex}
                          color={match}
                          size={36}
                          onClick={() => onPickColor(hex)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onWear}
                  className="w-full py-2.5 rounded-xl atelier-gold-pill-btn text-sm font-bold text-[#3b1f07] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Shirt className="w-4 h-4" />
                  <span>{isWorn ? 'Quitar del modelo' : 'Probar en el modelo'}</span>
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="py-2 rounded-xl atelier-knit-btn text-xs font-bold text-[#4a280e] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={onPinToNotebook}
                    className="py-2 rounded-xl atelier-knit-btn text-xs font-bold text-[#4a280e] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>Cuaderno</span>
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="py-2 rounded-xl bg-[#f7dfe2] hover:bg-[#f0c8ce] border-2 border-[#c6828d] text-xs font-bold text-[#7d1b2c] flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
