import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Camera, ChevronLeft, ChevronRight, Info, RotateCcw, X } from 'lucide-react';
import type { DressingRoomGarment, RunwayColorGrade, VestidorSpinSpeed } from '../types/crochet';
import type { StaticModelPose2D } from '../data/pasarelasAltaModaCatalog';
import {
  composeTransparentModelWithRug,
  estimateBottomPadFractionFromSrc,
  isGradeIdentity,
  measureImageBottomPadFraction,
  renderSkinSafeRunwayImage,
  type SkinToneGrade,
  type TransparentModelWithRugResult,
} from '../utils/garmentRunwayRenderer';
import { fitSafeCanvasSize, superRenderImageToCanvas } from '../utils/ultraHdImageEngine';
import {
  STUDIO_LIGHT_PRESETS,
  type BodyMeasurements,
  type GraphicsQualityLevel,
  type StudioLightPresetId,
} from '../utils/atelierMannequin3D';
import {
  collectBundlePhotoUrls,
  loadVestidorManifests,
  normalizeAngleDeg,
  OFFICIAL_MODEL_MANIFEST,
  OUTFIT_PHOTO_MANIFESTS,
  PHOTO_POSES,
  preloadPhotoUrls,
  resolveFittingView,
  yawRadToManifestDeg,
  type VestidorManifestBundle,
} from '../data/vestidorPhotoManifest';
import { audioEngine } from '../utils/audioEngine';
import { CircularCrochetRug } from './ArtisanCrochetDecorations';
import { StageMacrameCurtains, StageVintageSewingMachine } from './VestidorDecorAssets';

export interface PhotographicAvatarViewerHandle {
  captureSnapshot: (options?: { clean?: boolean }) => string | null;
  exportTransparentModelWithRug: (options?: {
    resolution?: '4k' | '8k';
  }) => Promise<TransparentModelWithRugResult | null>;
  getCurrentFrameInfo: () => { src: string; label: string; angleDeg: number };
  setTargetYaw: (rad: number) => void;
  setTargetAngleDeg: (deg: number) => void;
  stepAngle: (direction: 1 | -1) => void;
  zoomBy: (delta: number) => void;
  resetCamera: () => void;
  loadCustomPhoto: (url: string, fileName?: string) => void;
  clearCustomPhoto: () => void;
}

export interface PhotographicAvatarViewerProps {
  selectedTop: DressingRoomGarment | null;
  selectedBottom: DressingRoomGarment | null;
  overrideTopPalette?: string[] | null;
  overrideBottomPalette?: string[] | null;
  showClothing: boolean;
  knitRelief: boolean;
  poseIndex: number;
  isSpinning360: boolean;
  spinSpeed?: VestidorSpinSpeed;
  isAnimatingPose: boolean;
  lightPreset: StudioLightPresetId;
  qualityLevel: GraphicsQualityLevel;
  measurements: BodyMeasurements;
  manifestBundle?: VestidorManifestBundle;
  hideBottomSpinBadge?: boolean;
  hideDefaultFloorBasket?: boolean;
  cleanStageMode?: boolean;
  reducedMotion?: boolean;
  soundEnabled?: boolean;
  curtainsOpen?: boolean;
  curtainSrc?: string;
  curtainShowDreamcatcher?: boolean;
  skinTone?: SkinToneGrade | null;
  sewingPaused?: boolean;
  static2DMode?: boolean;
  activePose2D?: StaticModelPose2D;
  modelScale?: number;
  onChangeModelScale?: (nextScale: number) => void;
  onToggleSewingPaused?: () => void;
  onToggleSpin360: () => void;
  onStopSpin360: () => void;
  onYawChange?: (deg: number) => void;
  onZoomChange?: (zoom: number) => void;
  onClearTop: () => void;
  onClearBottom: () => void;
  onRestoreFlagshipOutfit?: () => void;
  onResetColors?: () => void;
  onRequestNaturalPose?: () => void;
  onEditActiveGarment?: () => void;
}

interface StudioMoodVisuals {
  radialGlow: string;
  vignette: string;
  imageFilter: string;
  imageFilterFlat: string;
  rimTint: string;
  canvasWallTop: string;
  canvasWallMid: string;
  canvasFloorTop: string;
  canvasFloorBot: string;
}

const STUDIO_MOOD_MAP: Record<StudioLightPresetId, StudioMoodVisuals> = {
  vestidor_lujo: {
    radialGlow:
      'radial-gradient(ellipse 68% 66% at 50% 40%, rgba(255,248,236,0.58) 0%, rgba(247,219,198,0.22) 52%, rgba(214,174,154,0) 80%)',
    vignette:
      'radial-gradient(ellipse 88% 92% at 50% 50%, rgba(0,0,0,0) 64%, rgba(140,86,62,0.14) 100%)',
    imageFilter: 'none',
    imageFilterFlat: 'none',
    rimTint: 'rgba(255, 245, 224, 0.45)',
    canvasWallTop: '#f3d8cc',
    canvasWallMid: '#e6c2b3',
    canvasFloorTop: '#dbb494',
    canvasFloorBot: '#c49674',
  },
  pasarela: {
    radialGlow:
      'radial-gradient(ellipse 66% 68% at 50% 34%, rgba(255,253,248,0.72) 0%, rgba(248,234,224,0.28) 54%, rgba(218,186,170,0) 82%)',
    vignette:
      'radial-gradient(ellipse 88% 92% at 50% 50%, rgba(0,0,0,0) 66%, rgba(132,96,80,0.12) 100%)',
    imageFilter: 'contrast(1.05) saturate(1.02) brightness(1.04)',
    imageFilterFlat: 'contrast(1.01) saturate(1) brightness(1.02)',
    rimTint: 'rgba(255, 252, 245, 0.56)',
    canvasWallTop: '#f8e6dc',
    canvasWallMid: '#ebd0c4',
    canvasFloorTop: '#e0bda0',
    canvasFloorBot: '#ca9e7c',
  },
  claroscuro: {
    radialGlow:
      'radial-gradient(ellipse 58% 60% at 45% 38%, rgba(255,232,196,0.44) 0%, rgba(196,148,120,0.14) 48%, rgba(118,74,52,0) 78%)',
    vignette:
      'radial-gradient(ellipse 76% 80% at 50% 48%, rgba(0,0,0,0) 46%, rgba(88,46,28,0.34) 100%)',
    imageFilter: 'contrast(1.09) saturate(0.98) brightness(0.97)',
    imageFilterFlat: 'contrast(1.03) saturate(0.98) brightness(0.98)',
    rimTint: 'rgba(255, 224, 174, 0.36)',
    canvasWallTop: '#dfb9a7',
    canvasWallMid: '#c69886',
    canvasFloorTop: '#bd9272',
    canvasFloorBot: '#9e7152',
  },
  dorada: {
    radialGlow:
      'radial-gradient(ellipse 72% 68% at 52% 40%, rgba(255,234,174,0.58) 0%, rgba(246,200,136,0.24) 52%, rgba(208,154,104,0) 80%)',
    vignette:
      'radial-gradient(ellipse 86% 88% at 50% 50%, rgba(0,0,0,0) 60%, rgba(148,88,40,0.18) 100%)',
    imageFilter: 'contrast(1.03) saturate(1.06) sepia(0.06) brightness(1.02)',
    imageFilterFlat: 'contrast(1) saturate(1.03) sepia(0.03) brightness(1.01)',
    rimTint: 'rgba(255, 228, 152, 0.48)',
    canvasWallTop: '#f5dac0',
    canvasWallMid: '#e8c2a4',
    canvasFloorTop: '#deb58c',
    canvasFloorBot: '#c29064',
  },
  clasico: {
    radialGlow:
      'radial-gradient(ellipse 68% 64% at 50% 42%, rgba(255,246,232,0.5) 0%, rgba(235,204,186,0.2) 52%, rgba(196,164,144,0) 80%)',
    vignette:
      'radial-gradient(ellipse 88% 90% at 50% 50%, rgba(0,0,0,0) 64%, rgba(128,88,68,0.14) 100%)',
    imageFilter: 'contrast(1.01) saturate(1.0) brightness(1.01)',
    imageFilterFlat: 'contrast(1) saturate(1) brightness(1)',
    rimTint: 'rgba(255, 244, 226, 0.38)',
    canvasWallTop: '#f1dad0',
    canvasWallMid: '#e2c4b6',
    canvasFloorTop: '#d7b498',
    canvasFloorBot: '#be9578',
  },
};

export const PhotographicAvatarViewer25D = React.forwardRef<
  PhotographicAvatarViewerHandle,
  PhotographicAvatarViewerProps
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
      spinSpeed = 'normal',
      isAnimatingPose,
      lightPreset,
      qualityLevel,
      measurements,
      manifestBundle: externalBundle,
      hideBottomSpinBadge = false,
      hideDefaultFloorBasket = false,
      cleanStageMode = false,
      reducedMotion = false,
      soundEnabled = false,
      curtainsOpen = true,
      curtainSrc,
      curtainShowDreamcatcher = true,
      skinTone = null,
      sewingPaused = false,
      static2DMode = false,
      activePose2D,
      modelScale,
      onChangeModelScale,
      onToggleSewingPaused,
      onToggleSpin360,
      onStopSpin360,
      onYawChange,
      onZoomChange,
      onClearTop,
      onClearBottom,
      onResetColors,
      onRequestNaturalPose,
      onEditActiveGarment,
    },
    ref
  ) => {
    const stageRef = useRef<HTMLDivElement | null>(null);
    const stageAssemblyRef = useRef<HTMLDivElement | null>(null);
    const activeImgRef = useRef<HTMLImageElement | null>(null);
    const backdropImgRef = useRef<HTMLImageElement | null>(null);
    const rugImgRef = useRef<HTMLImageElement | null>(null);
    const onYawChangeRef = useRef(onYawChange);
    onYawChangeRef.current = onYawChange;
    const onZoomChangeRef = useRef(onZoomChange);
    onZoomChangeRef.current = onZoomChange;
    const playClick = useCallback(() => {
      if (soundEnabled) audioEngine.playStitchClick();
    }, [soundEnabled]);

    // Live measured stage box & model image foot-sole metrics so the circular crochet rug
    // ALWAYS sits flat underneath the model's shoe soles across every viewport, garment & pose.
    const [stageBox, setStageBox] = useState<{ w: number; h: number }>({ w: 520, h: 660 });
    const [modelMetrics, setModelMetrics] = useState<{ aspect: number; bottomPadFrac: number }>({
      aspect: 1280 / 2160,
      bottomPadFrac: 0.0416,
    });

    useEffect(() => {
      const el = stageAssemblyRef.current;
      if (!el) return;
      const updateBox = () => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 40 && rect.height > 40) {
          setStageBox((prev) =>
            Math.abs(prev.w - rect.width) < 1 && Math.abs(prev.h - rect.height) < 1
              ? prev
              : { w: rect.width, h: rect.height }
          );
        }
      };
      updateBox();
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(updateBox);
        ro.observe(el);
        return () => ro.disconnect();
      }
      window.addEventListener('resize', updateBox);
      return () => window.removeEventListener('resize', updateBox);
    }, []);

    useEffect(() => {
      const bg = new Image();
      bg.src = '/vestidor/artisan/studio-backdrop.jpg';
      backdropImgRef.current = bg;
      const rug = new Image();
      rug.src = '/vestidor/artisan/crochet-rug.png';
      rugImgRef.current = rug;
    }, []);

    const [internalBundle, setInternalBundle] = useState<VestidorManifestBundle>(() => ({
      model: OFFICIAL_MODEL_MANIFEST,
      poses: PHOTO_POSES,
      outfits: OUTFIT_PHOTO_MANIFESTS,
    }));
    const bundle = externalBundle ?? internalBundle;

    useEffect(() => {
      if (externalBundle) {
        preloadPhotoUrls(collectBundlePhotoUrls(externalBundle));
        return;
      }
      let alive = true;
      void loadVestidorManifests().then((loaded) => {
        if (alive) setInternalBundle(loaded);
      });
      return () => {
        alive = false;
      };
    }, [externalBundle]);

    const [customPhoto, setCustomPhoto] = useState<{ url: string; label: string } | null>(null);

    // Angle, zoom, pan, and 2.5D parallax state
    const [angleDeg, setAngleDeg] = useState<number>(0);
    const [zoom, setZoom] = useState<number>(1.0);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [parallax, setParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [cameraFloatPhase, setCameraFloatPhase] = useState<number>(0);

    // Smooth dual-layer photographic crossfade state
    const [displayedSrc, setDisplayedSrc] = useState<string>('');
    const [previousSrc, setPreviousSrc] = useState<string | null>(null);
    const [isFading, setIsFading] = useState<boolean>(false);
    const fadeTimerRef = useRef<number | null>(null);

    // Multi-touch pinch-to-zoom pointer tracker
    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchRef = useRef<{
      active: boolean;
      startDist: number;
      startZoom: number;
      lastMidX: number;
      lastMidY: number;
    }>({
      active: false,
      startDist: 0,
      startZoom: 1,
      lastMidX: 0,
      lastMidY: 0,
    });

    const dragRef = useRef<{
      active: boolean;
      mode: 'rotate' | 'pan';
      pointerId: number;
      startX: number;
      startY: number;
      lastX: number;
      lastY: number;
      accumulatedDeg: number;
    }>({
      active: false,
      mode: 'rotate',
      pointerId: -1,
      startX: 0,
      startY: 0,
      lastX: 0,
      lastY: 0,
      accumulatedDeg: 0,
    });

    const resolved = useMemo(
      () =>
        resolveFittingView({
          selectedTop,
          selectedBottom,
          overrideTopPalette,
          overrideBottomPalette,
          showClothing,
          poseIndex,
          angleDeg,
          customPhotoUrl: customPhoto?.url ?? null,
          customPhotoLabel: customPhoto?.label ?? null,
          bundle,
        }),
      [
        selectedTop,
        selectedBottom,
        overrideTopPalette,
        overrideBottomPalette,
        showClothing,
        poseIndex,
        angleDeg,
        customPhoto,
        bundle,
      ]
    );

    const activeGarment = showClothing ? (selectedTop ?? selectedBottom) : null;

    // Resolve the raw 2D source respecting dedicated 2D pose photos when selected
    const effectiveRawModelSrc = useMemo(() => {
      if (customPhoto?.url) return customPhoto.url;
      if (static2DMode && activePose2D) {
        if (!activeGarment && activePose2D.overrideBaseSrc) {
          return activePose2D.overrideBaseSrc;
        }
        if (activeGarment && activePose2D.dressedOverrideSrc) {
          return activePose2D.dressedOverrideSrc;
        }
        if (
          activePose2D.overrideBaseSrc &&
          (activePose2D.id === 'perfil-izquierdo' ||
            activePose2D.id === 'perfil-derecho' ||
            activePose2D.id === 'espalda-editorial')
        ) {
          return activePose2D.overrideBaseSrc;
        }
      }
      return resolved.activeFrame.src;
    }, [customPhoto, static2DMode, activePose2D, activeGarment, resolved.activeFrame.src]);

    // Combine runway couture color grade with EXACT hyperrealistic yarn-ball dyeing (strictly skin-safe!)
    const effectiveColorGrade = useMemo<(RunwayColorGrade & { exactDye?: boolean }) | null>(() => {
      if (!activeGarment || customPhoto?.url) return null;
      if (
        static2DMode &&
        activePose2D &&
        (activePose2D.id === 'perfil-izquierdo' ||
          activePose2D.id === 'perfil-derecho' ||
          activePose2D.id === 'espalda-editorial' ||
          activePose2D.id === 'manos-bolsillos')
      ) {
        return null;
      }
      const overrideHex = overrideTopPalette?.[0] || overrideBottomPalette?.[0];
      if (overrideHex) {
        return {
          tintHex: overrideHex,
          tintStrength: 0.92,
          exactDye: true,
        };
      }
      return activeGarment.runwayColorGrade ?? null;
    }, [activeGarment, customPhoto, static2DMode, activePose2D, overrideTopPalette, overrideBottomPalette]);

    const [gradedSrc, setGradedSrc] = useState<string>('');

    useEffect(() => {
      let alive = true;
      if (!effectiveRawModelSrc) return;
      const hasGarmentChange = Boolean(effectiveColorGrade && !isGradeIdentity(effectiveColorGrade));
      const hasSkinChange = Boolean(skinTone && skinTone.id !== 'natural');
      if (!hasGarmentChange && !hasSkinChange) {
        setGradedSrc(effectiveRawModelSrc);
        return;
      }
      void renderSkinSafeRunwayImage(
        effectiveRawModelSrc,
        activeGarment?.garmentMaskUrl,
        effectiveColorGrade,
        1280,
        skinTone
      )
        .then((outUrl) => {
          if (alive) setGradedSrc(outUrl);
        })
        .catch(() => {
          if (alive) setGradedSrc(effectiveRawModelSrc);
        });
      return () => {
        alive = false;
      };
    }, [effectiveRawModelSrc, activeGarment?.garmentMaskUrl, effectiveColorGrade, skinTone]);

    const targetDisplaySrc = gradedSrc || effectiveRawModelSrc;

    useEffect(() => {
      preloadPhotoUrls(resolved.availableFrames.map((f) => f.src));
    }, [resolved.availableFrames]);

    useEffect(() => {
      const nextSrc = targetDisplaySrc;
      if (!nextSrc) return;
      if (!displayedSrc) {
        setDisplayedSrc(nextSrc);
        return;
      }
      if (nextSrc === displayedSrc) return;

      setPreviousSrc(displayedSrc);
      setDisplayedSrc(nextSrc);
      setIsFading(true);

      if (fadeTimerRef.current) {
        window.clearTimeout(fadeTimerRef.current);
      }
      fadeTimerRef.current = window.setTimeout(() => {
        setPreviousSrc(null);
        setIsFading(false);
        fadeTimerRef.current = null;
      }, 220);
    }, [targetDisplaySrc, displayedSrc]);

    useEffect(() => {
      return () => {
        if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
      };
    }, []);

    useEffect(() => {
      onYawChangeRef.current?.(Math.round(resolved.resolvedAngleDeg));
    }, [resolved.resolvedAngleDeg]);

    useEffect(() => {
      onZoomChangeRef.current?.(zoom);
    }, [zoom]);

    const stepAngle = useCallback(
      (direction: 1 | -1) => {
        const frames = resolved.availableFrames;
        if (frames.length <= 1) {
          if (onRequestNaturalPose && resolved.poseId !== 'natural') {
            onRequestNaturalPose();
            setAngleDeg((prev) => normalizeAngleDeg(prev + direction * 90));
          } else {
            // Let user inspect next angle even if only 1 view exists so honest missing-angle banner shows cleanly
            setAngleDeg((prev) => normalizeAngleDeg(prev + direction * 90));
          }
          return;
        }
        const sorted = [...frames].sort((a, b) => a.angleDeg - b.angleDeg);
        const currentIdx = Math.max(
          0,
          sorted.findIndex((f) => f.id === resolved.activeFrame.id)
        );
        const nextIdx = (currentIdx + direction + sorted.length) % sorted.length;
        setAngleDeg(sorted[nextIdx].angleDeg);
      },
      [resolved.availableFrames, resolved.activeFrame.id, resolved.poseId, onRequestNaturalPose]
    );

    useEffect(() => {
      if (!isSpinning360) return;

      if (resolved.availableFrames.length <= 1) {
        if (onRequestNaturalPose && resolved.poseId !== 'natural') {
          onRequestNaturalPose();
        } else {
          onStopSpin360();
        }
        return;
      }

      const count = resolved.availableFrames.length;
      const cycleDurationMs =
        spinSpeed === 'lento' ? 8400 : spinSpeed === 'rapido' ? 2400 : 4800;
      const stepMs = Math.max(240, Math.round(cycleDurationMs / count));
      const id = window.setInterval(() => {
        stepAngle(1);
      }, stepMs);

      return () => window.clearInterval(id);
    }, [
      isSpinning360,
      spinSpeed,
      resolved.availableFrames.length,
      resolved.poseId,
      stepAngle,
      onRequestNaturalPose,
      onStopSpin360,
    ]);

    useEffect(() => {
      if (!isAnimatingPose || reducedMotion) {
        setCameraFloatPhase(0);
        return;
      }
      let rafId = 0;
      const start = performance.now();
      const tick = (now: number) => {
        setCameraFloatPhase((now - start) / 1000);
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
      return () => window.cancelAnimationFrame(rafId);
    }, [isAnimatingPose, reducedMotion]);

    // Super-rendered 8K PNG snapshot reproducing the sunlit blush-cream studio, wood floor & circular crochet rug
    const captureSnapshot = useCallback(
      (options?: { clean?: boolean }): string | null => {
        const img = activeImgRef.current;
        if (!img || !img.complete || img.naturalWidth === 0) return null;

        const safe = fitSafeCanvasSize(5420, 7680);
        const W = safe.width;
        const H = safe.height;
        const unit = H / 1360;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const mood = STUDIO_MOOD_MAP[lightPreset] ?? STUDIO_MOOD_MAP.vestidor_lujo;

        // 1. Photorealistic studio room backdrop super-rendered cleanly
        const bgImg = backdropImgRef.current;
        if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
          const bgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
          const drawH = H;
          const drawW = Math.round(drawH * bgAspect);
          const offsetX = (W - drawW) / 2;
          const superBg = superRenderImageToCanvas(bgImg, drawW, drawH, {
            sharpness: 0.55,
            clarity: 0.04,
            vibrance: 0.03,
          });
          ctx.drawImage(superBg, offsetX, 0, drawW, drawH);
        } else {
          const wallGrad = ctx.createRadialGradient(
            W * 0.5,
            H * 0.34,
            40 * unit,
            W * 0.5,
            H * 0.45,
            W * 0.85
          );
          wallGrad.addColorStop(0, '#fff4ea');
          wallGrad.addColorStop(0.45, mood.canvasWallTop);
          wallGrad.addColorStop(1, mood.canvasWallMid);
          ctx.fillStyle = wallGrad;
          ctx.fillRect(0, 0, W, H);
        }

        // 2. Photorealistic 3D circular hand-crocheted rug super-rendered flat beneath the model's feet
        const bottomPadFrac = measureImageBottomPadFraction(img);
        const rugW = Math.round(700 * unit);
        const rugH = Math.round(rugW / 2.85);
        const rugBottomY = H - Math.round(64 * unit);
        const rugTopY = rugBottomY - rugH;
        const soleY = rugBottomY - Math.round(rugH * 0.48);

        ctx.save();
        const rugImg = rugImgRef.current;
        if (rugImg && rugImg.complete && rugImg.naturalWidth > 0) {
          const rugFloorShadow = ctx.createRadialGradient(
            W / 2,
            rugBottomY - rugH * 0.42,
            rugW * 0.18,
            W / 2,
            rugBottomY - rugH * 0.42,
            rugW * 0.54
          );
          rugFloorShadow.addColorStop(0, 'rgba(62, 28, 12, 0.34)');
          rugFloorShadow.addColorStop(0.72, 'rgba(62, 28, 12, 0.14)');
          rugFloorShadow.addColorStop(1, 'rgba(62, 28, 12, 0)');
          ctx.fillStyle = rugFloorShadow;
          ctx.beginPath();
          ctx.ellipse(W / 2, rugBottomY - rugH * 0.42, rugW * 0.53, rugH * 0.52, 0, 0, Math.PI * 2);
          ctx.fill();

          const superRug = superRenderImageToCanvas(rugImg, rugW, rugH, {
            sharpness: 0.78,
            clarity: 0.06,
            vibrance: 0.04,
          });
          ctx.drawImage(superRug, (W - rugW) / 2, rugTopY, rugW, rugH);
        }

        // Grounded foot contact shadows directly under the shoe soles on the rug center medallion
        const footShadow = ctx.createRadialGradient(
          W / 2,
          soleY + 3 * unit,
          16 * unit,
          W / 2,
          soleY + 3 * unit,
          178 * unit
        );
        footShadow.addColorStop(0, 'rgba(54, 24, 10, 0.44)');
        footShadow.addColorStop(0.58, 'rgba(54, 24, 10, 0.18)');
        footShadow.addColorStop(1, 'rgba(54, 24, 10, 0)');
        ctx.fillStyle = footShadow;
        ctx.beginPath();
        ctx.ellipse(W / 2, soleY + 3 * unit, 178 * unit, 25 * unit, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 3. Super-rendered 8K photographic model with shoe soles anchored squarely on the rug center
        const maxDrawH = Math.round((soleY - 64 * unit) / Math.max(0.5, 1 - bottomPadFrac));
        const maxDrawW = W - Math.round(120 * unit);
        const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
        let targetH = maxDrawH;
        let targetW = targetH * aspect;
        if (targetW > maxDrawW) {
          targetW = maxDrawW;
          targetH = targetW / aspect;
        }
        const drawX = (W - targetW) / 2;
        const drawY = soleY - targetH * (1 - bottomPadFrac);

        const superModel = superRenderImageToCanvas(img, Math.round(targetW), Math.round(targetH), {
          sharpness: 0.84,
          clarity: 0.06,
          vibrance: 0.04,
        });

        ctx.save();
        ctx.filter = knitRelief ? mood.imageFilter : mood.imageFilterFlat;
        ctx.drawImage(superModel, drawX, drawY, targetW, targetH);
        ctx.restore();

        // 4. Optional subtle native 8K vector caption omitted in Clean Photo (Sin interfaz) mode
        if (!options?.clean) {
          ctx.save();
          ctx.font = `600 ${Math.round(20 * unit)}px Georgia, serif`;
          ctx.fillStyle = 'rgba(84, 42, 18, 0.82)';
          ctx.textAlign = 'center';
          ctx.fillText(
            `El Vestidor Dorado · ${resolved.outfitName} · ${resolved.activeFrame.label}`,
            W / 2,
            H - Math.round(32 * unit)
          );
          ctx.restore();
        }

        return canvas.toDataURL('image/png');
      },
      [lightPreset, knitRelief, resolved.outfitName, resolved.activeFrame.label]
    );

    const exportTransparentModelWithRug = useCallback(
      async (options?: { resolution?: '4k' | '8k' }) => {
        const modelSrc = displayedSrc || targetDisplaySrc || resolved.activeFrame.src;
        if (!modelSrc) return null;
        return composeTransparentModelWithRug({
          modelSrc,
          rugSrc: '/vestidor/artisan/crochet-rug.webp',
          flipX: Boolean(static2DMode && activePose2D?.flipX),
          includeRug: true,
          resolution: options?.resolution ?? '8k',
        });
      },
      [displayedSrc, targetDisplaySrc, resolved.activeFrame.src, static2DMode, activePose2D?.flipX]
    );

    useImperativeHandle(
      ref,
      () => ({
        captureSnapshot,
        exportTransparentModelWithRug,
        getCurrentFrameInfo: () => ({
          src: displayedSrc || targetDisplaySrc || resolved.activeFrame.src,
          label: static2DMode && activePose2D ? activePose2D.title : resolved.activeFrame.label,
          angleDeg: Math.round(resolved.resolvedAngleDeg),
        }),
        setTargetYaw: (rad: number) => {
          const targetDeg = yawRadToManifestDeg(rad);
          setAngleDeg(targetDeg);
        },
        setTargetAngleDeg: (deg: number) => {
          setAngleDeg(normalizeAngleDeg(deg));
        },
        stepAngle,
        zoomBy: (delta: number) => {
          setZoom((prev) => {
            const next = Math.max(0.85, Math.min(2.6, Number((prev - delta * 0.24).toFixed(2))));
            if (next <= 1.04) setPan({ x: 0, y: 0 });
            return next;
          });
        },
        resetCamera: () => {
          setZoom(1.0);
          setPan({ x: 0, y: 0 });
          setAngleDeg(0);
          setParallax({ x: 0, y: 0 });
        },
        loadCustomPhoto: (url: string, fileName?: string) => {
          setCustomPhoto({
            url,
            label: fileName || 'Fotografía de estudio cargada',
          });
          setZoom(1.0);
          setPan({ x: 0, y: 0 });
        },
        clearCustomPhoto: () => {
          setCustomPhoto(null);
        },
      }),
      [
        captureSnapshot,
        exportTransparentModelWithRug,
        stepAngle,
        displayedSrc,
        targetDisplaySrc,
        static2DMode,
        activePose2D,
        resolved.activeFrame.src,
        resolved.activeFrame.label,
        resolved.resolvedAngleDeg,
      ]
    );

    // Sync controlled external modelScale smoothly (for free 2D model resizing)
    useEffect(() => {
      if (typeof modelScale === 'number' && Number.isFinite(modelScale)) {
        const clamped = Math.max(0.55, Math.min(2.2, Number(modelScale.toFixed(2))));
        setZoom(clamped);
        if (clamped <= 1.04) setPan({ x: 0, y: 0 });
      }
    }, [modelScale]);

    const applyScale2D = useCallback(
      (nextScale: number) => {
        const clamped = Math.max(0.55, Math.min(2.2, Number(nextScale.toFixed(2))));
        setZoom(clamped);
        if (clamped <= 1.04) setPan({ x: 0, y: 0 });
        onChangeModelScale?.(clamped);
      },
      [onChangeModelScale]
    );

    const resizeHandleRef = useRef<{
      active: boolean;
      pointerId: number;
      startY: number;
      startX: number;
      startScale: number;
    }>({ active: false, pointerId: -1, startY: 0, startX: 0, startScale: 1 });

    const handleResizeHandleDown = useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        resizeHandleRef.current = {
          active: true,
          pointerId: e.pointerId,
          startY: e.clientY,
          startX: e.clientX,
          startScale: zoom,
        };
        setIsDragging(true);
      },
      [zoom]
    );

    const handleResizeHandleMove = useCallback(
      (e: React.PointerEvent<HTMLButtonElement>) => {
        if (!resizeHandleRef.current.active || resizeHandleRef.current.pointerId !== e.pointerId) {
          return;
        }
        e.stopPropagation();
        // Dragging up or right makes the model bigger; dragging down or left makes it smaller
        const deltaPx =
          (resizeHandleRef.current.startY - e.clientY) * 0.75 +
          (e.clientX - resizeHandleRef.current.startX) * 0.55;
        applyScale2D(resizeHandleRef.current.startScale + deltaPx / 260);
      },
      [applyScale2D]
    );

    const handleResizeHandleUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
      if (resizeHandleRef.current.pointerId === e.pointerId) {
        resizeHandleRef.current.active = false;
        resizeHandleRef.current.pointerId = -1;
        setIsDragging(false);
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    }, []);

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // Two-finger pinch-to-resize & pan on touchscreens
        if (activePointersRef.current.size === 2) {
          const pts = Array.from(activePointersRef.current.values());
          const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
          pinchRef.current = {
            active: true,
            startDist: Math.max(10, dist),
            startZoom: zoom,
            lastMidX: (pts[0].x + pts[1].x) / 2,
            lastMidY: (pts[0].y + pts[1].y) / 2,
          };
          dragRef.current.active = false;
          setIsDragging(true);
          return;
        }

        // In static 2D mode: NEVER rotate — only allow smooth panning when resized > 105%
        if (static2DMode) {
          if (zoom <= 1.04) return;
          dragRef.current = {
            active: true,
            mode: 'pan',
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            lastX: e.clientX,
            lastY: e.clientY,
            accumulatedDeg: angleDeg,
          };
          setIsDragging(true);
          return;
        }

        const mode: 'rotate' | 'pan' = zoom > 1.08 && !e.shiftKey ? 'pan' : 'rotate';
        dragRef.current = {
          active: true,
          mode,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          accumulatedDeg: angleDeg,
        };
        setIsDragging(true);
        if (isSpinning360 && mode === 'rotate') {
          onStopSpin360();
        }
      },
      [static2DMode, zoom, angleDeg, isSpinning360, onStopSpin360]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (activePointersRef.current.has(e.pointerId)) {
          activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        // Active two-finger pinch resize + pan
        if (pinchRef.current.active && activePointersRef.current.size >= 2) {
          const pts = Array.from(activePointersRef.current.values());
          const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
          const ratio = dist / pinchRef.current.startDist;
          const nextZoom = Math.max(
            0.55,
            Math.min(2.2, Number((pinchRef.current.startZoom * ratio).toFixed(2)))
          );
          applyScale2D(nextZoom);

          const midX = (pts[0].x + pts[1].x) / 2;
          const midY = (pts[0].y + pts[1].y) / 2;
          const dmx = midX - pinchRef.current.lastMidX;
          const dmy = midY - pinchRef.current.lastMidY;
          pinchRef.current.lastMidX = midX;
          pinchRef.current.lastMidY = midY;

          if (nextZoom <= 1.04) {
            setPan({ x: 0, y: 0 });
          } else {
            const maxPanX = 240 * (nextZoom - 1);
            const maxPanY = 300 * (nextZoom - 1);
            setPan((prev) => ({
              x: Math.max(-maxPanX, Math.min(maxPanX, prev.x + dmx)),
              y: Math.max(-maxPanY, Math.min(maxPanY, prev.y + dmy)),
            }));
          }
          return;
        }

        if (!static2DMode && !reducedMotion) {
          const rect = stageRef.current?.getBoundingClientRect();
          if (rect && rect.width > 0 && rect.height > 0) {
            const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            setParallax({
              x: Math.max(-1, Math.min(1, nx)),
              y: Math.max(-1, Math.min(1, ny)),
            });
          }
        }

        if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId) return;
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;

        if (dragRef.current.mode === 'pan') {
          const maxPanX = 240 * Math.max(0.25, zoom - 1);
          const maxPanY = 320 * Math.max(0.25, zoom - 1);
          setPan((prev) => ({
            x: Math.max(-maxPanX, Math.min(maxPanX, prev.x + dx)),
            y: Math.max(-maxPanY, Math.min(maxPanY, prev.y + dy)),
          }));
        } else if (!static2DMode) {
          const degPerPx = 360 / 220;
          dragRef.current.accumulatedDeg = normalizeAngleDeg(
            dragRef.current.accumulatedDeg - dx * degPerPx
          );
          setAngleDeg(dragRef.current.accumulatedDeg);
        }
      },
      [static2DMode, zoom, reducedMotion, applyScale2D]
    );

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) {
        pinchRef.current.active = false;
      }
      if (dragRef.current.pointerId === e.pointerId) {
        dragRef.current.active = false;
        dragRef.current.pointerId = -1;
      }
      if (activePointersRef.current.size === 0) {
        setIsDragging(false);
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }, []);

    const handlePointerLeave = useCallback(() => {
      if (!dragRef.current.active && !pinchRef.current.active) {
        setParallax({ x: 0, y: 0 });
      }
    }, []);

    const handleWheel = useCallback(
      (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        if (static2DMode) {
          applyScale2D(zoom + delta);
          return;
        }
        setZoom((prev) => {
          const next = Math.max(0.85, Math.min(2.6, Number((prev + delta).toFixed(2))));
          if (next <= 1.04) setPan({ x: 0, y: 0 });
          return next;
        });
      },
      [static2DMode, zoom, applyScale2D]
    );

    const handleDoubleClick = useCallback(() => {
      playClick();
      if (static2DMode) {
        applyScale2D(1.0);
        setPan({ x: 0, y: 0 });
        return;
      }
      setZoom(1.0);
      setPan({ x: 0, y: 0 });
      setParallax({ x: 0, y: 0 });
    }, [playClick, static2DMode, applyScale2D]);

    const mood = STUDIO_MOOD_MAP[lightPreset] ?? STUDIO_MOOD_MAP.vestidor_lujo;

    const framingScale = useMemo(() => {
      if (static2DMode && activePose2D) {
        if (activePose2D.framing === 'mid') return 1.28;
        if (activePose2D.framing === 'wide') return 0.92;
        return 1.0;
      }
      const h = measurements?.height ?? 1.0;
      return Math.max(0.94, Math.min(1.04, 1 + (h - 1) * 0.35));
    }, [measurements?.height, static2DMode, activePose2D]);

    const floatY =
      !static2DMode && isAnimatingPose && !reducedMotion
        ? Math.sin(cameraFloatPhase * 1.45) * 3.5
        : 0;
    const floatX =
      !static2DMode && isAnimatingPose && !reducedMotion
        ? Math.cos(cameraFloatPhase * 0.85) * 3.0
        : 0;
    const floatScale =
      !static2DMode && isAnimatingPose && !reducedMotion
        ? 1 + Math.sin(cameraFloatPhase * 1.45) * 0.006
        : 1;

    const parallaxStrength =
      static2DMode || reducedMotion || qualityLevel === 'medio'
        ? 0
        : qualityLevel === 'ultra'
          ? 0.9
          : 0.65;
    const bgParallaxX = -parallax.x * 6 * parallaxStrength + floatX * -0.4;
    const bgParallaxY = -parallax.y * 4 * parallaxStrength;
    const rugParallaxX = parallax.x * 2.5 * parallaxStrength + floatX * 0.25;
    const modelParallaxX = parallax.x * 4 * parallaxStrength + floatX;
    const modelParallaxY = parallax.y * 1.8 * parallaxStrength + floatY;
    const poseFlipX = Boolean(static2DMode && activePose2D?.flipX);
    const poseOriginY = static2DMode && activePose2D?.framing === 'mid' ? '28%' : '100%';

    const activeFilter = knitRelief ? mood.imageFilter : mood.imageFilterFlat;
    const activeShadow = knitRelief
      ? 'drop-shadow(0 10px 14px rgba(72, 34, 14, 0.22))'
      : 'drop-shadow(0 6px 10px rgba(72, 34, 14, 0.14))';
    const combinedImgFilter =
      activeFilter && activeFilter !== 'none'
        ? `${activeFilter} ${activeShadow}`
        : activeShadow;

    const viewCount = resolved.availableFrames.length;
    const shortAngleLabel = resolved.activeFrame.label;
    const activeDisplaySrc = displayedSrc || targetDisplaySrc || resolved.activeFrame.src;

    const syncModelMetricsFromImg = useCallback((img: HTMLImageElement | null) => {
      if (!img || !img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) return;
      const nextAspect = img.naturalWidth / img.naturalHeight;
      const nextPad = measureImageBottomPadFraction(img);
      setModelMetrics((prev) =>
        Math.abs(prev.aspect - nextAspect) < 0.002 && Math.abs(prev.bottomPadFrac - nextPad) < 0.002
          ? prev
          : { aspect: nextAspect, bottomPadFrac: nextPad }
      );
    }, []);

    useEffect(() => {
      const img = activeImgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        syncModelMetricsFromImg(img);
      } else {
        const estPad = estimateBottomPadFractionFromSrc(activeDisplaySrc);
        setModelMetrics((prev) =>
          Math.abs(prev.bottomPadFrac - estPad) < 0.002 ? prev : { ...prev, bottomPadFrac: estPad }
        );
      }
    }, [activeDisplaySrc, syncModelMetricsFromImg]);

    // Pixel-locked Rug + Shoe Sole geometry: guarantees the circular crochet rug ALWAYS lies
    // flat directly beneath the model's feet with zero floating and zero Safari filter clipping.
    const stageLayout = useMemo(() => {
      const RUG_ASPECT = 2.85;
      const RUG_WIDTH_RATIO = 0.62;
      const RUG_LANDING_FRAC = 0.48;
      const padTop = 8;
      const rugBottom = 6;
      const availW = Math.max(240, stageBox.w);
      const availH = Math.max(240, stageBox.h - padTop - rugBottom);
      const safeAspect = Math.max(0.28, Math.min(1.6, modelMetrics.aspect));
      const padFrac = Math.max(0, Math.min(0.22, modelMetrics.bottomPadFrac));

      const maxHByHeight =
        availH / Math.max(0.5, 1 + (RUG_WIDTH_RATIO / RUG_ASPECT) * RUG_LANDING_FRAC - padFrac);
      const maxHByWidth = (availW * 0.94) / safeAspect;
      const modelH = Math.max(180, Math.min(maxHByHeight, maxHByWidth));
      const modelW = modelH * safeAspect;

      const rugW = Math.min(availW * 0.9, modelH * RUG_WIDTH_RATIO);
      const rugH = rugW / RUG_ASPECT;
      const soleFromBottom = rugBottom + rugH * RUG_LANDING_FRAC;
      const modelBottom = soleFromBottom - modelH * padFrac;

      return {
        rugW: Math.round(rugW),
        rugH: Math.round(rugH),
        rugBottom,
        modelW: Math.round(modelW),
        modelH: Math.round(modelH),
        modelBottom: Math.round(modelBottom),
      };
    }, [stageBox.w, stageBox.h, modelMetrics.aspect, modelMetrics.bottomPadFrac]);

    const hasStageZoomOrPan =
      Math.abs(pan.x) > 0.25 || Math.abs(pan.y) > 0.25 || Math.abs(zoom - 1) > 0.002;
    const hasUnitTransform =
      Math.abs(framingScale * floatScale - 1) > 0.002 ||
      Math.abs(modelParallaxX) > 0.25 ||
      Math.abs(modelParallaxY) > 0.25;

    return (
      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        className={`group/stage relative w-full h-full min-h-[380px] flex flex-col items-center justify-end overflow-hidden select-none touch-none ${
          static2DMode
            ? isDragging
              ? 'cursor-grabbing'
              : zoom > 1.04
                ? 'cursor-move'
                : 'cursor-default'
            : isDragging
              ? 'cursor-grabbing'
              : zoom > 1.08
                ? 'cursor-move'
                : 'cursor-grab'
        }`}
      >
        {/* =================================================================
            DECORATIVE STUDIO STAGE (cleanly separated from photo container)
        ================================================================= */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          {/* Sunlit Warm Blush-Cream Studio Glow */}
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: mood.radialGlow,
              transform:
                bgParallaxX !== 0 || bgParallaxY !== 0
                  ? `translate3d(${bgParallaxX}px, ${bgParallaxY}px, 0)`
                  : undefined,
            }}
          />
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{ background: mood.vignette }}
          />

          {/* Soft glowing sunlit studio arch silhouette behind the model */}
          <div
            className="absolute inset-x-[14%] top-[4%] bottom-[16%] rounded-t-[999px] opacity-60 transition-transform duration-300"
            style={{
              background:
                'radial-gradient(ellipse 80% 72% at 50% 34%, rgba(255,252,244,0.68) 0%, rgba(255,241,226,0.22) 56%, rgba(255,241,226,0) 85%)',
              transform:
                bgParallaxX !== 0 || bgParallaxY !== 0
                  ? `translate3d(${bgParallaxX * 0.5}px, ${bgParallaxY * 0.4}px, 0)`
                  : undefined,
            }}
          />

          {/* Right Floor Photorealistic Wicker Yarn Basket (rendered by editable decor layer when active) */}
          {!hideDefaultFloorBasket && (
            <img
              src="/vestidor/artisan/floor-yarn-basket.png"
              alt=""
              draggable={false}
              className="select-none hidden sm:block absolute right-1 bottom-[15%] w-[108px] md:w-[126px] xl:w-[144px] h-auto drop-shadow-[0_10px_16px_rgba(64,32,12,0.32)]"
            />
          )}
        </div>

        {/* Framing Golden Macramé Curtains with Dreamcatchers (never obscuring the central model) */}
        <StageMacrameCurtains
          isOpen={curtainsOpen}
          reducedMotion={reducedMotion}
          curtainSrc={curtainSrc}
          showDreamcatcher={curtainShowDreamcatcher}
        />

        {/* Background-depth Animated Vintage Cream & Gold Sewing Machine (with Pause/Play) */}
        {onToggleSewingPaused && (
          <StageVintageSewingMachine
            paused={sewingPaused}
            reducedMotion={reducedMotion}
            onTogglePause={onToggleSewingPaused}
          />
        )}

        {/* =================================================================
            BOUNDED PHOTOGRAPHIC FITTING STAGE (Rug + Contact Shadow + Model)
            Strictly min-h-0 & pixel-locked so the circular crochet rug sits
            flat underneath the model's shoes across all garments, poses & zoom.
        ================================================================= */}
        <div
          className={`relative z-20 w-full flex-1 min-h-0 flex items-end justify-center pointer-events-none px-2 sm:px-3 ${
            hideBottomSpinBadge
              ? 'pt-5 sm:pt-6 pb-1 sm:pb-2'
              : 'pt-5 sm:pt-6 pb-[48px] sm:pb-[52px]'
          }`}
          style={{
            transform: hasStageZoomOrPan
              ? `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`
              : undefined,
            transformOrigin: '50% 90%',
            transition: isDragging ? 'none' : 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {/* Adaptive Stage Assembly locking Rug, Contact Shadow & Model Feet Anchor */}
          <div
            ref={stageAssemblyRef}
            className="relative w-full h-full min-h-0 max-w-[540px]"
          >
            {/* Direct Drag-to-Resize Brass Handle on the 2D Model Frame */}
            {static2DMode && !cleanStageMode && (
              <button
                type="button"
                onPointerDown={handleResizeHandleDown}
                onPointerMove={handleResizeHandleMove}
                onPointerUp={handleResizeHandleUp}
                onPointerCancel={handleResizeHandleUp}
                title="Arrastra para redimensionar libremente el modelo (55% – 220%) · Doble clic para 100%"
                aria-label="Arrastra para redimensionar el modelo"
                className="pointer-events-auto absolute top-3 right-3 z-30 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fff6e6]/92 hover:bg-white border-2 border-[#d19a47] text-[#4b240c] text-[10.5px] font-extrabold shadow-md cursor-nesw-resize opacity-85 group-hover/stage:opacity-100 transition-opacity select-none"
              >
                <span aria-hidden="true" className="text-xs leading-none">
                  ⤢
                </span>
                <span className="font-mono-tab">{Math.round(zoom * 100)}%</span>
              </button>
            )}

            {/* UNIFIED FIGURE + RUG UNIT: Both rug and model scale together across all poses */}
            <div
              className="relative w-full h-full"
              style={{
                transform: hasUnitTransform
                  ? `translate3d(${modelParallaxX}px, ${modelParallaxY}px, 0) scale(${
                      framingScale * floatScale
                    })`
                  : undefined,
                transformOrigin: `50% ${poseOriginY}`,
                transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {/* LAYER 2: Photorealistic Circular Hand-Crocheted Rug Flat Beneath Model's Feet */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 z-10"
                style={{
                  bottom: `${stageLayout.rugBottom}px`,
                  width: `${stageLayout.rugW}px`,
                  height: `${stageLayout.rugH}px`,
                  marginLeft: `${-Math.round(stageLayout.rugW / 2)}px`,
                  transform:
                    Math.abs(rugParallaxX - modelParallaxX) > 0.25
                      ? `translate3d(${rugParallaxX - modelParallaxX}px, 0, 0)`
                      : undefined,
                  transition: isDragging ? 'none' : 'transform 180ms ease-out',
                }}
              >
                <CircularCrochetRug
                  angleDeg={resolved.resolvedAngleDeg}
                  showAngleMarker={!static2DMode}
                />
              </div>

              {/* LAYER 3: Separated Photographic Character Container
                  Exact bottom offset aligns the measured shoe soles to the rug center medallion. */}
              <div
                className="pointer-events-none absolute left-1/2 z-20"
                style={{
                  bottom: `${stageLayout.modelBottom}px`,
                  width: `${stageLayout.modelW}px`,
                  height: `${stageLayout.modelH}px`,
                  marginLeft: `${-Math.round(stageLayout.modelW / 2)}px`,
                }}
              >
                {knitRelief && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-[12%] top-[6%] bottom-[8%] rounded-full opacity-40 transition-colors duration-500"
                    style={{
                      background: `radial-gradient(ellipse 50% 48% at 50% 48%, ${mood.rimTint} 0%, transparent 74%)`,
                    }}
                  />
                )}

                {previousSrc && (
                  <img
                    src={previousSrc}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain object-bottom transition-opacity duration-200 ease-out"
                    style={{
                      opacity: isFading ? 0 : 1,
                      filter: combinedImgFilter,
                      transform: poseFlipX ? 'scaleX(-1)' : undefined,
                    }}
                  />
                )}

                <img
                  ref={activeImgRef}
                  src={activeDisplaySrc}
                  alt={`${resolved.outfitName} — ${activePose2D?.title ?? resolved.activeFrame.label}`}
                  draggable={false}
                  decoding="async"
                  onLoad={(e) => syncModelMetricsFromImg(e.currentTarget)}
                  className="relative block w-full h-full object-contain object-bottom transition-opacity duration-200 ease-out"
                  style={{
                    opacity: 1,
                    filter: combinedImgFilter,
                    transform: poseFlipX ? 'scaleX(-1)' : undefined,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* LAYER 4A: Active Garment Chips Top-Left (hidden in Clean Stage Mode) */}
        {!cleanStageMode && (selectedTop || selectedBottom || customPhoto) && (
          <div className="pointer-events-none absolute top-2 left-2.5 right-32 z-30 flex flex-wrap items-center gap-1.5">
            {customPhoto && (
              <span className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#5b3319]/90 border border-[#f2d08b] text-[#fff6e5] text-[10.5px] font-semibold shadow">
                <span className="truncate max-w-[140px]">{customPhoto.label}</span>
                <button
                  type="button"
                  onClick={() => setCustomPhoto(null)}
                  title="Quitar fotografía personalizada"
                  className="text-[#f7d99b] hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {showClothing && selectedTop && !customPhoto && (
              <span className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fff7ea]/95 border border-[#c8965d] text-[#4c2811] text-[10.5px] font-bold shadow-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-[#7c4d26]/40 shrink-0"
                  style={{ backgroundColor: overrideTopPalette?.[0] || selectedTop.accentColor }}
                />
                <span className="truncate max-w-[140px]">{selectedTop.name}</span>
                <button
                  type="button"
                  onClick={onClearTop}
                  title="Quitar prenda superior"
                  className="text-[#8d552c] hover:text-[#451d07] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {showClothing && selectedBottom && !customPhoto && (
              <span className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fff7ea]/95 border border-[#c8965d] text-[#4c2811] text-[10.5px] font-bold shadow-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-[#7c4d26]/40 shrink-0"
                  style={{
                    backgroundColor: overrideBottomPalette?.[0] || selectedBottom.accentColor,
                  }}
                />
                <span className="truncate max-w-[140px]">{selectedBottom.name}</span>
                <button
                  type="button"
                  onClick={onClearBottom}
                  title="Quitar prenda inferior"
                  className="text-[#8d552c] hover:text-[#451d07] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* LAYER 4B: Subtle Real Angle / Zoom Indicator Top-Right (hidden in Clean Stage Mode or Static 2D Mode) */}
        {!cleanStageMode && !static2DMode && (
          <div className="pointer-events-none absolute top-2 right-2.5 z-30 flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fff7ea]/90 border border-[#d6ab77] text-[#593017] text-[10px] font-bold shadow-sm font-mono-tab">
              <span>
                {shortAngleLabel} · {viewCount} {viewCount === 1 ? 'vista' : 'vistas'}
              </span>
            </span>
            {(zoom > 1.05 || zoom < 0.96 || Math.abs(pan.x) > 4 || Math.abs(pan.y) > 4) && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setZoom(1.0);
                  setPan({ x: 0, y: 0 });
                }}
                className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#64391d]/92 hover:bg-[#7d4926] border border-[#f2ca7e] text-[#fff3d6] text-[9.5px] font-bold shadow cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span className="font-mono-tab">{Math.round(zoom * 100)}% · Restablecer</span>
              </button>
            )}
          </div>
        )}

        {/* LAYER 4C: Honest Availability Notice Banner (ONLY when not in Clean Mode or Static 2D Mode) */}
        {!cleanStageMode && !static2DMode && resolved.noticeTitle && resolved.noticeMessage && (
          <div className="pointer-events-auto absolute inset-x-3 sm:inset-x-5 bottom-[54px] z-30 flex justify-center">
            <div className="max-w-md w-full rounded-2xl bg-[#fff8ec]/95 backdrop-blur-md border-2 border-[#dca86a] shadow-[0_12px_28px_rgba(74,36,14,0.28)] px-3.5 py-2.5 text-left">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-[#b86712] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-extrabold text-[#4b250e] leading-snug">
                    {resolved.noticeTitle}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-[#734526] leading-snug">
                    {resolved.noticeMessage}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {resolved.canEditGarment && onEditActiveGarment && (
                      <button
                        type="button"
                        onClick={() => {
                          audioEngine.playStitchClick();
                          onEditActiveGarment();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-b from-[#ffe074] to-[#e49d1a] border border-[#a96b08] text-[#3f1e07] text-[10.5px] font-extrabold shadow-sm cursor-pointer hover:brightness-105"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Subir fotos del modelo</span>
                      </button>
                    )}
                    {resolved.status === 'missing-color' && onResetColors && (
                      <button
                        type="button"
                        onClick={() => {
                          audioEngine.playStitchClick();
                          onResetColors();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f3dfc0] hover:bg-[#e8cca0] border border-[#c8985f] text-[#4c2710] text-[10.5px] font-bold cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar tono original</span>
                      </button>
                    )}
                    {resolved.status === 'missing-pose' && onRequestNaturalPose && (
                      <button
                        type="button"
                        onClick={() => {
                          audioEngine.playStitchClick();
                          onRequestNaturalPose();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#683b1e] hover:bg-[#7d4927] text-[#ffefd0] text-[10.5px] font-bold cursor-pointer"
                      >
                        <span>Volver a pose Natural</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LAYER 5: Optional Compact Bottom Angle Controls (hidden when external bottom Girar 360° bar is shown) */}
        {!hideBottomSpinBadge && (
          <div className="pointer-events-auto absolute bottom-2 inset-x-0 z-30 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                playClick();
                onStopSpin360();
                stepAngle(-1);
              }}
              title="Ángulo anterior"
              aria-label="Girar a la vista anterior"
              className="w-8 h-8 rounded-full bg-[#64391d] hover:bg-[#7e4a27] border-2 border-[#e4b97c] text-[#ffefd0] flex items-center justify-center shadow cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleSpin360}
              className="px-4 py-1.5 rounded-full bg-gradient-to-b from-[#ffe074] to-[#e49d1a] border-2 border-[#a86a08] text-[#3f1e07] text-xs font-extrabold shadow cursor-pointer"
            >
              {isSpinning360 ? 'Pausar 360°' : 'Girar 360°'}
            </button>
            <button
              type="button"
              onClick={() => {
                playClick();
                onStopSpin360();
                stepAngle(1);
              }}
              title="Siguiente ángulo"
              aria-label="Girar a la siguiente vista"
              className="w-8 h-8 rounded-full bg-[#64391d] hover:bg-[#7e4a27] border-2 border-[#e4b97c] text-[#ffefd0] flex items-center justify-center shadow cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <span className="sr-only">
          Iluminación activa: {STUDIO_LIGHT_PRESETS[lightPreset]?.label ?? lightPreset}
        </span>
      </div>
    );
  }
);

PhotographicAvatarViewer25D.displayName = 'PhotographicAvatarViewer25D';
