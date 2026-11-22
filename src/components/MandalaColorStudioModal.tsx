import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Loader2,
  Palette,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DEFAULT_MANDALA_COLOR_SETTINGS,
  MANDALA_SOLID_SWATCHES,
  MANDALA_TONE_PRESETS,
  exportRecoloredMandalaDataUrl,
  prepareMandalaSource,
  renderRecoloredMandalaToCanvas,
  type MandalaColorMode,
  type MandalaColorSettings,
  type PreparedMandalaSource,
} from '../utils/mandalaRecolor';
import { audioEngine } from '../utils/audioEngine';

interface MandalaColorStudioModalProps {
  title: string;
  baseImageSrc: string;
  initialColor?: string;
  applyLabel: string;
  onApply: (recoloredDataUrl: string) => void;
  onClose: () => void;
}

export const MandalaColorStudioModal: React.FC<MandalaColorStudioModalProps> = ({
  title,
  baseImageSrc,
  initialColor,
  applyLabel,
  onApply,
  onClose,
}) => {
  const [settings, setSettings] = useState<MandalaColorSettings>(() => ({
    ...DEFAULT_MANDALA_COLOR_SETTINGS,
    color1: initialColor && initialColor.startsWith('#') ? initialColor : DEFAULT_MANDALA_COLOR_SETTINGS.color1,
  }));
  const [prepared, setPrepared] = useState<PreparedMandalaSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    prepareMandalaSource(baseImageSrc, 560)
      .then((src) => {
        if (!active) return;
        setPrepared(src);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [baseImageSrc]);

  useEffect(() => {
    if (!prepared || !previewCanvasRef.current) return;
    renderRecoloredMandalaToCanvas(prepared, settings, previewCanvasRef.current);
  }, [prepared, settings]);

  const handleConfirm = async () => {
    if (exporting) return;
    setExporting(true);
    audioEngine.playSaveChime();
    try {
      const isUntouchedOriginal =
        settings.mode === 'original' &&
        settings.hue === 0 &&
        settings.saturation === 100 &&
        settings.brightness === 100 &&
        settings.contrast === 100;

      if (isUntouchedOriginal) {
        onApply(baseImageSrc);
      } else {
        const finalUrl = await exportRecoloredMandalaDataUrl(baseImageSrc, settings, 1200);
        onApply(finalUrl);
      }
    } catch {
      onApply(baseImageSrc);
    } finally {
      setExporting(false);
    }
  };

  const resetToOriginal = () => {
    audioEngine.playUndoRedo(false);
    setSettings({
      ...DEFAULT_MANDALA_COLOR_SETTINGS,
      mode: 'original',
      intensity: 100,
      hue: 0,
      saturation: 100,
      brightness: 100,
      contrast: 100,
    });
  };

  const modeTabs: Array<{ id: MandalaColorMode; label: string }> = [
    { id: 'solid', label: 'Color único' },
    { id: 'radial', label: 'Aros radiales' },
    { id: 'linear', label: 'Degradado' },
    { id: 'original', label: 'Original' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] rounded-2xl leather-panel bg-[#221208] border border-[#c99552]/55 shadow-[0_28px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#b98241]/35 bg-[#1b0e06]/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] flex items-center justify-center text-white shadow shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-editorial text-base sm:text-lg font-bold text-[#ffebc2] truncate">
                Colores y Tonos · {title}
              </h3>
              <p className="text-[11px] text-[#d8b888] truncate">
                Personaliza el color, los aros cromáticos y los matices de tu figura extraída
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar editor de color"
            className="p-1.5 rounded-lg bg-[#6e212a] hover:bg-[#8c2d34] text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Live Parchment Preview + Color/Tone Controls */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_340px] overflow-y-auto md:overflow-hidden">
          {/* Left Preview Stage */}
          <div className="relative flex flex-col items-center justify-center p-4 bg-[#f5e7cb] parchment-grid min-h-[260px] md:min-h-0">
            {loading ? (
              <div className="flex flex-col items-center gap-2 text-[#5c3618]">
                <Loader2 className="w-7 h-7 animate-spin text-[#a36928]" />
                <span className="text-xs font-medium">Preparando vista previa…</span>
              </div>
            ) : (
              <canvas
                ref={previewCanvasRef}
                className="max-w-full max-h-[46vh] md:max-h-[60vh] w-auto h-auto object-contain drop-shadow-[0_6px_14px_rgba(62,31,11,0.22)] select-none"
              />
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={resetToOriginal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2b170b]/90 hover:bg-[#432411] border border-[#c99552]/50 text-[11px] font-medium text-[#ffebc2] cursor-pointer shadow"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Ver sin teñir</span>
              </button>
            </div>
          </div>

          {/* Right Controls Column */}
          <div className="flex flex-col gap-3 p-3.5 bg-[#251409] border-t md:border-t-0 md:border-l border-[#b98241]/30 overflow-y-auto studio-scroll">
            {/* Color Mode Tabs */}
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-[#d8b888] font-semibold mb-1.5">
                Estilo de coloración
              </span>
              <div className="grid grid-cols-2 gap-1">
                {modeTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      audioEngine.playStitchClick();
                      setSettings((s) => ({
                        ...s,
                        mode: tab.id,
                        intensity: tab.id === 'original' ? 100 : Math.max(s.intensity, 85),
                      }));
                    }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      settings.mode === tab.id
                        ? 'bg-gradient-to-b from-[#d1974c] to-[#9b6126] border-[#f6d08b] text-white shadow'
                        : 'bg-[#361d0e] border-[#c99552]/35 text-[#ecd3a8] hover:bg-[#4c2b16]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Solid Swatches */}
            {settings.mode === 'solid' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#d8b888] font-semibold">
                    Colores de hilo
                  </span>
                  <label className="inline-flex items-center gap-1.5 text-[11px] text-[#ffebc2] cursor-pointer">
                    <span>Personalizado</span>
                    <input
                      type="color"
                      value={settings.color1}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, color1: e.target.value }))
                      }
                      className="w-6 h-6 rounded border border-[#d69f56] bg-transparent cursor-pointer"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {MANDALA_SOLID_SWATCHES.map((sw) => {
                    const active = settings.color1.toLowerCase() === sw.hex.toLowerCase();
                    return (
                      <button
                        key={sw.hex}
                        type="button"
                        title={sw.name}
                        onClick={() => {
                          audioEngine.playStitchClick();
                          setSettings((s) => ({ ...s, color1: sw.hex }));
                        }}
                        style={{ backgroundColor: sw.hex }}
                        className={`w-full aspect-square rounded-lg border-2 cursor-pointer transition-transform hover:scale-110 ${
                          active
                            ? 'border-white ring-2 ring-[#f3c46c] scale-110'
                            : 'border-[#5a351b]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Multi-color Pickers (Radial or Linear) */}
            {(settings.mode === 'radial' || settings.mode === 'linear') && (
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[#d8b888] font-semibold mb-1.5">
                  {settings.mode === 'radial'
                    ? 'Colores del centro al borde'
                    : 'Colores del degradado'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      key: 'color1' as const,
                      label: settings.mode === 'radial' ? 'Centro' : 'Inicio',
                    },
                    {
                      key: 'color2' as const,
                      label: settings.mode === 'radial' ? 'Medio' : 'Centro',
                    },
                    {
                      key: 'color3' as const,
                      label: settings.mode === 'radial' ? 'Borde' : 'Final',
                    },
                  ].map((slot) => (
                    <label
                      key={slot.key}
                      className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-[#341c0d] border border-[#c99552]/35 cursor-pointer hover:border-[#ebb96a]"
                    >
                      <input
                        type="color"
                        value={settings[slot.key]}
                        onChange={(e) =>
                          setSettings((s) => ({ ...s, [slot.key]: e.target.value }))
                        }
                        className="w-full h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-[10px] text-[#f3dcb3]">{slot.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Curated Multi-Tone Presets */}
            <div>
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#d8b888] font-semibold mb-1.5">
                <Sparkles className="w-3 h-3 text-[#f0c77c]" />
                <span>Combinaciones de tonos</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {MANDALA_TONE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      audioEngine.playStitchClick();
                      setSettings((s) => ({
                        ...s,
                        mode: preset.mode,
                        color1: preset.color1,
                        color2: preset.color2,
                        color3: preset.color3,
                        intensity: preset.intensity ?? 94,
                        hue: 0,
                      }));
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#341c0d] hover:bg-[#4b2a15] border border-[#c99552]/35 text-left cursor-pointer transition-colors"
                  >
                    <span
                      className="w-5 h-5 rounded-full shrink-0 border border-white/40 shadow-inner"
                      style={{
                        background:
                          preset.mode === 'radial'
                            ? `radial-gradient(circle, ${preset.color1} 0%, ${preset.color2} 55%, ${preset.color3} 100%)`
                            : `linear-gradient(135deg, ${preset.color1} 0%, ${preset.color2} 50%, ${preset.color3} 100%)`,
                      }}
                    />
                    <span className="text-[11px] text-[#ffebc2] font-medium truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fine Tone Sliders */}
            <div className="space-y-2 pt-2 border-t border-[#b98241]/25">
              <span className="block text-[10px] uppercase tracking-wider text-[#d8b888] font-semibold">
                Ajuste fino de tonos
              </span>

              {settings.mode !== 'original' && (
                <label className="block">
                  <div className="flex justify-between text-[11px] text-[#f3dcb3] mb-0.5">
                    <span>Intensidad de color</span>
                    <span className="font-mono-tab">{settings.intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.intensity}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, intensity: Number(e.target.value) }))
                    }
                    className="w-full accent-[#d69f56] cursor-pointer"
                  />
                </label>
              )}

              <label className="block">
                <div className="flex justify-between text-[11px] text-[#f3dcb3] mb-0.5">
                  <span>Matiz (Tono)</span>
                  <span className="font-mono-tab">{settings.hue}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={settings.hue}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, hue: Number(e.target.value) }))
                  }
                  className="w-full accent-[#d69f56] cursor-pointer"
                />
              </label>

              <label className="block">
                <div className="flex justify-between text-[11px] text-[#f3dcb3] mb-0.5">
                  <span>Saturación</span>
                  <span className="font-mono-tab">{settings.saturation}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={settings.saturation}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, saturation: Number(e.target.value) }))
                  }
                  className="w-full accent-[#d69f56] cursor-pointer"
                />
              </label>

              <label className="block">
                <div className="flex justify-between text-[11px] text-[#f3dcb3] mb-0.5">
                  <span>Brillo</span>
                  <span className="font-mono-tab">{settings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={settings.brightness}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, brightness: Number(e.target.value) }))
                  }
                  className="w-full accent-[#d69f56] cursor-pointer"
                />
              </label>

              <label className="block">
                <div className="flex justify-between text-[11px] text-[#f3dcb3] mb-0.5">
                  <span>Contraste</span>
                  <span className="font-mono-tab">{settings.contrast}%</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={160}
                  value={settings.contrast}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, contrast: Number(e.target.value) }))
                  }
                  className="w-full accent-[#d69f56] cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[#b98241]/35 bg-[#1b0e06]/90">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-[#381f0f] hover:bg-[#522e17] border border-[#c99552]/40 text-xs font-medium text-[#f3dcb3] cursor-pointer"
          >
            Usar tal cual
          </button>
          <button
            type="button"
            disabled={exporting || loading}
            onClick={() => void handleConfirm()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-b from-[#d1974c] to-[#9b6126] hover:brightness-110 border border-[#f5ce88]/60 text-xs font-semibold text-white cursor-pointer shadow-lg disabled:opacity-60"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{applyLabel}</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
