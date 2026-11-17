import React, { useState } from 'react';
import { Eraser, Pipette, Trash2 } from 'lucide-react';
import type { BrushCategory, BrushPresetId, BrushSettings } from '../types/crochet';

interface ColorPalettePanelProps {
  color: string;
  recentColors: string[];
  onSelectColor: (hex: string) => void;
  onActivateEyedropper?: () => void;
}

interface BrushStudioPanelProps {
  brush: BrushSettings;
  onChangeBrush: (patch: Partial<BrushSettings>) => void;
  onSelectEraser?: () => void;
}

interface EraserStudioPanelProps {
  brush: BrushSettings;
  onChangeBrush: (patch: Partial<BrushSettings>) => void;
  onClearPageStrokes: () => void;
}

const BASIC_COLORS = [
  '#4E2712', '#7A202A', '#B5383E', '#D8746A', '#E2A354', '#F3D27A',
  '#2E5A44', '#4F7B63', '#8CA38A', '#3366CC', '#5B7DA6', '#98B4D4',
  '#5A396B', '#8E5A82', '#C76D73', '#E5CEAA', '#F5EAD5', '#1C130E',
  '#7D5836', '#A6784B', '#C9A270', '#8F8173', '#D4CCC0', '#FFFFFF',
];

const TIZA_PRESETS: Array<{ id: BrushPresetId; label: string; strokeStyle: string }> = [
  { id: 'tiza-suave', label: 'Tiza suave', strokeStyle: 'opacity-80' },
  { id: 'tiza-pastel', label: 'Tiza pastel', strokeStyle: 'opacity-90' },
  { id: 'tiza-gruesa', label: 'Tiza gruesa', strokeStyle: 'h-3' },
  { id: 'carboncillo', label: 'Carboncillo', strokeStyle: 'opacity-85 contrast-125' },
  { id: 'difuminador', label: 'Difuminador', strokeStyle: 'opacity-60' },
];

const PINCEL_PRESETS: Array<{ id: BrushPresetId; label: string; strokeStyle: string }> = [
  { id: 'pluma-fina', label: 'Pluma fina', strokeStyle: 'h-1' },
  { id: 'hilo-crochet', label: 'Hilo crochet', strokeStyle: 'border-b-2 border-dashed' },
  { id: 'acuarela', label: 'Acuarela', strokeStyle: 'opacity-65' },
];

export const ColorPalettePanel: React.FC<ColorPalettePanelProps> = ({
  color,
  recentColors,
  onSelectColor,
  onActivateEyedropper,
}) => {
  const [colorTab, setColorTab] = useState<'basicos' | 'personalizado' | 'recientes'>('basicos');
  const [hexDraft, setHexDraft] = useState(color);

  React.useEffect(() => {
    setHexDraft(color);
  }, [color]);

  return (
    <div className="w-64 p-3.5 select-none bg-[#221208] rounded-xl text-[#f5e4c4]">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-display text-sm text-[#f7e1b5] tracking-wide">Paleta de Color</h3>
        <div className="flex items-center gap-1.5">
          {onActivateEyedropper && (
            <button
              type="button"
              onClick={onActivateEyedropper}
              title="Cuentagotas: tomar color del cuaderno"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#3c2110] border border-[#c99552]/45 text-[11px] text-[#f5dfba] hover:bg-[#573119] cursor-pointer"
            >
              <Pipette className="w-3 h-3 text-[#f0c77c]" />
              <span>Gotero</span>
            </button>
          )}
          <span
            className="w-5 h-5 rounded border border-[#f5d599]/75 shadow-inner"
            style={{ backgroundColor: color }}
            title={`Color activo: ${color}`}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[#160b05] border border-[#b98241]/35 mb-2.5 text-[11px]">
        {[
          { id: 'basicos', label: 'Básicos' },
          { id: 'personalizado', label: 'Selector' },
          { id: 'recientes', label: 'Recientes' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setColorTab(tab.id as typeof colorTab)}
            className={`py-1 px-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              colorTab === tab.id
                ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-[#fff8e8] font-medium'
                : 'text-[#d9bd94] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {colorTab === 'basicos' && (
        <div className="grid grid-cols-6 gap-1.5 mb-2.5">
          {BASIC_COLORS.map((c) => {
            const selected = color.toUpperCase() === c.toUpperCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => onSelectColor(c)}
                aria-label={`Color ${c}`}
                className={`w-full aspect-square rounded border transition-transform cursor-pointer ${
                  selected
                    ? 'border-[#fff2cc] scale-110 ring-2 ring-[#e7b96b]/60'
                    : 'border-[#3a2010] hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            );
          })}
        </div>
      )}

      {colorTab === 'personalizado' && (
        <div className="flex flex-col gap-2 mb-2.5">
          <label className="text-[11px] text-[#dec49d]">Selector cromático libre</label>
          <input
            type="color"
            value={color}
            onChange={(e) => onSelectColor(e.target.value)}
            className="w-full h-24 rounded-lg cursor-pointer bg-[#140a04] border border-[#d6a25e]/40"
          />
        </div>
      )}

      {colorTab === 'recientes' && (
        <div className="grid grid-cols-4 gap-2 mb-2.5">
          {recentColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onSelectColor(c)}
              className="h-8 rounded border border-[#d6a25e]/45 cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      )}

      {/* HEX row */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#b98241]/25">
        <span className="text-[11px] text-[#cba777] font-mono-tab">HEX</span>
        <input
          type="text"
          value={hexDraft}
          onChange={(e) => {
            const val = e.target.value;
            setHexDraft(val);
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
              onSelectColor(val);
            }
          }}
          maxLength={7}
          className="flex-1 min-w-0 bg-[#150b05] border border-[#b98241]/40 rounded px-2 py-1 text-xs font-mono-tab text-[#f6e3c2] focus:outline-none focus:border-[#ebbc6e]"
        />
      </div>
    </div>
  );
};

export const BrushStudioPanel: React.FC<BrushStudioPanelProps> = ({
  brush,
  onChangeBrush,
  onSelectEraser,
}) => {
  const activeList = brush.category === 'tizas' ? TIZA_PRESETS : PINCEL_PRESETS;

  return (
    <div className="w-68 p-3.5 flex flex-col gap-3 select-none bg-[#221208] rounded-xl text-[#f5e4c4]">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm text-[#f7e1b5] tracking-wide">Pinceles y Tizas</h3>
        {onSelectEraser && (
          <button
            type="button"
            onClick={onSelectEraser}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#3c2110] border border-[#c99552]/45 text-[11px] text-[#f5dfba] hover:bg-[#573119] cursor-pointer"
          >
            <Eraser className="w-3 h-3 text-[#f0c77c]" />
            <span>Goma</span>
          </button>
        )}
      </div>

      <div>
        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[#160b05] border border-[#b98241]/35 mb-2.5 text-xs">
          {(['pinceles', 'tizas'] as BrushCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                const defaultPreset = cat === 'pinceles' ? 'pluma-fina' : 'tiza-suave';
                onChangeBrush({ category: cat, preset: defaultPreset });
              }}
              className={`py-1.5 rounded-md capitalize transition-colors cursor-pointer ${
                brush.category === cat
                  ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] text-[#fff8e8] font-medium shadow'
                  : 'text-[#d9bd94] hover:text-white'
              }`}
            >
              {cat === 'pinceles' ? 'Pinceles' : 'Tizas'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          {activeList.map((preset) => {
            const active = brush.preset === preset.id;
            const previewColor =
              preset.id === 'carboncillo' ? '#2c2825' : brush.color;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChangeBrush({ preset: preset.id })}
                className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                  active
                    ? 'bg-[#6b3e1f] border-[#ebb86c] text-[#fff6e3] shadow-sm'
                    : 'bg-[#2c180c] border-[#8b5d31]/25 hover:border-[#b98241]/60 text-[#e9d1ab]'
                }`}
              >
                {/* Warm parchment swatch strip so dark colors are clearly visible */}
                <span className="w-20 h-5 rounded-md bg-[#f5e8cc] border border-[#b48449]/60 px-2 flex items-center shrink-0 shadow-inner">
                  <span
                    className={`w-full rounded-full ${preset.strokeStyle}`}
                    style={{
                      height:
                        preset.id === 'tiza-gruesa'
                          ? 8
                          : preset.id === 'pluma-fina'
                            ? 2
                            : preset.id === 'hilo-crochet'
                              ? 0
                              : 5,
                      borderColor: preset.id === 'hilo-crochet' ? previewColor : undefined,
                      background:
                        preset.id === 'hilo-crochet'
                          ? 'transparent'
                          : `linear-gradient(90deg, ${previewColor}, ${previewColor}aa)`,
                    }}
                  />
                </span>
                <span className="truncate font-medium">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders: Tamaño, Opacidad, Suavidad */}
      <div className="flex flex-col gap-2.5 pt-2.5 border-t border-[#b98241]/30 text-xs">
        <SliderRow
          label="Tamaño"
          value={brush.size}
          min={2}
          max={60}
          unit="px"
          onChange={(size) => onChangeBrush({ size })}
        />
        <SliderRow
          label="Opacidad"
          value={brush.opacity}
          min={10}
          max={100}
          unit="%"
          onChange={(opacity) => onChangeBrush({ opacity })}
        />
        <SliderRow
          label="Suavidad"
          value={brush.softness}
          min={0}
          max={100}
          unit="%"
          onChange={(softness) => onChangeBrush({ softness })}
        />
      </div>
    </div>
  );
};

export const EraserStudioPanel: React.FC<EraserStudioPanelProps> = ({
  brush,
  onChangeBrush,
  onClearPageStrokes,
}) => (
  <div className="w-64 p-3.5 flex flex-col gap-3 select-none bg-[#221208] rounded-xl text-[#f5e4c4]">
    <div className="flex items-center justify-between">
      <h3 className="font-display text-sm text-[#f7e1b5] tracking-wide">Goma de Borrar</h3>
      <span className="text-[11px] font-mono-tab text-[#dec49d]">{brush.size} px</span>
    </div>

    <div className="grid grid-cols-2 gap-1.5 text-xs">
      <button
        type="button"
        onClick={() => onChangeBrush({ softness: 10, opacity: 100 })}
        className={`py-2 px-2 rounded-lg border cursor-pointer transition-colors ${
          brush.softness <= 35
            ? 'bg-[#6b3e1f] border-[#ebb86c] text-white font-medium'
            : 'bg-[#2c180c] border-[#8b5d31]/30 text-[#dec39c] hover:border-[#b98241]/60'
        }`}
      >
        Goma precisa
      </button>
      <button
        type="button"
        onClick={() => onChangeBrush({ softness: 75, opacity: 65 })}
        className={`py-2 px-2 rounded-lg border cursor-pointer transition-colors ${
          brush.softness > 35
            ? 'bg-[#6b3e1f] border-[#ebb86c] text-white font-medium'
            : 'bg-[#2c180c] border-[#8b5d31]/30 text-[#dec39c] hover:border-[#b98241]/60'
        }`}
      >
        Goma suave
      </button>
    </div>

    <div className="flex flex-col gap-2.5 pt-2 border-t border-[#b98241]/25">
      <SliderRow
        label="Tamaño de goma"
        value={brush.size}
        min={4}
        max={80}
        unit="px"
        onChange={(size) => onChangeBrush({ size })}
      />
      <SliderRow
        label="Fuerza de borrado"
        value={brush.opacity}
        min={20}
        max={100}
        unit="%"
        onChange={(opacity) => onChangeBrush({ opacity })}
      />
    </div>

    <button
      type="button"
      onClick={onClearPageStrokes}
      className="mt-1 inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#5c1e24] hover:bg-[#772730] border border-[#d67a7e]/45 text-xs text-[#ffe3e3] cursor-pointer transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>Limpiar trazos de la página</span>
    </button>
  </div>
);

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, unit, onChange }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-[#dec49d]">{label}</span>
      <span className="font-mono-tab text-[#f5dfba]">
        {value}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-[#d69c50] cursor-pointer h-1.5 bg-[#140a04] rounded-lg"
    />
  </div>
);
