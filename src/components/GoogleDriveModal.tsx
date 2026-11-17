import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { User } from 'firebase/auth';
import {
  AlertTriangle,
  Cloud,
  CloudUpload,
  Download,
  FileJson,
  FolderSearch,
  Image as ImageIcon,
  LogOut,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { NotebookWorkspaceData } from '../types/crochet';
import {
  deleteDriveFile,
  downloadDriveImageAsFile,
  downloadNotebookBackupFromDrive,
  DriveAuthExpiredError,
  listDriveFiles,
  saveNotebookBackupToDrive,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  type DriveFileItem,
} from '../utils/googleDrive';

interface GoogleDriveModalProps {
  isOpen: boolean;
  initialTab?: 'backups' | 'images' | 'all';
  onClose: () => void;
  workspace: NotebookWorkspaceData;
  needsAuth: boolean;
  user: User | null;
  onAuthChanged: (user: User | null, needsAuth: boolean) => void;
  onRestoreWorkspace: (data: NotebookWorkspaceData) => void;
  onInsertDriveImage: (file: File) => Promise<void>;
  onNotify: (msg: string) => void;
}

type PendingMutation =
  | { kind: 'save-new'; fileName: string }
  | { kind: 'overwrite'; file: DriveFileItem }
  | { kind: 'delete'; file: DriveFileItem }
  | null;

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  initialTab = 'backups',
  onClose,
  workspace,
  needsAuth,
  user,
  onAuthChanged,
  onRestoreWorkspace,
  onInsertDriveImage,
  onNotify,
}) => {
  const [tab, setTab] = useState<'backups' | 'images' | 'all'>(initialTab);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [backupName, setBackupName] = useState(
    `Cuaderno-del-Artista-${new Date().toISOString().slice(0, 10)}`
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [pendingMutation, setPendingMutation] = useState<PendingMutation>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const loadFiles = useCallback(async () => {
    if (needsAuth) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await listDriveFiles({
        mode: tab,
        query: searchQuery,
        pageSize: 30,
      });
      setFiles(list);
    } catch (err) {
      if (err instanceof DriveAuthExpiredError) {
        onAuthChanged(null, true);
      }
      setErrorMsg(err instanceof Error ? err.message : 'No se pudieron cargar los archivos.');
    } finally {
      setLoading(false);
    }
  }, [needsAuth, tab, searchQuery, onAuthChanged]);

  useEffect(() => {
    if (isOpen && !needsAuth) {
      void loadFiles();
    }
  }, [isOpen, needsAuth, tab, loadFiles]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await signInWithGoogleDrive();
      onAuthChanged(result.user, false);
      onNotify('Conectado con Google Drive');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOutGoogleDrive();
    setFiles([]);
    onAuthChanged(null, true);
    onNotify('Sesión de Google Drive cerrada');
  };

  const handleRestoreBackup = async (item: DriveFileItem) => {
    setBusyAction(`restore-${item.id}`);
    setErrorMsg(null);
    try {
      const data = await downloadNotebookBackupFromDrive(item.id);
      onRestoreWorkspace(data);
      onNotify(`Cuaderno restaurado desde "${item.name}"`);
      onClose();
    } catch (err) {
      if (err instanceof DriveAuthExpiredError) {
        onAuthChanged(null, true);
      }
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo restaurar el respaldo.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleInsertImage = async (item: DriveFileItem) => {
    setBusyAction(`img-${item.id}`);
    setErrorMsg(null);
    try {
      const file = await downloadDriveImageAsFile(item);
      await onInsertDriveImage(file);
      onClose();
    } catch (err) {
      if (err instanceof DriveAuthExpiredError) {
        onAuthChanged(null, true);
      }
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo importar la imagen.');
    } finally {
      setBusyAction(null);
    }
  };

  const executeConfirmedMutation = async () => {
    if (!pendingMutation) return;
    const mutation = pendingMutation;
    setPendingMutation(null);
    setBusyAction('mutating');
    setErrorMsg(null);
    try {
      if (mutation.kind === 'save-new') {
        const saved = await saveNotebookBackupToDrive({
          workspace,
          fileName: mutation.fileName,
        });
        onNotify(`Respaldo guardado en Drive: ${saved.name}`);
        await loadFiles();
      } else if (mutation.kind === 'overwrite') {
        const updated = await saveNotebookBackupToDrive({
          workspace,
          fileName: mutation.file.name,
          existingFileId: mutation.file.id,
        });
        onNotify(`Respaldo actualizado en Drive: ${updated.name}`);
        await loadFiles();
      } else if (mutation.kind === 'delete') {
        await deleteDriveFile(mutation.file.id);
        setFiles((prev) => prev.filter((f) => f.id !== mutation.file.id));
        onNotify(`Archivo eliminado de Drive: ${mutation.file.name}`);
      }
    } catch (err) {
      if (err instanceof DriveAuthExpiredError) {
        onAuthChanged(null, true);
      }
      setErrorMsg(err instanceof Error ? err.message : 'Error al ejecutar la operación en Drive.');
    } finally {
      setBusyAction(null);
    }
  };

  const formatSize = (sizeStr?: string) => {
    const bytes = Number(sizeStr);
    if (!bytes || Number.isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl leather-panel bg-[#221208] text-[#f5e4c4] overflow-hidden shadow-[0_28px_65px_rgba(0,0,0,0.92)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#b98241]/30 bg-[#2d180c]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#492915] border border-[#e3b366]/45 flex items-center justify-center shrink-0">
                  <Cloud className="w-4 h-4 text-[#f3cf8a]" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-base text-[#ffebc2] truncate">
                    Google Drive · Cuaderno en la Nube
                  </h2>
                  <p className="text-[11px] text-[#d6ba91] truncate">
                    {user?.email && !needsAuth
                      ? `Conectado como ${user.displayName || user.email}`
                      : 'Guarda respaldos del cuaderno e importa fotos desde tu Drive'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!needsAuth && user && (
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#3a1f10] border border-[#c99552]/35 text-xs text-[#efd6ae] hover:bg-[#573119] cursor-pointer"
                    title="Cerrar sesión de Google Drive"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Desconectar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar ventana de Google Drive"
                  className="p-1.5 rounded-lg text-[#dec39c] hover:text-white hover:bg-[#4b2914] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto studio-scroll p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-[#5e1f24] border border-[#e3868c]/45 text-xs text-[#ffdfe2]">
                  {errorMsg}
                </div>
              )}

              {needsAuth ? (
                <div className="py-10 px-4 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#381f10] border border-[#dfae62]/45 flex items-center justify-center shadow-inner">
                    <Cloud className="w-8 h-8 text-[#f2cb7e]" />
                  </div>
                  <div className="max-w-md space-y-1.5">
                    <h3 className="font-display text-lg text-[#ffebc2]">
                      Conecta tu Google Drive
                    </h3>
                    <p className="text-xs sm:text-sm text-[#e1c69f] leading-relaxed">
                      Inicia sesión con tu cuenta de Google para guardar copias de seguridad de tus hojas y patrones, restaurar tu cuaderno o insertar tus propias fotografías directamente desde Drive.
                    </p>
                  </div>

                  {/* Official Sign in with Google button */}
                  <button
                    type="button"
                    onClick={() => void handleLogin()}
                    disabled={isLoggingIn}
                    className="gsi-material-button"
                  >
                    <div className="gsi-material-button-state" />
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 48 48"
                          style={{ display: 'block' }}
                        >
                          <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                          />
                          <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                          />
                          <path fill="none" d="M0 0h48v48H0z" />
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents">
                        {isLoggingIn ? 'Conectando…' : 'Sign in with Google'}
                      </span>
                      <span style={{ display: 'none' }}>Sign in with Google</span>
                    </div>
                  </button>
                </div>
              ) : (
                <>
                  {/* Tabs + Refresh */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-[#160b05] border border-[#b98241]/30 text-xs">
                      <button
                        type="button"
                        onClick={() => setTab('backups')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          tab === 'backups'
                            ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white font-medium'
                            : 'text-[#dec39c] hover:text-white'
                        }`}
                      >
                        <FileJson className="w-3.5 h-3.5" />
                        <span>Respaldos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('images')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          tab === 'images'
                            ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white font-medium'
                            : 'text-[#dec39c] hover:text-white'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Fotos de Drive</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('all')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          tab === 'all'
                            ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white font-medium'
                            : 'text-[#dec39c] hover:text-white'
                        }`}
                      >
                        <FolderSearch className="w-3.5 h-3.5" />
                        <span>Todos</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-[#cfa876] absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void loadFiles();
                          }}
                          placeholder="Buscar en Drive…"
                          className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[#160b05] border border-[#b98241]/35 text-xs text-[#f6e4c4] focus:outline-none focus:border-[#ebb96a]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void loadFiles()}
                        disabled={loading}
                        title="Actualizar lista"
                        className="p-2 rounded-lg bg-[#361d0e] border border-[#c99552]/40 text-[#f3dcb3] hover:bg-[#522f18] cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Save New Backup Card (Backups tab) */}
                  {tab === 'backups' && (
                    <div className="p-3.5 rounded-xl bg-[#2d180c] border border-[#c99552]/35 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <div className="flex-1 min-w-0">
                        <label className="block text-[11px] text-[#e0c399] mb-1">
                          Guardar cuaderno actual en Google Drive ({workspace.spreads.length} hojas ·{' '}
                          {workspace.patterns.length} patrones)
                        </label>
                        <input
                          type="text"
                          value={backupName}
                          onChange={(e) => setBackupName(e.target.value)}
                          placeholder="Nombre del respaldo"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#160b05] border border-[#b98241]/40 text-xs text-[#f7e5c6] focus:outline-none focus:border-[#ebb96a]"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={busyAction !== null || !backupName.trim()}
                        onClick={() =>
                          setPendingMutation({
                            kind: 'save-new',
                            fileName: backupName.trim(),
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white shadow cursor-pointer disabled:opacity-50 shrink-0 sm:mt-4"
                      >
                        <CloudUpload className="w-4 h-4" />
                        <span>Subir respaldo</span>
                      </button>
                    </div>
                  )}

                  {/* Files List */}
                  {loading ? (
                    <div className="py-12 text-center text-xs text-[#dec49d]">
                      Cargando archivos de Google Drive…
                    </div>
                  ) : files.length === 0 ? (
                    <div className="py-12 text-center rounded-xl border border-dashed border-[#b98241]/30 text-xs text-[#d6ba91]">
                      {tab === 'backups'
                        ? 'No se encontraron respaldos (.cuaderno.json) en tu Google Drive.'
                        : tab === 'images'
                          ? 'No se encontraron imágenes con esa búsqueda en tu Google Drive.'
                          : 'No se encontraron archivos en tu Google Drive.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {files.map((item) => {
                        const isJson =
                          item.name.endsWith('.json') || item.mimeType === 'application/json';
                        const isImage = item.mimeType.startsWith('image/');
                        return (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl bg-[#2a170c] border border-[#b98241]/30 flex items-center justify-between gap-2.5"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isImage && item.thumbnailLink ? (
                                <img
                                  src={item.thumbnailLink}
                                  alt={item.name}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-lg object-cover border border-[#c99552]/40 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-[#3c2110] border border-[#c99552]/30 flex items-center justify-center shrink-0">
                                  {isImage ? (
                                    <ImageIcon className="w-4 h-4 text-[#f0c77c]" />
                                  ) : (
                                    <FileJson className="w-4 h-4 text-[#f0c77c]" />
                                  )}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-[#ffebc2] truncate">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-[#cbb089] truncate">
                                  {item.modifiedTime
                                    ? new Date(item.modifiedTime).toLocaleDateString('es-ES')
                                    : ''}
                                  {item.size ? ` · ${formatSize(item.size)}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {isJson && (
                                <>
                                  <button
                                    type="button"
                                    disabled={busyAction !== null}
                                    onClick={() => void handleRestoreBackup(item)}
                                    title="Cargar este respaldo en el cuaderno"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3d5c3e] hover:bg-[#4d754f] text-[11px] text-white cursor-pointer"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Abrir</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyAction !== null}
                                    onClick={() =>
                                      setPendingMutation({ kind: 'overwrite', file: item })
                                    }
                                    title="Sobrescribir con el cuaderno actual"
                                    className="p-1.5 rounded-lg bg-[#3c2110] hover:bg-[#5b3319] border border-[#c99552]/35 text-[#f3dcb3] cursor-pointer"
                                  >
                                    <CloudUpload className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              {isImage && (
                                <button
                                  type="button"
                                  disabled={busyAction !== null}
                                  onClick={() => void handleInsertImage(item)}
                                  title="Insertar esta foto en la hoja actual"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-[11px] font-medium text-white cursor-pointer"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>Insertar</span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={busyAction !== null}
                                onClick={() =>
                                  setPendingMutation({ kind: 'delete', file: item })
                                }
                                title="Eliminar archivo de Google Drive"
                                className="p-1.5 rounded-lg bg-[#5e1f24] hover:bg-[#822a32] border border-[#e3868c]/35 text-[#ffdfe2] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mandatory Explicit User Confirmation Dialog for Mutating / Destructive Drive Actions */}
            <AnimatePresence>
              {pendingMutation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-md rounded-2xl leather-panel bg-[#241309] p-5 border border-[#e3b366]/60 shadow-2xl space-y-3"
                  >
                    <div className="flex items-center gap-2.5 text-[#ffebc2]">
                      <AlertTriangle className="w-5 h-5 text-[#f2b55c] shrink-0" />
                      <h4 className="font-display text-base">
                        {pendingMutation.kind === 'delete'
                          ? '¿Eliminar archivo de Google Drive?'
                          : pendingMutation.kind === 'overwrite'
                            ? '¿Sobrescribir respaldo en Google Drive?'
                            : '¿Guardar respaldo en Google Drive?'}
                      </h4>
                    </div>

                    <p className="text-xs sm:text-sm text-[#e5cba4] leading-relaxed">
                      {pendingMutation.kind === 'delete' ? (
                        <>
                          Esta acción eliminará permanentemente{' '}
                          <strong className="text-white">
                            {pendingMutation.file.name}
                          </strong>{' '}
                          de tu Google Drive. No se puede deshacer.
                        </>
                      ) : pendingMutation.kind === 'overwrite' ? (
                        <>
                          Se reemplazará el contenido de{' '}
                          <strong className="text-white">
                            {pendingMutation.file.name}
                          </strong>{' '}
                          en tu Google Drive con el estado actual del cuaderno ({workspace.spreads.length} hojas y {workspace.patterns.length} patrones).
                        </>
                      ) : (
                        <>
                          Se creará un nuevo archivo de respaldo llamado{' '}
                          <strong className="text-white">
                            {pendingMutation.fileName.endsWith('.cuaderno.json')
                              ? pendingMutation.fileName
                              : `${pendingMutation.fileName}.cuaderno.json`}
                          </strong>{' '}
                          en tu Google Drive con tus hojas, dibujos y patrones.
                        </>
                      )}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setPendingMutation(null)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#381f10] border border-[#c99552]/35 text-xs text-[#efd6ae] hover:bg-[#522e17] cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => void executeConfirmedMutation()}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium text-white cursor-pointer ${
                          pendingMutation.kind === 'delete'
                            ? 'bg-[#8b222b] hover:bg-[#ad2b36]'
                            : 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-110'
                        }`}
                      >
                        {pendingMutation.kind === 'delete'
                          ? 'Sí, eliminar'
                          : pendingMutation.kind === 'overwrite'
                            ? 'Sí, sobrescribir'
                            : 'Sí, guardar en Drive'}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
