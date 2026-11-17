import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import type { NotebookWorkspaceData } from '../types/crochet';

export const GOOGLE_DRIVE_SCOPES: string[] = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of GOOGLE_DRIVE_SCOPES) {
  provider.addScope(scope);
}

let isSigningIn = false;
// Strictly in-memory OAuth access token cache (never stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user && cachedAccessToken) {
      onAuthSuccess?.(user, cachedAccessToken);
    } else if (!isSigningIn) {
      if (!user) {
        cachedAccessToken = null;
      }
      onAuthFailure?.();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se obtuvo el token de acceso de Google Drive.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => cachedAccessToken;

export const clearDriveAccessToken = (): void => {
  cachedAccessToken = null;
};

export const signOutGoogleDrive = async (): Promise<void> => {
  cachedAccessToken = null;
  await auth.signOut();
};

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  thumbnailLink?: string;
  webViewLink?: string;
}

export class DriveAuthExpiredError extends Error {
  constructor() {
    super('La sesión de Google Drive ha expirado. Vuelve a iniciar sesión.');
  }
}

async function driveFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = getDriveAccessToken();
  if (!token) {
    throw new DriveAuthExpiredError();
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    clearDriveAccessToken();
    throw new DriveAuthExpiredError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Error de Google Drive (${res.status})`);
  }
  return res;
}

export async function listDriveFiles(options: {
  mode: 'backups' | 'images' | 'all';
  query?: string;
  pageSize?: number;
}): Promise<DriveFileItem[]> {
  const clauses = ['trashed = false'];
  if (options.mode === 'backups') {
    clauses.push("(name contains '.cuaderno.json' or mimeType = 'application/json')");
  } else if (options.mode === 'images') {
    clauses.push("mimeType contains 'image/'");
  }
  if (options.query && options.query.trim()) {
    const safe = options.query.trim().replace(/'/g, "\\'");
    clauses.push(`name contains '${safe}'`);
  }

  const params = new URLSearchParams({
    q: clauses.join(' and '),
    fields: 'files(id,name,mimeType,modifiedTime,size,thumbnailLink,webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: String(options.pageSize ?? 30),
  });

  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
  const json = (await res.json()) as { files?: DriveFileItem[] };
  return json.files || [];
}

export async function saveNotebookBackupToDrive(params: {
  workspace: NotebookWorkspaceData;
  fileName: string;
  existingFileId?: string;
}): Promise<DriveFileItem> {
  const cleanName = params.fileName.trim().endsWith('.cuaderno.json')
    ? params.fileName.trim()
    : `${params.fileName.trim() || 'Cuaderno-del-Artista'}.cuaderno.json`;

  const metadata = {
    name: cleanName,
    mimeType: 'application/json',
  };
  const payload = JSON.stringify(params.workspace, null, 2);

  const boundary = `cuaderno_drive_${Date.now()}`;
  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${payload}\r\n` +
    `--${boundary}--`;

  const url = params.existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(params.existingFileId)}?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size';

  const res = await driveFetch(url, {
    method: params.existingFileId ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  return (await res.json()) as DriveFileItem;
}

export async function downloadNotebookBackupFromDrive(
  fileId: string
): Promise<NotebookWorkspaceData> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`
  );
  const data = (await res.json()) as NotebookWorkspaceData;
  if (!data || !Array.isArray(data.spreads)) {
    throw new Error('El archivo seleccionado no es un respaldo válido del cuaderno.');
  }
  return data;
}

export async function downloadDriveImageAsFile(item: DriveFileItem): Promise<File> {
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(item.id)}?alt=media`
  );
  const blob = await res.blob();
  return new File([blob], item.name, { type: blob.type || item.mimeType || 'image/png' });
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
  });
}
