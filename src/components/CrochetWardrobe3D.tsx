import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { WardrobeSeasonId } from '../types/crochet';
import { audioEngine } from '../utils/audioEngine';
import { WARDROBE_SEASONS, type WardrobeSeasonMeta } from '../utils/wardrobeSeasons';

export const WARDROBE_SPRITE_SRC = '/vestidor/greek-wardrobe/door-primavera.jpg?v=hd5';

/**
 * Living Super-HD Seasonal Hero Canvas:
 * Renders each classical bodybuilder portrait at full Retina sharpness with:
 * - Organic anatomical breathing & subtle welcoming posture sway
 * - Biomechanical wrist-articulated waving greeting toward the camera (periodic + immediate on hover!)
 * - Soft directional golden light glints & seasonal floating particles
 */
const LivingSeasonHeroPortrait: React.FC<{
  season: WardrobeSeasonMeta;
  hovered: boolean;
  reducedMotion: boolean;
}> = ({ season, hovered, reducedMotion }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoveredRef = useRef(hovered);
  const hoverGreetStartRef = useRef<number>(-999);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hovered && !hoveredRef.current) {
      hoverGreetStartRef.current = performance.now() / 1000;
    }
    hoveredRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let alive = true;
    let rafId = 0;

    const bgImg = new Image();
    const handImg = new Image();
    let loadedCount = 0;

    const particles = Array.from({ length: 12 }, (_, idx) => ({
      x: ((idx * 37 + season.doorNumber * 19) % 100) / 100,
      y: ((idx * 53 + season.doorNumber * 29) % 100) / 100,
      r: 1.4 + (idx % 3) * 0.9,
      speedY: 0.018 + (idx % 4) * 0.008,
      drift: 0.012 + (idx % 3) * 0.006,
      phase: idx * 1.15,
    }));

    const onLoaded = () => {
      loadedCount += 1;
      if (loadedCount === 2 && alive) {
        setReady(true);
        startLoop();
      }
    };

    bgImg.onload = onLoaded;
    handImg.onload = onLoaded;
    bgImg.src = season.heroAnim.bgImage;
    handImg.src = season.heroAnim.handImage;

    const syncSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(1, Math.round(rect.width * dpr));
      const ch = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
    };

    const drawFrame = (nowMs: number) => {
      if (!alive) return;
      syncSize();
      const cw = canvas.width;
      const ch = canvas.height;
      if (cw < 4 || ch < 4 || !bgImg.naturalWidth || !handImg.naturalWidth) return;

      const t = nowMs / 1000 + season.heroAnim.phaseOffsetSec;
      const isHover = hoveredRef.current;

      // Exact object-cover object-top mapping (with 1.5% overscan so breathing/sway never shows edges)
      const imgW = bgImg.naturalWidth;
      const imgH = bgImg.naturalHeight;
      const coverScale = Math.max(cw / imgW, ch / imgH) * (isHover ? 1.045 : 1.022);
      const drawW = imgW * coverScale;
      const drawH = imgH * coverScale;
      const baseDrawX = (cw - drawW) * 0.5;
      const baseDrawY = Math.min(0, (ch - drawH) * 0.14);

      // 1. Organic anatomical breathing & subtle living weight shift
      const breath = reducedMotion ? 0 : Math.sin(t * 1.45);
      const swayX = reducedMotion ? 0 : Math.sin(t * 0.68) * cw * 0.006;
      const breathScaleX = 1 + breath * 0.0055;
      const breathScaleY = 1 + breath * 0.011;
      const liftY = -breath * ch * 0.0045;

      // 2. Natural friendly waving cycle:
      // Every 6.4s each hero performs a warm 2.6s 3-beat open-palm greeting wave,
      // PLUS immediately performs an enthusiastic greeting wave whenever hovered!
      let waveRad = 0;
      if (!reducedMotion) {
        const cyclePos = t % 6.4;
        let autoEnv = 0;
        if (cyclePos < 2.8) {
          const u = cyclePos / 2.8;
          autoEnv = Math.sin(u * Math.PI);
        }
        const hoverElapsed = nowMs / 1000 - hoverGreetStartRef.current;
        let hoverEnv = 0;
        if (isHover) {
          hoverEnv = 0.85 + 0.15 * Math.sin(hoverElapsed * 2.2);
        } else if (hoverElapsed >= 0 && hoverElapsed < 2.2) {
          hoverEnv = Math.sin((hoverElapsed / 2.2) * Math.PI);
        }
        const env = Math.max(autoEnv, hoverEnv);
        const waveOsc = Math.sin(t * (isHover ? 7.6 : 6.2));
        const maxAngleDeg = isHover ? 13.5 : 10.5;
        waveRad = ((waveOsc * env * maxAngleDeg * season.heroAnim.waveDir) * Math.PI) / 180;
      }

      // Subtle warm nod / torso lean synced with greeting wave
      const nodY = Math.abs(waveRad) * ch * 0.014;

      ctx.clearRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw breathing classical bodybuilder base portrait
      ctx.save();
      const bodyPivotX = cw * 0.5;
      const bodyPivotY = ch * 0.72;
      ctx.translate(bodyPivotX + swayX, bodyPivotY + liftY + nodY);
      ctx.scale(breathScaleX, breathScaleY);
      ctx.translate(-bodyPivotX, -bodyPivotY);

      ctx.drawImage(bgImg, baseDrawX, baseDrawY, drawW, drawH);

      // Draw articulated waving hand pivoting smoothly around the exact anatomical wrist joint!
      const [rx0, ry0, rx1, ry1] = season.heroAnim.handRoi;
      const [wxNorm, wyNorm] = season.heroAnim.wristPivot;
      const wristX = baseDrawX + wxNorm * drawW;
      const wristY = baseDrawY + wyNorm * drawH;
      const handX = baseDrawX + rx0 * drawW;
      const handY = baseDrawY + ry0 * drawH;
      const handW = (rx1 - rx0) * drawW;
      const handH = (ry1 - ry0) * drawH;

      ctx.save();
      ctx.translate(wristX, wristY);
      ctx.rotate(waveRad);
      ctx.drawImage(handImg, handX - wristX, handY - wristY, handW, handH);
      ctx.restore();

      ctx.restore();

      // 3. Subtle living sunlight glint gliding across sculpted anatomy
      if (!reducedMotion) {
        const sheenPos = ((t * 0.14) % 1.8) - 0.4;
        const grad = ctx.createLinearGradient(
          cw * (sheenPos - 0.25),
          0,
          cw * (sheenPos + 0.35),
          ch * 0.85
        );
        grad.addColorStop(0, 'rgba(255,248,220,0)');
        grad.addColorStop(0.5, isHover ? 'rgba(255,246,210,0.12)' : 'rgba(255,246,210,0.06)');
        grad.addColorStop(1, 'rgba(255,248,220,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);

        // 4. Delicate seasonal floating ambiance (petals / Aegean sun-motes / amber leaves / snow glints)
        ctx.save();
        for (const p of particles) {
          const py = ((p.y + t * p.speedY) % 1.08) - 0.04;
          const px = p.x + Math.sin(t * 1.1 + p.phase) * p.drift;
          const alpha = (isHover ? 0.55 : 0.32) * Math.sin(Math.max(0, Math.min(1, py)) * Math.PI);
          if (alpha <= 0.02) continue;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = season.heroAnim.particleHex;
          ctx.beginPath();
          if (season.id === 'primavera' || season.id === 'otono') {
            ctx.ellipse(px * cw, py * ch, p.r * 1.7, p.r * 0.9, t * 0.9 + p.phase, 0, Math.PI * 2);
          } else {
            ctx.arc(px * cw, py * ch, p.r * 1.1, 0, Math.PI * 2);
          }
          ctx.fill();
        }
        ctx.restore();
      }
    };

    const startLoop = () => {
      const tick = (now: number) => {
        drawFrame(now);
        if (!reducedMotion) {
          rafId = window.requestAnimationFrame(tick);
        }
      };
      rafId = window.requestAnimationFrame(tick);
    };

    return () => {
      alive = false;
      window.cancelAnimationFrame(rafId);
    };
  }, [season, reducedMotion]);

  return (
    <>
      {/* Instant Super-HD fallback underneath while canvas images decode */}
      <img
        src={season.doorImage}
        alt={`Retrato anatómico clásico — ${season.label}`}
        draggable={false}
        className={`w-full h-full object-cover object-top select-none transition-opacity duration-300 ${
          ready ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ filter: 'contrast(1.04) saturate(1.05)' }}
      />
      <canvas
        ref={canvasRef}
        aria-label={`Retrato vivo saludando — ${season.label}`}
        className={`absolute inset-0 w-full h-full pointer-events-none select-none transition-opacity duration-300 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ filter: 'contrast(1.04) saturate(1.05)' }}
      />
    </>
  );
};

export interface CrochetWardrobe3DProps {
  onEnterDressingRoom?: (season?: WardrobeSeasonId) => void;
  disabled?: boolean;
  className?: string;
}

const BAROQUE_MOLDING_BG: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, rgba(255,244,198,0.22) 0%, rgba(168,108,22,0.12) 48%, rgba(44,22,4,0.34) 100%), url('/vestidor/greek-wardrobe/baroque-gold-molding.webp')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

const BAROQUE_PILLAR_BG: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(90deg, rgba(46,24,4,0.42) 0%, rgba(255,244,198,0.28) 32%, rgba(226,174,64,0.12) 60%, rgba(40,20,3,0.48) 100%), url('/vestidor/greek-wardrobe/baroque-gold-pillar.webp')",
  backgroundSize: '100% 100%',
  backgroundPosition: 'center',
};

/** Sculpted 24k Baroque Gold Corinthian Pilaster Column */
const CorinthianColumn: React.FC<{ edge?: boolean }> = ({ edge = false }) => (
  <div
    aria-hidden="true"
    className={`relative h-full shrink-0 flex flex-col items-center justify-between select-none ${
      edge ? 'w-[24px] sm:w-[32px]' : 'w-[16px] sm:w-[22px]'
    }`}
  >
    {/* Ornate Sculpted Baroque Corinthian Capital */}
    <div
      className="w-full h-6 sm:h-7 rounded-t-sm border border-[#5e3808] shadow-[0_3px_6px_rgba(0,0,0,0.72),inset_0_1px_1px_rgba(255,246,204,0.85)] relative overflow-hidden"
      style={BAROQUE_MOLDING_BG}
    >
      <div className="absolute inset-x-0.5 top-0.5 h-[2px] bg-[#fff8d8]/85 rounded-full" />
      <div className="absolute inset-x-1 bottom-0.5 h-[2px] bg-[#462404]/75 rounded-full" />
    </div>

    {/* Carved 24k Gold Baroque Relief Shaft */}
    <div
      className="w-[86%] flex-1 border-x border-[#593307]/90 relative overflow-hidden"
      style={{
        ...BAROQUE_PILLAR_BG,
        boxShadow:
          'inset 2px 0 5px rgba(38,18,2,0.58), inset -2px 0 5px rgba(38,18,2,0.58), 0 0 8px rgba(246,200,96,0.18)',
      }}
    >
      <div className="absolute inset-y-0 left-[26%] w-[16%] bg-gradient-to-r from-transparent via-[#fff4c4]/45 to-transparent" />
    </div>

    {/* Molded 24k Gold Pedestal Base */}
    <div
      className="w-full h-5 sm:h-6 rounded-b-sm border border-[#5e3808] shadow-[0_-1px_4px_rgba(0,0,0,0.58),inset_0_1px_1px_rgba(255,244,200,0.8)] relative overflow-hidden"
      style={BAROQUE_MOLDING_BG}
    />
  </div>
);

/** Reusable Classical Greek Key & Baroque Filigree Frieze Band */
const GreekKeyFrieze: React.FC<{ className?: string }> = ({ className = 'h-4 sm:h-5' }) => (
  <div
    aria-hidden="true"
    className={`w-full overflow-hidden border-y border-[#ffeaa8]/75 shadow-[inset_0_2px_6px_rgba(20,9,1,0.8)] relative ${className}`}
    style={{
      background: 'linear-gradient(180deg, #4b2907 0%, #2b1403 52%, #4a2806 100%)',
    }}
  >
    <svg
      viewBox="0 0 800 24"
      preserveAspectRatio="none"
      className="w-full h-full opacity-95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
      fill="none"
    >
      <defs>
        <linearGradient id="baroque-meander-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff4c8" />
          <stop offset="48%" stopColor="#efc05a" />
          <stop offset="100%" stopColor="#a66c18" />
        </linearGradient>
        <pattern id="greek-meander-tile" width="32" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M0 20 H26 V4 H10 V14 H18 V10 H14 M26 20 H32"
            stroke="url(#baroque-meander-gold)"
            strokeWidth="2.6"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </pattern>
      </defs>
      <rect width="800" height="24" fill="url(#greek-meander-tile)" />
    </svg>
  </div>
);

interface SeasonalDoorProps {
  season: WardrobeSeasonMeta;
  hingeSide: 'left' | 'right';
  isOpening: boolean;
  isAnyOpening: boolean;
  disabled: boolean;
  reducedMotion: boolean;
  onSelect: (season: WardrobeSeasonMeta) => void;
}

const SeasonalGreekDoor: React.FC<SeasonalDoorProps> = ({
  season,
  hingeSide,
  isOpening,
  isAnyOpening,
  disabled,
  reducedMotion,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const openAngle = hingeSide === 'left' ? -108 : 108;
  const hoverPeekAngle = hingeSide === 'left' ? -8 : 8;
  const targetAngle = isOpening ? openAngle : hovered && !disabled && !isAnyOpening ? hoverPeekAngle : 0;

  return (
    <div
      className="relative flex-1 min-w-0 h-full overflow-visible"
      style={{ perspective: '1600px' }}
    >
      {/* Recessed Luminous Seasonal Closet Interior */}
      <div
        className="absolute inset-0 rounded-[4px] overflow-hidden border border-[#5d3709]/80 shadow-[inset_0_8px_22px_rgba(12,6,2,0.85)]"
        style={{ background: season.interiorGradient }}
      >
        <div className="absolute inset-x-2 top-[13%] h-[3px] rounded-full bg-gradient-to-r from-[#875818] via-[#ffe6a0] to-[#875818] shadow" />
        <svg
          viewBox="0 0 120 220"
          className="absolute inset-0 w-full h-full opacity-50 pointer-events-none"
          fill="none"
        >
          {[32, 60, 88].map((cx, i) => (
            <g key={cx} opacity={i === 1 ? 0.85 : 0.55}>
              <path
                d={`M${cx} 28 Q${cx} 38 ${cx - 14} 46 L${cx + 14} 46 Q${cx} 38 ${cx} 28`}
                stroke="#ffe9b0"
                strokeWidth="1.5"
              />
              <path
                d={`M${cx - 16} 47 L${cx + 16} 47 L${cx + 22} 152 L${cx - 22} 152 Z`}
                fill={season.accentHex}
                fillOpacity="0.28"
                stroke="#fff0c6"
                strokeOpacity="0.4"
                strokeWidth="1"
              />
            </g>
          ))}
        </svg>

        <motion.div
          animate={{ opacity: isOpening ? 0.95 : hovered ? 0.45 : 0.2 }}
          transition={{ duration: 0.35 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 42%, ${season.glowRgba} 0%, transparent 72%)`,
          }}
        />

        <div className="absolute inset-x-1 bottom-4 text-center pointer-events-none">
          <p className="font-display text-[10px] sm:text-xs font-bold tracking-[0.14em] text-[#fff4d4] drop-shadow">
            {season.label.toUpperCase()}
          </p>
          <p className="text-[8.5px] text-[#f5dfb2]/90 italic px-1 leading-tight mt-0.5">
            Entrando al atelier…
          </p>
        </div>
      </div>

      {/* 3D Hinged Carved Baroque Gold Greek Door Leaf */}
      <motion.button
        type="button"
        data-ui-control="true"
        disabled={disabled || isAnyOpening}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled || isAnyOpening) return;
          onSelect(season);
        }}
        aria-label={`Puerta ${season.doorNumber}: ${season.label} — Entrar al apartado de diseño de ${season.label}`}
        title={`Puerta ${season.doorNumber} · ${season.label}: ${season.subtitle}`}
        animate={{ rotateY: reducedMotion ? 0 : targetAngle }}
        transition={{
          duration: isOpening ? 0.78 : 0.28,
          ease: isOpening ? [0.22, 1, 0.36, 1] : [0.16, 1, 0.3, 1],
        }}
        style={{
          transformOrigin: hingeSide === 'left' ? 'left center' : 'right center',
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full h-full cursor-pointer disabled:cursor-default focus:outline-none group"
      >
        {/* FRONT FACE: Real Photographed 24k Carved Baroque Gold Outer Frame + Oil Painting */}
        <div
          className="absolute inset-0 backface-hidden rounded-[5px] p-[6px] sm:p-[8px] flex flex-col overflow-hidden transition-shadow duration-300"
          style={{
            ...BAROQUE_MOLDING_BG,
            boxShadow: hovered
              ? `inset 0 1px 2px rgba(255,250,220,0.92), inset 0 -2px 6px rgba(48,22,2,0.82), 0 0 24px ${season.glowRgba}`
              : 'inset 0 1px 2px rgba(255,248,214,0.82), inset 0 -2px 6px rgba(48,22,2,0.82), 0 5px 12px rgba(0,0,0,0.52)',
          }}
        >
          {/* Inner Sculpted Dark-Walnut & Gilded Filigree Recessed Arch Frame */}
          <div className="relative flex-1 w-full rounded-[4px] bg-gradient-to-b from-[#341a08] via-[#210f04] to-[#190b03] p-[4px] sm:p-[5px] border border-[#f5d07a]/70 shadow-[inset_0_0_16px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden">
            {/* Ornate Gilded Baroque Corner Scrollwork SVG over the top arch spandrels */}
            <svg
              viewBox="0 0 200 68"
              preserveAspectRatio="none"
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 w-full h-[18%] z-10 opacity-90"
              fill="none"
            >
              <path
                d="M4 4 H58 C34 10, 16 28, 6 58 V4 Z M196 4 H142 C166 10, 184 28, 194 58 V4 Z"
                fill="url(#spandrel-gold-grad)"
                fillOpacity="0.28"
              />
              <path
                d="M10 10 C22 10, 28 16, 16 26 C10 30, 18 36, 26 26 M190 10 C178 10, 172 16, 184 26 C190 30, 182 36, 174 26"
                stroke="#f8d684"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <circle cx="15" cy="14" r="3.2" fill="#fff2c2" stroke="#996114" strokeWidth="0.9" />
              <circle cx="185" cy="14" r="3.2" fill="#fff2c2" stroke="#996114" strokeWidth="0.9" />
              <defs>
                <linearGradient id="spandrel-gold-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff1ba" />
                  <stop offset="100%" stopColor="#9c6214" />
                </linearGradient>
              </defs>
            </svg>

            {/* Arched Museum Super-HD Living Portrait Viewport with Double 24k Gold Bevel */}
            <div className="relative flex-1 w-full overflow-hidden rounded-t-[48%] rounded-b-[4px] border-[2.5px] border-[#f0c66c] ring-1 ring-[#5e3708] shadow-[inset_0_0_20px_rgba(14,6,1,0.65),0_0_10px_rgba(245,200,98,0.28)] bg-[#1f1208]">
              <LivingSeasonHeroPortrait
                season={season}
                hovered={hovered && !isOpening}
                reducedMotion={reducedMotion}
              />

              {/* Museum oil-painting warm chiaroscuro varnish & gilded top arch highlight */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 22%, rgba(255,248,220,0.12) 0%, rgba(28,14,4,0.08) 65%, rgba(16,8,2,0.44) 100%)',
                }}
              />

              {/* Hover "Entrar" translucent golden badge */}
              <div
                className={`pointer-events-none absolute inset-x-1.5 bottom-2 flex justify-center transition-all duration-200 ${
                  hovered && !isOpening ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                }`}
              >
                <span
                  className="px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10.5px] font-semibold text-[#fff7e2] border border-[#ffeaa8]/85 shadow-lg whitespace-nowrap"
                  style={{ background: season.pillBg }}
                >
                  Abrir · {season.label}
                </span>
              </div>
            </div>

            {/* Embossed 24k Gold Cartouche Seasonal Plaque at Base of Door */}
            <div
              className="mt-1.5 py-1.5 px-1 rounded-[4px] border border-[#f8d786] text-center shrink-0 relative overflow-hidden shadow-[inset_0_1px_2px_rgba(255,246,204,0.45),0_2px_6px_rgba(0,0,0,0.55)]"
              style={{
                background:
                  'linear-gradient(180deg, #5c340e 0%, #2d1504 52%, #4e2a0a 100%)',
              }}
            >
              <div className="flex items-center justify-center gap-1 leading-none">
                <span className="font-display text-[8px] sm:text-[9.5px] text-[#f9d67e] font-semibold">
                  {season.roman}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#ffd875]" />
                <span className="font-display text-[9px] sm:text-[11px] font-bold tracking-[0.11em] text-[#fff4d4] drop-shadow truncate">
                  {season.label.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Sculpted 24k Baroque Brass Door Pull Handle */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-[52%] -translate-y-1/2 z-20 flex flex-col items-center ${
              hingeSide === 'left' ? 'right-[2px] sm:right-[3px]' : 'left-[2px] sm:left-[3px]'
            }`}
          >
            <div className="w-2.5 sm:w-3 h-8 sm:h-10 rounded-full border border-[#4f2c07] bg-gradient-to-b from-[#fff5cc] via-[#e8b248] to-[#7a480d] shadow-[0_3px_8px_rgba(0,0,0,0.82)] flex flex-col items-center justify-between py-1">
              <span className="w-1 h-1 rounded-full bg-[#fff9e0]" />
              <div className="w-[3px] h-3.5 sm:h-4 rounded-full bg-[#fff8dc]/75" />
              <span className="w-1 h-1 rounded-full bg-[#5a3206]" />
            </div>
          </div>

          {/* Ornate Baroque Gold Hinges on outer pivot edge */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute top-[14%] w-2 h-6 rounded-sm bg-gradient-to-b from-[#fff0b8] via-[#d29432] to-[#683e0c] border border-[#4a2806]/90 shadow ${
              hingeSide === 'left' ? 'left-0' : 'right-0'
            }`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-[16%] w-2 h-6 rounded-sm bg-gradient-to-b from-[#fff0b8] via-[#d29432] to-[#683e0c] border border-[#4a2806]/90 shadow ${
              hingeSide === 'left' ? 'left-0' : 'right-0'
            }`}
          />
        </div>

        {/* BACK FACE OF DOOR */}
        <div
          style={{ transform: 'rotateY(180deg)' }}
          className="absolute inset-0 backface-hidden rounded-[4px] p-1.5 border-2 border-[#c88f34] bg-gradient-to-b from-[#49270d] via-[#2f1707] to-[#231004] shadow-inner flex flex-col justify-between"
        >
          <div className="flex-1 rounded border border-[#e3ae52]/55 bg-[radial-gradient(circle_at_50%_40%,rgba(232,178,82,0.16),transparent_70%)] flex items-center justify-center">
            <span className="font-display text-xs tracking-[0.2em] text-[#f2c872]/80">
              {season.roman}
            </span>
          </div>
        </div>
      </motion.button>
    </div>
  );
};

export const CrochetWardrobe3D: React.FC<CrochetWardrobe3DProps> = ({
  onEnterDressingRoom,
  disabled = false,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [openingSeason, setOpeningSeason] = useState<WardrobeSeasonId | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelectDoor = (season: WardrobeSeasonMeta) => {
    if (disabled || openingSeason) return;
    setOpeningSeason(season.id);
    audioEngine.playWardrobeDoor(true);
    window.setTimeout(() => audioEngine.playToggleChime(true), 160);

    const delayMs = prefersReducedMotion ? 180 : 720;
    timerRef.current = window.setTimeout(() => {
      setOpeningSeason(null);
      onEnterDressingRoom?.(season.id);
    }, delayMs);
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between select-none ${className}`}
      style={{
        filter: 'drop-shadow(0 20px 30px rgba(6, 16, 11, 0.68))',
      }}
    >
      {/* 1. ROYAL 24K CARVED BAROQUE GOLD VERSAILLES PEDIMENT CROWN */}
      <div className="relative w-full shrink-0 px-0.5 sm:px-1.5">
        <div className="relative w-full h-[54px] sm:h-[72px] md:h-[88px] flex items-end justify-center overflow-visible">
          <img
            src="/vestidor/greek-wardrobe/baroque-crown-gold.webp"
            alt=""
            draggable={false}
            className="w-[99%] h-full object-fill select-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)]"
          />
          {/* Subtle warm royal specular shimmer crest at apex */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-[12%] left-1/2 -translate-x-1/2 w-[26%] h-[34%] rounded-full bg-[#fff4c6]/28 blur-md"
          />
        </div>

        {/* Carved 24k Gold Baroque Entablature Cornice Bar */}
        <div
          className="w-full py-1.5 px-3 border-x-2 border-y border-[#5c3506] flex items-center justify-between shadow-[0_6px_14px_rgba(0,0,0,0.62),inset_0_1px_2px_rgba(255,248,214,0.85)] relative overflow-hidden"
          style={BAROQUE_MOLDING_BG}
        >
          <span className="hidden sm:inline font-display text-[8.5px] tracking-[0.24em] text-[#281202] font-extrabold drop-shadow-[0_1px_0_rgba(255,242,196,0.75)]">
            ATELIER HELÉNICO
          </span>
          <span className="mx-auto px-3 py-0.5 rounded-full bg-[#2a1304]/80 border border-[#ffe7a6]/75 font-display text-[10px] sm:text-xs font-bold tracking-[0.18em] text-[#fff2cb] shadow-inner">
            ARMARIO REAL DE LAS CUATRO ESTACIONES
          </span>
          <span className="hidden sm:inline font-display text-[8.5px] tracking-[0.24em] text-[#281202] font-extrabold drop-shadow-[0_1px_0_rgba(255,242,196,0.75)]">
            I · II · III · IV
          </span>
        </div>

        <GreekKeyFrieze />
      </div>

      {/* 2. MAIN 4-DOOR BAROQUE COLONNADE BODY (Spans Full Width of Sheet!) */}
      <div
        className="relative flex-1 min-h-0 mx-1 sm:mx-2 px-1.5 sm:px-2 py-2 flex items-stretch gap-1 sm:gap-1.5 border-x-[4px] border-[#b57a22] shadow-[inset_0_0_28px_rgba(12,5,1,0.9),0_0_18px_rgba(232,180,72,0.16)]"
        style={{
          background:
            'linear-gradient(180deg, #3c2008 0%, #241104 50%, #1a0b02 100%)',
        }}
      >
        <CorinthianColumn edge />

        {WARDROBE_SEASONS.map((season, idx) => (
          <React.Fragment key={season.id}>
            <SeasonalGreekDoor
              season={season}
              hingeSide={idx % 2 === 0 ? 'left' : 'right'}
              isOpening={openingSeason === season.id}
              isAnyOpening={openingSeason !== null}
              disabled={disabled}
              reducedMotion={Boolean(prefersReducedMotion)}
              onSelect={handleSelectDoor}
            />
            {idx < WARDROBE_SEASONS.length - 1 && (
              <CorinthianColumn edge={idx === 1} />
            )}
          </React.Fragment>
        ))}

        <CorinthianColumn edge />
      </div>

      {/* 3. SCULPTED 24K BAROQUE GOLD PLINTH & CARVED ROYAL FEET */}
      <div className="relative w-full shrink-0 px-0.5 sm:px-1.5">
        <GreekKeyFrieze className="h-3 sm:h-3.5" />
        <div
          className="w-full h-4 sm:h-5 rounded-b-md border-x-2 border-b-2 border-[#593307] shadow-[0_8px_16px_rgba(0,0,0,0.72),inset_0_1px_2px_rgba(255,246,204,0.85)]"
          style={BAROQUE_MOLDING_BG}
        />
        {/* 5 Carved Baroque Gold Lion-Paw Pedestal Feet */}
        <div className="flex items-start justify-between px-3 sm:px-6 -mt-0.5">
          {[0, 1, 2, 3, 4].map((foot) => (
            <div
              key={foot}
              className="w-7 sm:w-10 h-3 sm:h-4 rounded-b-xl border border-[#4f2c07] shadow-[0_5px_10px_rgba(0,0,0,0.78),inset_0_1px_1px_rgba(255,244,200,0.8)]"
              style={BAROQUE_MOLDING_BG}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
