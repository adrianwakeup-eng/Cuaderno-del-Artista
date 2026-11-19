import type { CrochetGifScene } from '../data/crochetGifs';

export interface GifRenderOptions {
  scene: CrochetGifScene;
  colors: [string, string, string, string];
  variant?: number;
  progress: number; // 0 .. 1 looping
  size: number;
  transparentBg?: boolean;
}

const TAU = Math.PI * 2;

function drawYarnBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  c1: string,
  c2: string,
  rot = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.12, 0, 0, r);
  grad.addColorStop(0, c2);
  grad.addColorStop(0.7, c1);
  grad.addColorStop(1, '#2a1208');

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.clip();
  ctx.strokeStyle = 'rgba(255,248,235,0.42)';
  ctx.lineWidth = Math.max(1.2, r * 0.11);
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.ellipse(i * r * 0.22, 0, r * 0.85, r * 0.42, 0.45, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, i * r * 0.22, r * 0.9, r * 0.38, -0.55, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.strokeStyle = 'rgba(42,18,8,0.45)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.restore();
}

function drawCrochetHook(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  angle: number,
  shaftColor: string,
  handleColor: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Handle
  ctx.fillStyle = handleColor;
  ctx.beginPath();
  ctx.roundRect(-length * 0.55, -4.5, length * 0.46, 9, 4.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(35,16,7,0.45)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Metal/Gold shaft
  ctx.strokeStyle = shaftColor;
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-length * 0.1, 0);
  ctx.lineTo(length * 0.42, 0);
  ctx.stroke();

  // Hook tip
  ctx.beginPath();
  ctx.arc(length * 0.44, -3.5, 4.5, Math.PI * 0.45, Math.PI * 1.85, true);
  ctx.stroke();

  // Highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-length * 0.08, -1.2);
  ctx.lineTo(length * 0.36, -1.2);
  ctx.stroke();

  ctx.restore();
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 1
) {
  if (r <= 0.4 || alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(Math.cos(a + Math.PI / 4) * r * 0.28, Math.sin(a + Math.PI / 4) * r * 0.28);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fill: string,
  stroke?: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.bezierCurveTo(-size * 0.55, -size * 0.15, -size * 0.55, -size * 0.65, 0, -size * 0.3);
  ctx.bezierCurveTo(size * 0.55, -size * 0.65, size * 0.55, -size * 0.15, 0, size * 0.35);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function drawFlowerPetal(
  ctx: CanvasRenderingContext2D,
  angle: number,
  dist: number,
  rx: number,
  ry: number,
  fill: string,
  stroke?: string
) {
  ctx.save();
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.ellipse(dist, 0, rx, ry, 0, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawStitchRing(
  ctx: CanvasRenderingContext2D,
  radius: number,
  count: number,
  color: string,
  dotRadius = 3.2,
  rotOffset = 0,
  progressReveal = 1
) {
  const visibleCount = Math.max(0, Math.round(count * progressReveal));
  for (let i = 0; i < visibleCount; i++) {
    const a = (i / count) * TAU + rotOffset;
    const px = Math.cos(a) * radius;
    const py = Math.sin(a) * radius;
    ctx.beginPath();
    ctx.ellipse(px, py, dotRadius * 1.25, dotRadius * 0.78, a + Math.PI / 2, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,18,8,0.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

export function renderCrochetGifFrame({
  scene,
  colors,
  variant = 0,
  progress,
  size,
  transparentBg = false,
}: GifRenderOptions, ctx: CanvasRenderingContext2D) {
  const [c1, c2, c3, c4] = colors;
  const phase = (progress + variant * 0.13) % 1;
  const angle = phase * TAU;
  const wave = Math.sin(angle);
  const pulse = 0.5 + 0.5 * Math.sin(angle);
  const cx = size / 2;
  const cy = size / 2;
  const s = size / 140;

  ctx.clearRect(0, 0, size, size);
  if (!transparentBg) {
    const bg = ctx.createRadialGradient(cx, cy * 0.85, 8 * s, cx, cy, size * 0.65);
    bg.addColorStop(0, '#fff9ec');
    bg.addColorStop(1, '#f1dfb8');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
  }

  ctx.save();
  ctx.scale(s, s);
  const C = 70; // virtual center in 140x140 space

  switch (scene) {
    case 'chain-hook': {
      // Animated chain stitches + moving hook
      const links = 7;
      for (let i = 0; i < links; i++) {
        const lx = 22 + i * 13;
        const ly = 78 + Math.sin(angle + i * 0.8) * 3;
        const scale = i === links - 1 ? 0.6 + 0.4 * pulse : 1;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.scale(scale, scale);
        ctx.strokeStyle = i % 2 === 0 ? c1 : c2;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4.5, -0.15, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      // Yarn tail
      ctx.strokeStyle = c1;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(100, 78);
      ctx.quadraticCurveTo(116, 62 + wave * 8, 124, 88);
      ctx.stroke();
      drawCrochetHook(ctx, 88 + wave * 6, 56 + Math.cos(angle) * 5, 64, -0.55 + wave * 0.12, c3, c4);
      drawSparkle(ctx, 108, 42, 4 + pulse * 3, c3, 0.9);
      break;
    }

    case 'dc-stitch': {
      // Tall double crochet posts building left to right
      ctx.strokeStyle = c4;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(20, 104);
      ctx.lineTo(120, 104);
      ctx.stroke();

      const posts = 5;
      const activeIdx = Math.floor(phase * posts);
      for (let i = 0; i < posts; i++) {
        const px = 30 + i * 20;
        const h = i <= activeIdx ? 42 : 12;
        const col = i % 2 === 0 ? c1 : c2;
        ctx.strokeStyle = col;
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, 100);
        ctx.lineTo(px, 100 - h);
        ctx.stroke();
        // Crossbar for double crochet symbol!
        if (h > 24) {
          ctx.beginPath();
          ctx.moveTo(px - 6, 100 - h * 0.55);
          ctx.lineTo(px + 6, 100 - h * 0.45);
          ctx.stroke();
          // Top T cap
          ctx.beginPath();
          ctx.moveTo(px - 6, 100 - h);
          ctx.lineTo(px + 6, 100 - h);
          ctx.stroke();
        }
      }
      drawCrochetHook(ctx, 42 + activeIdx * 18, 44 + wave * 4, 52, -0.45, c3, c4);
      break;
    }

    case 'magic-ring': {
      const r = 24 + Math.sin(angle) * 5;
      ctx.strokeStyle = c3;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(C, C, r, 0, TAU);
      ctx.stroke();
      const count = 8;
      drawStitchRing(ctx, r + 9, count, c1, 4.2, angle * 0.25, 0.35 + 0.65 * pulse);
      drawStitchRing(ctx, r - 6, 6, c2, 2.8, -angle * 0.35, 1);
      // Pulling tail
      ctx.strokeStyle = c1;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(C + r * 0.7, C + r * 0.7);
      ctx.quadraticCurveTo(106, 108 + wave * 6, 120, 96);
      ctx.stroke();
      drawSparkle(ctx, C, C, 4 + pulse * 3, c3);
      break;
    }

    case 'golden-hook': {
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(-0.65 + wave * 0.14);
      drawCrochetHook(ctx, 0, 0, 96, 0, c2, c3);
      ctx.restore();
      drawYarnBall(ctx, 42, 94, 18, c3, c2, angle);
      drawSparkle(ctx, 94, 38, 6 * pulse + 2, c2);
      drawSparkle(ctx, 44, 40, 5 * (1 - pulse) + 2, c1);
      drawSparkle(ctx, 106, 86, 4.5 * pulse + 1.5, c2);
      break;
    }

    case 'scissors-snip': {
      const snip = 0.2 + 0.35 * Math.abs(wave);
      // Yarn thread being snipped
      ctx.strokeStyle = c3;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(22, 92);
      ctx.quadraticCurveTo(68, 70 + wave * 8, 118, 90);
      ctx.stroke();

      ctx.save();
      ctx.translate(68, 72);
      // Blade 1
      ctx.save();
      ctx.rotate(-snip);
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.moveTo(-4, -3);
      ctx.lineTo(42, -2);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c1;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-18, -10, 9, 0, TAU);
      ctx.stroke();
      ctx.restore();

      // Blade 2
      ctx.save();
      ctx.rotate(snip);
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.moveTo(-4, -3);
      ctx.lineTo(42, 2);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(-18, 10, 9, 0, TAU);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, TAU);
      ctx.fillStyle = c4;
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'yarn-unroll': {
      const bx = 56 + wave * 12;
      const by = 68 - Math.abs(wave) * 6;
      // Unrolling wave tail
      ctx.strokeStyle = c1;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bx + 18, by + 16);
      ctx.bezierCurveTo(96, 108, 108, 74 + wave * 14, 124, 96 - wave * 10);
      ctx.stroke();
      drawYarnBall(ctx, bx, by, 28, c1, c2, angle);
      drawSparkle(ctx, 108, 44, 4 + pulse * 2.5, c3);
      break;
    }

    case 'yarn-bounce': {
      const y1 = 76 - Math.abs(Math.sin(angle)) * 24;
      const y2 = 76 - Math.abs(Math.cos(angle)) * 24;
      // Shadows
      ctx.fillStyle = 'rgba(42,18,8,0.18)';
      ctx.beginPath();
      ctx.ellipse(46, 108, 18 - (76 - y1) * 0.2, 4, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(94, 108, 18 - (76 - y2) * 0.2, 4, 0, 0, TAU);
      ctx.fill();

      drawYarnBall(ctx, 46, y1, 21, c1, c2, angle);
      drawYarnBall(ctx, 94, y2, 20, c3, c2, -angle);
      break;
    }

    case 'measuring-tape': {
      // Spiral measuring tape
      ctx.strokeStyle = c1;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let t = 0; t <= 26; t++) {
        const a = t * 0.35 + angle * 0.4;
        const r = 10 + t * 1.45;
        const x = C + Math.cos(a) * r;
        const y = C + Math.sin(a) * r;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = c3;
      ctx.lineWidth = 1.6;
      for (let t = 2; t <= 25; t += 2) {
        const a = t * 0.35 + angle * 0.4;
        const r1 = 6 + t * 1.45;
        const r2 = 13 + t * 1.45;
        ctx.beginPath();
        ctx.moveTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1);
        ctx.lineTo(C + Math.cos(a) * r2, C + Math.sin(a) * r2);
        ctx.stroke();
      }
      break;
    }

    case 'stitch-markers': {
      const items = [c1, c2, c3, c4];
      for (let i = 0; i < 4; i++) {
        const a = angle + (i * TAU) / 4;
        const mx = C + Math.cos(a) * 32;
        const my = C + Math.sin(a) * 32;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(a + Math.PI / 2);
        ctx.strokeStyle = items[i];
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 14, 0, 0.3, TAU - 0.1);
        ctx.stroke();
        ctx.restore();
      }
      drawSparkle(ctx, C, C, 5 + pulse * 3, c4);
      break;
    }

    case 'yarn-basket': {
      const bob = wave * 3;
      drawYarnBall(ctx, 48, 52 + bob, 16, c2, c4, angle * 0.5);
      drawYarnBall(ctx, 72, 46 - bob, 18, c3, c4, -angle * 0.5);
      drawYarnBall(ctx, 92, 54 + bob, 15, c4, c2, angle * 0.5);

      // Woven basket
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.moveTo(30, 62);
      ctx.lineTo(110, 62);
      ctx.quadraticCurveTo(102, 108, 70, 108);
      ctx.quadraticCurveTo(38, 108, 30, 62);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#3b1c0a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Basket weave lines
      ctx.strokeStyle = 'rgba(255,235,194,0.45)';
      ctx.lineWidth = 2;
      for (let row = 72; row <= 96; row += 10) {
        ctx.beginPath();
        ctx.moveTo(36, row);
        ctx.lineTo(104, row);
        ctx.stroke();
      }
      break;
    }

    case 'mandala-spin':
    case 'mandala-bloom':
    case 'mandala-kaleidoscope':
    case 'mandala-sunburst':
    case 'mandala-boho':
    case 'mandala-lace-wheel':
    case 'mandala-star':
    case 'mandala-daisy':
    case 'mandala-autumn':
    case 'mandala-emerald': {
      ctx.save();
      ctx.translate(C, C);
      const scaleAnim = scene === 'mandala-bloom' ? 0.85 + 0.16 * pulse : 1;
      ctx.scale(scaleAnim, scaleAnim);

      // Outer petals rotating
      ctx.save();
      ctx.rotate(angle * (scene === 'mandala-boho' ? 0.5 : 1));
      const outerCount = scene === 'mandala-star' ? 8 : 12;
      for (let i = 0; i < outerCount; i++) {
        const a = (i / outerCount) * TAU;
        drawFlowerPetal(
          ctx,
          a,
          36,
          scene === 'mandala-star' ? 16 : 12,
          scene === 'mandala-sunburst' ? 5 : 7.5,
          i % 2 === 0 ? c1 : c2,
          'rgba(38,16,6,0.35)'
        );
      }
      ctx.restore();

      // Middle stitch ring counter-rotating
      ctx.save();
      ctx.rotate(-angle * (scene === 'mandala-kaleidoscope' ? 1.5 : 0.75));
      const midCount = 10;
      for (let i = 0; i < midCount; i++) {
        const a = (i / midCount) * TAU;
        drawFlowerPetal(ctx, a, 21, 9, 5.5, i % 2 === 0 ? c3 : c4);
      }
      ctx.restore();

      // Inner scalloped ring
      drawStitchRing(ctx, 13, 10, c2, 2.4, angle, 1);

      // Center button
      ctx.beginPath();
      ctx.arc(0, 0, 7 + pulse * 1.5, 0, TAU);
      ctx.fillStyle = c4;
      ctx.fill();
      ctx.strokeStyle = c1;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'granny-build':
    case 'granny-sunflower':
    case 'granny-heart':
    case 'granny-daisy': {
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(wave * 0.08);
      const layers = [
        { half: 46, col: c4 },
        { half: 34, col: c3 },
        { half: 22, col: c2 },
      ];
      layers.forEach((l, idx) => {
        const sPop = 0.92 + 0.08 * Math.sin(angle + idx * 1.2);
        const h = l.half * sPop;
        ctx.fillStyle = l.col;
        ctx.beginPath();
        ctx.roundRect(-h, -h, h * 2, h * 2, 7);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,248,235,0.55)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(-h + 4, -h + 4, h * 2 - 8, h * 2 - 8);
        ctx.setLineDash([]);
      });

      if (scene === 'granny-heart') {
        drawHeart(ctx, 0, 2, 22 + pulse * 4, c1, '#fff');
      } else if (scene === 'granny-daisy' || scene === 'granny-sunflower') {
        for (let i = 0; i < 8; i++) {
          drawFlowerPetal(ctx, (i / 8) * TAU + angle * 0.4, 12, 7, 4, c2);
        }
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, TAU);
        ctx.fillStyle = c1;
        ctx.fill();
      } else {
        ctx.fillStyle = c1;
        ctx.beginPath();
        ctx.arc(0, 0, 9 + pulse * 2, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      break;
    }

    case 'hexagon-hive':
    case 'african-flower': {
      const hexPositions = [
        [C, C, c1],
        [C - 26, C - 15, c2],
        [C + 26, C - 15, c3],
        [C - 26, C + 15, c4],
        [C + 26, C + 15, c2],
        [C, C - 30, c3],
        [C, C + 30, c4],
      ] as Array<[number, number, string]>;
      hexPositions.forEach(([hx, hy, col], i) => {
        const sc = 0.84 + 0.16 * Math.sin(angle + i * 0.9);
        ctx.save();
        ctx.translate(hx, hy);
        ctx.scale(sc, sc);
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * TAU;
          const px = Math.cos(a) * 15;
          const py = Math.sin(a) * 15;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = '#fff5e0';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        if (scene === 'african-flower') {
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, TAU);
          ctx.fillStyle = '#fff8e8';
          ctx.fill();
        }
        ctx.restore();
      });
      break;
    }

    case 'doily-expand':
    case 'lace-sparkle': {
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(angle * 0.4);
      const rings = [44, 30, 16];
      rings.forEach((r, idx) => {
        const rr = r * (0.9 + 0.1 * Math.sin(angle + idx));
        ctx.strokeStyle = idx === 0 ? c1 : idx === 1 ? c2 : c3;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const lobes = 12 - idx * 2;
        for (let i = 0; i <= lobes * 8; i++) {
          const a = (i / (lobes * 8)) * TAU;
          const rad = rr + Math.abs(Math.sin(a * lobes * 0.5)) * 6;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      });
      drawSparkle(ctx, 26, -26, 4 + pulse * 3, c4);
      drawSparkle(ctx, -28, 22, 3 + (1 - pulse) * 3, c2);
      ctx.restore();
      break;
    }

    case 'ripple-wave':
    case 'rainbow-blanket': {
      const stripes = [c1, c2, c3, c4];
      for (let row = 0; row < 4; row++) {
        ctx.strokeStyle = stripes[row];
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let x = 20; x <= 120; x += 12) {
          const offset = scene === 'ripple-wave' ? ((x / 12) % 2 === 0 ? -7 : 7) : 0;
          const y = 38 + row * 20 + offset + Math.sin(angle + x * 0.08 + row * 0.7) * 5;
          if (x === 20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }

    case 'rose-bloom': {
      ctx.save();
      ctx.translate(C, C - 4);
      // Leaves
      drawFlowerPetal(ctx, 2.3 + wave * 0.1, 24, 15, 7, c4);
      drawFlowerPetal(ctx, 0.8 - wave * 0.1, 24, 15, 7, c4);
      // Outer petals
      const bloom = 0.82 + 0.18 * pulse;
      ctx.scale(bloom, bloom);
      for (let i = 0; i < 6; i++) {
        drawFlowerPetal(ctx, (i / 6) * TAU + angle * 0.25, 19, 14, 11, c2, c1);
      }
      for (let i = 0; i < 5; i++) {
        drawFlowerPetal(ctx, (i / 5) * TAU - angle * 0.3, 10, 10, 8, c3, c1);
      }
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, TAU);
      ctx.fillStyle = c1;
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'sunflower-sway': {
      ctx.save();
      ctx.translate(C, 118);
      ctx.rotate(wave * 0.1);
      ctx.strokeStyle = c4;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -56);
      ctx.stroke();
      ctx.translate(0, -60);
      for (let i = 0; i < 12; i++) {
        drawFlowerPetal(ctx, (i / 12) * TAU + angle * 0.2, 20, 12, 5.5, i % 2 === 0 ? c2 : c3);
      }
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, TAU);
      ctx.fillStyle = c1;
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'daisy-dance': {
      ctx.save();
      ctx.translate(C + wave * 6, C - Math.abs(wave) * 8);
      ctx.rotate(wave * 0.2);
      for (let i = 0; i < 8; i++) {
        drawFlowerPetal(ctx, (i / 8) * TAU, 21, 13, 7, c2, c3);
      }
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, TAU);
      ctx.fillStyle = c1;
      ctx.fill();
      // Cute smile
      ctx.fillStyle = '#3b1c0a';
      ctx.beginPath();
      ctx.arc(-4, -2, 1.5, 0, TAU);
      ctx.arc(4, -2, 1.5, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 1, 4, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = '#3b1c0a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'tulip-open': {
      ctx.save();
      ctx.translate(C, 118);
      ctx.strokeStyle = c3;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -52);
      ctx.stroke();
      drawFlowerPetal(ctx, -0.5, 18, 12, 5, c3);
      drawFlowerPetal(ctx, -2.6, 18, 12, 5, c3);

      ctx.translate(0, -56);
      const open = 0.2 + 0.25 * pulse;
      drawFlowerPetal(ctx, -Math.PI / 2 - open, 12, 15, 9, c1);
      drawFlowerPetal(ctx, -Math.PI / 2 + open, 12, 15, 9, c2);
      drawFlowerPetal(ctx, -Math.PI / 2, 13, 16, 10, c1);
      ctx.restore();
      break;
    }

    case 'leaf-sway': {
      ctx.save();
      ctx.translate(30, 105);
      ctx.rotate(wave * 0.09);
      ctx.strokeStyle = c1;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(36, -32, 74, -66);
      ctx.stroke();
      [
        [22, -20, -0.9, c2],
        [42, -38, 0.2, c3],
        [58, -54, -0.8, c2],
      ].forEach(([lx, ly, rot, col]) => {
        ctx.save();
        ctx.translate(lx as number, ly as number);
        ctx.rotate((rot as number) + wave * 0.12);
        ctx.fillStyle = col as string;
        ctx.beginPath();
        ctx.ellipse(12, 0, 14, 7, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
      break;
    }

    case 'clover-spin': {
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(angle * 0.7);
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * TAU) / 4);
        drawHeart(ctx, 0, -20, 26, i % 2 === 0 ? c2 : c3, c1);
        ctx.restore();
      }
      drawSparkle(ctx, 0, 0, 4 + pulse * 3, c4);
      ctx.restore();
      break;
    }

    case 'butterfly-flap': {
      const flap = 0.45 + 0.55 * Math.abs(Math.cos(angle * 2));
      ctx.save();
      ctx.translate(C, C - Math.sin(angle) * 6);
      // Left wings
      ctx.save();
      ctx.scale(flap, 1);
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.ellipse(-20, -12, 18, 14, -0.35, 0, TAU);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.ellipse(-16, 14, 13, 10, 0.35, 0, TAU);
      ctx.fill();
      ctx.restore();
      // Right wings
      ctx.save();
      ctx.scale(flap, 1);
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.ellipse(20, -12, 18, 14, 0.35, 0, TAU);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.ellipse(16, 14, 13, 10, -0.35, 0, TAU);
      ctx.fill();
      ctx.restore();
      // Body
      ctx.fillStyle = c4;
      ctx.beginPath();
      ctx.roundRect(-3.5, -18, 7, 36, 3.5);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'bee-fly': {
      const bx = C + Math.cos(angle) * 14;
      const by = C + Math.sin(angle * 2) * 8;
      ctx.save();
      ctx.translate(bx, by);
      // Wings
      const wingY = -14 + Math.sin(angle * 4) * 3;
      ctx.fillStyle = c3;
      ctx.beginPath();
      ctx.ellipse(-6, wingY, 10, 14, -0.3, 0, TAU);
      ctx.ellipse(8, wingY, 10, 14, 0.3, 0, TAU);
      ctx.fill();
      // Body
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.ellipse(0, 2, 22, 15, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.fillRect(-10, -12, 6, 28);
      ctx.fillRect(3, -12, 6, 28);
      // Cute eye
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-13, -2, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-14, -2, 1.5, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'mushroom-hop': {
      const hop = Math.abs(wave) * 14;
      ctx.save();
      ctx.translate(C, 80 - hop);
      // Stem
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.roundRect(-14, -4, 28, 32, 10);
      ctx.fill();
      // Cap
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.arc(0, -4, 34, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      // Spots
      ctx.fillStyle = '#fff8eb';
      ctx.beginPath();
      ctx.arc(-14, -18, 5.5, 0, TAU);
      ctx.arc(10, -22, 6.5, 0, TAU);
      ctx.arc(20, -10, 4, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'cactus-bloom': {
      // Pot
      ctx.fillStyle = c3;
      ctx.beginPath();
      ctx.moveTo(46, 86);
      ctx.lineTo(94, 86);
      ctx.lineTo(86, 118);
      ctx.lineTo(54, 118);
      ctx.closePath();
      ctx.fill();
      // Cactus body
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.roundRect(54, 42, 32, 46, 16);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(36, 54, 16, 22, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(88, 50, 16, 22, 8);
      ctx.fill();
      // Blooming flower on top
      ctx.save();
      ctx.translate(70, 38);
      ctx.scale(0.75 + 0.25 * pulse, 0.75 + 0.25 * pulse);
      for (let i = 0; i < 6; i++) {
        drawFlowerPetal(ctx, (i / 6) * TAU + angle * 0.3, 8, 7, 4.5, c4);
      }
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'bear-wave': {
      ctx.save();
      ctx.translate(C, C + 6);
      // Ears
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.arc(-22, -26, 11, 0, TAU);
      ctx.arc(22, -26, 11, 0, TAU);
      ctx.fill();
      // Waving arm
      ctx.save();
      ctx.translate(26, 8);
      ctx.rotate(-0.6 + wave * 0.5);
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.roundRect(-6, -22, 12, 24, 6);
      ctx.fill();
      ctx.restore();
      // Head/body
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.arc(0, -6, 28, 0, TAU);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.ellipse(0, 2, 13, 10, 0, 0, TAU);
      ctx.fill();
      // Eyes + nose
      ctx.fillStyle = '#1e0e06';
      ctx.beginPath();
      ctx.arc(-10, -10, 3, 0, TAU);
      ctx.arc(10, -10, 3, 0, TAU);
      ctx.arc(0, -1, 3.5, 0, TAU);
      ctx.fill();
      drawHeart(ctx, 0, 24, 14 + pulse * 3, c3);
      ctx.restore();
      break;
    }

    case 'bunny-ears': {
      ctx.save();
      ctx.translate(C, C + 12);
      // Left & right floppy ears
      [-12, 12].forEach((ex, idx) => {
        ctx.save();
        ctx.translate(ex, -24);
        ctx.rotate((idx === 0 ? -0.25 : 0.25) + wave * (idx === 0 ? 0.18 : -0.18));
        ctx.fillStyle = c1;
        ctx.beginPath();
        ctx.ellipse(0, -18, 8, 22, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = c2;
        ctx.beginPath();
        ctx.ellipse(0, -17, 4, 15, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      });
      // Head
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, TAU);
      ctx.fill();
      ctx.fillStyle = c3;
      ctx.beginPath();
      ctx.arc(-9, -4, 2.8, 0, TAU);
      ctx.arc(9, -4, 2.8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(0, 3, 3.5, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'kitty-yarn': {
      // Kitty head + bouncing yarn
      ctx.save();
      ctx.translate(54, 62 + wave * 3);
      ctx.fillStyle = c1;
      // Ears
      ctx.beginPath();
      ctx.moveTo(-22, -10);
      ctx.lineTo(-18, -32);
      ctx.lineTo(-4, -18);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(22, -10);
      ctx.lineTo(18, -32);
      ctx.lineTo(4, -18);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-8, -3, 3, 0, TAU);
      ctx.arc(8, -3, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-8, -3, 1.5, 0, TAU);
      ctx.arc(8, -3, 1.5, 0, TAU);
      ctx.fill();
      ctx.restore();

      drawYarnBall(ctx, 96, 92 - Math.abs(wave) * 14, 17, c3, c2, angle);
      break;
    }

    case 'octopus-bob': {
      const bob = wave * 6;
      ctx.save();
      ctx.translate(C, 60 + bob);
      // Tentacles
      for (let i = -2; i <= 2; i++) {
        ctx.fillStyle = i % 2 === 0 ? c1 : c2;
        ctx.beginPath();
        ctx.arc(i * 11, 24 + Math.sin(angle + i) * 5, 7, 0, TAU);
        ctx.fill();
      }
      // Dome
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-9, -2, 4, 0, TAU);
      ctx.arc(9, -2, 4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a0d06';
      ctx.beginPath();
      ctx.arc(-9, -2, 2, 0, TAU);
      ctx.arc(9, -2, 2, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'whale-hearts': {
      const bob = wave * 4;
      // Floating hearts spout
      drawHeart(ctx, C - 10, 34 - pulse * 10, 12, c3);
      drawHeart(ctx, C + 10, 28 - (1 - pulse) * 10, 10, c3);

      ctx.save();
      ctx.translate(C, 78 + bob);
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 32, 22, 0, 0, TAU);
      ctx.fill();
      // Tail fin
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(44, -14);
      ctx.lineTo(40, 2);
      ctx.lineTo(46, 14);
      ctx.closePath();
      ctx.fill();
      // Belly
      ctx.fillStyle = c4;
      ctx.beginPath();
      ctx.ellipse(-4, 10, 22, 9, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(-16, -2, 2.6, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'chick-hop': {
      const hop = Math.abs(wave) * 15;
      ctx.save();
      ctx.translate(C, 78 - hop);
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, TAU);
      ctx.fill();
      // Wings
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.ellipse(-25, 2, 7, 11, 0.3 + wave * 0.4, 0, TAU);
      ctx.ellipse(25, 2, 7, 11, -0.3 - wave * 0.4, 0, TAU);
      ctx.fill();
      // Beak
      ctx.fillStyle = c3;
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = c4;
      ctx.beginPath();
      ctx.arc(-9, -6, 2.6, 0, TAU);
      ctx.arc(9, -6, 2.6, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }

    case 'heart-beat': {
      const sc = 0.88 + 0.22 * Math.pow(Math.abs(Math.sin(angle)), 2);
      ctx.save();
      ctx.translate(C, C + 4);
      ctx.scale(sc, sc);
      drawHeart(ctx, 0, 0, 62, c2, c1);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(-12, -10, 12, Math.PI, Math.PI * 1.7);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      drawSparkle(ctx, 32, 34, 4 + pulse * 3, c4);
      drawSparkle(ctx, 108, 38, 4 + (1 - pulse) * 3, c4);
      break;
    }

    case 'star-smile': {
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(wave * 0.16);
      ctx.fillStyle = c2;
      ctx.strokeStyle = c1;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 44 : 20;
        const a = (i / 10) * TAU - Math.PI / 2;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = c4;
      ctx.beginPath();
      ctx.arc(-8, -4, 2.8, 0, TAU);
      ctx.arc(8, -4, 2.8, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 3, 6, 0.2, Math.PI - 0.2);
      ctx.strokeStyle = c4;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'cloud-rainbow': {
      const rainY = (phase * 34) % 34;
      // Rainbow arc
      [c3, c4, c2].forEach((rc, idx) => {
        ctx.strokeStyle = rc;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(C, 68, 42 - idx * 6, Math.PI, 0);
        ctx.stroke();
      });
      // Falling hearts
      drawHeart(ctx, 48, 84 + rainY * 0.6, 9, c3);
      drawHeart(ctx, 70, 92 + ((rainY + 14) % 30) * 0.6, 9, c4);
      drawHeart(ctx, 92, 84 + ((rainY + 24) % 30) * 0.6, 9, c2);
      // Cloud
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.arc(50, 68, 16, 0, TAU);
      ctx.arc(70, 60, 20, 0, TAU);
      ctx.arc(90, 68, 15, 0, TAU);
      ctx.fill();
      break;
    }

    case 'mug-steam': {
      // Steam curls
      for (let i = -1; i <= 1; i++) {
        ctx.strokeStyle = c4;
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const sx = C + i * 14;
        const sy = 44 - pulse * 8;
        ctx.moveTo(sx, sy + 14);
        ctx.quadraticCurveTo(sx + wave * 6, sy + 5, sx - wave * 5, sy - 6);
        ctx.stroke();
      }
      // Mug
      ctx.strokeStyle = c1;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(98, 82, 11, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.roundRect(42, 62, 54, 46, 10);
      ctx.fill();
      // Knitted mug cozy
      ctx.fillStyle = c3;
      ctx.fillRect(42, 74, 54, 20);
      drawHeart(ctx, 69, 84, 13, c4);
      break;
    }

    case 'stamp-done': {
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(-0.12 + wave * 0.08);
      ctx.scale(0.92 + 0.08 * pulse, 0.92 + 0.08 * pulse);
      // Scalloped seal
      ctx.fillStyle = c1;
      ctx.beginPath();
      for (let i = 0; i < 24; i++) {
        const r = i % 2 === 0 ? 46 : 40;
        const a = (i / 24) * TAU;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c3;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, TAU);
      ctx.stroke();
      // Checkmark
      ctx.strokeStyle = c4;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-14, 2);
      ctx.lineTo(-3, 14);
      ctx.lineTo(17, -12);
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'progress-loop': {
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(angle);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ctx.fillStyle = i % 2 === 0 ? c1 : c2;
        ctx.globalAlpha = 0.25 + ((i / 8 + phase) % 1) * 0.75;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 34, Math.sin(a) * 34, 7, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawYarnBall(ctx, 0, 0, 18, c3, c4, -angle);
      ctx.restore();
      break;
    }

    case 'idea-bulb': {
      // Glowing rays
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        const r1 = 30;
        const r2 = 38 + pulse * 8;
        ctx.strokeStyle = c2;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(C + Math.cos(a) * r1, 58 + Math.sin(a) * r1);
        ctx.lineTo(C + Math.cos(a) * r2, 58 + Math.sin(a) * r2);
        ctx.stroke();
      }
      ctx.fillStyle = c2;
      ctx.beginPath();
      ctx.arc(C, 58, 22, 0, TAU);
      ctx.fill();
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.roundRect(58, 76, 24, 16, 5);
      ctx.fill();
      ctx.fillStyle = c3;
      ctx.fillRect(60, 92, 20, 8);
      break;
    }

    case 'handmade-ribbon': {
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(wave * 0.06);
      ctx.fillStyle = c1;
      ctx.beginPath();
      ctx.moveTo(-48, -16);
      ctx.lineTo(48, -16);
      ctx.lineTo(40, 0);
      ctx.lineTo(48, 16);
      ctx.lineTo(-48, 16);
      ctx.lineTo(-40, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = c3;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawHeart(ctx, 0, 2, 18 + pulse * 3, c3);
      ctx.restore();
      break;
    }

    case 'gold-sparkles': {
      const pts = [
        [44, 48, 11, 0],
        [92, 42, 8, 0.3],
        [70, 74, 14, 0.6],
        [40, 96, 7, 0.8],
        [98, 92, 10, 0.15],
      ] as Array<[number, number, number, number]>;
      pts.forEach(([x, y, maxR, off]) => {
        const p = 0.3 + 0.7 * Math.abs(Math.sin((phase + off) * Math.PI));
        drawSparkle(ctx, x, y, maxR * p, off > 0.4 ? c2 : c3);
      });
      break;
    }

    case 'bounce-arrow': {
      const dx = wave * 12;
      ctx.save();
      ctx.translate(C + dx, C);
      ctx.fillStyle = c1;
      ctx.strokeStyle = c2;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-36, -12);
      ctx.lineTo(4, -12);
      ctx.lineTo(4, -26);
      ctx.lineTo(38, 0);
      ctx.lineTo(4, 26);
      ctx.lineTo(4, 12);
      ctx.lineTo(-36, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      break;
    }

    case 'floating-hearts': {
      const items = [
        { x: 42, off: 0, s: 18, c: c1 },
        { x: 72, off: 0.33, s: 22, c: c2 },
        { x: 100, off: 0.66, s: 16, c: c3 },
      ];
      items.forEach((h) => {
        const t = (phase + h.off) % 1;
        const y = 112 - t * 84;
        const x = h.x + Math.sin(t * TAU) * 8;
        ctx.save();
        ctx.globalAlpha = Math.sin(t * Math.PI);
        drawHeart(ctx, x, y, h.s, h.c);
        ctx.restore();
      });
      break;
    }

    case 'bunting-flags': {
      ctx.strokeStyle = '#5c3016';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(12, 42);
      ctx.quadraticCurveTo(C, 60, 128, 42);
      ctx.stroke();
      const cols = [c1, c2, c3, c4];
      for (let i = 0; i < 4; i++) {
        const fx = 28 + i * 28;
        const fy = 47 + (i === 1 || i === 2 ? 4 : 0);
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(Math.sin(angle + i * 0.9) * 0.18);
        ctx.fillStyle = cols[i];
        ctx.beginPath();
        ctx.moveTo(-11, 0);
        ctx.lineTo(11, 0);
        ctx.lineTo(0, 28);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    case 'queen-crown': {
      ctx.save();
      ctx.translate(C, C + wave * 4);
      ctx.fillStyle = c2;
      ctx.strokeStyle = c1;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(28 - C, 24);
      ctx.lineTo(36 - C, -18);
      ctx.lineTo(54 - C, 4);
      ctx.lineTo(0, -28);
      ctx.lineTo(86 - C, 4);
      ctx.lineTo(104 - C, -18);
      ctx.lineTo(112 - C, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      [
        [-34, -22, c3],
        [0, -32, c4],
        [34, -22, c3],
      ].forEach(([jx, jy, jc]) => {
        ctx.beginPath();
        ctx.arc(jx as number, jy as number, 5 + pulse * 1.5, 0, TAU);
        ctx.fillStyle = jc as string;
        ctx.fill();
      });
      ctx.restore();
      break;
    }

    case 'floral-seal':
    default: {
      ctx.save();
      ctx.translate(C, C);
      ctx.rotate(angle * 0.5);
      for (let i = 0; i < 10; i++) {
        drawFlowerPetal(ctx, (i / 10) * TAU, 32, 13, 8, i % 2 === 0 ? c1 : c2, c3);
      }
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, TAU);
      ctx.fillStyle = c3;
      ctx.fill();
      drawHeart(ctx, 0, 3, 18 + pulse * 3, c1);
      ctx.restore();
      break;
    }
  }

  ctx.restore();
}
