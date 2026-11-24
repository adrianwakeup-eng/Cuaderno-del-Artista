// Persistent IndexedDB store for Atelier Community publications (photos, videos, files, comments & members).

export interface CommunityAttachmentMeta {
  id: string;
  kind: 'image' | 'video' | 'file';
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** Static bundled asset URL (for seed posts) or resolved object URL at runtime */
  url?: string;
}

export interface CommunityComment {
  id: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorRole: string;
  text: string;
  createdAt: number;
  attachments: CommunityAttachmentMeta[];
  likes: number;
  likedByMe?: boolean;
  comments: CommunityComment[];
}

export interface CommunityMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  status: 'online' | 'crafting' | 'away';
  avatarColor: string;
}

const DB_NAME = 'CuadernoCommunityDB';
const DB_VERSION = 1;
const POSTS_STORE = 'posts';
const BLOBS_STORE = 'blobs';
const PROFILE_KEY = 'cuaderno_community_profile_v1';

export const DEFAULT_COMMUNITY_MEMBERS: CommunityMember[] = [
  {
    id: 'mem-1',
    name: 'Adrián · Maestro del Atelier',
    role: 'Diseñador Principal',
    specialty: 'Alta Costura en Crochet y Mandalas',
    status: 'online',
    avatarColor: '#c98a36',
  },
  {
    id: 'mem-2',
    name: 'Valeria Luna',
    role: 'Tejedora Botánica',
    specialty: 'Granny Squares y Flores 3D',
    status: 'online',
    avatarColor: '#2f7a54',
  },
  {
    id: 'mem-3',
    name: 'Mateo Solís',
    role: 'Artesano de Macramé',
    specialty: 'Atrapasueños y Encaje Fino',
    status: 'crafting',
    avatarColor: '#285a8f',
  },
  {
    id: 'mem-4',
    name: 'Sofía Marfil',
    role: 'Especialista Amigurumi',
    specialty: 'Patrones y Accesorios',
    status: 'online',
    avatarColor: '#9d2d48',
  },
];

const SEED_POSTS: CommunityPost[] = [
  {
    id: 'seed-post-1',
    authorName: 'Adrián · Maestro del Atelier',
    authorRole: 'Diseñador Principal',
    text: '¡Bienvenidos al Taller Comunitario! Aquí pueden compartir fotos, videos de sus puntadas, subir patrones en PDF o archivos del cuaderno e iniciar llamadas de audio o video en vivo con los demás integrantes.',
    createdAt: Date.now() - 1000 * 60 * 45,
    attachments: [
      {
        id: 'seed-att-1',
        kind: 'image',
        name: 'Girasol-Atelier-HD.png',
        mimeType: 'image/png',
        sizeBytes: 248000,
        url: '/vestidor/artisan/crochet-sunflower.png',
      },
    ],
    likes: 12,
    likedByMe: false,
    comments: [
      {
        id: 'seed-c-1',
        authorName: 'Valeria Luna',
        text: '¡Hermoso! Ya probé la videollamada para mostrar el punto abanico.',
        createdAt: Date.now() - 1000 * 60 * 20,
      },
    ],
  },
];

function openCommunityDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(POSTS_STORE)) {
        db.createObjectStore(POSTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(BLOBS_STORE)) {
        db.createObjectStore(BLOBS_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Error abriendo IndexedDB de comunidad'));
  });
}

export function loadMyCommunityProfile(): { name: string; role: string } {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { name?: string; role?: string };
      if (parsed.name?.trim()) {
        return { name: parsed.name.trim(), role: parsed.role?.trim() || 'Integrante del Taller' };
      }
    }
  } catch {
    // ignore
  }
  return { name: 'Artista del Taller', role: 'Integrante del Atelier' };
}

export function saveMyCommunityProfile(name: string, role: string): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, role }));
  } catch {
    // ignore
  }
}

export async function loadCommunityPosts(): Promise<{
  posts: CommunityPost[];
  blobUrls: Record<string, string>;
}> {
  try {
    const db = await openCommunityDB();
    const posts = await new Promise<CommunityPost[]>((resolve, reject) => {
      const tx = db.transaction(POSTS_STORE, 'readonly');
      const req = tx.objectStore(POSTS_STORE).getAll();
      req.onsuccess = () => resolve((req.result as CommunityPost[]) || []);
      req.onerror = () => reject(req.error);
    });

    const blobs = await new Promise<Array<{ id: string; blob: Blob }>>((resolve, reject) => {
      const tx = db.transaction(BLOBS_STORE, 'readonly');
      const req = tx.objectStore(BLOBS_STORE).getAll();
      req.onsuccess = () => resolve((req.result as Array<{ id: string; blob: Blob }>) || []);
      req.onerror = () => reject(req.error);
    });

    const blobUrls: Record<string, string> = {};
    for (const item of blobs) {
      if (item.blob instanceof Blob) {
        blobUrls[item.id] = URL.createObjectURL(item.blob);
      }
    }

    if (posts.length === 0) {
      return { posts: SEED_POSTS, blobUrls };
    }
    posts.sort((a, b) => b.createdAt - a.createdAt);
    return { posts, blobUrls };
  } catch {
    return { posts: SEED_POSTS, blobUrls: {} };
  }
}

export async function saveCommunityPost(
  post: CommunityPost,
  newBlobs: Array<{ id: string; blob: Blob }> = []
): Promise<void> {
  try {
    const db = await openCommunityDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([POSTS_STORE, BLOBS_STORE], 'readwrite');
      tx.objectStore(POSTS_STORE).put(post);
      const bStore = tx.objectStore(BLOBS_STORE);
      for (const item of newBlobs) {
        bStore.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Keep in memory if quota exceeded
  }
}

export async function deleteCommunityPost(post: CommunityPost): Promise<void> {
  try {
    const db = await openCommunityDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([POSTS_STORE, BLOBS_STORE], 'readwrite');
      tx.objectStore(POSTS_STORE).delete(post.id);
      const bStore = tx.objectStore(BLOBS_STORE);
      for (const att of post.attachments) {
        bStore.delete(att.id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export async function getCommunityAttachmentBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openCommunityDB();
    return await new Promise<Blob | null>((resolve) => {
      const tx = db.transaction(BLOBS_STORE, 'readonly');
      const req = tx.objectStore(BLOBS_STORE).get(id);
      req.onsuccess = () => {
        const res = req.result as { id: string; blob?: Blob } | undefined;
        resolve(res?.blob ?? null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
