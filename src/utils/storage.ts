import {
  DEFAULT_WORKSPACE,
  INITIAL_DESK_NOTES,
  INITIAL_LEFT_MANNEQUINS,
  INITIAL_WARDROBE_SPREAD,
  ositoGrid,
} from '../data/seedData';
import type { NotebookWorkspaceData } from '../types/crochet';

const DB_NAME = 'cuaderno_artista_crochet_db';
const DB_VERSION = 1;
const STORE_NAME = 'workspace';
const WORKSPACE_KEY = 'main_notebook_v1';
const LOCAL_BACKUP_KEY = 'cuaderno_artista_crochet_fallback_v1';

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

export async function loadWorkspace(): Promise<NotebookWorkspaceData> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(WORKSPACE_KEY);
      req.onsuccess = () => {
        if (req.result) {
          resolve(normalizeLoadedWorkspace(req.result as Partial<NotebookWorkspaceData>));
        } else {
          resolve(DEFAULT_WORKSPACE);
        }
      };
      req.onerror = () => resolve(DEFAULT_WORKSPACE);
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
      const req = store.put(data, WORKSPACE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
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

export function compressImageFile(file: File, maxDimension = 900): Promise<string> {
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
