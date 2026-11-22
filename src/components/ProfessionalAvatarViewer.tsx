import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { DressingRoomGarment } from '../types/crochet';
import { audioEngine } from '../utils/audioEngine';
import {
  AtelierMannequinScene,
  type BodyMeasurements,
  type GlbLoadReport,
  type GraphicsQualityLevel,
  type StudioLightPresetId,
} from '../utils/atelierMannequin3D';
import { Platform360Badge, StudioArchHalo } from './LuxuryAtelierDecorations';

export interface ProfessionalAvatarViewerHandle {
  captureSnapshot: () => string | null;
  setTargetYaw: (rad: number) => void;
  zoomBy: (delta: number) => void;
  resetCamera: () => void;
  loadGlbAvatar: (url: string, fileName?: string) => Promise<GlbLoadReport>;
  loadGlbGarment: (
    url: string,
    slot: 'top' | 'bottom',
    fileName?: string
  ) => Promise<GlbLoadReport>;
  clearGlbGarment: (slot?: 'top' | 'bottom') => void;
  resetToSculptedMannequin: () => void;
}

export interface ProfessionalAvatarViewerProps {
  selectedTop: DressingRoomGarment | null;
  selectedBottom: DressingRoomGarment | null;
  overrideTopPalette?: string[] | null;
  overrideBottomPalette?: string[] | null;
  showClothing: boolean;
  knitRelief: boolean;
  poseIndex: number;
  isSpinning360: boolean;
  isAnimatingPose: boolean;
  lightPreset: StudioLightPresetId;
  qualityLevel: GraphicsQualityLevel;
  measurements: BodyMeasurements;
  glbAvatarName?: string | null;
  onToggleSpin360: () => void;
  onStopSpin360: () => void;
  onYawChange?: (deg: number) => void;
  onClearTop: () => void;
  onClearBottom: () => void;
}

export const ProfessionalAvatarViewer = React.forwardRef<
  ProfessionalAvatarViewerHandle,
  ProfessionalAvatarViewerProps
>(
  (
    {
      selectedTop,
      selectedBottom,
      overrideTopPalette,
      overrideBottomPalette,
      showClothing,
      knitRelief,
      poseIndex,
      isSpinning360,
      isAnimatingPose,
      lightPreset,
      qualityLevel,
      measurements,
      glbAvatarName,
      onToggleSpin360,
      onStopSpin360,
      onYawChange,
      onClearTop,
      onClearBottom,
    },
    ref
  ) => {
    const canvasMountRef = useRef<HTMLDivElement | null>(null);
    const sceneRef = useRef<AtelierMannequinScene | null>(null);
    const onYawChangeRef = useRef(onYawChange);
    onYawChangeRef.current = onYawChange;

    const [yawDeg, setYawDeg] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [autoLoadedGlbName, setAutoLoadedGlbName] = useState<string | null>(null);

    const dragRef = useRef<{
      active: boolean;
      lastX: number;
      lastY: number;
      pointerId: number;
    }>({
      active: false,
      lastX: 0,
      lastY: 0,
      pointerId: -1,
    });

    // Mount real-time Three.js WebGL stage once inside isolated mount container
    useEffect(() => {
      const mountEl = canvasMountRef.current;
      if (!mountEl) return;

      const engine = new AtelierMannequinScene(mountEl, {
        onYawChange: (deg) => {
          setYawDeg(deg);
          onYawChangeRef.current?.(deg);
        },
        onAutoGlbLoaded: (report) => {
          setAutoLoadedGlbName(report.fileName);
        },
      });
      sceneRef.current = engine;

      return () => {
        sceneRef.current = null;
        engine.dispose();
      };
    }, []);

    // Sync skinned catalog garments, live yarn-ball dyeing & PBR knit relief
    useEffect(() => {
      sceneRef.current?.updateGarments(
        selectedTop,
        selectedBottom,
        showClothing,
        knitRelief,
        overrideTopPalette,
        overrideBottomPalette
      );
    }, [
      selectedTop,
      selectedBottom,
      showClothing,
      knitRelief,
      overrideTopPalette,
      overrideBottomPalette,
    ]);

    // Sync articulated humanoid pose
    useEffect(() => {
      sceneRef.current?.setPose(poseIndex, false);
    }, [poseIndex]);

    // Sync studio lighting preset
    useEffect(() => {
      sceneRef.current?.setLightPreset(lightPreset);
    }, [lightPreset]);

    // Sync Medio / Alto / Ultra quality tier
    useEffect(() => {
      sceneRef.current?.setQualityLevel(qualityLevel);
    }, [qualityLevel]);

    // Sync live anatomical measurements
    useEffect(() => {
      sceneRef.current?.setBodyMeasurements(measurements);
    }, [measurements]);

    // Sync 360° turntable spin & breathing / GLB animations
    useEffect(() => {
      sceneRef.current?.setAutoSpin(isSpinning360);
    }, [isSpinning360]);

    useEffect(() => {
      sceneRef.current?.setAnimateIdle(isAnimatingPose);
    }, [isAnimatingPose]);

    const captureSnapshot = useCallback((): string | null => {
      return sceneRef.current?.captureSnapshotDataUrl() ?? null;
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        captureSnapshot,
        setTargetYaw: (rad: number) => sceneRef.current?.setTargetYaw(rad),
        zoomBy: (delta: number) => sceneRef.current?.zoomBy(delta),
        resetCamera: () => sceneRef.current?.resetCamera(),
        loadGlbAvatar: async (url: string, fileName?: string) => {
          if (!sceneRef.current) {
            throw new Error('Escena 3D no inicializada');
          }
          const report = await sceneRef.current.loadGlbAvatar(url, fileName);
          setAutoLoadedGlbName(null);
          return report;
        },
        loadGlbGarment: async (url: string, slot: 'top' | 'bottom', fileName?: string) => {
          if (!sceneRef.current) {
            throw new Error('Escena 3D no inicializada');
          }
          return sceneRef.current.loadGlbGarment(url, slot, fileName);
        },
        clearGlbGarment: (slot?: 'top' | 'bottom') => sceneRef.current?.clearGlbGarment(slot),
        resetToSculptedMannequin: () => {
          setAutoLoadedGlbName(null);
          sceneRef.current?.resetToSculptedMannequin();
        },
      }),
      [captureSnapshot]
    );

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      dragRef.current = {
        active: true,
        lastX: e.clientX,
        lastY: e.clientY,
        pointerId: e.pointerId,
      };
      setIsDragging(true);
      onStopSpin360();
      e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      sceneRef.current?.orbitBy(-dx * 0.0085, dy * 0.0055);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current.pointerId !== e.pointerId) return;
      dragRef.current.active = false;
      setIsDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      sceneRef.current?.zoomBy(e.deltaY * 0.0045);
    };

    const effectiveGlbName = glbAvatarName || autoLoadedGlbName;
    const hasAnyOutfit = Boolean(showClothing && (selectedTop || selectedBottom));

    return (
      <div className="relative flex-1 flex flex-col items-center justify-center min-h-[420px] md:min-h-0 w-full h-full select-none overflow-hidden">
        {/* Tall Luminous Champagne-Gold Studio Arch Halo */}
        <StudioArchHalo />

        {/* Subtle warm ambient floor halo directly beneath the circular bronze turntable */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 w-[78%] h-14 rounded-full blur-2xl z-10"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(255,216,132,0.55) 0%, rgba(214,154,58,0.22) 55%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Optional subtle GLB active indicator or worn garment chips at very top edge */}
        {(hasAnyOutfit || effectiveGlbName) && (
          <div className="pointer-events-none absolute top-2 inset-x-3 z-30 flex flex-wrap items-center justify-center gap-1.5">
            {effectiveGlbName && (
              <span className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2b1a0f]/90 border border-[#e3b560]/70 text-[#ffefc8] text-[10px] font-semibold shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5cd68d]" />
                <span className="truncate max-w-[150px]">GLB: {effectiveGlbName}</span>
              </span>
            )}
            {showClothing && selectedTop && (
              <span className="pointer-events-auto inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-full bg-[#2c1b10]/88 border border-[#d6a452]/65 text-[#fff2d6] text-[10.5px] font-medium shadow-md max-w-[180px]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40"
                  style={{
                    backgroundColor: overrideTopPalette?.[0] || selectedTop.palette[0],
                  }}
                />
                <span className="truncate">{selectedTop.name}</span>
                <button
                  type="button"
                  aria-label="Quitar prenda superior"
                  onClick={() => {
                    audioEngine.playEraseBrush();
                    onClearTop();
                  }}
                  className="p-0.5 rounded-full hover:bg-[#5c3919] text-[#f4cf84] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {showClothing && selectedBottom && (
              <span className="pointer-events-auto inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-full bg-[#2c1b10]/88 border border-[#d6a452]/65 text-[#fff2d6] text-[10.5px] font-medium shadow-md max-w-[180px]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40"
                  style={{
                    backgroundColor: overrideBottomPalette?.[0] || selectedBottom.palette[0],
                  }}
                />
                <span className="truncate">{selectedBottom.name}</span>
                <button
                  type="button"
                  aria-label="Quitar prenda inferior"
                  onClick={() => {
                    audioEngine.playEraseBrush();
                    onClearBottom();
                  }}
                  className="p-0.5 rounded-full hover:bg-[#5c3919] text-[#f4cf84] cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Isolated Real-Time Three.js WebGL Interactive Stage */}
        <div
          className={`relative z-20 flex-1 w-full h-full touch-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          <div ref={canvasMountRef} className="w-full h-full" />
        </div>

        {/* Iconic Curved Glowing 360° Turntable Emblem at Front of Illuminated Platform */}
        <div className="absolute bottom-1.5 sm:bottom-2.5 left-1/2 -translate-x-1/2 z-30">
          <Platform360Badge
            isSpinning={isSpinning360}
            yawDeg={yawDeg}
            onToggleSpin={onToggleSpin360}
          />
        </div>
      </div>
    );
  }
);

ProfessionalAvatarViewer.displayName = 'ProfessionalAvatarViewer';
