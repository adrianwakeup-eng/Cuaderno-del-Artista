import React from 'react';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Heart,
  History,
  Pencil,
  Pin,
  Search,
  Shirt,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { DressingRoomGarment } from '../types/crochet';
import { getNonDestructiveCropStyle } from './NonDestructiveCropModal';

export type CatalogSortMode = 'manual' | 'recent' | 'alpha' | 'favorites';

interface CatalogDesignCardProps {
  garment: DressingRoomGarment;
  isWorn: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  isDragTarget: boolean;
  onWear: () => void;
  onEdit: () => void;
  onInspect: () => void;
  onDuplicate: () => void;
  onToggleFavorite: () => void;
  onPin: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

export const CatalogDesignCard: React.FC<CatalogDesignCardProps> = React.memo(
  ({
    garment,
    isWorn,
    canMoveLeft,
    canMoveRight,
    isDragTarget,
    onWear,
    onEdit,
    onInspect,
    onDuplicate,
    onToggleFavorite,
    onPin,
    onDelete,
    onMove,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
  }) => {
    const thumbSrc =
      garment.garmentViews?.front ||
      garment.photoDataUrl ||
      garment.modelViews?.front ||
      '';
    const cropStyle = getNonDestructiveCropStyle(garment.photoCrops?.['garment-front']);
    const grade = garment.runwayColorGrade;
    const runwayThumbFilter = grade
      ? [
          grade.hueDeg ? `hue-rotate(${grade.hueDeg}deg)` : '',
          grade.satScale && grade.satScale !== 1 ? `saturate(${grade.satScale})` : '',
          grade.lightScale && grade.lightScale !== 1 ? `brightness(${grade.lightScale})` : '',
          grade.contrastScale && grade.contrastScale !== 1 ? `contrast(${grade.contrastScale})` : '',
        ]
          .filter(Boolean)
          .join(' ') || undefined
      : undefined;
    const imgStyle: React.CSSProperties = {
      ...cropStyle,
      ...(runwayThumbFilter ? { filter: runwayThumbFilter } : {}),
    };
    const runwayBadge =
      garment.runwayHouseId && garment.runwayHouseId !== 'original'
        ? garment.tags?.[garment.tags.length - 1]
        : null;
    const modelViewCount = Object.values(garment.modelViews ?? {}).filter(Boolean).length;

    return (
      <div
        role="button"
        tabIndex={0}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={onWear}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onWear();
          }
        }}
        title={`${garment.name} · ${garment.category} (arrastra para reordenar)`}
        className={`group relative rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#c67f12] aspect-[3/3.65] flex flex-col ${
          isDragTarget
            ? 'ring-[3px] ring-[#3b8559] scale-[1.02] bg-[#f3fbf6]'
            : isWorn
              ? 'bg-[#fff9ed] ring-[3px] ring-[#f7b924] shadow-[0_6px_18px_rgba(196,124,14,0.45)] scale-[1.01]'
              : 'bg-[#fcf2e3]/95 border-2 border-[#d4ad82] hover:border-[#b9773f] shadow-[0_4px_12px_rgba(88,46,20,0.2)] hover:-translate-y-0.5'
        }`}
      >
        {thumbSrc ? (
          <div className="w-full h-full overflow-hidden p-2 pb-10">
            <img
              src={thumbSrc}
              alt={garment.name}
              draggable={false}
              loading="lazy"
              style={imgStyle}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 pb-10 text-center bg-[#f6e4cc] text-[#6d3e1e]">
            <Shirt className="w-7 h-7 opacity-60 mb-1" />
            <span className="text-[10px] font-bold tracking-wide opacity-75">
              {garment.category}
            </span>
          </div>
        )}

        {/* Active worn checkmark */}
        {isWorn && (
          <span
            aria-label="Diseño puesto en el modelo"
            className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-gradient-to-b from-[#ffe06b] to-[#df9112] border-2 border-[#fff8de] text-[#452106] shadow flex items-center justify-center"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
          </span>
        )}

        {/* Favorite indicator / button */}
        <button
          type="button"
          title={garment.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`absolute ${
            isWorn ? 'top-8 right-1.5' : 'top-1.5 right-1.5'
          } z-20 w-6 h-6 rounded-full flex items-center justify-center shadow cursor-pointer transition-all ${
            garment.favorite
              ? 'bg-[#b32645] text-white border border-[#ffd0da] opacity-100'
              : 'bg-[#fff7ea]/90 text-[#8a4c2a] border border-[#d6ab77] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-white'
          }`}
        >
          <Heart className={`w-3 h-3 ${garment.favorite ? 'fill-current' : ''}`} />
        </button>

        {/* Runway house edition badge or quiet model-photo count indicator */}
        {runwayBadge ? (
          <span
            title={garment.runwayHouseName || runwayBadge}
            className="absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3e210e]/85 text-[#ffefc8] text-[8.5px] font-bold shadow group-hover:opacity-0 transition-opacity"
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: garment.accentColor }}
            />
            <span>{runwayBadge}</span>
          </span>
        ) : (
          modelViewCount > 0 && (
            <span
              title={`${modelViewCount} ${modelViewCount === 1 ? 'vista' : 'vistas'} del modelo asociadas`}
              className="absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#2e6b48]/90 text-[#effdf4] text-[8.5px] font-bold shadow group-hover:opacity-0 transition-opacity"
            >
              <Camera className="w-2.5 h-2.5" />
              <span className="font-mono-tab">{modelViewCount}v</span>
            </span>
          )
        )}

        {/* Hover Action Toolbar: Inspect, Edit, Duplicate, Pin, Delete */}
        <div className="absolute top-1.5 left-1.5 z-20 flex flex-wrap items-center gap-1 max-w-[78%] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            title="Ver detalles y ficha técnica"
            onClick={(e) => {
              e.stopPropagation();
              onInspect();
            }}
            className="w-6 h-6 rounded-full bg-[#3f5e36]/95 hover:bg-[#4e7543] border border-[#ccebd0] text-white flex items-center justify-center shadow cursor-pointer"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Editar diseño y fotos"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="w-6 h-6 rounded-full bg-[#5f3419]/95 hover:bg-[#824722] border border-[#f5d59c] text-[#fff4db] flex items-center justify-center shadow cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Duplicar diseño"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="w-6 h-6 rounded-full bg-[#5f3419]/95 hover:bg-[#824722] border border-[#f5d59c] text-[#fff4db] flex items-center justify-center shadow cursor-pointer"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Llevar al cuaderno"
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className="w-6 h-6 rounded-full bg-[#5f3419]/95 hover:bg-[#824722] border border-[#f5d59c] text-[#fff4db] flex items-center justify-center shadow cursor-pointer"
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Mover a la papelera"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-6 h-6 rounded-full bg-[#8f2032]/95 hover:bg-[#b5273e] border border-[#ffc8d0] text-white flex items-center justify-center shadow cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Accessible Reorder Arrows (appear cleanly on hover right above title bar) */}
        {(canMoveLeft || canMoveRight) && (
          <div className="absolute bottom-[42px] inset-x-1.5 z-20 flex items-center justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity pointer-events-none">
            <button
              type="button"
              disabled={!canMoveLeft}
              title="Mover antes"
              onClick={(e) => {
                e.stopPropagation();
                onMove(-1);
              }}
              className={`pointer-events-auto w-5 h-5 rounded-full bg-[#fff8eb]/92 border border-[#c8965d] text-[#5a2f16] flex items-center justify-center shadow cursor-pointer ${
                !canMoveLeft ? 'opacity-30 cursor-default' : 'hover:bg-white'
              }`}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              disabled={!canMoveRight}
              title="Mover después"
              onClick={(e) => {
                e.stopPropagation();
                onMove(1);
              }}
              className={`pointer-events-auto w-5 h-5 rounded-full bg-[#fff8eb]/92 border border-[#c8965d] text-[#5a2f16] flex items-center justify-center shadow cursor-pointer ${
                !canMoveRight ? 'opacity-30 cursor-default' : 'hover:bg-white'
              }`}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Quiet Metadata Footer */}
        <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 bg-[#f7e5cb]/95 border-t border-[#e0be93]">
          <p className="text-[10.5px] font-bold text-[#4a2610] truncate text-center leading-tight">
            {garment.name}
          </p>
          <div className="mt-0.5 flex items-center justify-center gap-1.5">
            {garment.palette && garment.palette.length > 0 && (
              <div className="flex items-center gap-0.5">
                {garment.palette.slice(0, 4).map((hex, i) => (
                  <span
                    key={`${garment.id}-c-${i}`}
                    className="w-2.5 h-2.5 rounded-full border border-[#6e4220]/35"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            )}
            {garment.tags && garment.tags.length > 0 && (
              <span className="text-[9px] text-[#7c4d2b] truncate max-w-[70px]">
                #{garment.tags[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);
CatalogDesignCard.displayName = 'CatalogDesignCard';

interface CatalogFilterBarProps {
  searchQuery: string;
  onlyFavorites: boolean;
  activeTag: string | null;
  availableTags: string[];
  sortMode: CatalogSortMode;
  trashCount: number;
  historyCount: number;
  onSearchChange: (q: string) => void;
  onToggleFavorites: () => void;
  onSelectTag: (tag: string | null) => void;
  onChangeSort: (mode: CatalogSortMode) => void;
  onBatchUploadFiles: (files: FileList) => void;
  onOpenHistory: () => void;
}

export const CatalogFilterBar: React.FC<CatalogFilterBarProps> = ({
  searchQuery,
  onlyFavorites,
  activeTag,
  availableTags,
  sortMode,
  trashCount,
  historyCount,
  onSearchChange,
  onToggleFavorites,
  onSelectTag,
  onChangeSort,
  onBatchUploadFiles,
  onOpenHistory,
}) => (
  <div className="mb-2 px-1 space-y-1.5 shrink-0">
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[130px]">
        <Search className="w-3.5 h-3.5 text-[#8a5732] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar diseño, punto o etiqueta..."
          aria-label="Buscar en el catálogo"
          className="w-full rounded-xl border border-[#cfa474] bg-[#fff9ef]/95 pl-7 pr-6 py-1 text-[11px] font-medium text-[#44220f] placeholder:text-[#9c724c] focus:outline-none focus:border-[#b9773f]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#8a5732] hover:text-[#44220f] cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Favorites Filter */}
      <button
        type="button"
        onClick={onToggleFavorites}
        title="Mostrar solo favoritos"
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[10.5px] font-bold cursor-pointer transition-colors ${
          onlyFavorites
            ? 'bg-[#b32645] border-[#8b1831] text-white'
            : 'bg-[#fff8ec]/92 border-[#cfa474] text-[#663619] hover:bg-white'
        }`}
      >
        <Heart className={`w-3 h-3 ${onlyFavorites ? 'fill-current' : ''}`} />
        <span className="hidden sm:inline">Fav</span>
      </button>

      {/* Sort Select */}
      <select
        value={sortMode}
        onChange={(e) => onChangeSort(e.target.value as CatalogSortMode)}
        aria-label="Ordenar catálogo"
        className="rounded-xl border border-[#cfa474] bg-[#fff8ec]/95 px-2 py-1 text-[10.5px] font-bold text-[#5a2f16] focus:outline-none cursor-pointer"
      >
        <option value="manual">Orden manual</option>
        <option value="recent">Recientes</option>
        <option value="alpha">A–Z</option>
        <option value="favorites">Favoritos</option>
      </select>

      {/* Batch Multi-Upload */}
      <label
        title="Subir varias fotos como nuevos diseños"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-[#fff8ec]/92 hover:bg-white border border-[#cfa474] text-[#5a2f16] text-[10.5px] font-bold cursor-pointer"
      >
        <Upload className="w-3 h-3" />
        <span className="hidden xl:inline">Varias</span>
        <input
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onBatchUploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>

      {/* History & Trash Recovery */}
      <button
        type="button"
        onClick={onOpenHistory}
        title="Historial y papelera de recuperación"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-[#fff8ec]/92 hover:bg-white border border-[#cfa474] text-[#5a2f16] text-[10.5px] font-bold cursor-pointer"
      >
        <History className="w-3 h-3" />
        {(trashCount > 0 || historyCount > 0) && (
          <span className="font-mono-tab text-[10px]">
            {trashCount > 0 ? trashCount : historyCount}
          </span>
        )}
      </button>
    </div>

    {/* Optional Tag Filter Row (only appears when user has added tags) */}
    {availableTags.length > 0 && (
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
        <button
          type="button"
          onClick={() => onSelectTag(null)}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 cursor-pointer ${
            activeTag === null
              ? 'bg-[#63361c] border-[#4d2610] text-[#ffe9be]'
              : 'bg-[#fff9ef]/90 border-[#d6b184] text-[#6d4224]'
          }`}
        >
          Todas
        </button>
        {availableTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag(activeTag === tag ? null : tag)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 cursor-pointer ${
              activeTag === tag
                ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                : 'bg-[#fff9ef]/90 border-[#d6b184] text-[#6d4224] hover:border-[#b97d42]'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>
    )}
  </div>
);
