import React from 'react';
import {
  Download,
  Gauge,
  RotateCcw,
  Save,
  Settings,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  VestidorPerformanceMode,
  VestidorPreferences,
  VestidorSpinSpeed,
} from '../types/crochet';
import {
  STUDIO_LIGHT_ORDER,
  STUDIO_LIGHT_PRESETS,
  type BodyMeasurements,
  type GraphicsQualityLevel,
  type StudioLightPresetId,
} from '../utils/atelierMannequin3D';

interface VestidorSettingsDrawerProps {
  isOpen: boolean;
  preferences: VestidorPreferences;
  systemReducedMotion: boolean;
  qualityLevel: GraphicsQualityLevel;
  isAnimatingPose: boolean;
  knitRelief: boolean;
  measurements: BodyMeasurements;
  lightPreset: StudioLightPresetId;
  customStudioPhotoName: string | null;
  hasUnsavedChanges: boolean;
  onClose: () => void;
  onUpdatePreferences: (patch: Partial<VestidorPreferences>) => void;
  onChangeQuality: (q: GraphicsQualityLevel) => void;
  onToggleAnimatingPose: () => void;
  onToggleKnitRelief: () => void;
  onChangeHeight: (h: number) => void;
  onChangeLight: (id: StudioLightPresetId) => void;
  onTriggerStudioPhotoUpload: () => void;
  onManualSaveNow: () => void;
  onExportCatalogJson: () => void;
  onImportCatalogJson: (file: File) => void;
  onResetView: () => void;
}

const SPIN_SPEED_OPTIONS: Array<{ id: VestidorSpinSpeed; label: string }> = [
  { id: 'lento', label: 'Lento' },
  { id: 'normal', label: 'Normal' },
  { id: 'rapido', label: 'Rápido' },
];

const PERF_OPTIONS: Array<{ id: VestidorPerformanceMode; label: string }> = [
  { id: 'ahorro', label: 'Ahorro' },
  { id: 'equilibrado', label: 'Equilibrado' },
  { id: 'alto', label: 'Alto' },
];

export const VestidorSettingsDrawer: React.FC<VestidorSettingsDrawerProps> = ({
  isOpen,
  preferences,
  systemReducedMotion,
  qualityLevel,
  isAnimatingPose,
  knitRelief,
  measurements,
  lightPreset,
  customStudioPhotoName,
  hasUnsavedChanges,
  onClose,
  onUpdatePreferences,
  onChangeQuality,
  onToggleAnimatingPose,
  onToggleKnitRelief,
  onChangeHeight,
  onChangeLight,
  onTriggerStudioPhotoUpload,
  onManualSaveNow,
  onExportCatalogJson,
  onImportCatalogJson,
  onResetView,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Ajustes del Vestidor Dorado"
      className="fixed inset-x-3 top-14 sm:inset-auto sm:right-6 sm:top-16 z-40 sm:w-[360px] max-h-[82vh] flex flex-col rounded-[24px] border-[4px] border-[#d8b080] bg-[#fbf0df]/98 text-[#4c2610] shadow-[0_18px_44px_rgba(62,28,12,0.38)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#63361c] text-[#ffe8ba] shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#ffd96b]" />
          <h3 className="font-display text-sm font-bold">Ajustes del Visor 2.5D</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ajustes"
          className="w-6 h-6 rounded-full hover:bg-white/15 flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto studio-scroll p-3.5 space-y-3.5 text-xs">
        {/* 1. Adjustable Rotation Speed */}
        <div>
          <p className="font-bold text-[#663619] mb-1.5 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-[#a45222]" />
            <span>Velocidad de giro 360°</span>
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {SPIN_SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onUpdatePreferences({ spinSpeed: opt.id })}
                className={`py-1.5 rounded-xl font-bold border-2 cursor-pointer transition-colors ${
                  preferences.spinSpeed === opt.id
                    ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                    : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Optional Sound (OFF by default) & Reduced Motion */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdatePreferences({ soundEnabled: !preferences.soundEnabled })}
            className={`py-2 px-2.5 rounded-xl font-bold border-2 cursor-pointer inline-flex items-center justify-center gap-1.5 ${
              preferences.soundEnabled
                ? 'bg-[#dff4e7] border-[#4b946a] text-[#1f5637]'
                : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
            }`}
          >
            {preferences.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>Sonido: {preferences.soundEnabled ? 'Sí' : 'No'}</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdatePreferences({ reduceMotion: !preferences.reduceMotion })}
            className={`py-2 px-2.5 rounded-xl font-bold border-2 cursor-pointer ${
              preferences.reduceMotion || systemReducedMotion
                ? 'bg-[#dff4e7] border-[#4b946a] text-[#1f5637]'
                : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
            }`}
          >
            Mov. reducido: {preferences.reduceMotion || systemReducedMotion ? 'Sí' : 'No'}
          </button>
        </div>

        {systemReducedMotion && (
          <p className="text-[10.5px] text-[#7a4d2c] -mt-2">
            Movimiento reducido activo automáticamente según las preferencias del sistema operativo.
          </p>
        )}

        {/* 3. Performance Mode */}
        <div>
          <p className="font-bold text-[#663619] mb-1.5">Rendimiento y animaciones</p>
          <div className="grid grid-cols-3 gap-1.5">
            {PERF_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onUpdatePreferences({ performanceMode: p.id })}
                className={`py-1.5 rounded-xl font-bold border-2 cursor-pointer ${
                  preferences.performanceMode === p.id
                    ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                    : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Auto-Save & Offline Backup */}
        <div className="rounded-xl border border-[#dfc098] bg-[#fff8ec] p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onUpdatePreferences({ autoSaveEnabled: !preferences.autoSaveEnabled })}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                preferences.autoSaveEnabled
                  ? 'bg-[#dff4e7] border-[#4b946a] text-[#1f5637]'
                  : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
              }`}
            >
              Guardado automático: {preferences.autoSaveEnabled ? 'Sí' : 'No'}
            </button>

            <button
              type="button"
              onClick={onManualSaveNow}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f3dfc0] hover:bg-[#e8cba0] border border-[#cfa574] text-[11px] font-bold text-[#5a2f16] cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>{hasUnsavedChanges ? 'Guardar ahora' : 'Guardado'}</span>
            </button>
          </div>
          {preferences.lastSavedAt && (
            <p className="text-[10px] text-[#835634] font-mono-tab">
              Último guardado local:{' '}
              {new Date(preferences.lastSavedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
          <div className="flex items-center gap-1.5 pt-1 border-t border-[#ebd3b2]">
            <button
              type="button"
              onClick={onExportCatalogJson}
              className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-white hover:bg-[#faf1e2] border border-[#d6b184] text-[10.5px] font-bold text-[#5a2f16] cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Respaldo JSON</span>
            </button>
            <label className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-white hover:bg-[#faf1e2] border border-[#d6b184] text-[10.5px] font-bold text-[#5a2f16] cursor-pointer">
              <Upload className="w-3 h-3" />
              <span>Importar JSON</span>
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportCatalogJson(f);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>

        {/* 5. 2.5D Depth, Soft Camera, Knit Relief */}
        <div>
          <p className="font-bold text-[#663619] mb-1.5">Profundidad 2.5D</p>
          <div className="grid grid-cols-3 gap-1.5">
            {(['medio', 'alto', 'ultra'] as GraphicsQualityLevel[]).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onChangeQuality(q)}
                className={`py-1.5 rounded-xl capitalize font-bold border-2 cursor-pointer ${
                  qualityLevel === q
                    ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                    : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleAnimatingPose}
            className={`py-2 px-2.5 rounded-xl font-bold border-2 cursor-pointer ${
              isAnimatingPose
                ? 'bg-[#dff4e7] border-[#4b946a] text-[#1f5637]'
                : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
            }`}
          >
            Cámara suave: {isAnimatingPose ? 'Sí' : 'No'}
          </button>
          <button
            type="button"
            onClick={onToggleKnitRelief}
            className={`py-2 px-2.5 rounded-xl font-bold border-2 cursor-pointer ${
              knitRelief
                ? 'bg-[#dff4e7] border-[#4b946a] text-[#1f5637]'
                : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
            }`}
          >
            Realce textil: {knitRelief ? 'Sí' : 'No'}
          </button>
        </div>

        {/* 6. Model Framing */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-[#663619]">Encuadre del modelo</span>
            <span className="font-bold text-[#8c5a34] font-mono-tab">
              {Math.round(measurements.height * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.9}
            max={1.1}
            step={0.01}
            value={measurements.height}
            onChange={(e) => onChangeHeight(Number(e.target.value))}
            className="w-full accent-[#d48b1b] cursor-pointer"
          />
        </div>

        {/* 7. Studio Lighting */}
        <div>
          <p className="font-bold text-[#663619] mb-1.5">Iluminación del estudio</p>
          <div className="flex flex-wrap gap-1.5">
            {STUDIO_LIGHT_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChangeLight(id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                  lightPreset === id
                    ? 'bg-[#ffd862] border-[#b7740c] text-[#421f07]'
                    : 'bg-[#fff9ef] border-[#dfc098] text-[#6d4224]'
                }`}
              >
                {STUDIO_LIGHT_PRESETS[id].label}
              </button>
            ))}
          </div>
        </div>

        {/* 8. Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#e2c297]">
          <button
            type="button"
            onClick={onTriggerStudioPhotoUpload}
            className="px-3 py-1.5 rounded-xl bg-[#f3dfc0] hover:bg-[#e8cba0] border border-[#cfa574] text-[#5c3016] font-bold cursor-pointer"
          >
            {customStudioPhotoName ? 'Cambiar foto prueba' : 'Probar foto estudio'}
          </button>
          <button
            type="button"
            onClick={onResetView}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#66391c] hover:bg-[#7d4724] text-[#ffe9be] font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
