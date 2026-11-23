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
  { base: '#f5e6c8', highlight: '#fffaf0', shade: '#b59a6e', strand: '#80643d' }, // Crema marfil
  { base: '#d99a48', highlight: '#ffe29c', shade: '#8d5816', strand: '#61390a' }, // Oro miel
  { base: '#c96244', highlight: '#f6a78b', shade: '#7b311d', strand: '#541e0f' }, // Terracota
  { base: '#799c72', highlight: '#bdd9b6', shade: '#415e3c', strand: '#283d25' }, // Verde salvia
  { base: '#9e3246', highlight: '#e27c8f', shade: '#591623', strand: '#380b14' }, // Burdeos
  { base: '#d89b9d', highlight: '#fae0e1', shade: '#8c5356', strand: '#633436' }, // Rosa antiguo
];

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

/** Draws a single interlocking V-shaped crochet chain stitch (cadeneta) with yarn highlight & shade */
function drawCrochetChainStitch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  len: number,
  pal: YarnPalette,
  alpha: number
) {
  if (alpha <= 0.01 || len < 2) return;
  const w = len * 0.44;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Soft yarn drop shadow
  ctx.strokeStyle = 'rgba(14, 24, 18, 0.35)';
  ctx.lineWidth = Math.max(2.2, len * 0.28);
  ctx.beginPath();
  ctx.ellipse(0, 1.5, len * 0.52, w * 0.56, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Left & right plied yarn loops forming the classic crochet braided "V"
  ctx.strokeStyle = pal.shade;
  ctx.lineWidth = Math.max(2.1, len * 0.26);
  ctx.beginPath();
  ctx.moveTo(-len * 0.52, 0);
  ctx.quadraticCurveTo(0, -w, len * 0.52, 0);
  ctx.quadraticCurveTo(0, w, -len * 0.52, 0);
  ctx.stroke();

  ctx.strokeStyle = pal.base;
  ctx.lineWidth = Math.max(1.5, len * 0.19);
  ctx.beginPath();
  ctx.moveTo(-len * 0.46, 0);
  ctx.quadraticCurveTo(0, -w * 0.85, len * 0.46, 0);
  ctx.quadraticCurveTo(0, w * 0.85, -len * 0.46, 0);
  ctx.stroke();

  // Twisted fiber highlight ridge along top loop
  ctx.strokeStyle = pal.highlight;
  ctx.lineWidth = Math.max(0.8, len * 0.085);
  ctx.beginPath();
  ctx.moveTo(-len * 0.32, -w * 0.25);
  ctx.quadraticCurveTo(0, -w * 0.72, len * 0.3, -w * 0.2);
  ctx.stroke();

  ctx.restore();
}

/** Draws a twisted crochet yarn strand along an arbitrary curve of points */
function drawTwistedYarnPath(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>,
  pal: YarnPalette,
  stitchSpacing: number,
  alpha: number
) {
  if (pts.length < 2 || alpha <= 0.01) return;
  let accum = 0;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.5) continue;
    const ang = Math.atan2(dy, dx);
    let pos = stitchSpacing - accum;
    while (pos <= d) {
      const t = pos / d;
      drawCrochetChainStitch(
        ctx,
        p0.x + dx * t,
        p0.y + dy * t,
        ang,
        stitchSpacing * 1.16,
        pal,
        alpha
      );
      pos += stitchSpacing;
    }
    accum = d - (pos - stitchSpacing);
  }
}

/** Draws a handcrafted 6-petal crochet flower with beaded pearl center */
function drawCrochetFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rot: number,
  petalPal: YarnPalette,
  centerPal: YarnPalette,
  alpha: number
) {
  if (radius < 2 || alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rot);

  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);

    // Puffy treble-crochet petal loop
    const pGrad = ctx.createRadialGradient(radius * 0.48, -radius * 0.1, 1, radius * 0.52, 0, radius * 0.55);
    pGrad.addColorStop(0, petalPal.highlight);
    pGrad.addColorStop(0.55, petalPal.base);
    pGrad.addColorStop(1, petalPal.shade);

    ctx.fillStyle = pGrad;
    ctx.strokeStyle = petalPal.strand;
    ctx.lineWidth = Math.max(1.2, radius * 0.08);
    ctx.beginPath();
    ctx.ellipse(radius * 0.52, 0, radius * 0.44, radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner ribbed crochet yarn texture grooves on each petal
    ctx.strokeStyle = petalPal.highlight;
    ctx.globalAlpha = alpha * 0.45;
    ctx.lineWidth = Math.max(0.8, radius * 0.05);
    ctx.beginPath();
    ctx.moveTo(radius * 0.22, -radius * 0.08);
    ctx.lineTo(radius * 0.78, -radius * 0.08);
    ctx.moveTo(radius * 0.24, radius * 0.08);
    ctx.lineTo(radius * 0.76, radius * 0.08);
    ctx.stroke();
    ctx.restore();
  }

  // Hand-stitched pearl / golden yarn button center
  const cGrad = ctx.createRadialGradient(-radius * 0.08, -radius * 0.08, 1, 0, 0, radius * 0.3);
  cGrad.addColorStop(0, '#fffdf5');
  cGrad.addColorStop(0.55, centerPal.highlight);
  cGrad.addColorStop(1, centerPal.shade);
  ctx.fillStyle = cGrad;
  ctx.strokeStyle = centerPal.strand;
  ctx.lineWidth = Math.max(1.1, radius * 0.065);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/** Draws a realistic wooden-and-gold artisan crochet hook (aguja de ganchillo) */
function drawCrochetHook(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  angle: number,
  scale: number,
  alpha: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(tipX, tipY);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Soft cast shadow under hook
  ctx.save();
  ctx.translate(4, 7);
  ctx.strokeStyle = 'rgba(10, 18, 13, 0.36)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, 0);
  ctx.lineTo(148, 0);
  ctx.stroke();
  ctx.restore();

  // Golden brass hook tip & throat notch (gancho)
  const goldGrad = ctx.createLinearGradient(0, -6, 0, 6);
  goldGrad.addColorStop(0, '#fff2c2');
  goldGrad.addColorStop(0.45, '#e8b65a');
  goldGrad.addColorStop(1, '#8c5a18');

  ctx.fillStyle = goldGrad;
  ctx.strokeStyle = '#623a0c';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-10, -1.5);
  ctx.quadraticCurveTo(-14, -7.5, -4, -7.5);
  ctx.quadraticCurveTo(3, -7.5, 4, -2.5);
  ctx.quadraticCurveTo(8, -2.2, 13, -4);
  ctx.lineTo(44, -4.2);
  ctx.lineTo(44, 4.2);
  ctx.lineTo(0, 4.2);
  ctx.quadraticCurveTo(-9, 4.2, -10, -1.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Turned walnut ergonomic handle with brass ferrule collar
  const woodGrad = ctx.createLinearGradient(0, -8, 0, 8);
  woodGrad.addColorStop(0, '#c2834b');
  woodGrad.addColorStop(0.35, '#8c4e24');
  woodGrad.addColorStop(0.8, '#532910');
  woodGrad.addColorStop(1, '#311506');

  ctx.fillStyle = woodGrad;
  ctx.beginPath();
  ctx.moveTo(42, -5.2);
  ctx.bezierCurveTo(68, -8.8, 118, -8.5, 146, -5.2);
  ctx.quadraticCurveTo(154, 0, 146, 5.2);
  ctx.bezierCurveTo(118, 8.5, 68, 8.8, 42, 5.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2d1305';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  // Brass ferrule rings
  ctx.fillStyle = goldGrad;
  ctx.fillRect(41, -5.4, 7, 10.8);
  ctx.strokeStyle = '#613a0e';
  ctx.strokeRect(41, -5.4, 7, 10.8);

  // Specular wood polish highlight
  ctx.strokeStyle = 'rgba(255, 232, 192, 0.35)';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(56, -3.5);
  ctx.lineTo(136, -3.2);
  ctx.stroke();

  ctx.restore();
}

/** Draws a shaded wound yarn ball (ovillo) */
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

  ctx.beginPath();
  ctx.arc(r * 0.12, r * 0.18, r * 1.02, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10, 22, 16, 0.34)';
  ctx.fill();

  ctx.rotate(rot);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.save();
  ctx.clip();

  const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.34, r * 0.1, 0, 0, r * 1.15);
  grad.addColorStop(0, pal.highlight);
  grad.addColorStop(0.45, pal.base);
  grad.addColorStop(1, pal.shade);
  ctx.fillStyle = grad;
  ctx.fillRect(-r, -r, r * 2, r * 2);

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
  }
  for (let i = -2; i <= 2; i++) {
    const off = i * (r * 0.3);
    ctx.beginPath();
    ctx.moveTo(off - r * 0.4, -r * 1.1);
    ctx.bezierCurveTo(off + r * 0.1, -r * 0.25, off - r * 0.15, r * 0.35, off + r * 0.45, r * 1.1);
    ctx.strokeStyle = pal.highlight;
    ctx.globalAlpha = alpha * 0.34;
    ctx.lineWidth = Math.max(0.9, r * 0.08);
    ctx.stroke();
  }

  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 240, 206, 0.45)';
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a scalloped crochet lace doily (carpeta de encaje con anillo mágico, puntos altos,
 * arcos de cadeneta, abanicos / conchas y picots) around (cx, cy).
 */
function drawCrochetLaceMandala(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  rotation: number,
  stitchProgress: number,
  alpha: number
) {
  if (radius < 6 || alpha <= 0.01) return;
  const ivory = YARN_PALETTES[0];
  const gold = YARN_PALETTES[1];
  const petals = 12;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Ring 1: Magic ring (anillo mágico)
  const r1 = radius * 0.18;
  ctx.strokeStyle = gold.highlight;
  ctx.lineWidth = Math.max(2.2, radius * 0.025);
  ctx.beginPath();
  ctx.arc(0, 0, r1, 0, Math.PI * 2 * clamp01(stitchProgress * 2.2));
  ctx.stroke();

  // Ring 2: 12 Double-Crochet (puntos altos) radiating spokes
  const r2 = radius * 0.48;
  const spokesProgress = clamp01((stitchProgress - 0.1) / 0.45);
  const spokeCount = Math.floor(petals * 2 * spokesProgress);
  for (let i = 0; i < spokeCount; i++) {
    const a = (i / (petals * 2)) * Math.PI * 2;
    const x0 = Math.cos(a) * r1;
    const y0 = Math.sin(a) * r1;
    const x1 = Math.cos(a) * r2;
    const y1 = Math.sin(a) * r2;

    ctx.strokeStyle = i % 2 === 0 ? ivory.base : gold.base;
    ctx.lineWidth = Math.max(1.8, radius * 0.02);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // Little horizontal yarn-over cross-bar (signature crochet stitch look!)
    const mx = (x0 + x1) * 0.52;
    const my = (y0 + y1) * 0.52;
    const px = -Math.sin(a) * radius * 0.026;
    const py = Math.cos(a) * radius * 0.026;
    ctx.strokeStyle = ivory.highlight;
    ctx.lineWidth = Math.max(1.1, radius * 0.011);
    ctx.beginPath();
    ctx.moveTo(mx - px, my - py);
    ctx.lineTo(mx + px, my + py);
    ctx.stroke();
  }

  // Ring 3: Interlocking chain-stitch arches (arcos de cadeneta)
  const archProgress = clamp01((stitchProgress - 0.25) / 0.5);
  const r3 = radius * 0.76;
  const visibleArches = Math.ceil(petals * archProgress);
  for (let i = 0; i < visibleArches; i++) {
    const a0 = (i / petals) * Math.PI * 2;
    const a1 = ((i + 1) / petals) * Math.PI * 2;
    const am = (a0 + a1) * 0.5;
    const x0 = Math.cos(a0) * r2;
    const y0 = Math.sin(a0) * r2;
    const xm = Math.cos(am) * r3;
    const ym = Math.sin(am) * r3;
    const x1 = Math.cos(a1) * r2;
    const y1 = Math.sin(a1) * r2;

    ctx.strokeStyle = ivory.highlight;
    ctx.lineWidth = Math.max(2, radius * 0.022);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(xm * 1.06, ym * 1.06, x1, y1);
    ctx.stroke();

    // 5-stitch Scalloped Shell (abanico de crochet) + Picot loop at the tip!
    const shellProgress = clamp01((stitchProgress - 0.42) / 0.52);
    if (shellProgress > 0.05) {
      const tipR = radius * (0.76 + 0.24 * shellProgress);
      for (let s = -2; s <= 2; s++) {
        const sa = am + s * 0.095;
        ctx.strokeStyle = s === 0 ? gold.highlight : ivory.base;
        ctx.lineWidth = Math.max(1.4, radius * 0.015);
        ctx.beginPath();
        ctx.moveTo(Math.cos(am) * r2 * 0.96, Math.sin(am) * r2 * 0.96);
        ctx.lineTo(Math.cos(sa) * tipR, Math.sin(sa) * tipR);
        ctx.stroke();
      }
      // Scallop outer lace rim
      ctx.strokeStyle = ivory.highlight;
      ctx.lineWidth = Math.max(2.1, radius * 0.02);
      ctx.beginPath();
      ctx.arc(Math.cos(am) * r3 * 0.92, Math.sin(am) * r3 * 0.92, radius * 0.16 * shellProgress, am - 1.15, am + 1.15);
      ctx.stroke();

      // Tiny picot eyelet bead at apex
      const px = Math.cos(am) * (tipR + radius * 0.045);
      const py = Math.sin(am) * (tipR + radius * 0.045);
      ctx.strokeStyle = gold.highlight;
      ctx.lineWidth = Math.max(1.4, radius * 0.014);
      ctx.beginPath();
      ctx.arc(px, py, Math.max(2.2, radius * 0.026), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

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

    // 8 artisan yarn balls rolling gently along the crocheted curtain edges
    const rollingBalls = Array.from({ length: 8 }, (_, i) => {
      const ang = (i / 8) * Math.PI * 2 + 0.35;
      return {
        palette: YARN_PALETTES[i % YARN_PALETTES.length],
        angle: ang,
        radius: Math.max(18, Math.min(34, width * 0.022)) * (0.85 + (i % 3) * 0.14),
        spin: (i % 2 === 0 ? 1 : -1) * (3.2 + (i % 3) * 0.9),
      };
    });

    // 6 handcrafted crochet flowers blossoming around the opening doily
    const laceFlowers = Array.from({ length: 6 }, (_, i) => ({
      angle: (i / 6) * Math.PI * 2 + 0.25,
      petalPal: YARN_PALETTES[(i + 2) % YARN_PALETTES.length],
      centerPal: YARN_PALETTES[1],
      rotOffset: i * 0.7,
    }));

    const TOTAL_DURATION = 2.2;
    const MIDPOINT_TIME = 1.12;
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

      const centerGlide = easeInOutQuart(clamp01((t - 0.08) / 0.92));
      const cx = width * (0.7 - 0.2 * centerGlide);
      const cy = height * (0.52 - 0.02 * centerGlide);

      const veilIn = easeOutCubic(clamp01((t - 0.1) / 0.78));
      const revealP = easeInOutQuart(clamp01((t - 1.14) / 0.96));

      // 1. Handwoven Forest-Green & Espresso Crochet Curtain Backdrop
      if (veilIn > 0.005 && revealP < 0.995) {
        ctx.save();
        const veilAlpha = veilIn * (1 - revealP * 0.25);
        const bgGrad = ctx.createRadialGradient(cx, cy, maxDim * 0.04, cx, cy, maxDim * 0.85);
        bgGrad.addColorStop(0, `rgba(38, 90, 70, ${veilAlpha * 0.95})`);
        bgGrad.addColorStop(0.5, `rgba(26, 56, 44, ${veilAlpha * 0.97})`);
        bgGrad.addColorStop(1, `rgba(24, 15, 9, ${veilAlpha * 0.98})`);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Subtle woven crochet grid rows across the backdrop
        ctx.strokeStyle = `rgba(245, 230, 200, ${veilAlpha * 0.065})`;
        ctx.lineWidth = 1.5;
        const rowStep = 28;
        for (let y = rowStep; y < height; y += rowStep) {
          ctx.beginPath();
          for (let x = 0; x <= width; x += 22) {
            const wy = y + ((x / 22) % 2 === 0 ? -4 : 4);
            if (x === 0) ctx.moveTo(x, wy);
            else ctx.lineTo(x, wy);
          }
          ctx.stroke();
        }

        // Phase 2 (t > 1.14): Scalloped Crochet-Lace Portal expands from center to unveil the notebook!
        if (revealP > 0.001) {
          const portalR = revealP * maxDim * 0.76;
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          const scallops = 24;
          const scallopAmp = Math.min(26, portalR * 0.08 + 6);
          const steps = 160;
          for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * Math.PI * 2 + t * 0.12;
            const wave = Math.abs(Math.sin((a * scallops) / 2)) * scallopAmp;
            const rr = portalR + wave;
            const px = width * 0.5 + Math.cos(a) * rr;
            const py = height * 0.5 + Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';

          // Hand-crocheted glowing ivory lace scallop border framing the expanding portal!
          const rimAlpha = Math.sin(clamp01(revealP) * Math.PI) * 0.95;
          if (rimAlpha > 0.02 && portalR > 16) {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 244, 218, ${rimAlpha})`;
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
              const a = (i / steps) * Math.PI * 2 + t * 0.12;
              const wave = Math.abs(Math.sin((a * scallops) / 2)) * scallopAmp;
              const rr = portalR + wave;
              const px = width * 0.5 + Math.cos(a) * rr;
              const py = height * 0.5 + Math.sin(a) * rr;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();

            // Delicate picot beads along every lace scallop crest
            ctx.fillStyle = `rgba(255, 224, 148, ${rimAlpha * 0.9})`;
            for (let s = 0; s < scallops; s++) {
              const a = ((s + 0.5) / scallops) * Math.PI * 2 + t * 0.12;
              const rr = portalR + scallopAmp + 8;
              ctx.beginPath();
              ctx.arc(width * 0.5 + Math.cos(a) * rr, height * 0.5 + Math.sin(a) * rr, 3.2, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
        }
        ctx.restore();
      }

      // 2. Central Crocheted Lace Doily Mandala knitting itself open!
      const doilyIn = easeOutCubic(clamp01(t / 1.02));
      const doilyOut = clamp01(1 - (t - 1.38) / 0.65);
      const doilyAlpha = doilyIn * doilyOut;
      if (doilyAlpha > 0.01) {
        const baseDoilyR = Math.min(width, height) * 0.28 * (0.28 + 0.72 * doilyIn) + revealP * maxDim * 0.44;
        drawCrochetLaceMandala(
          ctx,
          cx,
          cy,
          baseDoilyR,
          t * 0.28,
          clamp01(t / 0.98),
          doilyAlpha * 0.94
        );
      }

      // 3. Active Crochet Hook weaving a graceful braided chain-stitch spiral across the stage!
      const hookPhase = clamp01(t / 1.25);
      const hookFade = clamp01(1 - (t - 1.15) / 0.42);
      if (hookFade > 0.01) {
        const spiralPts: Array<{ x: number; y: number }> = [];
        const samples = Math.max(2, Math.floor(hookPhase * 52));
        for (let i = 0; i <= samples; i++) {
          const u = i / 52;
          const a = -Math.PI * 0.7 + u * Math.PI * 2.65;
          const rad = Math.min(width, height) * (0.04 + u * 0.29);
          spiralPts.push({
            x: cx + Math.cos(a) * rad,
            y: cy + Math.sin(a) * rad * 0.88,
          });
        }
        drawTwistedYarnPath(ctx, spiralPts, YARN_PALETTES[0], 13, hookFade * 0.95);

        // Draw the artisan crochet hook right at the leading stitch!
        const tip = spiralPts[spiralPts.length - 1];
        const prev = spiralPts[Math.max(0, spiralPts.length - 2)];
        const moveAng = Math.atan2(tip.y - prev.y, tip.x - prev.x);
        const bob = Math.sin(t * 22) * 0.09; // gentle stitching motion of the hook!
        drawCrochetHook(
          ctx,
          tip.x,
          tip.y,
          moveAng - Math.PI * 0.28 + bob,
          Math.max(0.85, Math.min(1.25, width / 1150)),
          hookFade
        );
      }

      // 4. Handcrafted Crochet Flowers blossoming around the opening lace ring
      const flowerGrow = easeOutCubic(clamp01((t - 0.35) / 0.72));
      const flowerFade = clamp01(1 - (t - 1.55) / 0.55);
      if (flowerGrow > 0.01 && flowerFade > 0.01) {
        const ringR = Math.min(width, height) * 0.23 + revealP * maxDim * 0.46;
        for (const fl of laceFlowers) {
          const a = fl.angle + t * 0.22;
          const fx = cx + Math.cos(a) * ringR;
          const fy = cy + Math.sin(a) * ringR;
          const fr = Math.max(16, Math.min(30, width * 0.02)) * flowerGrow;
          drawCrochetFlower(ctx, fx, fy, fr, fl.rotOffset + t * 0.6, fl.petalPal, fl.centerPal, flowerFade * 0.95);
        }
      }

      // 5. Rolling Yarn Balls trailing braided crochet chains outward as the curtain opens
      const ballIn = easeOutCubic(clamp01((t - 0.18) / 0.65));
      const ballOut = clamp01(1 - (t - 1.62) / 0.5);
      const ballAlpha = ballIn * ballOut;
      if (ballAlpha > 0.01) {
        for (let i = 0; i < rollingBalls.length; i++) {
          const b = rollingBalls[i];
          const dist = Math.min(width, height) * (0.14 + 0.22 * ballIn) + revealP * maxDim * 0.48;
          const a = b.angle + t * 0.18;
          const bx = cx + Math.cos(a) * dist;
          const by = cy + Math.sin(a) * dist;

          // Trailing braided crochet yarn tail behind each ball
          const tailPts: Array<{ x: number; y: number }> = [];
          for (let s = 0; s <= 10; s++) {
            const u = s / 10;
            const td = Math.max(0, dist - (1 - u) * 115);
            const ta = a - (1 - u) * 0.22 + Math.sin(u * 5 + i) * 0.06;
            tailPts.push({
              x: cx + Math.cos(ta) * td,
              y: cy + Math.sin(ta) * td,
            });
          }
          drawTwistedYarnPath(ctx, tailPts, b.palette, 11, ballAlpha * 0.85);
          drawYarnBall(ctx, bx, by, b.radius, t * b.spin + i, b.palette, ballAlpha);
        }
      }

      if (t < TOTAL_DURATION) {
        rafId = requestAnimationFrame(render);
      } else {
        completeCbRef.current?.();
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[120] pointer-events-none select-none"
    />
  );
};
