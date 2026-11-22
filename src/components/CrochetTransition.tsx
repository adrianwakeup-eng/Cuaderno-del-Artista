import React, { useEffect, useRef } from 'react';

interface CrochetTransitionProps {
  active: boolean;
  onMidpointSwitch?: () => void;
  onComplete?: () => void;
}

interface YarnPalette {
  base: string;
  highlight: string;
  shade: string;
  strand: string;
}

const YARN_PALETTES: YarnPalette[] = [
  { base: '#f0dec0', highlight: '#fff8e8', shade: '#a78c62', strand: '#7d623b' }, // Crema marfil
  { base: '#c25b39', highlight: '#f29f7e', shade: '#742d17', strand: '#541e0e' }, // Terracota
  { base: '#6f875e', highlight: '#b1c79d', shade: '#3c4f30', strand: '#283720' }, // Verde salvia
  { base: '#e2a93b', highlight: '#ffe296', shade: '#8d5b10', strand: '#643d07' }, // Oro miel
  { base: '#8c2838', highlight: '#d46b7b', shade: '#4c111b', strand: '#350a11' }, // Burdeos vino
  { base: '#315075', highlight: '#769cc9', shade: '#172a42', strand: '#0e1b2c' }, // Azul prusia
  { base: '#d9994a', highlight: '#ffd59c', shade: '#88531b', strand: '#60380e' }, // Ocre canela
  { base: '#c68387', highlight: '#f5c2c5', shade: '#7a4448', strand: '#592e31' }, // Rosa antiguo
];

interface YarnBallParticle {
  palette: YarnPalette;
  radius: number;
  delay: number;
  vx: number;
  vy: number;
  gravity: number;
  spin: number;
  initialAngle: number;
  tailSeed: number;
  swirlAngle: number;
  swirlSpeed: number;
}

interface RibbonThread {
  color: string;
  glowColor: string;
  width: number;
  delay: number;
  angle: number;
  reach: number;
  waveFreq: number;
  waveAmp: number;
  phase: number;
  curl: number;
}

interface GoldenSpark {
  delay: number;
  angle: number;
  speed: number;
  size: number;
  twinklePhase: number;
  driftY: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, 3);
}

function easeInOutQuart(t: number): number {
  const u = clamp01(t);
  return u < 0.5 ? 8 * u * u * u * u : 1 - Math.pow(-2 * u + 2, 4) / 2;
}

/**
 * Draws a richly shaded wound yarn ball (bola de estambre) with wrapped strand grooves,
 * specular glow, and realistic soft shadow.
 */
function drawYarnBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  pal: YarnPalette,
  alpha: number
) {
  if (r <= 1 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  // Soft cast shadow behind ball
  ctx.save();
  ctx.beginPath();
  ctx.arc(r * 0.14, r * 0.2, r * 1.02, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(18, 9, 4, 0.36)';
  ctx.fill();
  ctx.restore();

  ctx.rotate(rot);

  // Clip to sphere
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.save();
  ctx.clip();

  // Base spherical gradient
  const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.34, r * 0.1, 0, 0, r * 1.15);
  grad.addColorStop(0, pal.highlight);
  grad.addColorStop(0.45, pal.base);
  grad.addColorStop(1, pal.shade);
  ctx.fillStyle = grad;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  // Wound yarn strand bundle 1 (diagonal curves)
  ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) {
    const off = i * (r * 0.25);
    ctx.beginPath();
    ctx.moveTo(-r * 1.1, off - r * 0.45);
    ctx.bezierCurveTo(-r * 0.3, off - r * 0.15, r * 0.3, off + r * 0.25, r * 1.1, off + r * 0.5);
    ctx.strokeStyle = pal.strand;
    ctx.globalAlpha = alpha * 0.48;
    ctx.lineWidth = Math.max(1.2, r * 0.11);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-r * 1.1, off - r * 0.45 - r * 0.06);
    ctx.bezierCurveTo(
      -r * 0.3,
      off - r * 0.15 - r * 0.06,
      r * 0.3,
      off + r * 0.25 - r * 0.06,
      r * 1.1,
      off + r * 0.5 - r * 0.06
    );
    ctx.strokeStyle = pal.highlight;
    ctx.globalAlpha = alpha * 0.32;
    ctx.lineWidth = Math.max(0.8, r * 0.055);
    ctx.stroke();
  }

  // Wound yarn strand bundle 2 (crossing wrap)
  for (let i = -2; i <= 2; i++) {
    const off = i * (r * 0.3);
    ctx.beginPath();
    ctx.moveTo(off - r * 0.4, -r * 1.1);
    ctx.bezierCurveTo(off + r * 0.1, -r * 0.25, off - r * 0.15, r * 0.35, off + r * 0.45, r * 1.1);
    ctx.strokeStyle = pal.strand;
    ctx.globalAlpha = alpha * 0.44;
    ctx.lineWidth = Math.max(1.1, r * 0.1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(off - r * 0.4 + r * 0.05, -r * 1.1);
    ctx.bezierCurveTo(
      off + r * 0.1 + r * 0.05,
      -r * 0.25,
      off - r * 0.15 + r * 0.05,
      r * 0.35,
      off + r * 0.45 + r * 0.05,
      r * 1.1
    );
    ctx.strokeStyle = pal.highlight;
    ctx.globalAlpha = alpha * 0.28;
    ctx.lineWidth = Math.max(0.7, r * 0.05);
    ctx.stroke();
  }

  // Warm rim lighting overlay
  const rimGrad = ctx.createRadialGradient(-r * 0.28, -r * 0.32, r * 0.05, 0, 0, r);
  rimGrad.addColorStop(0, 'rgba(255, 248, 224, 0.35)');
  rimGrad.addColorStop(0.55, 'rgba(255, 248, 224, 0)');
  rimGrad.addColorStop(1, 'rgba(24, 11, 4, 0.42)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = rimGrad;
  ctx.fillRect(-r, -r, r * 2, r * 2);

  ctx.restore();

  // Crisp subtle golden edge highlight
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 236, 194, 0.45)';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.restore();
}

export const CrochetTransition: React.FC<CrochetTransitionProps> = ({
  active,
  onMidpointSwitch,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const midpointCbRef = useRef(onMidpointSwitch);
  const completeCbRef = useRef(onComplete);
  midpointCbRef.current = onMidpointSwitch;
  completeCbRef.current = onComplete;

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const maxDim = Math.hypot(width, height);

    // 18 lively yarn balls bursting out from the opening leather book!
    const yarnBalls: YarnBallParticle[] = Array.from({ length: 18 }, (_, i) => {
      const spreadAngle =
        ((i / 18) * Math.PI * 1.92 - Math.PI * 0.96) + (i % 2 === 0 ? 0.14 : -0.14);
      const speed = maxDim * (0.28 + (i % 5) * 0.085);
      return {
        palette: YARN_PALETTES[i % YARN_PALETTES.length],
        radius: Math.max(16, Math.min(38, width * 0.022)) * (0.72 + (i % 4) * 0.18),
        delay: (i % 6) * 0.045,
        vx: Math.cos(spreadAngle) * speed * (i % 3 === 0 ? -0.95 : 0.85) - width * 0.14,
        vy: Math.sin(spreadAngle) * speed * 0.72 - height * 0.22,
        gravity: height * 0.34,
        spin: (i % 2 === 0 ? 1 : -1) * (3.2 + (i % 4) * 1.15),
        initialAngle: i * 0.9,
        tailSeed: i * 1.37,
        swirlAngle: (i / 18) * Math.PI * 2,
        swirlSpeed: (i % 2 === 0 ? 1 : -1) * 1.9,
      };
    });

    // 26 sweeping multi-colored crochet threads unfurling out of the book
    const threads: RibbonThread[] = Array.from({ length: 26 }, (_, i) => {
      const pal = YARN_PALETTES[i % YARN_PALETTES.length];
      const angle = (i / 26) * Math.PI * 2 - Math.PI * 0.55;
      return {
        color: i % 3 === 0 ? pal.highlight : pal.base,
        glowColor: pal.highlight,
        width: 2.2 + (i % 4) * 1.05,
        delay: (i % 7) * 0.032,
        angle,
        reach: maxDim * (0.48 + (i % 4) * 0.14),
        waveFreq: 2.8 + (i % 3) * 1.2,
        waveAmp: 18 + (i % 5) * 9,
        phase: i * 0.75,
        curl: (i % 2 === 0 ? 1 : -1) * (0.55 + (i % 4) * 0.22),
      };
    });

    // 48 shimmering golden dust sparks bursting from the book pages
    const sparks: GoldenSpark[] = Array.from({ length: 48 }, (_, i) => ({
      delay: (i % 8) * 0.035,
      angle: (i / 48) * Math.PI * 2 + (i % 3) * 0.15,
      speed: maxDim * (0.18 + (i % 6) * 0.09),
      size: 1.8 + (i % 4) * 1.1,
      twinklePhase: i * 1.1,
      driftY: -height * (0.06 + (i % 3) * 0.04),
    }));

    const TOTAL_DURATION = 2.15; // seconds
    const MIDPOINT_TIME = 1.12; // switch cover -> open notebook right behind peak golden veil!
    let midpointFired = false;
    let rafId = 0;
    const startTime = performance.now();

    const render = (now: number) => {
      const t = (now - startTime) / 1000;

      if (!midpointFired && t >= MIDPOINT_TIME) {
        midpointFired = true;
        midpointCbRef.current?.();
      }

      ctx.clearRect(0, 0, width, height);

      // Origin starts right at the embossed leather book opening (x≈70%, y≈52%)
      // and glides smoothly to screen center (50%, 50%) as the notebook opens!
      const centerGlide = easeInOutQuart(clamp01((t - 0.15) / 0.95));
      const originX = width * (0.7 - 0.2 * centerGlide);
      const originY = height * (0.52 - 0.02 * centerGlide);

      // Phase timings:
      // 0.00 -> 1.12: Golden warm veil rises + yarn balls & threads erupt from the book
      // 1.12 -> 2.15: Luminous iris portal opens from center to unveil the open notebook!
      const veilIn = easeOutCubic(clamp01((t - 0.18) / 0.85));
      const revealP = easeInOutQuart(clamp01((t - 1.16) / 0.92));

      // 1. Warm Atelier Curtain Veil (with circular iris reveal during Phase 3!)
      if (veilIn > 0.005 && revealP < 0.995) {
        ctx.save();

        // Rich espresso-and-gold parchment veil that sweeps in smoothly
        const veilAlpha = veilIn * (1 - revealP * 0.35);
        const bgGrad = ctx.createRadialGradient(
          originX,
          originY,
          maxDim * 0.04,
          originX,
          originY,
          maxDim * 0.82
        );
        bgGrad.addColorStop(0, `rgba(92, 54, 24, ${veilAlpha * 0.94})`);
        bgGrad.addColorStop(0.45, `rgba(48, 26, 13, ${veilAlpha * 0.96})`);
        bgGrad.addColorStop(1, `rgba(22, 12, 6, ${veilAlpha * 0.98})`);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // During Phase 3 (t > 1.16), cut a luminous expanding circular iris from center
        // so the real open Cuaderno del Artista blooms directly through the yarn curtain!
        if (revealP > 0.001) {
          const irisRadius = revealP * maxDim * 0.78;
          ctx.globalCompositeOperation = 'destination-out';
          const irisGrad = ctx.createRadialGradient(
            width * 0.5,
            height * 0.5,
            Math.max(0, irisRadius - 95),
            width * 0.5,
            height * 0.5,
            irisRadius + 24
          );
          irisGrad.addColorStop(0, 'rgba(0,0,0,1)');
          irisGrad.addColorStop(0.75, 'rgba(0,0,0,0.92)');
          irisGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = irisGrad;
          ctx.beginPath();
          ctx.arc(width * 0.5, height * 0.5, irisRadius + 24, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';

          // Delicate glowing crochet-lace ring framing the expanding iris portal
          const ringAlpha = (1 - revealP) * 0.85;
          if (ringAlpha > 0.02) {
            ctx.save();
            ctx.translate(width * 0.5, height * 0.5);
            ctx.rotate(revealP * 0.8);
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(8, irisRadius), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(250, 214, 138, ${ringAlpha})`;
            ctx.lineWidth = 3.2;
            ctx.setLineDash([12, 8]);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(0, 0, Math.max(4, irisRadius + 12), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 240, 200, ${ringAlpha * 0.55})`;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 10]);
            ctx.stroke();
            ctx.restore();
          }
        }

        ctx.restore();
      }

      // 2. Warm Golden Light Burst erupting right out of the opening book pages
      const burstGlow =
        t < 0.7
          ? easeOutCubic(t / 0.45)
          : Math.max(0, 1 - (t - 0.7) / 0.85);
      if (burstGlow > 0.01) {
        const glowR = maxDim * (0.14 + easeOutCubic(clamp01(t / 1.1)) * 0.36);
        const burstGrad = ctx.createRadialGradient(originX, originY, 4, originX, originY, glowR);
        burstGrad.addColorStop(0, `rgba(255, 244, 208, ${burstGlow * 0.85})`);
        burstGrad.addColorStop(0.35, `rgba(244, 194, 98, ${burstGlow * 0.46})`);
        burstGrad.addColorStop(1, 'rgba(244, 194, 98, 0)');
        ctx.fillStyle = burstGrad;
        ctx.beginPath();
        ctx.arc(originX, originY, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Flowing Unfurling Crochet Threads (hilos) erupting & swirling across screen
      const threadFadeOut = 1 - easeOutCubic(clamp01((t - 1.38) / 0.72));
      if (threadFadeOut > 0.01) {
        for (const th of threads) {
          const lt = t - th.delay;
          if (lt <= 0) continue;

          const grow = easeOutCubic(clamp01(lt / 0.92));
          const sweep = easeInOutQuart(clamp01((lt - 0.88) / 1.05));
          const baseAngle = th.angle + th.curl * grow * 0.75 + sweep * th.curl * 0.45;
          const startDist = sweep * maxDim * 0.36;
          const endDist = startDist + grow * th.reach;

          const steps = 22;
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = Math.min(1, grow * 1.4) * threadFadeOut;

          // Subtle soft golden glow under each yarn thread
          ctx.beginPath();
          for (let s = 0; s <= steps; s++) {
            const frac = s / steps;
            const dist = startDist + (endDist - startDist) * frac;
            const swirl = baseAngle + Math.sin(frac * Math.PI * 1.6 + th.phase) * 0.24 * th.curl;
            const wave =
              Math.sin(frac * th.waveFreq * Math.PI - lt * 6.5 + th.phase) *
              th.waveAmp *
              Math.sin(frac * Math.PI);
            const px = originX + Math.cos(swirl) * dist - Math.sin(swirl) * wave;
            const py = originY + Math.sin(swirl) * dist + Math.cos(swirl) * wave;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }

          // Shadow strand
          ctx.strokeStyle = 'rgba(20, 10, 4, 0.35)';
          ctx.lineWidth = th.width + 2.2;
          ctx.stroke();

          // Main colored yarn strand
          ctx.strokeStyle = th.color;
          ctx.lineWidth = th.width;
          ctx.stroke();

          // Twisted ply dashed highlight along the yarn thread!
          ctx.strokeStyle = th.glowColor;
          ctx.globalAlpha = Math.min(1, grow * 1.4) * threadFadeOut * 0.55;
          ctx.lineWidth = Math.max(1, th.width * 0.42);
          ctx.setLineDash([5, 6]);
          ctx.lineDashOffset = -lt * 42;
          ctx.stroke();

          ctx.restore();
        }
      }

      // 4. Shaded Yarn Balls (bolas de estambre) bursting out of the book with trailing yarn tails!
      const ballFadeOut = 1 - easeOutCubic(clamp01((t - 1.45) / 0.65));
      if (ballFadeOut > 0.01) {
        for (const ball of yarnBalls) {
          const lt = t - ball.delay;
          if (lt <= 0) continue;

          const popIn = easeOutCubic(clamp01(lt / 0.26));
          const flightT = lt;
          // Push balls outward smoothly during the reveal phase so they sweep off the edges!
          const pushOut = easeInOutQuart(clamp01((t - 1.05) / 0.95));

          const bx =
            originX +
            ball.vx * flightT * 0.72 +
            Math.cos(ball.swirlAngle + lt * ball.swirlSpeed) * (35 + pushOut * maxDim * 0.32);
          const by =
            originY +
            ball.vy * flightT * 0.68 +
            0.5 * ball.gravity * flightT * flightT * 0.75 +
            Math.sin(ball.swirlAngle + lt * ball.swirlSpeed) * (24 + pushOut * maxDim * 0.25);

          const scale = (0.35 + popIn * 0.75) * (1 + pushOut * 0.28);
          const r = ball.radius * scale;
          const rot = ball.initialAngle + lt * ball.spin;

          // Unspooling yarn tail connecting each flying yarn ball back toward the opening book!
          ctx.save();
          ctx.globalAlpha = popIn * ballFadeOut * 0.82;
          ctx.beginPath();
          const tailMidX = (originX + bx) * 0.5 + Math.sin(lt * 5 + ball.tailSeed) * 38;
          const tailMidY = (originY + by) * 0.5 + Math.cos(lt * 4.2 + ball.tailSeed) * 34;
          ctx.moveTo(originX, originY);
          ctx.quadraticCurveTo(tailMidX, tailMidY, bx, by);
          ctx.strokeStyle = ball.palette.base;
          ctx.lineWidth = Math.max(1.8, r * 0.13);
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.strokeStyle = ball.palette.highlight;
          ctx.globalAlpha = popIn * ballFadeOut * 0.45;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 5]);
          ctx.stroke();
          ctx.restore();

          drawYarnBall(ctx, bx, by, r, rot, ball.palette, popIn * ballFadeOut);
        }
      }

      // 5. Golden Workshop Sparkles & Floating Dust Motes
      const sparkFadeOut = 1 - easeOutCubic(clamp01((t - 1.35) / 0.7));
      if (sparkFadeOut > 0.01) {
        for (const sp of sparks) {
          const lt = t - sp.delay;
          if (lt <= 0) continue;
          const dist = easeOutCubic(clamp01(lt / 1.35)) * sp.speed;
          const sx = originX + Math.cos(sp.angle + lt * 0.6) * dist;
          const sy = originY + Math.sin(sp.angle + lt * 0.6) * dist + sp.driftY * lt;
          const twinkle = 0.5 + 0.5 * Math.sin(lt * 10 + sp.twinklePhase);
          const alpha = twinkle * sparkFadeOut * clamp01(lt / 0.2);

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#fff3c4';
          ctx.beginPath();
          ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
          ctx.fill();

          // Tiny 4-point star glint on larger sparks
          if (sp.size > 3.2) {
            ctx.strokeStyle = 'rgba(255, 232, 165, 0.75)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx - sp.size * 2.2, sy);
            ctx.lineTo(sx + sp.size * 2.2, sy);
            ctx.moveTo(sx, sy - sp.size * 2.2);
            ctx.lineTo(sx, sy + sp.size * 2.2);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // 6. Subtle Editorial Title Caption right before the Iris Reveal blooms open
      const captionIn = easeOutCubic(clamp01((t - 0.35) / 0.38));
      const captionOut = 1 - easeOutCubic(clamp01((t - 1.05) / 0.34));
      const captionAlpha = captionIn * captionOut;
      if (captionAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = captionAlpha;
        ctx.font = 'italic 600 26px Georgia, "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(18, 9, 3, 0.85)';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#fce5b8';
        ctx.fillText('Abriendo tu Cuaderno del Artista…', width * 0.5, height * 0.54);
        ctx.restore();
      }

      if (t < TOTAL_DURATION) {
        rafId = window.requestAnimationFrame(render);
      } else {
        completeCbRef.current?.();
      }
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[90] pointer-events-none select-none"
    />
  );
};
