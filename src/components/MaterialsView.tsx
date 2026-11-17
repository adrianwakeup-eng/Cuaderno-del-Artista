import React, { useState } from 'react';
import { Plus, Minus, Trash2, Edit3, Search, X } from 'lucide-react';
import type { MaterialItem, MaterialKind } from '../types/crochet';

interface MaterialsViewProps {
  materials: MaterialItem[];
  onSaveMaterial: (item: MaterialItem) => void;
  onDeleteMaterial: (id: string) => void;
}

const KINDS: Array<'Todos' | MaterialKind> = ['Todos', 'Lana / Hilo', 'Ganchillo', 'Accesorio'];

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  onSaveMaterial,
  onDeleteMaterial,
}) => {
  const [filter, setFilter] = useState<'Todos' | MaterialKind>('Todos');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<MaterialItem | null>(null);

  const filtered = materials.filter((m) => {
    const matchKind = filter === 'Todos' || m.kind === filter;
    const q = search.toLowerCase();
    const matchText =
      m.name.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q) ||
      m.colorName.toLowerCase().includes(q);
    return matchKind && matchText;
  });

  const createBlank = (): MaterialItem => ({
    id: `mat-${Date.now()}`,
    name: '',
    brand: '',
    kind: 'Lana / Hilo',
    colorHex: '#C76D73',
    colorName: 'Rosa Antiguo',
    fiberOrMaterial: '100% Algodón',
    weightOrSize: '2.5 mm',
    quantity: 2,
    unit: 'ovillos (50g)',
    locationNote: 'Cesta principal',
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-5 bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display text-xl text-[#f7e2b9]">
            Inventario de Materiales, Lanas y Ganchillos
          </h2>
          <p className="text-xs text-[#d6b688]">
            Controla tus ovillos disponibles, calibres de ganchillo y ubicación en tu taller
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing(createBlank())}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-110 text-xs font-medium text-[#fff9eb] shadow cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Material</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#241309]/90 border border-[#b98241]/30">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={`px-3 py-1 rounded-md text-xs transition-colors cursor-pointer whitespace-nowrap ${
                filter === k
                  ? 'bg-[#9d6328] text-[#fff6e3] font-medium'
                  : 'text-[#d8bc93] hover:text-white'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-[#c89e69] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar marca, color o fibra…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#201108] border border-[#b98241]/40 text-xs text-[#f6e3c2] placeholder:text-[#a68459] focus:outline-none focus:border-[#ebb96b]"
          />
        </div>
      </div>

      {/* Materials Parchment Ledger */}
      <div className="flex-1 overflow-y-auto studio-scroll pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-xl parchment-page border-2 border-[#a87842]/65 p-4 text-[#3e210e] shadow-lg flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-10 h-10 rounded-full border-2 border-[#704921]/60 shadow-inner shrink-0"
                      style={{ backgroundColor: item.colorHex }}
                      title={item.colorName}
                    />
                    <div className="min-w-0">
                      <h3 className="font-editorial text-lg font-bold text-[#4a220d] truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#734a27] truncate">
                        {item.brand} · {item.kind}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="p-1.5 rounded hover:bg-[#ebd7b4] text-[#5c3216] cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteMaterial(item.id)}
                      className="p-1.5 rounded hover:bg-[#f2cece] text-[#7c2029] cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#b5874d]/30 text-xs space-y-1 text-[#4e2d17]">
                  <div>
                    <span className="font-semibold">Material: </span>
                    <span>{item.fiberOrMaterial}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Calibre / Color: </span>
                    <span className="font-mono-tab">{item.weightOrSize}</span> · {item.colorName}
                  </div>
                  <div>
                    <span className="font-semibold">Guardado en: </span>
                    <span>{item.locationNote}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#b5874d]/30 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-mono-tab text-base font-bold text-[#4a220d]">
                    {item.quantity}
                  </span>{' '}
                  <span className="text-[#6e4625]">{item.unit}</span>
                  {item.kind === 'Lana / Hilo' && item.quantity <= 1 && (
                    <span className="ml-2 text-[#8f1f29] font-medium">· Poca reserva</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onSaveMaterial({ ...item, quantity: Math.max(0, item.quantity - 1) })
                    }
                    className="w-7 h-7 rounded bg-[#efe0c2] border border-[#9d6f3d]/50 hover:bg-[#e5cd9f] flex items-center justify-center text-[#4a220d] cursor-pointer"
                    aria-label="Restar cantidad"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSaveMaterial({ ...item, quantity: item.quantity + 1 })}
                    className="w-7 h-7 rounded bg-[#7a202a] hover:bg-[#932834] flex items-center justify-center text-[#fff5e4] cursor-pointer"
                    aria-label="Sumar cantidad"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Add/Edit Material Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl leather-panel p-5 text-[#f6e4c4]">
            <div className="flex items-center justify-between mb-4 border-b border-[#b98241]/30 pb-2">
              <h3 className="font-display text-lg text-[#ffebc2]">Ficha de Material</h3>
              <button type="button" onClick={() => setEditing(null)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span>Nombre (ej. Algodón Mercerizado Crudo)</span>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Tipo</span>
                <select
                  value={editing.kind}
                  onChange={(e) =>
                    setEditing({ ...editing, kind: e.target.value as MaterialKind })
                  }
                  className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                >
                  <option value="Lana / Hilo">Lana / Hilo</option>
                  <option value="Ganchillo">Ganchillo</option>
                  <option value="Accesorio">Accesorio</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span>Marca</span>
                <input
                  type="text"
                  value={editing.brand}
                  onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Color visual</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editing.colorHex}
                    onChange={(e) => setEditing({ ...editing, colorHex: e.target.value })}
                    className="w-10 h-9 rounded bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editing.colorName}
                    onChange={(e) => setEditing({ ...editing, colorName: e.target.value })}
                    className="flex-1 px-2.5 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-1">
                <span>Grosor / Medida (mm)</span>
                <input
                  type="text"
                  value={editing.weightOrSize}
                  onChange={(e) => setEditing({ ...editing, weightOrSize: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span>Composición / Fibra</span>
                <input
                  type="text"
                  value={editing.fiberOrMaterial}
                  onChange={(e) => setEditing({ ...editing, fiberOrMaterial: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Cantidad</span>
                <input
                  type="number"
                  min={0}
                  value={editing.quantity}
                  onChange={(e) => setEditing({ ...editing, quantity: Number(e.target.value) })}
                  className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm font-mono-tab text-white"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Unidad</span>
                <input
                  type="text"
                  value={editing.unit}
                  onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span>Ubicación en taller</span>
                <input
                  type="text"
                  value={editing.locationNote}
                  onChange={(e) => setEditing({ ...editing, locationNote: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
                />
              </label>
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
                  if (!editing.name.trim()) return;
                  onSaveMaterial(editing);
                  setEditing(null);
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer"
              >
                Guardar Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
