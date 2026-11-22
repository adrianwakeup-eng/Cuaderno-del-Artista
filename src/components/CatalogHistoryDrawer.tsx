import React, { useEffect, useState } from 'react';
import { History, RotateCcw, Trash2, Undo2, X } from 'lucide-react';
import type { DressingRoomGarment, VestidorHistoryEntry } from '../types/crochet';

interface CatalogHistoryDrawerProps {
  isOpen: boolean;
  history: VestidorHistoryEntry[];
  trashItems: DressingRoomGarment[];
  onClose: () => void;
  onRestoreHistory: (entry: VestidorHistoryEntry) => void;
  onRestoreTrashed: (garmentId: string) => void;
  onPurgeTrashed: (garmentId: string) => void;
  onEmptyTrash: () => void;
}

export const CatalogHistoryDrawer: React.FC<CatalogHistoryDrawerProps> = ({
  isOpen,
  history,
  trashItems,
  onClose,
  onRestoreHistory,
  onRestoreTrashed,
  onPurgeTrashed,
  onEmptyTrash,
}) => {
  const [tab, setTab] = useState<'history' | 'trash'>(trashItems.length > 0 ? 'trash' : 'history');

  useEffect(() => {
    if (isOpen) {
      setTab(trashItems.length > 0 ? 'trash' : 'history');
    }
  }, [isOpen, trashItems.length]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Historial y recuperación de diseños"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2a140a]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[86vh] flex flex-col rounded-[24px] border-[4px] border-[#d9a66c] bg-[#fbf0df] text-[#452412] shadow-[0_22px_54px_rgba(38,16,6,0.48)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 bg-[#5c3118] text-[#ffe8ba] border-b border-[#d4a367]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#ffd96b]" />
            <h3 className="font-display text-sm sm:text-base font-bold">
              Historial y Recuperación
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar historial"
            className="w-7 h-7 rounded-full hover:bg-white/15 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#f4e4cd] border-b border-[#dfc098]">
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
              tab === 'history'
                ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
            }`}
          >
            Historial de cambios ({history.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('trash')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
              tab === 'trash'
                ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
            }`}
          >
            Papelera ({trashItems.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto studio-scroll p-3.5 space-y-2">
          {tab === 'history' ? (
            history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#cfa574] bg-[#fff9ef] p-5 text-center text-xs text-[#734526]">
                Aún no hay cambios registrados en esta sesión. Al crear, editar, reordenar o duplicar diseños podrás deshacer aquí.
              </div>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#dfc098] bg-[#fffaf1] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#4a2610] truncate">{entry.label}</p>
                    <p className="text-[10.5px] text-[#835634] font-mono-tab">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}{' '}
                      · {entry.snapshot.length} diseños
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestoreHistory(entry)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f3dfc0] hover:bg-[#e7c99b] border border-[#cfa574] text-[11px] font-bold text-[#4e2710] cursor-pointer"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Restaurar</span>
                  </button>
                </div>
              ))
            )
          ) : trashItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#cfa574] bg-[#fff9ef] p-5 text-center text-xs text-[#734526]">
              La papelera está vacía. Los diseños que elimines se guardarán aquí para que puedas recuperarlos cuando quieras.
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onEmptyTrash}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#fbe2e5] hover:bg-[#f5c7ce] border border-[#d67b87] text-[11px] font-bold text-[#8d1d2d] cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Vaciar papelera</span>
                </button>
              </div>
              {trashItems.map((item) => {
                const thumb = item.garmentViews?.front || item.photoDataUrl || item.modelViews?.front;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-[#dfc098] bg-[#fffaf1] p-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-11 h-12 rounded-lg bg-[#f4e2c8] border border-[#d8b484] overflow-hidden shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <img src={thumb} alt={item.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] font-bold text-[#7c4e2d]">Sin foto</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#4a2610] truncate">{item.name}</p>
                        <p className="text-[10.5px] text-[#835634]">
                          {item.category}
                          {item.deletedAt
                            ? ` · ${new Date(item.deletedAt).toLocaleDateString()}`
                            : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onRestoreTrashed(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#dff4e7] hover:bg-[#c8ead5] border border-[#5fa37a] text-[11px] font-bold text-[#1f5637] cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Recuperar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onPurgeTrashed(item.id)}
                        title="Eliminar definitivamente"
                        className="w-7 h-7 rounded-lg bg-[#fbe2e5] hover:bg-[#f4c6cd] border border-[#d67b87] text-[#8d1d2d] flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
