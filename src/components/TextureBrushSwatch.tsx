import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { BrushPresetId } from '../types/crochet';
import { renderTexturePreviewDataUrl } from '../utils/hyperrealBrushEngine';

const FAV_STORAGE_KEY = 'cuaderno_fav_brushes_v1';
const FAV_CHANGE_EVENT = 'cuaderno:fav-brushes-changed';

function readFavIds(): string[] {
  try {
    const raw = window.localStorage.getItem(FAV_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useFavoriteBrushes(): {
  favoriteIds: string[];
  favoriteSet: Set<string>;
  toggleFavorite: (id: BrushPresetId) => void;
} {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    typeof window !== 'undefined' ? readFavIds() : []
  );

  useEffect(() => {
    const onSync = () => setFavoriteIds(readFavIds());
    window.addEventListener(FAV_CHANGE_EVENT, onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener(FAV_CHANGE_EVENT, onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  const toggleFavorite = useCallback((id: BrushPresetId) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [id, ...prev];
      try {
        window.localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(FAV_CHANGE_EVENT));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  return { favoriteIds, favoriteSet, toggleFavorite };
}

function isDarkTint(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return false;
  return 0.299 * r + 0.587 * g + 0.114 * b < 96;
}

export const LiveTexturePreview: React.FC<{
  presetId: BrushPresetId;
  color: string;
  heightClass?: string;
}> = React.memo(({ presetId, color, heightClass = 'h-5' }) => {
  const dataUrl = useMemo(
    () => renderTexturePreviewDataUrl(presetId, color),
    [presetId, color]
  );
  const lightBg = useMemo(() => isDarkTint(color), [color]);

  if (!dataUrl) {
    return (
      <div
        className={`w-full ${heightClass} rounded flex items-center justify-center bg-[#140903]`}
      >
        <span
          className="block w-10 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full ${heightClass} rounded flex items-center justify-center overflow-hidden ${
        lightBg
          ? 'bg-[#ead8b8]/92 border border-[#b98241]/30'
          : 'bg-[#120803]/90'
      }`}
    >
      <img
        src={dataUrl}
        alt=""
        draggable={false}
        className="w-full h-full object-contain pointer-events-none select-none"
      />
    </div>
  );
});
LiveTexturePreview.displayName = 'LiveTexturePreview';
