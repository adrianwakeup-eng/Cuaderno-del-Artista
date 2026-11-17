import React, { useState } from 'react';
import {
  Plus,
  Search,
  Minus,
  Trash2,
  Edit3,
  BookPlus,
  Check,
  X,
  BookOpen,
  Images,
  ScrollText,
  Maximize2,
} from 'lucide-react';
import type { CrochetPattern, StitchSymbol } from '../types/crochet';
import {
  ALPHABET_SHEETS,
  CROCHET_ALPHABET,
  type AlphabetSheet,
  type CrochetAlphabetEntry,
} from '../data/crochetAlphabet';
import { StitchSymbolSvg } from './StitchSymbolSvg';

interface PatternsViewProps {
  patterns: CrochetPattern[];
  onSavePattern: (pattern: CrochetPattern) => void;
  onDeletePattern: (id: string) => void;
  onPinPatternToNotebook: (pattern: CrochetPattern) => void;
  onPinStitchToNotebook?: (entry: CrochetAlphabetEntry) => void;
  onPlayStitchClick: () => void;
}

const CATEGORIES: Array<'Todos' | CrochetPattern['category']> = [
  'Todos',
  'Tapetes y Mandalas',
  'Amigurumi',
  'Mantas',
  'Prendas',
  'Accesorios',
];

const ALPHABET_LETTERS = ['Todos', 'A', 'D', 'M', 'P', 'V'] as const;

const ALPHABET_GROUPS: Array<'Todos' | CrochetAlphabetEntry['group']> = [
  'Todos',
  'Puntos Básicos',
  'Varetas y Relieves',
  'Aumentos',
  'Disminuciones',
  'Piñas y Popcorn',
  'Abanicos, Arcos y Filet',
  'Picot, Cruzados y Especiales',
];

const STITCH_PALETTE: Array<{ symbol: StitchSymbol; label: string }> = [
  { symbol: '○', label: 'Cadena (cad)' },
  { symbol: '×', label: 'Punto bajo (pb)' },
  { symbol: 'T', label: 'Medio punto alto (mpa)' },
  { symbol: 'Ŧ', label: 'Punto alto (pa)' },
  { symbol: 'V', label: 'Aumento (aum)' },
  { symbol: 'Λ', label: 'Disminución (dism)' },
  { symbol: '●', label: 'Punto deslizado (pd)' },
  { symbol: '✿', label: 'Anillo mágico' },
  { symbol: '', label: 'Borrar celda' },
];

export const PatternsView: React.FC<PatternsViewProps> = ({
  patterns,
  onSavePattern,
  onDeletePattern,
  onPinPatternToNotebook,
  onPinStitchToNotebook,
  onPlayStitchClick,
}) => {
  const [viewMode, setViewMode] = useState<'alfabeto' | 'laminas' | 'mis-patrones'>('alfabeto');

  // Alfabeto state
  const [alphaSearch, setAlphaSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState<string>('Todos');
  const [activeGroup, setActiveGroup] = useState<'Todos' | CrochetAlphabetEntry['group']>('Todos');
  const [lightboxSheet, setLightboxSheet] = useState<AlphabetSheet | null>(null);
  const [pinnedStitchId, setPinnedStitchId] = useState<string | null>(null);

  // Mis Patrones state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'Todos' | CrochetPattern['category']>('Todos');
  const [selectedId, setSelectedId] = useState<string>(patterns[0]?.id || '');
  const [activeSymbol, setActiveSymbol] = useState<StitchSymbol>('×');
  const [editingPattern, setEditingPattern] = useState<CrochetPattern | null>(null);
  const [pinnedFeedback, setPinnedFeedback] = useState(false);

  const filteredAlphabet = CROCHET_ALPHABET.filter((item) => {
    const matchLetter = activeLetter === 'Todos' || item.letter === activeLetter;
    const matchGroup = activeGroup === 'Todos' || item.group === activeGroup;
    const q = alphaSearch.toLowerCase();
    const matchText =
      item.name.toLowerCase().includes(q) ||
      item.abbreviation.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q);
    return matchLetter && matchGroup && matchText;
  }).sort((a, b) => a.name.localeCompare(b.name, 'es'));

  // Group sorted alphabet entries by initial letter
  const groupedByLetter = filteredAlphabet.reduce<Record<string, CrochetAlphabetEntry[]>>(
    (acc, entry) => {
      if (!acc[entry.letter]) acc[entry.letter] = [];
      acc[entry.letter].push(entry);
      return acc;
    },
    {}
  );

  const filtered = patterns.filter((p) => {
    const matchCat = category === 'Todos' || p.category === category;
    const matchText =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.materialsSummary.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  });

  const activePattern =
    patterns.find((p) => p.id === selectedId) || filtered[0] || patterns[0] || null;

  const updateRound = (delta: number) => {
    if (!activePattern) return;
    onPlayStitchClick();
    const maxR = Math.max(1, activePattern.steps.length);
    const next = Math.max(1, Math.min(maxR, activePattern.currentRound + delta));
    onSavePattern({ ...activePattern, currentRound: next });
  };

  const toggleGridCell = (r: number, c: number) => {
    if (!activePattern) return;
    onPlayStitchClick();
    const nextGrid = activePattern.diagramGrid.map((row, ri) =>
      ri === r ? row.map((cell, ci) => (ci === c ? activeSymbol : cell)) : row
    );
    onSavePattern({ ...activePattern, diagramGrid: nextGrid });
  };

  const createBlankPattern = (): CrochetPattern => ({
    id: `pat-${Date.now()}`,
    title: 'Nuevo Patrón de Crochet',
    category: 'Accesorios',
    difficulty: 'Principiante',
    hookSizeMm: '3.0 mm',
    yarnWeight: 'Algodón Sport',
    estimatedHours: 3,
    materialsSummary: '100g hilo de algodón peinado, marcadores de puntos',
    currentRound: 1,
    steps: [
      {
        id: `st-${Date.now()}-1`,
        roundLabel: 'Vuelta 1',
        instruction: 'Anillo mágico con 6 puntos bajos.',
        stitchCount: 6,
      },
      {
        id: `st-${Date.now()}-2`,
        roundLabel: 'Vuelta 2',
        instruction: '1 aumento en cada punto alrededor.',
        stitchCount: 12,
      },
    ],
    diagramGrid: Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => '')),
    notes: '',
    createdAt: new Date().toISOString().slice(0, 10),
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-5 bg-[radial-gradient(circle_at_center,rgba(78,44,22,0.45)_0%,rgba(24,13,6,0.94)_85%)]">
      {/* Header Bar with Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display text-xl text-[#f7e2b9]">
            Alfabeto de Puntos y Patrones de Crochet
          </h2>
          <p className="text-xs text-[#d6b688]">
            Diccionario alfabético A–Z con símbolos, láminas ilustradas (Hojas 1–7) y tus patrones personalizados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#241309]/95 border border-[#b98241]/40">
            <button
              type="button"
              onClick={() => setViewMode('alfabeto')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'alfabeto'
                  ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white font-medium'
                  : 'text-[#e2c69c] hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Alfabeto A–Z ({CROCHET_ALPHABET.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('laminas')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'laminas'
                  ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white font-medium'
                  : 'text-[#e2c69c] hover:text-white'
              }`}
            >
              <Images className="w-3.5 h-3.5" />
              <span>Láminas (Hojas 1–7)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mis-patrones')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'mis-patrones'
                  ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-white font-medium'
                  : 'text-[#e2c69c] hover:text-white'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Mis Patrones ({patterns.length})</span>
            </button>
          </div>

          {viewMode === 'mis-patrones' && (
            <button
              type="button"
              onClick={() => setEditingPattern(createBlankPattern())}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-110 text-xs font-medium text-[#fff9eb] shadow cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Patrón</span>
            </button>
          )}
        </div>
      </div>

      {/* MODE 1: Alfabeto A-Z de Puntos y Símbolos */}
      {viewMode === 'alfabeto' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* A-Z Letter Index + Group Filter + Search */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#241309]/90 border border-[#b98241]/30">
              {ALPHABET_LETTERS.map((ltr) => (
                <button
                  key={ltr}
                  type="button"
                  onClick={() => {
                    onPlayStitchClick();
                    setActiveLetter(ltr);
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-display transition-colors cursor-pointer whitespace-nowrap ${
                    activeLetter === ltr
                      ? 'bg-[#9d6328] text-[#fff6e3] font-bold'
                      : 'text-[#d8bc93] hover:text-white'
                  }`}
                >
                  {ltr}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={activeGroup}
                onChange={(e) =>
                  setActiveGroup(e.target.value as 'Todos' | CrochetAlphabetEntry['group'])
                }
                aria-label="Filtrar por familia de puntos"
                className="px-3 py-1.5 rounded-lg bg-[#201108] border border-[#b98241]/40 text-xs text-[#f6e3c2] focus:outline-none focus:border-[#ebb96b]"
              >
                {ALPHABET_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g === 'Todos' ? 'Todas las familias' : g}
                  </option>
                ))}
              </select>

              <div className="relative min-w-[210px]">
                <Search className="w-3.5 h-3.5 text-[#c89e69] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={alphaSearch}
                  onChange={(e) => setAlphaSearch(e.target.value)}
                  placeholder="Buscar punto o abreviatura…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#201108] border border-[#b98241]/40 text-xs text-[#f6e3c2] placeholder:text-[#a68459] focus:outline-none focus:border-[#ebb96b]"
                />
              </div>
            </div>
          </div>

          {/* Alphabetical Parchment Dictionary */}
          <div className="flex-1 overflow-y-auto studio-scroll pr-1 space-y-6">
            {Object.keys(groupedByLetter).length === 0 ? (
              <div className="leather-panel rounded-xl p-8 text-center text-sm text-[#e3c69c]">
                No se encontraron puntos con ese filtro.
              </div>
            ) : (
              Object.keys(groupedByLetter)
                .sort((a, b) => a.localeCompare(b, 'es'))
                .map((letter) => (
                  <section key={letter}>
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="w-9 h-9 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#8f551e] border border-[#f5d292]/60 flex items-center justify-center font-display text-lg font-bold text-[#fff8ea] shadow">
                        {letter}
                      </span>
                      <div className="h-px flex-1 bg-gradient-to-r from-[#d49e58]/50 to-transparent" />
                      <span className="text-xs font-mono-tab text-[#cfa979]">
                        {groupedByLetter[letter].length} puntos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                      {groupedByLetter[letter].map((entry) => {
                        const sheet = ALPHABET_SHEETS.find((s) => s.page === entry.pageRef);
                        return (
                          <article
                            key={entry.id}
                            className="rounded-xl parchment-page parchment-grid border-2 border-[#a87842]/70 p-3.5 text-[#3e210e] shadow-lg flex flex-col justify-between gap-2.5"
                          >
                            <div className="flex items-start gap-3">
                              {/* Authentic Vector Symbol Box */}
                              <div className="w-16 h-16 rounded-lg bg-[#fffaf0] border border-[#b5874d]/60 flex items-center justify-center shrink-0 shadow-inner">
                                <StitchSymbolSvg stitchKey={entry.stitchKey} className="w-12 h-12" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-[11px] text-[#7c4d27]">
                                  <span className="font-mono-tab font-semibold text-[#7a202a]">
                                    {entry.abbreviation}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>Hoja {entry.pageRef}</span>
                                </div>
                                <h3 className="font-editorial text-lg font-bold text-[#4a220d] leading-snug">
                                  {entry.name}
                                </h3>
                                <p className="text-[11px] text-[#734a27]">{entry.group}</p>
                              </div>
                            </div>

                            <p className="text-xs text-[#4a2b16] leading-relaxed">
                              {entry.description}
                            </p>

                            <div className="pt-2 border-t border-[#b5874d]/30 flex items-center justify-between gap-2">
                              {sheet && (
                                <button
                                  type="button"
                                  onClick={() => setLightboxSheet(sheet)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-[#6e3a18] hover:text-[#4a220d] cursor-pointer"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                  <span>Ver Hoja {entry.pageRef}</span>
                                </button>
                              )}

                              {onPinStitchToNotebook && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onPinStitchToNotebook(entry);
                                    setPinnedStitchId(entry.id);
                                    window.setTimeout(() => setPinnedStitchId(null), 1600);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#7a202a] hover:bg-[#932935] text-[11px] font-medium text-[#fff4e6] cursor-pointer"
                                >
                                  {pinnedStitchId === entry.id ? (
                                    <>
                                      <Check className="w-3 h-3" />
                                      <span>Copiado</span>
                                    </>
                                  ) : (
                                    <>
                                      <BookPlus className="w-3 h-3" />
                                      <span>Al Cuaderno</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Láminas Originales (Hojas 1 a 7) */}
      {viewMode === 'laminas' && (
        <div className="flex-1 overflow-y-auto studio-scroll pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ALPHABET_SHEETS.map((sheet) => (
              <article
                key={sheet.page}
                className="rounded-2xl parchment-page border-2 border-[#a87842]/70 overflow-hidden shadow-xl flex flex-col justify-between text-[#3e210e]"
              >
                <div className="p-3.5 border-b border-[#b5874d]/30 bg-[#f4e4c4]">
                  <h3 className="font-editorial text-lg font-bold text-[#4a220d]">
                    {sheet.title}
                  </h3>
                  <p className="text-xs text-[#6e4625] mt-0.5">{sheet.subtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setLightboxSheet(sheet)}
                  className="relative bg-white aspect-[3/4] overflow-hidden group cursor-pointer"
                >
                  <img
                    src={sheet.imagePath}
                    alt={sheet.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#271409]/85 text-xs text-[#ffebc2] shadow">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Ampliar</span>
                  </span>
                </button>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* MODE 3: Mis Patrones Guardados */}
      {viewMode === 'mis-patrones' && (
        <>
          {/* Filter & Search Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#241309]/90 border border-[#b98241]/30">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer whitespace-nowrap ${
                    category === cat
                      ? 'bg-[#9d6328] text-[#fff6e3] font-medium'
                      : 'text-[#d8bc93] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative min-w-[210px]">
              <Search className="w-3.5 h-3.5 text-[#c89e69] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar patrón o hilo…"
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#201108] border border-[#b98241]/40 text-xs text-[#f6e3c2] placeholder:text-[#a68459] focus:outline-none focus:border-[#ebb96b]"
              />
            </div>
          </div>

          {/* Main Split: Pattern List + Open Parchment Detail */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
            {/* Left List */}
            <div className="lg:col-span-4 overflow-y-auto studio-scroll pr-1 flex flex-col gap-2">
              {filtered.length === 0 ? (
                <div className="leather-panel rounded-xl p-6 text-center text-sm text-[#d9bc94]">
                  No hay patrones que coincidan con tu búsqueda.
                </div>
          ) : (
            filtered.map((pat) => {
              const isSelected = activePattern?.id === pat.id;
              return (
                <button
                  key={pat.id}
                  type="button"
                  onClick={() => setSelectedId(pat.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#4d2c17]/90 border-[#ecc074] shadow-lg'
                      : 'leather-panel hover:border-[#d59e56]/60'
                  }`}
                >
                  <h3 className="font-editorial text-lg font-semibold text-[#faebd0] leading-tight">
                    {pat.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#d6b384]">
                    <span>{pat.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{pat.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tab">{pat.hookSizeMm}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#c7a376] line-clamp-1">
                    {pat.materialsSummary}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Right Parchment Pattern Sheet */}
        <div className="lg:col-span-8 rounded-2xl parchment-page parchment-grid border-2 border-[#a87842]/70 shadow-2xl overflow-y-auto studio-scroll p-5 sm:p-6 text-[#3e210e]">
          {activePattern ? (
            <div className="flex flex-col gap-5">
              {/* Top Pattern Title & Actions */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#9d6f3d]/30 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#7c4d27]">
                    <span>{activePattern.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activePattern.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tab">{activePattern.estimatedHours} h aprox.</span>
                  </div>
                  <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#4a220d] mt-0.5">
                    {activePattern.title}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onPinPatternToNotebook(activePattern);
                      setPinnedFeedback(true);
                      window.setTimeout(() => setPinnedFeedback(false), 1800);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7a202a] hover:bg-[#932935] text-xs font-medium text-[#fff4e6] cursor-pointer"
                  >
                    {pinnedFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Pegado en Cuaderno</span>
                      </>
                    ) : (
                      <>
                        <BookPlus className="w-3.5 h-3.5" />
                        <span>Enviar al Cuaderno</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPattern(activePattern)}
                    className="p-2 rounded-lg border border-[#8e6032]/40 hover:bg-[#ecd8b7] text-[#5c3216] cursor-pointer"
                    title="Editar patrón"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePattern(activePattern.id)}
                    className="p-2 rounded-lg border border-[#8e3232]/35 hover:bg-[#f2cece] text-[#7c2029] cursor-pointer"
                    title="Eliminar patrón"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Specs & Interactive Row Counter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-[#f5e6c8]/85 border border-[#b5874d]/40 text-xs space-y-1.5">
                  <div>
                    <span className="font-semibold text-[#5a3014]">Ganchillo: </span>
                    <span className="font-mono-tab">{activePattern.hookSizeMm}</span>
                    <span className="mx-1.5">·</span>
                    <span>{activePattern.yarnWeight}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#5a3014]">Materiales: </span>
                    <span>{activePattern.materialsSummary}</span>
                  </div>
                  {activePattern.notes && (
                    <div className="italic text-[#6b4222]">“{activePattern.notes}”</div>
                  )}
                </div>

                {/* Tactile Row Counter */}
                <div className="p-3.5 rounded-xl bg-[#efe0bf] border border-[#b5874d]/50 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#633619]">
                      Contador de Vueltas
                    </p>
                    <p className="font-mono-tab text-xl font-bold text-[#4a220d]">
                      Vuelta {activePattern.currentRound} / {Math.max(1, activePattern.steps.length)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateRound(-1)}
                      aria-label="Vuelta anterior"
                      className="w-9 h-9 rounded-lg bg-[#fff7e7] border border-[#9d6f3d]/50 hover:bg-[#e8d1a8] flex items-center justify-center text-[#4a220d] cursor-pointer shadow-sm"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRound(1)}
                      aria-label="Siguiente vuelta"
                      className="w-9 h-9 rounded-lg bg-[#7a202a] hover:bg-[#932834] flex items-center justify-center text-[#fff5e4] cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Rounds */}
              <div>
                <h4 className="font-display text-sm text-[#582e12] mb-2">
                  Instrucciones paso a paso
                </h4>
                <div className="space-y-2">
                  {activePattern.steps.map((step, idx) => {
                    const isCurrent = idx + 1 === activePattern.currentRound;
                    const isDone = idx + 1 < activePattern.currentRound;
                    return (
                      <div
                        key={step.id}
                        onClick={() => {
                          onPlayStitchClick();
                          onSavePattern({ ...activePattern, currentRound: idx + 1 });
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#fff7e4] border-[#8b2833] shadow-sm'
                            : isDone
                              ? 'bg-[#efe0c1]/60 border-[#b5874d]/30 opacity-75'
                              : 'bg-[#f8ebd0]/70 border-[#b5874d]/35 hover:bg-[#fff6e3]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#6b2229] mb-1">
                          <span>
                            {step.roundLabel} {isCurrent ? '· Tejiendo ahora' : isDone ? '· Completada' : ''}
                          </span>
                          <span className="font-mono-tab text-[#734a27]">
                            {step.stitchCount} pts
                          </span>
                        </div>
                        <p className="text-sm text-[#3d210f] leading-relaxed">
                          {step.instruction}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Crochet Stitch Chart */}
              <div className="pt-2 border-t border-[#9d6f3d]/30">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <h4 className="font-display text-sm text-[#582e12]">
                    Diagrama Interactivo de Puntos (haz clic en las casillas)
                  </h4>
                  <div className="flex flex-wrap items-center gap-1">
                    {STITCH_PALETTE.map((st) => (
                      <button
                        key={st.label}
                        type="button"
                        title={st.label}
                        onClick={() => setActiveSymbol(st.symbol)}
                        className={`min-w-[28px] h-7 px-1.5 rounded border text-xs font-mono-tab cursor-pointer transition-colors ${
                          activeSymbol === st.symbol
                            ? 'bg-[#7a202a] text-white border-[#521219]'
                            : 'bg-[#fff8ea] text-[#4e2712] border-[#b5874d]/50 hover:bg-[#f2dfb9]'
                        }`}
                      >
                        {st.symbol || '∅'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="inline-grid grid-cols-10 gap-1 p-2.5 rounded-xl bg-[#f4e4c4] border border-[#a87842]/50">
                  {activePattern.diagramGrid.map((row, rIdx) =>
                    row.map((cell, cIdx) => (
                      <button
                        key={`${rIdx}-${cIdx}`}
                        type="button"
                        onClick={() => toggleGridCell(rIdx, cIdx)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#fffaf0] border border-[#c7a06c]/55 hover:border-[#7a202a] flex items-center justify-center text-sm font-bold text-[#5a2429] cursor-pointer"
                      >
                        {cell}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-[#6b4222]">
              Selecciona o crea un patrón para comenzar.
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {/* Sheet Lightbox Modal */}
      {lightboxSheet && (
        <div
          onClick={() => setLightboxSheet(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[92vh] flex flex-col rounded-2xl leather-panel p-4 text-[#f8e6c6]"
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#b98241]/30">
              <div>
                <h3 className="font-editorial text-xl text-[#ffebc2]">
                  {lightboxSheet.title}
                </h3>
                <p className="text-xs text-[#d6b688]">{lightboxSheet.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxSheet(null)}
                className="p-2 rounded-lg bg-[#271409] text-[#f5dfb8] hover:text-white cursor-pointer"
                aria-label="Cerrar lámina"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto studio-scroll rounded-xl bg-white p-2 flex items-center justify-center">
              <img
                src={lightboxSheet.imagePath}
                alt={lightboxSheet.title}
                referrerPolicy="no-referrer"
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit / Create Pattern Modal */}
      {editingPattern && (
        <PatternEditorModal
          initial={editingPattern}
          onCancel={() => setEditingPattern(null)}
          onSave={(saved) => {
            onSavePattern(saved);
            setSelectedId(saved.id);
            setEditingPattern(null);
          }}
        />
      )}
    </div>
  );
};

const PatternEditorModal: React.FC<{
  initial: CrochetPattern;
  onCancel: () => void;
  onSave: (p: CrochetPattern) => void;
}> = ({ initial, onCancel, onSave }) => {
  const [draft, setDraft] = useState<CrochetPattern>(initial);

  const addStep = () => {
    setDraft((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: `st-${Date.now()}`,
          roundLabel: `Vuelta ${prev.steps.length + 1}`,
          instruction: '',
          stitchCount: 12,
        },
      ],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto studio-scroll rounded-2xl leather-panel p-5 text-[#f6e4c4]">
        <div className="flex items-center justify-between mb-4 border-b border-[#b98241]/30 pb-2">
          <h3 className="font-display text-lg text-[#ffebc2]">Editor de Patrón Crochet</h3>
          <button type="button" onClick={onCancel} className="p-1 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span>Nombre del patrón</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Categoría</span>
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft({ ...draft, category: e.target.value as CrochetPattern['category'] })
              }
              className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
            >
              <option value="Tapetes y Mandalas">Tapetes y Mandalas</option>
              <option value="Amigurumi">Amigurumi</option>
              <option value="Mantas">Mantas</option>
              <option value="Prendas">Prendas</option>
              <option value="Accesorios">Accesorios</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span>Dificultad</span>
            <select
              value={draft.difficulty}
              onChange={(e) =>
                setDraft({ ...draft, difficulty: e.target.value as CrochetPattern['difficulty'] })
              }
              className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
            >
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span>Ganchillo recomendado</span>
            <input
              type="text"
              value={draft.hookSizeMm}
              onChange={(e) => setDraft({ ...draft, hookSizeMm: e.target.value })}
              className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span>Grosor de hilo</span>
            <input
              type="text"
              value={draft.yarnWeight}
              onChange={(e) => setDraft({ ...draft, yarnWeight: e.target.value })}
              className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
            />
          </label>

          <label className="flex flex-col gap-1 sm:col-span-2">
            <span>Resumen de materiales</span>
            <input
              type="text"
              value={draft.materialsSummary}
              onChange={(e) => setDraft({ ...draft, materialsSummary: e.target.value })}
              className="px-3 py-2 rounded-lg bg-[#1b0e06] border border-[#b98241]/45 text-sm text-white"
            />
          </label>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#f3d49b]">Vueltas / Pasos</span>
            <button
              type="button"
              onClick={addStep}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#6c3c1c] text-xs text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir vuelta</span>
            </button>
          </div>
          <div className="space-y-2">
            {draft.steps.map((st, idx) => (
              <div key={st.id} className="grid grid-cols-12 gap-2 items-start">
                <input
                  type="text"
                  value={st.roundLabel}
                  onChange={(e) => {
                    const next = [...draft.steps];
                    next[idx] = { ...st, roundLabel: e.target.value };
                    setDraft({ ...draft, steps: next });
                  }}
                  className="col-span-3 px-2 py-1.5 rounded bg-[#1b0e06] border border-[#b98241]/40 text-xs text-white"
                />
                <input
                  type="text"
                  value={st.instruction}
                  placeholder="Instrucción de puntos…"
                  onChange={(e) => {
                    const next = [...draft.steps];
                    next[idx] = { ...st, instruction: e.target.value };
                    setDraft({ ...draft, steps: next });
                  }}
                  className="col-span-7 px-2 py-1.5 rounded bg-[#1b0e06] border border-[#b98241]/40 text-xs text-white"
                />
                <input
                  type="number"
                  value={st.stitchCount}
                  onChange={(e) => {
                    const next = [...draft.steps];
                    next[idx] = { ...st, stitchCount: Number(e.target.value) };
                    setDraft({ ...draft, steps: next });
                  }}
                  className="col-span-2 px-2 py-1.5 rounded bg-[#1b0e06] border border-[#b98241]/40 text-xs font-mono-tab text-white"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#b98241]/40 text-xs text-[#e7cc9f] hover:bg-[#3a2010] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-xs font-medium text-white cursor-pointer"
          >
            Guardar Patrón
          </button>
        </div>
      </div>
    </div>
  );
};
