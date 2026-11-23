import {
  DEFAULT_WORKSPACE,
  INITIAL_ARMARIO_MANNEQUINS,
  INITIAL_DESK_NOTES,
  INITIAL_LEFT_MANNEQUINS,
  INITIAL_WARDROBE_SPREAD,
  ositoGrid,
} from '../data/seedData';
import type {
  DressingRoomGarment,
  ExtractedMandalaRecord,
  NotebookWorkspaceData,
  VestidorDecorElement,
} from '../types/crochet';

const DB_NAME = 'cuaderno_artista_crochet_db';
const DB_VERSION = 1;
const STORE_NAME = 'workspace';
const WORKSPACE_KEY = 'main_notebook_v1';
const EXTRACTED_MANDALAS_KEY = 'extracted_mandalas_v1';
const CUSTOM_FAIRY_3D_KEY = 'custom_fairy_3d_glb_v1';
const VESTIDOR_CATALOG_V2_KEY = 'vestidor_dorado_catalog_v2';
const LOCAL_BACKUP_KEY = 'cuaderno_artista_crochet_fallback_v1';
const VESTIDOR_LOCAL_BACKUP_KEY = 'vestidor_dorado_catalog_v2_fallback';

export interface StoredFairyModel3D {
  name: string;
  buffer: ArrayBuffer;
  updatedAt: number;
}

const DEFAULT_SPREAD1_LEFT_IDS = new Set([
  'el-welcome-title',
  'el-welcome-note',
  'el-sticker-1',
  'el-sticker-2',
]);

function normalizeLoadedWorkspace(raw: Partial<NotebookWorkspaceData>): NotebookWorkspaceData {
  const merged: NotebookWorkspaceData = { ...DEFAULT_WORKSPACE, ...raw };
  if (!Array.isArray(merged.deskNotes) || merged.deskNotes.length === 0) {
    merged.deskNotes = INITIAL_DESK_NOTES;
  }
  if (!raw.mannequinsSeededV1 && Array.isArray(merged.spreads) && merged.spreads.length > 0) {
    merged.spreads = merged.spreads.map((sp, idx) => {
      if (sp.id !== 'spread-1' && idx !== 0) return sp;
      const hasMannequin = sp.elements.some((el) => el.type === 'mannequin');
      if (hasMannequin) return sp;
      const leftElements = sp.elements.filter((el) => el.side === 'left');
      const rightElements = sp.elements.filter((el) => el.side === 'right');
      const isOnlyStarterOrEmpty =
        leftElements.length === 0 ||
        leftElements.every((el) => DEFAULT_SPREAD1_LEFT_IDS.has(el.id));
      return {
        ...sp,
        elements: isOnlyStarterOrEmpty
          ? [...INITIAL_LEFT_MANNEQUINS, ...rightElements]
          : [...INITIAL_LEFT_MANNEQUINS, ...leftElements, ...rightElements],
      };
    });
    merged.mannequinsSeededV1 = true;
  }
  if (!raw.wardrobeSeededV1 && Array.isArray(merged.spreads)) {
    const alreadyHasWardrobe = merged.spreads.some((sp) =>
      sp.elements.some((el) => el.type === 'wardrobe')
    );
    if (!alreadyHasWardrobe) {
      merged.spreads = [INITIAL_WARDROBE_SPREAD, ...merged.spreads];
    }
    merged.wardrobeSeededV1 = true;
  }
  if (Array.isArray(merged.spreads)) {
    const needsFullBody360Migration = !raw.mannequinsFullBody360V1;

    merged.spreads = merged.spreads.map((sp) => {
      const isWardrobeSpread =
        sp.id === 'spread-armario' || sp.elements.some((el) => el.type === 'wardrobe');

      let nextElements = sp.elements.map((el) => {
        if (el.type !== 'mannequin') return el;

        // Upgrade legacy mannequins to full-body 360° male + female pair on first load
        if (needsFullBody360Migration) {
          if (el.id === 'el-armario-mannequin-front' || el.id === 'el-mannequin-front') {
            return {
              ...el,
              mannequinGender: 'male' as const,
              mannequinYawDeg: 0,
              content: 'front',
              x: 5,
              y: 9,
              width: 192,
              title: 'Maniquí Hombre 360°',
              permanent: el.id === 'el-armario-mannequin-front' ? true : el.permanent,
            };
          }
          if (el.id === 'el-armario-mannequin-back' || el.id === 'el-mannequin-back') {
            return {
              ...el,
              mannequinGender: 'female' as const,
              mannequinYawDeg: 0,
              content: 'front',
              x: 50,
              y: 9,
              width: 192,
              title: 'Maniquí Mujer 360°',
              permanent: el.id === 'el-armario-mannequin-back' ? true : el.permanent,
            };
          }
        }

        // Backfill missing gender / yaw fields for any existing mannequin element
        const inferredGender =
          el.mannequinGender ??
          (el.id.includes('back') || el.title?.toLowerCase().includes('mujer') ? 'female' : 'male');
        const inferredYaw =
          typeof el.mannequinYawDeg === 'number'
            ? el.mannequinYawDeg
            : el.content === 'back'
              ? 180
              : 0;

        const isPermWardrobeMannequin =
          el.id === 'el-armario-mannequin-front' || el.id === 'el-armario-mannequin-back';
        return {
          ...el,
          mannequinGender: inferredGender,
          mannequinYawDeg: inferredYaw,
          ...(isPermWardrobeMannequin ? { permanent: true } : {}),
        };
      });

      if (isWardrobeSpread) {
        for (const reqMannequin of INITIAL_ARMARIO_MANNEQUINS) {
          const exists = nextElements.some(
            (el) =>
              el.id === reqMannequin.id ||
              (el.type === 'mannequin' &&
                el.side === 'right' &&
                el.mannequinGender === reqMannequin.mannequinGender)
          );
          if (!exists) {
            nextElements = [...nextElements, { ...reqMannequin, permanent: true }];
          } else {
            nextElements = nextElements.map((el) =>
              el.id === reqMannequin.id
                ? { ...el, permanent: true }
                : el
            );
          }
        }
      }

      return { ...sp, elements: nextElements };
    });

    if (needsFullBody360Migration) {
      merged.mannequinsFullBody360V1 = true;
    }
  }
  merged.patterns = merged.patterns.map((p) => {
    if (p.id === 'pat-osito-algodon') {
      const hasAnyStitch = p.diagramGrid?.some((row) => row.some((cell) => Boolean(cell)));
      if (!hasAnyStitch) {
        return { ...p, diagramGrid: ositoGrid() };
      }
    }
    return p;
  });
  return merged;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function mergeExtractedMandalas(
  a?: Record<string, ExtractedMandalaRecord>,
  b?: Record<string, ExtractedMandalaRecord>
): Record<string, ExtractedMandalaRecord> {
  const result: Record<string, ExtractedMandalaRecord> = { ...(a ?? {}) };
  if (!b) return result;
  for (const [id, rec] of Object.entries(b)) {
    const prev = result[id];
    if (!prev || (rec.updatedAt && (!prev.updatedAt || rec.updatedAt >= prev.updatedAt))) {
      result[id] = rec;
    }
  }
  return result;
}

export async function saveExtractedMandalas(
  map: Record<string, ExtractedMandalaRecord>
): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(map, EXTRACTED_MANDALAS_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // IndexedDB unavailable — workspace fallback handles persistence
  }
}

export async function saveCustomFairyModel3D(model: StoredFairyModel3D): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(model, CUSTOM_FAIRY_3D_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadCustomFairyModel3D(): Promise<StoredFairyModel3D | null> {
  try {
    const db = await openDB();
    return await new Promise<StoredFairyModel3D | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(CUSTOM_FAIRY_3D_KEY);
      req.onsuccess = () => {
        const res = req.result as StoredFairyModel3D | undefined;
        if (res && res.buffer instanceof ArrayBuffer && res.buffer.byteLength > 0) {
          resolve(res);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearCustomFairyModel3D(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(CUSTOM_FAIRY_3D_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
}

/**
 * Dedicated persistent catalog store for El Vestidor Dorado (starts with ZERO garments
 * and persists user-created designs & multi-angle photographs across browser & Windows restarts).
 */
export async function loadVestidorCatalog(): Promise<DressingRoomGarment[]> {
  try {
    const db = await openDB();
    const fromIdb = await new Promise<DressingRoomGarment[] | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(VESTIDOR_CATALOG_V2_KEY);
      req.onsuccess = () => {
        const res = req.result;
        resolve(Array.isArray(res) ? (res as DressingRoomGarment[]) : null);
      };
      req.onerror = () => resolve(null);
    });
    if (fromIdb) return fromIdb;
  } catch {
    // Fall back to localStorage below
  }

  try {
    const raw = localStorage.getItem(VESTIDOR_LOCAL_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as DressingRoomGarment[];
    }
  } catch {
    // ignore corrupted fallback
  }

  return [];
}

export async function saveVestidorCatalog(items: DressingRoomGarment[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(items, VESTIDOR_CATALOG_V2_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // IndexedDB unavailable — localStorage fallback below handles persistence
  }

  try {
    localStorage.setItem(VESTIDOR_LOCAL_BACKUP_KEY, JSON.stringify(items));
  } catch {
    // Ignore localStorage quota overflow when IndexedDB already stored full-res images
  }
}

const VESTIDOR_TRASH_KEY = 'vestidor_dorado_trash_v1';
const VESTIDOR_TRASH_LOCAL_KEY = 'vestidor_dorado_trash_v1_fallback';
const VESTIDOR_PREFS_LOCAL_KEY = 'vestidor_dorado_prefs_v1';

export const DEFAULT_VESTIDOR_PREFERENCES = {
  soundEnabled: false,
  spinSpeed: 'normal' as const,
  performanceMode: 'equilibrado' as const,
  reduceMotion: false,
  autoSaveEnabled: true,
};

export async function loadVestidorTrash(): Promise<DressingRoomGarment[]> {
  try {
    const db = await openDB();
    const fromIdb = await new Promise<DressingRoomGarment[] | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(VESTIDOR_TRASH_KEY);
      req.onsuccess = () => {
        const res = req.result;
        resolve(Array.isArray(res) ? (res as DressingRoomGarment[]) : null);
      };
      req.onerror = () => resolve(null);
    });
    if (fromIdb) return fromIdb;
  } catch {
    // Fall back to localStorage
  }
  try {
    const raw = localStorage.getItem(VESTIDOR_TRASH_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as DressingRoomGarment[];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function saveVestidorTrash(items: DressingRoomGarment[]): Promise<void> {
  const trimmed = items.slice(0, 30);
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(trimmed, VESTIDOR_TRASH_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // fallback below
  }
  try {
    localStorage.setItem(VESTIDOR_TRASH_LOCAL_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore quota
  }
}

export function loadVestidorPreferences(): {
  soundEnabled: boolean;
  spinSpeed: 'lento' | 'normal' | 'rapido';
  performanceMode: 'ahorro' | 'equilibrado' | 'alto';
  reduceMotion: boolean;
  autoSaveEnabled: boolean;
  lastSavedAt?: string;
} {
  try {
    const raw = localStorage.getItem(VESTIDOR_PREFS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_VESTIDOR_PREFERENCES,
        ...parsed,
        soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : false,
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_VESTIDOR_PREFERENCES };
}

export function saveVestidorPreferences(prefs: {
  soundEnabled: boolean;
  spinSpeed: 'lento' | 'normal' | 'rapido';
  performanceMode: 'ahorro' | 'equilibrado' | 'alto';
  reduceMotion: boolean;
  autoSaveEnabled: boolean;
  lastSavedAt?: string;
}): void {
  try {
    localStorage.setItem(VESTIDOR_PREFS_LOCAL_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

const VESTIDOR_DECOR_KEY = 'vestidor_dorado_decorations_v1';
const VESTIDOR_DECOR_LOCAL_KEY = 'vestidor_dorado_decorations_v1_fallback';

export async function loadVestidorDecorations(): Promise<VestidorDecorElement[] | null> {
  try {
    const db = await openDB();
    const fromIdb = await new Promise<VestidorDecorElement[] | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(VESTIDOR_DECOR_KEY);
      req.onsuccess = () => {
        const res = req.result;
        resolve(Array.isArray(res) ? (res as VestidorDecorElement[]) : null);
      };
      req.onerror = () => resolve(null);
    });
    if (fromIdb) return fromIdb;
  } catch {
    // Fall back to localStorage below
  }

  try {
    const raw = localStorage.getItem(VESTIDOR_DECOR_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as VestidorDecorElement[];
    }
  } catch {
    // ignore
  }

  return null;
}

export async function saveVestidorDecorations(items: VestidorDecorElement[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(items, VESTIDOR_DECOR_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // fallback below
  }

  try {
    localStorage.setItem(VESTIDOR_DECOR_LOCAL_KEY, JSON.stringify(items));
  } catch {
    // ignore quota when custom images are stored in IndexedDB
  }
}

export async function loadWorkspace(): Promise<NotebookWorkspaceData> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const wsReq = store.get(WORKSPACE_KEY);
      const mandalasReq = store.get(EXTRACTED_MANDALAS_KEY);

      let wsResult: Partial<NotebookWorkspaceData> | undefined;
      let mandalasResult: Record<string, ExtractedMandalaRecord> | undefined;
      let settled = 0;

      const finish = () => {
        settled += 1;
        if (settled < 2) return;
        const base = wsResult ? normalizeLoadedWorkspace(wsResult) : { ...DEFAULT_WORKSPACE };
        const mergedMandalas = mergeExtractedMandalas(base.extractedMandalas, mandalasResult);
        if (Object.keys(mergedMandalas).length > 0) {
          base.extractedMandalas = mergedMandalas;
        }
        resolve(base);
      };

      wsReq.onsuccess = () => {
        wsResult = wsReq.result as Partial<NotebookWorkspaceData> | undefined;
        finish();
      };
      wsReq.onerror = () => finish();

      mandalasReq.onsuccess = () => {
        mandalasResult = mandalasReq.result as Record<string, ExtractedMandalaRecord> | undefined;
        finish();
      };
      mandalasReq.onerror = () => finish();
    });
  } catch {
    try {
      const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
      if (raw) {
        return normalizeLoadedWorkspace(JSON.parse(raw) as Partial<NotebookWorkspaceData>);
      }
    } catch {
      // ignore
    }
    return DEFAULT_WORKSPACE;
  }
}

export async function saveWorkspace(data: NotebookWorkspaceData): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, WORKSPACE_KEY);
      if (data.extractedMandalas) {
        store.put(data.extractedMandalas, EXTRACTED_MANDALAS_KEY);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    try {
      localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(data));
    } catch {
      // ignore quota errors
    }
  }
}

export function exportWorkspaceJson(data: NotebookWorkspaceData): void {
  const payload = JSON.stringify(data, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Cuaderno-del-Artista-${dateTag}.cuaderno.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function compressImageFile(
  file: File,
  maxDimension = 900,
  preserveAlpha = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('No se pudo inicializar el lienzo de imagen.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const wantsTransparency =
          preserveAlpha || file.type === 'image/png' || file.type === 'image/webp';
        if (wantsTransparency) {
          const webpAlpha = canvas.toDataURL('image/webp', 0.88);
          const result = webpAlpha.startsWith('data:image/webp')
            ? webpAlpha
            : canvas.toDataURL('image/png');
          URL.revokeObjectURL(objectUrl);
          resolve(result);
          return;
        }
        const webp = canvas.toDataURL('image/webp', 0.82);
        const result = webp.startsWith('data:image/webp')
          ? webp
          : canvas.toDataURL('image/jpeg', 0.82);
        URL.revokeObjectURL(objectUrl);
        resolve(result);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = objectUrl;
  });
}
