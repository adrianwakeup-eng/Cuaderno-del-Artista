import React, { useState } from 'react';
import {
  Plus,
  Upload,
  BookPlus,
  Trash2,
  X,
  Maximize2,
  Check,
} from 'lucide-react';
import type { CrochetPattern, FinishedProject } from '../types/crochet';
import { compressImageFile } from '../utils/storage';

interface ProjectsGalleryViewProps {
  projects: FinishedProject[];
  patterns: CrochetPattern[];
  onSaveProject: (project: FinishedProject) => void;
  onDeleteProject: (id: string) => void;
  onPinPhotoToNotebook: (project: FinishedProject) => void;
}

export const ProjectsGalleryView: React.FC<ProjectsGalleryViewProps> = ({
  projects,
  patterns,
  onSaveProject,
  onDeleteProject,
  onPinPhotoToNotebook,
}) => {
  const [filter, setFilter] = useState<'Todos' | 'Terminado' | 'En progreso'>('Todos');
  const [lightboxProject, setLightboxProject] = useState<FinishedProject | null>(null);
  const [editing, setEditing] = useState<FinishedProject | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const filtered = projects.filter((p) => filter === 'Todos' || p.status === filter);

  const createBlank = (): FinishedProject => ({
    id: `proj-${Date.now()}`,
    title: '',
    status: 'Terminado',
    patternTitle: patterns[0]?.title || 'Diseño propio',
    materialsUsed: '',
    hookSizeMm: '3.0 mm',
    hoursSpent: 4,
    completedDate: new Date().toISOString().slice(0, 10),
    recipient: 'Uso personal',
    photoDataUrl: '/assets/aistudio/image_e6ae2ac2.png',
    notes: '',
  });

  const handlePhotoUpload = async (file: File) => {
    if (!editing) return;
    const dataUrl = await compressImageFile(file);
    setEditing({ ...editing, photoDataUrl: dataUrl });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-5 bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display text-xl text-[#f7e2b9]">
            Álbum de Proyectos Terminados
          </h2>
          <p className="text-xs text-[#d6b688]">
            Guarda fotografías de tus piezas tejidas, tiempo invertido e hilos utilizados
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing(createBlank())}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-110 text-xs font-medium text-[#fff9eb] shadow cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Proyecto con Foto</span>
        </button>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg bg-[#241309]/90 border border-[#b98241]/30 w-fit mb-4">
        {(['Todos', 'Terminado', 'En progreso'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilter(st)}
            className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer whitespace-nowrap ${
              filter === st
                ? 'bg-[#9d6328] text-[#fff6e3] font-medium'
                : 'text-[#d8bc93] hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Photo Cards */}
      <div className="flex-1 overflow-y-auto studio-scroll pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((proj) => (
            <article
              key={proj.id}
              className="rounded-2xl parchment-page border-2 border-[#a87842]/70 overflow-hidden shadow-xl flex flex-col justify-between text-[#3e210e]"
            >
              <div>
                <div className="relative aspect-[4/3] bg-[#2a170c] overflow-hidden group">
                  <img
                    src={proj.photoDataUrl}
                    alt={proj.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxProject(proj)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-lg bg-[#1c0f07]/80 text-[#f8e4be] hover:bg-[#3a1f0f] cursor-pointer"
                    title="Ampliar fotografía"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="text-xs text-[#7c4d27] flex items-center gap-1.5">
                    <span>{proj.status}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tab">{proj.completedDate}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tab">{proj.hoursSpent} h</span>
                  </div>
                  <h3 className="font-editorial text-xl font-bold text-[#4a220d] mt-1">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-[#6d4222] mt-1">
                    Patrón: <span className="font-medium">{proj.patternTitle}</span> ·{' '}
                    <span className="font-mono-tab">{proj.hookSizeMm}</span>
                  </p>
                  <p className="text-xs text-[#59361d] mt-2 line-clamp-2">
                    {proj.materialsUsed}
                  </p>
                  {proj.notes && (
                    <p className="text-xs italic text-[#714928] mt-1.5 line-clamp-2">
                      “{proj.notes}”
                    </p>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-[#b5874d]/30 bg-[#f4e5c7]/70 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onPinPhotoToNotebook(proj);
                    setPinnedId(proj.id);
                    window.setTimeout(() => setPinnedId(null), 1800);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7a202a] hover:bg-[#932935] text-xs font-medium text-[#fff4e6] cursor-pointer"
                >
                  {pinnedId === proj.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Pegado en Cuaderno</span>
                    </>
                  ) : (
                    <>
                      <BookPlus className="w-3.5 h-3.5" />
                      <span>Pegar en Cuaderno</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteProject(proj.id)}
                  className="p-1.5 rounded hover:bg-[#f2cece] text-[#7c2029] cursor-pointer"
                  title="Eliminar proyecto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Lightbox Photo Modal */}
      {lightboxProject && (
        <div
          onClick={() => setLightboxProject(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full rounded-2xl leather-panel p-4 text-[#f8e6c6]"
          >
            <button
              type="button"
              onClick={() => setLightboxProject(null)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-[#271409] text-[#f5dfb8] hover:text-white cursor-pointer"
              aria-label="Cerrar vista ampliada"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxProject.photoDataUrl}
              alt={lightboxProject.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-[68vh] object-contain rounded-xl bg-[#180d06]"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <div>
                <h3 className="font-editorial text-2xl text-[#ffebc2]">
                  {lightboxProject.title}
                </h3>
                <p className="text-xs text-[#d6b688]">
                  {lightboxProject.materialsUsed} · Ganchillo {lightboxProject.hookSizeMm} ·{' '}
                  {lightboxProject.hoursSpent} horas
                </p>
              </div>
              <span className="text-xs text-[#d6b688]">
                Para: {lightboxProject.recipient} · {lightboxProject.completedDate}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto studio-scroll rounded-2xl leather-panel p-5 text-[#f6e4c4]">
            <div className="flex items-center justify-between mb-4 border-b border-[#b98241]/30 pb-2">
              <h3 className="font-display text-lg text-[#ffebc2]">
                Guardar Proyecto Terminado
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Photo Upload Box */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-[#1b0e06] border border-[#b98241]/40">
                <img
                  src={editing.photoDataUrl}
                  alt="Vista previa del proyecto"
                  referrerPolicy="no-referrer"
                  className="w-28 h-24 object-cover rounded-lg border border-[#b98241]/50 shrink-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#f7e2b9] mb-1">
                    Fotografía del proyecto
                  </p>
                  <p className="text-[#c5a173] mb-2">
                    Sube una foto desde tu ordenador; se guardará comprimida dentro del cuaderno.
                  </p>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#8c5422] hover:bg-[#ab6a2e] text-xs font-medium text-white cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seleccionar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handlePhotoUpload(f);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span>Título de la pieza terminada</span>
                  <input
                    type="text"
                    value={editing.title}
                    placeholder="Ej. Chal de Otoño en Punto Abanico"
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span>Estado</span>
                  <select
                    value={editing.status}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        status: e.target.value as FinishedProject['status'],
                      })
                    }
                    className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                  >
                    <option value="Terminado">Terminado</option>
                    <option value="En progreso">En progreso</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span>Patrón utilizado</span>
                  <input
                    type="text"
                    value={editing.patternTitle}
                    onChange={(e) => setEditing({ ...editing, patternTitle: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span>Ganchillo (mm)</span>
                  <input
                    type="text"
                    value={editing.hookSizeMm}
                    onChange={(e) => setEditing({ ...editing, hookSizeMm: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span>Horas invertidas</span>
                  <input
                    type="number"
                    step="0.5"
                    value={editing.hoursSpent}
                    onChange={(e) => setEditing({ ...editing, hoursSpent: Number(e.target.value) })}
                    className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm font-mono-tab text-white"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span>Fecha</span>
                  <input
                    type="date"
                    value={editing.completedDate}
                    onChange={(e) => setEditing({ ...editing, completedDate: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm font-mono-tab text-white"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span>Destinatario</span>
                  <input
                    type="text"
                    value={editing.recipient}
                    onChange={(e) => setEditing({ ...editing, recipient: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                  />
                </label>

                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span>Lanas e hilos usados</span>
                  <input
                    type="text"
                    value={editing.materialsUsed}
                    placeholder="Ej. 3 ovillos de algodón crema y 1 borgoña"
                    onChange={(e) => setEditing({ ...editing, materialsUsed: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                  />
                </label>

                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span>Notas y detalles de bloqueo</span>
                  <textarea
                    rows={2}
                    value={editing.notes}
                    onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                    className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border border-[#b98241]/40 text-xs text-[#e7cc9f] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editing.title.trim()) return;
                  onSaveProject(editing);
                  setEditing(null);
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer"
              >
                Guardar en Álbum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
